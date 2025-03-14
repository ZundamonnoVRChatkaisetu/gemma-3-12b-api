"use client"

import React from 'react';
import { ChevronRight, ChevronDown, X, Star, Pin, Folder } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '../../../components/ui/collapsible';
import { PinnedFolder } from '../types';
import { defaultQuickAccessItems } from '../constants';

interface NavigationPaneProps {
  showNavigationPane: boolean;
  quickAccessExpanded: boolean;
  setQuickAccessExpanded: (value: boolean) => void;
  pinnedFoldersExpanded: boolean;
  setPinnedFoldersExpanded: (value: boolean) => void;
  currentPath: string;
  loadFileList: (path: string) => void;
  pinnedFolders: PinnedFolder[];
  unpinFolder: (path: string) => void;
}

// Windows Explorerライクなナビゲーションペイン（左サイドバー）
const NavigationPane: React.FC<NavigationPaneProps> = ({
  showNavigationPane,
  quickAccessExpanded,
  setQuickAccessExpanded,
  pinnedFoldersExpanded,
  setPinnedFoldersExpanded,
  currentPath,
  loadFileList,
  pinnedFolders,
  unpinFolder
}) => {
  if (!showNavigationPane) return null;
  
  return (
    <div className="w-64 border-r overflow-auto h-full">
      <div className="px-2 py-3">
        {/* クイックアクセス */}
        <Collapsible 
          open={quickAccessExpanded} 
          onOpenChange={setQuickAccessExpanded}
          className="mb-3"
        >
          <CollapsibleTrigger className="flex items-center w-full text-left py-1 px-2 hover:bg-gray-100 rounded">
            <div className="flex items-center">
              {quickAccessExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
              <Star className="ml-1 mr-2 h-4 w-4 text-yellow-500" />
              <span className="font-medium">クイックアクセス</span>
            </div>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="pl-7 mt-1">
              {defaultQuickAccessItems.map((item) => (
                <div
                  key={item.path}
                  className={`flex items-center py-1 px-2 rounded cursor-pointer hover:bg-gray-100 ${
                    currentPath === item.path ? 'bg-blue-100' : ''
                  }`}
                  onClick={() => loadFileList(item.path)}
                >
                  <Folder className="mr-2 h-4 w-4 text-yellow-500" />
                  <span className="truncate text-sm">{item.name}</span>
                </div>
              ))}
            </div>
          </CollapsibleContent>
        </Collapsible>

        {/* ピン止めされたフォルダ */}
        {pinnedFolders.length > 0 && (
          <Collapsible 
            open={pinnedFoldersExpanded} 
            onOpenChange={setPinnedFoldersExpanded}
            className="mb-3"
          >
            <CollapsibleTrigger className="flex items-center w-full text-left py-1 px-2 hover:bg-gray-100 rounded">
              <div className="flex items-center">
                {pinnedFoldersExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                <Pin className="ml-1 mr-2 h-4 w-4 text-blue-500" />
                <span className="font-medium">ピン留めフォルダ</span>
              </div>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="pl-7 mt-1">
                {pinnedFolders.filter(item => !item.isQuickAccess).map((item) => (
                  <div
                    key={item.path}
                    className={`flex items-center justify-between py-1 px-2 rounded cursor-pointer hover:bg-gray-100 group ${
                      currentPath === item.path ? 'bg-blue-100' : ''
                    }`}
                  >
                    <div className="flex items-center flex-1" onClick={() => loadFileList(item.path)}>
                      <Folder className="mr-2 h-4 w-4 text-yellow-500" />
                      <span className="truncate text-sm">{item.name}</span>
                    </div>
                    <button 
                      className="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-200 rounded-full"
                      onClick={() => unpinFolder(item.path)}
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </CollapsibleContent>
          </Collapsible>
        )}
        
        {/* フォルダツリー（後日実装） */}
        <div className="text-sm text-gray-500 pl-2 mt-4">
          フォルダツリーはこの位置に表示されます
        </div>
      </div>
    </div>
  );
};

export default NavigationPane;
