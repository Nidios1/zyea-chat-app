# 🔧 Fix lỗi "Could not connect to development server"

## ✅ Kiểm tra nhanh

1. **Metro bundler đang chạy** - ✅ Đã OK (port 8081 đang LISTENING)
2. **IP đúng** - ✅ 192.168.0.104
3. **Có connection** - ✅ Đang có kết nối từ 192.168.0.101

## 🚀 Cách fix ngay

### Cách 1: Reload trong app (NHANH NHẤT)
- Nhấn nút **"Reload JS"** trong màn hình lỗi
- Hoặc lắc điện thoại → chọn "Reload"

### Cách 2: Restart Expo server
```bash
# Dừng server hiện tại (Ctrl+C trong terminal)
# Sau đó chạy lại:
cd zalo-clone/mobile-expo
npx expo start
```

### Cách 3: Clear cache và restart
```bash
cd zalo-clone/mobile-expo
npx expo start --clear
```

### Cách 4: Dùng Tunnel (nếu WiFi có vấn đề)
```bash
cd zalo-clone/mobile-expo
npx expo start --tunnel
```
> ⚠️ Tunnel hơi chậm nhưng sẽ hoạt động tốt hơn

## 📱 Trong Expo Go app

1. **Shake device** (lắc điện thoại)
2. Chọn **"Reload"**
3. Hoặc **"Return to Expo Home"** và quét QR lại

## 🔍 Debug thêm

Nếu vẫn lỗi, kiểm tra:

1. **Firewall Windows:**
   - Settings → Firewall → Cho phép Node.js qua firewall

2. **WiFi:**
   - Đảm bảo điện thoại và máy tính cùng WiFi
   - Thử tắt/bật WiFi trên điện thoại

3. **Kiểm tra IP:**
   ```powershell
   ipconfig
   # Xem IPv4 Address có đúng 192.168.0.104 không
   ```

4. **Trong Expo Go:**
   - Vào Settings → Change connection type
   - Chọn "LAN" hoặc "Tunnel"

## ✅ Quick Fix Checklist

- [ ] Nhấn "Reload JS" trong app
- [ ] Restart Expo server (`npx expo start`)
- [ ] Kiểm tra cùng WiFi network
- [ ] Thử tunnel mode (`--tunnel`)
- [ ] Check firewall settings

---

**Lưu ý:** Lỗi này thường do mất kết nối tạm thời. Reload JS thường fix được ngay!

