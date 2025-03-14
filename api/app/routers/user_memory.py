from fastapi import APIRouter, HTTPException, Query, status
from typing import List, Dict, Any, Optional
import logging
from pydantic import BaseModel, Field

from ..core.database import (
    store_user_memory, get_user_memory, get_all_user_memories, delete_user_memory
)

logger = logging.getLogger(__name__)
router = APIRouter()

# リクエスト・レスポンスモデル
class UserMemoryRequest(BaseModel):
    key: str = Field(..., description="記憶のキー")
    value: str = Field(..., description="記憶の内容")
    session_id: Optional[str] = Field(None, description="セッションID")

class UserMemoryResponse(BaseModel):
    key: str = Field(..., description="記憶のキー")
    value: str = Field(..., description="記憶の内容")
    created_at: str = Field(..., description="作成日時")
    updated_at: str = Field(..., description="更新日時")
    source_session_id: Optional[str] = Field(None, description="記憶のソースとなったセッションID")

class MemoryUpdateResponse(BaseModel):
    success: bool = True
    message: str

# ユーザー定義記憶のエンドポイント
@router.post("/memories", response_model=MemoryUpdateResponse)
async def create_user_memory(request: UserMemoryRequest):
    """ユーザー定義記憶を作成または更新する"""
    try:
        memory_id = store_user_memory(request.key, request.value, request.session_id)
        return {"success": True, "message": f"記憶 '{request.key}' を保存しました"}
    except Exception as e:
        logger.error(f"ユーザー定義記憶の保存中にエラーが発生しました: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"ユーザー定義記憶の保存中にエラーが発生しました: {str(e)}"
        )

@router.get("/memories/{key}", response_model=UserMemoryResponse)
async def get_single_user_memory(key: str):
    """特定のキーの記憶を取得する"""
    memory = get_user_memory(key)
    if not memory:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"記憶 '{key}' が見つかりません"
        )
    return memory

@router.get("/memories", response_model=List[UserMemoryResponse])
async def list_user_memories():
    """すべてのユーザー定義記憶を取得する"""
    try:
        memories = get_all_user_memories()
        return memories
    except Exception as e:
        logger.error(f"ユーザー定義記憶一覧の取得中にエラーが発生しました: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"ユーザー定義記憶一覧の取得中にエラーが発生しました: {str(e)}"
        )

@router.delete("/memories/{key}", response_model=MemoryUpdateResponse)
async def remove_user_memory(key: str):
    """ユーザー定義記憶を削除する"""
    success = delete_user_memory(key)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"記憶 '{key}' が見つかりません"
        )
    return {"success": True, "message": f"記憶 '{key}' を削除しました"}

# ユーザー定義記憶の検出と処理のためのユーティリティ関数
def detect_memory_intent(text: str) -> tuple[bool, Optional[str], Optional[str]]:
    """
    テキストからユーザー定義記憶の操作意図を検出する
    
    Args:
        text: 入力テキスト
        
    Returns:
        (is_memory_op, operation, content)のタプル
        - is_memory_op: 記憶操作かどうか
        - operation: 操作タイプ (store/retrieve/forget/list_all)
        - content: 操作対象の内容
    """
    # テキストを小文字に変換して前処理
    text_lower = text.lower()
    
    # すべての記憶を一覧表示する意図を検出
    if any(phrase in text_lower for phrase in [
        "覚えていることを教えて", "覚えていることを一覧表示", "覚えていることをリストアップ",
        "記憶していることを教えて", "記憶一覧", "メモリーリスト", "全ての記憶", "すべての記憶",
        "記憶を見せて", "覚えていることは何", "何を覚えている", "何を記憶している"
    ]):
        return True, "list_all", None
    
    # 記憶保存の意図を検出（「〇〇を覚えて」「〇〇を記憶して」など）
    if "を覚えて" in text_lower or "を記憶して" in text_lower:
        # パターン: 「XXXを覚えて」
        for marker in ["を覚えて", "を記憶して"]:
            if marker in text_lower:
                # マーカーの前の内容を取得
                content = text.split(marker)[0].strip()
                if content:
                    return True, "store", content
    
    # 記憶取得の意図を検出（「〇〇を思い出して」「〇〇を教えて」など）
    elif "を思い出して" in text_lower or "について教えて" in text_lower:
        # パターン: 「XXXを思い出して」または「XXXについて教えて」
        for marker in ["を思い出して", "について教えて"]:
            if marker in text_lower:
                # マーカーの前の内容を取得
                content = text.split(marker)[0].strip()
                if content:
                    return True, "retrieve", content
    
    # 記憶削除の意図を検出（「〇〇を忘れて」など）
    elif "を忘れて" in text_lower:
        # パターン: 「XXXを忘れて」
        content = text.split("を忘れて")[0].strip()
        if content:
            return True, "forget", content
    
    # 記憶操作が検出されなかった場合
    return False, None, None

def extract_key_value_from_memory_text(text: str) -> tuple[str, str]:
    """
    記憶する内容からキーと値を抽出する
    
    Args:
        text: 記憶する内容のテキスト
        
    Returns:
        (key, value)のタプル
    """
    # 「:」や「は」でキーと値を分ける
    if ":" in text:
        parts = text.split(":", 1)
        return parts[0].strip(), parts[1].strip()
    elif "は" in text:
        parts = text.split("は", 1)
        return parts[0].strip(), parts[1].strip()
    else:
        # 分離できない場合は、テキスト全体をキーと値の両方に使用
        return text.strip(), text.strip()
