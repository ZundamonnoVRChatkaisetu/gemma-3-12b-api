"use client"

import React from 'react';
import { 
  FileText, Folder, Image, File,
  FileCode, Archive, FileType, BookText, Table as TableIcon, Video, Music,
} from 'lucide-react';
import { FileInfo } from '../types';

interface FileIconProps {
  file: FileInfo;
  size?: number;
}

const FileIcon: React.FC<FileIconProps> = ({ file, size = 20 }) => {
  if (file.is_dir) {
    return <Folder className={`h-${size/4} w-${size/4} text-yellow-500`} />;
  }
  
  // アイコンの種類に基づいて適切なアイコンを返す
  switch (file.icon) {
    case 'file-text':
      return <FileText className={`h-${size/4} w-${size/4} text-blue-500`} />;
    case 'file-pdf':
      return <FileType className={`h-${size/4} w-${size/4} text-red-500`} />;
    case 'file-word':
      return <BookText className={`h-${size/4} w-${size/4} text-blue-700`} />;
    case 'file-excel':
      return <TableIcon className={`h-${size/4} w-${size/4} text-green-600`} />;
    case 'file-powerpoint':
      return <FileText className={`h-${size/4} w-${size/4} text-orange-500`} />;
    case 'file-image':
      return <Image className={`h-${size/4} w-${size/4} text-purple-500`} />;
    case 'file-audio':
      return <Music className={`h-${size/4} w-${size/4} text-pink-500`} />;
    case 'file-video':
      return <Video className={`h-${size/4} w-${size/4} text-red-600`} />;
    case 'file-archive':
      return <Archive className={`h-${size/4} w-${size/4} text-yellow-600`} />;
    case 'file-code':
      return <FileCode className={`h-${size/4} w-${size/4} text-green-500`} />;
    default:
      const ext = file.extension?.toLowerCase();
      if (ext) {
        if (['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp', 'bmp'].includes(ext)) {
          return <Image className={`h-${size/4} w-${size/4} text-purple-500`} />;
        } else if (['mp3', 'wav', 'ogg', 'flac', 'm4a'].includes(ext)) {
          return <Music className={`h-${size/4} w-${size/4} text-pink-500`} />;
        } else if (['mp4', 'webm', 'avi', 'mov', 'mkv'].includes(ext)) {
          return <Video className={`h-${size/4} w-${size/4} text-red-600`} />;
        } else if (['zip', 'tar', 'gz', 'rar', '7z'].includes(ext)) {
          return <Archive className={`h-${size/4} w-${size/4} text-yellow-600`} />;
        } else if (['html', 'css', 'js', 'ts', 'jsx', 'tsx', 'json', 'py', 'java', 'c', 'cpp', 'php', 'rb'].includes(ext)) {
          return <FileCode className={`h-${size/4} w-${size/4} text-green-500`} />;
        } else if (['pdf'].includes(ext)) {
          return <FileType className={`h-${size/4} w-${size/4} text-red-500`} />;
        } else if (['doc', 'docx'].includes(ext)) {
          return <BookText className={`h-${size/4} w-${size/4} text-blue-700`} />;
        } else if (['xls', 'xlsx'].includes(ext)) {
          return <TableIcon className={`h-${size/4} w-${size/4} text-green-600`} />;
        } else if (['ppt', 'pptx'].includes(ext)) {
          return <FileText className={`h-${size/4} w-${size/4} text-orange-500`} />;
        } else if (['txt', 'md', 'rtf'].includes(ext)) {
          return <FileText className={`h-${size/4} w-${size/4} text-blue-500`} />;
        }
      }
      return <File className={`h-${size/4} w-${size/4} text-gray-500`} />;
  }
};

export default FileIcon;
