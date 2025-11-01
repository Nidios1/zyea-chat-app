# 🚀 Hướng dẫn Build IPA qua GitHub Actions

## 📋 Tổng quan

Đã tạo **GitHub Actions workflows** để tự động build IPA **KHÔNG DÙNG Expo/EAS**, sử dụng Xcode native.

---

## 🎯 Workflows đã tạo

### 1. **build-ipa.yml** - Build tự động khi push code

**Kích hoạt:**
- Khi push code lên `main` hoặc `master`
- Chạy thủ công từ GitHub UI (Actions > Run workflow)

**Cách hoạt động:**
- Sử dụng **macOS runner** (miễn phí 2000 phút/tháng)
- Prebuild iOS native project từ Expo
- Build IPA bằng **xcodebuild** (không cần EAS)
- Export IPA unsigned (để tự ký qua Esign)
- Upload IPA dưới dạng **artifact** để tải về

---

### 2. **build-ipa-fastlane.yml** - Build với Fastlane

**Kích hoạt:**
- Chỉ chạy thủ công (workflow_dispatch)

**Yêu cầu:**
- Cần setup Fastlane trong thư mục `ios/`

---

## 🚀 Cách sử dụng

### Bước 1: Push code lên GitHub

```bash
git add .
git commit -m "Update code"
git push origin main
```

### Bước 2: Kiểm tra GitHub Actions

1. Vào repository trên GitHub
2. Click tab **"Actions"**
3. Chọn workflow **"Build iOS IPA (Native)"**
4. Xem build đang chạy

### Bước 3: Tải IPA về

1. Sau khi build xong, vào tab **"Actions"**
2. Chọn build vừa chạy
3. Kéo xuống phần **"Artifacts"**
4. Click **"zyeamobile-ipa"** để tải về
5. Giải nén và lấy file `.ipa`

### Bước 4: Ký và cài đặt

1. Tải IPA về máy tính
2. Dùng **Esign** hoặc **Sideloadly** để ký
3. Cài đặt lên iPhone

---

## ⚙️ Chạy thủ công

### Cách 1: Từ GitHub UI

1. Vào repository → tab **"Actions"**
2. Chọn workflow **"Build iOS IPA (Native)"**
3. Click **"Run workflow"**
4. Chọn branch và click **"Run workflow"**

### Cách 2: Từ terminal (trên macOS)

```bash
# Build trực tiếp trên máy
chmod +x build-ipa-native.sh
./build-ipa-native.sh
```

---

## 📝 Cấu hình

### exportOptions.plist

File `ios/exportOptions.plist` đã được tạo với cấu hình:
- Method: `development` (unsigned)
- Signing: `manual` (không tự ký)

### Build Settings

- **Workspace**: `ios/zyeamobile.xcworkspace`
- **Scheme**: `zyeamobile`
- **Configuration**: `Release`
- **Signing**: Tắt (unsigned)

---

## ⚠️ Lưu ý quan trọng

### GitHub Actions Limits

- **Free tier**: 2000 phút/tháng (đủ để build ~60-100 lần)
- **macOS runner**: Tính phí gấp 10 lần Linux (~10 phút = 1 build)
- **Artifact storage**: 90 ngày miễn phí

### Build Time

- Mỗi lần build: **15-30 phút**
- Bao gồm: Install dependencies, Prebuild, Build, Export

### Requirements

- ✅ **Không cần** Apple Developer account
- ✅ **Không cần** EAS/Expo token
- ✅ **Không cần** cấu hình credentials
- ⚠️ IPA unsigned (cần ký qua Esign sau)

---

## 🔧 Troubleshooting

### Lỗi: "No such file or directory: ios/zyeamobile.xcworkspace"

**Giải pháp:**
- Đảm bảo đã chạy `npx expo prebuild --platform ios` trước
- Hoặc workflow sẽ tự động prebuild

### Lỗi: "pod install failed"

**Giải pháp:**
- Kiểm tra `ios/Podfile` có tồn tại
- Có thể cần update CocoaPods: `sudo gem install cocoapods`

### Lỗi: "Code signing error"

**Giải pháp:**
- Đã tắt code signing trong workflow
- Kiểm tra `exportOptions.plist` có đúng không

### Build quá lâu

**Giải pháp:**
- Bình thường, build iOS mất 15-30 phút
- Có thể cache dependencies để tăng tốc

---

## 📊 So sánh

| Tính năng | EAS Build | GitHub Actions (Native) |
|-----------|-----------|------------------------|
| Cần Expo account | ✅ Có | ❌ Không |
| Cần Apple account | ✅ Có | ❌ Không |
| Miễn phí | Có giới hạn | 2000 phút/tháng |
| Tự động | ✅ | ✅ |
| IPA unsigned | ❌ Khó | ✅ Dễ |
| Build time | ~20 phút | ~25 phút |

---

## 🎯 Workflow Files

- `.github/workflows/build-ipa.yml` - Build tự động (Native Xcode)
- `.github/workflows/build-ipa-fastlane.yml` - Build với Fastlane
- `build-ipa-native.sh` - Script build trên macOS local
- `ios/exportOptions.plist` - Cấu hình export IPA

---

## ✅ Checklist

- [x] Tạo workflow build IPA native
- [x] Tạo exportOptions.plist
- [x] Tạo script build local
- [x] Cấu hình unsigned IPA
- [x] Upload artifact
- [ ] Test workflow (cần push lên GitHub)

---

## 🔗 Tài liệu tham khảo

- [GitHub Actions](https://docs.github.com/en/actions)
- [Xcode Build Settings](https://developer.apple.com/documentation/xcode/build-settings-reference)
- [Fastlane](https://docs.fastlane.tools/)

