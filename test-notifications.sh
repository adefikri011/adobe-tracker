#!/bin/bash

# Simple notification testing script
# Usage: bash test-notifications.sh

DOMAIN="https://metricstock.com"
API_URL="$DOMAIN/api/admin/test-notification"

echo "🚀 Starting Notification Tests..."
echo "================================"
echo ""

# Test 1 - SALE
echo "1️⃣ Testing SALE Notification..."
curl -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "sale",
    "title": "New Sale",
    "message": "john@example.com upgraded to Pro - 30 Days"
  }' \
  -s | jq . 2>/dev/null || echo "Response received"

echo ""
echo "✅ Sale notification sent"
echo "⏳ Wait 2 seconds..."
sleep 2

# Test 2 - ERROR
echo ""
echo "2️⃣ Testing ERROR Notification..."
curl -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "error",
    "title": "API Error",
    "message": "Adobe Stock API rate limit reached. Auto-switched to cache."
  }' \
  -s | jq . 2>/dev/null || echo "Response received"

echo ""
echo "✅ Error notification sent"
echo "⏳ Wait 2 seconds..."
sleep 2

# Test 3 - INFO
echo ""
echo "3️⃣ Testing INFO Notification..."
curl -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "info",
    "title": "System Update",
    "message": "Cache database successfully synced. 756 assets updated."
  }' \
  -s | jq . 2>/dev/null || echo "Response received"

echo ""
echo "✅ Info notification sent"
echo ""
echo "================================"
echo "✨ All tests sent! Check:"
echo ""
echo "📧 Email: fikriade257@gmail.com"
echo "   (Email should arrive in 1-2 minutes)"
echo ""
echo "🌐 Dashboard: $DOMAIN/admin/notifications"
echo "   (Notifications should appear immediately)"
echo ""
echo "================================"
