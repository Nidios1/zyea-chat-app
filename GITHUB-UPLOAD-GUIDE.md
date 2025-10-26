# 📤 HƯỚNG DẪN UPLOAD LÊN GITHUB VÀ BUILD IPA

## 🎯 Mục tiêu
- Upload code lên GitHub
- Build IPA file cho iOS (cả Messenger và Zyea+app)
- Setup CI/CD tự động build

## 📦 BƯỚC 1: UPLOAD LÊN GITHUB

### 1.1. Khởi tạo Git Repository

```bash
cd zalo-clone

# Khởi tạo git (nếu chưa có)
git init

# Thêm tất cả file
git add .

# Commit
git commit -m "Initial commit - Zyea+ Social Network with 2 apps"
```

### 1.2. Tạo Repository trên GitHub

1. Truy cập: https://github.com/new
2. Đặt tên: `zyea-plus-social-network`
3. Chọn: **Private** (để bảo mật code)
4. **KHÔNG** tick "Initialize with README" (vì đã có code)
5. Click **Create repository**

### 1.3. Push Code lên GitHub

```bash
# Thêm remote
git remote add origin https://github.com/YOUR_USERNAME/zyea-plus-social-network.git

# Push code
git branch -M main
git push -u origin main
```

## 🍎 BƯỚC 2: BUILD IPA FILE

Có 3 cách build IPA:

### Cách 1: Build Local (Cần Mac + Xcode)

#### A. Setup iOS Project

**Messenger App:**
```bash
cd client
npm install
npm run build:win
npx cap add ios
npx cap sync ios
npx cap open ios
```

**Zyea+ App:**
```bash
cd zyea-plus-app
npm install
npm run build:win
npx cap add ios
npx cap sync ios
npx cap open ios
```

#### B. Config Xcode

1. Mở Xcode → Project Navigator
2. Select **App** target
3. **Signing & Capabilities**:
   - Team: Chọn Apple Developer Account
   - Bundle Identifier: 
     - Messenger: `com.zyea.hieudev`
     - Zyea+: `com.zyea.app`
4. **Info.plist** - Thêm URL Schemes:
   - Messenger: `zyeamessenger`
   - Zyea+: `zyeaplus`

#### C. Build IPA

```bash
# Archive app
Product → Archive

# Export IPA
Window → Organizer → Distribute App → Development/Ad Hoc
```

### Cách 2: Build với Codemagic (Khuyến nghị! ⭐)

Tôi thấy bạn đã có file `codemagic.yaml`. Codemagic là dịch vụ CI/CD miễn phí cho Flutter/React Native/Capacitor!

#### A. Setup Codemagic

1. Truy cập: https://codemagic.io
2. Đăng nhập bằng GitHub
3. Add application → Chọn repository của bạn
4. Codemagic sẽ tự động detect `codemagic.yaml`

#### B. Config Certificates

1. **Team settings** → **Code signing identities**
2. Upload:
   - iOS Certificate (.p12)
   - Provisioning Profile (.mobileprovision)
3. Hoặc dùng **Automatic code signing** với Apple ID

#### C. Trigger Build

1. Push code lên GitHub
2. Codemagic tự động build
3. Hoặc click **Start new build** trên Codemagic dashboard

#### D. Download IPA

Sau khi build xong:
1. **Builds** → Select build
2. **Artifacts** → Download IPA file
3. Install lên iPhone bằng TestFlight hoặc AltStore

### Cách 3: Build với GitHub Actions (Nâng cao)

#### Setup GitHub Actions

1. File workflow đã được tạo: `.github/workflows/build-ios.yml`
2. Cần setup **Secrets** trên GitHub:
   - Settings → Secrets and variables → Actions
   - Add secrets:
     - `APPLE_CERTIFICATE` (Base64 của .p12 file)
     - `APPLE_CERT_PASSWORD`
     - `APPLE_PROVISIONING_PROFILE` (Base64)

3. Push code → GitHub Actions tự động build
4. Download IPA từ **Actions** tab → Artifacts

**Lưu ý**: GitHub Actions với macOS runner **TỐN PHÍ**! (Free: 2000 phút/tháng cho public repo)

## 📝 SO SÁNH CÁC CÁCH BUILD

| Cách | Ưu điểm | Nhược điểm | Chi phí |
|------|---------|------------|---------|
| **Local (Mac + Xcode)** | ✅ Nhanh<br>✅ Kiểm soát tốt<br>✅ Debug dễ | ❌ Cần Mac<br>❌ Phải cài Xcode | Miễn phí |
| **Codemagic** | ✅ Không cần Mac<br>✅ Auto build<br>✅ Free 500 phút/tháng | ❌ Setup phức tạp<br>❌ Giới hạn build time | Miễn phí (có giới hạn) |
| **GitHub Actions** | ✅ Tích hợp GitHub<br>✅ Auto build | ❌ TỐN PHÍ<br>❌ Setup phức tạp | $0.08/phút (macOS) |

## 🎯 KHUYẾN NGHỊ

### Cho Beginner: Dùng Codemagic ⭐
```bash
1. Push code lên GitHub
2. Vào https://codemagic.io
3. Connect GitHub repo
4. Setup iOS certificates
5. Click "Start new build"
6. Download IPA sau khi build xong
```

### Cho Advanced: Setup Local Build trên Mac
```bash
1. Mua/mượn Mac
2. Cài Xcode từ App Store
3. Build như hướng dẫn ở trên
4. Export IPA
```

## 🔐 SETUP iOS CERTIFICATES

### Cách 1: Dùng Apple Developer Account ($99/năm)

1. Truy cập: https://developer.apple.com
2. **Certificates, IDs & Profiles**
3. Tạo:
   - iOS Distribution Certificate
   - App ID: `com.zyea.hieudev`, `com.zyea.app`
   - Provisioning Profile

### Cách 2: Dùng Free Developer Account (7 ngày)

1. Xcode → Preferences → Accounts
2. Add Apple ID (free)
3. Tạo iOS Development Certificate (tự động)
4. App chỉ chạy được 7 ngày
5. Phải re-sign sau 7 ngày

### Cách 3: Dùng AltStore (Không cần certificate)

1. Download AltStore: https://altstore.io
2. Cài AltStore trên iPhone
3. Drag & drop IPA file vào AltStore
4. App chạy được 7 ngày
5. Refresh mỗi 7 ngày

## 📱 CÀI ĐẶT IPA LÊN IPHONE

### Cách 1: TestFlight (Khuyến nghị)

```bash
1. Upload IPA lên App Store Connect
2. TestFlight → Add build
3. Add internal testers
4. Gửi link TestFlight cho user
5. User cài TestFlight app → Install
```

### Cách 2: AltStore (Miễn phí, không cần certificate)

```bash
1. Download AltStore: https://altstore.io
2. Cài AltStore trên iPhone (qua WiFi)
3. Drag IPA vào AltStore trên máy tính
4. App tự động cài lên iPhone
```

### Cách 3: Xcode (Local)

```bash
1. Connect iPhone vào Mac
2. Xcode → Window → Devices and Simulators
3. Select iPhone
4. Drag IPA vào Installed Apps
5. Trust certificate trên iPhone: Settings → General → VPN & Device Management
```

### Cách 4: Diawi (Upload & share link)

```bash
1. Truy cập: https://www.diawi.com
2. Upload IPA file
3. Copy link
4. Gửi link cho user
5. User mở link trên Safari → Install
```

## 🚀 WORKFLOW HOÀN CHỈNH

```
┌─────────────────────────────────────────┐
│  1. Code trên VSCode                    │
│     - Chỉnh sửa code                    │
│     - Test local                        │
└─────────────────────────────────────────┘
                ↓
┌─────────────────────────────────────────┐
│  2. Push lên GitHub                     │
│     git add .                           │
│     git commit -m "Update"              │
│     git push origin main                │
└─────────────────────────────────────────┘
                ↓
┌─────────────────────────────────────────┐
│  3. Codemagic Auto Build                │
│     - Detect push                       │
│     - Build iOS IPA                     │
│     - Email notification                │
└─────────────────────────────────────────┘
                ↓
┌─────────────────────────────────────────┐
│  4. Download IPA                        │
│     - Codemagic dashboard               │
│     - Download artifacts                │
└─────────────────────────────────────────┘
                ↓
┌─────────────────────────────────────────┐
│  5. Distribute                          │
│     - TestFlight (App Store Connect)    │
│     - AltStore (Direct install)         │
│     - Diawi (Share link)                │
└─────────────────────────────────────────┘
```

## 📚 TÀI LIỆU THAM KHẢO

- **Capacitor iOS**: https://capacitorjs.com/docs/ios
- **Codemagic Docs**: https://docs.codemagic.io
- **AltStore**: https://altstore.io
- **TestFlight**: https://developer.apple.com/testflight/

## ⚠️ LƯU Ý QUAN TRỌNG

### 1. Certificates & Provisioning Profiles
- Cần Apple Developer Account ($99/năm) cho production
- Free account chỉ chạy 7 ngày
- Phải renew/re-sign mỗi 7 ngày

### 2. Bundle ID
- Messenger: `com.zyea.hieudev`
- Zyea+: `com.zyea.app`
- Phải khớp với certificate

### 3. Deep Linking (URL Schemes)
- Messenger: `zyeamessenger://`
- Zyea+: `zyeaplus://`
- Phải config trong Info.plist

### 4. Privacy Permissions
Thêm vào Info.plist:
```xml
<key>NSCameraUsageDescription</key>
<string>Zyea+ cần quyền camera để chụp ảnh</string>
<key>NSPhotoLibraryUsageDescription</key>
<string>Zyea+ cần quyền truy cập thư viện ảnh</string>
<key>NSMicrophoneUsageDescription</key>
<string>Zyea+ cần quyền microphone cho video call</string>
```

## 🐛 XỬ LÝ LỖI THƯỜNG GẶP

### Lỗi: "Xcode project not found"
```bash
cd client
npx cap add ios
npx cap sync ios
```

### Lỗi: "Signing for requires a development team"
```bash
# Xcode → Signing & Capabilities → Select Team
```

### Lỗi: "App installation failed"
```bash
# Settings → General → VPN & Device Management → Trust app
```

### Lỗi: "Unable to install - already installed"
```bash
# Delete app from iPhone first
# Or change Bundle ID version
```

## 🎉 HOÀN THÀNH

Sau khi làm theo hướng dẫn này, bạn sẽ có:

✅ Code trên GitHub
✅ IPA file cho iOS
✅ CI/CD tự động build
✅ Cách distribute app cho users

**Good luck!** 🚀


