"use client"

import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../../../../components/ui/dialog';
import { Button } from '../../../../components/ui/button';
import { Input } from '../../../../components/ui/input';

interface NewFolderDialogProps {
  showNewFolderDialog: boolean;
  setShowNewFolderDialog: (show: boolean) => void;
  newFolderName: string;
  setNewFolderName: (name: string) => void;
  createFolder: () => void;
}

const NewFolderDialog: React.FC<NewFolderDialogProps> = ({
  showNewFolderDialog,
  setShowNewFolderDialog,
  newFolderName,
  setNewFolderName,
  createFolder
}) => (
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

export default NewFolderDialog;
