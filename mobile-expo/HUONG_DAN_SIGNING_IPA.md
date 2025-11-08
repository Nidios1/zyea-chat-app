# Hướng Dẫn Ký IPA với Chứng Chỉ Tự Ký

## Vấn Đề

Lỗi khi cài IPA: **"Failed to verify code signature: 0xe800801c (No code signature found)"**

Nguyên nhân: IPA file không có chữ ký code hợp lệ, iOS không cho phép cài đặt.

## Giải Pháp

### Cách 1: Ký IPA Tự Động trong GitHub Actions (Khuyến Nghị)

#### Bước 1: Chuẩn Bị Chứng Chỉ

1. **Export Certificate (.p12)**:
   - Mở Keychain Access trên Mac
   - Tìm certificate của bạn (iOS Developer hoặc Distribution)
   - Right-click → Export → Save as .p12
   - Nhập password cho file .p12

2. **Export Provisioning Profile (.mobileprovision)**:
   - Vào [Apple Developer Portal](https://developer.apple.com/account)
   - Download provisioning profile cho app của bạn
   - Lưu file .mobileprovision

#### Bước 2: Convert Sang Base64

**Trên Mac/Linux:**
```bash
# Convert certificate
base64 -i certificate.p12 -o certificate_base64.txt

# Convert provisioning profile
base64 -i profile.mobileprovision -o profile_base64.txt
```

**Trên Windows (PowerShell):**
```powershell
# Convert certificate
[Convert]::ToBase64String([IO.File]::ReadAllBytes("certificate.p12")) | Out-File -FilePath certificate_base64.txt -Encoding ASCII

# Convert provisioning profile
[Convert]::ToBase64String([IO.File]::ReadAllBytes("profile.mobileprovision")) | Out-File -FilePath profile_base64.txt -Encoding ASCII
```

#### Bước 3: Thêm vào GitHub Secrets

1. Vào repository trên GitHub
2. Settings → Secrets and variables → Actions
3. Thêm các secrets sau:

| Secret Name | Mô Tả | Ví Dụ |
|------------|-------|-------|
| `IOS_CERTIFICATE_BASE64` | Nội dung file .p12 đã encode base64 | (Copy từ certificate_base64.txt) |
| `IOS_CERTIFICATE_PASSWORD` | Password của file .p12 | `your_password_123` |
| `IOS_CODE_SIGN_IDENTITY` | Tên certificate để ký | `iPhone Developer: Your Name (XXXXXXXXXX)` |
| `IOS_TEAM_ID` | Team ID của Apple Developer | `XXXXXXXXXX` |
| `IOS_PROVISIONING_PROFILE_BASE64` | Nội dung .mobileprovision đã encode base64 | (Copy từ profile_base64.txt) |
| `IOS_PROVISIONING_PROFILE_SPECIFIER` | Tên provisioning profile | `Zyea Mobile Profile` |

**Cách lấy CODE_SIGN_IDENTITY:**
```bash
# Trên Mac, chạy lệnh này sau khi import certificate vào Keychain
security find-identity -v -p codesigning
```

Kết quả sẽ có dạng:
```
1) ABC123DEF456... "iPhone Developer: Your Name (XXXXXXXXXX)"
2) 789XYZ012ABC... "Apple Development: Your Name (XXXXXXXXXX)"
```

Chọn một trong số đó và copy toàn bộ dòng trong ngoặc kép.

#### Bước 4: Sử Dụng Workflow Mới

Workflow `build-ipa-signed.yml` sẽ tự động:
- Import certificate và provisioning profile
- Build và ký IPA với chứng chỉ của bạn
- Tạo IPA đã được ký sẵn

### Cách 2: Ký IPA Thủ Công Sau Khi Build

#### Bước 1: Download IPA Unsigned

- Vào GitHub Actions → Download artifact `ios-ipa-unsigned`

#### Bước 2: Ký IPA bằng eSign hoặc Công Cụ Khác

**Sử dụng eSign (iOS):**
1. Cài đặt eSign trên iPhone
2. Import certificate và provisioning profile vào eSign
3. Import IPA file vào eSign
4. Chọn certificate và ký
5. Export IPA đã ký

**Sử dụng AltStore:**
1. Cài AltStore trên iPhone
2. Kết nối iPhone với máy tính
3. Mở AltStore, chọn "My Apps"
4. Thêm IPA file
5. AltStore sẽ tự động ký và cài đặt

**Sử dụng Sideloadly:**
1. Download Sideloadly cho Windows/Mac
2. Kết nối iPhone
3. Kéo thả IPA file vào Sideloadly
4. Chọn Apple ID và ký
5. Cài đặt trực tiếp lên iPhone

**Sử dụng zsign (Command Line):**
```bash
# Trên Mac/Linux
zsign -k certificate.p12 -m profile.mobileprovision -p password -o signed.ipa unsigned.ipa
```

### Cách 3: Sử Dụng Free Apple Developer Account

Nếu bạn có Apple ID miễn phí:
1. Tạo App ID trên [Apple Developer Portal](https://developer.apple.com/account)
2. Tạo Development Certificate
3. Tạo Provisioning Profile
4. Follow Cách 1 để setup trong GitHub Actions

**Lưu ý:** Free account có giới hạn:
- Certificate chỉ valid 7 ngày
- App chỉ chạy được 7 ngày, sau đó cần ký lại
- Chỉ cài được 3 apps cùng lúc

## Kiểm Tra IPA Đã Ký

Sau khi ký, kiểm tra bằng lệnh:
```bash
codesign -dv --verbose=4 app.ipa
```

Hoặc kiểm tra trong iOS:
- Nếu cài được thành công → IPA đã được ký đúng
- Nếu vẫn báo lỗi → Kiểm tra lại certificate và provisioning profile

## Troubleshooting

### Lỗi: "No code signature found"
- ✅ IPA chưa được ký → Sử dụng một trong các cách trên

### Lỗi: "Certificate expired"
- ✅ Certificate đã hết hạn → Tạo certificate mới

### Lỗi: "Provisioning profile doesn't match"
- ✅ Bundle ID không khớp → Kiểm tra `app.json` và provisioning profile

### Lỗi: "Device not registered"
- ✅ Thiết bị chưa được đăng ký trong provisioning profile → Thêm UDID vào profile

## Tài Liệu Tham Khảo

- [Apple Code Signing Guide](https://developer.apple.com/library/archive/documentation/Security/Conceptual/CodeSigningGuide/)
- [Expo EAS Build Documentation](https://docs.expo.dev/build/introduction/)
- [iOS App Signing Explained](https://www.apple.com/business/site/docs/iOS_Security_Guide.pdf)

## Lưu Ý Quan Trọng

⚠️ **Bảo Mật:**
- Không commit certificate và provisioning profile vào Git
- Chỉ lưu trong GitHub Secrets
- Không chia sẻ certificate với người khác

⚠️ **Certificate:**
- Development certificate: Chỉ cài trên thiết bị đã đăng ký
- Distribution certificate: Có thể cài trên nhiều thiết bị (cần App Store hoặc Enterprise)
- Free account: Certificate chỉ valid 7 ngày

⚠️ **Provisioning Profile:**
- Phải match với Bundle ID trong `app.json`
- Phải include UDID của thiết bị (với Development profile)
- Phải match với certificate đang sử dụng

