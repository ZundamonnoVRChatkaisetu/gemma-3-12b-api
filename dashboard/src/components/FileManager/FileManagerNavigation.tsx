import React from 'react';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { FileInfo, FileListResponse, FileManagerPreferences } from './types';

interface BreadcrumbNavProps {
  fileList: FileListResponse | null;
  onPathChange: (path: string) => Promise<void>;
}

// パンくずリストコンポーネント
export const BreadcrumbNav: React.FC<BreadcrumbNavProps> = ({ fileList, onPathChange }) => {
  if (!fileList || !fileList.breadcrumbs) {
    return null;
  }
  
  return (
    <Breadcrumb className="mb-4">
      {fileList.breadcrumbs.map((item, index) => (
        <React.Fragment key={index}>
          <BreadcrumbItem>
            <BreadcrumbLink onClick={() => onPathChange(item.path)}>
              {item.name}
            </BreadcrumbLink>
          </BreadcrumbItem>
          {index < fileList.breadcrumbs.length - 1 && <BreadcrumbSeparator>/</BreadcrumbSeparator>}
        </React.Fragment>
      ))}
    </Breadcrumb>
  );
};

interface StatusBarProps {
  fileList: FileListResponse | null;
  selectedFiles: FileInfo[];
  preferences: FileManagerPreferences;
}

// ステータスバーコンポーネント
export const StatusBar: React.FC<StatusBarProps> = ({ fileList, selectedFiles, preferences }) => {
  if (!fileList || !preferences.showStatusBar) return null;
  
  return (
    <div className="text-sm text-gray-500 mt-4 flex justify-between items-center p-2 border-t">
      <div>
        {fileList.total_dirs} フォルダ, {fileList.total_files} ファイル
        {selectedFiles.length > 0 && ` (${selectedFiles.length}個選択中)`}
      </div>
      <div>
        合計サイズ: {fileList.total_size ? `${(fileList.total_size / 1024).toFixed(2)} KB` : '0 KB'}
      </div>
    </div>
  );
};
