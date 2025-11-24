# Hướng dẫn sửa lỗi Reaction Picker

## Vấn đề
Lỗi 500 hoặc timeout khi ấn các nút reaction (Like, Love, Care, Haha, Wow, Sad, Angry)

## Nguyên nhân
Bảng `post_likes` thiếu cột `reaction_type` trong database

## Cách sửa

### Bước 1: Chạy migration script
```bash
cd server
node add_reaction_type_column.js
```

### Bước 2: Restart server
- Dừng server hiện tại (Ctrl+C)
- Khởi động lại server:
  ```bash
  npm start
  ```
  hoặc
  ```bash
  npm run dev
  ```

### Bước 3: Kiểm tra
- Thử like một post
- Thử chọn các reaction khác nhau
- Kiểm tra console log của server để xem có lỗi không

## Nếu vẫn lỗi

1. Kiểm tra database connection:
   - Đảm bảo MySQL đang chạy
   - Kiểm tra file `config.env` có đúng thông tin database không

2. Kiểm tra server logs:
   - Xem console của server có hiển thị lỗi gì không
   - Tìm các dòng có `❌ [Like Post] Error`

3. Kiểm tra cột đã được thêm chưa:
   ```sql
   DESCRIBE post_likes;
   ```
   Phải thấy cột `reaction_type` trong kết quả

## Lưu ý
- Script migration đã được chạy và cột đã tồn tại
- Chỉ cần restart server là có thể sử dụng được

