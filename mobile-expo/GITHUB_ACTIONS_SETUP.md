# GitHub Actions - Build IPA Setup

## Tổng quan

Workflow này tự động build IPA unsigned cho iOS khi bạn push code lên GitHub. IPA sẽ được upload như một artifact để bạn có thể download và ký bằng esign.

## Cấu hình cần thiết

### 1. Tạo Expo Access Token

1. Đăng nhập vào [Expo Dashboard](https://expo.dev/)
2. Vào **Account Settings** > **Access Tokens**
3. Tạo một token mới với quyền **Full access**
4. Copy token này

### 2. Thêm Secret vào GitHub

1. Vào repository trên GitHub
2. Đi tới **Settings** > **Secrets and variables** > **Actions**
3. Click **New repository secret**
4. Thêm secret với tên: `EXPO_TOKEN`
5. Paste Expo token vào giá trị
6. Click **Add secret**

## Cách sử dụng

### Tự động build khi push

Workflow sẽ tự động chạy khi bạn push code vào các nhánh:
- `main`
- `master`
- `develop`

Và chỉ khi có thay đổi trong:
- `src/**`
- `App.tsx`
- `app.json`
- `package.json`
- `.github/workflows/build-ipa.yml`

### Build thủ công (Manual)

1. Vào **Actions** tab trên GitHub
2. Chọn workflow **Build IPA (Unsigned)**
3. Click **Run workflow**
4. Chọn profile build:
   - `unsigned` - IPA không ký (mặc định)
   - `preview` - Preview build
   - `adhoc` - Ad-hoc build
5. Click **Run workflow**

## Download IPA

Sau khi build hoàn thành:

1. Vào **Actions** tab
2. Click vào run vừa hoàn thành
3. Scroll xuống phần **Artifacts**
4. Download file `ios-ipa-{run-number}-{commit-sha}`
5. Giải nén và lấy file `.ipa`

## Build Profiles

Các profile có sẵn trong `eas.json`:

- **unsigned**: IPA không ký, dùng để ký bằng esign sau
- **preview**: Preview build
- **adhoc**: Ad-hoc distribution
- **production**: Production build (cần certificate)

## Ký IPA bằng esign

Sau khi download IPA:

1. Sử dụng công cụ như [es-fastlane](https://github.com/youzan/esign) hoặc các công cụ ký IPA khác
2. Ký với certificate và provisioning profile của bạn
3. File đã ký có thể được cài đặt trên thiết bị iOS

## Troubleshooting

### Build bị fail

- Kiểm tra `EXPO_TOKEN` secret đã được thêm chưa
- Kiểm tra `app.json` và `eas.json` cấu hình đúng chưa
- Xem logs trong Actions để biết lỗi cụ thể

### Không tìm thấy artifact

- Đợi build hoàn thành (có thể mất 10-30 phút)
- Kiểm tra build status trong Expo Dashboard
- Artifacts chỉ được giữ trong 30 ngày

### Build timeout

- Build có thể mất tới 2 giờ
- Nếu quá lâu, kiểm tra Expo build queue
- Có thể build thủ công từ terminal để debug

## Lưu ý

- IPA unsigned chỉ có thể cài đặt sau khi ký
- Build trên EAS cần có project ID trong `app.json` (đã có: `fa5c683f-f9c5-459e-85a5-98f1856c4d2d`)
- Mỗi build sẽ tự động tăng build number (autoIncrement: true)

