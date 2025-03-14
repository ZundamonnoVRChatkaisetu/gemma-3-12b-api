"use client"

import React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useFileManager } from './hooks/useFileManager';
import { EnhancedFileManagerProps } from './types';

// コンポーネントのインポート
import NavigationPane from './components/NavigationPane';
import ExplorerToolbar from './components/ExplorerToolbar';
import BreadcrumbNav from './components/BreadcrumbNav';
import FileListView from './components/FileListView';
import FileDetailView from './components/FileDetailView';
import FileGridView from './components/FileGridView';
import StatusBar from './components/StatusBar';

// ダイアログのインポート
import FileViewerDialog from './components/dialogs/FileViewerDialog';
import DeleteDialog from './components/dialogs/DeleteDialog';
import BulkDeleteDialog from './components/dialogs/BulkDeleteDialog';
import RenameDialog from './components/dialogs/RenameDialog';
import NewFolderDialog from './components/dialogs/NewFolderDialog';
import NewFileDialog from './components/dialogs/NewFileDialog';
import UploadDialog from './components/dialogs/UploadDialog';

// EnhancedFileManagerコンポーネント
const EnhancedFileManager: React.FC<EnhancedFileManagerProps> = ({
  onFileSelect,
  allowMultiSelect = false,
  initialPath = '',
  maxHeight = '80vh',
  showToolbar = true,
  className = '',
}) => {
  // カスタムフックを使用
  const {
    // 状態
    currentPath,
    fileList,
    isLoading,
    viewMode,
    setViewMode,
    sortBy,
    setSortBy,
    sortDesc,
    setSortDesc,
    showHidden,
    searchQuery,
    setSearchQuery,
    isSearching,
    selectedFile,
    selectedFiles,
    filterCategory,
    setFilterCategory,
    isFullscreen,
    clipboard,
    uploadProgress,
    customPath,
    setCustomPath,
    navigationHistory,
    historyIndex,
    showNavigationPane,
    setShowNavigationPane,
    pinnedFolders,
    quickAccessExpanded,
    setQuickAccessExpanded,
    pinnedFoldersExpanded,
    setPinnedFoldersExpanded,
    
    // ファイルアクション状態
    fileContent,
    setFileContent,
    isEditMode,
    setIsEditMode,
    editedContent,
    setEditedContent,
    showDeleteDialog,
    setShowDeleteDialog,
    showRenameDialog,
    setShowRenameDialog,
    showNewFolderDialog,
    setShowNewFolderDialog,
    showNewFileDialog,
    setShowNewFileDialog,
    showUploadDialog,
    setShowUploadDialog,
    showBulkDeleteDialog,
    setShowBulkDeleteDialog,
    newName,
    setNewName,
    newFolderName,
    setNewFolderName,
    newFileName,
    setNewFileName,
    newFileContent,
    setNewFileContent,
    uploadFiles,
    setUploadFiles,
    
    // ref
    fileManagerRef,
    searchInputRef,
    addressBarRef,
    
    // 関数
    loadFileList,
    performSearch,
    clearSearch,
    openFile,
    toggleFileSelection,
    filterFiles,
    saveFile,
    deleteFile,
    deleteBulkFiles,
    renameFile,
    createFolder,
    createFile,
    handleUpload,
    handleCopy,
    handleCut,
    handlePaste,
    handleBulkDelete,
    pinFolder,
    unpinFolder,
    isPinned,
    goBack,
    goForward,
    handleAddressKeyDown,
  } = useFileManager(initialPath, onFileSelect);

  // メインレンダリング
  return (
    <div 
      ref={fileManagerRef}
      className={`${isFullscreen ? 'fixed inset-0 z-50 bg-white' : ''} ${className} select-none`}
      style={{ maxHeight: isFullscreen ? '100vh' : maxHeight }}
    >
      <div className="w-full h-full flex flex-col border rounded-md overflow-hidden">
        {/* Explorer風ヘッダー・ツールバー */}
        {showToolbar && (
          <ExplorerToolbar
            currentPath={currentPath}
            goBack={goBack}
            goForward={goForward}
            historyIndex={historyIndex}
            navigationHistory={navigationHistory}
            fileList={fileList}
            loadFileList={loadFileList}
            customPath={customPath}
            setCustomPath={setCustomPath}
            handleAddressKeyDown={handleAddressKeyDown}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            searchFiles={performSearch}
            isSearching={isSearching}
            clearSearch={clearSearch}
            addressBarRef={addressBarRef}
            searchInputRef={searchInputRef}
            selectedFile={selectedFile}
            selectedFiles={selectedFiles}
            handleCut={handleCut}
            handleCopy={handleCopy}
            handlePaste={handlePaste}
            clipboard={clipboard}
            showNavigationPane={showNavigationPane}
            setShowNavigationPane={setShowNavigationPane}
            setShowNewFolderDialog={setShowNewFolderDialog}
            setShowNewFileDialog={setShowNewFileDialog}
            setShowUploadDialog={setShowUploadDialog}
            pinFolder={pinFolder}
            isPinned={isPinned}
          />
        )}
        
        {/* Explorer風パンくずリスト */}
        <BreadcrumbNav
          fileList={fileList}
          loadFileList={loadFileList}
        />
        
        <div className="flex-1 flex overflow-hidden">
          {/* 左側のナビゲーションペイン */}
          <NavigationPane
            showNavigationPane={showNavigationPane}
            quickAccessExpanded={quickAccessExpanded}
            setQuickAccessExpanded={setQuickAccessExpanded}
            pinnedFoldersExpanded={pinnedFoldersExpanded}
            setPinnedFoldersExpanded={setPinnedFoldersExpanded}
            pinnedFolders={pinnedFolders}
            currentPath={currentPath}
            loadFileList={loadFileList}
            unpinFolder={unpinFolder}
          />
          
          {/* メインコンテンツエリア */}
          <div className="flex-1 overflow-hidden flex flex-col">
            {/* ファイルリスト */}
            <div className="flex-1 overflow-hidden">
              {isLoading ? (
                <div className="flex justify-center items-center h-full">
                  <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                </div>
              ) : (
                <>
                  {viewMode === 'list' && (
                    <FileListView
                      fileList={fileList}
                      filterFiles={filterFiles}
                      isSearching={isSearching}
                      selectedFiles={selectedFiles}
                      toggleFileSelection={toggleFileSelection}
                      openFile={openFile}
                      isPinned={isPinned}
                    />
                  )}
                  {viewMode === 'detail' && (
                    <FileDetailView
                      fileList={fileList}
                      filterFiles={filterFiles}
                      sortBy={sortBy}
                      sortDesc={sortDesc}
                      setSortBy={setSortBy}
                      setSortDesc={setSortDesc}
                      loadFileList={loadFileList}
                      currentPath={currentPath}
                      isSearching={isSearching}
                      selectedFiles={selectedFiles}
                      toggleFileSelection={toggleFileSelection}
                      openFile={openFile}
                      isPinned={isPinned}
                    />
                  )}
                  {viewMode === 'grid' && (
                    <FileGridView
                      fileList={fileList}
                      filterFiles={filterFiles}
                      isSearching={isSearching}
                      selectedFiles={selectedFiles}
                      toggleFileSelection={toggleFileSelection}
                      openFile={openFile}
                      isPinned={isPinned}
                    />
                  )}
                </>
              )}
            </div>
            
            {/* ステータスバー */}
            <StatusBar
              fileList={fileList}
              filterFiles={filterFiles}
              selectedFiles={selectedFiles}
            />
          </div>
        </div>
      </div>
      
      {/* ダイアログ */}
      <FileViewerDialog
        fileContent={fileContent}
        setFileContent={setFileContent}
        isEditMode={isEditMode}
        setIsEditMode={setIsEditMode}
        editedContent={editedContent}
        setEditedContent={setEditedContent}
        saveFile={saveFile}
        isLoading={isLoading}
      />
      <DeleteDialog
        showDeleteDialog={showDeleteDialog}
        setShowDeleteDialog={setShowDeleteDialog}
        selectedFile={selectedFile}
        deleteFile={deleteFile}
      />
      <BulkDeleteDialog
        showBulkDeleteDialog={showBulkDeleteDialog}
        setShowBulkDeleteDialog={setShowBulkDeleteDialog}
        selectedFiles={selectedFiles}
        deleteBulkFiles={deleteBulkFiles}
      />
      <RenameDialog
        showRenameDialog={showRenameDialog}
        setShowRenameDialog={setShowRenameDialog}
        newName={newName}
        setNewName={setNewName}
        renameFile={renameFile}
      />
      <NewFolderDialog
        showNewFolderDialog={showNewFolderDialog}
        setShowNewFolderDialog={setShowNewFolderDialog}
        newFolderName={newFolderName}
        setNewFolderName={setNewFolderName}
        createFolder={createFolder}
      />
      <NewFileDialog
        showNewFileDialog={showNewFileDialog}
        setShowNewFileDialog={setShowNewFileDialog}
        newFileName={newFileName}
        setNewFileName={setNewFileName}
        newFileContent={newFileContent}
        setNewFileContent={setNewFileContent}
        createFile={createFile}
      />
      <UploadDialog
        showUploadDialog={showUploadDialog}
        setShowUploadDialog={setShowUploadDialog}
        uploadFiles={uploadFiles}
        setUploadFiles={setUploadFiles}
        handleUpload={handleUpload}
        uploadProgress={uploadProgress}
        currentPath={currentPath}
        isLoading={isLoading}
      />
    </div>
  );
};

export default EnhancedFileManager;
