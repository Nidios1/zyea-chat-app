# Phân Tích Các Màn Hình Profile

## 📱 Các Màn Hình Profile Hiện Có:

### 1. **ProfileScreen** (Settings Menu)
- **Vị trí**: Tab "Profile" → Screen đầu tiên trong ProfileStack
- **Chức năng**: Màn hình Settings với user card và menu items
- **User Card**: Click vào → navigate đến `MyProfile`
- **Menu Items**: Hồ sơ thông tin, Cài đặt, Giao diện, Bảo mật, etc.

### 2. **MyProfileScreen** (Profile của chính mình)
- **Vị trí**: ProfileStack → Screen "MyProfile"
- **Chức năng**: Hiển thị profile đầy đủ với:
  - ProfileHeader (avatar, cover, stats, tabs)
  - Posts list với tabs (posts, replies, media, videos, likes)
  - FAB để tạo post
- **User**: Luôn hiển thị profile của currentUser (chính mình)

### 3. **ProfileInformationScreen** (Hồ sơ thông tin)
- **Vị trí**: ProfileStack → Screen "ProfileInformation"
- **Chức năng**: Hiển thị thông tin profile với:
  - Avatar, cover photo
  - Thông tin user (email, department, followers)
  - Posts list
  - Media modal
- **User**: Có thể hiển thị profile của chính mình HOẶC người khác (dựa vào route.params.userId)
- **Avatar Click**: Mở action sheet → "Xem hồ sơ" → navigate đến `MyProfile` (nếu là own profile)

### 4. **OtherUserProfileScreen** (Profile của người khác)
- **Vị trí**: FeedStack → Screen "OtherUserProfile"
- **Chức năng**: Hiển thị profile của người khác
- **User**: Hiển thị profile của user khác (từ route.params.userId)

## ⚠️ Vấn Đề Phát Hiện:

### Vấn đề 1: ProfileInformationScreen có thể hiển thị 2 loại profile
- **Own Profile**: Khi không có userId hoặc userId = currentUser.id
- **Other User Profile**: Khi có userId khác currentUser.id

### Vấn đề 2: Navigation có thể tạo duplicate
- ProfileScreen (user card) → MyProfile
- ProfileInformationScreen (avatar) → MyProfile
- Cả 2 đều navigate đến MyProfile, có thể tạo 2 màn hình trong stack

### Vấn đề 3: ProfileInformationScreen và MyProfileScreen đều hiển thị profile
- **ProfileInformationScreen**: Hiển thị profile với posts list đơn giản
- **MyProfileScreen**: Hiển thị profile với tabs và posts list đầy đủ
- Cả 2 đều có thể hiển thị profile của chính mình → **DUPLICATE!**

## 🔧 Giải Pháp Đề Xuất:

### Option 1: Tách rõ chức năng
- **ProfileInformationScreen**: Chỉ dùng để xem profile của NGƯỜI KHÁC
- **MyProfileScreen**: Chỉ dùng để xem profile của CHÍNH MÌNH
- Khi click "Hồ sơ thông tin" từ ProfileScreen → navigate đến MyProfile (không phải ProfileInformationScreen)

### Option 2: Merge ProfileInformationScreen vào MyProfileScreen
- Xóa ProfileInformationScreen
- MyProfileScreen xử lý cả 2 trường hợp (own profile và other user profile)

### Option 3: Giữ nguyên nhưng sửa navigation
- ProfileInformationScreen chỉ dùng cho other users
- Khi click "Hồ sơ thông tin" từ ProfileScreen → navigate đến MyProfile (không phải ProfileInformationScreen)

## 🎯 Khuyến Nghị:

**Option 3** - Sửa navigation trong ProfileScreen:
- Thay đổi menu item "Hồ sơ thông tin" → navigate đến `MyProfile` thay vì `ProfileInformation`
- Giữ ProfileInformationScreen chỉ để xem profile của người khác

