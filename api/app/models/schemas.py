from pydantic import BaseModel, Field, field_validator
from typing import List, Optional, Dict, Any, Union

class TextGenerationRequest(BaseModel):
    """
    テキスト生成リクエストのスキーマ
    """
    prompt: str = Field(..., description="入力プロンプト")
    max_tokens: Optional[int] = Field(None, description="生成する最大トークン数", ge=1, le=4096)
    temperature: Optional[float] = Field(None, description="温度パラメータ", ge=0.0, le=2.0)
    top_p: Optional[float] = Field(None, description="top-p サンプリングのパラメータ", ge=0.0, le=1.0)
    top_k: Optional[int] = Field(None, description="top-k サンプリングのパラメータ", ge=1, le=100)
    stream: Optional[bool] = Field(False, description="ストリーミング生成を行うかどうか")
    
    @field_validator('prompt')
    def prompt_not_empty(cls, v):
        if not v or not v.strip():
            raise ValueError('プロンプトは空であってはいけません')
        return v.strip()

class TextGenerationResponse(BaseModel):
    """
    テキスト生成レスポンスのスキーマ
    """
    text: str = Field(..., description="生成されたテキスト")
    usage: Dict[str, int] = Field(..., description="使用量情報")

class Message(BaseModel):
    """
    チャットメッセージのスキーマ
    """
    role: str = Field(..., description="メッセージの送信者の役割 (user または assistant)")
    content: str = Field(..., description="メッセージのテキスト内容")
    
    @field_validator('role')
    def validate_role(cls, v):
        if v not in ["user", "assistant", "system"]:
            raise ValueError('役割は "user", "assistant", または "system" である必要があります')
        return v
    
    @field_validator('content')
    def content_not_empty(cls, v):
        if not v or not v.strip():
            raise ValueError('メッセージの内容は空であってはいけません')
        return v.strip()

class ChatCompletionRequest(BaseModel):
    """
    チャット完了リクエストのスキーマ
    """
    messages: List[Message] = Field(..., description="チャットメッセージのリスト")
    max_tokens: Optional[int] = Field(None, description="生成する最大トークン数", ge=1, le=4096)
    temperature: Optional[float] = Field(None, description="温度パラメータ", ge=0.0, le=2.0)
    top_p: Optional[float] = Field(None, description="top-p サンプリングのパラメータ", ge=0.0, le=1.0)
    top_k: Optional[int] = Field(None, description="top-k サンプリングのパラメータ", ge=1, le=100)
    stream: Optional[bool] = Field(False, description="ストリーミング生成を行うかどうか")
    
    @field_validator('messages')
    def validate_messages(cls, v):
        if not v:
            raise ValueError('メッセージリストは空であってはいけません')
        if v[-1].role != "user":
            raise ValueError('最後のメッセージはユーザーからのものである必要があります')
        return v

class ChatCompletionResponse(BaseModel):
    """
    チャット完了レスポンスのスキーマ
    """
    message: Message = Field(..., description="アシスタントの応答メッセージ")
    usage: Dict[str, int] = Field(..., description="使用量情報")

class EmbeddingRequest(BaseModel):
    """
    埋め込みリクエストのスキーマ
    """
    text: str = Field(..., description="埋め込みを取得するテキスト")
    
    @field_validator('text')
    def text_not_empty(cls, v):
        if not v or not v.strip():
            raise ValueError('テキストは空であってはいけません')
        return v.strip()

class EmbeddingResponse(BaseModel):
    """
    埋め込みレスポンスのスキーマ
    """
    embedding: List[float] = Field(..., description="テキストの埋め込みベクトル")
    usage: Dict[str, int] = Field(..., description="使用量情報")

class ModelInfoResponse(BaseModel):
    """
    モデル情報レスポンスのスキーマ
    """
    status: str = Field(..., description="モデルの状態")
    model_id: str = Field(..., description="モデルID")
    model_type: Optional[str] = Field(None, description="モデルの種類")
    tokenizer_type: Optional[str] = Field(None, description="トークナイザーの種類")
    device: Optional[str] = Field(None, description="デバイス")
    parameters: Optional[Dict[str, Any]] = Field(None, description="パラメータ情報")

class HealthResponse(BaseModel):
    """
    ヘルスチェックレスポンスのスキーマ
    """
    status: str = Field(..., description="サービスの状態")
    version: str = Field(..., description="APIバージョン")
    model_loaded: bool = Field(..., description="モデルが読み込まれているかどうか")
