import React from 'react';
import { 
  ArrowUp, RefreshCw, Plus, Upload, Download, Trash, 
  Copy, Scissor, Edit, Info, MoreHorizontal, Search, X,
  Clipboard, List, Grid, SortAsc, SortDesc, Eye, EyeOff, 
  Settings, Maximize2, Minimize2, FileText, Folder 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, 
  DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuGroup,
  DropdownMenuLabel
} from '@/components/ui/dropdown-menu';
import { FileInfo, FileListResponse } from './types';

interface ToolbarProps {
  fileList: FileListResponse | null;
  currentPath: string;
  selectedFiles: FileInfo[];
  clipboardFiles: { files: FileInfo[], operation: 'copy' | 'cut' } | null;
  isSearching: boolean;
  searchQuery: string;
  viewMode: 'list' | 'icons' | 'details';
  showHidden: boolean;
  sortDesc: boolean;
  isFullscreen: boolean;
  onPathChange: (path: string) => Promise<void>;
  onRefresh: () => Promise<void>;
  onNewFolder: () => void;
  onNewFile: () => void;
  onUpload: () => void;
  onDownload: () => void;
  onDelete: () => void;
  onCopy: () => void;
  onCut: () => void;
  onPaste: () => Promise<void>;
  onRename: () => void;
  onProperties: () => void;
  onSearch: () => Promise<void>;
  onClearSearch: () => void;
  onSearchQueryChange: (query: string) => void;
  onViewModeChange: (mode: 'list' | 'icons' | 'details') => void;
  onToggleHidden: () => void;
  onSortByChange: (field: string) => void;
  onToggleSortDirection: () => void;
  onShowPreferences: () => void;
  onToggleFullscreen: () => void;
}

export const Toolbar: React.FC<ToolbarProps> = ({
  fileList,
  currentPath,
  selectedFiles,
  clipboardFiles,
  isSearching,
  searchQuery,
  viewMode,
  showHidden,
  sortDesc,
  isFullscreen,
  onPathChange,
  onRefresh,
  onNewFolder,
  onNewFile,
  onUpload,
  onDownload,
  onDelete,
  onCopy,
  onCut,
  onPaste,
  onRename,
  onProperties,
  onSearch,
  onClearSearch,
  onSearchQueryChange,
  onViewModeChange,
  onToggleHidden,
  onSortByChange,
  onToggleSortDirection,
  onShowPreferences,
  onToggleFullscreen
}) => (
  <div className="flex flex-wrap gap-2 mb-4 p-2 bg-gray-100 rounded-md shadow-sm">
    <Button
      size="sm"
      variant="outline"
      onClick={() => fileList?.parent_dir ? onPathChange(fileList.parent_dir) : null}
      disabled={!fileList?.parent_dir}
    >
      <ArrowUp className="h-4 w-4 mr-1" />
      上へ
    </Button>
    
    <Button
      size="sm"
      variant="outline"
      onClick={onRefresh}
    >
      <RefreshCw className="h-4 w-4 mr-1" />
      更新
    </Button>
    
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button size="sm" variant="outline">
          <Plus className="h-4 w-4 mr-1" />
          新規
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem onClick={onNewFolder}>
          <Folder className="h-4 w-4 mr-2" />
          フォルダ
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onNewFile}>
          <FileText className="h-4 w-4 mr-2" />
          ファイル
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
    
    <Button
      size="sm"
      variant="outline"
      onClick={onUpload}
    >
      <Upload className="h-4 w-4 mr-1" />
      アップロード
    </Button>
    
    {selectedFiles.length > 0 && (
      <>
        <Button
          size="sm"
          variant="outline"
          onClick={onDownload}
          disabled={selectedFiles.every(f => f.is_dir)}
        >
          <Download className="h-4 w-4 mr-1" />
          ダウンロード
        </Button>
        
        <Button
          size="sm"
          variant="outline"
          onClick={onDelete}
        >
          <Trash className="h-4 w-4 mr-1" />
          削除
        </Button>
        
        <Button
          size="sm"
          variant="outline"
          onClick={onCopy}
        >
          <Copy className="h-4 w-4 mr-1" />
          コピー
        </Button>
        
        <Button
          size="sm"
          variant="outline"
          onClick={onCut}
        >
          <Scissor className="h-4 w-4 mr-1" />
          切り取り
        </Button>
        
        {selectedFiles.length === 1 && (
          <>
            <Button
              size="sm"
              variant="outline"
              onClick={onRename}
            >
              <Edit className="h-4 w-4 mr-1" />
              名前変更
            </Button>
            
            <Button
              size="sm"
              variant="outline"
              onClick={onProperties}
            >
              <Info className="h-4 w-4 mr-1" />
              プロパティ
            </Button>
          </>
        )}
      </>
    )}
    
    {clipboardFiles && (
      <Button
        size="sm"
        variant="outline"
        onClick={onPaste}
      >
        <Clipboard className="h-4 w-4 mr-1" />
        貼り付け
      </Button>
    )}
    
    <div className="flex-grow"></div>
    
    <div className="flex gap-2 items-center">
      <Input
        className="w-60"
        placeholder="ファイル名を検索..."
        value={searchQuery}
        onChange={(e) => onSearchQueryChange(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && onSearch()}
      />
      <Button
        size="sm"
        variant="outline"
        onClick={onSearch}
        disabled={!searchQuery.trim()}
      >
        <Search className="h-4 w-4" />
      </Button>
      {isSearching && (
        <Button
          size="sm"
          variant="ghost"
          onClick={onClearSearch}
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
    
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button size="sm" variant="outline">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuGroup>
          <DropdownMenuLabel>表示</DropdownMenuLabel>
          <DropdownMenuItem onClick={() => onViewModeChange('list')}>
            <List className="h-4 w-4 mr-2" />
            リスト表示
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onViewModeChange('icons')}>
            <Grid className="h-4 w-4 mr-2" />
            アイコン表示
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onViewModeChange('details')}>
            <FileText className="h-4 w-4 mr-2" />
            詳細表示
          </DropdownMenuItem>
        </DropdownMenuGroup>
        
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuLabel>ファイル</DropdownMenuLabel>
          <DropdownMenuItem onClick={onToggleHidden}>
            {showHidden ? <EyeOff className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
            {showHidden ? '隠しファイルを非表示' : '隠しファイルを表示'}
          </DropdownMenuItem>
        </DropdownMenuGroup>
        
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuLabel>並べ替え</DropdownMenuLabel>
          <DropdownMenuItem onClick={() => onSortByChange('name')}>
            名前でソート
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onSortByChange('size')}>
            サイズでソート
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onSortByChange('modified')}>
            更新日時でソート
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onToggleSortDirection}>
            {sortDesc ? <SortAsc className="h-4 w-4 mr-2" /> : <SortDesc className="h-4 w-4 mr-2" />}
            {sortDesc ? '昇順に変更' : '降順に変更'}
          </DropdownMenuItem>
        </DropdownMenuGroup>
        
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={onShowPreferences}>
          <Settings className="h-4 w-4 mr-2" />
          設定
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onToggleFullscreen}>
          {isFullscreen ? <Minimize2 className="h-4 w-4 mr-2" /> : <Maximize2 className="h-4 w-4 mr-2" />}
          {isFullscreen ? 'フルスクリーン解除' : 'フルスクリーン'}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  </div>
);
