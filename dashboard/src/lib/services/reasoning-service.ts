import { API_BASE_URL } from "@/components/FileManager/types";

export type DetailLevel = 'low' | 'medium' | 'high';

export interface StepByStepReasoningRequest {
  question: string;
  context?: string;
  detail_level?: DetailLevel;
}

export interface EvaluateStatementRequest {
  statement: string;
  context?: string;
  detail_level?: DetailLevel;
}

export interface CompareOptionsRequest {
  question: string;
  options: string[];
  criteria?: string[];
  context?: string;
  detail_level?: DetailLevel;
}

export interface StepByStepResult {
  steps: string[];
  answer: string;
  confidence: number;
  reasoning_quality: 'high' | 'medium' | 'low';
}

export interface EvaluationResult {
  is_true: boolean | null;
  confidence: number;
  evidence: string[];
  uncertainties: string[];
  conclusion: string;
}

export interface ComparisonResult {
  evaluations: {
    option: string;
    pros: string[];
    cons: string[];
    score: number;
  }[];
  ranking: string[];
  best_option: string;
  reasoning: string;
}

export interface ReasoningResponse<T> {
  result: T;
  time_seconds: number;
}

class ReasoningService {
  private baseUrl: string;

  constructor() {
    // APIのベースURLを設定
    // 明示的にポート番号とプロトコルを含めたAPIベースURLを設定
    this.baseUrl = "http://localhost:8000/api/v1";
    console.log("Reasoning API baseUrl:", this.baseUrl);
  }

  /**
   * ステップバイステップ推論を実行する
   */
  async performStepByStepReasoning(
    request: StepByStepReasoningRequest
  ): Promise<ReasoningResponse<StepByStepResult>> {
    try {
      console.log(`APIリクエスト: ${this.baseUrl}/reasoning/step-by-step`);
      const response = await fetch(`${this.baseUrl}/reasoning/step-by-step`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        let errorMessage = `エラーが発生しました: ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.detail || errorMessage;
        } catch (parseError) {
          // JSONとして解析できない場合はテキストを取得
          const errorText = await response.text();
          console.error('エラーレスポンスのテキスト:', errorText);
          errorMessage = `APIエラー: ${response.status} - ${errorText.slice(0, 200)}`;
        }
        throw new Error(errorMessage);
      }

      const jsonResponse = await response.json();
      console.log("API応答:", jsonResponse);
      return jsonResponse;
    } catch (error) {
      console.error('ステップバイステップ推論中にエラー:', error);
      throw error;
    }
  }

  /**
   * 文の真偽を評価する
   */
  async evaluateStatement(
    request: EvaluateStatementRequest
  ): Promise<ReasoningResponse<EvaluationResult>> {
    try {
      console.log(`APIリクエスト: ${this.baseUrl}/reasoning/evaluate-statement`);
      const response = await fetch(`${this.baseUrl}/reasoning/evaluate-statement`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        let errorMessage = `エラーが発生しました: ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.detail || errorMessage;
        } catch (parseError) {
          // JSONとして解析できない場合はテキストを取得
          const errorText = await response.text();
          console.error('エラーレスポンスのテキスト:', errorText);
          errorMessage = `APIエラー: ${response.status} - ${errorText.slice(0, 200)}`;
        }
        throw new Error(errorMessage);
      }

      const jsonResponse = await response.json();
      console.log("API応答:", jsonResponse);
      return jsonResponse;
    } catch (error) {
      console.error('文の評価中にエラー:', error);
      throw error;
    }
  }

  /**
   * 選択肢を比較する
   */
  async compareOptions(
    request: CompareOptionsRequest
  ): Promise<ReasoningResponse<ComparisonResult>> {
    try {
      console.log(`APIリクエスト: ${this.baseUrl}/reasoning/compare-options`);
      const response = await fetch(`${this.baseUrl}/reasoning/compare-options`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        let errorMessage = `エラーが発生しました: ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.detail || errorMessage;
        } catch (parseError) {
          // JSONとして解析できない場合はテキストを取得
          const errorText = await response.text();
          console.error('エラーレスポンスのテキスト:', errorText);
          errorMessage = `APIエラー: ${response.status} - ${errorText.slice(0, 200)}`;
        }
        throw new Error(errorMessage);
      }

      const jsonResponse = await response.json();
      console.log("API応答:", jsonResponse);
      return jsonResponse;
    } catch (error) {
      console.error('選択肢の比較中にエラー:', error);
      throw error;
    }
  }
}

// サービスのシングルトンインスタンスをエクスポート
export const reasoningService = new ReasoningService();
