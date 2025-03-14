from fastapi import APIRouter, Depends, HTTPException, status, Request, Response
from fastapi.responses import StreamingResponse
from typing import Dict, List, Optional, Any
import logging
import time
import json
import uuid

from ..models.chat_model import get_chat_model, Message as ChatMessage
from ..models.model_factory import get_model, get_tokenizer
from ..models.files_assistant import get_files_assistant
from ..models.smart_assistant import get_smart_assistant
from ..models.schemas import ChatCompletionRequest, ChatCompletionResponse, Message
from ..core.dependencies import check_rate_limit
from ..core.database import get_memory_setting, get_session, create_session, add_message
from ..core.database import store_user_memory, get_user_memory, delete_user_memory
from .user_memory import detect_memory_intent, extract_key_value_from_memory_text

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
    * session_id: セッションID（メモリ機能使用時、指定しない場合は新しいセッションが作成されます）
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
        
        # セッションIDの取得（リクエストから、または新規生成）
        session_id = data.session_id if hasattr(data, 'session_id') and data.session_id else str(uuid.uuid4())
        
        # メモリ機能が有効かどうかを確認
        memory_enabled_str = get_memory_setting("memory_enabled")
        memory_enabled = memory_enabled_str == "true" if memory_enabled_str else True
        
        # ユーザー定義記憶機能が有効かどうかを確認
        user_memory_enabled_str = get_memory_setting("user_memory_enabled")
        user_memory_enabled = user_memory_enabled_str == "true" if user_memory_enabled_str else True
        
        # セッションが存在するか確認し、なければ作成
        if memory_enabled:
            session = get_session(session_id)
            if not session:
                create_session(session_id)
        
        # 最後のユーザーメッセージを取得
        latest_user_message = data.messages[-1].content if data.messages and data.messages[-1].role == "user" else ""
        
        # ユーザー定義記憶の意図を検出（「〇〇を覚えて」など）
        if latest_user_message and user_memory_enabled:
            is_memory_op, op_type, content = detect_memory_intent(latest_user_message)
            
            if is_memory_op:
                # 記憶操作を実行
                response_text = ""
                
                if op_type == "store":
                    # 記憶を保存
                    key, value = extract_key_value_from_memory_text(content)
                    store_user_memory(key, value, session_id)
                    response_text = f"「{key}」を記憶しました。必要なときにお知らせください。"
                
                elif op_type == "retrieve":
                    # 記憶を取得
                    memory = get_user_memory(content)
                    if memory:
                        response_text = f"「{content}」についての記憶です: {memory['value']}"
                    else:
                        response_text = f"申し訳ありません。「{content}」についての記憶はありません。"
                
                elif op_type == "forget":
                    # 記憶を削除
                    success = delete_user_memory(content)
                    if success:
                        response_text = f"「{content}」についての記憶を忘れました。"
                    else:
                        response_text = f"「{content}」についての記憶はありませんでした。"
                
                # メモリ機能が有効な場合、ユーザーメッセージとアシスタント応答を保存
                if memory_enabled:
                    add_message(session_id, "user", latest_user_message)
                    add_message(session_id, "assistant", response_text)
                
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
                    },
                    session_id=session_id
                )
                
                return response
        
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
                
                # メモリ機能が有効な場合、ユーザーメッセージとアシスタント応答を保存
                if memory_enabled:
                    add_message(session_id, "user", latest_user_message)
                    add_message(session_id, "assistant", response_text)
                
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
                    },
                    session_id=session_id
                )
                
                return response
            
            # Web検索の意図を検出
            is_web_search, search_query = smart_assistant.detect_web_search_intent(latest_user_message)
            if is_web_search and search_query:
                # Web検索結果を含めた応答を生成
                response_text = smart_assistant.enhance_response_with_search(search_query, latest_user_message)
                
                # メモリ機能が有効な場合、ユーザーメッセージとアシスタント応答を保存
                if memory_enabled:
                    add_message(session_id, "user", latest_user_message)
                    add_message(session_id, "assistant", response_text)
                
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
                    },
                    session_id=session_id
                )
                
                return response
            
            # GitHub操作の意図を検出
            is_github_op, op_type, op_params = smart_assistant.detect_github_operation_intent(latest_user_message)
            if is_github_op:
                # GitHub操作を実行
                result = smart_assistant.perform_github_operation(op_type, op_params)
                
                # 操作結果を整形
                response_text = smart_assistant.format_github_operation_result(op_type, result)
                
                # メモリ機能が有効な場合、ユーザーメッセージとアシスタント応答を保存
                if memory_enabled:
                    add_message(session_id, "user", latest_user_message)
                    add_message(session_id, "assistant", response_text)
                
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
                    },
                    session_id=session_id
                )
                
                return response
        
        if data.stream:
            async def streaming_generator():
                try:
                    prompt = chat_model.format_prompt(chat_messages, session_id if memory_enabled else None)
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
                    # ストリーミング完了後、メッセージを保存
                    if memory_enabled:
                        try:
                            add_message(session_id, "user", latest_user_message)
                            # ストリーミングの場合、応答全体を取得できないため、保存は行わない
                        except Exception as save_error:
                            logger.error(f"メッセージ保存中にエラーが発生しました: {str(save_error)}")
                    
                    # ストリーミング終了を通知
                    yield "data: [DONE]\n\n"
            
            return StreamingResponse(
                streaming_generator(),
                media_type="text/event-stream",
            )
        else:
            # プロンプトを整形してモデルに送信
            prompt = chat_model.format_prompt(chat_messages, session_id if memory_enabled else None)

            # ユーザー定義記憶をプロンプトに追加
            if user_memory_enabled:
                try:
                    from ..core.database import get_all_user_memories
                    memories = get_all_user_memories()
                    
                    if memories:
                        memory_text = "以下はユーザーが記憶として保存した情報です：\n"
                        for memory in memories:
                            memory_text += f"・{memory['key']}: {memory['value']}\n"
                        memory_text += "\n必要に応じて上記の情報を参照して応答を生成してください。\n\n"
                        
                        # プロンプトにメモリ情報を追加（システムメッセージの後かつ会話前に配置）
                        if "あなたは役立つAIアシスタントです。" in prompt:
                            prompt = prompt.replace(
                                "あなたは役立つAIアシスタントです。以下の会話を元に最新の質問に回答してください。\n\n",
                                f"あなたは役立つAIアシスタントです。以下の会話を元に最新の質問に回答してください。\n\n{memory_text}"
                            )
                except Exception as e:
                    logger.warning(f"ユーザー定義記憶の取得中にエラーが発生しました: {str(e)}")
            
            response_text = model.generate_text(
                prompt=prompt,
                max_tokens=data.max_tokens,
                temperature=data.temperature,
                top_p=data.top_p,
                top_k=data.top_k,
                stream=False,
            )
            
            # メモリ機能が有効な場合、ユーザーメッセージとアシスタント応答を保存
            if memory_enabled:
                add_message(session_id, "user", latest_user_message)
                add_message(session_id, "assistant", response_text)
            
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
                },
                session_id=session_id
            )
            
            return response
    
    except Exception as e:
        logger.error(f"チャット生成中にエラーが発生しました: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"チャット生成中にエラーが発生しました: {str(e)}",
        )

@router.post(
    "/chat/new-session",
    response_model=ChatCompletionResponse,
    summary="新しいセッションでチャット応答を生成する",
    description="新しいセッションを作成してチャット応答を生成します",
    dependencies=[Depends(check_rate_limit)],
)
async def chat_with_new_session(request: Request, data: ChatCompletionRequest):
    """
    新しいセッションでチャット応答を生成する
    
    * messages: チャットメッセージのリスト（最後はユーザーからのものである必要があります）
    * max_tokens: 生成する最大トークン数
    * temperature: 温度パラメータ（高いほどランダム）
    * top_p: top-p サンプリングのパラメータ
    * top_k: top-k サンプリングのパラメータ
    * stream: ストリーミング生成を行うかどうか
    * session_title: セッションのタイトル（指定しない場合は自動生成）
    """
    start_time = time.time()
    
    try:
        chat_model = get_chat_model()
        
        # メッセージリストをChatMessageオブジェクトに変換
        chat_messages = [
            ChatMessage(role=msg.role, content=msg.content)
            for msg in data.messages
        ]
        
        # セッションタイトル（指定がなければ、ユーザーの最初のメッセージから生成）
        session_title = getattr(data, 'session_title', None)
        if not session_title and chat_messages and chat_messages[0].role == "user":
            # 最初のユーザーメッセージの先頭20文字をタイトルとして使用
            session_title = chat_messages[0].content[:20] + "..."
        
        # 新しいセッションで応答を生成
        result = chat_model.generate_with_new_session(
            messages=chat_messages,
            title=session_title,
            max_tokens=data.max_tokens,
            temperature=data.temperature,
            top_p=data.top_p,
            top_k=data.top_k,
            stream=data.stream,
        )
        
        if data.stream:
            async def streaming_generator():
                try:
                    for text_chunk in result["response"]:
                        yield f"data: {text_chunk}\n\n"
                except Exception as e:
                    logger.error(f"ストリーミング生成中にエラーが発生しました: {str(e)}")
                    yield f"data: [ERROR] {str(e)}\n\n"
                finally:
                    # セッションIDを含めて終了を通知
                    yield f"data: [SESSION]{result['session_id']}\n\n"
                    yield "data: [DONE]\n\n"
            
            return StreamingResponse(
                streaming_generator(),
                media_type="text/event-stream",
            )
        else:
            # 応答テキスト
            response_text = result["response"]
            session_id = result["session_id"]
            
            # トークン使用量の計算（推定）
            try:
                tokenizer = get_tokenizer()
                prompt = chat_model.format_prompt(chat_messages)
                input_tokens = len(tokenizer.encode(prompt))
                output_tokens = len(tokenizer.encode(response_text))
            except:
                # トークン化に失敗した場合、単語数で代用
                prompt = " ".join([msg.content for msg in chat_messages])
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
                },
                session_id=session_id
            )
            
            return response
    
    except Exception as e:
        logger.error(f"チャット生成中にエラーが発生しました: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"チャット生成中にエラーが発生しました: {str(e)}",
        )
