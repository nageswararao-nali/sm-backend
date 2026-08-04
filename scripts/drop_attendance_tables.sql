-- Drop tables for the removed "attendance" (Atd) app and its scan/barcode
-- proof-of-scan feature.
--
-- These tables are ORPHANED as of the code cleanup that removed:
--   - src/atd/ (AtdModule: companies, branches, vehicles)
--   - src/users/{models,controllers,services}/atd*.ts (attendance users, DA data
--     per courier partner, payouts, roster, shifts, leaves, notifications)
--   - src/scan/ and src/barcode/ (barcode-scan proof tied to attendance users)
--
-- NOT run automatically. Review before executing, and take a DB snapshot/backup
-- first — this is destructive and cannot be undone.
--
-- Run manually, e.g.:
--   psql "$POSTGRES_CONNECTION_STRING" -f scripts/drop_attendance_tables.sql

BEGIN;

-- Barcode/Scan tables reference atd_users via FK, and TypeORM's default
-- naming strategy keeps the entity class name verbatim (quoted, mixed case)
-- when no explicit @Entity('name') is given. Verify the actual names first
-- with: \dt in psql, or:
--   select table_name from information_schema.tables where table_schema='public';
DROP TABLE IF EXISTS "Barcode" CASCADE;
DROP TABLE IF EXISTS "Scan" CASCADE;

-- Core attendance (Atd) tables
DROP TABLE IF EXISTS atd_roster_details CASCADE;
DROP TABLE IF EXISTS atd_roster CASCADE;
DROP TABLE IF EXISTS atd_shifts CASCADE;
DROP TABLE IF EXISTS atd_user_leaves CASCADE;
DROP TABLE IF EXISTS atd_user_transactions CASCADE;
DROP TABLE IF EXISTS atd_notifications CASCADE;
DROP TABLE IF EXISTS atd_user_logins CASCADE;

-- Per-courier-partner delivery-associate (DA) data tables
DROP TABLE IF EXISTS atd_amazon_blocks CASCADE;
DROP TABLE IF EXISTS atd_amazon_da_rates CASCADE;
DROP TABLE IF EXISTS atd_amazon_da_data CASCADE;
DROP TABLE IF EXISTS atd_flipkart_da_data CASCADE;
DROP TABLE IF EXISTS atd_bluedart_da_data CASCADE;
DROP TABLE IF EXISTS atd_ikea_da_data CASCADE;
DROP TABLE IF EXISTS atd_da_id_details CASCADE;
DROP TABLE IF EXISTS atd_da_details CASCADE;

-- Attendance users themselves (drop after everything that references them)
DROP TABLE IF EXISTS atd_vehicles CASCADE;
DROP TABLE IF EXISTS atd_users CASCADE;

-- Company/branch structure for the attendance app
DROP TABLE IF EXISTS atd_branches CASCADE;
DROP TABLE IF EXISTS atd_companies CASCADE;

COMMIT;
