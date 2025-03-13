from fastapi import APIRouter, HTTPException, status, Query, Body, Depends
from typing import Dict, Any, Optional, List
from pydantic import BaseModel, Field
import logging

from ..models.github_client import get_github_client
from ..core.dependencies import check_rate_limit

logger = logging.getLogger(__name__)

router = APIRouter()

# 基本レスポンスモデル
class GitHubResponse(BaseModel):
    """
    GitHub API共通レスポンスのスキーマ
    """
    success: bool = Field(..., description="操作が成功したかどうか")
    message: str = Field(..., description="操作結果メッセージ")
    data: Optional[Dict[str, Any]] = Field(None, description="レスポンスデータ")

# リポジトリ関連
class RepositoryCreateRequest(BaseModel):
    """
    リポジトリ作成リクエストのスキーマ
    """
    name: str = Field(..., description="リポジトリ名")
    description: Optional[str] = Field("", description="リポジトリの説明")
    private: Optional[bool] = Field(False, description="プライベートリポジトリにするかどうか")

class FileContentRequest(BaseModel):
    """
    ファイル内容リクエストのスキーマ
    """
    owner: str = Field(..., description="リポジトリのオーナー")
    repo: str = Field(..., description="リポジトリ名")
    path: str = Field(..., description="ファイルパス")
    ref: Optional[str] = Field("main", description="ブランチ名またはコミットハッシュ")

class FileUpdateRequest(BaseModel):
    """
    ファイル更新リクエストのスキーマ
    """
    owner: str = Field(..., description="リポジトリのオーナー")
    repo: str = Field(..., description="リポジトリ名")
    path: str = Field(..., description="ファイルパス")
    content: str = Field(..., description="ファイル内容")
    message: str = Field(..., description="コミットメッセージ")
    branch: Optional[str] = Field("main", description="ブランチ名")
    sha: Optional[str] = Field(None, description="更新する場合は既存ファイルのSHA")

class IssueCreateRequest(BaseModel):
    """
    イシュー作成リクエストのスキーマ
    """
    owner: str = Field(..., description="リポジトリのオーナー")
    repo: str = Field(..., description="リポジトリ名")
    title: str = Field(..., description="イシューのタイトル")
    body: Optional[str] = Field("", description="イシューの説明")

class PullRequestCreateRequest(BaseModel):
    """
    プルリクエスト作成リクエストのスキーマ
    """
    owner: str = Field(..., description="リポジトリのオーナー")
    repo: str = Field(..., description="リポジトリ名")
    title: str = Field(..., description="プルリクエストのタイトル")
    body: Optional[str] = Field("", description="プルリクエストの説明")
    head: str = Field(..., description="変更を含むブランチ")
    base: str = Field(..., description="マージ先のブランチ")

class RepositorySearchRequest(BaseModel):
    """
    リポジトリ検索リクエストのスキーマ
    """
    query: str = Field(..., description="検索クエリ")
    page: Optional[int] = Field(1, description="ページ番号", ge=1)
    per_page: Optional[int] = Field(10, description="1ページあたりの結果数", ge=1, le=100)

# APIエンドポイント

@router.get(
    "/repositories",
    response_model=GitHubResponse,
    summary="認証ユーザーのリポジトリ一覧を取得する",
    dependencies=[Depends(check_rate_limit)],
)
async def get_user_repositories():
    """
    認証ユーザーのリポジトリ一覧を取得する
    """
    try:
        client = get_github_client()
        
        # APIトークンが設定されているか確認
        if not client.api_token:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="GitHub APIトークンが設定されていません。"
            )
        
        # リポジトリ一覧を取得
        result = client.get_user_repositories()
        
        return GitHubResponse(
            success=result["success"],
            message=result["message"],
            data=result["data"]
        )
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"リポジトリ一覧の取得中にエラーが発生しました: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"リポジトリ一覧の取得中にエラーが発生しました: {str(e)}"
        )

@router.post(
    "/repositories",
    response_model=GitHubResponse,
    summary="新しいリポジトリを作成する",
    dependencies=[Depends(check_rate_limit)],
)
async def create_repository(data: RepositoryCreateRequest):
    """
    新しいリポジトリを作成する
    """
    try:
        client = get_github_client()
        
        # APIトークンが設定されているか確認
        if not client.api_token:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="GitHub APIトークンが設定されていません。"
            )
        
        # リポジトリを作成
        result = client.create_repository(
            name=data.name,
            description=data.description,
            private=data.private
        )
        
        return GitHubResponse(
            success=result["success"],
            message=result["message"],
            data=result["data"]
        )
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"リポジトリの作成中にエラーが発生しました: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"リポジトリの作成中にエラーが発生しました: {str(e)}"
        )

@router.post(
    "/repositories/search",
    response_model=GitHubResponse,
    summary="リポジトリを検索する",
    dependencies=[Depends(check_rate_limit)],
)
async def search_repositories(data: RepositorySearchRequest):
    """
    リポジトリを検索する
    """
    try:
        client = get_github_client()
        
        # APIトークンが設定されているか確認
        if not client.api_token:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="GitHub APIトークンが設定されていません。"
            )
        
        # リポジトリを検索
        result = client.search_repositories(
            query=data.query,
            page=data.page,
            per_page=data.per_page
        )
        
        return GitHubResponse(
            success=result["success"],
            message=result["message"],
            data=result["data"]
        )
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"リポジトリの検索中にエラーが発生しました: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"リポジトリの検索中にエラーが発生しました: {str(e)}"
        )

@router.post(
    "/contents",
    response_model=GitHubResponse,
    summary="リポジトリ内のファイル内容を取得する",
    dependencies=[Depends(check_rate_limit)],
)
async def get_file_content(data: FileContentRequest):
    """
    リポジトリ内のファイル内容を取得する
    """
    try:
        client = get_github_client()
        
        # APIトークンが設定されているか確認
        if not client.api_token:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="GitHub APIトークンが設定されていません。"
            )
        
        # ファイル内容を取得
        result = client.get_file_content(
            owner=data.owner,
            repo=data.repo,
            path=data.path,
            ref=data.ref
        )
        
        return GitHubResponse(
            success=result["success"],
            message=result["message"],
            data=result["data"]
        )
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"ファイル内容の取得中にエラーが発生しました: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"ファイル内容の取得中にエラーが発生しました: {str(e)}"
        )

@router.put(
    "/contents",
    response_model=GitHubResponse,
    summary="リポジトリ内にファイルを作成または更新する",
    dependencies=[Depends(check_rate_limit)],
)
async def create_or_update_file(data: FileUpdateRequest):
    """
    リポジトリ内にファイルを作成または更新する
    """
    try:
        client = get_github_client()
        
        # APIトークンが設定されているか確認
        if not client.api_token:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="GitHub APIトークンが設定されていません。"
            )
        
        # ファイルを作成または更新
        result = client.create_or_update_file(
            owner=data.owner,
            repo=data.repo,
            path=data.path,
            content=data.content,
            message=data.message,
            branch=data.branch,
            sha=data.sha
        )
        
        return GitHubResponse(
            success=result["success"],
            message=result["message"],
            data=result["data"]
        )
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"ファイルの作成または更新中にエラーが発生しました: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"ファイルの作成または更新中にエラーが発生しました: {str(e)}"
        )

@router.post(
    "/issues",
    response_model=GitHubResponse,
    summary="イシューを作成する",
    dependencies=[Depends(check_rate_limit)],
)
async def create_issue(data: IssueCreateRequest):
    """
    イシューを作成する
    """
    try:
        client = get_github_client()
        
        # APIトークンが設定されているか確認
        if not client.api_token:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="GitHub APIトークンが設定されていません。"
            )
        
        # イシューを作成
        result = client.create_issue(
            owner=data.owner,
            repo=data.repo,
            title=data.title,
            body=data.body
        )
        
        return GitHubResponse(
            success=result["success"],
            message=result["message"],
            data=result["data"]
        )
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"イシューの作成中にエラーが発生しました: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"イシューの作成中にエラーが発生しました: {str(e)}"
        )

@router.post(
    "/pulls",
    response_model=GitHubResponse,
    summary="プルリクエストを作成する",
    dependencies=[Depends(check_rate_limit)],
)
async def create_pull_request(data: PullRequestCreateRequest):
    """
    プルリクエストを作成する
    """
    try:
        client = get_github_client()
        
        # APIトークンが設定されているか確認
        if not client.api_token:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="GitHub APIトークンが設定されていません。"
            )
        
        # プルリクエストを作成
        result = client.create_pull_request(
            owner=data.owner,
            repo=data.repo,
            title=data.title,
            body=data.body,
            head=data.head,
            base=data.base
        )
        
        return GitHubResponse(
            success=result["success"],
            message=result["message"],
            data=result["data"]
        )
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"プルリクエストの作成中にエラーが発生しました: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"プルリクエストの作成中にエラーが発生しました: {str(e)}"
        )
