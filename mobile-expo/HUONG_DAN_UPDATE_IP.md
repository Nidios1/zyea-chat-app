# 📱 Hướng dẫn cập nhật IP trước khi build IPA

## ❌ Vấn đề

Khi build IPA, IP server được hardcode vào app. Nếu:
- IP WiFi thay đổi
- Server không chạy
- Không cùng mạng WiFi

→ App sẽ không đăng nhập được!

## ✅ Giải pháp: Cập nhật IP trước mỗi lần build

### Bước 1: Tìm IP WiFi hiện tại

**Windows:**
```cmd
ipconfig
```
Tìm "IPv4 Address" của Wi-Fi adapter, ví dụ: `192.168.1.105`

**Mac/Linux:**
```bash
ifconfig
```

### Bước 2: Cập nhật IP trong app

Có 2 cách:

#### Cách 1: Dùng script tự động (Khuyên dùng)

```bash
cd mobile-expo

# Tự động lấy IP WiFi
node update-api-ip.js auto

# Hoặc nhập IP thủ công
node update-api-ip.js 192.168.1.105
```

Script sẽ tự động cập nhật IP trong `src/config/constants.ts`

#### Cách 2: Sửa thủ công

Mở file: `mobile-expo/src/config/constants.ts`

```typescript
// Thay đổi IP này
export const API_BASE_URL = 'http://192.168.1.105:5000/api';
export const SOCKET_URL = 'http://192.168.1.105:5000';
```

### Bước 3: Đảm bảo server đang chạy

```cmd
cd zalo-clone/server
npm start
```

Server phải chạy ở: `http://YOUR_IP:5000`

### Bước 4: Commit và push để build IPA mới

```bash
cd zalo-clone

# Kiểm tra IP đã đúng chưa
git diff mobile-expo/src/config/constants.ts

# Commit
git add mobile-expo/src/config/constants.ts
git commit -m "Update: Change API IP to current WiFi IP"

# Push (GitHub Actions sẽ tự động build IPA mới)
git push
```

### Bước 5: Tải IPA mới và cài lại

1. Vào GitHub Actions → Download IPA mới
2. Cài lại qua eSign
3. Test đăng nhập

## 🔄 Workflow nhanh

Mỗi khi cần build IPA mới:

```bash
# 1. Cập nhật IP
cd mobile-expo
node update-api-ip.js auto

# 2. Kiểm tra server đang chạy
cd ../server
npm start  # (chạy trong terminal khác)

# 3. Commit và push
cd ..
git add mobile-expo/src/config/constants.ts
git commit -m "Update: API IP for new build"
git push

# 4. Đợi GitHub Actions build xong → Tải IPA mới
```

## ⚠️ Lưu ý quan trọng

1. **IP phải là IP WiFi thực** - không phải localhost (127.0.0.1)
2. **Server phải đang chạy** trước khi test app
3. **Điện thoại và server phải cùng WiFi** để kết nối được
4. **Mỗi lần IP WiFi thay đổi** phải rebuild lại IPA

## 🧪 Test kết nối

Trước khi build, test từ điện thoại:

1. Mở Safari/Chrome trên điện thoại
2. Truy cập: `http://YOUR_IP:5000/api/auth/login`
3. Nếu thấy JSON response → OK
4. Nếu không kết nối được → Kiểm tra:
   - Server có đang chạy không?
   - Cùng WiFi không?
   - Firewall có block port 5000 không?

## 🌐 Nếu muốn dùng domain/IP public

Thay đổi trong `constants.ts`:

```typescript
export const API_BASE_URL = 'https://your-domain.com/api';
export const SOCKET_URL = 'https://your-domain.com';
```

**Lưu ý:** iOS yêu cầu HTTPS cho production apps.

