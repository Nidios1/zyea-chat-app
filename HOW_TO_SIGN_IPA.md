# 🔐 Hướng Dẫn Tự Ký IPA với eSign

## 📱 QUY TRÌNH:

### 1. **Download IPA từ GitHub**
- Vào: https://github.com/Nidios1/zyea-chat-app/actions
- Tìm workflow run thành công
- Download "unsigned-ipa" từ Artifacts

### 2. **Tự Ký với eSign**

#### **Cách 1: Dùng iOS App Signer** (Easy)
```
1. Download: https://dantheman827.github.io/ios-app-signer/
2. Open iOS App Signer
3. Import IPA file
4. Chọn certificate của bạn
5. Provisioning Profile (nếu có)
6. Click "Start"
7. Save IPA đã ký
```

#### **Cách 2: Dùng AltStore** (Không cần Mac)
```
1. Download AltStore: https://altstore.io/
2. Install trên iPhone
3. AltStore > My Apps > + > Chọn IPA
4. AltStore sẽ tự sign và install
```

#### **Cách 3: Dùng Sideloadly** (Windows)
```
1. Download: https://sideloadly.io/
2. Open Sideloadly
3. Drag IPA vào
4. Enter Apple ID
5. Click Start
6. Auto sign & install
```

#### **Cách 4: Dùng Xcode** (Nếu có Mac)
```
1. Xcode > Window > Devices
2. Connect iPhone
3. Drag IPA vào
4. Xcode sẽ tự sign
5. Install
```

---

## 🔑 eSign Options:

### **Developer Account** ($99/năm):
- ✅ Ký được 100 devices
- ✅ 1 năm expiry
- ✅ Push notifications
- ✅ App Store distribution

### **Free Account**:
- ✅ 3 devices limit
- ✅ 7 ngày expiry
- ⚠️ Cần resign mỗi tuần

### **AltStore**:
- ✅ Free
- ✅ Không limit
- ⚠️ 7 ngày expiry (nhưng có background refresh)

---

## 📝 TÓM TẮT:

1. ✅ Download IPA unsigned từ GitHub
2. ✅ Mở với iOS App Signer/AltStore/Sideloadly
3. ✅ Tự động ký hoặc nhập certificate
4. ✅ Install lên iPhone

---

## 🎯 KHUYẾN NGHỊ:

**Nếu test thường xuyên:** Dùng **AltStore** (free, tiện nhất)  
**Nếu production:** Dùng **Apple Developer Account** ($99/năm)

**🎊 Workflow sẵn sàng build IPA unsigned!** 🚀

