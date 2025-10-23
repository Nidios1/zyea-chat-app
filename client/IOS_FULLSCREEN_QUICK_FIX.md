# ⚡ iOS Fullscreen Quick Fix - iPhone 11+ (Tai Thỏ/Notch)

## 🎯 Vấn Đề
App không full màn hình trên iPhone có tai thỏ (11, 12, 13, 14, 15, 16 Pro)

## ✅ Đã Fix Xong!

### 3 Files Đã Sửa:
1. ✅ `capacitor.config.ts` - iOS config
2. ✅ `src/styles/safe-area.css` - Remove body padding
3. ✅ `configure-ios-info-plist.js` - Auto config script (NEW)

## 🚀 Build Lại IPA - 3 Bước Đơn Giản

### Bước 1: Build & Sync
```bash
cd zalo-clone/client
npm run ios:rebuild
```

Lệnh này sẽ:
- Build React app
- Sync với iOS
- Auto config Info.plist

### Bước 2: Mở Xcode
```bash
npx cap open ios
```

### Bước 3: Config Trong Xcode
1. Select target **App**
2. **General** → **Deployment Info**
3. **UNCHECK** "Requires full screen" ✅ (quan trọng!)
4. **Signing** → Chọn Team và Provisioning Profile
5. **Product** → **Archive**
6. Export IPA

## 📋 Quick Checklist

- [ ] Chạy `npm run ios:rebuild`
- [ ] Mở Xcode
- [ ] UNCHECK "Requires full screen"
- [ ] Config signing
- [ ] Archive & export IPA
- [ ] Cài lên iPhone và test

## 🔧 Nếu Cần Manual Config

Trong Xcode, verify `Info.plist` có các keys:

```xml
<key>UIViewControllerBasedStatusBarAppearance</key>
<true/>
<key>UIStatusBarHidden</key>
<false/>
<key>UIRequiresFullScreen</key>
<false/>
```

## 🎉 Kết Quả Mong Đợi

✅ App full màn hình  
✅ Status bar hiển thị  
✅ Content không bị che bởi tai thỏ  
✅ Bottom không bị che bởi home indicator  

## 📖 Chi Tiết

Xem file `FIX_IOS_FULLSCREEN.md` để hiểu chi tiết về các thay đổi và troubleshooting.

---

💡 **Tip:** Sau khi cài IPA, nếu vẫn lỗi, xóa app và cài lại để clear cache!

