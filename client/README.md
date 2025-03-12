# Gemma 3 12B TypeScript クライアント

このパッケージは、Gemma 3 12B API サーバーと通信するための TypeScript クライアントライブラリを提供します。

## インストール

```bash
npm install @your-org/gemma-3-12b-client
# または
yarn add @your-org/gemma-3-12b-client
```

## 使用方法

```typescript
import { GemmaClient } from '@your-org/gemma-3-12b-client';

// クライアントを初期化
const client = new GemmaClient({
  baseUrl: 'http://localhost:8000',
});

// テキスト生成
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

## API リファレンス

詳細な API リファレンスについては、生成されたドキュメントを参照してください。