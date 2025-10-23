# 🔧 Sửa Lỗi iOS Không Full Màn Hình (Notch/Tai Thỏ iPhone)

## 📱 Vấn Đề
Khi cài IPA lên iPhone có tai thỏ (iPhone 11, 12, 13, 14, 15, 16 Pro), ứng dụng không hiển thị full màn hình, không tận dụng được vùng tai thỏ/Dynamic Island.

## ✅ Giải Pháp Đã Áp Dụng

### 1. Cập Nhật `capacitor.config.ts`
```typescript
// iOS specific config
ios: {
  contentInset: 'never',           // ← CHANGED: 'always' → 'never'
  preferredContentMode: 'mobile',
  scrollEnabled: false,             // ← CHANGED: true → false
  allowsLinkPreview: false,
  limitsNavigationsToAppBoundDomains: false
},

// StatusBar config
StatusBar: {
  style: 'light',                   // ← CHANGED: 'dark' → 'light'
  backgroundColor: '#0084ff',
  overlaysWebView: false            // ← CHANGED: true → false
}
```

**Giải Thích:**
- `contentInset: 'never'` - Không tự động thêm padding, để app control
- `scrollEnabled: false` - Tắt scroll của WebView (app tự xử lý)
- `overlaysWebView: false` - Status bar không overlay lên WebView
- `style: 'light'` - Chữ trắng trên status bar (vì background xanh)

### 2. Sửa `safe-area.css`
```css
/* CRITICAL: Do NOT add padding-top to body on iOS */
@supports (padding-top: env(safe-area-inset-top)) {
  @media (max-width: 768px) {
    body, #root {
      padding-top: 0 !important;
      margin-top: 0 !important;
    }
  }
}
```

**Giải Thích:**
- Loại bỏ padding-top trên body - nó gây lỗi layout
- Các component riêng lẻ (Header, ChatArea) tự xử lý safe area

### 3. Tạo Script Auto-Config `configure-ios-info-plist.js`
Script này tự động thêm các key cần thiết vào `Info.plist`:

```xml
<key>UIViewControllerBasedStatusBarAppearance</key>
<true/>
<key>UIStatusBarHidden</key>
<false/>
<key>UIStatusBarStyle</key>
<string>UIStatusBarStyleLightContent</string>
<key>UIRequiresFullScreen</key>
<false/>
<key>UILaunchStoryboardName</key>
<string>LaunchScreen</string>
```

## 🚀 Các Bước Để Build Lại IPA

### Bước 1: Build React App
```bash
cd zalo-clone/client
npm run build
```

### Bước 2: Sync với iOS (nếu chưa có folder ios)
```bash
# Thêm iOS platform nếu chưa có
npx cap add ios

# Hoặc sync nếu đã có
npx cap sync ios
```

### Bước 3: Chạy Script Config Info.plist
```bash
npm run ios:config
```

Hoặc chạy trực tiếp:
```bash
node configure-ios-info-plist.js
```

### Bước 4: Mở Xcode
```bash
npx cap open ios
```

### Bước 5: Config Trong Xcode

#### A. Signing & Capabilities
1. Select target **App**
2. Vào tab **Signing & Capabilities**
3. Chọn Team và Bundle ID của bạn
4. Verify provisioning profile

#### B. Deployment Info
1. Vào tab **General** → **Deployment Info**
2. **UNCHECK** "Requires full screen" (quan trọng!)
3. **Status Bar Style**: Default (không ẩn)
4. Chọn orientations bạn muốn support:
   - ✅ Portrait
   - ✅ Landscape Left/Right (optional)

#### C. Build Settings
1. Tìm "Launch Screen"
2. Verify: **Launch Screen File** = `LaunchScreen`

#### D. Info.plist Manual Check
Verify các keys đã được thêm (script đã làm tự động):
- ✅ UIViewControllerBasedStatusBarAppearance = YES
- ✅ UIStatusBarHidden = NO
- ✅ UIStatusBarStyle = UIStatusBarStyleLightContent
- ✅ UIRequiresFullScreen = NO
- ✅ UILaunchStoryboardName = LaunchScreen

### Bước 6: Archive và Export IPA

#### Option A: Xcode Manual Archive (Recommended)
1. Trong Xcode: **Product** → **Archive**
2. Chờ build xong (có thể mất 5-10 phút)
3. Khi Archive thành công, cửa sổ Organizer mở
4. Click **Distribute App**
5. Chọn **Ad Hoc** hoặc **Development**
6. **Next** → Chọn provisioning profile
7. **Export** → Chọn thư mục save IPA

#### Option B: GitHub Actions (nếu đã setup)
1. Commit và push changes:
   ```bash
   git add .
   git commit -m "fix: iOS fullscreen notch support"
   git push
   ```
2. Vào GitHub Actions → chờ build
3. Download IPA artifact

### Bước 7: Cài IPA Lên iPhone
```bash
# Dùng AltStore
# Hoặc dùng Xcode
# Hoặc dùng TestFlight (nếu bạn có Apple Developer Account)
```

## 🧪 Test Trên iPhone

### Devices Cần Test
- ✅ iPhone 11 (tai thỏ)
- ✅ iPhone 12/13/14 (tai thỏ nhỏ hơn)
- ✅ iPhone 15/16 Pro (Dynamic Island)

### Checklist
- [ ] App mở full màn hình
- [ ] Status bar hiển thị (thời gian, pin, sóng)
- [ ] Content KHÔNG bị che bởi tai thỏ
- [ ] Header app có padding phù hợp với safe area
- [ ] Bottom navigation không bị che bởi home indicator
- [ ] Rotate landscape hoạt động tốt (nếu enable)
- [ ] Chat area scroll mượt mà
- [ ] Input keyboard không che content

## 🔍 Debug Nếu Vẫn Lỗi

### A. Enable Debug Overlay (Visualize Safe Area)
Mở file `src/styles/safe-area.css`, uncomment phần debug:

```css
/* Debug mode - visualize safe areas */
@media (max-width: 768px) {
  body::before {
    content: '';
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    height: env(safe-area-inset-top);
    background: rgba(255, 0, 0, 0.3);  /* Red = Top safe area */
    z-index: 99999;
    pointer-events: none;
  }

  body::after {
    content: '';
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    height: env(safe-area-inset-bottom);
    background: rgba(0, 255, 0, 0.3);  /* Green = Bottom safe area */
    z-index: 99999;
    pointer-events: none;
  }
}
```

Build lại → Bạn sẽ thấy vùng đỏ (safe area top) và xanh lá (safe area bottom)

### B. Check Safari Web Inspector
1. Kết nối iPhone qua USB
2. Mở Safari trên Mac
3. **Develop** → Chọn iPhone → **App (localhost)**
4. Check console errors
5. Check computed styles của `body` và `#root`
6. Verify `env(safe-area-inset-top)` có giá trị (ví dụ: 44px cho iPhone 11)

### C. Common Issues

#### Issue 1: Vẫn có padding-top trên body
**Solution:** Clear cache và hard reload
```bash
# Trong Xcode
Product → Clean Build Folder (Cmd + Shift + K)
# Xóa app khỏi iPhone
# Build và cài lại
```

#### Issue 2: Status bar bị ẩn
**Solution:** Check Info.plist
```xml
<key>UIStatusBarHidden</key>
<false/>  <!-- Phải là false -->
```

#### Issue 3: Content bị che bởi tai thỏ
**Solution:** Check Header component có `padding-top`:
```css
@media (max-width: 768px) {
  padding-top: calc(0.75rem + env(safe-area-inset-top));
}
```

#### Issue 4: Bottom bị che bởi home indicator
**Solution:** Check input container có `padding-bottom`:
```css
@media (max-width: 768px) {
  padding-bottom: calc(0.75rem + env(safe-area-inset-bottom));
}
```

## 📋 Files Đã Thay Đổi

```
zalo-clone/client/
├── capacitor.config.ts           ← iOS config updated
├── src/
│   └── styles/
│       └── safe-area.css         ← Body padding removed
├── configure-ios-info-plist.js   ← NEW: Auto config script
└── FIX_IOS_FULLSCREEN.md         ← NEW: This guide
```

## 🎯 Expected Result

Sau khi build với config mới:

```
┌─────────────────────────────────┐
│  🕐 9:41  📶  🔋                │ ← Status bar (visible)
├─────────────────────────────────┤
│  ← Zyea+ 💬         ⚙️ 🔔      │ ← App header (với safe area padding)
├─────────────────────────────────┤
│                                 │
│  Chat Content                   │
│  Full screen                    │
│  Không bị che                   │
│                                 │
├─────────────────────────────────┤
│  📱 💬 👥 👤                    │ ← Bottom nav (với safe area padding)
└─────────────────────────────────┘
         ───                        ← Home indicator (visible)
```

## 💡 Tips

1. **Luôn test trên thiết bị thật** - Simulator có thể không hiển thị đúng safe areas
2. **Test nhiều models** - iPhone 11 khác iPhone 15 Pro
3. **Test cả portrait và landscape** - Safe areas khác nhau
4. **Clear cache khi update** - Xóa app và cài lại để chắc chắn

## 🔗 Tài Liệu Tham Khảo

- [Apple Human Interface Guidelines - Safe Area](https://developer.apple.com/design/human-interface-guidelines/layout)
- [Capacitor iOS Configuration](https://capacitorjs.com/docs/ios/configuration)
- [CSS env() - Safe Area Insets](https://developer.mozilla.org/en-US/docs/Web/CSS/env)

## ✅ Checklist Trước Khi Build

- [ ] Đã run `npm run build`
- [ ] Đã run `npm run ios:config`
- [ ] Đã verify Info.plist có đủ keys
- [ ] Đã config Signing trong Xcode
- [ ] Đã UNCHECK "Requires full screen"
- [ ] Đã verify capacitor.config.ts
- [ ] Đã verify safe-area.css

---

**Lưu Ý:** Sau khi apply các fix này, nhớ commit lên GitHub để GitHub Actions có thể build IPA tự động với config đúng!

```bash
git add .
git commit -m "fix: iOS fullscreen support for notch devices (iPhone 11+)"
git push
```

🎉 **Good luck!** Nếu còn vấn đề, check lại từng bước trong guide này.

