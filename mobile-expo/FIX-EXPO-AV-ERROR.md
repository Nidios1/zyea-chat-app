# Hướng dẫn sửa lỗi expo-av

## Lỗi: Unable to resolve module expo-av

### Đã thực hiện:
✅ Đã cài đặt `expo-av@15.0.2` vào package.json
✅ Đã chạy `npm install`

### Các bước khắc phục:

1. **Xóa cache và restart Metro:**
   ```bash
   npx expo start --clear
   ```

2. **Nếu vẫn lỗi, xóa node_modules và cài lại:**
   ```bash
   rm -rf node_modules
   npm install
   npx expo start --clear
   ```

3. **Nếu đang chạy trên iOS, cần cài lại pods:**
   ```bash
   cd ios
   pod install
   cd ..
   ```

4. **Reload app:**
   - Trong terminal: Nhấn `r` để reload
   - Trên device: Shake device → Reload
   - Hoặc đóng và mở lại app

5. **Nếu vẫn không được, thử restart Expo development server:**
   ```bash
   # Dừng server (Ctrl+C)
   npx expo start --clear --reset-cache
   ```

## Kiểm tra:

✅ Kiểm tra `package.json` có `expo-av`:
```json
"expo-av": "~15.0.1"
```

✅ Kiểm tra import trong VideoFeedScreen.tsx:
```typescript
import { Video, ResizeMode } from 'expo-av';
```

✅ Kiểm tra đã cài đặt:
```bash
npm list expo-av
```

## Lưu ý:
- Đảm bảo phiên bản Expo SDK tương thích với expo-av
- Expo SDK 54 tương thích với expo-av ~15.0.1

