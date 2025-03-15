import os
from typing import List, Optional, Union, Dict, Any
from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict
from datetime import datetime

class Settings(BaseSettings):
    # プロジェクト設定
    PROJECT_NAME: str = "Gemma 3 API"
    API_VERSION: str = "v1"
    DEBUG: bool = True
    
    # API認証
    API_AUTH_REQUIRED: bool = False
    API_KEY: Optional[str] = None
    
    # CORSの設定
    CORS_ORIGINS: List[str] = ["*"]
    
    # モデル選択
    USE_OLLAMA: bool = True
    
    # Hugging Face モデル設定 (USE_OLLAMA=Falseの場合に使用)
    HF_MODEL_ID: str = "google/gemma-3-12b-it"
    HF_MODEL_CACHE_DIR: str = "./models"
    HF_USE_4BIT_QUANTIZATION: bool = True
    HF_USE_8BIT_QUANTIZATION: bool = False
    HF_USE_FLASH_ATTENTION: bool = True
    HF_TOKEN: Optional[str] = None
    
    # Ollama設定 (USE_OLLAMA=Trueの場合に使用)
    OLLAMA_BASE_URL: str = "http://localhost:11434"
    OLLAMA_MODEL_NAME: str = "gemma3:12b"
    
    # 現在の日付 (推論などに使用)
    CURRENT_DATE: str = datetime.now().strftime("%Y年%m月%d日")
    
    # 推論設定
    MAX_NEW_TOKENS: int = 2048
    DEFAULT_TEMPERATURE: float = 0.3  # 0.7から0.3に変更（より決定論的な応答を生成）
    DEFAULT_TOP_P: float = 0.95       # 0.9から0.95に変更（より高品質なトークン選択）
    DEFAULT_TOP_K: int = 40           # 50から40に変更（より高品質な次トークン候補を選択）
    DEVICE: str = "cuda"  # "cuda" または "cpu"
    
    # レート制限
    RATE_LIMIT_ENABLED: bool = True
    RATE_LIMIT_REQUESTS: int = 50
    RATE_LIMIT_WINDOW_SECONDS: int = 3600  # 1時間
    
    # サーバー設定
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    
    # Brave Search API設定
    BRAVE_SEARCH_API_KEY: Optional[str] = None
    BRAVE_SEARCH_API_URL: str = "https://api.search.brave.com/res/v1/web/search"
    
    # GitHub API設定
    GITHUB_API_TOKEN: Optional[str] = None
    GITHUB_API_URL: str = "https://api.github.com"
    
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
    )

settings = Settings()

# 環境変数から設定を読み込むための関数
def get_settings() -> Settings:
    return settings
