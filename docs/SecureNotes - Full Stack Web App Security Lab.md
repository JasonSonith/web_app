# SecureNotes — Full Stack Web App Security Lab

> **Goal:** Build a complete web application from scratch, learn each layer of the stack (HTML, CSS, JavaScript, Python, SQL, APIs), then attack and harden your own app.
> 
> **Why this matters:** This project mirrors exactly what penetration testers evaluate in real engagements. Building it yourself means you understand both how things work and how they break.

---

## Project Overview

You're building **SecureNotes** — a note-taking web app with authentication. The project is split into phases. Each phase teaches a core technology, gives you exercises to cement understanding, and ends with a checkpoint so you know you're ready to move on.

**Tech Stack:**
- **Frontend:** HTML → CSS → JavaScript
- **Backend:** Python (Flask)
- **Database:** SQLite (simple) → MySQL (optional upgrade)
- **Security Tools:** Burp Suite, OWASP ZAP, sqlmap, nikto
- **Environment:** VS Code + WSL2 (Kali)

**Time Estimate:** 2–4 weeks depending on pace

---

## Environment Setup

### Prerequisites
Open VS Code, connect to WSL2, and run:

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install python3 python3-pip python3-venv sqlite3 -y
mkdir -p ~/securenotes/static ~/securenotes/templates
cd ~/securenotes
python3 -m venv venv
source venv/bin/activate
pip install flask flask-limiter bcrypt pyjwt
```

### VS Code Extensions to Install
- Remote - WSL
- Python
- REST Client (for API testing)
- Live Server (for HTML/CSS preview)
- SQLite Viewer

### Project Structure (what you'll build by the end)
```
~/securenotes/
├── app.py                  # Flask backend
├── securenotes.db          # SQLite database (auto-created)
├── static/
│   ├── index.html          # Landing/login page
│   ├── style.css           # Stylesheet
│   └── app.js              # Frontend logic
├── tests/
│   └── test_api.http       # REST Client test file
└── venv/                   # Python virtual environment
```

---

## Phase 1: HTML Fundamentals

### What You're Learning
HTML (HyperText Markup Language) is the skeleton of every web page. It defines **structure** — what elements exist and how they're nested. It has zero styling and zero behavior on its own.

### Core Concepts

**Elements and Tags** — Every HTML element has an opening tag, content, and a closing tag:
```html
<p>This is a paragraph.</p>
<h1>This is a heading.</h1>
```

Some elements are self-closing (no content inside):
```html
<img src="photo.jpg" alt="A photo">
<input type="text">
```

**Nesting and the DOM Tree** — HTML is a tree structure. Elements contain other elements:
```html
<div>
    <h2>Title</h2>
    <p>Some text with a <strong>bold word</strong> in it.</p>
</div>
```

This creates a parent-child relationship called the DOM (Document Object Model). JavaScript manipulates this tree to make pages interactive.

**Attributes** — Tags can have attributes that provide extra info:
```html
<a href="https://example.com" target="_blank">Click me</a>
<input type="password" id="loginPass" placeholder="Enter password" required>
<div class="container" id="main">Content</div>
```

- `id` = unique identifier (one per page)
- `class` = reusable identifier (many elements can share a class)

**Semantic HTML** — Use tags that describe their meaning:
```html
<!-- Bad -->
<div class="top-bar"><div class="title">SecureNotes</div></div>

<!-- Good -->
<header><h1>SecureNotes</h1></header>
<main><section>...</section></main>
<footer>...</footer>
```

**Forms — The Most Security-Relevant HTML** — Forms are where user input enters your application. Every input field is a potential attack vector:
```html
<form action="/api/login" method="POST">
    <label for="username">Username:</label>
    <input type="text" id="username" name="username" required minlength="3" maxlength="30">
    <label for="password">Password:</label>
    <input type="password" id="password" name="password" required minlength="8">
    <button type="submit">Login</button>
</form>
```

Key form attributes: `action` (where data gets sent), `method` (GET = data in URL, POST = data in body), `required`/`minlength`/`maxlength` (client-side validation — never trust these alone).

### Build: Create the Login Page

Create `~/securenotes/static/index.html`:

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>SecureNotes</title>
    <link rel="stylesheet" href="style.css">
</head>
<body>
    <header>
        <h1>SecureNotes</h1>
        <p>Your private, encrypted notebook.</p>
    </header>

    <main>
        <nav>
            <button id="loginTab" class="active">Login</button>
            <button id="registerTab">Register</button>
        </nav>

        <div id="errorMsg"></div>

        <section id="loginForm">
            <h2>Login</h2>
            <div>
                <label for="loginUser">Username</label>
                <input type="text" id="loginUser" placeholder="Enter username"
                       required minlength="3" maxlength="30">
            </div>
            <div>
                <label for="loginPass">Password</label>
                <input type="password" id="loginPass" placeholder="Enter password"
                       required minlength="8">
            </div>
            <button id="loginBtn">Login</button>
        </section>

        <section id="registerForm" hidden>
            <h2>Create Account</h2>
            <div>
                <label for="regUser">Username</label>
                <input type="text" id="regUser" placeholder="Choose username"
                       required minlength="3" maxlength="30">
            </div>
            <div>
                <label for="regPass">Password</label>
                <input type="password" id="regPass" placeholder="Choose password"
                       required minlength="8">
            </div>
            <div>
                <label for="regPassConfirm">Confirm Password</label>
                <input type="password" id="regPassConfirm" placeholder="Confirm password"
                       required minlength="8">
            </div>
            <button id="registerBtn">Create Account</button>
        </section>

        <section id="notesSection" hidden>
            <h2>My Notes</h2>
            <div>
                <label for="noteTitle">Title</label>
                <input type="text" id="noteTitle" placeholder="Note title" maxlength="200">
            </div>
            <div>
                <label for="noteContent">Content</label>
                <textarea id="noteContent" rows="5" placeholder="Write your note..."></textarea>
            </div>
            <button id="saveNoteBtn">Save Note</button>
            <div id="notesList"></div>
        </section>
    </main>

    <footer>
        <p>SecureNotes &copy; 2026 — Built for learning web security</p>
    </footer>

    <script src="app.js"></script>
</body>
</html>
```

### Exercises
1. **Inspect Element:** Right-click the page → Inspect. Look at the DOM tree. This is the same view you'll use when looking for XSS injection points.
2. **Try breaking it:** Remove a closing `</section>` tag and see how the browser recovers. Browsers are forgiving of bad HTML — this is a security concern because malformed HTML can bypass sanitization filters.
3. **Add a "Forgot Password" link** below the login button using an `<a>` tag.
4. **Add an "About" section** below the footer.

### Checkpoint
- [x] You can explain the difference between `id` and `class`
- [x] You understand what `<form>`, `<input>`, `<label>`, and `<button>` do
- [x] You know why `method="POST"` is preferred over `method="GET"` for login forms
- [x] You can use browser DevTools to inspect the DOM tree

---

## Phase 2: CSS — Styling and Layout

### What You're Learning
CSS (Cascading Style Sheets) controls how HTML elements **look** — colors, spacing, fonts, layout. The "cascading" part means styles are inherited and overridden in a specific priority order.

### Core Concepts

**Selectors — Targeting Elements:**
```css
p { color: white; }                     /* all <p> tags */
.container { max-width: 500px; }        /* class="container" */
#loginForm { display: block; }          /* id="loginForm" */
.container p { font-size: 14px; }       /* <p> inside .container */
button:hover { background: #7dd3fc; }   /* hover state */
input:focus { border-color: #38bdf8; }  /* focus state */
```

**Specificity** (how CSS decides which rule wins): inline styles (1000) > ID (100) > class (10) > element (1). Higher wins.

**The Box Model** — Every element is a box with: content → padding → border → margin. Always use `box-sizing: border-box` so widths include padding and border.

**Flexbox — Modern Layout:**
```css
body {
    display: flex;
    justify-content: center;  /* horizontal */
    align-items: center;      /* vertical */
    min-height: 100vh;
}
```

**CSS Variables — Reusable Values:**
```css
:root {
    --bg-primary: #0f172a;
    --accent: #38bdf8;
}
body { background: var(--bg-primary); }
```

### Build: Create the Stylesheet

Create `~/securenotes/static/style.css`:

```css
:root {
    --bg-primary: #0f172a;
    --bg-secondary: #1e293b;
    --bg-tertiary: #334155;
    --text-primary: #e2e8f0;
    --text-muted: #94a3b8;
    --accent: #38bdf8;
    --accent-hover: #7dd3fc;
    --danger: #f87171;
    --success: #4ade80;
    --border: #334155;
    --radius: 8px;
}

* { margin: 0; padding: 0; box-sizing: border-box; }

body {
    font-family: 'Segoe UI', system-ui, sans-serif;
    background: var(--bg-primary);
    color: var(--text-primary);
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    align-items: center;
}

header {
    text-align: center;
    padding: 3rem 1rem 1rem;
}

header h1 {
    font-size: 2rem;
    color: var(--accent);
    margin-bottom: 0.5rem;
}

header p { color: var(--text-muted); font-size: 0.95rem; }

main { width: 100%; max-width: 480px; padding: 1.5rem; }

nav { display: flex; gap: 0.75rem; margin-bottom: 1.5rem; }

nav button {
    flex: 1;
    padding: 0.65rem;
    border: 1px solid var(--border);
    border-radius: var(--radius);
    background: var(--bg-secondary);
    color: var(--text-muted);
    font-size: 0.95rem;
    cursor: pointer;
    transition: all 0.2s ease;
}

nav button.active {
    background: var(--accent);
    color: var(--bg-primary);
    border-color: var(--accent);
    font-weight: 600;
}

nav button:hover:not(.active) {
    border-color: var(--accent);
    color: var(--text-primary);
}

#errorMsg {
    color: var(--danger);
    text-align: center;
    margin-bottom: 1rem;
    font-size: 0.9rem;
    min-height: 1.2rem;
}

section > div { margin-bottom: 1rem; }

label {
    display: block;
    margin-bottom: 0.4rem;
    color: var(--text-muted);
    font-size: 0.85rem;
    font-weight: 500;
}

input, textarea {
    width: 100%;
    padding: 0.75rem 1rem;
    border: 1px solid var(--border);
    border-radius: var(--radius);
    background: var(--bg-secondary);
    color: var(--text-primary);
    font-size: 1rem;
    font-family: inherit;
    transition: border-color 0.2s ease;
}

input:focus, textarea:focus {
    outline: none;
    border-color: var(--accent);
}

input::placeholder, textarea::placeholder { color: var(--bg-tertiary); }

textarea { resize: vertical; min-height: 100px; }

section > button, #saveNoteBtn {
    width: 100%;
    padding: 0.75rem;
    border: none;
    border-radius: var(--radius);
    background: var(--accent);
    color: var(--bg-primary);
    font-size: 1rem;
    font-weight: 600;
    cursor: pointer;
    transition: background 0.2s ease, transform 0.1s ease;
    margin-top: 0.5rem;
}

section > button:hover, #saveNoteBtn:hover {
    background: var(--accent-hover);
    transform: translateY(-1px);
}

section > button:active, #saveNoteBtn:active { transform: translateY(0); }

#notesList { margin-top: 2rem; }

.note-card {
    background: var(--bg-secondary);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    padding: 1rem 1.25rem;
    margin-bottom: 0.75rem;
    transition: border-color 0.2s ease;
}

.note-card:hover { border-color: var(--accent); }
.note-card h3 { color: var(--accent); font-size: 1rem; margin-bottom: 0.4rem; }
.note-card p { color: var(--text-muted); font-size: 0.9rem; line-height: 1.5; }
.note-card .note-date { color: var(--bg-tertiary); font-size: 0.75rem; margin-top: 0.5rem; }

footer {
    text-align: center;
    padding: 2rem 1rem;
    color: var(--bg-tertiary);
    font-size: 0.8rem;
    margin-top: auto;
}

.hidden { display: none !important; }

@media (max-width: 520px) {
    main { padding: 1rem; }
    header h1 { font-size: 1.5rem; }
}
```

### Exercises
1. **Change the color scheme:** Modify the CSS variables in `:root` to use a different palette (green-themed, purple-themed). Notice how changing 5 variables transforms the entire app.
2. **Make the note cards fancy:** Add `border-left: 3px solid var(--accent)` and experiment with `box-shadow`.
3. **Inspect computed styles:** In DevTools, select an element and look at the "Computed" tab. Find the box model visualization and change values live.
4. **Break the layout:** Set `main` to `max-width: 200px` and see how the form handles cramped space. Fix it with responsive adjustments.

### Checkpoint
- [x] You can explain the CSS box model (content → padding → border → margin)
- [x] You understand flexbox enough to center elements and create rows/columns
- [x] You know what specificity is and why `#id` overrides `.class`
- [x] You can use CSS variables and understand why they're useful
- [x] Your login page looks styled and professional in the browser

---

## Phase 3: JavaScript — Making It Interactive

### What You're Learning
JavaScript is the programming language of the browser. It makes static HTML pages **interactive** — responding to clicks, validating input, fetching data from servers, and updating the page dynamically.

### Core Concepts

**The DOM — Bridge Between JS and HTML:**
```javascript
const loginBtn = document.getElementById('loginBtn');
const username = document.getElementById('loginUser').value;
document.getElementById('errorMsg').textContent = 'Invalid credentials';
document.getElementById('loginForm').hidden = true;
loginTab.classList.add('active');
```

**Security-critical:** `textContent` vs `innerHTML`:
```javascript
// SAFE — treats everything as plain text
element.textContent = userInput;

// DANGEROUS — parses and executes HTML/JS
element.innerHTML = userInput;
// If userInput contains <script>alert('xss')</script>, it WILL execute
// This is the #1 cause of XSS vulnerabilities
```

**Event Listeners:**
```javascript
loginBtn.addEventListener('click', () => { handleLogin(); });
passwordInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleLogin();
});
```

**Fetch API — Talking to Your Backend:**
```javascript
const response = await fetch('/api/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'jason', password: 'test123' })
});
if (response.ok) {
    const data = await response.json();
} else {
    const error = await response.json();
    showError(error.message);
}
```

**Async/Await** — Network requests take time. `async/await` makes asynchronous code readable:
```javascript
async function loginAndLoadNotes() {
    const loginRes = await fetch('/api/login');
    const loginData = await loginRes.json();
    const notesRes = await fetch('/api/notes', {
        headers: { 'Authorization': loginData.token }
    });
    const notes = await notesRes.json();
    displayNotes(notes);
}
```

### Build: Create the Frontend Logic

Create `~/securenotes/static/app.js`:

```javascript
// =========================
// State
// =========================
let authToken = null;

// =========================
// DOM References
// =========================
const loginTab = document.getElementById('loginTab');
const registerTab = document.getElementById('registerTab');
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');
const notesSection = document.getElementById('notesSection');
const errorMsg = document.getElementById('errorMsg');
const notesList = document.getElementById('notesList');

// =========================
// Tab Switching
// =========================
loginTab.addEventListener('click', () => switchTab('login'));
registerTab.addEventListener('click', () => switchTab('register'));

function switchTab(tab) {
    errorMsg.textContent = '';
    if (tab === 'login') {
        loginForm.hidden = false;
        registerForm.hidden = true;
        loginTab.classList.add('active');
        registerTab.classList.remove('active');
    } else {
        loginForm.hidden = true;
        registerForm.hidden = false;
        registerTab.classList.add('active');
        loginTab.classList.remove('active');
    }
}

// =========================
// Helpers
// =========================
function showError(message) { errorMsg.textContent = message; }
function clearError() { errorMsg.textContent = ''; }

function validateUsername(username) {
    if (username.length < 3 || username.length > 30) return 'Username must be 3-30 characters';
    if (!/^[a-zA-Z0-9_]+$/.test(username)) return 'Username: letters, numbers, underscores only';
    return null;
}

function validatePassword(password) {
    if (password.length < 8) return 'Password must be at least 8 characters';
    return null;
}

// =========================
// Authentication
// =========================
document.getElementById('loginBtn').addEventListener('click', handleLogin);
document.getElementById('registerBtn').addEventListener('click', handleRegister);
document.getElementById('loginPass').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleLogin();
});
document.getElementById('regPassConfirm').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleRegister();
});

async function handleLogin() {
    clearError();
    const username = document.getElementById('loginUser').value.trim();
    const password = document.getElementById('loginPass').value;

    const userErr = validateUsername(username);
    if (userErr) return showError(userErr);
    const passErr = validatePassword(password);
    if (passErr) return showError(passErr);

    try {
        const res = await fetch('/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        const data = await res.json();
        if (res.ok) {
            authToken = data.token;
            showDashboard();
            loadNotes();
        } else {
            showError(data.error || 'Login failed');
        }
    } catch (err) { showError('Could not connect to server'); }
}

async function handleRegister() {
    clearError();
    const username = document.getElementById('regUser').value.trim();
    const password = document.getElementById('regPass').value;
    const confirm = document.getElementById('regPassConfirm').value;

    const userErr = validateUsername(username);
    if (userErr) return showError(userErr);
    const passErr = validatePassword(password);
    if (passErr) return showError(passErr);
    if (password !== confirm) return showError('Passwords do not match');

    try {
        const res = await fetch('/api/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        const data = await res.json();
        if (res.ok) {
            switchTab('login');
            document.getElementById('loginUser').value = username;
            document.getElementById('loginPass').focus();
        } else { showError(data.error || 'Registration failed'); }
    } catch (err) { showError('Could not connect to server'); }
}

// =========================
// Dashboard UI
// =========================
function showDashboard() {
    loginForm.hidden = true;
    registerForm.hidden = true;
    document.querySelector('nav').hidden = true;
    notesSection.hidden = false;
    clearError();
}

function showAuth() {
    loginForm.hidden = false;
    registerForm.hidden = true;
    document.querySelector('nav').hidden = false;
    notesSection.hidden = true;
    authToken = null;
    switchTab('login');
}

// =========================
// Notes CRUD
// =========================
document.getElementById('saveNoteBtn').addEventListener('click', handleSaveNote);

async function handleSaveNote() {
    const title = document.getElementById('noteTitle').value.trim();
    const content = document.getElementById('noteContent').value.trim();
    if (!title || !content) return showError('Title and content are required');

    try {
        const res = await fetch('/api/notes', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({ title, content })
        });
        if (res.ok) {
            document.getElementById('noteTitle').value = '';
            document.getElementById('noteContent').value = '';
            clearError();
            loadNotes();
        } else if (res.status === 401) {
            showError('Session expired. Please login again.');
            showAuth();
        } else {
            const data = await res.json();
            showError(data.error || 'Failed to save note');
        }
    } catch (err) { showError('Could not connect to server'); }
}

async function loadNotes() {
    try {
        const res = await fetch('/api/notes', {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        if (res.status === 401) { showAuth(); return; }
        const notes = await res.json();
        renderNotes(notes);
    } catch (err) { showError('Could not load notes'); }
}

function renderNotes(notes) {
    notesList.innerHTML = '';
    if (notes.length === 0) {
        const empty = document.createElement('p');
        empty.textContent = 'No notes yet. Create your first one above!';
        empty.style.color = 'var(--text-muted)';
        empty.style.textAlign = 'center';
        empty.style.marginTop = '2rem';
        notesList.appendChild(empty);
        return;
    }
    notes.forEach(note => {
        const card = document.createElement('div');
        card.className = 'note-card';
        const h3 = document.createElement('h3');
        h3.textContent = note.title;    // textContent = XSS safe
        const p = document.createElement('p');
        p.textContent = note.content;   // textContent = XSS safe
        const date = document.createElement('span');
        date.className = 'note-date';
        date.textContent = new Date(note.created_at).toLocaleString();
        card.appendChild(h3);
        card.appendChild(p);
        card.appendChild(date);
        notesList.appendChild(card);
    });
}
```

### Exercises
1. **Add a delete button** to each note card that calls `DELETE /api/notes/:id`. For now, just log the note ID to the console.
2. **Add a character counter** below the textarea that updates in real time as you type using an `input` event listener.
3. **Add a logout button** to the dashboard that calls `showAuth()`.
4. **Deliberately introduce an XSS bug:** Change one `textContent` to `innerHTML` in `renderNotes`, then create a note with `<img src=x onerror=alert('XSS')>` as the title. See the alert fire. Then fix it back.
5. **Open the Network tab** in DevTools and watch the fetch requests. Look at request headers, body, and response.

### Checkpoint
- [x] You can explain `textContent` vs `innerHTML` and why it matters for security
- [x] You understand `async/await` and how `fetch()` talks to the backend
- [x] You can use event listeners for clicks and keyboard input
- [x] You can read the Network tab in DevTools

---

## Phase 4: Python + Flask — The Backend

### What You're Learning
The backend is where real security decisions happen. Client-side validation can always be bypassed — an attacker opens Burp Suite and sends whatever they want. The server must validate and authorize everything independently.

### Core Concepts

**Routes and HTTP Methods:**
```python
@app.route('/api/login', methods=['POST'])
def login():
    data = request.get_json()
    return jsonify({"token": "abc123"}), 200
```
Methods: GET (read), POST (create), PUT/PATCH (update), DELETE (remove)

**Password Hashing:**
```python
import bcrypt
# NEVER store plaintext passwords
password_hash = bcrypt.hashpw("mypassword".encode(), bcrypt.gensalt())
bcrypt.checkpw("mypassword".encode(), password_hash)   # True
bcrypt.checkpw("wrongpassword".encode(), password_hash) # False
```

**JWTs (JSON Web Tokens):** Three parts separated by dots: `header.payload.signature`. The signature prevents tampering — if someone modifies the payload, `jwt.decode()` throws an error. But only if you use a strong secret key.

### Build: Create the Flask Backend

Create `~/securenotes/app.py`:

```python
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

# =========================
# Start
# =========================
if __name__ == '__main__':
    init_db()
    print('Server running at http://localhost:5000')
    app.run(host='0.0.0.0', port=5000, debug=True)
```

### Run It
```bash
cd ~/securenotes
source venv/bin/activate
python3 app.py
```
Visit `http://localhost:5000` — the full app should work.

### Exercises
1. **Add a `PUT /api/notes/<id>` route** for updating notes. Check that the note belongs to the logged-in user.
2. **Add a `GET /api/profile` route** returning the current user's username and creation date.
3. **Send malformed JSON** (missing fields, wrong types). Does the server crash or return clean errors?
4. **Try accessing another user's notes** by tampering with the JWT.
5. **Verify every SQL query** uses parameterized `?` placeholders, never string concatenation.

### Checkpoint
- [x] Your app runs — register, login, create notes, view them
- [x] You understand the full request/response cycle (client → server → database → client)
- [x] You know why server-side validation matters even with client-side validation
- [x] You can explain what a JWT is and how it proves authentication

---

## Phase 5: API Testing and External Integration

### Test Your API with REST Client

Create `~/securenotes/tests/test_api.http`:

```http
### Register a new user
POST http://localhost:5000/api/register
Content-Type: application/json

{ "username": "testuser", "password": "securepass123" }

### Register with weak password (should fail)
POST http://localhost:5000/api/register
Content-Type: application/json

{ "username": "baduser", "password": "123" }

### Register with SQL injection attempt (should fail safely)
POST http://localhost:5000/api/register
Content-Type: application/json

{ "username": "' OR 1=1 --", "password": "testtest123" }

### Login
POST http://localhost:5000/api/login
Content-Type: application/json

{ "username": "testuser", "password": "securepass123" }

### Login with wrong password
POST http://localhost:5000/api/login
Content-Type: application/json

{ "username": "testuser", "password": "wrongpassword" }

### Create a note (paste token from login)
POST http://localhost:5000/api/notes
Content-Type: application/json
Authorization: Bearer PASTE_TOKEN_HERE

{ "title": "My first note", "content": "Hello world from the API!" }

### Create note with XSS payload
POST http://localhost:5000/api/notes
Content-Type: application/json
Authorization: Bearer PASTE_TOKEN_HERE

{ "title": "<script>alert('xss')</script>", "content": "<img src=x onerror=alert('stored-xss')>" }

### Get all notes
GET http://localhost:5000/api/notes
Authorization: Bearer PASTE_TOKEN_HERE

### Get notes without token (should fail 401)
GET http://localhost:5000/api/notes

### Delete a note
DELETE http://localhost:5000/api/notes/1
Authorization: Bearer PASTE_TOKEN_HERE
```

### Add External API: HaveIBeenPwned Password Check

Add to `app.py`:

```python
import hashlib
import requests as http_requests

def check_password_breach(password):
    """Check if password appeared in data breaches using k-anonymity."""
    sha1 = hashlib.sha1(password.encode('utf-8')).hexdigest().upper()
    prefix, suffix = sha1[:5], sha1[5:]
    try:
        res = http_requests.get(
            f'https://api.pwnedpasswords.com/range/{prefix}', timeout=3
        )
        for line in res.text.splitlines():
            hash_suffix, count = line.split(':')
            if hash_suffix == suffix:
                return int(count)
    except http_requests.RequestException:
        pass  # fail open if API is down
    return 0
```

Then add to your register route after password validation:
```python
breach_count = check_password_breach(password)
if breach_count > 0:
    return jsonify({
        'error': f'Password found in {breach_count} data breaches. Choose a different one.'
    }), 400
```

### Exercises
1. **Test every endpoint** using the `.http` file. Verify responses make sense.
2. **Send requests with missing headers** (no Content-Type, no Authorization). Does the server handle these gracefully?
3. **Add a `GET /api/notes/search?q=keyword` endpoint** using SQL `LIKE` with parameterized queries.
4. **Document your API** in a markdown file — each endpoint, method, headers, body, and responses.

### Checkpoint
- [x] You can test all endpoints using REST Client
- [x] You understand HTTP status codes (200, 201, 400, 401, 404, 409, 429)
- [x] You've integrated HaveIBeenPwned and understand k-anonymity
- [x] You know the difference between client-side and server-side validation

---

## Phase 6: Security Testing — Breaking Your Own App

### What You're Learning
Switch from developer to attacker. Systematically test for the OWASP Top 10 against your own application.

### Test 1: SQL Injection
```bash
sqlmap -u "http://localhost:5000/api/login" \
    --data='{"username":"test","password":"test"}' \
    --content-type="application/json" \
    --method=POST --level=3
# Expected: "all tested parameters do not appear to be injectable"
```

Manual tests in the username field:
```
' OR 1=1 --
' UNION SELECT 1,2,3 --
admin'; DROP TABLE users; --
```
All should be rejected by validation or treated as literal strings.

### Test 2: XSS (Cross-Site Scripting)
Create notes with these payloads:
```
<script>alert('XSS')</script>
<img src=x onerror=alert('XSS')>
<svg onload=alert('XSS')>
"><script>alert('XSS')</script>
```
If you used `textContent`, none should execute. If you used `innerHTML`, they will.

### Test 3: Broken Authentication
- **Brute force:** Send 100 rapid login attempts. Is there rate limiting? (Not yet — that's a vuln to fix)
- **JWT tampering:** Decode your JWT at jwt.io, modify the `user_id`, send it. The signature check should reject it.
- **Expired tokens:** Set JWT expiry to 1 second, get a token, wait, try to use it.

### Test 4: IDOR (Insecure Direct Object Reference)
Login as User A, create a note (ID=1). Login as User B, try `DELETE /api/notes/1`. Should return 404, NOT 200.

### Test 5: Missing Security Headers
```bash
curl -I http://localhost:5000
# Check for: X-Content-Type-Options, X-Frame-Options, CSP, HSTS
```

### Test 6: Server Scanning
```bash
nikto -h http://localhost:5000
# Also run OWASP ZAP: Spider the app, then Active Scan
```

### Document Each Finding
```markdown
## Finding: [Name]
- **Severity:** Critical / High / Medium / Low
- **Location:** [endpoint or file]
- **Description:** What the vulnerability is
- **Steps to Reproduce:** How to trigger it
- **Impact:** What an attacker could do
- **Remediation:** How to fix it
```

---

## Phase 7: Hardening — Fixing the Vulnerabilities

### Fix 1: Add Rate Limiting
```bash
pip install flask-limiter
```

```python
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address

limiter = Limiter(get_remote_address, app=app,
                  default_limits=["200 per hour"], storage_uri="memory://")

@app.route('/api/login', methods=['POST'])
@limiter.limit("5 per minute")
def login():
    # ... existing code
```

### Fix 2: Add Security Headers
```python
@app.after_request
def add_security_headers(response):
    response.headers['X-Content-Type-Options'] = 'nosniff'
    response.headers['X-Frame-Options'] = 'DENY'
    response.headers['Content-Security-Policy'] = "default-src 'self'; script-src 'self'; style-src 'self'"
    response.headers['Referrer-Policy'] = 'strict-origin-when-cross-origin'
    response.headers['Permissions-Policy'] = 'camera=(), microphone=(), geolocation=()'
    return response
```

### Fix 3: Add Request Logging
```python
import logging

logging.basicConfig(filename='securenotes.log', level=logging.INFO,
                    format='%(asctime)s %(levelname)s: %(message)s')

@app.before_request
def log_request():
    logging.info(f'{request.remote_addr} {request.method} {request.path}')

# In login route, log failed attempts:
logging.warning(f'Failed login attempt for "{username}" from {request.remote_addr}')
```

### Fix 4: HTTPS (Self-Signed for Dev)
```bash
openssl req -x509 -newkey rsa:4096 -nodes \
    -keyout key.pem -out cert.pem -days 365 -subj '/CN=localhost'
```
```python
if __name__ == '__main__':
    init_db()
    app.run(host='0.0.0.0', port=5000, ssl_context=('cert.pem', 'key.pem'))
```

### Fix 5: Server-Side Input Sanitization
```python
import html

# In create_note route, sanitize before storing:
title = html.escape(data.get('title', '').strip())
content = html.escape(data.get('content', '').strip())
```
This is defense-in-depth. Your frontend uses `textContent` (prevents XSS on render), and server-side escaping adds a second layer.

### Re-Test After Each Fix
After each fix, re-run the corresponding test from Phase 6:
```bash
# Re-test SQL injection
sqlmap -u "http://localhost:5000/api/login" \
    --data='{"username":"test","password":"test"}' --content-type="application/json"

# Re-test rate limiting — 6th rapid attempt should get 429

# Re-check headers
curl -I http://localhost:5000

# Re-run nikto
nikto -h http://localhost:5000
```

---

## Phase 8: Stretch Goals

Once the core project is complete:

**Two-Factor Authentication (TOTP):**
```bash
pip install pyotp qrcode
```
Generate TOTP secrets, display QR codes, verify 6-digit codes. Learn how 2FA works under the hood.

**Session Management:** Replace JWT Bearer tokens with HTTP-only secure cookies. Understand stateless (JWT) vs stateful (server-side sessions).

**Deploy to a Real Server:** VPS with Nginx reverse proxy, Let's Encrypt for HTTPS, `ufw` firewall rules.

**Add a WAF Layer:** Put ModSecurity in front of your app and test whether payloads still get through.

**Write a Pentest Report:** Document scope, methodology, findings (with CVSS scores), evidence, and remediation. This is exactly what professional pentesters deliver.

---

## Resources

| Topic | Resource |
|-------|----------|
| HTML/CSS/JS | MDN Web Docs (developer.mozilla.org) |
| Flask | flask.palletsprojects.com |
| SQL | SQLBolt (sqlbolt.com) |
| Web Security | PortSwigger Web Security Academy |
| OWASP Top 10 | owasp.org/www-project-top-ten |
| JWT | jwt.io |
| Python Security | Bandit (github.com/PyCQA/bandit) |
| Practice | OWASP Juice Shop, DVWA, HackTheBox Academy |

---

## Security Concepts Quick Reference

| Concept | Where It Appears | Why It Matters |
|---------|------------------|----------------|
| Parameterized Queries | `app.py` — all SQL | Prevents SQL injection |
| bcrypt Hashing | register/login | Prevents password theft from DB breach |
| JWT Authentication | token gen/validation | Stateless auth without sessions |
| textContent vs innerHTML | `app.js` renderNotes | Prevents XSS |
| Input Validation | Client + server | Rejects malformed input early |
| Rate Limiting | flask-limiter on login | Prevents brute force |
| Security Headers | after_request hook | Prevents clickjacking, MIME sniffing |
| IDOR Prevention | DELETE checks user_id | Prevents accessing others' data |
| HTTPS | SSL context | Prevents credential sniffing |
| Generic Error Messages | Login route | Prevents username enumeration |
| k-Anonymity | HaveIBeenPwned API | Checks breaches without leaking passwords |

---

*Created: 2026-03-07*
*Tags: #project #web-security #fullstack #html #css #javascript #python #flask #pentesting*
