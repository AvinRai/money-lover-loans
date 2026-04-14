# README

## Setup Instructions

### ⚠️ Environment Variables
- Create a `.env` file in the **backend** directory  
- Add your local MySQL credentials there  

---

## Initial Setup (Run Once)

### Frontend
```bash
cd frontend
npm install
```

### Backend
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

---

## Running the App

### Start Frontend
```bash
cd frontend
npm run dev
```

### Start Backend
```bash
cd backend
source venv/bin/activate
uvicorn app.main:app --reload
```

---

## Stopping the App

### Stop Frontend
```bash
Ctrl + C
```

### Stop Backend
```bash
deactivate
```

---

## Notes
- Only run setup steps once  
- Make sure MySQL is running locally  
- Backend will fail if `.env` is not configured properly  