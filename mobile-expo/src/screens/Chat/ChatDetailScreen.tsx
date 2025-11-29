import React, { useState, useEffect, useRef, useCallback, useImperativeHandle, useMemo } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  Pressable,
  TouchableWithoutFeedback,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  ActivityIndicator,
  Alert,
  Modal,
  Dimensions,
  Animated,
  ScrollView,
} from 'react-native';
import { Image } from 'expo-image';
import { Text, Appbar, IconButton, Avatar } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRoute, useNavigation, useFocusEffect } from '@react-navigation/native';
import { useHeaderHeight } from '@react-navigation/elements';
import { StackNavigationProp } from '@react-navigation/stack';
import { ChatStackParamList } from '../../navigation/types';
import MessageBubble from '../../components/Chat/MessageBubble';
import TypingIndicator from '../../components/Chat/TypingIndicator';
import ReplyBar from '../../components/Chat/ReplyBar';
import MessageContextMenu from '../../components/Chat/MessageContextMenu';
import DeleteMessageDialog from '../../components/Chat/DeleteMessageDialog';
import UserProfileModal from '../../components/Chat/UserProfileModal';
import StickerPicker from '../../components/Chat/StickerPicker';
import { getAllStickerPacks, StickerPack, Sticker } from '../../data/stickerData';
import { stickerAPI } from '../../utils/api';
import { getStickerURL } from '../../utils/imageUtils';
// Clipboard is optional - use React Native Clipboard if expo-clipboard not available
import { Clipboard } from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import { useAuth } from '../../contexts/AuthContext';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { chatAPI, uploadAPI, friendsAPI } from '../../utils/api';
import useSocket from '../../hooks/useSocket';
import { formatDate, isDifferentDay, getTimeAgo, isRecentActivity } from '../../utils/dateUtils';
import { getAvatarURL, getInitials } from '../../utils/imageUtils';
import { useTheme } from '../../contexts/ThemeContext';
import { launchImageLibrary, launchCamera } from '../../utils/imagePicker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from 'react-native-toast-message';
import { isAdmin } from '../../utils/adminUtils';
import { spacing, typography, borderRadius } from '../../config/designTokens';

type ChatDetailNavigationProp = StackNavigationProp<ChatStackParamList>;

// Add Members Modal Component
const AddMembersModal: React.FC<{
  visible: boolean;
  onClose: () => void;
  conversationId: string | null;
  existingParticipants: any[];
  onMembersAdded: () => void;
  isDarkMode: boolean;
  colors: any;
}> = ({ visible, onClose, conversationId, existingParticipants, onMembersAdded, isDarkMode, colors }) => {
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const { user } = useAuth();
  
  // Get friends list
  const { data: friendsList = [], isLoading: isLoadingFriends } = useQuery({
    queryKey: ['following'],
    queryFn: async () => {
      try {
        const res = await friendsAPI.getFollowing();
        return Array.isArray(res.data) ? res.data : (res.data?.data || []);
      } catch (error) {
        console.error('Error fetching friends list:', error);
        return [];
      }
    },
    enabled: visible && !!conversationId,
  });

  // Filter out existing participants, current user, and bot/system users
  const availableFriends = React.useMemo(() => {
    const existingIds = existingParticipants.map((p: any) => String(p.id));
    return friendsList.filter((friend: any) => {
      const friendId = String(friend.id || friend.user_id);
      
      // Skip current user
      if (friendId === String(user?.id)) return false;
      
      // Skip existing participants
      if (existingIds.includes(friendId)) return false;
      
      // Skip bot/system users
      const name = (friend.full_name || friend.username || '').toLowerCase();
      const username = (friend.username || '').toLowerCase();
      const isBot = 
        name.includes('chat') ||
        name.includes('bot') ||
        name.includes('hệ thống') ||
        name.includes('system') ||
        name.includes('zyea') ||
        username.includes('chat') ||
        username.includes('bot') ||
        username.includes('system') ||
        username.includes('zyea') ||
        friend.role === 'system' ||
        friend.is_bot === true ||
        friend.is_bot === 1;
      
      return !isBot;
    });
  }, [friendsList, existingParticipants, user?.id]);

  // Filter by search query
  const filteredFriends = React.useMemo(() => {
    if (!searchQuery.trim()) return availableFriends;
    const query = searchQuery.toLowerCase();
    return availableFriends.filter((friend: any) => {
      const name = (friend.full_name || friend.username || '').toLowerCase();
      const username = (friend.username || '').toLowerCase();
      return name.includes(query) || username.includes(query);
    });
  }, [availableFriends, searchQuery]);

  // Add members mutation
  const addMembersMutation = useMutation({
    mutationFn: async (memberIds: string[]) => {
      if (!conversationId) throw new Error('Conversation ID is required');
      return chatAPI.addParticipants(conversationId, memberIds);
    },
    onSuccess: () => {
      Toast.show({
        type: 'success',
        text1: 'Thành công',
        text2: 'Đã thêm thành viên vào nhóm',
      });
      setSelectedMembers([]);
      onMembersAdded();
    },
    onError: (error: any) => {
      Toast.show({
        type: 'error',
        text1: 'Lỗi',
        text2: error?.response?.data?.message || 'Không thể thêm thành viên',
      });
    },
  });

  const handleToggleMember = (memberId: string) => {
    setSelectedMembers((prev) => {
      if (prev.includes(memberId)) {
        return prev.filter((id) => id !== memberId);
      } else {
        return [...prev, memberId];
      }
    });
  };

  const handleAddMembers = () => {
    if (selectedMembers.length === 0) {
      Toast.show({
        type: 'info',
        text1: 'Vui lòng chọn thành viên',
      });
      return;
    }
    addMembersMutation.mutate(selectedMembers);
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent={true}
    >
      <Pressable
        style={[styles.modalOverlay, { backgroundColor: 'rgba(0, 0, 0, 0.5)' }]}
        onPress={onClose}
      >
        <Pressable 
          style={[
            styles.mediaPickerContainer, 
            { 
              backgroundColor: colors.background,
              borderTopLeftRadius: 20,
              borderTopRightRadius: 20,
              maxHeight: '80%',
            }
          ]}
          onPress={() => {}}
        >
        <View style={[styles.mediaPickerHandle, { backgroundColor: isDarkMode ? '#3a3a3b' : '#d0d0d0' }]} />
        <View style={styles.mediaPickerContent}>
          <View style={styles.addMembersHeader}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              Thêm thành viên
            </Text>
            <TouchableOpacity onPress={onClose}>
              <MaterialCommunityIcons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>
          
          <View style={[
            styles.addMembersSearchbar,
            { backgroundColor: isDarkMode ? '#2a2a2b' : '#f0f0f0' }
          ]}>
            <MaterialCommunityIcons 
              name="magnify" 
              size={20} 
              color={colors.textSecondary} 
              style={{ marginRight: 8 }}
            />
            <TextInput
              placeholder="Tìm kiếm bạn bè..."
              placeholderTextColor={colors.textSecondary}
              value={searchQuery}
              onChangeText={setSearchQuery}
              style={[
                { flex: 1, color: colors.text, fontSize: typography.fontSize.md }
              ]}
            />
          </View>

          {isLoadingFriends ? (
            <View style={styles.addMembersLoading}>
              <ActivityIndicator size="large" color={colors.primary} />
            </View>
          ) : (
            <FlatList
              data={filteredFriends}
              keyExtractor={(item) => String(item.id || item.user_id)}
              renderItem={({ item }) => {
                const memberId = String(item.id || item.user_id);
                const isSelected = selectedMembers.includes(memberId);
                return (
                  <TouchableOpacity
                    style={[
                      styles.participantItem,
                      { 
                        borderBottomColor: colors.border || (isDarkMode ? '#2a2a2b' : '#E0E0E0'),
                        backgroundColor: isSelected ? (isDarkMode ? '#2a2a2b' : '#f0f0f0') : 'transparent',
                      }
                    ]}
                    onPress={() => handleToggleMember(memberId)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.participantAvatar}>
                      {item.avatar_url ? (
                        <Avatar.Image
                          size={50}
                          source={{ uri: getAvatarURL(item.avatar_url) }}
                        />
                      ) : (
                        <Avatar.Text
                          size={50}
                          label={(item.full_name || item.username || 'U').substring(0, 1).toUpperCase()}
                          style={{ backgroundColor: colors.primary || '#0084ff' }}
                        />
                      )}
                    </View>
                    <View style={[styles.participantInfo, { flex: 1 }]}>
                      <Text 
                        style={[styles.participantName, { color: colors.text }]}
                        numberOfLines={1}
                      >
                        {item.full_name || item.username || 'Người dùng'}
                      </Text>
                      {item.username && item.full_name && (
                        <Text 
                          style={[styles.participantUsername, { color: colors.textSecondary }]}
                          numberOfLines={1}
                        >
                          {item.username}
                        </Text>
                      )}
                    </View>
                    {isSelected && (
                      <MaterialCommunityIcons 
                        name="check-circle" 
                        size={24} 
                        color={colors.primary || '#0084ff'} 
                      />
                    )}
                  </TouchableOpacity>
                );
              }}
              ListEmptyComponent={
                <View style={styles.emptyParticipantsContainer}>
                  <Text style={[styles.emptyParticipantsText, { color: colors.textSecondary }]}>
                    {searchQuery ? 'Không tìm thấy bạn bè' : 'Không có bạn bè nào để thêm'}
                  </Text>
                </View>
              }
            />
          )}

          {selectedMembers.length > 0 && (
            <TouchableOpacity
              style={[
                styles.addMembersButton,
                { 
                  backgroundColor: colors.primary || '#0084ff',
                  opacity: addMembersMutation.isPending ? 0.6 : 1,
                }
              ]}
              onPress={handleAddMembers}
              disabled={addMembersMutation.isPending}
            >
              {addMembersMutation.isPending ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.addMembersButtonText}>
                  Thêm {selectedMembers.length} thành viên
                </Text>
              )}
            </TouchableOpacity>
          )}
        </View>
      </Pressable>
    </Pressable>
    </Modal>
  );
};

// Inline Sticker Picker Component for emoji panel tab
const StickerPickerInline = React.forwardRef<{ scrollToPack: (packId: string) => void }, {
  onSelectSticker: (packId: string, stickerIndex: number, sticker: any) => void;
  isDarkMode: boolean;
  colors: any;
  onKeyboardShow?: () => void;
  onKeyboardHide?: () => void;
  isAdmin?: boolean;
  onStickerAdded?: () => void;
  onScrollChange?: (isScrollingDown: boolean, scrollY: number) => void; // Callback để ẩn/hiện tabs
  maxHeight?: number; // Chiều cao tối đa của emoji panel để mở rộng full
  userId?: string; // User ID để lưu recent stickers riêng cho từng user
  topTabs?: React.ReactNode; // Tabs ở trên (Search, GIF, Emoji, Sticker, Pencil)
  onScrollToPack?: (packId: string) => void; // Callback để scroll đến pack
}>(({ onSelectSticker, isDarkMode, colors, onKeyboardShow, onKeyboardHide, isAdmin = false, onStickerAdded, onScrollChange, maxHeight = 480, userId, topTabs, onScrollToPack }, ref) => {
  const [selectedPackIndex, setSelectedPackIndex] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [recentStickers, setRecentStickers] = useState<Array<{packId: string, stickerIndex: number, sticker: any}>>([]);
  const [isUploadingSticker, setIsUploadingSticker] = useState(false);
  const searchInputRef = useRef<TextInput>(null);
  const queryClient = useQueryClient();
  const { width: SCREEN_WIDTH } = Dimensions.get('window');
  const packTabsFlatListRef = useRef<FlatList>(null);
  const stickerScrollViewRef = useRef<ScrollView>(null);
  const packSectionRefs = useRef<{ [key: string]: View | null }>({});
  const packSectionPositions = useRef<{ [key: string]: number }>({});
  
  // Kích thước sticker nhỏ hơn để hiển thị nhiều sticker hơn (giống ảnh: 4-5 cột)
  const STICKER_SIZE = 60; // Giảm từ 65 xuống 60 để hiển thị nhiều hơn
  const STICKER_MARGIN = 2; // Giảm margin để tiết kiệm không gian
  const STICKER_PADDING = 4; // Giảm padding để tiết kiệm không gian
  const PACK_ICON_SIZE = 40; // Kích thước icon cho pack tabs
  
  // Tính maxHeight để tránh tràn ra ngoài emoji panel
  // Sử dụng maxHeight từ props để mở rộng full từ trên xuống dưới
  const MAX_STICKER_PANEL_HEIGHT = maxHeight; // Sử dụng maxHeight từ emoji panel (400px)
  const PACK_TABS_HEIGHT = 60;
  
  // Tính availableHeight trước khi dùng
  // Khi pack tabs hiện: maxHeight - 60px
  // Khi pack tabs ẩn: sticker grid mở rộng full lên maxHeight (400px)
  const availableHeight = MAX_STICKER_PANEL_HEIGHT - PACK_TABS_HEIGHT; // = 340px khi maxHeight = 400

  // Animation config constants - tối ưu cho mượt mà hơn (giống Zalo)
  const ANIMATION_CONFIG = {
    tension: 100,
    friction: 8,
    useNativeDriver: true,
  };
  
  // Scroll detection để ẩn/hiện header - tối ưu cho responsive hơn (giống Telegram)
  const scrollY = useRef(new Animated.Value(0)).current;
  const lastScrollY = useRef(0);
  const lastScrollTime = useRef(0);
  const scrollVelocity = useRef(0); // Tốc độ cuộn
  const scrollDirection = useRef<'up' | 'down'>('up');
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);
  const headerAnimValue = useRef(new Animated.Value(1)).current; // 1 = visible, 0 = hidden
  const headerTranslateY = useRef(new Animated.Value(0)).current; // 0 = visible, -headerHeight = hidden
  const isAnimating = useRef(false); // Tránh trigger animation nhiều lần
  const animationFrameId = useRef<number | null>(null);
  const lastActionTime = useRef(0); // Thời gian của action cuối cùng để tránh toggle quá nhanh
  const ACTION_COOLDOWN = 200; // Cooldown 200ms (giảm từ 300ms) để responsive hơn
  
  // Tính chiều cao header (top tabs + pack tabs)
  const TOP_TABS_HEIGHT = 50; // Chiều cao ước tính của top tabs
  const HEADER_TOTAL_HEIGHT = TOP_TABS_HEIGHT + PACK_TABS_HEIGHT; // Tổng chiều cao header
  
  // Cleanup animation frame khi component unmount
  useEffect(() => {
    return () => {
      if (animationFrameId.current !== null) {
        cancelAnimationFrame(animationFrameId.current);
      }
      // Reset animation state khi unmount
      isAnimating.current = false;
    };
  }, []);

  // Reset header về trạng thái hiện khi component mount hoặc visible
  // Đảm bảo không bị stuck ở trạng thái ẩn
  useEffect(() => {
    // Reset về trạng thái ban đầu khi component mount
    // Tính lại availableHeight để đảm bảo đúng với maxHeight hiện tại
    const currentAvailableHeight = MAX_STICKER_PANEL_HEIGHT - PACK_TABS_HEIGHT;
    setIsHeaderVisible(true);
    setHeaderHeightState(PACK_TABS_HEIGHT);
    setStickerGridHeightState(currentAvailableHeight);
    headerAnimValue.setValue(1);
    headerTranslateY.setValue(0);
    isAnimating.current = false;
    lastScrollY.current = 0;
    scrollDirection.current = 'up';
  }, [MAX_STICKER_PANEL_HEIGHT]); // Chạy khi mount hoặc maxHeight thay đổi
  
  // Dùng state thông thường cho height (không dùng Animated vì không hỗ trợ native driver)
  // headerHeightState chỉ cho pack tabs (đã xóa search bar)
  const [headerHeightState, setHeaderHeightState] = useState(PACK_TABS_HEIGHT);
  const [stickerGridHeightState, setStickerGridHeightState] = useState(availableHeight);
  const [expandedHeight, setExpandedHeight] = useState(MAX_STICKER_PANEL_HEIGHT); // Chiều cao mở rộng khi cuộn
  
  // Safety timeout để reset animation nếu bị stuck
  useEffect(() => {
    const safetyInterval = setInterval(() => {
      if (isAnimating.current) {
        const timeSinceLastAction = Date.now() - lastActionTime.current;
        // Nếu animation bị stuck quá 2 giây, reset
        if (timeSinceLastAction > 2000) {
          console.warn('StickerPicker: Animation stuck, resetting...');
          isAnimating.current = false;
        }
      }
    }, 1000);
    
    return () => clearInterval(safetyInterval);
  }, []);

  const headerOpacity = headerAnimValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });
  
  const headerTranslate = headerTranslateY.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -HEADER_TOTAL_HEIGHT], // Translate toàn bộ header (top tabs + pack tabs)
    extrapolate: 'clamp',
  });
  
  // Không cần translateY nữa vì đã xóa pack tabs header
  const stickerGridTranslateY = new Animated.Value(0);

  // Fetch sticker packs from API
  const { data: stickerPacksData = [], refetch: refetchStickerPacks } = useQuery({
    queryKey: ['sticker-packs'],
    queryFn: async () => {
      const response = await stickerAPI.getStickerPacks();
      return response.data.packs || [];
    },
    staleTime: 5 * 60 * 1000, // 5 phút - sticker packs không thay đổi thường xuyên
    gcTime: 15 * 60 * 1000, // 15 phút cache
  });

  // Auto refresh sticker packs khi mở emoji panel với sticker tab
  // Note: showStickerPicker không tồn tại trong StickerPickerInline, chỉ check activeEmojiTab
  // useEffect này sẽ được xử lý trong ChatDetailScreen component cha

  // Load recent stickers - riêng cho từng user
  useEffect(() => {
    const loadRecentStickers = async () => {
      if (!userId) return; // Không load nếu không có userId
      
      try {
        // Sử dụng key riêng cho từng user
        const storageKey = `recent_stickers_${userId}`;
        const stored = await AsyncStorage.getItem(storageKey);
        if (stored && Array.isArray(stickerPacksData) && stickerPacksData.length > 0) {
          const parsed = JSON.parse(stored);
          // Convert stored data back to sticker sources
          const recent: Array<{packId: string, stickerIndex: number, sticker: Sticker}> = [];
          for (const item of parsed) {
            const pack = (stickerPacksData as StickerPack[]).find(p => p && p.id === item.packId);
            if (pack && pack.stickers && pack.stickers[item.stickerIndex]) {
              recent.push({
                packId: item.packId,
                stickerIndex: item.stickerIndex,
                sticker: pack.stickers[item.stickerIndex],
              });
            }
          }
          // Giới hạn tối đa 30 sticker gần đây để hiển thị nhiều hơn
          setRecentStickers(recent.slice(0, 30));
        }
      } catch (e) {
        console.log('Error loading recent stickers:', e);
      }
    };
    loadRecentStickers();
  }, [stickerPacksData, userId]);

  // Xử lý keyboard - ẩn emoji panel khi keyboard hiện để tránh bị đẩy xuống
  useEffect(() => {
    const keyboardWillShow = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      () => {
        // Ẩn emoji panel khi keyboard hiện
        if (onKeyboardShow) {
          onKeyboardShow();
        }
      }
    );

    const keyboardWillHide = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => {
        // Hiện lại emoji panel khi keyboard ẩn (nếu đang mở)
        if (onKeyboardHide) {
          onKeyboardHide();
        }
      }
    );

    return () => {
      keyboardWillShow.remove();
      keyboardWillHide.remove();
    };
  }, [onKeyboardShow, onKeyboardHide]);

  // Filter out empty packs - đảm bảo stickerPacksData là array
  const availablePacks = Array.isArray(stickerPacksData) 
    ? (stickerPacksData as StickerPack[]).filter(pack => pack && pack.stickers && pack.stickers.length > 0)
    : [];
  
  // Tạo pack list với "GẦN ĐÂY" ở đầu - luôn có ít nhất recent tab
  const packsWithRecent = [
    { id: 'recent', title: 'GẦN ĐÂY', stickers: recentStickers.map(r => r.sticker), isRecent: true },
    ...availablePacks,
  ];

  // Function để scroll đến pack cụ thể
  const scrollToPack = (packId: string) => {
    const packIndex = packsWithRecent.findIndex(p => p.id === packId);
    if (packIndex >= 0) {
      setSelectedPackIndex(packIndex);
      // Scroll pack tabs header đến vị trí của pack tab
      if (packTabsFlatListRef.current) {
        try {
          packTabsFlatListRef.current.scrollToIndex({ 
            index: packIndex, 
            animated: true,
            viewPosition: 0.5,
          });
        } catch (e) {
          // Ignore error if index is out of bounds
        }
      }
      // Scroll đến section pack trong ScrollView
      setTimeout(() => {
        const packPosition = packSectionPositions.current[packId];
        if (packPosition !== undefined && stickerScrollViewRef.current) {
          // Scroll đến vị trí đã lưu
          stickerScrollViewRef.current.scrollTo({ 
            y: Math.max(0, packPosition - 10), 
            animated: true 
          });
        } else {
          // Fallback: dùng measureLayout nếu chưa có position
          const packRef = packSectionRefs.current[packId];
          if (packRef && stickerScrollViewRef.current) {
            packRef.measureLayout(
              stickerScrollViewRef.current as any,
              (x, y) => {
                if (stickerScrollViewRef.current) {
                  stickerScrollViewRef.current.scrollTo({ 
                    y: Math.max(0, y - 10), 
                    animated: true 
                  });
                }
              },
              () => {}
            );
          }
        }
      }, 150);
    }
  };

  // Expose scrollToPack function via ref
  useImperativeHandle(ref, () => ({
    scrollToPack,
  }), [packsWithRecent]);

  // Đảm bảo selectedPackIndex không vượt quá số lượng packs
  const safeSelectedPackIndex = Math.min(selectedPackIndex, Math.max(0, packsWithRecent.length - 1));
  
  // Auto fix selectedPackIndex nếu vượt quá
  useEffect(() => {
    if (selectedPackIndex >= packsWithRecent.length && packsWithRecent.length > 0) {
      setSelectedPackIndex(0); // Reset về recent tab
    }
  }, [packsWithRecent.length, selectedPackIndex]);

  // Xác định pack hiện tại - với safe fallback
  const currentPackData = packsWithRecent[safeSelectedPackIndex] || packsWithRecent[0];
  const isRecentTab = currentPackData?.id === 'recent' || (currentPackData && 'isRecent' in currentPackData && currentPackData.isRecent);
  const currentStickers = isRecentTab 
    ? (Array.isArray(recentStickers) ? recentStickers.map(r => r.sticker).filter(Boolean) : [])
    : (Array.isArray(currentPackData?.stickers) ? currentPackData.stickers.filter(Boolean) : []);

  // Filter stickers theo search query - đảm bảo currentStickers là array
  const filteredStickers = Array.isArray(currentStickers)
    ? (searchQuery.trim() 
        ? currentStickers.filter((_, index) => {
            // Simple search - có thể mở rộng sau
            return true; // Tạm thời hiển thị tất cả
          })
        : currentStickers)
    : [];

  // Tính số cột
  const horizontalPadding = STICKER_PADDING * 2;
  const numColumns = Math.floor((SCREEN_WIDTH - horizontalPadding) / (STICKER_SIZE + STICKER_MARGIN * 2));

  // Admin: Handle adding sticker to pack
  const handleAddSticker = async () => {
    if (!isAdmin) return;
    
    // Kiểm tra nếu không có pack nào
    if (availablePacks.length === 0) {
      Alert.alert(
        'Thông báo', 
        'Chưa có sticker pack nào. Vui lòng tạo pack mới từ admin panel trước.',
        [{ text: 'OK' }]
      );
      return;
    }
    
    // Get current pack (skip recent tab which is at index 0)
    const safeIndex = Math.min(selectedPackIndex, Math.max(0, packsWithRecent.length - 1));
    const currentPackData = packsWithRecent[safeIndex];
    
    if (!currentPackData || currentPackData.id === 'recent' || ('isRecent' in currentPackData && currentPackData.isRecent)) {
      // Nếu đang ở recent tab, chuyển sang pack đầu tiên
      if (availablePacks.length > 0) {
        setSelectedPackIndex(1); // Index 1 là pack đầu tiên (sau recent tab)
        // Retry after a short delay
        setTimeout(() => {
          handleAddSticker();
        }, 100);
        return;
      } else {
        Alert.alert('Lỗi', 'Vui lòng chọn một pack để thêm sticker (không phải tab GẦN ĐÂY)');
        return;
      }
    }
    
    const currentPack = currentPackData;

    try {
      // Open image picker
      const result = await launchImageLibrary({
        mediaType: 'photo',
        quality: 0.8,
      });

      if (result.didCancel || !result.assets || result.assets.length === 0) {
        return;
      }

      const imageUri = result.assets[0].uri;
      setIsUploadingSticker(true);

      // Create FormData
      const formData = new FormData();
      const imageName = imageUri.split('/').pop() || 'sticker.png';
      const imageType = imageUri.includes('.png') ? 'image/png' : 'image/jpeg';
      
      formData.append('sticker', {
        uri: imageUri,
        type: imageType,
        name: imageName,
      } as any);

      // Upload sticker
      await stickerAPI.addSticker(currentPack.id, formData);
      
      // Invalidate và refetch sticker packs
      await queryClient.invalidateQueries({ queryKey: ['sticker-packs'] });
      await queryClient.refetchQueries({ queryKey: ['sticker-packs'] });
      
      Toast.show({
        type: 'success',
        text1: 'Thành công',
        text2: 'Đã thêm sticker vào pack',
      });

      // Auto refresh sau 1-2 giây
      setTimeout(async () => {
        await queryClient.invalidateQueries({ queryKey: ['sticker-packs'] });
        await queryClient.refetchQueries({ queryKey: ['sticker-packs'] });
        if (onStickerAdded) onStickerAdded();
      }, 1500);
    } catch (error: any) {
      console.error('Error adding sticker:', error);
      const errorMessage = error?.response?.data?.message || error?.message || 'Không thể thêm sticker';
      Alert.alert('Lỗi', errorMessage);
    } finally {
      setIsUploadingSticker(false);
    }
  };

  const handleStickerSelect = async (packId: string, stickerIndex: number, sticker: any) => {
    // Lưu vào recent stickers - riêng cho từng user
    if (!userId) {
      // Nếu không có userId, vẫn gọi onSelectSticker nhưng không lưu recent
      onSelectSticker(packId, stickerIndex, sticker);
      return;
    }
    
    try {
      const newRecent = [
        { packId, stickerIndex, timestamp: Date.now() },
        ...recentStickers
          .filter(r => !(r.packId === packId && r.stickerIndex === stickerIndex))
          .map(r => ({ packId: r.packId, stickerIndex: r.stickerIndex, timestamp: Date.now() }))
      ].slice(0, 20); // Giới hạn tối đa 30 sticker gần đây
      
      // Sử dụng key riêng cho từng user
      const storageKey = `recent_stickers_${userId}`;
      await AsyncStorage.setItem(storageKey, JSON.stringify(newRecent));
      
      // Update recent stickers state - chỉ lấy tối đa 30 sticker hợp lệ
      const updatedRecent: Array<{packId: string, stickerIndex: number, sticker: Sticker}> = [];
      if (Array.isArray(stickerPacksData)) {
        for (const item of newRecent) {
          const pack = (stickerPacksData as StickerPack[]).find(p => p && p.id === item.packId);
          if (pack && pack.stickers && pack.stickers[item.stickerIndex]) {
            updatedRecent.push({
              packId: item.packId,
              stickerIndex: item.stickerIndex,
              sticker: pack.stickers[item.stickerIndex],
            });
            // Giới hạn tối đa 30 sticker để hiển thị
            if (updatedRecent.length >= 30) break;
          }
        }
      }
      setRecentStickers(updatedRecent);
    } catch (e) {
      console.log('Error saving recent sticker:', e);
    }
    
    onSelectSticker(packId, stickerIndex, sticker);
  };

  const renderSticker = ({ item, index }: { item: Sticker; index: number }) => {
    // Tìm packId và stickerIndex từ recent stickers nếu là recent tab
    let packId = currentPackData?.id || 'default';
    let stickerIndex = index;
    
    if (isRecentTab && recentStickers[index]) {
      packId = recentStickers[index].packId;
      stickerIndex = recentStickers[index].stickerIndex;
    } else if (currentPackData && !isRecentTab) {
      packId = currentPackData.id;
      stickerIndex = index;
    }

    // Lấy URL từ sticker object
    const stickerUrl = getStickerURL(item.url);

    return (
      <TouchableOpacity
        style={{
          width: STICKER_SIZE,
          height: STICKER_SIZE,
          margin: STICKER_MARGIN,
          justifyContent: 'center',
          alignItems: 'center',
          borderRadius: 8,
        }}
        onPress={() => handleStickerSelect(packId, stickerIndex, item)}
        activeOpacity={0.6}
      >
        <Image
          source={{ uri: stickerUrl }}
          style={{
            width: STICKER_SIZE - 4,
            height: STICKER_SIZE - 4,
          }}
          resizeMode="contain"
          cachePolicy="memory-disk"
        />
      </TouchableOpacity>
    );
  };

  const renderPackTab = (pack: any, index: number) => {
    const isSelected = index === selectedPackIndex;
    const isRecent = pack.id === 'recent';
    
    // Lấy icon: sticker đầu tiên của pack (hoặc icon clock cho recent)
    const packIcon: Sticker | null = isRecent 
      ? null // Recent tab sẽ hiển thị text
      : (pack.stickers && pack.stickers.length > 0 ? pack.stickers[0] : null);
    
    const packIconUrl = packIcon ? getStickerURL(packIcon.url) : null;

    return (
      <TouchableOpacity
        key={pack.id}
        onPress={() => setSelectedPackIndex(index)}
        style={{
          width: isRecent ? 'auto' : PACK_ICON_SIZE,
          height: PACK_ICON_SIZE,
          marginHorizontal: 6,
          justifyContent: 'center',
          alignItems: 'center',
          borderRadius: isRecent ? 20 : PACK_ICON_SIZE / 2,
          backgroundColor: isSelected 
            ? (isDarkMode ? '#3a3a3b' : '#d0d0d0') 
            : (isDarkMode ? '#2a2a2b' : '#e0e0e0'),
          paddingHorizontal: isRecent ? 12 : 0,
        }}
        activeOpacity={0.7}
      >
        {isRecent ? (
          <Text
            style={{
              fontSize: 13,
              fontWeight: isSelected ? '600' : '500',
              color: isSelected ? colors.text : colors.textSecondary,
            }}
            numberOfLines={1}
          >
            {pack.title}
          </Text>
        ) : packIconUrl ? (
          <Image
            source={{ uri: packIconUrl }}
            style={{
              width: PACK_ICON_SIZE - 8,
              height: PACK_ICON_SIZE - 8,
              borderRadius: (PACK_ICON_SIZE - 8) / 2,
            }}
            resizeMode="cover"
            cachePolicy="memory-disk"
          />
        ) : (
          <View style={{
            width: PACK_ICON_SIZE - 8,
            height: PACK_ICON_SIZE - 8,
            borderRadius: (PACK_ICON_SIZE - 8) / 2,
            backgroundColor: isDarkMode ? '#3a3a3b' : '#d0d0d0',
            justifyContent: 'center',
            alignItems: 'center',
          }}>
            <Text style={{ fontSize: typography.fontSize.xs, color: colors.textSecondary }}>
              {pack.title.charAt(0)}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const handleScroll = (event: any) => {
    const currentScrollY = Math.max(0, event.nativeEvent.contentOffset.y); // Đảm bảo không âm
    const currentTime = Date.now();
    const scrollDiff = currentScrollY - lastScrollY.current;
    const timeDiff = currentTime - lastScrollTime.current;
    
    // Tính velocity (tốc độ cuộn) - pixels per millisecond
    if (timeDiff > 0) {
      scrollVelocity.current = Math.abs(scrollDiff) / timeDiff;
    }
    
    // Update scrollY cho animation
    scrollY.setValue(currentScrollY);
    
    // Notify parent component về scroll để ẩn/hiện tabs
    if (onScrollChange) {
      const isScrollingDown = scrollDiff > 0 && currentScrollY > 15;
      onScrollChange(isScrollingDown, currentScrollY);
    }
    
    // Cancel previous animation frame
    if (animationFrameId.current !== null) {
      cancelAnimationFrame(animationFrameId.current);
    }
    
    // Sử dụng requestAnimationFrame để xử lý mượt mà hơn
    animationFrameId.current = requestAnimationFrame(() => {
      // Chỉ xử lý khi không đang animate
      if (isAnimating.current) return;
      
      // Cooldown để tránh toggle quá nhanh
      const timeSinceLastAction = currentTime - lastActionTime.current;
      if (timeSinceLastAction < ACTION_COOLDOWN) return;
      
      // Threshold tối ưu - responsive hơn giống Zalo
      // Ẩn: cần cuộn xuống ít hơn để responsive hơn
      // Hiện: chỉ cần cuộn lên ít - tạo "dead zone" nhỏ hơn
      const HIDE_THRESHOLD = 30; // Giảm từ 50px xuống 30px để ẩn nhanh hơn
      const SHOW_THRESHOLD = 10; // Giảm từ 20px xuống 10px để hiện nhanh hơn
      const VELOCITY_THRESHOLD = 0.5; // Tốc độ cuộn tối thiểu (px/ms) để trigger nhanh
      
      // Edge case: Nếu scroll về đầu (scrollY = 0), reset height
      if (currentScrollY <= 0) {
        if (!isHeaderVisible) {
          lastActionTime.current = currentTime;
          isAnimating.current = true;
          setIsHeaderVisible(true);
          setExpandedHeight(MAX_STICKER_PANEL_HEIGHT); // Reset về chiều cao ban đầu
          
          Animated.parallel([
            Animated.spring(headerAnimValue, {
              toValue: 1,
              ...ANIMATION_CONFIG,
            }),
            Animated.spring(headerTranslateY, {
              toValue: 0,
              ...ANIMATION_CONFIG,
            }),
          ]).start(() => {
            isAnimating.current = false;
          });
          
          scrollDirection.current = 'up';
        }
        lastScrollY.current = currentScrollY;
        lastScrollTime.current = currentTime;
        return;
      }
      
      // Cập nhật scroll direction dựa trên scrollDiff
      if (Math.abs(scrollDiff) > 2) {
        scrollDirection.current = scrollDiff > 0 ? 'down' : 'up';
      }
      
      // Kiểm tra điều kiện ẩn - responsive hơn với velocity
      const isScrollingDownFast = scrollDiff > 0 && scrollVelocity.current > VELOCITY_THRESHOLD;
      const shouldHide = (currentScrollY > HIDE_THRESHOLD && scrollDiff > 0) || 
                        (isScrollingDownFast && currentScrollY > 15);
      
      // Kiểm tra điều kiện hiện - responsive hơn
      const isScrollingUp = scrollDiff < -5;
      const shouldShow = currentScrollY < SHOW_THRESHOLD || 
                        (isScrollingUp && scrollDirection.current === 'up');
      
      if (shouldHide && isHeaderVisible) {
        // Scroll down (vuốt lên) - mở rộng sticker grid để hiển thị nhiều hơn
        lastActionTime.current = currentTime;
        isAnimating.current = true;
        setIsHeaderVisible(false);
        // Mở rộng sticker grid lên trên, có thể vượt quá maxHeight để hiển thị nhiều hơn
        const expanded = Math.min(MAX_STICKER_PANEL_HEIGHT + 100, MAX_STICKER_PANEL_HEIGHT * 1.5); // Mở rộng thêm tối đa 50%
        setExpandedHeight(expanded);
        
        Animated.parallel([
          Animated.spring(headerAnimValue, {
            toValue: 0,
            ...ANIMATION_CONFIG,
          }),
          Animated.spring(headerTranslateY, {
            toValue: 1,
            ...ANIMATION_CONFIG,
          }),
        ]).start((finished) => {
          // Chỉ reset nếu animation hoàn thành (không bị cancel)
          if (finished) {
            isAnimating.current = false;
          } else {
            // Nếu bị cancel, reset sau một chút
            setTimeout(() => {
              isAnimating.current = false;
            }, 100);
          }
        });
        
        scrollDirection.current = 'down';
      } else if (shouldShow && !isHeaderVisible) {
        // Scroll up (vuốt xuống) hoặc về đầu - thu nhỏ lại
        lastActionTime.current = currentTime;
        isAnimating.current = true;
        setIsHeaderVisible(true);
        setExpandedHeight(MAX_STICKER_PANEL_HEIGHT); // Reset về chiều cao ban đầu
        
        Animated.parallel([
          Animated.spring(headerAnimValue, {
            toValue: 1,
            ...ANIMATION_CONFIG,
          }),
          Animated.spring(headerTranslateY, {
            toValue: 0,
            ...ANIMATION_CONFIG,
          }),
        ]).start((finished) => {
          // Chỉ reset nếu animation hoàn thành (không bị cancel)
          if (finished) {
            isAnimating.current = false;
          } else {
            // Nếu bị cancel, reset sau một chút
            setTimeout(() => {
              isAnimating.current = false;
            }, 100);
          }
        });
        
        scrollDirection.current = 'up';
      }
    });
    
    lastScrollY.current = currentScrollY;
    lastScrollTime.current = currentTime;
  };

  // Không cần render pack tabs header nữa - đã di chuyển lên icon tabs ở trên

  // Render một pack section với header và stickers
  const renderPackSection = (pack: any, packIndex: number) => {
    const isRecent = pack.id === 'recent';
    const packStickers = isRecent 
      ? (Array.isArray(recentStickers) ? recentStickers.map(r => r.sticker).filter(Boolean) : [])
      : (Array.isArray(pack.stickers) ? pack.stickers.filter(Boolean) : []);

    // Đối với mục "Gần đây", luôn hiển thị section (kể cả khi không có sticker)
    // Đối với các pack khác, ẩn nếu không có sticker
    if (!isRecent && packStickers.length === 0) return null;

    return (
      <View
        key={pack.id}
        ref={(ref) => {
          packSectionRefs.current[pack.id] = ref;
        }}
        onLayout={(e) => {
          // Lưu vị trí Y của section để scroll chính xác
          const { y } = e.nativeEvent.layout;
          packSectionPositions.current[pack.id] = y;
        }}
        style={{
          marginBottom: spacing.sm,
          marginTop: packIndex === 0 ? 0 : 0, // Không có marginTop
        }}
      >
        {/* Pack Header */}
        <View style={{
          paddingHorizontal: STICKER_PADDING,
          paddingTop: packIndex === 0 ? 140 : spacing.sm, // Section đầu tiên cần paddingTop để không bị che bởi header absolute (140px = search bar + icon tabs + padding)
          paddingBottom: spacing.sm,
          backgroundColor: isDarkMode ? '#1e1e1e' : '#f5f5f5',
        }}>
          <Text style={{
            fontSize: typography.fontSize.md,
            fontWeight: typography.fontWeight.semibold,
            color: colors.text,
          }}>
            {pack.title || pack.name || 'Stickers'}
          </Text>
        </View>

        {/* Stickers Grid */}
        <View style={{
          paddingHorizontal: STICKER_PADDING,
        }}>
          {packStickers.length > 0 ? (
            <FlatList
              data={packStickers}
              renderItem={({ item, index }) => {
                let packId = pack.id;
                let stickerIndex = index;
                
                if (isRecent && recentStickers[index]) {
                  packId = recentStickers[index].packId;
                  stickerIndex = recentStickers[index].stickerIndex;
                }

                const stickerUrl = getStickerURL(item.url);
                return (
                  <TouchableOpacity
                    style={{
                      width: STICKER_SIZE,
                      height: STICKER_SIZE,
                      margin: STICKER_MARGIN,
                      justifyContent: 'center',
                      alignItems: 'center',
                      borderRadius: 8,
                    }}
                    onPress={() => handleStickerSelect(packId, stickerIndex, item)}
                    activeOpacity={0.6}
                  >
                    <Image
                      source={{ uri: stickerUrl }}
                      style={{
                        width: STICKER_SIZE - 4,
                        height: STICKER_SIZE - 4,
                      }}
                      resizeMode="contain"
                      cachePolicy="memory-disk"
                    />
                  </TouchableOpacity>
                );
              }}
              keyExtractor={(_, index) => `sticker-${pack.id}-${index}`}
              numColumns={numColumns}
              columnWrapperStyle={numColumns > 1 ? { justifyContent: 'flex-start' } : undefined}
              scrollEnabled={false}
              nestedScrollEnabled={true}
              removeClippedSubviews={true}
              maxToRenderPerBatch={10}
              windowSize={5}
              initialNumToRender={12}
            />
          ) : isRecent ? (
            // Hiển thị message "Chưa có sticker gần đây" cho mục "Gần đây"
            <View style={{ 
              justifyContent: 'center', 
              alignItems: 'center', 
              paddingVertical: 40,
              paddingHorizontal: 20,
              minHeight: 100,
            }}>
              <MaterialCommunityIcons 
                name="clock-outline" 
                size={48} 
                color={colors.textSecondary} 
                style={{ marginBottom: 12, opacity: 0.5 }}
              />
              <Text style={{ 
                color: colors.textSecondary, 
                fontSize: typography.fontSize.base,
                textAlign: 'center',
              }}>
                Chưa có sticker gần đây
              </Text>
            </View>
          ) : null}
        </View>
      </View>
    );
  };

  return (
    <View style={{ 
      flex: 1, 
      maxHeight: expandedHeight, 
      overflow: 'hidden',
      backgroundColor: isDarkMode ? '#1e1e1e' : '#f5f5f5',
    }}>
      {/* ScrollView chứa tất cả packs - giống Telegram */}
      <ScrollView
        ref={stickerScrollViewRef}
        style={{ 
          flex: 1,
          marginTop: 0,
          paddingTop: 0,
        }}
        contentContainerStyle={{
          paddingTop: 0,
          paddingBottom: STICKER_PADDING + 10,
        }}
          showsVerticalScrollIndicator={true}
          nestedScrollEnabled={true}
          onScroll={handleScroll}
          scrollEventThrottle={16}
        >
        {packsWithRecent.map((pack, index) => renderPackSection(pack, index))}
        
        {packsWithRecent.length === 0 && (
          <View style={{ 
            justifyContent: 'center', 
            alignItems: 'center', 
            paddingVertical: 40,
            paddingHorizontal: 20,
            minHeight: 200,
          }}>
            {availablePacks.length === 0 ? (
              <View style={{ alignItems: 'center' }}>
                <MaterialCommunityIcons 
                  name="sticker-outline" 
                  size={48} 
                  color={colors.textSecondary} 
                  style={{ marginBottom: 12, opacity: 0.5 }}
                />
                <Text style={{ 
                  color: colors.textSecondary, 
                  fontSize: typography.fontSize.base,
                  textAlign: 'center',
                  marginBottom: 4,
                }}>
                  Chưa có sticker pack nào
                </Text>
                {isAdmin && (
                  <Text style={{ 
                    color: colors.textSecondary, 
                    fontSize: typography.fontSize.xs,
                    textAlign: 'center',
                    opacity: 0.7,
                    marginTop: 4,
                  }}>
                    Nhấn nút + để thêm sticker vào pack
                  </Text>
                )}
              </View>
            ) : (
              <View style={{ alignItems: 'center' }}>
                <MaterialCommunityIcons 
                  name="clock-outline" 
                  size={48} 
                  color={colors.textSecondary} 
                  style={{ marginBottom: 12, opacity: 0.5 }}
                />
                <Text style={{ 
                  color: colors.textSecondary, 
                  fontSize: typography.fontSize.base,
                  textAlign: 'center',
                }}>
                  Chưa có sticker gần đây
                </Text>
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
});

const ChatDetailScreen = () => {
  const { isDarkMode, colors } = useTheme();
  const route = useRoute();
  const navigation = useNavigation<ChatDetailNavigationProp>();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const routeParams = route.params as any;
  const conversationId = routeParams?.conversationId ? String(routeParams.conversationId) : null;
  const userName = routeParams?.userName || 'Người dùng';
  const userAvatarUrl = routeParams?.userAvatarUrl;
  const otherUserId = routeParams?.otherUserId; // Need this for socket emit
  const subTitle = routeParams?.subTitle;
  const isOnlineParam = routeParams?.isOnline;
  const [isOnline, setIsOnline] = useState<boolean>(Boolean(isOnlineParam ?? true));
  const lastSeen = routeParams?.lastSeen || routeParams?.last_seen; // For "Hoạt động X trước"
  const lastMessageTime = routeParams?.lastMessageTime || routeParams?.last_message_time; // Fallback to last message time
  
  // Check if this is a group chat - can be determined from route params or participants count
  const isGroupChatFromParams = routeParams?.type === 'group' || routeParams?.conversation_type === 'group';
  
  // Xác định bot - kiểm tra qua userName có chứa "Chat", "Bot", "Hệ Thống", "System" hoặc route params có isBot
  const userNameLower = userName.toLowerCase();
  const isBot = routeParams?.isBot 
    || userNameLower.includes('chat') 
    || userNameLower.includes('bot')
    || userNameLower.includes('hệ thống')
    || userNameLower.includes('system')
    || userNameLower.includes('zyea+');
  
  // Debug log để kiểm tra
  console.log('Bot detection:', { userName, isBot, userNameLower });
  
  // State to track last seen for real-time updates
  // Use lastSeen if available, otherwise fallback to lastMessageTime for consistency
  const [userLastSeen, setUserLastSeen] = useState<string | null | undefined>(lastSeen || lastMessageTime);
  
  // State to force re-render every minute to update time display (like Facebook)
  const [timeRefreshKey, setTimeRefreshKey] = useState(0);
  const [activityStatusEnabled, setActivityStatusEnabled] = useState(true);
  
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
  
  // Auto-update time display every minute (like Facebook)
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeRefreshKey(prev => prev + 1);
    }, 60000); // Update every 60 seconds (1 minute)

    return () => clearInterval(interval);
  }, []);
  
  const insets = useSafeAreaInsets();
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState<number>(0);
  const [inputBarHeight, setInputBarHeight] = useState<number>(56);
  const headerHeight = useHeaderHeight();
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [emojiPanelHeight, setEmojiPanelHeight] = useState<number>(480); // Tăng từ 400 lên 480 để hiển thị nhiều sticker hơn
  const [activeEmojiTab, setActiveEmojiTab] = useState<'sticker' | 'emoji' | 'gif'>('sticker');
  const [activeEmojiCategory, setActiveEmojiCategory] = useState<string>('Smileys');
  const emojiPanelAnimation = useRef(new Animated.Value(0)).current;
  const [showStickerPicker, setShowStickerPicker] = useState(false);
  
  // Animation config constants để tránh hardcode
  const EMOJI_TABS_ANIMATION_CONFIG = {
    tension: 120,
    friction: 9,
  };
  
  // State để ẩn/hiện tabs Sticker/Emoji/GIF khi cuộn
  const [isEmojiTabsVisible, setIsEmojiTabsVisible] = useState(true);
  const emojiTabsAnimValue = useRef(new Animated.Value(1)).current; // 1 = visible, 0 = hidden
  const emojiTabsTranslateY = useRef(new Animated.Value(1)).current; // 1 = visible, 0 = hidden
  const emojiTabsAnimating = useRef(false); // Tránh trigger animation nhiều lần
  const bottomTabsLastScrollY = useRef(0);
  const bottomTabsLastScrollTime = useRef(0);
  
  // State để ẩn/hiện header (search bar và icon tabs) khi cuộn
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);
  const headerAnimValue = useRef(new Animated.Value(1)).current; // 1 = visible, 0 = hidden
  const headerTranslateY = useRef(new Animated.Value(1)).current; // 1 = visible, 0 = hidden
  const headerAnimating = useRef(false);
  const headerLastScrollY = useRef(0);
  const headerLastScrollTime = useRef(0);
  
  // Interpolate cho header animation
  const headerOpacity = headerAnimValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });
  
  const headerTranslate = headerTranslateY.interpolate({
    inputRange: [0, 1],
    outputRange: [-140, 0], // 140px là chiều cao ước tính của header (search bar ~50px + icon tabs ~60px + padding ~30px)
    extrapolate: 'clamp',
  });
  
  // Handler để nhận scroll event và ẩn/hiện header và bottom tabs
  const handleEmojiPanelScroll = useCallback((isScrollingDown: boolean, scrollY: number) => {
    const currentTime = Date.now();
    const timeDiff = currentTime - bottomTabsLastScrollTime.current;
    const headerTimeDiff = currentTime - headerLastScrollTime.current;
    
    // Cooldown để tránh toggle quá nhanh
    if (timeDiff < 200 || headerTimeDiff < 200) return;
    
    const shouldHide = isScrollingDown && scrollY > 30;
    const shouldShow = !isScrollingDown || scrollY < 10;
    
    // Ẩn/hiện bottom tabs
    if (shouldHide && isEmojiTabsVisible && !emojiTabsAnimating.current) {
      emojiTabsAnimating.current = true;
      setIsEmojiTabsVisible(false);
      bottomTabsLastScrollY.current = scrollY;
      bottomTabsLastScrollTime.current = currentTime;
      
      Animated.parallel([
        Animated.spring(emojiTabsAnimValue, {
          toValue: 0,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.spring(emojiTabsTranslateY, {
          toValue: 0,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start(() => {
        emojiTabsAnimating.current = false;
      });
    } else if (shouldShow && !isEmojiTabsVisible && !emojiTabsAnimating.current) {
      emojiTabsAnimating.current = true;
      setIsEmojiTabsVisible(true);
      bottomTabsLastScrollY.current = scrollY;
      bottomTabsLastScrollTime.current = currentTime;
      
      Animated.parallel([
        Animated.spring(emojiTabsAnimValue, {
          toValue: 1,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.spring(emojiTabsTranslateY, {
          toValue: 1,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start(() => {
        emojiTabsAnimating.current = false;
      });
    }
    
    // Ẩn/hiện header (search bar và icon tabs)
    if (shouldHide && isHeaderVisible && !headerAnimating.current) {
      headerAnimating.current = true;
      setIsHeaderVisible(false);
      headerLastScrollY.current = scrollY;
      headerLastScrollTime.current = currentTime;
      
      Animated.parallel([
        Animated.spring(headerAnimValue, {
          toValue: 0,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.spring(headerTranslateY, {
          toValue: 0,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start(() => {
        headerAnimating.current = false;
      });
    } else if (shouldShow && !isHeaderVisible && !headerAnimating.current) {
      headerAnimating.current = true;
      setIsHeaderVisible(true);
      headerLastScrollY.current = scrollY;
      headerLastScrollTime.current = currentTime;
      
      Animated.parallel([
        Animated.spring(headerAnimValue, {
          toValue: 1,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.spring(headerTranslateY, {
          toValue: 1,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start(() => {
        headerAnimating.current = false;
      });
    }
  }, [isEmojiTabsVisible, isHeaderVisible]);
  
  // Handler riêng cho sticker scroll
  const handleStickerScrollChange = useCallback((isScrollingDown: boolean, scrollY: number) => {
    if (activeEmojiTab === 'sticker') {
      handleEmojiPanelScroll(isScrollingDown, scrollY);
    }
  }, [activeEmojiTab, handleEmojiPanelScroll]);
  
  // Interpolate cho bottom tabs animation
  const bottomTabsOpacity = emojiTabsAnimValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });
  
  const bottomTabsTranslateY = emojiTabsTranslateY.interpolate({
    inputRange: [0, 1],
    outputRange: [52, 0], // 52px = 40px (height) + 8px (marginBottom) + 4px (paddingBottom) để ẩn hoàn toàn
    extrapolate: 'clamp',
  });
  
  // Refs để scroll đến các section khi click tabs
  const emojiPanelScrollRef = useRef<ScrollView>(null);
  const stickerSectionRef = useRef<View>(null);
  const emojiSectionRef = useRef<View>(null);
  const gifSectionRef = useRef<View>(null);
  const stickerPickerRef = useRef<{ scrollToPack: (packId: string) => void } | null>(null);
  const [showRecentSection, setShowRecentSection] = useState(true); // Hiển thị section "GẦN ĐÂY"
  const [searchQuery, setSearchQuery] = useState(''); // Search query cho emoji panel
  const [sectionPositions, setSectionPositions] = useState<{sticker: number, emoji: number, gif: number}>({sticker: 0, emoji: 0, gif: 0});
  
  // Get sticker packs data from queryClient
  const stickerPacksQuery = useQuery({
    queryKey: ['sticker-packs'],
    queryFn: async () => {
      const response = await stickerAPI.getStickerPacks();
      return response.data.packs || [];
    },
    staleTime: 5 * 60 * 1000, // 5 phút - sticker packs không thay đổi thường xuyên
    gcTime: 15 * 60 * 1000, // 15 phút cache
    // Use cached data immediately if available, don't wait for refetch
    placeholderData: (previousData) => previousData,
  });
  const stickerPacksData = stickerPacksQuery.data || [];
  const isLoadingStickerPacks = stickerPacksQuery.isLoading;
  const availablePacks = Array.isArray(stickerPacksData) 
    ? (stickerPacksData as StickerPack[]).filter(pack => pack && pack.stickers && pack.stickers.length > 0)
    : [];
  
  // Filter HELLO stickers for empty state suggestions
  const helloStickers = useMemo(() => {
    if (!Array.isArray(stickerPacksData) || stickerPacksData.length === 0) {
      return [];
    }
    
    // First, try to find packs with "HELLO" in name/title
    const helloPacks = (stickerPacksData as StickerPack[]).filter(pack => {
      if (!pack || !pack.stickers || pack.stickers.length === 0) return false;
      const packName = (pack.name || pack.title || '').toUpperCase();
      return packName.includes('HELLO');
    });
    
    // If no pack with HELLO in name, search for stickers with "HELLO" in URL/filename
    let stickers: Array<{packId: string, stickerIndex: number, sticker: Sticker}> = [];
    
    if (helloPacks.length > 0) {
      // Get stickers from HELLO packs
      for (const pack of helloPacks) {
        if (pack.stickers && pack.stickers.length > 0) {
          const packStickers = pack.stickers.slice(0, 5).map((sticker, index) => ({
            packId: pack.id,
            stickerIndex: index,
            sticker: sticker,
          }));
          stickers.push(...packStickers);
        }
      }
    } else {
      // Fallback: search for stickers with "HELLO" in URL/filename across all packs
      for (const pack of stickerPacksData as StickerPack[]) {
        if (!pack || !pack.stickers || pack.stickers.length === 0) continue;
        
        for (let index = 0; index < pack.stickers.length && stickers.length < 5; index++) {
          const sticker = pack.stickers[index];
          if (sticker && sticker.url) {
            const urlUpper = sticker.url.toUpperCase();
            if (urlUpper.includes('HELLO')) {
              stickers.push({
                packId: pack.id,
                stickerIndex: index,
                sticker: sticker,
              });
            }
          }
        }
      }
    }
    
    // If still no stickers found, use first few stickers from first available pack as fallback
    if (stickers.length === 0 && availablePacks.length > 0) {
      const firstPack = availablePacks[0];
      if (firstPack && firstPack.stickers && firstPack.stickers.length > 0) {
        stickers = firstPack.stickers.slice(0, 5).map((sticker, index) => ({
          packId: firstPack.id,
          stickerIndex: index,
          sticker: sticker,
        }));
      }
    }
    
    // Limit total to 5 stickers
    return stickers.slice(0, 5);
  }, [stickerPacksData, availablePacks]);
  
  // Emoji picker scroll detection - giống sticker picker
  const emojiScrollY = useRef(new Animated.Value(0)).current;
  const emojiLastScrollY = useRef(0);
  const emojiLastScrollTime = useRef(0);
  const emojiScrollVelocity = useRef(0);
  const emojiScrollDirection = useRef<'up' | 'down'>('up');
  const [isEmojiHeaderVisible, setIsEmojiHeaderVisible] = useState(true);
  const emojiHeaderAnimValue = useRef(new Animated.Value(1)).current;
  const emojiHeaderTranslateY = useRef(new Animated.Value(0)).current;
  const emojiIsAnimating = useRef(false);
  const emojiLastActionTime = useRef(0);
  const EMOJI_ACTION_COOLDOWN = 200;
  const EMOJI_TOP_TABS_HEIGHT = 50;
  const EMOJI_CATEGORY_TABS_HEIGHT = 50;
  const EMOJI_HEADER_TOTAL_HEIGHT = EMOJI_TOP_TABS_HEIGHT + EMOJI_CATEGORY_TABS_HEIGHT;
  
  // Animation config cho emoji picker (giống sticker picker)
  const EMOJI_ANIMATION_CONFIG = {
    tension: 100,
    friction: 8,
    useNativeDriver: true,
  };
  
  const [inputText, setInputText] = useState('');
  const [messages, setMessages] = useState<any[]>([]);
  const [typingUsers, setTypingUsers] = useState<any[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [replyToMessage, setReplyToMessage] = useState<any | null>(null);
  const [contextMenuVisible, setContextMenuVisible] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<any | null>(null);
  const [menuPosition, setMenuPosition] = useState<{ x: number; y: number } | undefined>(undefined);
  const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);
  const [editingMessage, setEditingMessage] = useState<any | null>(null);
  const [showUserProfileModal, setShowUserProfileModal] = useState(false);
  const [selectedUserForProfile, setSelectedUserForProfile] = useState<any | null>(null);
  const [showParticipantsModal, setShowParticipantsModal] = useState(false);
  const [showAddMembersModal, setShowAddMembersModal] = useState(false);
  const [showMediaPicker, setShowMediaPicker] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState<{ uri: string; type: 'image' | 'video' } | null>(null);
  const [copyNotificationVisible, setCopyNotificationVisible] = useState(false);
  const [showBotCommands, setShowBotCommands] = useState(false);
  const copyNotificationOpacity = useRef(new Animated.Value(0)).current;
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const inputRef = useRef<TextInput>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const hasInitializedRef = useRef<boolean>(false); // Track if we've initialized messages
  const videoRef = useRef<Video>(null);
  const previousConversationMessagesRef = useRef<string>(''); // Track previous messages to prevent infinite loop
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0); // Số tin nhắn mới chưa đọc
  const lastSeenMessagesCountRef = useRef<number>(0); // Số tin nhắn khi user lần cuối ở bottom
  const lastUnreadCountRef = useRef<number>(0); // Số tin nhắn đã đếm trước đó (để tránh đếm lại)
  
  const { socket } = useSocket();

  const { 
    data: conversationMessages = [], 
    isLoading: isLoadingMessages, 
    isError: isMessagesError,
    error: messagesError,
    refetch: refetchMessages,
    isRefetching: isRefetchingMessages
  } = useQuery({
    queryKey: ['messages', conversationId],
    queryFn: async () => {
      if (!conversationId) {
        throw new Error('Missing conversationId');
      }
      try {
        const response = await chatAPI.getMessages(conversationId);
        
        // Axios automatically throws error for status >= 400, so if we get here, response is successful
        // Server returns messages array directly (already reversed: oldest to newest)
        const messages = response.data || [];
        
        // NOTE: Marking messages as read is now handled in useFocusEffect
        // This ensures messages are only marked as read when the screen is actually opened/focused,
        // not just when messages are fetched (which could happen in background)
        
        return messages;
      } catch (error: any) {
        // Log detailed error information
        const status = error?.response?.status;
        const errorMessage = error?.response?.data?.message || error?.message || 'Unknown error';
        
        // Create a more user-friendly error message
        let userFriendlyMessage = errorMessage;
        if (status === 500) {
          userFriendlyMessage = 'Lỗi máy chủ. Vui lòng thử lại sau.';
        } else if (status === 404) {
          userFriendlyMessage = 'Không tìm thấy cuộc trò chuyện.';
        } else if (status === 401) {
          userFriendlyMessage = 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.';
        } else if (status === 403) {
          userFriendlyMessage = 'Bạn không có quyền truy cập cuộc trò chuyện này.';
        } else if (status >= 400 && status < 500) {
          userFriendlyMessage = `Lỗi yêu cầu (${status}). Vui lòng thử lại.`;
        } else if (status >= 500) {
          userFriendlyMessage = 'Lỗi máy chủ. Vui lòng thử lại sau.';
        }
        
        // Create enhanced error object with user-friendly message
        const enhancedError = new Error(userFriendlyMessage);
        (enhancedError as any).status = status;
        (enhancedError as any).originalError = error;
        
        // Re-throw enhanced error to let React Query handle retry logic
        throw enhancedError;
      }
    },
    enabled: !!conversationId, // Only fetch if conversationId exists
    staleTime: 30 * 1000, // 30 giây - messages cần refresh nhưng socket sẽ update real-time
    gcTime: 10 * 60 * 1000, // 10 phút cache
    refetchOnWindowFocus: false, // Don't refetch on focus - socket handles updates
    retry: (failureCount, error: any) => {
      // Retry logic: retry up to 2 times for 5xx errors, but not for 4xx errors (reduced from 3)
      const status = error?.status || error?.response?.status || error?.originalError?.response?.status;
      
      if (status >= 400 && status < 500) {
        // Don't retry client errors (4xx)
        return false;
      }
      
      // Retry server errors (5xx) and network errors up to 2 times (reduced for faster failure)
      return failureCount < 2;
    },
    retryDelay: (attemptIndex) => Math.min(500 * 2 ** attemptIndex, 5000), // Faster retry: 500ms, 1s, 2s (reduced from 1s, 2s, 4s)
  });

  // Helper function to safely fetch participants without throwing errors
  // This function ensures no errors are thrown or logged to console
  const fetchParticipantsSafely = async (convId: string): Promise<any[]> => {
    if (!convId) return [];
    
    // Use Promise.resolve to catch any synchronous errors
    return Promise.resolve(chatAPI.getParticipants(convId))
      .then((res) => {
        const participantsData = Array.isArray(res.data) ? res.data : (res.data?.data || []);
        console.log('✅ Fetched participants:', participantsData.length, 'members for conversation', convId);
        return participantsData;
      })
      .catch(() => {
        // Silently handle all errors - return empty array without any logging or throwing
        // This prevents console errors for all cases (403/404 for private chats, 500 for server issues, etc.)
        // The error is handled gracefully and app continues to work normally
        return [];
      });
  };

  // Fetch participants for group conversations
  // Note: We fetch for all conversations to determine if it's a group chat,
  // but handle all errors gracefully (suppress all error logging)
  // Fetch participants - errors are handled gracefully in fetchParticipantsSafely
  const participantsQuery = useQuery({
    queryKey: ['participants', conversationId],
    queryFn: () => fetchParticipantsSafely(conversationId!),
    enabled: !!conversationId, // Fetch for all conversations to determine type
    retry: false, // Don't retry - all errors are handled gracefully
    staleTime: 30000, // Cache for 30 seconds
    refetchOnMount: true, // Always refetch when component mounts
  });
  
  const participants = (Array.isArray(participantsQuery.data) ? participantsQuery.data : []) as any[];
  const isLoadingParticipants = participantsQuery.isLoading;
  const participantsError = participantsQuery.error;
  
  // Determine if this is a group chat
  // Priority: check type from params first, then check participants count
  // Group chat if: has type='group' in params OR has more than 2 participants
  const participantsArray = Array.isArray(participants) ? participants : [];
  const isGroupChat = isGroupChatFromParams || (participantsArray.length > 0 && participantsArray.length > 2);
  
  // Get top 3 participants for composite avatar
  // Ưu tiên: Creator đầu tiên, sau đó là 2 thành viên khác
  // Luôn đảm bảo có đủ 3 participants để hiển thị 3 avatar: Creator + 2 thành viên
  const creator = participantsArray.find((p: any) => {
    // Tìm creator: kiểm tra is_creator flag từ API
    return p.is_creator === true || p.is_creator === 1;
  });
  
  // Lấy các thành viên khác (không phải creator, không phải current user)
  const otherParticipants = participantsArray.filter((p: any) => {
    const isCreator = p.is_creator === true || p.is_creator === 1;
    return !isCreator && String(p.id) !== String(user?.id);
  });
  
  // Kết hợp: Creator đầu tiên, sau đó là 2 thành viên khác
  let topParticipants: any[] = [];
  if (creator) {
    // Luôn hiển thị creator đầu tiên
    topParticipants = [creator, ...otherParticipants.slice(0, 2)];
  } else {
    // Không có creator info, lấy 3 thành viên đầu tiên (không bao gồm current user)
    topParticipants = otherParticipants.slice(0, 3);
  }
  
  // Nếu vẫn chưa đủ 3, lặp lại để đủ 3
  if (topParticipants.length < 3 && topParticipants.length > 0) {
    const source = topParticipants.length === 1 
      ? [...topParticipants, ...otherParticipants] 
      : topParticipants;
    while (topParticipants.length < 3) {
      topParticipants = [...topParticipants, ...source].slice(0, 3);
    }
  }
  
  // Calculate remaining count (total - 3 displayed - current user if in list)
  const totalCount = participantsArray.length;
  const remainingCount = Math.max(0, totalCount - 3);

  // Helper function to mark all messages as read
  const markAllMessagesAsRead = useCallback(async () => {
    if (!conversationId || !user?.id) return;

    try {
      await chatAPI.markAllAsRead(conversationId);
      
      // Update conversations cache immediately to set unread_count = 0
      queryClient.setQueryData(['conversations'], (oldData: any[]) => {
        if (!oldData) return oldData;
        
        // Update the conversation with unread_count = 0
        const updated = oldData.map((conv: any) => {
          const convId = conv?.id || conv?.conversation_id;
          if (String(convId) === String(conversationId)) {
            return {
              ...conv,
              unread_count: 0,
              unreadCount: 0,
            };
          }
          return conv;
        });
        
        return updated;
      });
      
      // Emit socket event to notify other users
      if (socket?.connected) {
        socket.emit('markMessagesAsRead', {
          conversationId: conversationId,
          messageIds: [], // Empty array means all messages
          userId: user?.id
        });
      }
      
      console.log('✅ Marked all messages as read:', conversationId);
    } catch (error) {
      console.error('❌ Error marking messages as read:', error);
      // Don't throw - marking as read is not critical
    }
  }, [conversationId, user?.id, socket, queryClient]);

  // Mark messages as read when screen is focused (when user opens chat detail)
  useFocusEffect(
    useCallback(() => {
      // Mark as read when screen is focused
      markAllMessagesAsRead();
      
      // Refresh sticker packs khi focus vào screen để có data mới nhất
      queryClient.invalidateQueries({ queryKey: ['sticker-packs'] });
      queryClient.refetchQueries({ queryKey: ['sticker-packs'] });
    }, [markAllMessagesAsRead, queryClient])
  );

  // Create a stable reference for conversationMessages to prevent infinite loop
  // Compare by message IDs instead of array reference
  const conversationMessagesKey = useMemo(() => {
    if (!Array.isArray(conversationMessages)) return '';
    // Create a stable key from message IDs and lengths to detect actual changes
    const ids = conversationMessages.map(m => String(m?.id || '')).join(',');
    return `${ids}|${conversationMessages.length}`;
  }, [conversationMessages]);

  useEffect(() => {
    // Don't reset messages while loading - preserve current state
    // This prevents flashing empty state when navigating back and forth
    if (isLoadingMessages) {
      return;
    }
    
    // Prevent infinite loop: only update if conversationMessages actually changed
    // Compare by message IDs instead of array reference
    const currentKey = conversationMessagesKey;
    if (previousConversationMessagesRef.current === currentKey) {
      return; // No actual change, skip update
    }
    previousConversationMessagesRef.current = currentKey;
    
    // Server returns messages from oldest to newest (already reversed)
    // FlatList is inverted, so we need newest first
    // So we reverse the array to put newest at the top
    // Important: If all messages are deleted, conversationMessages will be empty array
    // and we need to ensure messages state is also empty to show empty state
    if (Array.isArray(conversationMessages) && conversationMessages.length > 0) {
      // Reverse to get newest first for inverted FlatList
      const reversedMessages = [...conversationMessages].reverse();
      
      // Smart merge: Keep optimistic updates but replace with server data when available
      setMessages((prevMessages) => {
        // If this is initial load (prevMessages is empty or only has temp/bot messages)
        const hasOnlyTempOrBotMessages = prevMessages.length > 0 && prevMessages.every(m => {
          const id = m?.id;
          return id && (String(id).startsWith('temp-') || String(id).startsWith('bot-'));
        });
        
        // Initial load: set messages from server, but keep bot messages
        if (prevMessages.length === 0 || hasOnlyTempOrBotMessages) {
          hasInitializedRef.current = true;
          // Map server fields to client format
          const serverMessages = reversedMessages.map(msg => {
            // Chỉnh sửa edited: true khi edited = 1 (từ CASE WHEN SQL) hoặc edited_at có giá trị
            // edited field từ server là 0 hoặc 1 (từ CASE WHEN m.edited_at IS NOT NULL)
            const isEdited = msg.edited === 1 || 
                           (msg.edited_at !== null && 
                            msg.edited_at !== undefined && 
                            String(msg.edited_at).trim() !== '');
            
            // Determine message type - prioritize message_type, then type, then infer from content
            let messageType = msg.message_type || msg.type || 'text';
            
            // If content looks like sticker JSON, ensure type is sticker
            if (messageType !== 'sticker' && msg.content) {
              try {
                const parsed = JSON.parse(msg.content);
                if (parsed.packId || parsed.packid) {
                  messageType = 'sticker';
                }
              } catch (e) {
                // Not JSON, ignore
              }
            }
            
            return {
              ...msg,
              edited: Boolean(isEdited),  // Đảm bảo là boolean
              reactions: msg.reactions ? (typeof msg.reactions === 'string' ? JSON.parse(msg.reactions) : msg.reactions) : [],
              // Ensure message_type is set (server returns message_type field)
              message_type: messageType,
              type: messageType, // Also set type for compatibility
              // Ensure file_url is preserved (server returns file_url for media)
              file_url: msg.file_url || null,
            };
          });
          
          // Giữ lại bot messages nếu có
          const botMessagesFromPrev = prevMessages.filter(m => {
            const id = m?.id;
            return id && String(id).startsWith('bot-');
          });
          
          // Combine server messages with bot messages
          // Bot messages ở đầu vì FlatList inverted (tin nhắn mới nhất ở đầu)
          return [...botMessagesFromPrev, ...serverMessages];
        }
        
        // If we have existing real messages, merge carefully
        // Keep temp messages and bot messages that don't exist in server data yet
        const serverMessageIds = new Set(reversedMessages.map(m => String(m.id || '')));
        const tempMessages = prevMessages.filter(m => {
          const id = m?.id;
          return id && String(id).startsWith('temp-');
        });
        // Giữ lại tin nhắn bot (có id bắt đầu bằng 'bot-')
        const botMessages = prevMessages.filter(m => {
          const id = m?.id;
          return id && String(id).startsWith('bot-');
        });
        const realMessagesFromPrev = prevMessages.filter(m => {
          const id = m?.id;
          return !id || (!String(id).startsWith('temp-') && !String(id).startsWith('bot-'));
        });
        
        // Map server messages to client format
        const mappedServerMessages = reversedMessages.map(msg => {
          const isEdited = msg.edited === 1 || 
                         (msg.edited_at !== null && 
                          msg.edited_at !== undefined && 
                          String(msg.edited_at).trim() !== '');
          
          // Determine message type - prioritize message_type, then type, then infer from content
          let messageType = msg.message_type || msg.type || 'text';
          
          // If content looks like sticker JSON, ensure type is sticker
          if (messageType !== 'sticker' && msg.content) {
            try {
              const parsed = JSON.parse(msg.content);
              if (parsed.packId || parsed.packid) {
                messageType = 'sticker';
              }
            } catch (e) {
              // Not JSON, ignore
            }
          }
          
          return {
            ...msg,
            edited: Boolean(isEdited),
            reactions: msg.reactions ? (typeof msg.reactions === 'string' ? JSON.parse(msg.reactions) : msg.reactions) : [],
            message_type: messageType,
            type: messageType, // Also set type for compatibility
            file_url: msg.file_url || null,
          };
        });
        
        // Always merge server messages with temp messages
        // Server messages take priority - if server has message with same content, use server version
        const merged = [...mappedServerMessages];
        
        // Add temp messages that don't exist in server data yet
        tempMessages.forEach(temp => {
          // Check if server already has this message (by content, sender, and time)
          const existsInServer = merged.some(m => {
            // Check by content and sender
            if (m.content === temp.content && m.sender_id === temp.sender_id) {
              // Check time difference - if within 5 seconds, it's the same message
              if (m.created_at && temp.created_at) {
                const timeDiff = Math.abs(
                  new Date(m.created_at).getTime() - new Date(temp.created_at).getTime()
                );
                if (timeDiff < 5000) {
                  return true; // Same message, server has it
                }
              }
              // If content and sender match, consider it duplicate (server version is better)
              return true;
            }
            return false;
          });
          
          // Only add temp if server doesn't have it yet
          if (!existsInServer) {
            // Check if temp is recent (within 10 seconds) to avoid keeping old temp messages
            const tempTime = new Date(temp.created_at).getTime();
            const now = Date.now();
            if ((now - tempTime) < 10000) {
              merged.unshift(temp);
            }
          }
        });
        
        // Add bot messages - bot messages are always kept (they're local-only)
        botMessages.forEach(botMsg => {
          // Check if bot message already exists in merged (by id)
          const existsInMerged = merged.some(m => {
            const id = m?.id;
            return id && String(id) === String(botMsg.id);
          });
          
          // Only add if not already in merged
          if (!existsInMerged) {
            merged.unshift(botMsg);
          }
        });
        
        return merged;
      });
    } else if (Array.isArray(conversationMessages) && conversationMessages.length === 0) {
      // Empty array from server - this means no messages (either never had any, or all deleted)
      setMessages((prevMessages) => {
        // If we haven't initialized yet (first mount), set empty
        if (!hasInitializedRef.current) {
          hasInitializedRef.current = true;
          return [];
        }
        
        // If server returns empty after initialization, it means all messages were deleted
        // We should clear the state to show empty state with sticker suggestions
        // Only keep temp messages that are very recent (within 5 seconds) in case they're still uploading
        const recentTempMessages = prevMessages.filter(m => {
          const id = m?.id;
          if (id && String(id).startsWith('temp-')) {
            const msgTime = new Date(m.created_at).getTime();
            const now = Date.now();
            return (now - msgTime) < 5000; // Keep only very recent temp messages
          }
          return false;
        });
        
        // Keep bot messages (they're local-only)
        const botMessages = prevMessages.filter(m => {
          const id = m?.id;
          return id && String(id).startsWith('bot-');
        });
        
        // If we have recent temp or bot messages, keep them, otherwise clear all
        if (recentTempMessages.length > 0 || botMessages.length > 0) {
          return [...botMessages, ...recentTempMessages];
        } else {
          return [];
        }
      });
    }
  }, [conversationMessagesKey, isLoadingMessages, conversationMessages]);
  
  // Reset initialization flag when conversationId changes (navigate to different conversation)
  useEffect(() => {
    hasInitializedRef.current = false;
    previousConversationMessagesRef.current = ''; // Reset previous messages tracking
  }, [conversationId]);
  // Track keyboard height để điều chỉnh padding thủ công (không dùng KeyboardAvoidingView animation)
  // Sử dụng keyboardWillShow để cập nhật trước khi animation bắt đầu (iOS)
  useEffect(() => {
    const showSub = Platform.OS === 'ios' 
      ? Keyboard.addListener('keyboardWillShow', (e) => {
          setIsKeyboardVisible(true);
          setKeyboardHeight(e.endCoordinates.height);
          // Scroll FlatList xuống để tin nhắn không bị che (giống Telegram)
          setTimeout(() => {
            if (flatListRef.current) {
              flatListRef.current.scrollToOffset({ offset: 0, animated: false });
            }
          }, 50);
        })
      : Keyboard.addListener('keyboardDidShow', (e) => {
          setIsKeyboardVisible(true);
          setKeyboardHeight(e.endCoordinates.height);
          // Scroll FlatList xuống để tin nhắn không bị che (giống Telegram)
          setTimeout(() => {
            if (flatListRef.current) {
              flatListRef.current.scrollToOffset({ offset: 0, animated: false });
            }
          }, 50);
        });
    const hideSub = Platform.OS === 'ios'
      ? Keyboard.addListener('keyboardWillHide', () => {
          setIsKeyboardVisible(false);
          setKeyboardHeight(0);
        })
      : Keyboard.addListener('keyboardDidHide', () => {
          setIsKeyboardVisible(false);
          setKeyboardHeight(0);
        });
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);


  // Emit viewing conversation when entering and setup socket listeners
  useEffect(() => {
    if (!socket || !conversationId || !user?.id) return;

    // Notify that user is viewing this conversation
    socket.emit('viewingConversation', {
      conversationId: conversationId,
      userId: user.id
    });

    // Cleanup when leaving conversation
    return () => {
      if (socket && conversationId && user?.id) {
        socket.emit('leftConversation', {
          conversationId: conversationId,
          userId: user.id
        });
        
        // Stop typing when leaving
        if (isTyping) {
          setIsTyping(false);
          socket.emit('stopTyping', {
            conversationId: conversationId,
            userId: user.id,
            username: user.username,
            fullName: user.full_name || user.username,
          });
        }
      }
    };
  }, [socket, conversationId, user?.id]);

  // Listen for new messages via socket and refetch when receiving
  useEffect(() => {
    if (!socket || !conversationId) return;

    const handleNewMessage = (socketMessage: any) => {
      // Socket can emit in different formats - handle both
      // Format 1: From server socket handler { senderId, message, timestamp }
      // Format 2: Full message object from API { id, content, sender_id, conversation_id, ... }
      
      let message: any = null;
      
      if (socketMessage.id && socketMessage.conversation_id) {
        // Full message object format
        message = socketMessage;
      } else if (socketMessage.senderId && socketMessage.message) {
        // Socket handler format - basic format from server
        // Create message object from basic format
        
        // If this is our own message, remove temp message immediately and refetch
        if (String(socketMessage.senderId) === String(user?.id)) {
          // Remove temp messages with same content immediately
          setMessages((prev) => {
            const filtered = prev.filter(m => {
              const id = m?.id;
              // Keep non-temp messages
              if (!id || !String(id).startsWith('temp-')) return true;
              // Remove temp messages with same content (our optimistic update)
              if (m.content === socketMessage.message && m.sender_id === String(user?.id)) {
                return false;
              }
              return true;
            });
            return filtered;
          });
          
          // Then refetch to get full message data
          setTimeout(() => {
            refetchMessages();
          }, 500);
          return;
        }
        
        // For messages from other users, create message object and add immediately
        // Lấy thông tin avatar và name từ route params hoặc từ message cũ
        setMessages((prev) => {
          // Tìm message cũ của cùng sender để lấy avatar và name
          const previousMessageFromSender = prev.find(m => 
            m.sender_id === String(socketMessage.senderId) && 
            (m.avatar_url || m.full_name)
          );
          
          // Tạo message object với đầy đủ thông tin
          const messageObj = {
            id: `socket-${Date.now()}-${Math.random()}`,
            content: socketMessage.message,
            sender_id: String(socketMessage.senderId),
            conversation_id: conversationId || socketMessage.conversationId,
            created_at: socketMessage.timestamp || new Date().toISOString(),
            type: 'text',
            message_type: 'text',
            status: 'read' as 'sent' | 'delivered' | 'read',
            // Lấy avatar và name từ route params trước, nếu không có thì lấy từ message cũ
            avatar_url: userAvatarUrl || previousMessageFromSender?.avatar_url || null,
            full_name: userName || previousMessageFromSender?.full_name || null,
            username: previousMessageFromSender?.username || null,
          };
          
          // Remove temp messages with same content
          const filtered = prev.filter(m => {
            const id = m?.id;
            if (!id || !String(id).startsWith('temp-')) return true;
            // Remove temp messages with same content
            if (m.content === messageObj.content && m.sender_id === messageObj.sender_id) {
              return false;
            }
            return true;
          });
          
          // Check if already exists (avoid duplicates) - kiểm tra chính xác hơn
          const exists = filtered.some(m => {
            // Check by content and sender
            if (m.content === messageObj.content && m.sender_id === messageObj.sender_id) {
              // Check time difference - nếu cùng nội dung và cùng sender trong vòng 5 giây thì là duplicate
              if (m.created_at && messageObj.created_at) {
                const timeDiff = Math.abs(
                  new Date(m.created_at).getTime() - new Date(messageObj.created_at).getTime()
                );
                if (timeDiff < 5000) {
                  return true;
                }
              }
            }
            return false;
          });
          
          if (exists) {
            return filtered;
          }
          
          // Add new message immediately at the beginning (newest first for inverted list)
          const updated = [messageObj, ...filtered];
          
          // Scroll to bottom immediately after state update (for inverted list, this means scroll to index 0)
          // Use requestAnimationFrame to ensure DOM is updated
          requestAnimationFrame(() => {
            setTimeout(() => {
              if (flatListRef.current) {
                flatListRef.current.scrollToOffset({ offset: 0, animated: true });
              }
            }, 50);
          });
          
          return updated;
        });
        
        // Mark all messages as read when receiving new message while viewing conversation
        // This ensures that when user is actively viewing the conversation, new messages are marked as read
        markAllMessagesAsRead();
        
        // Refetch after a short delay to get full message data with correct avatar, name, etc. từ server
        // But don't wait too long - message is already visible
        setTimeout(() => {
          refetchMessages();
        }, 300);
        return;
      }
      
      if (message) {
        const msgConversationId = String(message?.conversation_id || message?.conversationId || '');
        const currentConversationId = String(conversationId);
        
        if (msgConversationId === currentConversationId || message.senderId === String(user?.id)) {
          setMessages((prev) => {
            // Check if message already exists to avoid duplicates
            const exists = prev.some(m => m.id === message.id);
            if (exists) {
              return prev;
            }
            
            // Remove temporary messages with same content (from optimistic update)
            const filtered = prev.filter(m => {
              // Keep non-temp messages
              const id = m?.id;
              if (!id || !String(id).startsWith('temp-')) return true;
              // Remove temp messages with same content (our optimistic update)
              if (m.content === message.content && m.sender_id === message.sender_id) {
                return false;
              }
              return true;
            });
            
            // Đảm bảo message có đầy đủ thông tin avatar và name
            // Nếu không có, lấy từ route params hoặc từ message cũ của cùng sender
            const isOwnMessage = message.sender_id === user?.id;
            let messageAvatar = message.avatar_url;
            let messageFullName = message.full_name;
            let messageUsername = message.username;
            
            if (!isOwnMessage) {
              // Nếu là tin nhắn từ người khác và thiếu thông tin
              if (!messageAvatar || !messageFullName) {
                // Lấy từ route params trước
                if (userAvatarUrl && !messageAvatar) {
                  messageAvatar = userAvatarUrl;
                }
                if (userName && !messageFullName) {
                  messageFullName = userName;
                }
                
                // Nếu vẫn chưa có, tìm từ message cũ của cùng sender
                if (!messageAvatar || !messageFullName) {
                  const previousMessageFromSender = filtered.find(m => 
                    m.sender_id === message.sender_id && m.avatar_url
                  );
                  if (previousMessageFromSender) {
                    if (!messageAvatar) messageAvatar = previousMessageFromSender.avatar_url;
                    if (!messageFullName) messageFullName = previousMessageFromSender.full_name;
                    if (!messageUsername) messageUsername = previousMessageFromSender.username;
                  }
                }
              }
            }
            
            // Add new message at the beginning (for inverted FlatList)
            // Ensure message has status field and avatar/name info
            const messageWithStatus = {
              ...message,
              avatar_url: messageAvatar || message.avatar_url || null,
              full_name: messageFullName || message.full_name || null,
              username: messageUsername || message.username || null,
              status: (message.status || (message.sender_id === user?.id ? 'delivered' : 'read')) as 'sent' | 'delivered' | 'read'
            };
            const updated = [messageWithStatus, ...filtered];
            
            // Scroll to bottom after state update (for inverted list, this means scroll to index 0)
            setTimeout(() => {
              if (flatListRef.current) {
                flatListRef.current.scrollToOffset({ offset: 0, animated: true });
              }
            }, 100);
            
            return updated;
          });
          
          // Mark all messages as read when receiving new message while viewing conversation
          // This ensures that when user is actively viewing the conversation, new messages are marked as read
          if (String(message.sender_id) !== String(user?.id)) {
            markAllMessagesAsRead();
          }
        }
      }
    };

    // Listen for typing indicators
    const handleUserTyping = (data: any) => {
      if (data.conversationId && String(data.conversationId) === String(conversationId) && data.userId && String(data.userId) !== String(user?.id)) {
        setTypingUsers((prev) => {
          // Check if user already in list
          const exists = prev.some(u => String(u.userId) === String(data.userId));
          if (exists) return prev;
          return [...prev, {
            userId: String(data.userId),
            username: data.username,
            full_name: data.fullName || data.full_name
          }];
        });
      }
    };

    const handleUserStoppedTyping = (data: any) => {
      if (data.conversationId && String(data.conversationId) === String(conversationId) && data.userId && String(data.userId) !== String(user?.id)) {
        setTypingUsers((prev) => prev.filter(u => String(u.userId) !== String(data.userId)));
      }
    };

    // Listen for message read status updates
    const handleMessageRead = (data: any) => {
      if (data.conversationId === conversationId) {
        setMessages((prev) => prev.map(msg => {
          if (data.messageIds && data.messageIds.includes(String(msg.id))) {
            return { ...msg, status: 'read' as const };
          }
          // If messageIds is empty, mark all messages from current user as read
          if (Array.isArray(data.messageIds) && data.messageIds.length === 0 && msg.sender_id === user?.id) {
            return { ...msg, status: 'read' as const };
          }
          return msg;
        }));
      }
    };

    const handleMessageDelivered = (data: any) => {
      if (data.conversationId === conversationId) {
        setMessages((prev) => prev.map(msg => {
          if (data.messageId && String(msg.id) === String(data.messageId)) {
            return { ...msg, status: 'delivered' as const };
          }
          return msg;
        }));
      }
    };

    // Listen for user viewing conversation (for read receipts)
    const handleUserViewingConversation = (data: any) => {
      if (data.conversationId === conversationId && data.userId === otherUserId) {
        // Mark all our messages as read when other user is viewing
        setMessages((prev) => prev.map(msg => {
          if (msg.sender_id === user?.id) {
            return { ...msg, status: 'read' as const };
          }
          return msg;
        }));
      }
    };

    // Listen for user status changes (online/offline/last_seen updates)
    const handleUserStatusChanged = (data: any) => {
      if (String(data.userId) === String(otherUserId)) {
        // Update online status
        if (data.status !== undefined) {
          const newIsOnline = data.status === 'online';
          setIsOnline(newIsOnline);
        }
        // Update last_seen when status changes (e.g., going offline)
        // Match the logic in ChatListScreen: when user goes offline, update last_seen immediately
        // When user goes online, keep existing last_seen (don't overwrite)
        const updatedLastSeen = (data.status === 'offline' && data.lastSeen) 
          ? data.lastSeen 
          : (data.lastSeen || userLastSeen);
        
        // Only update if we have a new lastSeen value (when user goes offline)
        // If user goes online, keep existing userLastSeen (don't overwrite) - same as ChatListScreen
        if (data.status === 'offline' && data.lastSeen) {
          // Convert to ISO string if it's a Date object
          const lastSeenValue = data.lastSeen instanceof Date 
            ? data.lastSeen.toISOString() 
            : data.lastSeen;
          setUserLastSeen(lastSeenValue);
          
          // Also update conversations cache to sync with ChatListScreen
          queryClient.setQueryData(['conversations'], (oldData: any[]) => {
            if (!oldData) return oldData;
            
            return oldData.map((conv: any) => {
              const otherUserIdInConv = conv?.other_user_id || conv?.otherUserId;
              if (String(otherUserIdInConv) === String(data.userId)) {
                return {
                  ...conv,
                  status: data.status,
                  last_seen: lastSeenValue,
                  lastSeen: lastSeenValue,
                };
              }
              return conv;
            });
          });
        } else if (data.lastSeen && !data.status) {
          // If lastSeen is provided but no status change, still update it
          const lastSeenValue = data.lastSeen instanceof Date 
            ? data.lastSeen.toISOString() 
            : data.lastSeen;
          setUserLastSeen(lastSeenValue);
          
          // Also update conversations cache
          queryClient.setQueryData(['conversations'], (oldData: any[]) => {
            if (!oldData) return oldData;
            
            return oldData.map((conv: any) => {
              const otherUserIdInConv = conv?.other_user_id || conv?.otherUserId;
              if (String(otherUserIdInConv) === String(data.userId)) {
                return {
                  ...conv,
                  last_seen: lastSeenValue,
                  lastSeen: lastSeenValue,
                };
              }
              return conv;
            });
          });
        }
        // If user goes online, keep existing userLastSeen (don't overwrite) - same as ChatListScreen
      }
    };

    // Handle message edited from real-time
    const handleMessageEdited = (data: { messageId: string; content: string; conversationId: string }) => {
      if (data.conversationId === conversationId) {
        setMessages((prev) => prev.map(msg => 
          msg.id === data.messageId 
            ? { ...msg, content: data.content, edited: true }
            : msg
        ));
      }
    };

    // Handle message deleted from real-time
    const handleMessageDeleted = (data: { messageId: string; conversationId: string; deleteForEveryone?: boolean }) => {
      if (data.conversationId === conversationId) {
        // Only remove message if deleteForEveryone is true
        // If deleteForMe (false), the message should only be removed for the user who deleted it
        // Other users should still see the message
        if (data.deleteForEveryone === true) {
          setMessages((prev) => prev.filter(msg => msg.id !== data.messageId));
        }
        // If deleteForMe (false), do nothing - let server filter handle it on next fetch
      }
    };

    // Handle reaction updates from real-time
    const handleReactionUpdate = (data: { messageId: string; reactions: string[]; conversationId: string; userId?: string }) => {
      if (data.conversationId === conversationId) {
        // Update message reactions from socket (from other users or server sync)
        setMessages((prev) => prev.map(msg => {
          if (String(msg.id) === String(data.messageId)) {
            // Only update if reactions are different (avoid unnecessary re-renders)
            const currentReactions = msg.reactions 
              ? (typeof msg.reactions === 'string' ? JSON.parse(msg.reactions) : msg.reactions)
              : [];
            const newReactions = data.reactions || [];
            
            // Compare reactions arrays (deep comparison)
            const currentReactionsStr = JSON.stringify([...currentReactions].sort());
            const newReactionsStr = JSON.stringify([...newReactions].sort());
            const isSame = currentReactionsStr === newReactionsStr;
            
            if (!isSame) {
              // Create new object with new reactions array and timestamp to force re-render
              return { 
                ...msg, 
                reactions: [...newReactions], // New array reference
                _updated: Date.now() // Force re-render
              };
            }
          }
          return msg;
        }));
      }
    };

    socket.on('receiveMessage', handleNewMessage);
    socket.on('userTyping', handleUserTyping);
    socket.on('userStoppedTyping', handleUserStoppedTyping);
    socket.on('messageRead', handleMessageRead);
    socket.on('messageDelivered', handleMessageDelivered);
    socket.on('userViewingConversation', handleUserViewingConversation);
    socket.on('userStatusChanged', handleUserStatusChanged);
    socket.on('messageEdited', handleMessageEdited);
    socket.on('messageDeleted', handleMessageDeleted);
    socket.on('reactionUpdate', handleReactionUpdate);

    return () => {
      socket.off('receiveMessage', handleNewMessage);
      socket.off('userTyping', handleUserTyping);
      socket.off('userStoppedTyping', handleUserStoppedTyping);
      socket.off('messageRead', handleMessageRead);
      socket.off('messageDelivered', handleMessageDelivered);
      socket.off('userViewingConversation', handleUserViewingConversation);
      socket.off('userStatusChanged', handleUserStatusChanged);
      socket.off('messageEdited', handleMessageEdited);
      socket.off('messageDeleted', handleMessageDeleted);
      socket.off('reactionUpdate', handleReactionUpdate);
    };
  }, [socket, conversationId, refetchMessages, user?.id, otherUserId, queryClient, markAllMessagesAsRead]);

  const handleReply = (message: any) => {
    // Set the message to reply to
    setReplyToMessage(message);
    // Focus input after a short delay
    setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
  };

  const handleCancelReply = () => {
    setReplyToMessage(null);
    // Also cancel edit if editing
    if (editingMessage) {
      setEditingMessage(null);
      setInputText('');
    }
  };

  const handleLongPress = (message: any, position: { x: number; y: number }) => {
    setSelectedMessage(message);
    setMenuPosition(position);
    setContextMenuVisible(true);
  };

  const handleCloseContextMenu = () => {
    setContextMenuVisible(false);
    // KHÔNG set selectedMessage = null ở đây vì có thể cần dùng cho delete dialog
    // Chỉ set null khi dialog delete đóng hoặc sau khi xóa thành công
    setMenuPosition(undefined);
  };

  const handleCopy = async () => {
    if (selectedMessage?.content) {
      Clipboard.setString(selectedMessage.content);
      // Hiển thị notification bar với animation
      setCopyNotificationVisible(true);
      Animated.sequence([
        Animated.timing(copyNotificationOpacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.delay(1800),
        Animated.timing(copyNotificationOpacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setCopyNotificationVisible(false);
        copyNotificationOpacity.setValue(0);
      });
    }
  };

  const handleForward = () => {
    // TODO: Implement forward functionality
  };

  const handlePin = () => {
    // TODO: Implement pin functionality
  };

  const handleSave = () => {
    // TODO: Implement save message functionality
  };

  const handleCreateTask = () => {
    // TODO: Implement create task functionality
  };

  const handleSelect = () => {
    // TODO: Implement select message functionality
  };

  const handleReaction = async (emoji: string) => {
    if (!selectedMessage || !conversationId) return;
    
    const messageId = selectedMessage.id;
    
    // Lấy reactions từ messages array mới nhất để đảm bảo sync
    // Tìm message trong messages array để lấy reactions mới nhất
    const currentMessage = messages.find(msg => String(msg.id) === String(messageId));
    const currentReactions = currentMessage?.reactions 
      ? (typeof currentMessage.reactions === 'string' 
          ? JSON.parse(currentMessage.reactions) 
          : currentMessage.reactions)
      : (selectedMessage.reactions 
          ? (typeof selectedMessage.reactions === 'string' 
              ? JSON.parse(selectedMessage.reactions) 
              : selectedMessage.reactions)
          : []);
    
    // Toggle reaction - đảm bảo logic toggle đúng
    const newReactions = [...currentReactions];
    const existingIndex = newReactions.indexOf(emoji);
    
    if (existingIndex > -1) {
      // Remove reaction if already exists (toggle off)
      newReactions.splice(existingIndex, 1);
    } else {
      // Add reaction (toggle on)
      newReactions.push(emoji);
    }
    
    // Optimistic update: Update local state immediately for instant UI update
    // Create new object to ensure React detects the change
    const previousReactions = [...currentReactions];
    
    setMessages((prev) => {
      const updated = prev.map(msg => {
        if (String(msg.id) === String(messageId)) {
          // Create completely new object to ensure React re-renders
          return { 
            ...msg, 
            reactions: [...newReactions], // New array reference
            // Force update by adding a timestamp to ensure re-render
            _updated: Date.now()
          };
        }
        return msg;
      });
      return updated;
    });
    
    // Also update selectedMessage immediately for context menu - sync với messages mới
    setSelectedMessage((prev: any | null) => {
      if (prev && String(prev.id) === String(messageId)) {
        return {
          ...prev,
          reactions: [...newReactions],
        };
      }
      return prev;
    });
    
    // Close context menu immediately after update
    setContextMenuVisible(false);
    
    // Emit via socket immediately to sync with other user (real-time update)
    if (socket?.connected) {
      socket.emit('reactionUpdate', {
        messageId: messageId,
        reactions: newReactions,
        conversationId: conversationId,
        userId: user?.id
      });
    }
    
    // Save to server (update database)
    try {
      await chatAPI.updateReactions(messageId, newReactions);
      
      // Invalidate cache và refetch messages trong background (không await để UI mượt hơn)
      // Optimistic update đã đủ để UI responsive, refetch chỉ để sync với server
      queryClient.invalidateQueries({ queryKey: ['messages', conversationId] });
      // Refetch trong background, không block UI
      refetchMessages().catch(err => console.error('Background refetch error:', err));
    } catch (error) {
      console.error('Error updating reactions:', error);
      
      // Rollback optimistic update on error
      setMessages((prev) => prev.map(msg => {
        if (String(msg.id) === String(messageId)) {
          return { 
            ...msg, 
            reactions: [...previousReactions],
            _updated: Date.now()
          };
        }
        return msg;
      }));
      
      // Rollback selectedMessage
      setSelectedMessage((prev: any | null) => {
        if (prev && String(prev.id) === String(messageId)) {
          return {
            ...prev,
            reactions: [...previousReactions],
          };
        }
        return prev;
      });
      
      // Emit rollback via socket
      if (socket?.connected) {
        socket.emit('reactionUpdate', {
          messageId: messageId,
          reactions: previousReactions,
          conversationId: conversationId,
          userId: user?.id
        });
      }
      
      // Refetch messages on error to ensure consistency (background, không block UI)
      refetchMessages().catch(err => console.error('Error refetch after rollback:', err));
    }
  };

  const handleEdit = () => {
    if (!selectedMessage) return;
    setEditingMessage(selectedMessage);
    setInputText(selectedMessage.content);
    // Focus input
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const handleDeleteRequest = () => {
    // Giữ selectedMessage khi mở dialog xóa
    if (selectedMessage) {
      setDeleteDialogVisible(true);
    } else {
      console.log('Cannot open delete dialog: selectedMessage is null');
    }
  };

  // Admin: Delete sticker from pack
  const handleDeleteSticker = async () => {
    if (!selectedMessage || !conversationId) {
      console.log('Cannot delete sticker: missing selectedMessage or conversationId');
      return;
    }

    const messageType = selectedMessage.message_type || selectedMessage.type;
    if (messageType !== 'sticker') {
      console.log('Cannot delete sticker: message is not a sticker');
      return;
    }

    // Parse sticker data from message content
    let packId: string | null = null;
    let stickerIndex: number | null = null;

    try {
      if (selectedMessage.content) {
        const stickerData = JSON.parse(selectedMessage.content);
        packId = stickerData?.packId || stickerData?.packid || stickerData?.pack_id;
        stickerIndex = stickerData?.stickerIndex !== undefined 
          ? stickerData.stickerIndex 
          : (stickerData?.stickerindex !== undefined 
            ? stickerData.stickerindex 
            : (stickerData?.sticker_index !== undefined ? stickerData.sticker_index : null));
      }
    } catch (e) {
      console.error('Error parsing sticker data:', e);
      Alert.alert('Lỗi', 'Không thể đọc thông tin sticker');
      return;
    }

    if (!packId || stickerIndex === null) {
      Alert.alert('Lỗi', 'Không tìm thấy thông tin sticker');
      return;
    }

    // Confirm deletion
    Alert.alert(
      'Xóa sticker',
      'Bạn có chắc chắn muốn xóa sticker này khỏi pack? Hành động này không thể hoàn tác.',
      [
        {
          text: 'Hủy',
          style: 'cancel',
        },
        {
          text: 'Xóa',
          style: 'destructive',
          onPress: async () => {
            try {
              // Call API to delete sticker
              await stickerAPI.deleteSticker(packId, stickerIndex);
              
              // Invalidate và refetch sticker packs cache ngay lập tức
              await queryClient.invalidateQueries({ queryKey: ['sticker-packs'] });
              
              // Refetch tất cả queries liên quan đến sticker packs
              await queryClient.refetchQueries({ queryKey: ['sticker-packs'] });
              
              // Show success message
              Toast.show({
                type: 'success',
                text1: 'Thành công',
                text2: 'Đã xóa sticker khỏi pack',
              });
              
              // Close context menu
              setContextMenuVisible(false);
              setSelectedMessage(null);
              
              // Auto refresh sau 1-2 giây để đảm bảo data được cập nhật từ server
              setTimeout(async () => {
                await queryClient.invalidateQueries({ queryKey: ['sticker-packs'] });
                await queryClient.refetchQueries({ queryKey: ['sticker-packs'] });
              }, 1500);
            } catch (error: any) {
              console.error('Error deleting sticker:', error);
              const errorMessage = error?.response?.data?.message || error?.message || 'Không thể xóa sticker';
              Alert.alert('Lỗi', errorMessage);
            }
          },
        },
      ]
    );
  };

  const handleDeleteForMe = async () => {
    if (!selectedMessage || !conversationId) {
      console.log('Cannot delete: missing selectedMessage or conversationId');
      return;
    }
    
    const messageId = selectedMessage.id;
    
    try {
      // Remove from local state immediately (optimistic update - giống Facebook)
      setMessages((prev) => prev.filter(msg => msg.id !== messageId));
      
      // Close dialog immediately
      setDeleteDialogVisible(false);
      setSelectedMessage(null);
      
      // Call API
      await chatAPI.deleteMessage(messageId, false);
      
      // Refetch messages to ensure sync with server (server will filter deleted messages)
      await refetchMessages();
      
      // Emit via socket
      if (socket?.connected) {
        socket.emit('messageDeleted', {
          messageId: messageId,
          conversationId: conversationId,
          deleteForEveryone: false,
        });
      }
    } catch (error) {
      console.error('Error deleting message for me:', error);
      // Rollback on error - reload messages
      refetchMessages();
    }
  };

  const handleDeleteForEveryone = async () => {
    if (!selectedMessage || !conversationId) {
      console.log('Cannot delete: missing selectedMessage or conversationId');
      return;
    }
    
    const messageId = selectedMessage.id;
    
    try {
      // Remove from local state immediately (optimistic update - giống Facebook)
      setMessages((prev) => prev.filter(msg => msg.id !== messageId));
      
      // Close dialog immediately
      setDeleteDialogVisible(false);
      setSelectedMessage(null);
      
      // Call API
      await chatAPI.deleteMessage(messageId, true);
      
      // Invalidate and refetch messages to ensure sync with server
      queryClient.invalidateQueries({ queryKey: ['messages', conversationId] });
      await refetchMessages();
      
      // Emit via socket
      if (socket?.connected) {
        socket.emit('messageDeleted', {
          messageId: messageId,
          conversationId: conversationId,
          deleteForEveryone: true,
        });
      }
    } catch (error) {
      console.error('Error deleting message for everyone:', error);
      // Rollback on error - reload messages
      refetchMessages();
    }
  };

  // Handle media picker
  const handleOpenMediaPicker = () => {
    // Đóng keyboard và emoji picker trước khi mở media picker
    Keyboard.dismiss();
    if (inputRef.current) {
      inputRef.current.blur();
    }
    if (showEmojiPicker) {
      setShowEmojiPicker(false);
      emojiPanelAnimation.setValue(0);
    }
    setShowMediaPicker(true);
  };

  const handleBotMenu = () => {
    Keyboard.dismiss();
    if (inputRef.current) {
      inputRef.current.blur();
    }
    if (showEmojiPicker) {
      setShowEmojiPicker(false);
      emojiPanelAnimation.setValue(0);
    }
    setShowBotCommands(true);
  };

  const handleBotCommand = (command: string) => {
    setShowBotCommands(false);
    setInputText(command);
    // Tự động focus vào input để user có thể chỉnh sửa hoặc gửi ngay
    setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
  };

  // Danh sách lệnh bot phổ biến
  const botCommands = [
    { command: '/start', description: 'Bắt đầu sử dụng bot' },
    { command: '/help', description: 'Xem hướng dẫn sử dụng' },
    { command: '/settings', description: 'Cài đặt bot' },
    { command: '/about', description: 'Thông tin về bot' },
    { command: '/commands', description: 'Xem tất cả lệnh' },
  ];

  // Tạo câu trả lời bot dựa trên lệnh
  const getBotResponse = (command: string): string => {
    const cmd = command.toLowerCase().trim();
    
    if (cmd === '/start') {
      return `Xin chào! 👋\n\nChào mừng bạn đến với ${userName}!\n\nTôi có thể giúp bạn:\n• Trả lời câu hỏi\n• Hỗ trợ sử dụng\n• Cung cấp thông tin\n\nGửi /help để xem tất cả các lệnh có sẵn.`;
    }
    
    if (cmd === '/help') {
      return `📖 Hướng dẫn sử dụng\n\nCác lệnh có sẵn:\n\n/start - Bắt đầu sử dụng bot\n/help - Xem hướng dẫn này\n/settings - Cài đặt bot\n/about - Thông tin về bot\n/commands - Xem tất cả lệnh\n\nBạn có thể gửi bất kỳ câu hỏi nào và tôi sẽ cố gắng trả lời!`;
    }
    
    if (cmd === '/settings') {
      return `⚙️ Cài đặt Bot\n\nCác tùy chọn cài đặt:\n• Thông báo: Bật/Tắt\n• Ngôn ngữ: Tiếng Việt\n• Chế độ: Hoạt động\n\nGửi /help để biết thêm chi tiết.`;
    }
    
    if (cmd === '/about') {
      return `ℹ️ Thông tin về Bot\n\n${userName}\n\nBot hỗ trợ và trả lời tự động.\n\nPhiên bản: 1.0.0\nNgày tạo: 2025\n\nCảm ơn bạn đã sử dụng! 🙏`;
    }
    
    if (cmd === '/commands') {
      return `📋 Danh sách lệnh:\n\n/start - Bắt đầu sử dụng bot\n/help - Xem hướng dẫn sử dụng\n/settings - Cài đặt bot\n/about - Thông tin về bot\n/commands - Xem tất cả lệnh\n\nNhấn vào nút Menu để xem danh sách lệnh nhanh.`;
    }
    
    // Lệnh không hợp lệ
    return `❓ Lệnh không hợp lệ: ${command}\n\nGửi /help để xem danh sách lệnh có sẵn.`;
  };

  // Kiểm tra và xử lý lệnh bot
  const handleBotCommandResponse = (command: string) => {
    console.log('handleBotCommandResponse called:', { 
      command, 
      isBot, 
      otherUserId, 
      conversationId 
    });
    
    if (!isBot || !otherUserId || !conversationId) {
      console.log('Bot command response skipped:', { isBot, otherUserId, conversationId });
      return;
    }
    
    // Kiểm tra nếu là lệnh bot (bắt đầu bằng /)
    if (command.startsWith('/')) {
      const botResponse = getBotResponse(command);
      console.log('Bot response generated:', botResponse);
      
      // Tạo tin nhắn từ bot
      // Đảm bảo avatar_url giống với header (sử dụng userAvatarUrl từ route params)
      const botMessage = {
        id: `bot-${Date.now()}`,
        content: botResponse,
        sender_id: otherUserId, // Bot ID
        conversation_id: String(conversationId),
        created_at: new Date().toISOString(),
        type: 'text',
        message_type: 'text',
        status: 'delivered' as const,
        // Luôn sử dụng userAvatarUrl để đảm bảo avatar giống với header
        avatar_url: userAvatarUrl || undefined, // undefined thay vì null để MessageBubble có thể fallback về otherUserAvatar
        full_name: userName,
        username: userName.toLowerCase().replace(/\s+/g, '_'),
      };
      
      console.log('Bot message created:', botMessage);
      
      // Thêm tin nhắn bot sau một chút delay để tạo cảm giác tự nhiên
      setTimeout(() => {
        console.log('Adding bot message to UI');
        setMessages((prev) => {
          const updated = [botMessage, ...prev];
          
          // Scroll to bottom để hiển thị tin nhắn bot
          requestAnimationFrame(() => {
            setTimeout(() => {
              if (flatListRef.current) {
                flatListRef.current.scrollToOffset({ offset: 0, animated: true });
              }
            }, 100);
          });
          
          return updated;
        });
      }, 500); // Delay 500ms để tạo cảm giác bot đang "suy nghĩ"
    } else {
      console.log('Command does not start with /:', command);
    }
  };

  const handleCloseMediaPicker = () => {
    setShowMediaPicker(false);
  };

  const handlePickImage = async () => {
    handleCloseMediaPicker();
    
    // Đợi một chút để modal đóng hoàn toàn trước khi mở image picker
    setTimeout(async () => {
      try {
        const response = await launchImageLibrary({
          mediaType: 'mixed', // Cho phép chọn cả ảnh và video
          quality: 0.8,
          selectionLimit: 1,
        });
        
        // Log response an toàn - không dùng JSON.stringify vì có thể gây lỗi
        try {
          console.log('Image picker response:', {
            hasAssets: !!response?.assets,
            assetsLength: response?.assets?.length || 0,
            didCancel: response?.didCancel,
            hasError: !!response?.error,
            error: response?.error,
          });
        } catch (logError) {
          console.log('Image picker response received (could not log details)');
        }
        
        // Kiểm tra nếu user đã cancel
        if (response?.didCancel) {
          console.log('User cancelled image picker');
          return;
        }
        
        // Kiểm tra nếu có lỗi
        if (response?.error) {
          console.error('Image picker error:', response.error);
          Alert.alert('Lỗi', response.error || 'Không thể mở thư viện. Vui lòng thử lại.');
          return;
        }
        
        // Kiểm tra nếu có assets - xử lý an toàn
        if (response && typeof response === 'object') {
          // Thử nhiều cách để lấy assets - xử lý hoàn toàn an toàn
          let assets: any[] | undefined = undefined;
          try {
            if (response.assets && Array.isArray(response.assets)) {
              assets = response.assets;
            } else if (response && typeof response === 'object') {
              // Chỉ truy cập .images nếu response là object và đã kiểm tra
              const responseAny = response as any;
              if (responseAny.images && Array.isArray(responseAny.images)) {
                assets = responseAny.images;
              }
            }
          } catch (e) {
            console.error('Error accessing assets:', e);
          }
          
          if (assets && Array.isArray(assets) && assets.length > 0) {
            const asset = assets[0];
            if (asset && asset.uri) {
              const mediaType = asset.type?.startsWith('video') ? 'video' : 'image';
              console.log('Setting selected media:', { uri: asset.uri, type: mediaType });
              setSelectedMedia({
                uri: asset.uri,
                type: mediaType,
              });
            } else {
              console.error('Asset không có uri');
              Alert.alert('Lỗi', 'Không thể đọc file đã chọn. Vui lòng thử lại.');
            }
          } else {
            console.error('Không có assets trong response');
            Alert.alert('Lỗi', 'Không có file nào được chọn. Vui lòng thử lại.');
          }
        } else {
          console.error('Response không đúng định dạng');
          Alert.alert('Lỗi', 'Phản hồi từ thư viện không đúng định dạng. Vui lòng thử lại.');
        }
      } catch (error: any) {
        console.error('Error picking image:', error);
        console.error('Error message:', error?.message);
        console.error('Error stack:', error?.stack);
        Alert.alert('Lỗi', error?.message || 'Không thể mở thư viện. Vui lòng thử lại.');
      }
    }, 300);
  };

  const handlePickFile = () => {
    handleCloseMediaPicker();
    // TODO: Implement file picker
    Alert.alert('Thông báo', 'Tính năng chọn file sẽ được thêm sau.');
  };

  const handlePickLocation = () => {
    handleCloseMediaPicker();
    // TODO: Implement location picker
    Alert.alert('Thông báo', 'Tính năng chọn vị trí sẽ được thêm sau.');
  };

  const handleCreatePoll = () => {
    handleCloseMediaPicker();
    // TODO: Implement poll creation
    Alert.alert('Thông báo', 'Tính năng tạo bình chọn sẽ được thêm sau.');
  };

  const handleCreateTodo = () => {
    handleCloseMediaPicker();
    // TODO: Implement todo list creation
    Alert.alert('Thông báo', 'Tính năng tạo danh sách việc sẽ được thêm sau.');
  };

  const handlePickContact = () => {
    handleCloseMediaPicker();
    // TODO: Implement contact picker
    Alert.alert('Thông báo', 'Tính năng chọn danh bạ sẽ được thêm sau.');
  };

  // Check video duration when video is selected
  const handleVideoLoad = async () => {
    if (videoRef.current && selectedMedia?.type === 'video') {
      try {
        const status = await videoRef.current.getStatusAsync();
        if (status.isLoaded && status.durationMillis) {
          const durationSeconds = status.durationMillis / 1000;
          
          if (durationSeconds > MAX_VIDEO_DURATION) {
            Alert.alert(
              'Video quá dài',
              `Video không được vượt quá ${formatVideoDuration(MAX_VIDEO_DURATION)}. Video của bạn dài ${formatVideoDuration(durationSeconds)}.`
            );
            setSelectedMedia(null);
            return;
          }
        }
      } catch (error) {
        // Ignore errors - video might not be loaded yet
      }
    }
  };

  const handleRemoveMedia = () => {
    setSelectedMedia(null);
  };

  const handleSend = async () => {
    // Allow sending even if inputText is empty if there's media
    if (!inputText?.trim() && !selectedMedia) {
      return;
    }

    // Handle edit message (editing doesn't support media)
    if (editingMessage) {
      const messageId = editingMessage.id;
      const newContent = inputText.trim();
      const oldContent = editingMessage.content;
      
      try {
        // Optimistic update: Update local state immediately (giống Facebook)
        setMessages((prev) => prev.map(msg => 
          msg.id === messageId 
            ? { 
                ...msg, 
                content: newContent, 
                edited: true  // Set edited = true ngay lập tức
              } 
            : msg
        ));
        
        // Clear edit state immediately
        setEditingMessage(null);
        setInputText('');
        setReplyToMessage(null);
        
        // Call API
        const response = await chatAPI.updateMessage(messageId, newContent);
        const updatedMessage = response.data?.data || response.data;
        
        // Emit via socket - use messageEdited event name to match server
        if (socket?.connected) {
          socket.emit('messageEdited', {
            messageId: messageId,
            content: newContent,
            conversationId: conversationId,
          });
        }
        
        return;
      } catch (error) {
        console.error('Error editing message:', error);
        // Rollback optimistic update on error
        setMessages((prev) => prev.map(msg => 
          msg.id === messageId 
            ? { 
                ...msg, 
                content: oldContent, 
                edited: editingMessage.edited || false
              } 
            : msg
        ));
        // Restore edit state
        setEditingMessage(editingMessage);
        setInputText(newContent);
        return;
      }
    }
    
    if (!conversationId) {
      return;
    }

    if (!user?.id) {
      return;
    }

    let messageContent = inputText.trim() || '';
    // Lưu lại nội dung gốc để kiểm tra bot command (trước khi format với reply)
    const originalMessageContent = messageContent;
    let mediaUrl: string | undefined = undefined;
    let messageType: 'text' | 'image' | 'video' = 'text';
    const currentMedia = selectedMedia; // Store reference before upload

    // Upload media if selected
    if (currentMedia) {
      setUploadingMedia(true);
      try {
        if (currentMedia.type === 'image') {
          // Upload image
          const formData = new FormData();
          const imageType = currentMedia.uri.includes('.jpg') || currentMedia.uri.includes('.jpeg') 
            ? 'image/jpeg' 
            : currentMedia.uri.includes('.png')
            ? 'image/png'
            : 'image/jpeg';
          const imageName = currentMedia.uri.split('/').pop() || 'image.jpg';
          
          console.log('Preparing to upload image:', {
            uri: currentMedia.uri,
            type: imageType,
            name: imageName,
          });
          
          formData.append('image', {
            uri: currentMedia.uri,
            type: imageType,
            name: imageName,
          } as any);

          console.log('Uploading image to server...');
          const uploadRes = await uploadAPI.uploadImage(formData);
          console.log('Upload response received:', {
            status: uploadRes?.status,
            data: uploadRes?.data,
            fullResponse: JSON.stringify(uploadRes, null, 2),
          });
          
          // Server returns imageUrl for /upload/image endpoint
          // Format: { success: true, imageUrl: "/uploads/image-xxx.jpg" }
          const imageUrl = uploadRes?.data?.imageUrl || uploadRes?.data?.url;
          console.log('Extracted imageUrl:', imageUrl);
          
          if (imageUrl) {
            // Server returns path like "/uploads/image-xxx.jpg"
            // This will be stored in file_url field in database
            mediaUrl = imageUrl;
            messageType = 'image';
            console.log('Image upload successful, mediaUrl:', mediaUrl);
          } else {
            console.error('No imageUrl in response:', uploadRes);
            throw new Error('Không nhận được URL ảnh từ server. Vui lòng kiểm tra console để xem chi tiết.');
          }
        } else if (currentMedia.type === 'video') {
          // Upload video
          const formData = new FormData();
          const videoType = currentMedia.uri.includes('.mp4') ? 'video/mp4' : 'video/quicktime';
          const videoName = currentMedia.uri.split('/').pop() || 'video.mp4';
          
          formData.append('video', {
            uri: currentMedia.uri,
            type: videoType,
            name: videoName,
          } as any);

          const uploadRes = await uploadAPI.uploadVideo(formData);
          // Server returns url for /upload/video endpoint
          // Format: { success: true, url: "uploads/videos/video-xxx.mp4" }
          const videoUrl = uploadRes?.data?.url || uploadRes?.data?.videoUrl;
          if (videoUrl) {
            // Server returns path like "uploads/videos/video-xxx.mp4" (no leading slash)
            // Ensure it starts with / for consistency
            mediaUrl = videoUrl.startsWith('/') ? videoUrl : '/' + videoUrl;
            messageType = 'video';
          } else {
            throw new Error('Không nhận được URL video từ server');
          }
        }
      } catch (uploadError: any) {
        setUploadingMedia(false);
        console.error('Upload error details:', {
          message: uploadError?.message,
          response: uploadError?.response,
          responseData: uploadError?.response?.data,
          status: uploadError?.response?.status,
          stack: uploadError?.stack,
        });
        
        let errorMessage = 'Không thể tải media lên. Vui lòng thử lại.';
        if (uploadError?.response?.data?.message) {
          errorMessage = uploadError.response.data.message;
        } else if (uploadError?.message) {
          errorMessage = uploadError.message;
        } else if (uploadError?.response?.status === 400) {
          errorMessage = 'File không hợp lệ hoặc quá lớn. Vui lòng thử lại với file khác.';
        } else if (uploadError?.response?.status === 500) {
          errorMessage = 'Lỗi server khi upload. Vui lòng kiểm tra thư mục uploads trên server.';
        }
        
        Alert.alert('Lỗi tải media', errorMessage);
        setSelectedMedia(null); // Clear selected media on error
        return;
      } finally {
        setUploadingMedia(false);
      }
    }

    // Format message with reply if replying
    if (replyToMessage) {
      const originalMessage = replyToMessage.content || '';
      messageContent = messageContent 
        ? `Re: ${originalMessage}\n\n${messageContent}`
        : `Re: ${originalMessage}`;
    }

    // Optimistically add message to UI with user info
    const tempMessageId = `temp-${Date.now()}`;
    // Use file_url for media (server uses file_url field)
    const optimisticMessage = {
      id: tempMessageId,
      content: messageContent || (currentMedia ? (currentMedia.type === 'image' ? '📷 Ảnh' : '🎥 Video') : ''),
      sender_id: user.id,
      conversation_id: String(conversationId),
      created_at: new Date().toISOString(),
      type: messageType,
      message_type: messageType, // Also set message_type for compatibility
      status: 'sent' as const,
      avatar_url: user.avatar_url || null,
      full_name: user.full_name || user.username || '',
      username: user.username || '',
      // Server uses file_url field, so set it here
      ...(mediaUrl && { 
        file_url: mediaUrl,
        // Also set image_url/video_url for compatibility with MessageBubble
        image_url: currentMedia?.type === 'image' ? mediaUrl : undefined, 
        video_url: currentMedia?.type === 'video' ? mediaUrl : undefined,
      }),
    };
    
    // Add optimistic message immediately
    setMessages((prev) => {
      const updated = [optimisticMessage, ...prev];
      
      // Scroll to bottom immediately after adding message (for inverted list, scroll to offset 0)
      requestAnimationFrame(() => {
        setTimeout(() => {
          if (flatListRef.current) {
            flatListRef.current.scrollToOffset({ offset: 0, animated: true });
          }
        }, 50);
      });
      
      return updated;
    });
    setInputText('');
    setSelectedMedia(null); // Clear selected media after sending
    setReplyToMessage(null); // Clear reply after sending
    setShowEmojiPicker(false);
    // KHÔNG đóng bàn phím ở đây - để người dùng tiếp tục soạn tin nhắn
    // Bàn phím chỉ đóng khi chạm vào vùng trống phía trên
      
      // Stop typing when sending message
      if (isTyping && socket?.connected && conversationId) {
        setIsTyping(false);
        socket.emit('stopTyping', {
          conversationId: String(conversationId),
          userId: user?.id,
          username: user?.username,
          fullName: user?.full_name || user?.username,
        });
      }
      
      // Clear typing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = null;
      }

    try {
      // ALWAYS send via API first to save to database (like PWA client)
      const apiResponse = await chatAPI.sendMessage(
        String(conversationId), 
        messageContent || (currentMedia ? (currentMedia.type === 'image' ? '📷 Ảnh' : '🎥 Video') : ''), 
        messageType,
        mediaUrl
      );

      // Server returns messageId, but we need to refetch to get full message with file_url
      // Update optimistic message status and ensure file_url is set
      setMessages((prev) => prev.map(msg => {
        const id = msg?.id;
        if (id && String(id) === tempMessageId) {
          return { 
            ...msg, 
            status: 'delivered' as const,
            // Ensure file_url is set (it should already be set, but double-check)
            file_url: mediaUrl || msg.file_url,
            message_type: messageType, // Ensure message_type is set
          };
        }
        return msg;
      }));

      // Update conversation list immediately to show "Bạn: " prefix (like Facebook)
      const finalMessageContent = messageContent || (currentMedia ? (currentMedia.type === 'image' ? '📷 Ảnh' : '🎥 Video') : '');
      queryClient.setQueryData(['conversations'], (oldData: any[]) => {
        if (!oldData) return oldData;
        
        const updated = oldData.map((conv: any) => {
          const convId = conv?.id || conv?.conversation_id;
          if (String(convId) === String(conversationId)) {
            return {
              ...conv,
              last_message: finalMessageContent,
              last_message_time: new Date().toISOString(),
              last_message_sender_id: user?.id, // Set sender ID to current user to show "Bạn: " prefix
              updated_at: new Date().toISOString(),
            };
          }
          return conv;
        });
        
        // Sort: move updated conversation to top (most recent first)
        updated.sort((a: any, b: any) => {
          const timeA = new Date(a.updated_at || a.last_message_time || 0).getTime();
          const timeB = new Date(b.updated_at || b.last_message_time || 0).getTime();
          return timeB - timeA;
        });
        
        return updated;
      });

      // Xử lý câu trả lời bot nếu là lệnh bot
      // Dùng originalMessageContent thay vì messageContent vì messageContent có thể đã bị format với reply
      if (isBot && originalMessageContent && originalMessageContent.startsWith('/')) {
        console.log('Bot command detected:', originalMessageContent);
        handleBotCommandResponse(originalMessageContent);
      }
      
      // Refetch messages after a short delay to get the real message from server
      // The refetch will replace temp message with real message from server
      setTimeout(async () => {
        try {
          await refetchMessages();
          // After refetch, remove temp message if it still exists (should be replaced by real message)
          setMessages((prev) => {
            return prev.filter(m => {
              const id = m?.id;
              // Remove temp message only if we have real message with same content
              if (id && String(id) === tempMessageId) {
                // Check if we have a real message with same content from same sender
                const hasRealMessage = prev.some(msg => {
                  const msgId = msg?.id;
                  return msgId && 
                         !String(msgId).startsWith('temp-') &&
                         msg.content === messageContent &&
                         msg.sender_id === String(user?.id);
                });
                // Only remove temp if we have real message
                return !hasRealMessage;
              }
              return true;
            });
          });
        } catch (err) {
        }
      }, 500);

      // Then emit via socket for real-time delivery (if socket connected)
      // This matches PWA client behavior
      if (socket?.connected && otherUserId) {
        socket.emit('sendMessage', {
          receiverId: String(otherUserId),
          message: messageContent,
          senderId: String(user.id),
          conversationId: String(conversationId)
        });
      } else {
        // If socket not available, refetch after a delay to get the real message
        setTimeout(() => {
          refetchMessages().catch((err) => {
          });
        }, 1000);
      }

      // NOTE: We DON'T refetch immediately like before
      // The optimistic message will be replaced when:
      // 1. Socket listener receives the message (for other user)
      // 2. Or when we receive our own message via socket/refetch
      // Status will update to 'read' when other user views the conversation (via socket listener)
      
    } catch (error: any) {
      // Remove optimistic message on error
      setMessages((prev) => {
        const filtered = prev.filter(m => {
          const id = m?.id;
          return !id || String(id) !== tempMessageId;
        });
        return filtered;
      });
      
      // Restore input text
      setInputText(messageContent);
      
      // Show error to user (you can use toast/alert here)
      // Alert.alert('Lỗi', 'Không thể gửi tin nhắn. Vui lòng thử lại.');
    }
  };

  const toggleEmojiPicker = () => {
    if (showEmojiPicker) {
      // Đóng emoji picker trước
      setShowEmojiPicker(false);
      emojiPanelAnimation.setValue(0);
      // Reset bottom tabs và header về visible khi đóng
      setIsEmojiTabsVisible(true);
      emojiTabsAnimValue.setValue(1);
      emojiTabsTranslateY.setValue(1);
      bottomTabsLastScrollY.current = 0;
      setIsHeaderVisible(true);
      headerAnimValue.setValue(1);
      headerTranslateY.setValue(1);
      headerLastScrollY.current = 0;
      // Blur input trước để đảm bảo không có layout jump
      if (inputRef.current) {
        inputRef.current.blur();
      }
      // Đợi một chút để emoji picker đóng hoàn toàn và layout ổn định trước khi mở keyboard
      // Điều này tránh layout jump và icon nhảy
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
        }
      }, 250);
    } else {
      // Blur input trước để đóng keyboard
      if (inputRef.current) {
        inputRef.current.blur();
      }
      // Đóng keyboard
      Keyboard.dismiss();
      // Reset bottom tabs và header về visible khi mở
      setIsEmojiTabsVisible(true);
      emojiTabsAnimValue.setValue(1);
      emojiTabsTranslateY.setValue(1);
      bottomTabsLastScrollY.current = 0;
      setIsHeaderVisible(true);
      headerAnimValue.setValue(1);
      headerTranslateY.setValue(1);
      headerLastScrollY.current = 0;
      // Đợi keyboard đóng hoàn toàn trước khi mở emoji picker
      setTimeout(() => {
        setShowEmojiPicker(true);
        // Animate in
        Animated.timing(emojiPanelAnimation, {
          toValue: 1,
          duration: 200,
          useNativeDriver: false,
        }).start();
        // Scroll FlatList xuống để tin nhắn không bị che (giống Telegram)
        setTimeout(() => {
          if (flatListRef.current) {
            flatListRef.current.scrollToOffset({ offset: 0, animated: false });
          }
        }, 100);
      }, 150);
    }
  };

  // Handler để scroll xuống tin nhắn mới nhất
  const handleScrollToBottom = () => {
    if (flatListRef.current) {
      flatListRef.current.scrollToOffset({ offset: 0, animated: true });
      setShowScrollToBottom(false);
      setUnreadCount(0);
      lastSeenMessagesCountRef.current = messages.length;
      lastUnreadCountRef.current = 0;
    }
  };
  
  // Cập nhật unread count khi có tin nhắn mới
  useEffect(() => {
    if (messages.length > 0 && !showScrollToBottom) {
      // Nếu đang ở bottom, cập nhật last seen messages count và reset unread count
      lastSeenMessagesCountRef.current = messages.length;
      lastUnreadCountRef.current = 0;
      setUnreadCount(0);
    } else if (messages.length > 0 && showScrollToBottom && lastSeenMessagesCountRef.current > 0) {
      // Nếu đang scroll lên và đã có last seen count, đếm số tin nhắn MỚI từ người khác
      // Với inverted FlatList: index 0 = tin nhắn mới nhất
      if (messages.length > lastSeenMessagesCountRef.current) {
        // Có tin nhắn mới, chỉ đếm những tin nhắn MỚI từ người khác
        // Tính tổng số tin nhắn từ người khác từ index 0 đến (newMessagesCount - 1)
        let totalCount = 0;
        const newMessagesCount = messages.length - lastSeenMessagesCountRef.current;
        // Đếm tổng số tin nhắn từ người khác trong các tin nhắn mới
        for (let i = 0; i < newMessagesCount; i++) {
          const msg = messages[i];
          // Chỉ đếm tin nhắn từ người khác (không phải của mình)
          if (msg.sender_id !== user?.id) {
            totalCount++;
          }
        }
        // Unread count = tổng số tin nhắn mới từ người khác (chỉ tin nhắn mới, không phải tổng)
        setUnreadCount(totalCount);
        lastUnreadCountRef.current = totalCount;
      }
      // Nếu không có tin nhắn mới, giữ nguyên unread count hiện tại
    }
  }, [messages.length, showScrollToBottom, user?.id, messages]);

  // Handler để hiển thị bảng tương ứng khi click tab
  const handleTabPress = (tab: 'sticker' | 'emoji' | 'gif') => {
    setActiveEmojiTab(tab);
    // Reset bottom tabs và header về visible khi chuyển tab
    if (!isEmojiTabsVisible) {
      setIsEmojiTabsVisible(true);
      emojiTabsAnimValue.setValue(1);
      emojiTabsTranslateY.setValue(1);
    }
    if (!isHeaderVisible) {
      setIsHeaderVisible(true);
      headerAnimValue.setValue(1);
      headerTranslateY.setValue(1);
    }
    // Emoji và GIF là tab riêng biệt, không cần scroll
    // Chỉ phần Sticker mới có scroll effect bên trong
  };

  // Handler for sticker selection
  const handleStickerSelect = (packId: string, stickerIndex: number, sticker: any) => {
    if (!conversationId || !user) return;
    
    // Close emoji panel when sticker is selected
    if (showEmojiPicker) {
      setShowEmojiPicker(false);
      emojiPanelAnimation.setValue(0);
    }
    
    // Create sticker message content as JSON
    const stickerContent = JSON.stringify({ packId, stickerIndex });
    
    // Send sticker message directly
    sendStickerMessage(stickerContent, packId, stickerIndex);
  };

  // Function to send sticker message
  const sendStickerMessage = async (stickerContent: string, packId: string, stickerIndex: number) => {
    if (!conversationId || !user) return;
    
    const messageType = 'sticker';
    
    // Optimistically add message to UI
    const tempMessageId = `temp-${Date.now()}`;
    const optimisticMessage = {
      id: tempMessageId,
      content: stickerContent,
      sender_id: user.id,
      conversation_id: String(conversationId),
      created_at: new Date().toISOString(),
      type: messageType,
      message_type: messageType,
      status: 'sent' as const,
      avatar_url: user.avatar_url || null,
      full_name: user.full_name || user.username || '',
      username: user.username || '',
    };
    
    // Add optimistic message immediately
    setMessages((prev) => {
      const updated = [optimisticMessage, ...prev];
      requestAnimationFrame(() => {
        setTimeout(() => {
          if (flatListRef.current) {
            flatListRef.current.scrollToOffset({ offset: 0, animated: true });
          }
        }, 50);
      });
      return updated;
    });
    
    setShowStickerPicker(false);
    
    // Stop typing when sending message
    if (isTyping && socket?.connected && conversationId) {
      setIsTyping(false);
      socket.emit('stopTyping', {
        conversationId: String(conversationId),
        userId: user?.id,
        username: user?.username,
        fullName: user?.full_name || user?.username,
      });
    }
    
    // Clear typing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }

    try {
      // Send sticker message via API
      const apiResponse = await chatAPI.sendMessage(
        String(conversationId),
        stickerContent,
        messageType
      );

      // Update optimistic message status
      setMessages((prev) => prev.map(msg => {
        const id = msg?.id;
        if (id && String(id) === tempMessageId) {
          return { 
            ...msg, 
            status: 'delivered' as const,
            message_type: messageType,
          };
        }
        return msg;
      }));

      // Update conversation list
      queryClient.setQueryData(['conversations'], (oldData: any[]) => {
        if (!oldData) return oldData;
        
        const updated = oldData.map((conv: any) => {
          const convId = conv?.id || conv?.conversation_id;
          if (String(convId) === String(conversationId)) {
            return {
              ...conv,
              last_message: 'Sticker',
              last_message_time: new Date().toISOString(),
              last_message_sender_id: user?.id,
              updated_at: new Date().toISOString(),
            };
          }
          return conv;
        });
        
        updated.sort((a: any, b: any) => {
          const timeA = new Date(a.updated_at || a.last_message_time || 0).getTime();
          const timeB = new Date(b.updated_at || b.last_message_time || 0).getTime();
          return timeB - timeA;
        });
        
        return updated;
      });
      
      // Refetch messages after a short delay
      setTimeout(async () => {
        try {
          await refetchMessages();
          setMessages((prev) => {
            return prev.filter(m => {
              const id = m?.id;
              if (id && String(id) === tempMessageId) {
                const hasRealMessage = prev.some(msg => {
                  const msgId = msg?.id;
                  return msgId && 
                         !String(msgId).startsWith('temp-') &&
                         msg.message_type === 'sticker' &&
                         msg.sender_id === String(user?.id);
                });
                return !hasRealMessage;
              }
              return true;
            });
          });
        } catch (err) {
        }
      }, 500);

      // Emit via socket for real-time delivery
      if (socket?.connected && otherUserId) {
        socket.emit('sendMessage', {
          receiverId: String(otherUserId),
          message: stickerContent,
          senderId: String(user.id),
          conversationId: String(conversationId)
        });
      } else {
        setTimeout(() => {
          refetchMessages().catch((err) => {
          });
        }, 1000);
      }
      
    } catch (error: any) {
      // Remove optimistic message on error
      setMessages((prev) => {
        const filtered = prev.filter(m => {
          const id = m?.id;
          return !id || String(id) !== tempMessageId;
        });
        return filtered;
      });
      
      Alert.alert('Lỗi', 'Không thể gửi sticker. Vui lòng thử lại.');
    }
  };

  const addEmoji = (emoji: string) => {
    setInputText((prev) => prev + emoji);
  };

  const deleteEmoji = () => {
    setInputText((prev) => {
      if (prev.length === 0) return prev;
      
      // Xóa emoji hoặc ký tự cuối cùng
      // Emoji có thể là multi-byte (surrogate pairs), cần xử lý đúng cách
      // Sử dụng Array.from để xử lý đúng emoji (split theo code point thay vì char)
      const chars = Array.from(prev);
      
      if (chars.length === 0) return prev;
      
      // Xóa ký tự cuối cùng (có thể là emoji hoặc text)
      chars.pop();
      
      return chars.join('');
    });
  };

  // Basic emoji data grouped by categories (expandable)
  const EMOJI_CATEGORIES: { key: string; label: string; emojis: string[] }[] = [
    { key: 'Smileys', label: '🙂', emojis: ['😀','😁','😂','🤣','😊','😍','😘','😜','😎','😢','😭','😡','🤔','🤗','🤩','😴','😇','🤤','😱','🤯','🙄','😏','😌','🥰','🤪','🥳'] },
    { key: 'Gestures', label: '👍', emojis: ['👍','👎','👌','✌️','🤞','🤟','🤘','👏','🙌','🙏','👋','🤙','💪','👐','✋','👉','👈','👆','👇'] },
    { key: 'Animals', label: '🐶', emojis: ['🐶','🐱','🐭','🐹','🐰','🦊','🐻','🐼','🐨','🐯','🦁','🐮','🐷','🐸','🐵','🐔','🐧','🐦','🐤'] },
    { key: 'Food', label: '🍔', emojis: ['🍏','🍎','🍌','🍉','🍓','🍒','🍍','🥭','🍑','🍅','🥕','🍆','🌽','🥔','🍞','🧀','🍗','🍣','🍕'] },
    { key: 'Activities', label: '⚽', emojis: ['⚽','🏀','🏈','⚾','🎾','🏐','🏉','🎱','🏓','🏸','🥊','🥋','🎮','🎲','🎯','🎤','🎧','🎵','🎷'] },
    { key: 'Travel', label: '🚗', emojis: ['🚗','🚕','🚌','🚎','🏎️','🚓','🚑','🚒','🚲','🛴','🛵','🏍️','✈️','🛩️','🚀','🚢','⛵','🚁'] },
    { key: 'Objects', label: '💡', emojis: ['💡','📱','💻','⌚','🖥️','🖨️','📷','🎥','🔦','📺','📚','🖊️','📝','📎','🔒','🔑','🛠️','⚙️'] },
    { key: 'Symbols', label: '❤️', emojis: ['❤️','🧡','💛','💚','💙','💜','🖤','🤍','🤎','💔','❣️','💕','💞','💓','💗','💖','💘','💝'] },
  ];
  const currentCategory = EMOJI_CATEGORIES.find(c => c.key === activeEmojiCategory) || EMOJI_CATEGORIES[0];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Appbar.Header style={{ backgroundColor: colors.background, elevation: 0 }}>
        <Appbar.BackAction color={colors.text} onPress={() => navigation.goBack()} />
        <View style={styles.headerInfoContainer}>
          {/* Ẩn avatar khi là group chat */}
          {!isGroupChat && (
            <View style={styles.avatarWrapper}>
              {/* Single avatar for private chat */}
              {userAvatarUrl ? (
                <Avatar.Image
                  size={36}
                  source={{ uri: getAvatarURL(userAvatarUrl) }}
                  style={{ backgroundColor: colors.primary }}
                />
              ) : (
                <Avatar.Text
                  size={36}
                  label={(userName || 'U').substring(0, 1).toUpperCase()}
                  style={{ backgroundColor: colors.primary }}
                />
              )}
              {/* Only show green dot when online (like Facebook), hide when offline, bot, group chat, or activity status disabled */}
              {isOnline && !isBot && !isGroupChat && activityStatusEnabled && (
                <View style={[
                  styles.statusDot, 
                  { 
                    backgroundColor: '#10b981',
                    borderColor: colors.background 
                  }
                ]} />
              )}
            </View>
          )}
          <TouchableOpacity 
            style={{ marginLeft: !isGroupChat ? 10 : 0, flex: 1 }}
            onPress={() => {
              // If group chat with participants, show participants modal
              if (isGroupChat) {
                const participantsArray = Array.isArray(participants) ? participants : [];
                if (participantsArray.length > 0) {
                  setShowParticipantsModal(true);
                }
              } else {
                // Private chat - show user profile
                setSelectedUserForProfile({
                  userId: otherUserId,
                  userName: userName,
                  userAvatar: userAvatarUrl,
                  isOwnProfile: otherUserId === user?.id,
                });
                setShowUserProfileModal(true);
              }
            }}
            activeOpacity={0.7}
          >
            <Text numberOfLines={1} style={[styles.headerName, { color: colors.text }]}>
              {userName || 'Chat'}
            </Text>
            {/* Show participants count for group chats, or status for private chats */}
            {isGroupChat ? (
              <Text numberOfLines={1} style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
                {isLoadingParticipants 
                  ? 'Đang tải...' 
                  : (Array.isArray(participants) && participants.length > 0)
                    ? `Cộng đồng • ${participants.length} thành viên`
                    : (participantsError 
                        ? 'Không thể tải thành viên'
                        : 'Đang tải thành viên...')}
              </Text>
            ) : !isBot && activityStatusEnabled ? (
              <>
                {isOnline ? (
                  <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
                    Đang hoạt động
                  </Text>
                ) : userLastSeen ? (() => {
                  // When offline: use lastSeen (time when user went offline) to show "Hoạt động X phút trước"
                  // This starts counting from when user went offline, not from last message time
                  // Match the logic in chat list: always use lastSeen when offline (don't check isRecentActivity)
                  // timeRefreshKey forces re-render every minute to update time display
                  const timeAgo = getTimeAgo(userLastSeen);
                  return timeAgo ? (
                    <Text key={`time-${timeRefreshKey}`} style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
                      Hoạt động {timeAgo}
                    </Text>
                  ) : null;
                })() : lastMessageTime ? (() => {
                  // Fallback to lastMessageTime only if lastSeen is not available
                  // timeRefreshKey forces re-render every minute to update time display
                  const timeAgo = getTimeAgo(lastMessageTime);
                  return timeAgo ? (
                    <Text key={`time-${timeRefreshKey}`} style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
                      Hoạt động {timeAgo}
                    </Text>
                  ) : null;
                })() : null}
              </>
            ) : null}
          </TouchableOpacity>
        </View>
        {/* Icons cho group chat: group members, search, menu */}
        {isGroupChat ? (
          <>
            <IconButton 
              icon="account-plus" 
              iconColor={colors.text}
              onPress={() => {
                setShowAddMembersModal(true);
              }}
            />
            <IconButton 
              icon="account-group" 
              iconColor={colors.text}
              onPress={() => {
                const participantsArray = Array.isArray(participants) ? participants : [];
                if (participantsArray.length > 0) {
                  setShowParticipantsModal(true);
                }
              }}
            />
            <IconButton 
              icon="magnify" 
              iconColor={colors.text}
              onPress={() => {
                // TODO: Implement search functionality
                Toast.show({
                  type: 'info',
                  text1: 'Tìm kiếm',
                  text2: 'Tính năng đang được phát triển',
                });
              }}
            />
            <IconButton 
              icon="dots-vertical" 
              iconColor={colors.text}
              onPress={() => {
                // TODO: Implement menu functionality
                Toast.show({
                  type: 'info',
                  text1: 'Menu',
                  text2: 'Tính năng đang được phát triển',
                });
              }}
            />
          </>
        ) : (
          <>
            {/* Ẩn nút phone và video call khi chat với bot */}
            {!isBot && (
              <IconButton 
                icon="phone" 
                iconColor={socket?.connected ? colors.text : colors.textSecondary} 
                disabled={!socket?.connected}
                onPress={async () => {
            if (!conversationId || !otherUserId) {
              return;
            }

            // Check socket connection before navigating
            if (!socket) {
              Alert.alert(
                'Không thể kết nối',
                'Socket chưa được khởi tạo. Vui lòng đợi một chút và thử lại.',
                [{ text: 'OK' }]
              );
              return;
            }

            if (!socket.connected) {
              Alert.alert(
                'Không thể kết nối',
                'Đang kết nối với server...\n\nVui lòng:\n1. Kiểm tra kết nối mạng\n2. Đợi một chút và thử lại\n3. Đảm bảo server đang chạy',
                [
                  { text: 'Thử lại', onPress: () => {
                    // Force socket reconnect
                    if (socket && !socket.connected) {
                      socket.connect();
                    }
                    // Try again after a delay
                    setTimeout(() => {
                      if (socket?.connected) {
                        navigation.navigate('VideoCall', {
                          conversationId: String(conversationId),
                          userName: userName || 'Người dùng',
                          otherUserId: String(otherUserId),
                          isVideo: false,
                          userAvatarUrl: userAvatarUrl,
                        });
                      }
                    }, 2000);
                  }},
                  { text: 'Hủy', style: 'cancel' }
                ]
              );
              return;
            }

            navigation.navigate('VideoCall', {
              conversationId: String(conversationId),
              userName: userName || 'Người dùng',
              otherUserId: String(otherUserId),
              isVideo: false,
              userAvatarUrl: userAvatarUrl,
            });
          }} 
              />
            )}
            {/* Ẩn nút video call khi chat với bot */}
            {!isBot && (
              <IconButton 
                icon="video" 
            iconColor={socket?.connected ? colors.text : colors.textSecondary} 
            disabled={!socket?.connected}
            onPress={async () => {
            if (!conversationId || !otherUserId) {
              return;
            }

            // Check socket connection before navigating
            if (!socket) {
              Alert.alert(
                'Không thể kết nối',
                'Socket chưa được khởi tạo. Vui lòng đợi một chút và thử lại.',
                [{ text: 'OK' }]
              );
              return;
            }

            if (!socket.connected) {
              Alert.alert(
                'Không thể kết nối',
                'Đang kết nối với server...\n\nVui lòng:\n1. Kiểm tra kết nối mạng\n2. Đợi một chút và thử lại\n3. Đảm bảo server đang chạy',
                [
                  { text: 'Thử lại', onPress: () => {
                    // Force socket reconnect
                    if (socket && !socket.connected) {
                      socket.connect();
                    }
                    // Try again after a delay
                    setTimeout(() => {
                      if (socket?.connected) {
                        navigation.navigate('VideoCall', {
                          conversationId: String(conversationId),
                          userName: userName || 'Người dùng',
                          otherUserId: String(otherUserId),
                          isVideo: true,
                          userAvatarUrl: userAvatarUrl,
                        });
                      }
                    }, 2000);
                  }},
                  { text: 'Hủy', style: 'cancel' }
                ]
              );
              return;
            }

            navigation.navigate('VideoCall', {
              conversationId: String(conversationId),
              userName: userName || 'Người dùng',
              otherUserId: String(otherUserId),
              isVideo: true,
              userAvatarUrl: userAvatarUrl,
            });
          }} 
              />
            )}
          </>
        )}
      </Appbar.Header>

      {editingMessage && !replyToMessage && (
        <View style={[
          styles.editIndicator,
          {
            backgroundColor: colors.surface,
            borderTopColor: colors.border,
          },
        ]}>
          <MaterialCommunityIcons name="pencil" size={20} color={colors.textSecondary} style={styles.editIcon} />
          <View style={styles.editContent}>
            <Text style={[styles.editingText, { color: colors.textSecondary }]}>Đang chỉnh sửa</Text>
            <Text style={[styles.editMessageContent, { color: colors.text }]} numberOfLines={1}>
              {editingMessage.content}
            </Text>
          </View>
          <TouchableOpacity onPress={handleCancelReply} style={styles.editCloseButton}>
            <MaterialCommunityIcons name="close-circle" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>
      )}

      {!conversationId ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 }}>
          <Text variant="bodyMedium" style={{ color: colors.textSecondary }}>
            Không tìm thấy cuộc trò chuyện
          </Text>
        </View>
      ) : (
      <View style={{ flex: 1, paddingBottom: inputBarHeight + (replyToMessage ? 56 : 0) + (showEmojiPicker ? emojiPanelHeight : (keyboardHeight > 0 ? keyboardHeight : 18)) }}>
      {/* Wrapper để detect tap vào vùng trống */}
      <Pressable
        style={{ flex: 1 }}
        onPress={() => {
          // Đóng bàn phím khi chạm vào vùng trống (giống Telegram)
          Keyboard.dismiss();
          if (showEmojiPicker) {
            setShowEmojiPicker(false);
            emojiPanelAnimation.setValue(0);
          }
        }}
      >
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item, index) => {
          // Include _updated timestamp in key to force re-render when reactions change
          const baseKey = item?.id ? String(item.id) : `msg-${index}`;
          const updateKey = item?._updated ? `-${item._updated}` : '';
          return `${baseKey}${updateKey}`;
        }}
        extraData={messages} // Force re-render when messages array changes
        removeClippedSubviews={false}
        maxToRenderPerBatch={10}
        updateCellsBatchingPeriod={50}
        initialNumToRender={15}
        windowSize={10}
        renderItem={({ item, index }) => {
          // Since FlatList is inverted, messages are displayed from bottom to top
          // Messages array is: [newest, ..., oldest] (for inverted FlatList)
          // Index 0 = newest message (at bottom visually)
          // Index length-1 = oldest message (at top visually)
          
          // For date separator: we compare with the PREVIOUS message (which comes AFTER in array due to inversion)
          // Previous message in array = next message visually (below)
          // Next message in array = previous message visually (above)
          
          const nextMessageInArray = index > 0 ? messages[index - 1] : null; // Message below (newer)
          const prevMessageInArray = index < messages.length - 1 ? messages[index + 1] : null; // Message above (older)
          
          // Show avatar if it's the first message in a group (previous message has different sender)
          // Show avatar if it's the first message or different sender, but NOT for own messages
          const isOwn = item.sender_id === user?.id;
          const showAvatar = !isOwn && (!prevMessageInArray || prevMessageInArray.sender_id !== item.sender_id);
          
          // Show time if:
          // 1. It's the last message in the group (next message has different sender)
          // 2. Time difference is more than 1 minute
          // 3. Luôn hiển thị cho tin nhắn cuối cùng trong nhóm hoặc tin nhắn đầu tiên trong nhóm
          const isLastInGroup = !nextMessageInArray || nextMessageInArray.sender_id !== item.sender_id;
          const isFirstInGroup = !prevMessageInArray || prevMessageInArray.sender_id !== item.sender_id;
          const timeDiff = nextMessageInArray?.created_at && item.created_at 
            ? new Date(nextMessageInArray.created_at).getTime() - new Date(item.created_at).getTime() 
            : 0;
          
          // Hiển thị timestamp cho: tin nhắn cuối cùng trong nhóm, tin nhắn đầu tiên trong nhóm, hoặc khi khoảng thời gian > 1 phút
          const showTime = isLastInGroup || isFirstInGroup || timeDiff > 1 * 60 * 1000;
          
          // Show date separator if this is the first message of a new day
          // With inverted FlatList: compare with previous message (older, above) to show separator above current message
          // If there's no previous message OR previous message is from a different day, show separator
          // This ensures separator appears only once per day, above the first message of that day
          const showDateSeparator = !prevMessageInArray || 
            isDifferentDay(prevMessageInArray.created_at, item.created_at);

          // Check if message is unread (not from current user and not read)
          const isUnread = item.sender_id !== user?.id && 
            (item.read_at === null || item.read_at === undefined || item.status !== 'read');
          
          // Check if next message (newer, below) is read or from current user
          const nextIsRead = !nextMessageInArray || 
            nextMessageInArray.sender_id === user?.id ||
            (nextMessageInArray.read_at !== null && nextMessageInArray.read_at !== undefined) ||
            nextMessageInArray.status === 'read';
          
          // Show unread separator if current message is unread and next message is read (or doesn't exist)
          // This marks the start of unread messages section
          const showUnreadSeparator = isUnread && nextIsRead;

          return (
            <React.Fragment key={item.id}>
              <MessageBubble
                message={item}
                currentUserId={user?.id || ''}
                currentUserAvatar={user?.avatar_url}
                currentUserName={user?.full_name || user?.username}
                otherUserAvatar={userAvatarUrl}
                otherUserName={userName}
                nextMessage={nextMessageInArray} // Tin nhắn tiếp theo (newer) để kiểm tra nhóm đã đọc
                showAvatar={showAvatar}
                showTime={showTime}
                onReply={handleReply}
                onLongPress={handleLongPress}
              />
              {/* Unread messages separator: render AFTER MessageBubble so it appears ABOVE in inverted FlatList */}
              {showUnreadSeparator && (
                <View style={styles.unreadSeparator}>
                  <View style={[
                    styles.unreadSeparatorTextContainer,
                    { 
                      backgroundColor: isDarkMode ? colors.surface : colors.background,
                      borderColor: colors.primary || '#0084ff'
                    }
                  ]}>
                    <Text style={[styles.unreadSeparatorText, { color: colors.primary || '#0084ff' }]}>
                      Tin nhắn chưa đọc
                    </Text>
                  </View>
                </View>
              )}
              {/* Date separator: render AFTER MessageBubble so it appears ABOVE in inverted FlatList */}
              {showDateSeparator && (
                <View style={styles.dateSeparator}>
                  <View style={[
                    styles.dateSeparatorTextContainer,
                    { 
                      backgroundColor: isDarkMode ? colors.surface : colors.background,
                      borderColor: colors.border 
                    }
                  ]}>
                    <Text style={[styles.dateSeparatorText, { color: colors.textSecondary }]}>
                      {formatDate(item.created_at)}
                    </Text>
                  </View>
                </View>
              )}
            </React.Fragment>
          );
        }}
        inverted={true as boolean}
        style={[styles.messages, { backgroundColor: colors.background }]}
        contentContainerStyle={[
          styles.messagesContent,
          // Điều chỉnh padding để không bị che bởi input bar, reply bar và emoji picker
          // Reply bar height: ~48px (padding 8*2 + content ~32px)
          { paddingBottom: replyToMessage ? 56 : 0 },
        ]}
        keyboardShouldPersistTaps="never"
        keyboardDismissMode="interactive"
        onScrollBeginDrag={() => {
          // Đóng bàn phím khi bắt đầu scroll (giống Telegram)
          Keyboard.dismiss();
          if (showEmojiPicker) {
            setShowEmojiPicker(false);
            emojiPanelAnimation.setValue(0);
          }
        }}
        onScroll={(event) => {
          // Với inverted FlatList, offset = 0 là ở cuối (tin nhắn mới nhất)
          // Nếu offset > 100, nghĩa là đã scroll lên trên, hiển thị nút
          const offset = event.nativeEvent.contentOffset.y;
          const shouldShow = offset > 100; // Threshold 100px để hiển thị nút
          if (shouldShow !== showScrollToBottom) {
            setShowScrollToBottom(shouldShow);
          }
          
          // Khi scroll về bottom (offset <= 100), reset unread count và last seen messages count
          if (!shouldShow) {
            setUnreadCount(0);
            lastSeenMessagesCountRef.current = messages.length;
            lastUnreadCountRef.current = 0;
          } else if (shouldShow) {
            // Khi scroll lên, lưu số tin nhắn hiện tại (nếu chưa có)
            // Điều này đảm bảo chúng ta chỉ đếm tin nhắn mới đến sau khi scroll lên
            if (lastSeenMessagesCountRef.current === 0) {
              lastSeenMessagesCountRef.current = messages.length;
              lastUnreadCountRef.current = 0;
              setUnreadCount(0); // Reset khi mới scroll lên
            }
          }
        }}
        onScrollToIndexFailed={() => {
          // Fallback nếu scrollToIndex thất bại
        }}
        // Prevent iOS from adding automatic keyboard insets that can cause a visible scroll/jump
        automaticallyAdjustKeyboardInsets={false}
        // Optimize for smooth gestures
        scrollEventThrottle={16}
        nestedScrollEnabled={true}
        // Với inverted FlatList, ListHeaderComponent hiển thị ở dưới cùng (trên input bar)
        ListHeaderComponent={
          typingUsers.length > 0 ? (
            <TypingIndicator typingUsers={typingUsers} userName={userName} />
          ) : null
        }
        ListEmptyComponent={
          // Show empty state when messages array is empty (including after deletion)
          // Check both loading state and messages length to ensure proper display
          (isLoadingMessages || isRefetchingMessages) && messages.length === 0 ? (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 }}>
              <ActivityIndicator size="large" color={colors.primary || '#0084ff'} />
              <Text variant="bodyMedium" style={{ color: colors.textSecondary, marginTop: 16 }}>
                Đang tải tin nhắn...
              </Text>
            </View>
          ) : isMessagesError ? (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 }}>
              <MaterialCommunityIcons 
                name="alert-circle-outline" 
                size={48} 
                color={colors.error || '#e74c3c'} 
              />
              <Text variant="bodyLarge" style={{ color: colors.error || '#e74c3c', marginTop: 16, textAlign: 'center', fontWeight: '600' }}>
                Không thể tải tin nhắn
              </Text>
              <Text variant="bodyMedium" style={{ color: colors.textSecondary, marginTop: 8, textAlign: 'center' }}>
                {messagesError instanceof Error 
                  ? messagesError.message 
                  : 'Đã xảy ra lỗi khi tải tin nhắn. Vui lòng thử lại.'}
              </Text>
              <TouchableOpacity
                onPress={() => refetchMessages()}
                style={{
                  marginTop: 24,
                  paddingHorizontal: 24,
                  paddingVertical: 12,
                  backgroundColor: colors.primary || '#0084ff',
                  borderRadius: 8,
                }}
                activeOpacity={0.7}
              >
                <Text style={{ color: '#FFFFFF', fontWeight: '600' }}>
                  Thử lại
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.emptyStateContainer}>
              <View style={styles.emptyStateIconContainer}>
                <View style={[
                  styles.emptyStateIconCircle,
                  { backgroundColor: isDarkMode ? '#e3f2fd' : '#e3f2fd' }
                ]}>
                  <View style={styles.emptyStateSpeechBubble}>
                    <View style={styles.emptyStateFace}>
                      <View style={[styles.emptyStateEye, { left: 15 }]} />
                      <View style={[styles.emptyStateEye, { right: 15 }]} />
                      <View style={styles.emptyStateMouth} />
                    </View>
                  </View>
                </View>
              </View>
              <Text style={[styles.emptyStateTitle, { color: colors.text }]}>
                Bạn chưa có tin nhắn nào!
              </Text>
              <Text style={[styles.emptyStateSubtitle, { color: colors.textSecondary }]}>
                Hãy bắt đầu{'\n'}cuộc trò chuyện ngay.
              </Text>
              
              {/* Sticker Suggestions */}
              {helloStickers.length > 0 ? (
                <View style={styles.stickerSuggestionsContainer}>
                  <Text style={[styles.stickerSuggestionsTitle, { color: colors.textSecondary }]}>
                    Nhắn tin hoặc nhấn vào emoji để gửi lời chào.
                  </Text>
                  <ScrollView 
                    horizontal 
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.stickerSuggestionsScroll}
                  >
                    {helloStickers.map((item, index) => {
                      const stickerUrl = getStickerURL(item.sticker.url);
                      return (
                        <TouchableOpacity
                          key={`hello-sticker-${item.packId}-${item.stickerIndex}-${index}`}
                          style={styles.stickerSuggestionItem}
                          onPress={() => {
                            handleStickerSelect(item.packId, item.stickerIndex, item.sticker);
                          }}
                          activeOpacity={0.7}
                        >
                          <Image
                            source={{ uri: stickerUrl }}
                            style={styles.stickerSuggestionImage}
                            contentFit="contain"
                            cachePolicy="memory-disk"
                            transition={200}
                          />
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                </View>
              ) : isLoadingStickerPacks ? (
                // Show loading state while fetching sticker packs
                <View style={styles.stickerSuggestionsContainer}>
                  <Text style={[styles.stickerSuggestionsTitle, { color: colors.textSecondary, fontSize: 11, marginTop: 12 }]}>
                    Đang tải sticker gợi ý...
                  </Text>
                </View>
              ) : null}
            </View>
          )
        }
      />
      </Pressable>
      </View>
      )}

      {/* Scroll to Bottom Button - hiển thị khi cuộn lên trên */}
      {showScrollToBottom && (
        <TouchableOpacity
          style={[
            styles.scrollToBottomButton,
            {
              backgroundColor: isDarkMode ? '#2a2a2b' : '#ffffff',
              bottom: inputBarHeight + (showEmojiPicker ? emojiPanelHeight : (keyboardHeight > 0 ? keyboardHeight : 18)) + 12,
            }
          ]}
          onPress={handleScrollToBottom}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons 
            name="chevron-down" 
            size={24} 
            color={colors.text} 
          />
          {unreadCount > 0 && (
            <View style={[
              styles.unreadBadge,
              {
                backgroundColor: '#0084ff',
              }
            ]}>
              <Text style={styles.unreadBadgeText}>
                {unreadCount > 99 ? '99+' : unreadCount}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      )}

      {/* Typing Indicator - hiển thị như text đơn giản bên dưới message cuối cùng */}

      {/* Copy Notification Bar - hiển thị phía trên input bar */}
      {copyNotificationVisible && (
        <Animated.View
          style={[
            styles.copyNotificationBar,
            {
              backgroundColor: isDarkMode ? 'rgba(58, 58, 59, 0.95)' : 'rgba(240, 242, 245, 0.95)',
              bottom: inputBarHeight + Math.max(insets.bottom, 6) + 8,
              opacity: copyNotificationOpacity,
            },
          ]}
        >
          <Text style={[styles.copyNotificationText, { color: colors.text }]}>
            Tin nhắn đã được copy
          </Text>
        </Animated.View>
      )}

      {/* Reply Bar - shown above input field when replying */}
      {replyToMessage && (
        <View
          style={[
            styles.replyBarContainer,
            {
              bottom: inputBarHeight + (showEmojiPicker ? emojiPanelHeight : (keyboardHeight > 0 ? keyboardHeight : 18)),
            },
          ]}
        >
          <ReplyBar replyMessage={replyToMessage} onCancel={handleCancelReply} />
        </View>
      )}

      <View
        style={[
          styles.inputContainer,
          {
            backgroundColor: colors.background,
            borderTopWidth: 0,
            paddingBottom: Math.max(insets.bottom * 0.3, 0),
            zIndex: 10, // Cao hơn overlay để không bị chặn
            // Sử dụng position absolute với bottom để tránh animation trượt
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: showEmojiPicker ? emojiPanelHeight : (keyboardHeight > 0 ? keyboardHeight : 18),
          },
        ]}
        onLayout={(e) => {
          const h = e.nativeEvent.layout.height;
          if (h && Math.abs(h - inputBarHeight) > 1) setInputBarHeight(h);
        }}
      >
        {/* Media Preview - Facebook style: compact thumbnail */}
        {selectedMedia && (
          <View style={[styles.mediaPreviewContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.mediaPreviewThumbnail}>
              {selectedMedia.type === 'image' ? (
                <Image
                  source={{ uri: selectedMedia.uri }}
                  style={styles.mediaPreviewThumbnailImage}
                  resizeMode="cover"
                />
              ) : (
                <View style={styles.mediaPreviewThumbnailVideo}>
                  <Video
                    ref={videoRef}
                    source={{ uri: selectedMedia.uri }}
                    style={styles.mediaPreviewThumbnailVideoPlayer}
                    resizeMode={ResizeMode.COVER}
                    shouldPlay={false}
                    useNativeControls={false}
                    onLoad={handleVideoLoad}
                  />
                  <View style={styles.mediaPreviewVideoOverlay}>
                    <MaterialCommunityIcons name="play-circle" size={24} color="#FFFFFF" />
                  </View>
                  <View style={styles.mediaPreviewVideoLabel}>
                    <MaterialCommunityIcons name="video" size={10} color="#FFFFFF" />
                    <Text style={styles.mediaPreviewVideoLabelText}>Video</Text>
                  </View>
                </View>
              )}
              {uploadingMedia && (
                <View style={styles.mediaPreviewUploadingOverlay}>
                  <ActivityIndicator size="small" color="#FFFFFF" />
                </View>
              )}
            </View>
            <View style={styles.mediaPreviewInfo}>
              <Text style={[styles.mediaPreviewInfoText, { color: colors.text }]} numberOfLines={1}>
                {selectedMedia.type === 'image' ? 'Ảnh' : 'Video'}
              </Text>
              {uploadingMedia && (
                <Text style={[styles.mediaPreviewInfoSubtext, { color: colors.textSecondary }]} numberOfLines={1}>
                  Đang tải lên...
                </Text>
              )}
            </View>
            <TouchableOpacity
              style={[styles.mediaPreviewCloseBtn, { borderColor: colors.border }]}
              onPress={handleRemoveMedia}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons name="close" size={16} color={colors.text} />
            </TouchableOpacity>
          </View>
        )}

        {/* Input bar row */}
        <View style={styles.inputBarRow}>
          {/* Bot Menu Button - chỉ hiển thị khi chat với bot */}
          {isBot && (
            <TouchableOpacity
              style={styles.botMenuButton}
              onPress={handleBotMenu}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons name="menu" size={20} color="#FFFFFF" />
              <Text style={styles.botMenuText}>Menu</Text>
            </TouchableOpacity>
          )}
          
          {/* Left plus icon with circular bg */}
          <View style={[
            styles.circleBtn, 
            { backgroundColor: isDarkMode ? '#2a2a2b' : '#e0e0e0' }
          ]}> 
            <IconButton 
              icon="plus" 
              iconColor={isDarkMode ? '#ffffff' : '#000000'} 
              size={22} 
              onPress={handleOpenMediaPicker} 
            />
          </View>
          {/* Input wrapper with emoji toggle inside */}
          <View style={[
            styles.inputWrapper,
            { backgroundColor: isDarkMode ? '#2a2a2b' : '#f0f0f0' }
          ]}>
          <TextInput
            ref={inputRef}
            style={[styles.input, { color: colors.text }]}
            value={inputText}
            onChangeText={(text) => {
              setInputText(text);
              
              // Handle typing indicator - emit immediately when user starts typing
              if (text.length > 0 && socket?.connected && conversationId && user?.id) {
                // Emit typing event if not already typing
                if (!isTyping) {
                  setIsTyping(true);
                  socket.emit('typing', {
                    conversationId: String(conversationId),
                    userId: String(user.id),
                    username: user?.username,
                    fullName: user?.full_name || user?.username,
                    isTyping: true,
                  });
                }
                
                // Clear existing timeout
                if (typingTimeoutRef.current) {
                  clearTimeout(typingTimeoutRef.current);
                }
                
                // Set timeout to stop typing after 3 seconds of inactivity
                typingTimeoutRef.current = setTimeout(() => {
                  if (isTyping && socket?.connected && conversationId) {
                    setIsTyping(false);
                    socket.emit('stopTyping', {
                      conversationId: String(conversationId),
                      userId: String(user.id),
                      username: user?.username,
                      fullName: user?.full_name || user?.username,
                    });
                  }
                }, 3000);
              } else if (text.length === 0 && isTyping && socket?.connected && conversationId) {
                // Stop typing immediately when text is cleared
                setIsTyping(false);
                if (typingTimeoutRef.current) {
                  clearTimeout(typingTimeoutRef.current);
                  typingTimeoutRef.current = null;
                }
                socket.emit('stopTyping', {
                  conversationId: String(conversationId),
                  userId: String(user?.id),
                  username: user?.username,
                  fullName: user?.full_name || user?.username,
                });
              }
            }}
            onSubmitEditing={() => {
              // Send message when pressing Enter/Return (only if no line break)
              if (inputText.trim() && !inputText.includes('\n')) {
                handleSend();
              }
            }}
            blurOnSubmit={false}
            returnKeyType="send"
            placeholder={editingMessage ? "Chỉnh sửa tin nhắn..." : "Tin nhắn"}
            placeholderTextColor={colors.textSecondary}
            multiline
            maxLength={1000}
            onFocus={() => {
              if (showEmojiPicker) {
                // Đóng ngay lập tức
                setShowEmojiPicker(false);
                emojiPanelAnimation.setValue(0);
              }
            }}
            textAlignVertical="center"
          />
          <TouchableOpacity onPress={toggleEmojiPicker} style={styles.inlineIconBtn} activeOpacity={0.7}>
            <IconButton
              icon={showEmojiPicker ? 'keyboard-outline' : 'emoticon-outline'}
              iconColor={isDarkMode ? '#ffffff' : '#000000'}
              size={22}
            />
          </TouchableOpacity>
        </View>
        {/* Right: microphone icon when empty, send button when has text */}
        {Boolean(inputText.trim() || selectedMedia) ? (
          <TouchableOpacity
            style={[styles.circleBtn, { 
              backgroundColor: '#0084ff' 
            }]}
            onPress={(e) => {
              e?.stopPropagation?.();
              handleSend();
            }}
            activeOpacity={0.7}
          >
            <IconButton 
              icon={editingMessage ? "check" : "send"} 
              iconColor="#ffffff" 
              size={22} 
              onPress={(e) => {
                e?.stopPropagation?.();
                handleSend();
              }} 
            />
          </TouchableOpacity>
        ) : (
          <View style={[
            styles.circleBtn, 
            { backgroundColor: isDarkMode ? '#2a2a2b' : '#e0e0e0' }
          ]}> 
            <IconButton 
              icon="microphone" 
              iconColor={isDarkMode ? '#ffffff' : '#000000'} 
              size={22} 
              onPress={() => {
                // TODO: Implement voice message recording
              }} 
            />
          </View>
        )}
        </View>
      </View>

      {/* Emoji panel với layout giống Telegram */}
      {showEmojiPicker && (
        <Animated.View
            style={[
            styles.emojiPanel,
            {
              backgroundColor: isDarkMode ? '#1e1e1e' : '#f5f5f5',
              borderTopWidth: 1,
              borderTopColor: colors.border,
              borderRadius: 20,
              borderTopLeftRadius: 20,
              borderTopRightRadius: 20,
              opacity: emojiPanelAnimation,
              transform: [{
                translateY: emojiPanelAnimation.interpolate({
                  inputRange: [0, 1],
                  outputRange: [emojiPanelHeight, 0],
                })
              }],
              position: 'absolute',
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 9,
              height: emojiPanelHeight,
              flexDirection: 'column',
              overflow: 'hidden', // Đảm bảo bottom tabs không hiện ra ngoài
            }
          ]}
          onLayout={(e) => {
            const height = Math.round(e.nativeEvent.layout.height);
            if (height && height !== emojiPanelHeight) {
              setEmojiPanelHeight(height);
            }
          }}
        >
          {/* Content area - hiển thị section tương ứng với tab đang active */}
          <View style={{ flex: 1, overflow: 'hidden' }}>
            {/* Sticker Section - có ScrollView bên trong để scroll giữa các categories */}
            {activeEmojiTab === 'sticker' && (
              <View 
                ref={stickerSectionRef} 
                style={{ flex: 1, height: emojiPanelHeight - 50 - 40 }}
              >
                {/* Top bar với search và tabs - nằm trong sticker section, sẽ ẩn khi cuộn */}
                <Animated.View 
                  style={[
                    styles.emojiTopBarContainer, 
                    { 
                      backgroundColor: isDarkMode ? '#1e1e1e' : '#f5f5f5',
                      borderBottomColor: colors.border,
                      opacity: headerOpacity,
                      transform: [{ translateY: headerTranslate }],
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      zIndex: 10,
                    }
                  ]}
                >
                  {/* Search Bar - giống ảnh */}
                  <View style={[styles.searchBarContainer, {
                    backgroundColor: isDarkMode ? '#2a2a2b' : '#e8e8e8',
                  }]}>
                    <MaterialCommunityIcons 
                      name="magnify" 
                      size={20} 
                      color={colors.textSecondary} 
                      style={styles.searchBarIcon}
                    />
                    <TextInput
                      style={[styles.searchBarInput, { color: colors.text }]}
                      placeholder="Tìm kiếm"
                      placeholderTextColor={colors.textSecondary}
                      editable={false}
                    />
                    <TouchableOpacity
                      onPress={() => {
                        // TODO: Mở favorites
                      }}
                      style={styles.searchBarRightIcon}
                    >
                      <MaterialCommunityIcons 
                        name="heart-outline" 
                        size={20} 
                        color={colors.textSecondary} 
                      />
                    </TouchableOpacity>
                  </View>

                  {/* Icon Tabs/Categories - hiển thị các sticker pack icons với cuộn ngang */}
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={true}
                    contentContainerStyle={styles.iconTabsContainer}
                    style={{ 
                      maxHeight: 60,
                      flexGrow: 0,
                    }}
                    nestedScrollEnabled={true}
                    bounces={true}
                    alwaysBounceHorizontal={false}
                  >
                    {/* Recent tab */}
                    <TouchableOpacity 
                      style={[
                        styles.iconTab,
                        {
                          backgroundColor: isDarkMode ? '#3a3a3b' : '#d0d0d0',
                        }
                      ]}
                      onPress={() => {
                        if (stickerPickerRef.current?.scrollToPack) {
                          stickerPickerRef.current.scrollToPack('recent');
                        }
                      }}
                      activeOpacity={0.7}
                    >
                      <MaterialCommunityIcons 
                        name="clock-outline" 
                        size={24} 
                        color={colors.text} 
                      />
                    </TouchableOpacity>
                    
                    {/* Pack tabs */}
                    {availablePacks.map((pack, index) => {
                      const packIcon = pack.stickers && pack.stickers.length > 0 ? pack.stickers[0] : null;
                      const packIconUrl = packIcon ? getStickerURL(packIcon.url) : null;
                      
                      return (
                        <TouchableOpacity
                          key={pack.id}
                          style={styles.iconTab}
                          onPress={() => {
                            if (stickerPickerRef.current?.scrollToPack) {
                              stickerPickerRef.current.scrollToPack(pack.id);
                            }
                          }}
                          activeOpacity={0.7}
                        >
                          {packIconUrl ? (
                            <Image
                              source={{ uri: packIconUrl }}
                              style={{
                                width: 40,
                                height: 40,
                                borderRadius: 20,
                              }}
                              resizeMode="cover"
                              cachePolicy="memory-disk"
                            />
                          ) : (
                            <View style={{
                              width: 40,
                              height: 40,
                              borderRadius: 20,
                              backgroundColor: isDarkMode ? '#3a3a3b' : '#d0d0d0',
                              justifyContent: 'center',
                              alignItems: 'center',
                            }}>
                              <Text style={{ fontSize: typography.fontSize.xs, color: colors.textSecondary }}>
                                {(pack.name || pack.title || 'S').charAt(0)}
                              </Text>
                            </View>
                          )}
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                </Animated.View>
                
                <StickerPickerInline
                  ref={stickerPickerRef}
                  onSelectSticker={handleStickerSelect}
                  isDarkMode={isDarkMode}
                  colors={colors}
                  isAdmin={isAdmin(user)}
                  userId={user?.id ? String(user.id) : undefined}
                  maxHeight={emojiPanelHeight - 50 - 40}
                  onStickerAdded={() => {
                    queryClient.invalidateQueries({ queryKey: ['sticker-packs'] });
                    queryClient.refetchQueries({ queryKey: ['sticker-packs'] });
                  }}
                  onKeyboardShow={() => {
                    setShowEmojiPicker(false);
                    emojiPanelAnimation.setValue(0);
                  }}
                  onKeyboardHide={() => {}}
                  onScrollChange={handleStickerScrollChange}
                />
              </View>
            )}

            {/* Emoji Section - tab riêng biệt */}
            {activeEmojiTab === 'emoji' && (
              <View 
                ref={emojiSectionRef} 
                style={{ flex: 1, height: emojiPanelHeight - 50 - 40 }}
              >
                <View style={[styles.emojiCategoryRow, { 
                  backgroundColor: isDarkMode ? '#1e1e1e' : '#f5f5f5', 
                  paddingVertical: 8,
                  borderBottomWidth: 1,
                  borderBottomColor: colors.border,
                }]}>
                  <FlatList
                    horizontal
                    data={EMOJI_CATEGORIES}
                    renderItem={({ item: c }) => (
                      <TouchableOpacity 
                        onPress={() => setActiveEmojiCategory(c.key)} 
                        style={[
                          styles.emojiCategoryBtn,
                          { 
                            backgroundColor: isDarkMode ? '#2a2a2b' : '#e0e0e0',
                            marginHorizontal: 4,
                          },
                          activeEmojiCategory === c.key && { 
                            backgroundColor: isDarkMode ? '#3a3a3b' : '#d0d0d0' 
                          }
                        ]}
                      >
                        <Text style={[
                          styles.emojiCategoryText,
                          { color: colors.textSecondary },
                          activeEmojiCategory === c.key && {
                            color: colors.text,
                            fontWeight: '600',
                          }
                        ]}>
                          {c.label}
                        </Text>
                      </TouchableOpacity>
                    )}
                    keyExtractor={(item) => item.key}
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{ paddingHorizontal: 8 }}
                  />
                </View>
                <FlatList
                  data={[...currentCategory.emojis, 'backspace']}
                  onScroll={(event) => {
                    if (activeEmojiTab === 'emoji') {
                      const scrollY = event.nativeEvent.contentOffset.y;
                      const isScrollingDown = scrollY > (bottomTabsLastScrollY.current || 0);
                      handleEmojiPanelScroll(isScrollingDown, scrollY);
                    }
                  }}
                  scrollEventThrottle={16}
                  renderItem={({ item, index }) => {
                    if (item === 'backspace') {
                      return (
                        <TouchableOpacity 
                          onPress={deleteEmoji} 
                          style={[
                            styles.emojiItem, 
                            styles.deleteEmojiButton, 
                            { backgroundColor: isDarkMode ? '#2a2a2b' : '#e0e0e0' }
                          ]}
                          activeOpacity={0.7}
                        >
                          <MaterialCommunityIcons 
                            name="backspace-outline" 
                            size={24} 
                            color={colors.text} 
                          />
                        </TouchableOpacity>
                      );
                    }
                    return (
                      <TouchableOpacity 
                        key={item} 
                        onPress={() => addEmoji(item)} 
                        style={styles.emojiItem}
                      >
                        <Text style={{ fontSize: 28 }}>{item}</Text>
                      </TouchableOpacity>
                    );
                  }}
                  keyExtractor={(item, index) => item === 'backspace' ? 'backspace' : `emoji-${index}`}
                  numColumns={8}
                  columnWrapperStyle={{ justifyContent: 'flex-start' }}
                  style={{
                    backgroundColor: isDarkMode ? '#1e1e1e' : '#f5f5f5',
                    flex: 1,
                  }}
                  contentContainerStyle={{
                    padding: 8,
                    paddingBottom: 20,
                  }}
                  nestedScrollEnabled={true}
                />
              </View>
            )}

            {/* GIF Section - tab riêng biệt */}
            {activeEmojiTab === 'gif' && (
              <View 
                ref={gifSectionRef} 
                style={{ flex: 1, height: emojiPanelHeight - 50 - 40 }}
              >
                <View style={styles.centeredPanel}>
                  <Text variant="bodyMedium" style={{ color: colors.textSecondary }}>
                    GIFs: đang cập nhật
                  </Text>
                </View>
              </View>
            )}
          </View>

          {/* Bottom Tab Bar: Sticker, Emoji, GIFs - giống ảnh */}
          <Animated.View 
            style={[
              styles.bottomTabBar, 
              {
                backgroundColor: isDarkMode ? '#1e1e1e' : '#f5f5f5',
                borderTopWidth: 1,
                borderTopColor: colors.border,
                opacity: bottomTabsOpacity,
                transform: [{ translateY: bottomTabsTranslateY }],
                marginBottom: 8, // Đẩy lên trên một chút
                paddingBottom: 4, // Thêm padding bottom để không sát cạnh
              }
            ]}
          >
            <TouchableOpacity
              style={[
                styles.bottomTab,
                {
                  backgroundColor: activeEmojiTab === 'sticker' 
                    ? (isDarkMode ? '#3a3a3b' : '#e0e0e0') // Nút được chọn: nền sáng hơn
                    : (isDarkMode ? '#2a2a2b' : '#3a3a3b'), // Nút không được chọn: nền tối hơn
                }
              ]}
              onPress={() => handleTabPress('sticker')}
              activeOpacity={0.7}
            >
              <Text style={[
                styles.bottomTabText,
                {
                  color: activeEmojiTab === 'sticker' 
                    ? (isDarkMode ? '#ffffff' : '#333333') // Nút được chọn: text tối hơn
                    : (isDarkMode ? '#a0a0a0' : '#a0a0a0'), // Nút không được chọn: text sáng hơn
                }
              ]}>
                Sticker
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.bottomTab,
                {
                  backgroundColor: activeEmojiTab === 'emoji' 
                    ? (isDarkMode ? '#3a3a3b' : '#e0e0e0') // Nút được chọn: nền sáng hơn
                    : (isDarkMode ? '#2a2a2b' : '#3a3a3b'), // Nút không được chọn: nền tối hơn
                }
              ]}
              onPress={() => handleTabPress('emoji')}
              activeOpacity={0.7}
            >
              <Text style={[
                styles.bottomTabText,
                {
                  color: activeEmojiTab === 'emoji' 
                    ? (isDarkMode ? '#ffffff' : '#333333') // Nút được chọn: text tối hơn
                    : (isDarkMode ? '#a0a0a0' : '#a0a0a0'), // Nút không được chọn: text sáng hơn
                }
              ]}>
                Emoji
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.bottomTab,
                {
                  backgroundColor: activeEmojiTab === 'gif' 
                    ? (isDarkMode ? '#3a3a3b' : '#e0e0e0') // Nút được chọn: nền sáng hơn
                    : (isDarkMode ? '#2a2a2b' : '#3a3a3b'), // Nút không được chọn: nền tối hơn
                }
              ]}
              onPress={() => handleTabPress('gif')}
              activeOpacity={0.7}
            >
              <Text style={[
                styles.bottomTabText,
                {
                  color: activeEmojiTab === 'gif' 
                    ? (isDarkMode ? '#ffffff' : '#333333') // Nút được chọn: text tối hơn
                    : (isDarkMode ? '#a0a0a0' : '#a0a0a0'), // Nút không được chọn: text sáng hơn
                }
              ]}>
                GIFs
              </Text>
            </TouchableOpacity>
          </Animated.View>

        </Animated.View>
      )}

      {/* Old code removed - đã được thay thế bằng code mới ở trên */}

      {/* Context Menu */}
        <MessageContextMenu
        visible={contextMenuVisible}
        message={selectedMessage}
        position={menuPosition}
        isOwn={selectedMessage?.sender_id === user?.id}
        isAdmin={isAdmin(user)}
        onClose={handleCloseContextMenu}
        onReply={() => {
          if (selectedMessage) {
            handleReply(selectedMessage);
          }
        }}
        onForward={handleForward}
        onCopy={handleCopy}
        onPin={handlePin}
        onSave={handleSave}
        onCreateTask={handleCreateTask}
        onSelect={handleSelect}
        onReaction={handleReaction}
        onEdit={handleEdit}
        onDeleteRequest={handleDeleteRequest}
        onDeleteSticker={handleDeleteSticker}
      />

      {/* Delete Message Dialog */}
      <DeleteMessageDialog
        visible={deleteDialogVisible}
        onClose={() => {
          setDeleteDialogVisible(false);
          // Chỉ set selectedMessage = null khi đóng dialog
          setSelectedMessage(null);
        }}
        onDeleteForMe={handleDeleteForMe}
        onDeleteForEveryone={handleDeleteForEveryone}
      />

      {/* Participants Modal - Group Chat */}
      <Modal
        visible={showParticipantsModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowParticipantsModal(false)}
        statusBarTranslucent={true}
      >
        <Pressable
          style={[styles.modalOverlay, { backgroundColor: 'rgba(0, 0, 0, 0.5)' }]}
          onPress={() => setShowParticipantsModal(false)}
        >
          <Pressable 
            style={[
              styles.mediaPickerContainer, 
              { 
                backgroundColor: colors.background,
                borderTopLeftRadius: 20,
                borderTopRightRadius: 20,
                maxHeight: '80%',
              }
            ]}
            onPress={() => {}}
          >
            <View style={[styles.mediaPickerHandle, { backgroundColor: isDarkMode ? '#3a3a3b' : '#d0d0d0' }]} />
            <View style={styles.mediaPickerContent}>
              <Text style={[styles.modalTitle, { color: colors.text, marginBottom: 20 }]}>
                Thành viên nhóm ({Array.isArray(participants) ? participants.length : 0})
              </Text>
              <FlatList
                data={Array.isArray(participants) ? participants : []}
                keyExtractor={(item) => String(item.id)}
                renderItem={({ item }) => {
                  const isCurrentUser = String(item.id) === String(user?.id);
                  return (
                    <TouchableOpacity
                      style={[
                        styles.participantItem,
                        { 
                          borderBottomColor: colors.border || (isDarkMode ? '#2a2a2b' : '#E0E0E0'),
                        }
                      ]}
                      onPress={() => {
                        setShowParticipantsModal(false);
                        setSelectedUserForProfile({
                          userId: item.id,
                          userName: item.full_name || item.username,
                          userAvatar: item.avatar_url,
                          isOwnProfile: isCurrentUser,
                        });
                        setShowUserProfileModal(true);
                      }}
                      activeOpacity={0.7}
                    >
                      <View style={styles.participantAvatar}>
                        {item.avatar_url ? (
                          <Avatar.Image
                            size={50}
                            source={{ uri: getAvatarURL(item.avatar_url) }}
                          />
                        ) : (
                          <Avatar.Text
                            size={50}
                            label={(item.full_name || item.username || 'U').substring(0, 1).toUpperCase()}
                            style={{ backgroundColor: colors.primary || '#0084ff' }}
                          />
                        )}
                        {item.status === 'online' && activityStatusEnabled && (
                          <View style={[
                            styles.participantOnlineIndicator,
                            { backgroundColor: '#10b981', borderColor: colors.background }
                          ]} />
                        )}
                      </View>
                      <View style={styles.participantInfo}>
                        <Text style={[styles.participantName, { color: colors.text }]}>
                          {item.full_name || item.username || 'Người dùng'}
                          {isCurrentUser && (
                            <Text style={[styles.participantYouLabel, { color: colors.textSecondary }]}>
                              {' '}(Bạn)
                            </Text>
                          )}
                        </Text>
                        {item.username && (
                          <Text style={[styles.participantUsername, { color: colors.textSecondary }]}>
                            {item.username}
                          </Text>
                        )}
                      </View>
                      {item.status === 'online' && activityStatusEnabled && (
                        <View style={styles.participantStatus}>
                          <Text style={[styles.participantStatusText, { color: '#10b981' }]}>
                            Đang hoạt động
                          </Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                }}
                ListEmptyComponent={
                  <View style={styles.emptyParticipantsContainer}>
                    <Text style={[styles.emptyParticipantsText, { color: colors.textSecondary }]}>
                      Chưa có thành viên nào
                    </Text>
                  </View>
                }
              />
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Add Members Modal - Group Chat */}
      <AddMembersModal
        visible={showAddMembersModal}
        onClose={() => setShowAddMembersModal(false)}
        conversationId={conversationId}
        existingParticipants={Array.isArray(participants) ? participants : []}
        onMembersAdded={() => {
          // Refetch participants after adding
          if (conversationId) {
            queryClient.invalidateQueries({ queryKey: ['participants', conversationId] });
          }
          setShowAddMembersModal(false);
        }}
        isDarkMode={isDarkMode}
        colors={colors}
      />

      {/* User Profile Modal */}
      <UserProfileModal
        visible={showUserProfileModal}
        onClose={() => {
          setShowUserProfileModal(false);
          setSelectedUserForProfile(null);
        }}
        userId={selectedUserForProfile?.userId}
        userName={selectedUserForProfile?.userName}
        userAvatar={selectedUserForProfile?.userAvatar}
        isOwnProfile={selectedUserForProfile?.isOwnProfile}
      />

      {/* Sticker Picker Modal */}
      <StickerPicker
        visible={showStickerPicker}
        onClose={() => setShowStickerPicker(false)}
        onSelectSticker={handleStickerSelect}
      />

      {/* Bot Commands Modal - Telegram Style */}
      <Modal
        visible={showBotCommands}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowBotCommands(false)}
        statusBarTranslucent={true}
      >
        <Pressable
          style={[styles.modalOverlay, { backgroundColor: 'rgba(0, 0, 0, 0.5)' }]}
          onPress={() => setShowBotCommands(false)}
        >
          <Pressable 
            style={[
              styles.mediaPickerContainer, 
              { 
                backgroundColor: isDarkMode ? '#1e1e1e' : '#ffffff',
                borderTopLeftRadius: 20,
                borderTopRightRadius: 20,
                maxHeight: '60%',
              }
            ]}
            onPress={() => {}}
          >
            <View style={[styles.mediaPickerHandle, { backgroundColor: isDarkMode ? '#3a3a3b' : '#d0d0d0' }]} />
            <View style={styles.mediaPickerContent}>
              <Text style={[styles.botCommandsTitle, { color: colors.text }]}>
                Lệnh Bot
              </Text>
              <View style={styles.botCommandsList}>
                {botCommands.map((item, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.botCommandItem,
                      { 
                        backgroundColor: isDarkMode ? '#2a2a2b' : '#f0f0f0',
                        borderBottomColor: colors.border,
                      }
                    ]}
                    onPress={() => handleBotCommand(item.command)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.botCommandContent}>
                      <Text style={[styles.botCommandText, { color: '#0084ff' }]}>
                        {item.command}
                      </Text>
                      <Text style={[styles.botCommandDescription, { color: colors.textSecondary }]}>
                        {item.description}
                      </Text>
                    </View>
                    <MaterialCommunityIcons 
                      name="chevron-right" 
                      size={20} 
                      color={colors.textSecondary} 
                    />
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Media Picker Modal - Telegram Style */}
      <Modal
        visible={showMediaPicker}
        transparent={true}
        animationType="slide"
        onRequestClose={handleCloseMediaPicker}
        statusBarTranslucent={true}
      >
        <Pressable
          style={[styles.modalOverlay, { backgroundColor: 'rgba(0, 0, 0, 0.5)' }]}
          onPress={handleCloseMediaPicker}
        >
          <Pressable 
            style={[
              styles.mediaPickerContainer, 
              { 
                backgroundColor: isDarkMode ? '#1e1e1e' : '#ffffff',
                borderTopLeftRadius: 20,
                borderTopRightRadius: 20,
              }
            ]}
            onPress={() => {}}
          >
            <View style={[styles.mediaPickerHandle, { backgroundColor: isDarkMode ? '#3a3a3b' : '#d0d0d0' }]} />
            <View style={styles.mediaPickerContent}>
              {/* Row 1: Thư viện, File, Vị trí */}
              <View style={styles.mediaPickerRow}>
                <TouchableOpacity
                  style={styles.mediaPickerItem}
                  onPress={handlePickImage}
                  activeOpacity={0.7}
                >
                  <View style={[styles.mediaPickerIconContainer, { backgroundColor: isDarkMode ? '#2a2a2b' : '#f0f0f0' }]}>
                    <MaterialCommunityIcons name="folder-image" size={28} color={isDarkMode ? '#ffffff' : '#000000'} />
                  </View>
                  <Text style={[styles.mediaPickerItemText, { color: colors.text }]}>
                    Thư viện
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.mediaPickerItem}
                  onPress={handlePickFile}
                  activeOpacity={0.7}
                >
                  <View style={[styles.mediaPickerIconContainer, { backgroundColor: isDarkMode ? '#2a2a2b' : '#f0f0f0' }]}>
                    <MaterialCommunityIcons name="file-document-outline" size={28} color={isDarkMode ? '#ffffff' : '#000000'} />
                  </View>
                  <Text style={[styles.mediaPickerItemText, { color: colors.text }]}>
                    File
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.mediaPickerItem}
                  onPress={handlePickLocation}
                  activeOpacity={0.7}
                >
                  <View style={[styles.mediaPickerIconContainer, { backgroundColor: isDarkMode ? '#2a2a2b' : '#f0f0f0' }]}>
                    <MaterialCommunityIcons name="map-marker-outline" size={28} color={isDarkMode ? '#ffffff' : '#000000'} />
                  </View>
                  <Text style={[styles.mediaPickerItemText, { color: colors.text }]}>
                    Vị trí
                  </Text>
                </TouchableOpacity>
              </View>
              {/* Row 2: Bình chọn, Danh sách việc, Danh bạ */}
              <View style={styles.mediaPickerRow}>
                <TouchableOpacity
                  style={styles.mediaPickerItem}
                  onPress={handleCreatePoll}
                  activeOpacity={0.7}
                >
                  <View style={[styles.mediaPickerIconContainer, { backgroundColor: isDarkMode ? '#2a2a2b' : '#f0f0f0' }]}>
                    <MaterialCommunityIcons name="chart-bar" size={28} color={isDarkMode ? '#ffffff' : '#000000'} />
                  </View>
                  <Text style={[styles.mediaPickerItemText, { color: colors.text }]}>
                    Bình chọn
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.mediaPickerItem}
                  onPress={handleCreateTodo}
                  activeOpacity={0.7}
                >
                  <View style={[styles.mediaPickerIconContainer, { backgroundColor: isDarkMode ? '#2a2a2b' : '#f0f0f0' }]}>
                    <MaterialCommunityIcons name="format-list-checks" size={28} color={isDarkMode ? '#ffffff' : '#000000'} />
                  </View>
                  <Text style={[styles.mediaPickerItemText, { color: colors.text }]}>
                    Danh sách việc
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.mediaPickerItem}
                  onPress={handlePickContact}
                  activeOpacity={0.7}
                >
                  <View style={[styles.mediaPickerIconContainer, { backgroundColor: isDarkMode ? '#2a2a2b' : '#f0f0f0' }]}>
                    <MaterialCommunityIcons name="account-outline" size={28} color={isDarkMode ? '#ffffff' : '#000000'} />
                  </View>
                  <Text style={[styles.mediaPickerItemText, { color: colors.text }]}>
                    Danh bạ
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  messages: {
    flex: 1,
  },
  messagesContent: {
    paddingVertical: 8,
  },
  dateSeparator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 16,
    paddingHorizontal: 16,
  },
  dateSeparatorTextContainer: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  dateSeparatorText: {
    fontSize: 13,
    fontWeight: '500',
  },
  unreadSeparator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 16,
    paddingHorizontal: 16,
  },
  unreadSeparatorTextContainer: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  unreadSeparatorText: {
    fontSize: 13,
    fontWeight: '600',
  },
  editIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderTopWidth: 1,
    gap: 12,
  },
  editIcon: {
    marginRight: 4,
  },
  editContent: {
    flex: 1,
    minWidth: 0,
  },
  editingText: {
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 2,
  },
  editMessageContent: {
    fontSize: 13,
  },
  copyNotificationBar: {
    position: 'absolute',
    left: 16,
    right: 16,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    alignSelf: 'center',
    maxWidth: '90%',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  copyNotificationText: {
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'center',
  },
  editCloseButton: {
    padding: 4,
  },
  replyBarContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 9, // Dưới input container nhưng trên messages
  },
  typingIndicatorContainer: {
    borderTopWidth: 0.5,
    paddingTop: 4,
  },
  inputContainer: {
    flexDirection: 'column',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderTopWidth: 1,
    gap: 8,
    // Position absolute sẽ được set trong component để tránh animation
  },
  inputBarRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
  },
  botMenuButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0084ff',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 20,
    gap: 6,
    minHeight: 40,
  },
  botMenuText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  botCommandsTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  botCommandsList: {
    paddingBottom: 16,
  },
  botCommandItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  botCommandContent: {
    flex: 1,
    marginRight: 12,
  },
  botCommandText: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  botCommandDescription: {
    fontSize: 13,
  },
  input: {
    flex: 1,
    minHeight: 46,
    maxHeight: 120,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
  },
  inputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 46,
    maxHeight: 120,
    paddingLeft: 12,
    borderRadius: 22,
    marginHorizontal: 8,
  },
  inlineIconBtn: {
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emojiPanel: {
    minHeight: 260,
    // Nền và viền giống Telegram
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  emojiTabsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },
  emojiTabs: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    gap: 8,
  },
  emojiTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 44,
    minHeight: 44,
  },
  emojiTabIcon: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
  },
  emojiTabText: {
    fontSize: 13,
    fontWeight: '500',
  },
  emojiCategoryRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 8,
    paddingTop: 8,
  },
  emojiCategoryBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    marginRight: 8,
    marginBottom: 8,
  },
  emojiCategoryText: {
    fontSize: 12,
  },
  emojiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  emojiItem: {
    width: '12.5%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
  },
  deleteEmojiButton: {
    borderRadius: 8,
    margin: 2,
  },
  centeredPanel: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
  },
  emojiRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  sendButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  sendButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  headerInfoContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerName: {
    fontSize: 16,
    fontWeight: '600',
    maxWidth: 200,
  },
  headerSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  avatarWrapper: {
    position: 'relative',
  },
  statusDot: {
    position: 'absolute',
    right: -1,
    bottom: -1,
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 2,
  },
  compositeAvatarContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: 'transparent',
  },
  compositeAvatarGrid: {
    width: 36,
    height: 36,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  compositeAvatarItem: {
    width: 18,
    height: 18,
    overflow: 'hidden',
  },
  compositeAvatarTopLeft: {
    borderTopLeftRadius: 18,
  },
  compositeAvatarTopRight: {
    borderTopRightRadius: 18,
  },
  compositeAvatarBottomLeft: {
    borderBottomLeftRadius: 18,
  },
  compositeAvatarBottomRight: {
    borderBottomRightRadius: 18,
  },
  compositeAvatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 9, // Make each small avatar circular
    borderWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.3)', // Subtle border to separate avatars
  },
  compositeAvatarText: {
    color: '#fff',
    fontSize: 7,
    fontWeight: '600',
  },
  compositeAvatarBadge: {
    alignItems: 'center',
    justifyContent: 'center',
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
    letterSpacing: 0.1,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    zIndex: 999,
    elevation: 9, // Android elevation
  },
  mediaPickerContainer: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 8,
    paddingBottom: 32,
    maxHeight: 300,
    // Đảm bảo modal hiển thị đúng vị trí, không bị che bởi input bar
    zIndex: 1000,
    elevation: 10, // Android elevation để hiển thị trên cùng
  },
  mediaPickerHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  mediaPickerContent: {
    paddingHorizontal: 16,
  },
  mediaPickerOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 12,
  },
  mediaPickerOptionText: {
    fontSize: 16,
    fontWeight: '500',
  },
  mediaPickerRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 24,
  },
  mediaPickerItem: {
    alignItems: 'center',
    flex: 1,
    maxWidth: 100,
  },
  mediaPickerIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  mediaPickerItemText: {
    fontSize: 13,
    fontWeight: '400',
    textAlign: 'center',
  },
  // Facebook-style compact media preview
  mediaPreviewContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 12,
    marginBottom: 8,
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    gap: 10,
    maxWidth: '100%',
  },
  mediaPreviewThumbnail: {
    width: 50,
    height: 50,
    borderRadius: 6,
    overflow: 'hidden',
    backgroundColor: '#000',
    position: 'relative',
    flexShrink: 0,
  },
  mediaPreviewThumbnailImage: {
    width: '100%',
    height: '100%',
  },
  mediaPreviewThumbnailVideo: {
    width: '100%',
    height: '100%',
    position: 'relative',
  },
  mediaPreviewThumbnailVideoPlayer: {
    width: '100%',
    height: '100%',
  },
  mediaPreviewVideoOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  mediaPreviewVideoLabel: {
    position: 'absolute',
    bottom: 2,
    left: 2,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 3,
    gap: 3,
  },
  mediaPreviewVideoLabelText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '600',
  },
  scrollToBottomButton: {
    position: 'absolute',
    right: 8,
    width: 40,
    height: 40,
    borderRadius: 20,
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
    zIndex: 100,
  },
  unreadBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  unreadBadgeText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
  },
  mediaPreviewInfo: {
    flex: 1,
    minWidth: 0,
    justifyContent: 'center',
    gap: 2,
  },
  mediaPreviewInfoText: {
    fontSize: 14,
    fontWeight: '500',
  },
  mediaPreviewInfoSubtext: {
    fontSize: 12,
  },
  mediaPreviewCloseBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    flexShrink: 0,
    backgroundColor: 'transparent',
  },
  mediaPreviewUploadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingVertical: 60,
    minHeight: 400, // Ensure enough space for sticker suggestions
  },
  emptyStateIconContainer: {
    marginBottom: 24,
  },
  emptyStateIconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#e3f2fd',
  },
  emptyStateSpeechBubble: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e3f2fd',
  },
  emptyStateFace: {
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  emptyStateEye: {
    position: 'absolute',
    top: 15,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#333',
  },
  emptyStateMouth: {
    position: 'absolute',
    bottom: 15,
    width: 20,
    height: 10,
    borderBottomWidth: 2,
    borderBottomColor: '#333',
    borderLeftWidth: 2,
    borderLeftColor: 'transparent',
    borderRightWidth: 2,
    borderRightColor: 'transparent',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
  },
  emptyStateSubtitle: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    color: '#666',
  },
  stickerSuggestionsContainer: {
    marginTop: 24,
    width: '100%',
    paddingHorizontal: 20,
  },
  stickerSuggestionsTitle: {
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 12,
    paddingHorizontal: 20,
  },
  stickerSuggestionsScroll: {
    paddingHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stickerSuggestionItem: {
    width: 80,
    height: 80,
    marginHorizontal: 4,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: 'transparent',
  },
  stickerSuggestionImage: {
    width: '100%',
    height: '100%',
  },
  // Participants Modal styles
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
  },
  addMembersHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  addMembersSearchbar: {
    marginBottom: 16,
    elevation: 0,
  },
  addMembersLoading: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addMembersButton: {
    marginTop: 16,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addMembersButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  participantItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  participantAvatar: {
    marginRight: 12,
    position: 'relative',
  },
  participantOnlineIndicator: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
  },
  participantInfo: {
    flex: 1,
  },
  participantName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  participantYouLabel: {
    fontSize: 14,
    fontWeight: '400',
  },
  participantUsername: {
    fontSize: 13,
  },
  participantStatus: {
    marginLeft: 8,
  },
  participantStatusText: {
    fontSize: 13,
    fontWeight: '500',
  },
  emptyParticipantsContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyParticipantsText: {
    fontSize: 16,
  },
  // New styles for Telegram-like emoji panel
  emojiTopBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 8,
    height: 50,
  },
  emojiTopBarContainer: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
  },
  searchBarIcon: {
    marginRight: 8,
  },
  searchBarInput: {
    flex: 1,
    fontSize: 15,
    padding: 0,
  },
  searchBarRightIcon: {
    marginLeft: 8,
    padding: 4,
  },
  iconTabsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingVertical: 8,
    paddingHorizontal: 12,
    gap: 12,
    minWidth: '100%',
  },
  iconTab: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    marginRight: 0, // Gap đã được xử lý bởi gap property
  },
  emojiIcon: {
    fontSize: 24,
  },
  categoryLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  categoryLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  categoryCloseButton: {
    padding: 4,
  },
  topBarIcon: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
  },
  topBarTabs: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    gap: 8,
  },
  topBarTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 44,
    minHeight: 44,
  },
  topBarTabActive: {
    // Background color sẽ được set inline
  },
  topBarTabText: {
    fontSize: 13,
    fontWeight: '500',
  },
  bottomTabBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    height: 40, // Giảm từ 48 xuống 40 để nhỏ gọn hơn
    paddingHorizontal: 12, // Tăng padding horizontal để các nút không quá sát nhau
    paddingVertical: 6, // Giảm padding vertical
    gap: 8, // Thêm gap giữa các nút
  },
  bottomTab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6, // Giảm từ 10 xuống 6
    paddingHorizontal: 8, // Giảm từ 12 xuống 8
    borderRadius: 12, // Tăng borderRadius để tròn hơn (giống ảnh)
    marginHorizontal: 2, // Giảm margin
    minHeight: 28, // Thêm minHeight để đảm bảo nút không quá nhỏ
  },
  bottomTabText: {
    fontSize: 13, // Giảm từ 14 xuống 13
    fontWeight: '500',
  },
  recentSection: {
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  recentSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  recentSectionTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  recentStickersGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  recentStickerItem: {
    width: 60,
    height: 60,
    borderRadius: 8,
    overflow: 'hidden',
  },
  recentStickerImage: {
    width: '100%',
    height: '100%',
  },
});

export default ChatDetailScreen;
