DROP DATABASE IF EXISTS loaning_system;
CREATE DATABASE loaning_system;
USE loaning_system;

CREATE TABLE Customers (
    customer_id INT AUTO_INCREMENT PRIMARY KEY,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    phone VARCHAR(20),
    home_address VARCHAR(100),
    balance DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    salary DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    credit_score INT NOT NULL,
    hashed_password VARCHAR(255) NOT NULL,

    CHECK(balance >= 0),
    CHECK(salary >= 0),
    CHECK(credit_score BETWEEN 300 AND 850)
);

CREATE TABLE Employees (
    employee_id INT AUTO_INCREMENT PRIMARY KEY,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    phone VARCHAR(20),
    home_address VARCHAR(100),
    hashed_password VARCHAR(255) NOT NULL
);

CREATE TABLE LoanApplications(
    application_id INT AUTO_INCREMENT PRIMARY KEY,
    customer_id INT NOT NULL,
    requested_amount DECIMAL(12,2) NOT NULL,
    interest_rate DECIMAL(5,2) NOT NULL,
    term_months INT NOT NULL,
    application_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    status ENUM('pending', 'approved', 'denied') NOT NULL DEFAULT 'pending',
    reviewed_by INT,
    reviewed_at DATETIME,
    denial_reason VARCHAR(255),

    FOREIGN KEY (customer_id) REFERENCES Customers(customer_id),
    FOREIGN KEY (reviewed_by) REFERENCES Employees(employee_id),

    CHECK (requested_amount > 0),
    CHECK (interest_rate >= 0),
    CHECK (term_months > 0)
);

CREATE TABLE Loans(
    loan_id INT AUTO_INCREMENT PRIMARY KEY,
    application_id INT NOT NULL UNIQUE,
    customer_id INT NOT NULL,
    initial_balance DECIMAL(12, 2) NOT NULL,
    current_balance DECIMAL(12, 2) NOT NULL,
    interest_rate DECIMAL(5, 2) NOT NULL,
    loan_start_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    status ENUM('active', 'paid_off') NOT NULL DEFAULT 'active',

    FOREIGN KEY (application_id) REFERENCES LoanApplications(application_id),
    FOREIGN KEY (customer_id) REFERENCES Customers(customer_id),
    
    CHECK (initial_balance > 0),
    CHECK (current_balance >= 0),
    CHECK (interest_rate >= 0)
);

CREATE TABLE Payments(
    payment_id INT AUTO_INCREMENT PRIMARY KEY,
    loan_id INT NOT NULL,
    customer_id INT NOT NULL,
    payment_amount DECIMAL(12, 2) NOT NULL,
    payment_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (loan_id) REFERENCES Loans(loan_id),
    FOREIGN KEY (customer_id) REFERENCES Customers(customer_id),


    CHECK (payment_amount > 0)
);

CREATE INDEX idx_loan_applications_customer_id ON LoanApplications(customer_id);
CREATE INDEX idx_loan_applications_status ON LoanApplications(status);
CREATE INDEX idx_loans_customer_id ON Loans(customer_id);
CREATE INDEX idx_payments_loan_id ON Payments(loan_id);
CREATE INDEX idx_payments_customer_id ON Payments(customer_id);