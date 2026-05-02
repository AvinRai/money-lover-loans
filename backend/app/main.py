from decimal import Decimal

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from app.db import execute, fetch_all, fetch_one, get_connection

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


class CustomerUpdate(BaseModel):
    first_name: str | None = None
    last_name: str | None = None
    email: str | None = None
    phone: str | None = None
    home_address: str | None = None
    balance: Decimal | None = None
    salary: Decimal | None = None
    credit_score: int | None = None


class EmployeeCreate(BaseModel):
    first_name: str
    last_name: str
    email: str
    phone: str
    home_address: str
    hashed_password: str


class EmployeeUpdate(BaseModel):
    first_name: str | None = None
    last_name: str | None = None
    email: str | None = None
    phone: str | None = None
    home_address: str | None = None


class LoanApplicationCreate(BaseModel):
    customer_id: int
    requested_amount: Decimal = Field(gt=0)
    interest_rate: Decimal = Field(ge=0)
    term_months: int = Field(gt=0)


class LoanApplicationSubmit(BaseModel):
    """Same as create payload without customer_id (used when customer is in the URL path)."""

    requested_amount: Decimal = Field(gt=0)
    interest_rate: Decimal = Field(ge=0)
    term_months: int = Field(gt=0)


class LoanApplicationUpdate(BaseModel):
    requested_amount: Decimal | None = Field(default=None, gt=0)
    interest_rate: Decimal | None = Field(default=None, ge=0)
    term_months: int | None = Field(default=None, gt=0)


class LoanCreate(BaseModel):
    application_id: int
    customer_id: int
    initial_balance: Decimal = Field(gt=0)
    current_balance: Decimal = Field(ge=0)
    interest_rate: Decimal = Field(ge=0)


class LoanUpdate(BaseModel):
    current_balance: Decimal | None = Field(default=None, ge=0)
    status: str | None = None


class PaymentCreate(BaseModel):
    loan_id: int
    customer_id: int
    payment_amount: Decimal = Field(gt=0)


class PaymentFromLoan(BaseModel):
    """Guide-style body for POST /loans/{loan_id}/payments (loan_id comes from the path)."""

    customer_id: int
    payment_amount: Decimal = Field(gt=0)


class ReviewApplication(BaseModel):
    employee_id: int
    status: str
    denial_reason: str | None = None


@app.get("/health")
def health():
    return {"status": "ok"}


### CUSTOMER ENDPOINTS ###


@app.get("/customers")
def get_customers():
    return fetch_all(
        """
        SELECT customer_id, first_name, last_name, email, phone, home_address, balance, salary, credit_score
        FROM Customers
        """
    )


@app.get("/customers/{customer_id}")
def get_customer(customer_id: int):
    customer = fetch_one(
        """
        SELECT customer_id, first_name, last_name, email, phone, home_address, balance, salary, credit_score
        FROM Customers
        WHERE customer_id = %s
        """,
        (customer_id,),
    )
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    return customer


@app.post("/customers")
def create_customer(customer: CustomerCreate):
    existing = fetch_one(
        """
        SELECT customer_id FROM Customers
        WHERE email = %s
        """,
        (customer.email,),
    )

    if existing:
        raise HTTPException(status_code=400, detail="Email already exists")

    customer_id = execute(
        """
        INSERT INTO Customers
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
            customer.hashed_password,
        ),
    )

    return {
        "message": "Customer created successfully",
        "customer_id": customer_id,
    }


@app.patch("/customers/{customer_id}")
def patch_customer(customer_id: int, updates: CustomerUpdate):
    if not fetch_customer(customer_id):
        raise HTTPException(status_code=404, detail="Customer not found")

    update_data = updates.model_dump(exclude_unset=True)
    update_record("Customers", "customer_id", customer_id, update_data)

    return {"message": "Customer updated successfully"}


@app.delete("/customers/{customer_id}")
def delete_customer(customer_id: int):
    if not fetch_customer(customer_id):
        raise HTTPException(status_code=404, detail="Customer not found")

    delete_record("Customers", "customer_id", customer_id)

    return {"message": "Customer deleted successfully"}


@app.get("/customers/{customer_id}/loans")
def get_customer_loans(customer_id: int):
    if not fetch_customer(customer_id):
        raise HTTPException(status_code=404, detail="Customer not found")
    return fetch_all(
        """
        SELECT loan_id, application_id, customer_id, initial_balance, current_balance,
               interest_rate, loan_start_date, status
        FROM Loans
        WHERE customer_id = %s
        ORDER BY loan_start_date DESC
        """,
        (customer_id,),
    )


@app.get("/customers/{customer_id}/applications")
def get_customer_applications(customer_id: int):
    if not fetch_customer(customer_id):
        raise HTTPException(status_code=404, detail="Customer not found")
    return fetch_all(
        """
        SELECT application_id, customer_id, requested_amount, interest_rate, term_months,
               application_date, status, reviewed_by, reviewed_at, denial_reason
        FROM LoanApplications
        WHERE customer_id = %s
        ORDER BY application_date DESC
        """,
        (customer_id,),
    )


@app.post("/customers/{customer_id}/applications")
def create_customer_application(customer_id: int, data: LoanApplicationSubmit):
    if not fetch_customer(customer_id):
        raise HTTPException(status_code=404, detail="Customer not found")

    application_id = execute(
        """
        INSERT INTO LoanApplications (customer_id, requested_amount, interest_rate, term_months)
        VALUES (%s, %s, %s, %s)
        """,
        (
            customer_id,
            data.requested_amount,
            data.interest_rate,
            data.term_months,
        ),
    )

    return {"application_id": application_id, "message": "Application submitted"}


### EMPLOYEE ENDPOINTS ###


@app.get("/employees")
def get_employees():
    return fetch_all(
        """
        SELECT employee_id, first_name, last_name, email, phone, home_address
        FROM Employees
        """
    )


@app.get("/employees/{employee_id}")
def get_employee(employee_id: int):
    employee = fetch_one(
        """
        SELECT employee_id, first_name, last_name, email, phone, home_address
        FROM Employees
        WHERE employee_id = %s
        """,
        (employee_id,),
    )
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")
    return employee


@app.post("/employees")
def create_employee(employee: EmployeeCreate):
    existing = fetch_one(
        """
        SELECT employee_id FROM Employees
        WHERE email = %s
        """,
        (employee.email,),
    )

    if existing:
        raise HTTPException(status_code=400, detail="Email already exists")

    employee_id = execute(
        """
        INSERT INTO Employees
        (first_name, last_name, email, phone, home_address, hashed_password)
        VALUES (%s, %s, %s, %s, %s, %s)
        """,
        (
            employee.first_name,
            employee.last_name,
            employee.email,
            employee.phone,
            employee.home_address,
            employee.hashed_password,
        ),
    )

    return {"message": "Employee created successfully", "employee_id": employee_id}


@app.patch("/employees/{employee_id}")
def patch_employee(employee_id: int, updates: EmployeeUpdate):
    if not fetch_employee(employee_id):
        raise HTTPException(status_code=404, detail="Employee not found")

    update_data = updates.model_dump(exclude_unset=True)
    update_record("Employees", "employee_id", employee_id, update_data)

    return {"message": "Employee updated successfully"}


@app.delete("/employees/{employee_id}")
def delete_employee(employee_id: int):
    if not fetch_employee(employee_id):
        raise HTTPException(status_code=404, detail="Employee not found")

    delete_record("Employees", "employee_id", employee_id)

    return {"message": "Employee deleted successfully"}


### APPLICATION ENDPOINTS ###


@app.get("/applications")
def get_applications_with_customers():
    return fetch_all(
        """
        SELECT la.application_id, la.customer_id, la.requested_amount, la.interest_rate,
               la.term_months, la.application_date, la.status, la.reviewed_by, la.reviewed_at,
               la.denial_reason,
               c.first_name AS customer_first_name,
               c.last_name AS customer_last_name,
               c.email AS customer_email
        FROM LoanApplications la
        JOIN Customers c ON la.customer_id = c.customer_id
        ORDER BY la.application_date DESC
        """
    )


@app.patch("/applications/{application_id}/review")
def review_application_guide(application_id: int, data: ReviewApplication):
    return review_application_transaction(application_id, data)


### LOAN APPLICATION ENDPOINTS ###


@app.get("/loan-applications")
def get_loan_applications():
    return fetch_all(
        """
        SELECT application_id, customer_id, requested_amount, interest_rate, term_months,
               application_date, status, reviewed_by, reviewed_at, denial_reason
        FROM LoanApplications
        """
    )


@app.get("/loan-applications/{application_id}")
def get_loan_application(application_id: int):
    row = fetch_one(
        """
        SELECT application_id, customer_id, requested_amount, interest_rate, term_months,
               application_date, status, reviewed_by, reviewed_at, denial_reason
        FROM LoanApplications
        WHERE application_id = %s
        """,
        (application_id,),
    )
    if not row:
        raise HTTPException(status_code=404, detail="Loan application not found")
    return row


@app.post("/loan-applications")
def create_loan_application(body: LoanApplicationCreate):
    if not fetch_customer(body.customer_id):
        raise HTTPException(status_code=400, detail="Customer not found")

    application_id = execute(
        """
        INSERT INTO LoanApplications (customer_id, requested_amount, interest_rate, term_months)
        VALUES (%s, %s, %s, %s)
        """,
        (
            body.customer_id,
            body.requested_amount,
            body.interest_rate,
            body.term_months,
        ),
    )

    return {"message": "Loan application created successfully", "application_id": application_id}


@app.patch("/loan-applications/{application_id}")
def patch_loan_application(application_id: int, updates: LoanApplicationUpdate):
    app_row = fetch_one(
        """
        SELECT status FROM LoanApplications WHERE application_id = %s
        """,
        (application_id,),
    )
    if not app_row:
        raise HTTPException(status_code=404, detail="Loan application not found")
    if app_row["status"] != "pending":
        raise HTTPException(
            status_code=400, detail="Only pending applications can be updated"
        )

    update_data = updates.model_dump(exclude_unset=True)
    update_record("LoanApplications", "application_id", application_id, update_data)

    return {"message": "Loan application updated successfully"}


@app.post("/loan-applications/{application_id}/review")
def review_loan_application(application_id: int, body: ReviewApplication):
    return review_application_transaction(application_id, body)


@app.delete("/loan-applications/{application_id}")
def delete_loan_application(application_id: int):
    app_row = fetch_one(
        """
        SELECT status FROM LoanApplications WHERE application_id = %s
        """,
        (application_id,),
    )
    if not app_row:
        raise HTTPException(status_code=404, detail="Loan application not found")
    if app_row["status"] != "pending":
        raise HTTPException(
            status_code=400, detail="Only pending applications can be deleted"
        )

    loan = fetch_one(
        "SELECT loan_id FROM Loans WHERE application_id = %s",
        (application_id,),
    )
    if loan:
        raise HTTPException(
            status_code=400,
            detail="Cannot delete application that already has a loan record",
        )

    delete_record("LoanApplications", "application_id", application_id)

    return {"message": "Loan application deleted successfully"}


### LOANS ENDPOINTS ###


@app.get("/loans")
def get_loans():
    return fetch_all(
        """
        SELECT l.loan_id, l.application_id, l.customer_id, l.initial_balance, l.current_balance,
               l.interest_rate, l.loan_start_date, l.status,
               c.first_name AS customer_first_name,
               c.last_name AS customer_last_name,
               c.email AS customer_email
        FROM Loans l
        JOIN Customers c ON l.customer_id = c.customer_id
        ORDER BY l.loan_start_date DESC
        """
    )


@app.post("/loans/{loan_id}/payments")
def create_payment_for_loan(loan_id: int, data: PaymentFromLoan):
    result = run_payment_transaction(loan_id, data.customer_id, data.payment_amount)
    return {
        "message": "Payment successful",
        **result,
    }


@app.get("/loans/{loan_id}")
def get_loan(loan_id: int):
    row = fetch_one(
        """
        SELECT loan_id, application_id, customer_id, initial_balance, current_balance,
               interest_rate, loan_start_date, status
        FROM Loans
        WHERE loan_id = %s
        """,
        (loan_id,),
    )
    if not row:
        raise HTTPException(status_code=404, detail="Loan not found")
    return row


@app.post("/loans")
def create_loan(body: LoanCreate):
    if not fetch_one(
        "SELECT application_id FROM LoanApplications WHERE application_id = %s",
        (body.application_id,),
    ):
        raise HTTPException(status_code=400, detail="Loan application not found")

    if not fetch_customer(body.customer_id):
        raise HTTPException(status_code=400, detail="Customer not found")

    existing = fetch_one(
        "SELECT loan_id FROM Loans WHERE application_id = %s",
        (body.application_id,),
    )
    if existing:
        raise HTTPException(
            status_code=400, detail="A loan already exists for this application"
        )

    loan_id = execute(
        """
        INSERT INTO Loans (application_id, customer_id, initial_balance, current_balance, interest_rate)
        VALUES (%s, %s, %s, %s, %s)
        """,
        (
            body.application_id,
            body.customer_id,
            body.initial_balance,
            body.current_balance,
            body.interest_rate,
        ),
    )

    return {"message": "Loan created successfully", "loan_id": loan_id}


@app.patch("/loans/{loan_id}")
def patch_loan(loan_id: int, updates: LoanUpdate):
    if not fetch_loan(loan_id):
        raise HTTPException(status_code=404, detail="Loan not found")

    update_data = updates.model_dump(exclude_unset=True)
    if "status" in update_data and update_data["status"] not in ("active", "paid_off"):
        raise HTTPException(
            status_code=400, detail="status must be 'active' or 'paid_off'"
        )

    update_record("Loans", "loan_id", loan_id, update_data)

    return {"message": "Loan updated successfully"}


@app.delete("/loans/{loan_id}")
def delete_loan(loan_id: int):
    if not fetch_loan(loan_id):
        raise HTTPException(status_code=404, detail="Loan not found")

    payments = fetch_one(
        "SELECT payment_id FROM Payments WHERE loan_id = %s LIMIT 1",
        (loan_id,),
    )
    if payments:
        raise HTTPException(
            status_code=400, detail="Cannot delete loan with recorded payments"
        )

    delete_record("Loans", "loan_id", loan_id)

    return {"message": "Loan deleted successfully"}


### PAYMENTS API ENDPOINTS ###


@app.get("/payments")
def get_payments():
    return fetch_all(
        """
        SELECT p.payment_id, p.loan_id, p.customer_id, p.payment_amount, p.payment_date,
               c.first_name AS customer_first_name,
               c.last_name AS customer_last_name,
               l.current_balance AS loan_current_balance
        FROM Payments p
        JOIN Customers c ON p.customer_id = c.customer_id
        JOIN Loans l ON p.loan_id = l.loan_id
        ORDER BY p.payment_date DESC
        """
    )


@app.get("/payments/{payment_id}")
def get_payment(payment_id: int):
    row = fetch_one(
        """
        SELECT payment_id, loan_id, customer_id, payment_amount, payment_date
        FROM Payments
        WHERE payment_id = %s
        """,
        (payment_id,),
    )
    if not row:
        raise HTTPException(status_code=404, detail="Payment not found")
    return row


@app.post("/payments")
def create_payment(body: PaymentCreate):
    result = run_payment_transaction(body.loan_id, body.customer_id, body.payment_amount)
    return {"message": "Payment recorded successfully", **result}


### HELPER FUNCTIONS ###


def review_application_transaction(application_id: int, data: ReviewApplication) -> dict:
    """Approve/deny with row lock + transaction (guide Step 6); matches schema.sql tables."""
    if data.status not in ("approved", "denied"):
        raise HTTPException(
            status_code=400,
            detail="status must be 'approved' or 'denied'",
        )

    if not fetch_employee(data.employee_id):
        raise HTTPException(status_code=400, detail="Employee not found")

    denial_stored = (
        (data.denial_reason if data.denial_reason is not None else "N/A")
        if data.status == "denied"
        else "N/A"
    )

    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        conn.start_transaction()
        cursor.execute(
            """
            SELECT application_id, customer_id, requested_amount, interest_rate, status
            FROM LoanApplications
            WHERE application_id = %s
            FOR UPDATE
            """,
            (application_id,),
        )
        application = cursor.fetchone()
        if not application:
            raise HTTPException(status_code=404, detail="Loan application not found")
        if application["status"] != "pending":
            raise HTTPException(
                status_code=400, detail="Application has already been reviewed"
            )

        if data.status == "denied":
            cursor.execute(
                """
                UPDATE LoanApplications
                SET status = 'denied',
                    reviewed_by = %s,
                    reviewed_at = CURRENT_TIMESTAMP,
                    denial_reason = %s
                WHERE application_id = %s
                """,
                (data.employee_id, denial_stored, application_id),
            )
            conn.commit()
            return {"message": "Application denied"}

        cursor.execute(
            """
            UPDATE LoanApplications
            SET status = 'approved',
                reviewed_by = %s,
                reviewed_at = CURRENT_TIMESTAMP,
                denial_reason = %s
            WHERE application_id = %s
            """,
            (data.employee_id, denial_stored, application_id),
        )

        cursor.execute(
            """
            INSERT INTO Loans (application_id, customer_id, initial_balance, current_balance, interest_rate)
            VALUES (%s, %s, %s, %s, %s)
            """,
            (
                application_id,
                application["customer_id"],
                application["requested_amount"],
                application["requested_amount"],
                application["interest_rate"],
            ),
        )
        conn.commit()
        return {"message": "Application approved and loan created"}
    except HTTPException:
        conn.rollback()
        raise
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e)) from e
    finally:
        cursor.close()
        conn.close()


def run_payment_transaction(loan_id: int, customer_id: int, payment_amount: Decimal) -> dict:
    """
    Insert payment; decrease Customers.balance and Loans.current_balance (proposal + guide Step 7).
    Uses schema.sql column names (home_address unchanged; balance on Customers).
    """
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        conn.start_transaction()
        cursor.execute(
            """
            SELECT loan_id, customer_id, current_balance, status
            FROM Loans
            WHERE loan_id = %s AND customer_id = %s
            FOR UPDATE
            """,
            (loan_id, customer_id),
        )
        loan = cursor.fetchone()
        if not loan:
            raise HTTPException(
                status_code=404, detail="Loan not found for this customer"
            )
        if loan["status"] != "active":
            raise HTTPException(status_code=400, detail="Loan is not active")

        cursor.execute(
            """
            SELECT customer_id, balance
            FROM Customers
            WHERE customer_id = %s
            FOR UPDATE
            """,
            (customer_id,),
        )
        customer = cursor.fetchone()
        if not customer:
            raise HTTPException(status_code=404, detail="Customer not found")

        if payment_amount <= 0:
            raise HTTPException(status_code=400, detail="Payment must be positive")

        if customer["balance"] < payment_amount:
            raise HTTPException(status_code=400, detail="Insufficient customer balance")

        if loan["current_balance"] < payment_amount:
            raise HTTPException(
                status_code=400, detail="Payment cannot exceed loan balance"
            )

        new_customer_balance = customer["balance"] - payment_amount
        new_loan_balance = loan["current_balance"] - payment_amount
        new_status = "paid_off" if new_loan_balance == 0 else "active"

        cursor.execute(
            """
            INSERT INTO Payments (loan_id, customer_id, payment_amount)
            VALUES (%s, %s, %s)
            """,
            (loan_id, customer_id, payment_amount),
        )
        payment_id = cursor.lastrowid

        cursor.execute(
            """
            UPDATE Customers
            SET balance = %s
            WHERE customer_id = %s
            """,
            (new_customer_balance, customer_id),
        )

        cursor.execute(
            """
            UPDATE Loans
            SET current_balance = %s, status = %s
            WHERE loan_id = %s
            """,
            (new_loan_balance, new_status, loan_id),
        )

        conn.commit()
        return {
            "payment_id": payment_id,
            "new_customer_balance": new_customer_balance,
            "new_loan_balance": new_loan_balance,
            "loan_status": new_status,
        }
    except HTTPException:
        conn.rollback()
        raise
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e)) from e
    finally:
        cursor.close()
        conn.close()


def fetch_customer(customer_id: int):
    return fetch_one(
        """
        SELECT customer_id
        FROM Customers
        WHERE customer_id = %s
        """,
        (customer_id,),
    )


def fetch_employee(employee_id: int):
    return fetch_one(
        """
        SELECT employee_id
        FROM Employees
        WHERE employee_id = %s
        """,
        (employee_id,),
    )


def fetch_loan(loan_id: int):
    return fetch_one(
        """
        SELECT loan_id
        FROM Loans
        WHERE loan_id = %s
        """,
        (loan_id,),
    )


def update_record(
    table_name: str, pk_column: str, pk_value: int, update_data: dict
) -> None:
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields provided")

    fields = []
    values = []

    for key, value in update_data.items():
        fields.append(f"`{key}` = %s")
        values.append(value)

    values.append(pk_value)

    query = f"""
        UPDATE `{table_name}`
        SET {", ".join(fields)}
        WHERE `{pk_column}` = %s
        """

    execute(query, tuple(values))


def delete_record(table_name: str, pk_column: str, pk_value: int) -> None:
    execute(
        f"""
        DELETE FROM `{table_name}`
        WHERE `{pk_column}` = %s
        """,
        (pk_value,),
    )
