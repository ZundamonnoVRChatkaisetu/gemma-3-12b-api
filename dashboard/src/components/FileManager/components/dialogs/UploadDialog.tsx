"use client"

import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../../../../components/ui/dialog';
import { Button } from '../../../../components/ui/button';
import { Input } from '../../../../components/ui/input';
import { Progress } from '../../../../components/ui/progress';

interface UploadDialogProps {
  showUploadDialog: boolean;
  setShowUploadDialog: (show: boolean) => void;
  uploadFiles: FileList | null;
  setUploadFiles: (files: FileList | null) => void;
  handleUpload: () => void;
  uploadProgress: number;
  currentPath: string;
  isLoading: boolean;
}

const UploadDialog: React.FC<UploadDialogProps> = ({
  showUploadDialog,
  setShowUploadDialog,
  uploadFiles,
  setUploadFiles,
  handleUpload,
  uploadProgress,
  currentPath,
  isLoading
}) => (
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

export default UploadDialog;
