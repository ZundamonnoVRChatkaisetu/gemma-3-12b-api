"use client"

import React, { useState, useEffect } from 'react';
import { 
  ChevronDown, 
  ChevronRight, 
  Computer, 
  Laptop,  // Desktopの代わりに
  Folder, 
  FolderOpen, 
  HardDrive, 
  User 
} from 'lucide-react';
import { cn } from '../../../lib/utils';
import { FileInfo, API_BASE_URL } from '../types';

interface FolderTreeProps {
  currentPath: string;
  loadFileList: (path: string) => void;
}

interface TreeNode {
  name: string;
  path: string;
  children: TreeNode[];
  isLoading: boolean;
  isExpanded: boolean;
  isSpecial?: boolean;
  icon?: React.ReactNode;
}

const FolderTree: React.FC<FolderTreeProps> = ({ currentPath, loadFileList }) => {
  const [treeData, setTreeData] = useState<TreeNode[]>([])
  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({})

  // 特殊フォルダとドライブの初期ロード
  useEffect(() => {
    initializeTree()
  }, [])

  const initializeTree = async () => {
    try {
      // ドライブ情報を取得
      const response = await fetch(`${API_BASE_URL}/api/v1/files/drives`)
      const drivesData = await response.json()
      
      // 特殊フォルダを含む初期ツリーデータを作成
      const initialTree: TreeNode[] = [
        {
          name: 'デスクトップ',
          path: 'C:/Users/Public/Desktop',
          children: [],
          isLoading: false,
          isExpanded: false,
          isSpecial: true,
          icon: <Laptop size={16} className="text-blue-500" />
        },
        {
          name: 'ドキュメント',
          path: 'C:/Users/Public/Documents',
          children: [],
          isLoading: false,
          isExpanded: false,
          isSpecial: true,
          icon: <User size={16} className="text-yellow-500" />
        },
        {
          name: 'ダウンロード',
          path: 'C:/Users/Public/Downloads',
          children: [],
          isLoading: false,
          isExpanded: false,
          isSpecial: true,
          icon: <User size={16} className="text-blue-500" />
        },
      ]
      
      // ドライブを追加
      drivesData.drives.forEach((drive: { name: string; path: string }) => {
        initialTree.push({
          name: drive.name,
          path: drive.path,
          children: [],
          isLoading: false,
          isExpanded: false,
          icon: <HardDrive size={16} className="text-gray-500" />
        })
      })
      
      // PC（コンピューター）ノードを追加
      const pcNode: TreeNode = {
        name: 'PC',
        path: '',
        children: drivesData.drives.map((drive: { name: string; path: string }) => ({
          name: drive.name,
          path: drive.path,
          children: [],
          isLoading: false,
          isExpanded: false,
          icon: <HardDrive size={16} className="text-gray-500" />
        })),
        isLoading: false,
        isExpanded: true,
        isSpecial: true,
        icon: <Computer size={16} className="text-blue-500" />
      }
      
      // PCノードを追加
      initialTree.push(pcNode)
      
      setTreeData(initialTree)
      
      // PCノードを自動的に展開
      setExpandedNodes(prev => ({ ...prev, 'PC': true }))
    } catch (error) {
      console.error('フォルダツリーの初期化エラー:', error)
    }
  }

  // 以下の関数の実装は省略（以前のコードと同じ）
  // loadChildFolders, updateNodeLoadingState, updateNodeChildren等

  // レンダリング関数（以前のコードと同じ）
  const renderTreeNodes = (nodes: TreeNode[], level = 0) => {
    return nodes.map(node => (
      // ... 以前のレンダリングロジック
    ))
  }

  return (
    <div className="overflow-auto h-full pb-4">
      <div className="font-medium text-sm py-2 px-3 text-gray-700">
        フォルダ
      </div>
      <div className="px-2">
        {renderTreeNodes(treeData)}
      </div>
    </div>
  )
}

export default FolderTree
