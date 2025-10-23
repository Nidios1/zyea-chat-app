# 🧪 TEST CHECKLIST - Kiểm tra IPA trên iPhone

## 📱 **THÔNG TIN THIẾT BỊ:**

Điền vào:
- [ ] **iPhone model:** _______________ (ví dụ: iPhone 14 Pro, iPhone 11, iPhone 8)
- [ ] **iOS version:** _______________ (ví dụ: iOS 17.2)
- [ ] **Screen type:** 
  - [ ] Home button (iPhone 8, SE)
  - [ ] Face ID + Notch (iPhone 11, 12, 13)
  - [ ] Face ID + Dynamic Island (iPhone 14 Pro, 15 Pro)

---

## 🔍 **1. KIỂM TRA VIEWPORT & SAFE AREA:**

### A. Mở Safari Dev Tools (nếu có Mac):
1. Settings → Safari → Advanced → Web Inspector: ON
2. Connect iPhone to Mac
3. Safari (Mac) → Develop → [Your iPhone] → ZaloClone
4. Console → Run:
   ```javascript
   // Check viewport-fit
   document.querySelector('meta[name="viewport"]').content
   // Should show: "... viewport-fit=cover"
   
   // Check safe area insets
   getComputedStyle(document.documentElement).getPropertyValue('padding-bottom')
   // Should show safe area value (e.g. "34px" on Face ID iPhones)
   ```

### B. Visual Check:
- [ ] **Khoảng đen ở dưới màn hình:** 
  - [ ] ✅ KHÔNG CÓ (Good!)
  - [ ] ❌ CÓ (Cần fix thêm)
  
- [ ] **Background extend hết màn hình:**
  - [ ] ✅ CÓ - Gradient xanh từ trên xuống dưới
  - [ ] ❌ KHÔNG - Có gaps

---

## 🔍 **2. BOTTOM NAVIGATION (Trang danh sách):**

### Check:
- [ ] **Bottom nav có bị che bởi home indicator không?**
  - [ ] ✅ KHÔNG - Icons còn space với indicator
  - [ ] ❌ CÓ - Icons bị che một phần
  
- [ ] **Padding dưới bottom nav:**
  - [ ] ✅ Đủ khoảng trống (~12px + safe-area)
  - [ ] ❌ Sát quá, không thoải mái

- [ ] **Khi tap vào icon:**
  - [ ] ✅ Tap chính xác, không miss
  - [ ] ❌ Khó tap, phải tap nhiều lần

### Chụp ảnh:
📸 Chụp 1 ảnh bottom nav, chú ý vùng dưới cùng

---

## 🔍 **3. CHAT AREA (Trang tin nhắn):**

### Check Message Input:
- [ ] **Message input có bị che không?**
  - [ ] ✅ KHÔNG - Thấy rõ input area
  - [ ] ❌ CÓ - Bị home indicator che

- [ ] **Khi gõ tin nhắn:**
  - [ ] ✅ Bàn phím lên, input vẫn thấy
  - [ ] ❌ Bàn phím che mất input

- [ ] **Padding dưới input area:**
  - [ ] ✅ Đủ space (~1rem + safe-area)
  - [ ] ❌ Sát home indicator

### Chụp ảnh:
📸 Chụp 1 ảnh chat view, focus vào input area dưới

---

## 🔍 **4. SCROLL BEHAVIOR:**

### Check Bounce:
- [ ] **Scroll danh sách tin nhắn xuống hết:**
  - [ ] ✅ Dừng đúng ở cuối, không bounce
  - [ ] ❌ Vẫn bounce, kéo xuống tiếp

- [ ] **Scroll danh sách tin nhắn lên đầu:**
  - [ ] ✅ Dừng đúng ở đầu, không bounce
  - [ ] ❌ Vẫn bounce, kéo lên tiếp

- [ ] **Scroll messages trong chat:**
  - [ ] ✅ Smooth, không bounce
  - [ ] ❌ Vẫn bounce

---

## 🔍 **5. SPLASH SCREEN:**

### Khi mở app:
- [ ] **Splash screen iOS native (ngay lập tức):**
  - [ ] ✅ Thấy gradient xanh + logo ngay
  - [ ] ❌ Thấy màn trắng/đen

- [ ] **Splash screen React (sau vài giây):**
  - [ ] ✅ Thấy large icon + text "Zyea+" + "Kết nối mọi người"
  - [ ] ❌ Layout khác

### Chụp ảnh:
📸 Screen record video mở app từ home screen (0-5 giây đầu)

---

## 🔍 **6. AVATARS:**

### Check:
- [ ] **Avatar ở danh sách tin nhắn:**
  - [ ] ✅ Hiển thị đúng
  - [ ] ❌ Không hiện (icon mặc định)

- [ ] **Avatar ở trong chat:**
  - [ ] ✅ Hiển thị đúng
  - [ ] ❌ Không hiện

- [ ] **Avatar ở trang cá nhân (tap "Cá nhân"):**
  - [ ] ✅ Hiển thị đúng
  - [ ] ❌ Không hiện ← **QUAN TRỌNG!**

### Chụp ảnh:
📸 Chụp trang cá nhân để check avatar

---

## 🔍 **7. PLATFORM DETECTION:**

### Open Console (Safari Dev Tools):
```javascript
// Check if Capacitor is detected
window.Capacitor?.isNativePlatform()
// Should return: true

// Check platform
window.Capacitor?.getPlatform()
// Should return: "ios"

// Check if running in PWA
window.matchMedia('(display-mode: standalone)').matches
// Should return: false (vì đang chạy native app)
```

- [ ] **Capacitor detected:** 
  - [ ] ✅ TRUE
  - [ ] ❌ FALSE (Lỗi!)

---

## 📝 **SUMMARY - TÓM TẮT KẾT QUẢ:**

### ✅ **Những gì OK:**
1. _______________________________
2. _______________________________
3. _______________________________

### ❌ **Những gì vẫn còn lỗi:**
1. _______________________________
2. _______________________________
3. _______________________________

### 📸 **Ảnh chụp màn hình:**
- [ ] Bottom nav
- [ ] Chat input area
- [ ] Personal profile avatar
- [ ] Splash screen (video)

---

## 🔧 **NẾU VẪN CÓ LỖI:**

### Lỗi: Khoảng đen ở dưới
**→ Report:**
- Device: _______
- iOS version: _______
- Screenshot: _______

### Lỗi: Bottom nav bị che
**→ Report:**
- Device: _______
- Screenshot: _______
- Console log: `getComputedStyle(document.querySelector('[bottom-nav-selector]')).paddingBottom`

### Lỗi: Avatar không hiện
**→ Report:**
- Nơi nào không hiện: _______
- Console errors: _______
- Network tab: Check 404 errors

---

## 📊 **SCORING:**

Đếm số ✅:
- **20-22 ✅**: Perfect! App hoàn hảo 🎉
- **15-19 ✅**: Good! Còn vài điểm nhỏ cần fix
- **10-14 ✅**: OK, nhưng cần fix thêm
- **< 10 ✅**: Nhiều issues, cần debug

---

**Điền checklist này và gửi lại kết quả để tôi biết cần fix gì thêm!** ✅

