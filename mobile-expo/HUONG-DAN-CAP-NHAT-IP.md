# Hướng Dẫn Kiểm Tra và Cập Nhật IP WiFi

## 🔍 Kiểm Tra IP Hiện Tại

### Cách 1: Dùng Script Tự Động
```bash
cd mobile-expo
node check-and-update-ip.js
```

Script này sẽ:
- ✅ Kiểm tra IP trong tất cả các file config
- ✅ Hiển thị IP hiện tại trong từng file
- ✅ Báo nếu có IP khác nhau giữa các file

### Cách 2: Kiểm Tra IP WiFi Thủ Công

**Trên Windows:**
```bash
ipconfig
```
Tìm dòng `IPv4 Address` của adapter WiFi (thường là `Wi-Fi` hoặc `Wireless LAN`)

**Trên điện thoại (Android):**
- Vào **Settings** → **Wi-Fi** → Chạm vào mạng WiFi đang kết nối
- Xem **IP Address** (đây là IP của điện thoại, KHÔNG phải IP server)

**Trên điện thoại (iOS):**
- Vào **Settings** → **Wi-Fi** → Chạm vào biểu tượng ⓘ bên cạnh mạng WiFi
- Xem **IP Address**

## 📱 Lấy IP Server (Máy Tính)

IP server là IP của máy tính chạy server, KHÔNG phải IP của điện thoại!

**Cách lấy IP server:**
1. Mở Command Prompt hoặc PowerShell trên máy tính
2. Chạy lệnh: `ipconfig`
3. Tìm dòng `IPv4 Address` của adapter WiFi (thường là `192.168.x.x`)
4. Đây chính là IP cần cập nhật vào app

## 🔄 Cập Nhật IP

### Cách 1: Tự Động (Khuyến nghị)
```bash
cd mobile-expo
node check-and-update-ip.js auto
```

Script sẽ tự động:
- ✅ Lấy IP WiFi hiện tại
- ✅ Cập nhật vào tất cả các file config

### Cách 2: Cập Nhật IP Cụ Thể
```bash
cd mobile-expo
node check-and-update-ip.js 192.168.1.105
```
(Thay `192.168.1.105` bằng IP WiFi thực tế của bạn)

### Cách 3: Cập Nhật Thủ Công

**1. Cập nhật Mobile App:**
- File: `mobile-expo/src/config/constants.ts`
- Tìm và thay thế:
  ```typescript
  export const API_BASE_URL = 'http://192.168.0.103:5000/api';
  export const SOCKET_URL = 'http://192.168.0.103:5000';
  ```
- Thay `192.168.0.103` bằng IP WiFi mới

**2. Cập nhật Server Config:**
- File: `server/config.env`
- Tìm và thay thế:
  ```
  CLIENT_URL=http://192.168.0.103:3000
  SERVER_URL=http://192.168.0.103:5000
  ```
- Thay `192.168.0.103` bằng IP WiFi mới

**3. Khởi động lại server:**
```bash
cd server
npm start
```

## ✅ Kiểm Tra Sau Khi Cập Nhật

1. **Kiểm tra IP đã được cập nhật:**
   ```bash
   node check-and-update-ip.js
   ```

2. **Kiểm tra server đang chạy:**
   - Mở trình duyệt, truy cập: `http://[IP]:5000/api/health`
   - Ví dụ: `http://192.168.0.103:5000/api/health`
   - Nếu thấy response, server đang chạy ✅

3. **Kiểm tra kết nối từ điện thoại:**
   - Đảm bảo điện thoại và máy tính cùng mạng WiFi
   - Mở app trên điện thoại
   - Thử đăng nhập

## 🚨 Xử Lý Lỗi

### Lỗi: "timeout of 15000ms exceeded"
- ✅ IP đã được cập nhật đúng chưa?
- ✅ Server có đang chạy không?
- ✅ Điện thoại và máy tính có cùng mạng WiFi không?
- ✅ Firewall có chặn port 5000 không?

### Lỗi: "Network Error" hoặc "Connection refused"
- ✅ Kiểm tra server có đang chạy: `http://[IP]:5000/api/health`
- ✅ Kiểm tra firewall Windows có chặn port 5000
- ✅ Thử tắt firewall tạm thời để test

### Lỗi: "401 Unauthorized" hoặc "403 Forbidden"
- ✅ Token có thể đã hết hạn, thử đăng nhập lại
- ✅ Kiểm tra JWT_SECRET trong `server/config.env`

## 📝 Checklist

- [ ] Đã kiểm tra IP WiFi hiện tại của máy tính
- [ ] Đã cập nhật IP trong `mobile-expo/src/config/constants.ts`
- [ ] Đã cập nhật IP trong `server/config.env`
- [ ] Đã khởi động lại server
- [ ] Đã kiểm tra server đang chạy (truy cập `/api/health`)
- [ ] Đã đảm bảo điện thoại và máy tính cùng mạng WiFi
- [ ] Đã thử đăng nhập lại trên điện thoại

## 💡 Mẹo

1. **Lưu script cập nhật IP:**
   - Script `check-and-update-ip.js` có thể dùng mỗi khi đổi WiFi
   - Chạy `node check-and-update-ip.js auto` để tự động cập nhật

2. **Kiểm tra IP nhanh:**
   - Windows: `ipconfig | findstr IPv4`
   - Hoặc dùng script: `node check-and-update-ip.js`

3. **Test kết nối:**
   - Dùng app Postman hoặc trình duyệt để test API
   - URL: `http://[IP]:5000/api/users/profile`

