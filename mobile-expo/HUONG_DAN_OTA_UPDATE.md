# 🚀 Hướng Dẫn Publish OTA Update (KHÔNG CẦN EMAIL)

## ❌ Vấn Đề

Khi chạy `eas update`, EAS yêu cầu đăng nhập bằng email, điều này gây bất tiện khi muốn tự động hóa hoặc publish update nhanh.

## ✅ Giải Pháp: Sử dụng EXPO_TOKEN

Thay vì đăng nhập bằng email mỗi lần, bạn có thể sử dụng **EXPO_TOKEN** (Access Token) để publish update mà **KHÔNG CẦN NHẬP EMAIL**.

---

## 📝 Các Bước Thiết Lập

### Bước 1: Lấy EXPO_TOKEN

1. **Truy cập Expo Dashboard:**
   - Đăng nhập vào: https://expo.dev
   - Vào: **Account Settings** → **Access Tokens**
   - Hoặc truy cập trực tiếp: https://expo.dev/accounts/[username]/settings/access-tokens

2. **Tạo Token mới:**
   - Click **"Create Token"**
   - Đặt tên cho token (ví dụ: "OTA Update Token")
   - Chọn scope: **"All projects"** hoặc chỉ project cụ thể
   - Click **"Create"**

3. **Copy Token:**
   - ⚠️ **QUAN TRỌNG:** Token chỉ hiển thị 1 lần duy nhất
   - Copy token ngay và lưu lại ở nơi an toàn

---

### Bước 2: Cấu Hình EXPO_TOKEN

#### Cách 1: Set Environment Variable (Tạm thời - Chỉ cho session hiện tại)

**Windows PowerShell:**
```powershell
$env:EXPO_TOKEN="your-token-here"
```

**Windows CMD:**
```cmd
set EXPO_TOKEN=your-token-here
```

**Linux/Mac:**
```bash
export EXPO_TOKEN="your-token-here"
```

#### Cách 2: Tạo File .env (Khuyến nghị - Lâu dài)

1. **Tạo file `.env`** trong thư mục `mobile-expo`:
   ```
   EXPO_TOKEN=your-token-here
   ```

2. **Cài đặt dotenv** (nếu chưa có):
   ```bash
   npm install dotenv
   ```

3. **Load .env trong script** (đã được tích hợp sẵn trong `publish-update.js`)

#### Cách 3: Set System Environment Variable (Windows - Vĩnh viễn)

1. Mở **System Properties** → **Environment Variables**
2. Thêm **User Variable** hoặc **System Variable**:
   - Name: `EXPO_TOKEN`
   - Value: `your-token-here`
3. Click **OK** và khởi động lại terminal

---

### Bước 3: Publish Update

Sau khi đã set `EXPO_TOKEN`, bạn có thể publish update:

#### Sử dụng Script Node.js (Khuyến nghị):
```bash
npm run update:publish "Thông báo update"
```

Hoặc:
```bash
node publish-update.js production "Fix bug login"
```

#### Sử dụng Script .bat (Windows):
```cmd
publish-update.bat production "Fix bug login"
```

#### Sử dụng EAS CLI trực tiếp:
```bash
eas update --branch production --message "Fix bug login" --non-interactive
```

---

## 🔒 Bảo Mật Token

### ⚠️ Lưu Ý Quan Trọng:

1. **KHÔNG commit token vào Git:**
   - Thêm `.env` vào `.gitignore`
   - Không đặt token trong code

2. **Bảo vệ token:**
   - Token có quyền publish update cho project
   - Nếu token bị lộ, hãy **xóa ngay** và tạo token mới

3. **Rotate token định kỳ:**
   - Thay đổi token mỗi 3-6 tháng
   - Xóa token cũ không còn sử dụng

---

## 🧪 Kiểm Tra Token

### Test Token có hoạt động không:

```bash
# Set token
$env:EXPO_TOKEN="your-token-here"

# Test publish (với --dry-run nếu có)
eas update --branch production --message "Test" --non-interactive
```

---

## 📋 Checklist

- [ ] Đã tạo EXPO_TOKEN từ Expo Dashboard
- [ ] Đã set EXPO_TOKEN trong environment variable hoặc file .env
- [ ] Đã test publish update thành công
- [ ] Đã thêm `.env` vào `.gitignore`
- [ ] Đã lưu token ở nơi an toàn

---

## 🐛 Troubleshooting

### Lỗi: "EXPO_TOKEN không được tìm thấy"

**Nguyên nhân:** Environment variable chưa được set

**Giải pháp:**
1. Kiểm tra token đã được set:
   ```powershell
   echo $env:EXPO_TOKEN
   ```
2. Set lại token nếu chưa có
3. Khởi động lại terminal

### Lỗi: "Invalid token" hoặc "401 Unauthorized"

**Nguyên nhân:** Token không đúng hoặc đã hết hạn

**Giải pháp:**
1. Kiểm tra token có đúng không
2. Tạo token mới từ Expo Dashboard
3. Set lại token

### Lỗi: "Project not found"

**Nguyên nhân:** Token không có quyền truy cập project

**Giải pháp:**
1. Kiểm tra token có scope "All projects" hoặc project cụ thể
2. Tạo token mới với quyền phù hợp

---

## 💡 Lợi Ích

✅ **KHÔNG CẦN NHẬP EMAIL** mỗi lần publish update  
✅ **Tự động hóa** được trong CI/CD  
✅ **Nhanh chóng** hơn so với login thủ công  
✅ **An toàn** hơn với token có scope giới hạn  

---

## 📚 Tài Liệu Tham Khảo

- [Expo Access Tokens](https://docs.expo.dev/accounts/programmatic-access/)
- [EAS Update](https://docs.expo.dev/eas-update/introduction/)
- [EAS CLI](https://docs.expo.dev/build/setup/)

---

## 🎉 Kết Luận

Với EXPO_TOKEN, bạn có thể publish OTA update **KHÔNG CẦN NHẬP EMAIL** mỗi lần, giúp quá trình phát triển và deploy nhanh chóng hơn nhiều!

