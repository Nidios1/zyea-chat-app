# 🎨 Hướng Dẫn Tạo Icon/Logo Cho Ứng Dụng

## 📋 Tổng Quan

Script `generate-icons.js` tự động tạo tất cả các kích thước icon cần thiết cho ứng dụng từ logo gốc `Zyea.jpg`.

## 🚀 Cách Sử Dụng

### 1. Thay Đổi Logo Gốc

Nếu bạn muốn thay đổi logo:
- Thay thế file `client/public/Zyea.jpg` bằng logo mới của bạn
- Đảm bảo logo là ảnh vuông (tỷ lệ 1:1) để có kết quả tốt nhất
- Định dạng khuyến nghị: JPG hoặc PNG
- Kích thước khuyến nghị: Tối thiểu 1024x1024px

### 2. Chạy Script Tạo Icon

```bash
cd zalo-clone
node generate-icons.js
```

### 3. Kết Quả

Script sẽ tự động tạo các icon sau:

#### PWA Icons (Progressive Web App)
- `icon-72x72.png`
- `icon-96x96.png`
- `icon-128x128.png`
- `icon-144x144.png`
- `icon-152x152.png`
- `icon-192x192.png`
- `icon-384x384.png`
- `icon-512x512.png`

#### iOS Icons
- `apple-touch-icon.png` (180x180)

#### Favicon
- `favicon.png` (32x32)
- `favicon-16x16.png` (16x16)

#### Capacitor/Mobile Icons
- `resources/icon.png` (1024x1024) - Icon cho app mobile
- `resources/splash.png` (2732x2732) - Splash screen

#### Build Folder
Tất cả các icon cũng được copy vào `client/build/` để sẵn sàng deploy

## 📁 Cấu Trúc Thư Mục

```
zalo-clone/
├── client/
│   ├── public/
│   │   ├── Zyea.jpg           ← Logo gốc
│   │   ├── favicon.png
│   │   ├── apple-touch-icon.png
│   │   └── icon-*.png         ← Các PWA icons
│   ├── resources/
│   │   ├── icon.png           ← Capacitor icon
│   │   └── splash.png         ← Splash screen
│   └── build/
│       └── icon-*.png         ← Icons cho production
└── generate-icons.js          ← Script tạo icon
```

## ⚙️ Cấu Hình

### Manifest.json

File `client/public/manifest.json` đã được cấu hình để sử dụng tất cả các icon:
- Icons cho PWA install
- Maskable icons cho Android
- Shortcuts icons

### Index.html

File `client/public/index.html` đã được cấu hình:
- Favicon: `favicon.png`
- Apple touch icon: `apple-touch-icon.png`

### Capacitor Config

File `client/capacitor.config.ts` sử dụng:
- `resources/icon.png` - Icon chính cho app
- `resources/splash.png` - Splash screen

## 🔧 Yêu Cầu

- Node.js đã được cài đặt
- Package `sharp` đã được cài đặt (tự động cài khi chạy `npm install`)

```bash
npm install sharp --save-dev
```

## 💡 Tips

1. **Logo Vuông**: Đảm bảo logo gốc là hình vuông để tránh bị cắt xén
2. **Chất Lượng Cao**: Sử dụng logo có độ phân giải cao (tối thiểu 1024x1024)
3. **Màu Nền**: Nếu logo có nền trong suốt, hãy đảm bảo nó đẹp trên cả nền sáng và tối
4. **Testing**: Sau khi tạo icon mới, test trên:
   - Chrome DevTools (PWA)
   - iPhone Safari
   - Android Chrome
   - Capacitor app

## 🎯 Khi Nào Cần Chạy Lại

Chạy lại script `generate-icons.js` khi:
- Thay đổi logo/branding
- Cần thêm kích thước icon mới
- Icon bị hỏng hoặc mất

## 📝 Ghi Chú

- Script tự động tạo thư mục nếu chưa tồn tại
- Các icon cũ sẽ bị ghi đè
- Định dạng output luôn là PNG (tối ưu cho web và mobile)
- Logo gốc `Zyea.jpg` không bị thay đổi

## ✅ Checklist Sau Khi Tạo Icon Mới

- [ ] Kiểm tra tất cả icon đã được tạo trong `client/public/`
- [ ] Kiểm tra `resources/icon.png` và `resources/splash.png`
- [ ] Rebuild app: `npm run build`
- [ ] Test PWA install trên Chrome
- [ ] Test trên iOS Safari
- [ ] Sync Capacitor: `npx cap sync`
- [ ] Build APK/IPA mới nếu cần

## 🆘 Troubleshooting

### Lỗi: "Cannot find module 'sharp'"
```bash
npm install sharp --save-dev
```

### Lỗi: "Cannot find path"
Đảm bảo bạn đang ở đúng thư mục `zalo-clone`:
```bash
cd zalo-clone
node generate-icons.js
```

### Logo bị mờ/vỡ
Sử dụng logo gốc có độ phân giải cao hơn (tối thiểu 1024x1024px)

---

**Tạo bởi**: Icon Generation Script v1.0  
**Ngày cập nhật**: 2025-10-24

