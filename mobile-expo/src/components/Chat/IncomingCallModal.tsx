import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Image } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import useSocket from '../../hooks/useSocket';
import { useAuth } from '../../contexts/AuthContext';

interface IncomingCallData {
  from: string;
  isVideo: boolean;
  conversationId?: string;
  callerInfo?: {
    id: string;
    full_name?: string;
    username?: string;
    avatar?: string;
  };
}

const IncomingCallModal: React.FC = () => {
  const { colors, isDarkMode } = useTheme();
  const { user } = useAuth();
  const { socket, isConnected } = useSocket();
  const [incomingCall, setIncomingCall] = useState<IncomingCallData | null>(null);
  const [callerInfo, setCallerInfo] = useState<any>(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (!socket || !isConnected) {
      return;
    }

    const handleIncomingCall = (data: IncomingCallData) => {
      // Only update state if component is still mounted
      if (!isMountedRef.current) {
        return;
      }
      console.log('📞 Incoming call:', data);
      setIncomingCall(data);
      
      // If caller info is provided, use it
      if (data.callerInfo) {
        setCallerInfo(data.callerInfo);
      }
    };

    socket.on('call-offer', handleIncomingCall);

    return () => {
      socket.off('call-offer', handleIncomingCall);
    };
  }, [socket, isConnected]);

  const handleAccept = () => {
    if (!incomingCall || !socket || !isMountedRef.current) return;
    
    console.log('✅ Accepting call');
    socket.emit('call-answer', {
      to: incomingCall.from,
      accepted: true,
      conversationId: incomingCall.conversationId,
    });
    
    // TODO: Navigate to call screen or handle call acceptance
    // For now, just close the modal
    if (isMountedRef.current) {
      setIncomingCall(null);
      setCallerInfo(null);
    }
  };

  const handleReject = () => {
    if (!incomingCall || !socket || !isMountedRef.current) return;
    
    console.log('❌ Rejecting call');
    socket.emit('call-answer', {
      to: incomingCall.from,
      accepted: false,
      conversationId: incomingCall.conversationId,
    });
    
    if (isMountedRef.current) {
      setIncomingCall(null);
      setCallerInfo(null);
    }
  };

  const handleDismiss = () => {
    if (!isMountedRef.current) return;
    
    if (incomingCall && socket) {
      // Auto-reject if dismissed
      socket.emit('call-answer', {
        to: incomingCall.from,
        accepted: false,
        conversationId: incomingCall.conversationId,
      });
    }
    if (isMountedRef.current) {
      setIncomingCall(null);
      setCallerInfo(null);
    }
  };

  if (!incomingCall) {
    return null;
  }

  const callerName = callerInfo?.full_name || callerInfo?.username || 'Người gọi';
  const callerAvatar = callerInfo?.avatar || null;
  const isVideoCall = incomingCall.isVideo;

  return (
    <Modal
      visible={!!incomingCall}
      transparent
      animationType="fade"
      onRequestClose={handleDismiss}
    >
      <View style={[styles.overlay, { backgroundColor: 'rgba(0, 0, 0, 0.8)' }]}>
        <View style={[styles.container, { backgroundColor: colors.background }]}>
          {/* Avatar */}
          <View style={styles.avatarContainer}>
            {callerAvatar ? (
              <Image
                source={{ uri: callerAvatar }}
                style={styles.avatar}
                defaultSource={require('../../../assets/Zyea.png')}
              />
            ) : (
              <View style={[styles.avatarPlaceholder, { backgroundColor: colors.primary }]}>
                <Text style={[styles.avatarText, { color: '#fff' }]}>
                  {callerName.charAt(0).toUpperCase()}
                </Text>
              </View>
            )}
          </View>

          {/* Caller Name */}
          <Text style={[styles.callerName, { color: colors.text }]}>
            {callerName}
          </Text>

          {/* Call Type */}
          <Text style={[styles.callType, { color: colors.textSecondary }]}>
            {isVideoCall ? 'Cuộc gọi video đến...' : 'Cuộc gọi thoại đến...'}
          </Text>

          {/* Action Buttons */}
          <View style={styles.buttonContainer}>
            {/* Reject Button */}
            <TouchableOpacity
              style={[styles.button, styles.rejectButton]}
              onPress={handleReject}
            >
              <Text style={styles.rejectButtonText}>✕</Text>
            </TouchableOpacity>

            {/* Accept Button */}
            <TouchableOpacity
              style={[styles.button, styles.acceptButton, { backgroundColor: colors.primary }]}
              onPress={handleAccept}
            >
              <Text style={styles.acceptButtonText}>📞</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    width: '85%',
    maxWidth: 400,
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  avatarContainer: {
    marginBottom: 20,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: '#fff',
  },
  avatarPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#fff',
  },
  avatarText: {
    fontSize: 48,
    fontWeight: 'bold',
  },
  callerName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  callType: {
    fontSize: 16,
    marginBottom: 30,
    textAlign: 'center',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    paddingHorizontal: 20,
  },
  button: {
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  rejectButton: {
    backgroundColor: '#ff4444',
  },
  rejectButtonText: {
    fontSize: 32,
    color: '#fff',
    fontWeight: 'bold',
  },
  acceptButton: {
    backgroundColor: '#4CAF50',
  },
  acceptButtonText: {
    fontSize: 32,
    color: '#fff',
  },
});

export default IncomingCallModal;

