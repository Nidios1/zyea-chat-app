# 🚀 HƯỚNG DẪN BUILD & KÝ IPA BẰNG ESIGN

## 📋 Quy trình đơn giản:

```
GitHub Actions → Build IPA chưa ký → Download → ESign ký → Cài lên iPhone
```

---

## BƯỚC 1: BUILD IPA TRÊN GITHUB

### 1.1. Truy cập GitHub Actions
```
https://github.com/Nidios1/zyea-plus-social-network/actions
```

### 1.2. Chọn workflow
- Click vào **"Build Unsigned IPA (for ESign)"**

### 1.3. Chạy workflow
- Click nút **"Run workflow"** (màu xanh)
- Branch: **main**
- Click **"Run workflow"**

### 1.4. Đợi build xong
- ⏱️ Thời gian: ~10-15 phút
- 🟡 Màu vàng = Đang chạy
- ✅ Màu xanh = Thành công
- ❌ Màu đỏ = Lỗi

### 1.5. Download IPA
**Cách 1: Từ Artifacts**
- Scroll xuống cuối trang workflow run
- Section **Artifacts**
- Download **ZyeaPlus-Unsigned-IPA.zip**
- Giải nén → được file `.ipa`

**Cách 2: Từ Releases**
- https://github.com/Nidios1/zyea-plus-social-network/releases
- Download file IPA mới nhất

---

## BƯỚC 2: KÝ VÀ CÀI ĐẶT BẰNG ESIGN

### 2.1. Cài đặt ESign lên iPhone

**Option A: Qua AltStore/Sideloadly (từ PC)**
1. Tải AltStore: https://altstore.io/
2. Hoặc Sideloadly: https://sideloadly.io/
3. Cài AltStore/Sideloadly lên máy tính
4. Connect iPhone qua USB
5. Cài ESign IPA từ: https://esign.yyyue.xyz/

**Option B: Direct install (nếu có link)**
- Mở Safari trên iPhone
- Vào: https://esign.yyyue.xyz/
- Làm theo hướng dẫn cài đặt

### 2.2. Trust ESign
1. **Settings** → **General** → **VPN & Device Management**
2. Tap vào developer profile
3. **Trust**

### 2.3. Import IPA vào ESign
1. Mở app **ESign** trên iPhone
2. Có 3 cách import:

   **Cách 1: Qua Airdrop**
   - Gửi file IPA từ Mac/PC qua Airdrop
   - Chọn "Open in ESign"

   **Cách 2: Qua Files app**
   - Copy IPA vào iCloud Drive hoặc Files
   - Trong ESign → Import → chọn file

   **Cách 3: Qua URL**
   - Upload IPA lên Google Drive/Dropbox
   - Copy link download
   - Trong ESign → Import from URL

### 2.4. Ký và cài đặt
1. Trong ESign, chọn file IPA vừa import
2. Tap **"Sign"**
3. Chọn certificate (nếu có nhiều)
4. Đợi signing xong
5. Tap **"Install"**
6. Làm theo hướng dẫn trên màn hình

### 2.5. Trust app sau khi cài
1. **Settings** → **General** → **VPN & Device Management**
2. Tap vào app profile
3. **Trust**

---

## 🎯 CÁCH KHÁC (KHÔNG CẦN ESIGN)

### Option 1: Sideloadly (PC/Mac)
1. Tải Sideloadly: https://sideloadly.io/
2. Connect iPhone qua USB
3. Drag & drop file IPA vào Sideloadly
4. Nhập Apple ID (miễn phí cũng được)
5. Click **Start**
6. Đợi cài đặt xong

### Option 2: AltStore (PC/Mac)
1. Cài AltStore: https://altstore.io/
2. Connect iPhone qua USB
3. Mở AltStore trên iPhone
4. **My Apps** → dấu **+**
5. Chọn file IPA
6. Đợi cài đặt

### Option 3: Xcode (Chỉ Mac)
```bash
xcrun devicectl device install app --device <DEVICE_ID> /path/to/App.ipa
```

---

## ⚠️ LƯU Ý QUAN TRỌNG

### Certificate hết hạn
- **Free Apple ID**: 7 ngày
- **Apple Developer**: 1 năm
- Hết hạn phải ký lại

### App bị crash
1. Kiểm tra backend server có chạy không
2. Kiểm tra network connection
3. Xem logs trong Console app (Mac)

### "Unable to Install"
- Device chưa được trust
- Certificate không hợp lệ
- Thử ký lại với certificate khác

### "Untrusted Developer"
- Settings → General → Device Management
- Trust developer

---

## 🔄 UPDATE APP

Khi có phiên bản mới:
1. Build IPA mới trên GitHub
2. Download IPA mới
3. Cài đè lên app cũ (không mất data)

---

## 📱 THÔNG TIN APP

- **App Name**: Zyea+
- **Bundle ID**: com.zyea.app
- **Version**: 1.0.0
- **Minimum iOS**: 13.0+

---

## 🆘 TROUBLESHOOTING

### Build thất bại trên GitHub
1. Xem logs chi tiết
2. Thường do:
   - npm install lỗi
   - Build React app lỗi
   - Pod install lỗi

### Không import được vào ESign
- Đảm bảo file có đuôi `.ipa`
- Thử compress lại thành `.zip` rồi đổi thành `.ipa`

### ESign không sign được
- Cần có certificate hợp lệ
- Thử dùng Sideloadly/AltStore thay thế

---

## 📚 LINKS HỮU ÍCH

- **ESign**: https://esign.yyyue.xyz/
- **AltStore**: https://altstore.io/
- **Sideloadly**: https://sideloadly.io/
- **GitHub Actions**: https://github.com/Nidios1/zyea-plus-social-network/actions
- **Releases**: https://github.com/Nidios1/zyea-plus-social-network/releases

---

## ✅ CHECKLIST

- [ ] Build IPA trên GitHub
- [ ] Download file IPA
- [ ] Cài ESign lên iPhone (hoặc dùng Sideloadly/AltStore)
- [ ] Import IPA vào ESign
- [ ] Sign IPA
- [ ] Install lên iPhone
- [ ] Trust developer trong Settings
- [ ] Mở app và test

---

**🎉 Xong! Giờ bạn có thể build và cài IPA mà không cần Apple Developer Account!**

