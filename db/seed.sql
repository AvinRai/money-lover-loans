USE loaning_system;

INSERT INTO customers
(first_name, last_name, email, phone, home_address, balance, salary, credit_score, approved_loans, loan_applications, total_debt, hashed_password)
VALUES
('Avin', 'Rai', 'avinrai7@gmail.com', '650-439-4804', 'Sunnyvale, CA', 1000.00, 100.00, 850, 1, 1, 10.00, 'avin123'),
('Franklin', 'Du', 'franklinydu@gmail.com', '123-456-7890', 'San Jose, CA', 2.00, 1.00, 300, 0, 1, 10000.00, 'frank123');

INSERT INTO employees
(first_name, last_name, email, phone, home_address, hashed_password)
VALUES
('Richard', 'Ho', 'richardho@gmail.com', '000-000-0000', 'Foster City, CA', 'richard123'),
('Scott', 'Du', 'scottdu@gmail.com', '111-111-1111', 'Vietnam', 'scott123');

INSERT INTO LoanApplications
(customer_id, requested_amount, interest_rate, term_months, application_date, status, reviewed_by, reviewed_at, denial_reason)
VALUES
(1, 100, 3, 12, '2026-03-25', 'approved', 1, '2026-03-26', 'N/A'),
(2, 2, 1, 24, '2026-03-26', 'denied', 2, '2026-03-27', 'Too broke');