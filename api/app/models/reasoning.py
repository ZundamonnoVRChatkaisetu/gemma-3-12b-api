import logging
import re
import json
from typing import Dict, List, Any, Optional, Tuple, Union

from .chat_model import get_chat_model, Message
from ..core.config import settings

logger = logging.getLogger(__name__)

class ReasoningEngine:
    """
    推論エンジンクラス
    ステップバイステップの思考プロセス、コンテキスト対応推論、確信度評価などの推論機能を提供
    """
    _instance = None
    
    def __new__(cls):
        """シングルトンパターンを使用"""
        if cls._instance is None:
            cls._instance = super(ReasoningEngine, cls).__new__(cls)
            cls._instance._initialized = False
        return cls._instance
    
    def __init__(self):
        """
        ReasoningEngineを初期化
        """
        if getattr(self, "_initialized", False):
            return
            
        self._initialized = True
        self.chat_model = get_chat_model()
        logger.info("ReasoningEngine: 初期化完了")
    
    def perform_step_by_step_reasoning(self, 
                                       question: str, 
                                       context: Optional[str] = None,
                                       detail_level: str = "medium") -> Dict[str, Any]:
        """
        ステップバイステップの思考プロセスで推論を実行
        
        Args:
            question: 質問/問題
            context: 追加のコンテキスト情報（オプション）
            detail_level: 推論の詳細レベル（"low", "medium", "high"）
            
        Returns:
            Dict[str, Any]: 推論結果（ステップ、最終回答、確信度など）
        """
        # 詳細レベルの検証
        valid_detail_levels = ["low", "medium", "high"]
        if detail_level not in valid_detail_levels:
            logger.warning(f"無効な詳細レベル '{detail_level}' が指定されました。'medium'にフォールバック")
            detail_level = "medium"
        
        # 詳細レベルに応じたステップ数の設定
        max_steps = {
            "low": 3,
            "medium": 5, 
            "high": 8
        }.get(detail_level, 5)
        
        # 推論プロンプトの構築
        system_prompt = f"""あなたは論理的な推論を行う専門家です。指定された問題について、ステップバイステップで思考プロセスを示してください。
        
この分析では以下のガイドラインに従ってください：

1. 問題を慎重に理解し、重要な要素を特定してください。
2. 最大{max_steps}ステップで論理的思考プロセスを明示してください。
3. 各ステップを明確に区別し、「ステップ1:」「ステップ2:」などと番号付けしてください。
4. 最後に最終的な回答と、その確信度（0-100%）を提供してください。

出力は以下のJSON形式で行ってください：
{{
  "steps": [
    "ステップ1: ...",
    "ステップ2: ...",
    ...
  ],
  "answer": "最終的な回答",
  "confidence": 85,
  "reasoning_quality": "high/medium/low"
}}

詳細レベル: {detail_level}
"""

        # コンテキスト情報を含める場合
        user_prompt = question
        if context:
            user_prompt = f"問題: {question}\n\n追加コンテキスト:\n{context}"
        
        # 推論の実行
        response = self.chat_model.generate_response([
            Message(role="system", content=system_prompt),
            Message(role="user", content=user_prompt)
        ])
        
        # JSONレスポンスの抽出
        try:
            json_match = re.search(r'\{.*\}', response, re.DOTALL)
            if not json_match:
                logger.warning(f"JSONレスポンスが見つかりませんでした: {response}")
                # フォールバック: シンプルな回答を構造化
                return {
                    "steps": ["ステップ1: 問題分析", "ステップ2: 回答導出"],
                    "answer": response,
                    "confidence": 50,
                    "reasoning_quality": "low"
                }
                
            json_str = json_match.group(0)
            result = json.loads(json_str)
            
            # 結果の検証と整形
            if "steps" not in result or "answer" not in result:
                logger.warning("推論結果が不完全です")
                
            # 確信度の正規化（0-100の範囲内に収める）
            if "confidence" in result:
                result["confidence"] = max(0, min(100, result["confidence"]))
            else:
                result["confidence"] = 50  # デフォルト値
                
            return result
            
        except Exception as e:
            logger.error(f"推論結果の処理中にエラーが発生しました: {str(e)}")
            return {
                "steps": ["エラー: 推論処理に失敗しました"],
                "answer": "推論処理中にエラーが発生しました。もう一度お試しください。",
                "confidence": 0,
                "reasoning_quality": "low"
            }
    
    def evaluate_statement(self, 
                           statement: str, 
                           context: Optional[str] = None,
                           detail_level: str = "medium") -> Dict[str, Any]:
        """
        文の真偽を評価し、確信度を示す
        
        Args:
            statement: 評価する文
            context: 追加のコンテキスト情報（オプション）
            detail_level: 推論の詳細レベル（"low", "medium", "high"）
            
        Returns:
            Dict[str, Any]: 評価結果（真偽、確信度、根拠など）
        """
        # 詳細レベルの検証
        valid_detail_levels = ["low", "medium", "high"]
        if detail_level not in valid_detail_levels:
            detail_level = "medium"
        
        # 詳細レベルに応じた根拠の数を設定
        evidence_count = {
            "low": 1,
            "medium": 2,
            "high": 4
        }.get(detail_level, 2)
        
        # 評価プロンプトの構築
        system_prompt = f"""あなたは文の真偽を評価する専門家です。以下の文が真であるか偽であるかを判断し、その確信度と根拠を示してください。

評価では以下のガイドラインに従ってください：

1. 文を慎重に分析し、その真偽を判断してください。
2. 判断に至った根拠を{evidence_count}つ以上提示してください。
3. 確信度を0%（完全に偽）から100%（完全に真）のスケールで評価してください。
4. 判断に不確実性がある場合はそれを明示してください。

出力は以下のJSON形式で行ってください：
{{
  "is_true": true/false,
  "confidence": 75,
  "evidence": [
    "根拠1: ...",
    "根拠2: ...",
    ...
  ],
  "uncertainties": ["不確実性がある場合はここに記述"],
  "conclusion": "最終的な評価の要約"
}}

詳細レベル: {detail_level}
"""

        # コンテキスト情報を含める場合
        user_prompt = f"評価する文: {statement}"
        if context:
            user_prompt += f"\n\n追加コンテキスト:\n{context}"
        
        # 評価の実行
        response = self.chat_model.generate_response([
            Message(role="system", content=system_prompt),
            Message(role="user", content=user_prompt)
        ])
        
        # JSONレスポンスの抽出
        try:
            json_match = re.search(r'\{.*\}', response, re.DOTALL)
            if not json_match:
                logger.warning(f"JSONレスポンスが見つかりませんでした: {response}")
                # フォールバック: シンプルな回答を構造化
                return {
                    "is_true": None,
                    "confidence": 50,
                    "evidence": ["評価結果をJSONとして解析できませんでした"],
                    "uncertainties": ["解析エラー"],
                    "conclusion": response
                }
                
            json_str = json_match.group(0)
            result = json.loads(json_str)
            
            # 確信度の正規化
            if "confidence" in result:
                result["confidence"] = max(0, min(100, result["confidence"]))
                
            return result
            
        except Exception as e:
            logger.error(f"評価結果の処理中にエラーが発生しました: {str(e)}")
            return {
                "is_true": None,
                "confidence": 0,
                "evidence": ["評価処理中にエラーが発生しました"],
                "uncertainties": ["処理エラー"],
                "conclusion": "評価に失敗しました。もう一度お試しください。"
            }
    
    def compare_options(self, 
                        question: str, 
                        options: List[str],
                        criteria: Optional[List[str]] = None,
                        context: Optional[str] = None,
                        detail_level: str = "medium") -> Dict[str, Any]:
        """
        複数の選択肢を比較して最適なものを選択
        
        Args:
            question: 選択のための質問
            options: 比較する選択肢のリスト
            criteria: 評価基準（オプション）
            context: 追加のコンテキスト情報（オプション）
            detail_level: 推論の詳細レベル（"low", "medium", "high"）
            
        Returns:
            Dict[str, Any]: 比較結果（ランク付け、選択された選択肢、理由など）
        """
        # 詳細レベルの検証
        valid_detail_levels = ["low", "medium", "high"]
        if detail_level not in valid_detail_levels:
            detail_level = "medium"
        
        # 詳細レベルに応じた評価の詳細さを設定
        evaluation_detail = {
            "low": "簡潔",
            "medium": "標準", 
            "high": "詳細"
        }.get(detail_level, "標準")
        
        # 選択肢のフォーマット
        options_text = "\n".join([f"{i+1}. {option}" for i, option in enumerate(options)])
        
        # 評価基準のフォーマット
        criteria_text = ""
        if criteria and len(criteria) > 0:
            criteria_text = "評価基準:\n" + "\n".join([f"- {criterion}" for criterion in criteria])
        
        # 比較プロンプトの構築
        system_prompt = f"""あなたは選択肢を比較して最適な選択をする専門家です。以下の質問に対して、与えられた選択肢を比較し、最適なものを選んでください。

比較では以下のガイドラインに従ってください：

1. 各選択肢を{evaluation_detail}に評価してください。
2. 質問の文脈を考慮して選択肢を比較してください。
3. 各選択肢の長所と短所を分析してください。
4. 最終的に最適な選択肢を選び、その理由を説明してください。

出力は以下のJSON形式で行ってください：
{{
  "evaluations": [
    {{
      "option": "選択肢1",
      "pros": ["長所1", "長所2"],
      "cons": ["短所1", "短所2"],
      "score": 85
    }},
    ...
  ],
  "ranking": ["選択肢2", "選択肢1", "選択肢3"],
  "best_option": "選択肢2",
  "reasoning": "最適な選択肢を選んだ理由"
}}

詳細レベル: {detail_level}
"""

        # ユーザープロンプトの構築
        user_prompt = f"質問: {question}\n\n選択肢:\n{options_text}"
        if criteria_text:
            user_prompt += f"\n\n{criteria_text}"
        if context:
            user_prompt += f"\n\n追加コンテキスト:\n{context}"
        
        # 比較の実行
        response = self.chat_model.generate_response([
            Message(role="system", content=system_prompt),
            Message(role="user", content=user_prompt)
        ])
        
        # JSONレスポンスの抽出
        try:
            json_match = re.search(r'\{.*\}', response, re.DOTALL)
            if not json_match:
                logger.warning(f"JSONレスポンスが見つかりませんでした: {response}")
                # フォールバック: シンプルな回答を構造化
                return {
                    "evaluations": [{"option": option, "pros": [], "cons": [], "score": 50} for option in options],
                    "ranking": options,
                    "best_option": options[0] if options else None,
                    "reasoning": response
                }
                
            json_str = json_match.group(0)
            result = json.loads(json_str)
            
            return result
            
        except Exception as e:
            logger.error(f"比較結果の処理中にエラーが発生しました: {str(e)}")
            return {
                "evaluations": [],
                "ranking": [],
                "best_option": None,
                "reasoning": "比較処理中にエラーが発生しました。もう一度お試しください。"
            }
    
    def detect_reasoning_intent(self, user_message: str) -> Tuple[bool, str, Dict[str, Any]]:
        """
        ユーザーメッセージから推論に関する意図を検出
        
        Args:
            user_message: ユーザーのメッセージ
            
        Returns:
            Tuple[bool, str, Dict[str, Any]]: (推論意図があるか, 推論タイプ, パラメータ)
        """
        logger.debug(f"推論意図検出: '{user_message}'")
        
        # 推論キーワードの確認
        reasoning_keywords = ["理由を説明して", "分析して", "考えて", "推論して", "ステップバイステップで", 
                              "考察して", "論理的に説明して", "なぜ", "どうして", "証明して"]
        
        # 詳細レベルキーワード
        detail_keywords = {
            "詳しく": "high",
            "詳細に": "high",
            "簡潔に": "low",
            "簡単に": "low",
            "要点だけ": "low"
        }
        
        # 詳細レベルの検出
        detail_level = "medium"  # デフォルト
        for keyword, level in detail_keywords.items():
            if keyword in user_message:
                detail_level = level
                break
        
        # 推論意図の検出プロンプト
        detect_prompt = """あなたはユーザーメッセージから推論の意図を特定するアシスタントです。
以下のメッセージから推論の意図を検出し、JSONフォーマットで返してください。

ユーザーメッセージ: {}

以下のような表現が推論意図を示します:
1. ステップバイステップで考えてほしい要求
2. 理由を説明してほしい要求
3. 論理的分析や証明を求める表現
4. オプションの比較や評価を求める表現
5. 文の真偽の評価を求める表現

出力はJSON形式で:
{{
  "is_reasoning_intent": true/false,
  "reasoning_type": "step_by_step/evaluate_statement/compare_options",
  "parameters": {{
    "question": "推論のための質問・問題",
    "context": "追加コンテキスト（あれば）",
    "detail_level": "low/medium/high",
    "options": ["選択肢1", "選択肢2"] // compare_optionsの場合のみ
  }}
}}
""".format(user_message)

        # モデルに推論させる
        response = self.chat_model.generate_response([
            Message(role="system", content=detect_prompt),
            Message(role="user", content=user_message)
        ])
        
        # JSONを抽出
        json_match = re.search(r'\{.*\}', response, re.DOTALL)
        if not json_match:
            logger.warning(f"推論意図検出: JSONが見つかりませんでした: {response}")
            return False, "", {}
            
        json_str = json_match.group(0)
        
        try:
            result = json.loads(json_str)
            
            # 結果を整形
            is_reasoning_intent = result.get("is_reasoning_intent", False)
            reasoning_type = result.get("reasoning_type", "")
            parameters = result.get("parameters", {})
            
            # 詳細レベルが指定されていなければ検出したものを適用
            if "detail_level" not in parameters:
                parameters["detail_level"] = detail_level
            
            if is_reasoning_intent:
                logger.info(f"推論意図を検出: タイプ='{reasoning_type}', パラメータ={parameters}")
            else:
                logger.debug("推論意図なし")
                
            return is_reasoning_intent, reasoning_type, parameters
            
        except Exception as e:
            logger.error(f"JSONのパース中にエラーが発生しました: {str(e)}")
            return False, "", {}

    def format_reasoning_result(self, reasoning_type: str, result: Dict[str, Any]) -> str:
        """
        推論結果をユーザーフレンドリーな形式に整形
        
        Args:
            reasoning_type: 推論タイプ
            result: 推論結果
            
        Returns:
            str: 整形された結果
        """
        if reasoning_type == "step_by_step":
            steps = result.get("steps", [])
            answer = result.get("answer", "回答が生成できませんでした")
            confidence = result.get("confidence", 0)
            
            formatted = "## ステップバイステップ推論\n\n"
            for step in steps:
                formatted += f"{step}\n\n"
            
            formatted += f"## 最終回答\n\n{answer}\n\n"
            formatted += f"**確信度**: {confidence}%"
            
            return formatted
            
        elif reasoning_type == "evaluate_statement":
            is_true = result.get("is_true")
            confidence = result.get("confidence", 0)
            evidence = result.get("evidence", [])
            uncertainties = result.get("uncertainties", [])
            conclusion = result.get("conclusion", "評価結果がありません")
            
            # 真偽の表示
            truth_status = "真" if is_true else "偽" if is_true is not None else "不明"
            
            formatted = f"## 文の評価: {truth_status} (確信度: {confidence}%)\n\n"
            
            # 根拠の表示
            formatted += "### 根拠:\n\n"
            for item in evidence:
                formatted += f"- {item}\n"
            
            # 不確実性の表示（ある場合）
            if uncertainties and len(uncertainties) > 0:
                formatted += "\n### 不確実性:\n\n"
                for item in uncertainties:
                    formatted += f"- {item}\n"
            
            # 結論
            formatted += f"\n### 結論:\n\n{conclusion}"
            
            return formatted
            
        elif reasoning_type == "compare_options":
            evaluations = result.get("evaluations", [])
            ranking = result.get("ranking", [])
            best_option = result.get("best_option", "")
            reasoning = result.get("reasoning", "")
            
            formatted = "## 選択肢の比較\n\n"
            
            # 各選択肢の評価
            formatted += "### 各選択肢の評価:\n\n"
            for eval in evaluations:
                option = eval.get("option", "")
                pros = eval.get("pros", [])
                cons = eval.get("cons", [])
                score = eval.get("score", 0)
                
                formatted += f"#### {option} (スコア: {score}/100)\n\n"
                
                if pros:
                    formatted += "長所:\n"
                    for pro in pros:
                        formatted += f"- {pro}\n"
                    formatted += "\n"
                
                if cons:
                    formatted += "短所:\n"
                    for con in cons:
                        formatted += f"- {con}\n"
                    formatted += "\n"
            
            # ランキング
            if ranking:
                formatted += "### ランキング:\n\n"
                for i, option in enumerate(ranking, 1):
                    formatted += f"{i}. {option}\n"
                formatted += "\n"
            
            # 最良の選択肢
            if best_option:
                formatted += f"### 最適な選択肢: {best_option}\n\n"
            
            # 理由
            if reasoning:
                formatted += f"### 理由:\n\n{reasoning}"
            
            return formatted
        
        else:
            return f"推論結果: {json.dumps(result, ensure_ascii=False, indent=2)}"

# シングルトンインスタンスを取得する関数
def get_reasoning_engine() -> ReasoningEngine:
    """
    ReasoningEngineのインスタンスを取得する
    """
    return ReasoningEngine()
