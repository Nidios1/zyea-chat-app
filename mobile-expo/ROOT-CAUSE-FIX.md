# ROOT CAUSE FIX - Boolean/String Type Mismatch

## VẤN ĐỀ CHÍNH ĐÃ TÌM THẤY:

Lỗi xảy ra từ các **Context providers** được render ngay khi app start:

### 1. AuthContext (`isAuthenticated`, `loading`)
- ✅ Fixed: `isAuthenticated: Boolean(user && token)` thay vì `!!user && !!token`
- ✅ Fixed: `loading: Boolean(loading)` để đảm bảo luôn là boolean

### 2. ThemeContext (`isDarkMode`)
- ✅ Fixed: `Boolean(systemColorScheme === 'dark')` thay vì chỉ `systemColorScheme === 'dark'`
- ✅ Fixed: `Boolean(savedTheme === 'dark')` khi load từ AsyncStorage

### 3. AppContent (sử dụng contexts)
- ✅ Fixed: Convert `loading` và `isAuthenticated` sang boolean trước khi dùng

### 4. Notification Handler
- ✅ Fixed: Thêm `shouldShowBanner` và `shouldShowList` properties

## TẠI SAO LỖI XẢY RA?

Khi React Native render components, nó kiểm tra types của props trước khi pass vào native modules. Nếu một giá trị có thể là string (ví dụ từ AsyncStorage hoặc comparison operators), native bridge sẽ reject.

## CÁC CHỖ ĐÃ SỬA:

```typescript
// ❌ TRƯỚC (có thể trả về string nếu so sánh sai)
isAuthenticated: !!user && !!token
loading: loading

// ✅ SAU (luôn là boolean)
isAuthenticated: Boolean(user && token)
loading: Boolean(loading)
```

## TEST LẠI:

```bash
cd zalo-clone/mobile-expo

# Clear cache hoàn toàn
rm -rf node_modules/.expo
rm -rf .expo
rm -rf .expo-shared

# Restart
npx expo start --clear
```

Nếu vẫn lỗi, rebuild:
```bash
npx expo run:ios
# hoặc
npx expo run:android
```

## ĐIỂM QUAN TRỌNG:

Lỗi này xảy ra ở **ROOT LEVEL** - các Context providers được render **NGAY KHI APP START**, trước khi bất kỳ screen nào được load. Đó là lý do tại sao cần fix ở đây.

