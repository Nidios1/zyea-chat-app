# 🔧 Sửa Lỗi Feedback Không Hiển Thị Trong Admin

## ✅ Đã Sửa

### 1. **Bảng `feedbacks` đã được tạo**
- Test script đã tạo bảng `feedbacks` thành công
- Bảng có đầy đủ các cột cần thiết
- Đã có 1 feedback test trong database

### 2. **Query hoạt động tốt**
- Test query giống admin API đã thành công
- Tìm thấy feedback trong database
- Query trả về đúng dữ liệu

### 3. **Code tự động tạo bảng**
- `server/routes/feedback.js` - Tự tạo bảng khi submit feedback
- `server/routes/admin.js` - Tự tạo bảng khi admin request feedbacks

## 🔍 Vấn Đề Có Thể Gặp

### 1. **Server chưa được restart**
Sau khi thêm code mới, cần restart server để code có hiệu lực.

**Giải pháp:**
```bash
# Dừng server (Ctrl+C)
# Sau đó chạy lại:
npm start
# hoặc
node server/index.js
```

### 2. **Frontend cache**
Browser/app có thể cache dữ liệu cũ.

**Giải pháp:**
- **Mobile Expo:** Reload app (shake device → Reload)
- **Web:** Hard refresh (Ctrl+Shift+R hoặc Ctrl+F5)
- Clear cache nếu cần

### 3. **Authentication/Authorization**
User phải là admin để xem feedbacks.

**Kiểm tra:**
- User có role = 'admin' không?
- Token có hợp lệ không?
- API endpoint `/api/admin/feedbacks` có được gọi không?

## 🧪 Test Scripts

### Test Database
```bash
cd server
node test-feedback.js
```

### Test API Query
```bash
cd server
node test-feedback-api.js
```

## 📋 Checklist

- [x] Bảng `feedbacks` đã được tạo
- [x] Query hoạt động tốt
- [x] Code tự động tạo bảng
- [ ] Server đã được restart
- [ ] Frontend đã clear cache
- [ ] User là admin
- [ ] Token hợp lệ

## 🚀 Các Bước Tiếp Theo

1. **Restart server:**
   ```bash
   # Dừng server hiện tại (Ctrl+C)
   # Chạy lại server
   npm start
   ```

2. **Reload app:**
   - Mobile: Shake device → Reload
   - Web: Hard refresh (Ctrl+Shift+R)

3. **Kiểm tra lại:**
   - Vào Admin → Tab "Phản hồi"
   - Nên thấy feedback test hoặc feedback đã gửi

4. **Nếu vẫn không thấy:**
   - Kiểm tra console log server khi admin request
   - Kiểm tra network tab trong browser/app
   - Kiểm tra user có phải admin không

## 📝 Logs Cần Kiểm Tra

### Server Logs (khi admin request):
```
📝 Admin get feedbacks - Request received
📝 Admin get feedbacks - Executing query...
📝 Admin get feedbacks - Found: X feedbacks (total: Y)
```

### Server Logs (khi submit feedback):
```
✅ Feedback submitted successfully: { feedbackId: X, userId: Y, type: 'feedback' }
```

## 💡 Lưu Ý

- Bảng `feedbacks` sẽ được tạo tự động khi:
  - User submit feedback lần đầu
  - Admin request feedbacks lần đầu
- Nếu bảng đã tồn tại, code sẽ bỏ qua việc tạo lại
- Feedback test đã được tạo với ID: 1

