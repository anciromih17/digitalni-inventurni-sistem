import os
import time
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

DB_HOST = os.getenv("DB_HOST")
DB_PORT = os.getenv("DB_PORT")
DB_NAME = os.getenv("DB_NAME")
DB_USER = os.getenv("DB_USER")
DB_PASSWORD = os.getenv("DB_PASSWORD")

DATABASE_URL = f"postgresql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"

for i in range(10):
    try:
        engine = create_engine(DATABASE_URL)
        engine.connect()
        print("Connected to PostgreSQL (reservations)")
        break
    except Exception as e:
        print("Database not ready, retrying...")
        time.sleep(3)

SessionLocal = sessionmaker(bind=engine)
Base = declarative_base()