import React, { useRef, useState } from 'react';
import { View, StyleSheet, Animated, TouchableOpacity, Pressable, Dimensions, Image as RNImage } from 'react-native';
import { Image } from 'expo-image';
import { Text, Avatar } from 'react-native-paper';
import { useTheme } from '../../contexts/ThemeContext';
import { useFontSize } from '../../contexts/FontSizeContext';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Swipeable } from 'react-native-gesture-handler';
import { formatMessageTime, formatTime } from '../../utils/dateUtils';
import { getAvatarURL, getImageURL, getVideoURL, getAvatarColor } from '../../utils/imageUtils';
import TextWithLinks from './TextWithLinks';
import { getStickerURL } from '../../utils/imageUtils';
import { stickerAPI } from '../../utils/api';
import { useQuery } from '@tanstack/react-query';
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
  otherUserAvatar?: string;
  otherUserName?: string;
  nextMessage?: MessageBubbleProps['message'] | null; // Tin nhắn tiếp theo (newer) để kiểm tra nhóm
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
        contentFit="cover"
        cachePolicy="memory-disk"
        transition={0}
      />
    </View>
  );
};

const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  currentUserId,
  currentUserAvatar,
  currentUserName,
  otherUserAvatar,
  otherUserName,
  nextMessage = null,
  showAvatar = false,
  showTime = true,
  onReply,
  onLongPress,
}) => {
  const { colors, isDarkMode } = useTheme();
  const { getFontSize } = useFontSize();
  const isOwnMessage = message.sender_id === currentUserId;
  const swipeableRef = useRef<Swipeable>(null);
  const bubbleRef = useRef<View>(null);
  
  // Dynamic styles with scaled font sizes
  const dynamicStyles = {
    text: {
      ...styles.text,
      fontSize: getFontSize(16),
      lineHeight: getFontSize(22),
    },
    videoLabelText: {
      ...styles.videoLabelText,
      fontSize: getFontSize(12),
    },
    timestampBelow: {
      ...styles.timestampBelow,
      fontSize: getFontSize(11),
    },
    timeAgoText: {
      ...styles.timeAgoText,
      fontSize: getFontSize(11),
    },
    editedLabelBelow: {
      ...styles.editedLabelBelow,
      fontSize: getFontSize(11),
    },
    swipeActionText: {
      ...styles.swipeActionText,
      fontSize: getFontSize(14),
    },
    reactionEmojiIcon: {
      ...styles.reactionEmojiIcon,
      fontSize: getFontSize(14),
    },
    reactionEmoji: {
      ...styles.reactionEmoji,
      fontSize: getFontSize(14),
    },
    reactionCount: {
      ...styles.reactionCount,
      fontSize: getFontSize(11),
    },
    moreReactions: {
      ...styles.moreReactions,
      fontSize: getFontSize(11),
    },
    readReceiptText: {
      ...styles.readReceiptText,
      fontSize: getFontSize(11),
    },
    stickerSenderName: {
      ...styles.stickerSenderName,
      fontSize: getFontSize(12),
    },
  };
  // Animation cho long press - scale effect
  const pressScaleAnim = useRef(new Animated.Value(1)).current;
  const pressOpacityAnim = useRef(new Animated.Value(1)).current;
  // Animation cho reaction - hiệu ứng nhảy từ ngoài vào giống Facebook (nâng cấp)
  const reactionScaleAnim = useRef(new Animated.Value(0)).current; // Bắt đầu từ 0 (ẩn)
  const reactionTranslateX = useRef(new Animated.Value(30)).current; // Bắt đầu từ bên phải xa hơn
  const reactionTranslateY = useRef(new Animated.Value(-30)).current; // Bắt đầu từ trên xa hơn
  const reactionRotate = useRef(new Animated.Value(0)).current; // Rotation để tạo hiệu ứng xoay
  const reactionOpacity = useRef(new Animated.Value(0)).current; // Opacity riêng để mượt hơn
  const previousReactionsLength = useRef(0);
  const previousDisplayEmoji = useRef<string>(''); // Theo dõi emoji hiện tại để phát hiện thay đổi
  
  // Màu chữ cho tin nhắn người khác - tránh trùng lặp code
  const otherTextColor = isDarkMode ? '#ffffff' : '#000000';
  
  // State for image dimensions
  const [imageDimensions, setImageDimensions] = useState<{ width: number; height: number } | null>(null);
  
  // Determine message type (image, video, sticker, or system)
  // Server returns message_type, but we also check type for compatibility
  const messageType = message.message_type || message.type || 'text';
  const isImageMessage = messageType === 'image';
  const isVideoMessage = messageType === 'video';
  const isSystemMessage = messageType === 'system';
  
  // Check if message is a sticker - check both message_type and content (JSON format)
  let isStickerMessage = messageType === 'sticker';
  if (!isStickerMessage && message.content) {
    try {
      const parsed = JSON.parse(message.content);
      if (parsed && (parsed.packId || parsed.packid || parsed.pack_id) && 
          (parsed.stickerIndex !== undefined || parsed.stickerindex !== undefined || parsed.sticker_index !== undefined)) {
        isStickerMessage = true;
      }
    } catch (e) {
      // Not JSON, not a sticker
    }
  }
  
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
  
  // Get image dimensions asynchronously - don't block rendering
  // Image will display immediately with default size, then update when dimensions are available
  React.useEffect(() => {
    if (fullImageUrl && isImageMessage) {
      // Reset dimensions when URL changes
      setImageDimensions(null);
      
      // Get size asynchronously - image will render immediately with default size
      // Use RNImage.getSize from react-native (expo-image doesn't have getSize)
      RNImage.getSize(
        fullImageUrl,
        (width, height) => {
          setImageDimensions({ width, height });
        },
        (error) => {
          // If failed, use default dimensions
          setImageDimensions({ width: 300, height: 200 });
        }
      );
    } else {
      // Reset when not an image message
      setImageDimensions(null);
    }
  }, [fullImageUrl, isImageMessage]);
  
  // Calculate image display size based on aspect ratio (like Zalo)
  const screenWidth = Dimensions.get('window').width;
  const maxImageWidth = screenWidth * 0.6; // 60% of screen width - smaller size
  const minImageHeight = 120;
  const maxImageHeight = 300;
  
  // Calculate display size - use dimensions if available, otherwise use defaults
  // Image will render immediately with default size, then update when dimensions are ready
  let imageDisplayWidth = maxImageWidth;
  let imageDisplayHeight = 160; // Default height - smaller
  
  if (imageDimensions) {
    const aspectRatio = imageDimensions.width / imageDimensions.height;
    imageDisplayWidth = Math.min(maxImageWidth, imageDimensions.width);
    imageDisplayHeight = imageDisplayWidth / aspectRatio;
    
    // Clamp height between min and max
    if (imageDisplayHeight < minImageHeight) {
      imageDisplayHeight = minImageHeight;
      imageDisplayWidth = imageDisplayHeight * aspectRatio;
    } else if (imageDisplayHeight > maxImageHeight) {
      imageDisplayHeight = maxImageHeight;
      imageDisplayWidth = imageDisplayHeight * aspectRatio;
    }
  }
  
  // Check if message is image-only (no text content)
  const isImageOnly = isImageMessage && fullImageUrl && (!message.content || !message.content.trim() || message.content.trim().match(/^📷\s*Ảnh?$/));
  
  // Parse sticker data from message content (JSON format: {packId, stickerIndex})
  let stickerData: any = null;
  let packId: string | null = null;
  let stickerIndex: number | null = null;
  
  if (isStickerMessage && message.content) {
    try {
      stickerData = JSON.parse(message.content);
      // Handle both camelCase and lowercase keys (server might return lowercase)
      packId = stickerData?.packId || stickerData?.packid || stickerData?.pack_id;
      stickerIndex = stickerData?.stickerIndex !== undefined 
        ? stickerData.stickerIndex 
        : (stickerData?.stickerindex !== undefined 
          ? stickerData.stickerindex 
          : (stickerData?.sticker_index !== undefined ? stickerData.sticker_index : null));
      
      // Sticker data parsed successfully
    } catch (e) {
      // Invalid JSON, ignore
      console.warn('⚠️ Failed to parse sticker JSON:', message.content, e);
      stickerData = null;
    }
  }

  // Fetch sticker packs to get sticker URL - luôn fetch để cache sẵn
  const { data: stickerPacksData = [], isLoading: isLoadingStickers } = useQuery({
    queryKey: ['sticker-packs'],
    queryFn: async () => {
      try {
        const response = await stickerAPI.getStickerPacks();
        const packs = response.data.packs || [];
        // Sticker packs loaded
        return packs;
      } catch (error) {
        console.error('🎨 MessageBubble - Error loading sticker packs:', error);
        return [];
      }
    },
    staleTime: 0, // Luôn coi là stale để refresh ngay khi cần
    gcTime: 10 * 60 * 1000,
  });

  // Get sticker URL from packs - hỗ trợ cả id (số) và name (string)
  let stickerUrl: string | null = null;
  if (isStickerMessage && packId && stickerIndex !== null) {
    if (Array.isArray(stickerPacksData) && stickerPacksData.length > 0) {
      // Tìm pack theo id hoặc name (hỗ trợ cả hai)
      const pack = (stickerPacksData as any[]).find((p: any) => {
        if (!p) return false;
        // So sánh cả id (string hoặc number) và name
        return String(p.id) === String(packId) || p.name === packId || p.id === packId;
      });
      
      if (pack) {
        if (pack.stickers && Array.isArray(pack.stickers) && pack.stickers[stickerIndex]) {
          stickerUrl = getStickerURL(pack.stickers[stickerIndex].url);
        } else {
          console.warn('⚠️ MessageBubble - Sticker not found in pack:', { 
            packId, 
            stickerIndex, 
            packStickersLength: pack.stickers?.length,
            availableIndices: pack.stickers?.map((_: any, i: number) => i) || []
          });
        }
      } else {
        console.warn('⚠️ MessageBubble - Pack not found:', { 
          packId, 
          packIdType: typeof packId,
          availablePacks: stickerPacksData.map((p: any) => ({ id: p.id, name: p.name, idType: typeof p.id }))
        });
      }
    } else if (!isLoadingStickers) {
      console.warn('⚠️ MessageBubble - No sticker packs loaded yet');
    }
  }
  
  const displayName = isOwnMessage 
    ? (currentUserName || message.full_name || message.username || 'Me')
    : (message.full_name || message.username || 'Unknown');
  // Avatar: ưu tiên message.avatar_url, nếu không có thì dùng otherUserAvatar (cho tin nhắn của người khác)
  // hoặc currentUserAvatar (cho tin nhắn của mình)
  const avatarUrl = isOwnMessage 
    ? (currentUserAvatar || message.avatar_url)
    : (message.avatar_url || otherUserAvatar);
  const avatarColor = getAvatarColor(displayName);

  // Parse reactions from message
  // Use useMemo to ensure reactions are recalculated when message.reactions changes
  // Thêm message._updated để force re-calculate khi có optimistic update
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
  }, [message.reactions, message.id, (message as any)._updated]); // Re-calculate when reactions, message ID, or _updated changes
  
  // Count reactions by emoji - use useMemo để tránh tính lại mỗi lần render
  const reactionCounts = React.useMemo(() => {
    return reactions.reduce((acc: any, emoji: string) => {
      acc[emoji] = (acc[emoji] || 0) + 1;
      return acc;
    }, {});
  }, [reactions]);
  
  // Get total reaction count và display emoji - use useMemo để tối ưu performance
  const { totalReactionCount, displayEmoji } = React.useMemo(() => {
    const total = reactions.length;
    
    // Get the first/most common emoji to display (chỉ hiển thị 1 emoji)
    // Ưu tiên emoji có số lượng nhiều nhất, nếu bằng nhau thì lấy emoji đầu tiên
    const emoji = Object.entries(reactionCounts).sort((a: any, b: any) => {
      // Sort by count (descending), then by emoji (ascending) for consistency
      if (b[1] !== a[1]) return b[1] - a[1];
      return a[0].localeCompare(b[0]);
    })[0]?.[0] || reactions[0] || '';
    
    return { totalReactionCount: total, displayEmoji: emoji };
  }, [reactions, reactionCounts]);

  // Hiệu ứng animation khi reaction được thêm vào hoặc thay đổi (nâng cấp - xịn hơn)
  React.useEffect(() => {
    // Khởi tạo previous length và emoji lần đầu
    if (previousReactionsLength.current === 0 && previousDisplayEmoji.current === '') {
      previousReactionsLength.current = reactions.length;
      previousDisplayEmoji.current = displayEmoji || '';
      // Nếu đã có reactions từ đầu, hiển thị ngay không animation
      if (reactions.length > 0 && displayEmoji && displayEmoji.trim() !== '') {
        reactionScaleAnim.setValue(1);
        reactionTranslateX.setValue(0);
        reactionTranslateY.setValue(0);
        reactionRotate.setValue(0);
        reactionOpacity.setValue(1);
      }
      return;
    }
    
    // Kiểm tra nếu emoji thay đổi (thay đổi reaction) - cập nhật ngay lập tức
    // Điều này xảy ra khi: chọn icon khác, hoặc toggle icon hiện tại
    // So sánh chính xác để tránh trigger không cần thiết
    const emojiChanged = displayEmoji !== previousDisplayEmoji.current;
    const lengthChanged = reactions.length !== previousReactionsLength.current;
    
    if (emojiChanged) {
      if (reactions.length > 0 && displayEmoji && displayEmoji.trim() !== '') {
        // Emoji thay đổi và vẫn còn reactions - cập nhật ngay với animation nhẹ
        // Dừng tất cả animation đang chạy để tránh conflict
        reactionScaleAnim.stopAnimation();
        reactionTranslateX.stopAnimation();
        reactionTranslateY.stopAnimation();
        reactionRotate.stopAnimation();
        reactionOpacity.stopAnimation();
        
        // Set về trạng thái hiển thị ngay lập tức
        reactionScaleAnim.setValue(1);
        reactionTranslateX.setValue(0);
        reactionTranslateY.setValue(0);
        reactionRotate.setValue(0);
        reactionOpacity.setValue(1);
        
        // Animation bounce nhẹ khi thay đổi emoji
        Animated.sequence([
          Animated.spring(reactionScaleAnim, {
            toValue: 1.2,
            tension: 300,
            friction: 7,
            useNativeDriver: true,
          }),
          Animated.spring(reactionScaleAnim, {
            toValue: 1,
            tension: 300,
            friction: 7,
            useNativeDriver: true,
          }),
        ]).start();
      } else {
        // Emoji thay đổi nhưng không còn reactions (đã xóa hết) - ẩn ngay
        reactionScaleAnim.setValue(0);
        reactionTranslateX.setValue(30);
        reactionTranslateY.setValue(-30);
        reactionRotate.setValue(180);
        reactionOpacity.setValue(0);
      }
      // Cập nhật previous values ngay lập tức
      previousDisplayEmoji.current = displayEmoji || '';
      previousReactionsLength.current = reactions.length;
      return;
    }
    
    // Nếu số lượng reactions tăng lên (và emoji không đổi), trigger animation nhảy vào
    if (reactions.length > previousReactionsLength.current && !emojiChanged) {
      // Reset về vị trí ban đầu (ngoài màn hình)
      reactionScaleAnim.setValue(0);
      reactionTranslateX.setValue(30); // Bắt đầu từ xa hơn
      reactionTranslateY.setValue(-30); // Bắt đầu từ trên xa hơn
      reactionRotate.setValue(-180); // Xoay từ -180 độ
      reactionOpacity.setValue(0);
      
      // Animation nhảy vào nâng cấp: di chuyển + scale + rotation + opacity
      Animated.parallel([
        // Di chuyển vào vị trí với easing mượt hơn
        Animated.spring(reactionTranslateX, {
          toValue: 0,
          tension: 180,
          friction: 9,
          useNativeDriver: true,
        }),
        Animated.spring(reactionTranslateY, {
          toValue: 0,
          tension: 180,
          friction: 9,
          useNativeDriver: true,
        }),
        // Rotation: xoay từ -180 độ về 0 với bounce
        Animated.sequence([
          Animated.spring(reactionRotate, {
            toValue: 15, // Xoay thêm một chút
            tension: 250,
            friction: 7,
            useNativeDriver: true,
          }),
          Animated.spring(reactionRotate, {
            toValue: -5, // Xoay ngược lại
            tension: 250,
            friction: 7,
            useNativeDriver: true,
          }),
          Animated.spring(reactionRotate, {
            toValue: 0, // Về vị trí ban đầu
            tension: 250,
            friction: 7,
            useNativeDriver: true,
          }),
        ]),
        // Opacity: fade in mượt mà
        Animated.timing(reactionOpacity, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
        // Scale: bounce effect mượt hơn
        Animated.sequence([
          Animated.spring(reactionScaleAnim, {
            toValue: 1.5, // Phóng to hơn
            tension: 280,
            friction: 5,
            useNativeDriver: true,
          }),
          Animated.spring(reactionScaleAnim, {
            toValue: 0.85, // Thu nhỏ
            tension: 280,
            friction: 6,
            useNativeDriver: true,
          }),
          Animated.spring(reactionScaleAnim, {
            toValue: 1.15, // Phóng to nhẹ
            tension: 280,
            friction: 6,
            useNativeDriver: true,
          }),
          Animated.spring(reactionScaleAnim, {
            toValue: 0.95, // Thu nhỏ nhẹ
            tension: 280,
            friction: 7,
            useNativeDriver: true,
          }),
          Animated.spring(reactionScaleAnim, {
            toValue: 1, // Về kích thước bình thường
            tension: 280,
            friction: 7,
            useNativeDriver: true,
          }),
        ]),
      ]).start();
    } else if (reactions.length < previousReactionsLength.current && !emojiChanged) {
      // Nếu xóa reaction
      if (reactions.length === 0) {
        // Nếu không còn reactions, ẩn ngay không animation
        reactionScaleAnim.setValue(0);
        reactionTranslateX.setValue(30);
        reactionTranslateY.setValue(-30);
        reactionRotate.setValue(180);
        reactionOpacity.setValue(0);
      } else if (displayEmoji && displayEmoji.trim() !== '') {
        // Nếu vẫn còn reactions và có displayEmoji, chỉ cập nhật (không ẩn)
        // Icon vẫn hiển thị, chỉ thay đổi emoji nếu cần
        // Dừng animation đang chạy
        reactionScaleAnim.stopAnimation();
        reactionTranslateX.stopAnimation();
        reactionTranslateY.stopAnimation();
        reactionRotate.stopAnimation();
        reactionOpacity.stopAnimation();
        
        // Đảm bảo icon vẫn hiển thị
        reactionScaleAnim.setValue(1);
        reactionTranslateX.setValue(0);
        reactionTranslateY.setValue(0);
        reactionRotate.setValue(0);
        reactionOpacity.setValue(1);
        
        // Animation bounce nhẹ khi số lượng giảm
        Animated.sequence([
          Animated.spring(reactionScaleAnim, {
            toValue: 0.9,
            tension: 300,
            friction: 7,
            useNativeDriver: true,
          }),
          Animated.spring(reactionScaleAnim, {
            toValue: 1,
            tension: 300,
            friction: 7,
            useNativeDriver: true,
          }),
        ]).start();
      }
    }
    
    // Cập nhật previous length và emoji - luôn cập nhật để tránh trigger lại
    previousReactionsLength.current = reactions.length;
    previousDisplayEmoji.current = displayEmoji || '';
  }, [reactions.length, displayEmoji, reactionScaleAnim, reactionTranslateX, reactionTranslateY, reactionRotate, reactionOpacity]);

  // Swipe to reply - chỉ cho tin nhắn nhận được (không phải của mình)
  // renderRightActions: hiển thị khi swipe từ phải sang trái (kéo sang trái) - đây là cái ta cần
  const renderSwipeRightActions = (progress: Animated.AnimatedInterpolation<number>, dragX: Animated.AnimatedInterpolation<number>) => {
    if (isOwnMessage || !onReply) return null;
    
    // Smooth animation với scale và opacity - mượt mà hơn với nhiều điểm interpolation
    const scale = progress.interpolate({
      inputRange: [0, 0.2, 0.5, 0.8, 1],
      outputRange: [0.9, 0.92, 0.95, 0.98, 1],
      extrapolate: 'clamp',
    });
    
    const opacity = progress.interpolate({
      inputRange: [0, 0.1, 0.3, 0.6, 1],
      outputRange: [0, 0.5, 0.8, 0.95, 1],
      extrapolate: 'clamp',
    });

    // Smooth translateX để action xuất hiện mượt mà hơn với nhiều điểm
    const translateX = dragX.interpolate({
      inputRange: [-150, -100, -50, 0],
      outputRange: [0, 5, 12, 20],
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
          <Text style={dynamicStyles.swipeActionText}>Trả lời</Text>
        </Animated.View>
      </View>
    );
  };

  const handleSwipeableOpen = () => {
    // Trigger reply when swiped fully left (kéo sang trái)
    if (!isOwnMessage && onReply) {
      // Haptic feedback khi swipe thành công
      try {
        if (Haptics && Haptics.impactAsync) {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
      } catch (error) {
        // Haptics not available, ignore
      }
      
      // Trigger reply ngay lập tức để mượt mà hơn
      onReply(message);
      
      // Close swipe sau một chút để user thấy action
      setTimeout(() => {
        swipeableRef.current?.close();
      }, 150);
    }
  };

  // Chỉ hiệu ứng khi long press, không phải khi chạm thường
  const handleLongPress = (event: any) => {
    if (!onLongPress) return;
    
    // Get position of the press
    const { pageX, pageY } = event.nativeEvent;
    
    // Haptic feedback (only if available) - sử dụng Light cho mượt hơn
    try {
      if (Haptics && Haptics.impactAsync) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    } catch (error) {
      // Haptics not available, ignore
    }
    
    // Scale animation khi long press trigger
    Animated.sequence([
      Animated.spring(pressScaleAnim, {
        toValue: 0.95,
        useNativeDriver: true,
        tension: 400,
        friction: 8,
      }),
      Animated.spring(pressScaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 300,
        friction: 10,
      }),
    ]).start();
    
    // Call callback with message and position
    onLongPress(message, { x: pageX, y: pageY });
  };

  // Special rendering for system messages - centered with icon
  if (isSystemMessage) {
    const content = message.content || '';
    const iconName = content.includes('đã tạo nhóm') ? 'account-group' : 
                     content.includes('đã tham gia') ? 'account-plus' : 
                     'information';
    
    return (
      <View style={styles.systemMessageWrapper}>
        <View style={styles.systemMessageContainer}>
          <View style={styles.systemMessageIcon}>
            <MaterialCommunityIcons 
              name={iconName}
              size={16} 
              color={isDarkMode ? '#8E8E93' : '#8E8E93'} 
            />
          </View>
          <Text style={[styles.systemMessageText, { color: isDarkMode ? '#8E8E93' : '#8E8E93' }]}>
            {content}
          </Text>
        </View>
      </View>
    );
  }

  const messageContent = (
    <Animated.View
      style={[
        {
          transform: [{ scale: pressScaleAnim }],
          opacity: pressOpacityAnim,
        },
      ]}
    >
      <Pressable
        ref={bubbleRef}
        style={[
          styles.container,
          isOwnMessage ? styles.ownContainer : styles.otherContainer,
        ]}
        onLongPress={handleLongPress}
        delayLongPress={180}
      >
        {/* Avatar - chỉ hiển thị cho tin nhắn của người khác, không hiển thị cho tin nhắn của mình */}
        {showAvatar && !isOwnMessage && (
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
        
        {/* Spacer when avatar is not shown - chỉ cho tin nhắn của người khác, không cho tin nhắn của mình */}
        {!showAvatar && !isOwnMessage && <View style={styles.avatarSpacer} />}
        
        {/* Message Content - cần position relative để reaction icon absolute hoạt động đúng */}
        <View style={[styles.messageContent, { position: 'relative' }]}>
        {/* Special rendering for sticker messages - no bubble, just sticker */}
        {isStickerMessage ? (
          stickerUrl ? (
            <View style={[styles.stickerWrapper, { alignItems: isOwnMessage ? 'flex-end' : 'flex-start' }]}>
              <View style={styles.stickerContainer}>
                <Image
                  source={{ uri: stickerUrl }}
                  style={styles.stickerImage}
                  contentFit="contain"
                  cachePolicy="memory-disk"
                  transition={0}
                />
              </View>
            </View>
          ) : isLoadingStickers ? (
            // Show loading placeholder while fetching sticker packs
            <View style={[styles.bubble, isOwnMessage ? styles.ownBubble : styles.otherBubble]}>
              <Text style={[dynamicStyles.text, isOwnMessage ? styles.ownText : { color: otherTextColor }]}>
                Đang tải sticker...
              </Text>
            </View>
          ) : (
            // Fallback: show error message if sticker not found
            <View style={[styles.bubble, isOwnMessage ? styles.ownBubble : styles.otherBubble]}>
              <Text style={[dynamicStyles.text, isOwnMessage ? styles.ownText : { color: otherTextColor }]}>
                ⚠️ Sticker không tìm thấy
              </Text>
            </View>
          )
        ) : message.type === 'call' ? (
          <View
            style={[
              styles.bubble,
              isOwnMessage ? styles.ownBubble : styles.otherBubble,
              isOwnMessage ? styles.ownCallBubble : styles.otherCallBubble,
            ]}
          >
            <Text
              style={[
                dynamicStyles.text,
                isOwnMessage ? styles.ownText : { color: otherTextColor },
              ]}
            >
              {message.content || (message.call_status === 'canceled' ? 'Bạn đã huỷ' : 'Cuộc gọi')}
            </Text>
          </View>
        ) : (
          <View
            style={[
              styles.bubble,
              isOwnMessage ? styles.ownBubble : styles.otherBubble,
              {
                // Remove background color for image-only messages (like Zalo)
                // Sticker messages don't use this bubble (handled separately above)
                backgroundColor: isImageOnly ? 'transparent' : (isOwnMessage ? '#3390EC' : (isDarkMode ? '#2B2B2B' : '#E4E6EB')),
                // Remove padding for image-only messages
                paddingHorizontal: isImageOnly ? 0 : 10,
                paddingVertical: isImageOnly ? 0 : 6,
                // Thêm paddingBottom khi có reaction để tránh che nội dung (tăng lên 12 để đảm bảo không che)
                paddingBottom: (reactions.length > 0 && displayEmoji && !isImageOnly) ? 12 : undefined,
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
                style={[
                  styles.imageContainer,
                  {
                    width: imageDisplayWidth,
                    height: imageDisplayHeight,
                  }
                ]}
              >
                <Image
                  source={{ uri: fullImageUrl }}
                  style={[
                    styles.image,
                    {
                      width: imageDisplayWidth,
                      height: imageDisplayHeight,
                    }
                  ]}
                  contentFit="contain"
                  cachePolicy="memory-disk"
                  transition={0}
                  onError={() => {
                    // Image failed to load
                  }}
                  onLoad={() => {
                    // Image loaded successfully - dimensions will be updated via useEffect
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
                  contentFit="cover"
                  cachePolicy="memory-disk"
                  transition={0}
                />
                <View style={styles.videoOverlay}>
                  <MaterialCommunityIcons name="play-circle" size={48} color="#FFFFFF" />
                </View>
                <View style={styles.videoLabel}>
                  <MaterialCommunityIcons name="video" size={14} color="#FFFFFF" />
                  <Text style={dynamicStyles.videoLabelText}>Video</Text>
                </View>
              </View>
            )}

            {/* Display text content if available and not just emoji placeholder */}
            {/* Hide text if it's just an emoji placeholder (📷 or 🎥) when media is present */}
            {/* Hide text for sticker messages - sticker is rendered separately */}
            {!!message.content && message.content.trim() && 
             !isStickerMessage && // Don't show text content for sticker messages
             !(fullImageUrl && message.content.trim().match(/^📷\s*Ảnh?$/)) &&
             !(fullVideoUrl && message.content.trim().match(/^🎥\s*Video?$/)) && (
              <TextWithLinks
                text={message.content}
                textStyle={[
                  dynamicStyles.text,
                  isOwnMessage ? styles.ownText : { color: otherTextColor },
                  (fullImageUrl || fullVideoUrl) && styles.textWithMedia,
                  // Thêm marginBottom khi có reaction để tránh che nội dung
                  (reactions.length > 0 && displayEmoji) && { marginBottom: 6 },
                ]}
                linkStyle={[
                  styles.link,
                  isOwnMessage ? styles.ownLink : styles.otherLink,
                ]}
              />
            )}
            
            {/* Show placeholder text only if media failed to load - but NOT for sticker messages */}
            {!isStickerMessage && ((isImageMessage && !fullImageUrl) || (isVideoMessage && !fullVideoUrl)) && message.content && (
              <TextWithLinks
                text={message.content}
                textStyle={[
                  dynamicStyles.text,
                  isOwnMessage ? styles.ownText : { color: otherTextColor },
                ]}
                linkStyle={[
                  styles.link,
                  isOwnMessage ? styles.ownLink : styles.otherLink,
                ]}
              />
            )}

            {/* Status icon inside bubble (like Facebook) - chỉ hiển thị icon, không có timestamp */}
            {isOwnMessage && (
              <View style={[
                styles.statusContainerInline,
                isImageOnly && styles.statusContainerImageOnly
              ]}>
                {(() => {
                  const status = message.status || 'sent';
                  // Facebook-style status icons
                  if (status === 'read') {
                    // Two blue checkmarks (đã xem) - màu xanh giống Facebook Messenger
                    return (
                      <MaterialCommunityIcons 
                        name="check-all" 
                        size={14} 
                        color={isImageOnly ? "#0084ff" : "#0084ff"} 
                      />
                    );
                  } else if (status === 'delivered') {
                    // Two gray checkmarks (đã nhận) - màu xám trắng
                    return (
                      <MaterialCommunityIcons 
                        name="check-all" 
                        size={14} 
                        color={isImageOnly ? "rgba(0,0,0,0.5)" : "rgba(255,255,255,0.7)"} 
                      />
                    );
                  } else {
                    // Single gray checkmark (đã gửi) - một dấu tích xám trắng
                    return (
                      <MaterialCommunityIcons 
                        name="check" 
                        size={14} 
                        color={isImageOnly ? "rgba(0,0,0,0.5)" : "rgba(255,255,255,0.7)"} 
                      />
                    );
                  }
                })()}
              </View>
            )}

            {/* Reactions display - Facebook style - ở góc dưới bên phải, hơi chồng lên bubble */}
            {/* Hiển thị ngay cả khi scale = 0 để animation hoạt động, nhưng chỉ khi có reactions và emoji hợp lệ */}
            {/* Key prop để force re-render khi displayEmoji thay đổi */}
            {(reactions.length > 0 && displayEmoji && displayEmoji.trim() !== '') && (
              <Animated.View 
                key={`reaction-${message.id}-${displayEmoji}`} // Key để force re-render khi emoji thay đổi
                style={[
                  styles.reactionIconContainer,
                  isOwnMessage ? styles.reactionIconRight : styles.reactionIconLeft,
                  {
                    transform: [
                      { translateX: reactionTranslateX },
                      { translateY: reactionTranslateY },
                      { 
                        rotate: reactionRotate.interpolate({
                          inputRange: [-180, 180],
                          outputRange: ['-180deg', '180deg'],
                        })
                      },
                      { scale: reactionScaleAnim }
                    ],
                    opacity: reactionOpacity, // Opacity riêng để mượt hơn
                  }
                ]}
              >
                <Text style={dynamicStyles.reactionEmojiIcon}>{displayEmoji}</Text>
              </Animated.View>
            )}
          </View>
        )}

        {/* Timestamp và Read receipt bên dưới bubble (Facebook style) */}
        {(showTime || (isOwnMessage && message.status === 'read' && otherUserAvatar && (!nextMessage || nextMessage.sender_id !== currentUserId || nextMessage.status !== 'read'))) && (
          <View style={[
            styles.timestampBelowContainer,
            isOwnMessage ? styles.timestampBelowRight : styles.timestampBelowLeft,
            // Thêm marginBottom khi có reaction để tránh bị che
            (reactions.length > 0 && displayEmoji) && { marginBottom: 8 }
          ]}>
            {showTime && (
              <>
                <Text style={[
                  dynamicStyles.timestampBelow,
                  { color: isDarkMode ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)' }
                ]}>
                  {formatMessageTime(message.created_at)}
                </Text>
                {/* Hiển thị "Đã gửi X phút trước" cho tin nhắn cuối cùng của mình */}
                {isOwnMessage && (!nextMessage || nextMessage.sender_id !== currentUserId) && (
                  <Text style={[
                    dynamicStyles.timeAgoText,
                    { color: isDarkMode ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)' }
                  ]}>
                    {' • '}{formatTime(message.created_at)}
                  </Text>
                )}
                {/* Edited indicator */}
                {message.edited && isOwnMessage && (
                  <Text style={[
                    dynamicStyles.editedLabelBelow,
                    { color: isDarkMode ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)' }
                  ]}>
                    {' • Đã chỉnh sửa'}
                  </Text>
                )}
              </>
            )}
            {/* Read receipt - hiển thị "✓✓ [tên] đã xem" với avatar (giống Facebook) */}
            {isOwnMessage && message.status === 'read' && otherUserAvatar && (!nextMessage || nextMessage.sender_id !== currentUserId || nextMessage.status !== 'read') && (
              <View style={styles.readReceiptContainer}>
                {/* Double checkmark icon */}
                <MaterialCommunityIcons 
                  name="check-all" 
                  size={14} 
                  color="#0084ff" 
                  style={styles.readReceiptCheckmark}
                />
                {/* Avatar */}
                <Image
                  source={{ uri: getAvatarURL(otherUserAvatar) }}
                  style={styles.readReceiptAvatarImage}
                  contentFit="cover"
                  cachePolicy="memory-disk"
                />
                {/* User name */}
                <Text style={[dynamicStyles.readReceiptText, { color: isDarkMode ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.6)' }]}>
                  {otherUserName || message.full_name || message.username || 'Đã xem'}
                </Text>
                <Text style={[dynamicStyles.readReceiptText, { color: isDarkMode ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.6)' }]}>
                  {' đã xem'}
                </Text>
              </View>
            )}
          </View>
        )}

      </View>
    </Pressable>
    </Animated.View>
  );

  // Wrap with Swipeable only for received messages (not own messages)
  if (!isOwnMessage && onReply) {
    return (
      <Swipeable
        ref={swipeableRef}
        renderRightActions={renderSwipeRightActions}
        onSwipeableOpen={handleSwipeableOpen}
        overshootRight={false}
        overshootFriction={12}
        friction={1}
        rightThreshold={40}
        enablePanGesture={true}
        enableTrackpadTwoFingerGesture={false}
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
  systemMessageWrapper: {
    width: '100%',
    alignItems: 'center',
    marginVertical: 8,
    paddingHorizontal: 16,
  },
  systemMessageContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    maxWidth: '85%',
  },
  systemMessageIcon: {
    marginRight: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  systemMessageText: {
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
    flexShrink: 1,
  },
  wrapper: {
    width: '100%',
  },
  container: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 4,
    alignItems: 'flex-end',
  },
  ownContainer: {
    flexDirection: 'row-reverse',
    paddingLeft: 8, // Với row-reverse, paddingLeft là padding bên phải - giảm để tin nhắn sát bên phải hơn khi không có avatar
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
    maxWidth: '75%',
    flexDirection: 'column',
    alignItems: 'flex-end',
  },
  bubble: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 18,
    // Shadow giống Telegram - mạnh hơn và rõ ràng hơn
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  ownBubble: {
    borderRadius: 18,
    alignSelf: 'flex-end',
    // Shadow riêng cho own bubble - mạnh hơn giống Telegram
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 4,
  },
  otherBubble: {
    borderRadius: 18,
    alignSelf: 'flex-start',
    // Shadow riêng cho other bubble
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  ownCallBubble: {
    backgroundColor: '#2a2042',
  },
  otherCallBubble: {
    backgroundColor: '#222',
  },
  text: {
    fontSize: 16, // Will be overridden by dynamic styles
    lineHeight: 22,
  },
  ownText: {
    color: '#ffffff',
  },
  otherText: {
    color: '#000000',
  },
  link: {
    textDecorationLine: 'underline',
  },
  ownLink: {
    color: '#ffffff', // White link for own messages (on blue background)
    opacity: 0.9,
  },
  otherLink: {
    color: '#0084ff', // Telegram-like blue for other messages
  },
  imageContainer: {
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: 'transparent',
    marginBottom: 4,
  },
  image: {
    borderRadius: 12,
    backgroundColor: 'transparent',
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
  statusContainerInline: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
    alignSelf: 'flex-end',
  },
  statusContainerImageOnly: {
    marginTop: 2,
    paddingHorizontal: 4,
  },
  timestampBelowContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
    paddingHorizontal: 16,
    // Thêm marginBottom khi có reaction để tránh bị che
    marginBottom: 0, // Sẽ được set động trong component
  },
  timestampBelowRight: {
    justifyContent: 'flex-end',
  },
  timestampBelowLeft: {
    justifyContent: 'flex-start',
  },
  timestampBelow: {
    fontSize: 11,
    color: 'rgba(0,0,0,0.5)',
  },
  timeAgoText: {
    fontSize: 11,
    color: 'rgba(0,0,0,0.5)',
  },
  editedLabelBelow: {
    fontSize: 11,
    fontStyle: 'italic',
  },
  ownTime: {
    color: 'rgba(255,255,255,0.65)',
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
  // Reaction icon ở góc dưới bên phải của bubble, một nửa trong một nửa ngoài (giống Facebook)
  // Điều chỉnh để không che vào nội dung tin nhắn và phần thời gian
  reactionIconContainer: {
    position: 'absolute',
    bottom: -4, // Điều chỉnh để không che vào timestamp (từ -8 lên -4)
    right: -8, // Một nửa ngoài bubble (icon 24px, nên -8 sẽ có 12px trong, 12px ngoài)
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderWidth: 1.5,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },
  reactionIconRight: {
    right: -2,
  },
  reactionIconLeft: {
    right: -2, // Vẫn ở bên phải của bubble (góc dưới bên phải)
  },
  reactionEmojiIcon: {
    fontSize: 14, // Tăng từ 12 lên 14
  },
  // Giữ lại các styles cũ cho tương thích (nếu cần)
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
    color: '#0084FF',
  },
  otherReactionCount: {
    color: '#1f1f1f',
  },
  moreReactions: {
    fontSize: 11,
    fontWeight: '600',
    marginLeft: 2,
  },
  readReceiptContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginTop: 2,
    marginLeft: 8,
    paddingRight: 16,
  },
  readReceiptCheckmark: {
    marginRight: 4,
  },
  readReceiptAvatarImage: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    overflow: 'hidden',
    marginLeft: 4,
    marginRight: 4,
  },
  readReceiptText: {
    fontSize: 11,
    fontWeight: '400',
  },
  stickerWrapper: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    width: '100%',
  },
  stickerContainer: {
    width: 120,
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  stickerImage: {
    width: 120,
    height: 120,
  },
  stickerSenderName: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 0,
    marginBottom: 4,
    marginLeft: 0,
    alignSelf: 'flex-start',
  },
});

// Wrap với React.memo để tránh re-render không cần thiết, tối ưu performance
// Return true nếu props KHÔNG thay đổi (skip re-render), false nếu thay đổi (cần re-render)
export default React.memo(MessageBubble, (prevProps, nextProps) => {
  // So sánh các props quan trọng - return true nếu KHÔNG thay đổi (skip re-render)
  const propsEqual = (
    prevProps.message.id === nextProps.message.id &&
    prevProps.message.content === nextProps.message.content &&
    JSON.stringify(prevProps.message.reactions) === JSON.stringify(nextProps.message.reactions) &&
    prevProps.message.status === nextProps.message.status &&
    prevProps.message.edited === nextProps.message.edited &&
    prevProps.showTime === nextProps.showTime &&
    prevProps.showAvatar === nextProps.showAvatar &&
    prevProps.currentUserId === nextProps.currentUserId
  );
  
  return propsEqual; // true = skip re-render, false = re-render
});
