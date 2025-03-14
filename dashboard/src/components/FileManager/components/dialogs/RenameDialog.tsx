"use client"

import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../../../../components/ui/dialog';
import { Button } from '../../../../components/ui/button';
import { Input } from '../../../../components/ui/input';

interface RenameDialogProps {
  showRenameDialog: boolean;
  setShowRenameDialog: (show: boolean) => void;
  newName: string;
  setNewName: (name: string) => void;
  renameFile: () => void;
}

const RenameDialog: React.FC<RenameDialogProps> = ({
  showRenameDialog,
  setShowRenameDialog,
  newName,
  setNewName,
  renameFile
}) => (
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

export default RenameDialog;
