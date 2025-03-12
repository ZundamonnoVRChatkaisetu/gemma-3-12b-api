# Gemma 3 12B 管理ダッシュボード

このディレクトリには、Gemma 3 12B API サーバーの管理ダッシュボードが含まれています。

## 機能

- モデルパフォーマンスのモニタリング
- API 使用状況の追跡
- テキスト生成のテストインターフェース
- システム設定の管理

## セットアップ

### 前提条件

- Node.js 20.0.0 以上
- npm または yarn

### インストール

```bash
npm install
# または
yarn install
```

### 開発サーバーの起動

```bash
npm run dev
# または
yarn dev
```

### 本番ビルド

```bash
npm run build
npm start
# または
yarn build
yarn start
```

ダッシュボードは `http://localhost:3000` で実行されます。