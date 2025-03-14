"use client"

import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  FileInfo, 
  FileListResponse, 
  FileContentResponse, 
  PinnedFolder 
} from '../types';
import { toast } from '../../../components/ui/use-toast';
import { 
  fetchFileList, 
  searchFiles, 
  filterFilesByCategory, 
  fetchFileContent,
  saveFileContent, 
  deleteFileOrFolder
} from '../utils';
import { API_BASE_URL } from '../types';

export const useFileManager = (
  initialPath: string, 
  onFileSelect?: (file: FileInfo, content?: string) => void,
  allowMultiSelect: boolean = false
) => {
  // 基本状態管理
  const [currentPath, setCurrentPath] = useState(initialPath);
  const [fileList, setFileList] = useState<FileListResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'grid' | 'detail'>('detail');
  const [sortBy, setSortBy] = useState('name');
  const [sortDesc, setSortDesc] = useState(false);
  const [showHidden, setShowHidden] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [selectedFile, setSelectedFile] = useState<FileInfo | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<FileInfo[]>([]);
  const [filterCategory, setFilterCategory] = useState('all');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [clipboard, setClipboard] = useState<{action: 'copy' | 'cut', files: FileInfo[]} | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [customPath, setCustomPath] = useState('');
  const [navigationHistory, setNavigationHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [showNavigationPane, setShowNavigationPane] = useState(true);
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({});
  const [pinnedFolders, setPinnedFolders] = useState<PinnedFolder[]>([]);
  const [quickAccessExpanded, setQuickAccessExpanded] = useState(true);
  const [pinnedFoldersExpanded, setPinnedFoldersExpanded] = useState(true);
  
  // ファイルアクション状態
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
  const [showBulkDeleteDialog, setShowBulkDeleteDialog] = useState(false);
  const [newName, setNewName] = useState('');
  const [destination, setDestination] = useState('');
  const [newFolderName, setNewFolderName] = useState('');
  const [newFileName, setNewFileName] = useState('');
  const [newFileContent, setNewFileContent] = useState('');
  const [uploadFiles, setUploadFiles] = useState<FileList | null>(null);
  
  // プロパティ表示用状態
  const [propertiesFile, setPropertiesFile] = useState<FileInfo | null>(null);
  
  // refs
  const fileManagerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const addressBarRef = useRef<HTMLInputElement>(null);

  // ローカルストレージからピン止めフォルダを読み込み
  useEffect(() => {
    const savedPins = localStorage.getItem('pinnedFolders');
    if (savedPins) {
      try {
        setPinnedFolders(JSON.parse(savedPins));
      } catch (e) {
        console.error('ピン止めフォルダの読み込みに失敗しました:', e);
        setPinnedFolders([]);
      }
    }
  }, []);

  // ピン止めフォルダが更新されたらローカルストレージに保存
  useEffect(() => {
    if (pinnedFolders.length > 0) {
      localStorage.setItem('pinnedFolders', JSON.stringify(pinnedFolders));
    }
  }, [pinnedFolders]);

  // フォルダをピン止めする関数
  const pinFolder = (folder: FileInfo) => {
    if (!folder.is_dir) return;
    
    // 既にピン止めされているか確認
    const exists = pinnedFolders.some(pin => pin.path === folder.path);
    
    if (!exists) {
      const newPinnedFolders = [...pinnedFolders, { path: folder.path, name: folder.name }];
      setPinnedFolders(newPinnedFolders);
      
      toast({
        description: `フォルダ "${folder.name}" をピン止めしました`,
      });
    }
  };

  // ピン止めを解除する関数
  const unpinFolder = (path: string) => {
    const newPinnedFolders = pinnedFolders.filter(pin => pin.path !== path);
    setPinnedFolders(newPinnedFolders);
    
    toast({
      description: `フォルダのピン止めを解除しました`,
    });
  };

  // フォルダがピン止めされているかチェックする関数
  const isPinned = (path: string) => {
    return pinnedFolders.some(pin => pin.path === path);
  };

  // フォルダツリーを展開/折りたたむ関数
  const toggleFolderExpand = (path: string) => {
    setExpandedFolders(prev => ({
      ...prev,
      [path]: !prev[path]
    }));
  };

  // ナビゲーション履歴の追加
  const addToHistory = (path: string) => {
    // 現在の履歴位置より後ろの履歴はクリアする
    const newHistory = navigationHistory.slice(0, historyIndex + 1);
    
    // 同じパスが連続しないようにチェック
    if (newHistory.length === 0 || newHistory[newHistory.length - 1] !== path) {
      newHistory.push(path);
      setNavigationHistory(newHistory);
      setHistoryIndex(newHistory.length - 1);
    }
  };

  // 戻る操作
  const goBack = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      loadFileList(navigationHistory[newIndex], false);
    }
  };

  // 進む操作
  const goForward = () => {
    if (historyIndex < navigationHistory.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      loadFileList(navigationHistory[newIndex], false);
    }
  };

  // ホーム機能
  const goHome = useCallback(() => {
    // ホームディレクトリを指定 (例: /Users/ユーザー名 または C:/Users/ユーザー名)
    loadFileList('C:/Users/Public');
  }, []);

  // アドレスバーのEnterキー処理
  const handleAddressKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      loadFileList(customPath);
    }
  };

  // ファイルリスト読み込み
  const loadFileList = useCallback(async (path = '', addToNav = true) => {
    setIsLoading(true);
    setCustomPath(path); // アドレスバーの内容を更新
    
    try {
      const data = await fetchFileList(path, sortBy, sortDesc, showHidden);
      setFileList(data);
      setCurrentPath(path);
      setSelectedFiles([]);
      setSelectedFile(null);
      
      // ナビゲーション履歴に追加（オプション）
      if (addToNav) {
        addToHistory(path);
      }
    } catch (error) {
      console.error('ファイルリスト取得エラー:', error);
    } finally {
      setIsLoading(false);
    }
  }, [sortBy, sortDesc, showHidden]);

  // 検索
  const performSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    setIsLoading(true);
    
    try {
      const data = await searchFiles(currentPath, searchQuery);
      setFileList(data);
      setSelectedFiles([]);
      setSelectedFile(null);
    } catch (error) {
      console.error('検索エラー:', error);
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

  // ファイルを開く関数
  const openFile = async (file: FileInfo) => {
    if (file.is_dir) {
      loadFileList(file.path);
    } else {
      setSelectedFile(file);
      try {
        const content = await fetchFileContent(file.path);
        setFileContent(content);
        setEditedContent(content.content);
        setIsEditMode(false);
        
        // 外部コールバックがある場合は実行
        if (onFileSelect) {
          onFileSelect(file, content.content);
        }
      } catch (error) {
        console.error('ファイル読み込みエラー:', error);
      }
    }
  };

  // ファイルを選択する関数（Shift+Ctrl対応）
  const toggleFileSelection = (file: FileInfo, ctrlKey = false, shiftKey = false) => {
    if (!allowMultiSelect) {
      // 複数選択を許可しない場合は単一選択のみ
      setSelectedFile(file);
      setSelectedFiles([file]);
      return;
    }
    
    if (!ctrlKey && !shiftKey) {
      // 通常クリックは単一選択
      setSelectedFile(file);
      setSelectedFiles([file]);
    } else if (ctrlKey) {
      // Ctrlキーを押しながらの選択はトグル
      setSelectedFiles(prev => {
        const isSelected = prev.some(f => f.path === file.path);
        if (isSelected) {
          const newSelection = prev.filter(f => f.path !== file.path);
          setSelectedFile(newSelection.length > 0 ? newSelection[0] : null);
          return newSelection;
        } else {
          const newSelection = [...prev, file];
          setSelectedFile(file);
          return newSelection;
        }
      });
    } else if (shiftKey && selectedFile && fileList) {
      // Shiftキーを押しながらの選択は範囲選択
      const filteredFiles = filterFiles(fileList.files);
      const currentIdx = filteredFiles.findIndex(f => f.path === file.path);
      const lastIdx = filteredFiles.findIndex(f => f.path === selectedFile.path);
      
      if (currentIdx !== -1 && lastIdx !== -1) {
        const start = Math.min(currentIdx, lastIdx);
        const end = Math.max(currentIdx, lastIdx);
        const filesToSelect = filteredFiles.slice(start, end + 1);
        setSelectedFiles(filesToSelect);
        setSelectedFile(file);
      }
    }
  };

  // ファイルをフィルタリングする関数
  const filterFiles = (files: FileInfo[]) => {
    return filterFilesByCategory(files, filterCategory);
  };

  // ファイルを保存する関数
  const saveFile = async () => {
    if (!fileContent) return;
    
    setIsLoading(true);
    try {
      await saveFileContent(fileContent.path, editedContent);
      
      // 更新されたファイル内容を取得
      const content = await fetchFileContent(fileContent.path);
      setFileContent(content);
      setEditedContent(content.content);
      
      setIsEditMode(false);
      
      // 外部コールバックがある場合は実行
      if (onFileSelect && selectedFile) {
        onFileSelect(selectedFile, content.content);
      }
    } catch (error) {
      console.error('ファイル保存エラー:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // ファイルまたはフォルダを削除する関数
  const deleteFile = async () => {
    if (!selectedFile) return;
    
    setIsLoading(true);
    try {
      await deleteFileOrFolder(selectedFile.path);
      
      // 削除が成功したらファイルリストを再読み込み
      await loadFileList(currentPath);
      
      setShowDeleteDialog(false);
      setSelectedFile(null);
      setSelectedFiles([]);
      setFileContent(null);
    } catch (error) {
      console.error('削除エラー:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // 複数ファイルを削除する関数
  const deleteBulkFiles = async () => {
    if (!selectedFiles.length) return;
    
    setIsLoading(true);
    try {
      let successCount = 0;
      let errorCount = 0;
      
      for (const file of selectedFiles) {
        try {
          await deleteFileOrFolder(file.path);
          successCount++;
        } catch (e) {
          errorCount++;
        }
      }
      
      // 削除が成功したらファイルリストを再読み込み
      await loadFileList(currentPath);
      
      setShowBulkDeleteDialog(false);
      setSelectedFile(null);
      setSelectedFiles([]);
      setFileContent(null);
      
      if (errorCount === 0) {
        toast({
          title: '成功',
          description: `${successCount}個のアイテムを削除しました`,
        });
      } else {
        toast({
          title: '一部失敗',
          description: `${successCount}個のアイテムを削除しました（${errorCount}個の削除に失敗）`,
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('一括削除エラー:', error);
      toast({
        title: 'エラー',
        description: 'ファイルの一括削除中にエラーが発生しました',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // ファイルまたはフォルダの名前を変更する関数
  const renameFile = async () => {
    if (!selectedFile || !newName.trim()) return;
    
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/files/rename`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          path: selectedFile.path,
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
      setSelectedFile(null);
      setSelectedFiles([]);
      
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
  
  // 新しいフォルダを作成する関数
  const createFolder = async () => {
    if (!newFolderName.trim()) return;
    
    const path = currentPath ? `${currentPath}/${newFolderName}` : newFolderName;
    
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/files/mkdir`, {
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
      const response = await fetch(`${API_BASE_URL}/api/v1/files/write`, {
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

  // ファイルをアップロードする関数
  const handleUpload = async () => {
    if (!uploadFiles || uploadFiles.length === 0) return;
    
    setIsLoading(true);
    setUploadProgress(0);
    
    try {
      let successCount = 0;
      let errorCount = 0;
      
      for (let i = 0; i < uploadFiles.length; i++) {
        const file = uploadFiles[i];
        const formData = new FormData();
        formData.append('file', file);
        formData.append('path', currentPath);
        
        try {
          const response = await fetch(`${API_BASE_URL}/api/v1/files/upload`, {
            method: 'POST',
            body: formData,
          });
          
          if (response.ok) {
            successCount++;
          } else {
            errorCount++;
          }
        } catch (e) {
          errorCount++;
        }
        
        // 進捗更新
        setUploadProgress(Math.round(((i + 1) / uploadFiles.length) * 100));
      }
      
      // 成功したらファイルリストを再読み込み
      await loadFileList(currentPath);
      
      setShowUploadDialog(false);
      setUploadFiles(null);
      
      if (errorCount === 0) {
        toast({
          title: '成功',
          description: `${successCount}個のファイルをアップロードしました`,
        });
      } else {
        toast({
          title: '一部失敗',
          description: `${successCount}個のファイルをアップロードしました（${errorCount}個の失敗）`,
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('アップロードエラー:', error);
      toast({
        title: 'エラー',
        description: 'アップロード中にエラーが発生しました',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
      setUploadProgress(0);
    }
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
      window.open(`${API_BASE_URL}/api/v1/files/download?path=${encodeURIComponent(file.path)}`, '_blank');
    } catch (error) {
      console.error('ダウンロードエラー:', error);
      toast({
        title: 'エラー',
        description: 'ダウンロードに失敗しました',
        variant: 'destructive',
      });
    }
  };

  // クリップボード操作の関数
  const handleCopy = () => {
    if (selectedFiles.length === 0) return;
    
    setClipboard({
      action: 'copy',
      files: [...selectedFiles],
    });
    
    toast({
      description: `${selectedFiles.length}個のアイテムをクリップボードにコピーしました`,
    });
  };
  
  const handleCut = () => {
    if (selectedFiles.length === 0) return;
    
    setClipboard({
      action: 'cut',
      files: [...selectedFiles],
    });
    
    toast({
      description: `${selectedFiles.length}個のアイテムを切り取りました`,
    });
  };
  
  const handlePaste = async () => {
    if (!clipboard || clipboard.files.length === 0) return;
    
    setIsLoading(true);
    
    try {
      let successCount = 0;
      let errorCount = 0;
      
      for (const file of clipboard.files) {
        const fileName = file.name;
        const destinationPath = currentPath ? `${currentPath}/${fileName}` : fileName;
        
        try {
          let response;
          
          if (clipboard.action === 'copy') {
            response = await fetch(`${API_BASE_URL}/api/v1/files/copy`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                source: file.path,
                destination: destinationPath,
              }),
            });
          } else { // cut
            response = await fetch(`${API_BASE_URL}/api/v1/files/move`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                source: file.path,
                destination: destinationPath,
              }),
            });
          }
          
          if (response.ok) {
            successCount++;
          } else {
            errorCount++;
          }
        } catch (e) {
          errorCount++;
        }
      }
      
      // 切り取りの場合はクリップボードをクリア
      if (clipboard.action === 'cut') {
        setClipboard(null);
      }
      
      // 成功したらファイルリストを再読み込み
      await loadFileList(currentPath);
      
      if (errorCount === 0) {
        toast({
          title: '成功',
          description: `${successCount}個のアイテムを${clipboard.action === 'copy' ? 'コピー' : '移動'}しました`,
        });
      } else {
        toast({
          title: '一部失敗',
          description: `${successCount}個のアイテムを${clipboard.action === 'copy' ? 'コピー' : '移動'}しました（${errorCount}個の失敗）`,
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('貼り付けエラー:', error);
      toast({
        title: 'エラー',
        description: '貼り付け中にエラーが発生しました',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // ファイルプロパティを表示する関数
  const showProperties = (file: FileInfo) => {
    setPropertiesFile(file);
    setShowPropertiesDialog(true);
  };

  // 一括操作の関数
  const handleBulkDelete = () => {
    if (selectedFiles.length > 0) {
      setShowBulkDeleteDialog(true);
    }
  };
  
  // 初回読み込み
  useEffect(() => {
    loadFileList(initialPath);
  }, [initialPath, loadFileList]);

  // ショートカットキー
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!fileManagerRef.current) return;
      
      // フォーカスされている要素を確認
      const activeElement = document.activeElement;
      const isInputFocused = activeElement instanceof HTMLInputElement || 
                            activeElement instanceof HTMLTextAreaElement;
      
      // 検索ショートカット
      if (e.ctrlKey && e.key === 'f' && !isInputFocused) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
      
      // 更新ショートカット
      if (e.key === 'F5') {
        e.preventDefault();
        loadFileList(currentPath);
      }
      
      // 選択したファイルを削除
      if (e.key === 'Delete' && selectedFiles.length > 0 && !isInputFocused) {
        e.preventDefault();
        handleBulkDelete();
      }
      
      // Escキーでクリア
      if (e.key === 'Escape' && !isInputFocused) {
        e.preventDefault();
        setSelectedFiles([]);
        setSelectedFile(null);
      }
      
      // Alt+Left で戻る
      if (e.altKey && e.key === 'ArrowLeft') {
        e.preventDefault();
        goBack();
      }

      // Alt+Right で進む
      if (e.altKey && e.key === 'ArrowRight') {
        e.preventDefault();
        goForward();
      }

      // Alt+Up で上の階層へ
      if (e.altKey && e.key === 'ArrowUp' && fileList?.parent_dir) {
        e.preventDefault();
        loadFileList(fileList.parent_dir);
      }
      
      // Ctrl+A で全選択
      if (e.ctrlKey && e.key === 'a' && fileList && allowMultiSelect && !isInputFocused) {
        e.preventDefault();
        const filteredFiles = filterFiles(fileList.files);
        setSelectedFiles(filteredFiles);
        if (filteredFiles.length > 0) {
          setSelectedFile(filteredFiles[0]);
        }
      }
      
      // F2で名前変更
      if (e.key === 'F2' && selectedFile && selectedFiles.length === 1 && !isInputFocused) {
        e.preventDefault();
        setShowRenameDialog(true);
        setNewName(selectedFile.name);
      }
      
      // Homeキーで先頭へ
      if (e.key === 'Home' && fileList && !isInputFocused) {
        e.preventDefault();
        const filteredFiles = filterFiles(fileList.files);
        if (filteredFiles.length > 0) {
          setSelectedFile(filteredFiles[0]);
          setSelectedFiles([filteredFiles[0]]);
        }
      }
      
      // Endキーで末尾へ
      if (e.key === 'End' && fileList && !isInputFocused) {
        e.preventDefault();
        const filteredFiles = filterFiles(fileList.files);
        if (filteredFiles.length > 0) {
          const lastFile = filteredFiles[filteredFiles.length - 1];
          setSelectedFile(lastFile);
          setSelectedFiles([lastFile]);
        }
      }
    };
    
    // キーボードナビゲーション用のイベントハンドラ
    const handleArrowKeys = (e: KeyboardEvent) => {
      // フォーカスされている要素を確認
      const activeElement = document.activeElement;
      const isInputFocused = activeElement instanceof HTMLInputElement || 
                            activeElement instanceof HTMLTextAreaElement;
      
      if (isInputFocused || !fileList) return;
      
      const filteredFiles = filterFiles(fileList.files);
      if (filteredFiles.length === 0) return;
      
      if ((e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'ArrowLeft' || e.key === 'ArrowRight') && 
          viewMode !== 'detail') {
        e.preventDefault();
        
        let currentIndex = -1;
        if (selectedFile) {
          currentIndex = filteredFiles.findIndex(file => file.path === selectedFile.path);
        }
        
        let newIndex = -1;
        const filesPerRow = viewMode === 'grid' ? 4 : 1; // グリッドビューは1行あたり4つと仮定
        
        if (e.key === 'ArrowDown') {
          newIndex = Math.min(currentIndex + filesPerRow, filteredFiles.length - 1);
        } else if (e.key === 'ArrowUp') {
          newIndex = Math.max(currentIndex - filesPerRow, 0);
        } else if (e.key === 'ArrowRight') {
          newIndex = Math.min(currentIndex + 1, filteredFiles.length - 1);
        } else if (e.key === 'ArrowLeft') {
          newIndex = Math.max(currentIndex - 1, 0);
        }
        
        if (newIndex !== -1 && newIndex !== currentIndex) {
          const newFile = filteredFiles[newIndex];
          if (e.shiftKey && allowMultiSelect) {
            // Shiftキーを押しながらの範囲選択
            toggleFileSelection(newFile, false, true);
          } else {
            setSelectedFile(newFile);
            setSelectedFiles([newFile]);
          }
        }
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keydown', handleArrowKeys);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keydown', handleArrowKeys);
    };
  }, [currentPath, selectedFiles, fileList, historyIndex, navigationHistory, loadFileList, allowMultiSelect, viewMode]);

  return {
    // 状態
    currentPath,
    fileList,
    isLoading,
    viewMode,
    setViewMode,
    sortBy,
    setSortBy,
    sortDesc,
    setSortDesc,
    showHidden,
    setShowHidden,
    searchQuery,
    setSearchQuery,
    isSearching,
    selectedFile,
    selectedFiles,
    setSelectedFile,
    setSelectedFiles,
    filterCategory,
    setFilterCategory,
    isFullscreen,
    setIsFullscreen,
    clipboard,
    uploadProgress,
    customPath,
    setCustomPath,
    navigationHistory,
    historyIndex,
    showNavigationPane,
    setShowNavigationPane,
    expandedFolders,
    pinnedFolders,
    quickAccessExpanded,
    setQuickAccessExpanded,
    pinnedFoldersExpanded,
    setPinnedFoldersExpanded,
    
    // ファイルアクション状態
    fileContent,
    setFileContent,
    isEditMode,
    setIsEditMode,
    editedContent,
    setEditedContent,
    showDeleteDialog,
    setShowDeleteDialog,
    showRenameDialog,
    setShowRenameDialog,
    showMoveDialog,
    setShowMoveDialog,
    showCopyDialog,
    setShowCopyDialog,
    showNewFolderDialog,
    setShowNewFolderDialog,
    showNewFileDialog,
    setShowNewFileDialog,
    showUploadDialog,
    setShowUploadDialog,
    showPropertiesDialog,
    setShowPropertiesDialog,
    showBulkDeleteDialog,
    setShowBulkDeleteDialog,
    newName,
    setNewName,
    destination,
    setDestination,
    newFolderName,
    setNewFolderName,
    newFileName,
    setNewFileName,
    newFileContent,
    setNewFileContent,
    uploadFiles,
    setUploadFiles,
    
    // プロパティ表示用
    propertiesFile,
    setPropertiesFile,
    
    // ref
    fileManagerRef,
    searchInputRef,
    addressBarRef,
    
    // 関数
    loadFileList,
    performSearch,
    clearSearch,
    openFile,
    toggleFileSelection,
    filterFiles,
    saveFile,
    deleteFile,
    deleteBulkFiles,
    renameFile,
    createFolder,
    createFile,
    handleUpload,
    downloadFile,
    handleCopy,
    handleCut,
    handlePaste,
    handleBulkDelete,
    pinFolder,
    unpinFolder,
    isPinned,
    toggleFolderExpand,
    goBack,
    goForward,
    goHome,
    handleAddressKeyDown,
    showProperties,
  };
};
