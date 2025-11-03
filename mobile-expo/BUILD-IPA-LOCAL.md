# Hướng dẫn Build IPA Unsigned Local

## Vấn đề
EAS Build trên cloud không hỗ trợ build unsigned IPA. Cần build local trên máy macOS.

## Cách 1: Build Local với EAS CLI (Khuyến nghị)

### Yêu cầu:
- Máy macOS (hoặc Hackintosh/virtual machine)
- Xcode đã cài đặt
- EAS CLI đã cài đặt

### Các bước:

1. **Cài đặt EAS CLI (nếu chưa có):**
   ```bash
   npm install -g eas-cli
   ```

2. **Login vào Expo:**
   ```bash
   eas login
   ```

3. **Vào thư mục dự án:**
   ```bash
   cd mobile-expo
   ```

4. **Build IPA unsigned local:**
   ```bash
   eas build --platform ios --profile unsigned --local
   ```

5. **File IPA sẽ được tạo tại:**
   - Thường ở: `mobile-expo/builds/` hoặc thư mục hiện tại

## Cách 2: Build với Xcode trực tiếp (Nếu có macOS)

1. **Generate native project:**
   ```bash
   cd mobile-expo
   npx expo prebuild --platform ios
   ```

2. **Mở trong Xcode:**
   ```bash
   open ios/zyea-mobile.xcworkspace
   ```

3. **Trong Xcode:**
   - Chọn Product > Archive
   - Sau khi archive xong, click "Distribute App"
   - Chọn "Ad Hoc" hoặc "Development"
   - Bỏ qua signing (hoặc dùng automatic signing nhưng không cần valid certificate)
   - Export IPA

## Cách 3: Sử dụng Expo Development Build

Nếu chỉ cần test, có thể dùng Expo Development Build:

```bash
cd mobile-expo
eas build --platform ios --profile development --local
```

## Lưu ý

- **Build local cần macOS** - Windows/Linux không thể build iOS IPA
- Nếu không có macOS, có thể:
  - Dùng macOS virtual machine
  - Dùng cloud macOS service (MacStadium, AWS Mac instances)
  - Hoặc build trên máy Mac thật

## File IPA sau khi build

Sau khi build xong, bạn sẽ có file `.ipa` để:
1. Ký bằng esign với certificate cá nhân
2. Cài đặt trên thiết bị iOS




