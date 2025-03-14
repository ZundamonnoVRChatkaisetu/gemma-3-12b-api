"use client"

import { File, FileCode, FileText, Image, Video, Music, Archive } from 'lucide-react';
import { PinnedFolder } from './types';

// カスタムカラースキーム
export const colors = {
  primary: {
    light: '#E6F2FF',
    main: '#2E7BF6',
    dark: '#1956B3',
  },
  secondary: {
    light: '#F7F9FC',
    main: '#EDF2F7',
    dark: '#CBD5E0',
  },
  success: {
    light: '#E6F6EC',
    main: '#38A169',
    dark: '#276749',
  },
  error: {
    light: '#FFF5F5',
    main: '#E53E3E',
    dark: '#9B2C2C',
  },
  warning: {
    light: '#FFFBEB',
    main: '#ECC94B',
    dark: '#B7791F',
  },
  info: {
    light: '#E6FFFA',
    main: '#38B2AC',
    dark: '#2C7A7B',
  },
  text: {
    primary: '#1A202C',
    secondary: '#4A5568',
    disabled: '#A0AEC0',
  },
  background: {
    default: '#FFFFFF',
    paper: '#F7FAFC',
    hover: '#EDF2F7',
  },
  divider: '#E2E8F0',
};

// ファイルタイプのカテゴリ一覧
export const fileCategories = [
  { key: 'all', label: '全て', icon: <File size={16} /> },
  { key: 'document', label: '文書', icon: <FileText size={16} /> },
  { key: 'image', label: '画像', icon: <Image size={16} /> },
  { key: 'video', label: '動画', icon: <Video size={16} /> },
  { key: 'audio', label: '音声', icon: <Music size={16} /> },
  { key: 'archive', label: '圧縮', icon: <Archive size={16} /> },
  { key: 'code', label: 'コード', icon: <FileCode size={16} /> },
];

// デフォルトのクイックアクセス項目（空の配列に変更）
export const defaultQuickAccessItems: PinnedFolder[] = [];
