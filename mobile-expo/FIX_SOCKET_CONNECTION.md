# Hướng Dẫn Fix Lỗi "Không Thể Kết Nối Server" Khi Gọi Điện/Video

## Vấn Đề

Khi ấn nút gọi điện hoặc video, app báo lỗi "Không thể kết nối server". Đây là lỗi CORS (Cross-Origin Resource Sharing) từ Socket.IO server.

## Nguyên Nhân

1. **Server Socket.IO CORS chưa cho phép connection từ mobile app**
2. **Socket chưa kết nối khi bắt đầu cuộc gọi**
3. **Lỗi network hoặc server không chạy**

## Giải Pháp

### Bước 1: Cập Nhật Server (Đã Fix)

Server đã được cập nhật để:
- Cho phép connection từ mobile app (no origin)
- Cho phép connection từ server URL (port 5000)
- Log rõ ràng hơn về CORS connections

### Bước 2: Restart Server

Sau khi cập nhật code server, cần restart server:

```bash
cd server
npm start
# hoặc
npm run dev
```

### Bước 3: Kiểm Tra Server Đang Chạy

Đảm bảo server đang chạy trên đúng địa chỉ:
- URL: `http://192.168.0.103:5000`
- Socket.IO endpoint: `http://192.168.0.103:5000`

### Bước 4: Kiểm Tra Kết Nối Mạng

1. **Kiểm tra mobile app và server cùng mạng:**
   - Mobile device và server phải cùng mạng Wi-Fi
   - Hoặc server phải accessible từ mobile device (public IP)

2. **Test kết nối:**
   ```bash
   # Từ mobile device, mở browser và test:
   http://192.168.0.103:5000
   ```

### Bước 5: Kiểm Tra Logs Server

Khi mobile app kết nối, server sẽ log:
- ✅ `Socket connection from mobile app (no origin)` - Nếu thành công
- ⚠️ `Socket CORS blocked origin: ...` - Nếu bị block (sẽ không xảy ra sau khi fix)

### Bước 6: Kiểm Tra Socket Connection trong App

1. **Mở app và đăng nhập**
2. **Kiểm tra console logs:**
   - `Socket connected` - Nếu thành công
   - `❌ Socket connection error: ...` - Nếu có lỗi

3. **Kiểm tra socket connection status:**
   - App sẽ tự động kết nối socket khi đăng nhập
   - Nếu không kết nối được, kiểm tra:
     - Token có hợp lệ không
     - Server có đang chạy không
     - Network có ổn định không

## Cách Test

### Test 1: Kiểm Tra Socket Connection

1. Mở app và đăng nhập
2. Mở một cuộc trò chuyện
3. Kiểm tra console logs:
   - Nếu thấy `Socket connected` → OK
   - Nếu thấy lỗi → Xem phần Troubleshooting

### Test 2: Test Cuộc Gọi

1. Mở một cuộc trò chuyện với người dùng khác
2. Ấn nút gọi điện (phone icon)
3. Nếu thành công:
   - Màn hình cuộc gọi sẽ hiển thị
   - Tab bar sẽ ẩn đi
   - Có thể thấy avatar và tên người dùng
4. Nếu lỗi:
   - Sẽ hiển thị thông báo lỗi
   - Xem console logs để biết chi tiết

## Troubleshooting

### Lỗi 1: "Socket chưa được khởi tạo"

**Nguyên nhân:** Socket chưa được khởi tạo khi bắt đầu cuộc gọi.

**Giải pháp:**
- Đợi một vài giây sau khi đăng nhập
- Kiểm tra socket đã kết nối chưa trong console logs
- Thử lại cuộc gọi

### Lỗi 2: "Không thể kết nối với server"

**Nguyên nhân:**
- Socket chưa kết nối
- Server không chạy
- Network không ổn định
- CORS vẫn đang block

**Giải pháp:**
1. Kiểm tra server đang chạy:
   ```bash
   # Trên server machine
   curl http://localhost:5000
   ```

2. Kiểm tra network:
   - Mobile device và server cùng mạng
   - Firewall không block port 5000
   - Router không block connections

3. Restart server:
   ```bash
   cd server
   npm start
   ```

4. Restart app:
   - Đóng app hoàn toàn
   - Mở lại app
   - Đăng nhập lại

### Lỗi 3: "Socket CORS blocked origin"

**Nguyên nhân:** Server vẫn đang block origin từ mobile app.

**Giải pháp:**
1. Kiểm tra server code đã được cập nhật chưa
2. Restart server
3. Kiểm tra logs server:
   - Nếu thấy `✅ Socket connection from mobile app (no origin)` → OK
   - Nếu vẫn thấy `⚠️ Socket CORS blocked origin` → Server chưa được update

### Lỗi 4: "Chưa đăng nhập"

**Nguyên nhân:** User chưa đăng nhập hoặc token đã hết hạn.

**Giải pháp:**
- Đăng nhập lại
- Kiểm tra token có hợp lệ không

## Kiểm Tra Server Logs

Khi mobile app kết nối socket, server sẽ log:

```
✅ User connected: <socket-id>
🔍 Socket connection from origin: <origin>
✅ Socket CORS allowed for origin: <origin>
User <user-id> joined their room
User <user-id> status updated to online
```

Nếu thấy lỗi:
```
⚠️ Socket CORS blocked origin: <origin>
```

→ Server chưa được cập nhật hoặc chưa restart.

## Kiểm Tra Mobile App Logs

Trong React Native, mở Metro bundler hoặc debugger để xem logs:

```
Socket connected
User <user-id> joined their room
```

Nếu thấy lỗi:
```
❌ Socket connection error: <error>
❌ Socket error: <error>
```

→ Kiểm tra:
1. Server có đang chạy không
2. Network có ổn định không
3. Socket URL có đúng không

## Cập Nhật Socket URL

Nếu cần thay đổi Socket URL:

1. **Cập nhật trong `app.json`:**
```json
{
  "extra": {
    "socketUrl": "http://192.168.0.103:5000"
  }
}
```

2. **Hoặc cập nhật trong `src/config/constants.ts`:**
```typescript
return 'http://YOUR_SERVER_IP:5000';
```

3. **Rebuild app** nếu thay đổi `app.json`

## Lưu Ý

1. **Development:** Server cho phép tất cả origins để dễ test
2. **Production:** Nên restrict CORS để bảo mật hơn
3. **Network:** Đảm bảo mobile device và server cùng mạng hoặc server accessible từ internet
4. **Firewall:** Đảm bảo port 5000 không bị block bởi firewall

## Kết Luận

Sau khi fix:
- ✅ Server đã được cập nhật để cho phép mobile app connections
- ✅ Error handling đã được cải thiện
- ✅ Logs rõ ràng hơn để debug

**Các bước tiếp theo:**
1. Restart server
2. Test socket connection
3. Test cuộc gọi điện/video
4. Kiểm tra logs nếu vẫn có lỗi

