# 🚀 BUILD IPA NHANH VỚI CODEMAGIC

## ⚡ 5 Bước Đơn Giản (15 phút)

### Bước 1: Đăng ký Codemagic (2 phút)
1. Vào: https://codemagic.io/signup
2. Click: **"Sign up with GitHub"**
3. Authorize Codemagic

---

### Bước 2: Add Repository (1 phút)
1. Sau khi login, click: **"Add application"**
2. Chọn: **"GitHub"**
3. Tìm và chọn: **"zyea-plus-social-network"**
4. Click: **"Finish: Add application"**

---

### Bước 3: Configure Workflow (2 phút)
1. Codemagic sẽ tự phát hiện file `codemagic.yaml`
2. Click: **"Start your first build"**
3. Chọn workflow:
   - **"ios-zyeaplus-workflow"** ← CHỌN CÁI NÀY (App mới)
   - hoặc "ios-messenger-workflow" (App messenger)

---

### Bước 4: Start Build (10 phút đợi)
1. Click: **"Start new build"**
2. Chọn branch: **"main"**
3. Click: **"Start build"**
4. Đợi ~10-15 phút build

**Lưu ý:** Lần đầu có thể hơi lâu (15-20 phút)

---

### Bước 5: Download IPA
1. Sau khi build xong (màu xanh ✓)
2. Click vào build
3. Tab **"Artifacts"**
4. Download file `.ipa`

---

## 📦 Free Tier Codemagic:

✅ **500 minutes/tháng** miễn phí  
✅ **Mac Mini M1** (build nhanh)  
✅ **Automatic code signing** (không cần setup phức tạp)  
✅ **Unlimited builds** cho public repos  

---

## ⚠️ Nếu Gặp Lỗi Code Signing:

Codemagic sẽ tự sign với **development certificate**.

**Nếu muốn sign với certificate riêng:**

1. Vào: **Application settings** → **Code signing identities**
2. Upload:
   - Certificate (.p12)
   - Provisioning Profile (.mobileprovision)
3. Nhập password của .p12

**Nhưng để test thì KHÔNG CẦN!** Codemagic tự sign development.

---

## 🎯 TÓM TẮT:

```
1. Đăng ký: https://codemagic.io/signup
2. Add repo: zyea-plus-social-network
3. Chọn workflow: ios-zyeaplus-workflow
4. Start build
5. Download IPA
```

---

## 📱 Cài IPA lên iPhone:

### Cách 1: AltStore (Windows/Mac)
1. Cài AltStore: https://altstore.io/
2. Connect iPhone qua USB
3. Drag IPA vào AltStore
4. Cài đặt

### Cách 2: Apple Configurator (Mac only)
1. Cài Apple Configurator từ App Store
2. Connect iPhone
3. Drag IPA vào

### Cách 3: Xcode (Mac only)
1. Xcode → Window → Devices and Simulators
2. Chọn iPhone
3. Click + → Chọn IPA

### Cách 4: Diawi (Online - Development only)
1. Upload IPA lên: https://www.diawi.com/
2. Copy link
3. Mở link trên iPhone Safari
4. Install

---

## 🔗 Links:

- **Codemagic Dashboard:** https://codemagic.io/apps
- **Docs:** https://docs.codemagic.io/yaml-quick-start/building-a-react-native-app/
- **Pricing:** https://codemagic.io/pricing/

---

**Bắt đầu ngay: https://codemagic.io/signup** 🚀

