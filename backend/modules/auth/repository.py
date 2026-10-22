import bcrypt
from mysql.connector import IntegrityError

from db import conn


def _hash_password(password):
    password_bytes = password.encode("utf-8")
    if len(password_bytes) > 72:
        raise ValueError("Password must be 72 bytes or fewer for bcrypt")
    return bcrypt.hashpw(password_bytes, bcrypt.gensalt()).decode("utf-8")


def _verify_password(password, password_hash):
    password_bytes = password.encode("utf-8")
    if len(password_bytes) > 72:
        return False
    try:
        return bcrypt.checkpw(password_bytes, password_hash.encode("utf-8"))
    except (TypeError, ValueError):
        return False


def register_user(email, password, username):
    password_hash = _hash_password(password)
    cursor = conn.cursor()
    query = """
        INSERT INTO users (email, password, username)
        VALUES (%s, %s, %s)
    """
    try:
        cursor.execute(query, (email, password_hash, username))
        conn.commit()
        return cursor.lastrowid
    except IntegrityError:
        conn.rollback()
        return None
    finally:
        cursor.close()
        
def login_user(email, password):
    cursor = conn.cursor()
    query = """
        SELECT id, password FROM users
        WHERE email = %s
    """
    try:
        cursor.execute(query, (email,))
        user = cursor.fetchone() # karena dia ambil 1 user
        if user is None or not _verify_password(password, user[1]): # gapapa pakai array [1]
            return None
        return user[0]
    finally:
        cursor.close()
        
def check_user_exists(email):
    cursor = conn.cursor()
    query = """
        SELECT id FROM users
        WHERE email = %s
    """
    try:
        cursor.execute(query, (email,))
        return cursor.fetchone() is not None
    finally:
        cursor.close()
        
# query untuk profile user        
def get_user_by_id(user_id):
    cursor = conn.cursor(dictionary=True)
    query = """
        SELECT id, email, username FROM users
        WHERE id = %s
    """
    try:
        cursor.execute(query, (user_id,))
        return cursor.fetchone()
    finally:
        cursor.close()
        
# reset password by email
def update_password(email, new_password):
    password_hash = _hash_password(new_password)
    cursor = conn.cursor()
    query = """
        UPDATE users
        SET password = %s
        WHERE email = %s
    """
    try:
        cursor.execute(query, (password_hash, email))
        conn.commit()
        return cursor.rowcount > 0
    finally:
        cursor.close()
