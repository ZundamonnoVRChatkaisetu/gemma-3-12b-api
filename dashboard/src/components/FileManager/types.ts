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

// 以下の他のインターフェースと定義は変更なし...

// デフォルトのクイックアクセス項目を明示的にエクスポート
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
];

// 他の定義も変更なし...
