# 🚀 Khi Nào Cần Build Lại IPA? Khi Nào Chỉ Cần Publish Update?

## ✅ Câu Trả Lời Ngắn Gọn

**KHÔNG CẦN build lại IPA** khi chỉ publish OTA update!

OTA update chỉ cập nhật **JavaScript bundle**, không cần rebuild native app.

---

## 📋 Chi Tiết

### ✅ Chỉ Cần Publish Update (KHÔNG cần build lại)

Khi bạn thay đổi:

- ✅ **JavaScript/TypeScript code** (logic, UI, components)
- ✅ **Styles/CSS** (màu sắc, layout, animations)
- ✅ **Assets** (ảnh, fonts - với giới hạn)
- ✅ **Configuration** (API URLs, constants)
- ✅ **Business logic** (functions, hooks, services)

**Cách làm:**
```powershell
# Chỉ cần publish update
npm run update:publish "Fix bug login"
```

**Kết quả:**
- ✅ Users nhận update **tự động** khi mở app
- ✅ **Không cần** cài lại app
- ✅ Update được apply ngay lập tức

---

### 🔧 CẦN Build Lại IPA (Production Build)

Khi bạn thay đổi:

- ❌ **Native code** (Objective-C, Swift, Java, Kotlin)
- ❌ **Native modules** (thêm/xóa native dependencies)
- ❌ **App version** (`app.json` → `version`)
- ❌ **Runtime version** (`app.json` → `runtimeVersion.policy`)
- ❌ **Permissions** (Camera, Location, Notifications, etc.)
- ❌ **App configuration** (bundle ID, app name, icon, splash)
- ❌ **EAS Build profile** (`eas.json` → channel, build configuration)

**Cách làm:**
```powershell
# Build lại IPA
npm run eas:build:production

# Sau đó cài lại app lên thiết bị
# (Tải IPA từ EAS Dashboard và cài đặt)
```

**Kết quả:**
- ✅ App mới được build với native code mới
- ✅ Users cần **cài lại app** từ App Store hoặc TestFlight
- ✅ Sau đó OTA updates sẽ hoạt động bình thường

---

## 🎯 Quy Trình Thông Thường

### Lần Đầu (Setup):

1. **Build production app:**
   ```powershell
   npm run eas:build:production
   ```

2. **Cài app lên thiết bị:**
   - Tải IPA từ EAS Dashboard
   - Cài đặt lên iPhone/iPad
   - Hoặc submit lên App Store/TestFlight

3. **Publish update đầu tiên (nếu cần):**
   ```powershell
   npm run update:publish "Initial release"
   ```

### Các Lần Sau (Chỉ Update Code):

1. **Sửa code JavaScript/TypeScript**

2. **Publish update:**
   ```powershell
   npm run update:publish "Fix bug XYZ"
   ```

3. **Users nhận update tự động:**
   - Mở app → App tự động check update
   - Có update mới → Hiển thị modal
   - Click "Cập nhật" → App reload với code mới
   - **KHÔNG CẦN** cài lại app!

---

## 📊 So Sánh

| Thay Đổi | Build Lại? | Publish Update? | Users Cần Làm Gì? |
|----------|------------|-----------------|-------------------|
| JavaScript code | ❌ KHÔNG | ✅ CÓ | Mở app (tự động update) |
| Styles/UI | ❌ KHÔNG | ✅ CÓ | Mở app (tự động update) |
| Assets (ảnh, fonts) | ❌ KHÔNG | ✅ CÓ | Mở app (tự động update) |
| API URLs/Config | ❌ KHÔNG | ✅ CÓ | Mở app (tự động update) |
| App version | ✅ CÓ | ❌ KHÔNG | Cài lại app từ App Store |
| Native modules | ✅ CÓ | ❌ KHÔNG | Cài lại app từ App Store |
| Permissions | ✅ CÓ | ❌ KHÔNG | Cài lại app từ App Store |
| Bundle ID | ✅ CÓ | ❌ KHÔNG | Cài lại app từ App Store |

---

## ⚠️ Lưu Ý Quan Trọng

### 1. Runtime Version

- **Runtime version** được set khi build app lần đầu
- OTA updates chỉ hoạt động với **cùng runtime version**
- Nếu thay đổi `version` trong `app.json`, cần build lại

### 2. Channel

- **Channel** (production, preview) được set khi build
- OTA updates chỉ publish vào **cùng channel** với build
- Ví dụ: Build với channel `production` → Publish vào `production`

### 3. Native Dependencies

- Thêm/xóa **native modules** (camera, location, etc.) → Cần build lại
- Chỉ sử dụng **JavaScript modules** → Chỉ cần publish update

### 4. App Store Review

- **OTA updates** KHÔNG cần review từ App Store
- **Build mới** (native changes) CẦN review từ App Store
- OTA updates là cách nhanh nhất để fix bugs mà không cần review!

---

## 🧪 Test OTA Update

### Bước 1: Đảm bảo app đã được build với EAS Build

```powershell
# Build production (nếu chưa build)
npm run eas:build:production
```

### Bước 2: Cài app lên thiết bị

- Tải IPA từ EAS Dashboard
- Cài đặt lên iPhone/iPad

### Bước 3: Publish update

```powershell
npm run update:publish "Test update"
```

### Bước 4: Test trên thiết bị

1. Mở app trên thiết bị
2. App tự động check update
3. Nếu có update → Hiển thị modal
4. Click "Cập nhật" → App reload với code mới
5. ✅ **KHÔNG CẦN** cài lại app!

---

## 💡 Best Practices

### 1. Development Workflow

```
Code changes → Publish update → Test on device
```

### 2. Release Workflow

```
Major changes (native) → Build → Submit to App Store
Minor changes (JS) → Publish update → Instant deployment
```

### 3. Version Management

- **App version** (`1.0.0`, `1.0.1`, etc.) → Cho App Store
- **OTA updates** → Không cần tăng version, chỉ cần message

### 4. Hotfix Strategy

- **Critical bug** → Publish OTA update ngay (không cần review)
- **Native bug** → Build mới → Submit to App Store (cần review)

---

## 🎯 Kết Luận

### ✅ Trường Hợp Của Bạn:

Bạn vừa publish OTA update thành công → **KHÔNG CẦN build lại IPA!**

Users sẽ nhận update tự động khi:
- Mở app lần tiếp theo
- App check update (tự động hoặc manual)
- Click "Cập nhật" trong modal

### 🚀 Next Steps:

1. **Test trên thiết bị:**
   - Mở app (đã được build với EAS Build trước đó)
   - App sẽ tự động check và hiển thị update

2. **Publish thêm updates:**
   ```powershell
   npm run update:publish "Fix bug XYZ"
   ```

3. **Chỉ build lại khi:**
   - Thay đổi native code
   - Thay đổi version
   - Thay đổi permissions
   - Thêm/xóa native modules

---

## 📚 Tài Liệu Tham Khảo

- [EAS Update Documentation](https://docs.expo.dev/eas-update/introduction/)
- [Runtime Versions](https://docs.expo.dev/eas-update/runtime-versions/)
- [Update Channels](https://docs.expo.dev/eas-update/updates-overview/#channels)

---

**Tóm lại: OTA update = Update code nhanh, KHÔNG cần build lại! 🎉**

