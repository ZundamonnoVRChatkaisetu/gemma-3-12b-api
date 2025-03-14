import os
import shutil
from pathlib import Path
from typing import List, Optional, Dict, Any
import logging
import re
from fastapi import APIRouter, HTTPException, status, Query, Body
from pydantic import BaseModel, Field

logger = logging.getLogger(__name__)

router = APIRouter()

class FileInfo(BaseModel):
    """ファイル情報のスキーマ"""
    name: str = Field(..., description="ファイル名またはディレクトリ名")
    path: str = Field(..., description="相対パス")
    is_dir: bool = Field(..., description="ディレクトリかどうか")
    size: Optional[int] = Field(None, description="ファイルサイズ (バイト)")
    modified: Optional[str] = Field(None, description="最終更新日時")

class FileListResponse(BaseModel):
    """ファイル一覧レスポンスのスキーマ"""
    files: List[FileInfo] = Field(..., description="ファイル情報のリスト")
    current_dir: str = Field(..., description="現在のディレクトリパス")

class FileContentResponse(BaseModel):
    """ファイル内容レスポンスのスキーマ"""
    content: str = Field(..., description="ファイルの内容")
    path: str = Field(..., description="ファイルパス")

class FileWriteRequest(BaseModel):
    """ファイル書き込みリクエストのスキーマ"""
    path: str = Field(..., description="ファイルパス")
    content: str = Field(..., description="書き込む内容")
    create_dirs: bool = Field(False, description="必要なディレクトリを作成するかどうか")

class FileOperationResponse(BaseModel):
    """ファイル操作レスポンスのスキーマ"""
    success: bool = Field(..., description="操作が成功したかどうか")
    message: str = Field(..., description="操作の結果メッセージ")
    path: str = Field(..., description="操作したファイルパス")

class DirectoryCreateRequest(BaseModel):
    """ディレクトリ作成リクエストのスキーマ"""
    path: str = Field(..., description="作成するディレクトリパス")
    exist_ok: bool = Field(False, description="すでに存在する場合でもエラーにしないかどうか")

class FileMoveRequest(BaseModel):
    """ファイル移動リクエストのスキーマ"""
    source: str = Field(..., description="移動元のパス")
    destination: str = Field(..., description="移動先のパス")

class FileCopyRequest(BaseModel):
    """ファイルコピーリクエストのスキーマ"""
    source: str = Field(..., description="コピー元のパス")
    destination: str = Field(..., description="コピー先のパス")

# 安全なディレクトリを設定
# ユーザーのホームディレクトリからの相対パス
USER_HOME = os.path.expanduser("~")

# ユーザードキュメントディレクトリをデフォルトのベースディレクトリとして使用
DEFAULT_BASE_DIR = os.path.join(USER_HOME, "Documents")
if not os.path.exists(DEFAULT_BASE_DIR):
    # Documentsが存在しない場合は、ホームディレクトリ直下に作業ディレクトリを作成
    DEFAULT_BASE_DIR = os.path.join(USER_HOME, "gemma_workspace")
    os.makedirs(DEFAULT_BASE_DIR, exist_ok=True)

# アクセス可能なディレクトリリスト（ここに複数設定可能）
ALLOWED_DIRS = [DEFAULT_BASE_DIR]

# アクセス禁止パスパターンのリスト（正規表現）
BLOCKED_PATH_PATTERNS = [
    r"AppData",
    r"スタート\s*メニュー",
    r"Start\s*Menu",
    r"Program\s*Files",
    r"Windows",
    r"System32",
    r"Program\s*Data",
    r"\.ssh",
    r"\.config",
]

def validate_path(path: str) -> str:
    """
    パスを検証して、許可されたディレクトリ内にあることを確認します。
    許可されたパスの場合は絶対パスを返します。
    """
    # 空のパスの場合はデフォルトのベースディレクトリを使用
    if not path:
        return DEFAULT_BASE_DIR
    
    # 相対パスを絶対パスに変換
    abs_path = os.path.abspath(os.path.join(DEFAULT_BASE_DIR, path))
    
    # ブロックされたパスパターンをチェック
    for pattern in BLOCKED_PATH_PATTERNS:
        if re.search(pattern, abs_path, re.IGNORECASE):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"セキュリティ上の理由からこのパスへのアクセスは制限されています: '{path}'"
            )
    
    # パスが許可されたディレクトリ内にあることを確認
    is_allowed = False
    for allowed_dir in ALLOWED_DIRS:
        if abs_path.startswith(allowed_dir):
            is_allowed = True
            break
    
    if not is_allowed:
        safe_path = os.path.relpath(DEFAULT_BASE_DIR, USER_HOME)
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"アクセスが許可されたディレクトリは '{safe_path}' のみです。"
        )
    
    return abs_path

@router.get("/list", response_model=FileListResponse)
async def list_files(path: str = Query("", description="一覧表示するディレクトリパス")):
    """
    指定されたディレクトリ内のファイルとディレクトリを一覧表示します。
    """
    try:
        abs_path = validate_path(path)
        
        if not os.path.exists(abs_path):
            # パスが存在しない場合、デフォルトディレクトリを作成して返す
            if abs_path == DEFAULT_BASE_DIR:
                os.makedirs(DEFAULT_BASE_DIR, exist_ok=True)
            else:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="指定されたパスが見つかりませんでした"
                )
        
        if not os.path.isdir(abs_path):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="指定されたパスはディレクトリではありません"
            )
        
        files = []
        
        try:
            # ディレクトリのスキャンを試みる
            with os.scandir(abs_path) as entries:
                for entry in entries:
                    try:
                        file_info = {
                            "name": entry.name,
                            "path": os.path.relpath(entry.path, DEFAULT_BASE_DIR),
                            "is_dir": entry.is_dir(),
                        }
                        
                        if not entry.is_dir():
                            stat = entry.stat()
                            file_info["size"] = stat.st_size
                            file_info["modified"] = str(stat.st_mtime)
                        
                        files.append(FileInfo(**file_info))
                    except PermissionError:
                        # 個別のエントリにアクセスできない場合はスキップ
                        logger.warning(f"アクセス権限がないため、エントリをスキップします: {entry.path}")
                        continue
        except PermissionError:
            # ディレクトリ全体にアクセスできない場合
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="このディレクトリを読み取る権限がありません"
            )
        
        return FileListResponse(
            files=files,
            current_dir=os.path.relpath(abs_path, DEFAULT_BASE_DIR)
        )
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"ファイルの一覧表示中にエラーが発生しました: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"ファイルの一覧表示中にエラーが発生しました: {str(e)}"
        )

@router.get("/read", response_model=FileContentResponse)
async def read_file(path: str = Query(..., description="読み込むファイルパス")):
    """
    ファイルの内容を読み込みます。
    """
    try:
        abs_path = validate_path(path)
        
        if not os.path.exists(abs_path):
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="指定されたファイルが見つかりませんでした"
            )
        
        if os.path.isdir(abs_path):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="指定されたパスはディレクトリです"
            )
        
        try:
            with open(abs_path, "r", encoding="utf-8") as f:
                content = f.read()
        except UnicodeDecodeError:
            # バイナリファイルの場合
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="バイナリファイルは読み込めません"
            )
        except PermissionError:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="このファイルを読み取る権限がありません"
            )
        
        return FileContentResponse(
            content=content,
            path=os.path.relpath(abs_path, DEFAULT_BASE_DIR)
        )
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"ファイルの読み込み中にエラーが発生しました: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"ファイルの読み込み中にエラーが発生しました: {str(e)}"
        )

@router.post("/write", response_model=FileOperationResponse)
async def write_file(data: FileWriteRequest):
    """
    ファイルに内容を書き込みます。
    """
    try:
        abs_path = validate_path(data.path)
        
        # 必要なディレクトリを作成
        if data.create_dirs:
            os.makedirs(os.path.dirname(abs_path), exist_ok=True)
        
        # ファイルに書き込み
        try:
            with open(abs_path, "w", encoding="utf-8") as f:
                f.write(data.content)
        except PermissionError:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="このファイルに書き込む権限がありません"
            )
        
        return FileOperationResponse(
            success=True,
            message="ファイルに書き込みました",
            path=os.path.relpath(abs_path, DEFAULT_BASE_DIR)
        )
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"ファイルの書き込み中にエラーが発生しました: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"ファイルの書き込み中にエラーが発生しました: {str(e)}"
        )

@router.post("/mkdir", response_model=FileOperationResponse)
async def create_directory(data: DirectoryCreateRequest):
    """
    ディレクトリを作成します。
    """
    try:
        abs_path = validate_path(data.path)
        
        try:
            os.makedirs(abs_path, exist_ok=data.exist_ok)
        except PermissionError:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="このディレクトリを作成する権限がありません"
            )
        
        return FileOperationResponse(
            success=True,
            message="ディレクトリを作成しました",
            path=os.path.relpath(abs_path, DEFAULT_BASE_DIR)
        )
    
    except HTTPException:
        raise
    except FileExistsError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="ディレクトリはすでに存在します"
        )
    except Exception as e:
        logger.error(f"ディレクトリの作成中にエラーが発生しました: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"ディレクトリの作成中にエラーが発生しました: {str(e)}"
        )

@router.delete("/delete", response_model=FileOperationResponse)
async def delete_file(path: str = Query(..., description="削除するファイルパス")):
    """
    ファイルまたはディレクトリを削除します。
    """
    try:
        abs_path = validate_path(path)
        
        if not os.path.exists(abs_path):
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="指定されたパスが見つかりませんでした"
            )
        
        try:
            if os.path.isdir(abs_path):
                shutil.rmtree(abs_path)
                message = "ディレクトリを削除しました"
            else:
                os.remove(abs_path)
                message = "ファイルを削除しました"
        except PermissionError:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="このファイルを削除する権限がありません"
            )
        
        return FileOperationResponse(
            success=True,
            message=message,
            path=os.path.relpath(abs_path, DEFAULT_BASE_DIR)
        )
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"ファイルの削除中にエラーが発生しました: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"ファイルの削除中にエラーが発生しました: {str(e)}"
        )

@router.post("/move", response_model=FileOperationResponse)
async def move_file(data: FileMoveRequest):
    """
    ファイルまたはディレクトリを移動します。
    """
    try:
        source_abs = validate_path(data.source)
        dest_abs = validate_path(data.destination)
        
        if not os.path.exists(source_abs):
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="移動元のパスが見つかりませんでした"
            )
        
        # 移動先のディレクトリが存在することを確認
        dest_dir = os.path.dirname(dest_abs)
        if not os.path.exists(dest_dir):
            os.makedirs(dest_dir, exist_ok=True)
        
        try:
            shutil.move(source_abs, dest_abs)
        except PermissionError:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="このファイルを移動する権限がありません"
            )
        
        return FileOperationResponse(
            success=True,
            message="ファイルを移動しました",
            path=os.path.relpath(dest_abs, DEFAULT_BASE_DIR)
        )
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"ファイルの移動中にエラーが発生しました: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"ファイルの移動中にエラーが発生しました: {str(e)}"
        )

@router.post("/copy", response_model=FileOperationResponse)
async def copy_file(data: FileCopyRequest):
    """
    ファイルまたはディレクトリをコピーします。
    """
    try:
        source_abs = validate_path(data.source)
        dest_abs = validate_path(data.destination)
        
        if not os.path.exists(source_abs):
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="コピー元のパスが見つかりませんでした"
            )
        
        # コピー先のディレクトリが存在することを確認
        dest_dir = os.path.dirname(dest_abs)
        if not os.path.exists(dest_dir):
            os.makedirs(dest_dir, exist_ok=True)
        
        try:
            if os.path.isdir(source_abs):
                shutil.copytree(source_abs, dest_abs)
            else:
                shutil.copy2(source_abs, dest_abs)
        except PermissionError:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="このファイルをコピーする権限がありません"
            )
        
        return FileOperationResponse(
            success=True,
            message="ファイルをコピーしました",
            path=os.path.relpath(dest_abs, DEFAULT_BASE_DIR)
        )
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"ファイルのコピー中にエラーが発生しました: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"ファイルのコピー中にエラーが発生しました: {str(e)}"
        )
