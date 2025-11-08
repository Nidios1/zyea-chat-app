import React, { useRef, useState } from 'react';
import { View, StyleSheet, Image, Animated, TouchableOpacity, Pressable } from 'react-native';
import { Text, useTheme, Avatar } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Swipeable } from 'react-native-gesture-handler';
import { formatMessageTime } from '../../utils/dateUtils';
import { getAvatarURL, getImageURL, getVideoURL } from '../../utils/imageUtils';
// Haptics is optional - only use if available
let Haptics: any = null;
try {
  Haptics = require('expo-haptics');
} catch {
  // Haptics not available
}

interface MessageBubbleProps {
  message: {
    id: string;
    content: string;
    sender_id: string;
    created_at: string;
    type?: string;
    message_type?: string;
    media_url?: string;
    image_url?: string;
    video_url?: string;
    file_url?: string;
    avatar_url?: string;
    username?: string;
    full_name?: string;
    call_status?: 'missed' | 'canceled' | 'completed';
    status?: 'sent' | 'delivered' | 'read';
    edited?: boolean;
    reactions?: any;
  };
  currentUserId: string;
  currentUserAvatar?: string;
  currentUserName?: string;
  showAvatar?: boolean;
  showTime?: boolean;
  onReply?: (message: any) => void;
  onLongPress?: (message: any, position: { x: number; y: number }) => void;
}

// Component để hiển thị avatar với fallback - hiển thị image ngay, placeholder chỉ khi lỗi
const AvatarWithFallback: React.FC<{
  avatarUrl: string;
  displayName: string;
  avatarColor: string;
  size: number;
}> = ({ avatarUrl, displayName, avatarColor, size }) => {
  const [imageError, setImageError] = useState(false);

  // Nếu lỗi hoặc không có URL, hiển thị placeholder
  if (imageError || !avatarUrl) {
    return (
      <Avatar.Text
        size={size}
        label={displayName.substring(0, 2).toUpperCase()}
        style={[styles.avatar, { backgroundColor: avatarColor }]}
      />
    );
  }

  // Hiển thị Image ngay lập tức - wrap trong View với transparent background
  // để tránh hiển thị placeholder màu xanh
  return (
    <View style={{ 
      width: size, 
      height: size, 
      borderRadius: size / 2, 
      overflow: 'hidden', 
      backgroundColor: 'transparent' 
    }}>
      <Image
        source={{ uri: avatarUrl }}
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
        }}
        onError={() => setImageError(true)}
        resizeMode="cover"
      />
    </View>
  );
};

const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  currentUserId,
  currentUserAvatar,
  currentUserName,
  showAvatar = false,
  showTime = true,
  onReply,
  onLongPress,
}) => {
  const theme = useTheme();
  const isOwnMessage = message.sender_id === currentUserId;
  const swipeableRef = useRef<Swipeable>(null);
  const bubbleRef = useRef<View>(null);
  
  // Determine message type (image or video)
  // Server returns message_type, but we also check type for compatibility
  const messageType = message.message_type || message.type || 'text';
  const isImageMessage = messageType === 'image';
  const isVideoMessage = messageType === 'video';
  
  // Get media URL - priority: file_url (server field) > image_url/video_url > media_url
  // Server stores media in file_url field, and uses message_type to distinguish image vs video
  let imageUrl: string | null | undefined = null;
  let videoUrl: string | null | undefined = null;
  
  if (isImageMessage) {
    // For image messages, check file_url first (server field)
    imageUrl = message.file_url || message.image_url || message.media_url;
  } else if (isVideoMessage) {
    // For video messages, check file_url first (server field)
    videoUrl = message.file_url || message.video_url;
  }
  
  // Convert to full URL if needed
  const fullImageUrl = imageUrl ? getImageURL(imageUrl) : null;
  const fullVideoUrl = videoUrl ? getVideoURL(videoUrl) : null;
  
  // Debug log for troubleshooting
  if (isImageMessage) {
    if (!fullImageUrl) {
      console.warn('⚠️ MessageBubble: Image message but no URL found', {
        messageType,
        file_url: message.file_url,
        image_url: message.image_url,
        media_url: message.media_url,
        messageId: message.id,
        content: message.content,
      });
    } else {
      // Log successful image URL conversion
      console.log('✅ MessageBubble: Image URL converted', {
        messageId: message.id,
        originalUrl: imageUrl,
        fullUrl: fullImageUrl,
        messageType,
      });
    }
  }
  
  // Get avatar color based on name
  const getAvatarColor = (name?: string): string => {
    if (!name) return '#0084ff';
    const colors = ['#0084ff', '#00a651', '#ff6b6b', '#4ecdc4', '#45b7d1'];
    const hash = name.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);
    return colors[Math.abs(hash) % colors.length];
  };
  
  const displayName = isOwnMessage 
    ? (currentUserName || message.full_name || message.username || 'Me')
    : (message.full_name || message.username || 'Unknown');
  const avatarUrl = isOwnMessage 
    ? (currentUserAvatar || message.avatar_url)
    : message.avatar_url;
  const avatarColor = getAvatarColor(displayName);

  // Parse reactions from message
  // Use useMemo to ensure reactions are recalculated when message.reactions changes
  const reactions = React.useMemo(() => {
    if (!message.reactions) return [];
    try {
      if (typeof message.reactions === 'string') {
        return JSON.parse(message.reactions);
      }
      return Array.isArray(message.reactions) ? message.reactions : [];
    } catch {
      return [];
    }
  }, [message.reactions, message.id]); // Re-calculate when reactions or message ID changes
  
  // Count reactions by emoji
  const reactionCounts = reactions.reduce((acc: any, emoji: string) => {
    acc[emoji] = (acc[emoji] || 0) + 1;
    return acc;
  }, {});

  // Swipe to reply - chỉ cho tin nhắn nhận được (không phải của mình)
  // renderRightActions: hiển thị khi swipe từ phải sang trái (kéo sang trái) - đây là cái ta cần
  const renderSwipeRightActions = (progress: Animated.AnimatedInterpolation<number>, dragX: Animated.AnimatedInterpolation<number>) => {
    if (isOwnMessage || !onReply) return null;
    
    // Smooth animation với scale và opacity
    const scale = progress.interpolate({
      inputRange: [0, 0.5, 1],
      outputRange: [0.8, 0.9, 1],
      extrapolate: 'clamp',
    });
    
    const opacity = progress.interpolate({
      inputRange: [0, 0.3, 1],
      outputRange: [0, 0.8, 1],
      extrapolate: 'clamp',
    });

    // Smooth translateX để action xuất hiện mượt mà
    const translateX = dragX.interpolate({
      inputRange: [-100, 0],
      outputRange: [0, 20],
      extrapolate: 'clamp',
    });

    return (
      <View style={styles.swipeActionContainer}>
        <Animated.View 
          style={[
            styles.swipeAction, 
            { 
              opacity,
              transform: [{ scale }, { translateX }],
            }
          ]}
        >
          <MaterialCommunityIcons name="reply" size={24} color="#0084ff" />
          <Text style={styles.swipeActionText}>Trả lời</Text>
        </Animated.View>
      </View>
    );
  };

  const handleSwipeableOpen = () => {
    // Trigger reply when swiped fully left (kéo sang trái)
    if (!isOwnMessage && onReply) {
      // Small delay để animation mượt hơn
      requestAnimationFrame(() => {
        onReply(message);
        // Close swipe after animation completes
        setTimeout(() => {
          swipeableRef.current?.close();
        }, 200);
      });
    }
  };

  const handleLongPress = (event: any) => {
    if (!onLongPress) return;
    
    // Get position of the press
    const { pageX, pageY } = event.nativeEvent;
    
    // Haptic feedback (only if available)
    try {
      if (Haptics && Haptics.impactAsync) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }
    } catch (error) {
      // Haptics not available, ignore
    }
    
    // Call callback with message and position
    onLongPress(message, { x: pageX, y: pageY });
  };

  const messageContent = (
    <Pressable
      ref={bubbleRef}
      style={[
        styles.container,
        isOwnMessage ? styles.ownContainer : styles.otherContainer,
      ]}
      onLongPress={handleLongPress}
      delayLongPress={500}
    >
      {/* Avatar - hiển thị khi showAvatar = true (cho cả tin nhắn của mình và người khác) */}
      {showAvatar && (
        <View style={[styles.avatarContainer, isOwnMessage && styles.avatarContainerRight]}>
          {avatarUrl ? (
            <AvatarWithFallback
              avatarUrl={getAvatarURL(avatarUrl)}
              displayName={displayName}
              avatarColor={avatarColor}
              size={32}
            />
          ) : (
            <Avatar.Text
              size={32}
              label={displayName.substring(0, 2).toUpperCase()}
              style={[styles.avatar, { backgroundColor: avatarColor }]}
            />
          )}
        </View>
      )}
      
      {/* Spacer when avatar is not shown to maintain alignment */}
      {!showAvatar && <View style={styles.avatarSpacer} />}
      
      {/* Message Content */}
      <View style={styles.messageContent}>
        {/* Special rendering for call log style */}
        {message.type === 'call' ? (
          <View
            style={[
              styles.bubble,
              isOwnMessage ? styles.ownBubble : styles.otherBubble,
              isOwnMessage ? styles.ownCallBubble : styles.otherCallBubble,
            ]}
          >
            <Text
              style={[
                styles.text,
                isOwnMessage ? styles.ownText : styles.otherText,
              ]}
            >
              {message.content || (message.call_status === 'canceled' ? 'Bạn đã huỷ' : 'Cuộc gọi')}
            </Text>
            {showTime && (
              <Text style={[styles.time, isOwnMessage ? styles.ownTime : styles.otherTime]}>
                {formatMessageTime(message.created_at)}
              </Text>
            )}
          </View>
        ) : (
          <View
            style={[
              styles.bubble,
              isOwnMessage ? styles.ownBubble : styles.otherBubble,
              {
                backgroundColor: isOwnMessage ? '#7a59c0' : '#1f1f1f',
              },
            ]}
          >
            {/* Display image if available */}
            {fullImageUrl && isImageMessage && (
              <TouchableOpacity 
                activeOpacity={0.9}
                onPress={() => {
                  // TODO: Open image in full screen viewer
                }}
              >
                <Image
                  source={{ uri: fullImageUrl }}
                  style={styles.image}
                  resizeMode="cover"
                  onError={(error) => {
                    console.error('❌ MessageBubble: Failed to load image', {
                      uri: fullImageUrl,
                      error,
                      messageId: message.id,
                      originalUrl: imageUrl,
                    });
                  }}
                  onLoad={() => {
                    // Image loaded successfully
                  }}
                />
              </TouchableOpacity>
            )}
            
            {/* Display video thumbnail if available */}
            {fullVideoUrl && isVideoMessage && (
              <View style={styles.videoContainer}>
                <Image
                  source={{ uri: fullVideoUrl }}
                  style={styles.videoThumbnail}
                  resizeMode="cover"
                />
                <View style={styles.videoOverlay}>
                  <MaterialCommunityIcons name="play-circle" size={48} color="#FFFFFF" />
                </View>
                <View style={styles.videoLabel}>
                  <MaterialCommunityIcons name="video" size={14} color="#FFFFFF" />
                  <Text style={styles.videoLabelText}>Video</Text>
                </View>
              </View>
            )}

            {/* Display text content if available and not just emoji placeholder */}
            {/* Hide text if it's just an emoji placeholder (📷 or 🎥) when media is present */}
            {!!message.content && message.content.trim() && 
             !(fullImageUrl && message.content.trim().match(/^📷\s*Ảnh?$/)) &&
             !(fullVideoUrl && message.content.trim().match(/^🎥\s*Video?$/)) && (
              <Text
                style={[
                  styles.text,
                  isOwnMessage ? styles.ownText : styles.otherText,
                  (fullImageUrl || fullVideoUrl) && styles.textWithMedia,
                ]}
              >
                {message.content}
              </Text>
            )}
            
            {/* Show placeholder text only if media failed to load */}
            {((isImageMessage && !fullImageUrl) || (isVideoMessage && !fullVideoUrl)) && message.content && (
              <Text
                style={[
                  styles.text,
                  isOwnMessage ? styles.ownText : styles.otherText,
                ]}
              >
                {message.content}
              </Text>
            )}

            <View style={styles.timeContainer}>
              {/* Always show time for own messages when status is shown, or when showTime is true */}
              {(showTime || isOwnMessage) && (
                <Text style={[styles.time, isOwnMessage ? styles.ownTime : styles.otherTime]}>
                  {formatMessageTime(message.created_at)}
                </Text>
              )}
              {/* Edited indicator - chỉ hiển thị cho tin nhắn của mình */}
              {message.edited && isOwnMessage && (
                <Text style={[styles.editedLabel, styles.ownTime]}>
                  Đã chỉnh sửa
                </Text>
              )}
              {/* Message status icons (like Facebook) - Always show for own messages */}
              {isOwnMessage && (
                <View style={styles.statusContainer}>
                  {(() => {
                    const status = message.status || 'sent';
                    // Facebook-style status icons
                    if (status === 'read') {
                      // Two blue checkmarks (đã xem) - màu xanh giống Facebook Messenger
                      return (
                        <MaterialCommunityIcons 
                          name="check-all" 
                          size={14} 
                          color="#0084ff" 
                        />
                      );
                    } else if (status === 'delivered') {
                      // Two gray checkmarks (đã nhận) - màu xám trắng
                      return (
                        <MaterialCommunityIcons 
                          name="check-all" 
                          size={14} 
                          color="rgba(255,255,255,0.7)" 
                        />
                      );
                    } else {
                      // Single gray checkmark (đã gửi) - một dấu tích xám trắng
                      return (
                        <MaterialCommunityIcons 
                          name="check" 
                          size={14} 
                          color="rgba(255,255,255,0.7)" 
                        />
                      );
                    }
                  })()}
                </View>
              )}
            </View>

            {/* Reactions display - Facebook style */}
            {reactions.length > 0 && (
              <View style={[
                styles.reactionsContainer,
                isOwnMessage ? styles.ownReactionsContainer : styles.otherReactionsContainer
              ]}>
                {/* Group reactions and show unique emojis with counts */}
                {Object.entries(reactionCounts).slice(0, 3).map(([emoji, count]: [string, any], index) => (
                  <View key={emoji} style={styles.reactionItem}>
                    <Text style={styles.reactionEmoji}>{emoji}</Text>
                    {count > 1 && (
                      <Text style={[
                        styles.reactionCount,
                        isOwnMessage ? styles.ownReactionCount : styles.otherReactionCount
                      ]}>
                        {count}
                      </Text>
                    )}
                  </View>
                ))}
                {Object.keys(reactionCounts).length > 3 && (
                  <Text style={[
                    styles.moreReactions,
                    isOwnMessage ? styles.ownReactionCount : styles.otherReactionCount
                  ]}>
                    +{Object.keys(reactionCounts).length - 3}
                  </Text>
                )}
              </View>
            )}
          </View>
        )}
      </View>
    </Pressable>
  );

  // Wrap with Swipeable only for received messages (not own messages)
  if (!isOwnMessage && onReply) {
    return (
      <Swipeable
        ref={swipeableRef}
        renderRightActions={renderSwipeRightActions}
        onSwipeableOpen={handleSwipeableOpen}
        overshootRight={false}
        overshootFriction={8}
        friction={1.2}
        rightThreshold={60}
        enableTrackpadTwoFingerGesture
        containerStyle={styles.swipeableContainer}
        dragOffsetFromLeftEdge={10}
      >
        {messageContent}
      </Swipeable>
    );
  }

  // Return without swipe for own messages
  return messageContent;
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 4,
    alignItems: 'flex-end',
  },
  ownContainer: {
    flexDirection: 'row-reverse',
  },
  otherContainer: {
    flexDirection: 'row',
  },
  avatarContainer: {
    marginRight: 8,
    marginBottom: 2,
    width: 32,
    height: 32,
  },
  avatarContainerRight: {
    marginRight: 0,
    marginLeft: 8,
  },
  avatarSpacer: {
    width: 40,
  },
  avatar: {
    backgroundColor: '#0084ff',
  },
  avatarImage: {
    backgroundColor: 'transparent',
    // Đảm bảo không có background mặc định
    overflow: 'hidden',
  },
  messageContent: {
    maxWidth: '70%',
    flexDirection: 'column',
  },
  bubble: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 18,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  ownBubble: {
    borderBottomRightRadius: 6,
    alignSelf: 'flex-end',
  },
  otherBubble: {
    borderBottomLeftRadius: 6,
    alignSelf: 'flex-start',
  },
  ownCallBubble: {
    backgroundColor: '#2a2042',
  },
  otherCallBubble: {
    backgroundColor: '#222',
  },
  text: {
    fontSize: 15,
    lineHeight: 20,
  },
  ownText: {
    color: '#ffffff',
  },
  otherText: {
    color: '#e5e5e5',
  },
  image: {
    width: '100%',
    maxWidth: 250,
    height: 200,
    borderRadius: 12,
    marginBottom: 4,
  },
  videoContainer: {
    width: '100%',
    maxWidth: 250,
    height: 200,
    borderRadius: 12,
    marginBottom: 4,
    position: 'relative',
    backgroundColor: '#000',
    overflow: 'hidden',
  },
  videoThumbnail: {
    width: '100%',
    height: '100%',
  },
  videoOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  videoLabel: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    gap: 4,
  },
  videoLabelText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  textWithMedia: {
    marginTop: 8,
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  time: {
    fontSize: 11,
  },
  timeOnly: {
    marginRight: 4,
  },
  editedLabel: {
    fontSize: 11,
    fontStyle: 'italic',
    marginLeft: 4,
  },
  statusContainer: {
    marginLeft: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ownTime: {
    color: 'rgba(255,255,255,0.65)',
  },
  otherTime: {
    color: 'rgba(229,229,229,0.6)',
  },
  swipeableContainer: {
    backgroundColor: 'transparent',
  },
  swipeActionContainer: {
    justifyContent: 'center',
    alignItems: 'flex-start',
    paddingLeft: 16,
    width: 100,
    backgroundColor: 'transparent',
  },
  swipeAction: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: 'transparent',
  },
  swipeActionText: {
    color: '#0084ff',
    fontSize: 14,
    fontWeight: '500',
  },
  reactionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 4,
  },
  ownReactionsContainer: {
    justifyContent: 'flex-end',
  },
  otherReactionsContainer: {
    justifyContent: 'flex-start',
  },
  reactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 12,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
  },
  reactionEmoji: {
    fontSize: 14,
  },
  reactionCount: {
    fontSize: 11,
    fontWeight: '600',
    marginLeft: 2,
  },
  ownReactionCount: {
    color: '#7a59c0',
  },
  otherReactionCount: {
    color: '#1f1f1f',
  },
  moreReactions: {
    fontSize: 11,
    fontWeight: '600',
    marginLeft: 2,
  },
});

export default MessageBubble;
