# 📦 Hướng dẫn Build IPA cho iOS

## ⚠️ Lưu ý quan trọng

Để tạo file IPA cho iOS, bạn **KHÔNG THỂ** build trên Windows. Bạn cần:
1. **Máy Mac** với Xcode cài đặt
2. HOẶC sử dụng **EAS Build** (dịch vụ cloud của Expo)

## 🎯 Mục tiêu

Bạn muốn tạo file **IPA unsigned** (không ký) để sau đó tự ký bằng **esign** hoặc công cụ khác.

---

## 📋 Phương án 1: EAS Build (Khuyến nghị - Làm trên Windows)

### Bước 1: Đăng ký Apple ID miễn phí

EAS Build **KHÔNG YÊU CẦU** tài khoản Apple Developer trả phí nếu bạn:
1. Sử dụng Apple ID miễn phí
2. Build profile "adhoc" hoặc "development"

### Bước 2: Cập nhật file `eas.json`

```json
{
  "cli": {
    "version": ">= 13.1.2",
    "appVersionSource": "remote"
  },
  "build": {
    "adhoc": {
      "ios": {
        "simulator": false,
        "autoIncrement": true,
        "buildConfiguration": "Release",
        "distribution": "adhoc"
      }
    }
  }
}
```

### Bước 3: Chạy build

```bash
# Đăng nhập EAS
eas login

# Build IPA
eas build --platform ios --profile adhoc

# HOẶC nếu không muốn đăng nhập Apple ID
eas build --platform ios --profile adhoc --local
```

### Bước 4: Tải file IPA

Sau khi build xong:
1. Truy cập https://expo.dev
2. Vào tab "Builds"
3. Tải file IPA về máy
4. File này có thể **unsigned** hoặc đã ký bằng certificate của bạn

---

## 📋 Phương án 2: Build trực tiếp trên Mac (Cần Mac + Xcode)

### Bước 1: Prebuild iOS native code

```bash
cd zalo-clone/mobile-expo

# Prebuild iOS project
npx expo prebuild --platform ios

# Thư mục ios/ sẽ được tạo
```

### Bước 2: Mở project trong Xcode

```bash
# Mở workspace trong Xcode
open ios/zyeamobile.xcworkspace
```

### Bước 3: Cấu hình Signing

Trong Xcode:
1. Chọn project → Target "zyeamobile"
2. Tab "Signing & Capabilities"
3. **BẬT** "Automatically manage signing"
4. Chọn team (Apple ID miễn phí của bạn)

### Bước 4: Build Archive

1. Menu **Product** → **Archive**
2. Đợi quá trình archive hoàn tất
3. Cửa sổ "Organizer" sẽ mở ra

### Bước 5: Export IPA

1. Chọn archive vừa tạo
2. Nhấn **"Distribute App"**
3. Chọn **"Development"** hoặc **"Ad Hoc"**
4. Chọn nơi lưu file IPA
5. Nhấn **"Export"**

### Bước 6: Tìm file IPA

File IPA sẽ được lưu tại thư mục bạn chọn.

---

## 🎯 Sử dụng file IPA với Esign

Sau khi có file IPA:

### Cách 1: Sử dụng Esign trên iPhone

1. **Tải Esign** về iPhone (từ trang chủ hoặc GitHub)
2. **Mở Esign** và đăng nhập bằng Apple ID của bạn
3. **Upload file IPA** vào Esign
4. Nhấn **"Sign and Install"**
5. Chờ quá trình ký và cài đặt xong

### Cách 2: Sử dụng Sideloadly (Trên máy tính)

1. **Tải Sideloadly**: https://sideloadly.app/
2. **Cài đặt** và mở Sideloadly
3. **Kết nối iPhone** với máy tính qua USB
4. **Kéo thả file IPA** vào Sideloadly
5. **Đăng nhập Apple ID** khi được yêu cầu
6. Nhấn **"Start"** để cài đặt

---

## ⚠️ Lưu ý về Apple ID miễn phí

### Giới hạn:
- ✅ Có thể build và test trên **3 thiết bị** của bạn
- ✅ Có thể ký và cài đặt với các công cụ như Esign
- ⚠️ Giấy phép chỉ **7 ngày**, sau đó cần ký lại
- ❌ Không thể upload lên App Store
- ❌ Không thể phân phối rộng rãi

### Giải pháp:
- Đăng ký **Apple Developer Program** ($99/năm) để không bị giới hạn
- HOẶC sử dụng **TrollStore** (jailbreak) để cài unsigned IPA vĩnh viễn

---

## 🚀 Build ngay với EAS (Windows)

Hiện tại dự án đã có sẵn config EAS. Chỉ cần chạy:

```bash
cd zalo-clone/mobile-expo

# Đăng nhập EAS
eas login

# Build với profile preview
eas build --platform ios --profile preview
```

---

## ❓ Câu hỏi thường gặp

### Q: Tôi ở Windows, có cần Mac không?
**A:** Không! Sử dụng EAS Build (cloud). Build sẽ chạy trên server của Expo.

### Q: File IPA unsigned có cài được không?
**A:** Có! Sử dụng Esign, Sideloadly, hoặc TrollStore để ký và cài đặt.

### Q: Tôi không có Apple ID Developer, build được không?
**A:** Được! Sử dụng Apple ID miễn phí thông thường.

### Q: Build mất bao lâu?
**A:** Khoảng 15-30 phút tùy độ phức tạp của app.

### Q: Chi phí EAS Build?
**A:** Miễn phí với plan Basic. Build công khai không giới hạn.

---

## 📞 Hỗ trợ

Nếu gặp vấn đề, kiểm tra:
1. ✅ Đã login EAS chưa?
2. ✅ File `app.json` đúng chưa?
3. ✅ File `eas.json` có config đúng không?
4. ✅ Có lỗi gì trong quá trình build không?

**Documentation**: https://docs.expo.dev/build/introduction/

