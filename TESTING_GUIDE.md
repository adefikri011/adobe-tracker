# 🧪 Notification Testing Guide

## 2 Cara Testing

### **OPSI 1: Web UI (Browser) - PALING MUDAH** 🌐

**Step 1:** Buka link ini di browser:
```
https://metricstock.com/admin/test-notifications
```

**Step 2:** Pilih test yang mau dijalankan:
- 🚀 **Send All Tests** - Auto-test ketiga notifikasi sekaligus
- 🛍️ **Sale** - Test hanya sale notification
- ⚠️ **Error** - Test hanya error notification  
- ℹ️ **Info** - Test hanya info notification

**Step 3:** Lihat results di halaman (update real-time)

**Step 4:** Verifikasi:
- Check email: fikriade257@gmail.com (1-2 menit)
- Check dashboard: https://metricstock.com/admin/notifications
- Notifications harus muncul immediately

✅ **Keuntungan:**
- Tidak perlu terminal
- Visual UI yang friendly
- See results real-time
- Easy to understand

---

### **OPSI 2: Bash Script (Terminal) - UNTUK SERVER** 💻

**Step 1:** SSH ke server
```bash
ssh user@metricstock.com
```

**Step 2:** Navigate ke project folder
```bash
cd /path/to/adobe-tracker
```

**Step 3:** Run script (hanya 1 command!)
```bash
bash test-notifications.sh
```

**Step 4:** Script otomatis akan:
- Send 3 notifikasi (sale, error, info)
- Tunggu 2 detik antar request
- Show output untuk setiap test
- Print hasil summary

**Output Example:**
```
🚀 Starting Notification Tests...
================================

1️⃣ Testing SALE Notification...
✅ Sale notification sent
⏳ Wait 2 seconds...

2️⃣ Testing ERROR Notification...
✅ Error notification sent
⏳ Wait 2 seconds...

3️⃣ Testing INFO Notification...
✅ Info notification sent

================================
✨ All tests sent! Check:

📧 Email: fikriade257@gmail.com
   (Email should arrive in 1-2 minutes)

🌐 Dashboard: https://metricstock.com/admin/notifications
   (Notifications should appear immediately)

================================
```

✅ **Keuntungan:**
- Single command - very simple
- Automated - run 3 tests sekaligus
- Good for server testing
- Can be scheduled/automated

---

## 🔍 **Verifikasi Testing Berhasil**

### **✅ Check 1: Lihat di Dashboard**
```
https://metricstock.com/admin/notifications
→ Harus ada 3 notifikasi terbaru (sale, error, info)
→ Status harus "unread" (blue dot)
→ Icons & colors sesuai type
```

### **✅ Check 2: Lihat di Email**
```
Login: fikriade257@gmail.com
Email from: noreply@metricstock.com
Subject:
- "Adobe Tracker: New Sale" (Green)
- "Adobe Tracker: API Error" (Red)
- "Adobe Tracker: System Update" (Blue)
```

### **✅ Check 3: Lihat di Database**
```bash
# Connect ke database
psql postgresql://... 

# Query:
SELECT * FROM "Notification" ORDER BY "createdAt" DESC LIMIT 3;

# Lihat:
- 3 rows baru
- type = sale, error, info
- sent = true
- sentAt = ada value (bukan NULL)
```

### **✅ Check 4: Test Toggle Preferences**
```
Di Dashboard (/admin/notifications):
1. Toggle "Email Notifications" → OFF
2. Send test notification
3. Email NOT akan terkirim (tapi notifikasi tetap ada di DB)
4. Toggle balik → ON
5. Send test lagi
6. Email akan terkirim
→ Ini buktikan toggle berfungsi!
```

---

## 🛠️ **Troubleshooting**

### **Error: "bash: test-notifications.sh: No such file"**
```
✅ Solution:
1. Check file ada: ls -la test-notifications.sh
2. Make executable: chmod +x test-notifications.sh
3. Run: bash test-notifications.sh
```

### **Error: "curl: command not found"**
```
✅ Solution:
Linux: sudo apt-get install curl
Mac: brew install curl
```

### **Error: "404 Not Found" di API**
```
✅ Check:
1. App running? npm run dev atau pm2 start
2. API endpoint exist? /api/admin/test-notification
3. URL benar? https://metricstock.com
```

### **Email tidak terkirim**
```
✅ Check:
1. Preferences enabled? Toggle "Email Notifications" = ON
2. Dashboard show notification berhasil?
3. Check server logs for Resend errors
4. RESEND_API_KEY valid?
```

---

## 📋 **Quick Commands**

```bash
# Run bash script
bash test-notifications.sh

# Run with output
bash test-notifications.sh -v

# Test individual via curl
curl -X POST https://metricstock.com/api/admin/test-notification \
  -H "Content-Type: application/json" \
  -d '{"type":"sale","title":"New Sale","message":"test@example.com upgraded"}'
```

---

## 🎯 **Recommended Testing Flow**

1. **First Time Setup:**
   ```
   1. Open: https://metricstock.com/admin/test-notifications
   2. Click: "Send All Tests"
   3. Wait 2 minutes
   4. Check email inbox
   5. Verify notifications appear in dashboard
   → Jika semua OK = System berfungsi ✅
   ```

2. **Server Testing:**
   ```
   1. SSH ke server
   2. Run: bash test-notifications.sh
   3. Monitor dashboard for real-time updates
   4. Check email after 1-2 minutes
   → Jika berhasil = Ready untuk production ✅
   ```

3. **Periodic Testing:**
   ```
   1. Run script 1x per hari
   2. Verify email delivery
   3. Check database records
   → Ensure system tetap working ✅
   ```

---

## 📚 **Files Created**

| File | Location | Purpose |
|------|----------|---------|
| test-notifications.sh | `/project-root/` | Bash script untuk testing |
| test-notifications/page.tsx | `/app/admin/` | Web UI untuk testing |

---

## ✨ **Summary**

**Untuk testing mudah:**
- 🌐 Buka: https://metricstock.com/admin/test-notifications
- Klik tombol
- Done! ✅

**Untuk server testing:**
- 🖥️ SSH ke server
- Run: `bash test-notifications.sh`
- Done! ✅

---

**Siap test?** Gunakan salah satu cara di atas! 🚀
