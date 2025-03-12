from fastapi import APIRouter, Depends, HTTPException, status, Request, Response
from fastapi.responses import StreamingResponse
from typing import Dict, List, Optional, Any
import logging
import time

from ..models.chat_model import get_chat_model, Message as ChatMessage
from ..models.gemma_model import get_gemma_model
from ..models.schemas import ChatCompletionRequest, ChatCompletionResponse, Message
from ..core.dependencies import check_rate_limit

logger = logging.getLogger(__name__)

router = APIRouter()

@router.post(
    "/chat/completions", 
    response_model=ChatCompletionResponse,
    summary="チャット応答を生成する",
    description="Gemma 3 12B モデルを使用してチャット応答を生成します",
    dependencies=[Depends(check_rate_limit)],
)
async def chat_completion(request: Request, data: ChatCompletionRequest):
    """
    チャット応答生成エンドポイント
    
    * messages: チャットメッセージのリスト（最後はユーザーからのものである必要があります）
    * max_tokens: 生成する最大トークン数
    * temperature: 温度パラメータ（高いほどランダム）
    * top_p: top-p サンプリングのパラメータ
    * top_k: top-k サンプリングのパラメータ
    * stream: ストリーミング生成を行うかどうか
    """
    start_time = time.time()
    
    try:
        chat_model = get_chat_model()
        gemma_model = get_gemma_model()
        
        # メッセージリストをChatMessageオブジェクトに変換
        chat_messages = [
            ChatMessage(role=msg.role, content=msg.content)
            for msg in data.messages
        ]
        
        if data.stream:
            async def streaming_generator():
                try:
                    for text_chunk in chat_model.generate_response(
                        messages=chat_messages,
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
            response_text = chat_model.generate_response(
                messages=chat_messages,
                max_tokens=data.max_tokens,
                temperature=data.temperature,
                top_p=data.top_p,
                top_k=data.top_k,
                stream=False,
            )
            
            # トークン使用量の計算
            # 簡易的な実装のため、実際のトークナイザーで計算する
            prompt_text = chat_model.format_prompt(chat_messages)
            input_tokens = len(gemma_model.tokenizer.encode(prompt_text))
            output_tokens = len(gemma_model.tokenizer.encode(response_text))
            
            # レスポンスの作成
            response = ChatCompletionResponse(
                message=Message(
                    role="assistant",
                    content=response_text
                ),
                usage={
                    "prompt_tokens": input_tokens,
                    "completion_tokens": output_tokens,
                    "total_tokens": input_tokens + output_tokens,
                    "time_seconds": round(time.time() - start_time, 2),
                }
            )
            
            return response
    
    except Exception as e:
        logger.error(f"チャット生成中にエラーが発生しました: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"チャット生成中にエラーが発生しました: {str(e)}",
        )
