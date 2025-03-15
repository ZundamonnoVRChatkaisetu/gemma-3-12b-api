import './globals.css'
import type { Metadata } from 'next'
import { Toaster } from '../components/ui/toaster'
import { Header } from '@/components/Navigation/Header'
import { Sidebar } from '@/components/Navigation/Sidebar'
import { ThemeProvider } from '@/components/theme/theme-provider'

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
    <html lang="ja" suppressHydrationWarning>
      <body className="min-h-screen bg-background antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <div className="flex min-h-screen">
            {/* サイドバーナビゲーション */}
            <div className="hidden md:block">
              <Sidebar />
            </div>
            
            {/* メインコンテンツエリア */}
            <div className="flex flex-col flex-1">
              <Header />
              <main className="flex-1 overflow-auto">
                <div className="container mx-auto py-4 md:py-6 px-4 md:px-6">
                  {children}
                </div>
              </main>
            </div>
          </div>
          
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  )
}
