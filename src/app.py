from flask import Flask, request, jsonify, send_from_directory
import sqlite3
import bcrypt
import jwt
import datetime
import os
import re

app = Flask(__name__, static_folder ='static')
SECRET_KEY = os.environ.get('JWT_SECRET', os.urandom(32).hex())
DATABASE = 'securenotes.db'

# Database HELPERS

def get_db():
    conn = sqlite3.connect(DATABASE)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    return conn

def init_db():
    conn = get_db()
    conn.executescript(
        '''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        CREATE TABLE IF NOT EXISTS notes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            title TEXT NOT NULL,
            created at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id)
        );
        '''
    )
    conn.commit()
    conn.close()
    
    #Auth Helper
    
    def get_current_user():
        auth = request.headers.get('Authorization', '')
        
        if not auth.startswith('Bearer '):
            return None
        try:
            token = auth.split('')[1]
            payload = jwt.decode(token, SECRET_KEY, algorithms=['HS256'])
            return payload.get('user_id')
        
        except (jwt.ExpireSignatureError, jwt.InvalidTokenError):
            return None

# Input Validation
def validate_username(username):
    if not username or len(username) < 3 or len(username) > 30:
        return 'Username must be 3-30 characters'
    
    if not re.match(r'^[a-zA-Z0-9_]+$', username):
        return 'Username: letters, numbers, underscores only'
    return None


## Server frontend
@app.route('/')
def index():
    return send_from_directory('static', 'index.html')

@app.route('/<path:filename>')
def static_files(filename):
    return send_from_directory('static', filename)