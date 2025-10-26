# 🔒 Bundle ID Protection - Quick Start

## Tổng quan

Ứng dụng Zyea+ đã được bảo vệ bởi **Bundle ID Protection System**. 

### Bundle ID Chính thức
```
com.zyea.hieudev
```

### Cơ chế bảo vệ
- ✅ App chỉ hoạt động với Bundle ID: `com.zyea.hieudev`
- ❌ Nếu ai đó thay đổi Bundle ID → App sẽ **KHÔNG KHỞI ĐỘNG**
- 🔄 Kiểm tra liên tục mỗi 30 giây
- 🛡️ Multiple validation layers + checksum verification

---

## 🚀 Quick Build & Deploy

### Step 1: Build App
```bash
cd zalo-clone/client
npm run build:win
```

### Step 2: Sync iOS
```bash
npx cap sync ios
```

### Step 3: Open Xcode
```bash
npx cap open ios
```

### Step 4: Verify Bundle ID
```
Xcode → Select Target "App" → General
Bundle Identifier: com.zyea.hieudev ✓
```

### Step 5: Build IPA
```
Product → Archive → Distribute App
```

**Done!** 🎉 IPA đã được bảo vệ bởi Bundle ID Protection

---

## 🧪 Test Protection

### Test nhanh:
```bash
# 1. Thử thay đổi Bundle ID trong Xcode
Bundle Identifier: com.zyea.hieudev → com.fake.test

# 2. Build & Run
# → App sẽ hiển thị error screen ❌
```

### Expected Result:
```
⚠️ Bảo Vệ Bản Quyền

Bundle ID không hợp lệ hoặc đã bị chỉnh sửa!

ERROR: INVALID_BUNDLE_IDENTIFIER
```

---

## 📁 Files Quan trọng

| File | Mô tả |
|------|-------|
| `client/src/utils/bundleProtection.js` | Core protection logic |
| `client/src/components/Common/BundleProtectionError.js` | Error screen UI |
| `client/src/App.js` | Integration point |
| `client/capacitor.config.ts` | Bundle ID config |
| `BUNDLE-PROTECTION-GUIDE.md` | Full documentation |
| `TEST-BUNDLE-PROTECTION.md` | Testing guide |

---

## 🎯 Cách hoạt động (Simple)

```javascript
// 1. App khởi động
App.js → initBundleProtection()

// 2. Kiểm tra Bundle ID
bundleProtection.js → validateBundleId()
  → Check: currentBundleId === 'com.zyea.hieudev'
  → Check: checksum verification
  → Check: backup checksums

// 3. Nếu KHÔNG khớp
  → Show BundleProtectionError screen
  → Block app completely

// 4. Nếu khớp
  → Start continuous validation (every 30s)
  → App hoạt động bình thường
```

---

## 🔐 Security Levels

### Level 1: Direct Comparison ✅
```javascript
if (currentBundleId !== 'com.zyea.hieudev') {
  return false; // Block
}
```

### Level 2: Checksum Validation ✅
```javascript
const checksum = generateChecksum(currentBundleId);
if (checksum !== BUNDLE_CHECKSUM) {
  return false; // Block
}
```

### Level 3: Backup Verification ✅
```javascript
if (!BACKUP_CHECKSUMS.includes(checksum)) {
  return false; // Block
}
```

### Level 4: Continuous Monitoring ✅
```javascript
setInterval(() => {
  const isValid = validateBundleId();
  if (!isValid) {
    window.location.href = 'about:blank'; // Force exit
  }
}, 30000); // Every 30 seconds
```

---

## ⚙️ Configuration

### Thay đổi Bundle ID (Nếu cần)

**File 1:** `client/capacitor.config.ts`
```typescript
const config: CapacitorConfig = {
  appId: 'com.zyea.hieudev', // ← Change here
  ...
};
```

**File 2:** `client/src/utils/bundleProtection.js`
```javascript
const PROTECTED_BUNDLE_ID = 'com.zyea.hieudev'; // ← Change here
```

**File 3:** Xcode
```
Target → General → Bundle Identifier
com.zyea.hieudev // ← Change here
```

⚠️ **Important:** Tất cả 3 nơi phải giống nhau!

---

## 📊 Console Logs

### ✅ Success (Bundle ID đúng)
```
[Security] Initializing Bundle Protection...
[Security] Bundle ID validated successfully
[Security] ✅ Bundle Protection active
```

### ❌ Error (Bundle ID sai)
```
[Security] Initializing Bundle Protection...
[Security] Invalid Bundle ID detected
[Security] Expected: com.zyea.hieudev
[Security] Got: com.fake.app
[Security] ⚠️ Bundle ID validation failed!
[Security] ⚠️ BUNDLE ID PROTECTION TRIGGERED
```

---

## 🐛 Troubleshooting

### Problem: App shows error với Bundle ID đúng

**Check:**
1. Xcode Bundle ID: `com.zyea.hieudev` ✓
2. capacitor.config.ts: `appId: 'com.zyea.hieudev'` ✓
3. bundleProtection.js: `PROTECTED_BUNDLE_ID = 'com.zyea.hieudev'` ✓

### Problem: Protection không hoạt động

**Solution:**
```bash
cd client
npm install @capacitor/app
npx cap sync ios
```

### Problem: Muốn tắt protection để test

**Solution:**
```javascript
// client/src/App.js
const validateBundle = async () => {
  const isValid = true; // Force pass
  // const isValid = await initBundleProtection();
  ...
};
```

---

## 📱 Production Deployment

### Checklist trước khi release:

- [ ] Bundle ID = `com.zyea.hieudev` (Xcode)
- [ ] Bundle ID = `com.zyea.hieudev` (capacitor.config.ts)
- [ ] Bundle ID = `com.zyea.hieudev` (bundleProtection.js)
- [ ] Build: `npm run build:win`
- [ ] Sync: `npx cap sync ios`
- [ ] Test app launches ✅
- [ ] Test với Bundle ID sai → blocks ❌
- [ ] Archive IPA
- [ ] Test IPA on device
- [ ] Deploy to App Store / TestFlight

---

## 🎓 Documentation

### Full Guides:
- **BUNDLE-PROTECTION-GUIDE.md** - Complete technical documentation
- **TEST-BUNDLE-PROTECTION.md** - Testing scenarios and validation

### Quick Links:
- [How it works](#-cách-hoạt-động-simple)
- [Configuration](#️-configuration)
- [Troubleshooting](#-troubleshooting)
- [Testing](#-test-protection)

---

## 📞 Support

### Issues with Bundle Protection?

1. Read: `BUNDLE-PROTECTION-GUIDE.md`
2. Read: `TEST-BUNDLE-PROTECTION.md`
3. Check console logs
4. Verify Bundle IDs match
5. Contact: support@zyea.com

---

## ✨ Features

| Feature | Status |
|---------|--------|
| Bundle ID Validation | ✅ Active |
| Checksum Verification | ✅ Active |
| Continuous Monitoring | ✅ Active (30s) |
| Error Screen UI | ✅ Active |
| Web Version Support | ✅ Active |
| Obfuscation | ✅ Active |
| Rate Limiting | ✅ Active |
| Auto-validation | ✅ Active |

---

## 🚨 Important Notes

1. **Bundle ID must match exactly:** `com.zyea.hieudev`
2. **Protection only works on iOS/Android native apps**
3. **Web version (PWA) bypasses protection automatically**
4. **Console logs help debug issues**
5. **Test before deploying to production**

---

## 🎯 Quick Commands

```bash
# Build
cd client && npm run build:win

# Sync iOS
npx cap sync ios

# Open Xcode
npx cap open ios

# Check Bundle ID
cat capacitor.config.ts | grep appId

# Test Protection
# → Change Bundle ID in Xcode → Build → Should show error
```

---

## 📈 Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2024 | Initial Bundle Protection System |

---

**© 2024 Zyea - All Rights Reserved**

**Bundle ID:** `com.zyea.hieudev`

**Protected By:** Zyea Security System 🛡️

---

## 🔗 Quick Links

- [Main README](README.md)
- [Bundle Protection Guide](BUNDLE-PROTECTION-GUIDE.md)
- [Test Guide](TEST-BUNDLE-PROTECTION.md)
- [iOS Build Guide](BUILD-IOS-RESPONSIVE.bat)

---

**Ready to build IPA?** Follow Step 1-5 above! 🚀

