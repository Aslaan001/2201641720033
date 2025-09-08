# Full Stack (URL Shortener)

This repository implements the Full Stack assignment: a robust HTTP URL Shortener Microservice with a React web app and a reusable Logging Middleware integrated from the very first function. This README is submission‑ready and mirrors the evaluation document’s requirements.

## Repository Structure
```
Backend_Test_Submission/                # Express microservice (Node.js)
Frontend_Test_submission/               # React application (Material UI)
logging-middleware/     # Reusable logging package (backend & frontend)
documentation/          # Docs and screenshots (add images here)
```

## Deliverables & Evaluation (Recap)
- Fully functional microservice + responsive React frontend.
- Mandatory reusable Logging Middleware integrated from the very first function.
- Production‑grade code quality, validation, structured errors.
- Documented architecture, endpoints, clear screenshots of API calls (request + response) and UI (desktop + mobile).

---

## Pre‑Test Setup: Registration & Authentication (Test Server)
You must register and then obtain an access token to call the protected Log API.

- Registration API (POST)
  - URL: `http://20.244.56.144/evaluation-service/register`
  - Body (example):
    ```json
    {
      "email": "your_email@college.edu",
      "name": "Your Name",
      "mobileNo": "9999999999",
      "githubUsername": "yourgithub",
      "rollNo": "roll123",
      "accessCode": "sAWTuR"
    }
    ```
  - Response includes `clientId` and `clientSecret`. Save them safely.

- Authorization Token API (POST)
  - URL: `http://20.244.56.144/evaluation-service/auth`
  - Body (example):
    ```json
    {
      "email": "your_email@college.edu",
      "name": "Your Name",
      "rollNo": "roll123",
      "accessCode": "sAWTuR",
      "clientId": "<from_registration>",
      "clientSecret": "<from_registration>"
    }
    ```
  - Response contains a Bearer `access_token`. Save it; used by the Logging Middleware.

---

## Logging Middleware (Mandatory, Reusable)
- Location: `logging-middleware/`
- Signature:
  ```js
  Log(stack, level, pkg, message)
  // stack:  "backend" | "frontend"
  // level:  "debug" | "info" | "warn" | "error" | "fatal"
  // pkg:    backend-only: "cache" | "controller" | "cron_job" | "db" | "domain" | "handler" | "repository" | "route" | "service"
  //         frontend-only: "api" | "component" | "hook" | "page" | "state" | "style"
  //         both: "auth" | "config" | "middleware" | "utils"
  ```
- Log API (POST, protected): `http://20.244.56.144/evaluation-service/logs`
  - Body example:
    ```json
    {
      "stack": "backend",
      "level": "error",
      "package": "handler",
      "message": "received string, expected bool"
    }
    ```
- The package reads `ACCESS_TOKEN` and `LOGGING_API_URL` from backend `.env` and attaches `Authorization: Bearer <token>`.
- Integrated as the very first middleware in `backend/app.js`, and used throughout backend handlers/routes and key frontend actions.

Example calls built into the code:
```js
Log("backend", "info", "middleware", "Incoming request: GET /shorturls");
Log("backend", "fatal", "db", "MongoDB connection failure.");
Log("frontend", "info", "page", "Loaded Statistics tab");
```

---

## Backend Requirements (Implemented)
- Microservice handles all specified APIs.
- Short link uniqueness is guaranteed.
- Default validity = 30 minutes if not provided.
- Accepts custom shortcode; if absent or colliding, generates a unique one.
- Redirection from `/:shortcode` → original URL; records click with timestamp, referrer, and geo/IP placeholder.
- Robust error handling with descriptive JSON (no HTML errors).
- No user registration/auth required for accessing the microservice.

### Data Model (MongoDB via Mongoose)
```js
ShortUrl: {
  url: String (required),
  shortcode: String (unique, required),
  expiry: Date (required),
  createdAt: Date (default now),
  clicks: [{ timestamp: Date, referrer: String, geo: String }]
}
```

### API Endpoints (Spec + Examples)
Base URL: `http://localhost:5000`

1) Create Short URL — `POST /shorturls`
- Request body:
  ```json
  {
    "url": "https://example.com/very-long",
    "validity": 30,
    "shortcode": "abcd1"
  }
  ```
- Behavior:
  - `url` required, must be valid.
  - `validity` optional (minutes). Defaults to 30.
  - `shortcode` optional; if missing or taken, a unique one is generated.
- 201 Response:
  ```json
  {
    "shortLink": "http://localhost:5000/abcd1",
    "expiry": "2025-01-01T00:30:00.000Z"
  }
  ```
- Errors: 400 (invalid input), 409 (shortcode exists).

2) Retrieve Short URL Stats — `GET /shorturls/:shortcode`
- 200 Response:
  ```json
  {
    "url": "https://example.com/very-long",
    "shortcode": "abcd1",
    "createdAt": "2025-01-01T00:00:00.000Z",
    "expiry": "2025-01-01T00:30:00.000Z",
    "clickCount": 3,
    "clicks": [
      { "timestamp": "...", "referrer": "...", "geo": "..." }
    ]
  }
  ```
- Errors: 404 when shortcode not found.

3) Retrieve All Short URLs — `GET /shorturls/all`
- 200 Response:
  ```json
  [
    {
      "url": "https://example.com",
      "shortcode": "abcd1",
      "shortLink": "http://localhost:5000/abcd1",
      "createdAt": "...",
      "expiry": "...",
      "clickCount": 1,
      "clicks": [ { "timestamp": "...", "referrer": "...", "geo": "..." } ]
    }
  ]
  ```

4) Redirection — `GET /:shortcode`
- 302 Redirect to the original URL.
- Logs click and updates statistics.
- Errors: 404 (not found), 410 (expired).

---

## Frontend Requirements (Implemented)
- Runs strictly on `http://localhost:3000`.
- Built with React + Material UI (no other UI libraries; vanilla CSS OK).
- Integrates with the backend APIs (does not implement URL logic itself).
- Logging middleware used for UI actions and API calls.

### Pages
- URL Shortener Page
  - Up to 5 URLs concurrently.
  - Inputs: original URL, optional validity (minutes), optional preferred shortcode.
  - Client‑side validation per spec.
  - Displays short links and expiry for each created URL.

- URL Shortener Statistics Page
  - Displays a list of all created short URLs.
  - Shows total clicks and detailed click data (timestamp, referrer, coarse geo).

---

## Environment Variables (backend/.env)
```env
# Database
MONGODB_URI=your_mongodb_connection_string_here

# AffordMed Test Server
CLIENT_ID=your_client_id_here
CLIENT_SECRET=your_client_secret_here
ACCESS_CODE=sAWTuR
ACCESS_TOKEN=your_access_token_here
LOGGING_API_URL=http://20.244.56.144/evaluation-service/logs
```

> The logging package automatically uses `ACCESS_TOKEN` for Bearer auth.

---

## Local Development — Run
```bash
# Backend (port 5000)
cd backend
npm install
npm start

# Frontend (port 3000, proxied to backend:5000)
cd ../frontend
npm install
npm start
```

---

## Verification & Screenshots (What to Capture)
- Backend (Postman/Insomnia):
  - POST `/shorturls`
  - GET `/shorturls/:shortcode`
  - GET `/shorturls/all`
  - Redirection proof (follow 302 or show browser redirect)
  - Show request body and response JSON clearly
- Frontend:
  - URL Shortener page — desktop and mobile views (up to 5 entries, results shown)
  - Statistics page — desktop and mobile views (counts and click details visible)
- Logging:
  - Network request(s) to the Log API showing correct body and 200 OK (browser dev tools or backend logs)

> Place all screenshots in `documentation/` before submission.

---

## Notes & Assumptions
- Default validity is 30 minutes if the user does not provide a value.
- Coarse geo for clicks uses the requester IP as a placeholder. Real geolocation requires a third‑party service and is out of scope.
- Warnings about deprecated Mongoose options are suppressed by using the modern `mongoose.connect(uri)` signature.


