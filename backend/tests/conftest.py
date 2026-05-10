"""
Patch the MySQL connection pool before any app module is imported so that tests
can run without a live database.
"""

import sys
from unittest.mock import MagicMock, patch

# Build a fully mocked pool + connector before importing anything from app
_mock_pool = MagicMock()
_mock_pool.get_connection.return_value = MagicMock()

_mock_pooling = MagicMock()
_mock_pooling.MySQLConnectionPool.return_value = _mock_pool

_mock_connector = MagicMock()
_mock_connector.pooling = _mock_pooling

# Inject the mocks into sys.modules so that `import mysql.connector` and
# `from mysql.connector import pooling` both resolve to our stubs
sys.modules.setdefault("mysql", MagicMock())
sys.modules["mysql.connector"] = _mock_connector
sys.modules["mysql.connector.pooling"] = _mock_pooling
