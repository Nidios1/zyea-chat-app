# 🚀 QUICK TEST - LIVE UPDATE

## ⚡ Các bước test nhanh Live Update

### 📋 Chuẩn bị:

**Hiện tại:**
- ✅ Client version: `1.0.5` (version mới - trong `liveUpdate.js`)
- ✅ Server version: `1.0.5` (version mới - trong `app.js`)
- ✅ Đã fix: Auto-scroll tin nhắn xuống tin mới nhất khi mở chat trên mobile
- ✅ Build mới: Đã build ngày 25/10/2025

---

## 🎯 BƯỚC 1: Build Client

```powershell
# Đang build trong background...
cd zalo-clone/client
npm run build
```

**Đợi build xong** (khoảng 2-3 phút)

---

## 📦 BƯỚC 2: Tạo Update Bundle

```powershell
# Option A: Dùng script tự động (Khuyên dùng)
cd zalo-clone
.\create-update-bundle.ps1

# Option B: Tạo thủ công
cd client
Compress-Archive -Path build\* -DestinationPath build.zip -Force
```

**Kết quả:** File `client/build.zip` được tạo

---

## 🔄 BƯỚC 3: Restart Server (NẾU CHƯA CHẠY)

```powershell
# Nếu server đang chạy - giữ nguyên
# Nếu server chưa chạy:
cd zalo-clone/server
npm start
```

**Server URL:** `http://192.168.0.102:5000`

---

## 🌐 BƯỚC 4: Test trên PWA

### 4.1. Xóa localStorage cũ (QUAN TRỌNG!)

Mở PWA: `http://192.168.0.102:3000`

Mở Console (F12) và chạy:
```javascript
localStorage.removeItem('app_version');
location.reload();
```

### 4.2. Đợi Update Popup

Có 2 cách:

**Cách 1: Đợi tự động (30 giây)**
- App tự động check update mỗi 30s
- Popup sẽ tự động hiện

**Cách 2: Test ngay (Manual)**
```javascript
// Trong Console (F12)
import('./utils/liveUpdate.js').then(module => {
  module.checkForUpdates().then(update => {
    console.log('Update available:', update);
  });
});
```

### 4.3. Popup sẽ hiện

```
┌─────────────────────────────────┐
│      🎯 Cập nhật mới!           │
│                                 │
│  Ứng dụng đã có phiên bản mới!  │
│                                 │
│  Version: v1.0.4                │
│  (hiện tại: v1.0.3)             │
│                                 │
│  📝 Có gì mới:                  │
│  • Fix: Tin nhắn tự động cuộn   │
│  • Improve: Scroll tức thì      │
│  • Fix: Đảm bảo DOM render      │
│  • Enhance: Fallback scroll     │
│                                 │
│  [   🔄 CẬP NHẬT   ]            │
│       Bỏ qua                    │
└─────────────────────────────────┘
```

### 4.4. Click "Cập nhật"

- App sẽ download update
- Hiển thị progress bar
- Tự động reload
- Version mới: `1.0.4` ✅

---

## 🔍 VERIFY KẾT QUẢ

### 1. Check Version:
```javascript
// Console
localStorage.getItem('app_version')
// Kết quả: "1.0.4"
```

### 2. Test Fix:
- Mở chat với bạn bè
- Kiểm tra xem tin nhắn **có tự động cuộn xuống dưới cùng** không
- ✅ Nếu cuộn xuống = Fix thành công!

---

## 🐛 TROUBLESHOOTING

### Không thấy popup?

**1. Check localStorage:**
```javascript
localStorage.getItem('app_version')
// Nếu = "1.0.4" => xóa và reload:
localStorage.removeItem('app_version');
location.reload();
```

**2. Check server có chạy không:**
```
http://192.168.0.102:5000/api/app/version
```

**Kết quả mong đợi:**
```json
{
  "version": "1.0.4",
  "updateUrl": "...",
  "changeLog": "..."
}
```

**3. Check network:**
- Mở DevTools → Network tab
- Tìm request: `/api/app/version`
- Xem response

**4. Force reload:**
```javascript
// Console
window.location.reload(true); // Hard reload
```

---

## 📊 API ENDPOINTS

### GET /api/app/version
```bash
curl http://192.168.0.102:5000/api/app/version
```

Response:
```json
{
  "version": "1.0.4",
  "updateUrl": "http://192.168.0.102:5000/api/app/download/latest",
  "changeLog": "• Fix: Tin nhắn tự động cuộn...",
  "mandatory": false,
  "releaseDate": "2025-10-24T...",
  "minSupportedVersion": "0.9.0"
}
```

### GET /api/app/download/latest
```bash
curl -O http://192.168.0.102:5000/api/app/download/latest
```

Downloads: `app-update.zip`

---

## ✅ SUCCESS CHECKLIST

- [ ] Build completed (check `client/build/` folder)
- [ ] build.zip created (check `client/build.zip`)
- [ ] Server running (`http://192.168.0.102:5000`)
- [ ] PWA loaded (`http://192.168.0.102:3000`)
- [ ] localStorage cleared
- [ ] Update popup appeared
- [ ] Downloaded successfully
- [ ] App reloaded with new version
- [ ] Fix verified (auto-scroll works)

---

## 🎉 SAU KHI TEST XONG

### Update lại version về chính xác:

**File:** `client/src/utils/liveUpdate.js`
```javascript
const BASE_VERSION = '1.0.4'; // Cập nhật về version mới
```

**Build lại:**
```powershell
cd client
npm run build
.\create-update-bundle.ps1
```

---

## 💡 TIPS

1. **Development:** Để test popup nhanh, set interval ngắn hơn:
   ```javascript
   const UPDATE_CHECK_INTERVAL = 5000; // 5s thay vì 30s
   ```

2. **Production:** Tăng interval để giảm load server:
   ```javascript
   const UPDATE_CHECK_INTERVAL = 300000; // 5 phút
   ```

3. **Mandatory Update:** Bắt buộc user phải update:
   ```javascript
   // server/routes/app.js
   mandatory: true // Không cho bỏ qua
   ```

---

## 📞 SUPPORT

Có lỗi? Check console log:
```javascript
// Console
console.log('Version:', localStorage.getItem('app_version'));
```

**Happy Testing! 🚀**

