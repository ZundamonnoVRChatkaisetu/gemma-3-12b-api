import os
from typing import List, Optional, Union, Dict, Any
from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    # プロジェクト設定
    PROJECT_NAME: str = "Gemma 3 12B API"
    API_VERSION: str = "v1"
    DEBUG: bool = True
    
    # API認証
    API_AUTH_REQUIRED: bool = False
    API_KEY: Optional[str] = None
    
    # CORSの設定
    CORS_ORIGINS: List[str] = ["*"]
    
    # モデル設定
    MODEL_ID: str = "google/gemma-3-12b-it"
    MODEL_CACHE_DIR: str = "./models"
    USE_4BIT_QUANTIZATION: bool = True
    USE_8BIT_QUANTIZATION: bool = False
    USE_FLASH_ATTENTION: bool = True
    
    # HuggingFace認証
    HF_TOKEN: Optional[str] = None
    
    # 推論設定
    MAX_NEW_TOKENS: int = 2048
    DEFAULT_TEMPERATURE: float = 0.7
    DEFAULT_TOP_P: float = 0.9
    DEFAULT_TOP_K: int = 50
    DEVICE: str = "cuda"  # "cuda" または "cpu"
    
    # レート制限
    RATE_LIMIT_ENABLED: bool = True
    RATE_LIMIT_REQUESTS: int = 50
    RATE_LIMIT_WINDOW_SECONDS: int = 3600  # 1時間
    
    # サーバー設定
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
    )

settings = Settings()

# 環境変数から設定を読み込むための関数
def get_settings() -> Settings:
    return settings
