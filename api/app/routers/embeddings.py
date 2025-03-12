from fastapi import APIRouter, Depends, HTTPException, status, Request
from typing import Dict, List, Optional, Any
import logging
import time

from ..models.gemma_model import get_gemma_model
from ..models.schemas import EmbeddingRequest, EmbeddingResponse
from ..core.dependencies import check_rate_limit

logger = logging.getLogger(__name__)

router = APIRouter()

@router.post(
    "/embeddings", 
    response_model=EmbeddingResponse,
    summary="テキストの埋め込みを取得する",
    description="Gemma 3 12B モデルを使用してテキストの埋め込みベクトルを取得します",
    dependencies=[Depends(check_rate_limit)],
)
async def get_embeddings(request: Request, data: EmbeddingRequest):
    """
    テキスト埋め込みエンドポイント
    
    * text: 埋め込みベクトルを取得するテキスト
    """
    start_time = time.time()
    
    try:
        model = get_gemma_model()
        embeddings = model.get_embeddings(data.text)
        
        # トークン使用量の計算
        input_tokens = len(model.tokenizer.encode(data.text))
        
        # レスポンスの作成
        response = EmbeddingResponse(
            embedding=embeddings,
            usage={
                "prompt_tokens": input_tokens,
                "total_tokens": input_tokens,
                "time_seconds": round(time.time() - start_time, 2),
            }
        )
        
        return response
    
    except Exception as e:
        logger.error(f"埋め込み生成中にエラーが発生しました: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"埋め込み生成中にエラーが発生しました: {str(e)}",
        )
