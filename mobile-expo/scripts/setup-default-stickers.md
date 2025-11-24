# Hướng Dẫn Tải Sticker Mặc Định

## Cách 1: Tải Tự Động (Khuyến Nghị)

### Bước 1: Chạy Script Tải Sticker

```bash
node scripts/download-stickers.js
```

Script này sẽ tự động tải 24 sticker emoji từ nguồn miễn phí và lưu vào `assets/stickers/default/`.

### Bước 2: Cập Nhật stickerData.ts

Sau khi tải xong, mở file `src/data/stickerData.ts` và uncomment (bỏ dấu //) các dòng require:

```typescript
{
  id: 'default',
  title: 'Default Stickers',
  stickers: [
    require('../../assets/stickers/default/001.png'),
    require('../../assets/stickers/default/002.png'),
    // ... uncomment tất cả 24 dòng
  ],
}
```

## Cách 2: Tải Thủ Công

### Nguồn Sticker Miễn Phí:

1. **OpenMoji** (Khuyến nghị)
   - Website: https://openmoji.org/
   - Tải emoji PNG 512x512px
   - Miễn phí, mã nguồn mở

2. **Flaticon**
   - Website: https://www.flaticon.com/
   - Tìm "sticker" hoặc "emoji"
   - Cần đăng ký miễn phí

3. **Canva**
   - Website: https://www.canva.com/
   - Tạo sticker template miễn phí
   - Xuất PNG với nền trong suốt

4. **Pixabay**
   - Website: https://pixabay.com/
   - Tìm "sticker" hoặc "emoji"
   - Miễn phí, không cần attribution

### Yêu Cầu Sticker:

- **Định dạng**: PNG hoặc WebP
- **Kích thước**: 512x512 pixels
- **Nền**: Trong suốt (transparent)
- **Số lượng**: 24 sticker
- **Tên file**: `001.png`, `002.png`, ..., `024.png`

### Các Chủ Đề Gợi Ý:

1. **Cảm xúc**: 😀 😁 😂 😃 😄 😅 😆 😇 😉 😊 😋 😌 😍 😎 😏 😘 😗 😙 😚 😛 😜 😝 😞 😟
2. **Động vật dễ thương**: 🐶 🐱 🐭 🐹 🐰 🦊 🐻 🐼 🐨 🐯 🦁 🐮 🐷 🐸 🐵 🐔 🐧 🐦 🐤
3. **Cử chỉ**: 👍 👎 👌 ✌️ 🤞 🤟 🤘 👏 🙌 🙏 👋 🤙 💪
4. **Phản ứng**: ❤️ 💛 💚 💙 💜 🧡 🖤 🤍 💔 💕 💞 💓 💗 💖 💘 💝

## Cách 3: Tạo Placeholder (Để Test)

Nếu bạn muốn test ngay mà chưa có sticker thật:

```bash
# Cài đặt canvas (nếu chưa có)
npm install canvas

# Tạo placeholder stickers
node scripts/generate-placeholder-stickers.js
```

Sau đó uncomment các dòng require trong `stickerData.ts`.

## Sau Khi Có Sticker

1. Đảm bảo tất cả file sticker đã có trong `assets/stickers/default/`
2. Uncomment các dòng require trong `src/data/stickerData.ts`
3. Restart app: `npm start`
4. Mở chat và nhấn nút sticker để kiểm tra!

## Lưu Ý

- Sticker sẽ không hiển thị nếu file không tồn tại
- Đảm bảo đường dẫn trong `require()` đúng với vị trí file
- Format PNG được khuyến nghị hơn WebP cho React Native

