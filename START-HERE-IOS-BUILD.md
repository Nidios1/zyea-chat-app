# 🚀 START HERE - Build iOS App Trên GitHub

## 📋 TL;DR - 3 Bước Nhanh

```bash
# 1. Push code lên GitHub
cd c:\xampp\htdocs\zalo-clone
PUSH-TO-GITHUB.bat

# 2. Setup 5 GitHub Secrets (xem SETUP-GITHUB-SECRETS.md)
# 3. Vào GitHub Actions → Run workflow
```

---

## 📝 Chi Tiết 3 Bước

### Bước 1: Push Code Lên GitHub (5 phút)

**Cách 1: Dùng script tự động (Khuyên dùng)**
```bash
cd c:\xampp\htdocs\zalo-clone
PUSH-TO-GITHUB.bat
```

**Cách 2: Manual**
```bash
cd c:\xampp\htdocs\zalo-clone
git add .
git commit -m "Add iOS build workflow"
git push
```

---

### Bước 2: Setup GitHub Secrets (15-30 phút)

Cần 5 secrets:
1. **APPLE_TEAM_ID** - Team ID từ Apple Developer
2. **BUILD_CERTIFICATE_BASE64** - Certificate (.p12) convert sang base64
3. **P12_PASSWORD** - Password của file .p12
4. **BUILD_PROVISION_PROFILE_BASE64** - Provisioning profile convert sang base64
5. **KEYCHAIN_PASSWORD** - Bất kỳ password nào (ví dụ: `TempKey123!`)

**📖 Xem hướng dẫn chi tiết:** `SETUP-GITHUB-SECRETS.md`

**Vào đâu để setup:**
```
GitHub Repository → Settings → Secrets and variables → Actions
```

---

### Bước 3: Build Trên GitHub Actions (20-40 phút)

1. Vào repository trên GitHub
2. Click tab **Actions**
3. Chọn workflow **"Build iOS Apps"**
4. Click **"Run workflow"**
5. Chọn app cần build:
   - `messenger` - App Messenger (client)
   - `zyeaplus` - App Zyea+ (zyea-plus-app)  ⭐ Chọn cái này
   - `both` - Build cả 2 apps
6. Đợi build xong (~20 phút)
7. Download IPA từ **Artifacts**

---

## 📦 Files Đã Sẵn Sàng

### ✅ Workflow Files:
- `.github/workflows/build-ios.yml` - GitHub Actions workflow
- `.github/workflows/ci.yml` - CI/CD pipeline

### ✅ Config Files:
- `zyea-plus-app/capacitor.config.ts` - Capacitor config
- `zyea-plus-app/ios-export-options.plist` - Export options
- `zyea-plus-app/package.json` - Dependencies
- `zyea-plus-app/package-lock.json` - Lock file (vừa tạo)

### ✅ Documentation:
- `GITHUB-BUILD-IOS-GUIDE.md` - Full guide chi tiết
- `SETUP-GITHUB-SECRETS.md` - Hướng dẫn setup secrets
- `START-HERE-IOS-BUILD.md` - File này (Quick start)

### ✅ Scripts:
- `PUSH-TO-GITHUB.bat` - Auto push script

---

## 🎯 Quick Reference

### App Bundle IDs:
- **Zyea+ App:** `com.zyea.app`
- **Messenger App:** `com.zyea.hieudev`

### URL Schemes:
- **Zyea+ App:** `zyeaplus://`
- **Messenger App:** `zyeamessenger://`

### Build Output:
- **Messenger IPA:** `Messenger-iOS-IPA.zip`
- **Zyea+ IPA:** `ZyeaPlus-iOS-IPA.zip`

---

## ⚠️ Before You Start

### Cần có:
- [ ] GitHub account
- [ ] Apple Developer account ($99/year)
- [ ] Apple certificate (.p12)
- [ ] Provisioning profile (.mobileprovision)
- [ ] Mac để tạo certificate (có thể mượn tạm)

### Không cần:
- ❌ KHÔNG cần Mac để build (GitHub Actions có sẵn macOS)
- ❌ KHÔNG cần Xcode trên máy local
- ❌ KHÔNG cần upload folder ios/ lên GitHub

---

## 🔍 Troubleshooting

### Problem: "package-lock.json not found"
**Solution:**
```bash
cd zyea-plus-app
npm install
git add package-lock.json
git push
```

### Problem: "Code signing error"
**Solution:**
- Verify 5 GitHub Secrets đã setup đúng
- Check Bundle ID khớp với provisioning profile
- Check certificate còn hiệu lực

### Problem: "ios folder not found"
**Solution:**
- Đây là NORMAL! GitHub Actions tự tạo folder ios
- Không cần push folder ios lên GitHub

### Problem: "Workflow không xuất hiện"
**Solution:**
- Đảm bảo file `.github/workflows/build-ios.yml` đã push lên GitHub
- Check branch đúng (main/master)
- Refresh trang GitHub Actions

---

## 📊 Build Time & Cost

### Build Time:
- Messenger App: ~20-25 phút
- Zyea+ App: ~15-20 phút
- Both Apps: ~40-45 phút

### GitHub Actions Free Tier:
- 2000 phút/tháng miễn phí
- Có thể build ~100 lần/tháng
- Private repo: 2000 phút/tháng
- Public repo: Unlimited

---

## 🎉 Success Checklist

- [ ] Code pushed to GitHub
- [ ] 5 Secrets configured
- [ ] Workflow run successfully
- [ ] IPA downloaded from Artifacts
- [ ] App installed on iPhone
- [ ] App launches without crash

---

## 📱 Cài IPA Lên iPhone

### Cách 1: Apple Configurator (Mac)
```
1. Install Apple Configurator
2. Connect iPhone
3. Drag & drop .ipa file
```

### Cách 2: Xcode (Mac)
```
1. Window → Devices and Simulators
2. Select your iPhone
3. Click [+] under Installed Apps
4. Select .ipa file
```

### Cách 3: Diawi (Web - Development only)
```
1. Upload .ipa to https://www.diawi.com/
2. Share link to install
3. Open link on iPhone → Install
```

---

## 🔗 Related Docs

- **Full Guide:** [GITHUB-BUILD-IOS-GUIDE.md](GITHUB-BUILD-IOS-GUIDE.md)
- **Secrets Setup:** [SETUP-GITHUB-SECRETS.md](SETUP-GITHUB-SECRETS.md)
- **App Structure:** [QUICK-START-2-APPS.md](QUICK-START-2-APPS.md)
- **Zyea+ App:** [ZYEA-PLUS-APP-README.md](ZYEA-PLUS-APP-README.md)

---

## 💬 Need Help?

1. Check [GITHUB-BUILD-IOS-GUIDE.md](GITHUB-BUILD-IOS-GUIDE.md) - Full guide
2. Check [SETUP-GITHUB-SECRETS.md](SETUP-GITHUB-SECRETS.md) - Secrets setup
3. Check GitHub Actions logs - Xem lỗi chi tiết
4. Google error message - Copy/paste error vào Google

---

**Ready? Start với Bước 1: PUSH-TO-GITHUB.bat** 🚀

