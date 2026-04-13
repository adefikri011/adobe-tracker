# Manual User Suspend Feature

## Implementasi

### 1. **Endpoint Baru**: `/api/admin/suspend-user`
- **Method**: POST
- **Body**: `{ userId: string, durationMinutes: number }`
- **Fungsi**: 
  - Update `Profile.status` → "suspended"
  - Set `UserSession.suspendedUntil` dengan waktu expire
  - Clear `activeSessions` → disconnect semua device
  - Log activity ke database

### 2. **UI Changes** di `/app/admin/users/page.tsx`
- **Tombol Suspend**: Selalu muncul (conditional render)
  - Jika user `status === "suspended"` → tombol untuk UNLOCK (hijau)
  - Jika user `status === "active"` → tombol untuk SUSPEND (abu-abu, hover merah)
- **Suspend Modal**: Input durasi dengan detail
  - Days input (0-unlimited)
  - Hours input (0-23)
  - Minutes input (0-59)
  - Preview durasi total
  - Tombol "Suspend User" (warna merah)

### 3. **State Management**
```tsx
// Suspend confirm modal
const [suspendConfirmModal, setSuspendConfirmModal] = useState({ isOpen: false, userId: "" });
const [suspendDurationDays, setSuspendDurationDays] = useState(7);
const [suspendDurationHours, setSuspendDurationHours] = useState(0);
const [suspendDurationMinutes, setSuspendDurationMinutes] = useState(0);
const [isSuspendProcessing, setIsSuspendProcessing] = useState(false);
```

### 4. **Handler Functions**
- `handleSuspendClick(id)` - Buka modal suspend
- `handleConfirmSuspendAction()` - Kirim request suspend ke API

## Workflow Suspend/Unsuspend

### Suspend Manual (Admin)
1. Admin klik tombol Ban (abu-abu) pada user aktif
2. Modal muncul untuk input durasi
3. Admin set berapa lama (default 7 hari)
4. Admin klik "Suspend User"
5. API call ke `/api/admin/suspend-user`
6. User langsung ter-suspend, sessio hilang, device disconnect

### Unsuspend (Admin - Reverse)
1. Admin klik tombol Ban (merah) pada user ter-suspend
2. Confirmation modal muncul
3. Admin klik "Unlock User"
4. API call ke `/api/admin/unlock-user`
5. User kembali active, bisa login lagi

## Catatan Penting

✅ **Logic Aman**:
- Tidak memecah existing logic untuk unsuspend
- Suspend/unsuspend bersifat reversible
- Field `suspendedUntil` sudah ada di schema
- Activity log tercatat untuk audit trail

⚠️ **Khusus Suspend**:
- Default durasi 7 hari (bisa diubah di UI)
- Minimum 1 menit (tidak bisa 0 durasi)
- Jika durasi 0 → otomatis jadi 1 tahun (permanent-ish)
- Semua active sessions di-clear (device disconnect)
- Admin bisa lihat status per user di tabel

## Testing Checklist
- [ ] Tombol suspend muncul untuk user aktif
- [ ] Tombol unlock muncul untuk user ter-suspend
- [ ] Modal suspend bisa input durasi
- [ ] Suspend API bekerja → user status jadi "suspended"
- [ ] Unsuspend API bekerja → user status jadi "active"
- [ ] Activity log tercatat untuk suspend dan unsuspend
- [ ] Sessions clear saat suspend (device disconnect)
