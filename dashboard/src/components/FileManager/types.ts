"use client"

// 型定義と他の部分は以前と同じ

// デバッグ用に明示的なポート指定
export const API_BASE_URL = (() => {
  if (typeof window !== 'undefined') {
    // フロントエンドから呼び出す場合
    const port = window.location.port || '8000'
    return `${window.location.protocol}//${window.location.hostname}:${port}`
  }
  
  // サーバーサイドレンダリング時のフォールバック
  return process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000'
})()

// 他の定義は変更なし
