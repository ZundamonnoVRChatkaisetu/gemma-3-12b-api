"use client"

import React from 'react';
import { Pin } from 'lucide-react';
import { Badge } from '../../../components/ui/badge';
import { FileInfo, FileListResponse } from '../types';
import FileIcon from './FileIcon';

interface FileListViewProps {
  fileList: FileListResponse | null;
  filterFiles: (files: FileInfo[]) => FileInfo[];
  isSearching: boolean;
  selectedFiles: FileInfo[];
  toggleFileSelection: (file: FileInfo, ctrlKey?: boolean) => void;
  openFile: (file: FileInfo) => void;
  isPinned: (path: string) => boolean;
}

const FileListView: React.FC<FileListViewProps> = ({
  fileList,
  filterFiles,
  isSearching,
  selectedFiles,
  toggleFileSelection,
  openFile,
  isPinned
}) => {
  if (!fileList) return null;
  
  const filteredFiles = filterFiles(fileList.files);
  
  return (
    <div className="h-full overflow-auto">
      {filteredFiles.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          {isSearching ? '検索結果はありません' : 'ファイルがありません'}
        </div>
      ) : (
        <div className="divide-y">
          {filteredFiles.map((file) => (
            <div
              key={file.path}
              className={`flex items-center p-3 cursor-pointer hover:bg-gray-50 ${
                selectedFiles.some(f => f.path === file.path) ? 'bg-blue-100' : ''
              }`}
              onClick={(e) => toggleFileSelection(file, e.ctrlKey)}
              onDoubleClick={() => openFile(file)}
            >
              <div className="flex items-center flex-1 min-w-0">
                <div className="mr-3">
                  <FileIcon file={file} size={20} />
                </div>
                <div className="truncate flex items-center">
                  {file.name}
                  {file.is_hidden && <Badge variant="outline" className="ml-2 text-xs">隠しファイル</Badge>}
                  {file.is_dir && isPinned(file.path) && (
                    <Pin size={12} className="text-blue-500 ml-1" />
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FileListView;
