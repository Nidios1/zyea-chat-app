# Tính Năng Quản Lý Server cho Admin

## 📋 Tổng Quan

Đã tạo hệ thống quản lý server hoàn chỉnh cho admin với các chức năng:

### ✅ Đã Hoàn Thành

1. **Admin API Functions** (`src/utils/api.ts`)
   - Dashboard stats
   - User management (CRUD)
   - Post management
   - Sticker packs management
   - System notifications management
   - Activity tracking

2. **Admin Screens**
   - **AdminDashboardScreen**: Tổng quan server với thống kê
   - **AdminUsersScreen**: Quản lý người dùng (xem, cập nhật, xóa, cấp quyền)
   - **AdminPostsScreen**: Quản lý bài viết (xem, xóa)
   - **AdminServerScreen**: Thông tin server và hoạt động gần đây
   - **AdminScreen**: Màn hình chính với tabs navigation

3. **Navigation Integration**
   - Thêm vào ProfileStack
   - Menu item "Quản lý Server" trong ProfileMenu (chỉ hiện cho admin)
   - Sử dụng `isAdmin` utility để kiểm tra quyền

## 🚀 Cài Đặt

### 1. Dependencies

Không cần cài thêm dependencies, đã sử dụng các packages có sẵn:
- `@react-navigation/stack` (đã có)
- `react-native-paper` (đã có)
- `@tanstack/react-query` (đã có)

### 2. Cấu trúc Files

```
src/
├── screens/
│   └── Admin/
│       ├── AdminScreen.tsx          # Main screen với tabs
│       ├── AdminDashboardScreen.tsx # Dashboard với stats
│       ├── AdminUsersScreen.tsx     # Quản lý users
│       ├── AdminPostsScreen.tsx     # Quản lý posts
│       └── AdminServerScreen.tsx    # Server info
├── utils/
│   ├── api.ts                       # Admin API functions
│   └── adminUtils.ts                # isAdmin utility
└── components/
    └── Profile/
        └── ProfileMenu.tsx           # Đã thêm menu Admin
```

## 📱 Cách Sử Dụng

### Truy Cập Admin Panel

1. Đăng nhập với tài khoản admin (role = 'admin')
2. Vào Profile
3. Click menu (3 chấm) ở góc trên
4. Chọn "Quản lý Server"

### Các Chức Năng

#### Dashboard
- Xem tổng quan: users, posts, messages, conversations
- Thống kê hôm nay: users mới, posts mới
- Phân tích theo status và privacy

#### Quản Lý Người Dùng
- Tìm kiếm users
- Lọc theo role (admin/user) và status
- Xem thông tin chi tiết
- Cập nhật thông tin
- Cấp/bỏ quyền admin
- Xóa user
- Reset password

#### Quản Lý Bài Viết
- Tìm kiếm posts
- Xem thông tin chi tiết
- Xóa posts

#### Server Info
- Thông tin server và device
- Hoạt động gần đây
- Các thao tác (logs, backup - sẽ triển khai sau)

## 🔐 Bảo Mật

- Tất cả admin routes yêu cầu authentication và admin role
- Backend middleware `isAdmin` kiểm tra quyền
- Frontend sử dụng `isAdmin` utility để ẩn/hiện menu
- Không thể xóa chính mình hoặc bỏ quyền admin của chính mình

## 📊 API Endpoints

Tất cả endpoints bắt đầu với `/admin/`:

- `GET /admin/stats` - Dashboard stats
- `GET /admin/users` - Danh sách users (có pagination, search, filter)
- `GET /admin/users/:id` - Chi tiết user
- `PUT /admin/users/:id` - Cập nhật user
- `DELETE /admin/users/:id` - Xóa user
- `POST /admin/users/:id/reset-password` - Reset password
- `GET /admin/posts` - Danh sách posts
- `DELETE /admin/posts/:id` - Xóa post
- `GET /admin/activity` - Hoạt động gần đây
- `GET /admin/sticker-packs` - Quản lý sticker packs
- `GET /admin/system-notifications` - Quản lý system notifications

## 🎨 UI/UX

- Material Design với React Native Paper
- Dark mode support
- Pull-to-refresh
- Loading states
- Error handling với Toast notifications
- Responsive layout

## 🔄 Cập Nhật Tương Lai

- [ ] Xem logs server real-time
- [ ] Backup/restore database
- [ ] System health monitoring
- [ ] Advanced analytics và charts
- [ ] Export data (CSV, JSON)
- [ ] Bulk operations
- [ ] Activity logs chi tiết
- [ ] Server performance metrics

## 📝 Lưu Ý

1. **Backend**: Đảm bảo backend đã có admin routes trong `server/routes/admin.js`
2. **Permissions**: Chỉ user có `role = 'admin'` mới thấy menu Admin
3. **Testing**: Test kỹ các chức năng CRUD với tài khoản admin
4. **Navigation**: AdminScreen sử dụng custom tabs (không cần material-top-tabs)

## 🐛 Troubleshooting

### Menu Admin không hiện
- Kiểm tra user có `role = 'admin'` hoặc `is_admin = true`
- Kiểm tra `isAdmin` utility function
- Reload app sau khi cấp quyền admin

### Lỗi navigation
- Đảm bảo đã thêm `Admin` vào `ProfileStackParamList`
- Kiểm tra import trong `MainNavigator.tsx`

### API errors
- Kiểm tra backend admin routes
- Kiểm tra authentication token
- Kiểm tra admin middleware

