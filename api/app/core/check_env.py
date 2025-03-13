import logging
from .config import settings

logger = logging.getLogger(__name__)

def check_api_keys():
    """環境変数が正しく読み込まれているか確認する"""
    # Brave Search APIキーの確認
    if settings.BRAVE_SEARCH_API_KEY:
        logger.info("Brave Search APIキーが設定されています")
    else:
        logger.warning("Brave Search APIキーが設定されていません")
    
    # GitHub APIトークンの確認
    if settings.GITHUB_API_TOKEN:
        logger.info("GitHub APIトークンが設定されています")
    else:
        logger.warning("GitHub APIトークンが設定されていません")
