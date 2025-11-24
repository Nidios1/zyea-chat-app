# Hướng Dẫn Chạy Server

## Có 2 cách chạy server:

### Cách 1: Dùng Docker MySQL (Khuyến nghị)

1. **Bật Docker Desktop** (nếu chưa bật)
   - Mở Docker Desktop và đợi nó khởi động xong

2. **Chạy MySQL bằng Docker:**
   ```bash
   cd zalo-clone
   docker-compose up -d mysql
   ```
   Hoặc chạy file: `START-ALL-DOCKER.bat`

3. **Kiểm tra MySQL đã chạy:**
   ```bash
   docker ps
   ```
   Bạn sẽ thấy container `zalo-clone-mysql` đang chạy

4. **Chạy server:**
   ```bash
   cd server
   npm start
   ```
   Hoặc:
   ```bash
   npm run dev  # (nếu có nodemon)
   ```

### Cách 2: Dùng XAMPP MySQL

1. **Bật XAMPP và start MySQL:**
   - Mở XAMPP Control Panel
   - Click "Start" cho MySQL

2. **Cập nhật file `server/config.env`:**
   ```
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=        # (để trống nếu không có password)
   DB_NAME=zalo_clone
   ```

3. **Tạo database (nếu chưa có):**
   ```bash
   cd server
   npm run setup-db
   ```

4. **Chạy server:**
   ```bash
   npm start
   ```
   Hoặc chạy file: `START-ALL.bat` (sẽ tự động kiểm tra MySQL và chạy server)

## Kiểm tra server đã chạy:

- Server chạy trên: `http://192.168.0.100:5000` hoặc `http://localhost:5000`
- Kiểm tra bằng cách mở browser và vào: `http://localhost:5000/api/health` (nếu có endpoint này)

## Lưu ý:

- **Nếu dùng Docker MySQL:** Đảm bảo Docker Desktop đang chạy
- **Nếu dùng XAMPP MySQL:** Đảm bảo MySQL service đã start trong XAMPP
- **Port 3306:** Chỉ có thể dùng 1 trong 2 (Docker hoặc XAMPP), không thể dùng cả 2 cùng lúc
- **File config.env:** Đảm bảo cấu hình database đúng với cách bạn chọn (Docker hoặc XAMPP)

## Troubleshooting:

### Lỗi: "Cannot connect to MySQL"
- Kiểm tra MySQL đã chạy chưa: `docker ps` hoặc kiểm tra XAMPP
- Kiểm tra port 3306 có bị chiếm không: `netstat -an | findstr ":3306"`
- Kiểm tra file `config.env` có đúng thông tin không

### Lỗi: "Access denied for user"
- Kiểm tra username/password trong `config.env` có đúng không
- Với Docker: dùng `zalo_user` / `zalo_password` hoặc `root` / `root`
- Với XAMPP: thường là `root` / (để trống)

### Port 5000 đã được sử dụng
- Tìm process đang dùng port 5000: `netstat -ano | findstr ":5000"`
- Kill process đó hoặc đổi PORT trong `config.env`

