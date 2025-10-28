# 🚀 QUICK START - Push & Build IPA

## ⚡ CÁCH NHANH NHẤT (1 Click!)

### Chỉ cần chạy:

```cmd
# Windows
PUSH_TO_GITHUB.bat
```

Hoặc:

```bash
# Terminal
.\PUSH_TO_GITHUB.bat
```

## 📋 HOẶC TỪNG BƯỚC:

### 1. Mở Terminal/CMD trong folder `zalo-clone`

### 2. Chạy lệnh:

```bash
git init
git add .
git commit -m "Add iOS build and React Native"
git remote add origin https://github.com/Nidios1/zyea-chat-app.git
git push -u origin main
```

### 3. Đợi push xong

### 4. Vào GitHub Actions

URL: https://github.com/Nidios1/zyea-chat-app/actions

### 5. Download IPA

- Click vào workflow run
- Cuộn xuống **Artifacts**
- Download **capacitor-ipa**

## ⏱️ THỜI GIAN:

- Push code: ~1-2 phút
- Build IPA: ~15-20 phút
- **Total: ~20 phút**

## ✅ SAU KHI CÓ IPA:

### Install trên iPhone:

**Option 1: Xcode** (Nếu có Mac)
```
1. Connect iPhone
2. Xcode > Window > Devices
3. Drag IPA vào
```

**Option 2: AltStore** (Không cần Mac)
```
1. Install AltStore
2. Open IPA in AltStore
3. Sign & Install
```

**Option 3: Sideloadly**
```
1. Download Sideloadly
2. Open IPA
3. Enter Apple ID
4. Install
```

## 🎯 TÓM TẮT:

```bash
# Chạy batch file
.\PUSH_TO_GITHUB.bat

# → Wait 15-20 phút

# → Download IPA

# → Install trên iPhone
```

**XONG!** ✅

## 📱 IPA Unsigned?

➡️ Cần sign lại với AltStore/Xcode trước khi install.

➡️ OK cho testing, không cần Apple Developer Account.

---

**🎉 Ready to build!** 🚀

