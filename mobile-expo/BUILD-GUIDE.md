# 📦 Hướng dẫn Build và Deploy

## 🚀 Các Script có sẵn

### 1. **build.bat** - Build ứng dụng development/web
```bash
# Chạy trực tiếp
build.bat

# Hoặc qua npm
npm run build
```
**Chức năng:**
- Start development server
- Build web version
- Run iOS simulator (cần Mac)

---

### 2. **build-ipa.bat** - Build IPA cho iOS (unsigned để tự ký qua Esign)
```bash
# Chạy trực tiếp
build-ipa.bat

# Hoặc qua npm
npm run build:ipa

# Build trực tiếp unsigned IPA
npm run build:ipa:unsigned
```

**Chức năng:**
- Build IPA unsigned (khuyến nghị cho Esign)
- Build IPA adhoc (cho cá nhân)
- Build IPA preview (để test)
- Build IPA production (chính thức)

**Lưu ý:**
- Build unsigned IPA sẽ tạo file IPA không ký, bạn cần tự ký qua Esign hoặc Sideloadly
- Quá trình build mất khoảng 15-30 phút
- File IPA sẽ được tải về từ: https://expo.dev/accounts/hieukka/projects/zyea-mobile/builds

---

### 3. **setup-git-remote.bat** - Thiết lập Git remote repository
```bash
# Chạy trực tiếp
setup-git-remote.bat

# Hoặc qua npm
npm run setup:git
```

**Chức năng:**
- Thiết lập remote GitHub: https://github.com/Nidios1/zyea-chat-app.git
- Khởi tạo git repository nếu chưa có
- Tự động commit và push lần đầu (nếu muốn)

---

### 4. **commit-and-push.bat** - Commit và push code lên GitHub
```bash
# Chạy trực tiếp
commit-and-push.bat

# Hoặc qua npm
npm run commit:push
```

**Chức năng:**
- Tự động add tất cả file thay đổi
- Commit với message tùy chọn
- Push lên GitHub repository (tự động thêm remote nếu chưa có)

---

## 📱 Hướng dẫn Build IPA Unsigned để tự ký qua Esign

### Bước 1: Build IPA Unsigned
```bash
# Cách 1: Chạy script interactive
build-ipa.bat
# Chọn option 1 (unsigned)

# Cách 2: Build trực tiếp
npm run build:ipa:unsigned

# Cách 3: Build qua EAS CLI
eas build --platform ios --profile unsigned --non-interactive
```

### Bước 2: Tải file IPA
1. Truy cập: https://expo.dev/accounts/hieukka/projects/zyea-mobile/builds
2. Chọn build vừa tạo
3. Tải file IPA về máy tính

### Bước 3: Ký và cài đặt qua Esign

#### Cách 1: Sử dụng Esign trên iPhone
1. **Tải Esign** về iPhone
2. **Mở Esign** và đăng nhập bằng Apple ID
3. **Upload file IPA** vào Esign (qua web hoặc AirDrop)
4. Nhấn **"Sign and Install"**
5. Chờ quá trình ký và cài đặt hoàn tất

#### Cách 2: Sử dụng Sideloadly (trên máy tính)
1. **Tải Sideloadly**: https://sideloadly.app/
2. **Cài đặt** và mở Sideloadly
3. **Kết nối iPhone** với máy tính qua USB
4. **Kéo thả file IPA** vào Sideloadly
5. **Đăng nhập Apple ID** khi được yêu cầu
6. Nhấn **"Start"** để cài đặt

---

## 🔧 Cấu hình Build Profiles

File `eas.json` đã được cấu hình với các profiles:

### 1. **unsigned** (Khuyến nghị cho Esign)
- IPA không ký
- Tự ký qua Esign/Sideloadly
- Cấu hình: `withoutCredentials: true`

### 2. **adhoc**
- IPA cho cá nhân
- Distribution: internal
- Cần Apple ID Developer

### 3. **preview**
- IPA để test
- Release configuration

### 4. **production**
- IPA chính thức
- Sẵn sàng cho App Store (nếu có Developer account)

---

## 📝 Workflow thông thường

### Lần đầu tiên (Setup)
```bash
# 1. Thiết lập Git remote
npm run setup:git

# 2. Cấu hình Git user (nếu chưa có)
git config --global user.name "Your Name"
git config --global user.email "your-email@example.com"
```

### Development
```bash
# 1. Chạy dev server
npm start

# 2. Test trên web
npm run web
```

### Build và Deploy
```bash
# 1. Build IPA unsigned
npm run build:ipa:unsigned

# 2. Commit và push code
npm run commit:push

# 3. Tải IPA từ Expo và ký qua Esign
```

**Lưu ý:** Repository GitHub: https://github.com/Nidios1/zyea-chat-app.git

---

## ⚠️ Lưu ý quan trọng

### Apple ID miễn phí
- ✅ Có thể build và test trên **3 thiết bị**
- ✅ Có thể ký và cài đặt với Esign
- ⚠️ Giấy phép chỉ **7 ngày**, sau đó cần ký lại
- ❌ Không thể upload lên App Store

### EAS Build
- ✅ Miễn phí với plan Basic
- ✅ Build trên cloud (không cần Mac)
- ✅ Không giới hạn số lượng build công khai

### Quy trình tự ký
1. Build IPA unsigned → Không cần Apple Developer account
2. Tải IPA về máy
3. Ký qua Esign/Sideloadly → Cần Apple ID thường (miễn phí)
4. Cài đặt lên iPhone → Hoạt động 7 ngày

---

## 🆘 Xử lý lỗi

### Lỗi: "EAS CLI chưa được cài đặt"
```bash
npm install -g eas-cli
```

### Lỗi: "Chưa đăng nhập EAS"
```bash
eas login
```

### Lỗi: "Build thất bại"
- Kiểm tra file `app.json` và `eas.json`
- Xem log chi tiết trên Expo dashboard
- Đảm bảo đã commit code trước khi build

### Lỗi: "Push thất bại"
- Kiểm tra đã đăng nhập GitHub
- Kiểm tra remote repository đã được cấu hình
- Kiểm tra quyền push vào repository

---

## 📚 Tài liệu tham khảo

- [EAS Build Documentation](https://docs.expo.dev/build/introduction/)
- [Expo Documentation](https://docs.expo.dev/)
- [Esign GitHub](https://github.com/esign-ios/Esign)
- [Sideloadly](https://sideloadly.app/)

---

## ✅ Checklist trước khi build IPA

- [ ] Đã cài đặt EAS CLI: `npm install -g eas-cli`
- [ ] Đã đăng nhập EAS: `eas login`
- [ ] Đã cập nhật version trong `app.json` (nếu cần)
- [ ] Đã commit code: `git add . && git commit -m "message"`
- [ ] Đã kiểm tra `eas.json` có profile `unsigned`
- [ ] Đã sẵn sàng chờ 15-30 phút để build

