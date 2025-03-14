import React, { useState, useEffect } from 'react';
import { 
  X, Save, Edit, Download, HelpCircle, FileText 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle
} from '@/components/ui/alert-dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Slider } from '@/components/ui/slider';
import { toast } from '@/components/ui/use-toast';
import { FileInfo, FileContentResponse, FileManagerPreferences } from './types';
import { List, Grid, FileText as FileTextIcon } from 'lucide-react';

// 削除確認ダイアログ
export const DeleteDialog: React.FC<{
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedFiles: FileInfo[];
  onDelete: () => Promise<void>;
}> = ({ open, onOpenChange, selectedFiles, onDelete }) => (
  <AlertDialog open={open} onOpenChange={onOpenChange}>
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>
          {selectedFiles.length > 1 
            ? '複数のアイテムを削除' 
            : selectedFiles[0]?.is_dir 
              ? 'フォルダの削除' 
              : 'ファイルの削除'}
        </AlertDialogTitle>
        <AlertDialogDescription>
          {selectedFiles.length > 1 
            ? `選択された ${selectedFiles.length} 個のアイテムを削除してもよろしいですか？` 
            : `${selectedFiles[0]?.name} を削除してもよろしいですか？`}
          <br />
          {selectedFiles.some(f => f.is_dir) && 'フォルダ内のすべてのファイルも削除されます。'}
          <br />
          この操作は元に戻せません。
        </AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel>キャンセル</AlertDialogCancel>
        <AlertDialogAction onClick={onDelete}>削除</AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
);

// 名前変更ダイアログ
export const RenameDialog: React.FC<{
  open: boolean;
  onOpenChange: (open: boolean) => void;
  newName: string;
  onNewNameChange: (value: string) => void;
  onRename: () => Promise<void>;
}> = ({ open, onOpenChange, newName, onNewNameChange, onRename }) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent>
      <DialogHeader>
        <DialogTitle>名前の変更</DialogTitle>
      </DialogHeader>
      <div className="py-4">
        <label className="block text-sm font-medium mb-2">新しい名前:</label>
        <Input
          value={newName}
          onChange={(e) => onNewNameChange(e.target.value)}
          autoFocus
        />
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={() => onOpenChange(false)}>
          キャンセル
        </Button>
        <Button onClick={onRename} disabled={!newName.trim()}>
          名前の変更
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
);

// 移動ダイアログ
export const MoveDialog: React.FC<{
  open: boolean;
  onOpenChange: (open: boolean) => void;
  destination: string;
  onDestinationChange: (value: string) => void;
  onMove: () => Promise<void>;
}> = ({ open, onOpenChange, destination, onDestinationChange, onMove }) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent>
      <DialogHeader>
        <DialogTitle>移動</DialogTitle>
      </DialogHeader>
      <div className="py-4">
        <label className="block text-sm font-medium mb-2">移動先のパス:</label>
        <Input
          value={destination}
          onChange={(e) => onDestinationChange(e.target.value)}
          placeholder="例: path/to/destination"
        />
        <p className="text-sm text-gray-500 mt-2">
          現在のディレクトリからの相対パスを入力してください。
        </p>
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={() => onOpenChange(false)}>
          キャンセル
        </Button>
        <Button onClick={onMove} disabled={!destination.trim()}>
          移動
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
);

// コピーダイアログ
export const CopyDialog: React.FC<{
  open: boolean;
  onOpenChange: (open: boolean) => void;
  destination: string;
  onDestinationChange: (value: string) => void;
  onCopy: () => Promise<void>;
}> = ({ open, onOpenChange, destination, onDestinationChange, onCopy }) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent>
      <DialogHeader>
        <DialogTitle>コピー</DialogTitle>
      </DialogHeader>
      <div className="py-4">
        <label className="block text-sm font-medium mb-2">コピー先のパス:</label>
        <Input
          value={destination}
          onChange={(e) => onDestinationChange(e.target.value)}
          placeholder="例: path/to/destination"
        />
        <p className="text-sm text-gray-500 mt-2">
          現在のディレクトリからの相対パスを入力してください。
        </p>
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={() => onOpenChange(false)}>
          キャンセル
        </Button>
        <Button onClick={onCopy} disabled={!destination.trim()}>
          コピー
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
);

// 新しいフォルダ作成ダイアログ
export const NewFolderDialog: React.FC<{
  open: boolean;
  onOpenChange: (open: boolean) => void;
  folderName: string;
  onFolderNameChange: (value: string) => void;
  onCreate: () => Promise<void>;
}> = ({ open, onOpenChange, folderName, onFolderNameChange, onCreate }) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent>
      <DialogHeader>
        <DialogTitle>新しいフォルダ</DialogTitle>
      </DialogHeader>
      <div className="py-4">
        <label className="block text-sm font-medium mb-2">フォルダ名:</label>
        <Input
          value={folderName}
          onChange={(e) => onFolderNameChange(e.target.value)}
          autoFocus
        />
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={() => onOpenChange(false)}>
          キャンセル
        </Button>
        <Button onClick={onCreate} disabled={!folderName.trim()}>
          作成
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
);

// 新しいファイル作成ダイアログ
export const NewFileDialog: React.FC<{
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fileName: string;
  fileContent: string;
  onFileNameChange: (value: string) => void;
  onFileContentChange: (value: string) => void;
  onCreate: () => Promise<void>;
}> = ({ open, onOpenChange, fileName, fileContent, onFileNameChange, onFileContentChange, onCreate }) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent>
      <DialogHeader>
        <DialogTitle>新しいファイル</DialogTitle>
      </DialogHeader>
      <div className="py-4">
        <label className="block text-sm font-medium mb-2">ファイル名:</label>
        <Input
          value={fileName}
          onChange={(e) => onFileNameChange(e.target.value)}
          className="mb-4"
          autoFocus
        />
        <label className="block text-sm font-medium mb-2">内容:</label>
        <textarea
          className="w-full h-32 border rounded-md p-2 font-mono"
          value={fileContent}
          onChange={(e) => onFileContentChange(e.target.value)}
        />
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={() => onOpenChange(false)}>
          キャンセル
        </Button>
        <Button onClick={onCreate} disabled={!fileName.trim()}>
          作成
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
);

// ファイルアップロードダイアログ
export const UploadDialog: React.FC<{
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentPath: string;
  uploadProgress: number | null;
  isLoading: boolean;
  onFilesChange: (files: FileList | null) => void;
  onUpload: () => Promise<void>;
}> = ({ open, onOpenChange, currentPath, uploadProgress, isLoading, onFilesChange, onUpload }) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent>
      <DialogHeader>
        <DialogTitle>ファイルアップロード</DialogTitle>
      </DialogHeader>
      <div className="py-4">
        <label className="block text-sm font-medium mb-2">アップロードするファイル:</label>
        <Input
          type="file"
          multiple
          onChange={(e) => onFilesChange(e.target.files)}
        />
        <p className="text-sm text-gray-500 mt-2">
          アップロード先: {currentPath || '/'}
        </p>
        
        {uploadProgress !== null && (
          <div className="mt-4">
            <div className="flex justify-between mb-1">
              <span className="text-sm">アップロード進捗</span>
              <span className="text-sm">{uploadProgress}%</span>
            </div>
            <Progress value={uploadProgress} className="h-2" />
          </div>
        )}
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={() => onOpenChange(false)}>
          キャンセル
        </Button>
        <Button onClick={onUpload} disabled={isLoading}>
          アップロード
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
);

// ファイルビューアー/エディターコンポーネント
export const FileViewer: React.FC<{
  fileContent: FileContentResponse | null;
  onClose: () => void;
  editedContent: string;
  isEditMode: boolean;
  isLoading: boolean;
  selectedFile: FileInfo | null;
  onContentChange: (content: string) => void;
  onToggleEditMode: () => void;
  onSave: () => Promise<void>;
  getDownloadUrl: (file: FileInfo) => string;
}> = ({ 
  fileContent, 
  onClose, 
  editedContent, 
  isEditMode, 
  isLoading, 
  selectedFile, 
  onContentChange, 
  onToggleEditMode, 
  onSave, 
  getDownloadUrl 
}) => {
  if (!fileContent || !selectedFile) return null;
  
  const isImageFile = fileContent.mime_type?.startsWith('image/');
  const isTextFile = fileContent.mime_type?.startsWith('text/') || ['application/json', 'application/javascript', 'application/xml'].includes(fileContent.mime_type || '');
  
  return (
    <Dialog open={!!fileContent} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            {fileContent.path}
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex justify-between items-center mb-2">
          <div className="text-sm text-gray-500">
            {fileContent.size} バイト | 更新日時: {fileContent.modified}
          </div>
          <div className="flex gap-2">
            {isTextFile && (
              isEditMode ? (
                <>
                  <Button size="sm" variant="outline" onClick={onToggleEditMode}>
                    <X className="h-4 w-4 mr-1" />
                    キャンセル
                  </Button>
                  <Button size="sm" onClick={onSave} disabled={isLoading}>
                    <Save className="h-4 w-4 mr-1" />
                    保存
                  </Button>
                </>
              ) : (
                <Button size="sm" variant="outline" onClick={onToggleEditMode}>
                  <Edit className="h-4 w-4 mr-1" />
                  編集
                </Button>
              )
            )}
          </div>
        </div>
        
        <ScrollArea className="flex-grow">
          {isImageFile ? (
            <div className="flex justify-center items-center h-full">
              <img
                src={`/api/v1/files/download?path=${encodeURIComponent(fileContent.path)}`}
                alt={fileContent.path}
                className="max-w-full max-h-full object-contain"
              />
            </div>
          ) : isTextFile ? (
            isEditMode ? (
              <textarea
                className="w-full h-full min-h-[400px] border rounded-md p-2 font-mono"
                value={editedContent}
                onChange={(e) => onContentChange(e.target.value)}
              />
            ) : (
              <pre className="whitespace-pre-wrap p-2 font-mono text-sm">{fileContent.content}</pre>
            )
          ) : (
            <div className="flex flex-col items-center justify-center h-full p-4">
              <p className="text-center mb-4">このファイルタイプはプレビューできません。</p>
              <Button asChild>
                <a href={getDownloadUrl(selectedFile)} download target="_blank" rel="noreferrer">
                  <Download className="h-4 w-4 mr-2" />
                  ダウンロード
                </a>
              </Button>
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

// ファイルプロパティダイアログ
export const PropertiesDialog: React.FC<{
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedFiles: FileInfo[];
  currentPath: string;
}> = ({ open, onOpenChange, selectedFiles, currentPath }) => {
  const [properties, setProperties] = useState<any>(null);
  
  useEffect(() => {
    const fetchProperties = async () => {
      if (selectedFiles.length !== 1) return;
      
      try {
        const response = await fetch(`/api/v1/files/properties?path=${encodeURIComponent(selectedFiles[0].path)}`);
        
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
    
    if (open && selectedFiles.length === 1) {
      fetchProperties();
    }
  }, [selectedFiles, open]);
  
  if (!properties) return null;
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
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
          <Button onClick={() => onOpenChange(false)}>
            閉じる
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// 設定ダイアログ
export const PreferencesDialog: React.FC<{
  open: boolean;
  onOpenChange: (open: boolean) => void;
  preferences: FileManagerPreferences;
  onPreferencesChange: (preferences: FileManagerPreferences) => void;
  onSave: () => void;
}> = ({ open, onOpenChange, preferences, onPreferencesChange, onSave }) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="max-w-md">
      <DialogHeader>
        <DialogTitle>ファイルマネージャー設定</DialogTitle>
        <DialogDescription>
          使いやすさとパフォーマンスを向上させるためのオプションを設定します。
        </DialogDescription>
      </DialogHeader>
      
      <div className="py-4 space-y-4">
        <div className="flex items-center justify-between">
          <Label htmlFor="show-hidden" className="flex flex-col">
            <span>隠しファイルを表示</span>
            <span className="text-sm text-gray-500">ピリオドで始まるファイルを表示します</span>
          </Label>
          <Switch
            id="show-hidden"
            checked={preferences.showHiddenFiles}
            onCheckedChange={(checked) => onPreferencesChange({...preferences, showHiddenFiles: checked})}
          />
        </div>
        
        <div className="space-y-2">
          <Label>アイコンサイズ</Label>
          <div className="flex items-center gap-4">
            <span className="text-sm">小</span>
            <Slider
              value={[preferences.iconSize]}
              min={24}
              max={96}
              step={8}
              onValueChange={(value) => onPreferencesChange({...preferences, iconSize: value[0]})}
              className="flex-grow"
            />
            <span className="text-sm">大</span>
          </div>
        </div>
        
        <div className="space-y-2">
          <Label>デフォルト表示</Label>
          <div className="grid grid-cols-3 gap-2">
            <Button
              variant={preferences.defaultView === 'list' ? 'default' : 'outline'}
              size="sm"
              onClick={() => onPreferencesChange({...preferences, defaultView: 'list'})}
            >
              <List className="h-4 w-4 mr-2" />
              リスト
            </Button>
            <Button
              variant={preferences.defaultView === 'icons' ? 'default' : 'outline'}
              size="sm"
              onClick={() => onPreferencesChange({...preferences, defaultView: 'icons'})}
            >
              <Grid className="h-4 w-4 mr-2" />
              アイコン
            </Button>
            <Button
              variant={preferences.defaultView === 'details' ? 'default' : 'outline'}
              size="sm"
              onClick={() => onPreferencesChange({...preferences, defaultView: 'details'})}
            >
              <FileTextIcon className="h-4 w-4 mr-2" />
              詳細
            </Button>
          </div>
        </div>
        
        <div className="flex items-center justify-between">
          <Label htmlFor="confirm-delete" className="flex flex-col">
            <span>削除確認ダイアログ</span>
            <span className="text-sm text-gray-500">削除前に確認ダイアログを表示します</span>
          </Label>
          <Switch
            id="confirm-delete"
            checked={preferences.confirmDelete}
            onCheckedChange={(checked) => onPreferencesChange({...preferences, confirmDelete: checked})}
          />
        </div>
        
        <div className="flex items-center justify-between">
          <Label htmlFor="show-extensions" className="flex flex-col">
            <span>拡張子を表示</span>
            <span className="text-sm text-gray-500">ファイル名に拡張子を表示します</span>
          </Label>
          <Switch
            id="show-extensions"
            checked={preferences.showExtensions}
            onCheckedChange={(checked) => onPreferencesChange({...preferences, showExtensions: checked})}
          />
        </div>
        
        <div className="flex items-center justify-between">
          <Label htmlFor="show-statusbar" className="flex flex-col">
            <span>ステータスバーを表示</span>
            <span className="text-sm text-gray-500">ファイル数や合計サイズを表示します</span>
          </Label>
          <Switch
            id="show-statusbar"
            checked={preferences.showStatusBar}
            onCheckedChange={(checked) => onPreferencesChange({...preferences, showStatusBar: checked})}
          />
        </div>
        
        <div className="space-y-2">
          <Label>並べ替え設定</Label>
          <div className="grid grid-cols-2 gap-2">
            <select
              className="border rounded-md p-2"
              value={preferences.sortBy}
              onChange={(e) => onPreferencesChange({...preferences, sortBy: e.target.value})}
            >
              <option value="name">名前</option>
              <option value="size">サイズ</option>
              <option value="modified">更新日時</option>
            </select>
            <select
              className="border rounded-md p-2"
              value={preferences.sortDirection}
              onChange={(e) => onPreferencesChange({...preferences, sortDirection: e.target.value as 'asc' | 'desc'})}
            >
              <option value="asc">昇順</option>
              <option value="desc">降順</option>
            </select>
          </div>
        </div>
      </div>
      
      <DialogFooter>
        <Button variant="outline" onClick={() => onOpenChange(false)}>
          キャンセル
        </Button>
        <Button onClick={onSave}>
          設定を保存
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
);

// キーボードショートカットヘルプダイアログ
export const KeyboardShortcutsHelp: React.FC<{
  onOpenChange: (open: boolean) => void;
}> = ({ onOpenChange }) => {
  const [showHelp, setShowHelp] = useState(false);
  
  return (
    <>
      <Button
        size="sm"
        variant="ghost"
        className="fixed bottom-4 right-4 bg-gray-100 shadow-md"
        onClick={() => setShowHelp(true)}
      >
        <HelpCircle className="h-4 w-4" />
      </Button>
      
      <Dialog open={showHelp} onOpenChange={setShowHelp}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>キーボードショートカット</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-2">
            <div className="text-sm font-medium">Ctrl + A</div>
            <div className="text-sm">すべて選択</div>
            
            <div className="text-sm font-medium">Delete</div>
            <div className="text-sm">削除</div>
            
            <div className="text-sm font-medium">F2</div>
            <div className="text-sm">名前の変更</div>
            
            <div className="text-sm font-medium">Ctrl + C</div>
            <div className="text-sm">コピー</div>
            
            <div className="text-sm font-medium">Ctrl + X</div>
            <div className="text-sm">切り取り</div>
            
            <div className="text-sm font-medium">Ctrl + V</div>
            <div className="text-sm">貼り付け</div>
            
            <div className="text-sm font-medium">F5</div>
            <div className="text-sm">更新</div>
            
            <div className="text-sm font-medium">Escape</div>
            <div className="text-sm">選択解除</div>
            
            <div className="text-sm font-medium">Shift + クリック</div>
            <div className="text-sm">範囲選択</div>
            
            <div className="text-sm font-medium">Ctrl + クリック</div>
            <div className="text-sm">複数選択</div>
          </div>
          <DialogFooter>
            <Button onClick={() => setShowHelp(false)}>
              閉じる
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
