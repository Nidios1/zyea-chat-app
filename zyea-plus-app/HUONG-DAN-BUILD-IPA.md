# 🚀 HƯỚNG DẪN BUILD IPA NHANH

## ✅ Đã hoàn thành:

- ✅ Native iOS app đã sẵn sàng trong `zyea-plus-app/ios/`
- ✅ GitHub Actions workflow đã được setup
- ✅ Code đã được push lên: https://github.com/Nidios1/zyea-plus-social-network

## 📱 CÁCH BUILD IPA TRÊN GITHUB:

### Bước 1: Truy cập GitHub Actions

Mở link này trong trình duyệt:
```
https://github.com/Nidios1/zyea-plus-social-network/actions
```

### Bước 2: Chọn Workflow

1. Bên trái, click vào **"Build Zyea+ iOS App"**
2. Bạn sẽ thấy nút **"Run workflow"** bên phải

### Bước 3: Run Workflow

1. Click nút **"Run workflow"** (màu xanh)
2. Một popup hiện ra với 2 options:
   - **Branch**: Giữ là `main`
   - **Build type**: Chọn `development` (recommended cho test)
3. Click **"Run workflow"** màu xanh để bắt đầu

### Bước 4: Đợi Build Hoàn Thành

- ⏱️ Thời gian: Khoảng 10-15 phút
- 🟡 Đang build: Status màu vàng
- ✅ Thành công: Status màu xanh
- ❌ Thất bại: Status màu đỏ (xem logs để biết lỗi)

### Bước 5: Download IPA

1. Click vào workflow run vừa hoàn thành
2. Scroll xuống cuối trang
3. Tìm section **"Artifacts"**
4. Download file có tên: `ZyeaPlus-iOS-development-{số}.zip`
5. Giải nén để lấy file `.ipa`

## 🎯 LOẠI BUILD:

### 1️⃣ Development (Khuyến nghị)
- ✅ **Không cần** Apple Developer certificate
- ✅ Build nhanh, test được ngay
- ⚠️ Chỉ cài được bằng Xcode hoặc tool như AltStore
- 👍 **Chọn này để test nhanh**

### 2️⃣ Ad Hoc
- ⚠️ Cần Apple Developer Account
- ⚠️ Cần setup GitHub Secrets
- ✅ Distribute cho nhiều testers
- ✅ Cài được qua OTA link

### 3️⃣ App Store
- ⚠️ Cần Apple Developer Account
- ⚠️ Cần setup GitHub Secrets
- ✅ Submit lên App Store
- ✅ Distribute qua TestFlight

## 📥 CÁCH CÀI ĐẶT IPA:

### Cách 1: AltStore (Windows/Mac) - Dễ nhất
1. Download [AltStore](https://altstore.io/)
2. Cài đặt AltStore
3. Connect iPhone qua USB
4. Mở AltStore → My Apps → dấu +
5. Chọn file `.ipa` vừa download
6. Đợi cài đặt xong

### Cách 2: Sideloadly (Windows/Mac)
1. Download [Sideloadly](https://sideloadly.io/)
2. Connect iPhone qua USB
3. Drag & drop file IPA vào Sideloadly
4. Nhập Apple ID và password
5. Click Start

### Cách 3: Xcode (Chỉ Mac)
```bash
# Connect iPhone qua USB
xcrun devicectl device install app --device <DEVICE_ID> /path/to/App.ipa
```

## ⚠️ LƯU Ý QUAN TRỌNG:

### Sau khi cài đặt:
1. **Trust Developer**:
   - Mở **Settings** → **General** → **VPN & Device Management**
   - Tap vào developer name
   - Tap **Trust**

2. **App bị crash?**:
   - Kiểm tra server backend có chạy không
   - Kiểm tra network connection
   - Xem logs trong Xcode

### Nếu Build Failed:
1. Click vào workflow run bị fail
2. Click vào job "Build Zyea+ iOS"
3. Xem logs chi tiết các step
4. Tìm dòng có "Error" hoặc "Failed"
5. Copy error message và search Google hoặc hỏi AI

## 🔐 SETUP GITHUB SECRETS (Tùy chọn - Cho Ad Hoc/App Store):

Nếu bạn muốn build Ad Hoc hoặc App Store, cần setup secrets:

1. Vào: https://github.com/Nidios1/zyea-plus-social-network/settings/secrets/actions
2. Click "New repository secret"
3. Thêm các secrets:
   - `BUILD_CERTIFICATE_BASE64` - Certificate đã encode base64
   - `P12_PASSWORD` - Password của certificate
   - `BUILD_PROVISION_PROFILE_BASE64` - Provisioning profile base64
   - `KEYCHAIN_PASSWORD` - Password tạm (tự đặt)
   - `APPLE_TEAM_ID` - Team ID (10 ký tự)

Chi tiết xem file: `GITHUB-ACTIONS-SETUP.md`

## 📞 SUPPORT:

### Các vấn đề thường gặp:

**Q: Build failed với lỗi "Pod install failed"?**
A: Bình thường, workflow sẽ tự động chạy pod install trên GitHub

**Q: Build success nhưng không có artifact?**
A: Kiểm tra logs của step "Export IPA"

**Q: Không cài được IPA?**
A: Dùng development build và cài qua AltStore/Sideloadly

**Q: App crash khi mở?**
A: Kiểm tra server backend, đảm bảo API endpoint đúng

## 🎉 DONE!

Bạn đã có thể build IPA trên GitHub và cài lên iPhone! 

**Link quan trọng:**
- Actions: https://github.com/Nidios1/zyea-plus-social-network/actions
- Repository: https://github.com/Nidios1/zyea-plus-social-network

---

**Made with ❤️ for Zyea+ Team**

