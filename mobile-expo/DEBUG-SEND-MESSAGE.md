# 🔍 Debug Guide: Gửi Tin Nhắn Không Được

## 📊 Các Log Đã Thêm

Tôi đã thêm logging chi tiết để debug. Hãy check console logs khi gửi tin nhắn:

### 1. **Khi nhấn nút Send:**
```
🔘 Send button pressed
🔘 Send icon pressed
🔵 handleSend called
```

### 2. **Validation:**
```
⚠️ Cannot send: inputText is empty (nếu input rỗng)
❌ ChatDetailScreen - Cannot send message: missing conversationId
❌ ChatDetailScreen - Cannot send message: missing user ID
```

### 3. **API Request:**
```
📤 API Request: { method, url, hasToken, data }
📤 Sending message via API... { conversationId, content, userId }
```

### 4. **API Response:**
```
✅ API Response: { status, url, data }
✅ Message sent via API successfully
```

### 5. **Socket Emit:**
```
📤 Emitting message via socket for real-time delivery...
⚠️ Socket not connected or missing otherUserId, skipping socket emit
```

### 6. **Errors:**
```
❌ Send message error: ...
❌ Error type: ...
❌ Error response: ...
❌ Error response data: ...
❌ Unauthorized - Token may be expired or invalid
```

## 🔍 Các Vấn Đề Có Thể Xảy Ra

### 1. **Button không trigger**
- Check log: Có thấy "🔘 Send button pressed" không?
- Nếu không → Vấn đề UI/event handling

### 2. **Missing conversationId hoặc user ID**
- Check log: Có thấy "❌ Cannot send message: missing..." không?
- Fix: Đảm bảo navigation params có đủ data

### 3. **API Request không được gửi**
- Check log: Có thấy "📤 API Request" không?
- Nếu không → Có thể bị block ở validation

### 4. **401 Unauthorized**
- Check log: "❌ Unauthorized - Token may be expired"
- Fix: Login lại để refresh token

### 5. **403 Forbidden**
- Check log: "❌ API Error for messages" với status 403
- Fix: Kiểm tra user có phải participant của conversation không

### 6. **500 Server Error**
- Check log: "❌ API Error" với status 500
- Fix: Check server logs để xem lỗi chi tiết

### 7. **Network Error**
- Check log: "❌ Error message: Network Error"
- Fix: 
  - Kiểm tra server có đang chạy không
  - Kiểm tra IP trong constants.ts
  - Kiểm tra firewall

## ✅ Quick Checklist

Khi gửi tin nhắn, check console logs theo thứ tự:

1. [ ] "🔘 Send button pressed" - Button được nhấn
2. [ ] "🔵 handleSend called" - Function được gọi
3. [ ] "📤 API Request" - Request được tạo
4. [ ] "✅ API Response" - Server trả về success
5. [ ] "✅ Message sent via API successfully" - Hoàn tất

Nếu thiếu bước nào, đó là nơi lỗi xảy ra!

## 🔧 Cách Test

1. Mở app và vào chat
2. Mở console/terminal để xem logs
3. Gõ tin nhắn và nhấn Send
4. Xem logs từng bước
5. Copy logs và gửi cho tôi nếu vẫn lỗi

---

**Lưu ý:** Nếu không thấy log nào → Có thể app đã crash hoặc code không chạy được

