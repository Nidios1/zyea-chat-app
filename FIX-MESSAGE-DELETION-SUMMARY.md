# ✅ BÁO CÁO: Sửa Chức Năng Xóa Tin Nhắn

**Ngày**: 2025-10-26  
**Vấn đề**: Xóa tin nhắn không hoạt động đúng - User A xóa nhưng vẫn thấy tin nhắn của User B

---

## 🐛 LỖI PHÁT HIỆN

### Mô tả lỗi
Khi User A xóa lịch sử trò chuyện với User B:
- ❌ User A chỉ xóa được tin nhắn **mà mình đã gửi**
- ❌ User A vẫn thấy tin nhắn **mà User B đã gửi**
- ❌ Logic SAI: Chỉ xóa tin nhắn có `sender_id = current_user`

### Code lỗi (Backend)
```javascript
// File: server/routes/chat.js - Dòng 507-512 (CŨ)
await connection.execute(`
  UPDATE messages 
  SET deleted_for_user = ? 
  WHERE conversation_id = ? AND sender_id = ?
`, [req.user.id, id, req.user.id]);
//                                  ^^^^^^^^^ SAI!
```

### Nguyên nhân
1. Điều kiện `sender_id = ?` chỉ match tin nhắn mà user đó gửi
2. Database schema cũ: field `deleted_for_user INT` chỉ lưu được 1 user_id
3. Không hỗ trợ nhiều người xóa cùng 1 tin nhắn

---

## ✅ GIẢI PHÁP ĐÃ THỰC HIỆN

### 1. Tạo Bảng Mới: `message_deletions`

**File**: `server/config/database.js`

```sql
CREATE TABLE IF NOT EXISTS message_deletions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  message_id INT NOT NULL,
  user_id INT NOT NULL,
  deleted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (message_id) REFERENCES messages(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_message_user_deletion (message_id, user_id)
);
```

**Lợi ích**:
- ✅ Hỗ trợ nhiều người xóa cùng 1 tin nhắn
- ✅ Quan hệ many-to-many giữa messages và users
- ✅ Có thể track được ai xóa tin nhắn nào và khi nào

### 2. Sửa Endpoint GET Messages

**File**: `server/routes/chat.js` - Dòng 129-146

**TRƯỚC**:
```javascript
SELECT m.* 
FROM messages m
WHERE m.conversation_id = ?
```

**SAU**:
```javascript
SELECT m.* 
FROM messages m
LEFT JOIN message_deletions md ON m.id = md.message_id AND md.user_id = ?
WHERE m.conversation_id = ? AND md.id IS NULL
//    ^^^^^^^^^^^^^^^^^ Filter ra tin nhắn đã xóa
```

**Kết quả**: User chỉ thấy tin nhắn chưa bị xóa bởi chính họ

### 3. Sửa Endpoint DELETE Messages

**File**: `server/routes/chat.js` - Dòng 493-524

**TRƯỚC** (SAI):
```javascript
UPDATE messages 
SET deleted_for_user = ? 
WHERE conversation_id = ? AND sender_id = ?
// ❌ Chỉ xóa tin nhắn mình gửi
```

**SAU** (ĐÚNG):
```javascript
INSERT INTO message_deletions (message_id, user_id)
SELECT m.id, ? 
FROM messages m
WHERE m.conversation_id = ?
ON DUPLICATE KEY UPDATE deleted_at = CURRENT_TIMESTAMP
// ✅ Xóa TẤT CẢ tin nhắn trong conversation cho user này
```

**Kết quả**: User A xóa → không thấy tin nhắn nào (cả của A và B)

---

## 📁 FILES ĐÃ THAY ĐỔI

### Backend (Server)

1. **`server/config/database.js`**
   - ✅ Thêm bảng `message_deletions`
   - Dòng 102-113

2. **`server/routes/chat.js`**
   - ✅ Sửa GET `/conversations/:id/messages` (Dòng 129-146)
   - ✅ Sửa DELETE `/conversations/:id/messages` (Dòng 493-524)

### Migration & Testing

3. **`server/migration-add-message-deletions.js`** *(MỚI)*
   - Script để tạo bảng mới cho database đã tồn tại
   - Migrate data từ field cũ `deleted_for_user`

4. **`test-message-deletion.js`** *(MỚI)*
   - Test tự động để verify chức năng
   - Kiểm tra User A xóa không ảnh hưởng User B

5. **`RUN-MIGRATION.bat`** *(MỚI)*
   - Batch script cho Windows để chạy migration dễ dàng

### Documentation

6. **`MESSAGE-DELETION-GUIDE.md`** *(MỚI)*
   - Hướng dẫn đầy đủ về chức năng xóa tin nhắn
   - Cách test và debug

7. **`FIX-MESSAGE-DELETION-SUMMARY.md`** *(MỚI - file này)*
   - Tóm tắt tất cả thay đổi

---

## 🚀 CÁCH SỬ DỤNG

### Bước 1: Chạy Migration

**Windows**:
```bash
RUN-MIGRATION.bat
```

**Linux/Mac**:
```bash
cd server
node migration-add-message-deletions.js
```

### Bước 2: Khởi Động Lại Server

```bash
cd server
npm start
```

### Bước 3: Test Chức Năng

**Tự động**:
```bash
node test-message-deletion.js
```

**Thủ công trên Mobile**:
1. Login 2 users khác nhau
2. Tạo conversation và gửi tin nhắn
3. User A: Menu → "Xóa lịch sử trò chuyện"
4. Verify:
   - User A: Không thấy tin nhắn nào ✅
   - User B: Vẫn thấy đầy đủ tin nhắn ✅

---

## ✅ KẾT QUẢ

### Trước Khi Sửa
- ❌ User A xóa → Vẫn thấy tin nhắn của User B
- ❌ Logic sai: Chỉ xóa tin nhắn mình gửi
- ❌ Schema không hỗ trợ nhiều người xóa

### Sau Khi Sửa
- ✅ User A xóa → Không thấy TIN NHẮN NÀO (cả của A và B)
- ✅ User B không bị ảnh hưởng → Vẫn thấy đầy đủ
- ✅ Cả 2 user có thể xóa độc lập
- ✅ Hỗ trợ soft delete (có thể khôi phục nếu cần)

---

## 🔍 KIỂM TRA DATABASE

### Xem tin nhắn user đã xóa
```sql
SELECT m.content, md.deleted_at 
FROM messages m
JOIN message_deletions md ON m.id = md.message_id
WHERE md.user_id = <user_id>;
```

### Xem ai đã xóa tin nhắn nào
```sql
SELECT u.username, m.content, md.deleted_at
FROM message_deletions md
JOIN users u ON md.user_id = u.id
JOIN messages m ON md.message_id = m.id
WHERE m.conversation_id = <conversation_id>;
```

---

## 📝 GHI CHÚ

1. **Backup Database**: Luôn backup trước khi chạy migration
2. **Compatibility**: Migration tự động migrate data từ field cũ
3. **Performance**: Index đã được tạo cho query nhanh
4. **Soft Delete**: Tin nhắn không bị xóa thực sự khỏi database
5. **Field cũ**: `deleted_for_user` có thể xóa sau khi migrate xong

---

## 🎯 TESTING CHECKLIST

- [x] Tạo bảng `message_deletions`
- [x] Sửa endpoint GET messages để filter
- [x] Sửa endpoint DELETE messages để xóa đúng
- [x] Migration script hoạt động
- [x] Test script viết xong
- [ ] **User cần test thủ công trên mobile**

---

## 📞 HỖ TRỢ

Nếu gặp vấn đề:
1. Kiểm tra logs server
2. Chạy test script để verify
3. Xem file `MESSAGE-DELETION-GUIDE.md` để biết chi tiết

---

**Status**: ✅ HOÀN THÀNH  
**Testing**: ⏳ CẦN USER TEST TRÊN MOBILE  
**Files Changed**: 7 files (2 modified, 5 new)

