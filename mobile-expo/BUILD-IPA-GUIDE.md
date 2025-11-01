# 📱 Hướng dẫn Build IPA - 3 Cách

## ✅ Đã tạo 3 cách build IPA:

### 1. **EAS Build (Đơn giản nhất - KHUYẾN NGHỊ)** ⭐

**File:** `.github/workflows/build-ipa-simple.yml`

**Cách dùng:**
1. Vào GitHub Actions: https://github.com/Nidios1/zyea-chat-app/actions
2. Chọn workflow: **"Build iOS IPA - Simple EAS Build"**
3. Click **"Run workflow"** → **"Run workflow"**

**Yêu cầu:**
- Cần tạo EXPO_TOKEN trong GitHub Secrets:
  - Vào: Settings → Secrets and variables → Actions
  - Tạo secret: `EXPO_TOKEN`
  - Lấy token từ: https://expo.dev/accounts/hieukka/settings/access-tokens

**Ưu điểm:**
- ✅ Đơn giản nhất
- ✅ Build trên cloud của Expo
- ✅ IPA unsigned tự động
- ✅ Không cần cấu hình phức tạp

---

### 2. **Codemagic (Miễn phí 500 phút/tháng)** ⭐⭐

**File:** `codemagic.yaml`

**Cách dùng:**
1. Đăng ký tại: https://codemagic.io/
2. Kết nối GitHub repository
3. Codemagic sẽ tự động phát hiện file `codemagic.yaml`
4. Click "Start new build"

**Ưu điểm:**
- ✅ Miễn phí 500 phút/tháng
- ✅ Build nhanh hơn
- ✅ UI đẹp, dễ theo dõi
- ✅ Tự động upload IPA

---

### 3. **GitHub Actions Native (Tự build)** ⭐⭐⭐

**File:** `.github/workflows/build-expo-ipa.yml`

**Cách dùng:**
- Tự động chạy khi push code
- Hoặc chạy thủ công từ GitHub Actions

**Ưu điểm:**
- ✅ Hoàn toàn miễn phí (2000 phút/tháng)
- ✅ Build trực tiếp với Xcode
- ✅ Full control

**Nhược điểm:**
- ⚠️ Phức tạp hơn
- ⚠️ Build lâu hơn (~30 phút)

---

## 🚀 Cách nhanh nhất: Dùng EAS Build

### Bước 1: Tạo EXPO_TOKEN

1. Vào: https://expo.dev/accounts/hieukka/settings/access-tokens
2. Tạo token mới
3. Copy token

### Bước 2: Thêm vào GitHub Secrets

1. Vào: https://github.com/Nidios1/zyea-chat-app/settings/secrets/actions
2. Click **"New repository secret"**
3. Name: `EXPO_TOKEN`
4. Value: Dán token đã copy
5. Click **"Add secret"**

### Bước 3: Chạy workflow

1. Vào: https://github.com/Nidios1/zyea-chat-app/actions
2. Chọn: **"Build iOS IPA - Simple EAS Build"**
3. Click **"Run workflow"**
4. Chờ build xong (15-30 phút)

### Bước 4: Tải IPA

1. Vào: https://expo.dev/accounts/hieukka/projects/zyea-mobile/builds
2. Tải file IPA về
3. Ký với Esign và cài đặt

---

## 📊 So sánh

| Tính năng | EAS Build | Codemagic | GitHub Actions |
|-----------|-----------|-----------|----------------|
| Miễn phí | Có | 500 phút/tháng | 2000 phút/tháng |
| Độ khó | ⭐ Dễ | ⭐⭐ Trung bình | ⭐⭐⭐ Khó |
| Thời gian | 20-30 phút | 15-20 phút | 30-45 phút |
| Cần token | EXPO_TOKEN | Kết nối GitHub | Không |

---

## ✅ Khuyến nghị

**Bắt đầu với EAS Build** - Đơn giản nhất và đáng tin cậy nhất!

