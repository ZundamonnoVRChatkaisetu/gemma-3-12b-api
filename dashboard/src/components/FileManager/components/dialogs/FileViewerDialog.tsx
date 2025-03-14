"use client"

import React from 'react';
import { X, Edit, Save } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../../../components/ui/dialog';
import { Button } from '../../../../components/ui/button';
import { Badge } from '../../../../components/ui/badge';
import { ScrollArea } from '../../../../components/ui/scroll-area';
import { FileContentResponse } from '../../types';
import FileIcon from '../FileIcon';

interface FileViewerDialogProps {
  fileContent: FileContentResponse | null;
  setFileContent: (fileContent: FileContentResponse | null) => void;
  isEditMode: boolean;
  setIsEditMode: (isEditMode: boolean) => void;
  editedContent: string;
  setEditedContent: (content: string) => void;
  saveFile: () => void;
  isLoading: boolean;
}

const FileViewerDialog: React.FC<FileViewerDialogProps> = ({
  fileContent,
  setFileContent,
  isEditMode,
  setIsEditMode,
  editedContent,
  setEditedContent,
  saveFile,
  isLoading
}) => {
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

export default FileViewerDialog;
