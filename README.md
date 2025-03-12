# Gemma 3 12B API

ローカルに Google Gemma 3 12B モデルを構築し、API として利用できるようにするプロジェクトです。

## 概要

このプロジェクトでは、以下の機能を提供します：

1. Google の Gemma 3 12B モデルをローカル環境で実行
2. FastAPI を使用したモデルの API サーバー
3. TypeScript クライアントライブラリ
4. Next.js ベースの管理ダッシュボード

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
├── client/               # TypeScript クライアントライブラリ
│   ├── src/              # ソースコード
│   ├── package.json      # 依存関係
│   └── tsconfig.json     # TypeScript 設定
└── dashboard/            # Next.js 管理ダッシュボード
    ├── src/              # ソースコード
    │   ├── app/          # ページコンポーネント
    │   ├── components/   # UI コンポーネント
    │   └── lib/          # ユーティリティ
    ├── package.json      # 依存関係
    └── tsconfig.json     # TypeScript 設定
```

## インストール方法

詳細なインストール手順については、各ディレクトリの README を参照してください。

## ライセンス

Gemma は Google によって開発され、[特定のライセンス条件](https://huggingface.co/google/gemma-3-12b-it) の下で提供されています。このリポジトリのコードは MIT ライセンスの下で提供されていますが、モデル自体の使用には Google の条件が適用されます。