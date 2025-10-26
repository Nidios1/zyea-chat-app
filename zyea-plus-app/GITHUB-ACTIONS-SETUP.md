# 🚀 Hướng dẫn Build IPA trên GitHub Actions

Tài liệu này hướng dẫn chi tiết cách setup và sử dụng GitHub Actions để build file IPA cho iOS app.

## 📋 Mục lục

1. [Yêu cầu](#yêu-cầu)
2. [Push code lên GitHub](#push-code-lên-github)
3. [Setup GitHub Secrets](#setup-github-secrets-tùy-chọn)
4. [Chạy workflow](#chạy-workflow)
5. [Download IPA](#download-ipa)
6. [Cài đặt IPA](#cài-đặt-ipa)
7. [Troubleshooting](#troubleshooting)

## ✅ Yêu cầu

- [x] Code đã được build thành công locally
- [x] Có tài khoản GitHub
- [x] Repository đã được tạo: https://github.com/Nidios1/zyea-plus-social-network
- [ ] Apple Developer Account (chỉ cần cho production builds)

## 📤 Push code lên GitHub

### Cách 1: Sử dụng script tự động (Khuyến nghị)

1. Mở Command Prompt hoặc PowerShell
2. Di chuyển vào thư mục `zyea-plus-app`
3. Chạy script:

```bash
push-to-github.bat
```

4. Nhập commit message hoặc Enter để dùng message mặc định
5. Đợi code được push lên GitHub

### Cách 2: Push thủ công

```bash
# Di chuyển vào thư mục zyea-plus-app
cd c:\xampp\htdocs\zalo-clone\zyea-plus-app

# Khởi tạo git (nếu chưa có)
git init

# Thêm remote repository
git remote add origin https://github.com/Nidios1/zyea-plus-social-network.git

# Add tất cả files
git add .

# Commit
git commit -m "Add Zyea+ iOS app with GitHub Actions"

# Push lên GitHub
git branch -M main
git push -u origin main
```

## 🔐 Setup GitHub Secrets (Tùy chọn)

⚠️ **Chỉ cần nếu bạn muốn build signed IPA (Ad Hoc hoặc App Store)**

Với **development build**, bạn có thể bỏ qua phần này và vẫn build được IPA để test.

### Bước 1: Chuẩn bị Certificate và Provisioning Profile

#### Trên Mac:

1. Mở **Keychain Access**
2. Tìm certificate iOS Development hoặc iOS Distribution
3. Right-click → Export "iPhone Developer: ..."
4. Lưu thành file `.p12` với password mạnh

5. Download Provisioning Profile:
   - Truy cập [Apple Developer Portal](https://developer.apple.com/account)
   - Certificates, Identifiers & Profiles → Profiles
   - Download profile (file `.mobileprovision`)

### Bước 2: Convert sang Base64

#### Trên Mac/Linux:

```bash
# Certificate
base64 -i YourCertificate.p12 | pbcopy

# Provisioning Profile
base64 -i YourProfile.mobileprovision | pbcopy
```

#### Trên Windows (PowerShell):

```powershell
# Certificate
[Convert]::ToBase64String([IO.File]::ReadAllBytes("YourCertificate.p12")) | Set-Clipboard

# Provisioning Profile
[Convert]::ToBase64String([IO.File]::ReadAllBytes("YourProfile.mobileprovision")) | Set-Clipboard
```

### Bước 3: Thêm Secrets vào GitHub

1. Truy cập: https://github.com/Nidios1/zyea-plus-social-network/settings/secrets/actions

2. Click **"New repository secret"**

3. Thêm các secrets sau:

| Secret Name | Mô tả | Ví dụ |
|------------|-------|-------|
| `BUILD_CERTIFICATE_BASE64` | Certificate (.p12) đã encode base64 | `MIIKmQIBAzCC...` |
| `P12_PASSWORD` | Password của certificate | `YourStrongPassword123` |
| `BUILD_PROVISION_PROFILE_BASE64` | Provisioning profile đã encode base64 | `MIINdwYJKo...` |
| `KEYCHAIN_PASSWORD` | Password tạm cho keychain (tự đặt) | `TempPassword456` |
| `APPLE_TEAM_ID` | Apple Team ID | `ABCD123456` |

**Cách tìm Apple Team ID:**
- Truy cập [Apple Developer](https://developer.apple.com/account)
- Membership → Team ID (10 ký tự)

## ▶️ Chạy workflow

### Bước 1: Truy cập GitHub Actions

1. Mở trình duyệt
2. Truy cập: https://github.com/Nidios1/zyea-plus-social-network/actions
3. Bạn sẽ thấy workflow **"Build Zyea+ iOS App"**

### Bước 2: Run workflow

1. Click vào workflow **"Build Zyea+ iOS App"**
2. Click nút **"Run workflow"** (bên phải)
3. Chọn branch: `main`
4. Chọn build type:

   - **development**: 
     - ✅ Không cần Apple certificate
     - ✅ Build nhanh
     - ❌ Chỉ cài được trên device đã đăng ký UDID
     
   - **adhoc**:
     - ✅ Distribute cho testers
     - ⚠️ Cần provisioning profile với UDID devices
     - ⚠️ Cần secrets đã setup
     
   - **appstore**:
     - ✅ Submit lên App Store
     - ⚠️ Cần App Store Distribution certificate
     - ⚠️ Cần secrets đã setup

5. Click **"Run workflow"**

### Bước 3: Theo dõi build process

1. Workflow sẽ bắt đầu chạy (màu vàng 🟡)
2. Click vào workflow run để xem chi tiết
3. Xem logs của từng step
4. Đợi khoảng **10-15 phút**
5. Khi thành công, status sẽ chuyển sang màu xanh (✅)

## 📥 Download IPA

### Sau khi build thành công:

1. Scroll xuống cuối trang workflow run
2. Tìm section **"Artifacts"**
3. Download file zip (ví dụ: `ZyeaPlus-iOS-development-123.zip`)
4. Giải nén file zip
5. Bạn sẽ có file `.ipa`

### Nếu build type là `adhoc` hoặc `appstore`:

- IPA cũng được tự động tạo thành **GitHub Release**
- Truy cập: https://github.com/Nidios1/zyea-plus-social-network/releases
- Download IPA từ release

## 📱 Cài đặt IPA

### Option 1: TestFlight (Recommended cho Ad Hoc/App Store builds)

1. Upload IPA lên [App Store Connect](https://appstoreconnect.apple.com)
2. Sử dụng **Transporter** app (Mac) hoặc **Xcode**
3. Thêm internal/external testers
4. Testers cài đặt qua **TestFlight** app

### Option 2: Direct Installation (Development builds)

#### Cách 2.1: Xcode (Cần Mac)

```bash
# Connect iPhone qua USB
# Mở Terminal
xcrun devicectl device install app --device <DEVICE_ID> /path/to/App.ipa
```

#### Cách 2.2: AltStore / Sideloadly (Windows/Mac)

1. Download [AltStore](https://altstore.io) hoặc [Sideloadly](https://sideloadly.io)
2. Connect iPhone qua USB
3. Drag & drop file IPA vào app
4. Đợi cài đặt hoàn tất

#### Cách 2.3: Apple Configurator 2 (Mac)

1. Download [Apple Configurator 2](https://apps.apple.com/app/id1037126344)
2. Connect iPhone
3. Double click device
4. Drag IPA vào window

### Option 3: OTA Installation (Over-The-Air)

1. Upload IPA lên service:
   - [DistrApp](https://www.distrapp.com)
   - [AppCenter](https://appcenter.ms)
   - [TestApp.io](https://testapp.io)
   
2. Service sẽ generate installation link

3. Mở link trên Safari (iPhone)

4. Tap "Install" và làm theo hướng dẫn

## 🐛 Troubleshooting

### Build failed: "Command failed with exit code 65"

**Nguyên nhân**: Xcode build error

**Giải pháp**:
1. Kiểm tra logs chi tiết trong workflow
2. Đảm bảo code build được locally
3. Kiểm tra `capacitor.config.ts` và `package.json`

### Build failed: "Certificate not found"

**Nguyên nhân**: Secrets chưa được setup hoặc sai

**Giải pháp**:
1. Verify secrets đã được thêm vào GitHub
2. Kiểm tra base64 encoding đúng format
3. Thử build với `development` type (không cần certificate)

### Build success nhưng không có artifact

**Nguyên nhân**: Export IPA failed

**Giải pháp**:
1. Kiểm tra logs của step "Export IPA"
2. Verify provisioning profile matches với build type
3. Kiểm tra Team ID đúng

### Không cài được IPA: "Unable to Install"

**Nguyên nhân**: Device không trong provisioning profile

**Giải pháp**:
1. Thêm device UDID vào provisioning profile
2. Re-build với profile mới
3. Hoặc dùng TestFlight (không giới hạn UDID)

### Không cài được IPA: "Untrusted Developer"

**Nguyên nhân**: Certificate chưa được trust

**Giải pháp**:
1. Mở **Settings** → **General** → **Device Management**
2. Tap vào developer name
3. Tap **Trust**

### Build chạy lâu hơn 1 giờ

**Nguyên nhân**: GitHub Actions free tier có giới hạn

**Giải pháp**:
1. Optimize workflow (remove unused steps)
2. Upgrade GitHub plan
3. Use self-hosted runner

## 📊 Build Status

Check build status badge:

```markdown
![Build Status](https://github.com/Nidios1/zyea-plus-social-network/actions/workflows/build-zyea-plus-ios.yml/badge.svg)
```

## 📝 Tips & Best Practices

### ✅ DO's

- ✅ Test code locally trước khi push
- ✅ Sử dụng meaningful commit messages
- ✅ Keep secrets an toàn, không share
- ✅ Use development build cho testing nhanh
- ✅ Document changes trong commit message
- ✅ Tag releases với version numbers

### ❌ DON'Ts

- ❌ Commit secrets vào code
- ❌ Commit file .p12 hoặc .mobileprovision
- ❌ Build quá nhiều lần (waste GitHub Actions minutes)
- ❌ Share IPA publicly (nếu có sensitive data)
- ❌ Ignore build errors (fix them!)

## 🔄 Auto Build on Push

Workflow đã được config để tự động build khi:
- Push vào branch `main` hoặc `master`
- Changes trong folder `zyea-plus-app/`
- Changes trong workflow file

Để disable auto build, comment out phần `push:` trong workflow file.

## 📞 Support

Nếu gặp vấn đề:

1. Check [Troubleshooting section](#troubleshooting)
2. Search GitHub Issues
3. Create new issue với:
   - Build logs
   - Error messages
   - Steps to reproduce

## 🎉 Kết luận

Bây giờ bạn đã có:
- ✅ iOS native app với Capacitor
- ✅ GitHub Actions workflow để build IPA
- ✅ Scripts và documentation đầy đủ
- ✅ Khả năng build IPA từ bất kỳ đâu

**Happy Building! 🚀**

