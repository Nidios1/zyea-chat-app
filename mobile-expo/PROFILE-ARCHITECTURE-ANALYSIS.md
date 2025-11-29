# Phân tích kiến trúc Profile Screen: social-app-main vs mobile-expo

## 📋 Tóm tắt

### social-app-main (Reference Implementation)
- ✅ **Một screen duy nhất**: `ProfileScreen` trong `src/view/screens/Profile.tsx`
- ✅ **Phân biệt bằng `isMe`**: `const isMe = profile.did === currentAccount?.did`
- ✅ **Dùng chung ProfileHeader**: Component tự xác định `isMe` và hiển thị UI phù hợp
- ✅ **Điều kiện hiển thị dựa trên `isMe`**: Các tab như "Likes", "Replies" chỉ hiển thị khi `isMe = true`

### mobile-expo (Current Implementation)
- ❌ **Hai screen riêng**: `MyProfileScreen.tsx` và `OtherUserProfileScreen.tsx`
- ❌ **Code bị duplicate**: Logic tương tự được lặp lại ở 2 nơi
- ✅ **Dùng chung ProfileHeader**: Component được share giữa 2 screen

---

## 🔍 Chi tiết phân tích

### 1. social-app-main Architecture

#### File: `src/view/screens/Profile.tsx`

```typescript
function ProfileScreenInner({route}: Props) {
  const {currentAccount} = useSession()
  const name = route.params.name === 'me' ? currentAccount?.did : route.params.name
  
  // Fetch profile dựa trên name (có thể là 'me' hoặc userId)
  const {data: profile} = useProfileQuery({ did: resolvedDid })
  
  // Phân biệt profile của mình vs người khác
  const isMe = profile.did === currentAccount?.did
  
  // Điều kiện hiển thị dựa trên isMe
  const showRepliesTab = hasSession
  const showLikesTab = isMe  // Chỉ hiển thị khi là profile của mình
  const showFeedsTab = isMe || feedGenCount > 0
  const showStarterPacksTab = isMe || starterPackCount > 0
  
  return (
    <ProfileScreenLoaded
      profile={profile}
      isMe={isMe}  // Truyền isMe vào component
      // ...
    />
  )
}
```

#### File: `src/screens/Profile/Header/ProfileHeaderStandard.tsx`

```typescript
function ProfileHeaderStandard({profile, ...}: Props) {
  const {currentAccount} = useSession()
  
  // Tự xác định isMe bên trong component
  const isMe = currentAccount?.did === profile.did
  
  return (
    <>
      {/* Hiển thị nút "Edit Profile" nếu isMe */}
      {isMe ? (
        <EditProfileButton />
      ) : (
        <FollowButton />
      )}
    </>
  )
}
```

**Ưu điểm:**
- ✅ Code không bị duplicate
- ✅ Dễ maintain - chỉ cần sửa 1 nơi
- ✅ Logic nhất quán giữa "my profile" và "other profile"
- ✅ Dễ test - chỉ cần test 1 component

---

### 2. mobile-expo Architecture (Current)

#### File: `src/screens/Profile/MyProfileScreen.tsx`
```typescript
const MyProfileScreen = () => {
  const { user } = useAuth();
  // ... logic fetch posts, stats, etc.
  
  return (
    <ProfileHeader
      user={userProfile}
      isMe={true}  // Hard-coded
      onEditPress={handleEdit}
      // ...
    />
  )
}
```

#### File: `src/screens/Profile/OtherUserProfileScreen.tsx`
```typescript
const OtherUserProfileScreen = () => {
  const { user: currentUser } = useAuth();
  const userId = route.params?.userId;
  
  // ... logic fetch posts, stats, etc.
  
  return (
    <ProfileHeader
      user={userProfile}
      isMe={false}  // Hard-coded
      onFollowPress={handleFollow}
      // ...
    />
  )
}
```

**Vấn đề:**
- ❌ Code bị duplicate: Logic fetch posts, stats, filtering, etc. được lặp lại
- ❌ Khó maintain: Phải sửa ở 2 nơi khi có thay đổi
- ❌ Dễ bị lệch: Logic có thể khác nhau giữa 2 screen
- ❌ Khó test: Phải test 2 component riêng biệt

---

## 💡 Đề xuất Refactor

### Option 1: Merge thành một screen (Giống social-app-main)

Tạo `ProfileScreen.tsx` duy nhất:

```typescript
type ProfileScreenRouteProp = RouteProp<
  { Profile: { userId?: string } },  // userId = undefined nếu là "me"
  'Profile'
>;

const ProfileScreen = () => {
  const { user: currentUser } = useAuth();
  const route = useRoute<ProfileScreenRouteProp>();
  const userId = route.params?.userId;
  
  // Xác định isMe
  const isMe = !userId || currentUser?.id?.toString() === userId.toString();
  const targetUserId = isMe ? currentUser?.id : userId;
  
  // Fetch profile
  const { data: userProfile } = useQuery({
    queryKey: ['userProfile', targetUserId],
    queryFn: () => usersAPI.getProfile(targetUserId),
    enabled: !!targetUserId,
  });
  
  // Fetch posts, stats, etc. (logic chung)
  // ...
  
  return (
    <ProfileHeader
      user={userProfile}
      isMe={isMe}  // Tự động xác định
      onEditPress={isMe ? handleEdit : undefined}
      onFollowPress={!isMe ? handleFollow : undefined}
      // ...
    />
  )
}
```

**Navigation:**
```typescript
// Xem profile của mình
navigation.navigate('Profile', { userId: undefined }); // hoặc { userId: 'me' }

// Xem profile người khác
navigation.navigate('Profile', { userId: '123' });
```

**Ưu điểm:**
- ✅ Giống social-app-main (best practice)
- ✅ Code không duplicate
- ✅ Dễ maintain
- ✅ Logic nhất quán

**Nhược điểm:**
- ⚠️ Cần refactor navigation
- ⚠️ Cần test kỹ để đảm bảo không break existing features

---

### Option 2: Giữ 2 screen nhưng extract shared logic

Tạo `useProfileScreen.ts` hook:

```typescript
export function useProfileScreen(userId?: string) {
  const { user: currentUser } = useAuth();
  const isMe = !userId || currentUser?.id?.toString() === userId.toString();
  const targetUserId = isMe ? currentUser?.id : userId;
  
  // Shared logic
  const { data: userProfile } = useQuery({...});
  const { data: userPosts } = useQuery({...});
  const { data: userStats } = useQuery({...});
  
  return {
    isMe,
    userProfile,
    userPosts,
    userStats,
    // ... other shared state
  };
}
```

Sử dụng trong cả 2 screen:

```typescript
// MyProfileScreen.tsx
const MyProfileScreen = () => {
  const { user } = useAuth();
  const profileData = useProfileScreen(); // Không truyền userId = "me"
  // ...
}

// OtherUserProfileScreen.tsx
const OtherUserProfileScreen = () => {
  const userId = route.params?.userId;
  const profileData = useProfileScreen(userId);
  // ...
}
```

**Ưu điểm:**
- ✅ Giữ nguyên navigation structure
- ✅ Giảm code duplicate
- ✅ Dễ maintain hơn

**Nhược điểm:**
- ⚠️ Vẫn có 2 screen riêng (không tối ưu bằng Option 1)

---

## 🎯 Khuyến nghị

**Nên chọn Option 1** (Merge thành một screen) vì:
1. ✅ Giống với social-app-main (reference implementation)
2. ✅ Code sạch hơn, dễ maintain hơn
3. ✅ Logic nhất quán, ít bug hơn
4. ✅ Dễ test và debug

**Lộ trình thực hiện:**
1. Tạo `ProfileScreen.tsx` mới với logic merge từ 2 screen cũ
2. Update navigation để dùng screen mới
3. Test kỹ cả 2 trường hợp (my profile và other profile)
4. Xóa 2 screen cũ sau khi confirm không có issue

---

## 📝 Kết luận

**social-app-main** sử dụng **một screen duy nhất** với logic phân biệt bằng `isMe`, đây là cách tiếp cận tốt hơn vì:
- Code không duplicate
- Dễ maintain
- Logic nhất quán
- Dễ test

**mobile-expo** hiện tại có **2 screen riêng** với code bị duplicate, nên refactor để giống social-app-main.

