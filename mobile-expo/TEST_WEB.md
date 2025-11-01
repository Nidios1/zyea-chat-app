# Test App trên PC - Web Browser

## 🚀 Cách chạy

### Bước 1: Start Web Server
```bash
npm run web
```

### Bước 2: Mở Browser
Server sẽ tự động mở:
- http://localhost:8081
- hoặc check terminal để xem URL

### Bước 3: Test App
- App sẽ hiện trên Chrome/Edge/Firefox
- Có thể debug bằng F12 Developer Tools
- Hot reload khi code thay đổi

## ✅ Lợi ích test trên Web:

1. **Không cần device/iOS Simulator** - Chạy ngay trên PC
2. **Debug dễ hơn** - Dùng Chrome DevTools
3. **Nhanh hơn** - Không cần build native
4. **Test Responsive** - Resize browser window
5. **Console logs** - Xem lỗi ngay trong browser

## ⚠️ Lưu ý:

- Một số native features không hoạt động trên web:
  - Camera
  - Push Notifications
  - File System
  - Biometric Auth

- Nhưng vẫn test được:
  - UI/UX
  - Navigation
  - API calls
  - State management
  - Forms validation

## 🛠️ Troubleshooting:

### Nếu web không mở:
```bash
# Stop server (Ctrl+C)
npm install
npm run web
```

### Nếu lỗi Module not found:
```bash
npx expo install react-dom react-native-web
```


