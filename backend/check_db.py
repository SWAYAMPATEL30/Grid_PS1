import psycopg2
import os

url = "postgresql://postgres:WxZFlndbzGpdCFOLDIRORxzDUGmeaodz@kodama.proxy.rlwy.net:28811/railway"
conn = psycopg2.connect(url)
cur = conn.cursor()

cur.execute("SELECT COUNT(*) FROM violations")
total = cur.fetchone()[0]
print(f"Total violations: {total:,}")

cur.execute("SELECT MIN(created_datetime), MAX(created_datetime) FROM violations")
row = cur.fetchone()
print(f"Date range: {row[0]} → {row[1]}")

cur.execute("SELECT COUNT(*) FROM violations WHERE hour_of_day IS NOT NULL")
with_hour = cur.fetchone()[0]
print(f"With hour_of_day: {with_hour:,}")

cur.execute("SELECT hour_of_day, COUNT(*) FROM violations GROUP BY hour_of_day ORDER BY hour_of_day LIMIT 5")
for r in cur.fetchall():
    print(f"  hour {r[0]}: {r[1]} rows")

conn.close()
