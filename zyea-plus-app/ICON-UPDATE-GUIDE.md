# 🎨 HƯỚNG DẪN CẬP NHẬT ICON APP

## ✅ **ĐÃ HOÀN THÀNH:**

- ✅ Thêm icon mới từ `yeaapp.jpg`
- ✅ Tạo tất cả sizes icon cho iOS (13 sizes)
- ✅ Bo tròn góc đúng chuẩn iOS (22.5% corner radius)
- ✅ Cập nhật vào iOS project
- ✅ Push lên GitHub

---

## 📋 **ICON SIZES ĐÃ TẠO:**

### **iPhone:**
- 20x20 (@2x, @3x) - Spotlight, Settings
- 29x29 (@2x, @3x) - Settings
- 40x40 (@2x, @3x) - Spotlight
- 60x60 (@2x, @3x) - Home Screen

### **iPad:**
- 20x20 (@1x, @2x)
- 29x29 (@1x, @2x)
- 40x40 (@1x, @2x)
- 76x76 (@1x, @2x)
- 83.5x83.5 (@2x) - iPad Pro

### **App Store:**
- 1024x1024 (@1x) - App Store Marketing

**Tổng cộng: 13 icon files**

---

## 🎨 **ĐẶC ĐIỂM ICON:**

### **Corner Radius (Bo góc):**
- **22.5%** của kích thước icon
- Đúng chuẩn iOS Design Guidelines
- Tự động tính toán cho mỗi size

### **Fit & Position:**
- **Fit**: Cover (phủ đầy)
- **Position**: Center (căn giữa)
- Crop tự động nếu ảnh không vuông

---

## 🔄 **CÁCH CẬP NHẬT ICON SAU NÀY:**

### **Bước 1: Chuẩn bị ảnh mới**

1. Ảnh nên là **vuông** (1024x1024 hoặc lớn hơn)
2. Format: PNG hoặc JPG
3. Nội dung quan trọng nên ở giữa (vì sẽ bo góc)

### **Bước 2: Copy ảnh vào resources/**

```bash
# Option 1: Đổi tên thành icon.png
cp your-new-icon.png zyea-plus-app/resources/icon.png

# Option 2: Copy trực tiếp
Copy-Item "your-new-icon.png" -Destination "zyea-plus-app/resources/icon.png" -Force
```

### **Bước 3: Generate icons mới**

```bash
cd zyea-plus-app
npm run generate:icons
```

Script sẽ tự động:
- Resize 13 sizes
- Bo tròn góc 22.5%
- Lưu vào `ios/App/App/Assets.xcassets/AppIcon.appiconset/`
- Tạo file `Contents.json`

### **Bước 4: Sync với iOS**

```bash
npx cap sync ios
```

### **Bước 5: Commit và push**

```bash
git add zyea-plus-app/
git commit -m "Update app icon"
git push origin main
```

### **Bước 6: Build IPA mới**

1. Truy cập: https://github.com/Nidios1/zyea-plus-social-network/actions
2. Chọn "Build Unsigned IPA (for ESign)"
3. Run workflow
4. Download IPA mới
5. Cài lên iPhone → Icon mới sẽ hiển thị!

---

## 📁 **CẤU TRÚC FILES:**

```
zyea-plus-app/
├── resources/
│   └── icon.png                    # Icon gốc (source)
├── ios/
│   └── App/
│       └── App/
│           └── Assets.xcassets/
│               └── AppIcon.appiconset/
│                   ├── AppIcon-20.png
│                   ├── AppIcon-29.png
│                   ├── ...
│                   ├── AppIcon-1024.png
│                   └── Contents.json
├── generate-rounded-icons.js       # Script generate icons
└── package.json                    # Có script "generate:icons"
```

---

## 🛠️ **SCRIPT GENERATE:**

### **File: `generate-rounded-icons.js`**

Tính năng:
- ✅ Đọc `resources/icon.png`
- ✅ Resize thành 13 sizes iOS
- ✅ Bo góc tròn 22.5% (chuẩn iOS)
- ✅ Export PNG chất lượng cao
- ✅ Tạo `Contents.json` tự động

### **Sử dụng:**

```bash
# Chạy trực tiếp
node generate-rounded-icons.js

# Hoặc qua npm script
npm run generate:icons
```

---

## 🎯 **TIPS & TRICKS:**

### **1. Test icon trước khi commit:**

```bash
# Generate icons
npm run generate:icons

# Sync
npx cap sync ios

# Mở Xcode để xem preview (nếu có Mac)
npx cap open ios
```

### **2. Icon design tips:**

- ✅ Đơn giản, rõ ràng
- ✅ Dễ nhận diện ở size nhỏ (20x20)
- ✅ Không có text (hoặc text rất to)
- ✅ Màu sắc tương phản
- ✅ Nội dung chính ở giữa (vì bo góc)

### **3. Icon không hiển thị sau khi cài?**

Nguyên nhân:
- iPhone cache icon cũ
- Cần xóa app và cài lại
- Hoặc restart iPhone

Giải pháp:
```bash
# 1. Xóa app trên iPhone
# 2. Restart iPhone
# 3. Cài IPA mới
```

### **4. Muốn test với nhiều icon khác nhau:**

```bash
# Backup icon cũ
cp resources/icon.png resources/icon-backup.png

# Test icon mới
cp new-icon.png resources/icon.png
npm run generate:icons

# Restore nếu không thích
cp resources/icon-backup.png resources/icon.png
npm run generate:icons
```

---

## 📚 **DEPENDENCIES:**

### **Package: `sharp`**

Đã cài trong `devDependencies`:
```json
{
  "devDependencies": {
    "sharp": "^0.33.x"
  }
}
```

Nếu gặp lỗi:
```bash
npm install --save-dev sharp
```

---

## ✅ **CHECKLIST CẬP NHẬT ICON:**

- [ ] Chuẩn bị ảnh vuông (1024x1024+)
- [ ] Copy vào `resources/icon.png`
- [ ] Chạy `npm run generate:icons`
- [ ] Check icons đã tạo trong `ios/.../AppIcon.appiconset/`
- [ ] Chạy `npx cap sync ios`
- [ ] Commit và push lên GitHub
- [ ] Build IPA mới trên GitHub
- [ ] Cài lên iPhone và kiểm tra

---

## 🎉 **KẾT QUẢ:**

App sẽ có icon mới với:
- ✅ Bo góc tròn đẹp (đúng chuẩn iOS)
- ✅ Hiển thị rõ ở mọi kích thước
- ✅ Tự động adapt cho iPhone và iPad
- ✅ Ready cho App Store submission

---

**Happy Icon Updating! 🚀**

