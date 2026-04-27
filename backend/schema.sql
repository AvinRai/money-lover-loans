DROP DATABASE IF EXISTS loaning_system;
CREATE DATABASE loaning_system;
USE loaning_system;

CREATE TABLE Customers (
    customer_id INT AUTO_INCREMENT PRIMARY KEY,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    email VARCHAR(50) NOT NULL UNIQUE,
    phone VARCHAR(10),
    home_address VARCHAR(100),
    balance DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    salary DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    credit_score INT NOT NULL,
    approved_loans INT NOT NULL DEFAULT 0,
    loan_applications INT NOT NULL DEFAULT 0,
    total_debt DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    hashed_password VARCHAR(255) NOT NULL,

    CHECK(balance >= 0),
    CHECK(salary >= 0),
    CHECK(credit_score BETWEEN 300 AND 850)
);