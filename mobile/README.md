# Zyea+ React Native App

## 📱 React Native Migration

Ứng dụng nhắn tin Zyea+ được chuyển đổi sang React Native để có performance tốt hơn và native features đầy đủ.

## 🚀 Getting Started

### Prerequisites
- Node.js >= 16
- React Native CLI
- Android Studio (for Android)
- Xcode (for iOS)

### Installation

```bash
cd mobile
npm install
cd ios && pod install && cd .. (for iOS)
```

### Running

```bash
# Start Metro bundler
npm start

# Run on Android
npm run android

# Run on iOS
npm run ios
```

## 📁 Project Structure

```
mobile/
├── src/
│   ├── components/      # Reusable components
│   ├── contexts/        # React contexts
│   ├── navigation/      # Navigation setup
│   ├── screens/         # Screen components
│   ├── hooks/           # Custom hooks
│   ├── utils/           # Utility functions
│   ├── config/          # Configuration files
│   └── App.tsx          # Root component
├── android/             # Android native code
├── ios/                 # iOS native code
└── package.json
```

## ✨ Features

- ✅ Authentication (Login, Register, Biometric)
- ✅ Real-time Chat (Socket.io)
- ✅ Video/Audio Calls (WebRTC)
- ✅ NewsFeed (Posts, Comments, Reactions)
- ✅ Friends Management
- ✅ Push Notifications (FCM)
- ✅ Offline Support (AsyncStorage)
- ✅ Dark/Light Mode

## 📚 Tech Stack

- **Framework**: React Native 0.72
- **Navigation**: React Navigation 6
- **State Management**: Zustand
- **UI Library**: React Native Paper
- **HTTP Client**: Axios
- **Realtime**: Socket.io
- **Video Calls**: WebRTC
- **Caching**: React Query
- **Storage**: AsyncStorage, Keychain
- **Notifications**: Firebase Cloud Messaging

## 🔄 Migration Status

✅ Setup & Configuration  
🔄 Authentication  
⏳ Chat Features  
⏳ Video Calls  
⏳ NewsFeed  
⏳ Friends  
⏳ Notifications  

## 📝 Notes

This is an ongoing migration from React Web to React Native. Most business logic remains the same, only UI layer is rewritten.

