import sqlite3
import json
import os
from pathlib import Path
from typing import List, Optional, Dict, Any
from dotenv import load_dotenv
from backend.models import PersonProfile, PersonResponse, DateResult, DateEvaluation, Message, CandidateRanking

load_dotenv()

DATABASE_URL = os.environ.get("DATABASE_URL", "")
IS_POSTGRES = bool(DATABASE_URL and ("postgres://" in DATABASE_URL or "postgresql://" in DATABASE_URL))

if IS_POSTGRES:
    import psycopg2
    import psycopg2.extras

SEED_PATH = Path(__file__).resolve().parent.parent / "data" / "demo_seed.json"
SQLITE_PATH = Path(__file__).resolve().parent.parent / "data" / "pair_agents.db"

def get_connection():
    if IS_POSTGRES:
        return psycopg2.connect(DATABASE_URL, cursor_factory=psycopg2.extras.RealDictCursor)
    else:
        SQLITE_PATH.parent.mkdir(parents=True, exist_ok=True)
        conn = sqlite3.connect(str(SQLITE_PATH))
        conn.row_factory = sqlite3.Row
        return conn

def init_db():
    conn = get_connection()
    cursor = conn.cursor()
    
    # People table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS people (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        headline TEXT NOT NULL,
        linkedin_url TEXT NOT NULL,
        instagram_url TEXT NOT NULL,
        linkedin_content TEXT,
        instagram_content TEXT,
        profile_json TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    """)
    
    # Dates table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS dates (
        id TEXT PRIMARY KEY,
        person_a_id TEXT NOT NULL,
        person_b_id TEXT NOT NULL,
        person_a_name TEXT NOT NULL,
        person_b_name TEXT NOT NULL,
        transcript_json TEXT NOT NULL,
        evaluation_json TEXT NOT NULL,
        score REAL NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    """)
    
    conn.commit()
    
    conn.close()

def seed_database(conn):
    cursor = conn.cursor()
    with open(SEED_PATH, "r", encoding="utf-8") as f:
        seed_items = json.load(f)
        
    for item in seed_items:
        p_id = item.get("id")
        name = item.get("name")
        headline = item.get("headline", "")
        li_url = item.get("linkedin_url", "")
        ig_url = item.get("instagram_url", "")
        li_cnt = item.get("cached_linkedin_content", "")
        ig_cnt = item.get("cached_instagram_content", "")
        profile_json = json.dumps(item.get("profile", {}))
        
        if IS_POSTGRES:
            cursor.execute("""
                INSERT INTO people (id, name, headline, linkedin_url, instagram_url, linkedin_content, instagram_content, profile_json)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                ON CONFLICT (id) DO UPDATE SET
                    name = EXCLUDED.name,
                    headline = EXCLUDED.headline,
                    linkedin_url = EXCLUDED.linkedin_url,
                    instagram_url = EXCLUDED.instagram_url,
                    linkedin_content = EXCLUDED.linkedin_content,
                    instagram_content = EXCLUDED.instagram_content,
                    profile_json = EXCLUDED.profile_json
            """, (p_id, name, headline, li_url, ig_url, li_cnt, ig_cnt, profile_json))
        else:
            cursor.execute("""
                INSERT OR REPLACE INTO people (id, name, headline, linkedin_url, instagram_url, linkedin_content, instagram_content, profile_json)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """, (p_id, name, headline, li_url, ig_url, li_cnt, ig_cnt, profile_json))
            
    conn.commit()

def get_all_people() -> List[PersonResponse]:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM people ORDER BY id ASC")
    rows = cursor.fetchall()
    people = []
    for r in rows:
        people.append(PersonResponse(
            id=r["id"],
            name=r["name"],
            headline=r["headline"],
            linkedin_url=r["linkedin_url"],
            instagram_url=r["instagram_url"],
            cached_linkedin_content=r["linkedin_content"] or "",
            cached_instagram_content=r["instagram_content"] or "",
            profile=PersonProfile(**(json.loads(r["profile_json"]) if isinstance(r["profile_json"], str) else r["profile_json"])),
            created_at=str(r["created_at"])
        ))
    conn.close()
    return people

def get_person_by_id(person_id: str) -> Optional[PersonResponse]:
    conn = get_connection()
    cursor = conn.cursor()
    if IS_POSTGRES:
        cursor.execute("SELECT * FROM people WHERE id = %s", (person_id,))
    else:
        cursor.execute("SELECT * FROM people WHERE id = ?", (person_id,))
    r = cursor.fetchone()
    conn.close()
    if not r:
        return None
    return PersonResponse(
        id=r["id"],
        name=r["name"],
        headline=r["headline"],
        linkedin_url=r["linkedin_url"],
        instagram_url=r["instagram_url"],
        cached_linkedin_content=r["linkedin_content"] or "",
        cached_instagram_content=r["instagram_content"] or "",
        profile=PersonProfile(**(json.loads(r["profile_json"]) if isinstance(r["profile_json"], str) else r["profile_json"])),
        created_at=str(r["created_at"])
    )

def save_person(person: PersonResponse):
    conn = get_connection()
    cursor = conn.cursor()
    profile_json = json.dumps(person.profile.model_dump())
    if IS_POSTGRES:
        cursor.execute("""
            INSERT INTO people (id, name, headline, linkedin_url, instagram_url, linkedin_content, instagram_content, profile_json)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            ON CONFLICT (id) DO UPDATE SET
                name = EXCLUDED.name,
                headline = EXCLUDED.headline,
                linkedin_url = EXCLUDED.linkedin_url,
                instagram_url = EXCLUDED.instagram_url,
                linkedin_content = EXCLUDED.linkedin_content,
                instagram_content = EXCLUDED.instagram_content,
                profile_json = EXCLUDED.profile_json;
        """, (
            person.id,
            person.name,
            person.headline,
            person.linkedin_url,
            person.instagram_url,
            person.cached_linkedin_content,
            person.cached_instagram_content,
            profile_json
        ))
    else:
        cursor.execute("""
            INSERT OR REPLACE INTO people (id, name, headline, linkedin_url, instagram_url, linkedin_content, instagram_content, profile_json)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            person.id,
            person.name,
            person.headline,
            person.linkedin_url,
            person.instagram_url,
            person.cached_linkedin_content,
            person.cached_instagram_content,
            profile_json
        ))
    conn.commit()
    conn.close()

def delete_person(person_id: str) -> bool:
    """Delete a person and all their date records."""
    conn = get_connection()
    cursor = conn.cursor()
    if IS_POSTGRES:
        cursor.execute("DELETE FROM dates WHERE person_a_id = %s OR person_b_id = %s;", (person_id, person_id))
        cursor.execute("DELETE FROM people WHERE id = %s;", (person_id,))
    else:
        cursor.execute("DELETE FROM dates WHERE person_a_id = ? OR person_b_id = ?;", (person_id, person_id))
        cursor.execute("DELETE FROM people WHERE id = ?;", (person_id,))
    
    deleted = cursor.rowcount > 0
    conn.commit()
    conn.close()
    return deleted

def delete_all_people() -> int:
    """Delete all people and dates."""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM dates;")
    cursor.execute("DELETE FROM people;")
    count = cursor.rowcount
    conn.commit()
    conn.close()
    return count

def save_date(date_result: DateResult):
    conn = get_connection()
    cursor = conn.cursor()
    transcript_json = json.dumps([m.model_dump() for m in date_result.transcript])
    eval_json = json.dumps(date_result.evaluation.model_dump())
    
    if IS_POSTGRES:
        cursor.execute("""
            INSERT INTO dates (id, person_a_id, person_b_id, person_a_name, person_b_name, transcript_json, evaluation_json, score)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            ON CONFLICT (id) DO UPDATE SET
                person_a_id = EXCLUDED.person_a_id,
                person_b_id = EXCLUDED.person_b_id,
                person_a_name = EXCLUDED.person_a_name,
                person_b_name = EXCLUDED.person_b_name,
                transcript_json = EXCLUDED.transcript_json,
                evaluation_json = EXCLUDED.evaluation_json,
                score = EXCLUDED.score;
        """, (
            date_result.id,
            date_result.person_a_id,
            date_result.person_b_id,
            date_result.person_a_name,
            date_result.person_b_name,
            transcript_json,
            eval_json,
            date_result.score
        ))
    else:
        cursor.execute("""
            INSERT OR REPLACE INTO dates (id, person_a_id, person_b_id, person_a_name, person_b_name, transcript_json, evaluation_json, score)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            date_result.id,
            date_result.person_a_id,
            date_result.person_b_id,
            date_result.person_a_name,
            date_result.person_b_name,
            transcript_json,
            eval_json,
            date_result.score
        ))
    conn.commit()
    conn.close()

def get_all_dates() -> List[DateResult]:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM dates ORDER BY created_at DESC")
    rows = cursor.fetchall()
    dates = []
    for r in rows:
        raw_t = json.loads(r["transcript_json"]) if isinstance(r["transcript_json"], str) else r["transcript_json"]
        raw_e = json.loads(r["evaluation_json"]) if isinstance(r["evaluation_json"], str) else r["evaluation_json"]
        dates.append(DateResult(
            id=r["id"],
            person_a_id=r["person_a_id"],
            person_b_id=r["person_b_id"],
            person_a_name=r["person_a_name"],
            person_b_name=r["person_b_name"],
            transcript=[Message(**m) for m in raw_t],
            evaluation=DateEvaluation(**raw_e),
            score=float(r["score"]),
            created_at=str(r["created_at"])
        ))
    conn.close()
    return dates

def get_date_by_id(date_id: str) -> Optional[DateResult]:
    conn = get_connection()
    cursor = conn.cursor()
    if IS_POSTGRES:
        cursor.execute("SELECT * FROM dates WHERE id = %s", (date_id,))
    else:
        cursor.execute("SELECT * FROM dates WHERE id = ?", (date_id,))
    r = cursor.fetchone()
    conn.close()
    if not r:
        return None
    raw_t = json.loads(r["transcript_json"]) if isinstance(r["transcript_json"], str) else r["transcript_json"]
    raw_e = json.loads(r["evaluation_json"]) if isinstance(r["evaluation_json"], str) else r["evaluation_json"]
    return DateResult(
        id=r["id"],
        person_a_id=r["person_a_id"],
        person_b_id=r["person_b_id"],
        person_a_name=r["person_a_name"],
        person_b_name=r["person_b_name"],
        transcript=[Message(**m) for m in raw_t],
        evaluation=DateEvaluation(**raw_e),
        score=float(r["score"]),
        created_at=str(r["created_at"])
    )
