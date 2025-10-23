# 💬 Zyea+ – Kết Nối Mọi Khoảnh Khắc

Trò chuyện chưa bao giờ nhanh, mượt và gần gũi đến thế!  
Ứng dụng chat real-time mang đến cho bạn **trải nghiệm trò chuyện tức thì**, hiện đại và đầy cảm xúc – nơi mọi cuộc trò chuyện trở nên sống động như thật 💖

---

## 🚀 Tính năng

✨ **Chat tức thì – Không độ trễ:** Gửi và nhận tin nhắn ngay trong tích tắc với Socket.IO  
🔒 **Đăng nhập an toàn:** Bảo mật thông tin tuyệt đối với JWT authentication  
👀 **Trạng thái online/offline:** Biết ngay ai đang sẵn sàng trò chuyện  
🔍 **Tìm kiếm bạn bè:** Dễ dàng kết nối và bắt đầu cuộc trò chuyện mới  
💾 **Lưu trữ thông minh:** Giữ lại mọi kỷ niệm, tin nhắn được lưu trữ an toàn trên MySQL  
📱 **Thiết kế hiện đại:** Giao diện thân thiện, tối ưu cho mọi thiết bị  
🌙 **Dark Mode:** Chế độ tối bảo vệ mắt  
📸 **Chia sẻ hình ảnh:** Upload và chia sẻ ảnh trong chat  
🔔 **Thông báo real-time:** Nhận thông báo ngay lập tức  

---

## 🛠️ Tech Stack

### Frontend
- ⚛️ **React.js** - UI framework
- 🎨 **Styled Components** - CSS-in-JS
- 🔌 **Socket.IO Client** - Real-time communication
- 📱 **Capacitor** - Native mobile wrapper (iOS & Android)
- 🎯 **Axios** - HTTP client
- 🚀 **React Router** - Navigation

### Backend
- 🟢 **Node.js & Express** - Server framework
- 🔌 **Socket.IO** - WebSocket server
- 🗄️ **MySQL** - Database
- 🔐 **JWT** - Authentication
- 📁 **Multer** - File upload handling

---

## 📱 Hỗ trợ Đa nền tảng

- ✅ **Web (PWA)** — Chạy trên mọi trình duyệt hiện đại
- ✅ **Android** — Native app với Capacitor
- ✅ **iOS** — Native app với Capacitor
- 🔔 **Push Notifications** — Thông báo đẩy trên mobile
- 📲 **Offline Support** — Lưu trữ offline với Service Worker

---

## 🚀 Hướng dẫn Cài đặt

### Yêu cầu
- Node.js 16+ 
- MySQL 8.0+
- npm hoặc yarn

### 1. Clone Repository
```bash
git clone https://github.com/your-username/zyea-chat-app.git
cd zyea-chat-app
```

### 2. Cài đặt Backend
```bash
cd server
npm install

# Tạo file config
cp config.env.example config.env

# Cập nhật thông tin database trong config.env
# DB_HOST=localhost
# DB_USER=root
# DB_PASSWORD=your_password
# DB_NAME=zalo_clone
# JWT_SECRET=your_secret_key
# PORT=5000

# Setup database
npm run setup-db
```

### 3. Cài đặt Frontend
```bash
cd ../client
npm install
```

### 4. Chạy ứng dụng

#### Development Mode
```bash
# Terminal 1 - Start backend
cd server
npm start

# Terminal 2 - Start frontend
cd client
npm start
```

Mở trình duyệt: `http://localhost:3000`

#### Production Mode
```bash
# Build frontend
cd client
npm run build

# Backend sẽ serve static files từ build/
cd ../server
npm start
```

---

## 📱 Build Mobile App

### Android APK
```bash
cd client
npm run build
npx cap add android
npx cap sync android
npx cap open android
# Build APK trong Android Studio
```

### iOS IPA
Xem hướng dẫn chi tiết trong [BUILD_IPA_GUIDE.md](BUILD_IPA_GUIDE.md)

**Tóm tắt:**
- **Cách 1:** Dùng Codemagic (Cloud Build - Miễn phí)
- **Cách 2:** Build local với Xcode (Cần Mac)
- **Cách 3:** Dùng Ionic Appflow

```bash
cd client
npm run build
npx cap add ios
npx cap sync ios
npx cap open ios
# Archive trong Xcode
```

---

## 📂 Cấu trúc Project

```
zyea-chat-app/
├── client/                 # Frontend React app
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── contexts/      # React contexts
│   │   ├── hooks/         # Custom hooks
│   │   ├── utils/         # Utility functions
│   │   └── styles/        # CSS files
│   ├── public/            # Static assets
│   ├── capacitor.config.ts # Capacitor config
│   └── package.json
│
├── server/                # Backend Node.js
│   ├── routes/           # API routes
│   ├── middleware/       # Express middleware
│   ├── config/           # Configuration
│   ├── index.js          # Server entry point
│   └── package.json
│
├── BUILD_IPA_GUIDE.md    # Hướng dẫn build iOS
├── codemagic.yaml        # CI/CD config
└── README.md             # This file
```

---

## 🔒 Bảo mật

- ✅ JWT-based authentication
- ✅ Password hashing với bcrypt
- ✅ Input validation và sanitization
- ✅ CORS protection
- ✅ SQL injection prevention
- ✅ XSS protection

---

## 🎨 Giao diện

### Desktop
- **Sidebar:** Danh sách cuộc trò chuyện
- **Chat Area:** Khu vực nhắn tin chính
- **User Search:** Tìm kiếm người dùng
- **Profile:** Thông tin cá nhân

### Mobile
- **Bottom Navigation:** Điều hướng nhanh
- **Swipe Gestures:** Vuốt để xem thêm
- **Pull to Refresh:** Kéo để cập nhật
- **Responsive:** Tương thích mọi kích thước màn hình

---

## 📊 Database Schema

### Tables
- `users` - Thông tin người dùng
- `conversations` - Cuộc trò chuyện
- `messages` - Tin nhắn
- `friends` - Quan hệ bạn bè
- `posts` - Bài viết newsfeed
- `notifications` - Thông báo

Chi tiết schema: Xem file `server/setup_database.sql`

---

## 🤝 Đóng góp

Contributions, issues và feature requests đều được chào đón!

1. Fork repo
2. Tạo branch mới (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Mở Pull Request

---

## 📝 License

This project is open source and available under the [MIT License](LICENSE).

---

## 👨‍💻 Author

**Nidios1**
- GitHub: [@Nidios1](https://github.com/Nidios1)

---

## ❤️ Trải nghiệm ngay hôm nay!

Kết nối bạn bè, trò chuyện mọi lúc, mọi nơi – nhanh, an toàn và đầy cảm xúc cùng **Zyea+** 💬  

**Zyea+ – Nơi mọi cuộc trò chuyện bắt đầu.** 🚀
