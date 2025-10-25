# 🎹 Fix Keyboard Issue - Quick Guide

## 🐛 Vấn Đề
**Bàn phím che mất input field khi gõ tin nhắn trên Native app (IPA)**

![Issue Screenshot](screenshot-issue.png)

---

## ✅ Giải Pháp (Đã Fix)

### Files Changed:
- ✨ **NEW:** `src/hooks/useKeyboard.js` - Keyboard hook với Capacitor plugin
- ✏️ **UPDATED:** `src/components/Chat/ChatArea.js` - Sử dụng keyboard hook

---

## 🚀 Test Ngay

### Windows:
```bash
# Run quick fix script
cd C:\xampp\htdocs\zalo-clone
quick-fix-keyboard.bat
```

### Manual:
```bash
cd zalo-clone/client

# Build
npm run build

# Sync iOS
npx cap sync ios

# Open Xcode
npx cap open ios

# Run & Test
```

---

## ✅ Expected Results

1. **Tap input field** → ✅ Input moves up above keyboard
2. **Type message** → ✅ Can see what you're typing
3. **Send message** → ✅ Input returns to bottom
4. **Smooth animation** → ✅ No jarring jumps

---

## 📖 Detailed Docs

- 📄 **Full Guide:** `../FIX-KEYBOARD-NATIVE.md`
- 🔍 **Hook Source:** `src/hooks/useKeyboard.js`
- 📱 **Capacitor Docs:** https://capacitorjs.com/docs/apis/keyboard

---

## 🐛 Still Not Working?

```bash
# 1. Reinstall keyboard plugin
npm uninstall @capacitor/keyboard
npm install @capacitor/keyboard@latest
npx cap sync ios

# 2. Clean Xcode build
# Xcode → Product → Clean Build Folder (Shift+Cmd+K)

# 3. Check console logs
# Safari → Develop → [Device] → Inspect
# Should see: 🎹 Keyboard will show: 336
```

---

## ❓ Quick FAQ

**Q: Có cần rebuild IPA không?**  
A: ❌ KHÔNG - Dùng Live Update (chỉ `npm run build`)

**Q: PWA có ảnh hưởng không?**  
A: ❌ KHÔNG - Hook tự detect platform

**Q: Android có hoạt động không?**  
A: ✅ CÓ - Capacitor Keyboard support cả iOS & Android

---

**Status:** ✅ FIXED  
**Date:** 2025-01-25  
**Version:** 1.0.0

