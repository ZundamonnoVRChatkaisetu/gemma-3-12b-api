from fastapi import Header, HTTPException, Depends, status
from typing import Optional
import time
from fastapi import Request

from .config import settings, get_settings

# レート制限の簡易実装（メモリ内）
# 本番環境では Redis などを使用することを推奨
class RateLimiter:
    def __init__(self):
        self.request_logs = {}  # {ip_address: [timestamp1, timestamp2, ...]}
        
    def is_rate_limited(self, ip_address: str) -> bool:
        """指定されたIPアドレスがレート制限に達しているかチェック"""
        if not settings.RATE_LIMIT_ENABLED:
            return False
            
        current_time = time.time()
        if ip_address not in self.request_logs:
            self.request_logs[ip_address] = []
            
        # 期限切れのタイムスタンプを削除
        self.request_logs[ip_address] = [
            ts for ts in self.request_logs[ip_address]
            if current_time - ts < settings.RATE_LIMIT_WINDOW_SECONDS
        ]
        
        # 現在のリクエスト数をチェック
        if len(self.request_logs[ip_address]) >= settings.RATE_LIMIT_REQUESTS:
            return True
            
        # 新しいリクエストを記録
        self.request_logs[ip_address].append(current_time)
        return False

rate_limiter = RateLimiter()

async def get_token_header(
    x_api_key: Optional[str] = Header(None),
    settings=Depends(get_settings)
) -> str:
    """
    API キーを検証する依存関係
    """
    if not settings.API_AUTH_REQUIRED:
        return "no_auth_required"
        
    if x_api_key is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="API キーが必要です。X-API-Key ヘッダーを設定してください。",
        )
        
    if x_api_key != settings.API_KEY:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="無効な API キーです。",
        )
        
    return x_api_key

async def check_rate_limit(request: Request):
    """
    レート制限をチェックする依存関係
    """
    ip_address = request.client.host
    
    if rate_limiter.is_rate_limited(ip_address):
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"レート制限に達しました。{settings.RATE_LIMIT_WINDOW_SECONDS}秒後に再試行してください。",
        )
