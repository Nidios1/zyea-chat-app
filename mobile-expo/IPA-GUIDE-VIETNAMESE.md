# 📦 HƯỚNG DẪN BUILD IPA CHO iOS - TIẾNG VIỆT

## 🎯 Mục tiêu

Bạn muốn tạo file **.ipa** để cài lên iPhone bằng **Esign** hoặc **Sideloadly**, **KHÔNG CẦN** tài khoản Apple Developer trả phí.

---

## ⚠️ VẤN ĐỀ QUAN TRỌNG

### ❌ KHÔNG THỂ build trên Windows!

Để build IPA, bạn **PHẢI CÓ**:
- ✅ Mac máy thật
- ✅ HOẶC máy ảo Mac (VMware/VirtualBox)
- ✅ HOẶC thuê Mac cloud
- ✅ HOẶC nhờ ai đó có Mac

**KHÔNG CÓ CÁCH NÀO** build IPA trên Windows!

---

## ✅ GIẢI PHÁP

### Cách 1: Máy ảo Mac (MIỄN PHÍ - Khuyến nghị)

Chi phí: **0 VNĐ**  
Thời gian setup: **3-5 giờ** (lần đầu)

#### Bước 1: Tải macOS ISO

```bash
# Tải macOS Monterey hoặc Ventura từ:
https://hackintosh.zone/
HOẶC
https://www.reddit.com/r/hackintosh/
```

#### Bước 2: Cài VMware hoặc VirtualBox

**VMware** (khuyến nghị):
- Tải: https://www.vmware.com/products/workstation-pro.html
- Hoặc torrent/crack

**VirtualBox** (miễn phí):
- Tải: https://www.virtualbox.org/wiki/Downloads
- Hoàn toàn miễn phí

#### Bước 3: Cài macOS trên VM

Hướng dẫn chi tiết:
- YouTube: "Install macOS on VMware Windows"
- Duration: 30-60 phút

#### Bước 4: Cài Xcode trên Mac ảo

```bash
# Mở Terminal trên Mac ảo
sudo xcode-select --install

# Tải Xcode từ App Store (miễn phí)
# Hoặc tải từ developer.apple.com
```

#### Bước 5: Build IPA

Làm theo hướng dẫn trong file `BUILD-IPA.md`

---

### Cách 2: Thuê Mac Cloud (TRẢ PHÍ - Nhanh)

Chi phí: **~$20-100**  
Thời gian: **30 phút - 1 giờ**

#### Option A: MacStadium
- Website: https://www.macstadium.com/
- Giá: $99/tháng
- Ưu: Ổn định
- Nhược: Đắt

#### Option B: AWS EC2 Mac
- Website: https://aws.amazon.com/ec2/instance-types/mac/
- Giá: ~$1/giờ (~$26/ngày)
- Ưu: Như máy thật
- Nhược: Đắt, chỉ dùng vài giờ

**⚠️ CẢNH BÁO**: AWS EC2 Mac đắt! Nhớ STOP ngay sau khi build xong!

#### Option C: MacinCloud
- Website: https://macincloud.com/
- Giá: $20-50/tháng
- Ưu: Rẻ hơn
- Nhược: Thấp hơn

---

### Cách 3: Mua Mac mini cũ (ĐẦU TƯ - Tốt nhất nếu nghiêm túc)

Chi phí: **2-5 triệu VNĐ** (một lần)  
Thời gian setup: **1-2 giờ**

#### Tìm mua:

**Shopee/Lazada:**
```
Search: "Mac mini 2012"
HOẶC "Mac mini 2014"
```

**Facebook Marketplace:**
- Tìm nhóm "Mua bán Mac"
- Giá 2-3 triệu cho Mac mini 2012

#### Tại sao Mac mini 2012?

- ✅ Giá rẻ (2-3 triệu)
- ✅ Vẫn chạy được Xcode 14
- ✅ Build IPA ngon lành
- ✅ Dùng mãi mãi

---

### Cách 4: Nhờ người khác build

Chi phí: **50k-200k VNĐ** (một lần)  
Thời gian: **30 phút - vài giờ**

#### Nơi tìm:

**Facebook:**
- Nhóm "React Native Vietnam"
- Nhóm "iOS Developer Vietnam"
- Post: "Nhờ build IPA, trả phí"

**Reddit:**
- r/reactnative
- r/iOSProgramming

**Fiverr:**
- https://www.fiverr.com/
- Search: "build expo ios ipa"
- Giá: $5-20

---

### Cách 5: Đăng ký Apple Developer

Chi phí: **$99/năm** (~2.3 triệu VNĐ)  
Ưu điểm: Build không giới hạn, TestFlight, App Store

#### Khi nào nên:

- ✅ App bạn đang nghiêm túc phát triển
- ✅ Cần test nhiều người
- ✅ Muốn upload App Store
- ✅ Có budget

#### Link đăng ký:

https://developer.apple.com/programs/

---

## 📋 HƯỚNG DẪN BUILD IPA (Sau khi có Mac)

### Bước 1: Clone project

```bash
cd ~
git clone https://github.com/your-repo/zalo-clone.git
cd zalo-clone/mobile-expo
```

### Bước 2: Install dependencies

```bash
npm install
```

### Bước 3: Prebuild iOS

```bash
npx expo prebuild --platform ios

# Chờ 5-10 phút
```

### Bước 4: Mở Xcode

```bash
open ios/zyeamobile.xcworkspace

# HOẶC double-click file .xcworkspace
```

### Bước 5: Cấu hình Xcode

1. Click vào project **zyeamobile** (icon xanh bên trái)
2. Click vào **Target** "zyeamobile"
3. Tab **"Signing & Capabilities"**
4. Tick **"Automatically manage signing"**
5. Chọn **Team**:
   - Nếu chưa có: Click "Add Account" → login Apple ID
   - Chọn Apple ID của bạn

### Bước 6: Build Archive

1. Menu **Product** → **Archive**
2. Chờ 10-20 phút
3. Cửa sổ **Organizer** tự động mở

### Bước 7: Export IPA

1. Click **"Distribute App"**
2. Chọn **"Development"** hoặc **"Ad Hoc"**
3. Click **"Next"**
4. Chọn team → **Next**
5. Chọn **"Export"** (không phải Upload)
6. Tick tất cả options → **Next**
7. Chọn thư mục lưu → **Export**
8. Đợi 2-5 phút

### Bước 8: Tìm file IPA

File `.ipa` sẽ ở thư mục bạn chọn (thường là Desktop)

---

## 📱 SỬ DỤNG IPA VỚI ESIGN

### Bước 1: Tải Esign về iPhone

**Cách 1: AltStore**
- Tải AltStore: https://altstore.io
- Cài AltStore
- Thêm nguồn Esign

**Cách 2: AltStore alternatives**
- Scarlet
- Sideloadly (cho máy tính)

### Bước 2: Upload IPA

1. Mở **Esign** trên iPhone
2. Upload file `.ipa` (qua Files app)
3. Click **"Install"**
4. Đăng nhập Apple ID khi được hỏi

### Bước 3: Trust Developer

1. Settings → General → VPN & Device Management
2. Trust developer certificate
3. Mở app

---

## 📱 SỬ DỤNG IPA VỚI SIDELOADLY

### Bước 1: Tải Sideloadly

- Website: https://sideloadly.app
- Tải về máy tính Windows/Mac

### Bước 2: Connect iPhone

1. Cắm iPhone vào máy tính
2. Trust máy tính trên iPhone
3. Unlock iPhone

### Bước 3: Sideload IPA

1. Mở **Sideloadly**
2. Chọn file `.ipa`
3. Chọn iPhone đã kết nối
4. Đăng nhập Apple ID
5. Click **Start**
6. Đợi 3-5 phút

### Bước 4: Trust trên iPhone

1. Settings → General → VPN & Device Management
2. Trust
3. Mở app

---

## ⚠️ LƯU Ý QUAN TRỌNG

### Với Apple ID miễn phí:

- ✅ Cài được 3 thiết bị
- ✅ Tự ký được
- ⚠️ Chỉ 7 ngày (sau đó phải ký lại)
- ❌ Không push notifications
- ❌ Không upload App Store

### Giải pháp:

1. **TrollStore** (iOS 14-15.5): Ký vĩnh viễn
2. **Apple Developer** ($99/năm): Không giới hạn
3. **Re-sign** mỗi tuần: Dùng Sideloadly

---

## 🎯 KHUYẾN NGHỊ

### Nếu:

- 💰 **Budget thấp**: Dùng **máy ảo Mac** (miễn phí)
- ⏰ **Cần nhanh**: **Nhờ người build** (50k-200k)
- 🎯 **Nghiêm túc**: **Mua Mac mini** hoặc **Apple Developer**
- 📱 **Test nội bộ**: **Esign/Sideloadly** với Apple ID miễn phí

---

## 📞 TRỢ GIÚP

Nếu gặp vấn đề:

1. Đọc file `BUILD-IPA.md`
2. Đọc file `BUILD-IPA-SOLUTION.md`
3. Kiểm tra log trong Xcode
4. Hỏi nhóm Facebook "React Native Vietnam"

---

## ✅ CHECKLIST

Trước khi build:

- [ ] Có Mac hoặc máy ảo Mac
- [ ] Có Apple ID
- [ ] Có Xcode cài đặt
- [ ] Project chạy được trên Expo Go
- [ ] Đã test app kỹ
- [ ] Icon và splash đã đúng

---

**CHÚC BẠN THÀNH CÔNG! 🎉**

