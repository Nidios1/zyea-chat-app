# MobileUserProfile Component

Component hiển thị thông tin chi tiết của người dùng khác (không phải trang cá nhân của chính mình) cho giao diện mobile.

## Tính năng

- ✅ Hiển thị avatar, tên và mô tả người dùng
- ✅ Các nút hành động: Nhắn tin, Gọi điện, Kết bạn
- ✅ Quản lý trạng thái kết bạn (chưa kết bạn, đã gửi lời mời, đã nhận lời mời, đã là bạn)
- ✅ Hiển thị phần ảnh trang trí (nếu có)
- ✅ Gợi ý bạn chung/bạn bè có thể quen
- ✅ Giao diện responsive, tối ưu cho mobile
- ✅ Animation slide từ phải sang trái (như navigation)

## Cách sử dụng

### Import component

```javascript
import MobileUserProfile from './components/Mobile/MobileUserProfile';
```

### Sử dụng trong component

```javascript
import React, { useState } from 'react';
import MobileUserProfile from './components/Mobile/MobileUserProfile';

function MyComponent() {
  const [showUserProfile, setShowUserProfile] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const currentUser = { id: 1 }; // User hiện tại

  const handleUserClick = (user) => {
    setSelectedUser(user);
    setShowUserProfile(true);
  };

  const handleStartChat = (user) => {
    console.log('Start chat with:', user);
    // TODO: Implement start chat functionality
  };

  return (
    <>
      {/* Danh sách người dùng */}
      <div onClick={() => handleUserClick(someUser)}>
        Click để xem profile
      </div>

      {/* Modal hiển thị profile */}
      {showUserProfile && selectedUser && (
        <MobileUserProfile
          user={selectedUser}
          currentUserId={currentUser.id}
          onClose={() => {
            setShowUserProfile(false);
            setSelectedUser(null);
          }}
          onStartChat={handleStartChat}
        />
      )}
    </>
  );
}
```

## Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `user` | Object | Yes | Thông tin người dùng cần hiển thị |
| `currentUserId` | Number | Yes | ID của người dùng hiện tại |
| `onClose` | Function | Yes | Callback khi đóng modal |
| `onStartChat` | Function | No | Callback khi bắt đầu chat với người dùng |

### User Object Structure

```javascript
{
  id: 1,
  username: 'linh_anh',
  full_name: 'Linh Anh',
  fullName: 'Linh Anh', // Alternative key
  avatar_url: 'https://example.com/avatar.jpg',
  bio: 'Mô tả về người dùng',
  photos: [
    'https://example.com/photo1.jpg',
    'https://example.com/photo2.jpg'
  ]
}
```

## Trạng thái kết bạn

Component tự động xử lý các trạng thái sau:

- `none`: Chưa kết bạn → Hiển thị nút "Kết bạn"
- `pending_sent`: Đã gửi lời mời → Hiển thị "Đã gửi lời mời"
- `pending_received`: Nhận lời mời → Hiển thị nút "Chấp nhận" và "Từ chối"
- `friend`: Đã là bạn → Hiển thị nút "Nhắn tin", "Gọi điện" và "Bạn bè"

## API Endpoints sử dụng

Component tự động gọi các API sau:

- `GET /api/friends/check-status/:userId` - Kiểm tra trạng thái kết bạn
- `GET /api/friends/mutual/:userId` - Lấy danh sách bạn chung
- `POST /api/friends/request` - Gửi lời mời kết bạn
- `POST /api/friends/accept` - Chấp nhận lời mời
- `POST /api/friends/reject` - Từ chối lời mời
- `DELETE /api/friends/:friendId` - Hủy kết bạn
- `POST /api/friends/follow` - Theo dõi người dùng
- `DELETE /api/friends/follow/:followingId` - Bỏ theo dõi

## Ví dụ tích hợp

### Trong MobileContacts.js (đã tích hợp)

```javascript
const handleUserClick = (friend) => {
  setSelectedUser(friend);
  setShowUserProfile(true);
};

// Trong JSX
<ContactItem onClick={() => handleUserClick(friend)}>
  {/* Contact info */}
</ContactItem>

{showUserProfile && selectedUser && (
  <MobileUserProfile
    user={selectedUser}
    currentUserId={user?.id}
    onClose={() => {
      setShowUserProfile(false);
      setSelectedUser(null);
    }}
    onStartChat={handleStartChatFromProfile}
  />
)}
```

## Tùy chỉnh giao diện

Component sử dụng styled-components và có thể tùy chỉnh bằng cách:

1. Thay đổi màu sắc gradient trong `Header`
2. Thay đổi kích thước avatar
3. Tùy chỉnh các button action
4. Thay đổi animation

## Responsive Design

### Kích thước màn hình được hỗ trợ

- **Small mobile**: < 360px (iPhone SE, older Android)
- **Mobile**: 360px - 768px (Majority of smartphones)
- **Tablet & Desktop**: > 769px (Max width 420px-480px với sidebar effect)

### Các tính năng responsive

- ✅ **Fluid typography**: Sử dụng `clamp()` cho tất cả font-size, padding, margin
- ✅ **Safe area insets**: Hỗ trợ đầy đủ cho iPhone với notch/Dynamic Island
- ✅ **Adaptive layouts**: Tự động điều chỉnh layout theo kích thước màn hình
- ✅ **Touch-optimized**: Min-height 44px cho buttons (iOS guidelines)
- ✅ **Smooth animations**: Hardware-accelerated slide-in từ phải sang
- ✅ **Scrollable content**: Custom scrollbar với overscroll-behavior

### Breakpoints

```css
/* Small mobile devices */
@media (max-width: 360px) {
  /* Smaller font sizes and padding */
}

/* Tablet and larger */
@media (min-width: 769px) {
  /* Sidebar layout với max-width */
}
```

## Theme Integration

Component tích hợp đầy đủ với hệ thống theme của app:

### CSS Variables được sử dụng

```css
/* Background colors */
--bg-primary: white (light) / #1c1c1e (dark)
--bg-secondary: #f5f5f5 (light) / #2c2c2e (dark)
--bg-tertiary: #e8e8e8 (light) / #3a3a3c (dark)

/* Text colors */
--text-primary: #000 (light) / #fff (dark)
--text-secondary: #666 (light) / #b0b0b0 (dark)
--text-tertiary: #999 (light) / #808080 (dark)

/* Theme colors */
--primary-color: Depends on theme (classic/blue/dreamy/natural)
--primary-gradient: Linear gradient based on theme
--accent-color: Accent color based on theme

/* Border & Shadow */
--border-color: #e8e8e8 (light) / #3a3a3c (dark)
--shadow-color: rgba(0,0,0,0.1) (light) / rgba(0,0,0,0.3) (dark)

/* Safe areas */
--safe-area-inset-top
--safe-area-inset-bottom
--safe-area-inset-left
--safe-area-inset-right
```

### Theme switching

- ✅ Smooth transitions (0.3s) khi đổi theme
- ✅ Tự động cập nhật màu sắc theo theme hiện tại
- ✅ Fallback values cho browsers không hỗ trợ CSS variables

### Responsive Examples

```javascript
// Font size với clamp()
font-size: clamp(0.7rem, 2.75vw, 0.8rem);
// Min: 0.7rem (11.2px) | Ideal: 2.75vw | Max: 0.8rem (12.8px)

// Padding với safe area
padding-top: calc(var(--safe-area-inset-top, env(safe-area-inset-top, 0px)) + clamp(12px, 3vw, 16px));

// Width với responsive range
width: clamp(36px, 10vw, 48px);
```

## Browser Support

- ✅ iOS Safari 12+
- ✅ Android Chrome 80+
- ✅ Modern mobile browsers
- ✅ PWA support

## Performance Optimization

- ✅ Hardware-accelerated animations với `transform` và `opacity`
- ✅ Smooth scrolling với `-webkit-overflow-scrolling: touch`
- ✅ Overscroll-behavior để ngăn pull-to-refresh không mong muốn
- ✅ Scroll-snap cho horizontal lists (mutual friends)
- ✅ Custom lightweight scrollbar (4px width)

## Accessibility

- ✅ Touch targets tối thiểu 44x44px (iOS guidelines)
- ✅ Tap highlight với transparent background
- ✅ Active states với scale transform feedback
- ✅ Disabled states rõ ràng với opacity

## TODO / Future Enhancements

- [ ] Thêm xem ảnh full screen với pinch-to-zoom
- [ ] Thêm chức năng báo cáo người dùng
- [ ] Thêm chức năng chặn người dùng
- [ ] Hiển thị bài viết của người dùng
- [ ] Thêm skeleton loading states
- [ ] Error handling UI với retry
- [ ] Haptic feedback cho iOS
- [ ] Share profile functionality

## License

MIT

