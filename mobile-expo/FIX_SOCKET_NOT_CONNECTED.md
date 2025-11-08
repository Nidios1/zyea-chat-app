# Fix Lỗi "Socket not connected" Khi Gọi Điện/Video

## Vấn Đề

Khi ấn nút gọi điện hoặc video, app báo lỗi: **"Socket not connected. Connection state: false"**

## Nguyên Nhân

Socket.IO chưa kết nối được với server trước khi bắt đầu cuộc gọi. Có thể do:

1. **Server không chạy** hoặc không accessible
2. **CORS đang block** connection từ mobile app
3. **Network issue** - mobile device và server không cùng mạng
4. **Socket URL không đúng**
5. **Token không hợp lệ** hoặc đã hết hạn

## Giải Pháp Nhanh

### Bước 1: Kiểm Tra Server Đang Chạy

```bash
# Trên server machine
cd server
npm start
```

Kiểm tra logs server:
- ✅ `Server running on port 5000` → Server đang chạy
- ✅ `✅ Socket connection from mobile app (no origin)` → Socket đã kết nối

### Bước 2: Kiểm Tra Network

1. **Mobile device và server phải cùng mạng Wi-Fi**
2. **Hoặc server phải accessible từ mobile device** (public IP)

Test kết nối từ mobile device:
```bash
# Mở browser trên mobile device và test:
http://192.168.0.103:5000
```

### Bước 3: Restart Server

Sau khi cập nhật CORS config, cần restart server:

```bash
cd server
# Stop server (Ctrl+C)
npm start
```

### Bước 4: Kiểm Tra Socket URL

Kiểm tra `app.json` hoặc `src/config/constants.ts`:

```json
{
  "extra": {
    "socketUrl": "http://192.168.0.103:5000"
  }
}
```

**Lưu ý:** 
- Đảm bảo IP address đúng với IP của server machine
- Không dùng `localhost` hoặc `127.0.0.1` (không hoạt động từ mobile device)

### Bước 5: Kiểm Tra Logs

**Server logs (khi mobile app kết nối):**
```
✅ Socket connection from mobile app (no origin)
✅ User connected: <socket-id>
User <user-id> joined their room
```

**App logs (Metro bundler hoặc debugger):**
```
✅ Socket connected: <socket-id>
User <user-id> joined their room
```

Nếu thấy lỗi:
```
❌ Socket connection error: ...
⚠️ Socket CORS blocked origin: ...
```

→ Xem phần Troubleshooting bên dưới

## Troubleshooting

### Lỗi 1: "Socket chưa được khởi tạo"

**Nguyên nhân:** Socket chưa được khởi tạo khi app load.

**Giải pháp:**
1. Đợi app load xong (đăng nhập thành công)
2. Kiểm tra console logs xem socket đã connect chưa
3. Thử lại sau vài giây

### Lỗi 2: "Socket not connected"

**Nguyên nhân:** Socket không thể kết nối với server.

**Giải pháp:**

1. **Kiểm tra server đang chạy:**
   ```bash
   # Trên server machine
   curl http://localhost:5000
   ```

2. **Kiểm tra network:**
   - Mobile device và server cùng mạng Wi-Fi
   - Hoặc server có public IP và accessible

3. **Kiểm tra firewall:**
   - Port 5000 không bị block
   - Router không block connections

4. **Kiểm tra Socket URL:**
   - Đúng IP address của server
   - Không dùng localhost/127.0.0.1

5. **Restart server:**
   ```bash
   cd server
   npm start
   ```

6. **Restart app:**
   - Đóng app hoàn toàn
   - Mở lại app
   - Đăng nhập lại

### Lỗi 3: "Socket CORS blocked origin"

**Nguyên nhân:** Server CORS đang block connection.

**Giải pháp:**

1. **Kiểm tra server code đã được cập nhật:**
   - File `server/index.js` đã có CORS config cho mobile app
   - Đã allow connections từ mobile app (no origin)

2. **Restart server:**
   ```bash
   cd server
   npm start
   ```

3. **Kiểm tra server logs:**
   - Nếu thấy `✅ Socket connection from mobile app (no origin)` → OK
   - Nếu vẫn thấy `⚠️ Socket CORS blocked origin` → Server chưa được update

### Lỗi 4: "Không thể kết nối với server"

**Nguyên nhân:** Network issue hoặc server không accessible.

**Giải pháp:**

1. **Kiểm tra IP address:**
   - Đảm bảo IP trong `app.json` đúng với IP server
   - Test từ browser trên mobile device: `http://<server-ip>:5000`

2. **Kiểm tra network:**
   - Mobile device và server cùng mạng
   - Hoặc server có public IP

3. **Kiểm tra firewall:**
   - Port 5000 không bị block
   - Router settings

## Debug Steps

### Step 1: Kiểm Tra Server

```bash
# Trên server machine
cd server
npm start

# Kiểm tra logs:
# - Server running on port 5000
# - Socket.IO initialized
```

### Step 2: Test Socket Connection

1. Mở app và đăng nhập
2. Mở một cuộc trò chuyện
3. Kiểm tra console logs:
   - `✅ Socket connected: <socket-id>` → OK
   - `❌ Socket connection error: ...` → Có lỗi

### Step 3: Test Cuộc Gọi

1. Mở một cuộc trò chuyện
2. Kiểm tra nút gọi điện/video:
   - Nếu màu xám → Socket chưa kết nối
   - Nếu màu bình thường → Socket đã kết nối
3. Ấn nút gọi
4. Nếu lỗi, xem console logs

## Cách Kiểm Tra Socket Connection

### Trong App:

1. **Mở React Native Debugger hoặc Metro bundler**
2. **Kiểm tra console logs:**
   ```
   ✅ Socket connected: <socket-id>
   User <user-id> joined their room
   ```

3. **Nếu không thấy logs trên:**
   - Socket chưa kết nối
   - Kiểm tra server đang chạy
   - Kiểm tra network

### Trên Server:

1. **Kiểm tra server logs:**
   ```
   ✅ Socket connection from mobile app (no origin)
   ✅ User connected: <socket-id>
   User <user-id> joined their room
   ```

2. **Nếu không thấy logs trên:**
   - Mobile app chưa kết nối được
   - Kiểm tra CORS config
   - Kiểm tra network

## Quick Fix Checklist

- [ ] Server đang chạy trên port 5000
- [ ] Server logs hiển thị "Server running on port 5000"
- [ ] Mobile device và server cùng mạng Wi-Fi
- [ ] Socket URL đúng trong `app.json` (IP address, không phải localhost)
- [ ] Server CORS đã được cập nhật (cho phép mobile app)
- [ ] Server đã được restart sau khi cập nhật CORS
- [ ] App đã được restart sau khi đăng nhập
- [ ] Console logs hiển thị "Socket connected"
- [ ] Nút gọi điện/video không bị disabled (màu xám)

## Test Connection

### Test 1: Kiểm Tra Server

```bash
# Từ mobile device browser, mở:
http://192.168.0.103:5000

# Nếu load được → Server accessible
# Nếu không load được → Network issue
```

### Test 2: Kiểm Tra Socket

1. Mở app và đăng nhập
2. Mở React Native Debugger
3. Kiểm tra console logs:
   - `Socket connected` → OK
   - `Socket connection error` → Có lỗi

### Test 3: Test Cuộc Gọi

1. Mở một cuộc trò chuyện
2. Ấn nút gọi điện
3. Nếu thành công:
   - Màn hình cuộc gọi hiển thị
   - Tab bar ẩn đi
4. Nếu lỗi:
   - Xem console logs
   - Xem server logs

## Lưu Ý

1. **Development:** 
   - Server cho phép tất cả origins để dễ test
   - Socket URL dùng local IP (192.168.x.x)

2. **Production:**
   - Nên restrict CORS để bảo mật
   - Socket URL dùng domain hoặc public IP

3. **Network:**
   - Mobile device và server phải cùng mạng
   - Hoặc server accessible từ internet

4. **Firewall:**
   - Đảm bảo port 5000 không bị block
   - Router settings cho phép connections

## Next Steps

Sau khi fix:

1. ✅ Server đang chạy
2. ✅ Socket kết nối thành công
3. ✅ Nút gọi điện/video hoạt động
4. ✅ Cuộc gọi có thể bắt đầu

Nếu vẫn có lỗi, kiểm tra:
- Server logs
- App console logs
- Network connectivity
- Socket URL configuration

