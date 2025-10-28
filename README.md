# Zyea+ Chat App

Ứng dụng nhắn tin Zyea+ - Clone của Zalo

## 📱 Platforms

- **Web**: React + PWA
- **iOS**: Capacitor (Native)
- **Android**: Capacitor (Native)
- **React Native**: Mobile app (70% complete)

## 🚀 Quick Start

### Start Server
```bash
npm run server
```

### Start Web Client
```bash
cd client
npm start
```

### Build iOS IPA (GitHub Actions)
```bash
git push origin main
# Workflow tự động build IPA
```

## 📊 Project Structure

```
zalo-clone/
├── client/          # React Web + Capacitor
├── server/          # Node.js backend
├── mobile/          # React Native app
└── .github/         # CI/CD workflows
```

## 🎯 Features

- Real-time messaging
- Video/audio calls
- NewsFeed
- Friends management
- Profile customization
- Dark/Light mode

## 📱 Build IPA

Xem [IOS_BUILD_README.md](./IOS_BUILD_README.md) để build IPA qua GitHub Actions.

## 📚 Documentation

- [FEATURE_MIGRATION_ANALYSIS.md](./FEATURE_MIGRATION_ANALYSIS.md)
- [PWA_VS_REACT_NATIVE.md](./PWA_VS_REACT_NATIVE.md)
- [REACT_NATIVE_MIGRATION_GUIDE.md](./REACT_NATIVE_MIGRATION_GUIDE.md)

## 🔧 Tech Stack

- Frontend: React, React Native
- Backend: Node.js, Express
- Database: MySQL
- Realtime: Socket.io
- Mobile: Capacitor, React Native

## 📄 License

MIT

