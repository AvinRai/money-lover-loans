"""
Backend integration tests for the Loaning Service API.

Tests use FastAPI's TestClient with mocked database functions so no live MySQL
connection is required.  Each test patches app.db helpers directly to return
controlled data and asserts the HTTP response.
"""

from decimal import Decimal
from unittest.mock import MagicMock, patch

import pytest
from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)

# ---------------------------------------------------------------------------
# Shared mock data
# ---------------------------------------------------------------------------

MOCK_CUSTOMER = {
    "customer_id": 1,
    "first_name": "Alice",
    "last_name": "Smith",
    "email": "alice@example.com",
    "phone": "555-0001",
    "home_address": "1 Main St",
    "balance": Decimal("1000.00"),
    "salary": Decimal("50000.00"),
    "credit_score": 720,
    "hashed_password": "secret",
}

MOCK_CUSTOMER_PUBLIC = {k: v for k, v in MOCK_CUSTOMER.items() if k != "hashed_password"}

MOCK_EMPLOYEE = {
    "employee_id": 1,
    "first_name": "Bob",
    "last_name": "Jones",
    "email": "bob@example.com",
    "phone": "555-0002",
    "home_address": "2 Oak Ave",
    "hashed_password": "emppass",
}

MOCK_EMPLOYEE_PUBLIC = {k: v for k, v in MOCK_EMPLOYEE.items() if k != "hashed_password"}

MOCK_APPLICATION = {
    "application_id": 10,
    "customer_id": 1,
    "requested_amount": Decimal("5000.00"),
    "interest_rate": Decimal("5.00"),
    "term_months": 12,
    "application_date": "2026-01-01T00:00:00",
    "status": "pending",
    "reviewed_by": 0,
    "reviewed_at": "1000-01-01T00:00:00",
    "denial_reason": "N/A",
}

MOCK_LOAN = {
    "loan_id": 20,
    "application_id": 10,
    "customer_id": 1,
    "initial_balance": Decimal("5000.00"),
    "current_balance": Decimal("4000.00"),
    "interest_rate": Decimal("5.00"),
    "loan_start_date": "2026-01-15T00:00:00",
    "status": "active",
}


# ===========================================================================
# Health
# ===========================================================================


def test_health():
    res = client.get("/health")
    assert res.status_code == 200
    assert res.json() == {"status": "ok"}


# ===========================================================================
# Auth – login
# ===========================================================================


class TestLogin:
    def test_customer_login_success(self):
        with patch("app.main.fetch_one", return_value=MOCK_CUSTOMER):
            res = client.post(
                "/auth/login",
                json={"role": "customer", "email": "alice@example.com", "password": "secret"},
            )
        assert res.status_code == 200
        data = res.json()
        assert data["role"] == "customer"
        assert data["profile"]["customer_id"] == 1
        assert "hashed_password" not in data["profile"]

    def test_customer_login_wrong_password(self):
        with patch("app.main.fetch_one", return_value=MOCK_CUSTOMER):
            res = client.post(
                "/auth/login",
                json={"role": "customer", "email": "alice@example.com", "password": "wrong"},
            )
        assert res.status_code == 401
        assert "Invalid" in res.json()["detail"]

    def test_customer_login_not_found(self):
        with patch("app.main.fetch_one", return_value=None):
            res = client.post(
                "/auth/login",
                json={"role": "customer", "email": "nobody@example.com", "password": "x"},
            )
        assert res.status_code == 401

    def test_employee_login_success(self):
        with patch("app.main.fetch_one", return_value=MOCK_EMPLOYEE):
            res = client.post(
                "/auth/login",
                json={"role": "employee", "email": "bob@example.com", "password": "emppass"},
            )
        assert res.status_code == 200
        data = res.json()
        assert data["role"] == "employee"
        assert data["profile"]["employee_id"] == 1
        assert "hashed_password" not in data["profile"]

    def test_employee_login_wrong_password(self):
        with patch("app.main.fetch_one", return_value=MOCK_EMPLOYEE):
            res = client.post(
                "/auth/login",
                json={"role": "employee", "email": "bob@example.com", "password": "bad"},
            )
        assert res.status_code == 401

    def test_login_invalid_role(self):
        res = client.post(
            "/auth/login",
            json={"role": "admin", "email": "x@x.com", "password": "x"},
        )
        assert res.status_code == 400


# ===========================================================================
# Customers – registration (POST /customers)
# ===========================================================================


class TestCustomerRegistration:
    def test_create_customer_success(self):
        with patch("app.main.fetch_one", return_value=None), patch(
            "app.main.execute", return_value=1
        ):
            res = client.post(
                "/customers",
                json={
                    "first_name": "Alice",
                    "last_name": "Smith",
                    "email": "alice@example.com",
                    "phone": "555-0001",
                    "home_address": "1 Main St",
                    "balance": "1000.00",
                    "salary": "50000.00",
                    "credit_score": 720,
                    "hashed_password": "secret",
                },
            )
        assert res.status_code == 200
        data = res.json()
        assert data["customer_id"] == 1
        assert "created" in data["message"].lower()

    def test_create_customer_duplicate_email(self):
        with patch("app.main.fetch_one", return_value={"customer_id": 1}):
            res = client.post(
                "/customers",
                json={
                    "first_name": "Alice",
                    "last_name": "Smith",
                    "email": "alice@example.com",
                    "phone": "555-0001",
                    "home_address": "1 Main St",
                    "balance": "1000.00",
                    "salary": "50000.00",
                    "credit_score": 720,
                    "hashed_password": "secret",
                },
            )
        assert res.status_code == 400
        assert "already" in res.json()["detail"].lower()

    def test_create_employee_success(self):
        with patch("app.main.fetch_one", return_value=None), patch(
            "app.main.execute", return_value=2
        ):
            res = client.post(
                "/employees",
                json={
                    "first_name": "Bob",
                    "last_name": "Jones",
                    "email": "bob@example.com",
                    "phone": "555-0002",
                    "home_address": "2 Oak Ave",
                    "hashed_password": "emppass",
                },
            )
        assert res.status_code == 200
        data = res.json()
        assert data["employee_id"] == 2


# ===========================================================================
# Customers – read and update
# ===========================================================================


class TestCustomerReadUpdate:
    def test_get_customers(self):
        with patch("app.main.fetch_all", return_value=[MOCK_CUSTOMER_PUBLIC]):
            res = client.get("/customers")
        assert res.status_code == 200
        assert len(res.json()) == 1

    def test_get_customer_by_id(self):
        with patch("app.main.fetch_one", return_value=MOCK_CUSTOMER_PUBLIC):
            res = client.get("/customers/1")
        assert res.status_code == 200
        assert res.json()["customer_id"] == 1

    def test_get_customer_not_found(self):
        with patch("app.main.fetch_one", return_value=None):
            res = client.get("/customers/999")
        assert res.status_code == 404

    def test_patch_customer(self):
        with patch("app.main.fetch_one", return_value={"customer_id": 1}), patch(
            "app.main.update_record"
        ):
            res = client.patch("/customers/1", json={"phone": "555-9999"})
        assert res.status_code == 200
        assert "updated" in res.json()["message"].lower()

    def test_patch_customer_not_found(self):
        with patch("app.main.fetch_one", return_value=None):
            res = client.patch("/customers/999", json={"phone": "555-9999"})
        assert res.status_code == 404


# ===========================================================================
# Customers – delete with cascade
# ===========================================================================


class TestCustomerDelete:
    def test_delete_customer_success(self):
        execute_mock = MagicMock(return_value=None)
        with patch("app.main.fetch_customer", return_value={"customer_id": 1}), patch(
            "app.main.execute", execute_mock
        ), patch("app.main.delete_record"):
            res = client.delete("/customers/1")
        assert res.status_code == 200
        assert "deleted" in res.json()["message"].lower()
        # Verify cascade deletes were called (payments, loans, applications)
        calls = [str(c) for c in execute_mock.call_args_list]
        assert any("Payments" in c for c in calls)
        assert any("Loans" in c for c in calls)
        assert any("LoanApplications" in c for c in calls)

    def test_delete_customer_not_found(self):
        with patch("app.main.fetch_customer", return_value=None):
            res = client.delete("/customers/999")
        assert res.status_code == 404


# ===========================================================================
# Loan Applications – create and view
# ===========================================================================


class TestLoanApplications:
    def test_customer_submit_application(self):
        with patch("app.main.fetch_customer", return_value={"customer_id": 1}), patch(
            "app.main.execute", return_value=10
        ):
            res = client.post(
                "/customers/1/applications",
                json={"requested_amount": "5000.00", "interest_rate": "5.00", "term_months": 12},
            )
        assert res.status_code == 200
        data = res.json()
        assert data["application_id"] == 10
        assert "submitted" in data["message"].lower()

    def test_customer_submit_application_invalid_amount(self):
        res = client.post(
            "/customers/1/applications",
            json={"requested_amount": "-100", "interest_rate": "5.00", "term_months": 12},
        )
        assert res.status_code == 422

    def test_get_customer_applications(self):
        with patch("app.main.fetch_customer", return_value={"customer_id": 1}), patch(
            "app.main.fetch_all", return_value=[MOCK_APPLICATION]
        ):
            res = client.get("/customers/1/applications")
        assert res.status_code == 200
        assert len(res.json()) == 1

    def test_get_all_applications_employee(self):
        app_with_names = {**MOCK_APPLICATION, "customer_first_name": "Alice", "customer_last_name": "Smith", "customer_email": "alice@example.com"}
        with patch("app.main.fetch_all", return_value=[app_with_names]):
            res = client.get("/applications")
        assert res.status_code == 200
        assert res.json()[0]["customer_first_name"] == "Alice"


# ===========================================================================
# Loan Applications – approve / deny
# ===========================================================================


class TestApplicationReview:
    def _pending_app(self):
        return {**MOCK_APPLICATION, "status": "pending"}

    def test_approve_application(self):
        conn_mock = MagicMock()
        cursor_mock = MagicMock()
        conn_mock.cursor.return_value = cursor_mock
        cursor_mock.fetchone.side_effect = [
            {**MOCK_APPLICATION, "status": "pending"},  # FOR UPDATE select
        ]
        cursor_mock.lastrowid = 20

        with patch("app.main.fetch_employee", return_value={"employee_id": 1}), patch(
            "app.main.get_connection", return_value=conn_mock
        ):
            res = client.patch(
                "/applications/10/review",
                json={"employee_id": 1, "status": "approved"},
            )
        assert res.status_code == 200
        assert "approved" in res.json()["message"].lower()

    def test_deny_application(self):
        conn_mock = MagicMock()
        cursor_mock = MagicMock()
        conn_mock.cursor.return_value = cursor_mock
        cursor_mock.fetchone.return_value = {**MOCK_APPLICATION, "status": "pending"}

        with patch("app.main.fetch_employee", return_value={"employee_id": 1}), patch(
            "app.main.get_connection", return_value=conn_mock
        ):
            res = client.patch(
                "/applications/10/review",
                json={"employee_id": 1, "status": "denied", "denial_reason": "Low score"},
            )
        assert res.status_code == 200
        assert "denied" in res.json()["message"].lower()

    def test_review_already_reviewed(self):
        conn_mock = MagicMock()
        cursor_mock = MagicMock()
        conn_mock.cursor.return_value = cursor_mock
        cursor_mock.fetchone.return_value = {**MOCK_APPLICATION, "status": "approved"}

        with patch("app.main.fetch_employee", return_value={"employee_id": 1}), patch(
            "app.main.get_connection", return_value=conn_mock
        ):
            res = client.patch(
                "/applications/10/review",
                json={"employee_id": 1, "status": "denied"},
            )
        assert res.status_code == 400
        assert "already been reviewed" in res.json()["detail"]

    def test_review_invalid_status(self):
        with patch("app.main.fetch_employee", return_value={"employee_id": 1}):
            res = client.patch(
                "/applications/10/review",
                json={"employee_id": 1, "status": "pending"},
            )
        assert res.status_code == 400


# ===========================================================================
# Loans – view
# ===========================================================================


class TestLoans:
    def test_get_customer_loans(self):
        with patch("app.main.fetch_customer", return_value={"customer_id": 1}), patch(
            "app.main.fetch_all", return_value=[MOCK_LOAN]
        ):
            res = client.get("/customers/1/loans")
        assert res.status_code == 200
        assert len(res.json()) == 1

    def test_get_all_loans_employee(self):
        loan_with_names = {**MOCK_LOAN, "customer_first_name": "Alice", "customer_last_name": "Smith", "customer_email": "alice@example.com"}
        with patch("app.main.fetch_all", return_value=[loan_with_names]):
            res = client.get("/loans")
        assert res.status_code == 200
        assert res.json()[0]["customer_first_name"] == "Alice"


# ===========================================================================
# Loans – delete with cascade
# ===========================================================================


class TestLoanDelete:
    def test_delete_loan_success(self):
        execute_mock = MagicMock(return_value=None)
        with patch("app.main.fetch_loan", return_value={"loan_id": 20}), patch(
            "app.main.execute", execute_mock
        ), patch("app.main.delete_record"):
            res = client.delete("/loans/20")
        assert res.status_code == 200
        assert "deleted" in res.json()["message"].lower()
        # Cascade: payments deleted first
        calls = [str(c) for c in execute_mock.call_args_list]
        assert any("Payments" in c for c in calls)

    def test_delete_loan_not_found(self):
        with patch("app.main.fetch_loan", return_value=None):
            res = client.delete("/loans/999")
        assert res.status_code == 404


# ===========================================================================
# Loan payments
# ===========================================================================


class TestPayments:
    def test_pay_loan_success(self):
        conn_mock = MagicMock()
        cursor_mock = MagicMock()
        conn_mock.cursor.return_value = cursor_mock
        cursor_mock.fetchone.side_effect = [
            {"loan_id": 20, "customer_id": 1, "current_balance": Decimal("4000.00"), "status": "active"},
            {"customer_id": 1, "balance": Decimal("1000.00")},
        ]
        cursor_mock.lastrowid = 50

        with patch("app.main.get_connection", return_value=conn_mock):
            res = client.post(
                "/loans/20/payments",
                json={"customer_id": 1, "payment_amount": "500.00"},
            )
        assert res.status_code == 200
        data = res.json()
        assert "successful" in data["message"].lower()
        assert float(data["new_customer_balance"]) == 500.00
        assert float(data["new_loan_balance"]) == 3500.00
        assert data["loan_status"] == "active"

    def test_pay_loan_insufficient_balance(self):
        conn_mock = MagicMock()
        cursor_mock = MagicMock()
        conn_mock.cursor.return_value = cursor_mock
        cursor_mock.fetchone.side_effect = [
            {"loan_id": 20, "customer_id": 1, "current_balance": Decimal("4000.00"), "status": "active"},
            {"customer_id": 1, "balance": Decimal("100.00")},
        ]

        with patch("app.main.get_connection", return_value=conn_mock):
            res = client.post(
                "/loans/20/payments",
                json={"customer_id": 1, "payment_amount": "500.00"},
            )
        assert res.status_code == 400
        assert "balance" in res.json()["detail"].lower()

    def test_pay_loan_exceeds_loan_balance(self):
        conn_mock = MagicMock()
        cursor_mock = MagicMock()
        conn_mock.cursor.return_value = cursor_mock
        cursor_mock.fetchone.side_effect = [
            {"loan_id": 20, "customer_id": 1, "current_balance": Decimal("200.00"), "status": "active"},
            {"customer_id": 1, "balance": Decimal("5000.00")},
        ]

        with patch("app.main.get_connection", return_value=conn_mock):
            res = client.post(
                "/loans/20/payments",
                json={"customer_id": 1, "payment_amount": "500.00"},
            )
        assert res.status_code == 400
        assert "exceed" in res.json()["detail"].lower()

    def test_pay_loan_full_payoff(self):
        conn_mock = MagicMock()
        cursor_mock = MagicMock()
        conn_mock.cursor.return_value = cursor_mock
        cursor_mock.fetchone.side_effect = [
            {"loan_id": 20, "customer_id": 1, "current_balance": Decimal("500.00"), "status": "active"},
            {"customer_id": 1, "balance": Decimal("1000.00")},
        ]
        cursor_mock.lastrowid = 51

        with patch("app.main.get_connection", return_value=conn_mock):
            res = client.post(
                "/loans/20/payments",
                json={"customer_id": 1, "payment_amount": "500.00"},
            )
        assert res.status_code == 200
        assert res.json()["loan_status"] == "paid_off"

    def test_pay_loan_not_active(self):
        conn_mock = MagicMock()
        cursor_mock = MagicMock()
        conn_mock.cursor.return_value = cursor_mock
        cursor_mock.fetchone.return_value = {
            "loan_id": 20,
            "customer_id": 1,
            "current_balance": Decimal("0.00"),
            "status": "paid_off",
        }

        with patch("app.main.get_connection", return_value=conn_mock):
            res = client.post(
                "/loans/20/payments",
                json={"customer_id": 1, "payment_amount": "100.00"},
            )
        assert res.status_code == 400
        assert "not active" in res.json()["detail"].lower()
