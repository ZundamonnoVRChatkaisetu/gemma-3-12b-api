"use client"

import React from 'react';
import { Pin } from 'lucide-react';
import { cn } from '../../../lib/utils';
import { FileInfo, FileListResponse } from '../types';
import FileIcon from './FileIcon';

interface FileGridViewProps {
  fileList: FileListResponse | null;
  filterFiles: (files: FileInfo[]) => FileInfo[];
  isSearching: boolean;
  selectedFiles: FileInfo[];
  toggleFileSelection: (file: FileInfo, ctrlKey?: boolean, shiftKey?: boolean) => void;
  openFile: (file: FileInfo) => void;
  isPinned: (path: string) => boolean;
  allowMultiSelect?: boolean;
}

const FileGridView: React.FC<FileGridViewProps> = ({
  fileList,
  filterFiles,
  isSearching,
  selectedFiles,
  toggleFileSelection,
  openFile,
  isPinned,
  allowMultiSelect = false
}) => {
  if (!fileList) return null;
  
  const filteredFiles = filterFiles(fileList.files);
  
  return (
    <div className="h-full overflow-auto p-4">
      {filteredFiles.length === 0 ? (
        <div className="flex justify-center items-center h-full text-gray-500">
          {isSearching ? '検索結果はありません' : 'フォルダは空です'}
        </div>
      ) : (
        <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
          {filteredFiles.map((file) => (
            <div
              key={file.path}
              className={cn(
                "flex flex-col items-center py-2 px-1 rounded cursor-pointer hover:bg-gray-100 group",
                selectedFiles.some(f => f.path === file.path) ? 'bg-blue-100' : ''
              )}
              onClick={(e) => toggleFileSelection(file, e.ctrlKey, e.shiftKey)}
              onDoubleClick={() => openFile(file)}
              onContextMenu={(e) => {
                // 選択されていない項目を右クリックしたら選択する
                if (!selectedFiles.some(f => f.path === file.path)) {
                  toggleFileSelection(file, false, false);
                }
              }}
            >
              <div className="relative">
                <FileIcon file={file} size={48} />
                {file.is_dir && isPinned(file.path) && (
                  <Pin size={16} className="absolute top-0 right-0 text-blue-500" />
                )}
              </div>
              <div className="mt-2 text-center">
                <div className="text-sm truncate max-w-[100px]">{file.name}</div>
                {file.is_hidden && (
                  <span className="text-xs text-gray-500 bg-gray-100 px-1 rounded">隠し</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FileGridView;
