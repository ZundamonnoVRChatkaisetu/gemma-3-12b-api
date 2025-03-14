"use client"

import React from 'react';
import {
  Copy, Scissors, FileText, Trash, Edit, Download, File, Folder, Pin, Eye,
  RefreshCw, FilePlus2, FolderPlus, Info, Upload
} from 'lucide-react';
import { 
  ContextMenu, 
  ContextMenuTrigger, 
  ContextMenuContent, 
  ContextMenuItem, 
  ContextMenuSeparator,
  ContextMenuSub,
  ContextMenuSubTrigger,
  ContextMenuSubContent
} from '../../../components/ui/context-menu';
import { FileInfo } from '../types';

interface FileContextMenuProps {
  children: React.ReactNode;
  file?: FileInfo | null;
  currentPath: string;
  handleCopy: () => void;
  handleCut: () => void;
  handlePaste: () => void;
  handleDelete: () => void;
  handleRename: () => void;
  handleDownload: (file: FileInfo) => void;
  pinFolder: (file: FileInfo) => void;
  isPinned: (path: string) => boolean;
  setShowNewFolderDialog: (show: boolean) => void;
  setShowNewFileDialog: (show: boolean) => void;
  setShowUploadDialog: (show: boolean) => void;
  refreshFileList: () => void;
  openFile: (file: FileInfo) => void;
  showProperties: (file: FileInfo) => void;
  clipboard: {action: 'copy' | 'cut', files: FileInfo[]} | null;
  selectedFiles: FileInfo[];
  isBackground?: boolean;
}

const FileContextMenu: React.FC<FileContextMenuProps> = ({
  children,
  file,
  currentPath,
  handleCopy,
  handleCut,
  handlePaste,
  handleDelete,
  handleRename,
  handleDownload,
  pinFolder,
  isPinned,
  setShowNewFolderDialog,
  setShowNewFileDialog,
  setShowUploadDialog,
  refreshFileList,
  openFile,
  showProperties,
  clipboard,
  selectedFiles,
  isBackground = false
}) => {
  const hasSelection = selectedFiles.length > 0;
  const showMultipleSelectionMenu = selectedFiles.length > 1;
  const showFileMenu = file && !showMultipleSelectionMenu && !isBackground;
  const showBackgroundMenu = isBackground || !file;
  
  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        {children}
      </ContextMenuTrigger>
      <ContextMenuContent className="w-64 shadow-md text-gray-700">
        {/* ファイル選択時のメニュー */}
        {showFileMenu && (
          <>
            <ContextMenuItem onClick={() => file && openFile(file)} className="flex items-center gap-2 focus:bg-blue-50">
              <Eye className="h-4 w-4" /> 開く
            </ContextMenuItem>
            
            <ContextMenuSeparator />
            
            <ContextMenuItem onClick={handleCut} className="flex items-center gap-2 focus:bg-blue-50">
              <Scissors className="h-4 w-4" /> 切り取り
            </ContextMenuItem>
            <ContextMenuItem onClick={handleCopy} className="flex items-center gap-2 focus:bg-blue-50">
              <Copy className="h-4 w-4" /> コピー
            </ContextMenuItem>
            
            <ContextMenuSeparator />
            
            <ContextMenuItem onClick={handleDelete} className="flex items-center gap-2 focus:bg-blue-50">
              <Trash className="h-4 w-4 text-red-500" /> 削除
            </ContextMenuItem>
            <ContextMenuItem onClick={handleRename} className="flex items-center gap-2 focus:bg-blue-50">
              <Edit className="h-4 w-4" /> 名前の変更
            </ContextMenuItem>
            
            {file.is_dir && (
              <ContextMenuItem 
                onClick={() => pinFolder(file)} 
                disabled={isPinned(file.path)}
                className="flex items-center gap-2 focus:bg-blue-50"
              >
                <Pin className="h-4 w-4" /> {isPinned(file.path) ? 'ピン留め済み' : 'ピン留めする'}
              </ContextMenuItem>
            )}
            
            {!file.is_dir && (
              <ContextMenuItem onClick={() => handleDownload(file)} className="flex items-center gap-2 focus:bg-blue-50">
                <Download className="h-4 w-4" /> ダウンロード
              </ContextMenuItem>
            )}
            
            <ContextMenuSeparator />
            
            <ContextMenuItem onClick={() => file && showProperties(file)} className="flex items-center gap-2 focus:bg-blue-50">
              <Info className="h-4 w-4" /> プロパティ
            </ContextMenuItem>
          </>
        )}

        {/* 複数ファイル選択時のメニュー */}
        {showMultipleSelectionMenu && (
          <>
            <ContextMenuItem onClick={handleCut} className="flex items-center gap-2 focus:bg-blue-50">
              <Scissors className="h-4 w-4" /> 切り取り ({selectedFiles.length}項目)
            </ContextMenuItem>
            <ContextMenuItem onClick={handleCopy} className="flex items-center gap-2 focus:bg-blue-50">
              <Copy className="h-4 w-4" /> コピー ({selectedFiles.length}項目)
            </ContextMenuItem>
            
            <ContextMenuSeparator />
            
            <ContextMenuItem onClick={handleDelete} className="flex items-center gap-2 focus:bg-blue-50">
              <Trash className="h-4 w-4 text-red-500" /> 削除 ({selectedFiles.length}項目)
            </ContextMenuItem>
          </>
        )}

        {/* 背景クリック時のメニュー */}
        {showBackgroundMenu && (
          <>
            <ContextMenuItem 
              onClick={handlePaste} 
              disabled={!clipboard}
              className="flex items-center gap-2 focus:bg-blue-50"
            >
              <FileText className="h-4 w-4" /> 
              {clipboard ? `貼り付け (${clipboard.files.length}項目)` : '貼り付け'}
            </ContextMenuItem>
            
            <ContextMenuSeparator />
            
            <ContextMenuSub>
              <ContextMenuSubTrigger className="flex items-center gap-2 focus:bg-blue-50">
                <FolderPlus className="h-4 w-4" /> 新規作成
              </ContextMenuSubTrigger>
              <ContextMenuSubContent className="w-48">
                <ContextMenuItem onClick={() => setShowNewFolderDialog(true)} className="flex items-center gap-2 focus:bg-blue-50">
                  <Folder className="h-4 w-4 text-yellow-500" /> フォルダ
                </ContextMenuItem>
                <ContextMenuItem onClick={() => setShowNewFileDialog(true)} className="flex items-center gap-2 focus:bg-blue-50">
                  <File className="h-4 w-4" /> テキストドキュメント
                </ContextMenuItem>
              </ContextMenuSubContent>
            </ContextMenuSub>
            
            <ContextMenuItem onClick={() => setShowUploadDialog(true)} className="flex items-center gap-2 focus:bg-blue-50">
              <Upload className="h-4 w-4" /> アップロード
            </ContextMenuItem>
            
            <ContextMenuSeparator />
            
            <ContextMenuItem onClick={refreshFileList} className="flex items-center gap-2 focus:bg-blue-50">
              <RefreshCw className="h-4 w-4" /> 更新
            </ContextMenuItem>
            
            <ContextMenuSeparator />
            
            <ContextMenuItem 
              onClick={() => showProperties({ name: '現在のフォルダ', path: currentPath, is_dir: true })}
              className="flex items-center gap-2 focus:bg-blue-50"
            >
              <Info className="h-4 w-4" /> プロパティ
            </ContextMenuItem>
          </>
        )}
      </ContextMenuContent>
    </ContextMenu>
  );
};

export default FileContextMenu;
