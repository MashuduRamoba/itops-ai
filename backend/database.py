
import sqlite3
from pathlib import Path

DATABASE_PATH = Path(__file__).resolve().parent / "itops.db"


def get_connection():
    connection = sqlite3.connect(DATABASE_PATH)
    connection.row_factory = sqlite3.Row
    return connection


def init_db():
    with get_connection() as connection:
        connection.execute("""
            CREATE TABLE IF NOT EXISTS incidents (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT NOT NULL,
                description TEXT NOT NULL,
                category TEXT NOT NULL DEFAULT 'General IT',
                priority TEXT NOT NULL DEFAULT 'Medium',
                status TEXT NOT NULL DEFAULT 'Open',
                ai_analysis TEXT,
                created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
                updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
            )
        """)
        connection.commit()


def create_incident(
    title: str,
    description: str,
    category: str = "General IT",
    priority: str = "Medium"
):
    with get_connection() as connection:
        cursor = connection.execute(
            """
            INSERT INTO incidents (
                title, description, category, priority
            )
            VALUES (?, ?, ?, ?)
            """,
            (title, description, category, priority)
        )
        connection.commit()
        return cursor.lastrowid


def get_incidents():
    with get_connection() as connection:
        rows = connection.execute(
            """
            SELECT * FROM incidents
            ORDER BY created_at DESC, id DESC
            """
        ).fetchall()

        return [dict(row) for row in rows]


def get_incident(incident_id: int):
    with get_connection() as connection:
        row = connection.execute(
            "SELECT * FROM incidents WHERE id = ?",
            (incident_id,)
        ).fetchone()

        return dict(row) if row else None


def update_incident(
    incident_id: int,
    status: str,
    priority: str
):
    with get_connection() as connection:
        cursor = connection.execute(
            """
            UPDATE incidents
            SET status = ?,
                priority = ?,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
            """,
            (status, priority, incident_id)
        )
        connection.commit()
        return cursor.rowcount > 0


def save_ai_analysis(incident_id: int, analysis: str):
    with get_connection() as connection:
        cursor = connection.execute(
            """
            UPDATE incidents
            SET ai_analysis = ?,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
            """,
            (analysis, incident_id)
        )
        connection.commit()
        return cursor.rowcount > 0
