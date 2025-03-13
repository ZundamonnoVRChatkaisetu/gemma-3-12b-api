import requests
import logging
import json
import base64
from typing import Dict, List, Any, Optional, Union
from ..core.config import settings

logger = logging.getLogger(__name__)

class GitHubClient:
    """
    GitHub APIクライアント
    """
    def __init__(self, api_token: Optional[str] = None, api_url: Optional[str] = None):
        """
        GitHubClientを初期化する
        
        Args:
            api_token: GitHub APIトークン（Noneの場合は設定ファイルから取得）
            api_url: GitHub API URL（Noneの場合は設定ファイルから取得）
        """
        self.api_token = api_token or settings.GITHUB_API_TOKEN
        self.api_url = api_url or settings.GITHUB_API_URL
        
        if not self.api_token:
            logger.warning("GitHub APIトークンが設定されていません。環境変数 GITHUB_API_TOKEN を設定してください。")
    
    def _make_request(self, method: str, endpoint: str, data: Any = None, params: Dict[str, Any] = None) -> Dict[str, Any]:
        """
        GitHub APIにリクエストを送信する
        
        Args:
            method: HTTPメソッド（GET, POST, PUT, DELETE）
            endpoint: APIエンドポイント
            data: リクエストボディ
            params: クエリパラメータ
            
        Returns:
            Dict[str, Any]: APIレスポンス
        """
        if not self.api_token:
            return {
                "success": False,
                "message": "GitHub APIトークンが設定されていません。",
                "data": None
            }
        
        try:
            headers = {
                "Accept": "application/vnd.github.v3+json",
                "Authorization": f"token {self.api_token}"
            }
            
            url = f"{self.api_url}{endpoint}"
            
            if method == "GET":
                response = requests.get(url, headers=headers, params=params)
            elif method == "POST":
                response = requests.post(url, headers=headers, json=data)
            elif method == "PUT":
                response = requests.put(url, headers=headers, json=data)
            elif method == "DELETE":
                response = requests.delete(url, headers=headers)
            else:
                return {
                    "success": False,
                    "message": f"不明なHTTPメソッド: {method}",
                    "data": None
                }
            
            # レスポンスを処理
            if response.status_code in [200, 201, 204]:
                if response.status_code == 204 or not response.text.strip():
                    return {
                        "success": True,
                        "message": "操作が成功しました",
                        "data": None
                    }
                else:
                    return {
                        "success": True,
                        "message": "操作が成功しました",
                        "data": response.json()
                    }
            else:
                logger.error(f"GitHub APIエラー: {response.status_code} - {response.text}")
                return {
                    "success": False,
                    "message": f"GitHub APIエラー: {response.status_code} - {response.text}",
                    "data": None
                }
                
        except Exception as e:
            logger.error(f"GitHub API呼び出し中にエラーが発生しました: {str(e)}")
            return {
                "success": False,
                "message": f"GitHub API呼び出し中にエラーが発生しました: {str(e)}",
                "data": None
            }
    
    # リポジトリ関連の操作
    def get_user_repositories(self) -> Dict[str, Any]:
        """
        認証ユーザーのリポジトリ一覧を取得する
        
        Returns:
            Dict[str, Any]: リポジトリ一覧
        """
        return self._make_request("GET", "/user/repos")
    
    def get_repository(self, owner: str, repo: str) -> Dict[str, Any]:
        """
        指定したリポジトリの詳細を取得する
        
        Args:
            owner: リポジトリのオーナー
            repo: リポジトリ名
            
        Returns:
            Dict[str, Any]: リポジトリ情報
        """
        return self._make_request("GET", f"/repos/{owner}/{repo}")
    
    def create_repository(self, name: str, description: str = "", private: bool = False) -> Dict[str, Any]:
        """
        新しいリポジトリを作成する
        
        Args:
            name: リポジトリ名
            description: リポジトリの説明
            private: プライベートリポジトリにするかどうか
            
        Returns:
            Dict[str, Any]: 作成されたリポジトリ情報
        """
        data = {
            "name": name,
            "description": description,
            "private": private,
            "auto_init": True
        }
        return self._make_request("POST", "/user/repos", data)
    
    # ファイル操作
    def get_file_content(self, owner: str, repo: str, path: str, ref: str = "main") -> Dict[str, Any]:
        """
        リポジトリ内のファイル内容を取得する
        
        Args:
            owner: リポジトリのオーナー
            repo: リポジトリ名
            path: ファイルパス
            ref: ブランチ名またはコミットハッシュ
            
        Returns:
            Dict[str, Any]: ファイル内容
        """
        params = {"ref": ref}
        result = self._make_request("GET", f"/repos/{owner}/{repo}/contents/{path}", params=params)
        
        if result["success"] and result["data"]:
            try:
                content = result["data"].get("content", "")
                if content:
                    # Base64デコード
                    decoded_content = base64.b64decode(content).decode("utf-8")
                    result["data"]["decoded_content"] = decoded_content
            except Exception as e:
                logger.error(f"ファイル内容のデコード中にエラーが発生しました: {str(e)}")
        
        return result
    
    def create_or_update_file(self, owner: str, repo: str, path: str, content: str, message: str, branch: str = "main", sha: Optional[str] = None) -> Dict[str, Any]:
        """
        リポジトリ内にファイルを作成または更新する
        
        Args:
            owner: リポジトリのオーナー
            repo: リポジトリ名
            path: ファイルパス
            content: ファイル内容
            message: コミットメッセージ
            branch: ブランチ名
            sha: 更新する場合は既存ファイルのSHA
            
        Returns:
            Dict[str, Any]: 操作結果
        """
        data = {
            "message": message,
            "content": base64.b64encode(content.encode("utf-8")).decode("utf-8"),
            "branch": branch
        }
        
        if sha:
            data["sha"] = sha
        
        return self._make_request("PUT", f"/repos/{owner}/{repo}/contents/{path}", data)
    
    # プルリクエスト操作
    def create_pull_request(self, owner: str, repo: str, title: str, head: str, base: str, body: str = "") -> Dict[str, Any]:
        """
        プルリクエストを作成する
        
        Args:
            owner: リポジトリのオーナー
            repo: リポジトリ名
            title: プルリクエストのタイトル
            head: 変更を含むブランチ
            base: マージ先のブランチ
            body: プルリクエストの説明
            
        Returns:
            Dict[str, Any]: 作成されたプルリクエスト情報
        """
        data = {
            "title": title,
            "body": body,
            "head": head,
            "base": base
        }
        return self._make_request("POST", f"/repos/{owner}/{repo}/pulls", data)
    
    # イシュー操作
    def create_issue(self, owner: str, repo: str, title: str, body: str = "") -> Dict[str, Any]:
        """
        イシューを作成する
        
        Args:
            owner: リポジトリのオーナー
            repo: リポジトリ名
            title: イシューのタイトル
            body: イシューの説明
            
        Returns:
            Dict[str, Any]: 作成されたイシュー情報
        """
        data = {
            "title": title,
            "body": body
        }
        return self._make_request("POST", f"/repos/{owner}/{repo}/issues", data)
    
    def search_repositories(self, query: str, page: int = 1, per_page: int = 10) -> Dict[str, Any]:
        """
        リポジトリを検索する
        
        Args:
            query: 検索クエリ
            page: ページ番号
            per_page: 1ページあたりの結果数
            
        Returns:
            Dict[str, Any]: 検索結果
        """
        params = {
            "q": query,
            "page": page,
            "per_page": per_page
        }
        return self._make_request("GET", "/search/repositories", params=params)

# シングルトンインスタンスを取得する関数
def get_github_client() -> GitHubClient:
    """
    GitHubClientのインスタンスを取得する
    """
    return GitHubClient()
