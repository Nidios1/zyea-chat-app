# 🔧 KHẮC PHỤC LỖI ĐĂNG NHẬP

## ✅ Kết Quả Kiểm Tra

Hệ thống hoạt động **HOÀN HẢO**:
- ✅ IP đã cấu hình đúng: 192.168.0.102
- ✅ Server đang chạy: http://192.168.0.102:5000
- ✅ Client đang chạy: http://192.168.0.102:3000
- ✅ Tất cả file cấu hình đã đúng
- ✅ Database kết nối tốt

## ⚠️ VẤN ĐỀ

**Client đã chạy TRƯỚC khi tạo .env.local**
→ React chỉ load biến môi trường khi START
→ Client đang dùng cấu hình CŨ (IP cũ)

## 🚀 CÁCH KHẮC PHỤC (3 BƯỚC)

### Bước 1: DỪNG Client

Trong terminal đang chạy client:
```
Ctrl + C
```

Hoặc kill tất cả:
```powershell
# Tìm process
Get-Process -Name node | Where-Object {$_.Path -like "*client*"}

# Kill process
Stop-Process -Name node -Force
```

### Bước 2: XÓA Cache

```bash
cd client
Remove-Item -Recurse -Force node_modules\.cache
```

Hoặc dùng lệnh:
```bash
npm run sync-ip
```

### Bước 3: KHỞI ĐỘNG LẠI

**Terminal 1 - Server:**
```bash
cd zalo-clone/server
npm start
```

**Terminal 2 - Client:**
```bash
cd zalo-clone/client
npm start
```

**HOẶC khởi động cả 2:**
```bash
cd zalo-clone
npm run dev
```

---

## 🌐 Sau Khi Khởi Động

### 1. Xóa Cache Browser

**Chrome/Edge:**
- Nhấn `Ctrl + Shift + Delete`
- Chọn "Cached images and files"
- Chọn "All time"
- Nhấn "Clear data"

**Hoặc Hard Refresh:**
- `Ctrl + F5` (Windows)
- `Cmd + Shift + R` (Mac)

### 2. Kiểm Tra Console

1. Mở `http://192.168.0.102:3000`
2. Nhấn `F12` để mở DevTools
3. Vào tab **Console**
4. Tìm dòng:
```
📡 Using API URL from env: http://192.168.0.102:5000/api
```

**Nếu thấy dòng này → OK!**
**Nếu KHÔNG thấy → Client chưa load .env.local**

### 3. Kiểm Tra Network Tab

1. Trong DevTools, vào tab **Network**
2. Thử đăng nhập
3. Xem request đi đến đâu:

**✅ ĐÚNG:**
```
Request URL: http://192.168.0.102:5000/api/auth/login
```

**❌ SAI (IP cũ):**
```
Request URL: http://192.168.0.103:5000/api/auth/login
```

Nếu thấy IP cũ → Client chưa restart đúng cách!

---

## 🐛 Nếu VẪN Lỗi

### Kiểm Tra 1: Server có trả về không?

```powershell
Invoke-WebRequest -Uri "http://192.168.0.102:5000/api/auth/login" -Method POST -Body '{"email":"test@test.com","password":"123"}' -ContentType "application/json"
```

**Phải trả về response (dù sai password)**

### Kiểm Tra 2: CORS Error?

Trong Console, nếu thấy:
```
Access to XMLHttpRequest at 'http://192.168.0.102:5000/api/auth/login' from origin 'http://192.168.0.102:3000' has been blocked by CORS
```

**Giải pháp:** Server đã cấu hình CORS đúng rồi, nhưng cần kiểm tra lại.

### Kiểm Tra 3: Database có user nào chưa?

```sql
USE zalo_clone;
SELECT * FROM users LIMIT 5;
```

**Nếu không có user → Cần đăng ký tài khoản mới**

### Kiểm Tra 4: JWT Secret

Trong `server/config.env`:
```
JWT_SECRET=your_jwt_secret_key_here
```

**Phải có giá trị, không để trống!**

---

## 📋 CHECKLIST HOÀN CHỈNH

- [ ] Đã stop client cũ (Ctrl+C)
- [ ] Đã xóa cache: `node_modules\.cache`
- [ ] Đã restart client: `npm start`
- [ ] Đã xóa cache browser (Ctrl+Shift+Delete)
- [ ] Đã hard refresh (Ctrl+F5)
- [ ] Đã kiểm tra Console log
- [ ] Đã kiểm tra Network tab
- [ ] Request đi đến IP đúng: 192.168.0.102
- [ ] Server trả về response
- [ ] Database có user

---

## 🎯 TEST ĐĂNG NHẬP

### Tạo Tài Khoản Mới:

1. Vào: `http://192.168.0.102:3000/register`
2. Điền thông tin:
   - Email: `test@example.com`
   - Password: `Test123!`
   - Name: `Test User`
3. Nhấn Register

### Đăng Nhập:

1. Vào: `http://192.168.0.102:3000/login`
2. Điền:
   - Email: `test@example.com`
   - Password: `Test123!`
3. Nhấn Login

**Nếu thành công → Vào được trang chính! 🎉**

---

## 🆘 NẾU VẪN KHÔNG ĐƯỢC

Chạy script này để xem log chi tiết:

```bash
npm run check
```

Hoặc gửi cho tôi:
1. Screenshot Console (F12)
2. Screenshot Network tab khi login
3. Thông báo lỗi cụ thể

---

## 💡 TIPS

### Luôn Restart Khi Thay Đổi .env

React **KHÔNG** tự động reload .env trong development!

**Khi nào cần restart:**
- ✅ Thêm/sửa file .env.local
- ✅ Thay đổi REACT_APP_* variables
- ✅ Chạy `npm run sync-ip`
- ✅ Thay đổi IP

**Không cần restart:**
- ❌ Sửa code JS/JSX thông thường
- ❌ Sửa CSS
- ❌ Hot reload sẽ tự động

### Dùng Script Nhanh

```bash
# Kiểm tra hệ thống
npm run check

# Xem cấu hình
npm run config

# Đồng bộ IP mới
npm run sync-ip

# Khởi động cả 2
npm run dev
```

---

**Chúc may mắn! Nếu làm đúng các bước trên, 100% sẽ hoạt động! 🚀**

