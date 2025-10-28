# 🚀 Hướng Dẫn Build IPA qua GitHub Actions

## 📋 Tổng Quan

Đã tạo 3 workflows khác nhau để build IPA:

### 1. `build-ios.yml` - Full Hire
- ✅ Sử dụng Fastlane
- ✅ Professional signing
- ✅ TestFlight upload
- ❌ Cần setup complex

### 2. `build-ios-fastlane.yml` - Recommended ⭐
- ✅ Fastlane setup
- ✅ Auto/Manual signing
- ✅ GitHub Releases
- ⚠️ Cần certificates

### 3. `build-ios-simple.yml` - **Đơn Giản Nhất** 🎯
- ✅ Không cần signing
- ✅ Dễ setup
- ✅ Tạo unsigned IPA
- ✅ Dành cho testing

---

## 🎯 Setup GitHub Actions (ABSOLUTE BEGINNER)

### Bước 1: Push Code lên GitHub

```bash
cd zalo-clone
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/Nidios1/zyea-chat-app.git
git push -u origin main
```

### Bước 2: Enable GitHub Actions

1. Vào repo: https://github.com/Nidios1/zyea-chat-app
2. Tab **Actions**
3. Click **I understand my workflows...**

### Bước 3: Chọn Workflow

Workflow **SIMPLE** sẽ chạy tự động!

---

## 🎨 Workflow Files Created

### `.github/workflows/build-ios-simple.yml`

Workflow này sẽ:
1. ✅ Checkout code
2. ✅ Install dependencies
3. ✅ Build React app
4. ✅ Build iOS app (UNSIGNED)
5. ✅ Export IPA
6. ✅ Upload artifact

**Không cần setup gì thêm!**

---

## 📱 Lấy IPA

### Sau khi workflow chạy:

1. Vào repo → **Actions** tab
2. Click vào workflow run
3. Cuộn xuống **Artifacts**
4. Download **unsigned-ipa**
5. Extract file `.ipa`

---

## ⚠️ IPA Unsigned

### **IPA unsigned = không thể install trên device thường**

### Cách sử dụng:

#### Option 1: Sideload với AltStore/Sideloadly
```
1. Download IPA
2. Dùng AltStore/Sideloadly
3. Sign & install
```

#### Option 2: Dùng CodeSigner app
```
1. Download IPA
2. Sign với iOS App Signer
3. Install via Xcode/3uTools
```

#### Option 3: Xcode (Recommended cho testing)
```
1. Download IPA
2. Mở Xcode
3. Window > Devices
4. Drag & drop IPA
5. Install
```

---

## 🔐 Để Có Signed IPA (Production)

### Cần Setup:

#### 1. Apple Developer Account
- ✅ Individual: $99/năm
- ✅ Organization: $99/năm

#### 2. Certificates & Profiles
- ✅ Development Certificate
- ✅ Provisioning Profile
- ✅ Distribution Certificate (for App Store)

#### 3. GitHub Secrets

Vào repo → **Settings** → **Secrets and variables** → **Actions**

Add secrets:

```
IOS_TEAM_ID = Your Team ID
IOS_CERTIFICATE_BASE64 = Base64 of .p12 cert
IOS_CERTIFICATE_PASSWORD = Certificate password
IOS_KEYCHAIN_PASSWORD = Any password
```

#### 4. Enable Signed Workflow

Sử dụng `build-ios-fastlane.yml` thay vì `build-ios-simple.yml`

---

## 🎯 Workflow Comparison

| Feature | Simple | Fastlane | Full |
|---------|--------|----------|------|
| **Setup Time** | 5 phút | 30 phút | 1 giờ |
| **Needs Cert** | ❌ No | ⚠️ Optional | ✅ Yes |
| **IPA Type** | Unsigned | Signed | Signed |
| **Can Install** | ⚠️ With tool | ✅ Direct | ✅ Direct |
| **App Store** | ❌ No | ⚠️ Manual | ✅ Auto |
| **Difficulty** | ⭐ Easy | ⭐⭐ Medium | ⭐⭐⭐ Hard |

---

## 📝 Quick Start

### Để Build NGAY:

```bash
# 1. Commit code
git add .
git commit -m "Add iOS build"
git push

# 2. Workflow tự động chạy
# 3. Download IPA từ Actions > Artifacts
```

### Sau khi có IPA:

```bash
# Option A: Install via Xcode
# - Connect iPhone
# - Xcode > Window > Devices
# - Drag IPA vào

# Option B: Sideload
# - Dùng AltStore hoặc Sideloadly
# - Sign & install
```

---

## 🔧 Troubleshooting

### Lỗi "No such file or directory"
→ Check path trong workflow

### Lỗi "Command failed"
→ Check Xcode setup

### IPA không install được
→ IPA unsigned, cần sign lại

### Build lâu
→ Normal, first build ~15-20 phút

---

## 🎯 Kết Luận

### ⭐ Recommended cho Beginner:
→ Dùng **`build-ios-simple.yml`**

### ⭐ Recommended cho Production:
→ Setup certificates và dùng **`build-ios-fastlane.yml`**

### Workflow sẽ:
1. ✅ Tự động chạy khi push code
2. ✅ Build IPA
3. ✅ Upload để download

**KHÔNG cần Mac của bạn!** ☁️

---

## 📚 References

- [GitHub Actions Docs](https://docs.github.com/en/actions)
- [Xcode Build Guide](https://developer.apple.com/documentation/xcode)
- [AltStore](https://altstore.io/) - Sideload unsigned IPA

