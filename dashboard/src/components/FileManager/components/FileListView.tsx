"use client"

import React from 'react';
import { Pin } from 'lucide-react';
import { cn } from '../../../lib/utils';
import { FileInfo, FileListResponse } from '../types';
import FileIcon from './FileIcon';
import { format } from 'date-fns';

interface FileListViewProps {
  fileList: FileListResponse | null;
  filterFiles: (files: FileInfo[]) => FileInfo[];
  isSearching: boolean;
  selectedFiles: FileInfo[];
  toggleFileSelection: (file: FileInfo, ctrlKey?: boolean, shiftKey?: boolean) => void;
  openFile: (file: FileInfo) => void;
  isPinned: (path: string) => boolean;
  allowMultiSelect?: boolean;
}

const FileListView: React.FC<FileListViewProps> = ({
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
    <div className="h-full overflow-auto p-2">
      {filteredFiles.length === 0 ? (
        <div className="flex justify-center items-center h-full text-gray-500">
          {isSearching ? '検索結果はありません' : 'フォルダは空です'}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-1">
          {filteredFiles.map((file) => (
            <div
              key={file.path}
              className={cn(
                "flex items-center p-2 rounded hover:bg-gray-100 cursor-pointer group",
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
              <div className="flex items-center flex-1 min-w-0">
                <FileIcon file={file} size={20} />
                <span className="ml-2 truncate">{file.name}</span>
                {file.is_dir && isPinned(file.path) && (
                  <Pin size={14} className="text-blue-500 ml-1 flex-shrink-0" />
                )}
                {file.is_hidden && (
                  <span className="ml-2 text-xs text-gray-500 bg-gray-100 px-1 rounded">隠し</span>
                )}
              </div>
              
              <div className="text-xs text-gray-500 flex-shrink-0 opacity-0 group-hover:opacity-100">
                {file.is_dir ? '---' : file.size_formatted}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FileListView;
