# 🚀 Các lệnh có thể chạy ngay

## ✅ Trạng thái hiện tại

- ✅ **EAS CLI**: Đã cài đặt (v16.26.0)
- ✅ **EAS Login**: Đã đăng nhập (hieukka)
- ✅ **Scripts**: Đã tạo đầy đủ
- ✅ **eas.json**: Đã cấu hình profile `unsigned`

---

## 📦 Các lệnh Build IPA

### 1. Build IPA Unsigned (Khuyến nghị - tự ký qua Esign)
```bash
npm run build:ipa:unsigned
```
Hoặc:
```bash
eas build --platform ios --profile unsigned --non-interactive
```

### 2. Build IPA qua script interactive
```bash
npm run build:ipa
```
Hoặc chạy trực tiếp:
```bash
build-ipa.bat
```

---

## 📝 Git Setup (Cần cài Git trước)

⚠️ **Lưu ý**: Git chưa được cài đặt trên máy. Để sử dụng Git:

### Bước 1: Cài đặt Git
Tải và cài đặt Git từ: https://git-scm.com/download/win

### Bước 2: Sau khi cài Git, chạy:

```bash
# Setup Git remote
npm run setup:git

# Commit và push code
npm run commit:push
```

---

## 🎯 Workflow hoàn chỉnh

### Lần đầu tiên:
```bash
# 1. Cài Git (từ link trên)
# 2. Setup Git remote
npm run setup:git

# 3. Cấu hình Git user
git config --global user.name "Your Name"
git config --global user.email "your-email@example.com"
```

### Hàng ngày:
```bash
# 1. Build IPA unsigned
npm run build:ipa:unsigned

# 2. Commit và push
npm run commit:push
```

---

## 📱 Sau khi build IPA

1. Truy cập: https://expo.dev/accounts/hieukka/projects/zyea-mobile/builds
2. Tải file IPA về máy
3. Ký qua Esign hoặc Sideloadly
4. Cài đặt lên iPhone

---

## 🔗 Links hữu ích

- **Expo Dashboard**: https://expo.dev/accounts/hieukka/projects/zyea-mobile/builds
- **GitHub Repository**: https://github.com/Nidios1/zyea-chat-app.git
- **Git Download**: https://git-scm.com/download/win

