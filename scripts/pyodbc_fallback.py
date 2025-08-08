import sys
import json
import pyodbc

# Simple pyodbc fallback utility
# Usage: python pyodbc_fallback.py "DSN=TallyODBC_9000;" "SELECT 1"


def main():
    if len(sys.argv) < 3:
        print(json.dumps({"success": False, "error": "Arguments: <connection_string> <query>"}))
        return 1

    conn_str = sys.argv[1]
    query = sys.argv[2]

    try:
        # Force 32-bit ODBC by running this script with 32-bit Python
        cnxn = pyodbc.connect(conn_str, timeout=10)
        cursor = cnxn.cursor()
        cursor.execute(query)
        try:
            rows = cursor.fetchall()
            cols = [column[0] for column in cursor.description] if cursor.description else []
            data = [dict(zip(cols, row)) for row in rows]
        except pyodbc.ProgrammingError:
            data = []
        cursor.close()
        cnxn.close()
        print(json.dumps({"success": True, "data": data}))
        return 0
    except Exception as e:
        print(json.dumps({"success": False, "error": str(e)}))
        return 2


if __name__ == "__main__":
    sys.exit(main())
