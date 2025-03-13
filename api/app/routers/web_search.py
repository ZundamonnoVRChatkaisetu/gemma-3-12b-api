from fastapi import APIRouter, HTTPException, status, Query, Depends
from typing import Dict, Any, Optional
from pydantic import BaseModel, Field
import logging

from ..models.brave_search import get_brave_search_client
from ..core.dependencies import check_rate_limit

logger = logging.getLogger(__name__)

router = APIRouter()

class SearchRequest(BaseModel):
    """
    検索リクエストのスキーマ
    """
    query: str = Field(..., description="検索クエリ")
    count: Optional[int] = Field(5, description="取得する結果の数", ge=1, le=20)

class SearchResponse(BaseModel):
    """
    検索レスポンスのスキーマ
    """
    success: bool = Field(..., description="検索が成功したかどうか")
    query: Optional[str] = Field(None, description="検索クエリ")
    results: list = Field([], description="検索結果のリスト")
    message: Optional[str] = Field(None, description="エラーメッセージ")

@router.post(
    "/search",
    response_model=SearchResponse,
    summary="Web検索を実行する",
    description="Brave Search APIを使用してWeb検索を実行します",
    dependencies=[Depends(check_rate_limit)],
)
async def web_search(data: SearchRequest):
    """
    Web検索エンドポイント
    
    * query: 検索クエリ
    * count: 取得する結果の数
    """
    try:
        client = get_brave_search_client()
        
        # APIキーが設定されているか確認
        if not client.api_key:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Brave Search APIキーが設定されていません。"
            )
        
        # 検索を実行
        results = client.search(data.query, data.count)
        
        # 結果を返す
        return SearchResponse(
            success=results.get("success", False),
            query=results.get("query", data.query),
            results=results.get("results", []),
            message=results.get("message")
        )
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Web検索中にエラーが発生しました: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Web検索中にエラーが発生しました: {str(e)}"
        )

@router.get(
    "/search",
    response_model=SearchResponse,
    summary="Web検索を実行する (GET)",
    description="Brave Search APIを使用してWeb検索を実行します",
    dependencies=[Depends(check_rate_limit)],
)
async def web_search_get(
    query: str = Query(..., description="検索クエリ"),
    count: int = Query(5, description="取得する結果の数", ge=1, le=20)
):
    """
    Web検索エンドポイント (GET)
    
    * query: 検索クエリ
    * count: 取得する結果の数
    """
    try:
        client = get_brave_search_client()
        
        # APIキーが設定されているか確認
        if not client.api_key:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Brave Search APIキーが設定されていません。"
            )
        
        # 検索を実行
        results = client.search(query, count)
        
        # 結果を返す
        return SearchResponse(
            success=results.get("success", False),
            query=results.get("query", query),
            results=results.get("results", []),
            message=results.get("message")
        )
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Web検索中にエラーが発生しました: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Web検索中にエラーが発生しました: {str(e)}"
        )
