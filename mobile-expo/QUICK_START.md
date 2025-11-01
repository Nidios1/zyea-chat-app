# 🚀 Hướng dẫn chạy React Native trên Mobile

## Bước 1: Cài đặt Expo Go

### iOS
- Tải từ App Store: https://apps.apple.com/app/expo-go/id982107779

### Android  
- Tải từ Play Store: https://play.google.com/store/apps/details?id=host.exp.exponent

## Bước 2: Chạy Expo

```bash
cd zalo-clone/mobile-expo
npm install
npx expo start
```

## Bước 3: Quét QR Code

1. Mở **Expo Go** trên điện thoại
2. Quét QR code hiển thị trong terminal
3. App sẽ tự động load trên điện thoại

## 📱 Yêu cầu hệ thống

- Node.js >= 18
- Expo Go app trên mobile
- Backend server đang chạy (port 5000)
- Điện thoại và máy tính cùng WiFi network

## ⚠️ Lưu ý

Nếu app không connect được đến server:
1. Kiểm tra IP của máy tính: `ipconfig` (Windows) hoặc `ifconfig` (Mac/Linux)
2. Update IP trong `src/config/constants.ts`
3. Restart server và expo

## 🔧 Fix lỗi thường gặp

### Lỗi: Module not found
```bash
npm install
npx expo start --clear
```

### Lỗi: Cannot connect to server
- Check firewall
- Đảm bảo backend đang chạy
- Update IP address trong constants.ts

### Metro bundler cache
```bash
npx expo start --clear
```

