"use client"

import React from 'react';
import { 
  List, Grid3x3, Table, MoreHorizontal
} from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '../../../components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../../../components/ui/tooltip';

interface ViewModeSelectorProps {
  viewMode: 'list' | 'grid' | 'detail';
  setViewMode: (mode: 'list' | 'grid' | 'detail') => void;
  showHidden: boolean;
  setShowHidden: (show: boolean) => void;
  filterCategory: string;
  setFilterCategory: (category: string) => void;
}

const ViewModeSelector: React.FC<ViewModeSelectorProps> = ({
  viewMode,
  setViewMode,
  showHidden,
  setShowHidden,
  filterCategory,
  setFilterCategory
}) => {
  return (
    <div className="flex items-center gap-1">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button 
              size="sm" 
              variant={viewMode === 'list' ? 'default' : 'ghost'} 
              onClick={() => setViewMode('list')}
              className="h-8 w-8 p-0"
            >
              <List className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>リスト表示</TooltipContent>
        </Tooltip>
      </TooltipProvider>
      
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button 
              size="sm" 
              variant={viewMode === 'grid' ? 'default' : 'ghost'} 
              onClick={() => setViewMode('grid')}
              className="h-8 w-8 p-0"
            >
              <Grid3x3 className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>アイコン表示</TooltipContent>
        </Tooltip>
      </TooltipProvider>
      
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button 
              size="sm" 
              variant={viewMode === 'detail' ? 'default' : 'ghost'} 
              onClick={() => setViewMode('detail')}
              className="h-8 w-8 p-0"
            >
              <Table className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>詳細表示</TooltipContent>
        </Tooltip>
      </TooltipProvider>
      
      <DropdownMenu>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <DropdownMenuTrigger asChild>
                <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
            </TooltipTrigger>
            <TooltipContent>表示オプション</TooltipContent>
          </Tooltip>
        </TooltipProvider>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => setShowHidden(!showHidden)}>
            <div className="flex items-center">
              <input
                type="checkbox"
                checked={showHidden}
                onChange={() => {}}
                className="mr-2"
              />
              <span>隠しファイルを表示</span>
            </div>
          </DropdownMenuItem>
          
          <DropdownMenuSeparator />
          
          <DropdownMenuItem
            onClick={() => setFilterCategory('all')}
            className={filterCategory === 'all' ? 'bg-blue-50' : ''}
          >
            すべてのアイテム
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => setFilterCategory('document')}
            className={filterCategory === 'document' ? 'bg-blue-50' : ''}
          >
            ドキュメント
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => setFilterCategory('image')}
            className={filterCategory === 'image' ? 'bg-blue-50' : ''}
          >
            画像
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => setFilterCategory('code')}
            className={filterCategory === 'code' ? 'bg-blue-50' : ''}
          >
            コード
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export default ViewModeSelector;
