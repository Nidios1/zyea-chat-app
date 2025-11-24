# Phân Tích UI/UX Components - Mobile Native (Expo)

## 📱 Tổng Quan Mobile-Expo

Dự án mobile native sử dụng React Native với Expo. Phân tích chi tiết về việc sử dụng components:

---

## ✅ Components Được Sử Dụng Chung (Tốt)

### Common Components (`src/components/Common/`)

| Component | Số Lần Sử Dụng | Vị Trí Sử Dụng |
|-----------|----------------|----------------|
| `ExpandableText` | 4 | PostsListScreen, CommentsScreen, FullScreenImageViewer, CommentsBottomSheet |
| `FullScreenImageViewer` | 2 | PostsListScreen, OtherUserProfileScreen |
| `SplashScreen` | 3+ | App.tsx, ChatListScreen, PostsListScreen |
| `UpdateModal` | 2 | AppInfoScreen, SettingsScreen |
| `AlertDialog` | Nhiều | Shared dialog component |
| `QRLoginConfirmModal` | 1 | QRScannerScreen |
| `ErrorBoundary` | 1 | App.tsx (root level) |

### NewsFeed Components (`src/components/NewsFeed/`)

| Component | Số Lần Sử Dụng | Vị Trí Sử Dụng |
|-----------|----------------|----------------|
| `PostImagesCarousel` | 2 | PostsListScreen, CommentsScreen |
| `PostVideoPlayer` | 1 | PostsListScreen |
| `ReactionPicker` | 1 | PostsListScreen |
| `StoriesSection` | 1 | PostsListScreen |
| `HomeHeader` | 1 | PostsListScreen |
| `CommentItem` | 1 | PostDetailScreen |
| `CommentsBottomSheet` | 1 | PostsListScreen |

### Chat Components (`src/components/Chat/`)

| Component | Số Lần Sử Dụng | Vị Trí Sử Dụng |
|-----------|----------------|----------------|
| `MessageBubble` | 1 | ChatDetailScreen |
| `TypingIndicator` | 1 | ChatDetailScreen |
| `ReplyBar` | 1 | ChatDetailScreen |
| `StickerPicker` | 1 | ChatDetailScreen |
| `ConversationItem` | 1 | ChatListScreen |
| `SwipeableConversationItem` | 1 | ChatListScreen |

---

## ❌ Vấn Đề: Components Inline/Duplicate

### 1. **PostContent Component** (CRITICAL - 365 dòng)

**Vị trí:** `src/screens/NewsFeed/PostsListScreen.tsx` (dòng 49-411)

**Vấn đề:**
- ✅ Component được định nghĩa inline trong screen file
- ✅ Có logic phức tạp (365 dòng code)
- ✅ Có logic tương tự `ExpandableText` nhưng được viết lại
- ✅ Có thêm logic parse hashtags/mentions/URLs nhưng không được tái sử dụng
- ✅ Khó maintain và test

**Tác động:**
- File `PostsListScreen.tsx` quá dài (2838 dòng)
- Khó tái sử dụng ở nơi khác
- Khó test riêng biệt

**Giải pháp:**
```typescript
// Tách ra: src/components/NewsFeed/PostContent.tsx
// Import: import PostContent from '../../components/NewsFeed/PostContent';
```

**Ưu tiên:** 🔴 **HIGH** - Nên refactor ngay

---

### 2. **NotificationCard Component** (Inline)

**Vị trí:** `src/screens/Notifications/SystemNotificationsScreen.tsx` (dòng 82)

**Vấn đề:**
- Component được định nghĩa inline trong screen
- Có thể tái sử dụng ở nơi khác

**Giải pháp:**
```typescript
// Tách ra: src/components/Notifications/NotificationCard.tsx
```

**Ưu tiên:** 🟡 **MEDIUM**

---

### 3. **StickerPickerInline Component** (Inline)

**Vị trí:** `src/screens/Chat/ChatDetailScreen.tsx` (dòng 333)

**Vấn đề:**
- Component inline với tên "Inline" - rõ ràng là temporary
- Đã có `StickerPicker` component riêng

**Giải pháp:**
- Xem xét merge với `StickerPicker` component hiện có
- Hoặc tách ra file riêng nếu logic khác biệt

**Ưu tiên:** 🟡 **MEDIUM**

---

### 4. **LogoIcon Component** (Inline)

**Vị trí:** `src/screens/Auth/LoginScreen.tsx` (dòng 67)

**Vấn đề:**
- Component nhỏ, inline
- Có thể tái sử dụng ở RegisterScreen hoặc nơi khác

**Giải pháp:**
```typescript
// Tách ra: src/components/Common/LogoIcon.tsx
```

**Ưu tiên:** 🟢 **LOW**

---

## 📊 Thống Kê Code

### File Size Analysis

| File | Dòng Code | Vấn Đề |
|------|-----------|--------|
| `PostsListScreen.tsx` | 2838 | ❌ Quá dài, có inline component 365 dòng |
| `ChatDetailScreen.tsx` | ~4000+ | ⚠️ Cần kiểm tra |
| `SystemNotificationsScreen.tsx` | ~500+ | ⚠️ Có inline component |

### Component Reusability

| Loại | Số Lượng | Tỷ Lệ |
|------|----------|-------|
| **Shared Components** | 15+ | ✅ Tốt |
| **Feature-Specific** | 20+ | ✅ Tốt |
| **Inline Components** | 4 | ❌ Cần refactor |

---

## 🎯 Khuyến Nghị Refactor

### Phase 1: High Priority (Ngay lập tức)

#### 1. Tách PostContent Component
```bash
# Tạo file mới
src/components/NewsFeed/PostContent.tsx

# Di chuyển code từ PostsListScreen.tsx
# Cập nhật import trong PostsListScreen.tsx
```

**Lợi ích:**
- Giảm file `PostsListScreen.tsx` từ 2838 → ~2473 dòng
- Dễ maintain và test
- Có thể tái sử dụng ở nơi khác

**Thời gian ước tính:** 30-45 phút

---

### Phase 2: Medium Priority (Tuần này)

#### 2. Tách NotificationCard Component
```bash
src/components/Notifications/NotificationCard.tsx
```

#### 3. Refactor StickerPickerInline
- Merge với `StickerPicker` hoặc tách riêng

---

### Phase 3: Low Priority (Sau này)

#### 4. Tách LogoIcon Component
```bash
src/components/Common/LogoIcon.tsx
```

#### 5. Tạo Shared UI Components Library
```bash
src/components/UI/
  - Button.tsx
  - Input.tsx
  - Card.tsx
  - Modal.tsx
  - Badge.tsx
```

---

## 📋 Checklist Refactor

### PostContent Component

- [ ] Tạo file `src/components/NewsFeed/PostContent.tsx`
- [ ] Di chuyển code từ `PostsListScreen.tsx`
- [ ] Extract types/interfaces
- [ ] Update imports trong `PostsListScreen.tsx`
- [ ] Test component riêng biệt
- [ ] Verify không có breaking changes
- [ ] Update documentation

### NotificationCard Component

- [ ] Tạo file `src/components/Notifications/NotificationCard.tsx`
- [ ] Di chuyển code
- [ ] Update imports
- [ ] Test

### StickerPickerInline

- [ ] Review logic khác biệt với `StickerPicker`
- [ ] Quyết định: merge hoặc tách riêng
- [ ] Refactor

---

## 🏗️ Cấu Trúc Đề Xuất

```
src/components/
├── Common/              ✅ Đã có - Shared components
│   ├── ExpandableText.tsx
│   ├── FullScreenImageViewer.tsx
│   ├── AlertDialog.tsx
│   └── ...
├── NewsFeed/            ✅ Đã có - NewsFeed components
│   ├── PostContent.tsx  ⚠️ CẦN TẠO (từ inline)
│   ├── PostImagesCarousel.tsx
│   └── ...
├── Chat/                ✅ Đã có - Chat components
│   ├── MessageBubble.tsx
│   └── ...
├── Notifications/       ⚠️ CẦN TẠO
│   └── NotificationCard.tsx  (từ inline)
└── UI/                  ⚠️ NÊN TẠO (tương lai)
    ├── Button.tsx
    ├── Input.tsx
    ├── Card.tsx
    └── Modal.tsx
```

---

## 📈 Metrics Sau Refactor

### Trước Refactor
- File lớn nhất: `PostsListScreen.tsx` - 2838 dòng
- Inline components: 4
- Code duplication: Medium

### Sau Refactor (Dự kiến)
- File lớn nhất: `PostsListScreen.tsx` - ~2473 dòng (-365 dòng)
- Inline components: 0-1
- Code duplication: Low
- Reusability: High

---

## 🚀 Next Steps

1. **Bắt đầu với PostContent** (High Priority)
   - Tách component ra file riêng
   - Test và verify
   - Commit changes

2. **Tiếp tục với NotificationCard** (Medium Priority)
   - Tách component
   - Update imports

3. **Tạo UI Components Library** (Low Priority)
   - Button, Input, Card, Modal
   - Standardize styling

4. **Documentation**
   - Tạo Storybook hoặc component docs
   - List tất cả shared components

---

## 💡 Best Practices

### ✅ Nên làm
- Tách components > 50 dòng ra file riêng
- Tạo shared components cho logic tái sử dụng
- Sử dụng TypeScript interfaces cho props
- Document component props và usage

### ❌ Không nên
- Định nghĩa components inline trong screen files
- Duplicate logic giữa các components
- Tạo components quá lớn (> 500 dòng)
- Hardcode styles thay vì dùng theme

---

## 📝 Notes

- Mobile-expo có cấu trúc tốt với Common/ và feature-specific folders
- Cần refactor một số inline components để cải thiện maintainability
- PostContent là ưu tiên cao nhất vì size và complexity

