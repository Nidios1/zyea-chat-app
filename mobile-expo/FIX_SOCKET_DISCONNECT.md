# Fix Lỗi Socket Disconnect/Reconnect

## Vấn Đề

Từ log console, có một số vấn đề với socket connection:

1. **Socket disconnect ngay sau khi connect**: Socket kết nối thành công nhưng ngay sau đó bị disconnect
2. **Duplicate join events**: User join room và status update xuất hiện 2 lần
3. **"Notified 0 friends"**: Không phải lỗi, chỉ là thông tin rằng user chưa có bạn bè

## Nguyên Nhân

1. **Multiple socket instances**: Có thể có nhiều socket instances được tạo ra
2. **Duplicate join emits**: Socket reconnect hoặc component re-render có thể gây ra duplicate join events
3. **Không có tracking join state**: Client không track xem user đã join room chưa
4. **Server không check duplicate joins**: Server không kiểm tra xem user đã join room chưa

## Giải Pháp Đã Áp Dụng

### 1. Client-Side (useSocket.ts)

#### a. Thêm tracking join state
```typescript
const hasJoinedRef = useRef<boolean>(false); // Track if user has joined
```

#### b. Prevent duplicate joins
```typescript
// Only join if not already joined (prevent duplicate joins)
if (!hasJoinedRef.current && user?.id) {
  console.log(`🔌 Joining room for user ${user.id}`);
  hasJoinedRef.current = true;
  newSocket.emit('join', user.id);
} else if (hasJoinedRef.current) {
  console.log('⚠️ User already joined, skipping duplicate join');
}
```

#### c. Reset join flag on disconnect
```typescript
newSocket.on('disconnect', (reason) => {
  console.log('⚠️ Socket disconnected:', reason);
  setIsConnected(false);
  hasJoinedRef.current = false; // Reset join flag on disconnect
  // ...
});
```

#### d. Re-join after reconnection
```typescript
newSocket.on('reconnect', (attemptNumber) => {
  console.log(`✅ Socket reconnected after ${attemptNumber} attempts`);
  setIsConnected(true);
  reconnectAttemptsRef.current = 0;
  
  // Re-join room after reconnection
  if (user?.id && !hasJoinedRef.current) {
    console.log(`🔌 Re-joining room for user ${user.id} after reconnect`);
    hasJoinedRef.current = true;
    newSocket.emit('join', user.id);
  }
});
```

#### e. Prevent multiple socket instances
```typescript
// Prevent multiple socket instances
if (socketRef.current && socketRef.current.connected) {
  console.log('🔌 Socket already connected, skipping initialization');
  return;
}
```

#### f. Improved logging
- Thêm logging chi tiết cho mọi socket events
- Log disconnect reasons để debug
- Log join/rejoin events

#### g. Better cleanup
```typescript
// Cleanup
return () => {
  console.log('🔌 Cleaning up socket on unmount');
  if (reconnectTimeoutRef.current) {
    clearTimeout(reconnectTimeoutRef.current);
    reconnectTimeoutRef.current = null;
  }
  if (socketRef.current) {
    // Remove all listeners before closing
    socketRef.current.removeAllListeners();
    socketRef.current.close();
    socketRef.current = null;
  }
  setSocket(null);
  setIsConnected(false);
  hasJoinedRef.current = false;
};
```

#### h. Optimize dependencies
```typescript
}, [user?.id, token]); // Only depend on user.id and token to prevent unnecessary reconnects
```

### 2. Server-Side (index.js)

#### a. Prevent duplicate joins
```javascript
socket.on('join', async (userId) => {
  // Prevent duplicate joins from the same socket
  if (socket.userId === userId && socket.rooms.has(userId.toString())) {
    console.log(`⚠️ User ${userId} already joined room, skipping duplicate join`);
    return;
  }
  
  // Leave previous room if switching users (shouldn't happen but safety check)
  if (socket.userId && socket.userId !== userId) {
    console.log(`🔄 User switching from ${socket.userId} to ${userId}`);
    socket.leave(socket.userId.toString());
  }
  
  socket.join(userId.toString());
  socket.userId = userId;
  socket.lastActivity = Date.now();
  console.log(`✅ User ${userId} joined their room (socket: ${socket.id})`);
  // ...
});
```

#### b. Improved logging
```javascript
console.log(`📋 Found ${friends.length} friends for user ${userId}`);

if (friends.length > 0) {
  friends.forEach(friend => {
    socket.to(friend.user_id.toString()).emit('userStatusChanged', statusData);
  });
  console.log(`📤 Notified ${friends.length} friends about ${userId}'s status change to online`);
} else {
  console.log(`ℹ️ User ${userId} has no friends to notify`);
}
```

## Kết Quả

Sau khi áp dụng các fix:

1. ✅ **Không còn duplicate joins**: Client và server đều check duplicate joins
2. ✅ **Better logging**: Dễ debug hơn với logging chi tiết
3. ✅ **Stable reconnection**: Socket tự động re-join room sau khi reconnect
4. ✅ **Prevent multiple instances**: Chỉ có một socket instance tại một thời điểm
5. ✅ **Better cleanup**: Socket được cleanup đúng cách khi unmount

## Cách Kiểm Tra

1. **Mở app và xem console logs**:
   - Sẽ thấy: `🔌 Initializing socket connection...`
   - Sau đó: `✅ Socket connected: <socket-id>`
   - Sau đó: `🔌 Joining room for user <user-id>`
   - Server: `✅ User <user-id> joined their room (socket: <socket-id>)`

2. **Kiểm tra duplicate joins**:
   - Nếu có duplicate join, sẽ thấy: `⚠️ User already joined, skipping duplicate join`
   - Server: `⚠️ User <user-id> already joined room, skipping duplicate join`

3. **Kiểm tra reconnection**:
   - Khi socket reconnect, sẽ thấy: `✅ Socket reconnected after <n> attempts`
   - Sau đó: `🔌 Re-joining room for user <user-id> after reconnect`

4. **Kiểm tra disconnect reasons**:
   - Sẽ thấy log chi tiết về disconnect reason:
     - `📡 Server disconnected the socket, will attempt to reconnect`
     - `📱 Client intentionally disconnected`
     - `⏱️ Connection timeout, will attempt to reconnect`
     - `🚫 Transport closed, will attempt to reconnect`
     - `❌ Transport error, will attempt to reconnect`

## Lưu Ý

1. **"Notified 0 friends" không phải lỗi**: Đây chỉ là thông tin rằng user chưa có bạn bè. Sau khi user có bạn bè, sẽ thấy số lượng bạn bè được notify.

2. **Socket disconnect/reconnect là bình thường**: 
   - Khi app vào background, socket có thể disconnect
   - Khi app quay lại foreground, socket sẽ tự động reconnect
   - Đây là hành vi bình thường của socket.io

3. **Network issues**: Nếu socket disconnect liên tục, có thể do:
   - Network không ổn định
   - Server không accessible
   - Firewall blocking connection

## Troubleshooting

### Socket không connect
1. Kiểm tra `SOCKET_URL` trong `constants.ts`
2. Kiểm tra server có đang chạy không
3. Kiểm tra network connection
4. Kiểm tra CORS configuration trên server

### Socket disconnect liên tục
1. Kiểm tra network stability
2. Kiểm tra server logs để xem có lỗi gì không
3. Kiểm tra firewall settings
4. Kiểm tra socket.io version compatibility

### Duplicate joins vẫn xảy ra
1. Kiểm tra xem có nhiều component gọi `useSocket` không
2. Kiểm tra xem có nhiều socket instances không
3. Kiểm tra server logs để xem có duplicate join events không

## Kết Luận

Các fix đã được áp dụng để:
- ✅ Prevent duplicate joins
- ✅ Improve logging
- ✅ Better reconnection handling
- ✅ Prevent multiple socket instances
- ✅ Better cleanup

Socket connection bây giờ sẽ ổn định hơn và dễ debug hơn.

