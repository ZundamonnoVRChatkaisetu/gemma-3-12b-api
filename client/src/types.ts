/**
 * Gemma API クライアントの設定オプション
 */
export interface GemmaClientOptions {
  /** API のベース URL、デフォルトは 'http://localhost:8000' */
  baseUrl?: string;
  /** API キー (認証が必要な場合) */
  apiKey?: string;
  /** リクエストのタイムアウト（ミリ秒）、デフォルトは 30000 */
  timeout?: number;
}

/**
 * テキスト生成リクエストのパラメータ
 */
export interface GenerateTextParams {
  /** 入力プロンプト */
  prompt: string;
  /** 生成する最大トークン数 (1-4096) */
  max_tokens?: number;
  /** 温度パラメータ (0.0-2.0)、高いほどランダム */
  temperature?: number;
  /** top-p サンプリングのパラメータ (0.0-1.0) */
  top_p?: number;
  /** top-k サンプリングのパラメータ (1-100) */
  top_k?: number;
  /** ストリーミング生成を行うかどうか */
  stream?: boolean;
}

/**
 * テキスト生成レスポンス
 */
export interface GenerateTextResponse {
  /** 生成されたテキスト */
  text: string;
  /** 使用量情報 */
  usage: {
    /** プロンプトのトークン数 */
    prompt_tokens: number;
    /** 生成されたテキストのトークン数 */
    completion_tokens: number;
    /** 合計トークン数 */
    total_tokens: number;
    /** 処理時間（秒） */
    time_seconds: number;
  };
}

/**
 * 埋め込みリクエストのパラメータ
 */
export interface GetEmbeddingParams {
  /** 埋め込みを取得するテキスト */
  text: string;
}

/**
 * 埋め込みレスポンス
 */
export interface GetEmbeddingResponse {
  /** テキストの埋め込みベクトル */
  embedding: number[];
  /** 使用量情報 */
  usage: {
    /** プロンプトのトークン数 */
    prompt_tokens: number;
    /** 合計トークン数 */
    total_tokens: number;
    /** 処理時間（秒） */
    time_seconds: number;
  };
}

/**
 * モデル情報レスポンス
 */
export interface ModelInfoResponse {
  /** モデルの状態 */
  status: string;
  /** モデル ID */
  model_id: string;
  /** モデルの種類 */
  model_type?: string;
  /** トークナイザーの種類 */
  tokenizer_type?: string;
  /** デバイス */
  device?: string;
  /** パラメータ情報 */
  parameters?: Record<string, any>;
}

/**
 * ヘルスチェックレスポンス
 */
export interface HealthResponse {
  /** サービスの状態 */
  status: string;
  /** API バージョン */
  version: string;
  /** モデルが読み込まれているかどうか */
  model_loaded: boolean;
}
