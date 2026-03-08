# SecureNotes - Project Instructions

## Overview

SecureNotes is a full-stack note-taking web app with authentication, built for learning web security. The project teaches HTML, CSS, JavaScript, Python/Flask, and SQLite while emphasizing secure coding practices.

## Project Structure

```
web_app/
├── src/
│   ├── app.py              # Flask backend
│   └── static/
│       ├── index.html      # Frontend HTML
│       ├── style.css       # Stylesheet
│       └── app.js          # Frontend JavaScript
├── test/
│   └── test_api.http       # REST Client API tests
├── docs/                   # Project documentation
├── system-design/          # Architecture & flow diagrams
│   ├── sercure-notes-architecture.svg  # System architecture
│   ├── data-model.svg      # Database ER diagram
│   ├── login-flow.svg      # Login sequence diagram
│   ├── registration.svg    # Registration sequence diagram
│   ├── auth-request.png    # Authenticated request flow
│   ├── token lifecycle.png # JWT token lifecycle
│   └── src/
│       └── data-model.drawio  # Editable data model source
└── securenotes.db          # SQLite database (auto-created)
```

## Tech Stack

- **Frontend:** HTML5, CSS3, vanilla JavaScript
- **Backend:** Python 3, Flask
- **Database:** SQLite with parameterized queries
- **Auth:** bcrypt password hashing, JWT tokens
- **Security Tools:** Burp Suite, OWASP ZAP, sqlmap, nikto

## Development Commands

```bash
# Setup virtual environment
python3 -m venv venv
source venv/bin/activate
pip install flask flask-limiter bcrypt pyjwt requests

# Run the server
python3 src/app.py
# Server runs at http://localhost:5000

# Run security scan
sqlmap -u "http://localhost:5000/api/login" --data='{"username":"test","password":"test"}' --content-type="application/json"
nikto -h http://localhost:5000
```

## API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | /api/register | No | Create new user |
| POST | /api/login | No | Get JWT token |
| GET | /api/notes | Yes | List user's notes |
| POST | /api/notes | Yes | Create new note |
| DELETE | /api/notes/:id | Yes | Delete a note |

## System Design

### Architecture
Three-tier architecture: Client (HTML/CSS/JS) → Server (Flask/Python) → Database (SQLite).
- **Client** serves `index.html`, `style.css`, `app.js` from Flask's static folder
- **Server** handles route handlers, input validation, auth middleware (JWT), password hashing (bcrypt), rate limiting, and security headers
- **Database** is `securenotes.db` (SQLite), auto-created on first run

### Data Model
Two tables with a 1:N relationship (one user has many notes):

**users**
| Column | Type | Constraints |
|--------|------|-------------|
| id | INT | PRIMARY KEY |
| username | TEXT | UNIQUE |
| password_hash | TEXT | NOT NULL |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP |

**notes**
| Column | Type | Constraints |
|--------|------|-------------|
| id | INT | PRIMARY KEY |
| user_id | INT | FOREIGN KEY → users.id |
| title | TEXT | |
| content | TEXT | |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP |

### Registration Flow
1. Client sends `POST /api/register` with `{username, password}`
2. Server validates input
3. Server checks password against HIBP breach API
4. Server hashes password with `bcrypt.hashpw()`
5. Server inserts new row into users table
6. Database returns success or integrity error (duplicate username)
7. Server responds `201 Created` or `409/400` error

### Login Flow
1. Client sends `POST /api/login` with `{username, password}`
2. Server queries `SELECT user WHERE username = ?`
3. Database returns user row or None
4. Server runs `bcrypt.checkpw()` to verify password
5. Server generates token with `jwt.encode()`
6. Server responds `200` with token or `401` error

### Authenticated Request Flow
1. Client sends `GET /api/notes` with `Authorization: Bearer JWT`
2. Server calls `jwt.decode(token)` to validate signature and expiry
3. Server extracts `user_id` from decoded token
4. Server queries `SELECT notes WHERE user_id = ?`
5. Database returns matching notes rows
6. Server responds `200` with notes array

### Token Lifecycle
1. Token issued on login with 2-hour expiration
2. Stored in JS variable (memory only — not localStorage/cookies)
3. Sent as Bearer token in Authorization header on every API request
4. Server validates signature + expiry on each request
5. Valid token → request proceeds; tampered/expired token → `401 Signature Mismatch`

## Security Principles

### Must Follow
- **SQL:** Always use parameterized queries (`?` placeholders), never string concatenation
- **Passwords:** Hash with bcrypt, never store plaintext
- **XSS:** Use `textContent` not `innerHTML` when rendering user data
- **Auth:** Validate JWT on every protected route, check resource ownership
- **Errors:** Return generic messages ("Invalid credentials"), never reveal if user exists
- **Validation:** Validate on both client AND server; server is authoritative

### Security Headers (add via after_request)
- X-Content-Type-Options: nosniff
- X-Frame-Options: DENY
- Content-Security-Policy: default-src 'self'
- Referrer-Policy: strict-origin-when-cross-origin

### Rate Limiting
Apply `@limiter.limit("5 per minute")` to login and register routes.

## Testing Checklist

Before considering a feature complete:
- [ ] SQL injection payloads rejected or treated as literals
- [ ] XSS payloads do not execute in browser
- [ ] Unauthorized users get 401, not data
- [ ] Users cannot access/modify other users' resources (IDOR)
- [ ] Input validation works on both client and server
- [ ] Error messages don't leak sensitive info

## Code Style

- Python: Follow PEP 8
- JavaScript: Use `const`/`let`, no `var`; use async/await for fetch calls
- HTML: Use semantic elements (header, main, footer, section)
- CSS: Use CSS variables in `:root` for theming
