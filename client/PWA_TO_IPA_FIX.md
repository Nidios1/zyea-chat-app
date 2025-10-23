# 🔧 Fix Lỗi Khi Chuyển PWA → IPA (Native App)

## ❌ Các Lỗi Đã Tìm Thấy

### 1. **API URL Hardcoded**
- ❌ Vấn đề: URL `http://192.168.0.103:5000/api` được hardcode
- ✅ Giải pháp: Sử dụng `platformConfig.js` để detect platform và env variables

### 2. **Socket URL Hardcoded**  
- ❌ Vấn đề: Socket URL cũng bị hardcode
- ✅ Giải pháp: Dùng `getSocketUrl()` từ platformConfig

### 3. **HTTP trên iOS**
- ❌ Vấn đề: iOS block HTTP connections mặc định (chỉ cho phép HTTPS)
- ✅ Giải pháp: Thêm `NSAppTransportSecurity` vào Info.plist

### 4. **Không Detect Native App**
- ❌ Vấn đề: App không biết đang chạy PWA hay Native
- ✅ Giải pháp: Sử dụng `Capacitor.isNativePlatform()`

### 5. **Thiếu Permissions iOS**
- ❌ Vấn đề: Chưa khai báo permissions cho Camera, Photos, Location
- ✅ Giải pháp: Thêm vào Info.plist tự động qua script

---

## ✅ Các File Đã Sửa/Tạo

### 1. **platformConfig.js** (MỚI)
```javascript
// src/utils/platformConfig.js
- Detect Capacitor native app
- Get API URL dựa trên platform
- Get Socket URL dựa trên platform
- Hỗ trợ env variables
```

### 2. **api.js** (CẬP NHẬT)
```javascript
// Before:
const API_BASE_URL = process.env.NODE_ENV === 'development' 
  ? '/api' 
  : 'http://192.168.0.103:5000/api'

// After:
import { getApiBaseUrl } from './platformConfig';
const API_BASE_URL = getApiBaseUrl();
```

### 3. **useSocket.js** (CẬP NHẬT)
```javascript
// Before:
const useSocket = (url = 'http://192.168.0.103:5000') => {

// After:
import { getSocketUrl } from '../utils/platformConfig';
const useSocket = (url) => {
  const socketUrl = url || getSocketUrl();
```

### 4. **configure-ios-info-plist.js** (MỚI)
```javascript
// Auto-configure Info.plist với:
- NSAppTransportSecurity (cho phép HTTP)
- Camera permissions
- Photo Library permissions
- Microphone permissions
- Location permissions
```

### 5. **build-ios.yml** (CẬP NHẬT)
```yaml
# Thêm step config Info.plist
- name: Configure iOS Info.plist
  run: node configure-ios-info-plist.js

# Sử dụng GitHub Secrets cho API URL
env:
  REACT_APP_API_URL: ${{ secrets.API_URL || 'default' }}
  REACT_APP_SOCKET_URL: ${{ secrets.SOCKET_URL || 'default' }}
```

---

## 🚀 Cách Sử dụng

### **Local Development (sau khi pull code mới):**

```bash
cd client

# 1. Install dependencies
npm install

# 2. Build React app
npm run build

# 3. Add iOS platform (nếu chưa có)
npx cap add ios

# 4. Configure Info.plist (QUAN TRỌNG!)
node configure-ios-info-plist.js

# 5. Sync Capacitor
npx cap sync ios

# 6. Open Xcode
npx cap open ios

# 7. Build từ Xcode
```

### **GitHub Actions (Tự động):**

Workflow sẽ tự động:
1. ✅ Build React app với env variables
2. ✅ Setup iOS platform
3. ✅ Configure Info.plist (HTTP + permissions)
4. ✅ Generate assets (icons + splash)
5. ✅ Build IPA unsigned
6. ✅ Upload artifact

---

## 🔐 Setup GitHub Secrets (Tùy chọn)

Để thay đổi API URL mà không cần commit code:

1. Vào GitHub repo → Settings → Secrets and variables → Actions
2. Thêm secrets:
   - `API_URL`: `http://YOUR_SERVER_IP:5000/api`
   - `SOCKET_URL`: `http://YOUR_SERVER_IP:5000`

Workflow sẽ tự động sử dụng các secrets này khi build.

---

## 📱 Kiểm Tra Platform

App giờ đây tự động detect platform:

```javascript
import platformConfig from './utils/platformConfig';

console.log('Platform:', platformConfig.platform); // 'ios', 'android', 'web'
console.log('Is Native:', platformConfig.isNative); // true/false
console.log('API URL:', platformConfig.apiUrl);
console.log('Socket URL:', platformConfig.socketUrl);
```

---

## 🐛 Debug

### Xem API URL đang dùng:
```javascript
// Check trong browser/app console
import { getApiBaseUrl } from './utils/platformConfig';
console.log('Current API URL:', getApiBaseUrl());
```

### Xem Socket URL đang dùng:
```javascript
import { getSocketUrl } from './utils/platformConfig';
console.log('Current Socket URL:', getSocketUrl());
```

### Kiểm tra Info.plist đã config đúng chưa:
```bash
cat ios/App/App/Info.plist | grep -A 5 "NSAppTransportSecurity"
```

---

## ⚠️ Lưu ý quan trọng

### 1. **HTTP trên iOS Production**
iOS yêu cầu HTTPS cho production apps. Hiện tại chúng ta dùng HTTP với `NSAllowsArbitraryLoads=true` **CHỈ CHO DEVELOPMENT**.

Cho production, cần:
- ✅ Setup HTTPS cho server
- ✅ Sử dụng domain name (không dùng IP)
- ✅ SSL certificate hợp lệ

### 2. **IP Address Hardcoded**
IP `192.168.0.103` chỉ hoạt động trên local network. Để app hoạt động từ xa:
- ✅ Deploy server lên VPS với domain
- ✅ Hoặc dùng ngrok/cloudflare tunnel cho development

### 3. **Environment Variables**
Khi build production IPA, nhớ set đúng env variables:
```bash
REACT_APP_API_URL=https://your-domain.com/api \
REACT_APP_SOCKET_URL=https://your-domain.com \
npm run build
```

---

## 📊 Workflow Comparison

| Feature | Before | After |
|---------|--------|-------|
| API URL | Hardcoded | Env variable + platform detection |
| Socket URL | Hardcoded | Env variable + platform detection |
| iOS HTTP | ❌ Blocked | ✅ Allowed (development) |
| Permissions | ❌ Missing | ✅ Auto-configured |
| Platform Detection | ❌ None | ✅ Capacitor detection |
| Flexibility | ❌ Low | ✅ High |

---

## ✅ Kết Quả

Sau khi áp dụng các fix:

- ✅ App detect được đang chạy PWA hay Native
- ✅ API calls hoạt động trên iOS
- ✅ Socket.io connect được trên native app
- ✅ Camera, Photos permissions được khai báo
- ✅ Dễ dàng thay đổi API URL qua env variables
- ✅ Workflow build iOS tự động config mọi thứ

---

## 🆘 Troubleshooting

### Lỗi: "Failed to load resource: The resource could not be loaded because the App Transport Security policy"
→ Chạy lại `node configure-ios-info-plist.js` và sync

### Lỗi: API calls không hoạt động
→ Check console log để xem API URL đang dùng
→ Verify server đang chạy và accessible từ device

### Lỗi: Socket không connect
→ Check CORS settings trên server
→ Verify socket URL trong console log

---

**Tác giả:** AI Assistant  
**Ngày cập nhật:** $(date)  
**Version:** 1.0

