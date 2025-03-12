import logging
from typing import List, Dict, Any, Optional

from .gemma_model import get_gemma_model

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
        self.gemma_model = get_gemma_model()

    def format_prompt(self, messages: List[Message]) -> str:
        """
        メッセージのリストからプロンプト文字列を作成する

        Args:
            messages: メッセージのリスト

        Returns:
            フォーマットされたプロンプト文字列
        """
        if not messages:
            return ""

        # システムメッセージがある場合は最初に配置、なければデフォルトのシステムメッセージを使用
        system_message = "あなたは役立つAIアシスタントです。以下の会話を元に最新の質問に回答してください。\n\n"
        
        # 会話履歴の構築
        conversation = ""
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
        max_tokens: Optional[int] = None,
        temperature: Optional[float] = None,
        top_p: Optional[float] = None,
        top_k: Optional[int] = None,
        stream: bool = False,
    ) -> str:
        """
        メッセージのリストに基づいて応答を生成する

        Args:
            messages: メッセージのリスト
            max_tokens: 生成する最大トークン数
            temperature: 温度パラメータ
            top_p: top-p サンプリングのパラメータ
            top_k: top-k サンプリングのパラメータ
            stream: ストリーミング生成を行うかどうか

        Returns:
            生成された応答テキスト
        """
        prompt = self.format_prompt(messages)
        
        if stream:
            return self.gemma_model.generate_text(
                prompt=prompt,
                max_tokens=max_tokens,
                temperature=temperature,
                top_p=top_p,
                top_k=top_k,
                stream=True,
            )
        else:
            return self.gemma_model.generate_text(
                prompt=prompt,
                max_tokens=max_tokens,
                temperature=temperature,
                top_p=top_p,
                top_k=top_k,
                stream=False,
            )


# シングルトンインスタンスを取得する関数
def get_chat_model() -> ChatModel:
    """
    チャットモデルのインスタンスを取得する
    """
    return ChatModel()
