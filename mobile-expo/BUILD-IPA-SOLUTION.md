# 🔧 Giải pháp Build IPA không cần Apple Developer Account trả phí

## ⚠️ Vấn đề

Bạn muốn build IPA để ký bằng **esign**, nhưng EAS Build **yêu cầu** Apple Developer account. 

## ✅ Giải pháp

### Phương án 1: Sử dụng Máy ảo Mac (Hoàn toàn miễn phí)

Nếu bạn có máy tính mạnh, có thể chạy macOS ảo:

#### Cách 1: Hackintosh hoặc Virtual Machine
1. Tải **VMware** hoặc **VirtualBox**
2. Cài đặt **macOS Monterey/Ventura**
3. Cài **Xcode** trên máy ảo
4. Build IPA như bình thường

#### Hướng dẫn chi tiết:
- **Video hướng dẫn**: https://www.youtube.com/watch?v=ZzQcDmxE1xc
- **ISO Hackintosh**: https://hackintosh.zone/

---

### Phương án 2: Thuê Mac trên Cloud (Mất phí nhưng nhanh)

Các dịch vụ cho thuê Mac qua Cloud:

1. **MacStadium** - https://www.macstadium.com/
   - $99/tháng cho Mac mini
   
2. **AWS EC2 Mac** - https://aws.amazon.com/ec2/instance-types/mac/
   - ~$1.08/giờ, khoảng $26/ngày
   
3. **MacinCloud** - https://macincloud.com/
   - $20-50/tháng

Sau khi thuê Mac, đăng nhập SSH và build.

---

### Phương án 3: Tìm người có Mac (Miễn phí hoặc trả ít)

1. Hỏi bạn bè/đồng nghiệp có Mac
2. Thuê build một lần tại các nhóm Facebook/Reddit
3. Trả 50k-200k VNĐ cho 1 lần build

---

### Phương án 4: Mua Mac mini cũ (Đầu tư một lần)

Mac mini 2012-2014 cũ giá khoảng **2-5 triệu VNĐ**, vẫn đủ để build IPA.

---

### Phương án 5: Đăng ký Apple Developer (Khuyến nghị nếu nghiêm túc)

Chi phí: **$99/năm** (~2.3 triệu VNĐ)

**Ưu điểm:**
- ✅ Build không giới hạn
- ✅ Upload App Store
- ✅ TestFlight
- ✅ Push notifications
- ✅ Không cần re-sign mỗi 7 ngày

---

## 🎯 Hướng dẫn Build trên Mac (Sau khi có Mac)

### Bước 1: Setup Xcode

```bash
# Tải Xcode từ App Store (miễn phí)
# Hoặc tải từ: https://developer.apple.com/download/all/
```

### Bước 2: Cài đặt dependencies

```bash
cd zalo-clone/mobile-expo
npm install
```

### Bước 3: Prebuild iOS

```bash
npx expo prebuild --platform ios
```

### Bước 4: Mở project trong Xcode

```bash
open ios/zyeamobile.xcworkspace
```

### Bước 5: Cấu hình Signing

Trong Xcode:
1. Select **Project** → **zyeamobile** target
2. Tab **"Signing & Capabilities"**
3. Enable **"Automatically manage signing"**
4. Chọn **Team** (Apple ID của bạn)

### Bước 6: Build Archive

1. Menu **Product** → **Archive**
2. Đợi build xong
3. Cửa sổ **Organizer** mở ra

### Bước 7: Export IPA

1. Chọn archive vừa tạo
2. Click **"Distribute App"**
3. Chọn **"Development"** hoặc **"Ad Hoc"**
4. Chọn **"Export"**
5. Chọn thư mục lưu file IPA

### Bước 8: Tìm file IPA

File sẽ được lưu tại thư mục bạn chọn.

---

## 🎯 Hướng dẫn với Mac trên Cloud (AWS EC2 Mac)

### Bước 1: Đăng ký AWS

1. Vào https://aws.amazon.com/
2. Đăng ký tài khoản (cần thẻ tín dụng)
3. Bật billing alert

### Bước 2: Launch EC2 Mac Instance

```bash
# Qua AWS Console
1. EC2 → Instances → Launch Instance
2. Tìm "macOS" instance type
3. Chọn "macOS Monterey 12" hoặc mới hơn
4. SSH key pair
5. Launch instance
```

### Bước 3: Connect SSH

```bash
# Lấy public IP
aws ec2 describe-instances --instance-ids i-xxx

# SSH vào Mac
ssh ec2-user@YOUR_IP -i your-key.pem
```

### Bước 4: Setup Xcode trên EC2

```bash
# Download và cài Xcode Command Line Tools
xcode-select --install

# Accept license
sudo xcodebuild -license accept

# Download full Xcode (tùy chọn, cần nhiều thời gian)
# Tải từ developer.apple.com
```

### Bước 5: Clone và Build project

```bash
# Clone code
cd ~
git clone your-repo
cd zalo-clone/mobile-expo

# Install dependencies
npm install

# Build
npx expo prebuild --platform ios
# ... tiếp tục như trên
```

### Bước 6: Download IPA về máy

```bash
# Sử dụng SCP để tải file IPA về
scp -i your-key.pem ec2-user@YOUR_IP:/path/to/app.ipa ./
```

### Bước 7: Terminate instance (Quan trọng!)

```bash
# Dừng instance ngay lập tức để không bị tính phí
aws ec2 stop-instances --instance-ids i-xxx

# HOẶC terminate nếu không dùng nữa
aws ec2 terminate-instances --instance-ids i-xxx
```

**⚠️ Lưu ý**: AWS EC2 Mac có phí cao (~$26/ngày), nhớ stop ngay sau khi xong!

---

## 🎯 Quick Start: Build đơn giản nhất

Nếu bạn không muốn làm phức tạp, **khuyến nghị**:

### 1. Build trên máy ảo Mac miễn phí

- Tải **macOS Ventura** ISO
- Cài trên **VMware/VirtualBox**
- Build IPA

Tổng thời gian: **3-5 giờ** (lần đầu setup)

### 2. Hoặc nhờ ai đó build

Hỏi trong nhóm:
- Facebook: "React Native Vietnam"
- Reddit: r/reactnative

Chi phí: **50k-200k VNĐ**

### 3. Hoặc mua Mac mini cũ

- Tìm trên **Shopee/Lazada**: "Mac mini 2012"
- Giá: **2-3 triệu**
- Dùng được mãi mãi

---

## 📦 Sau khi có IPA

Sử dụng **Esign** hoặc **Sideloadly** để ký và cài:

### Esign (Trên iPhone)

1. Tải Esign từ GitHub
2. Upload IPA
3. Sign
4. Install

### Sideloadly (Trên máy tính)

1. Tải Sideloadly: https://sideloadly.app
2. Connect iPhone
3. Kéo thả IPA
4. Sign và install

---

## ❓ FAQ

### Q: Không có Mac thì không thể build được?
**A:** Đúng. iOS build cần Mac hoặc cloud Mac.

### Q: Có thể hack Apple để build unsigned không?
**A:** Không. Apple bắt buộc phải ký mã.

### Q: EAS có thể build unsigned không?
**A:** Không. EAS yêu cầu Apple account.

### Q: Giá rẻ nhất là gì?
**A:** Máy ảo Mac miễn phí hoặc Mac mini cũ 2 triệu.

### Q: Build mất bao lâu?
**A:** 15-30 phút.

---

## 🎯 Kết luận

Để build IPA **KHÔNG THỂ** tránh khỏi việc cần Mac. Nhưng có nhiều cách:
1. ✅ VM Mac **miễn phí**
2. ✅ Cloud Mac **trả phí**
3. ✅ Mac mini cũ **2-3 triệu**
4. ✅ Apple Developer **$99/năm**

**Khuyến nghị**: Nếu nghiêm túc làm app, nên đầu tư Mac mini hoặc Apple Developer.

