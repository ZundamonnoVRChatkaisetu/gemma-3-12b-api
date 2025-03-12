from fastapi import APIRouter, Depends, HTTPException, status, Request
from typing import Dict, List, Optional, Any
import logging
import time
from pydantic import BaseModel, Field

from ..models.gemma_model import get_gemma_model
from ..core.dependencies import check_rate_limit

logger = logging.getLogger(__name__)

router = APIRouter()

class ReasoningRequest(BaseModel):
    """
    推論リクエストのスキーマ
    """
    question: str = Field(..., description="推論のための質問")
    context: Optional[str] = Field(None, description="推論のためのコンテキスト")
    steps: Optional[int] = Field(5, description="思考ステップの数", ge=1, le=10)
    detail_level: Optional[str] = Field("medium", description="詳細レベル (low, medium, high)")
    
class ReasoningResponse(BaseModel):
    """
    推論レスポンスのスキーマ
    """
    reasoning_steps: List[str] = Field(..., description="推論ステップ")
    conclusion: str = Field(..., description="推論の結論")
    confidence: float = Field(..., description="推論の確信度", ge=0.0, le=1.0)
    usage: Dict[str, Any] = Field(..., description="使用量情報")

@router.post(
    "/reasoning", 
    response_model=ReasoningResponse,
    summary="推論を実行する",
    description="与えられた質問に対して段階的に推論を行います",
    dependencies=[Depends(check_rate_limit)],
)
async def execute_reasoning(request: Request, data: ReasoningRequest):
    """
    段階的な推論を行うエンドポイント
    
    * question: 推論のための質問
    * context: 推論のためのコンテキスト（オプション）
    * steps: 思考ステップの数（デフォルト: 5）
    * detail_level: 詳細レベル（low, medium, high）
    """
    start_time = time.time()
    
    try:
        model = get_gemma_model()
        
        # 推論プロンプトの構築
        prompt = f"""以下の質問に対して段階的に推論してください。
質問: {data.question}
"""
        
        if data.context:
            prompt += f"\nコンテキスト情報:\n{data.context}\n"
        
        prompt += f"""
あなたは、上記の質問に対して論理的に考えます。
ステップバイステップで、論理的な思考プロセスを最大{data.steps}ステップで示してください。
各ステップでは論理的推論、因果関係の分析、または仮説の検証をしてください。

出力形式:
思考ステップ1: <最初の推論ステップ>
思考ステップ2: <2番目の推論ステップ>
...
思考ステップ{data.steps}: <最後の推論ステップ>
結論: <最終的な結論>
確信度: <0.0から1.0の間の数値。1.0が最も確信度が高い>

詳細レベル: {data.detail_level}（low=簡潔、medium=標準、high=詳細）

"""
        
        # 推論の実行
        reasoning_output = model.generate_text(
            prompt=prompt,
            max_tokens=2000,
            temperature=0.3,  # 低い温度で論理的な推論を促進
            top_p=0.9,
            top_k=40,
            stream=False,
        )
        
        # 出力を解析
        lines = reasoning_output.strip().split('\n')
        reasoning_steps = []
        conclusion = ""
        confidence = 0.5  # デフォルト値
        
        for line in lines:
            if line.startswith("思考ステップ"):
                # "思考ステップN: " の部分を除去
                step_content = line.split(":", 1)[1].strip() if ":" in line else line
                reasoning_steps.append(step_content)
            elif line.startswith("結論:"):
                conclusion = line[3:].strip()
            elif line.startswith("確信度:"):
                try:
                    confidence_str = line[4:].strip()
                    # 可能な形式のパース ("0.8" または "0.8 / 1.0" など)
                    if "/" in confidence_str:
                        confidence_parts = confidence_str.split("/")
                        if len(confidence_parts) == 2:
                            confidence = float(confidence_parts[0].strip()) / float(confidence_parts[1].strip())
                    else:
                        confidence = float(confidence_str)
                    
                    # 範囲の制限
                    confidence = max(0.0, min(1.0, confidence))
                except ValueError:
                    # パースエラーの場合はデフォルト値を使用
                    confidence = 0.5
            
        # トークン使用量の計算
        input_tokens = len(model.tokenizer.encode(prompt))
        output_tokens = len(model.tokenizer.encode(reasoning_output))
        
        return ReasoningResponse(
            reasoning_steps=reasoning_steps,
            conclusion=conclusion,
            confidence=confidence,
            usage={
                "prompt_tokens": input_tokens,
                "completion_tokens": output_tokens,
                "total_tokens": input_tokens + output_tokens,
                "time_seconds": round(time.time() - start_time, 2),
            }
        )
    
    except Exception as e:
        logger.error(f"推論実行中にエラーが発生しました: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"推論実行中にエラーが発生しました: {str(e)}",
        )
