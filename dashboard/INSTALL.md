# Gemma 3 チャットインターフェース - インストール手順

このドキュメントでは、Gemma 3 チャットインターフェースのフロントエンドとバックエンドのインストール手順を説明します。

## 前提条件

- Node.js 20.0.0以上
- Python 3.10以上
- Ollama（最新版）とGemma 3モデル
- Git

## フロントエンドのインストール（Next.js）

### 1. リポジトリのクローン

```bash
git clone https://github.com/ZundamonnoVRChatkaisetu/gemma-3-12b-api.git
cd gemma-3-12b-api/dashboard
```

### 2. 依存関係のインストール

```bash
npm install
```

必須のRadix UI依存関係がすべて含まれていることを確認してください：

```bash
npm install @radix-ui/react-slider @radix-ui/react-toast @radix-ui/react-label @radix-ui/react-switch @radix-ui/react-checkbox @radix-ui/react-collapsible @radix-ui/react-dialog @radix-ui/react-dropdown-menu @radix-ui/react-radio-group @radix-ui/react-select @radix-ui/react-slot @radix-ui/react-tabs @radix-ui/react-tooltip
```

### 3. 開発サーバーの起動

```bash
npm run dev
```

これで、ブラウザで http://localhost:3000 にアクセスできます。

## バックエンドのインストール（Python FastAPI）

### 1. Pythonの仮想環境を作成（推奨）

```bash
cd api
python -m venv venv
```

### 2. 仮想環境をアクティベート

Windows:
```bash
venv\Scripts\activate
```

macOS/Linux:
```bash
source venv/bin/activate
```

### 3. 依存関係のインストール

```bash
pip install -r requirements.txt
```

### 4. 環境変数の設定

`.env`ファイルをapi/ディレクトリに作成し、以下のように設定します：

```
USE_OLLAMA=True
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL_NAME=gemma3:27b
MAX_NEW_TOKENS=1000
DEFAULT_TEMPERATURE=0.3
DEFAULT_TOP_P=0.95
DEFAULT_TOP_K=40
API_AUTH_REQUIRED=False
```

GitHub機能を使用する場合は、GitHub APIトークンも追加します：

```
GITHUB_API_TOKEN=your_github_token
```

### 5. APIサーバーの起動

```bash
cd api
uvicorn app.main:app --reload
```

これで、APIサーバーがhttp://localhost:8000で起動します。

## Ollamaの設定

Gemma 3モデルをダウンロードしてOllamaで実行します：

```bash
ollama pull gemma3:27b
```

## 動作確認

1. APIサーバーが起動していることを確認（http://localhost:8000/docs で確認可能）
2. フロントエンドが起動していることを確認（http://localhost:3000）
3. Ollamaサービスが実行中であることを確認

すべてが正常に動作していれば、チャットインターフェースが使用可能になります。

## トラブルシューティング

### フロントエンド関連

- **依存関係エラー**: 必要なRadix UI依存関係がすべてインストールされているか確認してください。
- **ビルドエラー**: `.tsx`ファイルにJSX構文が含まれていることを確認してください。
- **APIエラー**: ブラウザの開発者ツールでネットワークリクエストを確認し、APIサーバーの接続問題を診断してください。

### バックエンド関連

- **Ollamaエラー**: Ollamaサービスが実行中であり、モデルが正しくロードされていることを確認してください。
- **モジュールが見つからないエラー**: 必要なすべての依存関係がインストールされていることを確認してください。
- **ポート競合**: 8000番ポートが利用可能であることを確認してください。

### 更新が必要な場合

リポジトリが更新された場合は、以下のコマンドで最新バージョンを取得してください：

```bash
git pull
npm install  # フロントエンド依存関係の更新
pip install -r requirements.txt  # バックエンド依存関係の更新
```
