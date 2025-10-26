# 🗑️ Hướng Dẫn Xóa Tin Nhắn (Delete For Me)

## 📋 Tổng Quan

Chức năng xóa tin nhắn đã được cải thiện để hoạt động đúng như mong đợi:

- ✅ **Xóa cho bản thân**: Khi người dùng A xóa tin nhắn, chỉ người dùng A không còn thấy tin nhắn đó
- ✅ **Không ảnh hưởng người khác**: Người dùng B vẫn thấy đầy đủ tin nhắn
- ✅ **Hỗ trợ nhiều người xóa**: Cả hai người đều có thể xóa cùng một tin nhắn độc lập

## 🔧 Cài Đặt

### 1. Chạy Migration (Quan Trọng!)

Nếu database của bạn đã tồn tại, cần chạy migration để tạo bảng mới:

```bash
cd server
node migration-add-message-deletions.js
```

Kết quả:
```
🔄 Starting migration: Adding message_deletions table...
✅ Successfully created message_deletions table
✅ Migration completed successfully!
```

### 2. Khởi Động Lại Server

Sau khi chạy migration, khởi động lại server:

```bash
# Trong thư mục server
npm start
```

## 🏗️ Kiến Trúc

### Database Schema

#### Bảng mới: `message_deletions`
```sql
CREATE TABLE message_deletions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  message_id INT NOT NULL,
  user_id INT NOT NULL,
  deleted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (message_id) REFERENCES messages(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_message_user_deletion (message_id, user_id)
);
```

### API Endpoints

#### 1. Lấy Tin Nhắn (GET)
```
GET /api/chat/conversations/:id/messages
```

**Thay đổi**: Tự động lọc ra tin nhắn đã bị xóa bởi user hiện tại

```sql
-- Câu query mới
SELECT m.* 
FROM messages m
LEFT JOIN message_deletions md ON m.id = md.message_id AND md.user_id = ?
WHERE m.conversation_id = ? AND md.id IS NULL
```

#### 2. Xóa Lịch Sử Tin Nhắn (DELETE)
```
DELETE /api/chat/conversations/:id/messages
```

**Thay đổi**: Đánh dấu TẤT CẢ tin nhắn trong conversation là đã xóa cho user hiện tại

```sql
-- Logic mới
INSERT INTO message_deletions (message_id, user_id)
SELECT m.id, ? 
FROM messages m
WHERE m.conversation_id = ?
ON DUPLICATE KEY UPDATE deleted_at = CURRENT_TIMESTAMP
```

## 🧪 Testing

### Tự Động Test

Chạy test script để verify chức năng:

```bash
# Trong thư mục zalo-clone
node test-message-deletion.js
```

**Lưu ý**: Cần cập nhật thông tin user test trong file:
```javascript
const USER_A = {
  username: 'user1',
  password: 'password123'
};

const USER_B = {
  username: 'user2', 
  password: 'password123'
};
```

### Test Thủ Công trên Mobile

1. **Chuẩn bị**:
   - Login với 2 tài khoản khác nhau (User A và User B)
   - Tạo cuộc trò chuyện giữa 2 user
   - Gửi vài tin nhắn qua lại

2. **Test User A xóa tin nhắn**:
   - Trên mobile của User A, mở cuộc trò chuyện
   - Nhấn vào menu (3 chấm) → "Xóa lịch sử trò chuyện"
   - Xác nhận xóa

3. **Verify**:
   - ✅ User A không còn thấy tin nhắn nào
   - ✅ User B vẫn thấy đầy đủ tin nhắn

4. **Test User B xóa tin nhắn**:
   - Trên mobile của User B, làm tương tự
   - ✅ User B không còn thấy tin nhắn
   - ✅ Không ảnh hưởng gì đến User A (đã xóa rồi)

## 📱 Cách Xóa Tin Nhắn trên Mobile

### Trên MobileChatArea

1. Mở cuộc trò chuyện
2. Nhấn vào biểu tượng **⋮** (More) ở góc trên bên phải
3. Chọn "Xóa lịch sử trò chuyện" trong menu
4. Xác nhận xóa

### Trên MobileSidebar

1. Trong danh sách cuộc trò chuyện
2. Swipe sang trái trên conversation
3. Nhấn nút "Xóa"
4. Xác nhận xóa

## 🐛 Lỗi Trước Đây

### Vấn đề
```javascript
// Code CŨ (SAI)
UPDATE messages 
SET deleted_for_user = ? 
WHERE conversation_id = ? AND sender_id = ?
// ❌ Chỉ xóa tin nhắn MÀ USER ĐÃ GỬI
```

**Kết quả sai**: User A xóa tin nhắn nhưng vẫn thấy tin nhắn của User B!

### Giải pháp
```javascript
// Code MỚI (ĐÚNG)
INSERT INTO message_deletions (message_id, user_id)
SELECT m.id, ? 
FROM messages m
WHERE m.conversation_id = ?
// ✅ Đánh dấu TẤT CẢ tin nhắn là đã xóa cho user
```

**Kết quả đúng**: User A xóa → không thấy tin nhắn nào (cả của A và B)

## 🔍 Debug

### Kiểm tra database

```sql
-- Xem tin nhắn đã xóa của user
SELECT m.*, md.deleted_at 
FROM messages m
JOIN message_deletions md ON m.id = md.message_id
WHERE md.user_id = <user_id>;

-- Xem ai đã xóa một tin nhắn cụ thể
SELECT u.username, md.deleted_at
FROM message_deletions md
JOIN users u ON md.user_id = u.id
WHERE md.message_id = <message_id>;
```

### Logs

Server sẽ log khi xóa tin nhắn:
```
Deleted all messages in conversation for user: <user_id>
```

## 📝 Notes

- Xóa tin nhắn là **soft delete** (không xóa thực sự khỏi database)
- Có thể khôi phục nếu cần bằng cách xóa record trong `message_deletions`
- Field cũ `deleted_for_user` trong bảng `messages` có thể được xóa sau khi migrate

## 🎯 Best Practices

1. **Backup database** trước khi chạy migration
2. **Test kỹ** với nhiều scenarios khác nhau
3. **Monitor logs** để đảm bảo không có lỗi
4. **Giáo dục users** về sự khác biệt giữa "Xóa cho tôi" và "Xóa cho mọi người" (nếu implement sau này)

## 🚀 Tương Lai

Có thể thêm các tính năng:
- **Delete for everyone**: Xóa tin nhắn cho cả hai bên (trong vòng X phút)
- **Single message delete**: Xóa từng tin nhắn riêng lẻ (thay vì xóa toàn bộ)
- **Undo delete**: Khôi phục tin nhắn đã xóa (trong thời gian ngắn)

---

**Thực hiện bởi**: AI Assistant  
**Ngày**: 2025-10-26  
**Version**: 1.0

