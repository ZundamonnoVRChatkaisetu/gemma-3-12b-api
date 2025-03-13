import logging
from typing import Union, Any, Dict

from ..core.config import settings
from .gemma_model import get_gemma_model
from .ollama_model import get_ollama_model

logger = logging.getLogger(__name__)

def get_model():
    """
    設定に基づいて適切なモデルインスタンスを返す
    
    Returns:
        Hugging Face GemmaModel または Ollama Model のインスタンス
    """
    if settings.USE_OLLAMA:
        logger.info(f"Ollamaモデルを使用します: {settings.OLLAMA_MODEL_NAME}")
        return get_ollama_model()
    else:
        logger.info(f"Hugging Faceモデルを使用します: {settings.HF_MODEL_ID}")
        return get_gemma_model()

# モデルのトークナイザーのモックアップ（Ollamaモデルには直接トークナイザーアクセスがないため）
class DummyTokenizer:
    """
    Ollamaモデル用のダミートークナイザークラス
    """
    def encode(self, text):
        """
        簡易的なトークン数推定（英語を想定）
        """
        if not text:
            return []
        # 非常に簡易的なトークン化（実際のトークナイザーとは異なります）
        return text.split()

def get_tokenizer():
    """
    使用中のモデルに適したトークナイザーを返す
    
    Returns:
        トークナイザーオブジェクト
    """
    if settings.USE_OLLAMA:
        return DummyTokenizer()
    else:
        model = get_gemma_model()
        return model.tokenizer
