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
    this.baseUrl = typeof window !== 'undefined' 
      ? `${window.location.origin}/api/v1/reasoning`
      : `${API_BASE_URL}/api/v1/reasoning`;
  }

  /**
   * ステップバイステップ推論を実行する
   */
  async performStepByStepReasoning(
    request: StepByStepReasoningRequest
  ): Promise<ReasoningResponse<StepByStepResult>> {
    try {
      const response = await fetch(`${this.baseUrl}/step-by-step`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.detail || `エラーが発生しました: ${response.status}`
        );
      }

      return await response.json();
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
      const response = await fetch(`${this.baseUrl}/evaluate-statement`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.detail || `エラーが発生しました: ${response.status}`
        );
      }

      return await response.json();
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
      const response = await fetch(`${this.baseUrl}/compare-options`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.detail || `エラーが発生しました: ${response.status}`
        );
      }

      return await response.json();
    } catch (error) {
      console.error('選択肢の比較中にエラー:', error);
      throw error;
    }
  }
}

// サービスのシングルトンインスタンスをエクスポート
export const reasoningService = new ReasoningService();
