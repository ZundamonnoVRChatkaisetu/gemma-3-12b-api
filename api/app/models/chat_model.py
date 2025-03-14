import logging
import uuid
from typing import List, Dict, Any, Optional, Union

from .model_factory import get_model
from ..core.database import (
    get_memory_setting, get_conversation_context, 
    add_message, get_session, create_session
)

logger = logging.getLogger(__name__)

class Message:
    """
    チャットメッセージの表現
    """
    def __init__(self, role: str, content: str):
        """
        メッセージを初期化する

        Args:
            role: メッセージの送信者の役割 ("user" または "assistant")
            content: メッセージのテキスト内容
        """
        self.role = role
        self.content = content

    def to_dict(self) -> Dict[str, str]:
        """
        メッセージを辞書形式に変換する
        """
        return {
            "role": self.role,
            "content": self.content
        }

    @classmethod
    def from_dict(cls, data: Dict[str, str]) -> 'Message':
        """
        辞書からメッセージを作成する
        """
        return cls(role=data["role"], content=data["content"])


class ChatModel:
    """
    対話型モデルのラッパークラス
    """
    def __init__(self):
        """
        チャットモデルを初期化する
        """
        self.model = get_model()
        
        # メモリ機能が有効かどうかを確認
        memory_enabled_str = get_memory_setting("memory_enabled")
        self.memory_enabled = memory_enabled_str == "true" if memory_enabled_str else True
        
        # コンテキストに含めるメッセージの最大数
        max_context_messages_str = get_memory_setting("max_context_messages")
        self.max_context_messages = int(max_context_messages_str) if max_context_messages_str else 20

    def format_prompt(self, messages: List[Message], session_id: Optional[str] = None) -> str:
        """
        メッセージのリストからプロンプト文字列を作成する

        Args:
            messages: メッセージのリスト
            session_id: セッションID（メモリ機能使用時）

        Returns:
            フォーマットされたプロンプト文字列
        """
        if not messages:
            return ""

        # システムメッセージがある場合は最初に配置、なければデフォルトのシステムメッセージを使用
        system_message = "あなたは役立つAIアシスタントです。以下の会話を元に最新の質問に回答してください。\n\n"
        
        # 会話履歴の構築
        conversation = ""
        
        # メモリ機能が有効かつセッションIDが指定されている場合は、
        # データベースから過去の会話履歴を取得して追加
        if self.memory_enabled and session_id:
            try:
                # セッションが存在するか確認し、なければ作成
                session = get_session(session_id)
                if not session:
                    create_session(session_id)
                
                # 会話履歴を取得
                context_messages = get_conversation_context(session_id, self.max_context_messages)
                
                # 履歴があれば、それを会話に追加
                for msg in context_messages:
                    if msg["role"] == "user":
                        conversation += f"ユーザー: {msg['content']}\n"
                    elif msg["role"] == "assistant":
                        conversation += f"アシスタント: {msg['content']}\n"
            except Exception as e:
                logger.warning(f"会話履歴の取得中にエラーが発生しました: {str(e)}")
                # エラーがあっても、現在のメッセージは処理を続ける
        
        # 現在のメッセージを追加（重複を避けるため、メモリから取得した分はスキップ）
        for message in messages:
            if message.role == "user":
                conversation += f"ユーザー: {message.content}\n"
            elif message.role == "assistant":
                conversation += f"アシスタント: {message.content}\n"
        
        # 最後のメッセージがユーザーからのものである場合は、応答を開始する
        if messages[-1].role == "user":
            conversation += f"アシスタント: "
        
        # 最終的なプロンプトの構築
        prompt = system_message + conversation
        
        return prompt

    def generate_response(
        self,
        messages: List[Message],
        session_id: Optional[str] = None,
        max_tokens: Optional[int] = None,
        temperature: Optional[float] = None,
        top_p: Optional[float] = None,
        top_k: Optional[int] = None,
        stream: bool = False,
    ) -> Union[str, Any]:
        """
        メッセージのリストに基づいて応答を生成する

        Args:
            messages: メッセージのリスト
            session_id: セッションID（メモリ機能使用時）
            max_tokens: 生成する最大トークン数
            temperature: 温度パラメータ
            top_p: top-p サンプリングのパラメータ
            top_k: top-k サンプリングのパラメータ
            stream: ストリーミング生成を行うかどうか

        Returns:
            生成された応答テキスト
        """
        prompt = self.format_prompt(messages, session_id)
        
        response = None
        if stream:
            response = self.model.generate_text(
                prompt=prompt,
                max_tokens=max_tokens,
                temperature=temperature,
                top_p=top_p,
                top_k=top_k,
                stream=True,
            )
        else:
            response = self.model.generate_text(
                prompt=prompt,
                max_tokens=max_tokens,
                temperature=temperature,
                top_p=top_p,
                top_k=top_k,
                stream=False,
            )
        
        # メモリ機能が有効かつセッションIDが指定され、かつストリーミングモードでない場合は、
        # ユーザーからのメッセージとアシスタントの応答をデータベースに保存
        if self.memory_enabled and session_id and not stream:
            self._save_conversation_to_memory(session_id, messages, response)
            
        return response
    
    def _save_conversation_to_memory(self, session_id: str, messages: List[Message], response: str) -> None:
        """会話をメモリに保存する"""
        try:
            # 最後のユーザーメッセージを保存
            user_message = None
            for msg in reversed(messages):
                if msg.role == "user":
                    user_message = msg
                    break
            
            if user_message:
                # ユーザーメッセージを保存
                add_message(session_id, "user", user_message.content)
                
                # アシスタント応答を保存
                add_message(session_id, "assistant", response)
                
                logger.info(f"会話をセッション {session_id} に保存しました")
        except Exception as e:
            logger.error(f"会話の保存中にエラーが発生しました: {str(e)}")
            # エラーがあっても、生成処理自体は続行する

    def generate_with_new_session(
        self,
        messages: List[Message],
        title: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None,
        max_tokens: Optional[int] = None,
        temperature: Optional[float] = None,
        top_p: Optional[float] = None,
        top_k: Optional[int] = None,
        stream: bool = False,
    ) -> Dict[str, Any]:
        """
        新しいセッションを作成して応答を生成する

        Args:
            messages: メッセージのリスト
            title: セッションのタイトル
            metadata: メタデータ
            max_tokens: 生成する最大トークン数
            temperature: 温度パラメータ
            top_p: top-p サンプリングのパラメータ
            top_k: top-k サンプリングのパラメータ
            stream: ストリーミング生成を行うかどうか

        Returns:
            生成された応答とセッションIDを含む辞書
        """
        # 新しいセッションIDを生成
        session_id = str(uuid.uuid4())
        
        # セッションを作成
        if self.memory_enabled:
            try:
                create_session(session_id, title, metadata)
            except Exception as e:
                logger.error(f"セッション作成中にエラーが発生しました: {str(e)}")
                # エラーがあっても生成処理自体は続行する
        
        # 応答を生成
        response = self.generate_response(
            messages=messages,
            session_id=session_id,
            max_tokens=max_tokens,
            temperature=temperature,
            top_p=top_p,
            top_k=top_k,
            stream=stream,
        )
        
        return {
            "response": response,
            "session_id": session_id,
        }


# シングルトンインスタンスを取得する関数
def get_chat_model() -> ChatModel:
    """
    チャットモデルのインスタンスを取得する
    """
    return ChatModel()
