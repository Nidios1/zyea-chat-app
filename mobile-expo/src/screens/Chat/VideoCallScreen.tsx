import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text, useTheme, Avatar } from 'react-native-paper';
import { useNavigation, useRoute } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useCall } from '../../hooks/useVideoCall';

interface VideoCallScreenProps {
  route?: {
    params: {
      conversationId: string;
      userName: string;
      isVideo: boolean | string;
    };
  };
}

const VideoCallScreen: React.FC<VideoCallScreenProps> = () => {
  const theme = useTheme();
  const navigation = useNavigation();
  const route = useRoute();
  // Ensure isVideo is always a boolean, not a string
  const params = route.params as any;
  const isVideo = typeof params?.isVideo === 'boolean' 
    ? params.isVideo 
    : typeof params?.isVideo === 'string' 
    ? params.isVideo === 'true' || params.isVideo === '1'
    : true;

  const {
    isConnected,
    localStream,
    remoteStream,
    isAudioMuted,
    isVideoEnabled,
    startCall,
    endCall,
    toggleMute,
    toggleVideo,
    switchCamera,
  } = useCall(conversationId, isVideo);

  useEffect(() => {
    startCall();
    return () => {
      endCall();
    };
  }, [startCall, endCall]);

  const handleEndCall = () => {
    endCall();
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      {/* Remote Video View */}
      <View style={styles.remoteVideoContainer}>
        {remoteStream ? (
          <Text style={styles.videoText}>Remote Video</Text>
        ) : (
          <View style={styles.placeholder}>
            <Avatar.Text
              size={80}
              label={userName.charAt(0).toUpperCase()}
              style={{ backgroundColor: '#0084ff' }}
            />
            <Text style={styles.userName}>{userName}</Text>
            <Text style={styles.status}>
              {isConnected ? 'Đang gọi' : 'Đang kết nối...'}
            </Text>
          </View>
        )}
      </View>

      {/* Local Video View (Picture-in-Picture) */}
      {localStream && isVideo && (
        <View style={styles.localVideoContainer}>
          <Text style={styles.videoText}>You</Text>
        </View>
      )}

      {/* Controls */}
      <View style={styles.controls}>
        <TouchableOpacity
          style={[styles.controlButton, { backgroundColor: '#666' }]}
          onPress={toggleMute}
        >
          <Icon
            name={Boolean(isAudioMuted) ? 'microphone-off' : 'microphone'}
            size={Number(24)}
            color="#fff"
          />
        </TouchableOpacity>

        {isVideo && (
          <TouchableOpacity
            style={[styles.controlButton, { backgroundColor: '#666' }]}
            onPress={toggleVideo}
          >
            <Icon
              name={Boolean(isVideoEnabled) ? 'video' : 'video-off'}
              size={Number(24)}
              color="#fff"
            />
          </TouchableOpacity>
        )}

        {isVideo && (
          <TouchableOpacity
            style={[styles.controlButton, { backgroundColor: '#666' }]}
            onPress={switchCamera}
          >
            <Icon name="camera-flip" size={Number(24)} color="#fff" />
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[styles.controlButton, styles.endCallButton]}
          onPress={handleEndCall}
        >
          <Icon name="phone-hangup" size={Number(24)} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  remoteVideoContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholder: {
    alignItems: 'center',
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 16,
  },
  status: {
    fontSize: 16,
    color: '#ccc',
    marginTop: 8,
  },
  localVideoContainer: {
    position: 'absolute',
    top: 50,
    right: 16,
    width: 120,
    height: 160,
    borderRadius: 8,
    backgroundColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoText: {
    color: '#fff',
    fontSize: 12,
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingVertical: 40,
    gap: 16,
  },
  controlButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  endCallButton: {
    backgroundColor: '#f44336',
  },
});

export default VideoCallScreen;

