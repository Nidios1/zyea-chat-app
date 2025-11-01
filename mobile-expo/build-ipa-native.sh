#!/bin/bash
# Script build IPA native iOS (không dùng Expo/EAS)
# Chạy trên macOS với Xcode

set -e

echo "=========================================="
echo "  BUILD IPA NATIVE iOS"
echo "  (Không dùng Expo/EAS)"
echo "=========================================="
echo ""

# Kiểm tra đang ở macOS
if [[ "$OSTYPE" != "darwin"* ]]; then
    echo "❌ Lỗi: Script này chỉ chạy trên macOS!"
    exit 1
fi

# Kiểm tra Xcode
if ! command -v xcodebuild &> /dev/null; then
    echo "❌ Lỗi: Xcode chưa được cài đặt!"
    exit 1
fi

echo "✅ Xcode đã sẵn sàng"
echo ""

# Bước 1: Prebuild iOS project
echo "📦 Prebuild iOS native project..."
npx expo prebuild --platform ios --clean

# Bước 2: Install CocoaPods
echo ""
echo "📦 Cài đặt CocoaPods dependencies..."
cd ios
pod install
cd ..

# Bước 3: Build Archive
echo ""
echo "🔨 Building archive..."
xcodebuild -workspace ios/zyeamobile.xcworkspace \
  -scheme zyeamobile \
  -configuration Release \
  -archivePath build/zyeamobile.xcarchive \
  archive \
  CODE_SIGN_IDENTITY="" \
  CODE_SIGNING_REQUIRED=NO \
  CODE_SIGNING_ALLOWED=NO

# Bước 4: Export IPA
echo ""
echo "📦 Exporting IPA..."
mkdir -p build/ipa

# Tạo exportOptions.plist nếu chưa có
if [ ! -f ios/exportOptions.plist ]; then
    cat > ios/exportOptions.plist << EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>method</key>
    <string>development</string>
    <key>signingStyle</key>
    <string>manual</string>
    <key>stripSwiftSymbols</key>
    <true/>
</dict>
</plist>
EOF
fi

xcodebuild -exportArchive \
  -archivePath build/zyeamobile.xcarchive \
  -exportPath build/ipa \
  -exportOptionsPlist ios/exportOptions.plist \
  CODE_SIGN_IDENTITY="" \
  CODE_SIGNING_REQUIRED=NO

echo ""
echo "=========================================="
echo "  ✅ BUILD THÀNH CÔNG!"
echo "=========================================="
echo ""
echo "📱 File IPA được lưu tại:"
echo "   build/ipa/*.ipa"
echo ""
echo "💡 Để ký và cài đặt:"
echo "   1. Tải IPA về máy"
echo "   2. Dùng Esign hoặc Sideloadly để ký"
echo "   3. Cài đặt lên iPhone"
echo ""

