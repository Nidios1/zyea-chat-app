# ⚡ Hướng Dẫn Nhanh: Ký IPA Khi Báo Lỗi "No code signature found"

## 🎯 Vấn Đề

Khi cài IPA, báo lỗi: **"Failed to verify code signature: 0xe800801c (No code signature found)"**

➡️ **Nguyên nhân**: IPA file chưa được ký hoặc ký không đúng cách.

## ✅ Giải Pháp Nhanh

### Bước 1: Kiểm Tra IPA Đã Ký Hay Chưa

```bash
# Chạy script kiểm tra
node check-ipa-signature.js app.ipa
```

**Nếu báo "IPA CHƯA ĐƯỢC KÝ"** → Tiếp tục Bước 2

### Bước 2: Chọn Cách Ký (Chọn 1 trong các cách sau)

#### 🔥 Cách 1: Dùng eSign (Khuyến Nghị - Dễ Nhất)

1. **Cài eSign** trên iPhone
2. **Import certificate và profile** vào eSign:
   - Vào tab "证书" (Certificates)
   - Import file .p12 (certificate) và .mobileprovision (profile)
3. **Ký IPA**:
   - Vào tab "应用" → "未签名"
   - Import IPA file
   - Chọn "签名" → Chọn certificate và profile
   - Đợi ký xong → Export IPA đã ký
4. **Cài đặt**: Import IPA đã ký và cài

#### 🔥 Cách 2: Dùng AltStore (Tự Động)

1. **Cài AltStore** trên iPhone (qua AltServer trên máy tính)
2. **Mở AltStore** → Tab "My Apps"
3. **Nhấn "+"** → Chọn IPA file
4. AltStore sẽ **tự động ký và cài** (dùng Apple ID của bạn)

#### 🔥 Cách 3: Dùng Sideloadly (Windows/Mac)

1. **Download Sideloadly** cho Windows/Mac
2. **Kết nối iPhone** với máy tính
3. **Kéo thả IPA** vào Sideloadly
4. **Chọn Apple ID** → Nhấn "Start"
5. Sideloadly sẽ **tự động ký và cài**

### Bước 3: Kiểm Tra Lại

Sau khi ký, kiểm tra lại:

```bash
node check-ipa-signature.js signed.ipa
```

Nếu báo **"IPA ĐÃ ĐƯỢC KÝ"** → ✅ Thành công!

## ⚠️ Lưu Ý Quan Trọng

### 1. Bundle ID Phải Khớp

- Bundle ID trong `app.json`: `com.zyea.mobile`
- Bundle ID trong provisioning profile: **Phải giống** `com.zyea.mobile`

### 2. Certificate và Profile

- ✅ Certificate (.p12) phải còn hiệu lực
- ✅ Provisioning profile phải match với certificate
- ✅ Profile phải có Bundle ID đúng

### 3. Device UDID (Nếu dùng Development Profile)

- ✅ UDID của iPhone phải có trong provisioning profile
- ✅ Hoặc dùng Distribution/Ad Hoc profile (không cần UDID)

## 🔍 Troubleshooting

### Lỗi: "Provisioning profile doesn't match"
➡️ **Giải pháp**: Kiểm tra Bundle ID trong profile phải là `com.zyea.mobile`

### Lỗi: "Certificate expired"
➡️ **Giải pháp**: Tạo certificate mới và ký lại

### Lỗi: "Device not registered"
➡️ **Giải pháp**: Thêm UDID vào profile, hoặc dùng Distribution profile

### Lỗi: "Failed to verify code signature"
➡️ **Giải pháp**: 
1. Kiểm tra certificate và profile hợp lệ
2. Ký lại IPA với certificate và profile đúng
3. Đảm bảo Bundle ID khớp

## 📚 Tài Liệu Chi Tiết

- **Hướng dẫn chi tiết**: Xem `HUONG_DAN_KY_IPA_CHI_TIET.md`
- **Setup tự động**: Xem `HUONG_DAN_SIGNING_IPA.md`
- **Kiểm tra IPA**: Chạy `node check-ipa-signature.js app.ipa`

## 🚀 Ký Tự Động (Advanced)

Nếu muốn ký tự động khi build trên GitHub Actions:

1. Setup GitHub Secrets (xem `HUONG_DAN_SIGNING_IPA.md`)
2. Sử dụng workflow `build-ipa-signed.yml`
3. IPA sẽ tự động được ký khi build

## ✅ Checklist

- [ ] Đã kiểm tra IPA chưa ký: `node check-ipa-signature.js app.ipa`
- [ ] Đã có certificate (.p12) và provisioning profile (.mobileprovision)
- [ ] Bundle ID trong profile khớp với `com.zyea.mobile`
- [ ] Đã ký IPA bằng một trong các công cụ
- [ ] Đã kiểm tra lại IPA đã ký: `node check-ipa-signature.js signed.ipa`
- [ ] Đã cài đặt thành công trên iPhone

## 💡 Mẹo

1. **Dùng AltStore**: Dễ nhất, tự động quản lý certificate
2. **Free Apple ID**: Certificate chỉ valid 7 ngày, cần refresh
3. **Paid Developer**: Certificate valid 1 năm, không giới hạn apps
4. **Test trước**: Luôn test trên simulator trước khi build IPA

---

**Nếu vẫn gặp lỗi, xem file `HUONG_DAN_KY_IPA_CHI_TIET.md` để biết chi tiết hơn!**

