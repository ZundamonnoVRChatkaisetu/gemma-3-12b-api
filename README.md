# Gemma 3 カスタムチャットインターフェース

Ollamaを使って`gemma3:27b`モデルを利用するカスタムチャットインターフェースです。ファイル操作や推論機能を備えています。

## 主な機能

1. **ChatGPTスタイルのインターフェース**
   - 継続的な会話履歴
   - 自然な対話体験
   - ストリーミングレスポンス

2. **Ollamaとの統合**
   - `gemma3:27b`モデルをローカルで実行
   - Ollama APIを利用したシームレスな統合
   - 高速なレスポンス

3. **ファイル操作機能**
   - Windowsファイルシステムのブラウズ
   - ファイルの作成・読み込み・編集・削除
   - テキストファイルの内容編集
   - ディレクトリ管理

4. **推論機能**
   - ステップバイステップの思考プロセス
   - 複雑な問題解決
   - 確信度評価

## プロジェクト構造

```
./
├── api/                  # Python FastAPI サーバー
│   ├── app/              # API アプリケーション
│   │   ├── core/         # 設定、依存関係等
│   │   ├── models/       # モデル関連
│   │   └── routers/      # API エンドポイント
│   ├── requirements.txt  # Python 依存関係
│   └── Dockerfile        # API サーバーのコンテナ化
└── dashboard/            # Next.js チャットインターフェース
    ├── src/              # ソースコード
    │   ├── app/          # ページコンポーネント
    │   ├── components/   # UI コンポーネント
    │   └── lib/          # ユーティリティ
    ├── package.json      # 依存関係
    └── tsconfig.json     # TypeScript 設定
```

## セットアップ方法

### 1. 前提条件

- Python 3.10以上
- Node.js 20.0.0以上
- [Ollama](https://ollama.ai/)のインストール
- `gemma3:27b`モデルを事前にOllamaにインストール済み

### 2. Ollamaの準備

Ollamaをインストールし、Gemma 3モデルをダウンロードしてください：

```bash
# Ollamaのインストールは公式サイトを参照
# https://ollama.ai/

# Gemma 3モデルのダウンロード
ollama pull gemma3:27b
```

### 3. APIサーバーのセットアップ

```bash
cd api
python -m venv venv
source venv/bin/activate  # Linux/Macの場合
# または
venv\Scripts\activate     # Windowsの場合

pip install -r requirements.txt
cp .env.example .env
```

必要に応じて`.env`ファイルを編集してください：
```
USE_OLLAMA=True
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL_NAME=gemma3:27b
```

### 4. APIサーバーの起動

```bash
uvicorn app.main:app --reload
```

### 5. ダッシュボードのセットアップ

```bash
cd dashboard
npm install
npm run dev
```

これで http://localhost:3000 にアクセスすれば、チャットインターフェースが利用できます。

## カスタマイズ

### ファイル操作のベースディレクトリ変更

セキュリティのため、デフォルトではユーザーのホームディレクトリのみにアクセスが制限されています。これを変更するには、`api/app/routers/file_operations.py`の`BASE_DIR`変数を編集してください。

### モデルの設定変更

`.env`ファイルで、以下の設定を変更できます：

- `USE_OLLAMA`: Ollamaを使用するかどうか（`True`/`False`）
- `OLLAMA_MODEL_NAME`: 使用するOllamaモデル名
- `MAX_NEW_TOKENS`: 生成する最大トークン数
- `DEFAULT_TEMPERATURE`: 生成のランダム性（高いほどランダム）

## Hugging Face モードへの切り替え

Ollamaではなく、Hugging Faceのモデルを使用したい場合は、`.env`ファイルで設定を変更してください：

```
USE_OLLAMA=False
HF_MODEL_ID=google/gemma-3-12b-it
HF_TOKEN=your_huggingface_token_here
```

また、`requirements.txt`の中の関連ライブラリのコメントを解除し、インストールしてください：

```bash
pip install accelerate torch transformers sentencepiece langchain bitsandbytes optimum
```

## ライセンス

このプロジェクトのコードはMITライセンスで提供されています。Gemmaモデル自体はGoogleのライセンスが適用されます。
