# 📱 Hướng dẫn Build IPA (iOS App)

## 🎯 3 Cách Build IPA với Capacitor

---

## ✅ **CÁCH 1: Codemagic (Recommended - MIỄN PHÍ)**

### Bước 1: Đăng ký Codemagic
1. Vào https://codemagic.io/signup
2. Chọn "Sign up with GitHub"
3. Authorize Codemagic truy cập GitHub của bạn

### Bước 2: Kết nối Repository
1. Trong Codemagic Dashboard, click "Add application"
2. Chọn repository: `Nidios1/zyea-chat-app`
3. Chọn "Capacitor" làm project type

### Bước 3: Cấu hình Build
1. Chọn workflow: **iOS**
2. Build configuration:
   - **Build script**: Automatic (Codemagic sẽ tự detect)
   - **Node version**: 18.x
   - **Xcode version**: Latest

### Bước 4: Code Signing (Cần Apple Developer Account)

#### Option A: Có Apple Developer Account ($99/năm)
1. Trong Codemagic, vào **Team settings** → **Code signing identities**
2. Thêm **iOS Certificate** và **Provisioning Profile**
3. Upload từ Apple Developer Portal

#### Option B: KHÔNG có Apple Developer Account (Build Development)
1. Tạo **Free Apple ID** tại https://appleid.apple.com
2. Trong Xcode → Preferences → Accounts → Add Apple ID
3. Codemagic sẽ tạo development certificate tự động

### Bước 5: Bắt đầu Build
1. Click **Start new build**
2. Chọn branch: `master`
3. Click **Start build**
4. Đợi ~15-20 phút
5. Download file `.ipa` khi build xong

### Bước 6: Cài đặt IPA lên iPhone

#### Cách 1: Qua Xcode (Cần Mac)
```bash
# Connect iPhone qua USB
xcrun devicectl device install app --device <device-id> path/to/App.ipa
```

#### Cách 2: Qua TestFlight
- Upload IPA lên App Store Connect
- Test qua TestFlight app

#### Cách 3: Qua Diawi (Đơn giản nhất)
1. Vào https://www.diawi.com
2. Upload file `.ipa`
3. Gửi link cho người dùng
4. Mở link trên iPhone → Tải về

---

## ✅ **CÁCH 2: Ionic Appflow**

1. Vào https://ionic.io/appflow
2. Đăng ký account (Free plan: 1 build/tháng)
3. Connect GitHub repo
4. Configure iOS build
5. Download IPA

**Ưu điểm:**
- ✅ Chính chủ Capacitor
- ✅ Tích hợp tốt
- ❌ Free plan giới hạn

---

## ✅ **CÁCH 3: Local Build (CẦN MAC)**

### Yêu cầu:
- ✅ Máy Mac (không build được trên Windows)
- ✅ Xcode 14+
- ✅ CocoaPods
- ✅ Node.js 16+

### Các bước:

```bash
# 1. Cài dependencies
cd client
npm install

# 2. Build React app
npm run build

# 3. Add iOS platform (chỉ lần đầu)
npx cap add ios

# 4. Sync code
npx cap sync ios

# 5. Mở Xcode
npx cap open ios
```

### Trong Xcode:
1. **Signing & Capabilities** → Chọn Team (Apple ID)
2. **Product** → **Archive**
3. **Distribute App** → **Development** hoặc **Ad Hoc**
4. Export IPA

---

## 📝 **Lưu ý quan trọng**

### 1. Apple Developer Account
- **Free**: Chỉ build được development (7 ngày hết hạn)
- **Paid ($99/năm)**: Build được App Store, TestFlight, Enterprise

### 2. File IPA có 3 loại:
- **Development**: Test trên device của bạn (7 ngày)
- **Ad Hoc**: Test trên tối đa 100 devices đã đăng ký
- **App Store**: Upload lên App Store

### 3. Cài đặt IPA lên iPhone:
- Cần **trust certificate** trong Settings → General → Device Management
- Hoặc dùng **TestFlight** (khuyến nghị)

---

## 🎯 **Khuyến nghị cho bạn**

**Nếu chưa có Mac:**
→ Dùng **Codemagic** (miễn phí 500 phút/tháng)

**Nếu có Mac:**
→ Build local với Xcode (nhanh hơn)

**Nếu muốn phát hành App Store:**
→ Cần Apple Developer Account ($99/năm)

---

## ❓ **Các câu hỏi thường gặp**

### Q: Build IPA có mất phí không?
A: 
- Codemagic: **Miễn phí** 500 phút/tháng
- Appflow: **Miễn phí** 1 build/tháng
- Local build: **Miễn phí** (nhưng cần Mac)

### Q: Có thể build IPA trên Windows không?
A: **KHÔNG**, iOS app chỉ build được trên Mac hoặc dùng cloud service như Codemagic.

### Q: File IPA có thể cài như APK không?
A: **KHÔNG**, iOS yêu cầu code signing. Phải dùng:
- TestFlight
- Xcode
- Diawi / App Center

### Q: Build IPA mất bao lâu?
A: 
- Codemagic: ~15-20 phút
- Local (Mac): ~5-10 phút

---

## 🔗 **Links hữu ích**

- Codemagic: https://codemagic.io
- Ionic Appflow: https://ionic.io/appflow
- Capacitor Docs: https://capacitorjs.com/docs/ios
- Apple Developer: https://developer.apple.com
- Diawi (Install IPA): https://www.diawi.com

---

**Chúc bạn build IPA thành công!** 🎉

