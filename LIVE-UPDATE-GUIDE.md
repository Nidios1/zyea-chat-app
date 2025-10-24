# 🚀 HƯỚNG DẪN SỬ DỤNG LIVE UPDATE

## 📋 Tổng quan

**Live Update** cho phép bạn cập nhật code React (HTML/CSS/JS) **KHÔNG CẦN BUILD LẠI IPA**!

### ✅ Ưu điểm:

- ⚡ Update ngay lập tức - không đợi GitHub Actions
- 💰 Tiết kiệm thời gian (từ 15 phút → 1 phút)
- 🎯 Fix bug nhanh chóng
- 🔄 Rollback dễ dàng nếu có lỗi
- 📱 UI đẹp giống App Store
- 🆓 Hoàn toàn miễn phí (self-hosted)

### ❌ Không thể update:

- Native code (Swift/Kotlin)
- Capacitor config
- App permissions
- App ID, Bundle ID

---

## 🎯 CÁCH SỬ DỤNG

### 1️⃣ **Fix bug hoặc thêm tính năng trong React**

```bash
# Sửa code trong client/src/
vi client/src/components/Chat/Chat.js
```

### 2️⃣ **Build React app**

```bash
cd client
npm run build
```

### 3️⃣ **Tạo bundle update**

```bash
# Zip thư mục build
zip -r build.zip build/

# Hoặc trên Windows (PowerShell)
Compress-Archive -Path build -DestinationPath build.zip -Force
```

### 4️⃣ **Upload bundle lên server** (Tùy chọn)

```bash
# Copy build.zip vào thư mục client/
mv build.zip ../build.zip
```

### 5️⃣ **Thay đổi version number**

**File:** `client/src/utils/liveUpdate.js`

```javascript
// Tăng version lên
const CURRENT_VERSION = '1.0.1'; // từ 1.0.0 → 1.0.1
```

**File:** `server/routes/app.js`

```javascript
// Cập nhật version và changelog
const APP_VERSION = '1.0.1';

const versionInfo = {
  version: APP_VERSION,
  changeLog: `
• Fix: Đã sửa lỗi chat không load
• New: Thêm tính năng gửi sticker
• Improve: Tối ưu tốc độ
  `.trim(),
  mandatory: false // true = bắt buộc update
};
```

### 6️⃣ **Restart server**

```bash
cd server
npm start
```

### 7️⃣ **Test trên IPA**

- Mở app trên iPhone
- App tự động check update mỗi 30s
- Popup hiển thị: "Ứng dụng đã có phiên bản mới!"
- Click **"Cập nhật"**
- Đợi download (hiển thị progress bar)
- App tự động reload với code mới ✅

---

## 📱 UI POPUP UPDATE

Popup sẽ hiển thị:

```
┌─────────────────────────────┐
│     🎯 (Icon Download)      │
│                             │
│  Ứng dụng đã có phiên bản   │
│         mới!                │
│                             │
│  Bạn vui lòng cập nhật...   │
│                             │
│  Version: v1.0.1            │
│  (hiện tại: v1.0.0)         │
│                             │
│  ┌───────────────────────┐  │
│  │ Có gì mới:            │  │
│  │ • Fix: Lỗi login      │  │
│  │ • New: Chat realtime  │  │
│  └───────────────────────┘  │
│                             │
│  ┌──────────────────────┐   │
│  │   🔄 CẬP NHẬT        │   │
│  └──────────────────────┘   │
│        Bỏ qua               │
└─────────────────────────────┘
```

---

## 🔧 CẤU HÌNH API

### API Endpoints:

**1. Check version:**
```
GET http://192.168.0.102:5000/api/app/version
```

Response:
```json
{
  "version": "1.0.1",
  "updateUrl": "http://192.168.0.102:5000/api/app/download/latest",
  "changeLog": "• Fix bugs\n• New features",
  "mandatory": false,
  "releaseDate": "2025-10-24T15:30:00.000Z"
}
```

**2. Download update:**
```
GET http://192.168.0.102:5000/api/app/download/latest
```

Returns: `app-update.zip` file

---

## 🎨 CUSTOMIZE

### Thay đổi interval check:

**File:** `client/src/utils/liveUpdate.js`

```javascript
const UPDATE_CHECK_INTERVAL = 30000; // 30s → thay đổi tùy ý
```

### Bắt buộc update:

**File:** `server/routes/app.js`

```javascript
const versionInfo = {
  mandatory: true // true = không cho bỏ qua
};
```

### Custom UI:

**File:** `client/src/components/Common/UpdatePrompt.js`

Tùy chỉnh colors, text, animation...

---

## 📊 QUY TRÌNH UPDATE

```
┌─────────────────┐
│  1. Fix bug     │
│     trong       │
│   React code    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  2. Build       │
│  npm run build  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  3. Zip bundle  │
│  zip build.zip  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  4. Tăng        │
│    version      │
│  1.0.0 → 1.0.1  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  5. Restart     │
│    server       │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  6. App auto    │
│  check & show   │
│     popup       │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  7. User click  │
│   "Cập nhật"    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  8. Download    │
│   & reload      │
│      ✅         │
└─────────────────┘
```

---

## 🚨 LƯU Ý QUAN TRỌNG

### ✅ CÓ THỂ UPDATE:

- UI components (React)
- Business logic (JavaScript)
- Styles (CSS)
- Images, assets
- API calls
- Socket events

### ❌ KHÔNG THỂ UPDATE:

- App ID (`com.zyea.hieudev`)
- App permissions (Camera, Location...)
- Native plugins
- Capacitor config
- iOS/Android native code

→ Những thứ này cần **BUILD LẠI IPA**!

---

## 🎯 BEST PRACTICES

### 1. Version Numbering:

```
Major.Minor.Patch
  1  . 0   . 0

Major: Breaking changes (1.0.0 → 2.0.0)
Minor: New features    (1.0.0 → 1.1.0)
Patch: Bug fixes       (1.0.0 → 1.0.1)
```

### 2. Testing:

- Test trên local trước
- Test update flow
- Test rollback nếu cần

### 3. Changelog:

- Viết rõ ràng, dễ hiểu
- Tối đa 3-4 dòng
- Highlight điểm quan trọng

### 4. Mandatory Updates:

- Chỉ dùng khi thực sự cần thiết
- Ví dụ: Security fix, breaking API changes

---

## 🔄 ROLLBACK

Nếu version mới có lỗi:

**1. Giảm version về cũ:**

```javascript
// liveUpdate.js
const CURRENT_VERSION = '1.0.0'; // quay lại version cũ
```

**2. Restart server**

**3. App sẽ không thấy update mới**

---

## 📞 SUPPORT

Có vấn đề? Liên hệ:
- GitHub Issues
- Email support

---

## 🎉 HOÀN TẤT!

Bây giờ bạn có thể:
- ✅ Fix bug nhanh không cần build IPA
- ✅ Update features realtime
- ✅ Tiết kiệm thời gian phát triển
- ✅ UX tốt với UI đẹp

**Happy Coding! 🚀**

