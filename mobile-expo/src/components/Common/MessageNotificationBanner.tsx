import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Image } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { useNavigation } from '@react-navigation/native';

interface MessageNotificationBannerProps {
  visible: boolean;
  message: {
    senderName: string;
    senderAvatar?: string;
    content: string;
    conversationId?: string | number;
    senderId?: string | number;
  } | null;
  onPress: () => void;
  onDismiss: () => void;
}

const MessageNotificationBanner: React.FC<MessageNotificationBannerProps> = ({
  visible,
  message,
  onPress,
  onDismiss,
}) => {
  const { colors } = useTheme();
  const slideAnim = useRef(new Animated.Value(-100)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const autoHideTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (visible && message) {
      // Clear any existing timer
      if (autoHideTimerRef.current) {
        clearTimeout(autoHideTimerRef.current);
      }

      // Slide down animation
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();

      // Auto hide after 5 seconds
      autoHideTimerRef.current = setTimeout(() => {
        handleDismiss();
      }, 5000);
    } else {
      handleDismiss();
    }

    return () => {
      if (autoHideTimerRef.current) {
        clearTimeout(autoHideTimerRef.current);
      }
    };
  }, [visible, message]);

  const handleDismiss = () => {
    if (autoHideTimerRef.current) {
      clearTimeout(autoHideTimerRef.current);
      autoHideTimerRef.current = null;
    }

    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: -100,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onDismiss();
    });
  };

  if (!visible || !message) return null;

  const dynamicStyles = createStyles(colors);

  return (
    <Animated.View
      style={[
        dynamicStyles.container,
        {
          transform: [{ translateY: slideAnim }],
          opacity: opacityAnim,
        },
      ]}
    >
      <TouchableOpacity
        style={dynamicStyles.content}
        activeOpacity={0.9}
        onPress={() => {
          handleDismiss();
          onPress();
        }}
      >
        {/* Avatar */}
        <View style={dynamicStyles.avatarContainer}>
          {message.senderAvatar ? (
            <Image
              source={{ uri: message.senderAvatar }}
              style={dynamicStyles.avatar}
            />
          ) : (
            <View style={[dynamicStyles.avatar, dynamicStyles.avatarPlaceholder]}>
              <MaterialCommunityIcons
                name="account"
                size={24}
                color={colors.textSecondary}
              />
            </View>
          )}
        </View>

        {/* Message Info */}
        <View style={dynamicStyles.messageInfo}>
          <Text style={dynamicStyles.senderName} numberOfLines={1}>
            {message.senderName}
          </Text>
          <Text style={dynamicStyles.messageContent} numberOfLines={1}>
            {message.content}
          </Text>
        </View>

        {/* Close Button */}
        <TouchableOpacity
          style={dynamicStyles.closeButton}
          onPress={handleDismiss}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <MaterialCommunityIcons
            name="close"
            size={20}
            color={colors.textSecondary}
          />
        </TouchableOpacity>
      </TouchableOpacity>
    </Animated.View>
  );
};

const createStyles = (colors: any) => StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10000,
    paddingTop: 50, // Safe area for status bar
    paddingHorizontal: 12,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface || colors.background,
    borderRadius: 12,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    borderWidth: 1,
    borderColor: colors.border || 'rgba(255, 255, 255, 0.1)',
  },
  avatarContainer: {
    marginRight: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  avatarPlaceholder: {
    backgroundColor: colors.border || '#333',
    justifyContent: 'center',
    alignItems: 'center',
  },
  messageInfo: {
    flex: 1,
    marginRight: 8,
  },
  senderName: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  messageContent: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  closeButton: {
    padding: 4,
  },
});

export default MessageNotificationBanner;

