import React from 'react';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { FileIcon } from './FileManagerIcons';
import { FileInfo, FileListResponse, FileManagerPreferences } from './types';

interface FileViewProps {
  fileList: FileListResponse | null;
  selectedFiles: FileInfo[];
  selectFile: (file: FileInfo, index: number, event: React.MouseEvent) => void;
  openFile: (file: FileInfo) => void;
  handleContextMenu: (event: React.MouseEvent, file: FileInfo) => void;
  isSearching: boolean;
  preferences: FileManagerPreferences;
}

// リスト表示モード
export const FileListView: React.FC<FileViewProps> = ({
  fileList,
  selectedFiles,
  selectFile,
  openFile,
  handleContextMenu,
  isSearching
}) => {
  if (!fileList) return null;
  
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[50%]">名前</TableHead>
          <TableHead className="w-[15%]">サイズ</TableHead>
          <TableHead className="w-[15%]">種類</TableHead>
          <TableHead className="w-[20%]">更新日時</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {fileList.files.length === 0 ? (
          <TableRow>
            <TableCell colSpan={4} className="text-center py-8 text-gray-500">
              {isSearching ? '検索結果はありません' : 'ファイルがありません'}
            </TableCell>
          </TableRow>
        ) : (
          fileList.files.map((file, index) => (
            <TableRow
              key={file.path}
              className={`cursor-pointer ${selectedFiles.some(f => f.path === file.path) ? 'bg-blue-100' : ''}`}
              onClick={(e) => selectFile(file, index, e)}
              onDoubleClick={() => openFile(file)}
              onContextMenu={(e) => handleContextMenu(e, file)}
            >
              <TableCell className="flex items-center gap-2">
                <FileIcon file={file} />
                <span>{file.name}</span>
              </TableCell>
              <TableCell>{file.size_formatted || '-'}</TableCell>
              <TableCell>{file.is_dir ? 'フォルダ' : (file.extension || 'ファイル')}</TableCell>
              <TableCell>{file.modified || '-'}</TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );
};

// アイコン表示モード
export const FileIconsView: React.FC<FileViewProps> = ({
  fileList,
  selectedFiles,
  selectFile,
  openFile,
  handleContextMenu,
  isSearching,
  preferences
}) => {
  if (!fileList) return null;
  
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 p-2">
      {fileList.files.length === 0 ? (
        <div className="col-span-full text-center py-8 text-gray-500">
          {isSearching ? '検索結果はありません' : 'ファイルがありません'}
        </div>
      ) : (
        fileList.files.map((file, index) => (
          <div
            key={file.path}
            className={`flex flex-col items-center p-2 rounded-md hover:bg-gray-100 cursor-pointer
              ${selectedFiles.some(f => f.path === file.path) ? 'bg-blue-100' : ''}`}
            onClick={(e) => selectFile(file, index, e)}
            onDoubleClick={() => openFile(file)}
            onContextMenu={(e) => handleContextMenu(e, file)}
          >
            <div className="p-2">
              <FileIcon file={file} size={preferences.iconSize} />
            </div>
            <div className="text-center text-sm mt-1 w-full truncate">
              {file.name}
            </div>
            {!file.is_dir && (
              <div className="text-xs text-gray-500">
                {file.size_formatted}
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
};

// 詳細表示モード
export const FileDetailsView: React.FC<FileViewProps> = ({
  fileList,
  selectedFiles,
  selectFile,
  openFile,
  handleContextMenu,
  isSearching
}) => {
  if (!fileList) return null;
  
  return (
    <div className="space-y-2">
      {fileList.files.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          {isSearching ? '検索結果はありません' : 'ファイルがありません'}
        </div>
      ) : (
        fileList.files.map((file, index) => (
          <div
            key={file.path}
            className={`p-3 rounded-md hover:bg-gray-100 cursor-pointer border
              ${selectedFiles.some(f => f.path === file.path) ? 'bg-blue-100 border-blue-300' : 'border-gray-200'}`}
            onClick={(e) => selectFile(file, index, e)}
            onDoubleClick={() => openFile(file)}
            onContextMenu={(e) => handleContextMenu(e, file)}
          >
            <div className="flex items-center gap-3">
              <FileIcon file={file} size={32} />
              <div className="flex-grow">
                <div className="font-medium">{file.name}</div>
                <div className="text-sm text-gray-500 flex gap-3">
                  <span>{file.is_dir ? 'フォルダ' : (file.extension ? `.${file.extension}` : 'ファイル')}</span>
                  {!file.is_dir && <span>{file.size_formatted}</span>}
                  <span>{file.modified}</span>
                </div>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
};
