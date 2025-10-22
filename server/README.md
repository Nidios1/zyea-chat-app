# Zalo Clone - Backend Server

Backend API server cho ứng dụng chat Zalo Clone, được xây dựng với Node.js, Express, MySQL và Socket.io.

## 🚀 Khởi chạy nhanh

```bash
# Cài đặt dependencies
npm install

# Cấu hình database trong config.env
# Chạy server
npm run dev
```

Server sẽ chạy trên `http://localhost:5000`

## 📁 Cấu trúc thư mục

```
server/
├── config/
│   └── database.js          # Cấu hình MySQL
├── middleware/
│   └── auth.js              # JWT authentication middleware
├── routes/
│   ├── auth.js              # Authentication routes
│   ├── users.js             # User management routes
│   └── chat.js              # Chat routes
├── index.js                 # Server entry point
├── config.env               # Environment variables
└── package.json
```

## 🔧 Cấu hình

### Environment Variables

Tạo file `config.env` với nội dung:

```env
PORT=5000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=zalo_clone
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRES_IN=7d
```

### Database Setup

Server sẽ tự động tạo các bảng cần thiết khi khởi động:

- `users` - Thông tin người dùng
- `conversations` - Cuộc trò chuyện
- `conversation_participants` - Thành viên cuộc trò chuyện
- `messages` - Tin nhắn
- `friends` - Danh sách bạn bè

## 🔌 API Endpoints

### Authentication

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/auth/register` | Đăng ký tài khoản | ❌ |
| POST | `/api/auth/login` | Đăng nhập | ❌ |
| POST | `/api/auth/logout` | Đăng xuất | ❌ |

### Users

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/users/profile` | Lấy thông tin profile | ✅ |
| PUT | `/api/users/profile` | Cập nhật profile | ✅ |
| GET | `/api/users/search` | Tìm kiếm người dùng | ✅ |
| GET | `/api/users/friends` | Lấy danh sách bạn bè | ✅ |
| POST | `/api/users/friends/request` | Gửi lời mời kết bạn | ✅ |
| PUT | `/api/users/friends/accept` | Chấp nhận lời mời kết bạn | ✅ |

### Chat

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/chat/conversations` | Lấy danh sách cuộc trò chuyện | ✅ |
| POST | `/api/chat/conversations` | Tạo cuộc trò chuyện mới | ✅ |
| GET | `/api/chat/conversations/:id/messages` | Lấy tin nhắn | ✅ |
| POST | `/api/chat/conversations/:id/messages` | Gửi tin nhắn | ✅ |

## 🔌 Socket.io Events

### Client to Server

- `join` - Tham gia phòng chat cá nhân
- `sendMessage` - Gửi tin nhắn real-time
- `typing` - Thông báo đang gõ

### Server to Client

- `receiveMessage` - Nhận tin nhắn mới
- `userTyping` - Thông báo người dùng đang gõ

## 🔒 Authentication

Sử dụng JWT (JSON Web Token) cho xác thực:

```javascript
// Header cần thiết cho các API yêu cầu auth
Authorization: Bearer <jwt_token>
```

## 📊 Database Schema

### Users Table
```sql
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  full_name VARCHAR(100) NOT NULL,
  avatar VARCHAR(255) DEFAULT NULL,
  phone VARCHAR(20) DEFAULT NULL,
  status ENUM('online', 'offline', 'away') DEFAULT 'offline',
  last_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### Messages Table
```sql
CREATE TABLE messages (
  id INT AUTO_INCREMENT PRIMARY KEY,
  conversation_id INT,
  sender_id INT,
  content TEXT NOT NULL,
  message_type ENUM('text', 'image', 'file') DEFAULT 'text',
  file_url VARCHAR(255) DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
  FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE
);
```

## 🛠️ Development

### Scripts

```bash
npm start          # Chạy production
npm run dev        # Chạy development với nodemon
```

### Dependencies

- **express** - Web framework
- **mysql2** - MySQL client
- **socket.io** - Real-time communication
- **jsonwebtoken** - JWT authentication
- **bcryptjs** - Password hashing
- **cors** - Cross-origin resource sharing
- **express-validator** - Input validation
- **dotenv** - Environment variables

## 🐛 Debugging

### Logs

Server logs được in ra console. Để debug:

1. Kiểm tra console output
2. Sử dụng `console.log()` trong code
3. Kiểm tra database connections

### Common Issues

1. **Database connection failed**
   - Kiểm tra MySQL service
   - Xác nhận credentials trong config.env

2. **JWT errors**
   - Kiểm tra JWT_SECRET đã được set
   - Xác nhận token format

3. **Socket.io connection issues**
   - Kiểm tra CORS settings
   - Xác nhận port không bị chặn

## 🚀 Production Deployment

### Environment Setup

```env
NODE_ENV=production
PORT=5000
DB_HOST=your_production_db_host
DB_USER=your_production_db_user
DB_PASSWORD=your_production_db_password
DB_NAME=zalo_clone
JWT_SECRET=your_very_secure_jwt_secret
```

### PM2 Setup

```bash
# Cài đặt PM2
npm install -g pm2

# Chạy với PM2
pm2 start index.js --name "zalo-clone-api"

# Auto restart
pm2 startup
pm2 save
```

### Nginx Configuration

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## 📈 Monitoring

### Health Check

```bash
curl http://localhost:5000/api/health
```

### Database Monitoring

```sql
-- Kiểm tra số lượng users
SELECT COUNT(*) FROM users;

-- Kiểm tra số lượng messages
SELECT COUNT(*) FROM messages;

-- Kiểm tra conversations
SELECT COUNT(*) FROM conversations;
```

## 🔧 Configuration

### CORS Settings

```javascript
app.use(cors({
  origin: "http://localhost:3000", // Frontend URL
  methods: ["GET", "POST"],
  credentials: true
}));
```

### Socket.io Configuration

```javascript
const io = socketIo(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});
```

## 📝 API Examples

### Register User

```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "password123",
    "fullName": "Test User"
  }'
```

### Login

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

### Send Message

```bash
curl -X POST http://localhost:5000/api/chat/conversations/1/messages \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <jwt_token>" \
  -d '{
    "content": "Hello world!",
    "messageType": "text"
  }'
```

---

**Backend server đã sẵn sàng! 🚀**
