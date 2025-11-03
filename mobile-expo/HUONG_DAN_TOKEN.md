# Hướng dẫn tạo Expo Access Token và thêm vào GitHub

## Bước 1: Tạo Expo Access Token

1. Đăng nhập vào [Expo.dev](https://expo.dev/)
2. Click vào avatar/icon tài khoản ở góc trên bên phải
3. Chọn **Account Settings** (hoặc truy cập: https://expo.dev/accounts/[your-account]/settings)
4. Trong menu bên trái, click vào **Access Tokens**
5. Click nút **Create Token** hoặc **Generate Token**
6. Đặt tên token (ví dụ: "GitHub Actions Build")
7. Chọn quyền **Full access** (hoặc ít nhất là Build access)
8. Click **Generate** hoặc **Create**
9. **QUAN TRỌNG**: Copy token ngay lập tức (token chỉ hiển thị 1 lần duy nhất!)
   - Token có dạng: `exp_xxxxxxxxxxxxxxxxxxxxx`

## Bước 2: Thêm Token vào GitHub Secrets

1. Vào repository trên GitHub: https://github.com/Nidios1/zyea-chat-app
2. Click tab **Settings** (cài đặt)
3. Trong menu bên trái, click **Secrets and variables** > **Actions**
4. Click nút **New repository secret** (màu xanh)
5. Điền thông tin:
   - **Name**: `EXPO_TOKEN` (phải viết đúng như vậy)
   - **Secret**: Dán token bạn đã copy ở bước 1
6. Click **Add secret**

## Bước 3: Kiểm tra

Sau khi thêm secret, workflow sẽ tự động chạy khi bạn:
- Push code mới vào nhánh `main`, `master`, hoặc `develop`
- Hoặc trigger thủ công từ tab **Actions**

## Lưu ý

- Token chỉ hiển thị 1 lần, nếu quên phải tạo lại
- Token có quyền build nên cần bảo mật, không chia sẻ công khai
- Token không hết hạn, nhưng có thể revoke (hủy) bất cứ lúc nào

## Kiểm tra token có hoạt động

Sau khi thêm token, bạn có thể:
1. Vào tab **Actions** trên GitHub
2. Trigger workflow thủ công (Run workflow)
3. Nếu build bắt đầu chạy = token đã hoạt động đúng
4. Nếu báo lỗi authentication = kiểm tra lại token




