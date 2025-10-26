# 📱 Hướng Dẫn Test Chức Năng Xóa Tin Nhắn Trên Mobile

## ✅ Đã Hoàn Thành

- ✅ Migration đã chạy thành công
- ✅ Bảng `message_deletions` đã được tạo
- ✅ Backend đã được cập nhật
- ✅ Logic xóa tin nhắn đã được sửa

## 🧪 CÁCH TEST TRÊN MOBILE

### Bước 1: Chuẩn Bị

#### A. Khởi động lại Server (nếu đang chạy)
```bash
# Dừng server hiện tại (Ctrl+C)
# Sau đó khởi động lại:
cd C:\xampp\htdocs\zalo-clone\server
npm start
```

#### B. Chuẩn bị 2 tài khoản test
- **User A**: Ví dụ: `user1` / `password123`
- **User B**: Ví dụ: `user2` / `password123`

### Bước 2: Test Scenario

#### Scenario 1: User A xóa tin nhắn

1. **Login User A trên điện thoại 1** (hoặc browser mobile)
   - Mở app mobile
   - Login với tài khoản User A

2. **Login User B trên điện thoại 2** (hoặc browser khác)
   - Mở app mobile
   - Login với tài khoản User B

3. **Gửi tin nhắn qua lại**
   - User A gửi: "Chào B, đây là tin nhắn từ A"
   - User B gửi: "Chào A, đây là tin nhắn từ B"
   - User A gửi: "Tin nhắn thứ 2 từ A"
   - User B gửi: "Tin nhắn thứ 2 từ B"

4. **User A xóa lịch sử trò chuyện**
   - Trên điện thoại của User A:
   - Mở conversation với User B
   - Nhấn vào icon **⋮** (3 chấm) ở góc trên bên phải
   - Chọn "**Xóa lịch sử trò chuyện**"
   - Nhấn **Xác nhận**

5. **Kiểm tra kết quả**

   **Trên điện thoại User A:**
   - ✅ KHÔNG thấy tin nhắn nào cả
   - ✅ Conversation vẫn còn trong danh sách (nếu có)
   - ✅ Có thể gửi tin nhắn mới

   **Trên điện thoại User B:**
   - ✅ VẪN thấy TẤT CẢ tin nhắn cũ:
     - "Chào B, đây là tin nhắn từ A"
     - "Chào A, đây là tin nhắn từ B"
     - "Tin nhắn thứ 2 từ A"
     - "Tin nhắn thứ 2 từ B"
   - ✅ KHÔNG bị ảnh hưởng gì

### Bước 3: Test Reverse (User B xóa)

1. **User B xóa lịch sử trò chuyện**
   - Trên điện thoại của User B
   - Làm tương tự như User A đã làm

2. **Kiểm tra kết quả**
   
   **Trên điện thoại User B:**
   - ✅ KHÔNG thấy tin nhắn nào

   **Trên điện thoại User A:**
   - ✅ Vẫn KHÔNG thấy tin nhắn (vì A đã xóa trước đó)

### Bước 4: Test Gửi Tin Nhắn Mới Sau Khi Xóa

1. **User A gửi tin nhắn mới**: "Tin nhắn mới sau khi xóa"

2. **Kiểm tra**:
   - User A: Chỉ thấy tin nhắn mới
   - User B: Chỉ thấy tin nhắn mới (vì B đã xóa lịch sử cũ)

## 📋 Checklist Test

### Test Case 1: Xóa tin nhắn cho bản thân
- [ ] User A xóa lịch sử → User A không thấy tin nhắn
- [ ] User B không bị ảnh hưởng → User B vẫn thấy đầy đủ

### Test Case 2: Xóa cả 2 bên
- [ ] User A xóa lịch sử
- [ ] User B xóa lịch sử
- [ ] Cả 2 đều không thấy tin nhắn cũ
- [ ] Cả 2 vẫn có thể gửi tin nhắn mới

### Test Case 3: Xóa và gửi tin nhắn mới
- [ ] User A xóa lịch sử
- [ ] User A gửi tin nhắn mới
- [ ] User A chỉ thấy tin nhắn mới
- [ ] User B thấy cả tin nhắn cũ và mới

### Test Case 4: Xóa conversation từ sidebar
- [ ] Swipe conversation sang trái
- [ ] Nhấn "Xóa"
- [ ] Conversation biến mất khỏi danh sách
- [ ] User kia không bị ảnh hưởng

## 🐛 Nếu Có Lỗi

### Lỗi: Vẫn thấy tin nhắn sau khi xóa

**Nguyên nhân có thể**:
1. Server chưa restart sau migration
2. Cache browser/app chưa clear
3. Migration chưa chạy

**Giải quyết**:
```bash
# 1. Restart server
cd C:\xampp\htdocs\zalo-clone\server
# Ctrl+C để dừng
npm start

# 2. Clear cache mobile
- Đóng app hoàn toàn
- Mở lại app
- Hoặc clear app data

# 3. Kiểm tra migration
cd C:\xampp\htdocs\zalo-clone\server
node verify-migration.js
```

### Lỗi: User B cũng mất tin nhắn

**Nguyên nhân**: Có vấn đề với code backend

**Giải quyết**: Kiểm tra log server để xem lỗi gì

## 📊 Kết Quả Mong Đợi

| Hành động | User A thấy | User B thấy |
|-----------|-------------|-------------|
| Ban đầu | 4 tin nhắn | 4 tin nhắn |
| A xóa lịch sử | 0 tin nhắn | 4 tin nhắn |
| B xóa lịch sử | 0 tin nhắn | 0 tin nhắn |
| A gửi tin mới | 1 tin nhắn (mới) | 1 tin nhắn (mới) |

## 🎯 Điểm Quan Trọng

✅ **"Xóa cho tôi"** - Chỉ xóa cho người xóa  
✅ **Không ảnh hưởng người khác** - User kia vẫn thấy đầy đủ  
✅ **Soft delete** - Tin nhắn vẫn còn trong database  
✅ **Có thể gửi tin mới** - Sau khi xóa vẫn chat bình thường  

## 📞 Báo Cáo Kết Quả

Sau khi test xong, hãy báo cáo kết quả:
- ✅ Pass: Tất cả test case đều đúng
- ❌ Fail: Ghi rõ test case nào bị lỗi và hiện tượng gì

---

**Chúc may mắn! 🚀**

