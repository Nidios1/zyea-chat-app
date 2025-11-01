#!/bin/bash
# Script build IPA cho iOS
# Chạy script này trên Mac hoặc Linux

echo "============================================"
echo "   BUILD IPA FOR iOS - ZYEA MOBILE APP"
echo "============================================"
echo ""

# Kiểm tra EAS CLI
if ! command -v eas &> /dev/null; then
    echo "[ERROR] EAS CLI chưa được cài đặt!"
    echo "Đang cài đặt EAS CLI..."
    npm install -g eas-cli
    if [ $? -ne 0 ]; then
        echo "[ERROR] Không thể cài đặt EAS CLI"
        exit 1
    fi
fi

echo "[OK] EAS CLI đã sẵn sàng"
echo ""

# Login vào EAS
echo "Đang đăng nhập vào EAS..."
eas login
if [ $? -ne 0 ]; then
    echo "[ERROR] Đăng nhập thất bại"
    exit 1
fi

echo ""
echo "[OK] Đã đăng nhập thành công"
echo ""

# Build IPA
echo "============================================"
echo "   BẮT ĐẦU BUILD IPA..."
echo "============================================"
echo ""
echo "Lựa chọn profile build:"
echo "  1. adhoc     - Build cho cá nhân (khuyến nghị)"
echo "  2. preview   - Build để test"
echo "  3. production - Build chính thức"
echo ""
read -p "Nhập số (1-3): " profile

case $profile in
    1)
        build_profile="adhoc"
        ;;
    2)
        build_profile="preview"
        ;;
    3)
        build_profile="production"
        ;;
    *)
        echo "Lựa chọn không hợp lệ, dùng mặc định là 'adhoc'"
        build_profile="adhoc"
        ;;
esac

echo ""
echo "Build profile: $build_profile"
echo ""

# Chạy build
EAS_NO_VCS=1 eas build --platform ios --profile $build_profile

if [ $? -ne 0 ]; then
    echo ""
    echo "[ERROR] Build thất bại!"
    echo "Kiểm tra log trên để xem lỗi chi tiết"
    exit 1
fi

echo ""
echo "============================================"
echo "   BUILD THÀNH CÔNG!"
echo "============================================"
echo ""
echo "Bạn có thể tải file IPA về từ:"
echo "https://expo.dev/accounts/hieukka/projects/zyea-mobile/builds"
echo ""
echo "Sau đó sử dụng Esign hoặc Sideloadly để:"
echo "1. Ký file IPA"
echo "2. Cài đặt lên iPhone"
echo ""

