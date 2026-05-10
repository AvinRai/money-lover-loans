-- Migration: make LoanApplications.reviewed_by nullable
-- Run this against your live loaning_system database to fix the FK error
-- that prevents new loan applications from being submitted.
--
-- Root cause: reviewed_by defaulted to 0 (FK to Employees), but MySQL
-- AUTO_INCREMENT never assigns 0, so no sentinel row existed. Every INSERT
-- into LoanApplications failed the FK constraint.

USE loaning_system;

-- 1. Drop the old FK (constraint name set by MySQL on creation)
ALTER TABLE LoanApplications DROP FOREIGN KEY loanapplications_ibfk_2;

-- 2. Allow NULL; pending applications will have reviewed_by = NULL
ALTER TABLE LoanApplications
    MODIFY reviewed_by  INT         DEFAULT NULL,
    MODIFY reviewed_at  DATETIME    DEFAULT NULL,
    MODIFY denial_reason VARCHAR(255) DEFAULT NULL;

-- 3. Repair any rows that have the bogus reviewed_by = 0
UPDATE LoanApplications SET reviewed_by = NULL, reviewed_at = NULL
WHERE reviewed_by = 0;

-- 4. Re-add the FK (NULL values are allowed and skip the FK check)
ALTER TABLE LoanApplications
    ADD CONSTRAINT fk_loan_app_reviewed_by
    FOREIGN KEY (reviewed_by) REFERENCES Employees(employee_id);
