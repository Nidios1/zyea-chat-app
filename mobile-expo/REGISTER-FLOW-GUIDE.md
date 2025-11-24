# Hướng Dẫn Quy Trình Đăng Ký Tài Khoản

## Tổng Quan
Quy trình đăng ký tài khoản được chia thành **3 bước chính**, mỗi bước có các chức năng và validation riêng.

---

## 📋 BƯỚC 1: THÔNG TIN TÀI KHOẢN (SignupStep.INFO)

### Mục đích
Thu thập thông tin cơ bản của người dùng để tạo tài khoản.

### Các trường thông tin:

#### 1. **Email** 📧
- **Chức năng**: Nhập địa chỉ email
- **Validation**:
  - ✅ Bắt buộc phải nhập
  - ✅ Định dạng email hợp lệ (regex validation)
  - ✅ Tự động xóa lỗi khi người dùng nhập lại
- **UI**: TextInput với keyboard type `email-address`
- **Lỗi có thể gặp**:
  - "Vui lòng nhập email của bạn."
  - "Email không hợp lệ. Vui lòng kiểm tra lại."
  - "Email này đã được sử dụng. Vui lòng dùng email khác."

#### 2. **Mật khẩu** 🔒
- **Chức năng**: Nhập mật khẩu
- **Validation**:
  - ✅ Bắt buộc phải nhập
  - ✅ Tối thiểu 8 ký tự
  - ✅ Có nút hiện/ẩn mật khẩu (eye icon)
- **UI**: TextInput với `secureTextEntry` và toggle visibility
- **Lỗi có thể gặp**:
  - "Vui lòng nhập mật khẩu của bạn."
  - "Mật khẩu phải có ít nhất 8 ký tự."

#### 3. **Xác nhận mật khẩu** 🔒
- **Chức năng**: Nhập lại mật khẩu để xác nhận
- **Validation**:
  - ✅ Bắt buộc phải nhập
  - ✅ Phải khớp với mật khẩu đã nhập
  - ✅ Có nút hiện/ẩn mật khẩu
- **UI**: TextInput với `secureTextEntry` và toggle visibility
- **Lỗi có thể gặp**:
  - "Chưa xác nhận mật khẩu"
  - "Hai mật khẩu không khớp. Vui lòng nhập lại."

#### 4. **Ngày sinh** 📅
- **Chức năng**: Chọn ngày sinh
- **Validation**:
  - ✅ Bắt buộc phải chọn
  - ✅ Phải ít nhất 13 tuổi
  - ✅ Không được là ngày trong tương lai
  - ✅ Không được quá 120 tuổi
- **UI**: 
  - TouchableOpacity mở DatePicker
  - **iOS**: Modal với spinner picker
  - **Android**: Native date picker
  - Hiển thị định dạng Việt Nam (dd/mm/yyyy)
- **Lỗi có thể gặp**:
  - "Bạn phải ít nhất 13 tuổi để đăng ký tài khoản."

#### 5. **Giới tính** 👤
- **Chức năng**: Chọn giới tính
- **Validation**:
  - ✅ Bắt buộc phải chọn
- **UI**: 
  - Input field giống dropdown (giống Facebook)
  - Tap để mở modal popup
  - **Modal có 3 lựa chọn**:
    - 👩 **Nữ** (female)
    - 👨 **Nam** (male)
    - 🏳️‍⚧️ **Lựa chọn khác** (other) - có subtext giải thích
  - Hiển thị check mark khi đã chọn
  - Highlight option đã chọn
- **Lỗi có thể gặp**:
  - "Vui lòng chọn giới tính của bạn."

### Chức năng khi nhấn "Tiếp theo":
1. ✅ Validate tất cả các trường
2. ✅ Gửi mã xác thực OTP qua email (`authAPI.sendVerification`)
3. ✅ Set countdown 60 giây cho nút "Gửi lại mã"
4. ✅ Chuyển sang Bước 2 (HANDLE)

### Xử lý lỗi:
- Hiển thị lỗi cụ thể cho từng trường
- Tự động xóa lỗi khi người dùng sửa
- Hiển thị lỗi từ server nếu email đã tồn tại

---

## 📋 BƯỚC 2: CHỌN TÊN NGƯỜI DÙNG (SignupStep.HANDLE)

### Mục đích
Người dùng chọn username/handle duy nhất cho tài khoản.

### Trường thông tin:

#### 1. **Tên người dùng (Handle/Username)** @
- **Chức năng**: Nhập tên người dùng
- **Validation**:
  - ✅ Bắt buộc phải nhập
  - ✅ Tối thiểu 3 ký tự
  - ✅ Tối đa 20 ký tự
  - ✅ Chỉ chứa: chữ cái (a-z), số (0-9), dấu gạch dưới (_), dấu gạch ngang (-)
  - ✅ Tự động chuyển sang chữ thường
- **UI**: 
  - TextInput với icon "@" bên trái
  - Helper text hiển thị quy tắc
  - Tự động lowercase khi nhập
- **Lỗi có thể gặp**:
  - "Vui lòng chọn tên người dùng của bạn."
  - "Tên người dùng phải có ít nhất 3 ký tự."
  - "Tên người dùng không được vượt quá 20 ký tự."
  - "Tên người dùng chỉ được chứa chữ cái, số, dấu gạch dưới và dấu gạch ngang."

### Chức năng khi nhấn "Tiếp theo":
1. ✅ Validate tên người dùng
2. ✅ Chuyển sang Bước 3 (OTP Verification)

### Navigation:
- ✅ Có nút "Quay lại" để quay về Bước 1
- ✅ Link "Đã có tài khoản? Đăng nhập" ở cuối

---

## 📋 BƯỚC 3: XÁC THỰC MÃ OTP (SignupStep.OTP)

### Mục đích
Xác thực email bằng mã OTP 6 số đã được gửi.

### Trường thông tin:

#### 1. **Mã xác thực OTP** 🔐
- **Chức năng**: Nhập mã 6 số
- **Validation**:
  - ✅ Bắt buộc phải nhập đủ 6 số
  - ✅ Chỉ chấp nhận số (tự động filter ký tự không phải số)
  - ✅ Tự động giới hạn 6 ký tự
- **UI**: 
  - TextInput với keyboard type `number-pad`
  - Hiển thị cảnh báo nếu chưa đủ 6 số
  - Button "Xác thực" bị disable nếu chưa đủ 6 số

### Chức năng khi nhấn "Xác thực":
1. ✅ Validate mã OTP (phải đủ 6 số)
2. ✅ Gọi API xác thực mã (`authAPI.verifyCode`)
3. ✅ Nếu thành công, gọi API đăng ký (`authAPI.register`) với:
   - Email
   - Password
   - Handle
   - BirthDate
   - Gender
4. ✅ Tự động đăng nhập nếu thành công
5. ✅ Chuyển vào app

### Chức năng "Gửi lại mã":
- ✅ Hiển thị countdown 60 giây
- ✅ Disable nút trong thời gian countdown
- ✅ Gửi lại mã OTP qua email
- ✅ Hiển thị toast notification khi gửi thành công

### Xử lý lỗi:
- **Mã không đúng**: "Mã xác thực không đúng. Vui lòng nhập lại."
- **Mã hết hạn**: "Mã xác thực đã hết hạn. Vui lòng gửi lại mã."
- **Handle đã tồn tại**: Quay về Bước 2 và hiển thị lỗi
- **Lỗi khác**: Hiển thị thông báo từ server

### Navigation:
- ✅ Có nút "Quay lại" để quay về Bước 2
- ✅ Link "Đã có tài khoản? Đăng nhập" ở cuối

---

## 🔄 State Management

### Sử dụng `useReducer` để quản lý state:
- **SignupState**: Chứa tất cả thông tin đăng ký
- **SignupAction**: Các action để cập nhật state
- **Reducer**: Xử lý logic cập nhật state

### Các state quan trọng:
- `activeStep`: Bước hiện tại (INFO, HANDLE, OTP)
- `email`, `password`, `confirmPassword`: Thông tin đăng nhập
- `dateOfBirth`: Ngày sinh
- `gender`: Giới tính (male/female/other)
- `handle`: Tên người dùng
- `otp`: Mã xác thực
- `error`, `errorField`: Thông tin lỗi
- `isLoading`: Trạng thái loading
- `resendCountdown`: Đếm ngược để gửi lại mã

---

## 🎨 UI/UX Features

### Theme Support:
- ✅ Hỗ trợ Dark Mode / Light Mode
- ✅ Tự động thay đổi theo theme hệ thống
- ✅ Tất cả màu sắc sử dụng theme colors

### Responsive:
- ✅ KeyboardAvoidingView cho iOS/Android
- ✅ ScrollView để scroll khi bàn phím hiện
- ✅ SafeAreaView để tránh notch/status bar

### Animations:
- ✅ Modal slide animation
- ✅ DatePicker modal animation
- ✅ Smooth transitions giữa các bước

### Accessibility:
- ✅ StatusBar tự động thay đổi màu theo theme
- ✅ Icons và labels rõ ràng
- ✅ Error messages dễ hiểu

---

## 🔐 Security Features

1. **Password Security**:
   - Mật khẩu được ẩn mặc định
   - Có toggle để hiện/ẩn
   - Validation độ dài tối thiểu

2. **Email Verification**:
   - Gửi mã OTP qua email
   - Xác thực trước khi tạo tài khoản
   - Countdown để tránh spam

3. **Age Verification**:
   - Kiểm tra tuổi tối thiểu (13 tuổi)
   - Validate ngày sinh hợp lệ

---

## 📱 API Integration

### Các API được sử dụng:

1. **`authAPI.sendVerification({ email })`**
   - Gửi mã OTP qua email
   - Gọi ở Bước 1 khi nhấn "Tiếp theo"

2. **`authAPI.verifyCode({ email, code })`**
   - Xác thực mã OTP
   - Gọi ở Bước 3 khi nhấn "Xác thực"

3. **`authAPI.register({ email, password, handle, birthDate, gender })`**
   - Tạo tài khoản mới
   - Gọi sau khi xác thực OTP thành công
   - Tự động đăng nhập nếu thành công

---

## 🐛 Error Handling

### Client-side Validation:
- Validate ngay khi người dùng nhập
- Hiển thị lỗi cụ thể cho từng trường
- Tự động xóa lỗi khi sửa

### Server-side Error Handling:
- Xử lý lỗi từ API response
- Hiển thị thông báo lỗi phù hợp
- Xử lý các trường hợp đặc biệt:
  - Email đã tồn tại
  - Handle đã tồn tại
  - Mã OTP không đúng/hết hạn

---

## 📝 Notes

- Tất cả validation được thực hiện ở client-side trước khi gọi API
- State được quản lý tập trung bằng useReducer
- UI responsive và hỗ trợ cả iOS và Android
- Theme tự động thay đổi theo hệ thống
- Có thể quay lại bước trước bất cứ lúc nào (trừ Bước 1)

