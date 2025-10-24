# 🎯 HƯỚNG DẪN THAY ĐỔI IP ĐƠN GIẢN

## ⚡ CÁCH DUY NHẤT ĐỂ THAY ĐỔI IP

### CHỈ CẦN 3 BƯỚC - 1 PHÚT XONG!

---

## 📝 BƯỚC 1: Mở File Cấu Hình

Mở file: `network-config.js`

Tìm dòng số **24**:

```javascript
manualIP: '192.168.0.102',  // ← CHỈ SỬA DÒNG NÀY!
```

Thay đổi IP:

```javascript
manualIP: 'IP_MỚI_CỦA_BẠN',  // VD: '192.168.1.100'
```

**LƯU FILE** (Ctrl + S)

---

## ⚙️ BƯỚC 2: Chạy Lệnh Đồng Bộ

Mở Terminal/CMD tại thư mục `zalo-clone`:

```bash
npm run sync-ip
```

Kết quả:
```
✅ Đã cập nhật: 7 file(s)
```

**7 file này được tự động cập nhật:**
1. server/config.env
2. client/src/utils/platformConfig.js
3. client/src/utils/imageUtils.js
4. client/src/components/Chat/ChatArea.js
5. client/package.json
6. client/capacitor.config.ts
7. client/.env.local

---

## 🚀 BƯỚC 3: Khởi Động Lại

```bash
npm run dev
```

Hoặc khởi động riêng:

**Terminal 1 - Server:**
```bash
cd server
npm start
```

**Terminal 2 - Client:**
```bash
cd client
npm start
```

---

## ✅ XONG! ĐƠN GIẢN VẬY THÔI!

---

## 🎨 CHẾ ĐỘ TỰ ĐỘNG (Không cần nhập IP)

Nếu muốn **TỰ ĐỘNG** lấy IP WiFi hiện tại:

### Mở file: `network-config.js`

Đổi dòng **21**:

```javascript
mode: 'auto',  // ← Đổi từ 'manual' → 'auto'
```

Rồi chạy:
```bash
npm run sync-ip
```

Script sẽ **TỰ ĐỘNG** phát hiện IP WiFi!

---

## 🔍 KIỂM TRA CẤU HÌNH HIỆN TẠI

```bash
npm run config
```

Kết quả:
```
📡 IP hiện tại: 192.168.0.102
🌐 Client: http://192.168.0.102:3000
🖥️  Server: http://192.168.0.102:5000
🔌 API: http://192.168.0.102:5000/api
```

---

## 🛠️ KIỂM TRA HỆ THỐNG

```bash
npm run check
```

Sẽ kiểm tra:
- ✅ Cấu hình IP có đúng không
- ✅ Tất cả file có cùng IP không
- ✅ Server có đang chạy không
- ✅ Client có đang chạy không
- ✅ Database có kết nối không

---

## 📊 SO SÁNH

### ❌ TRƯỚC ĐÂY (Phức Tạp!)

1. Mở `server/config.env` → Sửa IP
2. Mở `client/src/utils/platformConfig.js` → Sửa IP (2 chỗ)
3. Mở `client/src/utils/imageUtils.js` → Sửa IP (2 chỗ)
4. Mở `client/src/components/Chat/ChatArea.js` → Sửa IP
5. Mở `client/package.json` → Sửa IP
6. Mở `client/capacitor.config.ts` → Sửa IP (4 chỗ)
7. Tạo `client/.env.local` thủ công → Sửa IP (3 chỗ)

**Tổng: 7 file, 15 chỗ cần sửa, mất 15 phút, dễ sai!** ❌

---

### ✅ BÂY GIỜ (Đơn Giản!)

1. Mở `network-config.js` → Sửa 1 dòng
2. Chạy `npm run sync-ip`
3. Khởi động lại

**Tổng: 1 file, 1 dòng, mất 1 phút, tự động 100%!** ✅

---

## 🆘 NẾU GẶP LỖI

### Lỗi: "Cannot find module"

```bash
cd zalo-clone
npm install
```

### Lỗi: "Port 3000 already in use"

```bash
npm run restart-dev
```

### Lỗi: Vẫn login không được

1. Xóa cache browser (Ctrl + Shift + Delete)
2. Hard refresh (Ctrl + F5)
3. Thử Incognito mode

Xem file: `FIX-LOGIN.md`

---

## 💡 CÁC LỆNH THƯỜNG DÙNG

```bash
# Xem IP hiện tại
npm run config

# Thay đổi IP
# (Sửa network-config.js rồi chạy)
npm run sync-ip

# Kiểm tra hệ thống
npm run check

# Khởi động cả server + client
npm run dev

# Restart tất cả
npm run restart-dev
```

---

## 📖 TÀI LIỆU CHI TIẾT

- **QUICK-START-IP.md** - Hướng dẫn nhanh 3 bước
- **QUAN-LY-IP.md** - Hướng dẫn chi tiết đầy đủ
- **FIX-LOGIN.md** - Khắc phục lỗi đăng nhập
- **IP-SUMMARY.txt** - Tổng kết hệ thống

---

## ⭐ VÍ DỤ THỰC TẾ

### Tình huống: IP thay đổi từ .102 → .150

```bash
# 1. Mở network-config.js
# Sửa: manualIP: '192.168.0.150',

# 2. Đồng bộ
npm run sync-ip

# Kết quả:
# ✅ Đã cập nhật: 7 file(s)

# 3. Khởi động
npm run dev

# ✅ XONG! Tất cả đã chuyển sang IP mới!
```

---

## 🎯 GHI NHỚ

### ✅ NÊN LÀM:
- ✅ CHỈ sửa file `network-config.js`
- ✅ LUÔN chạy `npm run sync-ip` sau khi sửa
- ✅ LUÔN restart server & client sau khi sync
- ✅ Kiểm tra bằng `npm run check`

### ❌ KHÔNG NÊN LÀM:
- ❌ Sửa trực tiếp các file khác
- ❌ Quên chạy `npm run sync-ip`
- ❌ Quên restart sau khi sync
- ❌ Commit file `.env.local` vào Git

---

**ĐƠN GIẢN - NHANH CHÓNG - KHÔNG SAI SÓT!** 🚀

---

**Ngày tạo:** 2025-10-24  
**Phiên bản:** 2.0

