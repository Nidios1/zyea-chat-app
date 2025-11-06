# 📱 Hướng dẫn Test App trên Điện Thoại

## 🚀 Cách kết nối:

### Phương pháp 1: Expo Go (Khuyến nghị cho test nhanh)
1. **Cài đặt Expo Go** trên điện thoại:
   - iOS: [App Store](https://apps.apple.com/app/expo-go/id982107779)
   - Android: [Google Play](https://play.google.com/store/apps/details?id=host.exp.exponent)

2. **Kết nối cùng WiFi**:
   - Đảm bảo điện thoại và máy tính cùng mạng WiFi
   - Hoặc dùng tunnel mode (đã bật `--tunnel`)

3. **Quét QR Code**:
   - Mở Expo Go app
   - Chọn "Scan QR code"
   - Quét QR code hiển thị trong terminal

### Phương pháp 2: Development Build (Cho test OTA)
1. **Build development build**:
   ```bash
   npm run eas:build:development
   ```

2. **Cài đặt lên thiết bị**:
   - Tải file .ipa/.apk từ EAS
   - Cài đặt lên điện thoại

3. **Kết nối**:
   - Chạy: `npx expo start --dev-client`
   - Quét QR code trong Expo Go hoặc mở app development build

## ⚠️ Lưu ý về OTA Updates:

- **Expo Go**: OTA updates KHÔNG hoạt động
- **Development Build**: OTA updates hoạt động
- **Production Build**: OTA updates hoạt động đầy đủ

## 🧪 Test OTA Updates:

1. **Build production**:
   ```bash
   npm run eas:build:production
   ```

2. **Cài app lên thiết bị**

3. **Publish update**:
   ```bash
   npm run update:publish "Test update"
   ```

4. **Mở app trên thiết bị** - sẽ tự động check và hiển thị modal update

## 📋 Checklist Test:

- [ ] App chạy được trên điện thoại
- [ ] Không có lỗi crash
- [ ] UI hiển thị đúng
- [ ] Navigation hoạt động
- [ ] Settings screen hiển thị OTA section
- [ ] Nút "Kiểm tra cập nhật" hoạt động (trong Settings)
- [ ] Console log hiển thị: "OTA Updates Disabled in development mode" (nếu dùng Expo Go)

## 🔍 Debug:

Nếu gặp lỗi kết nối:
1. Kiểm tra firewall
2. Đảm bảo cùng WiFi
3. Thử dùng tunnel: `npx expo start --tunnel`
4. Kiểm tra IP address trong terminal

