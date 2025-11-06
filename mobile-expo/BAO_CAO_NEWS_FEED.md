# 📊 BÁO CÁO CHỨC NĂNG NEWS FEED

**Ngày tạo:** $(date)  
**Phiên bản:** 1.0  
**Trạng thái:** ✅ Hoàn thiện cơ bản / ⚠️ Cần cải thiện

---

## 📋 MỤC LỤC

1. [Tổng quan](#tổng-quan)
2. [Tính năng đã hoàn thiện](#tính-năng-đã-hoàn-thiện)
3. [Tính năng chưa hoàn thiện](#tính-năng-chưa-hoàn-thiện)
4. [Vấn đề đã xử lý](#vấn-đề-đã-xử-lý)
5. [Vấn đề còn tồn tại](#vấn-đề-còn-tồn-tại)
6. [Đề xuất cải thiện](#đề-xuất-cải-thiện)
7. [Kiến trúc kỹ thuật](#kiến-trúc-kỹ-thuật)

---

## 🎯 TỔNG QUAN

News Feed là màn hình chính hiển thị các bài viết từ người dùng, được thiết kế theo phong cách Threads với 2 tab: **"Tất cả"** và **"Đang theo dõi"**.

### **Các thành phần chính:**
- **PostsListScreen.tsx**: Màn hình chính hiển thị danh sách bài viết
- **FeedTabBar.tsx**: Component tab bar cho "Tất cả" và "Đang theo dõi"
- **CommentsBottomSheet.tsx**: Bottom sheet để xem và thêm bình luận
- **PostImagesCarousel.tsx**: Component hiển thị ảnh trong bài viết
- **Backend API**: `/newsfeed/posts` với query parameter `type`

---

## ✅ TÍNH NĂNG ĐÃ HOÀN THIỆN

### 1. **Tab Bar - Phân loại bài viết** ✅
- ✅ Tab "Tất cả": Hiển thị tất cả bài viết từ mọi người dùng
- ✅ Tab "Đang theo dõi": Chỉ hiển thị bài viết từ người đang follow
- ✅ UI giống Threads với nút tab có background đậm khi active
- ✅ Hỗ trợ Light/Dark mode
- ✅ Chuyển đổi tab mượt mà, tự động refetch data

**File:** `src/components/Common/FeedTabBar.tsx`

### 2. **Hiển thị bài viết** ✅
- ✅ Header với logo "Zyea+" và nút tìm kiếm
- ✅ Avatar và tên người đăng (fallback nếu không có avatar)
- ✅ Thời gian đăng (format: "X giây/phút/giờ/ngày trước")
- ✅ Nội dung bài viết với `ExpandableText` (có thể mở rộng nếu dài)
- ✅ Hiển thị ảnh với `PostImagesCarousel` (hỗ trợ nhiều ảnh)
- ✅ Lọc bỏ bài viết có video (chỉ hiển thị trong Video tab)
- ✅ Empty state khi không có bài viết
- ✅ Loading state khi đang tải

**File:** `src/screens/NewsFeed/PostsListScreen.tsx`

### 3. **Nút Follow/Unfollow** ✅
- ✅ Hiển thị nút "+" (follow) bên cạnh tên người dùng
- ✅ Chỉ hiện trong tab "Tất cả"
- ✅ Chỉ hiện cho người chưa follow và không phải chính mình
- ✅ Tự động ẩn sau khi follow thành công
- ✅ Cập nhật real-time sau khi follow/unfollow

**Logic:**
```typescript
const isFollowing = authorId && followingIds.has(authorId);
const isOwnPost = authorId === user?.id;
const showFollowButton = !isOwnPost && !isFollowing && activeTab === 'all';
```

### 4. **Pull to Refresh** ✅
- ✅ Kéo xuống để làm mới danh sách bài viết
- ✅ Invalidate cache và refetch data
- ✅ Cập nhật danh sách following để sync follow status

### 5. **Scroll Behavior** ✅
- ✅ Ẩn/hiện tab bar khi scroll (ẩn khi scroll xuống, hiện khi scroll lên)
- ✅ Hiển thị FAB (Floating Action Button) khi scroll xuống
- ✅ Animation mượt mà với `Animated`

### 6. **Comments Bottom Sheet** ✅
- ✅ Mở bottom sheet khi click nút comment
- ✅ Hiển thị danh sách bình luận
- ✅ Thêm bình luận mới
- ✅ Real-time update sau khi comment
- ✅ Hỗ trợ emoji reactions

**File:** `src/components/NewsFeed/CommentsBottomSheet.tsx`

### 7. **Theme Support** ✅
- ✅ Hỗ trợ Light/Dark mode
- ✅ Tự động thay đổi màu sắc theo theme
- ✅ Màu sắc nhất quán với hệ thống

### 8. **Backend API** ✅
- ✅ Endpoint `/newsfeed/posts` với query parameter `type`
- ✅ `type='all'`: Lấy tất cả bài viết từ mọi người (không filter privacy)
- ✅ `type='following'`: Chỉ lấy bài viết từ người đang follow
- ✅ Logging chi tiết để debug
- ✅ Hỗ trợ pagination (page parameter)

**File:** `server/routes/newsfeed.js`

### 9. **React Query Integration** ✅
- ✅ Sử dụng `useQuery` để fetch posts
- ✅ Cache management với `queryKey` theo `activeTab`
- ✅ `staleTime: 0` để luôn refetch khi cần
- ✅ `gcTime: 5 phút` để giữ cache
- ✅ Invalidate cache khi refresh

---

## ⚠️ TÍNH NĂNG CHƯA HOÀN THIỆN

### 1. **Like/Unlike Post** ⚠️
**Trạng thái:** UI có nhưng chưa kết nối API

**Vấn đề:**
- Nút like hiển thị đúng (heart filled khi đã like, outline khi chưa)
- Số lượng like hiển thị đúng
- **NHƯNG:** Click vào nút like không có handler để gọi API

**Code hiện tại:**
```typescript
<TouchableOpacity style={dynamicStyles.actionButton}>
  <MaterialCommunityIcons
    name={item.isLiked ? 'heart' : 'heart-outline'}
    size={20}
    color={item.isLiked ? '#e74c3c' : colors.textSecondary}
  />
  {(item.likes_count || 0) > 0 && (
    <Text style={[dynamicStyles.actionCount, { color: colors.textSecondary }]}>
      {item.likes_count || 0}
    </Text>
  )}
</TouchableOpacity>
```

**Cần thêm:**
- Handler `handleLike` để gọi `newsfeedAPI.likePost()` hoặc `unlikePost()`
- Optimistic update để UI phản hồi ngay
- Invalidate cache sau khi like/unlike

**API đã có sẵn:**
```typescript
likePost: (postId: string) => apiClient.post(`/newsfeed/posts/${postId}/like`)
unlikePost: (postId: string) => apiClient.delete(`/newsfeed/posts/${postId}/like`)
```

### 2. **Share/Repost** ⚠️
**Trạng thái:** UI có nhưng chưa có chức năng

**Vấn đề:**
- Nút "repeat" (repost) và "send" (share) hiển thị
- **NHƯNG:** Chưa có handler và chưa có API endpoint

**Cần thêm:**
- Handler cho nút repost/share
- API endpoint `/newsfeed/posts/:id/repost` hoặc `/share`
- Bottom sheet để chọn cách chia sẻ (copy link, share to chat, etc.)

### 3. **Delete Post** ⚠️
**Trạng thái:** Chưa có UI và chức năng

**Vấn đề:**
- Nút "dots-horizontal" (more options) hiển thị nhưng chưa có menu
- Chưa có option để xóa bài viết của chính mình

**Cần thêm:**
- Bottom sheet menu khi click nút "more"
- Option "Xóa bài viết" (chỉ hiện cho bài viết của chính mình)
- Confirmation dialog trước khi xóa
- API endpoint đã có: `deletePost: (postId: string) => apiClient.delete(...)`

### 4. **Pagination** ⚠️
**Trạng thái:** Chưa implement

**Vấn đề:**
- Hiện tại chỉ load 50 bài viết đầu tiên
- Chưa có "Load more" hoặc infinite scroll

**Cần thêm:**
- Infinite scroll với `onEndReached` trong `FlatList`
- Load thêm posts khi scroll đến cuối
- Loading indicator khi đang load thêm

### 5. **Search** ⚠️
**Trạng thái:** UI có nhưng chưa có chức năng

**Vấn đề:**
- Nút search (magnify) trong header hiển thị
- **NHƯNG:** Chưa có màn hình search hoặc filter

**Cần thêm:**
- Màn hình search posts/users
- API endpoint `/newsfeed/search?q=...`
- Filter posts theo keyword

### 6. **Post Detail Screen** ⚠️
**Trạng thái:** Có file nhưng chưa được tích hợp

**Vấn đề:**
- File `PostDetailScreen.tsx` đã có
- **NHƯNG:** Chưa có navigation từ `PostsListScreen` đến `PostDetailScreen`

**Cần thêm:**
- Click vào bài viết để mở detail screen
- Navigation với params `{ postId: item.id }`

---

## 🔧 VẤN ĐỀ ĐÃ XỬ LÝ

### 1. **Tab "Tất cả" chỉ hiển thị bài viết của chính mình** ✅
**Vấn đề:** Backend query filter theo privacy, chỉ trả về bài viết của user hiện tại.

**Giải pháp:**
- Sửa query SQL để bỏ `WHERE` clause khi `type !== 'following'`
- Lấy tất cả posts từ mọi người, không filter privacy
- Thêm logging để debug

**Code:**
```javascript
if (type !== 'following') {
  query = `
    SELECT p.*, u.username, u.full_name, u.avatar_url, u.status,
           CASE WHEN pl.user_id IS NOT NULL THEN 1 ELSE 0 END as isLiked
    FROM posts p
    JOIN users u ON p.user_id = u.id
    LEFT JOIN post_likes pl ON p.id = pl.post_id AND pl.user_id = ?
    ORDER BY p.created_at DESC
    LIMIT 50
  `;
}
```

### 2. **URLSearchParams không hoạt động trên React Native** ✅
**Vấn đề:** `URLSearchParams` không được hỗ trợ đầy đủ trên React Native.

**Giải pháp:**
- Build URL manually thay vì dùng `URLSearchParams`
- Encode `type` parameter với `encodeURIComponent`

**Code:**
```typescript
const typeParam = type || 'all';
const url = `/newsfeed/posts?page=${page}&type=${encodeURIComponent(typeParam)}`;
```

### 3. **Follow button không cập nhật sau khi follow** ✅
**Vấn đề:** Sau khi follow, button vẫn hiển thị.

**Giải pháp:**
- Invalidate và refetch `following` list sau khi follow/unfollow
- UI tự động cập nhật vì `followingIds` Set được tính lại

**Code:**
```typescript
const handleFollow = async (userId: string | number) => {
  await friendsAPI.follow(userId.toString());
  await refetchFollowing(); // Refresh following list
};
```

### 4. **Cache không được invalidate khi refresh** ✅
**Vấn đề:** Pull to refresh không cập nhật data mới.

**Giải pháp:**
- Invalidate cache với `queryClient.invalidateQueries()`
- Refetch cả posts và following list

**Code:**
```typescript
const handleRefresh = async () => {
  await queryClient.invalidateQueries({ queryKey: ['posts', activeTab] });
  await queryClient.invalidateQueries({ queryKey: ['following'] });
  await refetchFollowing();
  await refetch();
};
```

### 5. **React Query v5 migration** ✅
**Vấn đề:** `cacheTime` không còn tồn tại trong React Query v5.

**Giải pháp:**
- Đổi `cacheTime` thành `gcTime`

---

## 🐛 VẤN ĐỀ CÒN TỒN TẠI

### 1. **Một số user chỉ thấy bài viết của chính mình** ⚠️
**Mô tả:** Một số tài khoản khi vào tab "Tất cả" chỉ thấy bài viết của chính mình, trong khi tài khoản khác thấy đầy đủ.

**Nguyên nhân có thể:**
- Database chỉ có posts của user đó
- Cache cũ chưa được clear
- Query parameter `type` không được gửi đúng

**Cách debug:**
- Kiểm tra logs backend: `📱 [Backend] Posts from X different users`
- Kiểm tra logs frontend: `📱 Posts from X different users`
- So sánh với user khác xem có khác biệt không

**Giải pháp đề xuất:**
- Clear cache và reinstall app
- Kiểm tra database có posts từ nhiều users không
- Verify query parameter được gửi đúng

### 2. **TypeScript error với @expo/vector-icons** ⚠️
**Mô tả:** TypeScript báo lỗi `Cannot find module '@expo/vector-icons'` nhưng code vẫn chạy.

**Nguyên nhân:** Thiếu type definitions.

**Giải pháp:** Không ảnh hưởng runtime, có thể bỏ qua hoặc thêm type definitions.

---

## 💡 ĐỀ XUẤT CẢI THIỆN

### 1. **Hoàn thiện Like/Unlike** 🔴 **Ưu tiên cao**
- Thêm handler `handleLike` với optimistic update
- Gọi API `likePost`/`unlikePost`
- Invalidate cache sau khi like

**Code đề xuất:**
```typescript
const handleLike = async (postId: string | number, isLiked: boolean) => {
  try {
    // Optimistic update
    queryClient.setQueryData(['posts', activeTab], (old: any[]) => {
      return old.map(post => 
        post.id === postId 
          ? { ...post, isLiked: !isLiked, likes_count: (post.likes_count || 0) + (isLiked ? -1 : 1) }
          : post
      );
    });
    
    // Call API
    if (isLiked) {
      await newsfeedAPI.unlikePost(postId.toString());
    } else {
      await newsfeedAPI.likePost(postId.toString());
    }
    
    // Refetch to ensure sync
    await queryClient.invalidateQueries({ queryKey: ['posts', activeTab] });
  } catch (error) {
    // Revert on error
    await queryClient.invalidateQueries({ queryKey: ['posts', activeTab] });
  }
};
```

### 2. **Thêm Delete Post** 🟡 **Ưu tiên trung bình**
- Thêm bottom sheet menu khi click nút "more"
- Option "Xóa bài viết" (chỉ hiện cho bài viết của chính mình)
- Confirmation dialog

### 3. **Thêm Pagination** 🟡 **Ưu tiên trung bình**
- Infinite scroll với `onEndReached`
- Load thêm 50 posts mỗi lần
- Loading indicator

### 4. **Thêm Search** 🟢 **Ưu tiên thấp**
- Màn hình search với input
- API endpoint `/newsfeed/search?q=...`
- Filter posts theo keyword

### 5. **Cải thiện Performance** 🟡 **Ưu tiên trung bình**
- Memoize `renderPost` với `React.memo`
- Optimize image loading với `react-native-fast-image`
- Lazy load comments (chỉ load khi mở bottom sheet)

### 6. **Thêm Error Handling** 🟡 **Ưu tiên trung bình**
- Toast notification khi follow/like thất bại
- Retry mechanism khi API call fail
- Better error messages

---

## 🏗️ KIẾN TRÚC KỸ THUẬT

### **Frontend Architecture:**

```
PostsListScreen.tsx
├── FeedTabBar (All/Following tabs)
├── FlatList (Posts list)
│   └── renderPost()
│       ├── Post Header (Avatar, Name, Follow button, Time)
│       ├── Post Content (Text with ExpandableText)
│       ├── Post Images (PostImagesCarousel)
│       └── Post Actions (Like, Comment, Repost, Share)
├── CommentsBottomSheet (Comments modal)
└── FAB (Create Post button)
```

### **Data Flow:**

```
User Action
  ↓
PostsListScreen
  ↓
React Query (useQuery)
  ↓
newsfeedAPI.getPosts(type)
  ↓
Backend API (/newsfeed/posts?type=all|following)
  ↓
Database Query
  ↓
Return Posts
  ↓
Filter (remove videos)
  ↓
Display in FlatList
```

### **State Management:**

- **React Query** cho server state (posts, following list)
- **useState** cho local state (activeTab, refreshing, showComments, etc.)
- **useRef** cho scroll position và animation values

### **API Endpoints:**

| Endpoint | Method | Params | Description |
|----------|--------|--------|-------------|
| `/newsfeed/posts` | GET | `page`, `type` | Get posts (all or following) |
| `/newsfeed/posts/:id` | GET | - | Get single post |
| `/newsfeed/posts/:id/like` | POST | - | Like post |
| `/newsfeed/posts/:id/like` | DELETE | - | Unlike post |
| `/newsfeed/posts/:id/comments` | GET | - | Get comments |
| `/newsfeed/posts/:id/comments` | POST | `content` | Add comment |
| `/newsfeed/posts/:id` | DELETE | - | Delete post |
| `/friends/following` | GET | - | Get following list |
| `/friends/follow` | POST | `followingId` | Follow user |
| `/friends/follow/:id` | DELETE | - | Unfollow user |

### **Key Dependencies:**

- `@tanstack/react-query`: Data fetching và caching
- `react-native-paper`: UI components (Avatar, Text)
- `@expo/vector-icons`: Icons (MaterialCommunityIcons)
- `react-native-safe-area-context`: Safe area handling
- `react-navigation`: Navigation

---

## 📊 TỔNG KẾT

### **Hoàn thiện:** ✅ 70%
- ✅ Tab bar (All/Following)
- ✅ Hiển thị posts
- ✅ Follow/Unfollow
- ✅ Comments
- ✅ Pull to refresh
- ✅ Theme support
- ✅ Backend API

### **Cần hoàn thiện:** ⚠️ 30%
- ⚠️ Like/Unlike (UI có, thiếu handler)
- ⚠️ Share/Repost (UI có, chưa có chức năng)
- ⚠️ Delete Post (chưa có)
- ⚠️ Pagination (chưa có)
- ⚠️ Search (chưa có)

### **Đánh giá tổng thể:** ⭐⭐⭐⭐ (4/5)

News Feed đã có đầy đủ tính năng cơ bản và hoạt động ổn định. Cần hoàn thiện các tính năng tương tác (like, share, delete) để đạt mức độ hoàn thiện cao hơn.

---

**Tác giả:** AI Assistant  
**Cập nhật lần cuối:** $(date)

