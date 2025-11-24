# Hướng dẫn cấu hình SMS Service (Twilio)

Để gửi mã OTP thật đến số điện thoại, bạn cần cấu hình Twilio hoặc SMS service khác.

## Cài đặt Twilio

1. Cài đặt package Twilio:
```bash
cd zalo-clone/server
npm install twilio
```

2. Đăng ký tài khoản Twilio tại: https://www.twilio.com/

3. Lấy thông tin từ Twilio Console:
   - Account SID
   - Auth Token
   - Phone Number (số điện thoại Twilio của bạn)

4. Thêm vào file `.env`:
```env
TWILIO_ACCOUNT_SID=your_account_sid_here
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_PHONE_NUMBER=+1234567890
```

## Các SMS Service khác

Nếu không muốn dùng Twilio, bạn có thể tích hợp các service khác:

### 1. AWS SNS
```bash
npm install @aws-sdk/client-sns
```

### 2. Vonage (Nexmo)
```bash
npm install @vonage/server-sdk
```

### 3. MessageBird
```bash
npm install messagebird
```

### 4. Services tại Việt Nam:
- **Viettel Post SMS API**
- **FPT SMS API**
- **VNP SMS API**

## Lưu ý

- Nếu không cấu hình SMS service, hệ thống sẽ log mã OTP ra console (chế độ development)
- Trong production, nên sử dụng SMS service thật để bảo mật
- Mã OTP có hiệu lực trong 10 phút

