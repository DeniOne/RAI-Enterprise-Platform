param()

$required = @("PGHOST","PGPORT","PGDATABASE","PGUSER","PGPASSWORD")
$missing = @()
foreach ($k in $required) {
  $val = [System.Environment]::GetEnvironmentVariable($k)
  if (-not $val) { $missing += $k }
}

if ($missing.Count -gt 0) {
  Write-Host "Missing env vars: $($missing -join ', ')"
  exit 1
}

$id = [guid]::NewGuid().ToString()
$vector = "[0.1,0.2,0.3]"
$metadata = "{`"trace_id`":`"smoke-$id`",`"note`":`"pgvector smoke test`"}"

Write-Host "PGVECTOR SMOKE TEST"
Write-Host "PGHOST=$([System.Environment]::GetEnvironmentVariable('PGHOST')) PGPORT=$([System.Environment]::GetEnvironmentVariable('PGPORT')) PGDATABASE=$([System.Environment]::GetEnvironmentVariable('PGDATABASE')) PGUSER=$([System.Environment]::GetEnvironmentVariable('PGUSER'))"
Write-Host "ID=$id"

$sql = @"
\echo 'STEP: CREATE EXTENSION'
CREATE EXTENSION IF NOT EXISTS vector;
\echo 'STEP: CREATE TABLE'
CREATE TABLE IF NOT EXISTS vector_smoke_test (
  id UUID PRIMARY KEY,
  embedding VECTOR(3),
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);
\echo 'STEP: INSERT'
INSERT INTO vector_smoke_test (id, embedding, metadata)
VALUES ('$id', '$vector', '$metadata');
\echo 'STEP: SELECT'
SELECT id, embedding, metadata, created_at FROM vector_smoke_test WHERE id = '$id';
"@

$sql | psql -v ON_ERROR_STOP=1 -h $env:PGHOST -p $env:PGPORT -d $env:PGDATABASE -U $env:PGUSER
