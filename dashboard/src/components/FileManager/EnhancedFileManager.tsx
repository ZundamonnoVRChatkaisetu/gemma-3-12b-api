import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useHotkeys } from 'react-hotkeys-hook';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/components/ui/use-toast';

// 型定義とサブコンポーネントをインポート
import { FileInfo, FileListResponse, FileContentResponse, FileManagerPreferences } from './types';
import { FileIcon } from './FileManagerIcons';
import { FileListView, FileIconsView, FileDetailsView } from './FileManagerViews';
import {
  DeleteDialog, RenameDialog, MoveDialog, CopyDialog, NewFolderDialog,
  NewFileDialog, UploadDialog, PropertiesDialog, FileViewer, PreferencesDialog,
  KeyboardShortcutsHelp
} from './FileManagerDialogs';
import { ContextMenu } from './FileManagerContextMenu';
import { Toolbar } from './FileManagerToolbar';
import { BreadcrumbNav, StatusBar } from './FileManagerNavigation';

// EnhancedFileManagerコンポーネント
const EnhancedFileManager: React.FC = () => {
  // 状態管理
  const [currentPath, setCurrentPath] = useState('');
  const [fileList, setFileList] = useState<FileListResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'icons' | 'details'>('list');
  const [sortBy, setSortBy] = useState('name');
  const [sortDesc, setSortDesc] = useState(false);
  const [showHidden, setShowHidden] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<FileInfo[]>([]);
  const [lastSelectedIndex, setLastSelectedIndex] = useState<number | null>(null);
  const [clipboardFiles, setClipboardFiles] = useState<{ files: FileInfo[], operation: 'copy' | 'cut' } | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [rightClickedFile, setRightClickedFile] = useState<FileInfo | null>(null);
  const [contextMenuPosition, setContextMenuPosition] = useState<{ x: number, y: number } | null>(null);
  const dropzoneRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);

  // ファイル操作関連の状態
  const [fileContent, setFileContent] = useState<FileContentResponse | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editedContent, setEditedContent] = useState('');
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showRenameDialog, setShowRenameDialog] = useState(false);
  const [showMoveDialog, setShowMoveDialog] = useState(false);
  const [showCopyDialog, setShowCopyDialog] = useState(false);
  const [showNewFolderDialog, setShowNewFolderDialog] = useState(false);
  const [showNewFileDialog, setShowNewFileDialog] = useState(false);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [showPropertiesDialog, setShowPropertiesDialog] = useState(false);
  const [newName, setNewName] = useState('');
  const [destination, setDestination] = useState('');
  const [newFolderName, setNewFolderName] = useState('');
  const [newFileName, setNewFileName] = useState('');
  const [newFileContent, setNewFileContent] = useState('');
  const [uploadFiles, setUploadFiles] = useState<FileList | null>(null);

  // プリファレンス
  const [preferences, setPreferences] = useState<FileManagerPreferences>({
    theme: 'system',
    showHiddenFiles: false,
    iconSize: 48,
    defaultView: 'list',
    confirmDelete: true,
    showExtensions: true,
    showStatusBar: true,
    sortBy: 'name',
    sortDirection: 'asc',
  });
  const [showPreferences, setShowPreferences] = useState(false);

  // ファイルリスト読み込み
  const loadFileList = useCallback(async (path = '') => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/v1/files/list?path=${encodeURIComponent(path)}&sort_by=${sortBy}&sort_desc=${sortDesc}&show_hidden=${showHidden}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'ファイルリストの取得に失敗しました');
      }
      
      const data = await response.json();
      setFileList(data);
      setCurrentPath(path);
      setSelectedFiles([]);
      setLastSelectedIndex(null);
    } catch (error) {
      console.error('ファイルリスト取得エラー:', error);
      toast({
        title: 'エラー',
        description: error instanceof Error ? error.message : 'ファイルリストの取得に失敗しました',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [sortBy, sortDesc, showHidden]);

  // 検索
  const searchFiles = async () => {
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    setIsLoading(true);
    
    try {
      const response = await fetch('/api/v1/files/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          path: currentPath,
          query: searchQuery,
          recursive: true,
          case_sensitive: false,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || '検索に失敗しました');
      }
      
      const data = await response.json();
      setFileList(data);
      setSelectedFiles([]);
      setLastSelectedIndex(null);
    } catch (error) {
      console.error('検索エラー:', error);
      toast({
        title: 'エラー',
        description: error instanceof Error ? error.message : '検索に失敗しました',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // 検索クリア
  const clearSearch = () => {
    setSearchQuery('');
    setIsSearching(false);
    loadFileList(currentPath);
  };

  // ファイルを選択する関数
  const selectFile = (file: FileInfo, index: number, event: React.MouseEvent) => {
    // Ctrlキーが押されている場合
    if (event.ctrlKey) {
      // すでに選択されている場合、選択解除
      if (selectedFiles.some(f => f.path === file.path)) {
        setSelectedFiles(selectedFiles.filter(f => f.path !== file.path));
      } else {
        // 選択されていない場合、追加選択
        setSelectedFiles([...selectedFiles, file]);
      }
      setLastSelectedIndex(index);
    }
    // Shiftキーが押されている場合
    else if (event.shiftKey && lastSelectedIndex !== null && fileList) {
      const start = Math.min(index, lastSelectedIndex);
      const end = Math.max(index, lastSelectedIndex);
      
      // start から end までの範囲のファイルを選択
      const newSelection = fileList.files.slice(start, end + 1);
      
      // 既存の選択と組み合わせて重複を排除
      const combinedSelection = [...selectedFiles];
      newSelection.forEach(f => {
        if (!combinedSelection.some(existing => existing.path === f.path)) {
          combinedSelection.push(f);
        }
      });
      
      setSelectedFiles(combinedSelection);
    }
    // 通常クリックの場合、単一選択
    else {
      setSelectedFiles([file]);
      setLastSelectedIndex(index);
    }
  };

  // ファイルの内容を取得する関数
  const fetchFileContent = async (path: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/v1/files/read?path=${encodeURIComponent(path)}`);
      
      if (!response.ok) {
        if (response.status === 400) {
          // バイナリファイルの場合
          throw new Error('このファイルは直接開くことができません');
        }
        const errorData = await response.json();
        throw new Error(errorData.detail || 'ファイルの読み込みに失敗しました');
      }
      
      const data = await response.json();
      setFileContent(data);
      setEditedContent(data.content);
      setIsEditMode(false);
    } catch (error) {
      console.error('ファイル読み込みエラー:', error);
      toast({
        title: 'エラー',
        description: error instanceof Error ? error.message : 'ファイルの読み込みに失敗しました',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // ファイルをダブルクリックで開く関数
  const openFile = (file: FileInfo) => {
    if (file.is_dir) {
      loadFileList(file.path);
    } else {
      setSelectedFiles([file]);
      fetchFileContent(file.path);
    }
  };

  // 複数ファイルを削除する関数
  const deleteFiles = async () => {
    if (selectedFiles.length === 0) return;
    
    setIsLoading(true);
    let successCount = 0;
    let failCount = 0;
    
    for (const file of selectedFiles) {
      try {
        const response = await fetch(`/api/v1/files/delete?path=${encodeURIComponent(file.path)}`, {
          method: 'DELETE',
        });
        
        if (response.ok) {
          successCount++;
        } else {
          failCount++;
        }
      } catch (error) {
        console.error('削除エラー:', error);
        failCount++;
      }
    }
    
    // 削除が完了したらファイルリストを再読み込み
    await loadFileList(currentPath);
    
    // 結果をトースト通知
    if (successCount > 0 && failCount === 0) {
      toast({
        title: '成功',
        description: `${successCount}個のアイテムを削除しました`,
      });
    } else if (successCount > 0 && failCount > 0) {
      toast({
        title: '一部成功',
        description: `${successCount}個のアイテムを削除しました (${failCount}個の失敗)`,
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'エラー',
        description: '削除に失敗しました',
        variant: 'destructive',
      });
    }
    
    setShowDeleteDialog(false);
    setSelectedFiles([]);
    setIsLoading(false);
  };

  // ファイルを保存する関数
  const saveFile = async () => {
    if (!fileContent) return;
    
    setIsLoading(true);
    try {
      const response = await fetch('/api/v1/files/write', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          path: fileContent.path,
          content: editedContent,
          create_dirs: false,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'ファイルの保存に失敗しました');
      }
      
      // 更新されたファイル内容を取得
      await fetchFileContent(fileContent.path);
      
      setIsEditMode(false);
      toast({
        title: '成功',
        description: 'ファイルを保存しました',
      });
    } catch (error) {
      console.error('ファイル保存エラー:', error);
      toast({
        title: 'エラー',
        description: error instanceof Error ? error.message : 'ファイルの保存に失敗しました',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // ファイルの名前を変更する関数
  const renameFile = async () => {
    if (selectedFiles.length === 0 || !newName.trim()) return;
    
    const file = selectedFiles[0];
    setIsLoading(true);
    
    try {
      const response = await fetch('/api/v1/files/rename', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          path: file.path,
          new_name: newName,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || '名前の変更に失敗しました');
      }
      
      // 成功したらファイルリストを再読み込み
      await loadFileList(currentPath);
      
      setShowRenameDialog(false);
      setNewName('');
      
      toast({
        title: '成功',
        description: '名前を変更しました',
      });
    } catch (error) {
      console.error('名前変更エラー:', error);
      toast({
        title: 'エラー',
        description: error instanceof Error ? error.message : '名前の変更に失敗しました',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // ファイルを移動する関数
  const moveFiles = async () => {
    if (selectedFiles.length === 0 || !destination.trim()) return;
    
    setIsLoading(true);
    let successCount = 0;
    let failCount = 0;
    
    for (const file of selectedFiles) {
      try {
        const response = await fetch('/api/v1/files/move', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            source: file.path,
            destination: destination + '/' + file.name,
          }),
        });
        
        if (response.ok) {
          successCount++;
        } else {
          failCount++;
        }
      } catch (error) {
        console.error('移動エラー:', error);
        failCount++;
      }
    }
    
    // 移動が完了したらファイルリストを再読み込み
    await loadFileList(currentPath);
    
    // 結果をトースト通知
    if (successCount > 0 && failCount === 0) {
      toast({
        title: '成功',
        description: `${successCount}個のアイテムを移動しました`,
      });
    } else if (successCount > 0 && failCount > 0) {
      toast({
        title: '一部成功',
        description: `${successCount}個のアイテムを移動しました (${failCount}個の失敗)`,
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'エラー',
        description: '移動に失敗しました',
        variant: 'destructive',
      });
    }
    
    setShowMoveDialog(false);
    setDestination('');
    setSelectedFiles([]);
    setIsLoading(false);
  };

  // ファイルをコピーする関数
  const copyFiles = async () => {
    if (selectedFiles.length === 0 || !destination.trim()) return;
    
    setIsLoading(true);
    let successCount = 0;
    let failCount = 0;
    
    for (const file of selectedFiles) {
      try {
        const response = await fetch('/api/v1/files/copy', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            source: file.path,
            destination: destination + '/' + file.name,
          }),
        });
        
        if (response.ok) {
          successCount++;
        } else {
          failCount++;
        }
      } catch (error) {
        console.error('コピーエラー:', error);
        failCount++;
      }
    }
    
    // コピーが完了したらファイルリストを再読み込み
    await loadFileList(currentPath);
    
    // 結果をトースト通知
    if (successCount > 0 && failCount === 0) {
      toast({
        title: '成功',
        description: `${successCount}個のアイテムをコピーしました`,
      });
    } else if (successCount > 0 && failCount > 0) {
      toast({
        title: '一部成功',
        description: `${successCount}個のアイテムをコピーしました (${failCount}個の失敗)`,
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'エラー',
        description: 'コピーに失敗しました',
        variant: 'destructive',
      });
    }
    
    setShowCopyDialog(false);
    setDestination('');
    setSelectedFiles([]);
    setIsLoading(false);
  };

  // クリップボード操作（コピー/切り取り）
  const copyToClipboard = (operation: 'copy' | 'cut') => {
    if (selectedFiles.length === 0) return;
    
    setClipboardFiles({
      files: [...selectedFiles],
      operation
    });
    
    toast({
      title: operation === 'copy' ? 'コピー' : '切り取り',
      description: `${selectedFiles.length}個のアイテムをクリップボードに${operation === 'copy' ? 'コピー' : '切り取り'}しました`,
    });
  };

  // クリップボードからの貼り付け
  const pasteFromClipboard = async () => {
    if (!clipboardFiles || clipboardFiles.files.length === 0) return;
    
    setIsLoading(true);
    let successCount = 0;
    let failCount = 0;
    
    for (const file of clipboardFiles.files) {
      try {
        // コピーまたは移動操作を実行
        const endpoint = clipboardFiles.operation === 'copy' ? '/api/v1/files/copy' : '/api/v1/files/move';
        const destinationPath = currentPath ? `${currentPath}/${file.name}` : file.name;
        
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            source: file.path,
            destination: destinationPath,
          }),
        });
        
        if (response.ok) {
          successCount++;
        } else {
          failCount++;
        }
      } catch (error) {
        console.error(`${clipboardFiles.operation === 'copy' ? 'コピー' : '移動'}エラー:`, error);
        failCount++;
      }
    }
    
    // 操作が完了したらファイルリストを再読み込み
    await loadFileList(currentPath);
    
    // 切り取りの場合はクリップボードをクリア
    if (clipboardFiles.operation === 'cut' && successCount > 0) {
      setClipboardFiles(null);
    }
    
    // 結果をトースト通知
    if (successCount > 0 && failCount === 0) {
      toast({
        title: '成功',
        description: `${successCount}個のアイテムを${clipboardFiles.operation === 'copy' ? 'コピー' : '移動'}しました`,
      });
    } else if (successCount > 0 && failCount > 0) {
      toast({
        title: '一部成功',
        description: `${successCount}個のアイテムを${clipboardFiles.operation === 'copy' ? 'コピー' : '移動'}しました (${failCount}個の失敗)`,
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'エラー',
        description: `${clipboardFiles.operation === 'copy' ? 'コピー' : '移動'}に失敗しました`,
        variant: 'destructive',
      });
    }
    
    setIsLoading(false);
  };

  // 新しいフォルダを作成する関数
  const createFolder = async () => {
    if (!newFolderName.trim()) return;
    
    const path = currentPath ? `${currentPath}/${newFolderName}` : newFolderName;
    
    setIsLoading(true);
    try {
      const response = await fetch('/api/v1/files/mkdir', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          path: path,
          exist_ok: false,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'フォルダの作成に失敗しました');
      }
      
      // 成功したらファイルリストを再読み込み
      await loadFileList(currentPath);
      
      setShowNewFolderDialog(false);
      setNewFolderName('');
      
      toast({
        title: '成功',
        description: 'フォルダを作成しました',
      });
    } catch (error) {
      console.error('フォルダ作成エラー:', error);
      toast({
        title: 'エラー',
        description: error instanceof Error ? error.message : 'フォルダの作成に失敗しました',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // 新しいファイルを作成する関数
  const createFile = async () => {
    if (!newFileName.trim()) return;
    
    const path = currentPath ? `${currentPath}/${newFileName}` : newFileName;
    
    setIsLoading(true);
    try {
      const response = await fetch('/api/v1/files/write', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          path: path,
          content: newFileContent,
          create_dirs: false,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'ファイルの作成に失敗しました');
      }
      
      // 成功したらファイルリストを再読み込み
      await loadFileList(currentPath);
      
      setShowNewFileDialog(false);
      setNewFileName('');
      setNewFileContent('');
      
      toast({
        title: '成功',
        description: 'ファイルを作成しました',
      });
    } catch (error) {
      console.error('ファイル作成エラー:', error);
      toast({
        title: 'エラー',
        description: error instanceof Error ? error.message : 'ファイルの作成に失敗しました',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // 複数ファイルをアップロードする関数
  const uploadMultipleFiles = async () => {
    if (!uploadFiles || uploadFiles.length === 0) return;
    
    setIsLoading(true);
    setUploadProgress(0);
    let completed = 0;
    let successCount = 0;
    let failCount = 0;
    
    for (let i = 0; i < uploadFiles.length; i++) {
      const file = uploadFiles[i];
      
      try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('path', currentPath);
        
        const response = await fetch('/api/v1/files/upload', {
          method: 'POST',
          body: formData,
        });
        
        if (response.ok) {
          successCount++;
        } else {
          failCount++;
        }
      } catch (error) {
        console.error('アップロードエラー:', error);
        failCount++;
      }
      
      completed++;
      setUploadProgress(Math.round((completed / uploadFiles.length) * 100));
    }
    
    // アップロードが完了したらファイルリストを再読み込み
    await loadFileList(currentPath);
    
    // 結果をトースト通知
    if (successCount > 0 && failCount === 0) {
      toast({
        title: '成功',
        description: `${successCount}個のファイルをアップロードしました`,
      });
    } else if (successCount > 0 && failCount > 0) {
      toast({
        title: '一部成功',
        description: `${successCount}個のファイルをアップロードしました (${failCount}個の失敗)`,
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'エラー',
        description: 'アップロードに失敗しました',
        variant: 'destructive',
      });
    }
    
    setShowUploadDialog(false);
    setUploadFiles(null);
    setUploadProgress(null);
    setIsLoading(false);
  };

  // ファイルをダウンロードする関数
  const downloadFile = async (file: FileInfo) => {
    if (file.is_dir) {
      toast({
        title: 'エラー',
        description: 'フォルダはダウンロードできません',
        variant: 'destructive',
      });
      return;
    }
    
    try {
      // 新しいタブでダウンロードURLを開く
      window.open(`/api/v1/files/download?path=${encodeURIComponent(file.path)}`, '_blank');
    } catch (error) {
      console.error('ダウンロードエラー:', error);
      toast({
        title: 'エラー',
        description: 'ダウンロードに失敗しました',
        variant: 'destructive',
      });
    }
  };

  // 選択された複数ファイルをダウンロードする関数
  const downloadSelectedFiles = async () => {
    const nonDirFiles = selectedFiles.filter(file => !file.is_dir);
    
    if (nonDirFiles.length === 0) {
      toast({
        title: '警告',
        description: 'ダウンロード可能なファイルが選択されていません',
        variant: 'destructive',
      });
      return;
    }
    
    // 単一ファイルの場合は直接ダウンロード
    if (nonDirFiles.length === 1) {
      downloadFile(nonDirFiles[0]);
      return;
    }
    
    // 複数ファイルの場合はシーケンシャルにダウンロード
    for (const file of nonDirFiles) {
      try {
        window.open(`/api/v1/files/download?path=${encodeURIComponent(file.path)}`, '_blank');
        
        // 少し待って次のダウンロードを開始
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (error) {
        console.error('ダウンロードエラー:', error);
      }
    }
    
    toast({
      title: '情報',
      description: `${nonDirFiles.length}個のファイルのダウンロードを開始しました`,
    });
  };

  // すべてのファイルを選択
  const selectAllFiles = () => {
    if (!fileList) return;
    setSelectedFiles([...fileList.files]);
  };

  // ファイル選択の解除
  const clearSelection = () => {
    setSelectedFiles([]);
    setLastSelectedIndex(null);
  };

  // ファイルダウンロードのリンクを作成
  const getDownloadUrl = (file: FileInfo) => {
    return `/api/v1/files/download?path=${encodeURIComponent(file.path)}`;
  };

  // フルスクリーン切り替え
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`);
      });
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
        setIsFullscreen(false);
      }
    }
  };

  // fullscreenchangeイベントをリッスン
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  // 右クリックメニュー表示
  const handleContextMenu = (event: React.MouseEvent, file?: FileInfo) => {
    event.preventDefault();
    
    // ファイルが指定された場合、そのファイルが選択されていなければ選択する
    if (file && !selectedFiles.some(f => f.path === file.path)) {
      setSelectedFiles([file]);
    }
    
    // 右クリックされたファイルを設定
    setRightClickedFile(file || null);
    
    // コンテキストメニューの位置を設定
    setContextMenuPosition({ x: event.clientX, y: event.clientY });
  };

  // コンテキストメニューを閉じる
  const closeContextMenu = () => {
    setContextMenuPosition(null);
    setRightClickedFile(null);
  };

  // コンテキストメニューのアクション実行ハンドラ
  const handleContextMenuAction = (action: () => void) => {
    action();
    closeContextMenu();
  };

  // ドラッグアンドドロップ処理
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (!e.dataTransfer.files || e.dataTransfer.files.length === 0) return;
    
    setUploadFiles(e.dataTransfer.files);
    setShowUploadDialog(true);
  };

  // プリファレンスを保存
  const savePreferences = () => {
    localStorage.setItem('fileManagerPreferences', JSON.stringify(preferences));
    
    // プリファレンスを適用
    setShowHidden(preferences.showHiddenFiles);
    setViewMode(preferences.defaultView);
    setSortBy(preferences.sortBy);
    setSortDesc(preferences.sortDirection === 'desc');
    
    // ファイルリストを更新
    loadFileList(currentPath);
    
    setShowPreferences(false);
    
    toast({
      title: '成功',
      description: '設定を保存しました',
    });
  };

  // プリファレンスを読み込み
  useEffect(() => {
    const savedPreferences = localStorage.getItem('fileManagerPreferences');
    if (savedPreferences) {
      try {
        const parsedPreferences = JSON.parse(savedPreferences) as FileManagerPreferences;
        setPreferences(parsedPreferences);
        
        // プリファレンスを適用
        setShowHidden(parsedPreferences.showHiddenFiles);
        setViewMode(parsedPreferences.defaultView);
        setSortBy(parsedPreferences.sortBy);
        setSortDesc(parsedPreferences.sortDirection === 'desc');
      } catch (error) {
        console.error('プリファレンスの読み込みエラー:', error);
      }
    }
  }, []);

  // キーボードショートカット
  useHotkeys('ctrl+a', (e) => {
    e.preventDefault();
    selectAllFiles();
  }, { enableOnFormTags: true });

  useHotkeys('delete', () => {
    if (selectedFiles.length > 0) {
      setShowDeleteDialog(true);
    }
  });

  useHotkeys('f2', () => {
    if (selectedFiles.length === 1) {
      setNewName(selectedFiles[0].name);
      setShowRenameDialog(true);
    }
  });

  useHotkeys('ctrl+c', () => {
    if (selectedFiles.length > 0) {
      copyToClipboard('copy');
    }
  });

  useHotkeys('ctrl+x', () => {
    if (selectedFiles.length > 0) {
      copyToClipboard('cut');
    }
  });

  useHotkeys('ctrl+v', () => {
    if (clipboardFiles) {
      pasteFromClipboard();
    }
  });

  useHotkeys('f5', () => {
    loadFileList(currentPath);
  });

  useHotkeys('escape', () => {
    clearSelection();
    closeContextMenu();
  });

  // 初回読み込み
  useEffect(() => {
    loadFileList('');
  }, [loadFileList]);

  // メインレンダリング
  return (
    <Card className="max-w-full">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between">
          <span>拡張ファイルマネージャー</span>
          <Badge variant="outline">
            {currentPath || 'ホーム'}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent
        className="relative"
        onContextMenu={(e) => handleContextMenu(e)}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        ref={dropzoneRef}
      >
        {/* ドラッグアンドドロップ表示 */}
        {isDragging && (
          <div className="absolute inset-0 bg-blue-100 bg-opacity-70 flex items-center justify-center z-10 border-2 border-dashed border-blue-500 rounded-md">
            <div className="text-blue-700 text-center">
              <Upload className="h-12 w-12 mx-auto mb-2" />
              <p className="text-lg font-semibold">ファイルをドロップしてアップロード</p>
            </div>
          </div>
        )}
        
        {/* パンくずリスト */}
        <BreadcrumbNav
          fileList={fileList}
          onPathChange={loadFileList}
        />
        
        {/* ツールバー */}
        <Toolbar
          fileList={fileList}
          currentPath={currentPath}
          selectedFiles={selectedFiles}
          clipboardFiles={clipboardFiles}
          isSearching={isSearching}
          searchQuery={searchQuery}
          viewMode={viewMode}
          showHidden={showHidden}
          sortDesc={sortDesc}
          isFullscreen={isFullscreen}
          onPathChange={loadFileList}
          onRefresh={() => loadFileList(currentPath)}
          onNewFolder={() => setShowNewFolderDialog(true)}
          onNewFile={() => setShowNewFileDialog(true)}
          onUpload={() => setShowUploadDialog(true)}
          onDownload={downloadSelectedFiles}
          onDelete={() => setShowDeleteDialog(true)}
          onCopy={() => copyToClipboard('copy')}
          onCut={() => copyToClipboard('cut')}
          onPaste={pasteFromClipboard}
          onRename={() => {
            if (selectedFiles.length === 1) {
              setNewName(selectedFiles[0].name);
              setShowRenameDialog(true);
            }
          }}
          onProperties={() => setShowPropertiesDialog(true)}
          onSearch={searchFiles}
          onClearSearch={clearSearch}
          onSearchQueryChange={setSearchQuery}
          onViewModeChange={setViewMode}
          onToggleHidden={() => {
            setShowHidden(!showHidden);
            loadFileList(currentPath);
          }}
          onSortByChange={(field) => {
            setSortBy(field);
            loadFileList(currentPath);
          }}
          onToggleSortDirection={() => {
            setSortDesc(!sortDesc);
            loadFileList(currentPath);
          }}
          onShowPreferences={() => setShowPreferences(true)}
          onToggleFullscreen={toggleFullscreen}
        />
        
        {/* ファイルリスト */}
        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          </div>
        ) : (
          <div className="overflow-auto" style={{ minHeight: '300px' }}>
            <Tabs defaultValue="list" value={viewMode} onValueChange={(value) => setViewMode(value as 'list' | 'icons' | 'details')}>
              <TabsList className="mb-4">
                <TabsTrigger value="list">リスト</TabsTrigger>
                <TabsTrigger value="icons">アイコン</TabsTrigger>
                <TabsTrigger value="details">詳細</TabsTrigger>
              </TabsList>
              <TabsContent value="list">
                <FileListView
                  fileList={fileList}
                  selectedFiles={selectedFiles}
                  selectFile={selectFile}
                  openFile={openFile}
                  handleContextMenu={handleContextMenu}
                  isSearching={isSearching}
                  preferences={preferences}
                />
              </TabsContent>
              <TabsContent value="icons">
                <FileIconsView
                  fileList={fileList}
                  selectedFiles={selectedFiles}
                  selectFile={selectFile}
                  openFile={openFile}
                  handleContextMenu={handleContextMenu}
                  isSearching={isSearching}
                  preferences={preferences}
                />
              </TabsContent>
              <TabsContent value="details">
                <FileDetailsView
                  fileList={fileList}
                  selectedFiles={selectedFiles}
                  selectFile={selectFile}
                  openFile={openFile}
                  handleContextMenu={handleContextMenu}
                  isSearching={isSearching}
                  preferences={preferences}
                />
              </TabsContent>
            </Tabs>
          </div>
        )}
        
        {/* ステータスバー */}
        <StatusBar
          fileList={fileList}
          selectedFiles={selectedFiles}
          preferences={preferences}
        />
        
        {/* コンテキストメニュー */}
        <ContextMenu
          position={contextMenuPosition}
          rightClickedFile={rightClickedFile}
          selectedFiles={selectedFiles}
          clipboardFiles={clipboardFiles}
          onClose={closeContextMenu}
          onAction={handleContextMenuAction}
          onSelectFile={(file, index) => selectFile(file, index, { ctrlKey: false } as any)}
          onOpenFile={openFile}
          onDownload={downloadSelectedFiles}
          onCopyToClipboard={copyToClipboard}
          onPaste={pasteFromClipboard}
          onRename={() => {
            if (selectedFiles.length === 1) {
              setNewName(selectedFiles[0].name);
              setShowRenameDialog(true);
            }
          }}
          onDelete={() => setShowDeleteDialog(true)}
          onProperties={() => setShowPropertiesDialog(true)}
          onNewFolder={() => setShowNewFolderDialog(true)}
          onNewFile={() => setShowNewFileDialog(true)}
          onUpload={() => setShowUploadDialog(true)}
          onSelectAll={selectAllFiles}
          onRefresh={() => loadFileList(currentPath)}
          fileList={fileList}
        />
        
        {/* ダイアログ */}
        <FileViewer
          fileContent={fileContent}
          onClose={() => setFileContent(null)}
          editedContent={editedContent}
          isEditMode={isEditMode}
          isLoading={isLoading}
          selectedFile={selectedFiles.length === 1 ? selectedFiles[0] : null}
          onContentChange={setEditedContent}
          onToggleEditMode={() => setIsEditMode(!isEditMode)}
          onSave={saveFile}
          getDownloadUrl={getDownloadUrl}
        />
        
        <DeleteDialog
          open={showDeleteDialog}
          onOpenChange={setShowDeleteDialog}
          selectedFiles={selectedFiles}
          onDelete={deleteFiles}
        />
        
        <RenameDialog
          open={showRenameDialog}
          onOpenChange={setShowRenameDialog}
          newName={newName}
          onNewNameChange={setNewName}
          onRename={renameFile}
        />
        
        <MoveDialog
          open={showMoveDialog}
          onOpenChange={setShowMoveDialog}
          destination={destination}
          onDestinationChange={setDestination}
          onMove={moveFiles}
        />
        
        <CopyDialog
          open={showCopyDialog}
          onOpenChange={setShowCopyDialog}
          destination={destination}
          onDestinationChange={setDestination}
          onCopy={copyFiles}
        />
        
        <NewFolderDialog
          open={showNewFolderDialog}
          onOpenChange={setShowNewFolderDialog}
          folderName={newFolderName}
          onFolderNameChange={setNewFolderName}
          onCreate={createFolder}
        />
        
        <NewFileDialog
          open={showNewFileDialog}
          onOpenChange={setShowNewFileDialog}
          fileName={newFileName}
          fileContent={newFileContent}
          onFileNameChange={setNewFileName}
          onFileContentChange={setNewFileContent}
          onCreate={createFile}
        />
        
        <UploadDialog
          open={showUploadDialog}
          onOpenChange={setShowUploadDialog}
          currentPath={currentPath}
          uploadProgress={uploadProgress}
          isLoading={isLoading}
          onFilesChange={setUploadFiles}
          onUpload={uploadMultipleFiles}
        />
        
        <PropertiesDialog
          open={showPropertiesDialog}
          onOpenChange={setShowPropertiesDialog}
          selectedFiles={selectedFiles}
          currentPath={currentPath}
        />
        
        <PreferencesDialog
          open={showPreferences}
          onOpenChange={setShowPreferences}
          preferences={preferences}
          onPreferencesChange={setPreferences}
          onSave={savePreferences}
        />
        
        <KeyboardShortcutsHelp onOpenChange={() => {}} />
      </CardContent>
    </Card>
  );
};

export default EnhancedFileManager;
