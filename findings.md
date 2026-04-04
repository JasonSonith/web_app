# Security Findings

<!-- Template:
## Finding: [Name]
- **Severity:** Critical / High / Medium / Low
- **Location:** [endpoint or file]
- **Description:** What the vulnerability is
- **Steps to Reproduce:** How to trigger it
- **Impact:** What an attacker could do
- **Remediation:** How to fix it
-->

---

## Finding: JWT Signature Validation (Control Pass)
- **Severity:** N/A — Control working as intended
- **Location:** `GET /api/notes`
- **Description:** The server correctly validates the JWT signature on every authenticated request. A token re-signed with a different secret (`fakesecret`) is rejected with `401 Unauthorized`.
- **Steps to Reproduce:**
  1. Log in and capture a valid token: `POST /api/login` → receive JWT signed with server secret
  2. Decode the payload: `{"user_id": 1, "exp": ...}`
  3. Modify payload (e.g. change `user_id` to `2`) and re-sign with a fake secret using PyJWT
  4. Send tampered token to `GET /api/notes` via `Authorization: Bearer <tampered>`
  5. Server responds `{"error": "Unauthorized"}`
- **Impact:** Attacker cannot forge or modify JWT claims to impersonate other users. Signature mismatch is caught server-side.
- **Remediation:** No fix needed. Ensure the JWT secret remains strong (32+ bytes), is stored in an environment variable (not hardcoded), and is never exposed in logs or error messages.

---

## Finding: Verbose Flask Error Page on Malformed Request
- **Severity:** Low
- **Location:** `POST /api/login` (any endpoint expecting JSON)
- **Description:** Sending a request with `Content-Type: application/json` but no body returns Flask's default HTML 400 error page, leaking the framework name and internal JSON parsing error: `Failed to decode JSON object: Expecting value: line 1 column 1 (char 0)`.
- **Steps to Reproduce:**
  1. `curl -s -X POST http://localhost:5000/api/login -H "Content-Type: application/json"`
  2. Observe HTML response revealing Flask and the internal parser error message
- **Impact:** Confirms the server is running Flask and reveals internal processing details, which helps an attacker fingerprint the stack and craft more targeted attacks.
- **Remediation:** Add a global error handler in `app.py` to return JSON error responses instead of Flask's default HTML pages:
  ```python
  @app.errorhandler(400)
  def bad_request(e):
      return {"error": "Bad request"}, 400
  ```

---

## Finding: Rate Limiting Not Enforced on Login Endpoint
- **Severity:** High
- **Location:** `POST /api/login`
- **Description:** The login endpoint does not enforce rate limiting. 100+ rapid requests were sent using ffuf and all received `401 Unauthorized` responses — no `429 Too Many Requests` was ever returned. The `@limiter.limit("5 per minute")` decorator is either missing, misconfigured, or not applied to this route.
- **Steps to Reproduce:**
  1. Run ffuf with a password wordlist against the login endpoint:
     ```
     ffuf -w <wordlist> -X POST -u http://localhost:5000/api/login \
       -H "Content-Type: application/json" \
       -d '{"username":"Jason","password":"FUZZ"}'
     ```
  2. Observe that all responses return `401` — no `429` is ever triggered regardless of request volume or speed.
- **Impact:** An attacker can perform unlimited brute force or credential stuffing attacks against the login endpoint with no throttling. Given that there is no account lockout, this allows automated password guessing at full network speed.
- **Remediation:** Ensure `flask-limiter` is initialized and the limit decorator is applied to the login route:
  ```python
  from flask_limiter import Limiter
  from flask_limiter.util import get_remote_address

  limiter = Limiter(get_remote_address, app=app, default_limits=[])

  @app.route("/api/login", methods=["POST"])
  @limiter.limit("5 per minute")
  def login():
      ...
  ```
  Also add a `@app.errorhandler(429)` to return a JSON response instead of HTML.

---

## Finding: JWT Token Expiration (Control Pass)
- **Severity:** N/A — Control working as intended
- **Location:** `POST /api/login`, `GET /api/notes`
- **Description:** The server correctly rejects expired JWT tokens. Token expiration is set via `datetime.timedelta(seconds=1)` in the login route. A token used after its `exp` claim has passed returns `401 Unauthorized`.
- **Steps to Reproduce:**
  1. Log in: `POST /api/login` → receive JWT with `exp` set 1 second in the future
  2. Wait for token to expire
  3. Send expired token to `GET /api/notes` via `Authorization: Bearer <token>`
  4. Server responds `{"error": "Unauthorized"}`
- **Impact:** Expired tokens cannot be reused. Session hijacking via stolen tokens is time-bounded.
- **Remediation:** No fix needed for the validation behavior. Restore expiration to a practical window (e.g. 2 hours) for production: `datetime.timedelta(hours=2)`. The current 1-second expiry was set for testing only.

---

## Finding: Missing Security Headers
- **Severity:** Medium
- **Location:** All responses (verified via `curl -I http://localhost:5000`)
- **Description:** The server does not set any of the standard defensive HTTP security headers. None of the following were present in the response: `X-Content-Type-Options`, `X-Frame-Options`, `Content-Security-Policy`, or `Referrer-Policy`.
- **Steps to Reproduce:**
  1. `curl -I http://localhost:5000`
  2. Inspect response headers — none of the four security headers are present
- **Impact:**
  - No `X-Content-Type-Options`: browser may MIME-sniff responses, enabling content injection attacks
  - No `X-Frame-Options`: page can be embedded in an iframe, enabling clickjacking
  - No `Content-Security-Policy`: no restriction on script sources, increasing XSS risk
  - No `Referrer-Policy`: full URL may be leaked in the `Referer` header to third parties
- **Remediation:** Add an `after_request` hook in `app.py`:
  ```python
  @app.after_request
  def set_security_headers(response):
      response.headers['X-Content-Type-Options'] = 'nosniff'
      response.headers['X-Frame-Options'] = 'DENY'
      response.headers['Content-Security-Policy'] = "default-src 'self'"
      response.headers['Referrer-Policy'] = 'strict-origin-when-cross-origin'
      return response
  ```

---

## Finding: Server Version Disclosure via Server Header
- **Severity:** Low
- **Location:** All responses
- **Description:** The `Server` response header exposes the exact Werkzeug version and Python version: `Werkzeug/3.1.7 Python/3.12.3`. This is set automatically by Flask/Werkzeug and was not suppressed.
- **Steps to Reproduce:**
  1. `curl -I http://localhost:5000`
  2. Observe: `Server: Werkzeug/3.1.7 Python/3.12.3`
- **Impact:** Confirms the exact framework and runtime versions, allowing an attacker to look up known CVEs for those specific versions and target exploits accordingly.
- **Remediation:** Suppress or overwrite the header in the `after_request` hook:
  ```python
  response.headers['Server'] = 'SecureNotes'
  ```

---

## Finding: IDOR on Note Deletion (Control Pass)
- **Severity:** N/A — Control working as intended
- **Location:** `DELETE /api/notes/<id>`
- **Description:** The server correctly prevents cross-user note deletion. User B cannot delete a note owned by User A, even when the note ID is known.
- **Steps to Reproduce:**
  1. Login as User A, create a note → note ID 10 created
  2. Login as User B, attempt `DELETE /api/notes/10` with User B's token
  3. Server responds `{"error": "Note not found"}` — note is not deleted
- **Impact:** Users cannot delete or access other users' resources. The delete query enforces ownership: `DELETE FROM notes WHERE id = ? AND user_id = ?`, so a mismatched `user_id` from the JWT causes zero rows to be affected.
- **Remediation:** No fix needed. Ownership check is correctly enforced at the query level. Same pattern should be verified on `GET`, `PUT`, and `search` endpoints.

---

## Finding: Werkzeug Debug Console Exposed (/console)
- **Severity:** Critical
- **Location:** `GET /console`
- **Description:** The Flask app is running with `debug=True` (`app.run(..., debug=True)` in `app.py`). This enables the Werkzeug interactive debugger, which exposes a fully functional Python REPL at `/console`. Anyone who can reach the server can execute arbitrary Python code on the host.
- **Steps to Reproduce:**
  1. Navigate to `http://localhost:5000/console` in a browser
  2. Enter any Python expression — it executes on the server with the app's process permissions
- **Impact:** Complete server compromise. An attacker can read/write files, dump the database, exfiltrate the JWT secret, spawn reverse shells, or do anything the server process can do.
- **Remediation:** Never run with `debug=True` in any environment reachable by others. Disable it explicitly:
  ```python
  app.run(host='0.0.0.0', port=5000, debug=False)
  ```
  Or use an environment variable: `debug=os.environ.get('FLASK_DEBUG', 'false').lower() == 'true'`

---

## Finding: ETag Header Leaks Inode and File Metadata (CVE-2003-1418)
- **Severity:** Low
- **Location:** `GET /` (all static file responses)
- **Description:** Nikto identified that ETag response headers contain inode numbers, file size, and modification time (e.g. `inode: 1774214699.5965116, size: 3887, mtime: 2041517535`). This is a known information disclosure pattern.
- **Steps to Reproduce:**
  1. `curl -I http://localhost:5000`
  2. Observe `ETag` header value contains dot-separated inode/size/mtime fields
- **Impact:** Leaks internal filesystem metadata. Inode values can assist in fingerprinting the server or correlating files across requests. Low practical risk but fails compliance checks.
- **Remediation:** Configure Flask/Werkzeug to use a hash-based ETag instead, or disable ETags on static responses. Alternatively, suppress the header entirely via the `after_request` hook: `response.headers.pop('ETag', None)`.

---

## Finding: Missing Permissions-Policy and Strict-Transport-Security Headers
- **Severity:** Low
- **Location:** All responses
- **Description:** Nikto flagged two additional missing headers not covered in the prior security headers finding: `Permissions-Policy` and `Strict-Transport-Security` (HSTS).
- **Steps to Reproduce:**
  1. `nikto -h http://localhost:5000`
  2. Observe warnings for missing `permissions-policy` and `strict-transport-security`
- **Impact:**
  - No `Permissions-Policy`: browser features (camera, microphone, geolocation) are not restricted, allowing any injected script to access them
  - No `HSTS`: without HTTPS enforcement, connections could be downgraded to HTTP (less relevant on localhost, critical in production)
- **Remediation:** Add to the `after_request` hook:
  ```python
  response.headers['Permissions-Policy'] = 'geolocation=(), microphone=(), camera=()'
  response.headers['Strict-Transport-Security'] = 'max-age=63072000; includeSubDomains'
  ```
  Note: HSTS only takes effect over HTTPS — add it when TLS is configured.

---

## Finding: Information Disclosure via JavaScript Comments (ZAP)
- **Severity:** Informational
- **Location:** `src/static/app.js`
- **Description:** ZAP flagged comments in the client-side JavaScript as suspicious information disclosure (CWE-615). The comments describe internal logic around authentication, username validation, and server response parsing — visible to anyone who views the source.
- **Steps to Reproduce:**
  1. Navigate to `http://localhost:5000/app.js` in a browser
  2. View source — comments like `//handles login if user enters the 'Enter' key`, `// .test takes the input and compares it against username`, and `// ^takes the raw response from the server and parses it from JSON` are visible
- **Impact:** Low practical risk on its own, but comments describing authentication logic, input comparison, and server response handling give an attacker a map of how the client works. Combined with other vulnerabilities, this reduces the effort needed to craft targeted attacks.
- **Remediation:** Remove explanatory comments from production JavaScript, especially those describing auth flows or input validation logic. In a real deployment, a build step (minifier/bundler) would strip comments automatically.

---

## Finding: SQL Injection Resistance (Control Pass)
- **Severity:** N/A — Control working as intended
- **Location:** `POST /api/login` (username and password parameters)
- **Description:** sqlmap performed a full automated SQL injection scan against the login endpoint — including boolean-based blind, error-based, time-based blind, and UNION-based techniques across MySQL, PostgreSQL, MSSQL, and Oracle payloads. No injectable parameters were found.
- **Steps to Reproduce:**
  ```
  sqlmap -u "http://localhost:5000/api/login" \
    --data='{"username":"test","password":"test"}' \
    --content-type="application/json"
  ```
  sqlmap reports: `(custom) POST parameter 'JSON password' does not seem to be injectable`
- **Impact:** SQL injection is not possible. All 2253 attempted payloads returned `401 Unauthorized`, confirming inputs are passed as bound parameters and never interpolated into SQL strings.
- **Remediation:** No fix needed. Protection is provided by parameterized queries throughout `app.py` (e.g. `SELECT id, password_hash FROM users WHERE username = ?`). Ensure this pattern is maintained in any future queries.
