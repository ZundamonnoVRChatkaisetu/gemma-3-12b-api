"use client"

import React from 'react';
import { 
  ChevronLeft, ChevronRight, ArrowUp, RefreshCw, Plus, Upload, Pin,
  Scissors, Copy, FileText, PanelLeft, Search, X, Filter, MoreHorizontal, 
  Home, Download, Trash, Edit, Eye, FolderTree, Star
} from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../../../components/ui/tooltip';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Separator } from '../../../components/ui/separator';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuSub, DropdownMenuSubTrigger, DropdownMenuSubContent, DropdownMenuCheckboxItem, DropdownMenuLabel } from '../../../components/ui/dropdown-menu';
import { FileInfo } from '../types';
import ViewModeSelector from './ViewModeSelector';

interface ExplorerToolbarProps {
  currentPath: string;
  goBack: () => void;
  goForward: () => void;
  goHome?: () => void;
  historyIndex: number;
  navigationHistory: string[];
  fileList: any;
  loadFileList: (path: string) => void;
  customPath: string;
  setCustomPath: (path: string) => void;
  handleAddressKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  searchFiles: () => void;
  isSearching: boolean;
  clearSearch: () => void;
  addressBarRef: React.RefObject<HTMLInputElement>;
  searchInputRef: React.RefObject<HTMLInputElement>;
  selectedFile: FileInfo | null;
  selectedFiles: FileInfo[];
  handleCut: () => void;
  handleCopy: () => void;
  handlePaste: () => void;
  handleDelete?: () => void;
  handleRename?: () => void;
  handleDownload?: (file: FileInfo) => void;
  clipboard: {action: 'copy' | 'cut', files: FileInfo[]} | null;
  showNavigationPane: boolean;
  setShowNavigationPane: (show: boolean) => void;
  setShowNewFolderDialog: (show: boolean) => void;
  setShowNewFileDialog: (show: boolean) => void;
  setShowUploadDialog: (show: boolean) => void;
  pinFolder: (folder: FileInfo) => void;
  isPinned: (path: string) => boolean;
  viewMode?: 'list' | 'grid' | 'detail';
  setViewMode?: (mode: 'list' | 'grid' | 'detail') => void;
  filterCategory?: string;
  setFilterCategory?: (category: string) => void;
  showHidden?: boolean;
  setShowHidden?: (show: boolean) => void;
}

const ExplorerToolbar: React.FC<ExplorerToolbarProps> = ({ 
  currentPath,
  goBack,
  goForward,
  goHome,
  historyIndex,
  navigationHistory,
  fileList,
  loadFileList,
  customPath,
  setCustomPath,
  handleAddressKeyDown,
  searchQuery,
  setSearchQuery,
  searchFiles,
  isSearching,
  clearSearch,
  addressBarRef,
  searchInputRef,
  selectedFile,
  selectedFiles,
  handleCut,
  handleCopy,
  handlePaste,
  handleDelete,
  handleRename,
  handleDownload,
  clipboard,
  showNavigationPane,
  setShowNavigationPane,
  setShowNewFolderDialog,
  setShowNewFileDialog,
  setShowUploadDialog,
  pinFolder,
  isPinned,
  viewMode = 'detail',
  setViewMode = () => {},
  filterCategory = 'all',
  setFilterCategory = () => {},
  showHidden = false,
  setShowHidden = () => {}
}) => {
  const hasSelection = selectedFiles.length > 0;
  const isFolder = selectedFile?.is_dir || false;
  
  return (
    <div className="border-b bg-white">
      {/* Windows 11風タブバー風のツールバー */}
      <div className="flex items-center px-3 py-2 gap-x-2 border-b">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={goBack} disabled={historyIndex <= 0}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={goForward} disabled={historyIndex >= navigationHistory.length - 1}>
          <ChevronRight className="h-4 w-4" />
        </Button>
        
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => loadFileList(fileList?.parent_dir || '')} disabled={!fileList?.parent_dir}>
          <ArrowUp className="h-4 w-4" />
        </Button>
        
        <div className="flex-1 flex items-center border rounded bg-gray-50 hover:bg-white focus-within:bg-white focus-within:ring-1 focus-within:ring-blue-400">
          <div className="flex items-center">
            <Button variant="ghost" className="h-8 px-2 text-gray-500" onClick={goHome}>
              <Home className="h-4 w-4" />
            </Button>
            <span className="text-gray-400">›</span>
          </div>
          <Input
            ref={addressBarRef}
            className="flex-1 border-0 focus-visible:ring-0 h-8 bg-transparent"
            value={customPath}
            onChange={(e) => setCustomPath(e.target.value)}
            onKeyDown={handleAddressKeyDown}
          />
          <Button variant="ghost" className="h-8 px-2" onClick={() => loadFileList(customPath)}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="relative">
          <Input
            ref={searchInputRef}
            className="w-52 h-8 pl-8"
            placeholder="検索..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && searchFiles()}
          />
          <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          {isSearching && (
            <X
              className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 cursor-pointer"
              onClick={clearSearch}
            />
          )}
        </div>
      </div>
      
      {/* Windows 11風リボンツールバー */}
      <div className="p-1 px-2 flex items-center gap-1 transition-colors">
        {/* クリップボード操作 */}
        <div className="flex flex-col items-center border-r pr-2">
          <div className="flex gap-1">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-8 rounded-md"
                    onClick={handleCut}
                    disabled={!hasSelection}
                  >
                    <Scissors className="h-4 w-4 mr-1" />
                    <span className="text-xs">切り取り</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>選択したアイテムを切り取り (Ctrl+X)</TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-8 rounded-md"
                    onClick={handleCopy}
                    disabled={!hasSelection}
                  >
                    <Copy className="h-4 w-4 mr-1" />
                    <span className="text-xs">コピー</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>選択したアイテムをコピー (Ctrl+C)</TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-8 rounded-md"
                    onClick={handlePaste}
                    disabled={!clipboard}
                  >
                    <FileText className="h-4 w-4 mr-1" />
                    <span className="text-xs">貼り付け</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>クリップボードから貼り付け (Ctrl+V)</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <span className="text-xs text-gray-500 font-medium mt-0.5">クリップボード</span>
        </div>
        
        {/* 選択アイテム操作 */}
        <div className="flex flex-col items-center border-r pr-2 pl-1">
          <div className="flex gap-1">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-8 rounded-md"
                    onClick={() => hasSelection && selectedFile && (isFolder ? pinFolder(selectedFile) : handleDownload && handleDownload(selectedFile))}
                    disabled={!hasSelection}
                  >
                    {isFolder ? (
                      <Pin className="h-4 w-4 mr-1" />
                    ) : (
                      <Download className="h-4 w-4 mr-1" />
                    )}
                    <span className="text-xs">{isFolder ? 'ピン留め' : 'ダウンロード'}</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{isFolder ? 'フォルダをピン留め' : 'ファイルをダウンロード'}</TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-8 rounded-md"
                    onClick={handleDelete}
                    disabled={!hasSelection}
                  >
                    <Trash className="h-4 w-4 mr-1 text-red-500" />
                    <span className="text-xs">削除</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>選択したアイテムを削除 (Delete)</TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-8 rounded-md"
                    onClick={handleRename}
                    disabled={!hasSelection || selectedFiles.length > 1}
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    <span className="text-xs">名前の変更</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>選択したアイテムの名前を変更 (F2)</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <span className="text-xs text-gray-500 font-medium mt-0.5">操作</span>
        </div>
        
        {/* 新規作成 */}
        <div className="flex flex-col items-center border-r pr-2 pl-1">
          <div className="flex gap-1">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 rounded-md">
                  <Plus className="h-4 w-4 mr-1" />
                  <span className="text-xs">新規</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-40">
                <DropdownMenuItem onClick={() => setShowNewFolderDialog(true)}>
                  <div className="flex items-center">
                    <Plus className="h-4 w-4 mr-2" />
                    <span>フォルダ</span>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setShowNewFileDialog(true)}>
                  <div className="flex items-center">
                    <FileText className="h-4 w-4 mr-2" />
                    <span>テキストドキュメント</span>
                  </div>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-8 rounded-md"
                    onClick={() => setShowUploadDialog(true)}
                  >
                    <Upload className="h-4 w-4 mr-1" />
                    <span className="text-xs">アップロード</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>ファイルをアップロード</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <span className="text-xs text-gray-500 font-medium mt-0.5">新規</span>
        </div>
        
        {/* 表示オプション */}
        <div className="flex flex-col items-center pl-1">
          <div className="flex gap-1">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-8 rounded-md"
                    onClick={() => setShowNavigationPane(!showNavigationPane)}
                  >
                    <PanelLeft className="h-4 w-4 mr-1" />
                    <span className="text-xs">ナビゲーション</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>ナビゲーションペインの表示/非表示</TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 rounded-md">
                  <Filter className="h-4 w-4 mr-1" />
                  <span className="text-xs">フィルター</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-40">
                <DropdownMenuCheckboxItem
                  checked={showHidden}
                  onCheckedChange={setShowHidden}
                >
                  隠しファイルを表示
                </DropdownMenuCheckboxItem>
                
                <DropdownMenuSeparator />
                <DropdownMenuLabel>ファイルの種類</DropdownMenuLabel>
                
                <DropdownMenuCheckboxItem
                  checked={filterCategory === 'all'}
                  onCheckedChange={() => setFilterCategory('all')}
                >
                  すべてのアイテム
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={filterCategory === 'document'}
                  onCheckedChange={() => setFilterCategory('document')}
                >
                  ドキュメント
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={filterCategory === 'image'}
                  onCheckedChange={() => setFilterCategory('image')}
                >
                  画像
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={filterCategory === 'code'}
                  onCheckedChange={() => setFilterCategory('code')}
                >
                  コード
                </DropdownMenuCheckboxItem>
              </DropdownMenuContent>
            </DropdownMenu>
            
            <ViewModeSelector
              viewMode={viewMode}
              setViewMode={setViewMode}
              showHidden={showHidden}
              setShowHidden={setShowHidden}
              filterCategory={filterCategory}
              setFilterCategory={setFilterCategory}
            />
          </div>
          <span className="text-xs text-gray-500 font-medium mt-0.5">表示</span>
        </div>
        
        {/* 右側スペーサー */}
        <div className="flex-1"></div>
        
        {/* 更新ボタン */}
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-8 w-8 rounded-full"
          onClick={() => loadFileList(currentPath)}
        >
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default ExplorerToolbar;
