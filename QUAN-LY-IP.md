# 🎯 QUẢN LÝ IP TRUNG TÂM

## ✨ Giới Thiệu

Hệ thống quản lý IP trung tâm cho phép bạn **chỉ thay đổi IP ở 1 FILE duy nhất** và tự động đồng bộ sang tất cả các file khác trong dự án.

### 📁 Cấu Trúc File

```
zalo-clone/
├── network-config.js       ← FILE TRUNG TÂM (Chỉ sửa ở đây!)
├── sync-ip.js              ← Script tự động đồng bộ
├── update-ip.js            ← Script phát hiện IP tự động
└── client/.env.local       ← Auto-generated
```

---

## 🚀 HƯỚNG DẪN SỬ DỤNG

### ⚡ Cách 1: Thay Đổi IP Thủ Công (Khuyến Nghị)

#### Bước 1: Mở file `network-config.js`

Tìm dòng:
```javascript
const NETWORK_CONFIG = {
  mode: 'manual',          // ← Để 'manual'
  manualIP: '192.168.0.102', // ← THAY ĐỔI IP Ở ĐÂY!
  ...
}
```

#### Bước 2: Thay đổi IP

Ví dụ, nếu IP WiFi mới là `192.168.1.100`:
```javascript
manualIP: '192.168.1.100',
```

#### Bước 3: Chạy lệnh đồng bộ

```bash
cd zalo-clone
npm run sync-ip
```

#### Bước 4: Khởi động lại server & client

```bash
# Terminal 1 - Server
cd server
npm start

# Terminal 2 - Client
cd client
npm start
```

Hoặc chạy cả 2:
```bash
npm run dev
```

✅ **XONG!** Tất cả các file đã được cập nhật!

---

### ⚡ Cách 2: Tự Động Phát Hiện IP WiFi

#### Bước 1: Bật chế độ auto trong `network-config.js`

```javascript
const NETWORK_CONFIG = {
  mode: 'auto',  // ← Đổi thành 'auto'
  ...
}
```

#### Bước 2: Chạy lệnh đồng bộ

```bash
npm run sync-ip
```

Script sẽ **tự động phát hiện IP WiFi** hiện tại và cập nhật tất cả file!

**⚠️ Lưu Ý:**
- Chế độ auto sẽ tìm Wi-Fi adapter đầu tiên
- Nếu không tìm thấy, sẽ dùng IP thủ công
- Đảm bảo tên adapter có từ "Wi-Fi", "Wireless", hoặc "WLAN"

---

## 📋 DANH SÁCH FILE ĐƯỢC ĐỒNG BỘ

Khi chạy `npm run sync-ip`, các file sau sẽ được tự động cập nhật:

| # | File | Nội dung cập nhật |
|---|------|-------------------|
| 1 | `server/config.env` | CLIENT_URL, SERVER_URL |
| 2 | `client/src/utils/platformConfig.js` | defaultApiUrl, defaultSocketUrl |
| 3 | `client/src/utils/imageUtils.js` | Server URL, API URL |
| 4 | `client/src/components/Chat/ChatArea.js` | Upload image URL |
| 5 | `client/package.json` | Proxy URL |
| 6 | `client/capacitor.config.ts` | allowNavigation array |
| 7 | `client/.env.local` | REACT_APP_* variables |

---

## 🎨 CÁC LỆNH THƯỜNG DÙNG

### Xem cấu hình hiện tại
```bash
npm run config
```

Kết quả:
```
📡 Network Configuration:
========================
Mode: manual
IP: 192.168.0.102
Client: http://192.168.0.102:3000
Server: http://192.168.0.102:5000
API: http://192.168.0.102:5000/api
========================
```

### Đồng bộ IP
```bash
npm run sync-ip
```

### Phát hiện IP tự động (old script)
```bash
npm run update-ip
```

---

## 🔧 TÙY CHỈNH NÂNG CAO

### Thay đổi Port

Trong `network-config.js`:
```javascript
const NETWORK_CONFIG = {
  ...
  clientPort: 3000,  // ← Port client
  serverPort: 5000,  // ← Port server
  ...
}
```

### Sử dụng HTTPS

```javascript
const NETWORK_CONFIG = {
  ...
  protocol: 'https',  // ← Đổi thành https
  ...
}
```

**⚠️ Lưu Ý:** Cần cấu hình SSL certificate cho server!

---

## 🐛 TROUBLESHOOTING

### ❌ Lỗi: Script không tìm thấy file

**Giải pháp:**
```bash
# Đảm bảo đang ở thư mục zalo-clone/
cd c:\xampp\htdocs\zalo-clone
npm run sync-ip
```

### ❌ Lỗi: IP không đúng sau khi đồng bộ

**Kiểm tra:**
1. Xem cấu hình hiện tại:
   ```bash
   npm run config
   ```

2. Kiểm tra IP WiFi:
   ```bash
   ipconfig
   ```

3. So sánh và cập nhật `manualIP` trong `network-config.js`

### ❌ Lỗi: File .env.local không được tạo

**Giải pháp:**
```bash
# Chạy lại script
npm run sync-ip

# Kiểm tra file đã tạo
dir client\.env.local
```

### ❌ Lỗi: Client/Server không connect được

**Checklist:**
- [ ] Đã chạy `npm run sync-ip`?
- [ ] Đã khởi động lại server & client?
- [ ] IP trong network-config.js có đúng?
- [ ] Firewall có chặn port 3000/5000?
- [ ] Điện thoại cùng WiFi với máy tính?

---

## 📱 TEST TRÊN ĐIỆN THOẠI

### Bước 1: Kiểm tra IP
```bash
npm run config
```

### Bước 2: Đảm bảo cùng WiFi
- Máy tính: Kết nối WiFi
- Điện thoại: Kết nối **cùng WiFi**

### Bước 3: Mở browser trên điện thoại
```
http://192.168.0.102:3000
```

### Bước 4: Test API
```
http://192.168.0.102:5000/api
```

---

## 📊 SO SÁNH CÁCH CŨ VS MỚI

### ❌ Cách Cũ (Thủ Công)

1. Sửa `server/config.env`
2. Sửa `client/src/utils/platformConfig.js`
3. Sửa `client/src/utils/imageUtils.js`
4. Sửa `client/src/components/Chat/ChatArea.js`
5. Sửa `client/package.json`
6. Sửa `client/capacitor.config.ts`
7. Khởi động lại...

**→ 7 file, mất 10-15 phút, dễ sai sót!**

### ✅ Cách Mới (Tự Động)

1. Sửa `network-config.js` (1 dòng)
2. Chạy `npm run sync-ip`
3. Khởi động lại

**→ 1 file, mất 1 phút, không sai sót!**

---

## 🎓 VÍ DỤ THỰC TẾ

### Tình huống: IP thay đổi từ 192.168.0.102 → 192.168.1.100

```bash
# 1. Mở network-config.js
# Sửa dòng: manualIP: '192.168.1.100',

# 2. Đồng bộ
npm run sync-ip

# 3. Kết quả
🔄 BẮT ĐẦU ĐỒNG BỘ IP...
📡 IP hiện tại: 192.168.1.100
...
✅ Đã cập nhật: 7 file(s)

# 4. Khởi động lại
npm run dev
```

**✅ HOÀN THÀNH!** Tất cả file đã chuyển sang IP mới!

---

## 💡 BEST PRACTICES

### ✅ Nên Làm

1. **Luôn dùng `sync-ip`** thay vì sửa thủ công
2. **Commit `network-config.js`** vào Git
3. **Ignore `.env.local`** trong .gitignore
4. **Đặt IP tĩnh** trong Windows để tránh thay đổi
5. **Chạy `npm run config`** để kiểm tra trước khi khởi động

### ❌ Không Nên Làm

1. ❌ Sửa trực tiếp các file khác (ngoài network-config.js)
2. ❌ Commit file `.env.local` vào Git
3. ❌ Quên chạy `sync-ip` sau khi sửa IP
4. ❌ Dùng IP Router (192.168.0.1) làm server
5. ❌ Để mode = 'auto' nếu có nhiều network adapter

---

## 🆘 HỖ TRỢ

### Câu hỏi thường gặp

**Q: Tôi có nhiều máy tính, làm sao quản lý?**
A: Mỗi máy có file `network-config.js` riêng với IP riêng.

**Q: Deploy lên production thì sao?**
A: Đổi IP thành domain/IP public, mode = 'manual'.

**Q: Có thể dùng domain name không?**
A: Có! Sửa `manualIP: 'api.example.com'` (không cần http://)

**Q: Làm sao backup cấu hình?**
A: Copy file `network-config.js` ra ngoài.

---

## 📝 CHANGELOG

### Version 2.0 (Current)
- ✅ Hệ thống cấu hình trung tâm
- ✅ Script tự động đồng bộ
- ✅ Hỗ trợ auto/manual mode
- ✅ Tạo .env.local tự động

### Version 1.0 (Old)
- ❌ Phải sửa thủ công từng file
- ❌ Dễ sai sót
- ❌ Mất thời gian

---

## 🎉 KẾT LUẬN

Bạn đã hoàn thành thiết lập hệ thống quản lý IP trung tâm!

**Từ giờ, chỉ cần:**
1. Sửa `network-config.js`
2. Chạy `npm run sync-ip`
3. Khởi động lại

**Đơn giản, nhanh chóng, không sai sót!** 🚀

