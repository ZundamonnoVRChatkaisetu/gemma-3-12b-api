"use client"

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  FileText, Folder, ArrowUp, RefreshCw, Plus, Upload, Download, Edit, Trash, 
  Copy, Scissors, Search, Info, MoreHorizontal, X, Check, Save, Image, File,
  FileCode, Archive, FileType, BookText, Table as TableIcon, Video, Music,
  ChevronRight, ChevronDown, Grid, List, Filter, SortAsc, SortDesc, Home, Eye, EyeOff, 
  ExternalLink, HelpCircle, Loader2, Maximize2, Minimize2, Star, Star as StarEmpty,
  ChevronLeft, Settings, Layout, Monitor, PanelLeft, Pin
} from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../../components/ui/tooltip';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '../../components/ui/card';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '../../components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { 
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, 
  DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuGroup,
  DropdownMenuLabel, DropdownMenuRadioGroup, DropdownMenuRadioItem,
  DropdownMenuShortcut,
} from '../../components/ui/dropdown-menu';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger, DialogDescription,
  DialogClose
} from '../../components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger
} from '../../components/ui/alert-dialog';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbSeparator } from '../../components/ui/breadcrumb';
import { ScrollArea } from '../../components/ui/scroll-area';
import { Badge } from '../../components/ui/badge';
import { Separator } from '../../components/ui/separator';
import { Switch } from '../../components/ui/switch';
import { Label } from '../../components/ui/label';
import { toast } from '../../components/ui/use-toast';
import { Progress } from '../../components/ui/progress';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '../../components/ui/collapsible';

import { cn } from '../../lib/utils';

// API Base URL
const API_BASE_URL = 'http://localhost:8000';

// ピン止めフォルダの型定義
interface PinnedFolder {
  path: string;
  name: string;
  isQuickAccess?: boolean;
}

// ファイル情報の型定義
interface FileInfo {
  name: string;
  path: string;
  is_dir: boolean;
  size?: number;
  size_formatted?: string;
  modified?: string;
  created?: string;
  mime_type?: string;
  extension?: string;
  icon?: string;
  is_hidden?: boolean;
}

// ファイルリストレスポンスの型定義
interface FileListResponse {
  files: FileInfo[];
  current_dir: string;
  parent_dir?: string;
  total_size: number;
  total_files: number;
  total_dirs: number;
  breadcrumbs: { name: string; path: string }[];
}

// ファイル内容レスポンスの型定義
interface FileContentResponse {
  content: string;
  path: string;
  mime_type: string;
  size: number;
  size_formatted?: string;
  modified: string;
}

// プロパティの定義
interface EnhancedFileManagerProps {
  onFileSelect?: (file: FileInfo, content?: string) => void;
  allowMultiSelect?: boolean;
  initialPath?: string;
  maxHeight?: string;
  showToolbar?: boolean;
  className?: string;
}

// カスタムカラースキーム
const colors = {
  primary: {
    light: '#E6F2FF',
    main: '#2E7BF6',
    dark: '#1956B3',
  },
  secondary: {
    light: '#F7F9FC',
    main: '#EDF2F7',
    dark: '#CBD5E0',
  },
  success: {
    light: '#E6F6EC',
    main: '#38A169',
    dark: '#276749',
  },
  error: {
    light: '#FFF5F5',
    main: '#E53E3E',
    dark: '#9B2C2C',
  },
  warning: {
    light: '#FFFBEB',
    main: '#ECC94B',
    dark: '#B7791F',
  },
  info: {
    light: '#E6FFFA',
    main: '#38B2AC',
    dark: '#2C7A7B',
  },
  text: {
    primary: '#1A202C',
    secondary: '#4A5568',
    disabled: '#A0AEC0',
  },
  background: {
    default: '#FFFFFF',
    paper: '#F7FAFC',
    hover: '#EDF2F7',
  },
  divider: '#E2E8F0',
};

// ファイルタイプのカテゴリ一覧
const fileCategories = [
  { key: 'all', label: '全て', icon: <File size={16} /> },
  { key: 'document', label: '文書', icon: <FileText size={16} /> },
  { key: 'image', label: '画像', icon: <Image size={16} /> },
  { key: 'video', label: '動画', icon: <Video size={16} /> },
  { key: 'audio', label: '音声', icon: <Music size={16} /> },
  { key: 'archive', label: '圧縮', icon: <Archive size={16} /> },
  { key: 'code', label: 'コード', icon: <FileCode size={16} /> },
];

// デフォルトのクイックアクセス項目
const defaultQuickAccessItems: PinnedFolder[] = [
  { path: "", name: "ホーム", isQuickAccess: true },
  { path: "Documents", name: "ドキュメント", isQuickAccess: true },
  { path: "Pictures", name: "画像", isQuickAccess: true },
  { path: "Downloads", name: "ダウンロード", isQuickAccess: true },
];

// EnhancedFileManagerコンポーネント
const EnhancedFileManager: React.FC<EnhancedFileManagerProps> = ({
  onFileSelect,
  allowMultiSelect = false,
  initialPath = '',
  maxHeight = '80vh',
  showToolbar = true,
  className = '',
}) => {
  // 状態管理
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
      
      // Ctrl+A ですべて選択
      if (e.ctrlKey && e.key === 'a' && !isInputFocused && allowMultiSelect) {
        e.preventDefault();
        if (fileList?.files) {
          setSelectedFiles(fileList.files);
        }
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
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentPath, selectedFiles, fileList, allowMultiSelect, historyIndex, navigationHistory]);

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
      const response = await fetch(`${API_BASE_URL}/api/v1/files/list?path=${encodeURIComponent(path)}&sort_by=${sortBy}&sort_desc=${sortDesc}&show_hidden=${showHidden}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'ファイルリストの取得に失敗しました');
      }
      
      const data = await response.json();
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
      const response = await fetch(`${API_BASE_URL}/api/v1/files/search`, {
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
      setSelectedFile(null);
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

  // ファイルアイコンコンポーネント
  const FileIcon: React.FC<{ file: FileInfo, size?: number }> = ({ file, size = 20 }) => {
    if (file.is_dir) {
      return <Folder className={`h-${size/4} w-${size/4} text-yellow-500`} />;
    }
    
    // アイコンの種類に基づいて適切なアイコンを返す
    switch (file.icon) {
      case 'file-text':
        return <FileText className={`h-${size/4} w-${size/4} text-blue-500`} />;
      case 'file-pdf':
        return <FileType className={`h-${size/4} w-${size/4} text-red-500`} />;
      case 'file-word':
        return <BookText className={`h-${size/4} w-${size/4} text-blue-700`} />;
      case 'file-excel':
        return <TableIcon className={`h-${size/4} w-${size/4} text-green-600`} />;
      case 'file-powerpoint':
        return <FileText className={`h-${size/4} w-${size/4} text-orange-500`} />;
      case 'file-image':
        return <Image className={`h-${size/4} w-${size/4} text-purple-500`} />;
      case 'file-audio':
        return <Music className={`h-${size/4} w-${size/4} text-pink-500`} />;
      case 'file-video':
        return <Video className={`h-${size/4} w-${size/4} text-red-600`} />;
      case 'file-archive':
        return <Archive className={`h-${size/4} w-${size/4} text-yellow-600`} />;
      case 'file-code':
        return <FileCode className={`h-${size/4} w-${size/4} text-green-500`} />;
      default:
        const ext = file.extension?.toLowerCase();
        if (ext) {
          if (['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp', 'bmp'].includes(ext)) {
            return <Image className={`h-${size/4} w-${size/4} text-purple-500`} />;
          } else if (['mp3', 'wav', 'ogg', 'flac', 'm4a'].includes(ext)) {
            return <Music className={`h-${size/4} w-${size/4} text-pink-500`} />;
          } else if (['mp4', 'webm', 'avi', 'mov', 'mkv'].includes(ext)) {
            return <Video className={`h-${size/4} w-${size/4} text-red-600`} />;
          } else if (['zip', 'tar', 'gz', 'rar', '7z'].includes(ext)) {
            return <Archive className={`h-${size/4} w-${size/4} text-yellow-600`} />;
          } else if (['html', 'css', 'js', 'ts', 'jsx', 'tsx', 'json', 'py', 'java', 'c', 'cpp', 'php', 'rb'].includes(ext)) {
            return <FileCode className={`h-${size/4} w-${size/4} text-green-500`} />;
          } else if (['pdf'].includes(ext)) {
            return <FileType className={`h-${size/4} w-${size/4} text-red-500`} />;
          } else if (['doc', 'docx'].includes(ext)) {
            return <BookText className={`h-${size/4} w-${size/4} text-blue-700`} />;
          } else if (['xls', 'xlsx'].includes(ext)) {
            return <TableIcon className={`h-${size/4} w-${size/4} text-green-600`} />;
          } else if (['ppt', 'pptx'].includes(ext)) {
            return <FileText className={`h-${size/4} w-${size/4} text-orange-500`} />;
          } else if (['txt', 'md', 'rtf'].includes(ext)) {
            return <FileText className={`h-${size/4} w-${size/4} text-blue-500`} />;
          }
        }
        return <File className={`h-${size/4} w-${size/4} text-gray-500`} />;
    }
  };

  // ファイルアクション処理
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
  
  // ファイルの内容を取得する関数
  const fetchFileContent = async (path: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/files/read?path=${encodeURIComponent(path)}`);
      
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
      return data.content;
    } catch (error) {
      console.error('ファイル読み込みエラー:', error);
      toast({
        title: 'エラー',
        description: error instanceof Error ? error.message : 'ファイルの読み込みに失敗しました',
        variant: 'destructive',
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  // ファイルを開く関数
  const openFile = async (file: FileInfo) => {
    if (file.is_dir) {
      loadFileList(file.path);
    } else {
      setSelectedFile(file);
      const content = await fetchFileContent(file.path);
      
      // 外部コールバックがある場合は実行
      if (onFileSelect && content !== null) {
        onFileSelect(file, content);
      }
    }
  };

  // ファイルを選択する関数
  const toggleFileSelection = (file: FileInfo, ctrlKey = false) => {
    if (!allowMultiSelect) {
      setSelectedFile(file);
      setSelectedFiles([file]);
      return;
    }
    
    if (ctrlKey) {
      // Ctrlキーを押しながらの選択の場合は、トグル
      setSelectedFiles(prev => {
        const isSelected = prev.some(f => f.path === file.path);
        if (isSelected) {
          return prev.filter(f => f.path !== file.path);
        } else {
          return [...prev, file];
        }
      });
    } else {
      // 通常クリックの場合は、単一選択
      setSelectedFile(file);
      setSelectedFiles([file]);
    }
  };

  // ファイルをフィルタリングする関数
  const filterFiles = (files: FileInfo[]) => {
    if (filterCategory === 'all') return files;
    
    return files.filter(file => {
      if (file.is_dir) return filterCategory === 'all';
      
      const ext = file.extension?.toLowerCase();
      switch(filterCategory) {
        case 'document':
          return ['txt', 'pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'odt', 'rtf', 'md'].includes(ext || '');
        case 'image':
          return ['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp', 'bmp'].includes(ext || '');
        case 'video':
          return ['mp4', 'webm', 'avi', 'mov', 'mkv', 'flv', 'wmv'].includes(ext || '');
        case 'audio':
          return ['mp3', 'wav', 'ogg', 'flac', 'm4a', 'aac'].includes(ext || '');
        case 'archive':
          return ['zip', 'tar', 'gz', 'rar', '7z', 'bz2'].includes(ext || '');
        case 'code':
          return ['html', 'css', 'js', 'ts', 'jsx', 'tsx', 'json', 'py', 'java', 'c', 'cpp', 'php', 'rb', 'go', 'rs'].includes(ext || '');
        default:
          return true;
      }
    });
  };

  // ファイルを保存する関数
  const saveFile = async () => {
    if (!fileContent) return;
    
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/files/write`, {
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
      const content = await fetchFileContent(fileContent.path);
      
      setIsEditMode(false);
      toast({
        title: '成功',
        description: 'ファイルを保存しました',
      });
      
      // 外部コールバックがある場合は実行
      if (onFileSelect && selectedFile && content !== null) {
        onFileSelect(selectedFile, content);
      }
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

  // ファイルまたはフォルダを削除する関数
  const deleteFile = async () => {
    if (!selectedFile) return;
    
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/files/delete?path=${encodeURIComponent(selectedFile.path)}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || '削除に失敗しました');
      }
      
      // 削除が成功したらファイルリストを再読み込み
      await loadFileList(currentPath);
      
      setShowDeleteDialog(false);
      setSelectedFile(null);
      setSelectedFiles([]);
      setFileContent(null);
      
      toast({
        title: '成功',
        description: `${selectedFile.is_dir ? 'フォルダ' : 'ファイル'}を削除しました`,
      });
    } catch (error) {
      console.error('削除エラー:', error);
      toast({
        title: 'エラー',
        description: error instanceof Error ? error.message : '削除に失敗しました',
        variant: 'destructive',
      });
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
          const response = await fetch(`${API_BASE_URL}/api/v1/files/delete?path=${encodeURIComponent(file.path)}`, {
            method: 'DELETE',
          });
          
          if (response.ok) {
            successCount++;
          } else {
            errorCount++;
          }
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

  // ファイルまたはフォルダを移動する関数
  const moveFile = async () => {
    if (!selectedFile || !destination.trim()) return;
    
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/files/move`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          source: selectedFile.path,
          destination: destination,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || '移動に失敗しました');
      }
      
      // 成功したらファイルリストを再読み込み
      await loadFileList(currentPath);
      
      setShowMoveDialog(false);
      setDestination('');
      setSelectedFile(null);
      setSelectedFiles([]);
      
      toast({
        title: '成功',
        description: '移動しました',
      });
    } catch (error) {
      console.error('移動エラー:', error);
      toast({
        title: 'エラー',
        description: error instanceof Error ? error.message : '移動に失敗しました',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // ファイルまたはフォルダをコピーする関数
  const copyFile = async () => {
    if (!selectedFile || !destination.trim()) return;
    
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/files/copy`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          source: selectedFile.path,
          destination: destination,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'コピーに失敗しました');
      }
      
      // 成功したらファイルリストを再読み込み
      await loadFileList(currentPath);
      
      setShowCopyDialog(false);
      setDestination('');
      setSelectedFile(null);
      setSelectedFiles([]);
      
      toast({
        title: '成功',
        description: 'コピーしました',
      });
    } catch (error) {
      console.error('コピーエラー:', error);
      toast({
        title: 'エラー',
        description: error instanceof Error ? error.message : 'コピーに失敗しました',
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

  // Windows Explorerライクなナビゲーションペイン（左サイドバー）
  const NavigationPane: React.FC = () => {
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

  // Windows Explorerスタイルのツールバー
  const ExplorerToolbar: React.FC = () => (
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
              <Folder className="h-4 w-4 mr-2" />
              フォルダ
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setShowNewFileDialog(true)}>
              <FileText className="h-4 w-4 mr-2" />
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

  // パンくずリストコンポーネント
  const BreadcrumbNav: React.FC = () => {
    if (!fileList || !fileList.breadcrumbs) {
      return null;
    }
    
    return (
      <Breadcrumb className="px-3 py-2 text-sm bg-gray-50 border-b">
        <BreadcrumbItem>
          <BreadcrumbLink onClick={() => loadFileList('')} className="flex items-center gap-1">
            <Home size={14} />
            ホーム
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        
        {fileList.breadcrumbs.slice(1).map((item, index) => (
          <React.Fragment key={index}>
            <BreadcrumbItem>
              <BreadcrumbLink onClick={() => loadFileList(item.path)}>
                {item.name}
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
          </React.Fragment>
        ))}
      </Breadcrumb>
    );
  };

  // ファイルリストコンポーネント（詳細表示）
  const FileDetailView: React.FC = () => {
    if (!fileList) return null;
    
    const filteredFiles = filterFiles(fileList.files);
    
    return (
      <div className="h-full overflow-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50">
              <TableHead className="w-[40%]" onClick={() => { setSortBy('name'); setSortDesc(!sortDesc); loadFileList(currentPath); }}>
                <div className="flex items-center cursor-pointer">
                  名前
                  {sortBy === 'name' && (sortDesc ? <SortDesc size={16} className="ml-1" /> : <SortAsc size={16} className="ml-1" />)}
                </div>
              </TableHead>
              <TableHead className="w-[15%]" onClick={() => { setSortBy('size'); setSortDesc(!sortDesc); loadFileList(currentPath); }}>
                <div className="flex items-center cursor-pointer">
                  サイズ
                  {sortBy === 'size' && (sortDesc ? <SortDesc size={16} className="ml-1" /> : <SortAsc size={16} className="ml-1" />)}
                </div>
              </TableHead>
              <TableHead className="w-[15%]">種類</TableHead>
              <TableHead className="w-[25%]" onClick={() => { setSortBy('modified'); setSortDesc(!sortDesc); loadFileList(currentPath); }}>
                <div className="flex items-center cursor-pointer">
                  更新日時
                  {sortBy === 'modified' && (sortDesc ? <SortDesc size={16} className="ml-1" /> : <SortAsc size={16} className="ml-1" />)}
                </div>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredFiles.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8 text-gray-500">
                  {isSearching ? '検索結果はありません' : 'ファイルがありません'}
                </TableCell>
              </TableRow>
            ) : (
              filteredFiles.map((file) => (
                <TableRow 
                  key={file.path} 
                  className={cn(
                    selectedFiles.some(f => f.path === file.path) ? 'bg-blue-100' : '',
                    'hover:bg-gray-50'
                  )}
                  onClick={(e) => toggleFileSelection(file, e.ctrlKey)}
                  onDoubleClick={() => openFile(file)}
                >
                  <TableCell className="flex items-center gap-2 cursor-pointer">
                    <FileIcon file={file} />
                    <span className="truncate">
                      {file.name}
                      {file.is_hidden && <Badge variant="outline" className="ml-2 text-xs">隠し</Badge>}
                    </span>
                    {file.is_dir && isPinned(file.path) && (
                      <Pin size={12} className="text-blue-500 ml-1" />
                    )}
                  </TableCell>
                  <TableCell>{file.size_formatted || '-'}</TableCell>
                  <TableCell>{file.is_dir ? 'フォルダ' : (file.extension || 'ファイル')}</TableCell>
                  <TableCell>{file.modified || '-'}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    );
  };

  // ファイルリストコンポーネント（リスト表示）
  const FileListView: React.FC = () => {
    if (!fileList) return null;
    
    const filteredFiles = filterFiles(fileList.files);
    
    return (
      <div className="h-full overflow-auto">
        {filteredFiles.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            {isSearching ? '検索結果はありません' : 'ファイルがありません'}
          </div>
        ) : (
          <div className="divide-y">
            {filteredFiles.map((file) => (
              <div
                key={file.path}
                className={`flex items-center p-3 cursor-pointer hover:bg-gray-50 ${
                  selectedFiles.some(f => f.path === file.path) ? 'bg-blue-100' : ''
                }`}
                onClick={(e) => toggleFileSelection(file, e.ctrlKey)}
                onDoubleClick={() => openFile(file)}
              >
                <div className="flex items-center flex-1 min-w-0">
                  <div className="mr-3">
                    <FileIcon file={file} size={20} />
                  </div>
                  <div className="truncate flex items-center">
                    {file.name}
                    {file.is_hidden && <Badge variant="outline" className="ml-2 text-xs">隠しファイル</Badge>}
                    {file.is_dir && isPinned(file.path) && (
                      <Pin size={12} className="text-blue-500 ml-1" />
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  // ファイルリストコンポーネント（グリッド表示）
  const FileGridView: React.FC = () => {
    if (!fileList) return null;
    
    const filteredFiles = filterFiles(fileList.files);
    
    return (
      <div className="h-full overflow-auto p-3">
        {filteredFiles.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            {isSearching ? '検索結果はありません' : 'ファイルがありません'}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {filteredFiles.map((file) => (
              <div
                key={file.path}
                className={`flex flex-col items-center p-3 rounded-md cursor-pointer ${
                  selectedFiles.some(f => f.path === file.path) ? 'bg-blue-100' : 'hover:bg-gray-50'
                }`}
                onClick={(e) => toggleFileSelection(file, e.ctrlKey)}
                onDoubleClick={() => openFile(file)}
              >
                <div className="p-2">
                  <FileIcon file={file} size={40} />
                </div>
                <div className="text-center text-sm mt-2 w-full">
                  <div className="truncate max-w-full">
                    {file.name}
                    {file.is_dir && isPinned(file.path) && (
                      <Pin size={12} className="text-blue-500 ml-1 inline-block" />
                    )}
                  </div>
                  {!file.is_dir && (
                    <div className="text-xs text-gray-500 mt-1">
                      {file.size_formatted}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  // ファイルビューアー/エディターコンポーネント
  const FileViewer: React.FC = () => {
    if (!fileContent) return null;
    
    return (
      <Dialog open={!!fileContent} onOpenChange={(open) => !open && setFileContent(null)}>
        <DialogContent className="max-w-4xl h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileIcon file={{ name: fileContent.path.split('/').pop() || '', path: fileContent.path, is_dir: false }} />
              <span className="truncate">{fileContent.path}</span>
            </DialogTitle>
          </DialogHeader>
          
          <div className="flex justify-between items-center mb-3">
            <div className="text-sm text-gray-500 flex items-center gap-2">
              <Badge variant="outline">{fileContent.size_formatted || `${fileContent.size} バイト`}</Badge>
              <Badge variant="outline">更新: {fileContent.modified}</Badge>
            </div>
            <div className="flex gap-2">
              {isEditMode ? (
                <>
                  <Button size="sm" variant="outline" onClick={() => setIsEditMode(false)}>
                    <X className="h-4 w-4 mr-1" />
                    キャンセル
                  </Button>
                  <Button size="sm" onClick={saveFile} disabled={isLoading}>
                    <Save className="h-4 w-4 mr-1" />
                    保存
                  </Button>
                </>
              ) : (
                <Button size="sm" variant="outline" onClick={() => setIsEditMode(true)}>
                  <Edit className="h-4 w-4 mr-1" />
                  編集
                </Button>
              )}
            </div>
          </div>
          
          <ScrollArea className="flex-grow">
            {isEditMode ? (
              <textarea
                className="w-full h-full min-h-[400px] p-3 font-mono text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-main"
                value={editedContent}
                onChange={(e) => setEditedContent(e.target.value)}
                style={{ resize: 'none' }}
              />
            ) : (
              <pre className="whitespace-pre-wrap p-3 font-mono text-sm rounded-md bg-gray-50">{fileContent.content}</pre>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>
    );
  };

  // 削除確認ダイアログ
  const DeleteDialog: React.FC = () => (
    <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {selectedFile?.is_dir ? 'フォルダの削除' : 'ファイルの削除'}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {selectedFile?.name} を削除してもよろしいですか？
            {selectedFile?.is_dir && ' このフォルダ内のすべてのファイルも削除されます。'}
            この操作は元に戻せません。
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>キャンセル</AlertDialogCancel>
          <AlertDialogAction onClick={deleteFile} className="bg-red-500 hover:bg-red-600">削除</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
  
  // 一括削除確認ダイアログ
  const BulkDeleteDialog: React.FC = () => (
    <AlertDialog open={showBulkDeleteDialog} onOpenChange={setShowBulkDeleteDialog}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>複数アイテムの削除</AlertDialogTitle>
          <AlertDialogDescription>
            選択された {selectedFiles.length} 個のアイテムを削除してもよろしいですか？
            この操作は元に戻せません。
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>キャンセル</AlertDialogCancel>
          <AlertDialogAction onClick={deleteBulkFiles} className="bg-red-500 hover:bg-red-600">削除</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );

  // 名前変更ダイアログ
  const RenameDialog: React.FC = () => (
    <Dialog open={showRenameDialog} onOpenChange={setShowRenameDialog}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>名前の変更</DialogTitle>
          <DialogDescription>
            新しい名前を入力してください
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <label className="block text-sm font-medium mb-2">新しい名前:</label>
          <Input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            autoFocus
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setShowRenameDialog(false)}>
            キャンセル
          </Button>
          <Button onClick={renameFile} disabled={!newName.trim()}>
            名前の変更
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  // 移動ダイアログ
  const MoveDialog: React.FC = () => (
    <Dialog open={showMoveDialog} onOpenChange={setShowMoveDialog}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>移動</DialogTitle>
          <DialogDescription>
            移動先のパスを入力してください
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <label className="block text-sm font-medium mb-2">移動先のパス:</label>
          <Input
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
            placeholder="例: path/to/destination"
            autoFocus
          />
          <p className="text-sm text-gray-500 mt-2">
            現在のディレクトリからの相対パスを入力してください。
          </p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setShowMoveDialog(false)}>
            キャンセル
          </Button>
          <Button onClick={moveFile} disabled={!destination.trim()}>
            移動
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  // コピーダイアログ
  const CopyDialog: React.FC = () => (
    <Dialog open={showCopyDialog} onOpenChange={setShowCopyDialog}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>コピー</DialogTitle>
          <DialogDescription>
            コピー先のパスを入力してください
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <label className="block text-sm font-medium mb-2">コピー先のパス:</label>
          <Input
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
            placeholder="例: path/to/destination"
            autoFocus
          />
          <p className="text-sm text-gray-500 mt-2">
            現在のディレクトリからの相対パスを入力してください。
          </p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setShowCopyDialog(false)}>
            キャンセル
          </Button>
          <Button onClick={copyFile} disabled={!destination.trim()}>
            コピー
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  // 新しいフォルダ作成ダイアログ
  const NewFolderDialog: React.FC = () => (
    <Dialog open={showNewFolderDialog} onOpenChange={setShowNewFolderDialog}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>新しいフォルダ</DialogTitle>
          <DialogDescription>
            作成するフォルダの名前を入力してください
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <label className="block text-sm font-medium mb-2">フォルダ名:</label>
          <Input
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            autoFocus
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setShowNewFolderDialog(false)}>
            キャンセル
          </Button>
          <Button onClick={createFolder} disabled={!newFolderName.trim()}>
            作成
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  // 新しいファイル作成ダイアログ
  const NewFileDialog: React.FC = () => (
    <Dialog open={showNewFileDialog} onOpenChange={setShowNewFileDialog}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>新しいファイル</DialogTitle>
          <DialogDescription>
            作成するファイルの名前と内容を入力してください
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <label className="block text-sm font-medium mb-2">ファイル名:</label>
          <Input
            value={newFileName}
            onChange={(e) => setNewFileName(e.target.value)}
            className="mb-4"
            autoFocus
          />
          <label className="block text-sm font-medium mb-2">内容:</label>
          <textarea
            className="w-full h-32 p-2 border rounded-md font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary-main"
            value={newFileContent}
            onChange={(e) => setNewFileContent(e.target.value)}
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setShowNewFileDialog(false)}>
            キャンセル
          </Button>
          <Button onClick={createFile} disabled={!newFileName.trim()}>
            作成
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  // ファイルアップロードダイアログ
  const UploadDialog: React.FC = () => (
    <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>ファイルアップロード</DialogTitle>
          <DialogDescription>
            アップロードするファイルを選択してください
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <label className="block text-sm font-medium mb-2">アップロードするファイル:</label>
          <Input
            type="file"
            onChange={(e) => setUploadFiles(e.target.files)}
            multiple
            className="mb-4"
          />
          <p className="text-sm text-gray-500 mb-4">
            アップロード先: {currentPath || '/'}
          </p>
          
          {uploadProgress > 0 && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>アップロード中...</span>
                <span>{uploadProgress}%</span>
              </div>
              <Progress value={uploadProgress} />
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setShowUploadDialog(false)}>
            キャンセル
          </Button>
          <Button onClick={handleUpload} disabled={!uploadFiles || uploadFiles.length === 0 || isLoading}>
            アップロード
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  // ファイルプロパティダイアログ
  const PropertiesDialog: React.FC = () => {
    const [properties, setProperties] = useState<any>(null);
    
    useEffect(() => {
      const fetchProperties = async () => {
        if (!selectedFile) return;
        
        try {
          const response = await fetch(`${API_BASE_URL}/api/v1/files/properties?path=${encodeURIComponent(selectedFile.path)}`);
          
          if (!response.ok) {
            throw new Error('プロパティの取得に失敗しました');
          }
          
          const data = await response.json();
          setProperties(data);
        } catch (error) {
          console.error('プロパティ取得エラー:', error);
          toast({
            title: 'エラー',
            description: 'プロパティの取得に失敗しました',
            variant: 'destructive',
          });
        }
      };
      
      if (showPropertiesDialog && selectedFile) {
        fetchProperties();
      }
    }, [selectedFile, showPropertiesDialog]);
    
    if (!properties) return null;
    
    return (
      <Dialog open={showPropertiesDialog} onOpenChange={setShowPropertiesDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileIcon file={selectedFile || { name: '', path: '', is_dir: false }} />
              <span>{properties.name} のプロパティ</span>
            </DialogTitle>
          </DialogHeader>
          <div className="py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="text-sm font-medium">タイプ:</div>
              <div className="text-sm">{properties.is_dir ? 'フォルダ' : (properties.mime_type || 'ファイル')}</div>
              
              <div className="text-sm font-medium">場所:</div>
              <div className="text-sm truncate">{properties.path}</div>
              
              <div className="text-sm font-medium">サイズ:</div>
              <div className="text-sm">{properties.size_formatted} ({properties.size.toLocaleString()} バイト)</div>
              
              <div className="text-sm font-medium">作成日時:</div>
              <div className="text-sm">{properties.created}</div>
              
              <div className="text-sm font-medium">更新日時:</div>
              <div className="text-sm">{properties.modified}</div>
              
              <div className="text-sm font-medium">最終アクセス:</div>
              <div className="text-sm">{properties.accessed}</div>
              
              {properties.extension && (
                <>
                  <div className="text-sm font-medium">拡張子:</div>
                  <div className="text-sm">{properties.extension}</div>
                </>
              )}
              
              {properties.owner && (
                <>
                  <div className="text-sm font-medium">所有者:</div>
                  <div className="text-sm">{properties.owner}</div>
                </>
              )}
              
              {properties.permissions && (
                <>
                  <div className="text-sm font-medium">権限:</div>
                  <div className="text-sm">{properties.permissions}</div>
                </>
              )}
            </div>
            
            {properties.attributes && Object.keys(properties.attributes).length > 0 && (
              <div className="mt-4">
                <div className="text-sm font-medium mb-1">属性:</div>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(properties.attributes).map(([key, value]) => (
                    value && (
                      <div key={key} className="text-sm bg-gray-100 px-2 py-1 rounded-md">
                        {key.replace(/_/g, ' ')}
                      </div>
                    )
                  ))}
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button onClick={() => setShowPropertiesDialog(false)}>
              閉じる
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  };

  // ステータスバーコンポーネント
  const StatusBar: React.FC = () => {
    if (!fileList) return null;
    
    const filteredFiles = filterFiles(fileList.files);
    
    return (
      <div className="py-1 px-3 text-xs text-gray-500 bg-gray-100 border-t flex justify-between items-center">
        <div>
          {fileList.total_dirs} フォルダ, {fileList.total_files} ファイル
          {filteredFiles.length !== fileList.files.length && 
            ` (表示: ${filteredFiles.length})`}
        </div>
        <div>
          {selectedFiles.length > 0 && `${selectedFiles.length}個選択中 / `}
          合計サイズ: {fileList.total_size ? `${(fileList.total_size / 1024).toFixed(2)} KB` : '0 KB'}
        </div>
      </div>
    );
  };

  // メインレンダリング
  return (
    <div 
      ref={fileManagerRef}
      className={`${isFullscreen ? 'fixed inset-0 z-50 bg-white' : ''} ${className} select-none`}
      style={{ maxHeight: isFullscreen ? '100vh' : maxHeight }}
    >
      <div className="w-full h-full flex flex-col border rounded-md overflow-hidden">
        {/* Explorer風ヘッダー・ツールバー */}
        <ExplorerToolbar />
        
        {/* Explorer風パンくずリスト */}
        <BreadcrumbNav />
        
        <div className="flex-1 flex overflow-hidden">
          {/* 左側のナビゲーションペイン */}
          <NavigationPane />
          
          {/* メインコンテンツエリア */}
          <div className="flex-1 overflow-hidden flex flex-col">
            {/* ファイルリスト */}
            <div className="flex-1 overflow-hidden">
              {isLoading ? (
                <div className="flex justify-center items-center h-full">
                  <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                </div>
              ) : (
                <>
                  {viewMode === 'list' && <FileListView />}
                  {viewMode === 'detail' && <FileDetailView />}
                  {viewMode === 'grid' && <FileGridView />}
                </>
              )}
            </div>
            
            {/* ステータスバー */}
            <StatusBar />
          </div>
        </div>
      </div>
      
      {/* ダイアログ */}
      <FileViewer />
      <DeleteDialog />
      <BulkDeleteDialog />
      <RenameDialog />
      <MoveDialog />
      <CopyDialog />
      <NewFolderDialog />
      <NewFileDialog />
      <UploadDialog />
      <PropertiesDialog />
    </div>
  );
};

export default EnhancedFileManager;