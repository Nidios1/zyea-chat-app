# ✅ SẴN SÀNG TEST LIVE UPDATE

## 📦 Files đã chuẩn bị

### ✅ Build Files
```
client/build/               ← Build folder mới nhất (có Version Badge)
client/build.zip            ← 2.24 MB (Server sẽ download file này)
client/app-update.zip       ← 2.24 MB (Backup)
app-update.zip             ← 2.24 MB (Root backup)
```

### ✅ Version Configuration

**Client Version:**
```javascript
// client/src/utils/liveUpdate.js
const BASE_VERSION = '1.0.6';
```

**Server Version:**
```javascript
// server/routes/app.js
const APP_VERSION = '1.0.7';
```

**Result:** `1.0.6 < 1.0.7` → **Update available!** ✅

---

## 🎯 Test Feature: Version Badge

### Vị trí:
- Góc phải dưới màn hình
- Fixed position, z-index cao
- Animation pulse mượt mà

### Trước update:
```
┌─────────────┐
│ 🚀 v1.0.6   │
│      LIVE   │
└─────────────┘
```

### Sau update:
```
┌─────────────┐
│ 🚀 v1.0.7   │  ← ĐÃ THAY ĐỔI!
│      LIVE   │
└─────────────┘
```

---

## 🚀 CÁCH TEST (3 BƯỚC)

### Bước 1: Start Server

```bash
cd server
npm start
```

Server sẽ chạy trên: `http://192.168.0.102:5000`

### Bước 2: Mở App

**Option A - Localhost:**
```
http://localhost:3000
```

**Option B - Network:**
```
http://192.168.0.102:3000
```

**Option C - Dùng Test Dashboard:**
```
file:///C:/xampp/htdocs/zalo-clone/test-live-update.html
```

### Bước 3: Quan sát

1. ✅ Xem Version Badge ở góc phải dưới: `🚀 v1.0.6 LIVE`
2. ⏳ Đợi 30s hoặc reload trang (Ctrl+R)
3. 🔔 Popup update xuất hiện
4. 👆 Click "Cập nhật"
5. 🖥️ Mở Console (F12) xem logs
6. ✅ Badge đổi thành: `🚀 v1.0.7 LIVE`

---

## 🔍 Verify Update Thành Công

### 1. Check Version Badge (Visual)
```
Badge hiển thị: 🚀 v1.0.7 LIVE
```

### 2. Check Console Logs
```
📥 Downloading update...
✅ Download completed
🗑️ Clearing caches...
✅ All caches cleared
✅ Service Worker unregistered
✅ Saved new version: 1.0.7
🔄 Applying update...
```

### 3. Check localStorage
```javascript
// Console
localStorage.getItem('app_version')
// Phải trả về: "1.0.7"
```

### 4. Check Network Tab
```
Request: GET /api/app/download/latest
Status: 200 OK
Size: 2.24 MB
```

---

## 📊 API Endpoints

### 1. Check Version
```bash
curl http://192.168.0.102:5000/api/app/version
```

Response:
```json
{
  "version": "1.0.7",
  "updateUrl": "http://192.168.0.102:5000/api/app/download/latest",
  "changeLog": "• Fix: Tin nhắn tự động cuộn xuống tin mới nhất khi mở chat trên mobile",
  "mandatory": false,
  "releaseDate": "2025-10-24T...",
  "minSupportedVersion": "0.9.0"
}
```

### 2. Download Update
```bash
curl -O http://192.168.0.102:5000/api/app/download/latest
```

File downloaded: `app-update.zip` (2.24 MB)

---

## ✅ Expected Behavior

### Timeline:

```
0s    → App loads, Badge shows: v1.0.6
5s    → Auto check update (background)
      → Detect: server v1.0.7 > client v1.0.6
30s   → Show update popup
      → User clicks "Cập nhật"
31s   → Download starts (progress bar)
33s   → Download complete (2.24 MB)
      → Clear Service Worker caches
      → Unregister Service Worker
      → Save version to localStorage
34s   → Hard reload (bypass cache)
      → App loads with NEW code
      → Badge shows: v1.0.7 ✅
```

---

## 🐛 Troubleshooting

### Popup không hiện?

**Check:**
```javascript
// Console
fetch('http://192.168.0.102:5000/api/app/version')
  .then(r => r.json())
  .then(console.log)
```

**Expected:** `{ version: "1.0.7", ... }`

### Badge không đổi?

**Check localStorage:**
```javascript
localStorage.getItem('app_version')
```

**Fix:**
```javascript
// Clear và thử lại
localStorage.clear()
location.reload()
```

### Service Worker cache vẫn cũ?

**Manual clear:**
```javascript
// Console
navigator.serviceWorker.getRegistrations().then(regs => {
  regs.forEach(reg => reg.unregister())
})

caches.keys().then(names => {
  names.forEach(name => caches.delete(name))
})

location.reload(true)
```

---

## 📁 File Structure

```
zalo-clone/
├── client/
│   ├── build/                    ← Build folder mới nhất
│   ├── build.zip                 ← ✅ Server download file này
│   ├── app-update.zip            ← Backup
│   ├── src/
│   │   ├── App.js               ← ✅ Có Version Badge
│   │   └── utils/
│   │       └── liveUpdate.js    ← v1.0.6
│   └── public/
│       └── sw.js                ← ✅ Dynamic cache version
├── server/
│   └── routes/
│       └── app.js               ← v1.0.7, API endpoints
├── test-live-update.html        ← Test dashboard
├── quick-test-update.bat        ← Quick start script
├── test-download-endpoint.js    ← Verify script
└── READY-TO-TEST.md             ← This file
```

---

## 🎉 Success Criteria

Live Update thành công nếu:

- [x] ✅ File `build.zip` tồn tại (2.24 MB)
- [x] ✅ Server version (1.0.7) > Client version (1.0.6)
- [x] ✅ API `/api/app/version` trả về đúng
- [x] ✅ API `/api/app/download/latest` download được
- [ ] ✅ Badge hiển thị v1.0.6 ban đầu
- [ ] ✅ Popup update xuất hiện
- [ ] ✅ Download không lỗi
- [ ] ✅ Cache được clear
- [ ] ✅ **Badge đổi thành v1.0.7** ⭐
- [ ] ✅ localStorage = "1.0.7"

---

## 🚀 Quick Start Commands

```bash
# Test download endpoint
node test-download-endpoint.js

# Start server
cd server && npm start

# Mở dashboard
start test-live-update.html

# Hoặc dùng BAT file
quick-test-update.bat
```

---

## 📸 What to Look For

### BEFORE UPDATE:
```
┌────────────────────────────────────┐
│ App Interface                      │
│                                    │
│ [Your chat/feed content here]      │
│                                    │
│                  ┌─────────────┐   │
│                  │ 🚀 v1.0.6   │   │
│                  │      LIVE   │   │
│                  └─────────────┘   │
└────────────────────────────────────┘
```

### AFTER UPDATE:
```
┌────────────────────────────────────┐
│ App Interface                      │
│                                    │
│ [Your chat/feed content here]      │
│                                    │
│                  ┌─────────────┐   │
│                  │ 🚀 v1.0.7   │ ✅ │
│                  │      LIVE   │   │
│                  └─────────────┘   │
└────────────────────────────────────┘
```

---

## 🎯 Next Steps

1. ✅ Start server
2. ✅ Open app
3. ✅ Wait for update popup
4. ✅ Click update
5. ✅ Verify badge changes
6. 🎉 Celebrate successful live update!

---

**Happy Testing! 🚀**

*Nếu badge đổi từ v1.0.6 → v1.0.7, bạn đã thành công!*

