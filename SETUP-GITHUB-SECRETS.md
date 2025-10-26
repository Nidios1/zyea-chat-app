# 🔐 Setup GitHub Secrets - Quick Guide

## Cần 5 Secrets để Build iOS trên GitHub Actions

### 📍 Vào đâu để setup?
```
GitHub Repository → Settings → Secrets and variables → Actions → New repository secret
```

---

## 1️⃣ APPLE_TEAM_ID

**Lấy ở đâu:**
- Vào: https://developer.apple.com/account/
- Click **Membership** (bên trái)
- Copy **Team ID** (10 ký tự)

**Ví dụ:** `ABCD123456`

**Tạo secret:**
```
Name: APPLE_TEAM_ID
Value: ABCD123456
```

---

## 2️⃣ BUILD_CERTIFICATE_BASE64

**Cần file:** Certificate (.p12)

### Cách tạo Certificate trên Mac:

#### Bước 1: Tạo Certificate Signing Request (CSR)
```
1. Mở Keychain Access
2. Menu → Certificate Assistant → Request a Certificate From a Certificate Authority
3. User Email: your@email.com
4. Common Name: Your Name
5. Save to disk → Continue
```

#### Bước 2: Tạo Certificate trên Apple Developer
```
1. Vào: https://developer.apple.com/account/resources/certificates/
2. Click [+] để tạo certificate mới
3. Chọn: iOS App Development (hoặc iOS Distribution)
4. Upload file .certSigningRequest vừa tạo
5. Download file .cer
```

#### Bước 3: Import vào Keychain và Export
```
1. Double-click file .cer để import vào Keychain Access
2. Trong Keychain Access, tìm certificate vừa import
3. Right-click → Export "iPhone Developer: ..."
4. Save as: certificate.p12
5. Nhập password (nhớ password này cho P12_PASSWORD)
```

#### Bước 4: Convert sang Base64
```bash
# Trên Mac:
base64 -i certificate.p12 | pbcopy

# Trên Windows (Git Bash):
base64 -w 0 certificate.p12 > certificate-base64.txt

# Trên Linux:
base64 -w 0 certificate.p12 | xclip -selection clipboard
```

**Tạo secret:**
```
Name: BUILD_CERTIFICATE_BASE64
Value: [Paste nội dung base64 rất dài]
```

---

## 3️⃣ P12_PASSWORD

**Là gì:** Password bạn đã nhập khi export file .p12 ở Bước 3 trên

**Ví dụ:** `MySecurePass123!`

**Tạo secret:**
```
Name: P12_PASSWORD
Value: MySecurePass123!
```

---

## 4️⃣ BUILD_PROVISION_PROFILE_BASE64

**Cần file:** Provisioning Profile (.mobileprovision)

### Cách tạo Provisioning Profile:

#### Bước 1: Tạo App ID
```
1. Vào: https://developer.apple.com/account/resources/identifiers/
2. Click [+] để tạo identifier mới
3. Chọn: App IDs → Continue
4. Bundle ID: com.zyea.app (hoặc com.zyea.hieudev cho Messenger)
5. Description: Zyea Plus App
6. Capabilities: chọn những gì cần (Push Notifications, Camera, etc.)
7. Continue → Register
```

#### Bước 2: Tạo Provisioning Profile
```
1. Vào: https://developer.apple.com/account/resources/profiles/
2. Click [+] để tạo profile mới
3. Chọn: iOS App Development (hoặc Ad Hoc/App Store)
4. Select App ID: com.zyea.app
5. Select Certificate: chọn certificate vừa tạo
6. Select Devices: chọn iPhone test của bạn (nếu Development)
7. Profile Name: Zyea Plus Development
8. Generate → Download file .mobileprovision
```

#### Bước 3: Convert sang Base64
```bash
# Trên Mac:
base64 -i profile.mobileprovision | pbcopy

# Trên Windows (Git Bash):
base64 -w 0 profile.mobileprovision > profile-base64.txt

# Trên Linux:
base64 -w 0 profile.mobileprovision | xclip -selection clipboard
```

**Tạo secret:**
```
Name: BUILD_PROVISION_PROFILE_BASE64
Value: [Paste nội dung base64 rất dài]
```

---

## 5️⃣ KEYCHAIN_PASSWORD

**Là gì:** Password để tạo temporary keychain trên GitHub Actions runner

**Có thể dùng bất kỳ password nào**, ví dụ:

**Ví dụ:** `TempKeychain2024!`

**Tạo secret:**
```
Name: KEYCHAIN_PASSWORD
Value: TempKeychain2024!
```

---

## ✅ Verification Checklist

Sau khi tạo xong 5 secrets, verify:

- [ ] APPLE_TEAM_ID - 10 ký tự (A-Z, 0-9)
- [ ] BUILD_CERTIFICATE_BASE64 - String rất dài base64
- [ ] P12_PASSWORD - Password của file .p12
- [ ] BUILD_PROVISION_PROFILE_BASE64 - String rất dài base64
- [ ] KEYCHAIN_PASSWORD - Bất kỳ password nào

---

## 🚨 Common Issues

### Issue 1: "Code signing error"
**Solution:** 
- Kiểm tra APPLE_TEAM_ID có đúng không
- Kiểm tra Bundle ID trong code có khớp với provisioning profile không
- Kiểm tra certificate và provisioning profile còn hiệu lực

### Issue 2: "Invalid base64"
**Solution:**
- Đảm bảo copy toàn bộ nội dung base64
- Không có space hoặc newline thừa
- Dùng lệnh `base64 -w 0` để không có line breaks

### Issue 3: "Provisioning profile doesn't include device"
**Solution:**
- Vào Apple Developer → Devices → Add device UDID
- Update provisioning profile để include device mới
- Download lại và convert sang base64 mới

---

## 🎯 Quick Commands

### Mac - Export và Convert tất cả trong 1 lúc:
```bash
# Certificate
security export -k login.keychain -t identities -f pkcs12 -o certificate.p12
base64 -i certificate.p12 | pbcopy

# Provisioning Profile
base64 -i ~/Downloads/*.mobileprovision | pbcopy
```

### Windows (PowerShell) - Convert Base64:
```powershell
# Certificate
$bytes = [System.IO.File]::ReadAllBytes("certificate.p12")
[Convert]::ToBase64String($bytes) | Set-Clipboard

# Provisioning Profile
$bytes = [System.IO.File]::ReadAllBytes("profile.mobileprovision")
[Convert]::ToBase64String($bytes) | Set-Clipboard
```

---

## 📚 Related Files

- **Workflow File:** `.github/workflows/build-ios.yml`
- **Full Guide:** `GITHUB-BUILD-IOS-GUIDE.md`
- **Capacitor Config:** `zyea-plus-app/capacitor.config.ts`

---

## 💡 Tips

1. **Certificate expiration:** Apple certificates expire sau 1 năm, cần renew
2. **Multiple apps:** Có thể dùng 1 certificate cho nhiều apps
3. **Development vs Distribution:** 
   - Development: Test trên device của bạn
   - Ad Hoc: Test trên tối đa 100 devices
   - App Store: Submit lên App Store
4. **Security:** Secrets này rất quan trọng, không share cho ai!

---

**Setup xong rồi? Quay lại `GITHUB-BUILD-IOS-GUIDE.md` để tiếp tục build! 🚀**

