# 📧 Resend Email Notification System - Testing Guide

## Setup Status ✅
- ✅ Resend API Key configured
- ✅ Admin email configured
- ✅ Email templates created
- ✅ Notification API routes created
- ✅ Email sending integrated

---

## Testing Steps 🧪

### 1. Buat Test Notification via Resend
curl -X POST http://localhost:3000/api/admin/test-notification \
  -H "Content-Type: application/json" \
  -d '{
    "type": "sale",
    "title": "New Sale",
    "message": "john@example.com upgraded to Pro - 30 Days"
  }'

### 2. Buat Error Notification
curl -X POST http://localhost:3000/api/admin/test-notification \
  -H "Content-Type: application/json" \
  -d '{
    "type": "error",
    "title": "API Error",
    "message": "Adobe Stock API rate limit reached. Auto-switched to cache."
  }'

### 3. Buat Info Notification
curl -X POST http://localhost:3000/api/admin/test-notification \
  -H "Content-Type: application/json" \
  -d '{
    "type": "info",
    "title": "System Update",
    "message": "Cache database successfully synced. 756 assets updated."
  }'

---

## Testing via UI ✅

### 1. Toggle Preferences (Harus Enabled untuk kirim email)
- Buka: http://localhost:3000/admin/notifications
- Pastikan toggle "Email Notifications" = ON
- Pastikan toggle sesuai type (New Sale, API Errors)

### 2. Check Notifications List
- List akan otomatis update dari database
- Toggle preferences akan disave ke database

### 3. Mark as Read / Delete
- Klik check button untuk mark as read
- Klik trash button untuk delete
- Semua akan tersync dengan database

---

## Email Sending Flow 📧

1. **POST /api/admin/notifications** 
   - Create notification di database
   - Check preferences
   - Auto-send email jika:
     - emailNotif = true AND
     - Type-specific preference enabled (saleNotif/errorNotif)

2. **Email Template**
   - Type: Sale → Green theme, shopping cart icon
   - Type: Error → Red theme, warning icon  
   - Type: Info → Blue theme, info icon

3. **Email Dikirim ke**
   - Admin email dari preferences
   - Default: fikriade257@gmail.com (dari .env.local)

---

## Environment Variables ⚙️

```
RESEND_API_KEY=re_bFsRHivr_CVG474F6usoufgF8jomNgrKY
RESEND_FROM_EMAIL=noreply@adobe-tracker.com
ADMIN_EMAIL=fikriade257@gmail.com
```

---

## API Endpoints 🔌

### Notifications
- `GET /api/admin/notifications` - Get all notifications
- `POST /api/admin/notifications` - Create notification (auto-email)
- `PUT /api/admin/notifications` - Mark as read
- `DELETE /api/admin/notifications` - Delete notification

### Preferences
- `GET /api/admin/notification-preferences` - Get preferences
- `PUT /api/admin/notification-preferences` - Update preferences

### Email
- `POST /api/admin/send-notification-email` - Send email (internal)
- `POST /api/admin/test-notification` - Test endpoint

---

## Troubleshooting 🔧

### Email tidak terkirim?
1. Check `.env.local` - pastikan RESEND_API_KEY valid
2. Check admin email valid
3. Check preferences toggle = ON
4. Buka browser dev console untuk error message

### Toggle tidak save?
1. Check Network tab di dev tools
2. Pastikan request ke `/api/admin/notification-preferences`
3. Check console untuk error message

### Test email error?
```bash
curl http://localhost:3000/api/admin/test-notification (tanpa payload)
```
Response akan show contoh format yang benar

---

## Database Schema 📊

### Notification
- id: String (cuid)
- type: NotificationType (sale | error | info)
- title: String
- message: String
- read: Boolean (default: false)
- sent: Boolean (default: false)
- sentAt: DateTime (nullable)
- createdAt: DateTime

### NotificationPreference
- id: String (singleton)
- emailNotif: Boolean (default: true)
- saleNotif: Boolean (default: true)
- errorNotif: Boolean (default: true)
- adminEmail: String
- updatedAt: DateTime

---

## Next Steps (Optional) 🚀

- [ ] Add email preview di dashboard
- [ ] Add retry mechanism untuk failed emails
- [ ] Add email log history
- [ ] Add webhook untuk external triggers
- [ ] Add scheduled notifications
