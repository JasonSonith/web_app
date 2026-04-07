# SecureNotes

A simple note-taking app I built as a hands-on intro to web security and pentesting. Nothing fancy — the goal was to have something real to attack, not to build a production app.

## What this is

I wanted to learn pentesting by doing it against code I wrote myself. So I built a basic full-stack app from scratch, then ran tools like sqlmap, Nikto, and Burp Suite against it to see what they caught. The app covers enough ground to test the OWASP Top 10 without being so complex it gets in the way.

## Stack

| Layer | Tech |
|-------|------|
| Frontend | HTML, CSS, vanilla JS |
| Backend | Python 3, Flask |
| Database | SQLite |
| Auth | bcrypt, PyJWT |

## Features

- User registration and login
- JWT authentication (stored in memory, not localStorage)
- Create, view, and delete notes
- Rate limiting on auth endpoints
- Basic security headers

## Running it

```bash
python3 -m venv venv
source venv/bin/activate
pip install flask flask-limiter bcrypt pyjwt requests

python3 src/app.py
```

The server starts on `https://localhost:5000` (self-signed cert — you'll need to accept the browser warning or use `curl -k`).

## API

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | /api/register | No | Create account |
| POST | /api/login | No | Get JWT token |
| GET | /api/notes | Yes | List notes |
| POST | /api/notes | Yes | Create note |
| DELETE | /api/notes/:id | Yes | Delete note |

All protected routes expect `Authorization: Bearer <token>`.

## Security testing

```bash
# SQL injection
sqlmap -u "https://localhost:5000/api/login" \
    --data='{"username":"test","password":"test"}' \
    --content-type="application/json"

# General scan
nikto -h https://localhost:5000
```

## Project structure

```
web_app/
├── src/
│   ├── app.py
│   └── static/
│       ├── index.html
│       ├── style.css
│       └── app.js
├── test/
│   └── test_api.http
├── system-design/
└── docs/
```

## About

This is a learning project. I built it to get comfortable with web app internals before trying to break them. It's not meant to be deployed anywhere.
