# Hướng Dẫn Rebuild App Sau Khi Cài Đặt WebRTC

## Đã Hoàn Thành ✅

1. ✅ Cài đặt `react-native-webrtc`
2. ✅ Cài đặt `expo-dev-client`
3. ✅ Cập nhật code để sử dụng WebRTC
4. ✅ Thêm permissions cho microphone và camera

## Bước Tiếp Theo: Rebuild App

Vì `react-native-webrtc` là native module, bạn cần rebuild app. Có 2 cách:

### Cách 1: Build với EAS Build (Khuyên dùng)

```bash
# Build development version
eas build --profile development --platform ios

# Hoặc build preview/production
eas build --profile preview --platform ios
eas build --profile production --platform ios
```

### Cách 2: Build Local với Expo (Nếu có Xcode)

Nếu bạn muốn test local trên simulator hoặc device:

1. **Prebuild (tạo native folders):**
```bash
npx expo prebuild --platform ios
```

2. **Cài đặt iOS dependencies:**
```bash
cd ios
pod install
cd ..
```

3. **Chạy trên iOS:**
```bash
npx expo run:ios
```

## Lưu Ý

- Sau khi rebuild, app sẽ có thể sử dụng WebRTC
- Đảm bảo bạn đã cấp quyền microphone và camera khi app yêu cầu
- WebRTC cần kết nối mạng ổn định để hoạt động tốt

## Kiểm Tra

Sau khi rebuild và cài đặt app:

1. Mở app và đăng nhập
2. Vào một cuộc trò chuyện
3. Nhấn nút gọi điện hoặc video
4. App sẽ yêu cầu quyền microphone/camera
5. Cấp quyền và test cuộc gọi

## Troubleshooting

Nếu gặp lỗi:

1. **Lỗi "react-native-webrtc not found":**
   - Đảm bảo đã rebuild app sau khi cài đặt
   - Kiểm tra `node_modules` có `react-native-webrtc` không

2. **Lỗi permission:**
   - Vào Settings > Privacy > Microphone/Camera
   - Bật quyền cho app

3. **Video không hiển thị:**
   - Kiểm tra kết nối mạng
   - Đảm bảo cả 2 bên đều đã rebuild app
   - Kiểm tra console logs để xem lỗi

## Next Steps

Sau khi rebuild thành công, bạn có thể:
- Test cuộc gọi audio
- Test cuộc gọi video
- Test chuyển camera
- Test mute/unmute
- Test incoming calls

