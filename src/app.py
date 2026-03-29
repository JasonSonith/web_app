from flask import Flask, request, jsonify, send_from_directory
import sqlite3
import bcrypt
import jwt
import datetime
import os
import re

app = Flask(__name__, static_folder='static')
SECRET_KEY = os.environ.get('JWT_SECRET', os.urandom(32).hex())
DATABASE = 'securenotes.db'

# =========================
# Database Helpers
# =========================
def get_db():
    conn = sqlite3.connect(DATABASE)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    return conn

def init_db():
    conn = get_db()
    conn.executescript('''
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
            content TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id)
        );
    ''')
    conn.commit()
    conn.close()

# =========================
# Auth Helper
# =========================
def get_current_user():
    auth = request.headers.get('Authorization', '')
    if not auth.startswith('Bearer '):
        return None
    try:
        token = auth.split(' ')[1]
        payload = jwt.decode(token, SECRET_KEY, algorithms=['HS256'])
        return payload.get('user_id')
    except (jwt.ExpiredSignatureError, jwt.InvalidTokenError):
        return None

# =========================
# Input Validation
# =========================
def validate_username(username):
    if not username or len(username) < 3 or len(username) > 30:
        return 'Username must be 3-30 characters'
    if not re.match(r'^[a-zA-Z0-9_]+$', username):
        return 'Username: letters, numbers, underscores only'
    return None

def validate_password(password):
    if not password or len(password) < 8:
        return 'Password must be at least 8 characters'
    if len(password) > 128:
        return 'Password must be under 128 characters'
    return None

# =========================
# Serve Frontend
# =========================
@app.route('/')
def index():
    return send_from_directory('static', 'index.html')

@app.route('/<path:filename>')
def static_files(filename):
    return send_from_directory('static', filename)

# =========================
# Auth Routes
# =========================
@app.route('/api/register', methods=['POST'])
def register():
    data = request.get_json()
    if not data:
        return jsonify({'error': 'Invalid request body'}), 400

    username = data.get('username', '').strip()
    password = data.get('password', '')

    user_err = validate_username(username)
    if user_err:
        return jsonify({'error': user_err}), 400
    pass_err = validate_password(password)
    if pass_err:
        return jsonify({'error': pass_err}), 400

    password_hash = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())

    conn = get_db()
    try:
        conn.execute(
            'INSERT INTO users (username, password_hash) VALUES (?, ?)',
            (username, password_hash.decode('utf-8'))
        )
        conn.commit()
        return jsonify({'message': 'Account created'}), 201
    except sqlite3.IntegrityError:
        return jsonify({'error': 'Username already taken'}), 409
    finally:
        conn.close()

@app.route('/api/login', methods=['POST'])
def login():
    data = request.get_json()
    if not data:
        return jsonify({'error': 'Invalid request body'}), 400

    username = data.get('username', '').strip()
    password = data.get('password', '')

    if not username or not password:
        return jsonify({'error': 'Username and password required'}), 400

    conn = get_db()
    user = conn.execute(
        'SELECT id, password_hash FROM users WHERE username = ?',
        (username,)
    ).fetchone()
    conn.close()

    if user and bcrypt.checkpw(password.encode('utf-8'),
                                user['password_hash'].encode('utf-8')):
        token = jwt.encode(
            {
                'user_id': user['id'],
                'exp': datetime.datetime.utcnow() + datetime.timedelta(hours=2)
            },
            SECRET_KEY,
            algorithm='HS256'
        )
        return jsonify({'token': token}), 200

    # Generic error — never reveal if user exists
    return jsonify({'error': 'Invalid credentials'}), 401

# =========================
# Notes API
# =========================
@app.route('/api/notes', methods=['GET'])
def get_notes():
    user_id = get_current_user()
    if not user_id:
        return jsonify({'error': 'Unauthorized'}), 401

    conn = get_db()
    notes = conn.execute(
        'SELECT id, title, content, created_at FROM notes WHERE user_id = ? ORDER BY created_at DESC',
        (user_id,)
    ).fetchall()
    conn.close()
    return jsonify([dict(n) for n in notes])

@app.route('/api/notes', methods=['POST'])
def create_note():
    user_id = get_current_user()
    if not user_id:
        return jsonify({'error': 'Unauthorized'}), 401

    data = request.get_json()
    if not data:
        return jsonify({'error': 'Invalid request body'}), 400

    title = data.get('title', '').strip()
    content = data.get('content', '').strip()

    if not title or not content:
        return jsonify({'error': 'Title and content are required'}), 400
    if len(title) > 200:
        return jsonify({'error': 'Title must be under 200 characters'}), 400
    if len(content) > 10000:
        return jsonify({'error': 'Content must be under 10,000 characters'}), 400

    conn = get_db()
    conn.execute(
        'INSERT INTO notes (user_id, title, content) VALUES (?, ?, ?)',
        (user_id, title, content)
    )
    conn.commit()
    conn.close()
    return jsonify({'message': 'Note saved'}), 201

@app.route('/api/notes/<int:note_id>', methods=['DELETE'])
def delete_note(note_id):
    user_id = get_current_user()
    if not user_id:
        return jsonify({'error': 'Unauthorized'}), 401

    conn = get_db()
    result = conn.execute(
        'DELETE FROM notes WHERE id = ? AND user_id = ?',
        (note_id, user_id)
    )
    conn.commit()
    deleted = result.rowcount
    conn.close()

    if deleted:
        return jsonify({'message': 'Note deleted'}), 200
    return jsonify({'error': 'Note not found'}), 404

@app.route('/api/notes/id', methods=['PUT'])
def update_note(id):
    user_id = get_current_user()
    
    if not user_id:
        return jsonify({'error': 'Unauthorized'}), 401
    
    data = request.get_json()
    if not data:
        return jsonify({'error': 'Invalid request body'}), 400

    title = data.get('title', '').strip()
    content = data.get('content', '').strip()
    if not title or not content:
        return jsonify({'error': 'Title and content required'}), 400
    
    conn = get_db()
    cursor = conn.execute(
        'UPDATE notes SET title = ?, content = ? WHERE id = ? AND user_id = ?',
        (title, content, id, user_id)
    )
    conn.commit()
    if cursor.rowcount == 0:
        conn.close()
        return jsonify({'error': 'Note not found'}), 404
    
    conn.close()
    return jsonify({'message': 'Note updated'}), 201

# =========================
# Start
# =========================
if __name__ == '__main__':
    init_db()
    print('Server running at http://localhost:5000')
    app.run(host='0.0.0.0', port=5000, debug=True)