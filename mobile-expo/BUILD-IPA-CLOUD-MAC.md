# Build IPA Unsigned trên Cloud macOS (Không cần Mac)

## Vấn đề
Bạn không có Mac nên không thể build iOS IPA local. Cần dùng macOS trên cloud.

## Giải pháp: Dùng Cloud macOS Service

### 1. MacStadium (Có free trial)
- Truy cập: https://www.macstadium.com/
- Đăng ký và tạo macOS virtual machine
- Kết nối qua Remote Desktop hoặc SSH
- Build IPA trên đó

### 2. AWS EC2 Mac Instances
- Truy cập: AWS Console
- Launch EC2 Mac instance (mac1.metal)
- Kết nối và build IPA

### 3. GitHub Actions với macOS Runner (Miễn phí)
Cập nhật workflow để build trên macOS runner:

```yaml
jobs:
  build-ipa:
    runs-on: macos-latest  # Thay vì ubuntu-latest
```

Sau đó build trực tiếp với Xcode thay vì EAS.

## Cách 2: Dùng GitHub Actions với macOS Runner

Tôi có thể cập nhật workflow để build trực tiếp trên macOS runner của GitHub (miễn phí), không cần EAS Build.

**Ưu điểm:**
- ✅ Miễn phí (GitHub Actions có 2000 phút/tháng cho free account)
- ✅ Không cần Mac
- ✅ Tự động build khi push code

**Nhược điểm:**
- ⚠️ Cần setup Xcode build scripts
- ⚠️ Có thể cần credentials cơ bản (nhưng có thể bypass)

Bạn có muốn tôi cập nhật workflow để build trực tiếp trên macOS runner không?




