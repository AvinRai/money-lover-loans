from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from decimal import Decimal
from app.db import fetch_all, fetch_one, execute

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class CustomerCreate(BaseModel):
    first_name: str
    last_name: str
    email: str
    phone: str
    home_address: str
    balance: Decimal
    salary: Decimal
    credit_score: int
    hashed_password: str

class EmployeeCreate(BaseModel):
    first_name: str
    last_name: str
    email: str
    phone: str
    home_address: str
    hashed_password: str

class LoanApplicationCreate(BaseModel):
    requested_amount: int
    interest_rate: Decimal
    term_months: int

class PaymentCreate(BaseModel):
    customer_id: int
    payment_amount: Decimal

class ReviewApplication(BaseModel):
    employee_id: int
    status: str
    denial_reason: str


@app.get("/health")
def health():
    return {"status": "ok"}

@app.post("/customer")
def create_customer(customer: CustomerCreate):
    existing = fetch_one(
        """
        SELECT customer_id FROM customers
        WHERE email = %s
        """,
        (customer.email, )
    )

    if existing:
        raise HTTPException(status_code=400, detail="Email already exists")

    customer_id = execute(
        """
        INSERT INTO customers
        (first_name, last_name, email, phone, home_address, balance, salary, credit_score, hashed_password)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
        """,
        (
            customer.first_name,
            customer.last_name,
            customer.email,
            customer.phone,
            customer.home_address,
            customer.balance,
            customer.salary,
            customer.credit_score,
            customer.hashed_password
        )
    )

    return {
        "message": "Customer created successfully",
        "customer_id": customer_id
    }

@app.get("/customers")
def get_customers():
    return fetch_all(
        """
        SELECT customer_id, first_name, last_name, email, balance, salary, credit_score
        FROM customers
        """
    )

@app.get("/customers/{customer_id}")
def get_customer(customer_id: int):
    customer = fetch_one(
        """
        SELECT customer_id, first_name, last_name, email, balance, salary, credit_score
        FROM customers
        WHERE customer_id = %s 
        """,
        (customer_id, )
    )
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    return customer