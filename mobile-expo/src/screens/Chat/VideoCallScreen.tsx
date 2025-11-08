import React, { useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  StatusBar,
  Text as RNText,
  ActivityIndicator,
} from 'react-native';
import { Text, Avatar } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { ChatStackParamList } from '../../navigation/types';
import { useVideoCall } from '../../hooks/useVideoCall';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { getAvatarURL } from '../../utils/imageUtils';
import { useTabBar } from '../../contexts/TabBarContext';
import { useRingingSound } from '../../hooks/useRingingSound';

// Import RTCView from react-native-webrtc
let RTCView: any;
try {
  const webrtc = require('react-native-webrtc');
  RTCView = webrtc.RTCView;
} catch (error) {
  console.warn('RTCView not available. Video will not display until react-native-webrtc is properly installed.');
}

type VideoCallNavigationProp = StackNavigationProp<ChatStackParamList, 'VideoCall'>;

const { width, height } = Dimensions.get('window');

const VideoCallScreen: React.FC = () => {
  const theme = useTheme();
  const { isDarkMode, colors } = theme;
  const navigation = useNavigation<VideoCallNavigationProp>();
  const route = useRoute();
  const { user } = useAuth();
  const { setIsVisible } = useTabBar();
  
  const params = route.params as any;
  const conversationId = params?.conversationId || '';
  const userName = params?.userName || 'Người dùng';
  const otherUserId = params?.otherUserId || '';
  const isVideo = Boolean(params?.isVideo);
  const userAvatarUrl = params?.userAvatarUrl;
  const isIncoming = Boolean(params?.isIncoming);
  const incomingOffer = params?.offer;

  const {
    callStatus,
    isConnected,
    localStream,
    remoteStream,
    isAudioMuted,
    isVideoEnabled,
    callDuration,
    error,
    startCall,
    acceptCall,
    rejectCall,
    endCall,
    toggleMute,
    toggleVideo,
    switchCamera,
  } = useVideoCall({
    conversationId,
    otherUserId,
    isVideo,
    isIncoming,
  });

  // Play ringing sound when call is ringing or calling
  useRingingSound(callStatus);

  // Handle incoming call with offer
  useEffect(() => {
    if (isIncoming && incomingOffer && callStatus === 'idle') {
      acceptCall(incomingOffer);
    }
  }, [isIncoming, incomingOffer, callStatus, acceptCall]);

  // Auto-start call if outgoing
  useEffect(() => {
    if (!isIncoming && callStatus === 'idle') {
      startCall();
    }
  }, [isIncoming, callStatus, startCall]);

  // Hide tab bar when call screen is mounted
  useEffect(() => {
    setIsVisible(false);
    
    // Show tab bar when unmounting
    return () => {
      setIsVisible(true);
    };
  }, [setIsVisible]);

  // Handle back button
  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', (e) => {
      if (callStatus !== 'ended') {
        endCall();
      }
      // Show tab bar when leaving
      setIsVisible(true);
    });

    return unsubscribe;
  }, [navigation, callStatus, endCall, setIsVisible]);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleEndCall = () => {
    endCall();
    setIsVisible(true); // Show tab bar before going back
    navigation.goBack();
  };

  const handleAccept = async () => {
    // This is handled automatically by the useEffect above
    // when incomingOffer is available
    if (isIncoming && incomingOffer) {
      acceptCall(incomingOffer);
    }
  };

  const handleReject = () => {
    rejectCall();
    setIsVisible(true); // Show tab bar before going back
    navigation.goBack();
  };

  // Render call status
  const renderStatus = () => {
    switch (callStatus) {
      case 'calling':
        return 'Đang gọi...';
      case 'ringing':
        return 'Đang đổ chuông...';
      case 'connecting':
        return 'Đang kết nối...';
      case 'connected':
        return formatDuration(callDuration);
      case 'ended':
        return 'Cuộc gọi đã kết thúc';
      default:
        return 'Đang chuẩn bị...';
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: '#000' }]}>
      <StatusBar barStyle="light-content" />
      
      {/* Remote Video/Audio View */}
      <View style={styles.remoteContainer}>
        {remoteStream && isVideo && RTCView ? (
          <RTCView
            streamURL={remoteStream.toURL()}
            style={styles.videoContainer}
            objectFit="cover"
            mirror={false}
          />
        ) : remoteStream && isVideo ? (
          <View style={styles.videoContainer}>
            <RNText style={styles.videoPlaceholder}>Video từ {userName}</RNText>
            <RNText style={[styles.videoPlaceholder, { fontSize: 12, marginTop: 8 }]}>
              Đang chờ react-native-webrtc được cài đặt
            </RNText>
          </View>
        ) : (
          <View style={styles.placeholder}>
            <Avatar.Image
              size={120}
              source={{ uri: getAvatarURL(userAvatarUrl || '') }}
              style={[styles.avatar, { backgroundColor: colors.primary }]}
            />
            <Text style={[styles.userName, { color: '#fff' }]} variant="headlineMedium">
              {userName}
            </Text>
            <View style={styles.statusContainer}>
              {callStatus === 'connected' ? (
                <View style={styles.connectedIndicator}>
                  <View style={[styles.indicatorDot, { backgroundColor: '#10b981' }]} />
                  <Text style={[styles.statusText, { color: '#10b981' }]}>
                    Đang kết nối
                  </Text>
                </View>
              ) : (
                <ActivityIndicator size="small" color="#fff" />
              )}
              <Text style={[styles.statusText, { color: '#fff' }]}>
                {renderStatus()}
              </Text>
            </View>
            {error && (
              <Text style={[styles.errorText, { color: '#ef4444' }]}>
                {error}
              </Text>
            )}
          </View>
        )}
      </View>

      {/* Local Video View (Picture-in-Picture) - Only for video calls */}
      {isVideo && localStream && callStatus === 'connected' && (
        <View style={styles.localVideoContainer}>
          {RTCView ? (
            <RTCView
              streamURL={localStream.toURL()}
              style={styles.localVideoWrapper}
              objectFit="cover"
              mirror={true}
              zOrder={1}
            />
          ) : (
            <View style={styles.localVideoWrapper}>
              <RNText style={styles.localVideoPlaceholder}>Bạn</RNText>
            </View>
          )}
        </View>
      )}

      {/* Controls */}
      <View style={styles.controls}>
        {/* Mute Button */}
        <TouchableOpacity
          style={[
            styles.controlButton,
            { backgroundColor: isAudioMuted ? '#ef4444' : 'rgba(255, 255, 255, 0.2)' },
          ]}
          onPress={toggleMute}
        >
          <MaterialCommunityIcons
            name={isAudioMuted ? 'microphone-off' : 'microphone'}
            size={24}
            color="#fff"
          />
        </TouchableOpacity>

        {/* Video Toggle (only for video calls) */}
        {isVideo && (
          <TouchableOpacity
            style={[
              styles.controlButton,
              { backgroundColor: isVideoEnabled ? 'rgba(255, 255, 255, 0.2)' : '#ef4444' },
            ]}
            onPress={toggleVideo}
          >
            <MaterialCommunityIcons
              name={isVideoEnabled ? 'video' : 'video-off'}
              size={24}
              color="#fff"
            />
          </TouchableOpacity>
        )}

        {/* Switch Camera (only for video calls) */}
        {isVideo && isVideoEnabled && (
          <TouchableOpacity
            style={[styles.controlButton, { backgroundColor: 'rgba(255, 255, 255, 0.2)' }]}
            onPress={switchCamera}
          >
            <MaterialCommunityIcons name="camera-flip" size={24} color="#fff" />
          </TouchableOpacity>
        )}

        {/* End Call Button */}
        <TouchableOpacity
          style={[styles.controlButton, styles.endCallButton]}
          onPress={handleEndCall}
        >
          <MaterialCommunityIcons name="phone-hangup" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Incoming Call Actions (if incoming) */}
      {isIncoming && callStatus === 'ringing' && (
        <View style={styles.incomingCallActions}>
          <TouchableOpacity
            style={[styles.actionButton, styles.rejectButton]}
            onPress={handleReject}
          >
            <MaterialCommunityIcons name="phone-hangup" size={28} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.acceptButton]}
            onPress={handleAccept}
          >
            <MaterialCommunityIcons name="phone" size={28} color="#fff" />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  remoteContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoContainer: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  videoPlaceholder: {
    color: '#fff',
    fontSize: 16,
  },
  placeholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatar: {
    marginBottom: 24,
  },
  userName: {
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 16,
    color: '#fff',
  },
  statusContainer: {
    alignItems: 'center',
    marginTop: 8,
  },
  connectedIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  indicatorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  statusText: {
    fontSize: 16,
    color: '#fff',
  },
  errorText: {
    fontSize: 14,
    marginTop: 16,
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  localVideoContainer: {
    position: 'absolute',
    top: 60,
    right: 16,
    width: 120,
    height: 160,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#333',
    borderWidth: 2,
    borderColor: '#fff',
  },
  localVideoWrapper: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  localVideoPlaceholder: {
    color: '#fff',
    fontSize: 12,
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
    gap: 16,
  },
  controlButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  endCallButton: {
    backgroundColor: '#ef4444',
  },
  incomingCallActions: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 60,
    gap: 40,
  },
  actionButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rejectButton: {
    backgroundColor: '#ef4444',
  },
  acceptButton: {
    backgroundColor: '#10b981',
  },
});

export default VideoCallScreen;
