import requests
import logging
from typing import Dict, List, Any, Optional
from ..core.config import settings

logger = logging.getLogger(__name__)

class BraveSearchClient:
    """
    Brave Search APIクライアント
    """
    def __init__(self, api_key: Optional[str] = None, api_url: Optional[str] = None):
        """
        BraveSearchClientを初期化する
        
        Args:
            api_key: Brave Search APIキー（Noneの場合は設定ファイルから取得）
            api_url: Brave Search API URL（Noneの場合は設定ファイルから取得）
        """
        self.api_key = api_key or settings.BRAVE_SEARCH_API_KEY
        self.api_url = api_url or settings.BRAVE_SEARCH_API_URL
        
        if not self.api_key:
            logger.warning("Brave Search APIキーが設定されていません。環境変数 BRAVE_SEARCH_API_KEY を設定してください。")
    
    def search(self, query: str, count: int = 5) -> Dict[str, Any]:
        """
        Webで検索を実行する
        
        Args:
            query: 検索クエリ
            count: 取得する結果の数
            
        Returns:
            Dict[str, Any]: 検索結果
        """
        if not self.api_key:
            return {
                "success": False,
                "message": "Brave Search APIキーが設定されていません。",
                "results": []
            }
        
        try:
            headers = {
                "Accept": "application/json",
                "X-Subscription-Token": self.api_key
            }
            
            # search_langパラメータを削除し、基本的なパラメータだけを使用
            params = {
                "q": query,
                "count": count
            }
            
            # デバッグ用にリクエスト情報をログに出力
            logger.debug(f"Brave Search APIリクエスト - URL: {self.api_url}, パラメータ: {params}")
            
            response = requests.get(
                self.api_url,
                headers=headers,
                params=params
            )
            
            if response.status_code == 200:
                data = response.json()
                
                # 検索結果を整形
                results = []
                for web in data.get("web", {}).get("results", []):
                    results.append({
                        "title": web.get("title", ""),
                        "url": web.get("url", ""),
                        "description": web.get("description", "")
                    })
                
                logger.info(f"検索成功: '{query}', 結果数: {len(results)}")
                return {
                    "success": True,
                    "query": query,
                    "results": results
                }
            else:
                logger.error(f"Brave Search APIエラー: {response.status_code} - {response.text}")
                return {
                    "success": False,
                    "message": f"Brave Search APIエラー: {response.status_code}",
                    "results": []
                }
                
        except Exception as e:
            logger.error(f"検索中にエラーが発生しました: {str(e)}")
            return {
                "success": False,
                "message": f"検索中にエラーが発生しました: {str(e)}",
                "results": []
            }
    
    def format_results(self, results: Dict[str, Any]) -> str:
        """
        検索結果を読みやすいテキスト形式に整形する
        
        Args:
            results: search()メソッドから返された結果
            
        Returns:
            str: 整形された検索結果
        """
        if not results.get("success", False):
            return f"検索エラー: {results.get('message', '不明なエラー')}"
        
        if not results.get("results", []):
            return f"「{results.get('query', '')}」に関する検索結果はありませんでした。"
        
        formatted = f"## 「{results.get('query', '')}」の検索結果\n\n"
        
        for i, result in enumerate(results.get("results", []), 1):
            formatted += f"### {i}. {result.get('title', '無題')}\n"
            formatted += f"URL: {result.get('url', '')}\n"
            formatted += f"{result.get('description', '')}\n\n"
        
        return formatted

# シングルトンインスタンスを取得する関数
def get_brave_search_client() -> BraveSearchClient:
    """
    BraveSearchClientのインスタンスを取得する
    """
    return BraveSearchClient()
