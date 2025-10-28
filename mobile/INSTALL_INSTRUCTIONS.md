# 🚀 Installation Instructions

## 📋 Cài Đặt Dependencies

### 1. Navigate to mobile folder
```bash
cd zalo-clone/mobile
```

### 2. Install dependencies
```bash
npm install
```

### 3. Install iOS pods (nếu chạy trên iOS)
```bash
cd ios
pod install
cd ..
```

### 4. Start Metro bundler
```bash
npm start
```

### 5. Run on device
```bash
# Android
npm run android

# iOS  
npm run ios
```

## 📱 Running the App

### Development
```bash
npm start
```

### Production Build
```bash
# Android
cd android
./gradlew assembleRelease

# iOS
# Use Xcode
```

## 🔧 Troubleshooting

### Clear cache
```bash
npm start -- --reset-cache
```

### Clean builds
```bash
# Android
cd android
./gradlew clean
cd ..

# iOS
cd ios
rm -rf Pods
rm -rf build
pod install
cd ..
```

## ✅ Dependencies Installed

- react-native-linear-gradient ✅
- react-native-vector-icons ✅
- All PWA theme components ✅
- Complete navigation setup ✅

## 🎉 Ready to Run!

App is now **~90% complete** and ready for testing!

