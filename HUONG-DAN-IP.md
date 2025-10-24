# Hướng Dẫn Cấu Hình IP WiFi

## 📡 IP WiFi Hiện Tại
**IP: 192.168.0.102**  
**Router: 192.168.0.1**

## ❓ Tại Sao IP Cứ Thay Đổi?

IP của máy tính có thể thay đổi vì:
1. **DHCP động**: Router tự động cấp phát IP mới khi bạn kết nối lại WiFi
2. **Khởi động lại router/máy tính**: IP có thể được cấp phát lại
3. **Hết hạn lease time**: DHCP có thời gian hết hạn (thường 24-48 giờ)

## ⚠️ Tại Sao KHÔNG Dùng IP Router (192.168.0.1)?

**IP Router (192.168.0.1) là địa chỉ của router/modem, KHÔNG phải máy tính của bạn!**

- ❌ Không thể chạy server trên IP router
- ❌ Router không có server backend của bạn
- ✅ Phải dùng IP của máy tính (192.168.0.102)

## 🔧 Giải Pháp 1: Cập Nhật IP Tự Động (Khuyến Nghị)

### Sử dụng script tự động:

```bash
# Tại thư mục zalo-clone/
npm run update-ip
```

Script này sẽ:
- ✅ Tự động phát hiện IP WiFi hiện tại
- ✅ Cập nhật tất cả file cấu hình
- ✅ Báo cáo các file đã thay đổi

### Các file được cập nhật:
- `server/config.env`
- `client/src/utils/platformConfig.js`
- `client/src/utils/imageUtils.js`
- `client/src/components/Chat/ChatArea.js`
- `client/capacitor.config.ts`
- `client/package.json`

## 🔧 Giải Pháp 2: Đặt IP Tĩnh (Static IP)

### Cách 1: Đặt IP tĩnh trong Windows

1. **Mở Network Settings:**
   - `Windows + I` → Network & Internet → Wi-Fi → Properties

2. **Cấu hình IP thủ công:**
   - IP address: `192.168.0.102`
   - Subnet mask: `255.255.255.0`
   - Gateway: `192.168.0.1`
   - DNS: `8.8.8.8` (Google DNS)

3. **Lưu lại** và khởi động lại WiFi

### Cách 2: Đặt IP tĩnh trong Router (DHCP Reservation)

1. Đăng nhập router: `http://192.168.0.1`
2. Tìm **DHCP Reservation** hoặc **Static IP Mapping**
3. Thêm MAC address của máy tính với IP cố định `192.168.0.102`
4. Khởi động lại router

**Ưu điểm:**
- ✅ IP không bao giờ thay đổi
- ✅ Không cần cập nhật config mỗi lần khởi động

**Nhược điểm:**
- ❌ Phải cấu hình lại khi đổi mạng WiFi khác

## 🔧 Giải Pháp 3: Sử dụng Biến Môi Trường (.env)

Tạo file `.env.local` trong thư mục `client/`:

```env
REACT_APP_API_URL=http://192.168.0.102:5000/api
REACT_APP_SOCKET_URL=http://192.168.0.102:5000
REACT_APP_SERVER_URL=http://192.168.0.102:5000
```

**Ưu điểm:**
- ✅ Dễ thay đổi IP mà không sửa code
- ✅ Có thể ignore file .env trong git

## 🚀 Khởi Động Dự Án

### Sau khi cập nhật IP:

```bash
# Tại thư mục zalo-clone/

# Khởi động server
cd server
npm start

# Terminal mới - Khởi động client
cd client
npm start
```

### Khởi động nhanh (cả server + client):

```bash
cd zalo-clone
npm run dev
```

## 📱 Truy Cập Từ Điện Thoại

Để test trên điện thoại trong cùng mạng WiFi:

1. **Kiểm tra firewall Windows:**
   - Cho phép port 3000 và 5000

2. **Truy cập từ điện thoại:**
   - Client: `http://192.168.0.102:3000`
   - Server: `http://192.168.0.102:5000`

3. **Đảm bảo điện thoại cùng WiFi với máy tính**

## 🔍 Kiểm Tra IP Hiện Tại

### Windows:
```bash
ipconfig
```

Tìm dòng:
```
Wireless LAN adapter Wi-Fi:
   IPv4 Address. . . . . . . . . . . : 192.168.0.102
```

### PowerShell:
```powershell
Get-NetIPAddress -AddressFamily IPv4 | Where-Object {$_.InterfaceAlias -like "*Wi-Fi*"}
```

## ❓ Troubleshooting

### Lỗi: Cannot connect to server

1. Kiểm tra server đã chạy chưa:
   ```bash
   cd server
   npm start
   ```

2. Kiểm tra IP có đúng không:
   ```bash
   ipconfig
   ```

3. Kiểm tra firewall đã cho phép port chưa

### Lỗi: IP thay đổi sau khi khởi động lại

→ Sử dụng Giải Pháp 2 (Đặt IP Tĩnh)

### Lỗi: Cannot access from mobile

1. Kiểm tra cùng WiFi
2. Kiểm tra firewall Windows
3. Ping từ mobile: `ping 192.168.0.102`

## 📝 Lưu Ý

- ⚠️ Mỗi khi thay đổi mạng WiFi, IP có thể khác
- ⚠️ IP này chỉ hoạt động trong mạng LAN (cùng WiFi)
- ⚠️ Để deploy lên internet, cần domain và hosting

## 🆘 Hỗ Trợ

Nếu gặp vấn đề, kiểm tra:
1. IP hiện tại: `ipconfig`
2. Server đang chạy: Vào `http://192.168.0.102:5000`
3. File config đã cập nhật đúng IP chưa

