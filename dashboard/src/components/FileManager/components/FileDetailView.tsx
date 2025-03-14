"use client"

import React from 'react';
import { SortDesc, SortAsc, Pin } from 'lucide-react';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '../../../components/ui/table';
import { Badge } from '../../../components/ui/badge';
import { cn } from '../../../lib/utils';
import { FileInfo, FileListResponse } from '../types';
import FileIcon from './FileIcon';

interface FileDetailViewProps {
  fileList: FileListResponse | null;
  filterFiles: (files: FileInfo[]) => FileInfo[];
  sortBy: string;
  sortDesc: boolean;
  setSortBy: (sortBy: string) => void;
  setSortDesc: (sortDesc: boolean) => void;
  loadFileList: (path: string) => void;
  currentPath: string;
  isSearching: boolean;
  selectedFiles: FileInfo[];
  toggleFileSelection: (file: FileInfo, ctrlKey?: boolean) => void;
  openFile: (file: FileInfo) => void;
  isPinned: (path: string) => boolean;
}

const FileDetailView: React.FC<FileDetailViewProps> = ({
  fileList,
  filterFiles,
  sortBy,
  sortDesc,
  setSortBy,
  setSortDesc,
  loadFileList,
  currentPath,
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
      <Table>
        <TableHeader>
          <TableRow className="bg-gray-50">
            <TableHead className="w-[40%]" onClick={() => { setSortBy('name'); setSortDesc(!sortDesc); loadFileList(currentPath); }}>
              <div className="flex items-center cursor-pointer">
                名前
                {sortBy === 'name' && (sortDesc ? <SortDesc size={16} className="ml-1" /> : <SortAsc size={16} className="ml-1" />)}
              </div>
            </TableHead>
            <TableHead className="w-[15%]" onClick={() => { setSortBy('size'); setSortDesc(!sortDesc); loadFileList(currentPath); }}>
              <div className="flex items-center cursor-pointer">
                サイズ
                {sortBy === 'size' && (sortDesc ? <SortDesc size={16} className="ml-1" /> : <SortAsc size={16} className="ml-1" />)}
              </div>
            </TableHead>
            <TableHead className="w-[15%]">種類</TableHead>
            <TableHead className="w-[25%]" onClick={() => { setSortBy('modified'); setSortDesc(!sortDesc); loadFileList(currentPath); }}>
              <div className="flex items-center cursor-pointer">
                更新日時
                {sortBy === 'modified' && (sortDesc ? <SortDesc size={16} className="ml-1" /> : <SortAsc size={16} className="ml-1" />)}
              </div>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredFiles.length === 0 ? (
            <TableRow>
              <TableCell colSpan={4} className="text-center py-8 text-gray-500">
                {isSearching ? '検索結果はありません' : 'ファイルがありません'}
              </TableCell>
            </TableRow>
          ) : (
            filteredFiles.map((file) => (
              <TableRow 
                key={file.path} 
                className={cn(
                  selectedFiles.some(f => f.path === file.path) ? 'bg-blue-100' : '',
                  'hover:bg-gray-50'
                )}
                onClick={(e) => toggleFileSelection(file, e.ctrlKey)}
                onDoubleClick={() => openFile(file)}
              >
                <TableCell className="flex items-center gap-2 cursor-pointer">
                  <FileIcon file={file} />
                  <span className="truncate">
                    {file.name}
                    {file.is_hidden && <Badge variant="outline" className="ml-2 text-xs">隠し</Badge>}
                  </span>
                  {file.is_dir && isPinned(file.path) && (
                    <Pin size={12} className="text-blue-500 ml-1" />
                  )}
                </TableCell>
                <TableCell>{file.size_formatted || '-'}</TableCell>
                <TableCell>{file.is_dir ? 'フォルダ' : (file.extension || 'ファイル')}</TableCell>
                <TableCell>{file.modified || '-'}</TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
};

export default FileDetailView;
