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
    return `${window.location.protocol}//${window.location.host}:8000`;
  }
  if (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_API_BASE_URL) {
    return process.env.NEXT_PUBLIC_API_BASE_URL;
  }
  return 'http://localhost:8000';
})();

// その他の定義は変更なし（colors, fileCategories, defaultQuickAccessItems）
// ...（以前の定義を維持）
