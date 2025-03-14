"use client"

import React from 'react';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle
} from '../../../../components/ui/alert-dialog';
import { FileInfo } from '../../types';

interface BulkDeleteDialogProps {
  showBulkDeleteDialog: boolean;
  setShowBulkDeleteDialog: (show: boolean) => void;
  selectedFiles: FileInfo[];
  deleteBulkFiles: () => void;
}

const BulkDeleteDialog: React.FC<BulkDeleteDialogProps> = ({
  showBulkDeleteDialog,
  setShowBulkDeleteDialog,
  selectedFiles,
  deleteBulkFiles
}) => (
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

export default BulkDeleteDialog;
