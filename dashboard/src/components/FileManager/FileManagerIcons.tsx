import React from 'react';
import { 
  FileText, Folder, File, FileCode, FileArchive, FilePdf, 
  FileWord, FileExcel, FilePowerpoint, FileAudio, FileVideo, Image 
} from 'lucide-react';
import { FileInfo } from './types';

// ファイルアイコンコンポーネント
export const FileIcon: React.FC<{ file: FileInfo; size?: number }> = ({ file, size = 20 }) => {
  if (file.is_dir) {
    return <Folder className="text-yellow-500" style={{ width: size, height: size }} />;
  }
  
  // アイコンの種類に基づいて適切なアイコンを返す
  switch (file.icon) {
    case 'file-text':
      return <FileText className="text-blue-500" style={{ width: size, height: size }} />;
    case 'file-pdf':
      return <FilePdf className="text-red-500" style={{ width: size, height: size }} />;
    case 'file-word':
      return <FileWord className="text-blue-700" style={{ width: size, height: size }} />;
    case 'file-excel':
      return <FileExcel className="text-green-600" style={{ width: size, height: size }} />;
    case 'file-powerpoint':
      return <FilePowerpoint className="text-orange-500" style={{ width: size, height: size }} />;
    case 'file-image':
      return <Image className="text-purple-500" style={{ width: size, height: size }} />;
    case 'file-audio':
      return <FileAudio className="text-pink-500" style={{ width: size, height: size }} />;
    case 'file-video':
      return <FileVideo className="text-red-600" style={{ width: size, height: size }} />;
    case 'file-archive':
      return <FileArchive className="text-yellow-600" style={{ width: size, height: size }} />;
    case 'file-code':
      return <FileCode className="text-green-500" style={{ width: size, height: size }} />;
    default:
      return <File className="text-gray-500" style={{ width: size, height: size }} />;
  }
};
