# 🧹 Project Cleanup Guide

## 📋 Tổng Quan

Dọn dẹp dự án để:
- ✅ Giữ lại file THIẾT YẾU cho mobile & PC
- ✅ Giữ lại file cho build IPA native  
- ✅ Xóa file trùng lặp, test, temp
- ✅ Giảm dung lượng dự án

---

## 🎯 3 Bước Đơn Giản

### Bước 1: Xem File Nào Sẽ Bị Xóa

Đọc file này để biết file nào quan trọng:
```
ESSENTIAL-FILES.md
```

### Bước 2: Verify Dự Án (Optional)

Kiểm tra xem có đủ file quan trọng không:
```bash
VERIFY-PROJECT.bat
```

### Bước 3: Cleanup

Chạy script dọn dẹp an toàn:
```bash
CLEANUP-PROJECT.bat
```

Script sẽ xóa:
- ❌ Docs trùng lặp
- ❌ Test scripts  
- ❌ Build artifacts (có thể rebuild)
- ❌ Temp files
- ❌ node_modules (optional)

Script sẽ GIỮ:
- ✅ Core responsive system
- ✅ All source code
- ✅ All configs
- ✅ iOS project
- ✅ Assets
- ✅ Server files

---

## 🔍 Chi Tiết File

### ⭐ Core Files - PHẢI GIỮ

#### Mobile Responsive (Hệ thống MỚI)
```
✅ client/src/styles/mobile-responsive-master.css
✅ client/src/hooks/useMobileLayout.js
✅ client/src/utils/initMobileLayout.js
```

#### App Core
```
✅ client/src/index.js
✅ client/src/App.js
✅ client/src/components/
✅ client/src/contexts/
✅ client/src/hooks/
✅ client/src/utils/
✅ client/src/styles/
```

#### Configuration
```
✅ client/package.json
✅ client/capacitor.config.ts
✅ client/tailwind.config.js
✅ server/package.json
```

#### iOS Native
```
✅ client/ios/ (entire folder)
```

#### Assets
```
✅ client/public/
```

### ❌ Files Sẽ Bị Xóa

#### Documentation Duplicates
```
❌ APPLY-RESPONSIVE-TO-COMPONENTS.md
❌ IOS-NATIVE-RESPONSIVE-COMPLETE.md
❌ TEST-RESPONSIVE-CHECKLIST.md
❌ BUILD-IOS-RESPONSIVE.bat
```

Giữ lại:
- ✅ START-HERE-MOBILE-RESPONSIVE.md
- ✅ MOBILE-RESPONSIVE-SIMPLE-GUIDE.md
- ✅ MOBILE-RESPONSIVE-README.md

#### Test & Demo Files
```
❌ test-*.js
❌ demo-*.bat
❌ quick-test-*.bat
❌ fix-badge-auto.bat
```

#### Build Artifacts
```
❌ client/build/ (rebuild được)
❌ *.zip
❌ *.rar
```

#### Temp Files
```
❌ *.log
❌ *.tmp
```

#### node_modules (Optional)
```
❌ client/node_modules/
❌ server/node_modules/
❌ node_modules/
```
→ Có thể npm install lại

---

## 🚨 QUAN TRỌNG

### KHÔNG BAO GIỜ XÓA

```
❌ package.json (tất cả)
❌ capacitor.config.ts
❌ ios/ folder
❌ src/ folder
❌ public/ folder
❌ server/ folder (source code)
```

### Legacy CSS Files - Quyết Định

3 file này đã được gộp vào `mobile-responsive-master.css`:
```
client/src/styles/
├── safe-area.css                 ⚠️ Legacy
├── responsive-enhanced.css       ⚠️ Legacy
└── iphone-optimization.css       ⚠️ Legacy
```

**Option 1: GIỮ** (Recommended)
- Backward compatibility
- Một số component cũ có thể dùng

**Option 2: XÓA** (Clean)
- Đã gộp hết vào mobile-responsive-master.css
- Phải đảm bảo tất cả component dùng file mới

---

## 📝 Sau Khi Cleanup

### 1. Verify
```bash
VERIFY-PROJECT.bat
```

### 2. Reinstall (nếu xóa node_modules)
```bash
cd client
npm install

cd ../server
npm install
```

### 3. Test Build
```bash
BUILD-TEST-MOBILE.bat
```

### 4. Checklist
- [ ] App build được
- [ ] iOS sync thành công
- [ ] Xcode mở được
- [ ] App chạy được
- [ ] Mobile responsive OK
- [ ] Desktop OK
- [ ] Keyboard tracking OK
- [ ] Safe area OK

---

## 🔧 Troubleshooting

### Lỗi: File quan trọng bị xóa
```bash
# Restore từ backup
# Hoặc restore từ git
git checkout <file>
```

### Lỗi: Build failed
```bash
# 1. Check node_modules
cd client
npm install

# 2. Check Capacitor
npx cap sync ios

# 3. Check logs
npm run build
```

### Lỗi: Component lỗi
```bash
# Check import trong component:
import useMobileLayout from '../../hooks/useMobileLayout';
```

---

## 📊 Kết Quả Mong Đợi

### Trước Cleanup
```
Total: ~500MB - 1GB
├── client/node_modules/    300MB
├── server/node_modules/    100MB
├── client/build/          50MB
├── docs duplicates        5MB
├── test files            10MB
└── temp/logs/zip         20MB
```

### Sau Cleanup
```
Total: ~100MB - 200MB
├── Source code           80MB
├── iOS project          50MB
├── Assets               10MB
├── Docs (essential)     2MB
└── Configs              1MB
```

Giảm: **~70-80%** dung lượng!

---

## ✅ Final Checklist

Sau cleanup:

- [ ] Chạy VERIFY-PROJECT.bat → PASS
- [ ] npm install (nếu cần)
- [ ] BUILD-TEST-MOBILE.bat → SUCCESS
- [ ] Test trên simulator → OK
- [ ] Test features → All working
- [ ] Git commit & push

---

## 🎉 Done!

Dự án đã gọn gàng, chỉ giữ file thiết yếu!

**Next:** Test build và deploy IPA!

---

**Version:** 1.0.0  
**Last Updated:** 2025-01-26  
**Status:** ✅ Ready to use

