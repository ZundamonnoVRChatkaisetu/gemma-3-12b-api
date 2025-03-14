"use client"

import React from 'react';
import { Home } from 'lucide-react';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbSeparator } from '../../../components/ui/breadcrumb';
import { FileListResponse } from '../types';

interface BreadcrumbNavProps {
  fileList: FileListResponse | null;
  loadFileList: (path: string) => void;
}

const BreadcrumbNav: React.FC<BreadcrumbNavProps> = ({
  fileList,
  loadFileList
}) => {
  if (!fileList || !fileList.breadcrumbs) {
    return null;
  }
  
  return (
    <Breadcrumb className="px-3 py-2 text-sm bg-gray-50 border-b">
      <BreadcrumbItem>
        <BreadcrumbLink onClick={() => loadFileList('')} className="flex items-center gap-1">
          <Home size={14} />
          ホーム
        </BreadcrumbLink>
      </BreadcrumbItem>
      <BreadcrumbSeparator />
      
      {fileList.breadcrumbs.slice(1).map((item, index) => (
        <React.Fragment key={index}>
          <BreadcrumbItem>
            <BreadcrumbLink onClick={() => loadFileList(item.path)}>
              {item.name}
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
        </React.Fragment>
      ))}
    </Breadcrumb>
  );
};

export default BreadcrumbNav;
