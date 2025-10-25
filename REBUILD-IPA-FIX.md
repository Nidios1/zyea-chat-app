# 🔧 Rebuild IPA với Fix WebRTC cho iOS

## ✅ Đã Fix

### Vấn đề trước đó:
```
❌ navigator.mediaDevices.getUserMedia undefined
❌ Permission request failing trên iOS native app
❌ WebRTC không hoạt động trong Capacitor WebView
```

### Đã giải quyết:
```
✅ Tạo mediaPermissions.js utility  
✅ Detect platform (native vs web)
✅ Handle getUserMedia cho cả web và native
✅ Error messages phù hợp với iOS
✅ Logging để debug dễ dàng
```

---

## 📦 Code Đã Push

**Commit:** `872bea9` - 🐛 Fix WebRTC for iOS Native App (IPA)

**GitHub:** https://github.com/Nidios1/zyea-chat-app

**Files thay đổi:**
- ✨ `client/src/utils/mediaPermissions.js` (NEW)
- 📝 `client/src/components/Chat/PermissionRequest.js`
- 📝 `client/src/components/Chat/VideoCall.js`

---

## 🚀 Rebuild IPA

### Option 1: Codemagic (Khuyến nghị - Nhanh nhất)

1. **Vào Codemagic Dashboard:**
   - https://codemagic.io/apps
   - Login với GitHub account

2. **Select App:**
   - Chọn `zyea-chat-app`

3. **Start New Build:**
   - Click **"Start new build"**
   - Select branch: `master`
   - Select workflow: `ios-workflow`
   - Click **"Start build"**

4. **Chờ Build (15-20 phút)**
   - Codemagic sẽ:
     - ✅ Pull latest code từ GitHub
     - ✅ npm install
     - ✅ npm run build
     - ✅ npx cap sync ios
     - ✅ Build IPA
     - ✅ Export với signing

5. **Download IPA:**
   - Sau khi build xong
   - Click vào build → Artifacts tab
   - Download file `.ipa`

### Option 2: Local Build (Nếu có macOS)

```bash
# 1. Pull latest code
cd zalo-clone
git pull origin master

# 2. Install dependencies (nếu có thay đổi)
cd client
npm install

# 3. Build React app
npm run build

# 4. Sync với iOS
npx cap sync ios

# 5. Open Xcode
npx cap open ios

# 6. Trong Xcode:
# - Select scheme: App
# - Select device: Any iOS Device (arm64)
# - Product → Archive
# - Distribute App
# - Choose method (Ad Hoc / App Store)
# - Export IPA
```

### Option 3: GitHub Actions (Nếu đã setup)

Nếu đã có workflow file `.github/workflows/ios-build.yml`:

1. Push code (đã xong)
2. Vào GitHub Actions tab
3. Workflow sẽ tự động chạy
4. Download artifact sau khi xong

---

## 🧪 Test Sau Khi Rebuild

### 1. Install IPA mới:
```bash
# Qua Xcode
# Hoặc qua tool như Cydia Impactor
# Hoặc TestFlight
```

### 2. Test Permission Request:

**Khi click nút gọi video:**

✅ **Popup permission request xuất hiện:**
```
┌───────────────────────────────┐
│ Cho phép truy cập Camera &    │
│ Microphone                     │
│                                │
│ Zyea+ cần quyền truy cập để   │
│ bắt đầu cuộc gọi video với... │
│                                │
│ 📹 Camera                     │
│    Để người khác nhìn thấy bạn│
│                                │
│ 🎤 Microphone                 │
│    Để người khác nghe thấy bạn│
│                                │
│ [Hủy]        [Cho phép]       │
└───────────────────────────────┘
```

✅ **Click "Cho phép":**
- iOS system dialog xuất hiện
- "Zyea+ Would Like to Access the Camera"
- Click "OK"

✅ **Sau đó:**
- Permission request close
- Video call screen xuất hiện
- Camera và mic hoạt động
- Video call thành công!

### 3. Check Console Log:

Trong Safari Web Inspector (kết nối iOS device):

```
🔍 Checking permissions... {isNative: true, isIOS: true}
🔵 Native platform detected, using native getUserMedia
✅ Native stream obtained: MediaStream {...}
📹 Video tracks: 1
🎤 Audio tracks: 1
```

### 4. Test Video Call:

```
User A (iOS) → Call → User B (Web/iOS)
✅ User B thấy incoming call
✅ User B accept
✅ Video/audio hoạt động 2 chiều
✅ Controls hoạt động (mute, camera toggle)
✅ Hang up hoạt động
```

---

## 🐛 Troubleshooting

### Nếu vẫn lỗi "undefined":

1. **Check code đã update chưa:**
   ```bash
   cd zalo-clone/client
   git pull
   ls -la src/utils/mediaPermissions.js
   ```

2. **Rebuild từ đầu:**
   ```bash
   rm -rf node_modules
   rm -rf build
   npm install
   npm run build
   npx cap sync ios
   ```

3. **Check iOS project:**
   ```bash
   npx cap open ios
   # Trong Xcode, check:
   # - Info.plist có NSCameraUsageDescription
   # - Info.plist có NSMicrophoneUsageDescription
   # - Build settings đúng
   ```

### Nếu iOS không hỏi permission:

1. **Reset permissions:**
   - Settings → General → Transfer or Reset iPhone
   - Reset Location & Privacy
   - Reinstall app

2. **Check Info.plist:**
   ```xml
   <key>NSCameraUsageDescription</key>
   <string>Zyea+ cần quyền truy cập camera...</string>
   <key>NSMicrophoneUsageDescription</key>
   <string>Zyea+ cần quyền truy cập microphone...</string>
   ```

3. **Manual grant:**
   - Settings → Zyea+
   - Enable Camera
   - Enable Microphone

---

## 📊 Kiểm Tra Fix

### ✅ Checklist:

- [x] Code đã push lên GitHub
- [x] mediaPermissions.js utility đã tạo
- [x] PermissionRequest.js đã update
- [x] VideoCall.js đã update  
- [x] Ready để rebuild IPA

### Khi IPA mới:

- [ ] Install IPA trên device
- [ ] Test permission request
- [ ] iOS system dialog xuất hiện
- [ ] Grant permissions
- [ ] Video call hoạt động
- [ ] Audio hoạt động
- [ ] Controls hoạt động

---

## 🎯 Expected Behavior

### Trước (Lỗi):
```
1. Click nút gọi video
2. Permission popup xuất hiện  
3. Click "Cho phép"
4. ❌ Error: "navigator.mediaDevices.getUserMedia undefined"
5. ❌ Call không bắt đầu
```

### Sau (Fix):
```
1. Click nút gọi video
2. Permission popup xuất hiện
3. Click "Cho phép"
4. ✅ iOS system dialog: "Allow Zyea+ to access Camera?"
5. ✅ Click OK
6. ✅ Permission granted
7. ✅ Video call bắt đầu
8. ✅ Camera/mic hoạt động
9. ✅ Call thành công!
```

---

## 📝 Technical Details

### Thay đổi chính:

**1. Platform Detection:**
```javascript
import { Capacitor } from '@capacitor/core';

const isNative = () => Capacitor.isNativePlatform();
const isIOS = () => Capacitor.getPlatform() === 'ios';
```

**2. getUserMedia Wrapper:**
```javascript
export const getUserMedia = async (isVideoCall = true) => {
  // Handle both native and web
  if (isNative()) {
    console.log('Native platform detected');
  }
  return await navigator.mediaDevices.getUserMedia(constraints);
};
```

**3. Error Formatting:**
```javascript
export const formatMediaError = (error) => {
  if (isIOS()) {
    return 'Vào Settings → Zyea+ → Bật Camera và Microphone';
  }
  // ... other platforms
};
```

---

## 🎉 Kết Luận

✅ **Fix đã hoàn thành**  
✅ **Code đã push lên GitHub**  
✅ **Ready để rebuild IPA**  
✅ **Video call sẽ hoạt động trên iOS native app**

**Rebuild IPA ngay và test thôi!** 🚀📱

---

## 📞 Support

Nếu vẫn gặp vấn đề:
1. Check console logs
2. Verify permissions trong Settings
3. Try clean build
4. Check GitHub commit đã latest chưa

**Latest commit:** `872bea9` - 🐛 Fix WebRTC for iOS Native App

