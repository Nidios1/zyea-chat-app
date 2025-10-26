# 🚀 Hướng Dẫn Build IPA cho Zyea Chat App

## 📋 Mục Lục
- [Yêu Cầu Hệ Thống](#yêu-cầu-hệ-thống)
- [Build IPA với Codemagic](#build-ipa-với-codemagic)
- [Build IPA với GitHub Actions](#build-ipa-với-github-actions)
- [Build IPA Local (Xcode)](#build-ipa-local-xcode)
- [Troubleshooting](#troubleshooting)

---

## 🖥️ Yêu Cầu Hệ Thống

### Để Build Local:
- **macOS**: 13.0 (Ventura) hoặc cao hơn
- **Xcode**: 15.2 hoặc cao hơn
- **Node.js**: 18.17.0 hoặc cao hơn
- **CocoaPods**: Mới nhất
- **Capacitor CLI**: 5.x

### Tài Khoản Cần Thiết:
- Apple Developer Account (có thể dùng Free hoặc Paid)
- Provisioning Profile và Certificate
- (Optional) App Store Connect API Key cho TestFlight

---

## ☁️ Build IPA với Codemagic

### 1. Setup Codemagic

1. Truy cập [Codemagic](https://codemagic.io/)
2. Kết nối với GitHub repository: `https://github.com/Nidios1/zyea-chat-app.git`
3. Chọn workflow: `ios-workflow`

### 2. Cấu Hình Environment Variables

Trong Codemagic Dashboard, thêm các biến sau vào **Environment Variables**:

```
ios_credentials (group):
  - APP_STORE_CONNECT_ISSUER_ID: <Your Issuer ID>
  - APP_STORE_CONNECT_KEY_IDENTIFIER: <Your Key ID>
  - APP_STORE_CONNECT_PRIVATE_KEY: <Your .p8 key content>
  - CERTIFICATE_PRIVATE_KEY: <Your .p12 certificate>
```

### 3. Upload Certificates

1. **Certificates** → Upload file `.p12` 
2. **Provisioning Profiles** → Upload file `.mobileprovision`

### 4. Trigger Build

**Tự động:**
- Push code lên branch `main`, `develop`, hoặc `release/*`

**Thủ công:**
- Vào Codemagic Dashboard → Start new build

### 5. Download IPA

Sau khi build thành công:
- Vào **Artifacts** → Download file `.ipa`
- File cũng sẽ được gửi qua email

---

## 🔧 Build IPA với GitHub Actions

### 1. Setup GitHub Secrets

Vào **Settings** → **Secrets and variables** → **Actions**, thêm:

```
Required Secrets:
  - BUILD_CERTIFICATE_BASE64: Base64 của file .p12
  - P12_PASSWORD: Mật khẩu của file .p12
  - BUILD_PROVISION_PROFILE_BASE64: Base64 của file .mobileprovision
  - KEYCHAIN_PASSWORD: Password tạm (bất kỳ)
  - TEAM_ID: Apple Team ID
  - PROVISIONING_PROFILE_NAME: Tên Provisioning Profile

Optional (cho TestFlight):
  - APP_STORE_CONNECT_API_KEY: App Store Connect API Key (.p8)
  - APP_STORE_CONNECT_ISSUER_ID: Issuer ID
  - APP_STORE_CONNECT_KEY_ID: Key ID
```

### 2. Convert Certificates to Base64

**macOS/Linux:**
```bash
# Certificate
base64 -i YourCertificate.p12 | pbcopy

# Provisioning Profile
base64 -i YourProfile.mobileprovision | pbcopy
```

**Windows (PowerShell):**
```powershell
# Certificate
[Convert]::ToBase64String([IO.File]::ReadAllBytes("YourCertificate.p12")) | Set-Clipboard

# Provisioning Profile
[Convert]::ToBase64String([IO.File]::ReadAllBytes("YourProfile.mobileprovision")) | Set-Clipboard
```

### 3. Trigger Build

**Tự động:**
- Push code lên branch `main` hoặc `develop`

**Thủ công:**
- Vào **Actions** → **Build iOS IPA** → **Run workflow**
- Chọn build type: `development`, `adhoc`, hoặc `appstore`

### 4. Download IPA

- Vào **Actions** → Build thành công → **Artifacts**
- Download file: `zyea-chat-ios-<build-number>.zip`

---

## 💻 Build IPA Local (Xcode)

### 1. Clone Repository

```bash
git clone https://github.com/Nidios1/zyea-chat-app.git
cd zyea-chat-app/client
```

### 2. Install Dependencies

```bash
# Install Node dependencies
npm install --legacy-peer-deps

# Build React app
npm run build

# Install CocoaPods
cd ios/App
pod install
cd ../..

# Sync Capacitor
npx cap sync ios
```

### 3. Open Xcode

```bash
cd ios/App
open App.xcworkspace
```

### 4. Configure Signing

1. Select **App** target trong Xcode
2. Vào tab **Signing & Capabilities**
3. Chọn **Team** của bạn
4. Đảm bảo **Automatically manage signing** được bật (hoặc tự chọn Provisioning Profile)

### 5. Build IPA

**Option 1: Xcode GUI**
1. Product → Archive
2. Sau khi archive xong, chọn **Distribute App**
3. Chọn phương thức: Ad Hoc, Development, hoặc App Store
4. Follow wizard để export IPA

**Option 2: Command Line**

```bash
# Archive
xcodebuild -workspace App.xcworkspace \
  -scheme App \
  -configuration Release \
  -sdk iphoneos \
  -archivePath build/App.xcarchive \
  archive

# Export IPA
xcodebuild -exportArchive \
  -archivePath build/App.xcarchive \
  -exportPath build/ipa \
  -exportOptionsPlist ../../ios-export-options.plist
```

### 6. Install IPA

**Option 1: iTunes/Finder**
- Kết nối iPhone → Drag & drop file IPA vào Finder

**Option 2: Xcode Devices**
- Window → Devices and Simulators
- Chọn thiết bị → Click (+) → Chọn file IPA

**Option 3: TestFlight**
- Upload IPA lên App Store Connect
- Invite testers qua TestFlight

---

## 🔍 Troubleshooting

### Lỗi: "Failed to build iOS app"

**Nguyên nhân thường gặp:**
1. Node dependencies chưa được install đầy đủ
2. CocoaPods chưa install
3. Xcode version không tương thích

**Giải pháp:**
```bash
cd client
rm -rf node_modules package-lock.json
npm install --legacy-peer-deps

cd ios/App
rm -rf Pods Podfile.lock
pod install --repo-update
```

### Lỗi: "Code signing error"

**Giải pháp:**
1. Kiểm tra Certificate và Provisioning Profile còn hạn
2. Đảm bảo Bundle ID khớp với Provisioning Profile
3. Kiểm tra Team ID trong Xcode

### Lỗi: "Build took too long"

**Giải pháp:**
1. Tăng `max_build_duration` trong `codemagic.yaml`
2. Optimize React build bằng cách bật production mode
3. Cache node_modules

### Lỗi: "Archive not found"

**Giải pháp:**
```bash
# Clean build
cd client/ios/App
xcodebuild clean -workspace App.xcworkspace -scheme App

# Rebuild
xcodebuild -workspace App.xcworkspace \
  -scheme App \
  -configuration Release \
  archive
```

---

## 📱 Test IPA

### Test trên Simulator

```bash
cd client/ios/App
xcodebuild -workspace App.xcworkspace \
  -scheme App \
  -configuration Debug \
  -sdk iphonesimulator \
  -derivedDataPath build

# Run simulator
open -a Simulator
xcrun simctl install booted build/Build/Products/Debug-iphonesimulator/App.app
xcrun simctl launch booted com.zyea.hieudev
```

### Test trên Real Device

1. **Development Build**: Cần add UDID vào Provisioning Profile
2. **Ad Hoc Build**: Cần add UDID vào Provisioning Profile
3. **TestFlight**: Không cần UDID, invite qua email

---

## 📚 Tài Liệu Tham Khảo

- [Capacitor iOS Documentation](https://capacitorjs.com/docs/ios)
- [Codemagic Documentation](https://docs.codemagic.io/)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Apple Developer Documentation](https://developer.apple.com/documentation/)
- [Xcode Documentation](https://developer.apple.com/documentation/xcode)

---

## 🎯 Quick Commands

```bash
# Build React app
cd client && npm run build

# Sync Capacitor
cd client && npx cap sync ios

# Open Xcode
cd client/ios/App && open App.xcworkspace

# Clean Xcode build
cd client/ios/App && xcodebuild clean

# Install pods
cd client/ios/App && pod install

# Run on simulator
cd client && npx cap run ios

# Update Capacitor
cd client && npx cap update ios
```

---

## ✅ Checklist Trước Khi Build

- [ ] Đã cập nhật version trong `Info.plist`
- [ ] Đã test app trên simulator
- [ ] Đã kiểm tra tất cả API endpoints
- [ ] Certificate và Provisioning Profile còn hạn
- [ ] Bundle ID đúng với App Store Connect
- [ ] Icon và splash screen đã được update
- [ ] Đã test trên thiết bị thật (nếu có thể)
- [ ] Đã commit và push code lên GitHub

---

## 📞 Hỗ Trợ

Nếu gặp vấn đề, hãy:
1. Kiểm tra [Troubleshooting](#troubleshooting)
2. Xem log chi tiết trong Codemagic/GitHub Actions
3. Mở issue trên GitHub repository

---

**Happy Building! 🚀**

