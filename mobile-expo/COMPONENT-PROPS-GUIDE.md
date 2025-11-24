# Hướng Dẫn Truyền Props Cho Components Đã Tách

## 📋 Nguyên Tắc

### ✅ Nên Làm (Best Practices)

1. **Components tự quản lý theme/styles**
   - Component tự lấy theme từ `useTheme()` hook
   - Không cần truyền `colors`, `isDarkMode` từ parent
   - Component tự quản lý default styles

2. **Chỉ truyền data và callbacks cần thiết**
   - Truyền data: `content`, `item`, `postId`
   - Truyền callbacks: `onPress`, `onCollapse`, `onExpand`
   - Không truyền functions utility: `countLines`, `formatDate` (tự implement trong component)

3. **Props optional cho customization**
   - Cho phép override styles nếu cần: `style?`, `textStyle?`
   - Cho phép override formatters nếu cần: `formatNotificationDate?`

### ❌ Không Nên Làm

1. **Truyền quá nhiều props từ parent**
   - ❌ `styles` object từ parent
   - ❌ `colors` từ parent (dùng `useTheme()` trong component)
   - ❌ Utility functions như `countLines`, `formatDate`

2. **Phụ thuộc vào parent styles**
   - ❌ Component phụ thuộc vào styles của parent
   - ❌ Component không thể tái sử dụng ở nơi khác

## 📊 So Sánh: Trước vs Sau

### PostContent Component

#### ❌ Trước (Phụ thuộc parent):
```typescript
<PostContent 
  content={item.content}
  styles={dynamicStyles}        // ❌ Phụ thuộc parent styles
  colors={colors}                // ❌ Phụ thuộc parent colors
  countLines={countLines}        // ❌ Phụ thuộc parent function
  postId={item.id}
  onCollapse={handlePostCollapse}
/>
```

#### ✅ Sau (Tự quản lý):
```typescript
<PostContent 
  content={item.content}          // ✅ Chỉ data cần thiết
  postId={item.id}                // ✅ Chỉ data cần thiết
  onCollapse={handlePostCollapse} // ✅ Callback cần thiết
  // Optional: có thể override styles nếu cần
  style={{ marginTop: 12 }}
  textStyle={{ fontSize: 18 }}
/>
```

**Lợi ích:**
- ✅ Component độc lập, không phụ thuộc parent
- ✅ Dễ tái sử dụng ở nơi khác
- ✅ Ít props hơn, dễ sử dụng
- ✅ Component tự quản lý theme/styles

### NotificationCard Component

#### ❌ Trước (Phụ thuộc parent):
```typescript
<NotificationCard
  item={item}
  index={index}
  isExpanded={isExpanded}
  onPress={() => handleNotificationPress(item)}
  onExpand={() => setExpandedNotification(item.id)}
  formatNotificationDate={formatNotificationDate} // ❌ Phụ thuộc parent function
/>
```

#### ✅ Sau (Tự quản lý):
```typescript
<NotificationCard
  item={item}                     // ✅ Chỉ data cần thiết
  index={index}                   // ✅ Chỉ data cần thiết
  isExpanded={isExpanded}         // ✅ State từ parent
  onPress={() => handleNotificationPress(item)} // ✅ Callback
  onExpand={() => setExpandedNotification(item.id)} // ✅ Callback
  // Optional: có thể override date formatter nếu cần
  formatNotificationDate={customFormatter}
/>
```

**Lợi ích:**
- ✅ Component có default date formatter
- ✅ Có thể override nếu cần customize
- ✅ Ít phụ thuộc vào parent

## 🎯 Quy Tắc Chung

### Props Nên Truyền

1. **Data (Required)**
   - `content`, `item`, `postId` - Data cần hiển thị
   - `index` - Cho list items

2. **State (Required)**
   - `isExpanded` - State từ parent (nếu parent quản lý)
   - `isLoading` - Loading state

3. **Callbacks (Required)**
   - `onPress`, `onCollapse`, `onExpand` - User interactions
   - `onChange`, `onSubmit` - Form handlers

4. **Optional Customization**
   - `style?` - Override wrapper style
   - `textStyle?` - Override text style
   - `formatDate?` - Override date formatter

### Props Không Nên Truyền

1. **Theme/Styles từ parent**
   - ❌ `colors` - Dùng `useTheme()` trong component
   - ❌ `isDarkMode` - Dùng `useTheme()` trong component
   - ❌ `styles` object - Component tự quản lý styles

2. **Utility Functions**
   - ❌ `countLines` - Implement trong component
   - ❌ `formatDate` - Có default, optional override
   - ❌ `getImageURL` - Import utility trong component

3. **Internal Logic**
   - ❌ `queryClient` - Component tự quản lý nếu cần
   - ❌ `navigation` - Dùng `useNavigation()` trong component

## 📝 Ví Dụ Cụ Thể

### ✅ Good: Component Tự Quản Lý

```typescript
// PostContent.tsx
const PostContent = ({ content, postId, onCollapse }: PostContentProps) => {
  const { colors } = useTheme(); // ✅ Tự lấy theme
  const countLines = useCallback((text) => { ... }, []); // ✅ Tự implement
  
  // Component tự quản lý styles
  const defaultTextStyle = { fontSize: 16, ... };
  
  return <View>...</View>;
};

// Usage - Đơn giản, ít props
<PostContent 
  content={item.content}
  postId={item.id}
  onCollapse={handleCollapse}
/>
```

### ❌ Bad: Phụ Thuộc Parent

```typescript
// PostContent.tsx
const PostContent = ({ content, styles, colors, countLines, ... }) => {
  // ❌ Phụ thuộc vào styles/colors từ parent
  return <View style={styles.wrapper}>...</View>;
};

// Usage - Nhiều props, phụ thuộc parent
<PostContent 
  content={item.content}
  styles={dynamicStyles}  // ❌ Phụ thuộc
  colors={colors}          // ❌ Phụ thuộc
  countLines={countLines}  // ❌ Phụ thuộc
  ...
/>
```

## 🔄 Migration Guide

### Khi Tách Component Mới

1. **Bước 1: Xác định props cần thiết**
   - Data: `content`, `item`, `id`
   - Callbacks: `onPress`, `onChange`
   - Optional: `style?`, `customFormatter?`

2. **Bước 2: Tự quản lý trong component**
   - Dùng `useTheme()` cho colors
   - Implement utility functions trong component
   - Tạo default styles trong component

3. **Bước 3: Cho phép customization**
   - Thêm optional props: `style?`, `textStyle?`
   - Cho phép override formatters nếu cần

4. **Bước 4: Update usage**
   - Xóa props không cần thiết
   - Giữ lại chỉ data và callbacks

## ✨ Kết Luận

**Nguyên tắc vàng:**
> Components nên **tự quản lý** theme, styles, và utility functions.  
> Chỉ truyền **data** và **callbacks** từ parent.

**Lợi ích:**
- ✅ Components độc lập, dễ tái sử dụng
- ✅ Ít props hơn, dễ sử dụng
- ✅ Dễ test và maintain
- ✅ Không phụ thuộc vào parent implementation

