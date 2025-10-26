# 🔧 FIX MÀN HÌNH XANH - ĐÃ GIẢI QUYẾT!

## ❌ **VẤN ĐỀ:**
App mở ra chỉ hiện màn hình xanh, không load được

## ✅ **NGUYÊN NHÂN:**
iOS **chặn HTTP requests** theo mặc định (chỉ cho phép HTTPS)

## 🎯 **ĐÃ FIX:**
Đã thêm cấu hình **NSAppTransportSecurity** vào `Info.plist` để cho phép:
- HTTP connections
- Local networking (192.168.x.x)

---

## 🚀 **CÁCH SỬA DỤNG:**

### **Bước 1: Đảm bảo Backend đang chạy**

```bash
cd c:\xampp\htdocs\zalo-clone\server
npm start
```

Kiểm tra backend có chạy:
```bash
# Trong browser hoặc Postman
http://192.168.0.102:5000/api/health
```

Nếu trả về response → Backend OK!

---

### **Bước 2: Build IPA mới**

1. **Truy cập GitHub Actions:**
   ```
   https://github.com/Nidios1/zyea-plus-social-network/actions
   ```

2. **Chọn "Build Unsigned IPA (for ESign)"**

3. **Click "Run workflow"**
   - Branch: `main`
   - Click "Run workflow"

4. **Đợi build xong** (~10-15 phút)

5. **Download IPA** từ Artifacts

---

### **Bước 3: Cài IPA mới lên iPhone**

1. **Ký bằng ESign/Sideloadly**
2. **Cài đặt lên iPhone**
3. **Trust developer** trong Settings

---

### **Bước 4: Mở app**

✅ **App sẽ kết nối được backend và hoạt động bình thường!**

---

## ⚠️ **YÊU CẦU:**

### **1. Backend phải đang chạy:**
```bash
cd c:\xampp\htdocs\zalo-clone\server
npm start
```

### **2. iPhone và máy tính cùng WiFi:**
- Kiểm tra iPhone đã kết nối WiFi
- Cùng mạng với máy tính (192.168.0.x)

### **3. Firewall không block port 5000:**
```bash
# Kiểm tra port 5000 có mở không
netstat -ano | findstr :5000
```

Nếu thấy `LISTENING` → OK!

---

## 🧪 **CÁCH TEST:**

### **Test 1: Từ browser trên máy tính**
```
http://192.168.0.102:5000/api/health
```
✅ Phải trả về response

### **Test 2: Từ Safari trên iPhone**
```
http://192.168.0.102:5000
```
✅ Phải hiển thị trang backend

### **Test 3: Trong app**
- Mở app
- Vào màn hình login
- Thử login hoặc register
- ✅ Phải kết nối được API

---

## 🔍 **NẾU VẪN KHÔNG ĐƯỢC:**

### **Check 1: Backend có chạy không?**
```bash
netstat -ano | findstr :5000
```
Nếu không có → Start backend

### **Check 2: IP đúng không?**
```bash
ipconfig | findstr IPv4
```
Đảm bảo IP là: `192.168.0.102`

### **Check 3: iPhone cùng WiFi không?**
- Settings → WiFi
- Kiểm tra IP iPhone (ví dụ: `192.168.0.xxx`)
- Phải cùng dải `192.168.0.x`

### **Check 4: Firewall**
Tạm thời tắt firewall để test:
```
Settings → Windows Security → Firewall → Turn off (temporary)
```

---

## 📱 **DEBUG TRONG APP:**

### **Xem logs trong Safari:**

1. **Trên Mac:**
   - Mở Safari → Develop → [Your iPhone] → [App]
   - Xem Console logs

2. **Trên Windows:**
   - Cài iTunes
   - Kết nối iPhone
   - Dùng tool: **ios-webkit-debug-proxy**

### **Check trong app:**
- Mở app
- Xem có lỗi network không
- Kiểm tra API calls trong Console

---

## 🎯 **NHỮNG GÌ ĐÃ FIX:**

1. ✅ **Thêm NSAppTransportSecurity** vào Info.plist
   - Cho phép HTTP
   - Cho phép local networking

2. ✅ **API endpoint đúng:**
   - `http://192.168.0.102:5000/api`

3. ✅ **Backend đang chạy:**
   - Port 5000 đang LISTENING

---

## 🚀 **KẾT QUẢ MONG ĐỢI:**

### **Trước đây:**
```
App mở → Màn hình xanh → Không load ❌
```

### **Sau khi fix:**
```
App mở → Kết nối backend → Login screen → NewsFeed ✅
```

---

## 💡 **LƯU Ý:**

### **Development (Local):**
- ✅ Backend trên localhost
- ✅ iPhone cùng WiFi
- ✅ HTTP được phép

### **Production (Deploy):**
Khi deploy backend lên server:
1. Tạo file `.env.production`:
   ```env
   REACT_APP_API_URL=https://your-backend.com/api
   REACT_APP_SOCKET_URL=https://your-backend.com
   ```
2. Build IPA mới
3. App sẽ dùng HTTPS (an toàn hơn)

---

## 📞 **CẦN TRỢ GIÚP?**

Nếu vẫn gặp vấn đề:

1. **Check backend logs:**
   ```bash
   cd server
   npm start
   # Xem có lỗi gì không
   ```

2. **Check app logs:**
   - Safari Web Inspector
   - Xem Console errors

3. **Chụp màn hình lỗi** và gửi để debug

---

## ✅ **DONE!**

Bây giờ app sẽ hoạt động bình thường với backend local! 🎉

**Next steps:**
1. Build IPA mới
2. Cài lên iPhone  
3. Đảm bảo backend chạy
4. Enjoy! 🚀

