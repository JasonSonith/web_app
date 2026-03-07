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
