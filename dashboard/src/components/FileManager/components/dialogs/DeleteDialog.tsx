"use client"

import React from 'react';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle
} from '../../../../components/ui/alert-dialog';
import { FileInfo } from '../../types';

interface DeleteDialogProps {
  showDeleteDialog: boolean;
  setShowDeleteDialog: (show: boolean) => void;
  selectedFile: FileInfo | null;
  deleteFile: () => void;
}

const DeleteDialog: React.FC<DeleteDialogProps> = ({
  showDeleteDialog,
  setShowDeleteDialog,
  selectedFile,
  deleteFile
}) => (
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

export default DeleteDialog;
