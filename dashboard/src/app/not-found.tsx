'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Home, FolderOpen } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] px-4 text-center">
      <h1 className="text-7xl font-bold text-primary mb-4">404</h1>
      <h2 className="text-3xl font-semibold mb-6">ページが見つかりません</h2>
      <p className="text-muted-foreground mb-8 max-w-md">
        お探しのページは存在しないか、移動した可能性があります。
      </p>
      <div className="flex flex-col sm:flex-row gap-4">
        <Button asChild>
          <Link href="/projects">
            <FolderOpen className="mr-2 h-4 w-4" />
            プロジェクト一覧
          </Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/">
            <Home className="mr-2 h-4 w-4" />
            ホームページ
          </Link>
        </Button>
      </div>
    </div>
  )
}
