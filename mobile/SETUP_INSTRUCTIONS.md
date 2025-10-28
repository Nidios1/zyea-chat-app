# Hướng Dẫn Setup React Native Project

## 📋 Checklist Setup

### Bước 1: Cài đặt Dependencies (QUAN TRỌNG!)

```bash
# Vào thư mục mobile
cd zalo-clone/mobile

# Install dependencies
npm install

# Nếu gặp lỗi peer dependencies, chạy:
npm install --legacy-peer-deps
```

### Bước 2: iOS Setup (Chỉ cho iOS)

```bash
cd ios
pod install
cd ..
```

### Bước 3: Android Setup

- Đảm bảo đã cài Android Studio
- Đã setup Android SDK
- Đã chạy Android emulator hoặc connect device

### Bước 4: Run Project

```bash
# Start Metro bundler
npm start

# Run trên Android
npm run android

# Run trên iOS
npm run ios
```

## ⚠️ Các Lỗi Thường Gặp

### 1. Metro Bundler lỗi
```bash
npm start -- --reset-cache
```

### 2. iOS Pods lỗi
```bash
cd ios
rm -rf Pods Podfile.lock
pod install
cd ..
```

### 3. Android Build lỗi
```bash
cd android
./gradlew clean
cd ..
npm run android
```

### 4. Dependencies conflicts
```bash
rm -rf node_modules package-lock.json
npm install --legacy-peer-deps
```

## 📝 Cần Update

### IP Address của Server

Sửa file `src/config/constants.ts`:

```typescript
export const API_BASE_URL = 'http://192.168.0.102:5000/api'; // ← Đổi IP này
```

### Asset Files

Tạo folder `assets/` và thêm logo:
- `assets/logo.png` (120x120px)

Hoặc tạm thời comment out Image trong SplashScreen.

## 🔧 Development Tips

### Hot Reload
- Shake device → "Reload"
- Hoặc press `R` trong Metro bundler
- Hoặc `Cmd+R` (iOS) / `R+R` (Android)

### Debug
- Shake device → "Debug"
- Open Chrome DevTools tại `http://localhost:8081/debugger-ui`

### Clear Cache
```bash
npm start -- --reset-cache
```

## 📊 Project Status

✅ Project structure  
✅ Dependencies config  
✅ Navigation setup  
✅ Theme system  
✅ Auth screens (basic)  
✅ Main screens (placeholder)  

⏳ TODO:
- API integration
- Socket.io setup
- Chat UI
- Image upload
- Push notifications

## 🚀 Next Steps

1. Test login screen
2. Integrate API
3. Setup Socket.io
4. Build Chat UI
5. Add other features

## 📞 Support

Nếu gặp lỗi:
1. Check error message trong terminal
2. Check Metro bundler output
3. Check device logs: `adb logcat` (Android)
4. Check Xcode console (iOS)

