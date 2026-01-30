### PHASE 2 API VERIFICATION SCRIPT
# This script uses curl to test the new Store API endpoint.

# 1. SETUP: Create a Store Item and Wallet in DB (if not already there)
# Note: In production this would be handled by seeding or other services.

# 2. TEST: Valid Purchase Case
# Expected: 200/201 OK with purchase data.
curl -X POST http://localhost:3000/api/store/purchase \
  -H "Content-Type: application/json" \
  -H "Idempotency-Key: test-api-key-001" \
  -H "X-User-Id: user-success-test" \
  -d '{"itemId": "item-id-here"}'

# 3. TEST: Idempotency Check (Repeat same request)
# Expected: 200 OK with SAME purchase record (from cache).
curl -X POST http://localhost:3000/api/store/purchase \
  -H "Content-Type: application/json" \
  -H "Idempotency-Key: test-api-key-001" \
  -H "X-User-Id: user-success-test" \
  -d '{"itemId": "item-id-here"}'

# 4. TEST: Missing Idempotency Key
# Expected: 400 Bad Request
curl -X POST http://localhost:3000/api/store/purchase \
  -H "Content-Type: application/json" \
  -H "X-User-Id: user-success-test" \
  -d '{"itemId": "item-id-here"}'

# 5. TEST: Insufficient Funds (Create a user with 0 MC first)
# Expected: 402 Payment Required
curl -X POST http://localhost:3000/api/store/purchase \
  -H "Content-Type: application/json" \
  -H "Idempotency-Key: no-funds-key" \
  -H "X-User-Id: user-broke-test" \
  -d '{"itemId": "item-id-here"}'
