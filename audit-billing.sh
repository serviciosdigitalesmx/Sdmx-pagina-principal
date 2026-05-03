#!/bin/bash

echo "🧠 AUDIT: Backend Billing & Access Flow"
echo "======================================"

BASE="apps/backend-api/src"

echo ""
echo "📍 1. SUBSCRIPTION / BILLING REFERENCES"
grep -Rni "subscription" $BASE

echo ""
echo "📍 2. BILLING GUARDS / BLOCKS"
grep -Rni "billing" $BASE

echo ""
echo "📍 3. ACCESS CONTROL FLAGS"
grep -Rni "accessGranted\|billing_exempt\|has_active\|trial" $BASE

echo ""
echo "📍 4. API ROUTING (ENTRY POINTS)"
grep -Rni "routes/api\|/api/" $BASE

echo ""
echo "📍 5. ERROR GATES (WHAT BLOCKS REQUESTS)"
grep -Rni "throw new Error\|return .*error\|SUBSCRIPTION" $BASE

echo ""
echo "📍 6. CONTEXT BUILD (TENANT RESOLUTION)"
grep -Rni "context" $BASE/services

echo ""
echo "📍 7. CUSTOMER FLOW TRACE"
grep -Rni "customers" $BASE

echo ""
echo "📍 DONE - SYSTEM MAPPED"
