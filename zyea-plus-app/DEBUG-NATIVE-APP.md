# 🐛 DEBUG NATIVE APP - MÀN HÌNH XANH

## ❌ **VẤN ĐỀ:**
App mở ra chỉ hiện màn hình xanh, không load được UI

## 🔍 **NGUYÊN NHÂN CÓ THỂ:**

### **1. React App Crash khi khởi động**
- JavaScript error
- Component không render được
- Import module bị lỗi

### **2. Build folder không có hoặc sai**
- `build` folder không được copy vào iOS
- Assets không được build

### **3. API call failed ngay từ đầu**
- App crash khi không kết nối được backend
- Error không được handle

---

## ✅ **GIẢI PHÁP NHANH:**

### **Fix 1: Thêm Error Boundary**

App cần có error handling tốt hơn. Hãy rebuild với version có error boundary.

### **Fix 2: Check Build Output**

Đảm bảo React app được build thành công:

```bash
cd c:\xampp\htdocs\zalo-clone\zyea-plus-app
npm run build:win
```

Kiểm tra folder `build`:
```bash
dir build
```

Phải có các file:
- `index.html`
- `static/js/main.*.js`
- `static/css/main.*.css`

### **Fix 3: Test PWA trước**

Nếu PWA chạy được nhưng native không chạy:

```bash
# Test PWA local
npm start

# Mở browser: http://localhost:3000
# Nếu PWA OK → vấn đề ở Capacitor config
```

---

## 🔧 **DEBUG STEPS:**

### **Bước 1: Kiểm tra build**

```bash
cd c:\xampp\htdocs\zalo-clone\zyea-plus-app

# Build lại
npm run build:win

# Kiểm tra size
dir build\static\js\main.*.js
```

Nếu file < 100KB → có vấn đề với build

### **Bước 2: Thêm console logs**

Sửa `src/index.js`:

```javascript
console.log('🚀 App starting...');
console.log('📱 Platform:', navigator.userAgent);
console.log('🌐 Base URL:', process.env.REACT_APP_API_URL || 'default');

// ... existing code ...
```

### **Bước 3: Simplified App.js**

Tạo version đơn giản để test:

```javascript
// src/App.js - Simplified for debugging
import React from 'react';

function App() {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh',
      background: 'white'
    }}>
      <h1>Zyea+ Test</h1>
      <p>If you see this, React is working!</p>
      <button onClick={() => alert('Button works!')}>
        Test Button
      </button>
    </div>
  );
}

export default App;
```

Build và test lại:
```bash
npm run build:win
npx cap sync ios
# Build IPA mới
```

Nếu hiển thị text → React OK, vấn đề ở components/routing

---

## 🎯 **CÁC VẤN ĐỀ THƯỜNG GẶP:**

### **1. Màn hình xanh = Splash screen không hide**

**Nguyên nhân:**
- App crash trước khi hide splash screen
- `SplashScreen.hide()` không được gọi

**Fix:**
```javascript
// App.js
useEffect(() => {
  setTimeout(() => {
    SplashScreen.hide().catch(console.error);
  }, 1000); // Force hide after 1s
}, []);
```

### **2. Màn hình xanh = React không mount**

**Nguyên nhân:**
- `index.html` không load được `main.js`
- JavaScript error crash app

**Fix:**
Check `build/index.html`:
```html
<script defer="defer" src="/static/js/main.xxxxx.js"></script>
```

Path phải đúng!

### **3. Màn hình xanh = Network error**

**Nguyên nhân:**
- App cố call API ngay khi start
- Fetch fail → crash

**Fix:**
Wrap tất cả API calls trong try-catch:
```javascript
try {
  const response = await fetch(apiUrl);
  // ...
} catch (error) {
  console.error('API call failed:', error);
  // Show error UI instead of crash
}
```

---

## 📱 **DEBUG TRÊN IPHONE:**

### **Option 1: Safari Web Inspector (Mac only)**

1. iPhone Settings → Safari → Advanced → Web Inspector: ON
2. Connect iPhone to Mac
3. Safari → Develop → [Your iPhone] → [App]
4. Xem Console logs

### **Option 2: Chrome Remote Debugging (có thể dùng trên Windows)**

Cần tool: `ios-webkit-debug-proxy`

```bash
# Cài qua npm
npm install -g ios-webkit-debug-proxy

# Connect iPhone và chạy
ios_webkit_debug_proxy
```

### **Option 3: Add visible error UI**

Thêm vào App.js:

```javascript
import React, { Component } from 'react';

class ErrorBoundary extends Component {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          padding: '20px',
          background: 'white',
          color: 'red'
        }}>
          <h1>Error!</h1>
          <pre>{this.state.error?.toString()}</pre>
        </div>
      );
    }
    return this.props.children;
  }
}

// Wrap App with ErrorBoundary
```

---

## 🚀 **QUICK FIX - REBUILD VỚI DEBUG MODE:**

Tôi sẽ tạo version simplified để test:

```bash
cd c:\xampp\htdocs\zalo-clone\zyea-plus-app

# 1. Backup App.js
copy src\App.js src\App.js.backup

# 2. Tạo App.js đơn giản
# (code phía trên)

# 3. Build
npm run build:win

# 4. Sync
npx cap sync ios

# 5. Build IPA mới và test

# 6. Nếu OK → vấn đề ở code cũ
# 7. Restore: copy src\App.js.backup src\App.js
```

---

## 📞 **CẦN HELP?**

Gửi tôi:
1. Screenshot Safari Web Inspector (nếu có Mac)
2. File `build/index.html`
3. Thử version simplified và cho biết kết quả

---

## ✅ **CHECKLIST:**

- [ ] Backend chạy: `netstat -ano | findstr :5000`
- [ ] Build folder OK: `dir build`
- [ ] PWA test OK: `npm start`
- [ ] iOS Info.plist có NSAppTransportSecurity
- [ ] IPA được build từ code mới nhất
- [ ] iPhone cùng WiFi với máy tính
- [ ] Đã xóa app cũ trước khi cài IPA mới
- [ ] Đã restart iPhone
- [ ] Đã Trust developer

---

**Hãy thử simplified version để tìm đúng vấn đề!** 🔍

