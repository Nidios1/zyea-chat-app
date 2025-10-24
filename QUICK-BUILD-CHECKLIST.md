# ✅ QUICK CHECKLIST - BUILD IPA LẦN ĐẦU

## 🎯 TÓM TẮT NHANH

### ✅ KHÔNG CẦN THAY ĐỔI GÌ!

Code đã sẵn sàng build IPA! Live Update đã tích hợp hoàn chỉnh.

---

## 📋 CHECKLIST BUILD IPA

### ✅ Đã hoàn thành:

- [x] Live Update system đã có trong code
- [x] Version Badge hiển thị góc phải dưới
- [x] BASE_VERSION = 1.0.8 (client)
- [x] APP_VERSION = 1.0.8 (server)
- [x] build.zip = 2.24 MB (sẵn sàng)
- [x] Service Worker với dynamic cache
- [x] API endpoints: `/api/app/version` & `/api/app/download/latest`

### ⚠️ CẦN CHECK (Production):

- [ ] Update API URL trong `client/src/utils/liveUpdate.js` line 29
  ```javascript
  // Development
  const response = await fetch('http://192.168.0.102:5000/api/app/version');
  
  // Production → Đổi thành:
  const response = await fetch('https://api.yourapp.com/api/app/version');
  ```

- [ ] Tăng UPDATE_CHECK_INTERVAL lên 5 phút (line 10)
  ```javascript
  const UPDATE_CHECK_INTERVAL = 300000; // 5 phút thay vì 30s
  ```

- [ ] Server accessible từ internet

---

## 🚀 BUILD IPA NGAY

### Commands:

```bash
# 1. Sync Capacitor
cd client
npx cap sync ios

# 2. Open Xcode
npx cap open ios

# 3. Trong Xcode:
# - Product → Archive
# - Distribute App
# - Export IPA
```

### Hoặc dùng GitHub Actions:

```bash
git add .
git commit -m "feat: Live Update System v1.0.8"
git push origin master

# GitHub Actions sẽ tự build IPA
```

---

## 🧪 TEST SAU KHI BUILD

### 1. Cài IPA lên iPhone
- Version Badge hiển thị: `🚀 v1.0.8 LIVE`

### 2. Tạo update mới:
```bash
# Sửa code → Build → Zip
cd client
npm run build
Compress-Archive -Path build\* -DestinationPath build.zip -Force

# Tăng server version
# server/routes/app.js: APP_VERSION = '1.0.9'

# Restart server
cd ../server
npm start
```

### 3. Test update trên iPhone:
- Mở app (30s)
- Popup xuất hiện
- Click "Cập nhật"
- Badge đổi: `🚀 v1.0.9 LIVE` ✅

---

## 📊 VERSION MANAGEMENT

```
v1.0.8 ← IPA đầu tiên (build lần này)
  ↓ Live Update (vài phút)
v1.0.9 ← Fix bugs
  ↓ Live Update (vài phút)
v1.1.0 ← New features
  ↓ BUILD IPA MỚI (cần thiết)
v2.0.0 ← Breaking changes
```

---

## 🎯 NHỮNG ĐIỀU QUAN TRỌNG

### ✅ CÓ THỂ update qua Live Update:
- UI/CSS thay đổi
- Logic JavaScript
- Fix bugs
- Thêm features nhỏ
- Images/assets

### ❌ PHẢI build IPA mới:
- Đổi permissions (Camera, Location...)
- Native code (Swift/Kotlin)
- Capacitor config
- App ID, Bundle ID
- Breaking changes

---

## 🔄 SAU KHI RELEASE

### Update thường xuyên (Live Update):
```
Fix bug → Build → Zip → Tăng version → Restart server
Timeline: 5-10 phút ⚡
```

### Chỉ build IPA khi:
- Cần thêm permissions mới
- Update native plugins
- Breaking changes lớn
```
Timeline: 1-2 tuần (App Store review) 🐌
```

---

## 📁 FILES QUAN TRỌNG

```
client/build.zip           ← Server download file này
client/src/utils/liveUpdate.js  ← Core logic + API URL
server/routes/app.js       ← Version & Changelog
```

---

## 🎉 READY!

**Bạn có thể build IPA ngay bây giờ!**

Không cần thay đổi gì, chỉ cần:
1. `npx cap sync ios`
2. `npx cap open ios`
3. Archive & Export

**Sau đó test Live Update như hướng dẫn ở trên!**

---

**Đọc chi tiết:** `BUILD-IPA-WITH-LIVE-UPDATE.md`

