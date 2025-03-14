"use client"

import React from 'react';
import { 
  ChevronLeft, ChevronRight, ArrowUp, RefreshCw, Plus, Upload, Pin,
  Scissors, Copy, FileText, PanelLeft, Search, X
} from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../../../components/ui/tooltip';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Separator } from '../../../components/ui/separator';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../../../components/ui/dropdown-menu';
import { FileInfo } from '../types';

interface ExplorerToolbarProps {
  currentPath: string;
  goBack: () => void;
  goForward: () => void;
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
  clipboard: {action: 'copy' | 'cut', files: FileInfo[]} | null;
  showNavigationPane: boolean;
  setShowNavigationPane: (show: boolean) => void;
  setShowNewFolderDialog: (show: boolean) => void;
  setShowNewFileDialog: (show: boolean) => void;
  setShowUploadDialog: (show: boolean) => void;
  pinFolder: (folder: FileInfo) => void;
  isPinned: (path: string) => boolean;
}

const ExplorerToolbar: React.FC<ExplorerToolbarProps> = ({ 
  currentPath,
  goBack,
  goForward,
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
  clipboard,
  showNavigationPane,
  setShowNavigationPane,
  setShowNewFolderDialog,
  setShowNewFileDialog,
  setShowUploadDialog,
  pinFolder,
  isPinned
}) => (
  <div className="border-b bg-gray-100">
    {/* ナビゲーションボタンとアドレスバー */}
    <div className="flex items-center p-1 gap-1 border-b">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button 
              size="sm" 
              variant="ghost" 
              onClick={goBack}
              disabled={historyIndex <= 0}
              className="h-8 w-8 p-0"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>戻る</TooltipContent>
        </Tooltip>
      </TooltipProvider>
      
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button 
              size="sm" 
              variant="ghost" 
              onClick={goForward}
              disabled={historyIndex >= navigationHistory.length - 1}
              className="h-8 w-8 p-0"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>進む</TooltipContent>
        </Tooltip>
      </TooltipProvider>
      
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button 
              size="sm" 
              variant="ghost" 
              onClick={() => loadFileList(fileList?.parent_dir || '')}
              disabled={!fileList?.parent_dir}
              className="h-8 w-8 p-0"
            >
              <ArrowUp className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>上へ</TooltipContent>
        </Tooltip>
      </TooltipProvider>
      
      <div className="flex-1 px-1">
        <div className="flex items-center border rounded bg-white">
          <span className="text-gray-500 px-2">場所:</span>
          <Input
            ref={addressBarRef}
            className="flex-1 border-0 focus-visible:ring-0 h-8"
            value={customPath}
            onChange={(e) => setCustomPath(e.target.value)}
            onKeyDown={handleAddressKeyDown}
          />
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-8 px-2"
            onClick={() => loadFileList(customPath)}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      <div className="relative">
        <Input
          ref={searchInputRef}
          className="w-48 h-8"
          placeholder="検索..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && searchFiles()}
        />
        <Search className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        {isSearching && (
          <X
            className="absolute right-8 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 cursor-pointer"
            onClick={clearSearch}
          />
        )}
      </div>
    </div>
    
    {/* リボンツールバー */}
    <div className="p-1 flex flex-wrap gap-1">
      <Button 
        variant="ghost" 
        size="sm"
        onClick={() => loadFileList(currentPath)}
        className="h-9"
      >
        <RefreshCw className="h-4 w-4 mr-1" />
        <span>更新</span>
      </Button>
      
      <Separator orientation="vertical" className="h-8 mx-1" />
      
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="h-9">
            <Plus className="h-4 w-4 mr-1" />
            <span>新規</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem onClick={() => setShowNewFolderDialog(true)}>
            フォルダ
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setShowNewFileDialog(true)}>
            テキストドキュメント
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      
      <Separator orientation="vertical" className="h-8 mx-1" />
      
      <Button 
        variant="ghost" 
        size="sm"
        onClick={() => setShowUploadDialog(true)}
        className="h-9"
      >
        <Upload className="h-4 w-4 mr-1" />
        <span>アップロード</span>
      </Button>

      {selectedFile && selectedFile.is_dir && (
        <Button 
          variant="ghost" 
          size="sm"
          onClick={() => pinFolder(selectedFile)}
          disabled={isPinned(selectedFile.path)}
          className="h-9"
        >
          <Pin className="h-4 w-4 mr-1" />
          <span>ピン留め</span>
        </Button>
      )}
      
      <Separator orientation="vertical" className="h-8 mx-1" />
      
      <Button 
        variant="ghost" 
        size="sm"
        onClick={handleCut}
        disabled={selectedFiles.length === 0}
        className="h-9"
      >
        <Scissors className="h-4 w-4 mr-1" />
        <span>切り取り</span>
      </Button>
      
      <Button 
        variant="ghost" 
        size="sm"
        onClick={handleCopy}
        disabled={selectedFiles.length === 0}
        className="h-9"
      >
        <Copy className="h-4 w-4 mr-1" />
        <span>コピー</span>
      </Button>
      
      <Button 
        variant="ghost" 
        size="sm"
        onClick={handlePaste}
        disabled={!clipboard}
        className="h-9"
      >
        <FileText className="h-4 w-4 mr-1" />
        <span>貼り付け</span>
      </Button>
      
      <Separator orientation="vertical" className="h-8 mx-1" />
      
      <Button 
        variant="ghost" 
        size="sm"
        onClick={() => setShowNavigationPane(!showNavigationPane)}
        className="h-9"
      >
        <PanelLeft className="h-4 w-4 mr-1" />
        <span>ナビゲーションウィンドウ</span>
      </Button>
    </div>
  </div>
);

export default ExplorerToolbar;
