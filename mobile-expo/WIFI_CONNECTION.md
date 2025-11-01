# 📡 Cách kết nối Expo trên cùng WiFi

## ⚠️ Vấn đề hiện tại

ke Expo Go không thấy development server của bạn.

## 🔧 Cách fix

### Cách 1: Đảm bảo cùng WiFi

1. **Kiểm tra WiFi điện thoại:**
   - Vào Settings → WiFi
   - Note tên WiFi

2. **Kiểm tra WiFi máy tính:**
   ```powershell
   netsh wlan show profile
   ```
   
3. **Đảm bảo cả 2 cùng một network**

### Cách 2: Dùng IP trực tiếp trong Expo Go

1. **Lấy IP của máy tính:**
   ```powershell
   ipconfig
   # Tìm IPv4 Address (ví dụ: 192.168.0.104)
   ```

2. **Trong Expo Go:**
   - Nhập vào ô input: `exp://192.168.0.104:8081`
   - Hoặc scan QR code từ terminal

### Cách 3: Dùng Tunnel (hoạt động mọi network)

```bash
cd mobile-expo
npx expo start --tunnel
```

> ⚠️ Tunnel mất thời gian nhưng sẽ hoạt động ngay cả khi khác WiFi

### Cách 4: Kiểm tra Firewall

Windows có thể chặn kết nối:

1. **Tạm thời tắt Firewall** (để test):
   - Settings → Firewall → Turn off Windows Defender Firewall

2. **Hoặc cho phép qua Firewall:**
   - Allow Node.js qua Firewall

## 🎯 Quick Fix - Chạy lại

```bash
# Terminal 1: Start Expo
cd C:\xampp\htdocs\zalo-clone\mobile-expo
npx expo start

# Terminal 2: Start Backend
cd C:\xampp\htdocs\zalo-clone\server
npm start
```

## 📱 Sau khi có QR Code:

1. **Quét QR trong terminal bằng Expo Go**
2. **Hoặc nhập link trực tiếp trong Expo Go**
3. **Đợi app build và load**

---

**IP hiện tại của bạn: `192.168.0.104`**

