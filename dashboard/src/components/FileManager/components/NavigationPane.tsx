"use client"

import React, { useState } from 'react';
import { Folder, ChevronDown, ChevronRight, Star, Pin, X, Home, Clock, HardDrive } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '../../../components/ui/collapsible';
import { PinnedFolder } from '../types';
import { defaultQuickAccessItems } from '../types';
import FolderTree from './FolderTree';
import { Separator } from '../../../components/ui/separator';

interface NavigationPaneProps {
  showNavigationPane: boolean;
  quickAccessExpanded: boolean;
  setQuickAccessExpanded: (expanded: boolean) => void;
  pinnedFoldersExpanded: boolean;
  setPinnedFoldersExpanded: (expanded: boolean) => void;
  pinnedFolders: PinnedFolder[];
  currentPath: string;
  loadFileList: (path: string) => void;
  unpinFolder: (path: string) => void;
}

const NavigationPane: React.FC<NavigationPaneProps> = ({
  showNavigationPane,
  quickAccessExpanded,
  setQuickAccessExpanded,
  pinnedFoldersExpanded,
  setPinnedFoldersExpanded,
  pinnedFolders,
  currentPath,
  loadFileList,
  unpinFolder
}) => {
  const [folderTreeExpanded, setFolderTreeExpanded] = useState(true);
  
  if (!showNavigationPane) return null;
  
  return (
    <div className="w-64 border-r overflow-auto h-full bg-gray-50">
      {/* Windows 11風のヘッダー */}
      <div className="px-3 py-3 bg-white border-b font-medium text-sm">
        エクスプローラー
      </div>
      
      <div className="py-2">
        {/* クイックアクセス */}
        <div className="px-3 py-1.5 flex items-center gap-2 hover:bg-gray-200 cursor-pointer rounded-sm mx-1"
             onClick={() => loadFileList('C:/Users/Public/Documents')}>
          <Home className="h-4 w-4 text-gray-600" />
          <span className="text-sm">ホーム</span>
        </div>
        
        <div className="px-3 py-1.5 flex items-center gap-2 hover:bg-gray-200 cursor-pointer rounded-sm mx-1"
             onClick={() => {}}>
          <Clock className="h-4 w-4 text-gray-600" />
          <span className="text-sm">最近使用したファイル</span>
        </div>
        
        <Separator className="my-2 mx-3" />
        
        {/* クイックアクセス */}
        <Collapsible 
          open={quickAccessExpanded} 
          onOpenChange={setQuickAccessExpanded}
          className="mb-1"
        >
          <CollapsibleTrigger className="flex items-center w-full text-left py-1.5 px-3 hover:bg-gray-200 rounded-sm mx-1">
            <div className="flex items-center">
              {quickAccessExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
              <Star className="ml-1 mr-2 h-4 w-4 text-yellow-500" />
              <span className="text-sm">クイックアクセス</span>
            </div>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="pl-7 mt-1">
              {defaultQuickAccessItems.length > 0 ? (
                defaultQuickAccessItems.map((item) => (
                  <div
                    key={item.path}
                    className={`flex items-center py-1 px-3 rounded-sm cursor-pointer hover:bg-gray-200 mx-1 ${ 
                      currentPath === item.path ? 'bg-blue-100' : ''
                    }`}
                    onClick={() => loadFileList(item.path)}
                  >
                    <Folder className="mr-2 h-4 w-4 text-yellow-500" />
                    <span className="truncate text-sm">{item.name}</span>
                  </div>
                ))
              ) : (
                <div className="py-1.5 px-3 text-sm text-gray-500">
                  アイテムはありません
                </div>
              )}
            </div>
          </CollapsibleContent>
        </Collapsible>

        {/* ピン止めされたフォルダ */}
        {pinnedFolders.length > 0 && (
          <Collapsible 
            open={pinnedFoldersExpanded} 
            onOpenChange={setPinnedFoldersExpanded}
            className="mb-1"
          >
            <CollapsibleTrigger className="flex items-center w-full text-left py-1.5 px-3 hover:bg-gray-200 rounded-sm mx-1">
              <div className="flex items-center">
                {pinnedFoldersExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                <Pin className="ml-1 mr-2 h-4 w-4 text-blue-500" />
                <span className="text-sm">ピン留めフォルダ</span>
              </div>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="pl-7 mt-1">
                {pinnedFolders.filter(item => !item.isQuickAccess).map((item) => (
                  <div
                    key={item.path}
                    className={`flex items-center justify-between py-1 px-3 rounded-sm cursor-pointer hover:bg-gray-200 group mx-1 ${
                      currentPath === item.path ? 'bg-blue-100' : ''
                    }`}
                  >
                    <div className="flex items-center flex-1" onClick={() => loadFileList(item.path)}>
                      <Folder className="mr-2 h-4 w-4 text-yellow-500" />
                      <span className="truncate text-sm">{item.name}</span>
                    </div>
                    <button 
                      className="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-300 rounded-full"
                      onClick={() => unpinFolder(item.path)}
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
            </CollapsibleContent>
          </Collapsible>
        )}
        
        {/* デバイスとドライブ */}
        <Collapsible 
          open={true} 
          className="mb-1"
        >
          <CollapsibleTrigger className="flex items-center w-full text-left py-1.5 px-3 hover:bg-gray-200 rounded-sm mx-1">
            <div className="flex items-center">
              <ChevronDown size={16} />
              <HardDrive className="ml-1 mr-2 h-4 w-4 text-gray-600" />
              <span className="text-sm">デバイスとドライブ</span>
            </div>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="pl-7 mt-1">
              <div
                className={`flex items-center py-1 px-3 rounded-sm cursor-pointer hover:bg-gray-200 mx-1 ${
                  currentPath.startsWith('C:') ? 'bg-blue-100' : ''
                }`}
                onClick={() => loadFileList('C:/')}
              >
                <HardDrive className="mr-2 h-4 w-4 text-gray-600" />
                <span className="truncate text-sm">ローカルディスク (C:)</span>
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>

        <Separator className="my-2 mx-3" />

        {/* フォルダツリー */}
        <Collapsible 
          open={folderTreeExpanded} 
          onOpenChange={setFolderTreeExpanded}
        >
          <CollapsibleTrigger className="flex items-center w-full text-left py-1.5 px-3 hover:bg-gray-200 rounded-sm mx-1">
            <div className="flex items-center">
              {folderTreeExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
              <Folder className="ml-1 mr-2 h-4 w-4 text-yellow-500" />
              <span className="text-sm">フォルダツリー</span>
            </div>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="mt-1">
              <FolderTree 
                currentPath={currentPath}
                loadFileList={loadFileList}
              />
            </div>
          </CollapsibleContent>
        </Collapsible>
      </div>
    </div>
  );
};

export default NavigationPane;
