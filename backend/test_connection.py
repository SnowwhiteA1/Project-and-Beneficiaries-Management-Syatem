import psycopg2
import os
from dotenv import load_dotenv

load_dotenv()

try:
    conn = psycopg2.connect(
        host=os.getenv("DB_HOST"),
        database=os.getenv("DB_NAME"),
        user=os.getenv("DB_USER"),
        password=os.getenv("DB_PASS"),
        port=os.getenv("DB_PORT")
    )
    cur = conn.cursor()
    cur.execute("SELECT * FROM projects;")
    rows = cur.fetchall()
    print("✅ Database connection successful!")
    print("📊 Retrieved rows:", rows)
    cur.close()
    conn.close()
except Exception as e:
    print("❌ Database connection failed!")
    print(e)
