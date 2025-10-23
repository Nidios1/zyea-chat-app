# 🎨 Khắc phục vấn đề Icon/Logo không hiển thị trên iOS

## ❌ Vấn đề hiện tại:
- App build bằng IPA không hiển thị logo/icon
- iOS yêu cầu PNG format, không hỗ trợ JPG cho app icons
- Thiếu splash screen và app icon đúng chuẩn iOS

## ✅ Giải pháp:

### Cách 1: Tự động generate icons (Khuyến nghị)

#### Bước 1: Chuẩn bị icon gốc
1. Tạo file PNG 1024x1024px (chất lượng cao)
2. Đặt tên: `icon.png`
3. Copy vào folder: `client/resources/`

#### Bước 2: Chuẩn bị splash screen
1. Tạo file PNG 2732x2732px
2. Đặt tên: `splash.png`
3. Copy vào folder: `client/resources/`

#### Bước 3: Generate assets tự động
```bash
cd client
npm install -g @capacitor/assets
npx capacitor-assets generate --iconBackgroundColor '#0084ff' --splashBackgroundColor '#0084ff'
```

Hoặc install local:
```bash
cd client
npm install @capacitor/assets --save-dev
npx capacitor-assets generate
```

---

### Cách 2: Manual - Convert JPG sang PNG

#### Bước 1: Convert online
1. Truy cập: https://cloudconvert.com/jpg-to-png
2. Upload file `Zyea.jpg` hoặc `app.jpg`
3. Convert sang PNG
4. Download về

#### Bước 2: Resize đúng kích thước
Tạo các kích thước sau (dùng tool như Photoshop, GIMP, hoặc online):

**App Icons (cần thiết):**
- 20x20
- 29x29
- 40x40
- 60x60
- 76x76
- 83.5x83.5
- 1024x1024 (App Store)

**Splash Screens:**
- 2732x2732 (iPad Pro 12.9")
- 2048x2732 (iPad Pro 12.9")
- 1668x2388 (iPad Pro 11")
- 1536x2048 (iPad Pro 10.5")
- 1242x2688 (iPhone Xs Max)
- 1125x2436 (iPhone X/Xs)
- 828x1792 (iPhone XR)
- 1242x2208 (iPhone 8 Plus)
- 750x1334 (iPhone 8)

#### Bước 3: Copy vào iOS project
```
client/ios/App/App/Assets.xcassets/AppIcon.appiconset/
client/ios/App/App/Assets.xcassets/Splash.imageset/
```

---

### Cách 3: Dùng tool online để generate tất cả

#### AppIcon.co
1. Truy cập: https://www.appicon.co/
2. Upload icon gốc (PNG 1024x1024)
3. Chọn: iOS
4. Download zip file
5. Extract và copy vào `client/ios/App/App/Assets.xcassets/`

#### MakeAppIcon.com
1. Truy cập: https://makeappicon.com/
2. Upload icon
3. Generate all sizes
4. Download và copy vào project

---

### Cách 4: Tạm thời - Dùng text logo

Nếu không có PNG, app sẽ hiển thị text logo "Zyea+" trong splash screen.

**Cách hoạt động:**
- SplashScreen component đã có fallback
- Hiển thị text "Zyea+" với gradient background
- Không cần icon file

---

## 🚀 Build lại IPA sau khi fix:

### Bước 1: Sau khi có PNG assets

```bash
# Copy icon và splash vào resources/
cp your-icon.png client/resources/icon.png
cp your-splash.png client/resources/splash.png

# Generate assets
cd client
npx capacitor-assets generate

# Sync với iOS
npx cap sync ios

# Build React
npm run build

# Sync lại
npx cap sync ios
```

### Bước 2: Commit & Push để build IPA

```bash
cd ..
git add .
git commit -m "Add iOS assets - icons and splash screens"
git push origin master
```

### Bước 3: Đợi GitHub Actions build

Truy cập: https://github.com/Nidios1/zyea-chat-app/actions

Download IPA mới từ Artifacts

---

## 🎯 Quick Fix: Generate PNG từ JPG hiện có

### Dùng PowerShell (Windows):

```powershell
# Install ImageMagick nếu chưa có
# Hoặc dùng online converter

# Hoặc dùng Paint.NET / GIMP để convert manual
```

### Dùng Node.js script:

Tạo file `convert-to-png.js`:

```javascript
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

async function convertToPNG() {
  const inputFile = path.join(__dirname, 'public', 'Zyea.jpg');
  const outputIcon = path.join(__dirname, 'resources', 'icon.png');
  const outputSplash = path.join(__dirname, 'resources', 'splash.png');
  
  // Create resources folder if not exists
  if (!fs.existsSync(path.join(__dirname, 'resources'))) {
    fs.mkdirSync(path.join(__dirname, 'resources'));
  }
  
  // Generate icon (1024x1024)
  await sharp(inputFile)
    .resize(1024, 1024, { fit: 'cover' })
    .png()
    .toFile(outputIcon);
  
  console.log('✅ Icon created:', outputIcon);
  
  // Generate splash (2732x2732)
  await sharp(inputFile)
    .resize(2732, 2732, { fit: 'contain', background: '#0084ff' })
    .png()
    .toFile(outputSplash);
  
  console.log('✅ Splash created:', outputSplash);
}

convertToPNG().catch(console.error);
```

Chạy:
```bash
cd client
npm install sharp
node convert-to-png.js
npx capacitor-assets generate
```

---

## 📝 Checklist:

- [ ] Có file `client/resources/icon.png` (1024x1024)
- [ ] Có file `client/resources/splash.png` (2732x2732)
- [ ] Chạy `npx capacitor-assets generate`
- [ ] Chạy `npm run build`
- [ ] Chạy `npx cap sync ios`
- [ ] Commit & push
- [ ] Build IPA trên GitHub Actions
- [ ] Download & test

---

## 🆘 Nếu vẫn không hiển thị:

1. **Kiểm tra file tồn tại:**
   ```bash
   ls client/resources/
   ls client/ios/App/App/Assets.xcassets/AppIcon.appiconset/
   ```

2. **Kiểm tra manifest.json:**
   - Đảm bảo icons[] đúng đường dẫn

3. **Xóa build cũ:**
   ```bash
   cd client
   rm -rf ios/App/App/Assets.xcassets/
   npx cap sync ios
   ```

4. **Rebuild clean:**
   ```bash
   rm -rf build
   npm run build
   npx cap sync ios
   ```

---

Chúc bạn fix thành công! 🎉

