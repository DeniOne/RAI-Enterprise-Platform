-- Step 2: use enum value after previous migration commit
ALTER TABLE "accounts" ALTER COLUMN "type" SET DEFAULT 'NOT_SET';

-- Historical cleanup: records previously forced to CLIENT become NOT_SET
UPDATE "accounts"
SET "type" = 'NOT_SET'
WHERE "type" = 'CLIENT';
