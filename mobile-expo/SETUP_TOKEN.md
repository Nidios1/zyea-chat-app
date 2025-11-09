# 🎯 Hướng Dẫn Nhanh: Setup EXPO_TOKEN

## ✅ Bạn đã có token rồi!

Token của bạn: `vvmwGiStXgg0AS89Y6Lg1LwACUVp0P3x_fyqAbdD`

---

## 🚀 Cách 1: Set Environment Variable (Nhanh nhất - Windows PowerShell)

Mở PowerShell trong thư mục `mobile-expo` và chạy:

```powershell
$env:EXPO_TOKEN="vvmwGiStXgg0AS89Y6Lg1LwACUVp0P3x_fyqAbdD"
```

Sau đó chạy publish update:
```powershell
npm run update:publish "Test update"
```

⚠️ **Lưu ý:** Cách này chỉ hoạt động trong session PowerShell hiện tại. Nếu đóng PowerShell, phải set lại.

---

## 🔒 Cách 2: Tạo File .env (Khuyến nghị - Lâu dài)

1. **Tạo file `.env`** trong thư mục `mobile-expo`:

```
EXPO_TOKEN=vvmwGiStXgg0AS89Y6Lg1LwACUVp0P3x_fyqAbdD
```

2. **Đảm bảo `.env` đã có trong `.gitignore`** (để không commit token vào Git)

3. **Chạy publish update:**
```powershell
npm run update:publish "Test update"
```

✅ Script sẽ tự động đọc token từ file `.env`!

---

## 🧪 Test Token

Sau khi set token, test xem có hoạt động không:

```powershell
# Kiểm tra token đã được set
echo $env:EXPO_TOKEN

# Hoặc chạy publish update
npm run update:publish "Test update"
```

---

## 📋 Checklist

- [x] ✅ Đã có token: `vvmwGiStXgg0AS89Y6Lg1LwACUVp0P3x_fyqAbdD`
- [ ] Set token vào environment variable hoặc file `.env`
- [ ] Test publish update
- [ ] Đảm bảo `.env` trong `.gitignore`

---

## 🎉 Sau khi setup xong

Bạn có thể publish OTA update **KHÔNG CẦN NHẬP EMAIL** mỗi lần!

```powershell
# Publish cho production
npm run update:publish "Fix bug login"

# Publish cho preview
npm run update:publish:preview "Test new feature"
```

