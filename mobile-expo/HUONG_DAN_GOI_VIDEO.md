# Hướng Dẫn Tính Năng Gọi Điện và Video Call

## Tổng Quan

Đã thêm tính năng gọi điện thoại (audio call) và gọi video (video call) vào ứng dụng mobile, tương tự như Facebook Messenger. Tính năng này sử dụng WebRTC để truyền tải âm thanh và video trong thời gian thực.

## Các Tính Năng Đã Triển Khai

### 1. Gọi Điện Thoại (Audio Call)
- Nút gọi điện trong màn hình chat
- Giao diện cuộc gọi với avatar, tên người dùng
- Hiển thị thời gian cuộc gọi
- Bật/tắt micro
- Kết thúc cuộc gọi

### 2. Gọi Video (Video Call)
- Nút gọi video trong màn hình chat
- Giao diện cuộc gọi video với video từ xa và video local (picture-in-picture)
- Bật/tắt camera
- Chuyển đổi camera trước/sau
- Bật/tắt micro
- Hiển thị thời gian cuộc gọi
- Kết thúc cuộc gọi

### 3. Cuộc Gọi Đến (Incoming Call)
- Modal hiển thị khi có cuộc gọi đến
- Rung điện thoại để thông báo
- Hiển thị thông tin người gọi (avatar, tên)
- Nút chấp nhận/từ chối cuộc gọi
- Tự động lấy thông tin người gọi từ API

### 4. Socket.IO Signaling
- Kết nối WebRTC thông qua Socket.IO
- Xử lý call offer, answer, ICE candidates
- Xử lý kết thúc cuộc gọi
- Xử lý từ chối cuộc gọi

## Cài Đặt

### Bước 1: Cài Đặt react-native-webrtc

Tính năng này yêu cầu `react-native-webrtc` để hoạt động. Vì đây là native module, bạn cần:

1. **Cài đặt package:**
```bash
npm install react-native-webrtc
# hoặc
yarn add react-native-webrtc
```

2. **Cài đặt iOS dependencies:**
```bash
cd ios
pod install
cd ..
```

3. **Rebuild ứng dụng:**
Vì đây là native module, bạn cần rebuild ứng dụng:
```bash
# Development build
npx expo run:ios

# Hoặc build với EAS
eas build --profile development --platform ios
```

### Bước 2: Cập Nhật useVideoCall Hook

Sau khi cài đặt `react-native-webrtc`, cần cập nhật file `src/hooks/useVideoCall.ts`:

1. Thêm import:
```typescript
import {
  mediaDevices,
  RTCPeerConnection,
  RTCSessionDescription,
  RTCIceCandidate,
  MediaStream,
} from 'react-native-webrtc';
```

2. Cập nhật hàm `getMediaStream`:
```typescript
const getMediaStream = useCallback(async (): Promise<MediaStream | null> => {
  try {
    const stream = await mediaDevices.getUserMedia({
      audio: true,
      video: isVideo,
    });
    return stream;
  } catch (err: any) {
    console.error('Error getting media stream:', err);
    setError(err.message || 'Không thể truy cập camera/microphone');
    return null;
  }
}, [isVideo]);
```

3. Cập nhật hàm `setupPeerConnection`:
```typescript
const setupPeerConnection = useCallback((stream: MediaStream) => {
  try {
    peerConnectionRef.current = new RTCPeerConnection(iceServers);
    
    // Add local stream tracks
    stream.getTracks().forEach((track: any) => {
      if (peerConnectionRef.current && track) {
        peerConnectionRef.current.addTrack(track, stream);
      }
    });

    // ... rest of the code
  } catch (err: any) {
    console.error('Error setting up peer connection:', err);
    setError(err.message || 'Lỗi thiết lập kết nối');
  }
}, [socket, otherUserId, user?.id, callStatus]);
```

### Bước 3: Cập Nhật VideoCallScreen

Cập nhật file `src/screens/Chat/VideoCallScreen.tsx` để hiển thị video:

1. Thêm import:
```typescript
import { RTCView } from 'react-native-webrtc';
```

2. Cập nhật phần render video:
```typescript
{remoteStream && isVideo ? (
  <RTCView
    streamURL={remoteStream.toURL()}
    style={styles.videoContainer}
    objectFit="cover"
  />
) : (
  // ... placeholder
)}

{isVideo && localStream && callStatus === 'connected' && (
  <View style={styles.localVideoContainer}>
    <RTCView
      streamURL={localStream.toURL()}
      style={styles.localVideoWrapper}
      objectFit="cover"
      zOrder={1}
      mirror={true}
    />
  </View>
)}
```

## Cấu Hình Permissions

Đã thêm các permissions cần thiết vào `app.json`:
- `NSMicrophoneUsageDescription`: Quyền microphone
- `NSCameraUsageDescription`: Quyền camera (đã có sẵn, đã cập nhật mô tả)

## Cấu Trúc Code

### Files Đã Tạo/Cập Nhật:

1. **src/hooks/useVideoCall.ts**
   - Hook quản lý WebRTC connection
   - Xử lý signaling qua Socket.IO
   - Quản lý media streams
   - Xử lý các sự kiện cuộc gọi

2. **src/screens/Chat/VideoCallScreen.tsx**
   - Màn hình cuộc gọi
   - UI cho audio và video call
   - Controls (mute, video toggle, switch camera, end call)

3. **src/components/Chat/IncomingCallModal.tsx**
   - Modal hiển thị cuộc gọi đến
   - Xử lý accept/reject incoming call
   - Fetch thông tin người gọi

4. **src/navigation/types.ts**
   - Thêm type cho VideoCall screen

5. **src/navigation/MainNavigator.tsx**
   - Thêm VideoCall screen vào navigation

6. **src/screens/Chat/ChatDetailScreen.tsx**
   - Kết nối nút gọi điện và video
   - Navigate to VideoCall screen

7. **App.tsx**
   - Thêm IncomingCallModal component

8. **app.json**
   - Thêm microphone permission

## Cách Sử Dụng

### Gọi Điện/Video:
1. Mở cuộc trò chuyện với người dùng
2. Nhấn nút điện thoại (gọi audio) hoặc nút video (gọi video)
3. Chờ người nhận trả lời
4. Khi kết nối, bạn có thể:
   - Bật/tắt micro
   - Bật/tắt camera (video call)
   - Chuyển camera (video call)
   - Kết thúc cuộc gọi

### Nhận Cuộc Gọi:
1. Khi có cuộc gọi đến, modal sẽ hiển thị
2. Điện thoại sẽ rung
3. Nhấn nút chấp nhận (màu xanh) hoặc từ chối (màu đỏ)
4. Nếu chấp nhận, màn hình cuộc gọi sẽ hiển thị

## Lưu Ý

1. **WebRTC yêu cầu native modules**: Cần rebuild ứng dụng sau khi cài đặt
2. **Permissions**: Đảm bảo ứng dụng có quyền truy cập microphone và camera
3. **Network**: WebRTC hoạt động tốt nhất trên mạng ổn định (WiFi hoặc 4G/5G)
4. **STUN servers**: Đang sử dụng Google STUN servers miễn phí. Để production, nên sử dụng TURN servers cho NAT traversal tốt hơn
5. **Server signaling**: Server đã hỗ trợ WebRTC signaling qua Socket.IO (call-offer, call-answer, ice-candidate, end-call, call-rejected)

## Troubleshooting

### Lỗi "Cannot find module 'react-native-webrtc'"
- Đảm bảo đã cài đặt package: `npm install react-native-webrtc`
- Rebuild ứng dụng: `npx expo run:ios`

### Lỗi "Permission denied"
- Kiểm tra permissions trong Settings > Privacy
- Đảm bảo đã thêm permissions vào `app.json`

### Không nghe thấy âm thanh
- Kiểm tra volume thiết bị
- Kiểm tra micro có bị tắt không
- Kiểm tra kết nối mạng

### Video không hiển thị
- Đảm bảo đã cập nhật VideoCallScreen để sử dụng RTCView
- Kiểm tra camera permissions
- Kiểm tra kết nối mạng

## Tương Lai

- [ ] Thêm TURN servers cho NAT traversal tốt hơn
- [ ] Thêm call history
- [ ] Thêm call recording (nếu cần)
- [ ] Thêm group video call
- [ ] Tối ưu hóa chất lượng video/audio dựa trên bandwidth
- [ ] Thêm screen sharing (nếu cần)

## Tài Liệu Tham Khảo

- [react-native-webrtc Documentation](https://github.com/react-native-webrtc/react-native-webrtc)
- [WebRTC API](https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API)
- [Socket.IO Documentation](https://socket.io/docs/)

