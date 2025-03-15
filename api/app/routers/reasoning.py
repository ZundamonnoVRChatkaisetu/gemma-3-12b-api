from fastapi import APIRouter, Depends, HTTPException, status, Request
from typing import Dict, List, Optional, Any
import logging
import time
from pydantic import BaseModel

from ..core.dependencies import check_rate_limit
from ..models.reasoning import get_reasoning_engine

logger = logging.getLogger(__name__)

router = APIRouter()

class ChatMessage(BaseModel):
    """チャットメッセージ"""
    role: str
    content: str

class StepByStepRequest(BaseModel):
    """ステップバイステップ推論リクエスト"""
    question: str
    context: Optional[str] = None
    detail_level: Optional[str] = "medium"
    chat_history: Optional[List[ChatMessage]] = None

class EvaluateStatementRequest(BaseModel):
    """文の評価リクエスト"""
    statement: str
    context: Optional[str] = None
    detail_level: Optional[str] = "medium"
    chat_history: Optional[List[ChatMessage]] = None

class CompareOptionsRequest(BaseModel):
    """選択肢の比較リクエスト"""
    question: str
    options: List[str]
    criteria: Optional[List[str]] = None
    context: Optional[str] = None
    detail_level: Optional[str] = "medium"
    chat_history: Optional[List[ChatMessage]] = None

class ReasoningResponse(BaseModel):
    """推論応答"""
    result: Dict[str, Any]
    time_seconds: float

@router.post(
    "/reasoning/step-by-step",
    response_model=ReasoningResponse,
    summary="ステップバイステップ推論を実行",
    description="問題や質問に対してステップバイステップの思考プロセスで推論を実行します",
    dependencies=[Depends(check_rate_limit)],
)
async def step_by_step_reasoning(request: Request, data: StepByStepRequest):
    """
    ステップバイステップ推論を実行
    
    * question: 質問/問題
    * context: 追加のコンテキスト情報（オプション）
    * detail_level: 推論の詳細レベル（"low", "medium", "high"）
    * chat_history: 会話履歴（オプション）
    """
    start_time = time.time()
    
    try:
        reasoning_engine = get_reasoning_engine()
        
        # 詳細レベルの検証
        valid_detail_levels = ["low", "medium", "high"]
        if data.detail_level not in valid_detail_levels:
            data.detail_level = "medium"
        
        # 推論の実行
        result = reasoning_engine.perform_step_by_step_reasoning(
            question=data.question,
            context=data.context,
            detail_level=data.detail_level,
            chat_history=data.chat_history
        )
        
        time_taken = round(time.time() - start_time, 2)
        
        # レスポンスの作成
        return ReasoningResponse(
            result=result,
            time_seconds=time_taken
        )
    
    except Exception as e:
        logger.error(f"ステップバイステップ推論中にエラーが発生しました: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"ステップバイステップ推論中にエラーが発生しました: {str(e)}",
        )

@router.post(
    "/reasoning/evaluate-statement",
    response_model=ReasoningResponse,
    summary="文の真偽を評価",
    description="与えられた文の真偽を評価し、確信度と根拠を提示します",
    dependencies=[Depends(check_rate_limit)],
)
async def evaluate_statement(request: Request, data: EvaluateStatementRequest):
    """
    文の真偽を評価
    
    * statement: 評価する文
    * context: 追加のコンテキスト情報（オプション）
    * detail_level: 推論の詳細レベル（"low", "medium", "high"）
    * chat_history: 会話履歴（オプション）
    """
    start_time = time.time()
    
    try:
        reasoning_engine = get_reasoning_engine()
        
        # 詳細レベルの検証
        valid_detail_levels = ["low", "medium", "high"]
        if data.detail_level not in valid_detail_levels:
            data.detail_level = "medium"
        
        # 評価の実行
        result = reasoning_engine.evaluate_statement(
            statement=data.statement,
            context=data.context,
            detail_level=data.detail_level,
            chat_history=data.chat_history
        )
        
        time_taken = round(time.time() - start_time, 2)
        
        # レスポンスの作成
        return ReasoningResponse(
            result=result,
            time_seconds=time_taken
        )
    
    except Exception as e:
        logger.error(f"文の評価中にエラーが発生しました: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"文の評価中にエラーが発生しました: {str(e)}",
        )

@router.post(
    "/reasoning/compare-options",
    response_model=ReasoningResponse,
    summary="選択肢の比較",
    description="複数の選択肢を比較して最適なものを選択します",
    dependencies=[Depends(check_rate_limit)],
)
async def compare_options(request: Request, data: CompareOptionsRequest):
    """
    選択肢の比較
    
    * question: 選択のための質問
    * options: 比較する選択肢のリスト
    * criteria: 評価基準（オプション）
    * context: 追加のコンテキスト情報（オプション）
    * detail_level: 推論の詳細レベル（"low", "medium", "high"）
    * chat_history: 会話履歴（オプション）
    """
    start_time = time.time()
    
    try:
        reasoning_engine = get_reasoning_engine()
        
        # 選択肢の検証
        if not data.options or len(data.options) < 2:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="比較には少なくとも2つの選択肢が必要です",
            )
        
        # 詳細レベルの検証
        valid_detail_levels = ["low", "medium", "high"]
        if data.detail_level not in valid_detail_levels:
            data.detail_level = "medium"
        
        # 比較の実行
        result = reasoning_engine.compare_options(
            question=data.question,
            options=data.options,
            criteria=data.criteria,
            context=data.context,
            detail_level=data.detail_level,
            chat_history=data.chat_history
        )
        
        time_taken = round(time.time() - start_time, 2)
        
        # レスポンスの作成
        return ReasoningResponse(
            result=result,
            time_seconds=time_taken
        )
    
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        
        logger.error(f"選択肢の比較中にエラーが発生しました: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"選択肢の比較中にエラーが発生しました: {str(e)}",
        )
