# 📱 Build iOS IPA via GitHub Actions

## ✅ ĐÃ TẠO SẴN

### Workflows:
1. ✅ `build-capacitor-ios.yml` - **Dùng workflow này** ⭐
2. ✅ `build-ios-simple.yml` - Backup option
3. ✅ `build-ios-fastlane.yml` - Advanced signing

### Files:
- `.github/workflows/` - 3 workflows
- `exportOptions.plist` - Export config
- `HOW_TO_BUILD_IPA.md` - Detailed guide

## 🚀 CÁCH BUILD IPA (3 Bước)

### Bước 1: Push code lên GitHub

```bash
cd c:\xampp\htdocs\zalo-clone

# Add tất cả files
git add .

# Commit
git commit -m "Initial commit with iOS build"

# Push lên GitHub
git remote add origin https://github.com/Nidios1/zyea-chat-app.git
git push -u origin main
```

### Bước 2: Đợi GitHub Actions build

1. Vào: https://github.com/Nidios1/zyea-chat-app
2. Click tab **Actions**
3. Workflow tự động chạy
4. Đợi ~15-20 phút

### Bước 3: Download IPA

1. Click vào workflow run thành công
2. Cuộn xuống **Artifacts**
3. Download **capacitor-ipa**
4. Extract file `.ipa`

## 📱 Cách Install IPA

### Vì IPA unsigned, cần sign lại:

### **Cách 1: Xcode** ⭐ Dễ nhất

```
1. Connect iPhone to Mac
2. Mở Xcode
3. Window > Devices and Simulators
4. Chọn iPhone
5. Kéo file IPA vào
6. Click "Install"
```

### **Cách 2: AltStore** (iOS)

```
1. Install AltStore trên iPhone
2. Download IPA
3. AltStore > My Apps > +
4. Chọn IPA file
5. AltStore sẽ sign & install
```

### **Cách 3: Sideloadly** (Windows/Mac)

```
1. Download Sideloadly
2. Open app
3. Kéo IPA vào
4. Enter Apple ID
5. Click Start
```

## ⚠️ LƯU Ý QUAN TRỌNG

### 1. IPA Unsigned
- ❌ Không install trực tiếp được
- ✅ Cần sign với Xcode/AltStore
- ✅ OK cho testing

### 2. Certificate Expiry
- Unsigned IPA không expire
- Signed IPA expire sau 7 ngày (free account)
- Developer account: 1 năm

### 3. Device Limit
- Free: Không limit unsigned
- Free: 3 devices signed
- Paid: 100 devices

## 🔐 ĐỂ CÓ SIGNED IPA (Tự ký được)

### Cần Apple Developer Account:

```bash
# Setup secrets trong GitHub:
# Settings > Secrets > Actions

IOS_TEAM_ID=ABC123XYZ
IOS_CERTIFICATE_BASE64=<base64 cert>
IOS_CERTIFICATE_PASSWORD=password
```

### Workflow sẽ tự sign IPA!

## 🎯 TÓM TẮT

### Để build IPA:

```bash
git push
```

### Để lấy IPA:

```
GitHub Actions > Artifacts > Download
```

### Để install:

```
Xcode > Devices > Drag IPA
```

**THẾ THÔI!** 🎉

---

## 📞 Support

Nếu gặp lỗi:
1. Check GitHub Actions logs
2. Xem `HOW_TO_BUILD_IPA.md`
3. Check iOS folder exists

**Workflow đã sẵn sàng! Chỉ cần push code!** ✅

