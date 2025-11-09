# 📱 App Version 1.0.4 - Release Notes

## 🎯 Version: 1.0.4

**Ngày cập nhật:** $(Get-Date -Format "yyyy-MM-dd HH:mm")

---

## ✨ Các Thay Đổi Mới

### 🔧 Sửa Lỗi

1. **Sửa lỗi duplicate data khi refresh:**
   - ✅ Sửa lỗi trùng lặp ảnh và số lượng bài viết khi refresh trong ProfileInformationScreen
   - ✅ Thêm logic loại bỏ duplicate posts và media files
   - ✅ Thêm RefreshControl để hỗ trợ pull-to-refresh

2. **Sửa lỗi OtherUserProfileScreen:**
   - ✅ Thêm hàm `checkFriendshipStatus` vào friendsAPI
   - ✅ Sửa lỗi duplicate posts khi refresh
   - ✅ Thêm logic loại bỏ duplicate khi load posts

### 🎨 Cải Thiện UI/UX

1. **Trang cá nhân người dùng khác (OtherUserProfileScreen):**
   - ✅ Thêm hiển thị ảnh bìa (cover image)
   - ✅ Điều chỉnh vị trí avatar để nằm một nửa trên ảnh bìa
   - ✅ Tăng kích thước avatar từ 100x100 lên 120x120
   - ✅ Đẩy phần tên lên gần avatar hơn (marginTop: 4)
   - ✅ Thêm chức năng click vào avatar để xem full screen
   - ✅ Thêm chức năng click vào ảnh bìa để xem full screen

2. **Tối ưu hiển thị:**
   - ✅ Cải thiện layout khi có cover image
   - ✅ Điều chỉnh stats container để không bị che bởi avatar lớn hơn

---

## 📦 Build Information

### Cần Build Lại IPA?

**CÓ** - Vì version đã thay đổi từ 1.0.3 → 1.0.4

### Các Bước Build:

1. **Build IPA mới:**
   ```bash
   cd zalo-clone/mobile-expo
   npm run eas:build:production
   # hoặc
   eas build --platform ios --profile production
   ```

2. **Publish OTA Update (sau khi build xong):**
   ```bash
   npm run update:publish
   # hoặc
   node publish-update.js production "Version 1.0.4 - Fix duplicate data and improve profile UI"
   ```

---

## 🔄 OTA Update

### Runtime Version:
- **1.0.4** (theo policy: appVersion)

### Channel:
- **production** (cho production build)
- **preview** (cho preview/adhoc build)

### Lưu ý:
- App version 1.0.4 sẽ nhận OTA updates cho runtime version 1.0.4
- App version cũ (1.0.2, 1.0.3) sẽ KHÔNG nhận OTA updates cho 1.0.4
- Cần build lại IPA với version 1.0.4 để app có thể nhận OTA updates mới

---

## 📝 Checklist Trước Khi Build

- [x] Đã cập nhật version trong `app.json` → 1.0.4
- [ ] Đã test các chức năng mới trên dev
- [ ] Đã kiểm tra không có lỗi lint
- [ ] Đã commit code changes
- [ ] Sẵn sàng build production

---

## 🚀 Sau Khi Build

1. **Test IPA mới** trên thiết bị
2. **Publish OTA update** nếu cần
3. **Cập nhật changelog** nếu có thay đổi thêm

