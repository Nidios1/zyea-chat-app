# 💬 Zyea+ - Real-time Chat Application

Một ứng dụng chat real-time được xây dựng với React, Node.js, Express, MySQL và Socket.io, có thể build thành mobile app với Capacitor.

## 🚀 Tính năng

- ✅ **Đăng ký/Đăng nhập** với xác thực JWT
- ✅ **Chat real-time** với Socket.io
- ✅ **Giao diện thân thiện** giống Zalo
- ✅ **Tìm kiếm người dùng** để bắt đầu cuộc trò chuyện
- ✅ **Lưu trữ tin nhắn** trong MySQL
- ✅ **Trạng thái online/offline** của người dùng
- ✅ **Responsive design** cho mobile và desktop

## 🛠️ Công nghệ sử dụng

### Frontend
- React 18
- React Router DOM
- Styled Components
- Socket.io Client
- Axios
- React Icons
- React Toastify

### Backend
- Node.js
- Express.js
- MySQL2
- Socket.io
- JWT (jsonwebtoken)
- Bcryptjs
- CORS
- Express Validator

## 📋 Yêu cầu hệ thống

- Node.js (v14 trở lên)
- MySQL (v5.7 trở lên)
- npm hoặc yarn

## 🔧 Cài đặt

### 1. Clone repository

```bash
git clone <repository-url>
cd zalo-clone
```

### 2. Cài đặt dependencies

```bash
# Cài đặt tất cả dependencies
npm run install-all

# Hoặc cài đặt từng phần
npm install
cd server && npm install
cd ../client && npm install
```

### 3. Cấu hình Database

1. Tạo database MySQL:
```sql
CREATE DATABASE zalo_clone;
```

2. Cập nhật cấu hình database trong `server/config.env`:
```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=zalo_clone
```

### 4. Cấu hình JWT Secret

Cập nhật `JWT_SECRET` trong `server/config.env`:
```env
JWT_SECRET=your_super_secret_jwt_key_here
```

### 5. Chạy ứng dụng

```bash
# Chạy cả frontend và backend
npm run dev

# Hoặc chạy riêng lẻ
npm run server  # Backend trên port 5000
npm run client  # Frontend trên port 3000
```

## 📁 Cấu trúc thư mục

```
zalo-clone/
├── client/                 # React frontend
│   ├── public/
│   ├── src/
│   │   ├── components/     # React components
│   │   │   ├── Auth/       # Login/Register components
│   │   │   └── Chat/       # Chat components
│   │   ├── contexts/       # React contexts
│   │   ├── hooks/          # Custom hooks
│   │   ├── utils/          # Utility functions
│   │   └── App.js
│   └── package.json
├── server/                 # Node.js backend
│   ├── config/            # Database configuration
│   ├── middleware/        # Express middleware
│   ├── routes/            # API routes
│   │   ├── auth.js        # Authentication routes
│   │   ├── users.js       # User management routes
│   │   └── chat.js        # Chat routes
│   ├── index.js           # Server entry point
│   └── package.json
└── package.json           # Root package.json
```

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/register` - Đăng ký tài khoản
- `POST /api/auth/login` - Đăng nhập
- `POST /api/auth/logout` - Đăng xuất

### Users
- `GET /api/users/profile` - Lấy thông tin profile
- `PUT /api/users/profile` - Cập nhật profile
- `GET /api/users/search?query=` - Tìm kiếm người dùng
- `GET /api/users/friends` - Lấy danh sách bạn bè

### Chat
- `GET /api/chat/conversations` - Lấy danh sách cuộc trò chuyện
- `POST /api/chat/conversations` - Tạo cuộc trò chuyện mới
- `GET /api/chat/conversations/:id/messages` - Lấy tin nhắn
- `POST /api/chat/conversations/:id/messages` - Gửi tin nhắn

## 🔌 Socket.io Events

### Client to Server
- `join` - Tham gia phòng chat
- `sendMessage` - Gửi tin nhắn
- `typing` - Trạng thái đang gõ

### Server to Client
- `receiveMessage` - Nhận tin nhắn mới
- `userTyping` - Người dùng đang gõ

## 🎨 Giao diện

Ứng dụng có giao diện hiện đại với:
- **Sidebar**: Danh sách cuộc trò chuyện
- **Chat Area**: Khu vực chat chính
- **User Search**: Tìm kiếm người dùng
- **Responsive**: Tương thích mobile và desktop

## 🔒 Bảo mật

- Xác thực JWT cho tất cả API endpoints
- Mã hóa mật khẩu với bcrypt
- Validation đầu vào với express-validator
- CORS được cấu hình đúng cách

## 🚀 Deployment

### Frontend (React)
```bash
cd client
npm run build
# Upload thư mục build/ lên hosting
```

### Backend (Node.js)
```bash
cd server
npm start
# Hoặc sử dụng PM2 cho production
pm2 start index.js --name "zalo-clone-api"
```

### Database
- Sử dụng MySQL hosting hoặc cloud database
- Cập nhật connection string trong config.env

## 🐛 Troubleshooting

### Lỗi kết nối database
- Kiểm tra MySQL service đang chạy
- Xác nhận thông tin kết nối trong config.env
- Đảm bảo database đã được tạo

### Lỗi Socket.io
- Kiểm tra port 5000 không bị chiếm dụng
- Xác nhận CORS configuration
- Kiểm tra firewall settings

### Lỗi build React
- Xóa node_modules và package-lock.json
- Chạy `npm install` lại
- Kiểm tra Node.js version

## 📝 License

MIT License - Xem file LICENSE để biết thêm chi tiết.

## 🤝 Contributing

1. Fork repository
2. Tạo feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Mở Pull Request

## 📞 Support

Nếu gặp vấn đề, vui lòng tạo issue trên GitHub hoặc liên hệ qua email.

---

**Lưu ý**: Đây là dự án demo, không sử dụng cho mục đích thương mại mà không có sự cho phép.
