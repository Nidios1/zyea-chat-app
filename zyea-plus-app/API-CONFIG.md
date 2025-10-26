# 🔧 CẤU HÌNH API CHO APP

## ❌ **VẤN ĐỀ HIỆN TẠI:**

App đang bị màn hình xanh vì không kết nối được backend:
- API URL: `http://192.168.0.102:5000` (Local IP - không truy cập được từ bên ngoài)
- Backend chỉ chạy trên máy local
- iPhone không thể kết nối vào IP local này

---

## ✅ **GIẢI PHÁP:**

### **Option 1: Deploy Backend lên Server (Recommended)**

Backend cần được deploy lên một trong các nền tảng sau:

#### 1. **Render.com** (Free tier available)
```bash
# Deploy backend lên Render
# URL example: https://zyea-backend.onrender.com
```

#### 2. **Railway.app** (Free $5 credit/month)
```bash
# Deploy backend lên Railway
# URL example: https://zyea-backend.up.railway.app
```

#### 3. **Heroku** (Paid)
```bash
# Deploy backend lên Heroku
# URL example: https://zyea-backend.herokuapp.com
```

#### 4. **VPS** (DigitalOcean, AWS, etc.)
```bash
# Deploy backend lên VPS
# URL example: http://45.77.123.456:5000
```

---

### **Option 2: Dùng ngrok (Test nhanh - Không recommended)**

Nếu chỉ muốn test nhanh:

1. **Cài ngrok:**
   ```bash
   # Download từ: https://ngrok.com/
   choco install ngrok
   ```

2. **Chạy backend local:**
   ```bash
   cd c:\xampp\htdocs\zalo-clone\server
   npm start
   ```

3. **Expose qua ngrok:**
   ```bash
   ngrok http 5000
   ```

4. **Lấy URL** (ví dụ: `https://abc123.ngrok.io`)

---

## 🔧 **CÁCH SỬA CẤU HÌNH:**

### **Bước 1: Tạo file .env.production**

Tạo file `.env.production` trong thư mục `zyea-plus-app`:

```env
# Thay YOUR_BACKEND_URL bằng URL thực tế của backend
REACT_APP_API_URL=https://zyea-backend.onrender.com/api
REACT_APP_SOCKET_URL=https://zyea-backend.onrender.com
```

### **Bước 2: Update .gitignore**

Đảm bảo `.gitignore` có dòng này (đã có rồi):
```
.env.production
```

### **Bước 3: Build lại với env**

Workflow GitHub Actions sẽ tự động đọc file `.env.production` khi build.

---

## 🚀 **HƯỚNG DẪN DEPLOY BACKEND NHANH:**

### **Deploy lên Render.com (Miễn phí):**

1. **Tạo tài khoản** tại: https://render.com

2. **New → Web Service**

3. **Connect repository** hoặc deploy từ local

4. **Cấu hình:**
   ```
   Name: zyea-backend
   Environment: Node
   Build Command: cd server && npm install
   Start Command: cd server && npm start
   ```

5. **Environment Variables:**
   ```
   NODE_ENV=production
   MONGODB_URI=your_mongodb_connection_string
   JWT_SECRET=your_secret_key
   PORT=5000
   ```

6. **Deploy** → Lấy URL (vd: `https://zyea-backend.onrender.com`)

7. **Update file .env.production:**
   ```env
   REACT_APP_API_URL=https://zyea-backend.onrender.com/api
   REACT_APP_SOCKET_URL=https://zyea-backend.onrender.com
   ```

---

## 📱 **SAU KHI CẤU HÌNH:**

### **1. Push code với .env.production:**
```bash
cd c:\xampp\htdocs\zalo-clone
git add zyea-plus-app/.env.production
git commit -m "Add production API configuration"
git push origin main
```

### **2. Build lại IPA trên GitHub:**
- Truy cập: https://github.com/Nidios1/zyea-plus-social-network/actions
- Chọn "Build Unsigned IPA (for ESign)"
- Run workflow
- Download IPA mới

### **3. Cài IPA mới lên iPhone**
- Ký bằng ESign/Sideloadly
- Cài đặt
- Mở app → Sẽ kết nối được backend!

---

## 🧪 **TEST KẾT NỐI:**

Sau khi deploy backend, test xem có truy cập được không:

```bash
# Test API
curl https://zyea-backend.onrender.com/api/health

# Hoặc mở trong browser:
https://zyea-backend.onrender.com/api/health
```

Nếu trả về response → Backend OK!

---

## ⚠️ **LƯU Ý:**

### **Render.com Free Tier:**
- ✅ Miễn phí
- ⚠️ Sleep sau 15 phút không dùng
- ⚠️ Restart mất ~30 giây

### **Railway Free Tier:**
- ✅ $5 credit/tháng
- ✅ Không sleep
- ⚠️ Hết credit phải nạp thêm

### **ngrok:**
- ✅ Test nhanh được
- ❌ URL thay đổi mỗi lần restart
- ❌ Không phù hợp production

---

## 🎯 **TÓM TẮT:**

```
Hiện tại: App → http://192.168.0.102:5000 ❌ (Không kết nối được)
            ↓
Cần thay: App → https://zyea-backend.onrender.com ✅ (Kết nối được từ mọi nơi)
```

---

## 📞 **CẦN TRỢ GIÚP?**

Nếu cần deploy backend, cho tôi biết:
1. Bạn muốn dùng nền tảng nào? (Render/Railway/VPS/ngrok)
2. Có MongoDB Atlas chưa? (hoặc dùng MongoDB local?)
3. Có domain riêng không?

Tôi sẽ hướng dẫn chi tiết!

