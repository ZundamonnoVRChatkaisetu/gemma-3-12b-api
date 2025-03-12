from fastapi import APIRouter, Depends, Request
from typing import Dict, Any

from ..models.gemma_model import get_gemma_model
from ..models.schemas import HealthResponse, ModelInfoResponse
from ..core.config import settings

router = APIRouter()

@router.get(
    "/", 
    response_model=HealthResponse,
    summary="ヘルスチェック",
    description="API サーバーのヘルスステータスを取得します",
)
async def health_check():
    """
    API サーバーのヘルスステータスを返すエンドポイント
    """
    model = get_gemma_model()
    model_info = model.get_model_info()
    
    return HealthResponse(
        status="ok",
        version=settings.API_VERSION,
        model_loaded=model_info["status"] == "loaded",
    )

@router.get(
    "/model", 
    response_model=ModelInfoResponse,
    summary="モデル情報",
    description="読み込まれているモデルの情報を取得します",
)
async def model_info():
    """
    読み込まれているモデルの情報を返すエンドポイント
    """
    model = get_gemma_model()
    return model.get_model_info()
