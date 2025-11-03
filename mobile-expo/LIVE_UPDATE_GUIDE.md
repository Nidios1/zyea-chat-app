# 🔄 Hướng dẫn Live Update (OTA Updates)

## ✅ Giới thiệu

Với **Expo Updates (OTA Updates)**, bạn có thể:
- ✅ **Cập nhật JavaScript code** - Fix bug, thêm tính năng mới
- ✅ **Cập nhật Assets** - Hình ảnh, fonts, videos
- ❌ **KHÔNG thể cập nhật Native code** - Cần rebuild IPA

## 📋 Khi nào cần rebuild IPA vs Live Update?

### 🔄 Live Update (Không cần rebuild IPA)

**Có thể update:**
- ✅ JavaScript/TypeScript code
- ✅ React components
- ✅ Styles, themes
- ✅ Logic, API calls
- ✅ Images, fonts, videos
- ✅ Config files (JSON)

**Ví dụ:**
- Fix bug UI
- Thêm button, screen mới
- Thay đổi màu sắc, layout
- Fix logic đăng nhập
- Thay đổi API endpoints
- Cập nhật images

### 📱 Rebuild IPA (Cần build lại)

**Phải rebuild nếu:**
- ❌ Thêm Native modules mới (expo-camera, expo-file-system, etc.)
- ❌ Thay đổi `app.json` config (permissions, bundle ID, etc.)
- ❌ Thay đổi Native dependencies
- ❌ Update Expo SDK version chính
- ❌ Thay đổi iOS permissions

**Ví dụ:**
- Thêm camera feature (expo-camera)
- Thêm file system access
- Thay đổi bundle identifier
- Update Expo SDK 54 → 55

## 🚀 Cách sử dụng Live Update

### Bước 1: Publish Update

Sau khi fix bug hoặc thêm tính năng mới:

```bash
cd mobile-expo

# Publish update cho production
eas update --branch production --message "Fix: Login error"

# Hoặc cho preview/testing
eas update --branch preview --message "Add: New feature"
```

**Hoặc dùng npm script:**

```bash
npm run update:publish "Fix: Login error"
npm run update:publish:preview "Add: New feature"
```

### Bước 2: App tự động check và download

- App tự động check update khi mở (theo config `checkAutomatically: "ON_LOAD"`)
- Download update trong background
- Hiển thị thông báo khi có update mới
- User chọn "Cập nhật" → App reload với code mới

## 📝 Workflow đầy đủ

### Scenario 1: Fix bug (Chỉ cần Live Update)

```bash
# 1. Fix bug trong code
# (ví dụ: sửa file src/screens/LoginScreen.tsx)

# 2. Commit changes
git add .
git commit -m "Fix: Login error handling"

# 3. Publish update (KHÔNG cần build IPA)
cd mobile-expo
eas update --branch production --message "Fix: Login error"

# 4. App sẽ tự động update trong vài phút!
```

### Scenario 2: Thêm native feature (Phải rebuild IPA)

```bash
# 1. Thêm native module
npm install expo-camera

# 2. Sử dụng trong code
# (ví dụ: thêm camera screen)

# 3. Cập nhật app.json nếu cần
# (thêm permissions, etc.)

# 4. Commit và push (để build IPA mới)
git add .
git commit -m "Add: Camera feature"
git push

# 5. GitHub Actions sẽ build IPA mới
# 6. Tải IPA mới và cài lại qua eSign
```

## ⚙️ Cấu hình

### app.json

```json
{
  "expo": {
    "runtimeVersion": {
      "policy": "appVersion"  // Dùng version trong app.json
    },
    "updates": {
      "url": "https://u.expo.dev/YOUR_PROJECT_ID",
      "enabled": true,
      "checkAutomatically": "ON_LOAD",  // Check khi mở app
      "fallbackToCacheTimeout": 0
    }
  }
}
```

### eas.json

```json
{
  "update": {
    "production": {
      "channel": "production"
    },
    "preview": {
      "channel": "preview"
    }
  }
}
```

## 🔍 Kiểm tra Update Status

### Xem updates đã publish:

```bash
eas update:list
```

### Xem chi tiết update:

```bash
eas update:view UPDATE_ID
```

### Rollback update (nếu có lỗi):

```bash
eas update:rollback
```

## ⚠️ Lưu ý quan trọng

1. **Runtime Version**: 
   - Update chỉ áp dụng cho app có cùng `runtimeVersion`
   - Nếu thay đổi `version` trong `app.json` → Cần rebuild IPA mới

2. **Testing**:
   - Test updates trên preview branch trước
   - Sau đó publish lên production

3. **Rollback Plan**:
   - Luôn có plan rollback nếu update có bug
   - Có thể rollback bằng `eas update:rollback`

4. **Timing**:
   - Updates có thể mất vài phút để propagate
   - User cần mở app lại để nhận update

## 📊 So sánh

| Thay đổi | Live Update | Rebuild IPA |
|----------|-------------|-------------|
| Fix bug JS | ✅ | ❌ |
| Thêm component | ✅ | ❌ |
| Thay đổi UI | ✅ | ❌ |
| Thêm native module | ❌ | ✅ |
| Thay đổi permissions | ❌ | ✅ |
| Update Expo SDK | ❌ | ✅ |

## 🎯 Best Practices

1. **Development**: 
   - Fix bug → Test → Publish update → Verify
   
2. **Production**:
   - Fix bug → Test trên preview → Publish production → Monitor

3. **Versioning**:
   - Increment `version` trong `app.json` khi có thay đổi native
   - Không cần increment cho JS-only changes

## 🔗 Tài liệu tham khảo

- [Expo Updates Documentation](https://docs.expo.dev/versions/latest/sdk/updates/)
- [EAS Update CLI](https://docs.expo.dev/eas-update/introduction/)

