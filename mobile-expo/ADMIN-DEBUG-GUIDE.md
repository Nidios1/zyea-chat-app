# Hướng Dẫn Debug - Menu Quản Lý Server

## 🔍 Vấn Đề: Không thấy nút "Quản lý Server"

### Các Bước Kiểm Tra

#### 1. Kiểm tra User có phải Admin không

Mở console/logs và tìm các dòng:
```
🔍 [isAdmin] Check: { userId, username, email, role, is_admin, isAdmin, result }
🔍 [ProfileMenu] Admin check: { userId, username, role, is_admin, isAdmin, userIsAdmin }
```

**User phải có một trong các điều kiện sau:**
- `role === 'admin'`
- `is_admin === true`
- `isAdmin === true`
- `email === 'admin@zalo.com'` (tạm thời để test)
- `username === 'admin'` (tạm thời để test)

#### 2. Kiểm tra Backend

Đảm bảo backend trả về đúng role khi login:

```javascript
// Backend response khi login phải có:
{
  id: 1,
  username: 'admin',
  email: 'admin@zalo.com',
  role: 'admin',  // ← Quan trọng
  // hoặc
  is_admin: true,  // ← Hoặc cái này
}
```

#### 3. Kiểm tra AuthContext

User object trong AuthContext phải có role:

```typescript
// Trong AuthContext, user object phải có:
user: {
  id: string;
  username: string;
  role?: 'admin' | 'user';  // ← Phải có
  is_admin?: boolean;       // ← Hoặc cái này
}
```

#### 4. Cách Set Admin Role

**Option 1: Qua Database**
```sql
UPDATE users SET role = 'admin' WHERE email = 'admin@zalo.com';
-- hoặc
UPDATE users SET is_admin = true WHERE email = 'admin@zalo.com';
```

**Option 2: Qua Backend Script**
```bash
cd zalo-clone/server
node update_admin_role.js
```

**Option 3: Tạm thời - Dùng email/username**
- Email: `admin@zalo.com`
- Username: `admin`

#### 5. Reload App

Sau khi set admin role:
1. **Logout** khỏi app
2. **Login lại** với tài khoản admin
3. Vào **Profile** → Click menu (3 chấm)
4. Nên thấy "Quản lý Server"

### Debug Steps

1. **Mở console/logs**
2. **Login với tài khoản admin**
3. **Vào Profile screen**
4. **Click menu (3 chấm)**
5. **Xem logs:**
   - `🔍 [isAdmin] Check:` - Kiểm tra user có phải admin không
   - `🔍 [ProfileMenu] Admin check:` - Kiểm tra trong ProfileMenu

### Common Issues

#### Issue 1: User object không có role
**Giải pháp:** Backend phải trả về role khi login/verify token

#### Issue 2: Role không được lưu trong AuthContext
**Giải pháp:** Kiểm tra `verifyToken` function trong AuthContext có lưu role không

#### Issue 3: Menu không hiển thị sau khi set admin
**Giải pháp:** 
- Logout và login lại
- Hoặc refresh app (shake device → Reload)

### Test với User Thường

Để test menu hiển thị, có thể tạm thời comment check admin:

```typescript
// Trong ProfileMenu.tsx, tạm thời:
...(true ? [{  // Thay userIsAdmin bằng true để test
  icon: 'shield-account' as const,
  label: 'Quản lý Server',
  onPress: handleAdmin,
  color: colors.primary,
}] : []),
```

**Lưu ý:** Nhớ revert lại sau khi test!

### Verify Admin Status

Tạo một test screen hoặc thêm vào ProfileScreen để hiển thị admin status:

```typescript
// Trong ProfileScreen, thêm:
import { isAdmin } from '../../utils/adminUtils';

// Trong component:
const userIsAdmin = isAdmin(user);
console.log('Admin status:', userIsAdmin, user);
```

### Backend Verification

Kiểm tra backend có trả về role đúng không:

```bash
# Test API
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://YOUR_API_URL/api/users/profile

# Response phải có:
{
  "id": 1,
  "username": "admin",
  "email": "admin@zalo.com",
  "role": "admin"  // ← Quan trọng
}
```

## ✅ Checklist

- [ ] User có `role = 'admin'` trong database
- [ ] Backend trả về role khi login/verify token
- [ ] AuthContext lưu role vào user object
- [ ] `isAdmin(user)` trả về `true`
- [ ] Đã logout và login lại sau khi set admin
- [ ] Console logs hiển thị đúng admin status
- [ ] Menu item "Quản lý Server" xuất hiện

## 🐛 Nếu Vẫn Không Thấy

1. **Kiểm tra console logs** - Xem `isAdmin` có trả về `true` không
2. **Kiểm tra user object** - Xem có role không
3. **Test với email/username** - Dùng `admin@zalo.com` hoặc username `admin`
4. **Reload app** - Shake device → Reload
5. **Clear cache** - Xóa app và cài lại

## 📞 Support

Nếu vẫn không hoạt động, cung cấp:
- Console logs từ `isAdmin` check
- User object từ AuthContext
- Backend response khi verify token
- Screenshot của Profile menu

