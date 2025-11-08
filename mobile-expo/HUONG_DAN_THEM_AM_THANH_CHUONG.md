# Hướng Dẫn Thêm Âm Thanh Chuông Khi Gọi Điện

## Tổng Quan

Hiện tại, app sử dụng **vibration pattern** để tạo hiệu ứng đổ chuông khi gọi điện (giống Facebook). Để thêm **âm thanh thực sự**, bạn cần thêm file ringtone.

## Cách Hoạt Động Hiện Tại

- ✅ **Vibration pattern**: Tạo hiệu ứng rung giống phone ring (vibrate-vibrate-pause)
- ✅ **Tự động phát**: Khi cuộc gọi ở trạng thái 'ringing' hoặc 'calling'
- ✅ **Tự động dừng**: Khi cuộc gọi được chấp nhận, từ chối, hoặc kết thúc

## Thêm Âm Thanh Thực Sự

### Bước 1: Tạo File Âm Thanh

1. **Tạo thư mục sounds:**
```bash
mkdir -p assets/sounds
```

2. **Thêm file ringtone:**
   - Tên file: `ringtone.mp3` hoặc `ringtone.wav`
   - Độ dài: 2-3 giây (sẽ loop)
   - Format: MP3 hoặc WAV
   - Chất lượng: 44.1kHz, stereo hoặc mono

3. **Nguồn file ringtone:**
   - Tải từ internet (free ringtones)
   - Tạo bằng audio editor
   - Sử dụng system ringtone

### Bước 2: Cập Nhật Hook

Mở file `src/hooks/useRingingSound.ts` và uncomment phần code:

```typescript
try {
  const { sound } = await Audio.Sound.createAsync(
    require('../../assets/sounds/ringtone.mp3'),
    {
      shouldPlay: true,
      isLooping: true,
      volume: 0.8,
      isMuted: false,
    }
  );
  soundRef.current = sound;
  console.log('✅ Ringtone audio loaded and playing');
  return;
} catch (fileError) {
  console.log('Ringtone file not found, using vibration only');
}
```

### Bước 3: Test

1. Thêm file ringtone vào `assets/sounds/ringtone.mp3`
2. Restart app
3. Thử gọi điện/video
4. Kiểm tra:
   - Âm thanh có phát không
   - Vibration có hoạt động không
   - Âm thanh dừng khi chấp nhận/từ chối cuộc gọi

## Tùy Chỉnh

### Thay Đổi Volume

```typescript
volume: 0.8, // 0.0 - 1.0 (80% volume)
```

### Thay Đổi Pattern Vibration

Trong `useRingingSound.ts`, bạn có thể thay đổi pattern:

```typescript
const ringPattern = Platform.OS === 'ios' 
  ? [0, 200, 100, 200] // vibrate-200ms, pause-100ms, vibrate-200ms
  : [0, 200, 100, 200, 1400]; // Android pattern
```

### Tắt Vibration, Chỉ Dùng Âm Thanh

```typescript
// Comment out vibration code, chỉ dùng audio
// Vibration.vibrate(ringPattern, true);
```

## Lưu Ý

1. **File size**: Giữ file nhỏ (< 500KB) để load nhanh
2. **Format**: MP3 hoặc WAV được hỗ trợ tốt
3. **Loop**: File sẽ loop khi đang đổ chuông
4. **Volume**: Điều chỉnh volume phù hợp (0.7-0.9)
5. **Permissions**: Đảm bảo app có quyền phát âm thanh

## Troubleshooting

### Âm thanh không phát

1. **Kiểm tra file tồn tại:**
   ```bash
   ls assets/sounds/ringtone.mp3
   ```

2. **Kiểm tra format:**
   - Đảm bảo file là MP3 hoặc WAV
   - Kiểm tra file không bị corrupt

3. **Kiểm tra volume:**
   - Điều chỉnh volume trong code
   - Kiểm tra volume thiết bị

4. **Kiểm tra logs:**
   - Xem console logs có lỗi không
   - Kiểm tra `✅ Ringtone audio loaded and playing`

### Vibration không hoạt động

1. **Kiểm tra permissions:**
   - App có quyền vibration không
   - Kiểm tra device settings

2. **Kiểm tra platform:**
   - iOS và Android có pattern khác nhau
   - Test trên cả 2 platform

## Kết Luận

Hiện tại app đã có:
- ✅ Vibration pattern giống phone ring
- ✅ Tự động phát/dừng khi gọi
- ✅ Hỗ trợ cả iOS và Android

Để thêm âm thanh:
1. Thêm file ringtone vào `assets/sounds/`
2. Uncomment code trong `useRingingSound.ts`
3. Test và điều chỉnh volume

## File Structure

```
assets/
  sounds/
    ringtone.mp3  # Add this file
```

## Example Ringtone

Bạn có thể tìm ringtone miễn phí tại:
- https://freesound.org
- https://www.zapsplat.com
- https://mixkit.co/free-sound-effects/phone/

Hoặc tạo bằng audio editor như Audacity.

