import os
import logging
import torch
from typing import Dict, List, Optional, Union, Any, Tuple, Generator
from transformers import (
    AutoTokenizer, 
    AutoModelForCausalLM,
    BitsAndBytesConfig,
    TextIteratorStreamer,
)
from threading import Thread

from ..core.config import settings

logger = logging.getLogger(__name__)

class GemmaModel:
    """
    Gemma 3 12B モデルのラッパークラス
    """
    _instance = None
    
    def __new__(cls):
        """
        シングルトンパターンを使用してモデルのインスタンスを管理
        """
        if cls._instance is None:
            cls._instance = super(GemmaModel, cls).__new__(cls)
            cls._instance._initialized = False
        return cls._instance
        
    def __init__(self):
        """
        モデルを初期化する
        """
        if self._initialized:
            return
            
        self._initialized = True
        self.model = None
        self.tokenizer = None
        self._load_model()
        
    def _load_model(self):
        """
        モデルとトークナイザーを読み込む
        """
        logger.info(f"モデル {settings.MODEL_ID} を読み込んでいます...")
        
        # HuggingFace の認証トークンを設定
        os.environ["HF_TOKEN"] = settings.HF_TOKEN or ""
        
        # 量子化設定
        quantization_config = None
        if settings.USE_4BIT_QUANTIZATION:
            logger.info("4bit量子化を使用します")
            quantization_config = BitsAndBytesConfig(
                load_in_4bit=True,
                bnb_4bit_compute_dtype=torch.float16,
                bnb_4bit_quant_type="nf4",
                bnb_4bit_use_double_quant=True,
            )
        elif settings.USE_8BIT_QUANTIZATION:
            logger.info("8bit量子化を使用します")
            quantization_config = BitsAndBytesConfig(
                load_in_8bit=True,
            )
            
        # モデルの読み込み
        try:
            self.model = AutoModelForCausalLM.from_pretrained(
                settings.MODEL_ID,
                device_map="auto",
                torch_dtype=torch.float16,
                cache_dir=settings.MODEL_CACHE_DIR,
                quantization_config=quantization_config,
                token=settings.HF_TOKEN or True,
                attn_implementation="flash_attention_2" if settings.USE_FLASH_ATTENTION else "eager",
            )
            
            self.tokenizer = AutoTokenizer.from_pretrained(
                settings.MODEL_ID,
                cache_dir=settings.MODEL_CACHE_DIR,
                token=settings.HF_TOKEN or True,
            )
            
            logger.info("モデルの読み込みが完了しました")
        except Exception as e:
            logger.error(f"モデルの読み込み中にエラーが発生しました: {str(e)}")
            raise
            
    def generate_text(
        self,
        prompt: str,
        max_tokens: int = None,
        temperature: float = None,
        top_p: float = None,
        top_k: int = None,
        stream: bool = False,
    ) -> Union[str, Generator[str, None, None]]:
        """
        テキストを生成する
        
        Args:
            prompt: 入力プロンプト
            max_tokens: 生成する最大トークン数
            temperature: 温度パラメータ
            top_p: top-p サンプリングのパラメータ
            top_k: top-k サンプリングのパラメータ
            stream: ストリーミング生成を行うかどうか
            
        Returns:
            生成されたテキスト、またはストリーミングの場合はジェネレータ
        """
        if not self.model or not self.tokenizer:
            raise RuntimeError("モデルが初期化されていません")
            
        # デフォルト値の設定
        max_tokens = max_tokens if max_tokens is not None else settings.MAX_NEW_TOKENS
        temperature = temperature if temperature is not None else settings.DEFAULT_TEMPERATURE
        top_p = top_p if top_p is not None else settings.DEFAULT_TOP_P
        top_k = top_k if top_k is not None else settings.DEFAULT_TOP_K
        
        # 入力をトークン化
        inputs = self.tokenizer(prompt, return_tensors="pt").to(self.model.device)
        
        # ストリーミング生成
        if stream:
            streamer = TextIteratorStreamer(self.tokenizer, skip_prompt=True, skip_special_tokens=True)
            generation_kwargs = {
                "input_ids": inputs["input_ids"],
                "attention_mask": inputs["attention_mask"],
                "max_new_tokens": max_tokens,
                "temperature": temperature,
                "top_p": top_p,
                "top_k": top_k,
                "streamer": streamer,
                "do_sample": temperature > 0,
            }
            
            # 別スレッドで生成を開始
            thread = Thread(target=self.model.generate, kwargs=generation_kwargs)
            thread.start()
            
            # ストリームからテキストを生成
            for text in streamer:
                yield text
        else:
            # 通常の生成
            with torch.no_grad():
                outputs = self.model.generate(
                    **inputs,
                    max_new_tokens=max_tokens,
                    temperature=temperature,
                    top_p=top_p,
                    top_k=top_k,
                    do_sample=temperature > 0,
                )
                
            # 生成されたテキストからプロンプト部分を除去
            generated_text = self.tokenizer.decode(outputs[0], skip_special_tokens=True)
            prompt_text = self.tokenizer.decode(inputs["input_ids"][0], skip_special_tokens=True)
            
            # プロンプト部分を削除して返す
            return generated_text[len(prompt_text):]
            
    def get_embeddings(self, text: str) -> List[float]:
        """
        テキストの埋め込みベクトルを取得する
        
        Args:
            text: 入力テキスト
            
        Returns:
            埋め込みベクトル
        """
        if not self.model or not self.tokenizer:
            raise RuntimeError("モデルが初期化されていません")
            
        # 入力をトークン化
        inputs = self.tokenizer(text, return_tensors="pt").to(self.model.device)
        
        # 埋め込みを計算
        with torch.no_grad():
            outputs = self.model(**inputs, output_hidden_states=True)
            
        # 最後の隠れ層の最初のトークンのベクトルを取得（[CLS]トークンに相当）
        embeddings = outputs.hidden_states[-1][0, 0, :].cpu().numpy().tolist()
        
        return embeddings
        
    def get_model_info(self) -> Dict[str, Any]:
        """
        モデルの情報を返す
        
        Returns:
            モデル情報の辞書
        """
        if not self.model or not self.tokenizer:
            return {
                "status": "not_loaded",
                "model_id": settings.MODEL_ID,
            }
            
        return {
            "status": "loaded",
            "model_id": settings.MODEL_ID,
            "model_type": self.model.__class__.__name__,
            "tokenizer_type": self.tokenizer.__class__.__name__,
            "device": str(self.model.device),
            "parameters": {
                "quantization": "4bit" if settings.USE_4BIT_QUANTIZATION else "8bit" if settings.USE_8BIT_QUANTIZATION else "none",
                "flash_attention": settings.USE_FLASH_ATTENTION,
            }
        }
        
# シングルトンインスタンスを取得する関数
def get_gemma_model() -> GemmaModel:
    return GemmaModel()
