"use client"

import { FileInfo } from './types';
import { toast } from '../../components/ui/use-toast';
import { API_BASE_URL } from './types';

/**
 * ファイルリストを取得する
 */
export const fetchFileList = async (
  path: string, 
  sortBy: string, 
  sortDesc: boolean, 
  showHidden: boolean
): Promise<any> => {
  try {
    // URLを構築してからログに出力（デバッグ用）
    const url = `${API_BASE_URL}/api/v1/files/list?path=${encodeURIComponent(path)}&sort_by=${sortBy}&sort_desc=${sortDesc}&show_hidden=${showHidden}`;
    console.log('APIリクエストURL:', url);
    console.log('API_BASE_URL:', API_BASE_URL);
    
    const response = await fetch(url);
    
    if (!response.ok) {
      console.error('レスポンスステータス:', response.status);
      console.error('レスポンスステータステキスト:', response.statusText);
      
      // レスポンスの内容を確認（JSON or HTML）
      const contentType = response.headers.get('content-type');
      console.error('Content-Type:', contentType);
      
      if (contentType && contentType.includes('application/json')) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'ファイルリストの取得に失敗しました');
      } else {
        // HTMLやその他の非JSONレスポンスの場合
        const textResponse = await response.text();
        console.error('JSONではないレスポンス:', textResponse.substring(0, 200) + '...');
        throw new Error('サーバーから予期しない応答: JSONではありません');
      }
    }
    
    return await response.json();
  } catch (error) {
    console.error('ファイルリスト取得エラー:', error);
    toast({
      title: 'エラー',
      description: error instanceof Error ? error.message : 'ファイルリストの取得に失敗しました',
      variant: 'destructive',
    });
    throw error;
  }
};

/**
 * ファイルを検索する
 */
export const searchFiles = async (
  currentPath: string,
  searchQuery: string
): Promise<any> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/files/search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        path: currentPath,
        query: searchQuery,
        recursive: true,
        case_sensitive: false,
      }),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || '検索に失敗しました');
    }
    
    return await response.json();
  } catch (error) {
    console.error('検索エラー:', error);
    toast({
      title: 'エラー',
      description: error instanceof Error ? error.message : '検索に失敗しました',
      variant: 'destructive',
    });
    throw error;
  }
};

/**
 * ファイルをカテゴリでフィルタリングする
 */
export const filterFilesByCategory = (files: FileInfo[], filterCategory: string): FileInfo[] => {
  if (filterCategory === 'all') return files;
  
  return files.filter(file => {
    if (file.is_dir) return filterCategory === 'all';
    
    const ext = file.extension?.toLowerCase();
    switch(filterCategory) {
      case 'document':
        return ['txt', 'pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'odt', 'rtf', 'md'].includes(ext || '');
      case 'image':
        return ['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp', 'bmp'].includes(ext || '');
      case 'video':
        return ['mp4', 'webm', 'avi', 'mov', 'mkv', 'flv', 'wmv'].includes(ext || '');
      case 'audio':
        return ['mp3', 'wav', 'ogg', 'flac', 'm4a', 'aac'].includes(ext || '');
      case 'archive':
        return ['zip', 'tar', 'gz', 'rar', '7z', 'bz2'].includes(ext || '');
      case 'code':
        return ['html', 'css', 'js', 'ts', 'jsx', 'tsx', 'json', 'py', 'java', 'c', 'cpp', 'php', 'rb', 'go', 'rs'].includes(ext || '');
      default:
        return true;
    }
  });
};

/**
 * ファイルの内容を取得する
 */
export const fetchFileContent = async (path: string): Promise<any> => {
  try {
    const url = `${API_BASE_URL}/api/v1/files/read?path=${encodeURIComponent(path)}`;
    console.log('ファイル読み込みURL:', url);
    
    const response = await fetch(url);
    
    if (!response.ok) {
      if (response.status === 400) {
        // バイナリファイルの場合
        throw new Error('このファイルは直接開くことができません');
      }
      
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'ファイルの読み込みに失敗しました');
      } else {
        const textResponse = await response.text();
        console.error('JSONではないレスポンス:', textResponse.substring(0, 200) + '...');
        throw new Error('サーバーから予期しない応答: JSONではありません');
      }
    }
    
    return await response.json();
  } catch (error) {
    console.error('ファイル読み込みエラー:', error);
    toast({
      title: 'エラー',
      description: error instanceof Error ? error.message : 'ファイルの読み込みに失敗しました',
      variant: 'destructive',
    });
    throw error;
  }
};

/**
 * ファイル保存API
 */
export const saveFileContent = async (path: string, content: string): Promise<void> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/files/write`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        path: path,
        content: content,
        create_dirs: false,
      }),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'ファイルの保存に失敗しました');
    }
    
    toast({
      title: '成功',
      description: 'ファイルを保存しました',
    });
  } catch (error) {
    console.error('ファイル保存エラー:', error);
    toast({
      title: 'エラー',
      description: error instanceof Error ? error.message : 'ファイルの保存に失敗しました',
      variant: 'destructive',
    });
    throw error;
  }
};

/**
 * ファイルまたはフォルダを削除する
 */
export const deleteFileOrFolder = async (path: string): Promise<void> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/files/delete?path=${encodeURIComponent(path)}`, {
      method: 'DELETE',
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || '削除に失敗しました');
    }
    
    toast({
      title: '成功',
      description: `アイテムを削除しました`,
    });
  } catch (error) {
    console.error('削除エラー:', error);
    toast({
      title: 'エラー',
      description: error instanceof Error ? error.message : '削除に失敗しました',
      variant: 'destructive',
    });
    throw error;
  }
};