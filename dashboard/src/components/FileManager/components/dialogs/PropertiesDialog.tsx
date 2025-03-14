"use client"

import React, { useState, useEffect } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from '../../../../ui/dialog';
import { Button } from '../../../../ui/button';
import { FileInfo } from '../../types';
import { 
  Calendar, 
  FileSymlink, 
  FileCheck, 
  Folder as FolderIcon, 
  File as FileIcon 
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../../ui/tabs';
import { Separator } from '../../../../ui/separator';

interface PropertiesDialogProps {
  showPropertiesDialog: boolean;
  setShowPropertiesDialog: (show: boolean) => void;
  file: FileInfo | null;
}

const PropertiesDialog: React.FC<PropertiesDialogProps> = ({
  showPropertiesDialog,
  setShowPropertiesDialog,
  file
}) => {
  const [detailedInfo, setDetailedInfo] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (showPropertiesDialog && file) {
      fetchDetailedInfo();
    }
  }, [showPropertiesDialog, file]);

  const fetchDetailedInfo = async () => {
    if (!file) return;
    
    setIsLoading(true);
    try {
      // 実際のAPIエンドポイントに合わせて調整
      const response = await fetch(`${window.location.protocol}//${window.location.hostname}:8000/api/v1/files/properties?path=${encodeURIComponent(file.path)}`);
      const data = await response.json();
      setDetailedInfo(data);
    } catch (error) {
      console.error('プロパティ取得エラー:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!file) return null;

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return '不明';
    try {
      return new Date(dateString).toLocaleString();
    } catch (e) {
      return dateString;
    }
  };

  return (
    <Dialog open={showPropertiesDialog} onOpenChange={setShowPropertiesDialog}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {file.is_dir ? <FolderIcon className="h-5 w-5 text-yellow-500" /> : <FileIcon className="h-5 w-5" />}
            {file.name} のプロパティ
          </DialogTitle>
        </DialogHeader>
        
        <Tabs defaultValue="general" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="general">一般</TabsTrigger>
            <TabsTrigger value="details">詳細</TabsTrigger>
          </TabsList>
          
          <TabsContent value="general" className="space-y-4 py-2">
            <div className="flex items-center gap-2">
              <span className="text-gray-600 w-28">種類:</span>
              <span>{file.is_dir ? 'フォルダ' : (file.mime_type || `${file.extension || '不明'} ファイル`)}</span>
            </div>
            
            <div className="flex items-center gap-2">
              <span className="text-gray-600 w-28">場所:</span>
              <span className="truncate">{file.path.replace(`/${file.name}`, '') || '/'}</span>
            </div>
            
            <div className="flex items-center gap-2">
              <span className="text-gray-600 w-28">サイズ:</span>
              <span>{file.size_formatted || (file.size ? `${file.size} バイト` : '不明')}</span>
            </div>
            
            <Separator />
            
            <div className="flex items-center gap-2">
              <span className="text-gray-600 w-28">作成日時:</span>
              <span className="flex items-center gap-1">
                <Calendar className="h-4 w-4" /> {formatDate(file.created)}
              </span>
            </div>
            
            <div className="flex items-center gap-2">
              <span className="text-gray-600 w-28">更新日時:</span>
              <span className="flex items-center gap-1">
                <Calendar className="h-4 w-4" /> {formatDate(file.modified)}
              </span>
            </div>
            
            {file.is_hidden && (
              <div className="flex items-center gap-2 text-amber-600">
                <span className="text-gray-600 w-28">属性:</span>
                <span>隠しファイル</span>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="details" className="py-2">
            {isLoading ? (
              <div className="flex justify-center items-center py-4">
                <span className="h-5 w-5 animate-spin rounded-full border-2 border-blue-500 border-t-transparent"></span>
                <span className="ml-2">ロード中...</span>
              </div>
            ) : detailedInfo ? (
              <div className="space-y-4">
                {detailedInfo.attributes && (
                  <div>
                    <h3 className="font-semibold mb-2">属性</h3>
                    <div className="grid grid-cols-2 gap-2">
                      {Object.entries(detailedInfo.attributes).map(([key, value]: [string, any]) => (
                        <div key={key} className="flex items-center">
                          <FileCheck className="h-4 w-4 mr-2" />
                          <span>{key}: {value.toString()}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {detailedInfo.permissions && (
                  <>
                    <Separator />
                    <div>
                      <h3 className="font-semibold mb-2">アクセス許可</h3>
                      <div className="grid grid-cols-1 gap-2">
                        <div className="flex items-center">
                          <span className="w-24">読み取り:</span>
                          <span>{detailedInfo.permissions.readable ? '許可' : '拒否'}</span>
                        </div>
                        <div className="flex items-center">
                          <span className="w-24">書き込み:</span>
                          <span>{detailedInfo.permissions.writable ? '許可' : '拒否'}</span>
                        </div>
                        <div className="flex items-center">
                          <span className="w-24">実行:</span>
                          <span>{detailedInfo.permissions.executable ? '許可' : '拒否'}</span>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="text-gray-500 py-4 text-center">
                詳細情報はありません
              </div>
            )}
          </TabsContent>
        </Tabs>
        
        <DialogFooter>
          <Button onClick={() => setShowPropertiesDialog(false)}>
            OK
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PropertiesDialog;
