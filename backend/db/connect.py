# backend/db/connect.py
import os
import psycopg2
from psycopg2.extras import RealDictCursor
from dotenv import load_dotenv

# Load environment variables from .env
load_dotenv()

def get_db_connection():

    """Create and return a connection to the AWS RDS PostgreSQL database."""

    try:
        conn = psycopg2.connect(
            host=os.getenv("DB_HOST"),
            user=os.getenv("DB_USER"),
            password=os.getenv("DB_PASSWORD"),                       # these need to be changed to the correct ones
            dbname=os.getenv("DB_NAME"),
            port=int(os.getenv("DB_PORT", 5432)),                    # these need to be changed to the correct ones
            cursor_factory=RealDictCursor
        )
        return conn
    
    except Exception as e:
        print(f"Error connecting to database: {e}")
        return None
