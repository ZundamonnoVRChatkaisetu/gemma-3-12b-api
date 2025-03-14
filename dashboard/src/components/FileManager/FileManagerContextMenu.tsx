import React from 'react';
import { 
  Folder, FileText, Download, Copy, Scissor, Edit, Trash, 
  Info, Check, RefreshCw, Upload, Clipboard 
} from 'lucide-react';
import { FileInfo } from './types';

interface ContextMenuProps {
  position: { x: number, y: number } | null;
  rightClickedFile: FileInfo | null;
  selectedFiles: FileInfo[];
  clipboardFiles: { files: FileInfo[], operation: 'copy' | 'cut' } | null;
  onClose: () => void;
  onAction: (action: () => void) => void;
  onSelectFile: (file: FileInfo, index: number) => void;
  onOpenFile: (file: FileInfo) => void;
  onDownload: () => void;
  onCopyToClipboard: (operation: 'copy' | 'cut') => void;
  onPaste: () => Promise<void>;
  onRename: () => void;
  onDelete: () => void;
  onProperties: () => void;
  onNewFolder: () => void;
  onNewFile: () => void;
  onUpload: () => void;
  onSelectAll: () => void;
  onRefresh: () => Promise<void>;
  fileList?: { files: FileInfo[] };
}

export const ContextMenu: React.FC<ContextMenuProps> = ({
  position,
  rightClickedFile,
  selectedFiles,
  clipboardFiles,
  onClose,
  onAction,
  onSelectFile,
  onOpenFile,
  onDownload,
  onCopyToClipboard,
  onPaste,
  onRename,
  onDelete,
  onProperties,
  onNewFolder,
  onNewFile,
  onUpload,
  onSelectAll,
  onRefresh,
  fileList
}) => {
  if (!position) return null;
  
  const canPaste = clipboardFiles !== null;
  const isSelected = rightClickedFile && selectedFiles.some(f => f.path === rightClickedFile.path);
  
  // コンテキストメニューのスタイル設定
  const style: React.CSSProperties = {
    position: 'fixed',
    top: position.y,
    left: position.x,
    zIndex: 1000,
    backgroundColor: 'white',
    borderRadius: '0.375rem',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    padding: '0.5rem 0',
    minWidth: '12rem',
    border: '1px solid rgba(229, 231, 235, 1)',
  };
  
  // クリック処理をエスケープ
  const stopPropagation = (e: React.MouseEvent) => {
    e.stopPropagation();
  };
  
  return (
    <>
      <div
        className="fixed inset-0 z-50 bg-transparent"
        onClick={onClose}
      />
      <div style={style} onClick={stopPropagation} onContextMenu={(e) => e.preventDefault()}>
        <div className="py-1">
          {/* 通常のコンテキストメニュー項目 */}
          {rightClickedFile && !isSelected && fileList && (
            <button
              className="w-full text-left px-4 py-1.5 text-sm hover:bg-gray-100 flex items-center"
              onClick={() => onAction(() => {
                const index = fileList.files.findIndex(f => f.path === rightClickedFile.path);
                if (index !== -1) {
                  onSelectFile(rightClickedFile, index);
                }
              })}
            >
              <Check className="h-4 w-4 mr-2" />
              選択
            </button>
          )}
          
          {rightClickedFile && (
            <button
              className="w-full text-left px-4 py-1.5 text-sm hover:bg-gray-100 flex items-center"
              onClick={() => onAction(() => onOpenFile(rightClickedFile))}
            >
              {rightClickedFile.is_dir ? (
                <>
                  <Folder className="h-4 w-4 mr-2" />
                  開く
                </>
              ) : (
                <>
                  <FileText className="h-4 w-4 mr-2" />
                  開く
                </>
              )}
            </button>
          )}
          
          {/* ファイル操作メニュー */}
          {selectedFiles.length > 0 && (
            <>
              <div className="border-t border-gray-200 my-1"></div>
              
              {/* ダウンロード */}
              {selectedFiles.some(f => !f.is_dir) && (
                <button
                  className="w-full text-left px-4 py-1.5 text-sm hover:bg-gray-100 flex items-center"
                  onClick={() => onAction(onDownload)}
                >
                  <Download className="h-4 w-4 mr-2" />
                  ダウンロード
                </button>
              )}
              
              {/* コピー＆ペースト */}
              <button
                className="w-full text-left px-4 py-1.5 text-sm hover:bg-gray-100 flex items-center"
                onClick={() => onAction(() => onCopyToClipboard('copy'))}
              >
                <Copy className="h-4 w-4 mr-2" />
                コピー
              </button>
              
              <button
                className="w-full text-left px-4 py-1.5 text-sm hover:bg-gray-100 flex items-center"
                onClick={() => onAction(() => onCopyToClipboard('cut'))}
              >
                <Scissor className="h-4 w-4 mr-2" />
                切り取り
              </button>
              
              {canPaste && (
                <button
                  className="w-full text-left px-4 py-1.5 text-sm hover:bg-gray-100 flex items-center"
                  onClick={() => onAction(onPaste)}
                >
                  <Clipboard className="h-4 w-4 mr-2" />
                  貼り付け
                </button>
              )}
              
              {/* 名前変更 */}
              {selectedFiles.length === 1 && (
                <button
                  className="w-full text-left px-4 py-1.5 text-sm hover:bg-gray-100 flex items-center"
                  onClick={() => onAction(onRename)}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  名前の変更
                </button>
              )}
              
              {/* 削除 */}
              <button
                className="w-full text-left px-4 py-1.5 text-sm hover:bg-gray-100 flex items-center text-red-600"
                onClick={() => onAction(onDelete)}
              >
                <Trash className="h-4 w-4 mr-2" />
                削除
              </button>
              
              {/* プロパティ */}
              {selectedFiles.length === 1 && (
                <button
                  className="w-full text-left px-4 py-1.5 text-sm hover:bg-gray-100 flex items-center"
                  onClick={() => onAction(onProperties)}
                >
                  <Info className="h-4 w-4 mr-2" />
                  プロパティ
                </button>
              )}
            </>
          )}
          
          {/* フォルダコンテキストメニュー（ファイルが選択されていない場合） */}
          {!rightClickedFile && (
            <>
              <button
                className="w-full text-left px-4 py-1.5 text-sm hover:bg-gray-100 flex items-center"
                onClick={() => onAction(onNewFolder)}
              >
                <Folder className="h-4 w-4 mr-2" />
                新しいフォルダ
              </button>
              
              <button
                className="w-full text-left px-4 py-1.5 text-sm hover:bg-gray-100 flex items-center"
                onClick={() => onAction(onNewFile)}
              >
                <FileText className="h-4 w-4 mr-2" />
                新しいファイル
              </button>
              
              <button
                className="w-full text-left px-4 py-1.5 text-sm hover:bg-gray-100 flex items-center"
                onClick={() => onAction(onUpload)}
              >
                <Upload className="h-4 w-4 mr-2" />
                アップロード
              </button>
              
              {canPaste && (
                <button
                  className="w-full text-left px-4 py-1.5 text-sm hover:bg-gray-100 flex items-center"
                  onClick={() => onAction(onPaste)}
                >
                  <Clipboard className="h-4 w-4 mr-2" />
                  貼り付け
                </button>
              )}
              
              <div className="border-t border-gray-200 my-1"></div>
              
              <button
                className="w-full text-left px-4 py-1.5 text-sm hover:bg-gray-100 flex items-center"
                onClick={() => onAction(onSelectAll)}
              >
                <Check className="h-4 w-4 mr-2" />
                すべて選択
              </button>
              
              <button
                className="w-full text-left px-4 py-1.5 text-sm hover:bg-gray-100 flex items-center"
                onClick={() => onAction(onRefresh)}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                更新
              </button>
            </>
          )}
        </div>
      </div>
    </>
  );
};
