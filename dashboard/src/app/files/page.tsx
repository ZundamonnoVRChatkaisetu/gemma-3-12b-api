'use client'

import React from 'react'
import EnhancedFileManager from '@/components/FileManager/EnhancedFileManager'

export default function FilesPage() {
  return (
    <div className="container mx-auto py-6 px-4">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">ファイルマネージャー</h1>
        <p className="text-muted-foreground mt-1">
          ファイルとディレクトリを管理するためのインターフェース
        </p>
      </div>
      
      <div className="bg-white rounded-lg shadow-sm p-1">
        <EnhancedFileManager 
          showToolbar={true}
          initialPath=""
          maxHeight="calc(100vh - 230px)"
        />
      </div>
    </div>
  )
}
