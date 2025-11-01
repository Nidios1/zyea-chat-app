# 🔄 Hướng dẫn Reload App

## Nếu app không update:

### Cách 1: Reload trong Expo Go
1. **Shake điện thoại** (hoặc menu trong Expo Go)
2. Chọn **"Reload"**
3. Đợi app build lại

### Cách 2: Restart Expo Server
```bash
cd C:\xampp\htdocs\zalo-clone\mobile-expo
# Nhấn Ctrl+C để dừng server
npx expo start --clear
```

### Cách 3: Kill và restart process
```powershell
# Tìm và kill process cũ
Get-Process | Where-Object {$_.ProcessName -like "*node*"} | Stop-Process

# Start lại
cd C:\xampp\htdocs\zalo-clone\mobile-expo
npx expo start
```

## ⚠️ Current Status

App hiện tại đã đơn giản:
- ✅ Chỉ có Navigation cơ bản
- ✅ Không có AuthContext, ThemeContext, etc.
- ✅ Chỉ render màn hình home đơn giản

Nếu app chạy OK → tiếp tục thêm features từng bước!

