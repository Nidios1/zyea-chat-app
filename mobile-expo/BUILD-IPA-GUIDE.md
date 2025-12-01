# Hướng dẫn Build IPA iOS

## Tình trạng Credentials
✅ **Đã sẵn sàng:**
- Distribution Certificate: Valid (hết hạn 12 Nov 2026)
- Provisioning Profile: Active (hết hạn 12 Nov 2026)  
- Apple Team: J9UG5J92SC (Cali Mitchell)
- Device được provisioned: 00008030-00047426143B402E

## Cách Build IPA

### Cách 1: Sử dụng npm script (Khuyến nghị)
```bash
npm run build:ipa
```

### Cách 2: Sử dụng EAS CLI trực tiếp
```bash
eas build --platform ios --profile adhoc --non-interactive
```

### Cách 3: Chạy file batch
```bash
.\build-ipa.bat
```

## Lưu ý quan trọng

⚠️ **Nếu terminal bị kẹt ở prompt "Press any key to continue":**
1. Nhấn một phím bất kỳ để tiếp tục
2. Hoặc đóng terminal và mở lại terminal mới
3. Sau đó chạy lại lệnh build

## Quá trình Build

1. **Upload project** - EAS sẽ nén và upload project (khoảng 2-3 phút)
2. **Build trên cloud** - EAS Build sẽ build IPA trên server (khoảng 10-20 phút)
3. **Download IPA** - Khi build xong, bạn sẽ nhận được link download

## Kết quả

Sau khi build thành công, bạn sẽ nhận được:
- Link download IPA từ EAS
- IPA file có thể cài trên device đã được provisioned (00008030-00047426143B402E)

## Thêm Device mới

Nếu muốn cài IPA trên device khác, cần thêm device vào provisioning profile:
1. Vào https://expo.dev/accounts/hieukka/projects/zyea-mobile/credentials
2. Thêm device UDID mới vào Ad-hoc provisioning profile

