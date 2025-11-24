# Hướng Dẫn Sửa Lỗi Sticker Không Hiển Thị

## Vấn Đề
Sticker không hiển thị trong StickerPicker (hiển thị "đang cập nhật" hoặc trống)

## Giải Pháp

### Bước 1: Clear Metro Bundler Cache

**Windows PowerShell:**
```powershell
# Dừng Metro bundler (Ctrl+C nếu đang chạy)
# Sau đó chạy:
npx expo start --clear
```

**Hoặc:**
```powershell
# Xóa cache thủ công
Remove-Item -Recurse -Force .expo
Remove-Item -Recurse -Force node_modules\.cache -ErrorAction SilentlyContinue
npx expo start --clear
```

### Bước 2: Kiểm Tra Files

Đảm bảo các file sticker đã tồn tại:
```powershell
Get-ChildItem assets\stickers\default\*.png | Measure-Object
# Phải có 24 files
```

### Bước 3: Kiểm Tra Console Logs

Mở DevTools và kiểm tra console khi mở StickerPicker:
- Phải thấy log: "🎨 StickerPicker opened"
- Phải thấy: "✅ Available packs: 1" (hoặc nhiều hơn)
- Phải thấy: "📋 Current pack: default - Stickers: 24"

### Bước 4: Restart App Hoàn Toàn

1. Đóng app hoàn toàn (swipe away trên mobile)
2. Dừng Metro bundler (Ctrl+C)
3. Chạy lại: `npx expo start --clear`
4. Mở lại app

### Bước 5: Kiểm Tra Code

Đảm bảo `src/data/stickerData.ts` có:
```typescript
{
  id: 'default',
  title: 'Default Stickers',
  stickers: [
    require('../../assets/stickers/default/001.png'),
    require('../../assets/stickers/default/002.png'),
    // ... tất cả 24 dòng phải có require() (không có //)
  ],
}
```

## Debug Thêm

Nếu vẫn không hiển thị, thêm log vào `StickerPicker.tsx`:
```typescript
console.log('Sticker packs:', stickerPacks);
console.log('Available packs:', availablePacks);
console.log('Current pack stickers:', currentPack?.stickers);
```

## Lưu Ý

- Metro bundler cần restart sau khi thêm assets mới
- Files phải có kích thước > 0 bytes
- Đường dẫn require() phải đúng (relative path từ stickerData.ts)

