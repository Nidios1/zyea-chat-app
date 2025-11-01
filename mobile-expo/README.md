# 📱 Zyea+ Mobile App - Expo

Dự án React Native đã được setup với Expo để test nhanh trên mobile!

## ✅ Đã hoàn thành

1. **Copy source code** từ `mobile/src/` sang `mobile-expo/src/`
2. **Cài đặt dependencies** cần thiết
3. **Fix Firebase dependencies** → dùng Expo Notifications
4. **Update image picker** → dùng expo-image-picker
5. **Update App.tsx** để sử dụng source code mới

## 🚀 Cách chạy

### Bước 1: Cài Expo Go trên điện thoại

- **iOS**: https://apps.apple.com/app/expo-go/id982107779
- **Android**: https://play.google.com/store/apps/details?id=host.exp.exponent

### Bước 2: Chạy Expo

```bash
cd zalo-clone/mobile-expo
npm install
npx expo start
```

### Bước 3: Quét QR Code

1. Mở **Expo Go** app
2. Quét QR code từ terminal
3. App sẽ tự động load!

## ⚠️ Lưu ý

### Backend Server

App cần backend đang chạy:
1. **Start server**: `cd zalo-clone/server && npm start`
2. **Update IP** trong `src/config/constants.ts` nếu cần
3. **Đảm bảo** điện thoại và máy tính cùng WiFi network

### IP Configuration

Kiểm tra IP của máy tính:
```bash
# Windows
ipconfig

# Mac/Linux
ifconfig
```

Update trong `src/config/constants.ts`:
```typescript
export const API_BASE_URL = 'http://YOUR_IP:5000/api';
export const SOCKET_URL = 'http://YOUR_IP:5000';
```

## 🐛 Fix lỗi thường gặp

### Metro bundler cache
```bash
npx expo start --clear
```

### Module not found
```bash
rm -rf node_modules
npm install
```

### Cannot connect to server
- Check firewall settings
- Đảm bảo IP address đúng
- Đảm bảo backend đang chạy
- Check cùng WiFi network

## 📋 Dependencies đã cài

- ✅ @react-navigation/native, stack, bottom-tabs
- ✅ react-native-paper (UI components)
- ✅ expo-image-picker
- ✅ expo-notifications
- ✅ @tanstack/react-query
- ✅ axios
- ✅ socket.io-client
- ✅ @react-native-async-storage/async-storage

## 🎯 Tính năng hiện có

- ✅ Authentication (Login/Register)
- ✅ Chat (Real-time messaging)
- ✅ News Feed
- ✅ Profile Management
- Правильный
- Friends Management

## 📦 Build IPA cho iOS

### ⚠️ QUAN TRỌNG

**KHÔNG THỂ** build IPA trên Windows! Bạn cần Mac hoặc máy ảo Mac.

### Hướng dẫn chi tiết:

- 📖 **[Hướng dẫn đầy đủ bằng Tiếng Việt](./IPA-GUIDE-VIETNAMESE.md)** ← Đọc file này!
- 📖 [Hướng dẫn build IPA](./BUILD-IPA.md)
- 📖 [Giải pháp build IPA](./BUILD-IPA-SOLUTION.md)

### Quick Start:

```bash
# Nếu bạn có Mac:
npx expo prebuild --platform ios
open ios/zyeamobile.xcworkspace
# Làm theo hướng dẫn trong Xcode

# Hoặc chạy script:
# Windows: .\build-ipa.bat
# Mac/Linux: chmod +x build-ipa.sh && ./build-ipa.sh
```

### Nếu không có Mac:

1. ✅ **Khuyến nghị**: Cài máy ảo Mac (miễn phí)
2. 💰 Thuê Mac cloud ($20-100)
3. 🛒 Mua Mac mini cũ (2-3 triệu)
4. 🤝 Nhờ ai đó build (50k-200k)

**Chi tiết**: Xem file `IPA-GUIDE-VIETNAMESE.md`

## 📝 TODO

- [ ] Setup Firebase cho push notifications (production)
- [ ] Test video call
- [ ] Optimize performance
- [ ] Add offline support

## 📦 Build và Deploy

### Build Scripts

```bash
# Build development/web
npm run build

# Build IPA unsigned (tự ký qua Esign)
npm run build:ipa:unsigned

# Setup Git remote
npm run setup:git

# Commit và push lên GitHub
npm run commit:push
```

**Chi tiết:** Xem [BUILD-GUIDE.md](./BUILD-GUIDE.md)

### GitHub Repository

- **URL**: https://github.com/Nidios1/zyea-chat-app.git
- **Setup**: Chạy `npm run setup:git` lần đầu
- **Hướng dẫn**: Xem [.github-setup.md](./.github-setup.md)

## 🔗 Links

- [Expo Documentation](https://docs.expo.dev)
- [React Native Paper](https://callstack.github.io/react-native-paper/)
- [React Navigation](https://reactnavigation.org/)
- [GitHub Repository](https://github.com/Nidios1/zyea-chat-app)

