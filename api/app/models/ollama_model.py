import os
import logging
import requests
import json
from typing import Dict, List, Optional, Union, Any, Tuple, Generator

from ..core.config import settings

logger = logging.getLogger(__name__)

class OllamaModel:
    """
    Ollamaモデルのラッパークラス
    """
    _instance = None
    
    def __new__(cls):
        """
        シングルトンパターンを使用してモデルのインスタンスを管理
        """
        if cls._instance is None:
            cls._instance = super(OllamaModel, cls).__new__(cls)
            cls._instance._initialized = False
        return cls._instance
        
    def __init__(self):
        """
        モデルを初期化する
        """
        if self._initialized:
            return
            
        self._initialized = True
        self.base_url = settings.OLLAMA_BASE_URL
        self.model_name = settings.OLLAMA_MODEL_NAME
        
        # Ollamaに接続できるか確認
        self._check_connection()
        
    def _check_connection(self):
        """
        Ollamaに接続できるか確認する
        """
        try:
            response = requests.get(f"{self.base_url}/api/tags")
            if response.status_code == 200:
                models = response.json().get("models", [])
                model_names = [model.get("name") for model in models]
                
                if self.model_name in model_names:
                    logger.info(f"Ollamaに接続し、モデル '{self.model_name}' を確認しました")
                else:
                    logger.warning(f"モデル '{self.model_name}' がOllamaに見つかりません。利用可能なモデル: {model_names}")
            else:
                logger.warning(f"Ollamaサーバーからのレスポンスが異常です: {response.status_code}")
        except Exception as e:
            logger.error(f"Ollamaへの接続中にエラーが発生しました: {str(e)}")
            logger.error(f"Ollamaサーバーが実行中であることを確認してください: {self.base_url}")
            
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
        # デフォルト値の設定
        max_tokens = max_tokens if max_tokens is not None else settings.MAX_NEW_TOKENS
        temperature = temperature if temperature is not None else settings.DEFAULT_TEMPERATURE
        top_p = top_p if top_p is not None else settings.DEFAULT_TOP_P
        top_k = top_k if top_k is not None else settings.DEFAULT_TOP_K
        
        # リクエストパラメータ
        params = {
            "model": self.model_name,
            "prompt": prompt,
            "stream": stream,
            "options": {
                "num_predict": max_tokens,
                "temperature": temperature,
                "top_p": top_p,
                "top_k": top_k,
            }
        }
        
        # リクエストを送信
        url = f"{self.base_url}/api/generate"
        
        if stream:
            return self._stream_response(url, params)
        else:
            try:
                response = requests.post(url, json=params)
                if response.status_code == 200:
                    return response.json().get("response", "")
                else:
                    logger.error(f"テキスト生成リクエストが失敗しました: {response.status_code}, {response.text}")
                    raise RuntimeError(f"テキスト生成リクエストが失敗しました: {response.status_code}")
            except Exception as e:
                logger.error(f"テキスト生成中にエラーが発生しました: {str(e)}")
                raise
    
    def _stream_response(self, url: str, params: Dict[str, Any]) -> Generator[str, None, None]:
        """
        ストリーミングレスポンスを処理する
        
        Args:
            url: リクエストURL
            params: リクエストパラメータ
            
        Returns:
            テキストチャンクのジェネレータ
        """
        try:
            with requests.post(url, json=params, stream=True) as response:
                if response.status_code != 200:
                    logger.error(f"ストリーミングリクエストが失敗しました: {response.status_code}, {response.text}")
                    raise RuntimeError(f"ストリーミングリクエストが失敗しました: {response.status_code}")
                
                for line in response.iter_lines():
                    if line:
                        try:
                            data = json.loads(line)
                            if "response" in data:
                                yield data["response"]
                        except json.JSONDecodeError:
                            logger.warning(f"JSON解析エラー: {line}")
        except Exception as e:
            logger.error(f"ストリーミング中にエラーが発生しました: {str(e)}")
            raise
            
    def get_embeddings(self, text: str) -> List[float]:
        """
        テキストの埋め込みベクトルを取得する
        
        Args:
            text: 入力テキスト
            
        Returns:
            埋め込みベクトル
        """
        url = f"{self.base_url}/api/embeddings"
        params = {
            "model": self.model_name,
            "prompt": text
        }
        
        try:
            response = requests.post(url, json=params)
            if response.status_code == 200:
                return response.json().get("embedding", [])
            else:
                logger.error(f"埋め込み生成リクエストが失敗しました: {response.status_code}, {response.text}")
                raise RuntimeError(f"埋め込み生成リクエストが失敗しました: {response.status_code}")
        except Exception as e:
            logger.error(f"埋め込み生成中にエラーが発生しました: {str(e)}")
            raise
            
    def get_model_info(self) -> Dict[str, Any]:
        """
        モデルの情報を返す
        
        Returns:
            モデル情報の辞書
        """
        try:
            response = requests.get(f"{self.base_url}/api/tags")
            if response.status_code == 200:
                models = response.json().get("models", [])
                for model in models:
                    if model.get("name") == self.model_name:
                        return {
                            "status": "loaded",
                            "model_id": self.model_name,
                            "model_type": "Ollama",
                            "tokenizer_type": "Ollama",
                            "device": "Unknown",  # Ollamaは内部デバイス情報を公開していない
                            "parameters": {
                                "size": model.get("size", "Unknown"),
                                "modified_at": model.get("modified_at", "Unknown"),
                            }
                        }
                
                return {
                    "status": "not_loaded",
                    "model_id": self.model_name,
                    "model_type": "Ollama",
                }
            else:
                return {
                    "status": "error",
                    "model_id": self.model_name,
                    "error": f"Ollamaサーバーからのレスポンスが異常です: {response.status_code}"
                }
        except Exception as e:
            return {
                "status": "error",
                "model_id": self.model_name,
                "error": f"Ollamaへの接続中にエラーが発生しました: {str(e)}"
            }

# シングルトンインスタンスを取得する関数
def get_ollama_model() -> OllamaModel:
    return OllamaModel()
