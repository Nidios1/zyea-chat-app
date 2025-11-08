# Fix Lỗi OTA Update: "channel-name": Required

## Vấn Đề

Khi kiểm tra cập nhật OTA, app báo lỗi:
```
HTTP response error 400: "channel-name": Required. 
The headers "expo-runtime-version", "expo-channel-name", and "expo-platform" are required.
```

## Nguyên Nhân

Lỗi này xảy ra vì:

1. **App chưa được build với EAS Build**: App đang chạy trong development mode (Expo Go) hoặc build thủ công, không có channel và runtimeVersion được cấu hình.

2. **Thiếu Channel**: EAS Update yêu cầu channel để phân biệt các bản build (preview, production, etc.)

3. **Thiếu Runtime Version**: EAS Update cần runtimeVersion để đảm bảo compatibility

## Giải Pháp

### Bước 1: Kiểm Tra Cấu Hình

1. **Kiểm tra `app.json`:**
```json
{
  "expo": {
    "runtimeVersion": {
      "policy": "appVersion"
    },
    "updates": {
      "url": "https://u.expo.dev/your-project-id",
      "enabled": true
    }
  }
}
```

2. **Kiểm tra `eas.json`:**
```json
{
  "build": {
    "preview": {
      "ios": {
        "channel": "preview"
      }
    },
    "production": {
      "ios": {
        "channel": "production"
      }
    }
  }
}
```

### Bước 2: Build App Với EAS Build

**Quan trọng:** App cần được build với EAS Build để có channel và runtimeVersion:

```bash
# Build preview
eas build --profile preview --platform ios

# Hoặc build production
eas build --profile production --platform ios
```

### Bước 3: Kiểm Tra Sau Khi Build

Sau khi build, kiểm tra trong app:
1. Mở app trên thiết bị
2. Vào Settings > Thông tin ứng dụng
3. Kiểm tra:
   - **Channel**: Hiển thị "preview" hoặc "production"
   - **Runtime Version**: Hiển thị version (ví dụ: "1.0.2")
   - **Update ID**: Hiển thị ID của update hiện tại

### Bước 4: Publish Update

Sau khi build, publish update:

```bash
# Publish update cho preview channel
eas update --branch preview --message "Update message"

# Hoặc publish cho production channel
eas update --branch production --message "Update message"
```

## Lưu Ý

### Development Mode (Expo Go)

- **OTA Updates KHÔNG hoạt động** trong Expo Go
- Đây là hành vi bình thường
- Cần build development build hoặc production build để test OTA

### Development Build

- OTA Updates **hoạt động** trong development build
- Cần build với: `eas build --profile development --platform ios`
- Channel sẽ được set tự động dựa trên profile

### Production Build

- OTA Updates **hoạt động đầy đủ** trong production build
- Channel được set từ `eas.json` (production, preview, etc.)
- Runtime version được set từ `app.json`

## Troubleshooting

### Lỗi 1: "Channel chưa được cấu hình"

**Nguyên nhân:** App chưa được build với EAS Build

**Giải pháp:**
1. Build app với EAS Build:
   ```bash
   eas build --profile preview --platform ios
   ```
2. Cài đặt app lên thiết bị
3. Kiểm tra lại

### Lỗi 2: "Runtime version chưa được cấu hình"

**Nguyên nhân:** `app.json` thiếu `runtimeVersion`

**Giải pháp:**
1. Thêm vào `app.json`:
   ```json
   {
     "expo": {
       "runtimeVersion": {
         "policy": "appVersion"
       }
     }
   }
   ```
2. Build lại app

### Lỗi 3: "Lỗi cấu hình update server"

**Nguyên nhân:** Update URL không đúng hoặc project ID sai

**Giải pháp:**
1. Kiểm tra `app.json`:
   ```json
   {
     "expo": {
       "updates": {
         "url": "https://u.expo.dev/your-project-id"
       },
       "extra": {
         "eas": {
           "projectId": "your-project-id"
         }
       }
     }
   }
   ```
2. Đảm bảo project ID đúng
3. Build lại app

### Lỗi 4: "Lỗi xác thực (401/403)"

**Nguyên nhân:** EAS credentials không đúng

**Giải pháp:**
1. Login lại EAS:
   ```bash
   eas login
   ```
2. Kiểm tra project:
   ```bash
   eas project:info
   ```
3. Build lại app

## Kiểm Tra Trong App

### Trong Development Mode (Expo Go)

- App sẽ hiển thị: "OTA Updates không khả dụng trong chế độ development"
- Đây là hành vi bình thường

### Trong Production Build

- App sẽ hiển thị:
  - Channel: "preview" hoặc "production"
  - Runtime Version: "1.0.2" (hoặc version hiện tại)
  - Update ID: ID của update hiện tại
- Có thể kiểm tra cập nhật bằng nút "Kiểm tra cập nhật"

## Quick Fix Checklist

- [ ] `app.json` có `runtimeVersion` policy
- [ ] `eas.json` có channel configuration
- [ ] App đã được build với EAS Build (không phải Expo Go)
- [ ] App đã được cài đặt lên thiết bị từ build
- [ ] EAS project ID đúng trong `app.json`
- [ ] Đã login EAS: `eas login`
- [ ] Đã publish update: `eas update --branch <channel>`

## Test OTA Updates

1. **Build app:**
   ```bash
   eas build --profile preview --platform ios
   ```

2. **Cài app lên thiết bị**

3. **Publish update:**
   ```bash
   eas update --branch preview --message "Test update"
   ```

4. **Kiểm tra trong app:**
   - Mở app
   - Vào Settings > Thông tin ứng dụng
   - Nhấn "Kiểm tra cập nhật"
   - App sẽ tìm thấy update và hiển thị modal

5. **Apply update:**
   - Nhấn "Cập nhật ngay"
   - App sẽ reload và apply update

## Kết Luận

Lỗi "channel-name": Required xảy ra vì app chưa được build với EAS Build. 

**Giải pháp:**
1. Build app với EAS Build
2. Cài app lên thiết bị
3. Publish update
4. Test trong app

Sau khi build với EAS Build, channel và runtimeVersion sẽ được tự động set, và OTA Updates sẽ hoạt động bình thường.

