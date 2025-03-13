import os
import logging
import requests
from typing import List, Dict, Any, Optional, Tuple
import re

from .chat_model import get_chat_model, Message

logger = logging.getLogger(__name__)

class FilesAssistant:
    """
    ファイル操作を支援するアシスタントクラス
    """
    def __init__(self, api_base_url: str = "http://localhost:8000"):
        """
        FilesAssistantを初期化する
        
        Args:
            api_base_url: ファイル操作APIのベースURL
        """
        self.api_base_url = api_base_url
        self.chat_model = get_chat_model()
        
    def detect_file_operation(self, user_message: str) -> Tuple[bool, str, Dict[str, Any]]:
        """
        ユーザーメッセージからファイル操作の意図を検出する
        
        Args:
            user_message: ユーザーのメッセージ
            
        Returns:
            Tuple[bool, str, Dict[str, Any]]: (操作が検出されたか, 操作の種類, パラメータ)
        """
        # ファイル操作を検出するためのプロンプトを作成
        detect_prompt = """あなたはユーザーメッセージからファイル操作意図を特定するアシスタントです。
以下のメッセージからファイル操作の意図を検出し、JSONフォーマットで返してください。

ユーザーメッセージ: {}

以下の操作を検出できます:
1. ファイル一覧表示: 例「ファイル一覧を表示して」「ディレクトリの内容を見せて」
2. ファイル読み込み: 例「example.txtの内容を見せて」「このファイルを開いて」
3. ファイル書き込み: 例「example.txtに次の内容を書き込んで: [内容]」「新しいファイルを作成して内容は[内容]」
4. ディレクトリ作成: 例「新しいフォルダを作って」「ディレクトリを作成して」
5. ファイル/ディレクトリ削除: 例「このファイルを削除して」「フォルダを消して」
6. ファイル移動: 例「このファイルをそのディレクトリに移動して」
7. ファイルコピー: 例「このファイルをコピーして」

出力はJSON形式で:
{{
  "is_file_operation": true/false,
  "operation_type": "list_files/read_file/write_file/create_directory/delete_file/move_file/copy_file",
  "parameters": {{
    "path": "ファイルパス",
    "content": "書き込む内容",
    "destination": "移動先パス"
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
            return False, "", {}
            
        json_str = json_match.group(0)
        
        try:
            import json
            result = json.loads(json_str)
            
            # 結果を整形
            is_file_operation = result.get("is_file_operation", False)
            operation_type = result.get("operation_type", "")
            parameters = result.get("parameters", {})
            
            return is_file_operation, operation_type, parameters
            
        except Exception as e:
            logger.error(f"JSONのパース中にエラーが発生しました: {str(e)}")
            return False, "", {}
    
    def execute_file_operation(self, operation_type: str, parameters: Dict[str, Any]) -> Dict[str, Any]:
        """
        ファイル操作を実行する
        
        Args:
            operation_type: 操作の種類
            parameters: 操作のパラメータ
            
        Returns:
            Dict[str, Any]: 操作の結果
        """
        try:
            # 操作タイプに応じた処理
            if operation_type == "list_files":
                return self._list_files(parameters.get("path", ""))
                
            elif operation_type == "read_file":
                return self._read_file(parameters.get("path", ""))
                
            elif operation_type == "write_file":
                return self._write_file(
                    parameters.get("path", ""),
                    parameters.get("content", ""),
                    parameters.get("create_dirs", False)
                )
                
            elif operation_type == "create_directory":
                return self._create_directory(
                    parameters.get("path", ""),
                    parameters.get("exist_ok", False)
                )
                
            elif operation_type == "delete_file":
                return self._delete_file(parameters.get("path", ""))
                
            elif operation_type == "move_file":
                return self._move_file(
                    parameters.get("source", ""),
                    parameters.get("destination", "")
                )
                
            elif operation_type == "copy_file":
                return self._copy_file(
                    parameters.get("source", ""),
                    parameters.get("destination", "")
                )
                
            else:
                return {"success": False, "message": f"不明な操作タイプです: {operation_type}"}
                
        except Exception as e:
            logger.error(f"ファイル操作の実行中にエラーが発生しました: {str(e)}")
            return {"success": False, "message": f"ファイル操作の実行中にエラーが発生しました: {str(e)}"}
    
    def _list_files(self, path: str) -> Dict[str, Any]:
        """ファイル一覧を取得する"""
        url = f"{self.api_base_url}/api/v1/files/list?path={path}"
        response = requests.get(url)
        
        if response.status_code == 200:
            data = response.json()
            return {"success": True, "files": data.get("files", []), "current_dir": data.get("current_dir", "")}
        else:
            return {"success": False, "message": f"ファイル一覧の取得に失敗しました: {response.text}"}
    
    def _read_file(self, path: str) -> Dict[str, Any]:
        """ファイル内容を読み込む"""
        url = f"{self.api_base_url}/api/v1/files/read?path={path}"
        response = requests.get(url)
        
        if response.status_code == 200:
            data = response.json()
            return {"success": True, "content": data.get("content", ""), "path": data.get("path", "")}
        else:
            return {"success": False, "message": f"ファイルの読み込みに失敗しました: {response.text}"}
    
    def _write_file(self, path: str, content: str, create_dirs: bool = False) -> Dict[str, Any]:
        """ファイルに内容を書き込む"""
        url = f"{self.api_base_url}/api/v1/files/write"
        data = {"path": path, "content": content, "create_dirs": create_dirs}
        response = requests.post(url, json=data)
        
        if response.status_code == 200:
            return response.json()
        else:
            return {"success": False, "message": f"ファイルの書き込みに失敗しました: {response.text}"}
    
    def _create_directory(self, path: str, exist_ok: bool = False) -> Dict[str, Any]:
        """ディレクトリを作成する"""
        url = f"{self.api_base_url}/api/v1/files/mkdir"
        data = {"path": path, "exist_ok": exist_ok}
        response = requests.post(url, json=data)
        
        if response.status_code == 200:
            return response.json()
        else:
            return {"success": False, "message": f"ディレクトリの作成に失敗しました: {response.text}"}
    
    def _delete_file(self, path: str) -> Dict[str, Any]:
        """ファイルを削除する"""
        url = f"{self.api_base_url}/api/v1/files/delete?path={path}"
        response = requests.delete(url)
        
        if response.status_code == 200:
            return response.json()
        else:
            return {"success": False, "message": f"ファイルの削除に失敗しました: {response.text}"}
    
    def _move_file(self, source: str, destination: str) -> Dict[str, Any]:
        """ファイルを移動する"""
        url = f"{self.api_base_url}/api/v1/files/move"
        data = {"source": source, "destination": destination}
        response = requests.post(url, json=data)
        
        if response.status_code == 200:
            return response.json()
        else:
            return {"success": False, "message": f"ファイルの移動に失敗しました: {response.text}"}
    
    def _copy_file(self, source: str, destination: str) -> Dict[str, Any]:
        """ファイルをコピーする"""
        url = f"{self.api_base_url}/api/v1/files/copy"
        data = {"source": source, "destination": destination}
        response = requests.post(url, json=data)
        
        if response.status_code == 200:
            return response.json()
        else:
            return {"success": False, "message": f"ファイルのコピーに失敗しました: {response.text}"}

# シングルトンインスタンスを取得する関数
def get_files_assistant() -> FilesAssistant:
    """
    FilesAssistantのインスタンスを取得する
    """
    return FilesAssistant()
