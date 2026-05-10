"""
Backend integration tests for the Loaning Service API.

Tests use FastAPI's TestClient with mocked database helpers so no live MySQL
connection is required.  Each test patches app.main helpers to return
controlled data and asserts the HTTP response.

Coverage per table
------------------
Customers       – insert, read, update, delete (cascade → loans/applications/payments)
Employees       – insert, read, update, delete
LoanApplications– insert, read, update (pending-only), delete (pending-only), approve/deny
Loans           – insert, read, update, delete (cascade → payments)
Payments        – insert (via payment transaction), read
"""

from decimal import Decimal
from unittest.mock import MagicMock, call, patch

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
    "phone": "408-555-0101",
    "home_address": "100 Maple St, San Jose, CA",
    "balance": Decimal("5000.00"),
    "salary": Decimal("75000.00"),
    "credit_score": 720,
    "hashed_password": "pass_alice",
}
MOCK_CUSTOMER_PUBLIC = {k: v for k, v in MOCK_CUSTOMER.items() if k != "hashed_password"}

MOCK_EMPLOYEE = {
    "employee_id": 1,
    "first_name": "Richard",
    "last_name": "Ho",
    "email": "richard.ho@loanserv.com",
    "phone": "650-555-1001",
    "home_address": "Foster City, CA",
    "hashed_password": "emp_richard",
}
MOCK_EMPLOYEE_PUBLIC = {k: v for k, v in MOCK_EMPLOYEE.items() if k != "hashed_password"}

MOCK_APPLICATION = {
    "application_id": 10,
    "customer_id": 1,
    "requested_amount": Decimal("5000.00"),
    "interest_rate": Decimal("5.50"),
    "term_months": 36,
    "application_date": "2026-01-03T09:00:00",
    "status": "pending",
    "reviewed_by": None,
    "reviewed_at": None,
    "denial_reason": None,
}

MOCK_LOAN = {
    "loan_id": 20,
    "application_id": 10,
    "customer_id": 1,
    "initial_balance": Decimal("5000.00"),
    "current_balance": Decimal("4500.00"),
    "interest_rate": Decimal("5.50"),
    "loan_start_date": "2026-01-04T10:00:00",
    "status": "active",
}

MOCK_PAYMENT = {
    "payment_id": 50,
    "loan_id": 20,
    "customer_id": 1,
    "payment_amount": Decimal("500.00"),
    "payment_date": "2026-02-04T10:00:00",
}

NEW_CUSTOMER_PAYLOAD = {
    "first_name": "Alice",
    "last_name": "Smith",
    "email": "alice@example.com",
    "phone": "408-555-0101",
    "home_address": "100 Maple St, San Jose, CA",
    "balance": "5000.00",
    "salary": "75000.00",
    "credit_score": 720,
    "hashed_password": "pass_alice",
}

NEW_EMPLOYEE_PAYLOAD = {
    "first_name": "Richard",
    "last_name": "Ho",
    "email": "richard.ho@loanserv.com",
    "phone": "650-555-1001",
    "home_address": "Foster City, CA",
    "hashed_password": "emp_richard",
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
                json={"role": "customer", "email": "alice@example.com", "password": "pass_alice"},
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
                json={"role": "employee", "email": "richard.ho@loanserv.com", "password": "emp_richard"},
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
                json={"role": "employee", "email": "richard.ho@loanserv.com", "password": "bad"},
            )
        assert res.status_code == 401

    def test_login_invalid_role(self):
        res = client.post(
            "/auth/login",
            json={"role": "admin", "email": "x@x.com", "password": "x"},
        )
        assert res.status_code == 400


# ===========================================================================
# Customers – INSERT
# ===========================================================================


class TestCustomerInsert:
    """Tests for POST /customers (inserting a new customer row)."""

    def test_insert_customer_success(self):
        """Inserting a customer with a unique e-mail returns the new customer_id."""
        with patch("app.main.fetch_one", return_value=None), patch(
            "app.main.execute", return_value=1
        ):
            res = client.post("/customers", json=NEW_CUSTOMER_PAYLOAD)
        assert res.status_code == 200
        data = res.json()
        assert data["customer_id"] == 1
        assert "created" in data["message"].lower()

    def test_insert_customer_duplicate_email_rejected(self):
        """A second customer with the same e-mail must be rejected (400)."""
        with patch("app.main.fetch_one", return_value={"customer_id": 1}):
            res = client.post("/customers", json=NEW_CUSTOMER_PAYLOAD)
        assert res.status_code == 400
        assert "already" in res.json()["detail"].lower()

    def test_insert_customer_invalid_credit_score(self):
        """Credit score outside 300-850 is accepted by the API (no Pydantic validator);
        the DB CHECK constraint would reject it on a live connection.
        This test documents that the API layer currently passes the value through."""
        bad_payload = {**NEW_CUSTOMER_PAYLOAD, "credit_score": 200}
        with patch("app.main.fetch_one", return_value=None), patch(
            "app.main.execute", return_value=1
        ):
            res = client.post("/customers", json=bad_payload)
        assert res.status_code == 200

    def test_insert_multiple_customers_get_distinct_ids(self):
        """Each successful insert returns a distinct customer_id."""
        with patch("app.main.fetch_one", return_value=None):
            with patch("app.main.execute", return_value=1):
                res1 = client.post("/customers", json=NEW_CUSTOMER_PAYLOAD)
            second_payload = {**NEW_CUSTOMER_PAYLOAD, "email": "bob@example.com"}
            with patch("app.main.execute", return_value=2):
                res2 = client.post("/customers", json=second_payload)
        assert res1.json()["customer_id"] != res2.json()["customer_id"]


# ===========================================================================
# Customers – READ
# ===========================================================================


class TestCustomerRead:
    def test_get_all_customers(self):
        with patch("app.main.fetch_all", return_value=[MOCK_CUSTOMER_PUBLIC]):
            res = client.get("/customers")
        assert res.status_code == 200
        assert len(res.json()) == 1

    def test_get_customer_by_id_returns_correct_row(self):
        with patch("app.main.fetch_one", return_value=MOCK_CUSTOMER_PUBLIC):
            res = client.get("/customers/1")
        assert res.status_code == 200
        data = res.json()
        assert data["customer_id"] == 1
        assert data["first_name"] == "Alice"

    def test_get_customer_not_found(self):
        with patch("app.main.fetch_one", return_value=None):
            res = client.get("/customers/999")
        assert res.status_code == 404


# ===========================================================================
# Customers – UPDATE
# ===========================================================================


class TestCustomerUpdate:
    """Tests for PATCH /customers/{id} (updating customer fields)."""

    def test_update_customer_phone(self):
        """Updating a customer's phone number returns a success message."""
        with patch("app.main.fetch_one", return_value={"customer_id": 1}), patch(
            "app.main.update_record"
        ) as mock_update:
            res = client.patch("/customers/1", json={"phone": "999-000-1234"})
        assert res.status_code == 200
        assert "updated" in res.json()["message"].lower()
        mock_update.assert_called_once_with(
            "Customers", "customer_id", 1, {"phone": "999-000-1234"}
        )

    def test_update_customer_multiple_fields(self):
        """Updating several fields at once works correctly."""
        update_body = {"phone": "111-222-3333", "home_address": "99 New Rd, Test City, CA"}
        with patch("app.main.fetch_one", return_value={"customer_id": 1}), patch(
            "app.main.update_record"
        ) as mock_update:
            res = client.patch("/customers/1", json=update_body)
        assert res.status_code == 200
        mock_update.assert_called_once_with("Customers", "customer_id", 1, update_body)

    def test_update_customer_credit_score(self):
        """Changing a customer's credit score is persisted."""
        with patch("app.main.fetch_one", return_value={"customer_id": 1}), patch(
            "app.main.update_record"
        ) as mock_update:
            res = client.patch("/customers/1", json={"credit_score": 780})
        assert res.status_code == 200
        mock_update.assert_called_once_with(
            "Customers", "customer_id", 1, {"credit_score": 780}
        )

    def test_update_nonexistent_customer_returns_404(self):
        with patch("app.main.fetch_one", return_value=None):
            res = client.patch("/customers/999", json={"phone": "000-000-0000"})
        assert res.status_code == 404


# ===========================================================================
# Customers – DELETE (cascade)
# ===========================================================================


class TestCustomerDelete:
    """Deleting a customer must cascade-delete their payments, loans, and applications."""

    def test_delete_customer_success(self):
        execute_mock = MagicMock(return_value=None)
        with patch("app.main.fetch_customer", return_value={"customer_id": 1}), patch(
            "app.main.execute", execute_mock
        ), patch("app.main.delete_record"):
            res = client.delete("/customers/1")
        assert res.status_code == 200
        assert "deleted" in res.json()["message"].lower()

    def test_delete_customer_cascades_to_payments(self):
        """Payments belonging to the customer must be deleted first."""
        execute_mock = MagicMock(return_value=None)
        with patch("app.main.fetch_customer", return_value={"customer_id": 1}), patch(
            "app.main.execute", execute_mock
        ), patch("app.main.delete_record"):
            client.delete("/customers/1")
        calls_str = [str(c) for c in execute_mock.call_args_list]
        assert any("Payments" in c for c in calls_str)

    def test_delete_customer_cascades_to_loans(self):
        """Loans belonging to the customer must be deleted."""
        execute_mock = MagicMock(return_value=None)
        with patch("app.main.fetch_customer", return_value={"customer_id": 1}), patch(
            "app.main.execute", execute_mock
        ), patch("app.main.delete_record"):
            client.delete("/customers/1")
        calls_str = [str(c) for c in execute_mock.call_args_list]
        assert any("Loans" in c for c in calls_str)

    def test_delete_customer_cascades_to_loan_applications(self):
        """Loan applications belonging to the customer must be deleted."""
        execute_mock = MagicMock(return_value=None)
        with patch("app.main.fetch_customer", return_value={"customer_id": 1}), patch(
            "app.main.execute", execute_mock
        ), patch("app.main.delete_record"):
            client.delete("/customers/1")
        calls_str = [str(c) for c in execute_mock.call_args_list]
        assert any("LoanApplications" in c for c in calls_str)

    def test_delete_customer_cascade_order(self):
        """Payments must be deleted before Loans (FK constraint order)."""
        execute_mock = MagicMock(return_value=None)
        with patch("app.main.fetch_customer", return_value={"customer_id": 1}), patch(
            "app.main.execute", execute_mock
        ), patch("app.main.delete_record"):
            client.delete("/customers/1")
        calls_str = [str(c) for c in execute_mock.call_args_list]
        payments_idx = next(i for i, c in enumerate(calls_str) if "Payments" in c)
        loans_idx = next(i for i, c in enumerate(calls_str) if "Loans" in c)
        apps_idx = next(i for i, c in enumerate(calls_str) if "LoanApplications" in c)
        assert payments_idx < loans_idx < apps_idx

    def test_delete_nonexistent_customer_returns_404(self):
        with patch("app.main.fetch_customer", return_value=None):
            res = client.delete("/customers/999")
        assert res.status_code == 404


# ===========================================================================
# Employees – INSERT
# ===========================================================================


class TestEmployeeInsert:
    """Tests for POST /employees (inserting a new employee row)."""

    def test_insert_employee_success(self):
        with patch("app.main.fetch_one", return_value=None), patch(
            "app.main.execute", return_value=1
        ):
            res = client.post("/employees", json=NEW_EMPLOYEE_PAYLOAD)
        assert res.status_code == 200
        data = res.json()
        assert data["employee_id"] == 1
        assert "created" in data["message"].lower()

    def test_insert_employee_duplicate_email_rejected(self):
        with patch("app.main.fetch_one", return_value={"employee_id": 1}):
            res = client.post("/employees", json=NEW_EMPLOYEE_PAYLOAD)
        assert res.status_code == 400
        assert "already" in res.json()["detail"].lower()

    def test_insert_employee_missing_required_field(self):
        """Omitting a required field should produce a 422 validation error."""
        incomplete = {k: v for k, v in NEW_EMPLOYEE_PAYLOAD.items() if k != "email"}
        res = client.post("/employees", json=incomplete)
        assert res.status_code == 422


# ===========================================================================
# Employees – READ
# ===========================================================================


class TestEmployeeRead:
    def test_get_all_employees(self):
        with patch("app.main.fetch_all", return_value=[MOCK_EMPLOYEE_PUBLIC]):
            res = client.get("/employees")
        assert res.status_code == 200
        assert len(res.json()) == 1

    def test_get_employee_by_id(self):
        with patch("app.main.fetch_one", return_value=MOCK_EMPLOYEE_PUBLIC):
            res = client.get("/employees/1")
        assert res.status_code == 200
        assert res.json()["employee_id"] == 1

    def test_get_employee_not_found(self):
        with patch("app.main.fetch_one", return_value=None):
            res = client.get("/employees/999")
        assert res.status_code == 404

    def test_hashed_password_not_exposed(self):
        """The employee list endpoint must never return hashed_password."""
        with patch("app.main.fetch_all", return_value=[MOCK_EMPLOYEE_PUBLIC]):
            res = client.get("/employees")
        for emp in res.json():
            assert "hashed_password" not in emp


# ===========================================================================
# Employees – UPDATE
# ===========================================================================


class TestEmployeeUpdate:
    """Tests for PATCH /employees/{id}."""

    def test_update_employee_phone(self):
        with patch("app.main.fetch_one", return_value={"employee_id": 1}), patch(
            "app.main.update_record"
        ) as mock_update:
            res = client.patch("/employees/1", json={"phone": "777-888-9999"})
        assert res.status_code == 200
        assert "updated" in res.json()["message"].lower()
        mock_update.assert_called_once_with(
            "Employees", "employee_id", 1, {"phone": "777-888-9999"}
        )

    def test_update_employee_address(self):
        with patch("app.main.fetch_one", return_value={"employee_id": 1}), patch(
            "app.main.update_record"
        ) as mock_update:
            res = client.patch("/employees/1", json={"home_address": "42 New St, Somewhere, CA"})
        assert res.status_code == 200
        mock_update.assert_called_once_with(
            "Employees", "employee_id", 1, {"home_address": "42 New St, Somewhere, CA"}
        )

    def test_update_nonexistent_employee_returns_404(self):
        with patch("app.main.fetch_one", return_value=None):
            res = client.patch("/employees/999", json={"phone": "000-000-0000"})
        assert res.status_code == 404


# ===========================================================================
# Employees – DELETE
# ===========================================================================


class TestEmployeeDelete:
    """Tests for DELETE /employees/{id}."""

    def test_delete_employee_success(self):
        with patch("app.main.fetch_employee", return_value={"employee_id": 1}), patch(
            "app.main.delete_record"
        ) as mock_del:
            res = client.delete("/employees/1")
        assert res.status_code == 200
        assert "deleted" in res.json()["message"].lower()
        mock_del.assert_called_once_with("Employees", "employee_id", 1)

    def test_delete_nonexistent_employee_returns_404(self):
        with patch("app.main.fetch_employee", return_value=None):
            res = client.delete("/employees/999")
        assert res.status_code == 404


# ===========================================================================
# LoanApplications – INSERT
# ===========================================================================


class TestLoanApplicationInsert:
    """Tests for POST /customers/{id}/applications and POST /loan-applications."""

    def test_submit_application_via_customer_route(self):
        with patch("app.main.fetch_customer", return_value={"customer_id": 1}), patch(
            "app.main.execute", return_value=10
        ):
            res = client.post(
                "/customers/1/applications",
                json={"requested_amount": "5000.00", "interest_rate": "5.50", "term_months": 36},
            )
        assert res.status_code == 200
        data = res.json()
        assert data["application_id"] == 10
        assert "submitted" in data["message"].lower()

    def test_submit_application_invalid_amount(self):
        """Negative or zero requested_amount must be rejected."""
        res = client.post(
            "/customers/1/applications",
            json={"requested_amount": "-100", "interest_rate": "5.00", "term_months": 12},
        )
        assert res.status_code == 422

    def test_submit_application_zero_term_rejected(self):
        res = client.post(
            "/customers/1/applications",
            json={"requested_amount": "1000.00", "interest_rate": "5.00", "term_months": 0},
        )
        assert res.status_code == 422

    def test_submit_application_customer_not_found(self):
        with patch("app.main.fetch_customer", return_value=None):
            res = client.post(
                "/customers/999/applications",
                json={"requested_amount": "1000.00", "interest_rate": "5.00", "term_months": 12},
            )
        assert res.status_code == 404

    def test_create_application_direct_route(self):
        with patch("app.main.fetch_customer", return_value={"customer_id": 1}), patch(
            "app.main.execute", return_value=11
        ):
            res = client.post(
                "/loan-applications",
                json={
                    "customer_id": 1,
                    "requested_amount": "8000.00",
                    "interest_rate": "4.75",
                    "term_months": 60,
                },
            )
        assert res.status_code == 200
        data = res.json()
        assert data["application_id"] == 11
        assert "created" in data["message"].lower()


# ===========================================================================
# LoanApplications – READ
# ===========================================================================


class TestLoanApplicationRead:
    def test_get_customer_applications(self):
        with patch("app.main.fetch_customer", return_value={"customer_id": 1}), patch(
            "app.main.fetch_all", return_value=[MOCK_APPLICATION]
        ):
            res = client.get("/customers/1/applications")
        assert res.status_code == 200
        assert len(res.json()) == 1

    def test_get_all_applications_employee_view(self):
        app_with_names = {
            **MOCK_APPLICATION,
            "customer_first_name": "Alice",
            "customer_last_name": "Smith",
            "customer_email": "alice@example.com",
        }
        with patch("app.main.fetch_all", return_value=[app_with_names]):
            res = client.get("/applications")
        assert res.status_code == 200
        assert res.json()[0]["customer_first_name"] == "Alice"

    def test_get_application_by_id(self):
        with patch("app.main.fetch_one", return_value=MOCK_APPLICATION):
            res = client.get("/loan-applications/10")
        assert res.status_code == 200
        assert res.json()["application_id"] == 10

    def test_get_application_not_found(self):
        with patch("app.main.fetch_one", return_value=None):
            res = client.get("/loan-applications/999")
        assert res.status_code == 404


# ===========================================================================
# LoanApplications – UPDATE
# ===========================================================================


class TestLoanApplicationUpdate:
    """Tests for PATCH /loan-applications/{id} (only pending apps may be updated)."""

    def test_update_pending_application_amount(self):
        pending_app = {**MOCK_APPLICATION, "status": "pending"}
        with patch("app.main.fetch_one", return_value=pending_app), patch(
            "app.main.update_record"
        ) as mock_update:
            res = client.patch(
                "/loan-applications/10", json={"requested_amount": "6000.00"}
            )
        assert res.status_code == 200
        assert "updated" in res.json()["message"].lower()
        mock_update.assert_called_once()

    def test_update_pending_application_term(self):
        pending_app = {**MOCK_APPLICATION, "status": "pending"}
        with patch("app.main.fetch_one", return_value=pending_app), patch(
            "app.main.update_record"
        ) as mock_update:
            res = client.patch("/loan-applications/10", json={"term_months": 48})
        assert res.status_code == 200
        mock_update.assert_called_once()

    def test_update_approved_application_rejected(self):
        """Approved applications cannot be updated."""
        approved_app = {**MOCK_APPLICATION, "status": "approved"}
        with patch("app.main.fetch_one", return_value=approved_app):
            res = client.patch(
                "/loan-applications/10", json={"requested_amount": "9000.00"}
            )
        assert res.status_code == 400
        assert "pending" in res.json()["detail"].lower()

    def test_update_denied_application_rejected(self):
        """Denied applications cannot be updated."""
        denied_app = {**MOCK_APPLICATION, "status": "denied"}
        with patch("app.main.fetch_one", return_value=denied_app):
            res = client.patch(
                "/loan-applications/10", json={"interest_rate": "3.00"}
            )
        assert res.status_code == 400

    def test_update_nonexistent_application_returns_404(self):
        with patch("app.main.fetch_one", return_value=None):
            res = client.patch(
                "/loan-applications/999", json={"requested_amount": "1000.00"}
            )
        assert res.status_code == 404


# ===========================================================================
# LoanApplications – DELETE
# ===========================================================================


class TestLoanApplicationDelete:
    """Tests for DELETE /loan-applications/{id} (only pending apps with no loan)."""

    def test_delete_pending_application_success(self):
        pending_app = {**MOCK_APPLICATION, "status": "pending"}
        with patch("app.main.fetch_one", side_effect=[pending_app, None]), patch(
            "app.main.delete_record"
        ) as mock_del:
            res = client.delete("/loan-applications/10")
        assert res.status_code == 200
        assert "deleted" in res.json()["message"].lower()
        mock_del.assert_called_once_with("LoanApplications", "application_id", 10)

    def test_delete_approved_application_rejected(self):
        """Approved applications (which have a loan) cannot be deleted."""
        approved_app = {**MOCK_APPLICATION, "status": "approved"}
        with patch("app.main.fetch_one", return_value=approved_app):
            res = client.delete("/loan-applications/10")
        assert res.status_code == 400
        assert "pending" in res.json()["detail"].lower()

    def test_delete_denied_application_rejected(self):
        denied_app = {**MOCK_APPLICATION, "status": "denied"}
        with patch("app.main.fetch_one", return_value=denied_app):
            res = client.delete("/loan-applications/10")
        assert res.status_code == 400

    def test_delete_pending_application_with_existing_loan_rejected(self):
        """A pending application that somehow has a Loan record cannot be deleted."""
        pending_app = {**MOCK_APPLICATION, "status": "pending"}
        existing_loan = {"loan_id": 20}
        with patch("app.main.fetch_one", side_effect=[pending_app, existing_loan]):
            res = client.delete("/loan-applications/10")
        assert res.status_code == 400

    def test_delete_nonexistent_application_returns_404(self):
        with patch("app.main.fetch_one", return_value=None):
            res = client.delete("/loan-applications/999")
        assert res.status_code == 404


# ===========================================================================
# LoanApplications – APPROVE / DENY
# ===========================================================================


class TestApplicationReview:
    def test_approve_application_creates_loan(self):
        conn_mock = MagicMock()
        cursor_mock = MagicMock()
        conn_mock.cursor.return_value = cursor_mock
        cursor_mock.fetchone.return_value = {**MOCK_APPLICATION, "status": "pending"}
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

    def test_deny_application_no_loan_created(self):
        conn_mock = MagicMock()
        cursor_mock = MagicMock()
        conn_mock.cursor.return_value = cursor_mock
        cursor_mock.fetchone.return_value = {**MOCK_APPLICATION, "status": "pending"}

        with patch("app.main.fetch_employee", return_value={"employee_id": 1}), patch(
            "app.main.get_connection", return_value=conn_mock
        ):
            res = client.patch(
                "/applications/10/review",
                json={"employee_id": 1, "status": "denied", "denial_reason": "Low credit score"},
            )
        assert res.status_code == 200
        assert "denied" in res.json()["message"].lower()

    def test_review_already_reviewed_application_rejected(self):
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

    def test_review_invalid_status_rejected(self):
        with patch("app.main.fetch_employee", return_value={"employee_id": 1}):
            res = client.patch(
                "/applications/10/review",
                json={"employee_id": 1, "status": "pending"},
            )
        assert res.status_code == 400

    def test_review_nonexistent_employee_rejected(self):
        with patch("app.main.fetch_employee", return_value=None):
            res = client.patch(
                "/applications/10/review",
                json={"employee_id": 999, "status": "approved"},
            )
        assert res.status_code == 400


# ===========================================================================
# Loans – INSERT
# ===========================================================================


class TestLoanInsert:
    """Tests for POST /loans (directly creating a loan record)."""

    def test_create_loan_success(self):
        # fetch_one is called twice: once to check the application exists, once
        # to verify no duplicate loan.  fetch_customer is patched separately.
        with patch(
            "app.main.fetch_one",
            side_effect=[
                {"application_id": 10},  # application exists
                None,                    # no existing loan for this application
            ],
        ), patch("app.main.fetch_customer", return_value={"customer_id": 1}), patch(
            "app.main.execute", return_value=20
        ):
            res = client.post(
                "/loans",
                json={
                    "application_id": 10,
                    "customer_id": 1,
                    "initial_balance": "5000.00",
                    "current_balance": "5000.00",
                    "interest_rate": "5.50",
                },
            )
        assert res.status_code == 200
        data = res.json()
        assert data["loan_id"] == 20
        assert "created" in data["message"].lower()

    def test_create_loan_application_not_found(self):
        with patch("app.main.fetch_one", return_value=None):
            res = client.post(
                "/loans",
                json={
                    "application_id": 999,
                    "customer_id": 1,
                    "initial_balance": "5000.00",
                    "current_balance": "5000.00",
                    "interest_rate": "5.50",
                },
            )
        assert res.status_code == 400
        assert "application" in res.json()["detail"].lower()

    def test_create_duplicate_loan_for_same_application_rejected(self):
        """A second loan for the same application_id must be rejected."""
        with patch(
            "app.main.fetch_one",
            side_effect=[
                {"application_id": 10},
                {"loan_id": 20},  # existing loan already exists
            ],
        ), patch("app.main.fetch_customer", return_value={"customer_id": 1}):
            res = client.post(
                "/loans",
                json={
                    "application_id": 10,
                    "customer_id": 1,
                    "initial_balance": "5000.00",
                    "current_balance": "5000.00",
                    "interest_rate": "5.50",
                },
            )
        assert res.status_code == 400
        assert "already exists" in res.json()["detail"].lower()

    def test_create_loan_invalid_initial_balance(self):
        """initial_balance must be > 0."""
        res = client.post(
            "/loans",
            json={
                "application_id": 10,
                "customer_id": 1,
                "initial_balance": "0.00",
                "current_balance": "0.00",
                "interest_rate": "5.50",
            },
        )
        assert res.status_code == 422


# ===========================================================================
# Loans – READ
# ===========================================================================


class TestLoanRead:
    def test_get_customer_loans(self):
        with patch("app.main.fetch_customer", return_value={"customer_id": 1}), patch(
            "app.main.fetch_all", return_value=[MOCK_LOAN]
        ):
            res = client.get("/customers/1/loans")
        assert res.status_code == 200
        assert len(res.json()) == 1

    def test_get_all_loans_employee_view(self):
        loan_with_names = {
            **MOCK_LOAN,
            "customer_first_name": "Alice",
            "customer_last_name": "Smith",
            "customer_email": "alice@example.com",
        }
        with patch("app.main.fetch_all", return_value=[loan_with_names]):
            res = client.get("/loans")
        assert res.status_code == 200
        assert res.json()[0]["customer_first_name"] == "Alice"

    def test_get_loan_by_id(self):
        with patch("app.main.fetch_one", return_value=MOCK_LOAN):
            res = client.get("/loans/20")
        assert res.status_code == 200
        assert res.json()["loan_id"] == 20

    def test_get_loan_not_found(self):
        with patch("app.main.fetch_one", return_value=None):
            res = client.get("/loans/999")
        assert res.status_code == 404


# ===========================================================================
# Loans – UPDATE
# ===========================================================================


class TestLoanUpdate:
    """Tests for PATCH /loans/{id}."""

    def test_update_loan_current_balance(self):
        with patch("app.main.fetch_loan", return_value={"loan_id": 20}), patch(
            "app.main.update_record"
        ) as mock_update:
            res = client.patch("/loans/20", json={"current_balance": "4000.00"})
        assert res.status_code == 200
        assert "updated" in res.json()["message"].lower()
        mock_update.assert_called_once()

    def test_update_loan_status_to_paid_off(self):
        with patch("app.main.fetch_loan", return_value={"loan_id": 20}), patch(
            "app.main.update_record"
        ) as mock_update:
            res = client.patch("/loans/20", json={"status": "paid_off"})
        assert res.status_code == 200
        mock_update.assert_called_once()

    def test_update_loan_invalid_status_rejected(self):
        """Statuses other than 'active' / 'paid_off' must be rejected."""
        with patch("app.main.fetch_loan", return_value={"loan_id": 20}):
            res = client.patch("/loans/20", json={"status": "cancelled"})
        assert res.status_code == 400
        assert "paid_off" in res.json()["detail"]

    def test_update_nonexistent_loan_returns_404(self):
        with patch("app.main.fetch_loan", return_value=None):
            res = client.patch("/loans/999", json={"current_balance": "1000.00"})
        assert res.status_code == 404


# ===========================================================================
# Loans – DELETE (cascade)
# ===========================================================================


class TestLoanDelete:
    """Deleting a loan must first remove its associated payments."""

    def test_delete_loan_success(self):
        execute_mock = MagicMock(return_value=None)
        with patch("app.main.fetch_loan", return_value={"loan_id": 20}), patch(
            "app.main.execute", execute_mock
        ), patch("app.main.delete_record"):
            res = client.delete("/loans/20")
        assert res.status_code == 200
        assert "deleted" in res.json()["message"].lower()

    def test_delete_loan_cascades_to_payments(self):
        """Payments for the loan must be removed before the loan itself."""
        execute_mock = MagicMock(return_value=None)
        with patch("app.main.fetch_loan", return_value={"loan_id": 20}), patch(
            "app.main.execute", execute_mock
        ), patch("app.main.delete_record") as mock_del:
            client.delete("/loans/20")
        calls_str = [str(c) for c in execute_mock.call_args_list]
        assert any("Payments" in c for c in calls_str)
        mock_del.assert_called_once_with("Loans", "loan_id", 20)

    def test_delete_nonexistent_loan_returns_404(self):
        with patch("app.main.fetch_loan", return_value=None):
            res = client.delete("/loans/999")
        assert res.status_code == 404


# ===========================================================================
# Payments – INSERT (via payment transaction)
# ===========================================================================


class TestPaymentInsert:
    """Tests for POST /loans/{id}/payments (payment transaction)."""

    def _make_conn(self, loan_balance, customer_balance, loan_status="active"):
        conn_mock = MagicMock()
        cursor_mock = MagicMock()
        conn_mock.cursor.return_value = cursor_mock
        cursor_mock.fetchone.side_effect = [
            {
                "loan_id": 20,
                "customer_id": 1,
                "current_balance": Decimal(str(loan_balance)),
                "status": loan_status,
            },
            {"customer_id": 1, "balance": Decimal(str(customer_balance))},
        ]
        return conn_mock, cursor_mock

    def test_insert_payment_success(self):
        conn_mock, cursor_mock = self._make_conn(4500.00, 5000.00)
        cursor_mock.lastrowid = 50

        with patch("app.main.get_connection", return_value=conn_mock):
            res = client.post(
                "/loans/20/payments",
                json={"customer_id": 1, "payment_amount": "500.00"},
            )
        assert res.status_code == 200
        data = res.json()
        assert "successful" in data["message"].lower()
        assert float(data["new_customer_balance"]) == 4500.00
        assert float(data["new_loan_balance"]) == 4000.00
        assert data["loan_status"] == "active"

    def test_insert_payment_full_payoff_marks_loan_paid_off(self):
        conn_mock, cursor_mock = self._make_conn(500.00, 1000.00)
        cursor_mock.lastrowid = 51

        with patch("app.main.get_connection", return_value=conn_mock):
            res = client.post(
                "/loans/20/payments",
                json={"customer_id": 1, "payment_amount": "500.00"},
            )
        assert res.status_code == 200
        assert res.json()["loan_status"] == "paid_off"

    def test_insert_payment_insufficient_customer_balance(self):
        conn_mock, _ = self._make_conn(4500.00, 100.00)
        with patch("app.main.get_connection", return_value=conn_mock):
            res = client.post(
                "/loans/20/payments",
                json={"customer_id": 1, "payment_amount": "500.00"},
            )
        assert res.status_code == 400
        assert "balance" in res.json()["detail"].lower()

    def test_insert_payment_exceeds_loan_balance(self):
        conn_mock, _ = self._make_conn(200.00, 5000.00)
        with patch("app.main.get_connection", return_value=conn_mock):
            res = client.post(
                "/loans/20/payments",
                json={"customer_id": 1, "payment_amount": "500.00"},
            )
        assert res.status_code == 400
        assert "exceed" in res.json()["detail"].lower()

    def test_insert_payment_on_inactive_loan_rejected(self):
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

    def test_insert_payment_updates_customer_balance(self):
        """After a successful payment the customer balance decreases by payment_amount."""
        conn_mock, cursor_mock = self._make_conn(8000.00, 4100.00)
        cursor_mock.lastrowid = 52

        with patch("app.main.get_connection", return_value=conn_mock):
            res = client.post(
                "/loans/20/payments",
                json={"customer_id": 1, "payment_amount": "800.00"},
            )
        assert res.status_code == 200
        assert float(res.json()["new_customer_balance"]) == pytest.approx(3300.00)
        assert float(res.json()["new_loan_balance"]) == pytest.approx(7200.00)


# ===========================================================================
# Payments – READ
# ===========================================================================


class TestPaymentRead:
    def test_get_all_payments(self):
        payment_with_names = {
            **MOCK_PAYMENT,
            "customer_first_name": "Alice",
            "customer_last_name": "Smith",
            "loan_current_balance": Decimal("4000.00"),
        }
        with patch("app.main.fetch_all", return_value=[payment_with_names]):
            res = client.get("/payments")
        assert res.status_code == 200
        data = res.json()
        assert len(data) == 1
        assert data[0]["payment_id"] == 50

    def test_get_payment_by_id(self):
        with patch("app.main.fetch_one", return_value=MOCK_PAYMENT):
            res = client.get("/payments/50")
        assert res.status_code == 200
        assert res.json()["payment_id"] == 50
        assert float(res.json()["payment_amount"]) == 500.00

    def test_get_payment_not_found(self):
        with patch("app.main.fetch_one", return_value=None):
            res = client.get("/payments/999")
        assert res.status_code == 404
