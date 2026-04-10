# Cleanup & Market Insights Setup Guide

## 📋 Overview

### Dual Data Management Strategy:
- **Market Insights** (RapidAPI): Global trending assets, market data
- **Earnings Tracker** (Apify): Personal contributor earnings
- **Cleanup System**: Automatic removal of unpopular assets

---

## 🚀 Quick Start

### 1. Setup Environment Variables

Add to `.env.local`:

```env
# RapidAPI Market Insights
RAPIDAPI_KEY=your-key-from-rapidapi
RAPIDAPI_HOST=adobe-stock2.p.rapidapi.com

# Cleanup protection
CLEANUP_SECRET_TOKEN=generate-with-openssl-rand-hex-32
```

Generate CLEANUP_SECRET_TOKEN:
```bash
openssl rand -hex 32
```

### 2. Run Database Migration

```bash
npx prisma migrate dev --name "add_cleanup_settings_and_market_insights"
```

### 3. Configure via Admin Panel

Go to: `http://localhost:3000/admin/settings/cleanup`

Set:
- Cleanup frequency (1, 7, 14, 30 days)
- Keep percentage (50-95%)
- Min download threshold

---

## 📊 API Endpoints

### Market Insights Search

**GET** `/api/market-insights/search`

Query parameters:
- `type` - "trending", "category", "keywords" (default: "trending")
- `category` - Category name (default: "nature")
- `query` - Custom search query
- `limit` - Max results (default: 50, max: 200)

Example:
```bash
curl "http://localhost:3000/api/market-insights/search?type=trending&limit=50"
```

Response:
```json
{
  "success": true,
  "data": {
    "type": "trending",
    "assets": [...],
    "totalCount": 50,
    "timestamp": "2026-04-10T10:00:00Z"
  },
  "source": "cache",
  "cachedAt": "...",
  "expiresAt": "..."
}
```

### Cleanup Management

**GET** `/api/admin/cleanup`

Check cleanup schedule:
```bash
curl -H "x-cleanup-token: YOUR_TOKEN" \
  "http://localhost:3000/api/admin/cleanup"
```

Response:
```json
{
  "success": true,
  "data": {
    "lastCleanupAt": "2026-04-09T10:00:00Z",
    "nextCleanupAt": "2026-04-16T10:00:00Z",
    "cleanupFrequencyDays": 7,
    "keepPercentage": 70,
    "minDownloadThreshold": 5,
    "daysUntilNextCleanup": 6,
    "timeTillNextCleanup": 518400000
  }
}
```

**POST** `/api/admin/cleanup`

Trigger cleanup manually:
```bash
curl -X POST \
  -H "x-cleanup-token: YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"force": true}' \
  "http://localhost:3000/api/admin/cleanup"
```

Response:
```json
{
  "success": true,
  "data": {
    "executed": true,
    "deleted": 1250,
    "kept": 2750,
    "nextCleanupDate": "2026-04-17T10:00:00Z"
  }
}
```

### Cleanup Settings Update

**PATCH** `/api/admin/settings/cleanup`

```bash
curl -X PATCH \
  -H "Content-Type: application/json" \
  -d '{
    "cleanupFrequencyDays": 14,
    "keepPercentage": 75,
    "minDownloadThreshold": 10
  }' \
  "http://localhost:3000/api/admin/settings/cleanup"
```

---

## ⚙️ Cleanup Strategy Details

### How It Works:

1. **Schedule Check**: Every API call checks if cleanup is due
2. **Calculate Deletion**: Fetches all assets sorted by downloads
3. **Keep Popular**: Keeps top X% of assets by downloads
4. **Delete Unpopular**: Removes bottom (100-X)% of assets
5. **Update Timestamp**: Records `lastCleanupAt` for next schedule

### Example Calculation:

```
Total Assets: 10,000
Keep Percentage: 70%
Assets to Keep: 7,000 (top 70% popular)
Assets to Delete: 3,000 (bottom 30% unpopular)
Min Download Threshold: 5 downloads

Deletion Strategy:
1. Get all assets sorted by downloads (DESC)
2. Keep assets ranked 1-7,000 (most downloads first)
3. For assets ranked 7,001-10,000, check if downloads >= 5
   - If YES: Keep anyway (protected by threshold)
   - If NO: Delete permanently
```

---

## 🔄 Automation Setup

### Option 1: External Cron (Recommended)

Set up a cron job to call cleanup API:

```bash
# In system crontab (runs daily at 2 AM)
0 2 * * * curl -X POST \
  -H "x-cleanup-token: YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"force": false}' \
  "https://yourapp.com/api/admin/cleanup"
```

### Option 2: GitHub Actions

Create `.github/workflows/cleanup.yml`:

```yaml
name: Daily Cleanup

on:
  schedule:
    - cron: '0 2 * * *'  # Daily at 2 AM UTC

jobs:
  cleanup:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger cleanup
        run: |
          curl -X POST \
            -H "x-cleanup-token: ${{ secrets.CLEANUP_SECRET_TOKEN }}" \
            -H "Content-Type: application/json" \
            -d '{"force": false}' \
            "${{ secrets.APP_URL }}/api/admin/cleanup"
```

### Option 3: Vercel Cron (Built-in)

No extra setup needed! Vercel will call `/api/crons/cleanup` automatically.

Create `app/api/crons/cleanup/route.ts`:

```typescript
import { cleanupUnpopularAssets } from "@/lib/cleanup-service";

export async function GET(request: Request) {
  // Verify Vercel cron secret
  if (request.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  const result = await cleanupUnpopularAssets();
  return Response.json(result);
}
```

Then in `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/crons/cleanup",
      "schedule": "0 2 * * *"
    }
  ]
}
```

---

## 📈 Monitoring

### Check Current Status:

```bash
curl -H "x-cleanup-token: YOUR_TOKEN" \
  "http://localhost:3000/api/admin/cleanup"
```

### Monitor via Admin Panel:

Visit: `/admin/settings/cleanup`
- See last cleanup date
- See next scheduled cleanup
- View current settings
- Manually trigger cleanup

### Database Query:

```sql
-- Check assets that will be deleted next
SELECT id, title, downloads
FROM "Asset"
ORDER BY downloads ASC
LIMIT (
  SELECT COUNT(*) - (COUNT(*) * keep_percentage / 100)
  FROM "Asset"
  CROSS JOIN "AppSettings"
);
```

---

## ⚠️ Important Notes

### Before First Cleanup:
- Ensure you have backups!
- Set `keepPercentage` conservatively (70% = 30% deletion risk)
- Test with `force: true` manually first

### Storage Estimate:
```
Assume: 1 asset ≈ 5 KB metadata
10,000 assets ≈ 50 MB
After 30% cleanup: ≈ 35 MB saved
```

### Performance Impact:
- Cleanup takes ~5-10 seconds for 10,000 assets
- Safe to run during off-peak hours
- Recommended: Run at 2 AM UTC

---

## 🎯 Best Practices

1. **Start Conservative**: Keep 80% first, reduce gradually
2. **Monitor Results**: Check if important assets are being deleted
3. **Set Threshold**: Protect assets with minimum downloads
4. **Regular Schedule**: Weekly or biweekly is recommended
5. **Test First**: Run on staging environment first

---

## 📚 Related Docs

- [RapidAPI Adobe Stock API](https://rapidapi.com/wireapi/api/adobe-stock)
- [Apify earnings scraping](../../APIFY_SETUP.md)
- [Database schema](../../prisma/schema.prisma)

---

Generated: 2026-04-10
