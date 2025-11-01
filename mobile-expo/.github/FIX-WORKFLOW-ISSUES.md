# ⚠️ Vấn đề: Nhiều workflow đang chạy và bị lỗi

## 🔍 Tình trạng hiện tại

Trên GitHub Actions, bạn đang thấy:
- ❌ Workflow "Build iOS IPA" (workflow cũ) - ĐANG FAIL
- ✅ Workflow "Build Expo React Native iOS IPA" (workflow mới) - CÓ THỂ OK

## 🔧 Cách fix

### Bước 1: Disable workflow cũ trên GitHub

1. **Vào GitHub Actions:**
   - https://github.com/Nidios1/zyea-chat-app/actions

2. **Tìm workflow cũ:**
   - Tìm workflow có tên **"Build iOS IPA"** (KHÔNG có "Expo")
   - Hoặc workflow file `.github/workflows/build-ipa.yml`

3. **Disable workflow:**
   - Click vào workflow đó
   - Click **"..."** (3 chấm) ở góc trên bên phải
   - Chọn **"Disable workflow"**

### Bước 2: Chỉ giữ lại workflow mới

**Workflow ĐÚNG cần giữ:**
- ✅ **"Build Expo React Native iOS IPA"**
- ✅ **"Build iOS IPA - Simple EAS Build"** (nếu muốn dùng EAS)

**Workflow SAI cần disable:**
- ❌ **"Build iOS IPA"** (workflow cũ ở root)

### Bước 3: Chạy workflow mới

1. Vào: https://github.com/Nidios1/zyea-chat-app/actions
2. Chọn: **"Build Expo React Native iOS IPA"**
3. Click: **"Run workflow"** → **"Run workflow"**

---

## 📋 Danh sách workflow hiện tại

### Trong `mobile-expo/.github/workflows/`:
1. ✅ `build-expo-ipa.yml` - Build Expo Native (ĐÚNG)
2. ✅ `build-ipa-simple.yml` - EAS Build (ĐÚNG - cần EXPO_TOKEN)

### Trong root `.github/workflows/` (nếu có):
- ❌ Cần xóa hoặc disable tất cả

---

## 🎯 Khuyến nghị

**Dùng workflow EAS Build** (đơn giản nhất):
- Workflow: **"Build iOS IPA - Simple EAS Build"**
- Cần tạo EXPO_TOKEN trong GitHub Secrets
- Xem: `BUILD-IPA-GUIDE.md`

---

## ✅ Sau khi fix

Sau khi disable workflow cũ, chỉ còn:
- ✅ 1 workflow chạy mỗi lần push
- ✅ Không còn conflict
- ✅ Build thành công

