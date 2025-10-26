# 🚀 Hướng Dẫn Build iOS App Trên GitHub Actions

## ✅ Checklist Trước Khi Push Lên GitHub

### 1. Files Cần Thiết Đã Có:
- ✅ `.github/workflows/build-ios.yml` - GitHub Actions workflow
- ✅ `zyea-plus-app/package-lock.json` - Vừa được tạo
- ✅ `client/package-lock.json` - Đã có sẵn
- ✅ `zyea-plus-app/capacitor.config.ts` - Config cho Capacitor
- ✅ `zyea-plus-app/ios-export-options.plist` - Export options cho IPA

### 2. Files KHÔNG Cần Push (đã được gitignore):
- ❌ `node_modules/` - GitHub sẽ tự cài lại
- ❌ `ios/` - GitHub sẽ tự tạo bằng Capacitor
- ❌ `build/` - GitHub sẽ tự build

---

## 📤 Bước 1: Push Code Lên GitHub

### Nếu chưa có Git repository:

```bash
cd c:\xampp\htdocs\zalo-clone
git init
git add .
git commit -m "Initial commit with iOS build workflow"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
git push -u origin main
```

### Nếu đã có Git repository:

```bash
cd c:\xampp\htdocs\zalo-clone
git add .
git commit -m "Add zyea-plus-app and iOS build workflow"
git push
```

---

## 🔐 Bước 2: Setup GitHub Secrets (Quan Trọng!)

Vào GitHub repository của bạn:
1. Settings → Secrets and variables → Actions → New repository secret

### Cần tạo 4 secrets:

#### 1. `APPLE_TEAM_ID`
- Giá trị: Team ID của bạn trên Apple Developer
- Tìm tại: https://developer.apple.com/account/ → Membership
- Ví dụ: `ABCD123456`

#### 2. `BUILD_CERTIFICATE_BASE64`
- File certificate (.p12) được convert sang base64
- Tạo certificate:
  ```bash
  # Export certificate từ Keychain Access
  # Export as .p12 với password
  
  # Convert sang base64 (trên macOS):
  base64 -i certificate.p12 | pbcopy
  
  # Convert sang base64 (trên Windows với Git Bash):
  base64 -w 0 certificate.p12 > certificate.txt
  ```

#### 3. `P12_PASSWORD`
- Password của file .p12 certificate
- Password bạn đã set khi export certificate

#### 4. `BUILD_PROVISION_PROFILE_BASE64`
- File provisioning profile (.mobileprovision) convert sang base64
- Download từ: https://developer.apple.com/account/resources/profiles/
- Convert tương tự certificate:
  ```bash
  # Convert sang base64
  base64 -i profile.mobileprovision | pbcopy
  ```

#### 5. `KEYCHAIN_PASSWORD` (tùy chọn)
- Password để tạo temporary keychain
- Có thể dùng password random, ví dụ: `TempKeychain123!`

---

## 🏗️ Bước 3: Chạy GitHub Actions Build

### Option 1: Build từ GitHub UI (Đơn giản nhất)

1. Vào repository trên GitHub
2. Click tab **Actions**
3. Chọn workflow **"Build iOS Apps"**
4. Click nút **"Run workflow"** (góc phải)
5. Chọn app cần build:
   - `messenger` - Build app Messenger (client)
   - `zyeaplus` - Build app Zyea+ (zyea-plus-app)
   - `both` - Build cả 2 apps
6. Click **"Run workflow"**

### Option 2: Build tự động khi push code

Workflow sẽ tự động chạy khi bạn:
- Push lên branch `main`, `master`, hoặc `develop`
- Tạo Pull Request

---

## 📦 Bước 4: Download File IPA

Sau khi build xong (khoảng 15-30 phút):

1. Vào tab **Actions** trên GitHub
2. Click vào workflow run vừa chạy
3. Scroll xuống phần **Artifacts**
4. Download:
   - `Messenger-iOS-IPA` - App Messenger
   - `ZyeaPlus-iOS-IPA` - App Zyea+
5. Extract file zip để lấy file `.ipa`

---

## 📱 Bước 5: Cài Đặt IPA Lên iPhone

### Cách 1: Qua Apple Configurator (Khuyên dùng)
```
1. Cài Apple Configurator trên Mac
2. Kết nối iPhone qua USB
3. Kéo thả file .ipa vào Configurator
```

### Cách 2: Qua Xcode
```
1. Mở Xcode → Window → Devices and Simulators
2. Chọn iPhone của bạn
3. Click dấu + dưới "Installed Apps"
4. Chọn file .ipa
```

### Cách 3: Qua TestFlight (Production)
```
1. Upload IPA lên App Store Connect
2. Submit cho TestFlight
3. Cài qua app TestFlight trên iPhone
```

---

## ⚠️ Troubleshooting

### Lỗi: "No such file 'package-lock.json'"
**Giải pháp:**
```bash
cd zyea-plus-app
npm install
git add package-lock.json
git commit -m "Add package-lock.json"
git push
```

### Lỗi: "Code signing error"
**Giải pháp:**
- Kiểm tra lại 4 secrets đã setup đúng chưa
- Đảm bảo certificate và provisioning profile còn hiệu lực
- Đảm bảo Bundle ID trong `capacitor.config.ts` khớp với provisioning profile

### Lỗi: "ios folder not found"
**Đây là normal!** GitHub Actions sẽ tự tạo folder `ios/` bằng lệnh:
```bash
npx cap add ios
npx cap sync ios
```

### Lỗi: "Cannot find Xcode"
**GitHub Actions đã có Xcode built-in**, không cần lo!

---

## 🎯 Quick Start (TL;DR)

```bash
# 1. Đảm bảo có package-lock.json
cd c:\xampp\htdocs\zalo-clone\zyea-plus-app
npm install

# 2. Push lên GitHub
cd ..
git add .
git commit -m "Ready for iOS build"
git push

# 3. Setup 4 GitHub Secrets:
#    - APPLE_TEAM_ID
#    - BUILD_CERTIFICATE_BASE64
#    - P12_PASSWORD
#    - BUILD_PROVISION_PROFILE_BASE64
#    - KEYCHAIN_PASSWORD

# 4. Vào GitHub Actions → Run workflow → Chọn app → Build
# 5. Download IPA từ Artifacts sau khi build xong
```

---

## 📝 Notes

### Build Time
- **Messenger App**: ~20-25 phút
- **Zyea+ App**: ~15-20 phút
- **Both Apps**: ~40-45 phút

### Requirements
- GitHub repository (public hoặc private đều được)
- Apple Developer Account ($99/year)
- Valid certificate và provisioning profile

### Cost
- GitHub Actions free tier: 2000 phút/tháng
- Mỗi lần build tốn ~20 phút
- Có thể build ~100 lần/tháng miễn phí

---

## 🔄 Auto-Build Khi Push Code

File `build-ios.yml` đã được config để build tự động khi:
- Push code lên `main`, `master`, `develop` branches
- Hoặc trigger manual từ GitHub Actions UI

Nếu muốn tắt auto-build, comment out phần này trong `.github/workflows/build-ios.yml`:
```yaml
on:
  # workflow_dispatch: ...  # Giữ cái này để build manual
  # push:                    # Comment để tắt auto-build
  #   branches: [ main ]
```

---

## ✅ Checklist Cuối Cùng

- [ ] Package-lock.json đã có trong zyea-plus-app/
- [ ] Code đã push lên GitHub
- [ ] 5 GitHub Secrets đã được setup
- [ ] Workflow "Build iOS Apps" đã chạy thành công
- [ ] File .ipa đã được download từ Artifacts
- [ ] App đã cài được lên iPhone test

**Chúc bạn build thành công! 🎉**

