# ⚡ QUICK START - Thay Đổi IP Nhanh

## 📍 IP Hiện Tại: `192.168.0.102`

---

## 🚀 CÁCH SỬ DỤNG (3 BƯỚC)

### 1️⃣ Mở file `network-config.js`

Tìm và sửa dòng này:

```javascript
manualIP: '192.168.0.102',  // ← ĐỔI IP Ở ĐÂY
```

### 2️⃣ Chạy lệnh đồng bộ

```bash
cd zalo-clone
npm run sync-ip
```

### 3️⃣ Khởi động lại

```bash
npm run dev
```

---

## ✅ XONG! 

Tất cả 7 file đã được tự động cập nhật:
- ✅ `server/config.env`
- ✅ `client/src/utils/platformConfig.js`
- ✅ `client/src/utils/imageUtils.js`
- ✅ `client/src/components/Chat/ChatArea.js`
- ✅ `client/package.json`
- ✅ `client/capacitor.config.ts`
- ✅ `client/.env.local`

---

## 🎯 CÁC LỆNH HỮU ÍCH

```bash
# Xem cấu hình hiện tại
npm run config

# Đồng bộ IP
npm run sync-ip

# Khởi động server + client
npm run dev
```

---

## 📖 Xem Thêm

- 📘 **Chi tiết:** [QUAN-LY-IP.md](./QUAN-LY-IP.md)
- 📗 **Hướng dẫn IP:** [HUONG-DAN-IP.md](./HUONG-DAN-IP.md)

---

## ⚠️ LƯU Ý QUAN TRỌNG

❌ **KHÔNG** sửa trực tiếp các file khác!  
✅ **CHỈ** sửa file `network-config.js` và chạy `npm run sync-ip`

---

**Đơn giản, nhanh chóng, không sai sót!** 🎉

