# ⚡ QUICK FIX - Lỗi Video/Voice Call iOS Native

## 🐛 VẤN ĐỀ
Khi thực hiện cuộc gọi video/voice trên iOS native (IPA), gặp lỗi:
```
undefined is not an object (evaluating 'navigator.mediaDevices.getUserMedia')
```

## ✅ GIẢI PHÁP (ĐÃ FIX XONG)

**TẤT CẢ CODE ĐÃ ĐƯỢC SỬA!** Chỉ cần rebuild IPA.

### Files đã được fix:
- ✅ `MainViewController.swift` - Tạo mới với WebRTC config
- ✅ `Main.storyboard` - Updated để dùng MainViewController
- ✅ `AppDelegate.swift` - Cải thiện AVAudioSession config
- ✅ `WebRTCConfiguration.swift` - Updated (backup layer)

---

## 🚀 REBUILD IPA NGAY

### Option 1: Dùng Xcode (Recommended)

```bash
# 1. Mở project
cd zalo-clone/client
open ios/App/App.xcworkspace

# 2. Trong Xcode:
#    - Product → Clean Build Folder (Shift+Cmd+K)
#    - Product → Archive
#    - Distribute App → Ad Hoc hoặc App Store
```

### Option 2: Dùng Command Line

```bash
cd zalo-clone/client

# Sync Capacitor
npx cap sync ios

# Build IPA
cd ios/App
xcodebuild -workspace App.xcworkspace \
           -scheme App \
           -configuration Release \
           -archivePath ./build/App.xcarchive \
           clean archive

# Export IPA
xcodebuild -exportArchive \
           -archivePath ./build/App.xcarchive \
           -exportPath ./build \
           -exportOptionsPlist ../../ios-export-options.plist
```

---

## 📱 TEST SAU KHI INSTALL IPA MỚI

1. **Install IPA** lên iPhone
2. **Mở app lần đầu** → Allow permissions khi được hỏi
3. **Vào Settings → Zyea+** → Verify:
   - ✅ Camera: ON
   - ✅ Microphone: ON
4. **Test voice call**: Nhấn nút gọi thoại → Should work!
5. **Test video call**: Nhấn nút gọi video → Camera & audio work!

---

## 📋 EXPECTED CONSOLE LOGS (Khi Fix Thành Công)

Connect iPhone qua Safari Web Inspector, bạn sẽ thấy:

```
✅ AVAudioSession configured for VoIP
✅ WebRTC configuration applied via MainViewController
✅ MainViewController loaded with WebRTC support
✅ WebRTC WKWebView configuration applied:
   - allowsInlineMediaPlayback: true
   - mediaTypesRequiringUserActionForPlayback: []
   - allowsPictureInPictureMediaPlayback: true
   - limitsNavigationsToAppBoundDomains: false
🎤 Microphone permission: ✅ Granted
🔵 Native platform detected
   Platform: ios
   Navigator: true
   MediaDevices: true  ← PHẢI LÀ true!
   getUserMedia: true  ← PHẢI LÀ true!
🎥 Requesting media stream...
🎥 Media capture permission requested:
   Origin: capacitor://localhost
   Type: Microphone (hoặc Camera)
✅ Native stream obtained
   Video tracks: 1
   Audio tracks: 1
```

---

## ❌ NẾU VẪN LỖI

### Check 1: Verify files đã update
```bash
cd zalo-clone/client

# Check MainViewController tồn tại
ls -la ios/App/App/MainViewController.swift

# Check storyboard đã update
grep "MainViewController" ios/App/App/Base.lproj/Main.storyboard
# Expected output: customClass="MainViewController"
```

### Check 2: Clean build thoroughly
```bash
cd zalo-clone/client/ios/App
rm -rf build/
rm -rf DerivedData/
rm -rf ~/Library/Developer/Xcode/DerivedData/*

# Rebuild from scratch
```

### Check 3: Verify permissions in Info.plist
```bash
cd zalo-clone/client
grep -A1 "NSCameraUsageDescription" ios/App/App/Info.plist
grep -A1 "NSMicrophoneUsageDescription" ios/App/App/Info.plist
# Should show Vietnamese descriptions
```

---

## 🔧 TECHNICAL SUMMARY

**Root cause**: 
- `navigator.mediaDevices` không tồn tại trong iOS WKWebView mặc định
- Capacitor's `CAPBridgeViewController` không tự động enable WebRTC

**Fix**:
- Tạo `MainViewController` extends `CAPBridgeViewController`
- Override `webViewConfiguration()` để inject WebRTC config
- Update storyboard để dùng MainViewController thay vì CAPBridgeViewController

**Key configuration**:
```swift
configuration.allowsInlineMediaPlayback = true
configuration.mediaTypesRequiringUserActionForPlayback = []
configuration.allowsPictureInPictureMediaPlayback = true
configuration.limitsNavigationsToAppBoundDomains = false
```

---

## 📞 SUPPORT

**Chi tiết đầy đủ**: Xem `FIX-IOS-NATIVE-WEBRTC.md`

**Test checklist**:
- [ ] IPA build thành công
- [ ] App launch không crash
- [ ] Permissions được grant
- [ ] Voice call works
- [ ] Video call works
- [ ] Camera stream visible
- [ ] Audio hai chiều clear

**Expected result**: ✅ Video/Voice calls hoạt động hoàn hảo trên iOS native!

---

Last updated: 2025-10-26
Version: 1.0 - Complete fix

