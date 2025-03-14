"use client"

import React from 'react';
import { FileInfo, FileListResponse } from '../types';

interface StatusBarProps {
  fileList: FileListResponse | null;
  selectedFiles: FileInfo[];
  filterFiles: (files: FileInfo[]) => FileInfo[];
}

// ステータスバーコンポーネント
const StatusBar: React.FC<StatusBarProps> = ({ fileList, selectedFiles, filterFiles }) => {
  if (!fileList) return null;
  
  const filteredFiles = filterFiles(fileList.files);
  
  return (
    <div className="py-1 px-3 text-xs text-gray-500 bg-gray-100 border-t flex justify-between items-center">
      <div>
        {fileList.total_dirs} フォルダ, {fileList.total_files} ファイル
        {filteredFiles.length !== fileList.files.length && 
          ` (表示: ${filteredFiles.length})`}
      </div>
      <div>
        {selectedFiles.length > 0 && `${selectedFiles.length}個選択中 / `}
        合計サイズ: {fileList.total_size ? `${(fileList.total_size / 1024).toFixed(2)} KB` : '0 KB'}
      </div>
    </div>
  );
};

export default StatusBar;
