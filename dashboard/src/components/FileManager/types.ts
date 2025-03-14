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

// API Base URL - 動的に現在のホストから取得
export const API_BASE_URL = typeof window !== 'undefined' 
  ? `${window.location.protocol}//${window.location.hostname}:8000`
  : 'http://localhost:8000';

// カスタムカラースキーム
export const colors = {
  primary: {
    light: '#E6F2FF',
    main: '#2E7BF6',
    dark: '#1956B3',
  },
  secondary: {
    light: '#F7F9FC',
    main: '#EDF2F7',
    dark: '#CBD5E0',
  },
  success: {
    light: '#E6F6EC',
    main: '#38A169',
    dark: '#276749',
  },
  error: {
    light: '#FFF5F5',
    main: '#E53E3E',
    dark: '#9B2C2C',
  },
  warning: {
    light: '#FFFBEB',
    main: '#ECC94B',
    dark: '#B7791F',
  },
  info: {
    light: '#E6FFFA',
    main: '#38B2AC',
    dark: '#2C7A7B',
  },
  text: {
    primary: '#1A202C',
    secondary: '#4A5568',
    disabled: '#A0AEC0',
  },
  background: {
    default: '#FFFFFF',
    paper: '#F7FAFC',
    hover: '#EDF2F7',
  },
  divider: '#E2E8F0',
};

// ファイルタイプのカテゴリ一覧定義（アイコンはコンポーネントで実装）
export const fileCategories = [
  { key: 'all', label: '全て' },
  { key: 'document', label: '文書' },
  { key: 'image', label: '画像' },
  { key: 'video', label: '動画' },
  { key: 'audio', label: '音声' },
  { key: 'archive', label: '圧縮' },
  { key: 'code', label: 'コード' },
];

// デフォルトのクイックアクセス項目
export const defaultQuickAccessItems: PinnedFolder[] = [];
