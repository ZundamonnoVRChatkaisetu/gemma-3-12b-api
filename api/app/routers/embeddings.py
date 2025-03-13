from fastapi import APIRouter, Depends, HTTPException, status, Request
from typing import Dict, List, Optional, Any
import logging
import time

from ..models.model_factory import get_model, get_tokenizer
from ..models.schemas import EmbeddingRequest, EmbeddingResponse
from ..core.dependencies import check_rate_limit

logger = logging.getLogger(__name__)

router = APIRouter()

@router.post(
    "/embeddings", 
    response_model=EmbeddingResponse,
    summary="テキストの埋め込みを取得する",
    description="モデルを使用してテキストの埋め込みベクトルを取得します",
    dependencies=[Depends(check_rate_limit)],
)
async def get_embeddings(request: Request, data: EmbeddingRequest):
    """
    テキスト埋め込みエンドポイント
    
    * text: 埋め込みベクトルを取得するテキスト
    """
    start_time = time.time()
    
    try:
        model = get_model()
        tokenizer = get_tokenizer()
        
        embeddings = model.get_embeddings(data.text)
        
        # トークン使用量の計算（これは推定です）
        try:
            input_tokens = len(tokenizer.encode(data.text))
        except:
            # トークン化に失敗した場合、単語数で代用
            input_tokens = len(data.text.split())
        
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
