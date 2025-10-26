# 🔒 Bundle ID Protection System

## Tổng quan

Hệ thống bảo vệ Bundle ID đảm bảo ứng dụng chỉ hoạt động với Bundle ID chính thức: **`com.zyea.hieudev`**

Nếu ai đó thay đổi, crack hoặc xóa Bundle ID, ứng dụng sẽ **KHÔNG KHỞI ĐỘNG ĐƯỢC**.

---

## ✅ Tính năng bảo vệ

### 1. **Runtime Validation**
- Kiểm tra Bundle ID khi app khởi động
- Validate checksum để phát hiện modifications
- Multiple backup checksums (obfuscated)

### 2. **Continuous Protection**
- Tự động kiểm tra lại mỗi 30 giây
- Block app ngay lập tức nếu phát hiện thay đổi
- Force reload/blank page nếu validation fails

### 3. **Anti-Tampering**
- Module tự động validate khi được load
- Obfuscated Bundle ID trong source code
- Multiple validation attempts tracking
- Checksum verification

### 4. **Security Layers**
```
Layer 1: Init validation khi app start
Layer 2: Continuous validation (30s interval)
Layer 3: Multiple checksum verification
Layer 4: Module auto-validation on load
```

---

## 📁 Cấu trúc Files

```
client/src/
├── utils/
│   └── bundleProtection.js       # Core protection logic
├── components/
│   └── Common/
│       └── BundleProtectionError.js  # Error screen
└── App.js                         # Integration point
```

---

## 🔧 Cách hoạt động

### Bước 1: Validation khi khởi động
```javascript
// App.js - useEffect runs first
useEffect(() => {
  const validateBundle = async () => {
    const isValid = await initBundleProtection();
    
    if (!isValid) {
      setBundleProtectionFailed(true);  // Block app
      return;
    }
    
    startContinuousValidation();  // Monitor continuously
  };
  
  validateBundle();
}, []);
```

### Bước 2: Kiểm tra Bundle ID
```javascript
// bundleProtection.js
const PROTECTED_BUNDLE_ID = 'com.zyea.hieudev';

async function validateBundleId() {
  const appInfo = await CapacitorApp.getInfo();
  const currentBundleId = appInfo.id;
  
  // Check 1: Direct comparison
  if (currentBundleId !== PROTECTED_BUNDLE_ID) {
    return false;
  }
  
  // Check 2: Checksum verification
  const currentChecksum = generateChecksum(currentBundleId);
  if (currentChecksum !== BUNDLE_CHECKSUM) {
    return false;
  }
  
  // Check 3: Backup checksums
  if (!BACKUP_CHECKSUMS.includes(currentChecksum)) {
    return false;
  }
  
  return true;
}
```

### Bước 3: Block app nếu invalid
```javascript
// App.js - Render logic
if (bundleProtectionFailed) {
  return <BundleProtectionError />;  // Show error screen
}
```

---

## 🎨 Error Screen

Khi Bundle ID không hợp lệ, hiển thị:

```
⚠️ Bảo Vệ Bản Quyền

Bundle ID không hợp lệ hoặc đã bị chỉnh sửa!

ERROR: INVALID_BUNDLE_IDENTIFIER

🛡️ Protected by Zyea Security System

ℹ️ Thông tin quan trọng:
• Bundle ID chính thức: com.zyea.hieudev
• Ứng dụng này chỉ hoạt động với Bundle ID gốc
• Vui lòng tải ứng dụng chính thức từ nguồn tin cậy
```

---

## 🚀 Build & Deploy

### 1. Build với Bundle Protection
```bash
cd client
npm run build:win
npx cap sync ios
```

### 2. Xcode Configuration
```
1. Mở ios/App/App.xcworkspace
2. Verify Bundle Identifier: com.zyea.hieudev
3. Build & Archive
4. Export IPA
```

### 3. Testing Protection
```bash
# Test 1: Thử thay đổi Bundle ID trong Xcode
# → App sẽ show error screen

# Test 2: Thử build với Bundle ID khác
# → App sẽ không khởi động

# Test 3: Thử crack/modify app
# → Continuous validation sẽ block
```

---

## 🔐 Security Features

### 1. **Obfuscation**
```javascript
// Bundle ID được mã hóa trong nhiều layers
const PROTECTED_BUNDLE_ID = 'com.zyea.hieudev';  // Layer 1
const BUNDLE_CHECKSUM = generateChecksum(PROTECTED_BUNDLE_ID);  // Layer 2
const BACKUP_CHECKSUMS = [fake1, real, fake2];  // Layer 3 (mixed with fakes)
```

### 2. **Checksum Verification**
```javascript
function generateChecksum(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16).padStart(32, '0');
}
```

### 3. **Rate Limiting**
```javascript
const MAX_VALIDATION_ATTEMPTS = 3;
let validationAttempts = 0;

if (validationAttempts > MAX_VALIDATION_ATTEMPTS) {
  console.error('[Security] Too many validation attempts');
  return false;
}
```

### 4. **Continuous Monitoring**
```javascript
setInterval(async () => {
  const isValid = await validateBundleId();
  if (!isValid) {
    window.location.href = 'about:blank';  // Force exit
  }
}, 30000);  // Every 30 seconds
```

---

## 📊 Console Logs

### Success Case
```
[Security] Initializing Bundle Protection...
[Security] Bundle ID validated successfully
[Security] ✅ Bundle Protection active
```

### Failure Case
```
[Security] Initializing Bundle Protection...
[Security] Invalid Bundle ID detected
[Security] Expected: com.zyea.hieudev
[Security] Got: com.fake.app
[Security] ⚠️ Bundle ID validation failed!
[Security] ⚠️ BUNDLE ID PROTECTION TRIGGERED
[Security] This app is protected and cannot run with modified Bundle ID
[Security] Official Bundle ID: com.zyea.hieudev
```

---

## ⚙️ Configuration

### Thay đổi Bundle ID (Nếu cần)
```javascript
// client/src/utils/bundleProtection.js
const PROTECTED_BUNDLE_ID = 'com.newbundle.id';  // Thay đổi ở đây
```

### Thay đổi validation interval
```javascript
// bundleProtection.js - startContinuousValidation()
setInterval(async () => {
  // ...
}, 60000);  // Thay đổi từ 30s → 60s
```

### Disable protection (Development only)
```javascript
// App.js
const validateBundle = async () => {
  if (process.env.NODE_ENV === 'development') {
    return;  // Skip validation in dev mode
  }
  // ... rest of code
};
```

---

## 🎯 Best Practices

### 1. **KHÔNG commit sensitive data**
```bash
# .gitignore
client/src/utils/bundleProtection.js  # Nếu có API keys
```

### 2. **Test trước khi deploy**
```bash
# Test với Bundle ID đúng
npx cap run ios  # Should work

# Test với Bundle ID sai (trong Xcode)
# Change Bundle ID → Build → Should show error
```

### 3. **Monitor logs**
```javascript
// Check console for security logs
console.log('[Security] ...')
console.error('[Security] ...')
```

### 4. **Update checksums sau khi thay đổi**
```javascript
// Nếu thay đổi Bundle ID, generate checksum mới
const newChecksum = generateChecksum('com.new.bundle.id');
console.log('New checksum:', newChecksum);
```

---

## 🐛 Troubleshooting

### Problem: App shows error screen ngay cả với Bundle ID đúng

**Solution:**
```javascript
// bundleProtection.js - Check PROTECTED_BUNDLE_ID
const PROTECTED_BUNDLE_ID = 'com.zyea.hieudev';  // Đảm bảo đúng

// Xcode - Verify Bundle Identifier
Target → General → Bundle Identifier: com.zyea.hieudev
```

### Problem: Validation không hoạt động trên web

**Solution:**
```javascript
// bundleProtection.js already handles this
if (!Capacitor.isNativePlatform()) {
  return true;  // Web version always valid
}
```

### Problem: Too many validation attempts

**Solution:**
```javascript
// Reset validation attempts (for testing)
validationAttempts = 0;

// Or increase MAX_VALIDATION_ATTEMPTS
const MAX_VALIDATION_ATTEMPTS = 5;  // Tăng từ 3 → 5
```

---

## 📝 Checklist trước khi deploy

- [ ] Verify Bundle ID: `com.zyea.hieudev`
- [ ] Test Bundle Protection (thay đổi Bundle ID → should fail)
- [ ] Check console logs (security messages)
- [ ] Test continuous validation (wait 30s)
- [ ] Build & archive IPA
- [ ] Install IPA → verify app works
- [ ] Try to crack/modify → should block

---

## 🔗 Related Files

- `client/capacitor.config.ts` - Bundle ID configuration
- `client/ios/App/App.xcodeproj` - Xcode project settings
- `client/src/App.js` - Main app integration
- `client/src/utils/bundleProtection.js` - Core protection
- `client/src/components/Common/BundleProtectionError.js` - Error UI

---

## 📞 Support

Nếu có vấn đề với Bundle Protection:
1. Check console logs
2. Verify Bundle ID trong Xcode
3. Test với app chính thức
4. Contact: support@zyea.com

---

**© 2024 Zyea - All Rights Reserved**
**Bundle ID Protection v1.0**

