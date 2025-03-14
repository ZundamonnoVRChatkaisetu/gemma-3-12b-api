import os
import shutil
import stat
import time
import mimetypes
import re
from datetime import datetime
from pathlib import Path
from typing import List, Optional, Dict, Any
import logging
from fastapi import APIRouter, HTTPException, status, Query, Body, UploadFile, File, Form
from fastapi.responses import FileResponse, StreamingResponse
from pydantic import BaseModel, Field

logger = logging.getLogger(__name__)

router = APIRouter()

class FileInfo(BaseModel):
    """ファイル情報のスキーマ"""
    name: str = Field(..., description="ファイル名またはディレクトリ名")
    path: str = Field(..., description="相対パス")
    is_dir: bool = Field(..., description="ディレクトリかどうか")
    size: Optional[int] = Field(None, description="ファイルサイズ (バイト)")
    size_formatted: Optional[str] = Field(None, description="フォーマット済みファイルサイズ")
    modified: Optional[str] = Field(None, description="最終更新日時")
    created: Optional[str] = Field(None, description="作成日時")
    mime_type: Optional[str] = Field(None, description="MIMEタイプ")
    extension: Optional[str] = Field(None, description="ファイル拡張子")
    icon: Optional[str] = Field(None, description="アイコン種別")
    is_hidden: bool = Field(False, description="隠しファイルかどうか")

class FileListResponse(BaseModel):
    """ファイル一覧レスポンスのスキーマ"""
    files: List[FileInfo] = Field(..., description="ファイル情報のリスト")
    current_dir: str = Field(..., description="現在のディレクトリパス")
    parent_dir: Optional[str] = Field(None, description="親ディレクトリパス")
    total_size: int = Field(0, description="合計サイズ（バイト）")
    total_files: int = Field(0, description="ファイル数")
    total_dirs: int = Field(0, description="ディレクトリ数")
    breadcrumbs: List[Dict[str, str]] = Field([], description="パンくずリスト")

class FileContentResponse(BaseModel):
    """ファイル内容レスポンスのスキーマ"""
    content: str = Field(..., description="ファイルの内容")
    path: str = Field(..., description="ファイルパス")
    mime_type: str = Field("text/plain", description="MIMEタイプ")
    size: int = Field(0, description="ファイルサイズ (バイト)")
    modified: str = Field("", description="最終更新日時")

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

class FileRenameRequest(BaseModel):
    """ファイル名変更リクエストのスキーマ"""
    path: str = Field(..., description="変更するファイルパス")
    new_name: str = Field(..., description="新しい名前")

class FileSearchRequest(BaseModel):
    """ファイル検索リクエストのスキーマ"""
    path: str = Field("", description="検索を開始するディレクトリパス")
    query: str = Field(..., description="検索クエリ")
    recursive: bool = Field(True, description="サブディレクトリも検索するかどうか")
    case_sensitive: bool = Field(False, description="大文字小文字を区別するかどうか")

class FilePropertiesResponse(BaseModel):
    """ファイルプロパティレスポンスのスキーマ"""
    name: str = Field(..., description="ファイル名")
    path: str = Field(..., description="ファイルパス")
    is_dir: bool = Field(..., description="ディレクトリかどうか")
    size: int = Field(0, description="ファイルサイズ (バイト)")
    size_formatted: str = Field("", description="フォーマット済みファイルサイズ")
    created: str = Field("", description="作成日時")
    modified: str = Field("", description="最終更新日時")
    accessed: str = Field("", description="最終アクセス日時")
    mime_type: Optional[str] = Field(None, description="MIMEタイプ")
    attributes: Dict[str, bool] = Field({}, description="ファイル属性")
    extension: Optional[str] = Field(None, description="ファイル拡張子")
    owner: Optional[str] = Field(None, description="所有者")
    permissions: Optional[str] = Field(None, description="パーミッション")

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
ALLOWED_DIRS = [DEFAULT_BASE_DIR,"C:"]

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

# ファイルタイプとアイコンのマッピング
FILE_ICONS = {
    # ドキュメント
    "text": "file-text",
    "pdf": "file-pdf",
    "doc": "file-word",
    "docx": "file-word",
    "xls": "file-excel",
    "xlsx": "file-excel",
    "ppt": "file-powerpoint",
    "pptx": "file-powerpoint",
    # 画像
    "jpg": "file-image",
    "jpeg": "file-image",
    "png": "file-image",
    "gif": "file-image",
    "svg": "file-image",
    "webp": "file-image",
    # 音声/動画
    "mp3": "file-audio",
    "wav": "file-audio",
    "ogg": "file-audio",
    "mp4": "file-video",
    "mov": "file-video",
    "avi": "file-video",
    # アーカイブ
    "zip": "file-archive",
    "rar": "file-archive",
    "7z": "file-archive",
    "tar": "file-archive",
    "gz": "file-archive",
    # コード
    "html": "file-code",
    "css": "file-code",
    "js": "file-code",
    "ts": "file-code",
    "jsx": "file-code",
    "tsx": "file-code",
    "json": "file-code",
    "py": "file-code",
    "java": "file-code",
    "c": "file-code",
    "cpp": "file-code",
    "cs": "file-code",
    "go": "file-code",
    "rs": "file-code",
    "php": "file-code",
    "rb": "file-code",
    "sh": "file-code",
    # その他
    "dir": "folder",
    "default": "file",
}

def format_size(size_bytes):
    """ファイルサイズを見やすい形式にフォーマット"""
    if size_bytes < 1024:
        return f"{size_bytes} B"
    elif size_bytes < 1024 * 1024:
        return f"{size_bytes / 1024:.1f} KB"
    elif size_bytes < 1024 * 1024 * 1024:
        return f"{size_bytes / (1024 * 1024):.1f} MB"
    else:
        return f"{size_bytes / (1024 * 1024 * 1024):.1f} GB"

def get_file_icon(path):
    """ファイルのアイコンタイプを取得"""
    if os.path.isdir(path):
        return FILE_ICONS["dir"]
    
    extension = os.path.splitext(path)[1].lower().lstrip(".")
    return FILE_ICONS.get(extension, FILE_ICONS["default"])

def get_mime_type(path):
    """ファイルのMIMEタイプを取得"""
    if os.path.isdir(path):
        return "folder"
    
    mime_type, _ = mimetypes.guess_type(path)
    return mime_type or "application/octet-stream"

def get_file_info(path, base_dir):
    """ファイル情報を取得"""
    try:
        stat_info = os.stat(path)
        is_dir = os.path.isdir(path)
        name = os.path.basename(path)
        rel_path = os.path.relpath(path, base_dir)
        
        # Windowsでは隠しファイル属性を確認
        is_hidden = False
        if os.name == 'nt':
            try:
                attrs = win32api.GetFileAttributes(path)
                is_hidden = attrs & win32con.FILE_ATTRIBUTE_HIDDEN
            except:
                # win32apiが利用できない場合、ドットで始まるファイルを隠しファイルとみなす
                is_hidden = name.startswith('.')
        else:
            # Unixでは.で始まるファイルを隠しファイルとみなす
            is_hidden = name.startswith('.')
        
        size = 0 if is_dir else stat_info.st_size
        extension = "" if is_dir else os.path.splitext(path)[1].lower().lstrip(".")
        
        info = {
            "name": name,
            "path": rel_path,
            "is_dir": is_dir,
            "size": size,
            "size_formatted": format_size(size),
            "modified": datetime.fromtimestamp(stat_info.st_mtime).strftime("%Y-%m-%d %H:%M:%S"),
            "created": datetime.fromtimestamp(stat_info.st_ctime).strftime("%Y-%m-%d %H:%M:%S"),
            "mime_type": get_mime_type(path),
            "extension": extension,
            "icon": get_file_icon(path),
            "is_hidden": is_hidden
        }
        
        return info
    except Exception as e:
        logger.warning(f"ファイル情報の取得中にエラーが発生しました: {path} - {str(e)}")
        return None

def generate_breadcrumbs(path, base_dir):
    """パンくずリストを生成"""
    if not path or path == ".":
        return [{"name": "Home", "path": ""}]
    
    parts = path.split(os.sep)
    breadcrumbs = [{"name": "Home", "path": ""}]
    
    current_path = ""
    for part in parts:
        if part:
            current_path = os.path.join(current_path, part)
            breadcrumbs.append({"name": part, "path": current_path})
    
    return breadcrumbs

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
async def list_files(
    path: str = Query("", description="一覧表示するディレクトリパス"),
    sort_by: str = Query("name", description="ソートフィールド (name, size, modified)"),
    sort_desc: bool = Query(False, description="降順でソートするかどうか"),
    show_hidden: bool = Query(False, description="隠しファイルを表示するかどうか")
):
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
        total_size = 0
        total_files = 0
        total_dirs = 0
        
        try:
            # ディレクトリのスキャンを試みる
            with os.scandir(abs_path) as entries:
                for entry in entries:
                    try:
                        file_info = get_file_info(entry.path, DEFAULT_BASE_DIR)
                        if file_info:
                            # 隠しファイルのフィルタリング
                            if not show_hidden and file_info["is_hidden"]:
                                continue
                                
                            files.append(FileInfo(**file_info))
                            
                            if file_info["is_dir"]:
                                total_dirs += 1
                            else:
                                total_files += 1
                                total_size += file_info["size"]
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
        
        # ソート処理
        if sort_by == "name":
            files.sort(key=lambda x: (not x.is_dir, x.name.lower()), reverse=sort_desc)
        elif sort_by == "size":
            files.sort(key=lambda x: (not x.is_dir, x.size or 0), reverse=sort_desc)
        elif sort_by == "modified":
            files.sort(key=lambda x: (not x.is_dir, x.modified or ""), reverse=sort_desc)
        
        # 親ディレクトリのパスを計算
        parent_dir = None
        if path and path != ".":
            parent_path = os.path.dirname(path)
            parent_dir = parent_path if parent_path else ""
        
        # パンくずリストを生成
        breadcrumbs = generate_breadcrumbs(path, DEFAULT_BASE_DIR)
        
        return FileListResponse(
            files=files,
            current_dir=path or "",
            parent_dir=parent_dir,
            total_size=total_size,
            total_files=total_files,
            total_dirs=total_dirs,
            breadcrumbs=breadcrumbs
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
        
        stat_info = os.stat(abs_path)
        modified = datetime.fromtimestamp(stat_info.st_mtime).strftime("%Y-%m-%d %H:%M:%S")
        mime_type = get_mime_type(abs_path)
        
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
            path=path,
            mime_type=mime_type,
            size=os.path.getsize(abs_path),
            modified=modified
        )
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"ファイルの読み込み中にエラーが発生しました: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"ファイルの読み込み中にエラーが発生しました: {str(e)}"
        )

@router.get("/download")
async def download_file(path: str = Query(..., description="ダウンロードするファイルパス")):
    """
    ファイルをダウンロードします。
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
                detail="ディレクトリはダウンロードできません"
            )
        
        return FileResponse(
            abs_path,
            filename=os.path.basename(abs_path),
            media_type=get_mime_type(abs_path)
        )
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"ファイルのダウンロード中にエラーが発生しました: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"ファイルのダウンロード中にエラーが発生しました: {str(e)}"
        )

@router.post("/upload")
async def upload_file(
    file: UploadFile = File(...),
    path: str = Form("", description="ファイルをアップロードするディレクトリパス")
):
    """
    ファイルをアップロードします。
    """
    try:
        # アップロード先のディレクトリパスを検証
        upload_dir = validate_path(path)
        
        if not os.path.isdir(upload_dir):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="アップロード先はディレクトリでなければなりません"
            )
        
        # アップロードファイルのパスを作成
        file_path = os.path.join(upload_dir, file.filename)
        
        # ファイルを保存
        with open(file_path, "wb") as f:
            content = await file.read()
            f.write(content)
        
        return FileOperationResponse(
            success=True,
            message=f"ファイルをアップロードしました: {file.filename}",
            path=os.path.relpath(file_path, DEFAULT_BASE_DIR)
        )
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"ファイルのアップロード中にエラーが発生しました: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"ファイルのアップロード中にエラーが発生しました: {str(e)}"
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
            path=path
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
            path=data.destination
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
            path=data.destination
        )
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"ファイルのコピー中にエラーが発生しました: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"ファイルのコピー中にエラーが発生しました: {str(e)}"
        )

@router.post("/rename", response_model=FileOperationResponse)
async def rename_file(data: FileRenameRequest):
    """
    ファイルまたはディレクトリの名前を変更します。
    """
    try:
        abs_path = validate_path(data.path)
        
        if not os.path.exists(abs_path):
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="指定されたパスが見つかりませんでした"
            )
        
        # 新しいパスを作成
        dir_path = os.path.dirname(abs_path)
        new_path = os.path.join(dir_path, data.new_name)
        
        # 名前変更
        try:
            os.rename(abs_path, new_path)
        except PermissionError:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="このファイルの名前を変更する権限がありません"
            )
        except FileExistsError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="指定した名前のファイルまたはディレクトリがすでに存在します"
            )
        
        # 相対パスを返す
        new_rel_path = os.path.relpath(new_path, DEFAULT_BASE_DIR)
        
        return FileOperationResponse(
            success=True,
            message="名前を変更しました",
            path=new_rel_path
        )
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"ファイルの名前変更中にエラーが発生しました: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"ファイルの名前変更中にエラーが発生しました: {str(e)}"
        )

@router.post("/search", response_model=FileListResponse)
async def search_files(data: FileSearchRequest):
    """
    ファイルを検索します。
    """
    try:
        base_path = validate_path(data.path)
        
        if not os.path.isdir(base_path):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="検索パスはディレクトリである必要があります"
            )
        
        query = data.query
        if not data.case_sensitive:
            query = query.lower()
        
        search_results = []
        total_files = 0
        total_dirs = 0
        total_size = 0
        
        for root, dirs, files in os.walk(base_path):
            # 許可されたディレクトリのみ検索
            if not any(root.startswith(allowed_dir) for allowed_dir in ALLOWED_DIRS):
                continue
                
            # ブロックされたパスをスキップ
            if any(re.search(pattern, root, re.IGNORECASE) for pattern in BLOCKED_PATH_PATTERNS):
                continue
            
            if not data.recursive and root != base_path:
                continue
            
            # ディレクトリのマッチング
            for dir_name in dirs:
                dir_path = os.path.join(root, dir_name)
                
                name_to_check = dir_name
                if not data.case_sensitive:
                    name_to_check = dir_name.lower()
                
                if query in name_to_check:
                    try:
                        file_info = get_file_info(dir_path, DEFAULT_BASE_DIR)
                        if file_info:
                            search_results.append(FileInfo(**file_info))
                            total_dirs += 1
                    except:
                        continue
            
            # ファイルのマッチング
            for file_name in files:
                file_path = os.path.join(root, file_name)
                
                name_to_check = file_name
                if not data.case_sensitive:
                    name_to_check = file_name.lower()
                
                if query in name_to_check:
                    try:
                        file_info = get_file_info(file_path, DEFAULT_BASE_DIR)
                        if file_info:
                            search_results.append(FileInfo(**file_info))
                            total_files += 1
                            total_size += file_info["size"]
                    except:
                        continue
        
        # 検索結果をディレクトリ優先でソート
        search_results.sort(key=lambda x: (not x.is_dir, x.name.lower()))
        
        return FileListResponse(
            files=search_results,
            current_dir=data.path or "",
            total_files=total_files,
            total_dirs=total_dirs,
            total_size=total_size,
            breadcrumbs=generate_breadcrumbs(data.path, DEFAULT_BASE_DIR)
        )
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"ファイルの検索中にエラーが発生しました: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"ファイルの検索中にエラーが発生しました: {str(e)}"
        )

@router.get("/properties", response_model=FilePropertiesResponse)
async def get_file_properties(path: str = Query(..., description="プロパティを取得するファイルパス")):
    """
    ファイルまたはディレクトリのプロパティを取得します。
    """
    try:
        abs_path = validate_path(path)
        
        if not os.path.exists(abs_path):
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="指定されたパスが見つかりませんでした"
            )
        
        try:
            # ファイル情報を取得
            stat_info = os.stat(abs_path)
            is_dir = os.path.isdir(abs_path)
            name = os.path.basename(abs_path)
            
            # サイズの計算（ディレクトリの場合は再帰的に計算）
            size = 0
            if is_dir:
                for dirpath, dirnames, filenames in os.walk(abs_path):
                    for f in filenames:
                        try:
                            fp = os.path.join(dirpath, f)
                            size += os.path.getsize(fp)
                        except:
                            pass
            else:
                size = stat_info.st_size
            
            # ファイル拡張子の取得
            extension = None
            if not is_dir:
                extension = os.path.splitext(abs_path)[1].lower().lstrip(".")
            
            # ファイル属性の取得
            attributes = {
                "read_only": not os.access(abs_path, os.W_OK),
                "hidden": name.startswith(".") if os.name != "nt" else False,
                "system": False,
                "archive": False,
                "directory": is_dir,
            }
            
            # Windowsの場合、win32apiを使用して詳細な属性を取得
            if os.name == "nt":
                try:
                    import win32api
                    import win32con
                    
                    attrs = win32api.GetFileAttributes(abs_path)
                    attributes["read_only"] = bool(attrs & win32con.FILE_ATTRIBUTE_READONLY)
                    attributes["hidden"] = bool(attrs & win32con.FILE_ATTRIBUTE_HIDDEN)
                    attributes["system"] = bool(attrs & win32con.FILE_ATTRIBUTE_SYSTEM)
                    attributes["archive"] = bool(attrs & win32con.FILE_ATTRIBUTE_ARCHIVE)
                except:
                    pass
            
            # 所有者情報の取得（可能な場合）
            owner = None
            try:
                import pwd
                owner = pwd.getpwuid(stat_info.st_uid).pw_name
            except:
                pass
            
            # パーミッション情報の取得
            permissions = None
            if os.name != "nt":
                permissions = oct(stat_info.st_mode)[-3:]
            
            return FilePropertiesResponse(
                name=name,
                path=path,
                is_dir=is_dir,
                size=size,
                size_formatted=format_size(size),
                created=datetime.fromtimestamp(stat_info.st_ctime).strftime("%Y-%m-%d %H:%M:%S"),
                modified=datetime.fromtimestamp(stat_info.st_mtime).strftime("%Y-%m-%d %H:%M:%S"),
                accessed=datetime.fromtimestamp(stat_info.st_atime).strftime("%Y-%m-%d %H:%M:%S"),
                mime_type=get_mime_type(abs_path) if not is_dir else None,
                attributes=attributes,
                extension=extension,
                owner=owner,
                permissions=permissions
            )
        except PermissionError:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="このファイルのプロパティを取得する権限がありません"
            )
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"ファイルのプロパティ取得中にエラーが発生しました: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"ファイルのプロパティ取得中にエラーが発生しました: {str(e)}"
        )
