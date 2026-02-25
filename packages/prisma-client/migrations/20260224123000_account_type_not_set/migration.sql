-- Step 1: add enum value only (must be committed before usage)
ALTER TYPE "AccountType" ADD VALUE IF NOT EXISTS 'NOT_SET';
