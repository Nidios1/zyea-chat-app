# 📞 Hướng Dẫn Chức Năng Gọi Điện

## ✨ Tính Năng

Ứng dụng Zalo Clone đã được tích hợp đầy đủ chức năng gọi điện Video/Audio sử dụng WebRTC với các tính năng:

### 🎯 Tính Năng Chính

- ✅ **Gọi Video** - Gọi video trực tiếp với camera và microphone
- ✅ **Gọi Thoại** - Gọi thoại chỉ với audio
- ✅ **Nhận Cuộc Gọi** - Nhận cuộc gọi đến với giao diện đẹp mắt
- ✅ **Điều Khiển Cuộc Gọi**:
  - Tắt/Bật microphone
  - Tắt/Bật camera
  - Thu nhỏ/Phóng to màn hình gọi
  - Kết thúc cuộc gọi
- ✅ **Hiển Thị Thông Tin**:
  - Tên người gọi
  - Trạng thái cuộc gọi (Đang kết nối/Đang gọi)
  - Thời gian gọi
- ✅ **Responsive** - Hoạt động mượt mà trên cả PC và Mobile

## 🚀 Cách Sử Dụng

### Trên PC (Desktop)

1. **Bắt đầu cuộc gọi:**
   - Mở cuộc trò chuyện với người bạn muốn gọi
   - Click vào icon **📞 (Gọi thoại)** hoặc **📹 (Gọi video)** ở góc trên bên phải
   - Chờ người kia chấp nhận cuộc gọi

2. **Nhận cuộc gọi:**
   - Khi có cuộc gọi đến, màn hình sẽ hiển thị thông tin người gọi
   - Click **"Chấp nhận"** để nhận hoặc **"Từ chối"** để từ chối

3. **Trong cuộc gọi:**
   - Click icon **🎤** để tắt/bật microphone
   - Click icon **📹** để tắt/bật camera (chỉ với video call)
   - Click icon **📱** màu đỏ để kết thúc cuộc gọi
   - Click icon **⛶** để thu nhỏ/phóng to màn hình

### Trên Mobile

1. **Bắt đầu cuộc gọi:**
   - Vào tab **"Danh bạ"**
   - Tìm người bạn muốn gọi
   - Click vào icon **📞** hoặc **📹** bên cạnh tên

2. **Nhận cuộc gọi:**
   - Tương tự như PC, chấp nhận hoặc từ chối cuộc gọi

3. **Trong cuộc gọi:**
   - Các nút điều khiển tương tự PC
   - Màn hình tự động full screen trên mobile

## 🔧 Cấu Hình Kỹ Thuật

### WebRTC Configuration

Ứng dụng sử dụng STUN servers của Google:
```javascript
{
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun1.l.google.com:19302' }
  ]
}
```

### Socket Events

Server xử lý các sự kiện sau:
- `call-offer` - Gửi lời mời gọi
- `call-answer` - Phản hồi chấp nhận cuộc gọi
- `ice-candidate` - Trao đổi ICE candidates
- `end-call` - Kết thúc cuộc gọi
- `call-rejected` - Từ chối cuộc gọi

## 📱 Yêu Cầu Hệ Thống

### Trình Duyệt

- ✅ Chrome 56+
- ✅ Firefox 44+
- ✅ Safari 11+
- ✅ Edge 79+
- ✅ Opera 43+

### Quyền Truy Cập

Ứng dụng cần quyền truy cập:
- 🎤 **Microphone** - Cho cả gọi video và gọi thoại
- 📹 **Camera** - Chỉ cho gọi video

### Kết Nối

- 📡 Kết nối internet ổn định
- 🔄 Tốc độ tối thiểu: 1 Mbps upload/download
- 🎯 Khuyến nghị: 3+ Mbps cho video HD

## 🛠️ Cài Đặt & Triển Khai

### 1. Server đã được cập nhật

File `zalo-clone/server/index.js` đã có đầy đủ WebRTC signaling handlers.

### 2. Client đã tích hợp

- Component `VideoCall.js` - Xử lý UI và logic cuộc gọi
- Component `ChatArea.js` - Tích hợp nút gọi cho desktop
- Component `MobileContacts.js` - Tích hợp nút gọi cho mobile

### 3. Chạy Ứng Dụng

```bash
# Terminal 1 - Chạy server
cd zalo-clone/server
npm start

# Terminal 2 - Chạy client
cd zalo-clone/client
npm start
```

## 🔍 Kiểm Tra Chức Năng

### Test Case 1: Gọi Video PC → PC
1. Mở 2 trình duyệt khác nhau
2. Đăng nhập 2 tài khoản khác nhau
3. Người A gọi video cho người B
4. Người B chấp nhận
5. Kiểm tra video/audio hoạt động
6. Test các nút điều khiển
7. Kết thúc cuộc gọi

### Test Case 2: Gọi Thoại PC → Mobile
1. PC đăng nhập tài khoản A
2. Mobile đăng nhập tài khoản B
3. Người A gọi thoại cho người B
4. Người B chấp nhận
5. Kiểm tra audio hoạt động
6. Kết thúc cuộc gọi

### Test Case 3: Từ Chối Cuộc Gọi
1. Người A gọi cho người B
2. Người B click "Từ chối"
3. Người A nhận thông báo cuộc gọi bị từ chối

## 🐛 Xử Lý Lỗi Thường Gặp

### Lỗi: "Không thể truy cập camera/microphone"

**Nguyên nhân:** Trình duyệt không có quyền truy cập thiết bị

**Giải pháp:**
1. Kiểm tra settings trình duyệt
2. Cấp quyền camera/microphone cho website
3. Trên Chrome: Settings → Privacy → Site Settings → Camera/Microphone

### Lỗi: Không kết nối được

**Nguyên nhân:** Firewall hoặc NAT blocking

**Giải pháp:**
1. Kiểm tra firewall
2. Sử dụng TURN server nếu cần (cho production)
3. Kiểm tra kết nối internet

### Lỗi: Audio/Video bị lag

**Nguyên nhân:** Băng thông thấp

**Giải pháp:**
1. Đóng các ứng dụng khác đang dùng mạng
2. Kiểm tra tốc độ internet
3. Chuyển sang gọi thoại nếu video lag

## 🌟 Tính Năng Nâng Cao (Có Thể Thêm)

### Trong Tương Lai

- ⏱️ **Voicemail** - Ghi âm khi không nhận máy
- 👥 **Group Call** - Gọi nhóm đa người
- 🎨 **Virtual Background** - Thay đổi background
- 📸 **Screenshot** - Chụp ảnh trong cuộc gọi
- 📹 **Screen Sharing** - Chia sẻ màn hình
- 🎵 **Audio Effects** - Hiệu ứng âm thanh
- 💬 **In-call Chat** - Chat trong khi gọi
- 📊 **Call Statistics** - Thống kê chất lượng cuộc gọi

## 📞 Hỗ Trợ

Nếu gặp vấn đề, vui lòng:
1. Kiểm tra console log trong trình duyệt (F12)
2. Kiểm tra server logs
3. Đảm bảo socket connection đang hoạt động
4. Kiểm tra quyền truy cập camera/microphone

## 🎉 Hoàn Thành!

Chức năng gọi điện đã được tích hợp hoàn chỉnh cho cả PC và Mobile. Hãy thử nghiệm và tận hưởng!

---

**Phát triển bởi:** Zalo Clone Team  
**Ngày cập nhật:** 2025-10-25  
**Version:** 1.0.0

