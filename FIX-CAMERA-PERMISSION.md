# 🎥 Cách Khắc Phục Lỗi Camera/Microphone Permission

## ❌ Lỗi Hiện Tại
```
Không thể truy cập camera/microphone. Vui lòng kiểm tra quyền truy cập.
```

## ✅ Giải Pháp

### 1. Cấp Quyền Trình Duyệt

#### Trên Chrome/Edge:
1. Click vào icon **🔒 (khóa)** hoặc **🎥 (camera)** bên trái thanh địa chỉ
2. Tìm mục **Camera** và **Microphone**
3. Chọn **"Allow"** (Cho phép)
4. Reload lại trang (F5)

#### Trên Firefox:
1. Click vào icon **🔒** bên trái thanh địa chỉ
2. Click **"Connection Secure"** → **"More Information"**
3. Tab **"Permissions"**
4. Tìm **Camera** và **Microphone**
5. Bỏ check **"Use Default"** và chọn **"Allow"**
6. Reload lại trang

### 2. Kiểm Tra Thiết Bị

```bash
# Kiểm tra xem camera/mic có hoạt động không
# Vào Settings → Privacy & Security → Camera/Microphone
```

**Đảm bảo:**
- ✅ Camera đã được cắm đúng (nếu là camera rời)
- ✅ Không có ứng dụng nào khác đang dùng camera (Zoom, Teams, Skype...)
- ✅ Driver camera đã được cài đặt

### 3. Test Trên Trang Test

Để test xem camera/mic có hoạt động không:
1. Vào: https://www.onlinemictest.com/
2. Hoặc: https://webcamtests.com/

## 📱 Về Giao Diện Cuộc Gọi Đến

### ✅ Đã Implement Đầy Đủ:

```
┌────────────────────────────────┐
│                                │
│         [Avatar người gọi]     │
│         (animation pulse)      │
│                                │
│      👤 Nguyễn Văn A          │
│   📞 Cuộc gọi video đến...    │
│                                │
│   [✅ Chấp nhận]  [❌ Từ chối] │
│                                │
└────────────────────────────────┘
```

**Tính năng:**
- ✅ Hiển thị avatar người gọi với hiệu ứng pulse
- ✅ Hiển thị tên đầy đủ người gọi
- ✅ Hiển thị loại cuộc gọi (video/thoại)
- ✅ 2 nút to: Chấp nhận (xanh) và Từ chối (đỏ)
- ✅ Màn hình full overlay với gradient đẹp
- ✅ Animation fade in mượt mà
- ✅ Responsive cho cả mobile và desktop

## 🧪 Cách Test Cuộc Gọi Đến

### Bước 1: Mở 2 Tab/Trình Duyệt
```bash
# Tab 1 - User A
http://192.168.0.102:3000
Login: user_a

# Tab 2 - User B  
http://192.168.0.102:3000
Login: user_b
```

### Bước 2: Cho Phép Camera/Mic
- ✅ Tab 1: Cho phép camera + mic
- ✅ Tab 2: Cho phép camera + mic

### Bước 3: Test Gọi Video
1. **Tab 1 (User A):**
   - Mở chat với User B
   - Click nút **📹 (Gọi video)** góc trên phải
   - Màn hình sẽ hiện "Đang kết nối..."

2. **Tab 2 (User B):**
   - Màn hình sẽ tự động hiện cuộc gọi đến
   - Thấy avatar + tên User A
   - Thấy text "Cuộc gọi video đến..."
   - Click **"Chấp nhận"** để nghe

3. **Kết quả:**
   - ✅ Cả 2 thấy video của nhau
   - ✅ Nghe thấy tiếng của nhau
   - ✅ Có thể tắt/bật mic, camera
   - ✅ Hiển thị thời gian cuộc gọi

### Bước 4: Test Gọi Thoại
- Tương tự nhưng click nút **📞 (Gọi thoại)**
- Chỉ có audio, không có video

### Bước 5: Test Từ Chối
1. User A gọi User B
2. User B click **"Từ chối"**
3. User A sẽ thấy cuộc gọi bị kết thúc

## 🎨 UI Screenshots

### Màn Hình Gọi Video Đi:
```
┌────────────────────────────────┐
│  👤 Nguyễn Văn A              │
│  🔄 Đang kết nối...           │
│                                │
│  [████████████████████████]   │ ← Video remote
│  [▓▓▓▓▓]                      │ ← Video local (góc)
│                                │
│  [🎤] [📹] [📞 Đỏ]            │ ← Controls
└────────────────────────────────┘
```

### Màn Hình Cuộc Gọi Đến:
```
┌────────────────────────────────┐
│  [Gradient Purple Background] │
│                                │
│       ⭕ [Avatar]             │
│       (pulse animation)        │
│                                │
│     👤 Nguyễn Văn A          │
│   📞 Cuộc gọi video đến...   │
│                                │
│  [✅ Chấp nhận] [❌ Từ chối]  │
│                                │
└────────────────────────────────┘
```

### Màn Hình Đang Gọi:
```
┌────────────────────────────────┐
│  👤 Nguyễn Văn A    ⏱ 02:35  │
│  ✅ Đang gọi                  │
│                                │
│  [████████████████████████]   │
│  [████]                        │
│                                │
│  [🎤] [📹] [📞]               │
└────────────────────────────────┘
```

## 🚀 Hướng Dẫn Chạy

```bash
# Terminal 1 - Server
cd zalo-clone/server
npm start

# Terminal 2 - Client  
cd zalo-clone/client
npm start
```

## ⚠️ Lưu Ý Quan Trọng

### 1. Localhost vs IP
- ✅ **localhost:3000** - Trình duyệt cho phép camera/mic
- ✅ **192.168.x.x:3000** - Cần HTTPS hoặc manually allow
- ❌ **HTTP qua IP** - Một số trình duyệt có thể block

### 2. Camera/Mic Đang Được Dùng
Nếu gặp lỗi "TrackStartError":
- Đóng tất cả ứng dụng dùng camera (Zoom, Teams, Skype)
- Đóng tất cả tab khác đang dùng camera
- Restart trình duyệt

### 3. Không Có Camera
Nếu máy không có camera:
- Chỉ test **gọi thoại** (audio only)
- Hoặc dùng virtual camera (OBS, ManyCam)

## 📞 Test Nhanh

```javascript
// Mở Console (F12) và chạy để test camera/mic
navigator.mediaDevices.getUserMedia({ video: true, audio: true })
  .then(stream => {
    console.log('✅ Camera/Mic OK!');
    stream.getTracks().forEach(track => track.stop());
  })
  .catch(error => {
    console.error('❌ Lỗi:', error.name, error.message);
  });
```

## 🎉 Kết Luận

**UI Cuộc Gọi Đến đã được implement hoàn chỉnh** với:
- ✅ Giao diện đẹp giống Zalo
- ✅ Animation mượt mà
- ✅ 2 nút Chấp nhận / Từ chối rõ ràng
- ✅ Responsive mobile + desktop
- ✅ Error handling tốt

**Chỉ cần fix quyền camera/mic là có thể test ngay!** 🚀

