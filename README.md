# Gemma 3 12B カスタムチャットインターフェース

ローカルにGoogle Gemma 3 12Bモデルを構築し、ファイル操作や推論機能を備えたカスタムAPIとして利用できるプロジェクトです。

![Gemma 3 12B API](https://raw.githubusercontent.com/ZundamonnoVRChatkaisetu/gemma-3-12b-api/main/dashboard/public/screenshot.png)

## 主な機能

1. **ChatGPTスタイルのインターフェース**
   - 継続的な会話履歴
   - 自然な対話体験
   - ストリーミングレスポンス

2. **ファイル操作機能**
   - Windowsファイルシステムのブラウズ
   - ファイルの作成・読み込み・編集・削除
   - テキストファイルの内容編集
   - ディレクトリ管理

3. **推論機能**
   - ステップバイステップの思考プロセス
   - 複雑な問題解決
   - 確信度評価

4. **完全にローカル**
   - すべての処理がローカル環境で完結
   - データプライバシーの確保
   - インターネット接続不要（初回ダウンロード後）

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
└── dashboard/            # Next.js 管理ダッシュボード
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
- CUDA対応GPU（推奨：NVIDIA GPU、VRAM 24GB以上）
- Hugging Faceアカウント（Gemmaモデルの利用に必要）

### 2. APIサーバーのセットアップ

```bash
cd api
python -m venv venv
source venv/bin/activate  # Linux/Macの場合
# または
venv\Scripts\activate     # Windowsの場合

pip install -r requirements.txt
cp .env.example .env
```

.envファイルを編集して、HuggingFaceのトークンを追加します：
```
HF_TOKEN=あなたのHuggingFaceトークン
```

### 3. APIサーバーの起動

```bash
uvicorn app.main:app --reload
```

初回起動時には、Gemma 3 12Bモデル（約12GB）がダウンロードされます。

### 4. ダッシュボードのセットアップ

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

モデルの動作を調整するには、`api/app/.env`ファイルを編集します：

- `USE_4BIT_QUANTIZATION`: メモリ使用量削減のための量子化（デフォルトはTrue）
- `MAX_NEW_TOKENS`: 生成する最大トークン数
- `DEFAULT_TEMPERATURE`: 生成のランダム性（高いほどランダム）

## ライセンス

このプロジェクトのコードはMITライセンスで提供されています。Gemmaモデル自体はGoogleのライセンスが適用されます。詳細は[Gemma 3のライセンス](https://huggingface.co/google/gemma-3-12b-it)をご確認ください。
