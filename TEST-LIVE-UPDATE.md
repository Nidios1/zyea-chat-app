# 🧪 HƯỚNG DẪN TEST LIVE UPDATE

## ⚡ CÁCH TEST NHANH NHẤT (3 bước):

### Bước 1: Start Server

```bash
# Terminal 1
cd server
npm start
```

Đợi xuất hiện: `✅ Server running on http://localhost:5000`

---

### Bước 2: Start Client (trong terminal khác)

```bash
# Terminal 2  
cd client
npm start
```

Đợi app mở tại: `http://localhost:3000`

---

### Bước 3: Trigger Update Popup

**Cách 1: Thay đổi version trong code**

1. Mở file: `client/src/utils/liveUpdate.js`
2. Thay đổi:
```javascript
const CURRENT_VERSION = '0.9.0'; // Giảm xuống để trigger update
```

3. Save file
4. Refresh browser (F5)
5. **Popup sẽ hiện ngay!** ✨

**Cách 2: Test API trực tiếp**

Mở browser và vào:
```
http://192.168.0.102:5000/api/app/version
```

Bạn sẽ thấy JSON response:
```json
{
  "version": "1.0.0",
  "updateUrl": "http://192.168.0.102:5000/api/app/download/latest",
  "changeLog": "...",
  "mandatory": false
}
```

---

## 📱 TEST TRÊN IPA

### Bước 1: Cài IPA mới nhất

1. Download IPA từ GitHub Actions
2. Ký bằng ESign
3. Cài đặt lên iPhone

### Bước 2: Trigger update

**Option A: Tự động (đợi 30s)**
- Mở app
- Đợi 30 giây
- Popup sẽ tự hiện (nếu có version mới)

**Option B: Manual trigger**
- Thay đổi version trong `server/routes/app.js`:
```javascript
const APP_VERSION = '1.0.1'; // Tăng lên
```
- Restart server
- Mở app
- **Popup hiện ngay!**

---

## 🎯 POPUP SẼ HIỂN THỊ:

```
┌──────────────────────────────┐
│    🎯 Download Icon          │
│                              │
│  Ứng dụng đã có phiên bản    │
│         mới!                 │
│                              │
│  Bạn vui lòng cập nhật...    │
│                              │
│  Version: v1.0.1             │
│  (hiện tại: v1.0.0)          │
│                              │
│  ┌────────────────────────┐  │
│  │ Có gì mới:             │  │
│  │ • Fix: Lỗi login       │  │
│  │ • New: Chat realtime   │  │
│  └────────────────────────┘  │
│                              │
│  ┌───────────────────────┐   │
│  │  🔄 CẬP NHẬT          │   │
│  └───────────────────────┘   │
│        Bỏ qua                │
└──────────────────────────────┘
```

---

## 🔍 TROUBLESHOOTING

### ❌ Popup không hiện?

**1. Check console logs:**
```javascript
// Mở DevTools (F12) → Console
// Xem logs:
📡 Using API URL from env: ...
🔍 Checking for updates...
```

**2. Check API endpoint:**
```bash
curl http://192.168.0.102:5000/api/app/version
```

Phải trả về JSON, không phải HTML!

**3. Check version logic:**
```javascript
// client/src/utils/liveUpdate.js
const CURRENT_VERSION = '1.0.0';

// server/routes/app.js  
const APP_VERSION = '1.0.1';

// Nếu APP_VERSION > CURRENT_VERSION → Popup hiện!
```

**4. Force trigger:**

Thêm vào `client/src/App.js` (tạm thời):
```javascript
useEffect(() => {
  // Force show popup for testing
  setTimeout(() => {
    setUpdateInfo({
      hasUpdate: true,
      version: '1.0.1',
      currentVersion: '1.0.0',
      updateUrl: 'http://192.168.0.102:5000/api/app/download/latest',
      changeLog: 'Test update!',
      mandatory: false
    });
  }, 3000);
}, []);
```

Refresh → Popup sẽ hiện sau 3s!

---

## ✅ CHECKLIST

- [ ] Server đang chạy (port 5000)
- [ ] API `/api/app/version` trả về JSON
- [ ] `CURRENT_VERSION` < `APP_VERSION`
- [ ] App đã load xong (không còn loading)
- [ ] DevTools console không có lỗi
- [ ] Network tab thấy request tới `/api/app/version`

---

## 🎬 VIDEO TEST

1. Start server + client
2. Mở app
3. Mở DevTools (F12)
4. Thay đổi version trong code
5. Refresh
6. Xem popup đẹp xuất hiện! ✨

---

## 📞 CẦN HELP?

Nếu vẫn không work:
1. Check console logs
2. Check network requests
3. Gửi screenshot lỗi

Happy Testing! 🚀

