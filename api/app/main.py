from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import os
import logging
from typing import List, Optional, Dict, Any, Tuple, Generator

from .core.config import settings
from .core.dependencies import get_token_header
from .core.check_env import check_api_keys
from .routers import text_generation, embeddings, health, chat, file_operations, reasoning, web_search, github_operations, memory, user_memory

# ロギングの設定
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)

# 環境変数が正しく読み込まれているか確認
check_api_keys()

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Google Gemma 3 12B モデルのローカル API",
    version="0.1.0",
)

# CORSミドルウェアの追加
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ルーターの登録
app.include_router(health.router, prefix="/health", tags=["health"])
app.include_router(
    text_generation.router,
    prefix="/api/v1",
    tags=["text generation"],
    dependencies=[Depends(get_token_header)] if settings.API_AUTH_REQUIRED else [],
)
app.include_router(
    embeddings.router,
    prefix="/api/v1",
    tags=["embeddings"],
    dependencies=[Depends(get_token_header)] if settings.API_AUTH_REQUIRED else [],
)
app.include_router(
    chat.router,
    prefix="/api/v1",
    tags=["chat"],
    dependencies=[Depends(get_token_header)] if settings.API_AUTH_REQUIRED else [],
)
app.include_router(
    file_operations.router,
    prefix="/api/v1/files",
    tags=["file operations"],
    dependencies=[Depends(get_token_header)] if settings.API_AUTH_REQUIRED else [],
)
app.include_router(
    reasoning.router,
    prefix="/api/v1",
    tags=["reasoning"],
    dependencies=[Depends(get_token_header)] if settings.API_AUTH_REQUIRED else [],
)
app.include_router(
    web_search.router,
    prefix="/api/v1",
    tags=["web search"],
    dependencies=[Depends(get_token_header)] if settings.API_AUTH_REQUIRED else [],
)
app.include_router(
    github_operations.router,
    prefix="/api/v1/github",
    tags=["github operations"],
    dependencies=[Depends(get_token_header)] if settings.API_AUTH_REQUIRED else [],
)
app.include_router(
    memory.router,
    prefix="/api/v1/memory",
    tags=["memory"],
    dependencies=[Depends(get_token_header)] if settings.API_AUTH_REQUIRED else [],
)
app.include_router(
    user_memory.router,
    prefix="/api/v1/memory",
    tags=["user memories"],
    dependencies=[Depends(get_token_header)] if settings.API_AUTH_REQUIRED else [],
)

@app.get("/", tags=["root"])
async def root():
    """
    ルートエンドポイント - API情報を返します
    """
    return {
        "message": "Gemma 3 12B API",
        "documentation": "/docs",
        "version": "0.1.0",
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
