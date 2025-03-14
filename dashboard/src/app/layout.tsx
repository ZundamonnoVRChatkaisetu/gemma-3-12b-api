import './globals.css'
import type { Metadata } from 'next'
import { Toaster } from '../components/ui/toaster'
import { Header } from '@/components/Navigation/Header'

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
      <body className="min-h-screen bg-gray-50 flex flex-col">
        <Header />
        <main className="flex-1">
          {children}
        </main>
        <Toaster />
      </body>
    </html>
  )
}
