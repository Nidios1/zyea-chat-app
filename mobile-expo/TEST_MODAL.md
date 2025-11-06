# 🧪 Cách Test UpdateModal Hiển Thị

## ❓ Tại sao Modal không tự động hiển thị?

### 1. **Trong Expo Go (Development Mode)**
- ❌ OTA Updates **KHÔNG hoạt động** trong Expo Go
- ❌ Modal sẽ **KHÔNG tự động hiển thị** vì không có update thực sự
- ✅ Đây là hành vi **BÌNH THƯỜNG** của Expo

### 2. **Trong Production Build**
- ✅ Modal sẽ **TỰ ĐỘNG hiển thị** khi:
  - Có update mới được publish lên server
  - App check và tìm thấy update
  - Update đã được download xong

---

## 🧪 Cách Test Modal UI (Trong Expo Go)

### Cách 1: Dùng Button Test trong Settings
1. Mở app trong Expo Go
2. Vào **Settings** (từ Profile menu)
3. Scroll xuống section **"Ứng dụng"**
4. Click button **"🧪 Test Update Modal UI"**
5. Modal sẽ hiển thị ngay!

### Cách 2: Thêm vào màn hình khác
Thêm code này vào bất kỳ màn hình nào:

```tsx
import { useState } from 'react';
import { Button } from 'react-native-paper';
import { UpdateModal } from '../components/Common/UpdateModal';

const [showModal, setShowModal] = useState(false);

<Button onPress={() => setShowModal(true)}>Test Modal</Button>

<UpdateModal
  visible={showModal}
  onUpdate={() => setShowModal(false)}
  title="Ứng dụng đã có phiên bản mới"
  message="Bạn vui lòng cập nhật Ứng dụng lên phiên bản mới nhất..."
  updateButtonText="Cập nhật"
/>
```

---

## 🎯 Cách Test Modal Thực Tế (Production)

### Bước 1: Build Production App
```bash
npm run eas:build:production
```

### Bước 2: Cài app lên thiết bị
- Tải file .ipa/.apk từ EAS
- Cài đặt lên điện thoại

### Bước 3: Publish Update
```bash
npm run update:publish "Test update v1"
```

### Bước 4: Mở app trên thiết bị
- App sẽ tự động check update
- Nếu có update mới → Modal sẽ **TỰ ĐỘNG hiển thị**
- Click "Cập nhật" → App reload với version mới

---

## 🔍 Debug: Kiểm tra tại sao không hiển thị

### 1. Kiểm tra Console Logs
Trong terminal Expo, tìm:
```
[OTA Updates] Disabled in development mode
```
→ Nếu thấy log này = Đang ở dev mode, modal không tự động hiển thị

### 2. Kiểm tra trong Settings
- Vào Settings > Ứng dụng
- Xem có thông báo "OTA Updates không khả dụng trong chế độ development"
- Nếu có → Đang ở dev mode

### 3. Kiểm tra Update Status
- Vào Settings > Ứng dụng
- Click "Kiểm tra cập nhật"
- Xem có update không

---

## ✅ Checklist

### Test UI Modal (Expo Go):
- [ ] Mở app trong Expo Go
- [ ] Vào Settings
- [ ] Click "Test Update Modal UI"
- [ ] Modal hiển thị đúng design
- [ ] Icon megaphone đẹp
- [ ] Button gradient đúng màu

### Test Thực Tế (Production):
- [ ] Build production app
- [ ] Cài lên thiết bị
- [ ] Publish update
- [ ] Mở app → Modal tự động hiển thị
- [ ] Click "Cập nhật" → App reload thành công

---

## 💡 Lưu Ý Quan Trọng

1. **Expo Go**: Chỉ test được UI, không test được OTA thực tế
2. **Production Build**: Cần để test OTA thực sự
3. **Modal tự động hiển thị**: Chỉ khi có update thực sự từ server
4. **Button test**: Để test UI nhanh trong dev mode

---

## 🚀 Quick Test Ngay Bây Giờ

1. Mở app trong Expo Go
2. Vào **Settings**
3. Click **"🧪 Test Update Modal UI"**
4. Xem modal hiển thị!

