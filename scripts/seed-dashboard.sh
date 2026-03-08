#!/usr/bin/env bash
# Seed the database with sample data for a fulfilled dashboard.
# Run from backend/: ./scripts/seed-dashboard.sh
# Requires: curl, API at http://localhost:8000 (or set API_URL)
# Users must already exist: admin (anuj@gmail.com), manager, technician, tenant.

set -e
API_URL="${API_URL:-http://localhost:8000}"

echo "=== Seeding dashboard data (API: $API_URL) ==="

# 1. Login as Admin and get token
echo "1. Logging in as Admin..."
ADMIN_LOGIN=$(curl -sS -X POST "$API_URL/api/v1/users/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"anuj@gmail.com","password":"password123"}')
ADMIN_TOKEN=$(echo "$ADMIN_LOGIN" | grep -o '"accessToken":"[^"]*"' | cut -d'"' -f4)
if [ -z "$ADMIN_TOKEN" ]; then
  echo "Failed to get admin token. Login response: $ADMIN_LOGIN"
  exit 1
fi
echo "  Admin token obtained."

# 2. Create or get properties (Admin only)
echo "2. Creating/getting properties..."
PROP1=$(curl -sS -X POST "$API_URL/api/v1/properties" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{"name":"Sunset Apartments","address":"123 Sunset Blvd, Los Angeles, CA 90028"}')
PROP1_ID=$(echo "$PROP1" | grep -oE '"id":"[a-f0-9-]{36}"' | head -1 | cut -d'"' -f4)

if [ -z "$PROP1_ID" ]; then
  echo "  Property 1 exists, fetching..."
  PROPS=$(curl -sS -X GET "$API_URL/api/v1/properties" \
    -H "Authorization: Bearer $ADMIN_TOKEN")
  PROP1_ID=$(echo "$PROPS" | grep -oE '"id":"[a-f0-9-]{36}"' | head -1 | cut -d'"' -f4)
fi

PROP2=$(curl -sS -X POST "$API_URL/api/v1/properties" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{"name":"Downtown Tower","address":"456 Main St, San Francisco, CA 94102"}')
PROP2_ID=$(echo "$PROP2" | grep -oE '"id":"[a-f0-9-]{36}"' | head -1 | cut -d'"' -f4)
if [ -z "$PROP2_ID" ]; then
  PROPS=$(curl -sS -X GET "$API_URL/api/v1/properties" \
    -H "Authorization: Bearer $ADMIN_TOKEN")
  PROP2_ID=$(echo "$PROPS" | grep -oE '"id":"[a-f0-9-]{36}"' | head -2 | tail -1 | cut -d'"' -f4)
fi

if [ -z "$PROP1_ID" ]; then
  echo "Failed to get property. Response: $PROP1"
  exit 1
fi
echo "  Properties: $PROP1_ID, $PROP2_ID"

# 3. Get Manager, Technician user IDs (filter by role)
echo "3. Getting user IDs by role..."
MGR_USERS=$(curl -sS -X GET "$API_URL/api/v1/users/users?role=MANAGER" \
  -H "Authorization: Bearer $ADMIN_TOKEN")
MANAGER_ID=$(echo "$MGR_USERS" | grep -oE '"id":"[a-f0-9-]{36}"' | head -1 | sed 's/"id":"\(.*\)"/\1/')
TECH_USERS=$(curl -sS -X GET "$API_URL/api/v1/users/users?role=TECHNICIAN" \
  -H "Authorization: Bearer $ADMIN_TOKEN")
TECH_ID=$(echo "$TECH_USERS" | grep -oE '"id":"[a-f0-9-]{36}"' | head -1 | sed 's/"id":"\(.*\)"/\1/')
echo "  Manager: $MANAGER_ID, Technician: $TECH_ID"

# 4. Assign Manager to properties
echo "4. Assigning Manager to properties..."
curl -sS -X POST "$API_URL/api/v1/properties/$PROP1_ID/assign-manager" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d "{\"managerId\":\"$MANAGER_ID\"}" || true
curl -sS -X POST "$API_URL/api/v1/properties/$PROP2_ID/assign-manager" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d "{\"managerId\":\"$MANAGER_ID\"}" || true

# 5. Create units (Admin or Manager - use admin)
echo "5. Creating units..."
curl -sS -X POST "$API_URL/api/v1/properties/$PROP1_ID/units" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{"unitNumber":"101","floor":1}' || true
curl -sS -X POST "$API_URL/api/v1/properties/$PROP1_ID/units" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{"unitNumber":"102","floor":1}' || true
curl -sS -X POST "$API_URL/api/v1/properties/$PROP1_ID/units" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{"unitNumber":"201","floor":2}' || true

# 5b. Assign tenant to unit 101 (enables Report Issue form and Occupancy)
echo "5b. Assigning tenant to unit 101..."
TENANT_USERS=$(curl -sS -X GET "$API_URL/api/v1/users/users?role=TENANT" \
  -H "Authorization: Bearer $ADMIN_TOKEN")
TENANT_ID=$(echo "$TENANT_USERS" | grep -oE '"id":"[a-f0-9-]{36}"' | head -1 | cut -d'"' -f4)
PROP_DETAIL=$(curl -sS -X GET "$API_URL/api/v1/properties/$PROP1_ID" \
  -H "Authorization: Bearer $ADMIN_TOKEN")
_SEED_TMP=$(mktemp)
echo "$PROP_DETAIL" > "$_SEED_TMP"
UNIT101_ID=$(node -e "
  try {
    const d = require('fs').readFileSync(process.argv[1], 'utf8');
    const u = (JSON.parse(d).units || []).find(x => x.unitNumber === '101');
    console.log(u ? u.id : '');
  } catch (_) { console.log(''); }
" "$_SEED_TMP" 2>/dev/null)
rm -f "$_SEED_TMP"
if [ -n "$TENANT_ID" ] && [ -n "$UNIT101_ID" ]; then
  curl -sS -X PATCH "$API_URL/api/v1/properties/$PROP1_ID/units/$UNIT101_ID" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $ADMIN_TOKEN" \
    -d "{\"tenantId\":\"$TENANT_ID\"}" || true
  echo "  Tenant assigned to unit 101"
else
  echo "  (Could not assign tenant - TENANT_ID or UNIT101_ID missing)"
fi

# 6. Login as Tenant and create tickets
echo "6. Creating tickets (as Tenant)..."
TENANT_LOGIN=$(curl -sS -X POST "$API_URL/api/v1/users/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"tenant@example.com","password":"password123"}')
TENANT_TOKEN=$(echo "$TENANT_LOGIN" | grep -o '"accessToken":"[^"]*"' | cut -d'"' -f4)

curl -sS -X POST "$API_URL/api/v1/tickets" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TENANT_TOKEN" \
  -d "{\"title\":\"Leaking faucet in kitchen\",\"description\":\"The kitchen faucet has been leaking for 2 days. Please fix soon.\",\"priority\":\"MEDIUM\",\"propertyId\":\"$PROP1_ID\",\"unit\":\"101\"}" || true

curl -sS -X POST "$API_URL/api/v1/tickets" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TENANT_TOKEN" \
  -d "{\"title\":\"Broken heating in bedroom\",\"description\":\"Heater not working in the master bedroom during cold nights.\",\"priority\":\"HIGH\",\"propertyId\":\"$PROP1_ID\",\"unit\":\"101\"}" || true

curl -sS -X POST "$API_URL/api/v1/tickets" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TENANT_TOKEN" \
  -d "{\"title\":\"Elevator noise\",\"description\":\"Loud grinding sound when elevator runs. Needs inspection.\",\"priority\":\"LOW\",\"propertyId\":\"$PROP1_ID\",\"unit\":\"102\"}" || true

# 7. Get ticket IDs and assign to technician (as Manager)
echo "7. Assigning tickets to Technician (as Manager)..."
MGR_LOGIN=$(curl -sS -X POST "$API_URL/api/v1/users/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"manager@example.com","password":"password123"}')
MGR_TOKEN=$(echo "$MGR_LOGIN" | grep -o '"accessToken":"[^"]*"' | cut -d'"' -f4)

TICKETS=$(curl -sS -X GET "$API_URL/api/v1/tickets" \
  -H "Authorization: Bearer $MGR_TOKEN")
# Get first ticket ID
TICKET_ID=$(echo "$TICKETS" | grep -oE '[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}' | head -1)
if [ -n "$TICKET_ID" ] && [ -n "$TECH_ID" ]; then
  curl -sS -X PATCH "$API_URL/api/v1/tickets/$TICKET_ID/assign" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $MGR_TOKEN" \
    -d "{\"technicianId\":\"$TECH_ID\"}" || true
fi

echo ""
echo "=== Seed complete! ==="
echo "Login at http://localhost:3000/login with:"
echo "  Admin:      anuj@gmail.com / password123"
echo "  Manager:    manager@example.com / password123"
echo "  Technician: tech@example.com / password123"
echo "  Tenant:     tenant@example.com / password123"
