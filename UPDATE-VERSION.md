# 📱 Cập nhật Version App

## Current Version: 1.0.0

## 📍 Nơi cần cập nhật VERSION

### 1. ✅ package.json (React App)
```json
{
  "version": "1.0.0"
}
```
**Status:** ✅ Updated to 1.0.0

---

### 2. ⚙️ iOS Version (Xcode)

#### **Cách 1: Cập nhật trong Xcode (Recommended)**

1. Mở Xcode:
```bash
cd client
npx cap open ios
```

2. Select Target **"App"**

3. Tab **"General"** → **"Identity"**

4. Cập nhật:
```
Version: 1.0.0       ← (MARKETING_VERSION)
Build: 1             ← (CURRENT_PROJECT_VERSION)
```

5. Mỗi lần build mới, tăng **Build number**:
```
Build: 1 → 2 → 3 → ...
```

---

#### **Cách 2: Cập nhật trực tiếp file (Advanced)**

File: `client/ios/App/App.xcodeproj/project.pbxproj`

Tìm và thay đổi:
```
MARKETING_VERSION = 1.0;      ← App Store version
CURRENT_PROJECT_VERSION = 1;  ← Build number
```

Thành:
```
MARKETING_VERSION = 1.0.0;    ← New version
CURRENT_PROJECT_VERSION = 2;  ← Increment build
```

---

## 🚀 Version Naming Convention

### Format: `MAJOR.MINOR.PATCH`

| Type | When to increment | Example |
|------|-------------------|---------|
| **MAJOR** | Breaking changes | 1.0.0 → 2.0.0 |
| **MINOR** | New features | 1.0.0 → 1.1.0 |
| **PATCH** | Bug fixes | 1.0.0 → 1.0.1 |

### Examples:
```
1.0.0 - Initial release
1.0.1 - Bug fixes
1.1.0 - New features (Bundle Protection added)
1.1.1 - Minor fixes
2.0.0 - Major rewrite
```

---

## 📋 Version Update Checklist

### Before Building IPA:

- [x] Update `package.json` version: **1.0.0** ✅
- [ ] Update iOS `MARKETING_VERSION`: **1.0.0**
- [ ] Increment iOS `CURRENT_PROJECT_VERSION`: **1** → **2**
- [ ] Build: `npm run build:win`
- [ ] Sync: `npx cap sync ios`
- [ ] Open Xcode and verify version
- [ ] Archive & Export IPA
- [ ] Test IPA on device

---

## 🔢 Build Number Management

### Rules:
1. **Version** changes only for App Store releases
2. **Build number** increments for every build
3. App Store requires: `New Build > Old Build`

### Example Timeline:
```
Version 1.0.0, Build 1  → Initial TestFlight
Version 1.0.0, Build 2  → Bug fix build
Version 1.0.0, Build 3  → Final TestFlight
Version 1.0.0, Build 4  → App Store release

Version 1.1.0, Build 5  → New features
Version 1.1.0, Build 6  → TestFlight
Version 1.1.0, Build 7  → App Store release
```

---

## ⚡ Quick Update Commands

### Step 1: Update package.json (Done ✅)
```bash
# Already updated to 1.0.0
```

### Step 2: Update iOS Version
```bash
cd client
npx cap open ios

# In Xcode:
# Target App → General
# Version: 1.0.0
# Build: 2 (increment from previous)
```

### Step 3: Build & Deploy
```bash
# Build React app
npm run build:win

# Sync with iOS
npx cap sync ios

# Open Xcode
npx cap open ios

# Archive → Distribute → Export IPA
```

---

## 📊 Current Version Status

| Location | Version | Build | Status |
|----------|---------|-------|--------|
| package.json | 1.0.0 | - | ✅ Updated |
| iOS Xcode | 1.0 | 1 | ⚠️ Need update to 1.0.0 |
| Bundle ID | com.zyea.hieudev | - | ✅ Protected |

---

## 🎯 Version for Current Release

**Recommended version for this release:**

```
Version: 1.0.0
Build: 1

Description: 
- Initial Zyea+ release with Bundle Protection
- Message deletion & swipe features
- Mobile responsive improvements
- Chat enhancements
```

---

## 📝 Version History Template

Keep track of versions:

```
## Version 1.0.0 (Build 1) - 2024-10-26
- Initial release
- Bundle ID Protection System
- Message deletion with swipe
- Mobile responsive design
- Chat improvements

## Version 1.0.1 (Build 2) - TBD
- Bug fixes
- Performance improvements

## Version 1.1.0 (Build 3) - TBD
- New features
- UI enhancements
```

---

## 🔧 Troubleshooting

### Issue: "Version already exists on App Store Connect"

**Solution:**
```
Increment Build number:
CURRENT_PROJECT_VERSION = 1 → 2
```

### Issue: "Invalid version format"

**Solution:**
```
Use format: X.Y.Z
Valid: 1.0.0, 1.2.3, 2.0.0
Invalid: 1.0, v1.0.0, 1.0.0.0
```

### Issue: "Build number too low"

**Solution:**
```
Build number must be > previous build
Previous: 5 → New: 6 (or higher)
```

---

## 🚨 Important Notes

1. **Always increment build number** for new builds
2. **Version only changes** for App Store releases
3. **TestFlight requires unique** build numbers
4. **Keep version consistent** across package.json and Xcode
5. **Document version changes** in release notes

---

## 📞 Quick Reference

### Current Settings:
- **Package.json:** 1.0.0 ✅
- **iOS Marketing Version:** 1.0 → Update to 1.0.0
- **iOS Build Number:** 1 → Increment to 2 for new build
- **Bundle ID:** com.zyea.hieudev (Protected 🔒)

### Next Steps:
1. Open Xcode
2. Update version to 1.0.0
3. Update build to 2
4. Build IPA
5. Test & Deploy

---

**Last Updated:** 2024-10-26
**Current Version:** 1.0.0
**Next Build:** 2

