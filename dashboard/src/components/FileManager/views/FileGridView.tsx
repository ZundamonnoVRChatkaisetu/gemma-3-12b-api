"use client"

import React from 'react';
import { Pin } from 'lucide-react';
import FileIcon from '../FileIcon';
import { FileInfo, FileListResponse } from '../types';

interface FileGridViewProps {
  fileList: FileListResponse | null;
  selectedFiles: FileInfo[];
  isSearching: boolean;
  toggleFileSelection: (file: FileInfo, ctrlKey: boolean) => void;
  openFile: (file: FileInfo) => void;
  filterFiles: (files: FileInfo[]) => FileInfo[];
  isPinned: (path: string) => boolean;
}

const FileGridView: React.FC<FileGridViewProps> = ({
  fileList,
  selectedFiles,
  isSearching,
  toggleFileSelection,
  openFile,
  filterFiles,
  isPinned
}) => {
  if (!fileList) return null;
  
  const filteredFiles = filterFiles(fileList.files);
  
  return (
    <div className="h-full overflow-auto p-3">
      {filteredFiles.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          {isSearching ? '検索結果はありません' : 'ファイルがありません'}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {filteredFiles.map((file) => (
            <div
              key={file.path}
              className={`flex flex-col items-center p-3 rounded-md cursor-pointer ${
                selectedFiles.some(f => f.path === file.path) ? 'bg-blue-100' : 'hover:bg-gray-50'
              }`}
              onClick={(e) => toggleFileSelection(file, e.ctrlKey)}
              onDoubleClick={() => openFile(file)}
            >
              <div className="p-2">
                <FileIcon file={file} size={40} />
              </div>
              <div className="text-center text-sm mt-2 w-full">
                <div className="truncate max-w-full">
                  {file.name}
                  {file.is_dir && isPinned(file.path) && (
                    <Pin size={12} className="text-blue-500 ml-1 inline-block" />
                  )}
                </div>
                {!file.is_dir && (
                  <div className="text-xs text-gray-500 mt-1">
                    {file.size_formatted}
                  </div>
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
