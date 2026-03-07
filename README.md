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
├── docs/                   # Documentation
├── CLAUDE.md               # Development instructions
└── README.md
```

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
