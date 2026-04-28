USE loaning_system;

INSERT INTO customers
(first_name, last_name, email, phone, home_address, balance, salary, credit_score, approved_loans, loan_applications, total_debt, hashed_password)
VALUES
('Avin', 'Rai', 'avinrai7@gmail.com', '650-439-4804', 'Sunnyvale, CA', 10.00, 850, 3, 4, 10.00, 'hashed123'),
('Franklin', 'Du', 'franklinydu@gmail.com', '123-456-7890', 'San Jose, CA', 2.00, 300, 0, 10, 10000.00, 'hashed123');

INSERT INTO employees
(first_name, last_name, email, phone, home_address, hashed_password