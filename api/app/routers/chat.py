from fastapi import APIRouter, Depends, HTTPException, status, Request, Response
from fastapi.responses import StreamingResponse
from typing import Dict, List, Optional, Any
import logging
import time
import json

from ..models.chat_model import get_chat_model, Message as ChatMessage
from ..models.model_factory import get_model, get_tokenizer
from ..models.files_assistant import get_files_assistant
from ..models.smart_assistant import get_smart_assistant
from ..models.schemas import ChatCompletionRequest, ChatCompletionResponse, Message
from ..core.dependencies import check_rate_limit

logger = logging.getLogger(__name__)

router = APIRouter()

@router.post(
    "/chat/completions", 
    response_model=ChatCompletionResponse,
    summary="チャット応答を生成する",
    description="モデルを使用してチャット応答を生成します",
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
        model = get_model()
        tokenizer = get_tokenizer()
        smart_assistant = get_smart_assistant()
        
        # メッセージリストをChatMessageオブジェクトに変換
        chat_messages = [
            ChatMessage(role=msg.role, content=msg.content)
            for msg in data.messages
        ]
        
        # 最後のユーザーメッセージを取得
        latest_user_message = data.messages[-1].content if data.messages and data.messages[-1].role == "user" else ""
        
        # ファイル操作の意図を検出
        if latest_user_message:
            files_assistant = get_files_assistant()
            is_file_op, op_type, op_params = files_assistant.detect_file_operation(latest_user_message)
            
            if is_file_op:
                # ファイル操作を実行
                result = files_assistant.execute_file_operation(op_type, op_params)
                
                # 操作結果に基づいて応答を生成
                if result.get("success", False):
                    if op_type == "list_files":
                        files = result.get("files", [])
                        current_dir = result.get("current_dir", "")
                        
                        files_text = ""
                        for file in files:
                            file_type = "📁 " if file.get("is_dir") else "📄 "
                            size_info = f" ({file.get('size', 0)} bytes)" if not file.get("is_dir") else ""
                            files_text += f"{file_type}{file.get('name')}{size_info}\n"
                        
                        response_text = f"## ディレクトリ: {current_dir or '/'}\n\n{files_text}"
                        
                    elif op_type == "read_file":
                        content = result.get("content", "")
                        path = result.get("path", "")
                        
                        response_text = f"## ファイル: {path}\n\n```\n{content}\n```"
                        
                    else:
                        response_text = f"ファイル操作が完了しました: {result.get('message', '')}"
                else:
                    response_text = f"エラーが発生しました: {result.get('message', '不明なエラー')}"
                
                # 応答メッセージを作成
                response = ChatCompletionResponse(
                    message=Message(
                        role="assistant",
                        content=response_text
                    ),
                    usage={
                        "prompt_tokens": 0,
                        "completion_tokens": 0,
                        "total_tokens": 0,
                        "time_seconds": round(time.time() - start_time, 2),
                    }
                )
                
                return response
            
            # Web検索の意図を検出
            is_web_search, search_query = smart_assistant.detect_web_search_intent(latest_user_message)
            if is_web_search and search_query:
                # Web検索結果を含めた応答を生成
                response_text = smart_assistant.enhance_response_with_search(search_query, latest_user_message)
                
                # 応答メッセージを作成
                response = ChatCompletionResponse(
                    message=Message(
                        role="assistant",
                        content=response_text
                    ),
                    usage={
                        "prompt_tokens": 0,
                        "completion_tokens": 0,
                        "total_tokens": 0,
                        "time_seconds": round(time.time() - start_time, 2),
                    }
                )
                
                return response
            
            # GitHub操作の意図を検出
            is_github_op, op_type, op_params = smart_assistant.detect_github_operation_intent(latest_user_message)
            if is_github_op:
                # GitHub操作を実行
                result = smart_assistant.perform_github_operation(op_type, op_params)
                
                # 操作結果を整形
                response_text = smart_assistant.format_github_operation_result(op_type, result)
                
                # 応答メッセージを作成
                response = ChatCompletionResponse(
                    message=Message(
                        role="assistant",
                        content=response_text
                    ),
                    usage={
                        "prompt_tokens": 0,
                        "completion_tokens": 0,
                        "total_tokens": 0,
                        "time_seconds": round(time.time() - start_time, 2),
                    }
                )
                
                return response
        
        if data.stream:
            async def streaming_generator():
                try:
                    prompt = chat_model.format_prompt(chat_messages)
                    for text_chunk in model.generate_text(
                        prompt=prompt,
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
            # プロンプトを整形してモデルに送信
            prompt = chat_model.format_prompt(chat_messages)
            response_text = model.generate_text(
                prompt=prompt,
                max_tokens=data.max_tokens,
                temperature=data.temperature,
                top_p=data.top_p,
                top_k=data.top_k,
                stream=False,
            )
            
            # トークン使用量の計算（これは推定です）
            try:
                input_tokens = len(tokenizer.encode(prompt))
                output_tokens = len(tokenizer.encode(response_text))
            except:
                # トークン化に失敗した場合、単語数で代用
                input_tokens = len(prompt.split())
                output_tokens = len(response_text.split())
            
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
