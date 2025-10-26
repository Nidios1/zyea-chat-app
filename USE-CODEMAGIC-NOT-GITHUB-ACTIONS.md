# ⚠️ QUAN TRỌNG: Dùng Codemagic thay vì GitHub Actions

## ❌ Tại sao KHÔNG dùng GitHub Actions?

- **macOS runner TỐN PHÍ**: $0.08/phút (~$5-10 mỗi lần build)
- **Private repo**: Không có free tier cho macOS
- **Public repo**: Chỉ 2000 phút/tháng (hết rất nhanh)

## ✅ Tại sao dùng Codemagic?

- **MIỄN PHÍ**: 500 phút/tháng
- **Không cần Mac**: Build trên cloud
- **Tự động detect** `codemagic.yaml`
- **Hỗ trợ iOS & Android**
- **Easy setup**: Chỉ cần kết nối GitHub

---

## 🚀 HƯỚNG DẪN SỬ DỤNG CODEMAGIC

### Bước 1: Đăng ký Codemagic

1. Truy cập: **https://codemagic.io**
2. Click **Sign up with GitHub**
3. Authorize Codemagic access

### Bước 2: Add Application

1. Click **Add application**
2. Chọn repository: `Nidios1/zyea-plus-social-network`
3. Codemagic sẽ tự động detect `codemagic.yaml`

### Bước 3: Setup iOS Certificates (Quan trọng!)

#### Option 1: Automatic Code Signing (Đơn giản nhất)

1. **Team settings** → **Code signing identities**
2. Click **Add key**
3. Nhập Apple ID và App-specific password
4. Codemagic tự động generate certificates

#### Option 2: Manual Upload

1. Export certificate từ Xcode (.p12 file)
2. Export provisioning profile (.mobileprovision)
3. Upload lên Codemagic:
   - **Team settings** → **Code signing identities**
   - **iOS certificates** → Upload .p12
   - **iOS provisioning profiles** → Upload .mobileprovision

### Bước 4: Configure Workflows

File `codemagic.yaml` đã được config sẵn với 4 workflows:

#### 1. **ios-messenger-workflow** (Zyea+ Messenger iOS)
- App ID: `com.zyea.hieudev`
- Build Messenger app

#### 2. **ios-zyeaplus-workflow** (Zyea+ NewsFeed iOS)
- App ID: `com.zyea.app`
- Build NewsFeed app

#### 3. **android-messenger-workflow** (Messenger Android)
- Build APK cho Messenger

#### 4. **android-zyeaplus-workflow** (NewsFeed Android)
- Build APK cho NewsFeed

### Bước 5: Start Build

1. Chọn workflow muốn build
2. Click **Start new build**
3. Chọn branch: `main`
4. Click **Start new build**

### Bước 6: Download IPA/APK

Sau khi build xong (~5-10 phút):
1. Click vào build
2. **Artifacts** tab
3. Download IPA (iOS) hoặc APK (Android)

---

## 📝 Cấu hình cần thiết

### iOS App IDs cần tạo trên Apple Developer:

1. **Messenger**: `com.zyea.hieudev`
   - URL Schemes: `zyeamessenger`
   
2. **NewsFeed**: `com.zyea.app`
   - URL Schemes: `zyeaplus`

### Permissions cần thêm vào Info.plist:

```xml
<key>NSCameraUsageDescription</key>
<string>Zyea+ cần quyền camera để chụp ảnh</string>

<key>NSPhotoLibraryUsageDescription</key>
<string>Zyea+ cần quyền thư viện ảnh</string>

<key>NSMicrophoneUsageDescription</key>
<string>Zyea+ cần quyền microphone cho video call</string>
```

---

## 💰 Chi phí so sánh

| Service | Free Tier | iOS Build | Android Build |
|---------|-----------|-----------|---------------|
| **Codemagic** | ✅ 500 phút/tháng | ✅ Miễn phí | ✅ Miễn phí |
| **GitHub Actions** | ❌ $0.08/phút macOS | ❌ ~$5-10/build | ✅ Miễn phí |
| **Local (Mac)** | ✅ Cần có Mac | ✅ Miễn phí | ✅ Miễn phí |

**Kết luận**: Codemagic là lựa chọn tốt nhất cho iOS build!

---

## 🔧 Troubleshooting

### Lỗi: "Code signing failed"
**Fix**: Upload đúng certificate và provisioning profile

### Lỗi: "Bundle ID mismatch"
**Fix**: Kiểm tra Bundle ID trong `capacitor.config.ts` khớp với certificate

### Lỗi: "Build timeout"
**Fix**: Giảm dependencies hoặc upgrade Codemagic plan

### Lỗi: "npm install failed"
**Fix**: Kiểm tra `package.json` có hợp lệ không

---

## 📚 Tài liệu

- **Codemagic Docs**: https://docs.codemagic.io
- **iOS Code Signing**: https://docs.codemagic.io/code-signing/ios-code-signing/
- **Capacitor iOS**: https://capacitorjs.com/docs/ios

---

## 🎯 Workflow hoàn chỉnh

```
1. Code trên local
   ↓
2. Commit & Push lên GitHub
   ↓
3. Codemagic auto detect push
   ↓
4. Build iOS IPA (5-10 phút)
   ↓
5. Download IPA từ Artifacts
   ↓
6. Install trên iPhone:
   - TestFlight (khuyến nghị)
   - AltStore (miễn phí)
   - Diawi (share link)
```

---

## ✅ GitHub Actions đã bị DISABLE

File `.github/workflows/build-ios.yml` đã bị xóa để tránh tốn phí.

Nếu muốn enable lại (không khuyến nghị):
1. Restore file từ git history
2. Setup secrets trên GitHub
3. Chuẩn bị trả phí cho macOS runner

**NHƯNG khuyến nghị dùng Codemagic thay thế!**

---

Created by: HieuDev
Date: October 2024

