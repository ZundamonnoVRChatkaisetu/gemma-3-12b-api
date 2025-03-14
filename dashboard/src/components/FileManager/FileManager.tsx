import React, { useState, useEffect, useCallback } from 'react';
import { 
  FileText, Folder, ArrowUp, RefreshCw, Plus, Upload, Download, Edit, Trash, 
  Copy, Scissor, Search, Info, MoreHorizontal, X, Check, Save, Image, File,
  FileCode, FileArchive, FilePdf, FileWord, FileExcel, FilePowerpoint, FileAudio, FileVideo
} from 'lucide-react';
import { Tooltip } from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, 
  DropdownMenuTrigger, DropdownMenuSeparator 
} from '@/components/ui/dropdown-menu';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle
} from '@/components/ui/alert-dialog';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from '@/components/ui/use-toast';

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
  modified: string;
}

// FileManagerコンポーネント
const FileManager: React.FC = () => {
  // 状態管理
  const [currentPath, setCurrentPath] = useState('');
  const [fileList, setFileList] = useState<FileListResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'icons'>('list');
  const [sortBy, setSortBy] = useState('name');
  const [sortDesc, setSortDesc] = useState(false);
  const [showHidden, setShowHidden] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [selectedFile, setSelectedFile] = useState<FileInfo | null>(null);

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
  const FileIcon: React.FC<{ file: FileInfo }> = ({ file }) => {
    if (file.is_dir) {
      return <Folder className="h-5 w-5 text-yellow-500" />;
    }
    
    // アイコンの種類に基づいて適切なアイコンを返す
    switch (file.icon) {
      case 'file-text':
        return <FileText className="h-5 w-5 text-blue-500" />;
      case 'file-pdf':
        return <FilePdf className="h-5 w-5 text-red-500" />;
      case 'file-word':
        return <FileWord className="h-5 w-5 text-blue-700" />;
      case 'file-excel':
        return <FileExcel className="h-5 w-5 text-green-600" />;
      case 'file-powerpoint':
        return <FilePowerpoint className="h-5 w-5 text-orange-500" />;
      case 'file-image':
        return <Image className="h-5 w-5 text-purple-500" />;
      case 'file-audio':
        return <FileAudio className="h-5 w-5 text-pink-500" />;
      case 'file-video':
        return <FileVideo className="h-5 w-5 text-red-600" />;
      case 'file-archive':
        return <FileArchive className="h-5 w-5 text-yellow-600" />;
      case 'file-code':
        return <FileCode className="h-5 w-5 text-green-500" />;
      default:
        return <File className="h-5 w-5 text-gray-500" />;
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
  const [newName, setNewName] = useState('');
  const [destination, setDestination] = useState('');
  const [newFolderName, setNewFolderName] = useState('');
  const [newFileName, setNewFileName] = useState('');
  const [newFileContent, setNewFileContent] = useState('');
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  
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

  // ファイルを開く関数
  const openFile = (file: FileInfo) => {
    if (file.is_dir) {
      loadFileList(file.path);
    } else {
      setSelectedFile(file);
      fetchFileContent(file.path);
    }
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

  // ファイルまたはフォルダを削除する関数
  const deleteFile = async () => {
    if (!selectedFile) return;
    
    setIsLoading(true);
    try {
      const response = await fetch(`/api/v1/files/delete?path=${encodeURIComponent(selectedFile.path)}`, {
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

  // ファイルまたはフォルダの名前を変更する関数
  const renameFile = async () => {
    if (!selectedFile || !newName.trim()) return;
    
    setIsLoading(true);
    try {
      const response = await fetch('/api/v1/files/rename', {
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
      const response = await fetch('/api/v1/files/move', {
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
      const response = await fetch('/api/v1/files/copy', {
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

  // ファイルをアップロードする関数
  const uploadFiles = async () => {
    if (!uploadFile) return;
    
    setIsLoading(true);
    
    try {
      const formData = new FormData();
      formData.append('file', uploadFile);
      formData.append('path', currentPath);
      
      const response = await fetch('/api/v1/files/upload', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'アップロードに失敗しました');
      }
      
      // 成功したらファイルリストを再読み込み
      await loadFileList(currentPath);
      
      setShowUploadDialog(false);
      setUploadFile(null);
      
      toast({
        title: '成功',
        description: 'ファイルをアップロードしました',
      });
    } catch (error) {
      console.error('アップロードエラー:', error);
      toast({
        title: 'エラー',
        description: error instanceof Error ? error.message : 'アップロードに失敗しました',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
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

  // 初回読み込み
  useEffect(() => {
    loadFileList('');
  }, [loadFileList]);

  // パンくずリストコンポーネント
  const BreadcrumbNav: React.FC = () => {
    if (!fileList || !fileList.breadcrumbs) {
      return null;
    }
    
    return (
      <Breadcrumb className="mb-4">
        {fileList.breadcrumbs.map((item, index) => (
          <React.Fragment key={index}>
            <BreadcrumbItem>
              <BreadcrumbLink onClick={() => loadFileList(item.path)}>
                {item.name}
              </BreadcrumbLink>
            </BreadcrumbItem>
            {index < fileList.breadcrumbs.length - 1 && <BreadcrumbSeparator>/</BreadcrumbSeparator>}
          </React.Fragment>
        ))}
      </Breadcrumb>
    );
  };

  // ツールバーコンポーネント
  const Toolbar: React.FC = () => (
    <div className="flex flex-wrap gap-2 mb-4">
      <Button
        size="sm"
        variant="outline"
        onClick={() => loadFileList(fileList?.parent_dir || '')}
        disabled={!fileList?.parent_dir}
      >
        <ArrowUp className="h-4 w-4 mr-1" />
        上へ
      </Button>
      
      <Button
        size="sm"
        variant="outline"
        onClick={() => loadFileList(currentPath)}
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
          <DropdownMenuItem onClick={() => setShowNewFolderDialog(true)}>
            <Folder className="h-4 w-4 mr-2" />
            フォルダ
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setShowNewFileDialog(true)}>
            <FileText className="h-4 w-4 mr-2" />
            ファイル
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      
      <Button
        size="sm"
        variant="outline"
        onClick={() => setShowUploadDialog(true)}
      >
        <Upload className="h-4 w-4 mr-1" />
        アップロード
      </Button>
      
      <div className="flex-grow"></div>
      
      <div className="flex gap-2 items-center">
        <Input
          className="w-60"
          placeholder="ファイル名を検索..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && searchFiles()}
        />
        <Button
          size="sm"
          variant="outline"
          onClick={searchFiles}
          disabled={!searchQuery.trim()}
        >
          <Search className="h-4 w-4" />
        </Button>
        {isSearching && (
          <Button
            size="sm"
            variant="ghost"
            onClick={clearSearch}
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
          <DropdownMenuItem onClick={() => setViewMode('list')}>
            リスト表示
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setViewMode('icons')}>
            アイコン表示
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => { setShowHidden(!showHidden); loadFileList(currentPath); }}>
            {showHidden ? '隠しファイルを非表示' : '隠しファイルを表示'}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => { setSortBy('name'); loadFileList(currentPath); }}>
            名前でソート
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => { setSortBy('size'); loadFileList(currentPath); }}>
            サイズでソート
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => { setSortBy('modified'); loadFileList(currentPath); }}>
            更新日時でソート
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => { setSortDesc(!sortDesc); loadFileList(currentPath); }}>
            {sortDesc ? '昇順に変更' : '降順に変更'}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );

  // ファイルリストコンポーネント（リスト表示）
  const FileListView: React.FC = () => {
    if (!fileList) return null;
    
    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>名前</TableHead>
            <TableHead>サイズ</TableHead>
            <TableHead>種類</TableHead>
            <TableHead>更新日時</TableHead>
            <TableHead>操作</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {fileList.files.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                {isSearching ? '検索結果はありません' : 'ファイルがありません'}
              </TableCell>
            </TableRow>
          ) : (
            fileList.files.map((file) => (
              <TableRow key={file.path}>
                <TableCell className="flex items-center gap-2">
                  <FileIcon file={file} />
                  <span
                    className="cursor-pointer hover:underline"
                    onClick={() => openFile(file)}
                  >
                    {file.name}
                  </span>
                </TableCell>
                <TableCell>{file.size_formatted || '-'}</TableCell>
                <TableCell>{file.is_dir ? 'フォルダ' : (file.extension || 'ファイル')}</TableCell>
                <TableCell>{file.modified || '-'}</TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    {!file.is_dir && (
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => downloadFile(file)}
                        title="ダウンロード"
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    )}
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button size="icon" variant="ghost">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        {!file.is_dir && (
                          <DropdownMenuItem onClick={() => { setSelectedFile(file); fetchFileContent(file.path); }}>
                            <FileText className="h-4 w-4 mr-2" />
                            開く
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem onClick={() => { setSelectedFile(file); setNewName(file.name); setShowRenameDialog(true); }}>
                          <Edit className="h-4 w-4 mr-2" />
                          名前の変更
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => { setSelectedFile(file); setShowDeleteDialog(true); }}>
                          <Trash className="h-4 w-4 mr-2" />
                          削除
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => { setSelectedFile(file); setDestination(''); setShowCopyDialog(true); }}>
                          <Copy className="h-4 w-4 mr-2" />
                          コピー
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => { setSelectedFile(file); setDestination(''); setShowMoveDialog(true); }}>
                          <Scissor className="h-4 w-4 mr-2" />
                          移動/名前の変更
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => { setSelectedFile(file); setShowPropertiesDialog(true); }}>
                          <Info className="h-4 w-4 mr-2" />
                          プロパティ
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    );
  };

  // ファイルリストコンポーネント（アイコン表示）
  const FileIconsView: React.FC = () => {
    if (!fileList) return null;
    
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 p-2">
        {fileList.files.length === 0 ? (
          <div className="col-span-full text-center py-8 text-gray-500">
            {isSearching ? '検索結果はありません' : 'ファイルがありません'}
          </div>
        ) : (
          fileList.files.map((file) => (
            <div
              key={file.path}
              className="flex flex-col items-center p-2 rounded-md hover:bg-gray-100 cursor-pointer"
              onClick={() => openFile(file)}
              onContextMenu={(e) => {
                e.preventDefault();
                setSelectedFile(file);
              }}
            >
              <div className="p-2">
                <FileIcon file={file} />
              </div>
              <div className="text-center text-sm mt-1 w-full truncate">
                {file.name}
              </div>
              {!file.is_dir && (
                <div className="text-xs text-gray-500">
                  {file.size_formatted}
                </div>
              )}
            </div>
          ))
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
              <FileText className="h-5 w-5" />
              {fileContent.path}
            </DialogTitle>
          </DialogHeader>
          
          <div className="flex justify-between items-center mb-2">
            <div className="text-sm text-gray-500">
              {fileContent.size_formatted} | 更新日時: {fileContent.modified}
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
                className="w-full h-full min-h-[400px] border rounded-md p-2 font-mono"
                value={editedContent}
                onChange={(e) => setEditedContent(e.target.value)}
              />
            ) : (
              <pre className="whitespace-pre-wrap p-2 font-mono text-sm">{fileContent.content}</pre>
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
          <AlertDialogAction onClick={deleteFile}>削除</AlertDialogAction>
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
        </DialogHeader>
        <div className="py-4">
          <label className="block text-sm font-medium mb-2">新しい名前:</label>
          <Input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
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
        </DialogHeader>
        <div className="py-4">
          <label className="block text-sm font-medium mb-2">移動先のパス:</label>
          <Input
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
            placeholder="例: path/to/destination"
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
        </DialogHeader>
        <div className="py-4">
          <label className="block text-sm font-medium mb-2">コピー先のパス:</label>
          <Input
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
            placeholder="例: path/to/destination"
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
        </DialogHeader>
        <div className="py-4">
          <label className="block text-sm font-medium mb-2">フォルダ名:</label>
          <Input
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
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
        </DialogHeader>
        <div className="py-4">
          <label className="block text-sm font-medium mb-2">ファイル名:</label>
          <Input
            value={newFileName}
            onChange={(e) => setNewFileName(e.target.value)}
            className="mb-4"
          />
          <label className="block text-sm font-medium mb-2">内容:</label>
          <textarea
            className="w-full h-32 border rounded-md p-2 font-mono"
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
        </DialogHeader>
        <div className="py-4">
          <label className="block text-sm font-medium mb-2">アップロードするファイル:</label>
          <Input
            type="file"
            onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
          />
          <p className="text-sm text-gray-500 mt-2">
            アップロード先: {currentPath || '/'}
          </p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setShowUploadDialog(false)}>
            キャンセル
          </Button>
          <Button onClick={uploadFiles} disabled={!uploadFile}>
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
          const response = await fetch(`/api/v1/files/properties?path=${encodeURIComponent(selectedFile.path)}`);
          
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
            <DialogTitle>{properties.name} のプロパティ</DialogTitle>
          </DialogHeader>
          <div className="py-2">
            <div className="grid grid-cols-2 gap-2">
              <div className="text-sm font-medium">タイプ:</div>
              <div className="text-sm">{properties.is_dir ? 'フォルダ' : (properties.mime_type || 'ファイル')}</div>
              
              <div className="text-sm font-medium">場所:</div>
              <div className="text-sm">{properties.path}</div>
              
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
            
            <div className="mt-4">
              <div className="text-sm font-medium mb-1">属性:</div>
              <div className="flex flex-wrap gap-2">
                {Object.entries(properties.attributes).map(([key, value]) => (
                  value && (
                    <div key={key} className="text-sm bg-gray-100 px-2 py-1 rounded">
                      {key.replace(/_/g, ' ')}
                    </div>
                  )
                ))}
              </div>
            </div>
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
    
    return (
      <div className="text-sm text-gray-500 mt-4 flex justify-between items-center p-2 border-t">
        <div>
          {fileList.total_dirs} フォルダ, {fileList.total_files} ファイル
        </div>
        <div>
          合計サイズ: {fileList.total_size ? `${(fileList.total_size / 1024).toFixed(2)} KB` : '0 KB'}
        </div>
      </div>
    );
  };

  // メインレンダリング
  return (
    <Card className="max-w-full">
      <CardHeader className="pb-2">
        <CardTitle>ファイルマネージャー</CardTitle>
      </CardHeader>
      <CardContent>
        {/* パンくずリスト */}
        <BreadcrumbNav />
        
        {/* ツールバー */}
        <Toolbar />
        
        {/* ファイルリスト */}
        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          </div>
        ) : (
          <Tabs defaultValue="list" value={viewMode} onValueChange={(value) => setViewMode(value as 'list' | 'icons')}>
            <TabsList className="mb-4">
              <TabsTrigger value="list">リスト</TabsTrigger>
              <TabsTrigger value="icons">アイコン</TabsTrigger>
            </TabsList>
            <TabsContent value="list">
              <FileListView />
            </TabsContent>
            <TabsContent value="icons">
              <FileIconsView />
            </TabsContent>
          </Tabs>
        )}
        
        {/* ステータスバー */}
        <StatusBar />
      </CardContent>
      
      {/* ダイアログ */}
      <FileViewer />
      <DeleteDialog />
      <RenameDialog />
      <MoveDialog />
      <CopyDialog />
      <NewFolderDialog />
      <NewFileDialog />
      <UploadDialog />
      <PropertiesDialog />
    </Card>
  );
};

export default FileManager;
