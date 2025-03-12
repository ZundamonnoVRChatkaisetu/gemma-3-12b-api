import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { createParser, ParsedEvent, ReconnectInterval } from 'eventsource-parser';

import {
  GemmaClientOptions,
  GenerateTextParams,
  GenerateTextResponse,
  GetEmbeddingParams,
  GetEmbeddingResponse,
  ModelInfoResponse,
  HealthResponse,
} from './types';

/**
 * Gemma API クライアントクラス
 */
export class GemmaClient {
  private client: AxiosInstance;
  private baseUrl: string;
  private apiKey?: string;

  /**
   * Gemma API クライアントを初期化する
   *
   * @param options クライアントオプション
   */
  constructor(options: GemmaClientOptions = {}) {
    this.baseUrl = options.baseUrl || 'http://localhost:8000';
    this.apiKey = options.apiKey;

    const config: AxiosRequestConfig = {
      baseURL: this.baseUrl,
      timeout: options.timeout || 30000,
      headers: {},
    };

    if (this.apiKey) {
      config.headers = {
        ...config.headers,
        'X-API-Key': this.apiKey,
      };
    }

    this.client = axios.create(config);
  }

  /**
   * テキストを生成する
   *
   * @param params テキスト生成パラメータ
   * @returns 生成されたテキストとその使用量情報
   */
  async generateText(params: GenerateTextParams): Promise<GenerateTextResponse> {
    // ストリーミングモードの場合、別の処理を行う
    if (params.stream) {
      // テキストを収集するためのバッファ
      const textBuffer: string[] = [];

      await this.generateTextStream(params, (text) => {
        textBuffer.push(text);
      });

      // 簡易的な使用量情報を作成
      const combinedText = textBuffer.join('');
      return {
        text: combinedText,
        usage: {
          prompt_tokens: 0, // 正確なトークン数は取得できない
          completion_tokens: 0,
          total_tokens: 0,
          time_seconds: 0,
        },
      };
    }

    const response = await this.client.post<GenerateTextResponse>(
      '/api/v1/generate',
      params
    );

    return response.data;
  }

  /**
   * ストリーミングモードでテキストを生成する
   *
   * @param params テキスト生成パラメータ
   * @param onText テキストチャンクを受け取るコールバック
   */
  async generateTextStream(
    params: GenerateTextParams,
    onText: (text: string) => void
  ): Promise<void> {
    // stream パラメータを強制的に true に設定
    const streamParams = { ...params, stream: true };

    const response = await this.client.post('/api/v1/generate', streamParams, {
      responseType: 'stream',
      headers: {
        Accept: 'text/event-stream',
      },
    });

    const parser = createParser((event: ParsedEvent | ReconnectInterval) => {
      if (event.type === 'event') {
        const data = event.data;
        if (data === '[DONE]') {
          return;
        }
        try {
          onText(data);
        } catch (e) {
          console.error('Error parsing SSE data:', e);
        }
      }
    });

    // responseのデータをパースしてコールバックを呼び出す
    const stream = response.data;
    return new Promise<void>((resolve, reject) => {
      stream.on('data', (chunk: Buffer) => {
        const chunkText = chunk.toString();
        parser.feed(chunkText);
      });

      stream.on('end', () => {
        resolve();
      });

      stream.on('error', (err: Error) => {
        reject(err);
      });
    });
  }

  /**
   * テキストの埋め込みベクトルを取得する
   *
   * @param params 埋め込みパラメータ
   * @returns 埋め込みベクトルとその使用量情報
   */
  async getEmbedding(params: GetEmbeddingParams): Promise<GetEmbeddingResponse> {
    const response = await this.client.post<GetEmbeddingResponse>(
      '/api/v1/embeddings',
      params
    );

    return response.data;
  }

  /**
   * モデル情報を取得する
   *
   * @returns モデル情報
   */
  async getModelInfo(): Promise<ModelInfoResponse> {
    const response = await this.client.get<ModelInfoResponse>('/health/model');
    return response.data;
  }

  /**
   * API サーバーのヘルスステータスを取得する
   *
   * @returns ヘルスステータス
   */
  async getHealth(): Promise<HealthResponse> {
    const response = await this.client.get<HealthResponse>('/health');
    return response.data;
  }
}
