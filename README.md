# README

## Table of Contents
- [Prerequisites](#prerequisites)
- [Environment Variables](#environment-variables)
- [Setup Commands](#initial-setup-commands)
- [Run Commands](#run-commands)
- [Stopping the Application](#stopping-the-application)
- [Notes](#notes)

---

## Prerequisites
- Node.js
- Python 3.x
- MySQL (running locally)

---

## Environment Variables
Create a `.env` file in the `backend` directory and add your MySQL credentials:

DB_HOST= 

DB_PORT=

DB_USER=

DB_PASSWORD=

DB_NAME=

---

## Initial Setup Commands
### --- Frontend Setup ---
```bash
cd frontend
npm install
```

### --- Backend Setup ---
```bash
cd backend
python -m venv venv

for mac: source venv/bin/activate

for windows: venv\Scripts\activate
pip install -r requirements.txt
```

### --- Database Setup ---
```bash
cd db
mysql -u root -p loaning_system < schema.sql
mysql -u root -p loaning_system < seed.sql

To check:
USE loaning_system;
SHOW TABLES;
SELECT * FROM customers;
```

---

## Run Commands

### --- Run Backend ---
```bash
cd backend
for mac: source venv/bin/activate
for windows: venv\Scripts\activate
uvicorn app.main:app --reload
```

### --- Run Frontend ---
```bash
cd frontend
npm run dev
```

---

## Stopping The Application

### --- Stop Frontend---
```bash
Ctrl + C
```

### --- Stop Backend ---
```bash
deactivate
```

---

## Notes
- Only run setup steps once  
- Make sure MySQL is running locally  
- Backend will fail if `.env` is not configured properly  