# 🧪 Test Bundle Protection System

## Quick Test Guide

### ✅ Test 1: Verify Protection is Active

**Khi build với Bundle ID đúng:**

```bash
cd client
npm run build:win
npx cap sync ios
npx cap open ios
```

**Expected Console Logs:**
```
[Security] Initializing Bundle Protection...
[Security] Bundle ID validated successfully
[Security] ✅ Bundle Protection active
```

**Result:** ✅ App hoạt động bình thường

---

### ❌ Test 2: Test with Wrong Bundle ID

**Steps:**
1. Mở Xcode: `client/ios/App/App.xcworkspace`
2. Select Target "App"
3. General → Identity → Bundle Identifier
4. Change from `com.zyea.hieudev` to `com.fake.test`
5. Build & Run

**Expected Console Logs:**
```
[Security] Initializing Bundle Protection...
[Security] Invalid Bundle ID detected
[Security] Expected: com.zyea.hieudev
[Security] Got: com.fake.test
[Security] ⚠️ Bundle ID validation failed!
[Security] ⚠️ BUNDLE ID PROTECTION TRIGGERED
```

**Result:** ❌ App hiển thị error screen (BundleProtectionError)

**Screen hiển thị:**
```
⚠️ Bảo Vệ Bản Quyền

Bundle ID không hợp lệ hoặc đã bị chỉnh sửa!

ERROR: INVALID_BUNDLE_IDENTIFIER

🛡️ Protected by Zyea Security System
```

---

### 🔄 Test 3: Test Continuous Validation

**Steps:**
1. Build với Bundle ID đúng: `com.zyea.hieudev`
2. App khởi động bình thường
3. Đợi 30 giây (continuous validation interval)

**Expected Console Logs:**
```
[Security] ✅ Bundle Protection active
// After 30 seconds:
[Security] Bundle ID validated successfully
// After another 30 seconds:
[Security] Bundle ID validated successfully
```

**Result:** ✅ App tiếp tục hoạt động, validation chạy mỗi 30s

---

### 🌐 Test 4: Test on Web (PWA)

**Steps:**
```bash
cd client
npm start
# Open http://localhost:3000
```

**Expected Console Logs:**
```
[Security] Initializing Bundle Protection...
(No validation on web - returns true automatically)
```

**Result:** ✅ Web version hoạt động bình thường (không cần validate)

---

## 🎯 Test Scenarios Summary

| Test Case | Bundle ID | Expected Result | Screen |
|-----------|-----------|-----------------|---------|
| Normal App | `com.zyea.hieudev` | ✅ Works | Normal UI |
| Wrong Bundle | `com.fake.app` | ❌ Blocked | Error Screen |
| Modified Bundle | `com.zyea.hieudev2` | ❌ Blocked | Error Screen |
| Web Version | N/A | ✅ Works | Normal UI |

---

## 🔍 Debugging

### Check Bundle ID in Xcode
```
1. Open: client/ios/App/App.xcworkspace
2. Select Target: App
3. General → Identity
4. Bundle Identifier: com.zyea.hieudev ✓
```

### Check Capacitor Config
```typescript
// client/capacitor.config.ts
const config: CapacitorConfig = {
  appId: 'com.zyea.hieudev',  // ✓ Must match
  ...
};
```

### Check Console Logs
```javascript
// Enable verbose logging
// bundleProtection.js
console.log('[Security] Current Bundle ID:', currentBundleId);
console.log('[Security] Expected:', PROTECTED_BUNDLE_ID);
console.log('[Security] Checksum:', currentChecksum);
```

---

## 🚨 Common Issues

### Issue 1: App shows error even with correct Bundle ID

**Solution:**
```javascript
// Check PROTECTED_BUNDLE_ID matches exactly
// client/src/utils/bundleProtection.js
const PROTECTED_BUNDLE_ID = 'com.zyea.hieudev';  // Must be exact
```

### Issue 2: Protection not working on iOS

**Solution:**
```bash
# Make sure Capacitor App plugin is installed
cd client
npm install @capacitor/app

# Sync again
npx cap sync ios
```

### Issue 3: Want to disable for testing

**Solution:**
```javascript
// client/src/App.js
useEffect(() => {
  const validateBundle = async () => {
    // Comment out for testing
    // const isValid = await initBundleProtection();
    const isValid = true;  // Force pass for testing
    
    if (!isValid) {
      setBundleProtectionFailed(true);
    }
  };
  
  validateBundle();
}, []);
```

---

## 📊 Production Checklist

Before releasing IPA:

- [ ] Bundle ID is `com.zyea.hieudev` in Xcode
- [ ] Bundle ID is `com.zyea.hieudev` in capacitor.config.ts
- [ ] Build with `npm run build:win`
- [ ] Sync with `npx cap sync ios`
- [ ] Test app launches successfully
- [ ] Check console logs show "✅ Bundle Protection active"
- [ ] Test with wrong Bundle ID → should block
- [ ] Archive & Export IPA
- [ ] Test IPA installation on real device

---

## 🎬 Demo Script

### Script 1: Show Protection Working
```bash
# 1. Build normal
cd client
npm run build:win
npx cap sync ios
npx cap open ios

# 2. Run in simulator
# → App works ✅

# 3. Change Bundle ID to com.fake.test
# 4. Run again
# → Error screen shows ❌
```

### Script 2: Show Console Logs
```bash
# 1. Open Safari Developer Tools
# 2. Connect iOS device/simulator
# 3. Develop → Simulator → localhost
# 4. Check Console tab
# 5. See security logs
```

---

## 📱 Real Device Testing

```bash
# 1. Connect iPhone via USB
# 2. Open Xcode
# 3. Select your iPhone as target
# 4. Bundle ID: com.zyea.hieudev
# 5. Signing & Capabilities → Add your team
# 6. Run on device
# 7. Check console logs
```

---

## 🔐 Security Validation

### What's Protected:
✅ Bundle ID cannot be changed
✅ Checksum validation prevents tampering
✅ Continuous monitoring (every 30s)
✅ Multiple validation layers
✅ Obfuscated checksums
✅ Auto-validation on module load

### What's NOT Protected:
❌ Source code obfuscation (JS can be read)
❌ API endpoints (can be intercepted)
❌ Network traffic (can be monitored)
❌ Memory dumping (runtime data accessible)

### Recommendation:
- Bundle Protection is **Layer 1** security
- Add more layers: API authentication, encryption, etc.
- Use code obfuscation tools for production
- Implement server-side validation

---

## 📞 Need Help?

If Bundle Protection not working:
1. Check Bundle ID matches exactly
2. Check Capacitor plugins installed
3. Check console logs for errors
4. Read BUNDLE-PROTECTION-GUIDE.md
5. Contact: support@zyea.com

---

**Last Updated:** 2024
**Version:** 1.0
**Bundle ID:** com.zyea.hieudev

