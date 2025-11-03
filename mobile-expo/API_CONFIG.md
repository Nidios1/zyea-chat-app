# 📱 Cấu hình API URL cho Mobile App

## ❌ Vấn đề: Đăng nhập thất bại

Nếu app báo lỗi đăng nhập, có thể do:
1. **Server chưa chạy** - Server phải đang chạy ở port 5000
2. **IP WiFi đã thay đổi** - IP hiện tại không đúng
3. **Không cùng mạng WiFi** - Điện thoại và máy server phải cùng WiFi

## ✅ Giải pháp

### Bước 1: Kiểm tra Server có đang chạy không

```bash
# Mở terminal ở thư mục zalo-clone/server
cd zalo-clone/server
npm start
# hoặc
node index.js
```

Server phải chạy ở: `http://192.168.0.104:5000` (hoặc IP hiện tại của bạn)

### Bước 2: Kiểm tra IP WiFi của máy server

**Windows:**
```cmd
ipconfig
```
Tìm "IPv4 Address" của adapter Wi-Fi, ví dụ: `192.168.0.104`

**Mac/Linux:**
```bash
ifconfig
# hoặc
ip addr
```

### Bước 3: Cập nhật IP trong mobile app

1. Mở file: `mobile-expo/src/config/constants.ts`
2. Thay đổi IP:

```typescript
// Thay IP này
export const API_BASE_URL = 'http://192.168.0.104:5000/api';
export const SOCKET_URL = 'http://192.168.0.104:5000';

// Thành IP mới của bạn, ví dụ:
export const API_BASE_URL = 'http://192.168.1.105:5000/api';
export const SOCKET_URL = 'http://192.168.1.105:5000';
```

### Bước 4: Rebuild và cài lại IPA

Sau khi thay đổi IP, cần rebuild lại app:

1. **Qua GitHub Actions:**
   - Commit và push code mới
   - GitHub Actions sẽ tự động build IPA mới
   - Tải IPA mới và cài lại

2. **Hoặc build local (nếu có Mac):**
   ```bash
   cd mobile-expo
   npx expo prebuild --platform ios
   # Mở Xcode và build
   ```

## 🔧 Nếu muốn dùng IP Public/Server thực

Nếu server của bạn có IP public hoặc domain, thay đổi như sau:

```typescript
export const API_BASE_URL = 'https://your-domain.com/api';
export const SOCKET_URL = 'https://your-domain.com';
```

**Lưu ý:** 
- iOS yêu cầu HTTPS cho production apps
- Cần cấu hình SSL certificate cho server
- Cần update Info.plist để allow domain mới

## 🧪 Test kết nối

Sau khi cập nhật IP, test bằng cách:

1. **Từ điện thoại, mở Safari/Chrome**
2. **Truy cập:** `http://YOUR_IP:5000/api/auth/login` 
3. **Nếu thấy JSON response** → Server đang chạy và có thể kết nối
4. **Nếu không kết nối được** → Kiểm tra firewall hoặc đảm bảo cùng WiFi

## 📝 Quick Fix Script

Tạo file `update-ip.sh` (hoặc `update-ip.bat` cho Windows):

```bash
#!/bin/bash
# Lấy IP WiFi hiện tại
IP=$(ipconfig getifaddr en0 || ipconfig getifaddr en1 || hostname -I | awk '{print $1}')

# Cập nhật file constants.ts
sed -i '' "s|http://.*:5000|http://${IP}:5000|g" src/config/constants.ts

echo "✅ Updated API URL to: http://${IP}:5000"
```

---

## ❓ Câu hỏi thường gặp

**Q: Tại sao không dùng localhost?**  
A: localhost trên điện thoại là chính nó, không phải máy server. Phải dùng IP thực.

**Q: Có thể dùng ngrok không?**  
A: Có! Ngrok tạo public URL. Nhưng cần rebuild app với URL mới.

**Q: Production app cần gì?**  
A: Cần HTTPS, domain thực, và cấu hình SSL certificate.

