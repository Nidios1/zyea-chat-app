# Zyea+ Social Network App

Ứng dụng mạng xã hội Zyea+ được xây dựng với React và Capacitor, hỗ trợ cả iOS và Android.

## 🚀 Tính năng

- ✅ Newsfeed với posts và reactions
- ✅ Đăng bài với text và hình ảnh
- ✅ Emoji picker
- ✅ Pull to refresh
- ✅ Responsive design
- ✅ Native iOS app support

## 📋 Yêu cầu

### Phát triển trên Windows
- Node.js 18.x trở lên
- npm hoặc yarn
- Git

### Build iOS trên GitHub Actions
- Tài khoản GitHub
- Apple Developer Account (cho production builds)

## 🛠️ Cài đặt

### 1. Clone repository

```bash
git clone https://github.com/Nidios1/zyea-plus-social-network.git
cd zyea-plus-social-network/zyea-plus-app
```

### 2. Cài đặt dependencies

```bash
npm install
```

### 3. Chạy development server

```bash
npm start
```

Ứng dụng sẽ chạy tại `http://localhost:3000`

## 📱 Build cho Production

### Build Web App

```bash
# Windows
npm run build:win

# Linux/Mac
npm run build
```

### Build iOS (trên máy Mac)

```bash
# Build và sync với iOS
npm run ios

# Hoặc từng bước
npm run build:win
npx cap sync ios
npx cap open ios
```

## 🎯 Build IPA trên GitHub Actions

### Bước 1: Push code lên GitHub

Sử dụng script tự động:

```bash
# Chạy file batch
push-to-github.bat
```

Hoặc thủ công:

```bash
# Khởi tạo git (nếu chưa có)
git init

# Thêm remote repository
git remote add origin https://github.com/Nidios1/zyea-plus-social-network.git

# Add và commit
git add .
git commit -m "Initial commit"

# Push lên GitHub
git branch -M main
git push -u origin main
```

### Bước 2: Setup GitHub Secrets (Tùy chọn - cho production)

Nếu bạn muốn build signed IPA, cần thêm các secrets sau vào GitHub repository:

1. Vào repository trên GitHub
2. Settings → Secrets and variables → Actions
3. Thêm các secrets:
   - `BUILD_CERTIFICATE_BASE64`: Certificate (.p12) được encode base64
   - `P12_PASSWORD`: Password của certificate
   - `BUILD_PROVISION_PROFILE_BASE64`: Provisioning profile được encode base64
   - `KEYCHAIN_PASSWORD`: Password cho keychain tạm thời
   - `APPLE_TEAM_ID`: Apple Team ID của bạn

**Cách tạo base64 từ certificate:**

```bash
# Trên Mac/Linux
base64 -i certificate.p12 | pbcopy

# Trên Windows (PowerShell)
[Convert]::ToBase64String([IO.File]::ReadAllBytes("certificate.p12")) | Set-Clipboard
```

### Bước 3: Chạy GitHub Actions để build IPA

1. Truy cập: https://github.com/Nidios1/zyea-plus-social-network/actions
2. Chọn workflow **"Build Zyea+ iOS App"**
3. Click nút **"Run workflow"**
4. Chọn build type:
   - **development**: Build để test trên device (không cần signing)
   - **adhoc**: Build để distribute cho testers
   - **appstore**: Build để submit lên App Store
5. Click **"Run workflow"** để bắt đầu build

### Bước 4: Download IPA

1. Đợi workflow chạy xong (khoảng 10-15 phút)
2. Scroll xuống phần **Artifacts**
3. Download file `ZyeaPlus-iOS-{build_type}-{build_number}.zip`
4. Giải nén để lấy file `.ipa`

## 📦 Cài đặt IPA lên iPhone

### Cách 1: Sử dụng TestFlight (Recommended)
1. Upload IPA lên App Store Connect
2. Thêm testers
3. Cài đặt qua TestFlight app

### Cách 2: Direct Installation (Development build)
1. Sử dụng Xcode
2. Sử dụng các tool như AltStore, Sideloadly
3. Sử dụng Apple Configurator 2

### Cách 3: Over-The-Air (OTA)
1. Upload IPA lên hosting service (DistrApp, AppCenter, etc.)
2. Cài đặt trực tiếp từ Safari trên iPhone

## 🔧 Cấu trúc dự án

```
zyea-plus-app/
├── public/                 # Static files
├── src/
│   ├── components/        # React components
│   │   ├── Auth/         # Login, Register
│   │   ├── Chat/         # EmojiPicker
│   │   ├── Common/       # PullToRefresh
│   │   └── NewsFeed/     # NewsFeed, Post, PostCreator
│   ├── contexts/         # React contexts
│   ├── utils/            # Utility functions
│   ├── App.js           # Main app component
│   └── index.js         # Entry point
├── ios/                  # iOS native project
│   └── App/
│       ├── App/
│       └── App.xcworkspace
├── resources/            # App icons and splash screens
├── capacitor.config.ts   # Capacitor configuration
└── package.json         # Dependencies and scripts

## 📝 Scripts

```json
{
  "start": "Development server",
  "build:win": "Build for production (Windows)",
  "build": "Build for production (Mac/Linux)",
  "cap:sync": "Sync with native platforms",
  "cap:open:ios": "Open in Xcode",
  "ios": "Build and run on iOS"
}
```

## 🐛 Troubleshooting

### Build failed trên GitHub Actions

1. **Kiểm tra logs**: Xem chi tiết lỗi trong logs của workflow
2. **Secrets**: Đảm bảo đã setup đúng secrets (nếu cần)
3. **Code**: Đảm bảo code build được locally trước khi push

### iOS app không chạy

1. **Clean build folder**:
   ```bash
   cd ios/App
   rm -rf build DerivedData
   pod install
   ```

2. **Re-sync Capacitor**:
   ```bash
   npx cap sync ios
   ```

3. **Check Capacitor config**: Đảm bảo `capacitor.config.ts` đúng

### Lỗi khi cài đặt IPA

1. **Trust developer**: Settings → General → Device Management → Trust
2. **Provisioning profile**: Đảm bảo device được thêm vào provisioning profile
3. **Certificate expired**: Kiểm tra certificate còn hiệu lực

## 🔐 Bảo mật

- ⚠️ **KHÔNG** commit file `.p12` hoặc provisioning profiles
- ⚠️ **KHÔNG** commit secrets vào code
- ✅ **SỬ DỤNG** GitHub Secrets cho sensitive data
- ✅ **SỬ DỤNG** `.gitignore` để loại trừ file nhạy cảm

## 📚 Tài liệu tham khảo

- [Capacitor Documentation](https://capacitorjs.com/docs)
- [React Documentation](https://react.dev)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Apple Developer Documentation](https://developer.apple.com/documentation)

## 🤝 Contributing

1. Fork the project
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is private and proprietary.

## 👥 Contact

- Repository: [https://github.com/Nidios1/zyea-plus-social-network](https://github.com/Nidios1/zyea-plus-social-network)

---

Made with ❤️ by Zyea+ Team

