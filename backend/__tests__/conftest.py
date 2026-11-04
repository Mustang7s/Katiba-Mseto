import pytest
import os
import sys

# Ensure backend root is on sys.path
backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from src.database import init_db, engine, Base

@pytest.fixture(autouse=True)
async def setup_test_db():
    await init_db()
    yield

