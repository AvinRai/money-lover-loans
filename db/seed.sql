USE loaning_system;

-- =============================================================================
-- Customers (15 rows)
-- =============================================================================
INSERT INTO Customers
(first_name, last_name, email, phone, home_address, balance, salary, credit_score, hashed_password)
VALUES
('Alice',    'Smith',    'alice.smith@email.com',     '408-555-0101', '100 Maple St, San Jose, CA',          5000.00,  75000.00, 720, 'pass_alice'),
('Bob',      'Johnson',  'bob.johnson@email.com',     '650-555-0102', '200 Oak Ave, Palo Alto, CA',          3500.00,  95000.00, 740, 'pass_bob'),
('Carol',    'Davis',    'carol.davis@email.com',     '415-555-0103', '300 Pine Rd, San Francisco, CA',      8000.00, 120000.00, 780, 'pass_carol'),
('David',    'Wilson',   'david.wilson@email.com',    '510-555-0104', '400 Elm St, Oakland, CA',             1200.00,  55000.00, 650, 'pass_david'),
('Emma',     'Martinez', 'emma.martinez@email.com',   '510-555-0105', '500 Birch Ln, Fremont, CA',           2500.00,  68000.00, 690, 'pass_emma'),
('Frank',    'Thompson', 'frank.thompson@email.com',  '408-555-0106', '600 Cedar Dr, Sunnyvale, CA',         6000.00,  88000.00, 760, 'pass_frank'),
('Grace',    'Lee',      'grace.lee@email.com',       '408-555-0107', '700 Walnut Ct, Santa Clara, CA',      9500.00, 110000.00, 800, 'pass_grace'),
('Henry',    'Brown',    'henry.brown@email.com',     '408-555-0108', '800 Spruce Way, Milpitas, CA',        1800.00,  62000.00, 670, 'pass_henry'),
('Iris',     'Chen',     'iris.chen@email.com',       '408-555-0109', '900 Willow Ave, Cupertino, CA',       7200.00, 135000.00, 820, 'pass_iris'),
('James',    'Taylor',   'james.taylor@email.com',    '650-555-0110', '1010 Aspen Blvd, Mountain View, CA',  4100.00,  82000.00, 710, 'pass_james'),
('Karen',    'White',    'karen.white@email.com',     '650-555-0111', '1100 Cypress St, Redwood City, CA',   2900.00,  71000.00, 700, 'pass_karen'),
('Liam',     'Harris',   'liam.harris@email.com',     '650-555-0112', '1200 Magnolia Pl, Menlo Park, CA',   11000.00, 145000.00, 840, 'pass_liam'),
('Mia',      'Clark',    'mia.clark@email.com',       '650-555-0113', '1300 Sequoia Rd, Burlingame, CA',     3300.00,  79000.00, 730, 'pass_mia'),
('Noah',     'Lewis',    'noah.lewis@email.com',      '650-555-0114', '1400 Redwood Blvd, San Mateo, CA',    1500.00,  53000.00, 640, 'pass_noah'),
('Olivia',   'Robinson', 'olivia.robinson@email.com', '415-555-0115', '1500 Palm St, Daly City, CA',         4700.00,  86000.00, 750, 'pass_olivia');

-- =============================================================================
-- Employees (15 rows)
-- =============================================================================
INSERT INTO Employees
(first_name, last_name, email, phone, home_address, hashed_password)
VALUES
('Richard',  'Ho',        'richard.ho@loanserv.com',       '650-555-1001', 'Foster City, CA',    'emp_richard'),
('Scott',    'Du',        'scott.du@loanserv.com',          '408-555-1002', 'San Jose, CA',       'emp_scott'),
('Janet',    'Parker',    'janet.parker@loanserv.com',      '415-555-1003', 'San Francisco, CA',  'emp_janet'),
('Mark',     'Rodriguez', 'mark.rodriguez@loanserv.com',    '510-555-1004', 'Oakland, CA',        'emp_mark'),
('Susan',    'Kim',       'susan.kim@loanserv.com',         '408-555-1005', 'Sunnyvale, CA',      'emp_susan'),
('Tom',      'Anderson',  'tom.anderson@loanserv.com',      '650-555-1006', 'Palo Alto, CA',      'emp_tom'),
('Lisa',     'Nguyen',    'lisa.nguyen@loanserv.com',       '408-555-1007', 'Santa Clara, CA',    'emp_lisa'),
('Chris',    'Walker',    'chris.walker@loanserv.com',      '408-555-1008', 'Milpitas, CA',       'emp_chris'),
('Amy',      'Hall',      'amy.hall@loanserv.com',          '408-555-1009', 'Cupertino, CA',      'emp_amy'),
('Daniel',   'Young',     'daniel.young@loanserv.com',      '650-555-1010', 'Mountain View, CA',  'emp_daniel'),
('Patricia', 'Allen',     'patricia.allen@loanserv.com',    '650-555-1011', 'Redwood City, CA',   'emp_patricia'),
('Kevin',    'Wright',    'kevin.wright@loanserv.com',      '650-555-1012', 'Menlo Park, CA',     'emp_kevin'),
('Michelle', 'Hill',      'michelle.hill@loanserv.com',     '650-555-1013', 'Burlingame, CA',     'emp_michelle'),
('Robert',   'Scott',     'robert.scott@loanserv.com',      '650-555-1014', 'San Mateo, CA',      'emp_robert'),
('Jennifer', 'Adams',     'jennifer.adams@loanserv.com',    '415-555-1015', 'Daly City, CA',      'emp_jennifer');

-- =============================================================================
-- LoanApplications (15 rows — all approved so each can map to a Loan)
-- Each customer submits one application; a different employee reviews each one.
-- =============================================================================
INSERT INTO LoanApplications
(customer_id, requested_amount, interest_rate, term_months, application_date, status, reviewed_by, reviewed_at, denial_reason)
VALUES
( 1,  5000.00, 5.50, 36, '2026-01-03 09:00:00', 'approved',  1, '2026-01-04 10:00:00', NULL),
( 2, 10000.00, 4.75, 60, '2026-01-07 11:00:00', 'approved',  2, '2026-01-08 09:30:00', NULL),
( 3, 15000.00, 3.75, 60, '2026-01-10 14:00:00', 'approved',  3, '2026-01-11 11:00:00', NULL),
( 4,  3000.00, 7.50, 24, '2026-01-14 08:30:00', 'approved',  4, '2026-01-15 09:00:00', NULL),
( 5,  7500.00, 6.00, 48, '2026-01-17 10:00:00', 'approved',  5, '2026-01-18 10:30:00', NULL),
( 6, 12000.00, 4.25, 48, '2026-01-21 13:00:00', 'approved',  6, '2026-01-22 11:00:00', NULL),
( 7, 20000.00, 3.50, 84, '2026-01-25 09:00:00', 'approved',  7, '2026-01-26 10:00:00', NULL),
( 8,  4000.00, 8.00, 24, '2026-02-01 11:00:00', 'approved',  8, '2026-02-02 09:00:00', NULL),
( 9, 25000.00, 3.25, 120,'2026-02-05 10:00:00', 'approved',  9, '2026-02-06 10:00:00', NULL),
(10,  8000.00, 5.00, 36, '2026-02-10 14:00:00', 'approved', 10, '2026-02-11 09:30:00', NULL),
(11,  6000.00, 6.50, 36, '2026-02-14 09:00:00', 'approved', 11, '2026-02-15 10:00:00', NULL),
(12, 18000.00, 3.75, 72, '2026-02-18 11:00:00', 'approved', 12, '2026-02-19 10:30:00', NULL),
(13,  9000.00, 5.25, 48, '2026-03-01 10:00:00', 'approved', 13, '2026-03-02 09:00:00', NULL),
(14,  2500.00, 9.00, 12, '2026-03-05 09:30:00', 'approved', 14, '2026-03-06 09:00:00', NULL),
(15, 11000.00, 4.50, 60, '2026-03-10 13:00:00', 'approved', 15, '2026-03-11 10:00:00', NULL);

-- =============================================================================
-- Loans (15 rows — one per approved application)
-- current_balance reflects a single payment already made (see Payments below).
-- Loans 4, 8, 11, 14 are paid_off (payment covered the full balance).
-- =============================================================================
INSERT INTO Loans
(application_id, customer_id, initial_balance, current_balance, interest_rate, loan_start_date, status)
VALUES
( 1,  1,  5000.00,  4500.00, 5.50, '2026-01-04 10:00:00', 'active'),
( 2,  2, 10000.00,  9000.00, 4.75, '2026-01-08 09:30:00', 'active'),
( 3,  3, 15000.00, 13500.00, 3.75, '2026-01-11 11:00:00', 'active'),
( 4,  4,  3000.00,     0.00, 7.50, '2026-01-15 09:00:00', 'paid_off'),
( 5,  5,  7500.00,  7000.00, 6.00, '2026-01-18 10:30:00', 'active'),
( 6,  6, 12000.00, 10800.00, 4.25, '2026-01-22 11:00:00', 'active'),
( 7,  7, 20000.00, 18000.00, 3.50, '2026-01-26 10:00:00', 'active'),
( 8,  8,  4000.00,     0.00, 8.00, '2026-02-02 09:00:00', 'paid_off'),
( 9,  9, 25000.00, 22500.00, 3.25, '2026-02-06 10:00:00', 'active'),
(10, 10,  8000.00,  7200.00, 5.00, '2026-02-11 09:30:00', 'active'),
(11, 11,  6000.00,     0.00, 6.50, '2026-02-15 10:00:00', 'paid_off'),
(12, 12, 18000.00, 16200.00, 3.75, '2026-02-19 10:30:00', 'active'),
(13, 13,  9000.00,  8100.00, 5.25, '2026-03-02 09:00:00', 'active'),
(14, 14,  2500.00,     0.00, 9.00, '2026-03-06 09:00:00', 'paid_off'),
(15, 15, 11000.00,  9900.00, 4.50, '2026-03-11 10:00:00', 'active');

-- =============================================================================
-- Payments (15 rows — one payment per loan)
-- Each payment_amount is consistent with the difference between initial_balance
-- and current_balance in the Loans table above.
-- =============================================================================
INSERT INTO Payments
(loan_id, customer_id, payment_amount, payment_date)
VALUES
( 1,  1,   500.00, '2026-02-04 10:00:00'),
( 2,  2,  1000.00, '2026-02-08 09:30:00'),
( 3,  3,  1500.00, '2026-02-11 11:00:00'),
( 4,  4,  3000.00, '2026-02-15 09:00:00'),
( 5,  5,   500.00, '2026-02-18 10:30:00'),
( 6,  6,  1200.00, '2026-02-22 11:00:00'),
( 7,  7,  2000.00, '2026-02-26 10:00:00'),
( 8,  8,  4000.00, '2026-03-02 09:00:00'),
( 9,  9,  2500.00, '2026-03-06 10:00:00'),
(10, 10,   800.00, '2026-03-11 09:30:00'),
(11, 11,  6000.00, '2026-03-15 10:00:00'),
(12, 12,  1800.00, '2026-03-19 10:30:00'),
(13, 13,   900.00, '2026-04-02 09:00:00'),
(14, 14,  2500.00, '2026-04-06 09:00:00'),
(15, 15,  1100.00, '2026-04-11 10:00:00');
