# 🚀 HƯỚNG DẪN NHANH: 2 APP ZYEA+

## 📱 Tổng quan

Bạn hiện có **2 app riêng biệt**:

### 1. Zyea+ Messenger (client/)
- ✉️ App tin nhắn (chat)
- 📞 Video call
- 👥 Danh bạ
- 🔵 Icon: Messenger

### 2. Zyea+ Facebook (zyea-plus-app/)
- 📰 NewsFeed (bảng tin)
- 📸 Đăng bài, khoảnh khắc
- 💬 Nút tin nhắn với badge → Mở Messenger app
- 🔵 Icon: Facebook

## ⚡ BUILD NHANH

### Bước 1: Build Messenger App
```bash
cd client
npm install
npm run build:win
npx cap sync android
npx cap open android
```

### Bước 2: Build Facebook App
```bash
cd zyea-plus-app
npm install
npm run build:win
npx cap sync android
npx cap open android
```

**HOẶC** dùng file `.bat`:
- `BUILD-TEST-MOBILE.bat` → Build Messenger app
- `BUILD-ZYEA-PLUS-APP.bat` → Build Facebook app

## 📦 CÀI ĐẶT

1. Cài đặt **Messenger app** trước (com.zyea.hieudev)
2. Sau đó cài đặt **Facebook app** (com.zyea.facebook)
3. Mở Facebook app → Click nút tin nhắn → Messenger app sẽ mở!

## 🔗 DEEP LINKING

```
Facebook App (Zyea+)
    |
    | Click nút tin nhắn 💬
    ↓
Messenger App (Zyea+)
```

### Cách hoạt động:
1. Facebook app check: Messenger đã cài chưa?
2. Nếu có → Mở bằng URL: `zyeamessenger://open`
3. Nếu chưa → Hiển thị: "Vui lòng cài đặt Messenger"

## 🎨 GIAO DIỆN

### Facebook App
```
┌─────────────────────────────┐
│ facebook    🔍 Tìm kiếm   💬│  ← TopBar (nút tin nhắn có badge)
├─────────────────────────────┤
│ Nhật Ký | Zyea+ Video       │  ← Tabs
├─────────────────────────────┤
│ [Hôm nay bạn thế nào?]      │  ← Post Creator
│ 📷 Ảnh  🎥 Video  📁 Album  │
├─────────────────────────────┤
│ 🎯 Khoảnh khắc              │  ← Moments
│ [+] [Thúy] [Na] [Quyên]     │
├─────────────────────────────┤
│ 📰 Posts...                 │  ← NewsFeed
└─────────────────────────────┘
```

### Messenger App
```
┌─────────────────────────────┐
│ 🔍 Tìm kiếm...  ✏️  📷      │  ← TopBar
├─────────────────────────────┤
│ Ưu tiên | Khác              │  ← Tabs
├─────────────────────────────┤
│ 👤 Hồng Hà Nội              │
│    Tự giác văn minh...  🔴 │
├─────────────────────────────┤
│ 👤 User 2                   │
│    Hello...                 │
├─────────────────────────────┤
│ 💬 📞 🔍 👤                 │  ← Bottom Nav
└─────────────────────────────┘
```

## ⚙️ CẤU HÌNH

### Messenger App (client/capacitor.config.ts)
```typescript
{
  appId: 'com.zyea.hieudev',
  appName: 'Zyea+',
  ios: {
    scheme: 'zyeamessenger'  // ← URL scheme để nhận deep link
  }
}
```

### Facebook App (zyea-plus-app/capacitor.config.ts)
```typescript
{
  appId: 'com.zyea.facebook',
  appName: 'Zyea+',
  ios: {
    scheme: 'zyeaplus'
  }
}
```

## 🔧 CHỈNH SỬA BADGE

File: `zyea-plus-app/src/App.js`

```javascript
// Badge tự động update mỗi 30 giây
const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);

useEffect(() => {
  if (user) {
    const interval = setInterval(() => {
      loadUnreadMessagesCount(); // Load từ API
    }, 30000); // 30 giây

    return () => clearInterval(interval);
  }
}, [user]);
```

## 📂 CẤU TRÚC PROJECT

```
zalo-clone/
│
├── client/                         # ✉️ MESSENGER APP
│   ├── src/
│   │   ├── App.js                 # Messenger main app
│   │   ├── components/
│   │   │   ├── Chat/              # Chat components
│   │   │   └── Mobile/            # Mobile UI
│   │   └── utils/
│   ├── capacitor.config.ts        # Config: com.zyea.hieudev
│   └── package.json
│
├── zyea-plus-app/                  # 📰 FACEBOOK APP
│   ├── src/
│   │   ├── App.js                 # Facebook main app
│   │   ├── components/
│   │   │   ├── FacebookTopBar.js  # TopBar với nút tin nhắn
│   │   │   ├── NewsFeed/          # NewsFeed components
│   │   │   └── Auth/              # Login/Register
│   │   └── utils/
│   │       └── appLauncher.js     # Deep linking utility
│   ├── capacitor.config.ts        # Config: com.zyea.facebook
│   └── package.json
│
├── BUILD-TEST-MOBILE.bat           # Build Messenger app
├── BUILD-ZYEA-PLUS-APP.bat         # Build Facebook app
└── ZYEA-PLUS-APP-README.md         # Chi tiết đầy đủ
```

## 🐛 XỬ LÝ LỖI

### ❌ "Không thể mở Messenger app"
**Fix**: Kiểm tra Messenger app đã cài đặt chưa

### ❌ Badge không hiển thị
**Fix**: Kiểm tra API `/chat/conversations` có trả về `unread_count`

### ❌ Build lỗi
**Fix**: 
```bash
npm install
npx cap sync
```

## 🎯 TÍNH NĂNG CHÍNH

### Facebook App
✅ NewsFeed giống Facebook thật
✅ Đăng bài với ảnh/video
✅ Khoảnh khắc (stories)
✅ Nút tin nhắn với badge real-time
✅ Deep link đến Messenger app

### Messenger App
✅ Chat real-time với Socket.IO
✅ Video call
✅ Gửi ảnh/video
✅ Xóa tin nhắn
✅ Nhận deep link từ Facebook app

## 📝 GHI CHÚ

- **2 app dùng chung**: API server, authentication, database
- **2 app độc lập**: Package, icon, tên app, chức năng
- **Deep linking**: Facebook → Messenger (1 chiều)
- **Badge**: Tự động sync mỗi 30 giây

## 🚀 DEMO FLOW

1. **Mở Facebook app** → Thấy NewsFeed
2. **Click nút tin nhắn (💬)** → Có badge "3"
3. **Messenger app mở** → Thấy 3 tin nhắn chưa đọc
4. **Đọc tin nhắn** → Badge trở về "0"

## 📞 HỖ TRỢ

Nếu có vấn đề, check:
1. Cả 2 app đã cài đặt chưa?
2. URL scheme có khớp không?
3. API server có chạy không?
4. Console log có lỗi gì không?

---

**Created by**: HieuDev
**Version**: 1.0.0
**Date**: 2024

🎉 **CHÚC BẠN THÀNH CÔNG!** 🎉

