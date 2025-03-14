import logging
import re
import json
import datetime
from typing import Dict, List, Any, Optional, Tuple

from .chat_model import get_chat_model, Message
from .brave_search import get_brave_search_client
from .github_client import get_github_client
from .reasoning import get_reasoning_engine
from ..core.config import settings

logger = logging.getLogger(__name__)

class SmartAssistant:
    """
    Web検索とGitHub操作機能を持つスマートアシスタント
    """
    _instance = None
    
    def __new__(cls):
        """シングルトンパターンを使用"""
        if cls._instance is None:
            cls._instance = super(SmartAssistant, cls).__new__(cls)
            cls._instance._initialized = False
        return cls._instance
    
    def __init__(self):
        """
        SmartAssistantを初期化する
        """
        if getattr(self, "_initialized", False):
            return
            
        self._initialized = True
        self.chat_model = get_chat_model()
        self.brave_search = get_brave_search_client()
        self.github_client = get_github_client()
        self.reasoning_engine = get_reasoning_engine()
        
        # APIキーの状態をログに出力
        if self.brave_search.api_key:
            logger.info("SmartAssistant: Brave Search APIキーが設定されています")
        else:
            logger.warning("SmartAssistant: Brave Search APIキーが設定されていません")
            
        if self.github_client.api_token:
            logger.info("SmartAssistant: GitHub APIトークンが設定されています")
        else:
            logger.warning("SmartAssistant: GitHub APIトークンが設定されていません")
    
    def detect_web_search_intent(self, user_message: str) -> Tuple[bool, str]:
        """
        ユーザーメッセージからWeb検索の意図を検出する
        
        Args:
            user_message: ユーザーのメッセージ
            
        Returns:
            Tuple[bool, str]: (検索意図があるか, 検索クエリ)
        """
        logger.debug(f"Web検索意図検出: '{user_message}'")
        
        # 特殊な日付クエリのチェック
        date_keywords = ["今日の日付", "今日は何日", "今日は"]
        if any(keyword in user_message for keyword in date_keywords):
            return True, "今日の日付"

        # 明示的な検索キーワードを確認
        search_keywords = ["検索", "調べて", "教えて", "知りたい", "最新の", "情報"]
        if any(keyword in user_message for keyword in search_keywords):
            # 簡易的な検索クエリ抽出（より高度な実装に置き換え可能）
            query = user_message
            for prefix in ["について検索", "を検索", "を調べて", "について教えて", "について知りたい"]:
                if prefix in user_message:
                    query = user_message.split(prefix)[0]
                    break
            
            logger.info(f"Web検索意図を検出: クエリ='{query}'")
            return True, query
        
        # 検索の意図を検出するためのプロンプトを作成
        detect_prompt = """あなたはユーザーメッセージからWeb検索の意図を特定するアシスタントです。
以下のメッセージからWeb検索の意図を検出し、JSONフォーマットで返してください。

ユーザーメッセージ: {}

以下のような表現が検索意図を示します:
1. 「検索して」「調べて」などの明示的な検索リクエスト
2. 「〜について教えて」のような情報要求
3. 「最新の〜は?」のような最新情報の要求
4. 「〜の方法は?」のような手順や方法の質問

出力はJSON形式で:
{{
  "is_search_intent": true/false,
  "search_query": "検索クエリ（検索意図がない場合は空）"
}}
""".format(user_message)

        # モデルに推論させる
        response = self.chat_model.generate_response([
            Message(role="system", content=detect_prompt),
            Message(role="user", content=user_message)
        ])
        
        # JSONを抽出
        json_match = re.search(r'\{.*\}', response, re.DOTALL)
        if not json_match:
            logger.warning(f"Web検索意図検出: JSONが見つかりませんでした: {response}")
            return False, ""
            
        json_str = json_match.group(0)
        
        try:
            result = json.loads(json_str)
            
            # 結果を整形
            is_search_intent = result.get("is_search_intent", False)
            search_query = result.get("search_query", "")
            
            if is_search_intent:
                logger.info(f"Web検索意図を検出: クエリ='{search_query}'")
            else:
                logger.debug("Web検索意図なし")
                
            return is_search_intent, search_query
            
        except Exception as e:
            logger.error(f"JSONのパース中にエラーが発生しました: {str(e)}")
            return False, ""
    
    def detect_github_operation_intent(self, user_message: str) -> Tuple[bool, str, Dict[str, Any]]:
        """
        ユーザーメッセージからGitHub操作の意図を検出する
        
        Args:
            user_message: ユーザーのメッセージ
            
        Returns:
            Tuple[bool, str, Dict[str, Any]]: (操作意図があるか, 操作タイプ, 操作パラメータ)
        """
        logger.debug(f"GitHub操作意図検出: '{user_message}'")
        
        # 明示的なGitHubキーワードを確認
        github_keywords = ["GitHub", "リポジトリ", "レポジトリ", "リポジトリ一覧"]
        if any(keyword in user_message for keyword in github_keywords):
            # 簡易的な操作タイプ特定
            operation_type = "list_repos"  # デフォルト
            parameters = {}
            
            if "一覧" in user_message or "リスト" in user_message:
                operation_type = "list_repos"
            elif "検索" in user_message:
                operation_type = "search_repos"
                # 検索クエリを抽出
                if "を検索" in user_message:
                    query = user_message.split("を検索")[0].strip()
                    parameters["query"] = query
            
            logger.info(f"GitHub操作意図を検出: タイプ='{operation_type}', パラメータ={parameters}")
            return True, operation_type, parameters
        
        # GitHub操作の意図を検出するためのプロンプトを作成
        detect_prompt = """あなたはユーザーメッセージからGitHub操作の意図を特定するアシスタントです。
以下のメッセージからGitHub操作の意図を検出し、JSONフォーマットで返してください。

ユーザーメッセージ: {}

以下の操作を検出できます:
1. リポジトリ一覧表示: 例「GitHubのリポジトリ一覧を表示して」
2. リポジトリ作成: 例「新しいリポジトリを作成して」
3. リポジトリ検索: 例「Pythonのマークダウンパーサーのリポジトリを検索して」
4. ファイル内容取得: 例「リポジトリのREADME.mdを表示して」
5. ファイル作成・更新: 例「リポジトリにHello Worldのファイルを作成して」
6. イシュー作成: 例「バグ報告のイシューを作成して」
7. プルリクエスト作成: 例「このブランチからプルリクエストを作成して」

出力はJSON形式で:
{{
  "is_github_operation": true/false,
  "operation_type": "list_repos/create_repo/search_repos/get_file/update_file/create_issue/create_pr",
  "parameters": {{
    "owner": "リポジトリのオーナー",
    "repo": "リポジトリ名",
    "path": "ファイルパス",
    "content": "ファイル内容",
    ...
  }}
}}
""".format(user_message)

        # モデルに推論させる
        response = self.chat_model.generate_response([
            Message(role="system", content=detect_prompt),
            Message(role="user", content=user_message)
        ])
        
        # JSONを抽出
        json_match = re.search(r'\{.*\}', response, re.DOTALL)
        if not json_match:
            logger.warning(f"GitHub操作意図検出: JSONが見つかりませんでした: {response}")
            return False, "", {}
            
        json_str = json_match.group(0)
        
        try:
            result = json.loads(json_str)
            
            # 結果を整形
            is_github_operation = result.get("is_github_operation", False)
            operation_type = result.get("operation_type", "")
            parameters = result.get("parameters", {})
            
            if is_github_operation:
                logger.info(f"GitHub操作意図を検出: タイプ='{operation_type}', パラメータ={parameters}")
            else:
                logger.debug("GitHub操作意図なし")
                
            return is_github_operation, operation_type, parameters
            
        except Exception as e:
            logger.error(f"JSONのパース中にエラーが発生しました: {str(e)}")
            return False, "", {}
    
    def detect_reasoning_intent(self, user_message: str) -> Tuple[bool, str, Dict[str, Any]]:
        """
        ユーザーメッセージから推論意図を検出する
        
        Args:
            user_message: ユーザーのメッセージ
            
        Returns:
            Tuple[bool, str, Dict[str, Any]]: (推論意図があるか, 推論タイプ, パラメータ)
        """
        # 推論エンジンの検出関数を使用
        return self.reasoning_engine.detect_reasoning_intent(user_message)
    
    def perform_web_search(self, query: str, count: int = 5) -> Dict[str, Any]:
        """
        Web検索を実行する
        
        Args:
            query: 検索クエリ
            count: 取得する結果の数
            
        Returns:
            Dict[str, Any]: 検索結果
        """
        try:
            logger.info(f"Web検索を実行: クエリ='{query}', 結果数={count}")
            
            # 特殊クエリの処理
            if query == "今日の日付":
                today = datetime.datetime.now()
                formatted_date = today.strftime("%Y年%m月%d日")
                
                return {
                    "success": True,
                    "query": query,
                    "special_data": {
                        "type": "date",
                        "value": formatted_date
                    },
                    "results": []
                }
            
            # 通常の検索処理
            search_results = self.brave_search.search(query, count)
            return search_results
        except Exception as e:
            logger.error(f"Web検索中にエラーが発生しました: {str(e)}")
            return {
                "success": False,
                "message": f"Web検索中にエラーが発生しました: {str(e)}",
                "results": []
            }
    
    def perform_github_operation(self, operation_type: str, parameters: Dict[str, Any]) -> Dict[str, Any]:
        """
        GitHub操作を実行する
        
        Args:
            operation_type: 操作タイプ
            parameters: 操作パラメータ
            
        Returns:
            Dict[str, Any]: 操作結果
        """
        try:
            logger.info(f"GitHub操作を実行: タイプ='{operation_type}', パラメータ={parameters}")
            
            if operation_type == "list_repos":
                return self.github_client.get_user_repositories()
            
            elif operation_type == "create_repo":
                return self.github_client.create_repository(
                    name=parameters.get("name", ""),
                    description=parameters.get("description", ""),
                    private=parameters.get("private", False)
                )
            
            elif operation_type == "search_repos":
                return self.github_client.search_repositories(
                    query=parameters.get("query", ""),
                    page=parameters.get("page", 1),
                    per_page=parameters.get("per_page", 10)
                )
            
            elif operation_type == "get_file":
                return self.github_client.get_file_content(
                    owner=parameters.get("owner", ""),
                    repo=parameters.get("repo", ""),
                    path=parameters.get("path", ""),
                    ref=parameters.get("ref", "main")
                )
            
            elif operation_type == "update_file":
                return self.github_client.create_or_update_file(
                    owner=parameters.get("owner", ""),
                    repo=parameters.get("repo", ""),
                    path=parameters.get("path", ""),
                    content=parameters.get("content", ""),
                    message=parameters.get("message", "Update via API"),
                    branch=parameters.get("branch", "main"),
                    sha=parameters.get("sha")
                )
            
            elif operation_type == "create_issue":
                return self.github_client.create_issue(
                    owner=parameters.get("owner", ""),
                    repo=parameters.get("repo", ""),
                    title=parameters.get("title", ""),
                    body=parameters.get("body", "")
                )
            
            elif operation_type == "create_pr":
                return self.github_client.create_pull_request(
                    owner=parameters.get("owner", ""),
                    repo=parameters.get("repo", ""),
                    title=parameters.get("title", ""),
                    body=parameters.get("body", ""),
                    head=parameters.get("head", ""),
                    base=parameters.get("base", "main")
                )
            
            else:
                return {
                    "success": False,
                    "message": f"不明な操作タイプです: {operation_type}",
                    "data": None
                }
                
        except Exception as e:
            logger.error(f"GitHub操作中にエラーが発生しました: {str(e)}")
            return {
                "success": False,
                "message": f"GitHub操作中にエラーが発生しました: {str(e)}",
                "data": None
            }
    
    def perform_reasoning(self, reasoning_type: str, parameters: Dict[str, Any]) -> Dict[str, Any]:
        """
        推論を実行する
        
        Args:
            reasoning_type: 推論タイプ
            parameters: 推論パラメータ
            
        Returns:
            Dict[str, Any]: 推論結果
        """
        try:
            logger.info(f"推論を実行: タイプ='{reasoning_type}', パラメータ={parameters}")
            
            if reasoning_type == "step_by_step":
                return {
                    "success": True,
                    "type": reasoning_type,
                    "result": self.reasoning_engine.perform_step_by_step_reasoning(
                        question=parameters.get("question", ""),
                        context=parameters.get("context"),
                        detail_level=parameters.get("detail_level", "medium")
                    )
                }
            
            elif reasoning_type == "evaluate_statement":
                return {
                    "success": True,
                    "type": reasoning_type,
                    "result": self.reasoning_engine.evaluate_statement(
                        statement=parameters.get("question", ""),
                        context=parameters.get("context"),
                        detail_level=parameters.get("detail_level", "medium")
                    )
                }
            
            elif reasoning_type == "compare_options":
                # オプションリストの確認
                options = parameters.get("options", [])
                if not options or len(options) < 2:
                    return {
                        "success": False,
                        "message": "比較には少なくとも2つの選択肢が必要です",
                        "result": None
                    }
                
                return {
                    "success": True,
                    "type": reasoning_type,
                    "result": self.reasoning_engine.compare_options(
                        question=parameters.get("question", ""),
                        options=options,
                        criteria=parameters.get("criteria"),
                        context=parameters.get("context"),
                        detail_level=parameters.get("detail_level", "medium")
                    )
                }
            
            else:
                return {
                    "success": False,
                    "message": f"不明な推論タイプです: {reasoning_type}",
                    "result": None
                }
                
        except Exception as e:
            logger.error(f"推論中にエラーが発生しました: {str(e)}")
            return {
                "success": False,
                "message": f"推論中にエラーが発生しました: {str(e)}",
                "result": None
            }
    
    def enhance_response_with_search(self, query: str, user_message: str) -> str:
        """
        Web検索結果を含めた応答を生成する
        
        Args:
            query: 検索クエリ
            user_message: 元のユーザーメッセージ
            
        Returns:
            str: 検索結果を含めた応答
        """
        # 検索を実行
        search_results = self.perform_web_search(query)
        
        if not search_results["success"]:
            return f"検索エラー: {search_results.get('message', '不明なエラー')}"
        
        # 特殊データ型の処理
        if "special_data" in search_results:
            special_data = search_results["special_data"]
            
            if special_data["type"] == "date":
                return f"今日は{special_data['value']}です。"
        
        # 検索結果を整形
        formatted_results = self.brave_search.format_results(search_results)
        
        # 検索結果を含めた応答を生成するプロンプト
        enhance_prompt = f"""あなたは、ユーザーの質問に答えるためにWeb検索結果を活用するアシスタントです。
以下のWeb検索結果を参考にして、ユーザーの質問に対して包括的な回答を作成してください。

ユーザーの質問: {user_message}

検索結果:
{formatted_results}

検索結果の情報に基づいて回答を作成してください。検索結果が示している事実と一致する回答をする必要があります。
検索結果に明示的に含まれていない情報は提供しないでください。もし検索結果に十分な情報がない場合は、
その旨を伝え、どのような情報が不足しているかを説明してください。

これは事実に基づく回答を必要とする質問なので、検索結果からの情報を正確に伝えることが最も重要です。
検索結果に含まれる情報だけを使って回答してください。

ユーザーへの回答:"""

        # 強化された応答を生成
        enhanced_response = self.chat_model.generate_response([
            Message(role="system", content=enhance_prompt),
            Message(role="user", content=user_message)
        ])
        
        return enhanced_response
    
    def format_github_operation_result(self, operation_type: str, result: Dict[str, Any]) -> str:
        """
        GitHub操作の結果を整形する
        
        Args:
            operation_type: 操作タイプ
            result: 操作結果
            
        Returns:
            str: 整形された結果
        """
        if not result["success"]:
            return f"GitHub操作エラー: {result.get('message', '不明なエラー')}"
        
        if operation_type == "list_repos":
            repos = result.get("data", [])
            formatted = "## GitHubリポジトリ一覧\n\n"
            
            for i, repo in enumerate(repos, 1):
                name = repo.get("name", "無名")
                description = repo.get("description", "説明なし")
                url = repo.get("html_url", "")
                visibility = "プライベート" if repo.get("private", False) else "パブリック"
                
                formatted += f"### {i}. {name}\n"
                formatted += f"URL: {url}\n"
                formatted += f"説明: {description}\n"
                formatted += f"可視性: {visibility}\n\n"
            
            return formatted
        
        elif operation_type == "search_repos":
            items = result.get("data", {}).get("items", [])
            formatted = "## GitHubリポジトリ検索結果\n\n"
            
            for i, repo in enumerate(items, 1):
                name = repo.get("name", "無名")
                full_name = repo.get("full_name", "")
                description = repo.get("description", "説明なし")
                url = repo.get("html_url", "")
                stars = repo.get("stargazers_count", 0)
                
                formatted += f"### {i}. {full_name}\n"
                formatted += f"URL: {url}\n"
                formatted += f"説明: {description}\n"
                formatted += f"スター数: {stars}\n\n"
            
            return formatted
        
        elif operation_type == "get_file":
            data = result.get("data", {})
            
            if "decoded_content" in data:
                path = data.get("path", "不明")
                content = data.get("decoded_content", "")
                
                formatted = f"## ファイル内容: {path}\n\n"
                formatted += "```\n"
                formatted += content
                formatted += "\n```"
                
                return formatted
            else:
                return "ファイル内容を取得できませんでした。"
        
        else:
            # その他の操作はシンプルに成功メッセージを返す
            return f"GitHub操作が成功しました: {result.get('message', '')}"
    
    def format_reasoning_result(self, result: Dict[str, Any]) -> str:
        """
        推論結果を整形する
        
        Args:
            result: 推論結果
            
        Returns:
            str: 整形された結果
        """
        if not result["success"]:
            return f"推論エラー: {result.get('message', '不明なエラー')}"
        
        # 推論エンジンのフォーマット関数を使用
        reasoning_type = result.get("type", "")
        result_data = result.get("result", {})
        
        return self.reasoning_engine.format_reasoning_result(reasoning_type, result_data)

# シングルトンインスタンスを取得する関数
def get_smart_assistant() -> SmartAssistant:
    """
    SmartAssistantのインスタンスを取得する
    """
    return SmartAssistant()
