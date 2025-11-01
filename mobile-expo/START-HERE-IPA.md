# 🎯 BẮT ĐẦU TỪ ĐÂY - BUILD IPA

## 👋 CHÀO MỪNG!

Bạn muốn build file **IPA** để cài lên iPhone bằng **Esign**?

## ⚠️ TÌNH HÌNH HIỆN TẠI

```
✅ Đã setup: EAS CLI
✅ Đã có: eas.json config
✅ Đã có: Script build tự động
✅ Đã tạo: Đầy đủ hướng dẫn

❌ Chưa có: Mac để build IPA
❌ Chưa có: File IPA
```

## 🚨 VẤN ĐỀ

**KHÔNG THỂ** build IPA trên Windows!

Apple chỉ cho phép build IPA trên Mac (máy thật hoặc máy ảo).

## ✅ GIẢI PHÁP

### Bước 1: Chọn phương án

| Phương án | Chi phí | Thời gian | Độ khó |
|-----------|---------|-----------|--------|
| **🖥️ Máy ảo Mac** | MIỄN PHÍ | 3-5 giờ | ⭐⭐⭐ |
| **☁️ Thuê Mac cloud** | $20-100 | 30 phút | ⭐ |
| **💻 Mac mini cũ** | 2-3 triệu | 1-2 giờ | ⭐⭐ |
| **🤝 Nhờ build** | 50k-200k | vài giờ | ⭐ |
| **🍎 Apple Developer** | $99/năm | 1 giờ | ⭐ |

### Bước 2: Đọc hướng dẫn chi tiết

**File quan trọng nhất**: 
```
📖 IPA-GUIDE-VIETNAMESE.md
```

File này có:
- ✅ Hướng dẫn đầy đủ bằng tiếng Việt
- ✅ Chi tiết từng phương án
- ✅ Screenshots và ví dụ
- ✅ Troubleshooting

### Bước 3: Follow hướng dẫn

1. Mở file `IPA-GUIDE-VIETNAMESE.md`
2. Chọn phương án phù hợp
3. Làm theo từng bước
4. Build IPA!

## 📂 TẤT CẢ FILE LIÊN QUAN

### Bắt đầu đọc:
1. **[IPA-GUIDE-VIETNAMESE.md](./IPA-GUIDE-VIETNAMESE.md)** ⭐⭐⭐⭐⭐ ← BẮT ĐẦU TỪ ĐÂY!

### Tùy chọn:
2. [QUICK-IPA-GUIDE.md](./QUICK-IPA-GUIDE.md) - Tóm tắt nhanh
3. [BUILD-IPA.md](./BUILD-IPA.md) - Hướng dẫn EAS Build
4. [BUILD-IPA-SOLUTION.md](./BUILD-IPA-SOLUTION.md) - Giải pháp tổng quan

### Scripts:
5. `build-ipa.bat` - Windows script
6. `build-ipa.sh` - Mac/Linux script

### Config:
7. `eas.json` - EAS Build config
8. `app.json` - App config

## 🎯 HƯỚNG DẪN NGẮN GỌN

### Nếu bạn CÓ Mac:

```bash
# 1. Mở Terminal trên Mac
cd zalo-clone/mobile-expo

# 2. Install dependencies
npm install

# 3. Prebuild iOS
npx expo prebuild --platform ios

# 4. Mở Xcode
open ios/zyeamobile.xcworkspace

# 5. Build trong Xcode
# Product → Archive → Distribute App → Export
```

### Nếu bạn KHÔNG có Mac:

Đọc file **[IPA-GUIDE-VIETNAMESE.md](./IPA-GUIDE-VIETNAMESE.md)** để xem hướng dẫn:
- Setup máy ảo Mac
- Thuê Mac cloud
- Các phương án khác

## 💡 TIPS

1. **Bắt đầu**: Đọc `IPA-GUIDE-VIETNAMESE.md` ngay!
2. **Nếu vội**: Nhờ ai đó build (50k-200k)
3. **Nếu tiết kiệm**: Setup máy ảo Mac (MIỄN PHÍ)
4. **Nếu nghiêm túc**: Mua Mac mini hoặc Apple Developer

## ❓ CẦN GIÚP?

1. Đọc `IPA-GUIDE-VIETNAMESE.md` trước
2. Kiểm tra error logs
3. Hỏi nhóm "React Native Vietnam" trên Facebook
4. Check Expo docs: https://docs.expo.dev

## 🎉 CHÚC MAY MẮN!

---

## 📖 NEXT: ĐỌC FILE NÀY

→ **[IPA-GUIDE-VIETNAMESE.md](./IPA-GUIDE-VIETNAMESE.md)** ← Click vào đây!

