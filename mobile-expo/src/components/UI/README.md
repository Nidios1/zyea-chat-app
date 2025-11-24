# Shared UI Components

Thư viện các UI components được tái sử dụng trong toàn bộ app.

## 📦 Components

### 1. Button

Button component với nhiều variants và sizes.

#### Props

| Prop | Type | Default | Mô tả |
|------|------|---------|-------|
| `title` | `string` | **required** | Text hiển thị trên button |
| `onPress` | `() => void` | **required** | Handler khi press |
| `variant` | `'primary' \| 'secondary' \| 'outline' \| 'ghost' \| 'danger'` | `'primary'` | Style variant |
| `size` | `'small' \| 'medium' \| 'large'` | `'medium'` | Kích thước button |
| `loading` | `boolean` | `false` | Hiển thị loading indicator |
| `disabled` | `boolean` | `false` | Disable button |
| `fullWidth` | `boolean` | `false` | Button full width |
| `icon` | `React.ReactNode` | `undefined` | Icon hiển thị trước text |
| `style` | `ViewStyle` | `undefined` | Custom container style |
| `textStyle` | `TextStyle` | `undefined` | Custom text style |

#### Ví dụ

```typescript
import { Button } from '../../components/UI';

// Primary button
<Button 
  title="Đăng nhập" 
  onPress={handleLogin}
/>

// Secondary button
<Button 
  title="Hủy" 
  onPress={handleCancel}
  variant="secondary"
/>

// Outline button
<Button 
  title="Xem thêm" 
  onPress={handleViewMore}
  variant="outline"
/>

// Button với loading
<Button 
  title="Đang tải..." 
  onPress={handleSubmit}
  loading={isLoading}
/>

// Button với icon
<Button 
  title="Thêm bạn" 
  onPress={handleAddFriend}
  icon={<MaterialCommunityIcons name="account-plus" size={20} />}
/>

// Small button
<Button 
  title="Xóa" 
  onPress={handleDelete}
  variant="danger"
  size="small"
/>

// Full width button
<Button 
  title="Xác nhận" 
  onPress={handleConfirm}
  fullWidth
/>
```

---

### 2. Card

Card component với consistent styling.

#### Props

| Prop | Type | Default | Mô tả |
|------|------|---------|-------|
| `children` | `React.ReactNode` | **required** | Card content |
| `onPress` | `() => void` | `undefined` | Optional - Nếu có, card sẽ pressable |
| `style` | `ViewStyle` | `undefined` | Custom container style |
| `padding` | `number` | `16` | Card padding |
| `margin` | `number` | `0` | Card margin |
| `elevation` | `number` | `1` | Shadow elevation |
| `borderRadius` | `number` | `12` | Border radius |

#### Ví dụ

```typescript
import { Card } from '../../components/UI';

// Basic card
<Card>
  <Text>Card content</Text>
</Card>

// Pressable card
<Card onPress={handleCardPress}>
  <Text>Pressable card</Text>
</Card>

// Card với custom padding
<Card padding={20}>
  <Text>Card with more padding</Text>
</Card>

// Card với custom style
<Card 
  style={{ marginBottom: 16 }}
  borderRadius={16}
>
  <Text>Custom styled card</Text>
</Card>
```

---

### 3. Input

Input component với label và error support.

#### Props

| Prop | Type | Default | Mô tả |
|------|------|---------|-------|
| `value` | `string` | **required** | Input value |
| `onChangeText` | `(text: string) => void` | **required** | Text change handler |
| `placeholder` | `string` | `undefined` | Placeholder text |
| `label` | `string` | `undefined` | Label above input |
| `error` | `string` | `undefined` | Error message |
| `secureTextEntry` | `boolean` | `false` | Password input |
| `multiline` | `boolean` | `false` | Multiline input |
| `numberOfLines` | `number` | `1` | Number of lines |
| `disabled` | `boolean` | `false` | Disable input |
| `style` | `ViewStyle` | `undefined` | Custom container style |
| `inputStyle` | `TextStyle` | `undefined` | Custom input style |
| `autoCapitalize` | `'none' \| 'sentences' \| 'words' \| 'characters'` | `'sentences'` | Auto capitalize |
| `keyboardType` | `'default' \| 'email-address' \| 'numeric' \| 'phone-pad'` | `'default'` | Keyboard type |
| `returnKeyType` | `'done' \| 'go' \| 'next' \| 'search' \| 'send'` | `'done'` | Return key type |

#### Ví dụ

```typescript
import { Input } from '../../components/UI';

// Basic input
<Input 
  value={email}
  onChangeText={setEmail}
  placeholder="Nhập email"
/>

// Input với label
<Input 
  value={password}
  onChangeText={setPassword}
  placeholder="Nhập mật khẩu"
  label="Mật khẩu"
  secureTextEntry
/>

// Input với error
<Input 
  value={username}
  onChangeText={setUsername}
  placeholder="Tên người dùng"
  label="Tên người dùng"
  error={usernameError}
/>

// Email input
<Input 
  value={email}
  onChangeText={setEmail}
  placeholder="email@example.com"
  label="Email"
  keyboardType="email-address"
  autoCapitalize="none"
/>

// Multiline input
<Input 
  value={description}
  onChangeText={setDescription}
  placeholder="Nhập mô tả..."
  label="Mô tả"
  multiline
  numberOfLines={4}
/>
```

---

## 🎨 Variants

### Button Variants

- **primary**: Button chính (màu primary)
- **secondary**: Button phụ (màu secondary)
- **outline**: Button với border, không background
- **ghost**: Button transparent, chỉ text
- **danger**: Button màu đỏ (cho actions nguy hiểm)

### Button Sizes

- **small**: 32px height, 13px font
- **medium**: 40px height, 15px font (default)
- **large**: 48px height, 16px font

---

## 💡 Best Practices

### ✅ Nên làm

1. **Sử dụng shared components**
   ```typescript
   // ✅ Good
   <Button title="Submit" onPress={handleSubmit} />
   
   // ❌ Bad
   <TouchableOpacity style={customButtonStyle}>
     <Text>Submit</Text>
   </TouchableOpacity>
   ```

2. **Sử dụng variants đúng mục đích**
   ```typescript
   // ✅ Good
   <Button title="Xóa" variant="danger" />
   <Button title="Hủy" variant="secondary" />
   
   // ❌ Bad
   <Button title="Xóa" style={{ backgroundColor: 'red' }} />
   ```

3. **Customize khi cần**
   ```typescript
   // ✅ Good - Override style khi cần
   <Button 
     title="Custom" 
     onPress={handlePress}
     style={{ marginTop: 20 }}
   />
   ```

### ❌ Không nên làm

1. **Tạo button mới thay vì dùng shared component**
2. **Hardcode colors thay vì dùng variants**
3. **Truyền quá nhiều custom styles**

---

## 🔄 Migration

### Thay thế TouchableOpacity bằng Button

**Trước:**
```typescript
<TouchableOpacity
  style={{
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: colors.primary,
  }}
  onPress={handlePress}
>
  <Text style={{ color: '#fff', fontSize: 14, fontWeight: '600' }}>
    Submit
  </Text>
</TouchableOpacity>
```

**Sau:**
```typescript
<Button 
  title="Submit" 
  onPress={handlePress}
  variant="primary"
/>
```

---

## 📝 Notes

- Tất cả components tự động sử dụng theme từ `ThemeContext`
- Components hỗ trợ dark mode tự động
- Có thể override styles nếu cần customize
- Tất cả components đều có TypeScript types

