"use client"

import React, { useState, useEffect } from 'react';
import { 
  ChevronDown, 
  ChevronRight, 
  Computer, 
  Laptop,  
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

// パスをURLセーフに変換する関数
const sanitizePath = (path: string): string => {
  // バックスラッシュをスラッシュに置換
  let sanitized = path.replace(/\\/g, '/');
  
  // 先頭と末尾の余分なスラッシュを除去
  sanitized = sanitized.replace(/^\/+|\/+$/g, '');
  
  return encodeURIComponent(sanitized);
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
      const drivesResponse = await fetch(`${API_BASE_URL}/api/v1/files/drives`)
      const drivesData = await drivesResponse.json()
      
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

  // フォルダ展開時にサブフォルダを読み込む
  const loadChildFolders = async (node: TreeNode) => {
    if (node.children.length > 0 && expandedNodes[node.path]) {
      // すでに子を読み込み済みで、展開済みの場合は折りたたむだけ
      setExpandedNodes(prev => ({ ...prev, [node.path]: !prev[node.path] }))
      return
    }
    
    // 展開状態を更新
    setExpandedNodes(prev => ({ ...prev, [node.path]: true }))
    
    // ノードのローディング状態を更新
    updateNodeLoadingState(node.path, true)
    
    try {
      // サブフォルダを取得 - クエリ文字列を明示的に構築
      const safePathQuery = sanitizePath(node.path)
      const listUrl = `${API_BASE_URL}/api/v1/files/list?path=${safePathQuery}&sort_by=name&sort_desc=false&show_hidden=false`

      console.log('APIリクエストURL:', listUrl)  // デバッグ用のログ

      const response = await fetch(listUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`)
      }

      const data = await response.json()
      
      // フォルダのみをフィルタリング
      const folders = data.files.filter((file: FileInfo) => file.is_dir)
      
      // 子ノードを更新
      updateNodeChildren(node.path, folders.map((folder: FileInfo) => ({
        name: folder.name,
        path: folder.path,
        children: [],
        isLoading: false,
        isExpanded: false
      })))
    } catch (error) {
      console.error('サブフォルダ読み込みエラー:', error)
      
      // エラー時のユーザーフィードバック
      alert(`フォルダの読み込み中にエラーが発生しました: ${error instanceof Error ? error.message : String(error)}`)
    } finally {
      // ノードのローディング状態を更新
      updateNodeLoadingState(node.path, false)
    }
  }

  // 以下のメソッドは以前と同じ...

  // ツリーノードを再帰的にレンダリング
  const renderTreeNodes = (nodes: TreeNode[], level = 0) => {
    return nodes.map(node => (
      <div key={node.path} className="select-none">
        <div
          className={cn(
            "flex items-center py-1 rounded hover:bg-gray-100 cursor-pointer",
            currentPath === node.path ? "bg-blue-100" : ""
          )}
          style={{ paddingLeft: `${level * 16 + 4}px` }}
        >
          <span
            onClick={(e) => handleExpandClick(node, e)}
            className="w-5 flex items-center justify-center"
          >
            {node.isLoading ? (
              <span className="h-3 w-3 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
            ) : (
              expandedNodes[node.path] ? (
                <ChevronDown size={14} />
              ) : (
                <ChevronRight size={14} />
              )
            )}
          </span>
          <span
            className="flex items-center gap-1 truncate"
            onClick={() => handleFolderClick(node)}
          >
            {node.icon || (expandedNodes[node.path] ? (
              <FolderOpen size={16} className="text-yellow-500" />
            ) : (
              <Folder size={16} className="text-yellow-500" />
            ))}
            <span className="truncate text-sm">{node.name}</span>
          </span>
        </div>
        {expandedNodes[node.path] && node.children.length > 0 && (
          <div className="ml-2">
            {renderTreeNodes(node.children, level + 1)}
          </div>
        )}
      </div>
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
