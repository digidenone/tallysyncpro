#!/usr/bin/env python3
"""
TallySyncPro - PyODBC Connector
================================

Python script to handle ODBC connections to Tally ERP 9 using pyodbc
as a fallback when node-odbc is not available or fails.

This script is called from Node.js as a subprocess and communicates
via JSON over stdout/stderr.

Usage:
    python pyodbc_connector.py test <connection_string>
    python pyodbc_connector.py query <connection_string> <sql_query>
"""

import sys
import json
import traceback
from typing import Dict, Any, List, Optional

# Try to import pyodbc
try:
    import pyodbc
    PYODBC_AVAILABLE = True
except ImportError:
    PYODBC_AVAILABLE = False
    pyodbc = None


class PyODBCConnector:
    """Handles ODBC connections using pyodbc"""
    
    def __init__(self):
        self.connection = None
    
    def test_connection(self, connection_string: str) -> Dict[str, Any]:
        """Test ODBC connection to Tally"""
        if not PYODBC_AVAILABLE:
            return {
                "success": False,
                "connected": False,
                "method": "pyodbc",
                "error": "pyodbc module not available. Install with: pip install pyodbc"
            }
        
        try:
            # Attempt to connect
            self.connection = pyodbc.connect(connection_string, timeout=10)
            
            # Try a simple query to verify connection works
            cursor = self.connection.cursor()
            try:
                # Try basic query first
                cursor.execute("SELECT 1 as test")
                result = cursor.fetchone()
            except pyodbc.Error:
                try:
                    # Fallback: Try Tally-specific query
                    cursor.execute("SELECT TOP 1 * FROM COMPANY")
                    result = cursor.fetchone()
                except pyodbc.Error:
                    # If both fail, connection is still valid but no data access
                    result = True
            
            cursor.close()
            self.connection.close()
            
            return {
                "success": True,
                "connected": True,
                "method": "pyodbc",
                "message": "Connection successful"
            }
            
        except Exception as e:
            error_msg = str(e)
            error_code = None
            
            if PYODBC_AVAILABLE and isinstance(e, pyodbc.Error):
                error_code = getattr(e, 'args', [None])[0] if hasattr(e, 'args') else None
            
            return {
                "success": False,
                "connected": False,
                "method": "pyodbc",
                "error": error_msg,
                "error_code": error_code
            }
    
    def execute_query(self, connection_string: str, sql_query: str) -> Dict[str, Any]:
        """Execute SQL query and return results"""
        if not PYODBC_AVAILABLE:
            return {
                "success": False,
                "method": "pyodbc",
                "error": "pyodbc module not available. Install with: pip install pyodbc"
            }
        
        try:
            self.connection = pyodbc.connect(connection_string, timeout=30)
            cursor = self.connection.cursor()
            
            # Execute the query
            cursor.execute(sql_query)
            
            # Get column names
            columns = [desc[0] for desc in cursor.description] if cursor.description else []
            
            # Fetch results
            rows = cursor.fetchall()
            
            # Convert rows to list of dictionaries
            result_data = []
            for row in rows:
                row_dict = {}
                for i, value in enumerate(row):
                    if i < len(columns):
                        # Handle different data types
                        if value is None:
                            row_dict[columns[i]] = None
                        elif isinstance(value, (int, float, str, bool)):
                            row_dict[columns[i]] = value
                        else:
                            row_dict[columns[i]] = str(value)
                result_data.append(row_dict)
            
            cursor.close()
            self.connection.close()
            
            return {
                "success": True,
                "data": result_data,
                "columns": columns,
                "row_count": len(result_data),
                "method": "pyodbc"
            }
            
        except Exception as e:
            error_msg = str(e)
            error_code = None
            
            if PYODBC_AVAILABLE and isinstance(e, pyodbc.Error):
                error_code = getattr(e, 'args', [None])[0] if hasattr(e, 'args') else None
            
            return {
                "success": False,
                "error": error_msg,
                "error_code": error_code,
                "method": "pyodbc"
            }
        finally:
            if self.connection:
                try:
                    self.connection.close()
                except:
                    pass
    
    def list_drivers(self) -> Dict[str, Any]:
        """List available ODBC drivers"""
        if not PYODBC_AVAILABLE:
            return {
                "success": False,
                "method": "pyodbc",
                "error": "pyodbc module not available. Install with: pip install pyodbc"
            }
        
        try:
            drivers = pyodbc.drivers()
            tally_drivers = [d for d in drivers if 'tally' in d.lower() or 'odbc' in d.lower()]
            
            return {
                "success": True,
                "all_drivers": drivers,
                "tally_drivers": tally_drivers,
                "method": "pyodbc",
                "pyodbc_available": True
            }
        except Exception as e:
            return {
                "success": False,
                "error": str(e),
                "method": "pyodbc"
            }


def main():
    """Main entry point"""
    if len(sys.argv) < 2:
        print(json.dumps({
            "success": False,
            "error": "Usage: python pyodbc_connector.py <command> [args...]",
            "pyodbc_available": PYODBC_AVAILABLE
        }))
        sys.exit(1)
    
    command = sys.argv[1].lower()
    connector = PyODBCConnector()
    
    try:
        if command == "test":
            if len(sys.argv) < 3:
                result = {
                    "success": False,
                    "error": "Usage: python pyodbc_connector.py test <connection_string>",
                    "pyodbc_available": PYODBC_AVAILABLE
                }
            else:
                connection_string = sys.argv[2]
                result = connector.test_connection(connection_string)
        
        elif command == "query":
            if len(sys.argv) < 4:
                result = {
                    "success": False,
                    "error": "Usage: python pyodbc_connector.py query <connection_string> <sql_query>",
                    "pyodbc_available": PYODBC_AVAILABLE
                }
            else:
                connection_string = sys.argv[2]
                sql_query = sys.argv[3]
                result = connector.execute_query(connection_string, sql_query)
        
        elif command == "drivers":
            result = connector.list_drivers()
        
        elif command == "check":
            result = {
                "success": True,
                "pyodbc_available": PYODBC_AVAILABLE,
                "python_version": sys.version,
                "method": "pyodbc"
            }
        
        else:
            result = {
                "success": False,
                "error": f"Unknown command: {command}. Available commands: test, query, drivers, check",
                "pyodbc_available": PYODBC_AVAILABLE
            }
        
        print(json.dumps(result))
        
    except Exception as e:
        error_result = {
            "success": False,
            "error": f"Script error: {str(e)}",
            "traceback": traceback.format_exc(),
            "pyodbc_available": PYODBC_AVAILABLE
        }
        print(json.dumps(error_result))
        sys.exit(1)


if __name__ == "__main__":
    main()