"use client"

import React from 'react';
import { 
  Copy, Scissors, FileText, Trash2, Edit3, Download, 
  ExternalLink, Eye, Pin, Info
} from 'lucide-react';
import { 
  ContextMenu,
  ContextMenuTrigger,
  ContextMenuItem,
  ContextMenuContent,
  ContextMenuSeparator,
  ContextMenuSub,
  ContextMenuSubTrigger,
  ContextMenuSubContent,
} from '../../../components/ui/context-menu';
import { FileInfo } from '../types';

interface FileContextMenuProps {
  file: FileInfo;
  children: React.ReactNode;
  openFile: (file: FileInfo) => void;
  setShowDeleteDialog: (show: boolean) => void;
  setShowRenameDialog: (show: boolean) => void;
  setSelectedFile: (file: FileInfo) => void;
  handleCopy: () => void;
  handleCut: () => void;
  downloadFile: (file: FileInfo) => void;
  pinFolder: (folder: FileInfo) => void;
  isPinned: (path: string) => boolean;
  setShowPropertiesDialog: (show: boolean) => void;
}

const FileContextMenu: React.FC<FileContextMenuProps> = ({
  file,
  children,
  openFile,
  setShowDeleteDialog,
  setShowRenameDialog,
  setSelectedFile,
  handleCopy,
  handleCut,
  downloadFile,
  pinFolder,
  isPinned,
  setShowPropertiesDialog
}) => {
  const handleDelete = () => {
    setSelectedFile(file);
    setShowDeleteDialog(true);
  };

  const handleRename = () => {
    setSelectedFile(file);
    setShowRenameDialog(true);
  };

  const handleProperties = () => {
    setSelectedFile(file);
    setShowPropertiesDialog(true);
  };

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        {children}
      </ContextMenuTrigger>
      <ContextMenuContent className="w-64">
        <ContextMenuItem onClick={() => openFile(file)} className="cursor-pointer">
          {file.is_dir ? (
            <>
              <ExternalLink className="mr-2 h-4 w-4" />
              <span>開く</span>
            </>
          ) : (
            <>
              <Eye className="mr-2 h-4 w-4" />
              <span>表示</span>
            </>
          )}
        </ContextMenuItem>

        <ContextMenuSeparator />

        <ContextMenuItem onClick={() => { setSelectedFile(file); handleCut(); }} className="cursor-pointer">
          <Scissors className="mr-2 h-4 w-4" />
          <span>切り取り</span>
        </ContextMenuItem>
        
        <ContextMenuItem onClick={() => { setSelectedFile(file); handleCopy(); }} className="cursor-pointer">
          <Copy className="mr-2 h-4 w-4" />
          <span>コピー</span>
        </ContextMenuItem>

        <ContextMenuSeparator />
        
        <ContextMenuItem onClick={handleRename} className="cursor-pointer">
          <Edit3 className="mr-2 h-4 w-4" />
          <span>名前の変更</span>
        </ContextMenuItem>
        
        <ContextMenuItem onClick={handleDelete} className="cursor-pointer text-red-600">
          <Trash2 className="mr-2 h-4 w-4" />
          <span>削除</span>
        </ContextMenuItem>

        <ContextMenuSeparator />

        {!file.is_dir && (
          <ContextMenuItem onClick={() => downloadFile(file)} className="cursor-pointer">
            <Download className="mr-2 h-4 w-4" />
            <span>ダウンロード</span>
          </ContextMenuItem>
        )}

        {file.is_dir && !isPinned(file.path) && (
          <ContextMenuItem onClick={() => pinFolder(file)} className="cursor-pointer">
            <Pin className="mr-2 h-4 w-4" />
            <span>ピン留めする</span>
          </ContextMenuItem>
        )}

        <ContextMenuSeparator />
        
        <ContextMenuItem onClick={handleProperties} className="cursor-pointer">
          <Info className="mr-2 h-4 w-4" />
          <span>プロパティ</span>
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
};

export default FileContextMenu;
