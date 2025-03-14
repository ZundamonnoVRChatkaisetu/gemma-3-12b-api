"use client"

import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../../../../components/ui/dialog';
import { Button } from '../../../../components/ui/button';
import { Input } from '../../../../components/ui/input';

interface NewFileDialogProps {
  showNewFileDialog: boolean;
  setShowNewFileDialog: (show: boolean) => void;
  newFileName: string;
  setNewFileName: (name: string) => void;
  newFileContent: string;
  setNewFileContent: (content: string) => void;
  createFile: () => void;
}

const NewFileDialog: React.FC<NewFileDialogProps> = ({
  showNewFileDialog,
  setShowNewFileDialog,
  newFileName,
  setNewFileName,
  newFileContent,
  setNewFileContent,
  createFile
}) => (
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

export default NewFileDialog;
