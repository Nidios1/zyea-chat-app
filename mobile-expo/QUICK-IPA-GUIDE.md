# ⚡ HƯỚNG DẪN NHANH - BUILD IPA

## 🎯 BẠN MUỐN GÌ?

Tạo file **.ipa** để cài lên iPhone bằng **Esign**

## ❌ VẤN ĐỀ

**KHÔNG THỂ** build IPA trên Windows!

## ✅ GIẢI PHÁP

### Cách nhanh nhất (5 phút đọc):

Đọc file **[IPA-GUIDE-VIETNAMESE.md](./IPA-GUIDE-VIETNAMESE.md)** ← File này chi tiết nhất!

### TL;DR (Tóm tắt):

#### Bạn có Mac?
```bash
cd zalo-clone/mobile-expo
npm install
npx expo prebuild --platform ios
open ios/zyeamobile.xcworkspace
# Làm theo hướng dẫn build trong Xcode
```

#### Bạn KHÔNG có Mac?

Chọn 1 trong các cách sau:

| Cách | Chi phí | Thời gian | Độ khó |
|------|---------|-----------|--------|
| 🖥️ Máy ảo Mac | **MIỄN PHÍ** | 3-5 giờ (setup) | ⭐⭐⭐ |
| ☁️ Thuê Mac cloud | $20-100 | 30 phút | ⭐ |
| 💻 Mac mini cũ | 2-3 triệu | 1-2 giờ | ⭐⭐ |
| 🤝 Nhờ build | 50k-200k | vài giờ | ⭐ |
| 🍎 Apple Dev | $99/năm | 1 giờ | ⭐ |

**Khuyến nghị**: Đọc **[IPA-GUIDE-VIETNAMESE.md](./IPA-GUIDE-VIETNAMESE.md)** để biết cách setup từng phương án!

---

## 📖 CÁC FILE HƯỚNG DẪN

1. **[IPA-GUIDE-VIETNAMESE.md](./IPA-GUIDE-VIETNAMESE.md)** ⭐⭐⭐ ← BẮT ĐẦU TỪ ĐÂY!
   - Hướng dẫn đầy đủ bằng tiếng Việt
   - Tất cả các phương án build IPA

2. **[BUILD-IPA.md](./BUILD-IPA.md)** ⭐⭐
   - Hướng dẫn build bằng EAS
   - Build trên Mac

3. **[BUILD-IPA-SOLUTION.md](./BUILD-IPA-SOLUTION.md)** ⭐⭐
   - Giải pháp cho nhiều tình huống
   - Cách setup máy ảo Mac
   - AWS EC2 Mac

---

## ⚡ SCRIPT TỰ ĐỘNG

### Windows:
```bash
.\build-ipa.bat
```

### Mac/Linux:
```bash
chmod +x build-ipa.sh
./build-ipa.sh
```

**Lưu ý**: Script chỉ chạy được nếu đã có Mac và đã setup EAS!

---

## 🎯 NEXT STEPS

1. **Đọc** file `IPA-GUIDE-VIETNAMESE.md` ngay bây giờ
2. **Chọn** phương án phù hợp với bạn
3. **Follow** hướng dẫn trong file đó
4. **Build** IPA!
5. **Cài** bằng Esign hoặc Sideloadly

---

## ❓ FAQ NHANH

**Q: Có thể build trên Windows không?**  
A: KHÔNG! Phải có Mac hoặc máy ảo Mac.

**Q: Cách rẻ nhất là gì?**  
A: Máy ảo Mac (MIỄN PHÍ).

**Q: Cách nhanh nhất là gì?**  
A: Nhờ ai đó build (50k-200k, vài giờ).

**Q: Cách tốt nhất để nghiêm túc?**  
A: Mua Mac mini hoặc Apple Developer ($99/năm).

**Q: File nào quan trọng nhất?**  
A: `IPA-GUIDE-VIETNAMESE.md` ← Đọc file này!

---

## 📞 CẦN GIÚP?

- Đọc `IPA-GUIDE-VIETNAMESE.md` trước
- Nếu vẫn lỗi, hỏi nhóm Facebook "React Native Vietnam"
- Check error log trong Terminal/Xcode

---

**Good luck! 🍀**

