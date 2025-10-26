# 🔧 FIX LỖI WEBRTC IOS NATIVE - VIDEO/VOICE CALL

## ❌ VẤN ĐỀ

Khi chạy app trên iOS native (IPA), gặp lỗi khi thực hiện cuộc gọi video/voice:

```
undefined is not an object (evaluating 'navigator.mediaDevices.getUserMedia')
```

**Nguyên nhân**: WKWebViewConfiguration không được inject đúng vào Capacitor Bridge, khiến `navigator.mediaDevices` không tồn tại.

---

## ✅ GIẢI PHÁP

### 1️⃣ **Tạo MainViewController.swift** ✅

File: `client/ios/App/App/MainViewController.swift` - **ĐÃ TẠO**

**VẤN ĐỀ CŨKHẮC PHỤC**: 
- `CAPBridgeViewController` mặc định không config WebRTC
- Configuration phải được inject TRƯỚC khi WKWebView init

**CÁCH FIX**: 
- Tạo custom `MainViewController` extends `CAPBridgeViewController`
- Override `webViewConfiguration()` method
- Return WKWebViewConfiguration với WebRTC enabled

### 2️⃣ **Update Main.storyboard** ✅

File: `client/ios/App/App/Base.lproj/Main.storyboard` - **ĐÃ CẬP NHẬT**

**Thay đổi**:
```xml
<!-- CŨ -->
<viewController customClass="CAPBridgeViewController" customModule="Capacitor"/>

<!-- MỚI -->
<viewController customClass="MainViewController" customModule="App" customModuleProvider="target"/>
```

### 3️⃣ **Update AppDelegate.swift** ✅

File: `client/ios/App/App/AppDelegate.swift` - **ĐÃ CẬP NHẬT**

**Cải thiện**:
- Configure AVAudioSession cho VoIP
- Better logging
- Remove obsolete code

### 2️⃣ **Verify Info.plist** ✅

File: `ios/App/App/Info.plist`

Đã có đủ permissions:
- ✅ `NSCameraUsageDescription`
- ✅ `NSMicrophoneUsageDescription`
- ✅ `UIBackgroundModes` (audio, voip)

### 3️⃣ **Verify capacitor.config.ts** ✅

File: `capacitor.config.ts`

Đã có config:
- ✅ `ios.webViewMediaCaptureEnabled: true`
- ✅ `ios.allowsInlineMediaPlayback: true`
- ✅ `ios.mediaTypesRequiringUserActionForPlayback: 'none'`

---

## 📋 STEPS TO FIX - ĐÃ HOÀN TẤT ✅

**TẤT CẢ FILES ĐÃ ĐƯỢC CẬP NHẬT XONG!** Bây giờ chỉ cần rebuild IPA.

### ✅ Step 1: Files đã được fix
- ✅ `MainViewController.swift` - Created with WebRTC config
- ✅ `Main.storyboard` - Updated to use MainViewController  
- ✅ `AppDelegate.swift` - Improved with AVAudioSession config
- ✅ `WebRTCConfiguration.swift` - Updated (backup layer)

### ✅ Step 2: Verify files
```bash
cd zalo-clone/client

# Check MainViewController exists
ls ios/App/App/MainViewController.swift

# Check Main.storyboard updated
grep "MainViewController" ios/App/App/Base.lproj/Main.storyboard
```

### Step 3: Sync Capacitor (nếu cần)
```bash
cd zalo-clone/client
npx cap sync ios
```

### Step 4: Clean build iOS
```bash
cd ios/App
# Trên Mac:
rm -rf ~/Library/Developer/Xcode/DerivedData/*

# Hoặc trong Xcode:
# Product → Clean Build Folder (Shift + Cmd + K)
```

### Step 5: Rebuild IPA
**Open Xcode và rebuild:**

1. Mở `zalo-clone/client/ios/App/App.xcworkspace` trong Xcode
2. Chọn scheme: **App**
3. Chọn device: **Any iOS Device (arm64)**
4. **Product → Clean Build Folder** (Shift + Cmd + K)
5. **Product → Archive**
6. **Distribute App** → chọn phương thức:
   - **Ad Hoc** (test trên device cụ thể)
   - **App Store Connect** (submit lên App Store)
7. Wait for build... (~5-10 phút)
8. Export IPA file

### Step 6: Install và test
1. Install IPA lên device (qua Xcode hoặc TestFlight)
2. First launch: App sẽ ask camera/mic permissions
3. Settings → Zyea+ → Verify permissions enabled
4. Test voice call và video call

---

## 🔍 VERIFY FIX

Sau khi install IPA mới, test:

1. ✅ Mở Settings → Zyea+ → Verify permissions:
   - Camera: ON
   - Microphone: ON

2. ✅ Trong app, thử voice call:
   - Nhấn nút gọi thoại
   - App sẽ hiện popup xin permission
   - Nhấn "Cho phép"
   - Call should connect

3. ✅ Test video call:
   - Nhấn nút gọi video
   - Camera và mic sẽ activate
   - Video stream should work

---

## 🐛 DEBUGGING

Nếu vẫn lỗi, check console logs:

### Safari Web Inspector (iOS Device)
1. Connect iPhone via USB
2. Safari → Develop → [Your Device] → [Your App]
3. Check console for errors

### Expected logs khi fix thành công:
```
✅ WebRTC WKWebView configuration applied
✅ Capacitor bridge initialized with WebRTC support
🎤 Microphone permission: ✅ Granted
🔵 Native platform detected
   Platform: ios
   Navigator: true
   MediaDevices: true  ← MUST BE TRUE
   getUserMedia: true  ← MUST BE TRUE
🎥 Requesting media stream...
✅ Native stream obtained
   Video tracks: 1
   Audio tracks: 1
```

---

## 📝 TECHNICAL NOTES

### Vì sao lỗi xảy ra?

1. **WKWebView mặc định KHÔNG có getUserMedia**
   - Safari WebView cần explicit configuration
   - Capacitor không auto-enable media capture

2. **Configuration phải được inject VÀO TRƯỚC khi bridge init**
   - Không thể config sau khi WebView đã loaded
   - Phải override trong AppDelegate

3. **iOS permissions cần 2 layers**:
   - Layer 1: Info.plist descriptions (để iOS system prompt)
   - Layer 2: WKWebView configuration (để JavaScript có thể access)

### Code fix chi tiết:

```swift
// ❌ WRONG - Configuration không được apply
private func configureWebViewForWebRTC() {
    let configuration = WKWebViewConfiguration()
    // ... config here
    // Nhưng configuration này không được dùng ở đâu!
}

// ✅ CORRECT - Override bridge's webView config
override func capacitorBridge(_ bridge: CAPBridgeProtocol) -> WKWebView {
    let config = WKWebViewConfiguration()
    // ... apply config
    return WKWebView(frame: .zero, configuration: config)
}
```

---

## 🚨 COMMON ERRORS

### 1. "Permission denied" ngay cả khi đã allow
**Fix**: User đã deny permission trước đó
- Settings → Zyea+ → Reset permissions
- Reinstall app

### 2. "getUserMedia is not a function"
**Fix**: WebRTC config chưa được apply
- Verify AppDelegate.swift đã update
- Clean + Rebuild

### 3. Camera/Mic không hoạt động trong background
**Fix**: Cần UIBackgroundModes
- Check Info.plist có `audio` và `voip`

---

## ✅ CHECKLIST

Trước khi rebuild IPA:

- [ ] AppDelegate.swift đã update với fix mới
- [ ] Info.plist có NSCameraUsageDescription & NSMicrophoneUsageDescription
- [ ] capacitor.config.ts có webViewMediaCaptureEnabled: true
- [ ] Đã chạy `npx cap sync ios`
- [ ] Đã clean build folder trong Xcode
- [ ] Đã test trên simulator (nếu có cam/mic)

---

## 📞 SUPPORT

Nếu vẫn gặp lỗi:
1. Check console logs (Safari Web Inspector)
2. Verify tất cả files đã update đúng
3. Try với voice call trước (đơn giản hơn video call)

**Expected result**: 
- ✅ Permission dialog hiện ra
- ✅ User cho phép
- ✅ Call connects successfully
- ✅ Audio/Video streams work

---

Last updated: 2025-10-26

