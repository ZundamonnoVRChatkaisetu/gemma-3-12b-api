import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Gemma 3 チャットインターフェース',
  description: 'Google Gemma 3 12B モデルとチャットするインターフェース',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  )
}
