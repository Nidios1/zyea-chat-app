# 📱 Hướng dẫn Test App trên Điện Thoại

## 🚀 Cách 1: Test với Expo Go (Nhanh nhất)

### Bước 1: Cài đặt Expo Go
- **iOS**: Tải từ [App Store](https://apps.apple.com/app/expo-go/id982107779)
- **Android**: Tải từ [Google Play](https://play.google.com/store/apps/details?id=host.exp.exponent)

### Bước 2: Khởi động Expo Server
```bash
cd zalo-clone/mobile-expo
npm start
```

Hoặc với tunnel (nếu không cùng WiFi):
```bash
npx expo start --tunnel
```

### Bước 3: Kết nối điện thoại
1. **Đảm bảo cùng WiFi**: Điện thoại và máy tính phải cùng mạng WiFi
2. **Quét QR Code**: 
   - Mở Expo Go app
   - Chọn "Scan QR code"
   - Quét QR code hiển thị trong terminal
3. **Hoặc nhập URL**: `exp://[IP_ADDRESS]:8081`

### ⚠️ Lưu ý:
- **OTA Updates KHÔNG hoạt động** trong Expo Go (đây là hành vi bình thường)
- App sẽ chạy và hiển thị UI bình thường
- Console sẽ log: `[OTA Updates] Disabled in development mode`

---

## 🧪 Cách 2: Test UpdateModal UI (Trong Expo Go)

Để test UI của UpdateModal ngay trong Expo Go, thêm vào màn hình test:

### Tạo màn hình test tạm thời:

1. **Thêm vào Settings Screen** (hoặc màn hình nào đó):

```tsx
// Trong src/screens/Settings/SettingsScreen.tsx
import { useState } from 'react';
import { Button } from 'react-native-paper';
import { UpdateModal } from '../../components/Common/UpdateModal';

// Thêm vào component:
const [showTestModal, setShowTestModal] = useState(false);

// Thêm button test:
<Button onPress={() => setShowTestModal(true)}>
  Test Update Modal
</Button>

// Thêm modal:
<UpdateModal
  visible={showTestModal}
  onUpdate={() => setShowTestModal(false)}
  title="Ứng dụng đã có phiên bản mới"
  message="Bạn vui lòng cập nhật Ứng dụng lên phiên bản mới nhất. Nếu không cập nhật, Bạn sẽ không chạy được phiên bản hiện tại trên điện thoại"
  updateButtonText="Cập nhật"
/>
```

2. **Hoặc tạo màn hình test riêng** và thêm vào navigation

---

## 🎯 Cách 3: Test OTA Updates Thực Tế (Production Build)

### Bước 1: Build Production App
```bash
npm run eas:build:production
```

Hoặc development build:
```bash
npm run eas:build:development
```

### Bước 2: Cài đặt lên thiết bị
- Tải file .ipa (iOS) hoặc .apk (Android) từ EAS
- Cài đặt lên điện thoại

### Bước 3: Publish Update
```bash
# Publish lên production
npm run update:publish "Test update message"

# Hoặc preview
npm run update:publish:preview "Test preview"
```

### Bước 4: Test trên thiết bị
1. Mở app trên điện thoại
2. App sẽ tự động check update
3. Nếu có update mới, modal sẽ hiển thị
4. Click "Cập nhật" để apply update

---

## 🔍 Debug & Troubleshooting

### Nếu không kết nối được:

1. **Kiểm tra WiFi**:
   ```bash
   # Xem IP address
   ipconfig  # Windows
   ifconfig  # Mac/Linux
   ```

2. **Kiểm tra Firewall**:
   - Cho phép Node.js qua firewall
   - Port 8081 phải mở

3. **Dùng Tunnel Mode**:
   ```bash
   npx expo start --tunnel
   ```

4. **Restart Expo**:
   - Nhấn `Ctrl+C` để dừng
   - Chạy lại: `npm start`

### Kiểm tra logs:
- Xem console trong terminal Expo
- Kiểm tra logs trên điện thoại (shake device > Show Dev Menu > Debug)

---

## ✅ Checklist Test

### Test cơ bản (Expo Go):
- [ ] App mở được
- [ ] UI hiển thị đúng
- [ ] Navigation hoạt động
- [ ] Settings screen có OTA section
- [ ] Console log: "OTA Updates Disabled in development mode"

### Test UpdateModal UI:
- [ ] Modal hiển thị đúng design
- [ ] Icon megaphone đẹp
- [ ] Sound waves hiển thị
- [ ] Button gradient đúng màu
- [ ] Text căn trái đúng

### Test OTA thực tế (Production):
- [ ] Build app thành công
- [ ] Cài được lên thiết bị
- [ ] Publish update thành công
- [ ] Modal tự động hiển thị khi có update
- [ ] Click "Cập nhật" reload app thành công

---

## 📝 Quick Commands

```bash
# Start Expo
npm start

# Start với tunnel
npx expo start --tunnel

# Build production
npm run eas:build:production

# Publish update
npm run update:publish "Your message"

# Xem danh sách updates
npm run update:check

# Xem thông tin kết nối
node show-connection-info.js
```

---

## 🎨 Test UpdateModal ngay bây giờ:

1. Mở app trong Expo Go
2. Vào Settings
3. Tìm button "Test Update Modal" (nếu đã thêm)
4. Click để xem modal

Hoặc thêm code test vào Settings screen để test ngay!

