"use client"

import React from 'react';
import { FileInfo, FileListResponse } from '../types';
import { List, Grid3x3, Table } from 'lucide-react';

interface StatusBarProps {
  fileList: FileListResponse | null;
  filterFiles: (files: FileInfo[]) => FileInfo[];
  selectedFiles: FileInfo[];
  viewMode: 'list' | 'grid' | 'detail';
  setViewMode: (mode: 'list' | 'grid' | 'detail') => void;
}

const StatusBar: React.FC<StatusBarProps> = ({
  fileList,
  filterFiles,
  selectedFiles,
  viewMode,
  setViewMode
}) => {
  if (!fileList) return null;
  
  const filteredFiles = filterFiles(fileList.files);
  const totalItems = filteredFiles.length;
  const selectedCount = selectedFiles.length;
  
  // 選択されたアイテムのサイズ合計
  const totalSelectedSize = selectedFiles.reduce((total, file) => {
    return total + (file.size || 0);
  }, 0);
  
  // サイズのフォーマット
  const formatSize = (size: number) => {
    if (size < 1024) return `${size} B`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(2)} KB`;
    if (size < 1024 * 1024 * 1024) return `${(size / (1024 * 1024)).toFixed(2)} MB`;
    return `${(size / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  };
  
  // ファイルとフォルダの数
  const fileCount = filteredFiles.filter(file => !file.is_dir).length;
  const folderCount = filteredFiles.filter(file => file.is_dir).length;
  
  const getStatusText = () => {
    if (selectedCount === 0) {
      return `${totalItems} 項目 (フォルダ: ${folderCount}, ファイル: ${fileCount})`;
    } else if (selectedCount === 1) {
      const item = selectedFiles[0];
      if (item.is_dir) {
        return `"${item.name}" フォルダが選択されています`;
      } else {
        return `"${item.name}" - ${item.size_formatted || formatSize(item.size || 0)}`;
      }
    } else {
      return `${selectedCount} 項目選択 (合計サイズ: ${formatSize(totalSelectedSize)})`;
    }
  };
  
  return (
    <div className="h-8 border-t bg-gray-50 flex items-center justify-between px-3 text-sm text-gray-600 select-none">
      <div className="flex-1">
        {getStatusText()}
      </div>
      {/* 右側に表示モード切り替えボタン */}
      <div className="flex items-center gap-1">
        <button 
          className={`p-1 rounded ${viewMode === 'list' ? 'bg-gray-200' : 'hover:bg-gray-200'}`}
          onClick={() => setViewMode('list')}
          title="リスト表示"
        >
          <List size={16} />
        </button>
        <button 
          className={`p-1 rounded ${viewMode === 'grid' ? 'bg-gray-200' : 'hover:bg-gray-200'}`}
          onClick={() => setViewMode('grid')}
          title="アイコン表示"
        >
          <Grid3x3 size={16} />
        </button>
        <button 
          className={`p-1 rounded ${viewMode === 'detail' ? 'bg-gray-200' : 'hover:bg-gray-200'}`}
          onClick={() => setViewMode('detail')}
          title="詳細表示"
        >
          <Table size={16} />
        </button>
      </div>
    </div>
  );
};

export default StatusBar;
