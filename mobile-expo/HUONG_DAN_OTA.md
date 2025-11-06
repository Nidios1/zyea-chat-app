# 📱 Hướng Dẫn OTA Updates - Cập Nhật Không Cần Cài Lại App

## 🎯 OTA Updates Là Gì?

**OTA (Over-The-Air) Updates** cho phép bạn:
- ✅ **Cập nhật JavaScript code** (React Native code)
- ✅ **Cập nhật assets** (ảnh, fonts, icons)
- ✅ **Cập nhật UI/UX** (giao diện, styles)
- ✅ **Sửa bugs** trong JavaScript
- ✅ **Thêm tính năng mới** (chỉ JavaScript)
- ❌ **KHÔNG cần cài lại app** từ App Store/Play Store
- ❌ **KHÔNG cần build lại IPA/APK**

## 🔄 Cách Hoạt Động

### 1. **Lần Đầu Tiên (Build App)**
```bash
npm run eas:build:production
```
- Build app và cài lên thiết bị
- App có version 1.0.1

### 2. **Cập Nhật Code (Ví dụ: Sửa UI, thêm tính năng)**
- Sửa code JavaScript trong `src/`
- Thay đổi giao diện, styles
- Thêm components mới

### 3. **Publish Update (KHÔNG cần build lại)**
```bash
npm run update:publish "Sửa UI, thêm tính năng mới"
```
- Chỉ publish JavaScript code mới
- **KHÔNG cần build IPA/APK**
- **KHÔNG cần upload lên App Store**

### 4. **User Nhận Update**
- User mở app
- App tự động check update
- Modal hiển thị: "Ứng dụng đã có phiên bản mới"
- User click "Cập nhật"
- App reload với code mới
- **KHÔNG cần cài lại app**

## 📋 Ví Dụ Thực Tế

### Scenario 1: Sửa Bug UI
```bash
# 1. Sửa bug trong code
# src/components/Button.tsx - sửa màu button

# 2. Publish update
npm run update:publish "Sửa màu button"

# 3. User mở app → Nhận update → UI mới hiển thị
# KHÔNG cần cài lại app!
```

### Scenario 2: Thêm Tính Năng
```bash
# 1. Thêm component mới
# src/components/NewFeature.tsx

# 2. Publish update
npm run update:publish "Thêm tính năng mới"

# 3. User mở app → Nhận update → Tính năng mới xuất hiện
# KHÔNG cần cài lại app!
```

### Scenario 3: Thay Đổi Giao Diện
```bash
# 1. Thay đổi styles, layout
# src/styles/theme.ts

# 2. Publish update
npm run update:publish "Cập nhật giao diện"

# 3. User mở app → Nhận update → Giao diện mới
# KHÔNG cần cài lại app!
```

## ⚠️ Những Gì KHÔNG Thể Cập Nhật Qua OTA

- ❌ **Native code** (Swift, Kotlin, Objective-C, Java)
- ❌ **Native modules mới** (cần link native)
- ❌ **Thay đổi app.json** (icon, splash, permissions)
- ❌ **Thay đổi native dependencies**

→ Những thay đổi này cần **build lại app** và **upload lên App Store**

## ✅ Những Gì CÓ THỂ Cập Nhật Qua OTA

- ✅ **Tất cả JavaScript/TypeScript code**
- ✅ **React Native components**
- ✅ **Styles, themes, UI**
- ✅ **Business logic**
- ✅ **API calls, data handling**
- ✅ **Assets** (ảnh, fonts trong project)
- ✅ **Navigation flows**
- ✅ **State management**

## 🚀 Quy Trình Publish Update

### Bước 1: Thay Đổi Code
```bash
# Sửa code trong src/
# Ví dụ: sửa màu button, thêm tính năng
```

### Bước 2: Test Locally
```bash
npm start
# Test trong Expo Go hoặc development build
```

### Bước 3: Publish Update
```bash
npm run update:publish "Mô tả thay đổi"
```

### Bước 4: User Nhận Update
- User mở app
- Modal tự động hiển thị
- User click "Cập nhật"
- App reload với code mới

## 📊 So Sánh

| | Build App (IPA/APK) | OTA Update |
|---|---|---|
| **Thời gian** | 10-30 phút | 1-2 phút |
| **Cần review** | ✅ App Store review | ❌ Không cần |
| **User cần làm** | Cài lại app | Chỉ click "Cập nhật" |
| **Cập nhật được** | Mọi thứ | JavaScript + Assets |
| **Khi nào dùng** | Native changes | JavaScript changes |

## 💡 Best Practices

1. **Sử dụng OTA cho:**
   - Sửa bugs JavaScript
   - Cập nhật UI/UX
   - Thêm tính năng mới (JavaScript)
   - Thay đổi business logic

2. **Build lại app khi:**
   - Thêm native module
   - Thay đổi permissions
   - Thay đổi app icon/splash
   - Cần update version number lớn

3. **Publish thường xuyên:**
   - Mỗi khi có thay đổi code
   - Test trên production build
   - User nhận update tự động

## 🎯 Tóm Tắt

**OTA Updates = Cập nhật code JavaScript mà KHÔNG cần cài lại app**

- ✅ Publish update: `npm run update:publish "Message"`
- ✅ User nhận update tự động
- ✅ Click "Cập nhật" → App reload với code mới
- ✅ KHÔNG cần cài lại từ App Store

