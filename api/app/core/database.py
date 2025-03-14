import os
import sqlite3
import json
import logging
from datetime import datetime
from typing import List, Dict, Any, Optional

logger = logging.getLogger(__name__)

# データベースファイルのパス
DB_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "data")
DB_PATH = os.path.join(DB_DIR, "memory.db")

# データベースディレクトリが存在しない場合は作成
os.makedirs(DB_DIR, exist_ok=True)

def get_db_connection():
    """データベース接続を取得"""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    """データベースを初期化"""
    conn = get_db_connection()
    try:
        # 会話セッションテーブル
        conn.execute("""
        CREATE TABLE IF NOT EXISTS sessions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            session_id TEXT NOT NULL UNIQUE,
            title TEXT NOT NULL,
            created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            metadata TEXT
        )
        """)
        
        # メッセージテーブル
        conn.execute("""
        CREATE TABLE IF NOT EXISTS messages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            session_id TEXT NOT NULL,
            role TEXT NOT NULL,
            content TEXT NOT NULL,
            created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            metadata TEXT,
            FOREIGN KEY (session_id) REFERENCES sessions (session_id) ON DELETE CASCADE
        )
        """)
        
        # トレーニング・事後学習用データテーブル
        conn.execute("""
        CREATE TABLE IF NOT EXISTS training_data (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            prompt TEXT NOT NULL,
            completion TEXT NOT NULL,
            created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            source TEXT,
            quality_score INTEGER,
            is_used_for_training BOOLEAN DEFAULT 0,
            metadata TEXT
        )
        """)
        
        # メモリ設定テーブル
        conn.execute("""
        CREATE TABLE IF NOT EXISTS memory_settings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            setting_key TEXT NOT NULL UNIQUE,
            setting_value TEXT NOT NULL,
            updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            description TEXT
        )
        """)
        
        # ユーザー定義記憶テーブル
        conn.execute("""
        CREATE TABLE IF NOT EXISTS user_memories (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            key TEXT NOT NULL,
            value TEXT NOT NULL,
            created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            source_session_id TEXT
        )
        """)
        
        # デフォルト設定の挿入
        default_settings = [
            ("max_context_messages", "20", "会話履歴で保持する最大メッセージ数"),
            ("memory_enabled", "true", "メモリ機能の有効・無効"),
            ("auto_save_for_training", "true", "質の高い会話を自動的にトレーニングデータとして保存するか"),
            ("quality_threshold", "7", "会話品質の閾値（1-10、高いほど良質）"),
            ("user_memory_enabled", "true", "ユーザー定義記憶機能の有効・無効"),
        ]
        
        for key, value, desc in default_settings:
            conn.execute(
                "INSERT OR IGNORE INTO memory_settings (setting_key, setting_value, description) VALUES (?, ?, ?)",
                (key, value, desc)
            )
        
        conn.commit()
        logger.info("データベースの初期化が完了しました")
    except Exception as e:
        logger.error(f"データベースの初期化中にエラーが発生しました: {str(e)}")
        raise
    finally:
        conn.close()

# セッション管理関数
def create_session(session_id: str, title: Optional[str] = None, metadata: Optional[Dict[str, Any]] = None) -> int:
    """新しいセッションを作成"""
    if not title:
        title = f"会話 {datetime.now().strftime('%Y-%m-%d %H:%M')}"
    
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        cursor.execute(
            "INSERT INTO sessions (session_id, title, updated_at, metadata) VALUES (?, ?, ?, ?)",
            (session_id, title, datetime.now().isoformat(), json.dumps(metadata or {}))
        )
        conn.commit()
        return cursor.lastrowid
    except Exception as e:
        conn.rollback()
        logger.error(f"セッション作成中にエラーが発生しました: {str(e)}")
        raise
    finally:
        conn.close()

def update_session(session_id: str, title: Optional[str] = None, metadata: Optional[Dict[str, Any]] = None) -> bool:
    """セッション情報を更新"""
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        updates = []
        params = []
        
        if title is not None:
            updates.append("title = ?")
            params.append(title)
        
        if metadata is not None:
            updates.append("metadata = ?")
            params.append(json.dumps(metadata))
        
        if not updates:
            return False
        
        updates.append("updated_at = ?")
        params.append(datetime.now().isoformat())
        params.append(session_id)
        
        query = f"UPDATE sessions SET {', '.join(updates)} WHERE session_id = ?"
        cursor.execute(query, params)
        conn.commit()
        return cursor.rowcount > 0
    except Exception as e:
        conn.rollback()
        logger.error(f"セッション更新中にエラーが発生しました: {str(e)}")
        raise
    finally:
        conn.close()

def get_session(session_id: str) -> Optional[Dict[str, Any]]:
    """セッション情報を取得"""
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM sessions WHERE session_id = ?", (session_id,))
        row = cursor.fetchone()
        
        if row:
            session = dict(row)
            if session.get("metadata"):
                session["metadata"] = json.loads(session["metadata"])
            return session
        
        return None
    except Exception as e:
        logger.error(f"セッション取得中にエラーが発生しました: {str(e)}")
        raise
    finally:
        conn.close()

def list_sessions(limit: int = 100, offset: int = 0) -> List[Dict[str, Any]]:
    """セッション一覧を取得"""
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        cursor.execute(
            "SELECT * FROM sessions ORDER BY updated_at DESC LIMIT ? OFFSET ?",
            (limit, offset)
        )
        rows = cursor.fetchall()
        
        sessions = []
        for row in rows:
            session = dict(row)
            if session.get("metadata"):
                session["metadata"] = json.loads(session["metadata"])
            sessions.append(session)
        
        return sessions
    except Exception as e:
        logger.error(f"セッション一覧取得中にエラーが発生しました: {str(e)}")
        raise
    finally:
        conn.close()

def delete_session(session_id: str) -> bool:
    """セッションを削除"""
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("DELETE FROM sessions WHERE session_id = ?", (session_id,))
        conn.commit()
        return cursor.rowcount > 0
    except Exception as e:
        conn.rollback()
        logger.error(f"セッション削除中にエラーが発生しました: {str(e)}")
        raise
    finally:
        conn.close()

# メッセージ管理関数
def add_message(session_id: str, role: str, content: str, metadata: Optional[Dict[str, Any]] = None) -> int:
    """メッセージを追加"""
    conn = get_db_connection()
    try:
        # セッションが存在するか確認
        session = get_session(session_id)
        if not session:
            # セッションが存在しない場合は新規作成
            create_session(session_id)
        
        # メッセージを追加
        cursor = conn.cursor()
        cursor.execute(
            "INSERT INTO messages (session_id, role, content, metadata) VALUES (?, ?, ?, ?)",
            (session_id, role, content, json.dumps(metadata or {}))
        )
        
        # セッションの更新日時を更新
        cursor.execute(
            "UPDATE sessions SET updated_at = ? WHERE session_id = ?",
            (datetime.now().isoformat(), session_id)
        )
        
        conn.commit()
        return cursor.lastrowid
    except Exception as e:
        conn.rollback()
        logger.error(f"メッセージ追加中にエラーが発生しました: {str(e)}")
        raise
    finally:
        conn.close()

def get_messages(session_id: str, limit: Optional[int] = None) -> List[Dict[str, Any]]:
    """セッション内のメッセージを取得"""
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        
        if limit:
            cursor.execute(
                "SELECT * FROM messages WHERE session_id = ? ORDER BY created_at ASC LIMIT ?",
                (session_id, limit)
            )
        else:
            cursor.execute(
                "SELECT * FROM messages WHERE session_id = ? ORDER BY created_at ASC",
                (session_id,)
            )
        
        rows = cursor.fetchall()
        
        messages = []
        for row in rows:
            message = dict(row)
            if message.get("metadata"):
                message["metadata"] = json.loads(message["metadata"])
            messages.append(message)
        
        return messages
    except Exception as e:
        logger.error(f"メッセージ取得中にエラーが発生しました: {str(e)}")
        raise
    finally:
        conn.close()

def delete_messages(session_id: str) -> bool:
    """セッションのメッセージをすべて削除"""
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("DELETE FROM messages WHERE session_id = ?", (session_id,))
        conn.commit()
        return cursor.rowcount > 0
    except Exception as e:
        conn.rollback()
        logger.error(f"メッセージ削除中にエラーが発生しました: {str(e)}")
        raise
    finally:
        conn.close()

# トレーニングデータ管理関数
def add_training_data(prompt: str, completion: str, source: Optional[str] = None, 
                      quality_score: Optional[int] = None, metadata: Optional[Dict[str, Any]] = None) -> int:
    """トレーニングデータを追加"""
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        cursor.execute(
            "INSERT INTO training_data (prompt, completion, source, quality_score, metadata) VALUES (?, ?, ?, ?, ?)",
            (prompt, completion, source, quality_score, json.dumps(metadata or {}))
        )
        conn.commit()
        return cursor.lastrowid
    except Exception as e:
        conn.rollback()
        logger.error(f"トレーニングデータ追加中にエラーが発生しました: {str(e)}")
        raise
    finally:
        conn.close()

def get_training_data(limit: int = 1000, offset: int = 0, 
                     min_quality: Optional[int] = None) -> List[Dict[str, Any]]:
    """トレーニングデータを取得"""
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        query = "SELECT * FROM training_data"
        params = []
        
        if min_quality is not None:
            query += " WHERE quality_score >= ?"
            params.append(min_quality)
        
        query += " ORDER BY created_at DESC LIMIT ? OFFSET ?"
        params.extend([limit, offset])
        
        cursor.execute(query, params)
        rows = cursor.fetchall()
        
        data = []
        for row in rows:
            item = dict(row)
            if item.get("metadata"):
                item["metadata"] = json.loads(item["metadata"])
            data.append(item)
        
        return data
    except Exception as e:
        logger.error(f"トレーニングデータ取得中にエラーが発生しました: {str(e)}")
        raise
    finally:
        conn.close()

def mark_training_data_used(data_id: int) -> bool:
    """トレーニングデータを使用済みとしてマーク"""
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        cursor.execute(
            "UPDATE training_data SET is_used_for_training = 1 WHERE id = ?",
            (data_id,)
        )
        conn.commit()
        return cursor.rowcount > 0
    except Exception as e:
        conn.rollback()
        logger.error(f"トレーニングデータの使用済みマーク中にエラーが発生しました: {str(e)}")
        raise
    finally:
        conn.close()

# ユーザー定義記憶管理関数
def store_user_memory(key: str, value: str, session_id: Optional[str] = None) -> int:
    """ユーザー定義記憶を保存または更新する"""
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        
        # 既存のキーがあるか確認
        cursor.execute("SELECT id FROM user_memories WHERE key = ?", (key,))
        existing_row = cursor.fetchone()
        
        if existing_row:
            # 既存のキーを更新
            cursor.execute(
                "UPDATE user_memories SET value = ?, updated_at = ?, source_session_id = ? WHERE key = ?",
                (value, datetime.now().isoformat(), session_id, key)
            )
            memory_id = existing_row[0]
        else:
            # 新しいキーを作成
            cursor.execute(
                "INSERT INTO user_memories (key, value, created_at, updated_at, source_session_id) VALUES (?, ?, ?, ?, ?)",
                (key, value, datetime.now().isoformat(), datetime.now().isoformat(), session_id)
            )
            memory_id = cursor.lastrowid
        
        conn.commit()
        return memory_id
    except Exception as e:
        conn.rollback()
        logger.error(f"ユーザー定義記憶の保存中にエラーが発生しました: {str(e)}")
        raise
    finally:
        conn.close()

def get_user_memory(key: str) -> Optional[Dict[str, Any]]:
    """ユーザー定義記憶を取得する"""
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM user_memories WHERE key = ?", (key,))
        row = cursor.fetchone()
        
        if row:
            return dict(row)
        
        return None
    except Exception as e:
        logger.error(f"ユーザー定義記憶の取得中にエラーが発生しました: {str(e)}")
        raise
    finally:
        conn.close()

def get_all_user_memories() -> List[Dict[str, Any]]:
    """すべてのユーザー定義記憶を取得する"""
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM user_memories ORDER BY updated_at DESC")
        rows = cursor.fetchall()
        
        memories = []
        for row in rows:
            memories.append(dict(row))
        
        return memories
    except Exception as e:
        logger.error(f"ユーザー定義記憶一覧の取得中にエラーが発生しました: {str(e)}")
        raise
    finally:
        conn.close()

def delete_user_memory(key: str) -> bool:
    """ユーザー定義記憶を削除する"""
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("DELETE FROM user_memories WHERE key = ?", (key,))
        conn.commit()
        return cursor.rowcount > 0
    except Exception as e:
        conn.rollback()
        logger.error(f"ユーザー定義記憶の削除中にエラーが発生しました: {str(e)}")
        raise
    finally:
        conn.close()

# 設定管理関数
def get_memory_setting(key: str) -> Optional[str]:
    """メモリ設定値を取得"""
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("SELECT setting_value FROM memory_settings WHERE setting_key = ?", (key,))
        row = cursor.fetchone()
        return row and row[0]
    except Exception as e:
        logger.error(f"メモリ設定取得中にエラーが発生しました: {str(e)}")
        raise
    finally:
        conn.close()

def set_memory_setting(key: str, value: str, description: Optional[str] = None) -> bool:
    """メモリ設定値を設定"""
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        cursor.execute(
            """
            INSERT INTO memory_settings (setting_key, setting_value, updated_at, description)
            VALUES (?, ?, ?, ?)
            ON CONFLICT(setting_key) DO UPDATE SET
            setting_value = ?, updated_at = ?, description = COALESCE(?, description)
            """,
            (key, value, datetime.now().isoformat(), description, 
             value, datetime.now().isoformat(), description)
        )
        conn.commit()
        return True
    except Exception as e:
        conn.rollback()
        logger.error(f"メモリ設定更新中にエラーが発生しました: {str(e)}")
        raise
    finally:
        conn.close()

def get_all_memory_settings() -> Dict[str, str]:
    """すべてのメモリ設定を取得"""
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("SELECT setting_key, setting_value FROM memory_settings")
        rows = cursor.fetchall()
        return {row[0]: row[1] for row in rows}
    except Exception as e:
        logger.error(f"メモリ設定一覧取得中にエラーが発生しました: {str(e)}")
        raise
    finally:
        conn.close()

# コンテキスト管理のユーティリティ関数
def get_conversation_context(session_id: str, max_messages: Optional[int] = None) -> List[Dict[str, str]]:
    """会話コンテキストを取得"""
    if max_messages is None:
        # デフォルト値の取得
        max_messages_str = get_memory_setting("max_context_messages")
        max_messages = int(max_messages_str) if max_messages_str else 20
    
    messages = get_messages(session_id, max_messages)
    return [{"role": msg["role"], "content": msg["content"]} for msg in messages]

def save_conversation_to_training(session_id: str, quality_score: Optional[int] = None) -> int:
    """会話をトレーニングデータとして保存"""
    messages = get_messages(session_id)
    
    # メッセージを役割ごとに分けてプロンプトと完了を構築
    user_messages = []
    assistant_messages = []
    
    for msg in messages:
        if msg["role"] == "user":
            user_messages.append(msg["content"])
        elif msg["role"] == "assistant":
            assistant_messages.append(msg["content"])
    
    # トレーニングデータとして適切なプロンプトと完了のペアを構築
    training_pairs = []
    
    for i in range(min(len(user_messages), len(assistant_messages))):
        prompt = user_messages[i]
        completion = assistant_messages[i]
        training_pairs.append((prompt, completion))
    
    # トレーニングデータとして保存
    count = 0
    for prompt, completion in training_pairs:
        add_training_data(
            prompt=prompt,
            completion=completion,
            source=f"session:{session_id}",
            quality_score=quality_score,
            metadata={"session_id": session_id}
        )
        count += 1
    
    return count

# データベースの初期化
init_db()
