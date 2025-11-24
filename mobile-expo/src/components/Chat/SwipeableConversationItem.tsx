import React, { useRef, forwardRef, useImperativeHandle, useCallback, useState, useEffect } from 'react';
import { View, StyleSheet, Image, Animated } from 'react-native';
import { Text, Avatar } from 'react-native-paper';
import { Swipeable, TouchableOpacity } from 'react-native-gesture-handler';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { getAvatarURL, getInitials, getAvatarColor } from '../../utils/imageUtils';
import { useTheme as useAppTheme } from '../../contexts/ThemeContext';
import { useQuery } from '@tanstack/react-query';
import { chatAPI } from '../../utils/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Helper function to format message content for chat list display
// Detects sticker messages and formats them appropriately
const formatMessageForList = (content: string | null | undefined | any, messageType?: string, isFromMe?: boolean): string => {
  // Handle null, undefined, or empty content
  if (!content) return 'Chưa có tin nhắn';
  
  // If content is an object, try to extract the actual content string
  if (typeof content === 'object' && content !== null) {
    // If it's an object with a 'content' property (like last_message object)
    if (content.content && typeof content.content === 'string') {
      content = content.content;
    } else {
      // If it's an object without content property, return default message
      return 'Chưa có tin nhắn';
    }
  }
  
  // Ensure content is a string
  if (typeof content !== 'string') {
    content = String(content);
  }
  
  // Check if message type is sticker
  if (messageType === 'sticker') {
    return isFromMe ? 'Đã gửi 1 sticker' : 'Bạn đã nhận sticker';
  }
  
  // Try to parse as JSON to detect sticker data
  try {
    const parsed = JSON.parse(content);
    // Check if it looks like sticker data (has packId and stickerIndex)
    if (parsed && (parsed.packId || parsed.packid || parsed.pack_id) && 
        (parsed.stickerIndex !== undefined || parsed.stickerindex !== undefined || parsed.sticker_index !== undefined)) {
      return isFromMe ? 'Đã gửi 1 sticker' : 'Bạn đã nhận sticker';
    }
  } catch (e) {
    // Not JSON, continue with normal content
  }
  
  // Check for common image/video indicators
  if (content.includes('📷') || content.includes('🎥')) {
    // Already has emoji, return as is
    return content;
  }
  
  // Return original content
  return content;
};

// Component để hiển thị avatar với fallback - giống MessageBubble
const CompositeAvatarImage: React.FC<{
  avatarUrl: string | null | undefined;
  displayName: string;
  avatarColor?: string;
  size: number;
}> = ({ avatarUrl, displayName, avatarColor, size }) => {
  const [imageError, setImageError] = useState(false);
  const computedColor = avatarColor || getAvatarColor(displayName);
  
  // Convert avatar URL to full URL
  const fullAvatarUrl = React.useMemo(() => {
    if (!avatarUrl || avatarUrl.trim() === '' || avatarUrl === 'null' || avatarUrl === 'undefined') {
      return '';
    }
    return getAvatarURL(avatarUrl);
  }, [avatarUrl]);

  // Reset error state when avatarUrl changes
  React.useEffect(() => {
    setImageError(false);
  }, [avatarUrl]);

  // Nếu lỗi hoặc không có URL, hiển thị placeholder với initials
  if (imageError || !fullAvatarUrl || fullAvatarUrl === '') {
    return (
      <View style={[
        styles.compositeAvatarImage,
        { 
          backgroundColor: computedColor,
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: size / 2,
          borderWidth: 0,
        }
      ]}>
        <Text style={styles.compositeAvatarText}>
          {getInitials(displayName)}
        </Text>
      </View>
    );
  }

  // Hiển thị Image ngay lập tức
  return (
    <Image
      source={{ uri: fullAvatarUrl }}
      style={[
        styles.compositeAvatarImage,
        { 
          width: size,
          height: size,
          borderRadius: size / 2,
        }
      ]}
      resizeMode="cover"
      onError={(e) => {
        console.log(`[Composite Avatar] Error loading avatar for ${displayName}:`, {
          originalUrl: avatarUrl,
          fullUrl: fullAvatarUrl,
          error: e.nativeEvent?.error || 'Unknown error'
        });
        setImageError(true);
      }}
      onLoad={() => {
        console.log(`[Composite Avatar] Successfully loaded avatar for ${displayName}:`, fullAvatarUrl);
      }}
    />
  );
};

interface SwipeableConversationItemProps {
  conversation: {
    id: string;
    username: string;
    full_name: string;
    avatar_url?: string;
    last_message?: string;
    last_message_time?: string;
    last_message_sender_id?: string | number; // ID of the sender of the last message
    other_user_id?: string | number; // ID of the other user in the conversation
    last_seen?: string | null; // For "Hoạt động X trước" when offline
    lastSeen?: string | null; // Alias for consistency
    unread_count?: number;
    status?: 'online' | 'offline';
    pinned?: boolean;
    is_pinned?: boolean; // Support both formats
    is_muted?: boolean;
    type?: 'private' | 'group' | 'system'; // Conversation type
    participants_count?: number; // Number of participants for group chat
    is_system_notification?: boolean; // Flag for system notifications
  };
  currentUserId?: string | number; // Current user ID to check if last message is from them
  isTyping?: boolean; // Whether the other user is currently typing
  onPress: () => void;
  onMute?: (conversationId: string) => void;
  onDelete?: (conversationId: string) => void;
  onUnread?: (conversationId: string) => void;
  onPin?: (conversationId: string) => void;
  formatMessageTime?: (dateString: string | null | undefined) => string;
  formatRecentTime?: (dateString: string | null | undefined) => string | null;
  onSwipeableWillOpen?: () => void;
  onSwipeableClose?: () => void;
}

const SwipeableConversationItem = forwardRef<any, SwipeableConversationItemProps>(({
  conversation,
  onPress,
  onMute,
  onDelete,
  onUnread,
  onPin,
  formatMessageTime,
  formatRecentTime,
  onSwipeableWillOpen,
  onSwipeableClose,
  currentUserId,
  isTyping = false,
}, ref) => {
  const { isDarkMode, colors } = useAppTheme();
  const swipeableRef = useRef<Swipeable>(null);
  const hasUnread = (conversation.unread_count || 0) > 0;
  const [isOpen, setIsOpen] = React.useState(false);
  const [activityStatusEnabled, setActivityStatusEnabled] = useState(true);
  const isGroupChat = conversation.type === 'group';
  const isSystemNotification = conversation.type === 'system' || conversation.is_system_notification === true;
  // Check if conversation is pinned (support both pinned and is_pinned)
  const isPinned = conversation.pinned || conversation.is_pinned || false;

  // Load activity status setting
  useEffect(() => {
    const loadActivityStatus = async () => {
      try {
        const saved = await AsyncStorage.getItem('activityStatusEnabled');
        if (saved !== null) {
          setActivityStatusEnabled(saved === 'true');
        }
      } catch (error) {
        console.error('Error loading activity status:', error);
      }
    };
    loadActivityStatus();
    
    // Listen for changes
    const interval = setInterval(loadActivityStatus, 1000);
    return () => clearInterval(interval);
  }, []);
  
  // Fetch participants for group chat to get top 3 avatars
  const { data: participants = [], isLoading: isLoadingParticipants } = useQuery({
    queryKey: ['participants', conversation.id],
    queryFn: async () => {
      if (!isGroupChat || !conversation.id) return [];
      try {
        const res = await chatAPI.getParticipants(String(conversation.id));
        const data = Array.isArray(res.data) ? res.data : [];
        console.log(`[Group Avatar] ✅ Fetched ${data.length} participants for conversation ${conversation.id}:`, data.map((p: any) => ({ 
          id: p.id, 
          name: p.full_name || p.username,
          avatar_url: p.avatar_url || 'NO AVATAR',
          is_creator: p.is_creator || false,
          avatar_url_full: p.avatar_url ? getAvatarURL(p.avatar_url) : 'none',
          hasAvatar: !!(p.avatar_url && p.avatar_url !== 'null' && p.avatar_url !== 'undefined' && p.avatar_url.trim() !== '')
        })));
        return data;
      } catch (error) {
        console.error('❌ Error fetching participants:', error);
        return [];
      }
    },
    enabled: isGroupChat && !!conversation.id,
    staleTime: 30000, // Cache for 30 seconds (reduced from 60s)
    gcTime: 60000, // Keep in cache for 1 minute (React Query v5)
    retry: 2,
    refetchOnMount: true, // Always refetch when component mounts
  });
  
  // Get top 3 participants for composite avatar
  // Ưu tiên: Creator đầu tiên, sau đó là 2 thành viên khác
  // Luôn đảm bảo có đủ 3 participants để hiển thị 3 avatar: Creator + 2 thành viên
  const topParticipants = React.useMemo(() => {
    // Tìm creator (không loại trừ current user - creator có thể là current user)
    const creator = participants.find((p: any) => {
      return p.is_creator === true || p.is_creator === 1;
    });
    
    // Lấy các thành viên khác (không phải creator, không phải current user)
    const otherParticipants = participants.filter((p: any) => {
      const isCreator = p.is_creator === true || p.is_creator === 1;
      return !isCreator && String(p.id) !== String(currentUserId);
    });
    
    // Kết hợp: Creator đầu tiên, sau đó là 2 thành viên khác
    let result: any[] = [];
    if (creator) {
      // Luôn hiển thị creator đầu tiên
      result = [creator, ...otherParticipants.slice(0, 2)];
    } else {
      // Không có creator info, lấy 3 thành viên đầu tiên (không bao gồm current user)
      result = otherParticipants.slice(0, 3);
    }
    
    // Nếu vẫn chưa đủ 3, lặp lại để đủ 3
    if (result.length < 3 && result.length > 0) {
      const source = result.length === 1 
        ? [...result, ...otherParticipants] 
        : result;
      while (result.length < 3) {
        result = [...result, ...source].slice(0, 3);
      }
    }
    
    return result;
  }, [participants, currentUserId]);
  
  // Calculate remaining count
  // If participants_count is available, use it; otherwise use participants.length
  const totalCount = conversation.participants_count || participants.length;
  // Remaining = total - displayed avatars
  // topParticipants already excludes current user, so we show max 3 avatars
  // remaining = total - 3 (if we show 3 avatars) or total - displayedCount
  const displayedCount = Math.min(topParticipants.length, 3);
  const remainingCount = Math.max(0, totalCount - displayedCount);
  
  // Debug logging
  if (isGroupChat && __DEV__) {
    if (!isLoadingParticipants) {
      console.log(`[Group Avatar] Conversation ${conversation.id}:`, {
        totalCount,
        participantsCount: participants.length,
        topParticipantsCount: topParticipants.length,
        displayedCount,
        remainingCount,
        currentUserId,
        topParticipants: topParticipants.map((p: any) => ({ 
          id: p.id, 
          name: p.full_name || p.username, 
          avatar_url: p.avatar_url || 'NO AVATAR',
          is_creator: p.is_creator || false,
          avatar_url_full: p.avatar_url ? getAvatarURL(p.avatar_url) : 'none',
          hasAvatar: !!(p.avatar_url && p.avatar_url !== 'null' && p.avatar_url !== 'undefined' && p.avatar_url.trim() !== '')
        })),
        allParticipants: participants.map((p: any) => ({ 
          id: p.id, 
          name: p.full_name || p.username,
          is_creator: p.is_creator || false
        })),
      });
    } else {
      console.log(`[Group Avatar] Loading participants for conversation ${conversation.id}...`);
    }
  }

  // Expose close method to parent
  useImperativeHandle(ref, () => ({
    close: () => {
      swipeableRef.current?.close();
      setIsOpen(false);
    },
  }));

  // Render right actions (swipe left to reveal: Mute and Delete)
  const renderRightActions = useCallback((progress: Animated.AnimatedInterpolation<number>, dragX: Animated.AnimatedInterpolation<number>) => {
    // Opacity: ẩn hoàn toàn khi progress = 0, chỉ hiện khi mở đủ xa
    const opacity = progress.interpolate({
      inputRange: [0, 0.3, 0.5, 0.7, 1],
      outputRange: [0, 0, 0, 0.95, 1],
      extrapolate: 'clamp',
    });

    // Scale: ẩn hoàn toàn khi progress = 0
    const scale = progress.interpolate({
      inputRange: [0, 0.3, 0.5, 0.7, 1],
      outputRange: [0, 0, 0, 0.98, 1],
      extrapolate: 'clamp',
    });

    // TranslateX: ẩn hoàn toàn khi đóng
    const translateX = dragX.interpolate({
      inputRange: [-160, -100, -60, 0],
      outputRange: [0, 0, 0, 5],
      extrapolate: 'clamp',
    });

    return (
      <View style={styles.rightActions} pointerEvents="box-none">
        {/* Mute button */}
        <Animated.View
          style={{
            opacity,
            transform: [{ scale }],
          }}
          pointerEvents={isOpen ? 'auto' : 'none'}
        >
          <TouchableOpacity
            style={[styles.actionButton, styles.muteButton]}
            onPress={() => {
              swipeableRef.current?.close();
              onMute?.(conversation.id);
            }}
            activeOpacity={0.7}
            disabled={!isOpen}
          >
            <Animated.View 
              style={{ 
                transform: [{ translateX }],
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <MaterialCommunityIcons name="bell-off" size={24} color="#fff" />
              <Text style={styles.actionButtonText}>Tắt tiếng</Text>
            </Animated.View>
          </TouchableOpacity>
        </Animated.View>

        {/* Delete button */}
        <Animated.View
          style={{
            opacity,
            transform: [{ scale }],
          }}
          pointerEvents={isOpen ? 'auto' : 'none'}
        >
          <TouchableOpacity
            style={[styles.actionButton, styles.deleteButton]}
            onPress={() => {
              swipeableRef.current?.close();
              onDelete?.(conversation.id);
            }}
            activeOpacity={0.7}
            disabled={!isOpen}
          >
            <Animated.View 
              style={{ 
                transform: [{ translateX }],
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <MaterialCommunityIcons name="delete" size={24} color="#fff" />
              <Text style={styles.actionButtonText}>Xóa</Text>
            </Animated.View>
          </TouchableOpacity>
        </Animated.View>
      </View>
    );
  }, [conversation.id, onMute, onDelete, isOpen]);

  // Render left actions (swipe right to reveal: Unread and Pin)
  const renderLeftActions = useCallback((progress: Animated.AnimatedInterpolation<number>, dragX: Animated.AnimatedInterpolation<number>) => {
    // Opacity: ẩn hoàn toàn khi progress = 0, chỉ hiện khi mở đủ xa
    const opacity = progress.interpolate({
      inputRange: [0, 0.3, 0.5, 0.7, 1],
      outputRange: [0, 0, 0, 0.95, 1],
      extrapolate: 'clamp',
    });

    // Scale: ẩn hoàn toàn khi progress = 0
    const scale = progress.interpolate({
      inputRange: [0, 0.3, 0.5, 0.7, 1],
      outputRange: [0, 0, 0, 0.98, 1],
      extrapolate: 'clamp',
    });

    // TranslateX: ẩn hoàn toàn khi đóng
    const translateX = dragX.interpolate({
      inputRange: [0, 60, 100, 160],
      outputRange: [-5, 0, 0, 0],
      extrapolate: 'clamp',
    });

    return (
      <View style={styles.leftActions} pointerEvents="box-none">
        {/* Unread button */}
        <Animated.View
          style={{
            opacity,
            transform: [{ scale }],
          }}
          pointerEvents={isOpen ? 'auto' : 'none'}
        >
          <TouchableOpacity
            style={[styles.actionButton, styles.unreadButton]}
            onPress={() => {
              swipeableRef.current?.close();
              onUnread?.(conversation.id);
            }}
            activeOpacity={0.7}
            disabled={!isOpen}
          >
            <Animated.View 
              style={{ 
                transform: [{ translateX }],
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <MaterialCommunityIcons name="email-mark-as-unread" size={24} color="#fff" />
              <Text style={styles.actionButtonText}>Chưa đọc</Text>
            </Animated.View>
          </TouchableOpacity>
        </Animated.View>

        {/* Pin button */}
        <Animated.View
          style={{
            opacity,
            transform: [{ scale }],
          }}
          pointerEvents={isOpen ? 'auto' : 'none'}
        >
          <TouchableOpacity
            style={[styles.actionButton, styles.pinButton]}
            onPress={() => {
              swipeableRef.current?.close();
              onPin?.(conversation.id);
            }}
            activeOpacity={0.7}
            disabled={!isOpen}
          >
            <Animated.View 
              style={{ 
                transform: [{ translateX }],
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <MaterialCommunityIcons 
                name={isPinned ? "pin-off" : "pin"} 
                size={24} 
                color="#fff" 
              />
              <Text style={styles.actionButtonText}>
                {isPinned ? "Bỏ ghim" : "Ghim"}
              </Text>
            </Animated.View>
          </TouchableOpacity>
        </Animated.View>
      </View>
    );
  }, [conversation.id, isPinned, onUnread, onPin, isOpen]);

  return (
    <Swipeable
      ref={swipeableRef}
      renderRightActions={renderRightActions}
      renderLeftActions={renderLeftActions}
      rightThreshold={70}
      leftThreshold={70}
      overshootRight={false}
      overshootLeft={false}
      friction={1.2}
      overshootFriction={8}
      enableSwipeOpen={true}
      enablePanGesture={true}
      enableTrackpadTwoFingerGesture={false}
      onSwipeableWillOpen={() => {
        // Đóng các swipeable khác khi mở item này
        onSwipeableWillOpen?.();
      }}
      onSwipeableOpen={(direction) => {
        // Khi mở hoàn toàn, giữ mở
        setIsOpen(true);
      }}
      onSwipeableWillClose={(direction) => {
        // Đảm bảo đóng hoàn toàn khi vuốt lại
        // Swipeable sẽ tự động đóng khi vuốt về vị trí ban đầu
        setIsOpen(false);
      }}
      onSwipeableClose={() => {
        // Reset khi đóng hoàn toàn - notify parent
        setIsOpen(false);
        onSwipeableClose?.();
      }}
    >
      <TouchableOpacity
        style={[
          styles.container,
          { 
            borderBottomColor: isDarkMode ? '#2a2b2c' : '#e5e5e5',
            backgroundColor: isPinned 
              ? (isDarkMode ? 'rgba(255, 193, 7, 0.1)' : 'rgba(255, 193, 7, 0.08)') // Màu vàng nhạt cho pinned
              : 'transparent', // Bỏ nền khi tin nhắn chưa đọc (giống Facebook)
          },
        ]}
        onPress={() => {
          // Nếu đang mở, đóng hoàn toàn trước khi navigate
          if (isOpen && swipeableRef.current) {
            swipeableRef.current.close();
            // Đợi animation đóng xong rồi mới navigate
            setTimeout(() => {
              onPress();
            }, 200);
          } else {
            onPress();
          }
        }}
        activeOpacity={0.7}
      >
        <View style={styles.rowAvatarWrapper}>
          {isSystemNotification ? (
            // System notification avatar - blue circle with bell icon
            <View style={{
              width: 56,
              height: 56,
              borderRadius: 28,
              backgroundColor: '#3b82f6',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <MaterialCommunityIcons name="bell" size={28} color="#FFFFFF" />
            </View>
          ) : isGroupChat ? (
            // Composite avatar for group chat - always show composite style
            <View style={styles.compositeAvatarContainer}>
              <View style={styles.compositeAvatarGrid}>
                {/* Top row: 2 avatars */}
                {topParticipants.length > 0 ? (
                  topParticipants.slice(0, 2).map((participant: any, index: number) => (
                    <View key={participant.id || index} style={[
                      styles.compositeAvatarItem,
                      index === 0 && styles.compositeAvatarTopLeft,
                      index === 1 && styles.compositeAvatarTopRight,
                    ]}>
                      <CompositeAvatarImage
                        avatarUrl={participant.avatar_url}
                        displayName={participant.full_name || participant.username || 'U'}
                        size={28}
                      />
                    </View>
                  ))
                ) : (
                  // Placeholder avatars when loading - stacked avatars style
                  <>
                    <View style={[styles.compositeAvatarItem, styles.compositeAvatarTopLeft]}>
                      <View style={[
                        styles.compositeAvatarImage,
                        { 
                          backgroundColor: getAvatarColor('Group1'),
                          alignItems: 'center',
                          justifyContent: 'center',
                          borderRadius: 14,
                          borderWidth: 0,
                        }
                      ]}>
                        <Text style={styles.compositeAvatarText}>G</Text>
                      </View>
                    </View>
                    <View style={[styles.compositeAvatarItem, styles.compositeAvatarTopRight]}>
                      <View style={[
                        styles.compositeAvatarImage,
                        { 
                          backgroundColor: getAvatarColor('Group2'),
                          alignItems: 'center',
                          justifyContent: 'center',
                          borderRadius: 14,
                          borderWidth: 0,
                        }
                      ]}>
                        <Text style={styles.compositeAvatarText}>C</Text>
                      </View>
                    </View>
                  </>
                )}
                {/* Bottom row: 1 avatar + badge or 2 avatars */}
                {topParticipants.length >= 3 ? (
                  <>
                    <View style={[styles.compositeAvatarItem, styles.compositeAvatarBottomLeft]}>
                      <CompositeAvatarImage
                        avatarUrl={topParticipants[2].avatar_url}
                        displayName={topParticipants[2].full_name || topParticipants[2].username || 'U'}
                        avatarColor={colors.primary || '#0084ff'}
                        size={28}
                      />
                    </View>
                    {remainingCount > 0 ? (
                      <View style={[styles.compositeAvatarItem, styles.compositeAvatarBottomRight, styles.compositeAvatarBadge]}>
                        <View style={[
                          styles.compositeAvatarBadgeContainer,
                          { backgroundColor: isDarkMode ? '#2a2a2b' : '#e5e5e5' }
                        ]}>
                          <Text style={[
                            styles.compositeAvatarBadgeText,
                            { color: isDarkMode ? '#ffffff' : '#666666' }
                          ]}>
                            {remainingCount > 99 ? '99+' : String(remainingCount)}
                          </Text>
                        </View>
                      </View>
                    ) : (
                      // Nếu không có remaining count, vẫn hiển thị ô trống để giữ layout
                      <View style={[
                        styles.compositeAvatarItem, 
                        styles.compositeAvatarBottomRight,
                        { backgroundColor: 'transparent' }
                      ]} />
                    )}
                  </>
                ) : remainingCount > 0 ? (
                  <View style={[styles.compositeAvatarItem, styles.compositeAvatarBottomLeft, styles.compositeAvatarBadge]}>
                    <View style={[
                      styles.compositeAvatarBadgeContainer,
                      { backgroundColor: isDarkMode ? '#2a2a2b' : '#e5e5e5' }
                    ]}>
                      <Text style={[
                        styles.compositeAvatarBadgeText,
                        { color: isDarkMode ? '#ffffff' : '#666666' }
                      ]}>
                        {remainingCount > 99 ? '99+' : String(remainingCount)}
                      </Text>
                    </View>
                  </View>
                ) : topParticipants.length === 0 ? (
                  // Show placeholder when no participants loaded - stacked avatars style
                  <>
                    <View style={[styles.compositeAvatarItem, styles.compositeAvatarBottomLeft]}>
                      <View style={[
                        styles.compositeAvatarImage,
                        { 
                          backgroundColor: getAvatarColor('Group1'),
                          alignItems: 'center',
                          justifyContent: 'center',
                          borderRadius: 14,
                          borderWidth: 0,
                        }
                      ]}>
                        <Text style={styles.compositeAvatarText}>G</Text>
                      </View>
                    </View>
                    <View style={[styles.compositeAvatarItem, styles.compositeAvatarBottomRight]}>
                      <View style={[
                        styles.compositeAvatarImage,
                        { 
                          backgroundColor: getAvatarColor('Group2'),
                          alignItems: 'center',
                          justifyContent: 'center',
                          borderRadius: 14,
                          borderWidth: 0,
                        }
                      ]}>
                        <Text style={styles.compositeAvatarText}>C</Text>
                      </View>
                    </View>
                  </>
                ) : (
                  // Fill empty space if less than 3 participants and no remaining count
                  <View style={[
                    styles.compositeAvatarItem, 
                    styles.compositeAvatarBottomLeft,
                    { backgroundColor: 'transparent' }
                  ]} />
                )}
              </View>
            </View>
          ) : (
            // Single avatar for private chat
            <>
              {conversation.avatar_url ? (
                <Image 
                  source={{ uri: getAvatarURL(conversation.avatar_url) }} 
                  style={styles.rowAvatar} 
                />
              ) : (
                <View style={[
                  styles.rowAvatar, 
                  { 
                    backgroundColor: isDarkMode ? '#2b2b2c' : '#d0d0d0', 
                    alignItems: 'center', 
                    justifyContent: 'center' 
                  }
                ]}>
                  <Text style={{ 
                    color: isDarkMode ? '#fff' : '#333', 
                    fontSize: 20, 
                    fontWeight: '600' 
                  }}>
                    {(conversation.full_name || conversation.username || 'U').substring(0, 1).toUpperCase()}
                  </Text>
                </View>
              )}
            </>
          )}
          
          {/* Status indicator and time badge logic - Ẩn khi chat với bot hoặc group chat */}
          {(() => {
            // Không hiển thị status indicator và time badge cho group chat
            if (isGroupChat) {
              return null;
            }
            
            // Kiểm tra xem có phải bot không
            const userNameLower = (conversation.full_name || conversation.username || '').toLowerCase();
            const isBot = userNameLower.includes('chat') 
              || userNameLower.includes('bot')
              || userNameLower.includes('hệ thống')
              || userNameLower.includes('system')
              || userNameLower.includes('zyea+');
            
            // Nếu là bot, không hiển thị status indicator
            if (isBot) {
              return null;
            }
            
            // Nếu activity status bị tắt, ẩn hoàn toàn tất cả status indicators
            if (!activityStatusEnabled) {
              return null;
            }
            
            const status = conversation.status || 'offline';
            
            if (status === 'online') {
              return (
                <View style={[
                  styles.statusIndicator,
                  { 
                    backgroundColor: '#10b981',
                    borderColor: isDarkMode ? colors.background : '#ffffff'
                  }
                ]} />
              );
            }
            
            // When user is offline, use last_seen (time when went offline) for badge consistency
            // When user is online (but status check above already handled), use last_message_time
            // Check if user is offline: status must be explicitly 'offline'
            const isOffline = status === 'offline';
            const hasLastSeen = !!(conversation.last_seen || conversation.lastSeen);
            
            const timeForBadge = (isOffline && hasLastSeen) 
              ? (conversation.last_seen || conversation.lastSeen)
              : conversation.last_message_time;
            
            const recentTime = formatRecentTime?.(timeForBadge);
            
            // Ẩn time badge khi activity status tắt
            if (recentTime && activityStatusEnabled) {
              return (
                <View style={[
                  styles.timeBadgeOnAvatar,
                  { borderColor: isDarkMode ? '#000000' : '#ffffff' }
                ]}>
                  <Text style={styles.timeBadgeText}>{recentTime}</Text>
                </View>
              );
            }
            
            if (status === 'recently_active') {
              return (
                <View style={[
                  styles.statusIndicator,
                  { 
                    backgroundColor: '#f59e0b',
                    borderColor: isDarkMode ? colors.background : '#ffffff'
                  }
                ]} />
              );
            } else if (status === 'away') {
              return (
                <View style={[
                  styles.statusIndicator,
                  { 
                    backgroundColor: '#ef4444',
                    borderColor: isDarkMode ? colors.background : '#ffffff'
                  }
                ]} />
              );
            }
            
            return null;
          })()}
        </View>

        <View style={styles.rowContent}>
          <View style={styles.rowLine1}>
            <View style={styles.nameContainer}>
              {isPinned && (
                <MaterialCommunityIcons 
                  name="pin" 
                  size={16} 
                  color={isDarkMode ? '#FFC107' : '#F57C00'} 
                  style={styles.pinIcon}
                />
              )}
              <Text 
                numberOfLines={1} 
                style={[
                  styles.rowName, 
                  { 
                    color: colors.text,
                    fontWeight: hasUnread ? '700' : '600',
                  }
                ]}
              >
                {conversation.full_name || conversation.username || 'Người dùng'}
              </Text>
            </View>
            {(() => {
              // Always show time for last message (like Facebook Messenger)
              // Use last_message_time (time of last message in conversation)
              const timeToDisplay = conversation.last_message_time;
              
              return timeToDisplay && formatMessageTime ? (
                <View style={styles.timestampContainer}>
                  <Text style={[styles.rowTimestamp, { color: colors.textSecondary }]}>
                    {formatMessageTime(timeToDisplay)}
                  </Text>
                  {/* Blue dot indicator for unread messages (like Facebook) */}
                  {hasUnread && (
                    <View style={[styles.unreadDot, { backgroundColor: '#0084ff' }]} />
                  )}
                </View>
              ) : null;
            })()}
          </View>
          <View style={styles.rowLine2}>
            <Text 
              numberOfLines={1} 
              style={[
                styles.rowSubtitle, 
                { 
                  color: hasUnread 
                    ? (isDarkMode ? '#ffffff' : '#050505')
                    : colors.textSecondary,
                  fontWeight: hasUnread ? '600' : '400', // Làm đậm hơn khi chưa đọc (giống Facebook)
                }
              ]}
            >
              {(() => {
                // Show typing indicator if other user is typing
                if (isTyping) {
                  return '... đang soạn tin nhắn';
                }
                
                // Check if last message is from current user
                const lastMessageSenderId = conversation.last_message_sender_id;
                const isLastMessageFromMe = lastMessageSenderId && currentUserId
                  ? String(lastMessageSenderId) === String(currentUserId)
                  : false;
                
                // Format message content (handle stickers, images, etc.)
                const formattedMessage = formatMessageForList(
                  conversation.last_message, 
                  conversation.last_message_type || conversation.message_type,
                  isLastMessageFromMe
                );
                
                // If last message is from current user and not a sticker, show "Bạn: " prefix (like Facebook)
                // For stickers, the text already includes "Đã gửi" or "Bạn đã nhận" so no need for "Bạn: " prefix
                // Check if formatted message contains "sticker" to avoid adding "Bạn: " prefix
                const isStickerMessage = formattedMessage.includes('sticker') || 
                  formattedMessage.includes('Sticker') ||
                  (conversation.last_message_type || conversation.message_type) === 'sticker';
                
                if (isLastMessageFromMe && formattedMessage && !isStickerMessage) {
                  return `Bạn: ${formattedMessage}`;
                }
                
                return formattedMessage;
              })()}
            </Text>
            {hasUnread && (
              <View style={[styles.unreadBadge, { backgroundColor: '#8b5cf6' }]}>
                <Text style={styles.unreadBadgeText}>
                  {(conversation.unread_count || 0) > 99 ? '99+' : conversation.unread_count}
                </Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    </Swipeable>
  );
});

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: 'transparent',
    position: 'relative',
  },
  rowAvatarWrapper: {
    marginRight: 12,
    position: 'relative',
  },
  rowAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#2b2b2c',
  },
  compositeAvatarContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    overflow: 'hidden',
    backgroundColor: 'transparent',
  },
  compositeAvatarGrid: {
    width: 56,
    height: 56,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  compositeAvatarItem: {
    width: 28,
    height: 28,
    overflow: 'hidden',
    position: 'relative',
  },
  compositeAvatarTopLeft: {
    borderTopLeftRadius: 28,
  },
  compositeAvatarTopRight: {
    borderTopRightRadius: 28,
  },
  compositeAvatarBottomLeft: {
    borderBottomLeftRadius: 28,
  },
  compositeAvatarBottomRight: {
    borderBottomRightRadius: 28,
  },
  compositeAvatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 14, // Make each small avatar circular (half of 28)
    borderWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.3)', // Subtle border to separate avatars
  },
  compositeAvatarText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
  },
  compositeAvatarBadge: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  compositeAvatarBadgeContainer: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 0,
  },
  compositeAvatarBadgeText: {
    fontSize: 8,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  statusIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
  },
  rowContent: {
    flex: 1,
    justifyContent: 'center',
    position: 'relative',
  },
  separatorLine: {
    position: 'absolute',
    bottom: -14,
    left: 0,
    right: 16,
    height: 1,
  },
  rowLine1: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  nameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  pinIcon: {
    marginRight: 6,
  },
  rowLine2: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rowName: {
    fontSize: 17,
    fontWeight: '600',
    flex: 1,
  },
  rowSubtitle: {
    fontSize: 14,
    flex: 1,
    marginRight: 8,
  },
  timestampContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  rowTimestamp: {
    fontSize: 13,
    fontWeight: '400',
    flexShrink: 0,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    flexShrink: 0,
  },
  unreadBadge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    paddingHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  unreadBadgeText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
  },
  timeBadgeOnAvatar: {
    position: 'absolute',
    bottom: -2,
    left: -2,
    backgroundColor: '#10b981',
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    minWidth: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
  timeBadgeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '600',
  },
  // Swipe action buttons
  rightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginLeft: 0,
  },
  leftActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    marginRight: 0,
  },
  actionButton: {
    width: 80,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 8,
    minHeight: 84, // Đảm bảo đủ cao để hiển thị icon và text
  },
  muteButton: {
    backgroundColor: '#8b5cf6', // Purple
  },
  deleteButton: {
    backgroundColor: '#ef4444', // Red
  },
  unreadButton: {
    backgroundColor: '#3b82f6', // Blue
  },
  pinButton: {
    backgroundColor: '#10b981', // Green
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
  },
});

SwipeableConversationItem.displayName = 'SwipeableConversationItem';

export default SwipeableConversationItem;

