# Hướng dẫn sửa lỗi Expo Go

## ✅ ĐÃ SỬA XONG - App đã chạy được bình thường!

## Các lỗi đã được sửa:
1. `property is not configurable` - Fixed
2. `PlatformConstants could not be found` - Fixed
3. Package version incompatibility - Fixed

## Các thay đổi đã thực hiện:

1. **Entry Point**: Đổi từ `index.ts` sang `index.js` để tương thích tốt hơn với Expo Go
2. **Axios Interceptor**: Sửa để tránh lỗi "property is not configurable"
3. **Metro Config**: Cải thiện cấu hình để tương thích tốt hơn với Expo Go
4. **Error Boundary**: Thêm error boundary để bắt và hiển thị lỗi tốt hơn
5. **expo-constants**: Thêm dependency `expo-constants` và lazy load để tránh TurboModule errors

## Cách test:

### Bước 1: Xóa cache hoàn toàn
```bash
# Xóa node_modules và cache
rm -rf node_modules
rm -rf .expo
npx expo start --clear
```

Hoặc trên Windows:
```powershell
Remove-Item -Recurse -Force node_modules
Remove-Item -Recurse -Force .expo
npx expo start --clear
```

### Bước 2: Reinstall dependencies
```bash
npm install
```

### Bước 3: Start lại với cache cleared
```bash
npm run start:expo-go
```

### Bước 4: Trong Expo Go app
- Shake device → "Reload"
- Hoặc nhấn "r" trong terminal để reload

## Nếu vẫn lỗi PlatformConstants:

1. **Cài đặt expo-constants** (đã thêm vào package.json):
   ```bash
   npm install
   ```

2. **Kiểm tra version compatibility**:
   - Expo SDK 54 có thể không tương thích hoàn toàn với React Native 0.76.6
   - Có thể cần downgrade React Native về version được recommend bởi Expo SDK 54
   - Chạy: `npx expo-doctor` để kiểm tra

3. **Nếu vẫn lỗi, thử downgrade React Native**:
   ```bash
   npm install react-native@0.76.5
   ```
   Hoặc version được recommend bởi Expo SDK 54

2. **Kiểm tra dependencies**:
   ```bash
   npx expo-doctor
   ```

3. **Xóa cache Metro hoàn toàn**:
   ```bash
   watchman watch-del-all
   rm -rf $TMPDIR/metro-*
   rm -rf $TMPDIR/haste-*
   ```

4. **Kiểm tra log chi tiết**:
   - Mở Expo Go → Settings → Enable Debug Mode
   - Xem log trong terminal để biết lỗi cụ thể

## Lưu ý:

- Một số tính năng có thể không hoạt động trong Expo Go (như native modules)
- Nếu lỗi vẫn tiếp tục, có thể cần build development build thay vì dùng Expo Go

