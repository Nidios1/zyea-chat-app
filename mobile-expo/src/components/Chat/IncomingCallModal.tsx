import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Dimensions,
  Vibration,
} from 'react-native';
import { Text, Avatar } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { ChatStackParamList } from '../../navigation/types';
import { useTheme } from '../../contexts/ThemeContext';
import { getAvatarURL } from '../../utils/imageUtils';
import useSocket from '../../hooks/useSocket';
import { usersAPI } from '../../utils/api';
import { useQuery } from '@tanstack/react-query';
import { useRingingSound } from '../../hooks/useRingingSound';

type IncomingCallNavigationProp = StackNavigationProp<ChatStackParamList>;

interface IncomingCall {
  from: string;
  conversationId: string;
  userName: string;
  userAvatarUrl?: string;
  isVideo: boolean;
  offer?: any;
}

const IncomingCallModal: React.FC = () => {
  const { isDarkMode, colors } = useTheme();
  const navigation = useNavigation<IncomingCallNavigationProp>();
  const { socket } = useSocket();
  const [incomingCall, setIncomingCall] = useState<IncomingCall | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [callerUserId, setCallerUserId] = useState<string | null>(null);
  const [callStatus, setCallStatus] = useState<'idle' | 'ringing' | 'calling' | 'connecting' | 'connected' | 'ended'>('idle');

  // Play ringing sound when incoming call is showing
  useRingingSound(isVisible && incomingCall ? 'ringing' : 'idle');

  // Fetch caller user info
  const { data: callerUser } = useQuery({
    queryKey: ['user', callerUserId],
    queryFn: async () => {
      if (!callerUserId) return null;
      const response = await usersAPI.getProfile(callerUserId);
      return response.data;
    },
    enabled: !!callerUserId,
  });

  useEffect(() => {
    if (!socket) return;

    const handleCallOffer = (data: {
      from: string;
      conversationId: string;
      isVideo: boolean;
      offer: any;
    }) => {
      console.log('📞 Incoming call:', data);
      
      // Set caller user ID to fetch user info
      setCallerUserId(data.from);
      
      // Set incoming call with basic info (will update when user data loads)
      setIncomingCall({
        from: data.from,
        conversationId: data.conversationId,
        userName: 'Người dùng', // Will be updated when user data loads
        userAvatarUrl: undefined,
        isVideo: data.isVideo,
        offer: data.offer,
      });
      
      setIsVisible(true);
      setCallStatus('ringing'); // Trigger ringing sound
    };

    socket.on('call-offer', handleCallOffer);

    return () => {
      socket.off('call-offer', handleCallOffer);
      setCallStatus('idle'); // Stop ringing sound on cleanup
    };
  }, [socket]);

  // Update incoming call when user data loads
  useEffect(() => {
    if (callerUser && incomingCall) {
      setIncomingCall({
        ...incomingCall,
        userName: callerUser.full_name || callerUser.username || 'Người dùng',
        userAvatarUrl: callerUser.avatar_url,
      });
    }
  }, [callerUser]);

  const handleAccept = () => {
    if (!incomingCall) return;
    
    setCallStatus('idle'); // Stop ringing sound
    setIsVisible(false);
    
    // Store offer in a way that VideoCallScreen can access it
    // We'll pass it via navigation params
    navigation.navigate('VideoCall', {
      conversationId: incomingCall.conversationId,
      userName: incomingCall.userName,
      otherUserId: incomingCall.from,
      isVideo: incomingCall.isVideo,
      userAvatarUrl: incomingCall.userAvatarUrl,
      isIncoming: true,
      offer: incomingCall.offer, // Pass the offer
    });
    
    setIncomingCall(null);
    setCallerUserId(null);
  };

  const handleReject = () => {
    if (!incomingCall || !socket) return;
    
    setCallStatus('idle'); // Stop ringing sound
    setIsVisible(false);
    
    // Emit reject event
    socket.emit('call-rejected', {
      to: incomingCall.from,
    });
    
    setIncomingCall(null);
    setCallerUserId(null);
  };

  if (!incomingCall || !isVisible) {
    return null;
  }

  return (
    <Modal
      visible={isVisible}
      transparent={true}
      animationType="fade"
      onRequestClose={handleReject}
    >
      <View style={styles.container}>
        <View style={[styles.content, { backgroundColor: colors.surface }]}>
          {/* Avatar */}
          <Avatar.Image
            size={100}
            source={{ uri: getAvatarURL(incomingCall.userAvatarUrl || '') }}
            style={[styles.avatar, { backgroundColor: colors.primary }]}
          />
          
          {/* User Name */}
          <Text style={[styles.userName, { color: colors.text }]} variant="headlineSmall">
            {incomingCall.userName}
          </Text>
          
          {/* Call Type */}
          <Text style={[styles.callType, { color: colors.textSecondary }]} variant="bodyMedium">
            {incomingCall.isVideo ? 'Cuộc gọi video đến' : 'Cuộc gọi thoại đến'}
          </Text>

          {/* Action Buttons */}
          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.actionButton, styles.rejectButton]}
              onPress={handleReject}
            >
              <MaterialCommunityIcons name="phone-hangup" size={32} color="#fff" />
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.actionButton, styles.acceptButton]}
              onPress={handleAccept}
            >
              <MaterialCommunityIcons 
                name={incomingCall.isVideo ? "video" : "phone"} 
                size={32} 
                color="#fff" 
              />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    width: '80%',
    maxWidth: 400,
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  avatar: {
    marginBottom: 24,
  },
  userName: {
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  callType: {
    fontSize: 16,
    marginBottom: 32,
    textAlign: 'center',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 32,
    width: '100%',
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

export default IncomingCallModal;

