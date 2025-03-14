"use client"

// ピン止めフォルダの型定義
export interface PinnedFolder {
  path: string;
  name: string;
  isQuickAccess?: boolean;
}

// ファイル情報の型定義
export interface FileInfo {
  name: string;
  path: string;
  is_dir: boolean;
  size?: number;
  size_formatted?: string;
  modified?: string;
  created?: string;
  mime_type?: string;
  extension?: string;
  icon?: string;
  is_hidden?: boolean;
}

// ファイルリストレスポンスの型定義
export interface FileListResponse {
  files: FileInfo[];
  current_dir: string;
  parent_dir?: string;
  total_size: number;
  total_files: number;
  total_dirs: number;
  breadcrumbs: { name: string; path: string }[];
}

// ファイル内容レスポンスの型定義
export interface FileContentResponse {
  content: string;
  path: string;
  mime_type: string;
  size: number;
  size_formatted?: string;
  modified: string;
}

// プロパティの定義
export interface EnhancedFileManagerProps {
  onFileSelect?: (file: FileInfo, content?: string) => void;
  allowMultiSelect?: boolean;
  initialPath?: string;
  maxHeight?: string;
  showToolbar?: boolean;
  className?: string;
}

// API Base URL - サーバー・クライアント両対応の安全な実装
export const API_BASE_URL = (() => {
  if (typeof window !== 'undefined') {
    // フロントエンドから呼び出す場合
    // ポートを固定値に変更
    return `${window.location.protocol}//${window.location.hostname}:8000`
  }
  
  // サーバーサイドレンダリング時のフォールバック
  return process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000'
})()

// デフォルトのクイックアクセス項目
export const defaultQuickAccessItems: PinnedFolder[] = [
  {
    name: 'デスクトップ',
    path: 'C:/Users/Public/Desktop',
    isQuickAccess: true
  },
  {
    name: 'ドキュメント',
    path: 'C:/Users/Public/Documents',
    isQuickAccess: true
  },
  {
    name: 'ダウンロード',
    path: 'C:/Users/Public/Downloads',
    isQuickAccess: true
  }
]

// 他の定義は変更なし
export const colors = {
  primary: {
    light: '#E6F2FF',
    main: '#2E7BF6',
    dark: '#1956B3',
  },
  // 他のカラー定義は省略
}

export const fileCategories = [
  { key: 'all', label: '全て' },
  { key: 'document', label: '文書' },
  { key: 'image', label: '画像' },
  { key: 'video', label: '動画' },
  { key: 'audio', label: '音声' },
  { key: 'archive', label: '圧縮' },
  { key: 'code', label: 'コード' },
]