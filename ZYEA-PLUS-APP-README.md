# Zyea+ Facebook App

Đây là app Facebook (NewsFeed) riêng biệt, có nút tin nhắn ở góc trên với badge thông báo. Khi click vào nút tin nhắn sẽ mở Messenger app.

## Cấu trúc 2 App

### 1. **Zyea+ Messenger** (client/)
- **App ID**: `com.zyea.hieudev`
- **App Name**: Zyea+
- **URL Scheme**: `zyeamessenger://`
- **Chức năng**: Chat, tin nhắn, danh bạ
- **Icon**: Messenger icon

### 2. **Zyea+ Facebook** (zyea-plus-app/)
- **App ID**: `com.zyea.facebook`
- **App Name**: Zyea+
- **URL Scheme**: `zyeaplus://`
- **Chức năng**: NewsFeed, bài viết, khoảnh khắc
- **Icon**: Facebook icon

## Deep Linking

Khi người dùng click vào nút tin nhắn trong Facebook app, nó sẽ:

1. Kiểm tra xem Messenger app đã được cài đặt chưa
2. Nếu có → Mở Messenger app bằng URL scheme `zyeamessenger://open`
3. Nếu chưa → Hiển thị thông báo yêu cầu cài đặt

## Build và Cài đặt

### Build Zyea+ Facebook App

```bash
# Windows
BUILD-ZYEA-PLUS-APP.bat

# Manual
cd zyea-plus-app
npm install
npm run build:win
npx cap sync android
npx cap open android
```

### Build Zyea+ Messenger App

```bash
# Windows
BUILD-TEST-MOBILE.bat

# Manual
cd client
npm install
npm run build:win
npx cap sync android
npx cap open android
```

## Thứ tự cài đặt

1. **Cài đặt Messenger app trước** (com.zyea.hieudev)
2. **Sau đó cài đặt Facebook app** (com.zyea.facebook)
3. Mở Facebook app → Click nút tin nhắn → Sẽ mở Messenger app

## Chỉnh sửa Badge số lượng tin nhắn chưa đọc

Badge số lượng tin nhắn chưa đọc được tự động lấy từ API mỗi 30 giây.

File: `zyea-plus-app/src/App.js`

```javascript
// Refresh unread count every 30 seconds
useEffect(() => {
  if (user) {
    const interval = setInterval(() => {
      loadUnreadMessagesCount();
    }, 30000); // 30 giây

    return () => clearInterval(interval);
  }
}, [user]);
```

## Tùy chỉnh

### Thay đổi màu sắc

File: `zyea-plus-app/src/components/FacebookTopBar.js`

```javascript
const TopBar = styled.div`
  background: #0084ff; // Đổi màu header
  ...
`;
```

### Thay đổi logo

File: `zyea-plus-app/src/components/FacebookTopBar.js`

```javascript
const Logo = styled.div`
  font-size: 24px;
  font-weight: bold;
  color: white;
`;

// Trong component
<Logo>facebook</Logo> // Đổi text hoặc thêm ảnh
```

### Thay đổi URL scheme

1. **Messenger app**: `zalo-clone/client/capacitor.config.ts`
```typescript
ios: {
  scheme: 'zyeamessenger' // Đổi scheme
}
```

2. **Facebook app**: `zalo-clone/zyea-plus-app/src/utils/appLauncher.js`
```javascript
const { value } = await AppLauncher.canOpenUrl({ 
  url: 'zyeamessenger://' // Phải khớp với Messenger app
});
```

## API Server

Cả 2 app đều kết nối đến cùng 1 API server:
- URL: `http://192.168.0.102:5000`
- Config: `package.json` → `"proxy": "http://192.168.0.102:5000"`

## Troubleshooting

### Lỗi: "Không thể mở Messenger app"

**Nguyên nhân**: Messenger app chưa được cài đặt hoặc URL scheme không khớp

**Giải pháp**:
1. Kiểm tra Messenger app đã được cài đặt chưa
2. Kiểm tra URL scheme trong `capacitor.config.ts` của Messenger app
3. Rebuild cả 2 app sau khi thay đổi config

### Lỗi: Badge không hiển thị đúng

**Nguyên nhân**: API không trả về đúng số lượng tin nhắn chưa đọc

**Giải pháp**:
1. Kiểm tra API `/chat/conversations` có trả về `unread_count` không
2. Kiểm tra console log trong `App.js` → `loadUnreadMessagesCount()`

### Lỗi: Build thất bại

**Nguyên nhân**: Thiếu dependencies hoặc Capacitor chưa được init

**Giải pháp**:
```bash
cd zyea-plus-app
npm install
npx cap sync
```

## Demo

### Facebook App
- TopBar với logo "facebook"
- Nút tin nhắn có badge số lượng chưa đọc
- NewsFeed với posts, khoảnh khắc
- Bottom navigation (bị ẩn trong app này)

### Messenger App
- Chat conversations
- Message UI
- Danh bạ
- Bottom navigation

## Cấu trúc File

```
zalo-clone/
├── client/                    # Zyea+ Messenger App
│   ├── src/
│   ├── capacitor.config.ts   # Config với URL scheme
│   └── package.json
│
├── zyea-plus-app/            # Zyea+ Facebook App
│   ├── src/
│   │   ├── App.js            # Main app với NewsFeed
│   │   ├── components/
│   │   │   ├── FacebookTopBar.js    # TopBar với nút tin nhắn
│   │   │   ├── NewsFeed/            # NewsFeed components
│   │   │   └── Auth/                # Login/Register
│   │   └── utils/
│   │       └── appLauncher.js       # Deep linking utility
│   ├── capacitor.config.ts   # Config riêng
│   └── package.json
│
├── BUILD-ZYEA-PLUS-APP.bat   # Build script cho Facebook app
└── ZYEA-PLUS-APP-README.md   # File này
```

## Tính năng nổi bật

✅ 2 app độc lập với nhau
✅ Deep linking giữa 2 app
✅ Badge thông báo real-time
✅ Cùng dùng chung API server
✅ Cùng dùng chung authentication
✅ UI giống Facebook và Messenger thật

## Phát triển thêm

### Thêm notification push

Khi có tin nhắn mới trong Messenger app → Gửi notification đến Facebook app → Update badge

### Thêm story/khoảnh khắc

Cho phép người dùng đăng story từ Facebook app

### Sync data giữa 2 app

Sử dụng shared storage hoặc API để sync data real-time

## Liên hệ

- Developer: HieuDev
- Project: Zyea+ Social Network
- Version: 1.0.0

