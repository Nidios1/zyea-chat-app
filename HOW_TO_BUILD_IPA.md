# 📱 Hướng Dẫn Build IPA qua GitHub Actions

## 🎯 CÓ 2 PROJECT:

### 1. **Capacitor** (client folder) - ĐÃ CÓ iOS setup ✅
### 2. **React Native** (mobile folder) - CHƯA CÓ iOS setup ⚠️

---

## 🚀 OPTION 1: Build Capacitor App (Dễ nhất) ✅

### Capacitor đã có iOS folder sẵn!

### Workflow: `.github/workflows/build-capacitor-ios.yml`

### Cách dùng:

```bash
# 1. Push code lên GitHub
cd zalo-clone
git add .
git commit -m "Setup GitHub Actions"
git push origin main

# 2. Workflow tự động chạy
# 3. Download IPA từ Actions > Artifacts
```

### Kết quả:
- ✅ IPA file tạo thành công
- ⚠️ IPA **UNSIGNED** (không ký)
- ✅ Download được từ GitHub

---

## 🚀 OPTION 2: Build React Native App (Cần setup)

### React Native chưa có iOS folder!

### Bước 1: Tạo iOS Project

```bash
cd mobile

# Generate iOS & Android folders
npx react-native init ZyeaMobile --directory ../mobile-new

# Hoặc nếu đã có template
npx @react-native-community/cli init ZyeaMobile
```

### Bước 2: Setup iOS Project

```bash
cd ios
pod install
cd ..
```

### Bước 3: Chạy

```bash
npm run ios
```

---

## 📊 SO SÁNH:

| Feature | Capacitor | React Native |
|---------|-----------|--------------|
| **iOS Setup** | ✅ Có sẵn | ❌ Cần init |
| **Build Time** | ✅ Nhanh | ⏳ Lâu hơn |
| **IPA Size** | ⚠️ Lớn (~50MB) | ✅ Nhỏ hơn |
| **Native Features** | ⚠️ Giới hạn | ✅ Đầy đủ |
| **Setup Difficulty** | ✅ Dễ | ⚠️ Trung bình |

---

## 🎯 RECOMMENDATION

### Cho bạn:
**→ Dùng Capacitor workflow** (`build-capacitor-ios.yml`)

**Lý do:**
1. ✅ Đã có iOS folder sẵn
2. ✅ Web code đã working
3. ✅ Không cần setup thêm
4. ✅ Build nhanh

---

## 🚀 BẮT ĐẦU NGAY:

### Push code:

```bash
cd zalo-clone

# Add workflows
git add .github/

# Commit
git commit -m "Add iOS build workflows"

# Push
git push origin main
```

### Sau khi push:

1. Vào: https://github.com/Nidios1/zyea-chat-app/actions
2. Chờ workflow chạy (~15-20 phút)
3. Download IPA từ Artifacts

---

## 📱 Lấy IPA:

### Cách 1: GitHub Artifacts
```
Repo → Actions → Latest workflow → Artifacts → Download
```

### Cách 2: GitHub Releases
```
Repo → Releases → Download latest version
```

---

## ⚠️ IPA Unsigned:

### Không thể install trực tiếp!

### Cách install:

#### Option A: Xcode (Easiest)
```
1. Connect iPhone
2. Xcode > Window > Devices
3. Drag IPA vào
4. Click "Install"
```

#### Option B: AltStore
```
1. Install AltStore
2. Download IPA
3. AltStore > My Apps > + > IPA file
4. Sign & Install
```

#### Option C: Sideloadly
```
1. Download Sideloadly
2. Open IPA
3. Enter Apple ID
4. Install
```

---

## 🔐 Signed IPA (Production)

### Để có IPA tự ký được:

### Cần:
1. ✅ Apple Developer Account ($99/năm)
2. ✅ Certificate (.p12 file)
3. ✅ Provisioning Profile

### Setup:

#### 1. Create Secrets

Vào: https://github.com/Nidios1/zyea-chat-app/settings/secrets/actions

Add:
```
IOS_TEAM_ID = ABC123XYZ
IOS_CERTIFICATE_BASE64 = <base64 of .p12>
IOS_CERTIFICATE_PASSWORD = your-password
```

#### 2. Update workflow

Sử dụng `build-ios-fastlane.yml` với signing

---

## 📝 QUICK START:

### Đơn giản nhất (Unsigned IPA):

```bash
# 1. Push code
git push

# 2. Download IPA
# GitHub Actions > Artifacts

# 3. Install
# Xcode > Devices > Drag IPA
```

### Setup mất ~5 phút!

---

## 🎉 Kết Luận

**Workflow đã sẵn sàng!** Chỉ cần:
1. ✅ Push code
2. ✅ Chờ build
3. ✅ Download IPA

**Không cần Mac!** ☁️

