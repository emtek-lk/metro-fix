-- Removes the test and placeholder data from the development database and keeps the demo dataset
-- (see apps/api/src/common/demo-data.ts) plus the admin / dispatcher logins.
--
-- A backup was taken first: /var/opt/mssql/data/metrofix_before_demo_cleanup.bak (inside the db container).
-- Run from the repo root:
--   docker compose exec -T db /opt/mssql-tools18/bin/sqlcmd -C -S localhost -U sa -P 'YourPassword123!' -d metrofix_db -b < apps/api/scripts/cleanup-test-data.sql
SET XACT_ABORT ON;
BEGIN TRAN;

DECLARE @keep TABLE (email NVARCHAR(254) PRIMARY KEY);
INSERT INTO @keep (email) VALUES
  (N'admin@demo.local'),
  (N'admin@metro-fix.com'),
  (N'anjali.desilva@demo.local'),
  (N'asanka.jayasuriya@demo.local'),
  (N'chaminda.bandara@demo.local'),
  (N'dilshan.perera@demo.local'),
  (N'dispatch@demo.local'),
  (N'eleanor@skylinetowers.com'),
  (N'ibrahim.hussain@demo.local'),
  (N'ishara.ranasinghe@demo.local'),
  (N'kumari.wickramasinghe@demo.local'),
  (N'lakmal.herath@demo.local'),
  (N'marcus@residences.lk'),
  (N'mohamed.fazil@demo.local'),
  (N'mohamed.rizwan@demo.local'),
  (N'sachini.abeywickrama@demo.local'),
  (N'sampath.dissanayake@demo.local'),
  (N'shanika.rajapaksa@demo.local'),
  (N'sophia@industrialpark.com'),
  (N'tharindu.gunasekara@demo.local'),
  (N'thushara.mendis@demo.local'),
  (N'worker1@demo.local'),
  (N'worker2@demo.local');

DECLARE @titles TABLE (title NVARCHAR(400) PRIMARY KEY);
INSERT INTO @titles (title) VALUES
  (N'Chiller unit tripping on high pressure'),
  (N'Recurring tap leak in kitchen'),
  (N'Deep clean after tenant move-out'),
  (N'Quarterly fire alarm panel inspection'),
  (N'Generator failed to auto-start during outage'),
  (N'Switchboard overheating, burning smell'),
  (N'Lift stuck between floors (Block B)'),
  (N'Monthly pest control and sanitisation'),
  (N'Roof leaking into the third floor'),
  (N'Garden and landscaping maintenance'),
  (N'Server room AC not cooling'),
  (N'Replace faulty CCTV power supplies'),
  (N'Water leakage in basement car park'),
  (N'Replace corroded water pump'),
  (N'Fire extinguisher refill and tagging'),
  (N'Intermittent power trips on floor 5'),
  (N'Blocked drain in the staff canteen'),
  (N'Air conditioner not cooling in master bedroom'),
  (N'Deep clean ahead of the health inspection'),
  (N'Gate motor not responding'),
  (N'Emergency light batteries failed the test'),
  (N'Peeling paint and damp patch on the ceiling'),
  (N'Elevator door sensor misaligned'),
  (N'Rodent sighting in the storeroom'),
  (N'Noisy exhaust fan in the kitchen'),
  (N'Annual fire safety audit'),
  (N'Solar inverter showing fault code E02'),
  (N'Replace the reception carpet'),
  (N'Window cleaning, front shopfront');

-- 1. Jobs that are not part of the demo dataset.
DELETE FROM service_requests WHERE title NOT IN (SELECT title FROM @titles);

-- 2. Payments belonging to accounts that are about to go.
DELETE FROM subscription_payments WHERE customerId IN (
  SELECT c.id FROM customers c JOIN users u ON u.id = c.userId WHERE u.email NOT IN (SELECT email FROM @keep));

-- 3. Test accounts (customers and workers go with their user through the cascade, but be explicit).
DELETE FROM customers WHERE userId IN (SELECT id FROM users WHERE email NOT IN (SELECT email FROM @keep));
DELETE FROM workers   WHERE userId IN (SELECT id FROM users WHERE email NOT IN (SELECT email FROM @keep));
DELETE FROM users     WHERE email NOT IN (SELECT email FROM @keep);

COMMIT;

SELECT (SELECT COUNT(*) FROM users) AS users, (SELECT COUNT(*) FROM customers) AS customers,
       (SELECT COUNT(*) FROM workers) AS workers, (SELECT COUNT(*) FROM service_requests) AS jobs,
       (SELECT COUNT(*) FROM subscription_payments) AS payments;
