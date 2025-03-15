'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'

export default function Home() {
  const router = useRouter()

  useEffect(() => {
    // プロジェクト一覧ページに自動的にリダイレクト
    router.push('/projects')
  }, [router])

  // リダイレクト中はローディングを表示
  return (
    <div className="flex flex-col h-screen items-center justify-center">
      <Loader2 className="h-12 w-12 animate-spin text-blue-500 mb-4" />
      <p className="text-lg text-muted-foreground">プロジェクト一覧ページに移動しています...</p>
    </div>
  )
}
