from fastapi import APIRouter, HTTPException, Query, Body, status, Response
from typing import List, Dict, Any, Optional
import uuid
import logging
from pydantic import BaseModel, Field

from ..core.database import (
    create_session, update_session, get_session, list_sessions, 
    delete_session, add_message, get_messages, delete_messages,
    add_training_data, get_training_data, mark_training_data_used,
    get_memory_setting, set_memory_setting, get_all_memory_settings
)

logger = logging.getLogger(__name__)
router = APIRouter()

# リクエスト・レスポンスモデル
class Message(BaseModel):
    role: str = Field(..., description="メッセージの役割（user/assistant/system）")
    content: str = Field(..., description="メッセージの内容")
    metadata: Optional[Dict[str, Any]] = Field(None, description="メタデータ")

class Session(BaseModel):
    session_id: str = Field(..., description="セッションID")
    title: str = Field(..., description="セッションタイトル")
    created_at: str = Field(..., description="作成日時")
    updated_at: str = Field(..., description="更新日時")
    metadata: Optional[Dict[str, Any]] = Field(None, description="メタデータ")

class SessionDetail(Session):
    messages: List[Message] = Field([], description="メッセージ一覧")

class CreateSessionRequest(BaseModel):
    title: Optional[str] = Field(None, description="セッションタイトル")
    metadata: Optional[Dict[str, Any]] = Field(None, description="メタデータ")

class UpdateSessionRequest(BaseModel):
    title: Optional[str] = Field(None, description="セッションタイトル")
    metadata: Optional[Dict[str, Any]] = Field(None, description="メタデータ")

class AddMessageRequest(BaseModel):
    role: str = Field(..., description="メッセージの役割")
    content: str = Field(..., description="メッセージの内容")
    metadata: Optional[Dict[str, Any]] = Field(None, description="メタデータ")

class AddTrainingDataRequest(BaseModel):
    prompt: str = Field(..., description="プロンプト")
    completion: str = Field(..., description="応答")
    source: Optional[str] = Field(None, description="データソース")
    quality_score: Optional[int] = Field(None, description="品質スコア（1-10）")
    metadata: Optional[Dict[str, Any]] = Field(None, description="メタデータ")

class TrainingData(BaseModel):
    id: int = Field(..., description="データID")
    prompt: str = Field(..., description="プロンプト")
    completion: str = Field(..., description="応答")
    created_at: str = Field(..., description="作成日時")
    source: Optional[str] = Field(None, description="データソース")
    quality_score: Optional[int] = Field(None, description="品質スコア")
    is_used_for_training: bool = Field(..., description="トレーニングに使用済みかどうか")
    metadata: Optional[Dict[str, Any]] = Field(None, description="メタデータ")

class MemorySetting(BaseModel):
    key: str = Field(..., description="設定キー")
    value: str = Field(..., description="設定値")
    description: Optional[str] = Field(None, description="説明")

class UpdateMemorySettingRequest(BaseModel):
    value: str = Field(..., description="新しい設定値")
    description: Optional[str] = Field(None, description="説明")

class SuccessResponse(BaseModel):
    success: bool = True
    message: str

# セッション管理エンドポイント
@router.post("/sessions", status_code=status.HTTP_201_CREATED, response_model=Session)
async def create_new_session(request: CreateSessionRequest):
    """新しい会話セッションを作成する"""
    session_id = str(uuid.uuid4())
    row_id = create_session(session_id, request.title, request.metadata)
    
    if not row_id:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="セッションの作成に失敗しました"
        )
    
    session = get_session(session_id)
    if not session:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="作成したセッションの取得に失敗しました"
        )
    
    return session

@router.get("/sessions", response_model=List[Session])
async def get_sessions(limit: int = Query(100, ge=1, le=1000), offset: int = Query(0, ge=0)):
    """セッション一覧を取得する"""
    sessions = list_sessions(limit, offset)
    return sessions

@router.get("/sessions/{session_id}", response_model=SessionDetail)
async def get_session_detail(session_id: str):
    """セッションの詳細を取得する"""
    session = get_session(session_id)
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="指定されたセッションが見つかりません"
        )
    
    messages = get_messages(session_id)
    session["messages"] = messages
    
    return session

@router.put("/sessions/{session_id}", response_model=Session)
async def update_session_info(session_id: str, request: UpdateSessionRequest):
    """セッション情報を更新する"""
    # セッションの存在確認
    existing_session = get_session(session_id)
    if not existing_session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="指定されたセッションが見つかりません"
        )
    
    # 更新
    success = update_session(session_id, request.title, request.metadata)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="セッションの更新に失敗しました"
        )
    
    # 更新後のセッション情報を取得
    updated_session = get_session(session_id)
    return updated_session

@router.delete("/sessions/{session_id}", response_model=SuccessResponse)
async def delete_session_endpoint(session_id: str):
    """セッションを削除する"""
    # セッションの存在確認
    existing_session = get_session(session_id)
    if not existing_session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="指定されたセッションが見つかりません"
        )
    
    # 削除
    success = delete_session(session_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="セッションの削除に失敗しました"
        )
    
    return {"success": True, "message": "セッションを削除しました"}

# メッセージ管理エンドポイント
@router.post("/sessions/{session_id}/messages", status_code=status.HTTP_201_CREATED, response_model=Message)
async def add_message_to_session(session_id: str, request: AddMessageRequest):
    """セッションにメッセージを追加する"""
    # メッセージの追加
    message_id = add_message(session_id, request.role, request.content, request.metadata)
    if not message_id:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="メッセージの追加に失敗しました"
        )
    
    # メッセージ情報を返却
    return {
        "role": request.role,
        "content": request.content,
        "metadata": request.metadata
    }

@router.get("/sessions/{session_id}/messages", response_model=List[Message])
async def get_session_messages(
    session_id: str,
    limit: Optional[int] = Query(None, ge=1, description="取得するメッセージの最大数")
):
    """セッションのメッセージを取得する"""
    # セッションの存在確認
    existing_session = get_session(session_id)
    if not existing_session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="指定されたセッションが見つかりません"
        )
    
    # メッセージの取得
    messages = get_messages(session_id, limit)
    return messages

@router.delete("/sessions/{session_id}/messages", response_model=SuccessResponse)
async def delete_session_messages(session_id: str):
    """セッションのメッセージをすべて削除する"""
    # セッションの存在確認
    existing_session = get_session(session_id)
    if not existing_session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="指定されたセッションが見つかりません"
        )
    
    # メッセージの削除
    success = delete_messages(session_id)
    
    return {"success": True, "message": "メッセージを削除しました"}

# トレーニングデータ管理エンドポイント
@router.post("/training-data", status_code=status.HTTP_201_CREATED, response_model=SuccessResponse)
async def add_new_training_data(request: AddTrainingDataRequest):
    """新しいトレーニングデータを追加する"""
    try:
        data_id = add_training_data(
            prompt=request.prompt,
            completion=request.completion,
            source=request.source,
            quality_score=request.quality_score,
            metadata=request.metadata
        )
        
        return {"success": True, "message": "トレーニングデータを追加しました"}
    except Exception as e:
        logger.error(f"トレーニングデータ追加エラー: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="トレーニングデータの追加に失敗しました"
        )

@router.get("/training-data", response_model=List[TrainingData])
async def get_available_training_data(
    limit: int = Query(100, ge=1, le=1000),
    offset: int = Query(0, ge=0),
    min_quality: Optional[int] = Query(None, ge=1, le=10)
):
    """トレーニングデータを取得する"""
    try:
        data = get_training_data(limit, offset, min_quality)
        return data
    except Exception as e:
        logger.error(f"トレーニングデータ取得エラー: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="トレーニングデータの取得に失敗しました"
        )

@router.post("/training-data/{data_id}/mark-used", response_model=SuccessResponse)
async def mark_training_data_as_used(data_id: int):
    """トレーニングデータを使用済みとしてマークする"""
    try:
        success = mark_training_data_used(data_id)
        if not success:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="指定されたトレーニングデータが見つかりません"
            )
        
        return {"success": True, "message": "トレーニングデータを使用済みとしてマークしました"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"トレーニングデータ使用済みマークエラー: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="トレーニングデータの使用済みマークに失敗しました"
        )

@router.post("/sessions/{session_id}/save-to-training", response_model=SuccessResponse)
async def save_session_to_training(
    session_id: str,
    quality_score: Optional[int] = Query(None, ge=1, le=10)
):
    """セッションの会話をトレーニングデータとして保存する"""
    try:
        # セッションの存在確認
        existing_session = get_session(session_id)
        if not existing_session:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="指定されたセッションが見つかりません"
            )
        
        from ..core.database import save_conversation_to_training
        count = save_conversation_to_training(session_id, quality_score)
        
        return {"success": True, "message": f"セッションから{count}件のトレーニングデータを作成しました"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"セッション会話のトレーニングデータ保存エラー: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="セッション会話のトレーニングデータ保存に失敗しました"
        )

# メモリ設定管理エンドポイント
@router.get("/settings", response_model=Dict[str, str])
async def get_memory_settings():
    """現在のメモリ設定をすべて取得する"""
    try:
        settings = get_all_memory_settings()
        return settings
    except Exception as e:
        logger.error(f"メモリ設定取得エラー: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="メモリ設定の取得に失敗しました"
        )

@router.get("/settings/{key}", response_model=MemorySetting)
async def get_single_memory_setting(key: str):
    """特定のメモリ設定を取得する"""
    try:
        value = get_memory_setting(key)
        if value is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"指定された設定キー '{key}' が見つかりません"
            )
        
        return {"key": key, "value": value}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"メモリ設定取得エラー: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="メモリ設定の取得に失敗しました"
        )

@router.put("/settings/{key}", response_model=MemorySetting)
async def update_memory_setting(key: str, request: UpdateMemorySettingRequest):
    """メモリ設定を更新する"""
    try:
        success = set_memory_setting(key, request.value, request.description)
        if not success:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="メモリ設定の更新に失敗しました"
            )
        
        return {"key": key, "value": request.value, "description": request.description}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"メモリ設定更新エラー: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="メモリ設定の更新に失敗しました"
        )
