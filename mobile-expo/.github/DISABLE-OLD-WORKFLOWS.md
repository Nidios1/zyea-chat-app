# ⚠️ QUAN TRỌNG: Disable workflow cũ trên GitHub

## Vấn đề

GitHub có thể vẫn đang chạy workflow Capacitor cũ. Cần disable hoặc xóa nó.

## Cách fix:

### Bước 1: Vào GitHub Actions
1. Mở: https://github.com/Nidios1/zyea-chat-app/actions
2. Xem danh sách workflows ở sidebar bên trái

### Bước 2: Disable workflow cũ
1. Tìm workflow có tên **"Build iOS IPA"** (không có "Expo")
2. Click vào workflow đó
3. Click **"..."** (3 chấm) ở góc trên bên phải
4. Chọn **"Disable workflow"**

### Bước 3: Xác nhận
- Chỉ giữ lại workflow: **"Build Expo iOS IPA Unsigned"**
- Xóa hoặc disable tất cả workflow khác có chứa "Capacitor"

### Bước 4: Chạy workflow mới
1. Vào tab **"Actions"**
2. Chọn **"Build Expo iOS IPA Unsigned"**
3. Click **"Run workflow"** → **"Run workflow"**

---

## Workflow đúng cần giữ:
✅ **Build Expo iOS IPA Unsigned** - Sử dụng Expo prebuild

## Workflow sai cần xóa/disable:
❌ **Build iOS IPA** - Sử dụng Capacitor (SAI!)

---

Sau khi disable, workflow Expo sẽ chạy đúng và build IPA unsigned thành công!

