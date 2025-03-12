# セットアップガイド

## 1. ローカル環境への Gemma 3 12B のセットアップ

### 1.1 前提条件

- CUDA対応グラフィックカード（NVIDIA GPU、VRAM 24GB以上推奨）
- Python 3.10以上
- Node.js 20.0.0以上
- [Hugging Face](https://huggingface.co/)アカウント

### 1.2 Hugging Faceの設定

1. [Hugging Face](https://huggingface.co/)にアカウント登録・ログインする
2. [Gemma 3 12B モデル](https://huggingface.co/google/gemma-3-12b-it)にアクセスし、ライセンスに同意する
3. [設定ページ](https://huggingface.co/settings/tokens)から、新しいAPIトークンを生成する
4. 生成したトークンを安全な場所に保存しておく

### 1.3 API サーバーのセットアップ

1. Python 仮想環境を作成

```bash
cd api
python -m venv venv
source venv/bin/activate  # Linux/Mac
# または
venv\Scripts\activate  # Windows
```

2. 依存関係をインストール

```bash
pip install -r requirements.txt
```

3. 環境変数ファイルを設定

```bash
cp .env.example .env
```

4. `.env` ファイルを編集して、Hugging Face トークンを設定

```
HF_TOKEN=あなたのHuggingFaceトークン
```

5. API サーバーを起動

```bash
uvicorn app.main:app --reload
```

サーバーは `http://localhost:8000` で実行され、API ドキュメントは `http://localhost:8000/docs` で確認できます。

### 1.4 TypeScriptクライアントのセットアップ

1. 依存関係をインストール

```bash
cd client
npm install
# または
yarn install
```

2. クライアントをビルド

```bash
npm run build
# または
yarn build
```

### 1.5 ダッシュボードのセットアップ

1. 依存関係をインストール

```bash
cd dashboard
npm install
# または
yarn install
```

2. 開発サーバーを起動

```bash
npm run dev
# または
yarn dev
```

ダッシュボードは `http://localhost:3000` で実行されます。

## 2. APIとしての使用方法

### 2.1 RESTful API

APIサーバーが起動したら、以下のエンドポイントが利用可能になります：

- `POST /api/v1/generate` - テキスト生成
- `POST /api/v1/embeddings` - テキスト埋め込み
- `GET /health` - ヘルスチェック
- `GET /health/model` - モデル情報

詳細なAPIドキュメントは `http://localhost:8000/docs` で確認できます。

### 2.2 TypeScriptクライアント

TypeScriptプロジェクトでAPIを利用する場合は、クライアントパッケージをインストールして使用できます。

```typescript
import { GemmaClient } from '@your-org/gemma-3-12b-client';

const client = new GemmaClient({
  baseUrl: 'http://localhost:8000',
});

async function generateText() {
  const response = await client.generateText({
    prompt: 'こんにちは、Gemma！',
    max_tokens: 500,
    temperature: 0.7,
  });
  
  console.log(response.text);
}

generateText();
```

## 3. Dockerを使用したデプロイ

APIサーバーをDockerコンテナ化してデプロイするには：

```bash
cd api
docker build -t gemma-3-12b-api .
docker run -p 8000:8000 -e HF_TOKEN=あなたのHuggingFaceトークン gemma-3-12b-api
```

## 4. 注意事項

- モデルは初回実行時にダウンロードされるため、時間がかかる場合があります
- モデルを4ビット量子化で実行する設定がデフォルトです（メモリ使用量を削減）
- 高品質な結果を得るためには、より高い精度（量子化なし）で実行することも可能ですが、より多くのGPUメモリが必要です
- APIの使用には、利用者側でGemmaモデルのライセンス条項を守る必要があります
