# Gemma 3 12B API サーバー

このディレクトリには、FastAPI を使用した Gemma 3 12B モデルの API サーバーが含まれています。

## セットアップ

### 前提条件

- Python 3.10 以上
- CUDA 対応 GPU（推奨：NVIDIA GPU、VRAM 24GB 以上）
- [Hugging Face アカウント](https://huggingface.co/) と Gemma モデルへのアクセス権

### インストール

1. 仮想環境を作成して有効化する：

```bash
python -m venv venv
source venv/bin/activate  # Linux/Mac
# または
venv\Scripts\activate  # Windows
```

2. 依存関係をインストールする：

```bash
pip install -r requirements.txt
```

3. Hugging Face から認証トークンを取得する：

- [Hugging Face](https://huggingface.co/settings/tokens) にアクセス
- 新しいトークンを生成
- `.env` ファイルにトークンを追加：

```
HF_TOKEN=your_token_here
```

### 起動方法

```bash
uvicorn app.main:app --reload
```

サーバーは `http://localhost:8000` で実行されます。API ドキュメントは `http://localhost:8000/docs` で確認できます。