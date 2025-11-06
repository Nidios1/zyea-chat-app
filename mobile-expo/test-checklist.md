# ✅ Checklist Test OTA Updates trên Expo Go

## 🧪 Test 1: App Khởi Động
- [ ] App mở được không có lỗi
- [ ] Splash screen hiển thị
- [ ] App load vào màn hình chính
- [ ] Không có crash hoặc error

## 🧪 Test 2: Navigation & UI
- [ ] Navigation hoạt động bình thường
- [ ] Có thể điều hướng giữa các màn hình
- [ ] UI hiển thị đúng
- [ ] Toast messages hoạt động

## 🧪 Test 3: Settings Screen - OTA Section
- [ ] Vào Settings (từ Profile menu)
- [ ] Tìm section "Ứng dụng"
- [ ] Kiểm tra hiển thị:
  - [ ] Phiên bản: 1.0.1
  - [ ] Section "Cập nhật tự động" hiển thị
  - [ ] Thông báo: "OTA Updates không khả dụng trong chế độ development" (vì đang dùng Expo Go)
  - [ ] Hoặc nếu có Update ID thì hiển thị

## 🧪 Test 4: Console Logs
Kiểm tra console trong terminal Expo:
- [ ] Có log: `[OTA Updates] Disabled in development mode or not enabled`
- [ ] Không có error liên quan đến `expo-updates`
- [ ] Không có error về `useUpdates` hook

## 🧪 Test 5: Code Integration
- [ ] Hook `useUpdates` được gọi (check console)
- [ ] Component `UpdateModal` được import và render
- [ ] Không có lỗi TypeScript/runtime

## ⚠️ Lưu Ý:
- **Expo Go**: OTA updates KHÔNG hoạt động (đây là hành vi bình thường)
- **Modal Update**: Sẽ KHÔNG hiển thị trong Expo Go
- **Check Update Button**: Có thể không hoạt động trong Expo Go

## 🎯 Để Test OTA Thực Tế:
1. Build development build: `npm run eas:build:development`
2. Hoặc build production: `npm run eas:build:production`
3. Cài app lên thiết bị
4. Publish update: `npm run update:publish "Test"`
5. Mở app - sẽ thấy modal update

