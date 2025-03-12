FROM nvidia/cuda:12.2.0-devel-ubuntu22.04

# 非対話的インストールの設定
ENV DEBIAN_FRONTEND=noninteractive

# 基本的なパッケージのインストール
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    python3-venv \
    git \
    wget \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# 作業ディレクトリの設定
WORKDIR /app

# 依存関係のコピーとインストール
COPY requirements.txt .
RUN pip3 install --no-cache-dir -r requirements.txt

# アプリケーションコードのコピー
COPY . .

# モデルのダウンロードとキャッシュを行うための環境変数
ENV HF_TOKEN=""
ENV MODEL_CACHE_DIR="/app/models"

# ポートの公開
EXPOSE 8000

# アプリケーションの実行
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
