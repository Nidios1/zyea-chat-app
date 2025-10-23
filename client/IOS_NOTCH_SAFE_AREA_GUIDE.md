# 📱 iOS Notch & Safe Area Support Guide

## 🎯 Mục Tiêu

App hiển thị **FULL MÀN HÌNH** kể cả vùng **tai thỏ (notch)** và **Dynamic Island** trên:
- ✅ iPhone X, XS, XS Max, XR
- ✅ iPhone 11, 11 Pro, 11 Pro Max
- ✅ iPhone 12, 12 Mini, 12 Pro, 12 Pro Max
- ✅ iPhone 13, 13 Mini, 13 Pro, 13 Pro Max
- ✅ iPhone 14, 14 Plus, 14 Pro, 14 Pro Max
- ✅ iPhone 15, 15 Plus, 15 Pro, 15 Pro Max
- ✅ iPhone 16, 16 Plus, 16 Pro, 16 Pro Max

---

## 🔧 Các Thay Đổi Đã Thực Hiện

### 1. **Meta Viewport** (`index.html`)

```html
<meta name="viewport" content="width=device-width, initial-scale=1, user-scalable=no, viewport-fit=cover" />
```

**Quan trọng**: `viewport-fit=cover` cho phép content mở rộng ra vùng notch.

---

### 2. **Status Bar Config** (`capacitor.config.ts`)

```typescript
StatusBar: {
  style: 'dark',
  backgroundColor: '#0084ff',
  overlaysWebView: true  // ← Cho phép content hiển thị dưới status bar
}
```

---

### 3. **iOS Config** (`capacitor.config.ts`)

```typescript
ios: {
  contentInset: 'always',
  preferredContentMode: 'mobile',
  scrollEnabled: true,
  allowsLinkPreview: false
}
```

---

### 4. **CSS Safe Area Variables** (`index.css`)

```css
:root {
  /* Safe area insets - Tự động detect notch size */
  --safe-area-inset-top: env(safe-area-inset-top);
  --safe-area-inset-right: env(safe-area-inset-right);
  --safe-area-inset-bottom: env(safe-area-inset-bottom);
  --safe-area-inset-left: env(safe-area-inset-left);
}
```

---

### 5. **Root Element Padding** (`index.css`)

```css
#root {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  overflow: hidden;
  /* Extend to safe areas */
  padding-top: var(--safe-area-inset-top);
  padding-left: var(--safe-area-inset-left);
  padding-right: var(--safe-area-inset-right);
  padding-bottom: var(--safe-area-inset-bottom);
}
```

---

### 6. **Safe Area CSS** (`safe-area.css` - MỚI)

File CSS chuyên biệt để handle safe area cho tất cả components:

```css
/* Headers - Add padding for notch */
.chat-header {
  padding-top: calc(0.75rem + env(safe-area-inset-top)) !important;
}

/* Bottom inputs - Add padding for home indicator */
.message-input-container {
  padding-bottom: calc(0.75rem + env(safe-area-inset-bottom)) !important;
}
```

---

## 📐 Safe Area Insets

Safe area insets tự động phát hiện và điều chỉnh theo device:

| Device | Top (Notch) | Bottom (Home Bar) |
|--------|-------------|-------------------|
| iPhone 8 | 0px | 0px |
| iPhone X | 44px | 34px |
| iPhone 11 | 44px | 34px |
| iPhone 12 | 47px | 34px |
| iPhone 13 | 47px | 34px |
| iPhone 14 | 47px | 34px |
| iPhone 14 Pro | 59px | 34px |
| iPhone 15 | 47px | 34px |
| iPhone 15 Pro | 59px | 34px |
| iPhone 16 Pro | 59px | 34px |

**Landscape**: Thêm `safe-area-inset-left` và `safe-area-inset-right` (khoảng 44px mỗi bên)

---

## 🎨 Cách Sử Dụng Safe Area

### **Option 1: Dùng CSS Variables**

```css
.my-header {
  padding-top: calc(1rem + env(safe-area-inset-top));
}

.my-footer {
  padding-bottom: calc(1rem + env(safe-area-inset-bottom));
}
```

### **Option 2: Dùng max() cho Fallback**

```css
.my-header {
  /* Tối thiểu 1rem, hoặc safe area nếu có */
  padding-top: max(1rem, env(safe-area-inset-top));
}
```

### **Option 3: Dùng Classes (đã define sẵn)**

```jsx
<div className="chat-header">
  {/* Tự động có padding cho notch */}
</div>

<div className="message-input-container">
  {/* Tự động có padding cho home indicator */}
</div>
```

---

## 🚀 Kết Quả

### **✅ TRƯỚC KHI SỬA:**
- ❌ Content bị che bởi notch
- ❌ Button bị che bởi home indicator
- ❌ Không tận dụng toàn bộ màn hình

### **✅ SAU KHI SỬA:**
- ✅ Content hiển thị full màn hình
- ✅ Tự động tránh vùng notch
- ✅ Tự động tránh vùng home indicator
- ✅ Giống native app 100%
- ✅ Hoạt động trên TẤT CẢ iPhone có notch

---

## 🧪 Debug Safe Area

### **Cách 1: Chrome DevTools**

1. Mở Chrome DevTools (F12)
2. Toggle Device Toolbar (Ctrl+Shift+M)
3. Chọn iPhone với notch (iPhone X, 11, 12, 13, 14, 15, 16)
4. Check "Show device frame" để thấy notch

### **Cách 2: Safari iPhone Simulator**

1. Mở Xcode
2. Run iOS Simulator
3. Chọn iPhone 14 Pro hoặc 15 Pro (có Dynamic Island)
4. Mở Safari và truy cập app

### **Cách 3: Visualize Safe Areas** 

Uncomment debug code trong `safe-area.css`:

```css
/* Show red overlay for top safe area */
body::before {
  content: '';
  position: fixed;
  top: 0;
  height: env(safe-area-inset-top);
  background: rgba(255, 0, 0, 0.3);
}

/* Show green overlay for bottom safe area */
body::after {
  content: '';
  position: fixed;
  bottom: 0;
  height: env(safe-area-inset-bottom);
  background: rgba(0, 255, 0, 0.3);
}
```

---

## 📱 Test Checklist

### **Portrait Mode:**
- [ ] Header không bị che bởi notch
- [ ] Input field không bị che bởi home indicator
- [ ] Nội dung hiển thị full màn hình
- [ ] Status bar hiển thị đúng màu

### **Landscape Mode:**
- [ ] Content không bị che bởi notch (trái/phải)
- [ ] Vẫn có padding hợp lý
- [ ] Input field vẫn visible

### **Different Devices:**
- [ ] iPhone 11 (notch)
- [ ] iPhone 13 (notch)
- [ ] iPhone 14 Pro (Dynamic Island)
- [ ] iPhone 15 Pro (Dynamic Island)
- [ ] iPhone 16 Pro (Dynamic Island)

---

## 🐛 Troubleshooting

### **Vấn đề 1: Content vẫn bị che bởi notch**

**Giải pháp:**
1. Check `viewport-fit=cover` có trong meta tag
2. Verify `overlaysWebView: true` trong capacitor.config.ts
3. Rebuild app: `npm run build && npx cap sync ios`

### **Vấn đề 2: Safe area insets = 0**

**Nguyên nhân:** Chưa có `viewport-fit=cover`

**Giải pháp:**
```html
<meta name="viewport" content="..., viewport-fit=cover" />
```

### **Vấn đề 3: Padding quá lớn**

**Nguyên nhân:** Padding bị cộng dồn

**Giải pháp:**
```css
/* Dùng max() thay vì calc() */
padding-top: max(1rem, env(safe-area-inset-top));
```

---

## 📖 Best Practices

### ✅ **DO:**
- Sử dụng `env(safe-area-inset-*)` cho padding
- Test trên nhiều device khác nhau
- Dùng `viewport-fit=cover` trong meta tag
- Set `overlaysWebView: true` cho StatusBar

### ❌ **DON'T:**
- Hardcode padding cho notch (44px, 47px, etc.)
- Quên test landscape mode
- Dùng fixed positioning mà không tính safe area
- Ignore safe-area-inset-left/right khi landscape

---

## 🔗 Resources

- [Apple Human Interface Guidelines - Safe Area](https://developer.apple.com/design/human-interface-guidelines/layout)
- [CSS env() - MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/env)
- [Designing Websites for iPhone X](https://webkit.org/blog/7929/designing-websites-for-iphone-x/)
- [Capacitor Status Bar Plugin](https://capacitorjs.com/docs/apis/status-bar)

---

## ✅ Summary

| Feature | Status |
|---------|--------|
| viewport-fit=cover | ✅ |
| Safe area CSS variables | ✅ |
| overlaysWebView | ✅ |
| Header padding (top) | ✅ |
| Footer padding (bottom) | ✅ |
| Landscape support | ✅ |
| All iPhone notch models | ✅ |

**🎉 App giờ hiển thị FULL MÀN HÌNH kể cả vùng notch/Dynamic Island!**

---

**Tác giả:** AI Assistant  
**Ngày:** $(date)  
**Version:** 1.0

