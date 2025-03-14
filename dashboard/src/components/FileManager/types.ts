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
  modified: string;
}

// ファイルマネージャープリファレンスの型定義
export interface FileManagerPreferences {
  theme: 'light' | 'dark' | 'system';
  showHiddenFiles: boolean;
  iconSize: number;
  defaultView: 'list' | 'icons' | 'details';
  confirmDelete: boolean;
  showExtensions: boolean;
  showStatusBar: boolean;
  sortBy: string;
  sortDirection: 'asc' | 'desc';
}
