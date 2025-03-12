from fastapi import APIRouter, Depends, HTTPException, status, Request, Response
from fastapi.responses import StreamingResponse
from typing import Dict, List, Optional, Any
import logging
import time

from ..models.gemma_model import get_gemma_model
from ..models.schemas import TextGenerationRequest, TextGenerationResponse
from ..core.dependencies import check_rate_limit

logger = logging.getLogger(__name__)

router = APIRouter()

@router.post(
    "/generate", 
    response_model=TextGenerationResponse,
    summary="テキストを生成する",
    description="Gemma 3 12B モデルを使用してテキストを生成します",
    dependencies=[Depends(check_rate_limit)],
)
async def generate_text(request: Request, data: TextGenerationRequest):
    """
    テキスト生成エンドポイント
    
    * プロンプト: 生成するテキストのプロンプト
    * max_tokens: 生成する最大トークン数
    * temperature: 温度パラメータ（高いほどランダム）
    * top_p: top-p サンプリングのパラメータ
    * top_k: top-k サンプリングのパラメータ
    * stream: ストリーミング生成を行うかどうか
    """
    start_time = time.time()
    
    try:
        model = get_gemma_model()
        
        if data.stream:
            async def streaming_generator():
                try:
                    for text_chunk in model.generate_text(
                        prompt=data.prompt,
                        max_tokens=data.max_tokens,
                        temperature=data.temperature,
                        top_p=data.top_p,
                        top_k=data.top_k,
                        stream=True,
                    ):
                        yield f"data: {text_chunk}\n\n"
                except Exception as e:
                    logger.error(f"ストリーミング生成中にエラーが発生しました: {str(e)}")
                    yield f"data: [ERROR] {str(e)}\n\n"
                finally:
                    yield "data: [DONE]\n\n"
            
            return StreamingResponse(
                streaming_generator(),
                media_type="text/event-stream",
            )
        else:
            generated_text = model.generate_text(
                prompt=data.prompt,
                max_tokens=data.max_tokens,
                temperature=data.temperature,
                top_p=data.top_p,
                top_k=data.top_k,
                stream=False,
            )
            
            # トークン使用量の計算
            input_tokens = len(model.tokenizer.encode(data.prompt))
            output_tokens = len(model.tokenizer.encode(generated_text))
            
            # レスポンスの作成
            response = TextGenerationResponse(
                text=generated_text,
                usage={
                    "prompt_tokens": input_tokens,
                    "completion_tokens": output_tokens,
                    "total_tokens": input_tokens + output_tokens,
                    "time_seconds": round(time.time() - start_time, 2),
                }
            )
            
            return response
    
    except Exception as e:
        logger.error(f"テキスト生成中にエラーが発生しました: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"テキスト生成中にエラーが発生しました: {str(e)}",
        )
