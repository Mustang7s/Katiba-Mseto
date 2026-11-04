from typing import Any, Optional
import json
import time
import fnmatch
from datetime import timedelta
from uuid import UUID
from fastapi import BackgroundTasks
from pydantic import UUID4

# Cache duration constants
MINUTE = 60
HOUR = MINUTE * 60
DAY = HOUR * 24

class UUIDEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, UUID):
            # Convert UUID to string
            return str(obj)
        return super().default(obj)

class CacheManager:
    _memory_cache = {}

    def __init__(self, redis_client: Optional[Any] = None, prefix: str = "cache"):
        self.redis = redis_client
        self.prefix = prefix

    def _get_key(self, key: str) -> str:
        """Generate prefixed cache key"""
        return f"{self.prefix}:{key}"
        
    async def clear_pattern(self, pattern: str) -> int:
        """Clear all cache entries matching a pattern
        
        Args:
            pattern: Pattern to match (e.g., "constitution:search:*")
            
        Returns:
            int: Number of keys deleted
        """
        full_pattern = self._get_key(pattern)
        deleted = 0
        
        # Clear in-memory cache matches
        keys_to_delete = [
            k for k in self._memory_cache.keys()
            if fnmatch.fnmatch(k, full_pattern) or k.startswith(full_pattern.rstrip("*"))
        ]
        for k in keys_to_delete:
            self._memory_cache.pop(k, None)
            deleted += 1

        if self.redis:
            try:
                keys = await self.redis.keys(full_pattern)
                if keys:
                    redis_deleted = await self.redis.delete(*keys)
                    deleted = max(deleted, redis_deleted)
            except Exception as e:
                pass

        return deleted

    async def delete(self, key: str) -> bool:
        """Delete a specific key from cache
        
        Args:
            key: The key to delete
            
        Returns:
            bool: True if key was deleted, False otherwise
        """
        prefixed_key = self._get_key(key)
        mem_deleted = self._memory_cache.pop(prefixed_key, None) is not None

        if self.redis:
            try:
                result = await self.redis.delete(prefixed_key)
                return result > 0 or mem_deleted
            except Exception as e:
                return mem_deleted

        return mem_deleted
    
    async def get(self, key: str) -> Optional[Any]:
        """Get data from cache"""
        prefixed_key = self._get_key(key)
        
        if self.redis:
            try:
                data = await self.redis.get(prefixed_key)
                if data:
                    return json.loads(data)
            except Exception as e:
                pass
        
        # Fallback to in-memory cache
        entry = self._memory_cache.get(prefixed_key)
        if entry:
            val, expiry = entry
            if expiry is None or expiry > time.time():
                return val
            else:
                self._memory_cache.pop(prefixed_key, None)
                
        return None

    async def set(
        self,
        key: str,
        data: Any,
        expire: int = HOUR,  # Default 1 hour
    ) -> bool:
        """Set data in cache with expiration"""
        prefixed_key = self._get_key(key)
        expiry_time = time.time() + expire if expire else None
        self._memory_cache[prefixed_key] = (data, expiry_time)

        if self.redis:
            try:
                serialized_data = json.dumps(data, cls=UUIDEncoder)
                await self.redis.set(
                    prefixed_key,
                    serialized_data,
                    ex=expire
                )
                return True
            except Exception as e:
                return True  # Stored in memory cache successfully

        return True

    async def set_background(
        self,
        background_tasks: BackgroundTasks,
        key: str,
        data: Any,
        expire: int = HOUR,
    ):
        """Set cache in background task"""
        background_tasks.add_task(self.set, key, data, expire)
    
    async def exists(self, key: str) -> bool:
        """Check if key exists in cache"""
        prefixed_key = self._get_key(key)
        if self.redis:
            try:
                return bool(await self.redis.exists(prefixed_key))
            except Exception:
                pass
        
        entry = self._memory_cache.get(prefixed_key)
        if entry:
            val, expiry = entry
            if expiry is None or expiry > time.time():
                return True
            self._memory_cache.pop(prefixed_key, None)
        return False

    async def increment(self, key: str, amount: int = 1) -> int:
        """Increment a numeric value in cache"""
        prefixed_key = self._get_key(key)
        if self.redis:
            try:
                return await self.redis.incr(prefixed_key, amount)
            except Exception:
                pass
        
        entry = self._memory_cache.get(prefixed_key)
        curr = entry[0] if entry and isinstance(entry[0], int) else 0
        new_val = curr + amount
        self._memory_cache[prefixed_key] = (new_val, None)
        return new_val

    async def expire_at(self, key: str, timestamp: int) -> bool:
        """Set a specific expiration timestamp for a key"""
        prefixed_key = self._get_key(key)
        if self.redis:
            try:
                return bool(await self.redis.expireat(prefixed_key, timestamp))
            except Exception:
                pass
        
        entry = self._memory_cache.get(prefixed_key)
        if entry:
            self._memory_cache[prefixed_key] = (entry[0], float(timestamp))
            return True
        return False
