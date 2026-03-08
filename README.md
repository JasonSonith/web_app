# SecureNotes

A full-stack note-taking web application I built from scratch to gain hands-on experience with web development and security testing. This project serves as a proof of concept for building secure web applications and conducting basic penetration testing against my own code.

## Purpose

This project demonstrates:
- Building a complete web application from frontend to database
- Implementing authentication and authorization securely
- Identifying and mitigating common web vulnerabilities (OWASP Top 10)
- Using security testing tools against my own application

## Features

- User registration and login with secure password hashing
- JWT-based authentication
- Create, view, and delete personal notes
- Modern responsive UI
- Security protections against SQL injection, XSS, IDOR, and brute force attacks

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | HTML5, CSS3, JavaScript |
| Backend | Python 3, Flask |
| Database | SQLite |
| Auth | bcrypt, PyJWT |

## Quick Start

### Prerequisites

- Python 3.8+
- pip

### Installation

```bash
# Clone the repository
git clone <repo-url>
cd web_app

# Create and activate virtual environment
python3 -m venv venv
source venv/bin/activate  # Linux/Mac
# or: venv\Scripts\activate  # Windows

# Install dependencies
pip install flask flask-limiter bcrypt pyjwt requests
```

### Running the Application

```bash
python3 src/app.py
```

Open http://localhost:5000 in your browser.

## Project Structure

```
web_app/
├── src/
│   ├── app.py              # Flask backend with API routes
│   └── static/
│       ├── index.html      # Main HTML page
│       ├── style.css       # Styles
│       └── app.js          # Frontend logic
├── test/
│   └── test_api.http       # API test requests
├── system-design/          # Architecture & flow diagrams
│   ├── sercure-notes-architecture.svg
│   ├── data-model.svg
│   ├── login-flow.svg
│   ├── registration.svg
│   ├── auth-request.png
│   └── token lifecycle.png
├── docs/                   # Documentation
├── CLAUDE.md               # Development instructions
└── README.md
```

## System Design

Diagrams are in the [`system-design/`](system-design/) directory.

### Architecture

Three-tier design: **Client** (HTML/CSS/JS) → **Server** (Flask/Python) → **Database** (SQLite).

The client serves static files through Flask. The server layer handles routing, input validation, JWT auth middleware, bcrypt password hashing, rate limiting, and security headers. All data is stored in `securenotes.db`.

### Data Model

| users | | notes |
|-------|---|-------|
| **PK** id (INT) | 1:N | **PK** id (INT) |
| username (UNIQUE) | → | user_id (FK → users) |
| password_hash (NOT NULL) | | title (TEXT) |
| created_at (TIMESTAMP) | | content (TEXT) |
| | | created_at (TIMESTAMP) |

### Authentication Flows

**Registration:** Client sends username/password → server validates input → checks password against HIBP breach API → hashes with bcrypt → inserts into users table → responds `201 Created` or `409/400` error.

**Login:** Client sends username/password → server looks up user by username → verifies password with `bcrypt.checkpw()` → generates JWT with `jwt.encode()` → responds `200` with token or `401` error.

**Authenticated requests:** Client sends request with `Authorization: Bearer <token>` → server decodes JWT, validates signature and expiry → extracts `user_id` → queries only that user's data → responds with results.

### Token Lifecycle

1. Issued on login with 2-hour expiration
2. Stored in a JS variable (memory only — not localStorage or cookies)
3. Sent as Bearer token on every API request
4. Server validates signature + expiry on each request
5. Tampered or expired tokens receive `401`

## API Reference

### Authentication

#### Register
```http
POST /api/register
Content-Type: application/json

{"username": "newuser", "password": "securepass123"}
```

#### Login
```http
POST /api/login
Content-Type: application/json

{"username": "newuser", "password": "securepass123"}
```
Returns: `{"token": "eyJ..."}`

### Notes

All notes endpoints require `Authorization: Bearer <token>` header.

#### List Notes
```http
GET /api/notes
```

#### Create Note
```http
POST /api/notes
Content-Type: application/json

{"title": "My Note", "content": "Note content here"}
```

#### Delete Note
```http
DELETE /api/notes/:id
```

## Security Features

| Protection | Implementation |
|------------|----------------|
| SQL Injection | Parameterized queries |
| XSS | textContent for rendering, CSP headers |
| Password Storage | bcrypt hashing |
| Auth | JWT with expiration |
| Brute Force | Rate limiting on auth endpoints |
| IDOR | User ownership checks on all operations |
| Clickjacking | X-Frame-Options: DENY |

## Security Testing

Test the application with common security tools:

```bash
# SQL Injection scan
sqlmap -u "http://localhost:5000/api/login" \
    --data='{"username":"test","password":"test"}' \
    --content-type="application/json"

# Web vulnerability scan
nikto -h http://localhost:5000

# Or use OWASP ZAP for comprehensive testing
```

## About

This is a personal learning project. The application intentionally starts with basic implementations that are then hardened through security testing, demonstrating both vulnerable patterns and their fixes.
