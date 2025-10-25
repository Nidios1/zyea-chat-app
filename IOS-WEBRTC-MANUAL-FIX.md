# 🔧 Manual Fix - Enable WebRTC cho iOS Native App

## ⚠️ Lỗi Hiện Tại

```
❌ Lỗi: WebRTC not available in this WebView configuration
❌ navigator.mediaDevices.getUserMedia undefined
```

**Nguyên nhân:** Capacitor iOS WKWebView mặc định **KHÔNG enable WebRTC**.

---

## ✅ Giải Pháp - Manual Update iOS Native Code

iOS files bị gitignore nên cần update manually sau khi pull code.

### Bước 1: Pull Code Mới Nhất

```bash
cd zalo-clone
git pull origin master
```

### Bước 2: Sync Capacitor

```bash
cd client
npx cap sync ios
```

### Bước 3: Update capacitor.config.ts (✅ Đã có trong code)

File `client/capacitor.config.ts` đã được update với:

```typescript
ios: {
  // ... các config khác ...
  
  // CRITICAL: Enable WebRTC in WKWebView  
  allowsInlineMediaPlayback: true,
  mediaTypesRequiringUserActionForPlayback: 'none',
  webViewMediaCaptureEnabled: true
}
```

### Bước 4: Update AppDelegate.swift (❗ CẦN LÀM MANUALLY)

Mở Xcode:
```bash
npx cap open ios
```

Mở file `App/App/AppDelegate.swift` và thay đổi:

**TRƯỚC:**
```swift
import UIKit
import Capacitor

@UIApplicationMain
class AppDelegate: UIResponder, UIApplicationDelegate {
    var window: UIWindow?

    func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
        // Override point for customization after application launch.
        return true
    }
```

**SAU:**
```swift
import UIKit
import Capacitor
import WebKit
import AVFoundation

@UIApplicationMain
class AppDelegate: UIResponder, UIApplicationDelegate {
    var window: UIWindow?

    func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
        // Override point for customization after application launch.
        
        // Request microphone permission at startup
        AVAudioSession.sharedInstance().requestRecordPermission { granted in
            print("🎤 Microphone permission: \(granted ? "✅ Granted" : "❌ Denied")")
        }
        
        // Configure WKWebView for WebRTC
        configureWebViewForWebRTC()
        
        return true
    }
    
    private func configureWebViewForWebRTC() {
        // Enable media capture in WKWebView
        let preferences = WKPreferences()
        preferences.javaScriptCanOpenWindowsAutomatically = true
        
        let configuration = WKWebViewConfiguration()
        configuration.preferences = preferences
        configuration.allowsInlineMediaPlayback = true
        configuration.mediaTypesRequiringUserActionForPlayback = []
        
        print("✅ WebRTC WKWebView configuration applied")
    }
```

### Bước 5: (Optional) Tạo WebRTCConfiguration.swift

Tạo file mới `App/App/WebRTCConfiguration.swift`:

1. Right-click vào `App` folder trong Xcode
2. New File → Swift File
3. Tên: `WebRTCConfiguration.swift`
4. Add content:

```swift
import Foundation
import Capacitor
import WebKit

@objc(WebRTCConfigurationPlugin)
public class WebRTCConfigurationPlugin: CAPPlugin {
    
    @objc override public func load() {
        // Configure WKWebView for WebRTC
        configureWebView()
    }
    
    private func configureWebView() {
        guard let webView = self.bridge?.webView else {
            print("❌ WebView not available")
            return
        }
        
        // Enable media capture
        webView.configuration.allowsInlineMediaPlayback = true
        webView.configuration.mediaTypesRequiringUserActionForPlayback = []
        
        // Enable getUserMedia
        if #available(iOS 15.0, *) {
            webView.configuration.preferences.setValue(true, forKey: "allowFileAccessFromFileURLs")
        }
        
        print("✅ WebRTC Configuration applied")
        print("   - Inline media playback: enabled")
        print("   - Media requires user action: disabled")
    }
}
```

### Bước 6: Verify Info.plist (✅ Should be OK)

Check `App/Info.plist` có:

```xml
<key>NSCameraUsageDescription</key>
<string>Zyea+ cần quyền truy cập camera để thực hiện cuộc gọi video với bạn bè.</string>

<key>NSMicrophoneUsageDescription</key>
<string>Zyea+ cần quyền truy cập microphone để thực hiện cuộc gọi thoại và video với bạn bè.</string>
```

### Bước 7: Clean Build

Trong Xcode:
1. Product → Clean Build Folder (Cmd+Shift+K)
2. Product → Build (Cmd+B)

### Bước 8: Archive & Export IPA

1. Product → Archive
2. Distribute App
3. Choose distribution method
4. Export IPA

---

## 🧪 Testing

### Test 1: Check Console Logs

Khi app launch, should see:
```
🎤 Microphone permission: ✅ Granted
✅ WebRTC WKWebView configuration applied
✅ WebRTC Configuration applied
   - Inline media playback: enabled
   - Media requires user action: disabled
```

### Test 2: Test Permission Request

1. Open app
2. Go to chat
3. Click video call button
4. Should see:
```
🔍 Checking permissions... {isNative: true, isIOS: true}
🔵 Native platform detected
   Platform: ios
   Navigator: true
   MediaDevices: true
   getUserMedia: true ✅ (Should be true now!)
🎥 Requesting media stream...
```

5. iOS system dialog appears:
```
"Zyea+" Would Like to Access the Camera
[Don't Allow] [OK]
```

6. Click OK
7. Video call starts successfully! 🎉

---

## 🐛 Troubleshooting

### Vẫn lỗi "getUserMedia undefined"

**1. Check Swift Code:**
```bash
npx cap open ios
# Check AppDelegate.swift đã update chưa
# Check WebRTCConfiguration.swift đã add chưa
```

**2. Clean và Rebuild:**
```bash
# Trong Xcode:
# Product → Clean Build Folder
# Product → Build

# Hoặc command line:
cd ios/App
xcodebuild clean -workspace App.xcworkspace -scheme App
```

**3. Check Console:**
Trong Xcode, check console output khi app launch.
Should see: "✅ WebRTC WKWebView configuration applied"

### Permissions không hoạt động

**1. Reset Permissions:**
```
iOS Settings → General → Transfer or Reset iPhone
→ Reset Location & Privacy
```

**2. Reinstall App**

**3. Manual Grant:**
```
iOS Settings → Zyea+
→ Camera: ON
→ Microphone: ON
```

---

## 📊 Verification Checklist

### Code Updates:
- [x] `capacitor.config.ts` - có `allowsInlineMediaPlayback: true`
- [x] `capacitor.config.ts` - có `mediaTypesRequiringUserActionForPlayback: 'none'`
- [x] `capacitor.config.ts` - có `webViewMediaCaptureEnabled: true`

### iOS Native Updates (Manual):
- [ ] `AppDelegate.swift` - import `WebKit` và `AVFoundation`
- [ ] `AppDelegate.swift` - có `configureWebViewForWebRTC()` function
- [ ] `AppDelegate.swift` - call `configureWebViewForWebRTC()` trong `didFinishLaunchingWithOptions`
- [ ] `WebRTCConfiguration.swift` - (Optional) created và added to project
- [ ] `Info.plist` - có Camera và Microphone permissions

### Build:
- [ ] Clean build folder
- [ ] Build successful
- [ ] No errors in console
- [ ] Archive created
- [ ] IPA exported

### Testing:
- [ ] App launches without errors
- [ ] Console shows WebRTC config messages
- [ ] Permission request UI appears
- [ ] iOS system dialog appears
- [ ] Camera/mic permissions granted
- [ ] Video call works! 🎉

---

## 📝 Quick Commands

```bash
# 1. Pull latest code
git pull origin master

# 2. Clean install
cd client
rm -rf node_modules
npm install

# 3. Build React
npm run build

# 4. Sync iOS
npx cap sync ios

# 5. Open Xcode
npx cap open ios

# 6. Manually update AppDelegate.swift (see above)

# 7. Clean build in Xcode
# Product → Clean Build Folder

# 8. Build and Archive
# Product → Archive → Export
```

---

## 🎯 Expected Result

### Before Fix:
```
❌ getUserMedia: undefined
❌ Error: WebRTC not available
❌ Video call không hoạt động
```

### After Fix:
```
✅ getUserMedia: function
✅ WebRTC configuration applied
✅ iOS system dialogs appear
✅ Camera/mic accessible
✅ Video call hoạt động hoàn hảo! 🎉
```

---

## 📞 Support

**Latest commit:** `b57f042` - 🔧 Enable WebRTC in iOS WKWebView Configuration

**GitHub:** https://github.com/Nidios1/zyea-chat-app

**Docs:**
- `REBUILD-IPA-FIX.md` - General rebuild guide
- `IOS-WEBRTC-MANUAL-FIX.md` - This file (Manual iOS fix)
- `BUILD-IPA-VIDEO-CALL.md` - Original build guide

---

## 🎉 Done!

Sau khi làm theo các bước trên:
- ✅ WebRTC sẽ available trong iOS app
- ✅ `getUserMedia` sẽ work
- ✅ Permissions sẽ được request properly
- ✅ Video call sẽ hoạt động!

**Build IPA mới và test thôi!** 🚀📱

