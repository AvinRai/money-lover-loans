# readme in progress

## please make sure you have/use your own .env file to connect to your local mysql

## setup frontend (do only once):
cd frontend
npm install
npm run dev

## setup backend (do only once):
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

## run frontend
cd frontend
npm run dev

## run backend
cd backend
python3 -m venv venv
source venv/bin/activate
fastapi dev app/main.py