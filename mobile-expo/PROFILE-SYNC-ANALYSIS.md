# Phân Tích Đồng Bộ Trang Cá Nhân

## Tổng Quan
So sánh giữa **MyProfileScreen** (trang cá nhân của mình) và **OtherUserProfileScreen** (trang cá nhân người khác) để xác định các phần chưa đồng bộ.

---

## ✅ Các Phần Đã Đồng Bộ

### 1. **ProfileHeader Component**
- ✅ Cả hai màn hình đều dùng chung `ProfileHeader` component
- ✅ Hiển thị banner, avatar, name, handle, bio, stats
- ✅ Tabs: posts, replies (chỉ khi isMe), media, videos, likes (chỉ khi isMe)
- ✅ Action buttons khác nhau cho isMe vs không phải isMe

### 2. **Post Rendering**
- ✅ Cả hai đều render posts giống nhau
- ✅ Cùng logic filter posts theo tabs
- ✅ Cùng PostControls, PostContent, PostImagesCarousel, PostVideoPlayer

### 3. **Data Fetching**
- ✅ Cùng dùng React Query
- ✅ Cùng API endpoints (usersAPI, friendsAPI, newsfeedAPI)
- ✅ Cùng format stats

---

## ❌ Các Phần Chưa Đồng Bộ

### 1. **Banner URL - SAI UTILITY FUNCTION** ⚠️ QUAN TRỌNG

**Vấn đề:**
- `ProfileHeader.tsx` line 69: Dùng `getAvatarURL(bannerUrl)` cho banner
- Banner nằm trong `/uploads/covers/` nhưng `getAvatarURL` chỉ xử lý `/uploads/avatars/`
- Nên dùng `getImageURL()` thay vì `getAvatarURL()` cho banner

**Vị trí:**
```typescript
// ProfileHeader.tsx line 69
source={{ uri: getAvatarURL(bannerUrl) }}  // ❌ SAI
// Nên là:
source={{ uri: getImageURL(bannerUrl) }}  // ✅ ĐÚNG
```

**Ảnh hưởng:**
- Banner không hiển thị đúng URL
- Có thể hiển thị ảnh sai hoặc không hiển thị

---

### 2. **Mapping cover_url ↔ banner_url** ⚠️ QUAN TRỌNG

**Vấn đề:**
- Server trả về `cover_url` (database field)
- Client interface dùng `banner_url`
- `ProfileHeader` đọc `banner_url` từ user object
- Cần map `cover_url` → `banner_url` khi nhận data từ server

**Vị trí:**
- `ProfileHeader.tsx` line 54: `const bannerUrl = (user as any)?.banner_url || null;`
- `AuthContext.tsx` line 120-125: Đã có mapping nhưng cần kiểm tra lại
- `usersAPI.getProfile()` response có thể trả về `cover_url` thay vì `banner_url`

**Giải pháp:**
- Map `cover_url` → `banner_url` trong API response hoặc trong ProfileHeader
- Hoặc thêm utility function `getBannerURL()` để xử lý cả hai

---

### 3. **Sticky Header - Thiếu ở OtherUserProfileScreen** ⚠️

**Vấn đề:**
- `MyProfileScreen` có render sticky header với animation (line 459-516)
- `OtherUserProfileScreen` có state `isScrolledDown` và styles nhưng **KHÔNG render sticky header**
- Khi scroll xuống, OtherUserProfileScreen không có sticky header để hiển thị tên user

**Vị trí:**
- `MyProfileScreen.tsx` line 459-516: Có render sticky header
- `OtherUserProfileScreen.tsx` line 206: Có state nhưng không render

**Ảnh hưởng:**
- UX không nhất quán giữa 2 màn hình
- Khi scroll xuống, OtherUserProfileScreen không có header để navigate back

---

### 4. **FAB (Floating Action Button)** - Chỉ có ở MyProfileScreen

**Vấn đề:**
- `MyProfileScreen` có FAB để tạo post (line 567-573)
- `OtherUserProfileScreen` không có FAB
- Đây là đúng (chỉ nên có ở profile của mình), nhưng cần document rõ

**Status:** ✅ Đúng thiết kế, không cần sửa

---

### 5. **Likes Tab** - Chỉ có ở MyProfileScreen

**Vấn đề:**
- `MyProfileScreen` có tab "Lượt thích" (line 308-324 trong ProfileHeader)
- `OtherUserProfileScreen` không có tab này
- Đây là đúng (chỉ nên xem likes của mình), nhưng cần đảm bảo logic đúng

**Status:** ✅ Đúng thiết kế, không cần sửa

---

### 6. **Action Buttons - Khác nhau (Đúng thiết kế)**

**MyProfileScreen:**
- "Chỉnh sửa hồ sơ" button
- Settings menu button

**OtherUserProfileScreen:**
- "Theo dõi" / "Đang theo dõi" button
- Message button
- Settings menu button

**Status:** ✅ Đúng thiết kế, không cần sửa

---

## 📋 Tóm Tắt Cần Sửa

### 🔴 QUAN TRỌNG - Cần sửa ngay:

1. **Banner URL Utility** (ProfileHeader.tsx line 69)
   - Đổi từ `getAvatarURL(bannerUrl)` → `getImageURL(bannerUrl)`
   - Hoặc tạo `getBannerURL()` riêng

2. **Mapping cover_url → banner_url**
   - Đảm bảo khi nhận data từ server, map `cover_url` → `banner_url`
   - Hoặc ProfileHeader đọc cả hai: `banner_url || cover_url`

3. **Sticky Header cho OtherUserProfileScreen**
   - Thêm render sticky header giống MyProfileScreen
   - Hoặc ít nhất có back button khi scroll xuống

### 🟡 Nên cải thiện:

4. **Thêm utility function `getBannerURL()`**
   - Xử lý cả `banner_url` và `cover_url`
   - Xử lý path `/uploads/covers/` đúng cách

5. **Đồng bộ scroll behavior**
   - Đảm bảo cả hai màn hình có cùng scroll threshold
   - Đồng bộ animation timing

---

## 📝 Code Cần Sửa

### 1. ProfileHeader.tsx - Banner URL
```typescript
// Line 8: Import getImageURL
import { getAvatarURL, getImageURL } from '../../utils/imageUtils';

// Line 69: Sửa banner URL
source={{ uri: getImageURL(bannerUrl) }}  // Thay vì getAvatarURL
```

### 2. ProfileHeader.tsx - Banner URL Mapping
```typescript
// Line 54: Đọc cả banner_url và cover_url
const bannerUrl = (user as any)?.banner_url || (user as any)?.cover_url || null;
```

### 3. OtherUserProfileScreen.tsx - Sticky Header
```typescript
// Thêm render sticky header giống MyProfileScreen (line 459-516)
// Hoặc ít nhất thêm back button khi scroll
```

---

## ✅ Kết Luận

**Tổng số vấn đề:** 3 vấn đề quan trọng cần sửa

1. ✅ Banner URL utility function sai
2. ✅ Mapping cover_url ↔ banner_url chưa đầy đủ  
3. ✅ Sticky header thiếu ở OtherUserProfileScreen

**Các phần khác:** Đã đồng bộ hoặc đúng thiết kế (FAB, Likes tab, Action buttons)

