import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  RefreshControl,
  Modal,
  Animated,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Text, Appbar, Searchbar, useTheme as usePaperTheme, Chip, Avatar } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../contexts/ThemeContext';
import { TouchableOpacity } from 'react-native-gesture-handler';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { chatAPI, friendsAPI, newsfeedAPI, notificationsAPI } from '../../utils/api';
import Toast from 'react-native-toast-message';
import { useNavigation, useFocusEffect, CommonActions } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { ChatStackParamList } from '../../navigation/types';
import { MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import useSocket from '../../hooks/useSocket';
import SwipeableConversationItem from '../../components/Chat/SwipeableConversationItem';
import { useAlert } from '../../hooks/useAlert';
import { useAuth } from '../../contexts/AuthContext';
import { ScrollView, Image, TextInput } from 'react-native';
import { getAvatarURL, getInitials } from '../../utils/imageUtils';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { formatRecentTime } from '../../utils/dateUtils';
import { useTabBar } from '../../contexts/TabBarContext';
import SplashScreen from '../../components/Splash/SplashScreen';
import { InteractionManager } from 'react-native';
import { spacing, typography, borderRadius } from '../../config/designTokens';

type ChatListNavigationProp = StackNavigationProp<ChatStackParamList>;

const ChatListScreen = () => {
  const { isDarkMode, colors } = useTheme();
  const paperTheme = usePaperTheme();
  const navigation = useNavigation<ChatListNavigationProp>();
  const { setIsVisible } = useTabBar();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'inbox' | 'groups' | 'unread' | 'muted'>('inbox');
  const { socket } = useSocket();
  const queryClient = useQueryClient();
  const swipeableRefs = useRef<{ [key: string]: any }>({});
  const currentOpenSwipeable = useRef<string | null>(null);
  const { showAlert, AlertComponent } = useAlert();
  const { user } = useAuth();
  const currentUserId = user?.id;
  const [activityStatusEnabled, setActivityStatusEnabled] = useState(true);
  const [dismissedSystemNotifications, setDismissedSystemNotifications] = useState<Set<number>>(new Set());
  const [showFilterModal, setShowFilterModal] = useState(false);
  const isMountedRef = useRef(true);
  
  // Cleanup khi component unmount
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);
  
  // Load dismissed system notifications
  useEffect(() => {
    const loadDismissedNotifications = async () => {
      try {
        const saved = await AsyncStorage.getItem('dismissedSystemNotifications');
        if (saved && isMountedRef.current) {
          const dismissedIds = JSON.parse(saved);
          setDismissedSystemNotifications(new Set(dismissedIds));
        }
      } catch (error) {
        console.error('Error loading dismissed notifications:', error);
      }
    };
    loadDismissedNotifications();
  }, []);
  
  // Load activity status setting
  useEffect(() => {
    const loadActivityStatus = async () => {
      try {
        const saved = await AsyncStorage.getItem('activityStatusEnabled');
        if (saved !== null && isMountedRef.current) {
          setActivityStatusEnabled(saved === 'true');
        }
      } catch (error) {
        console.error('Error loading activity status:', error);
      }
    };
    loadActivityStatus();
    
    // Listen for changes
    const interval = setInterval(() => {
      if (isMountedRef.current) {
        loadActivityStatus();
      }
    }, 1000);
    return () => clearInterval(interval);
  }, []);
  
  // Animation values cho hiệu ứng chuyển app
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const [isNavigating, setIsNavigating] = useState(false);
  const [showSplashScreen, setShowSplashScreen] = useState(false);
  const splashOpacity = useRef(new Animated.Value(0)).current;
  // Store last received message data to combine with conversationUpdated
  const lastReceivedMessage = useRef<{ senderId?: string; message?: string; timestamp?: Date } | null>(null);

  // State to track typing indicators for each conversation
  const [typingMap, setTypingMap] = useState<Record<string, boolean>>({});
  
  // State to track loading actions to prevent race conditions
  const [actionLoading, setActionLoading] = useState<Record<string, boolean>>({});

  // State to force re-render every minute to update time display (like Facebook)
  const [timeRefreshKey, setTimeRefreshKey] = useState(0);

  const {
    data: conversations = [],
    isLoading,
    refetch,
    error,
  } = useQuery({
    queryKey: ['conversations'],
    queryFn: async () => {
      try {
        const response = await chatAPI.getConversations();
        console.log('📱 ChatListScreen - API Response:', response);
        console.log('📱 ChatListScreen - Response data:', response.data);
        console.log('📱 ChatListScreen - Conversations count:', response.data?.length || 0);
        
        // Load pinned state from AsyncStorage FIRST (source of truth)
        const pinnedMap = await loadPinnedConversations();
        if (__DEV__) {
          console.log(`📌 [Pin] Loaded from AsyncStorage:`, Object.keys(pinnedMap).filter(k => pinnedMap[k]).length, 'pinned conversations');
        }
        
        // Get current cache to preserve pinned state
        const currentCache = queryClient.getQueryData(['conversations']) as any[] || [];
        
        // Merge server data with cache and AsyncStorage to preserve pinned state
        const serverData = response.data || [];
        const mergedData = serverData.map((serverConv: any) => {
          const convId = String(serverConv.id || serverConv.conversation_id);
          
          // Find matching conversation in cache
          const cachedConv = currentCache.find((c: any) => 
            String(c.id || c.conversation_id) === convId
          );
          
          // Check if server has pinned field (support both pinned and is_pinned)
          const hasServerPinned = serverConv.pinned !== undefined || serverConv.is_pinned !== undefined;
          const serverPinned = serverConv.pinned !== undefined 
            ? serverConv.pinned 
            : (serverConv.is_pinned !== undefined ? serverConv.is_pinned : false);
          
          // Check cache pinned state
          const cachedPinned = cachedConv?.pinned !== undefined
            ? cachedConv.pinned
            : (cachedConv?.is_pinned !== undefined ? cachedConv.is_pinned : undefined);
          
          // Check AsyncStorage pinned state
          const storedPinned = pinnedMap[convId] === true;
          
          // Priority logic (AsyncStorage is source of truth for pinned state):
          // 1. If AsyncStorage says true, ALWAYS use it (user has pinned it, persist even if server hasn't updated)
          // 2. If AsyncStorage says false or doesn't exist, check server
          // 3. If server has pinned field AND it's true, use server value
          // 4. If server doesn't have pinned field, use cache value (optimistic update)
          // 5. Default to false if neither exists
          let finalPinned = false;
          if (storedPinned) {
            // AsyncStorage is source of truth - if it says pinned, always keep it
            // This ensures pinned state persists even if server hasn't updated yet
            finalPinned = true;
            if (__DEV__) {
              console.log(`📌 [Pin] Conversation ${convId}: Using AsyncStorage=true (stored)`);
            }
          } else if (hasServerPinned && serverPinned === true) {
            // Server confirms it's pinned (and AsyncStorage doesn't say false)
            finalPinned = true;
            if (__DEV__) {
              console.log(`📌 [Pin] Conversation ${convId}: Using server=true`);
            }
          } else if (cachedPinned === true) {
            // Use cache if it's true (optimistic update)
            finalPinned = true;
            if (__DEV__) {
              console.log(`📌 [Pin] Conversation ${convId}: Using cache=true (optimistic)`);
            }
          } else if (hasServerPinned && serverPinned === false) {
            // Server says false and AsyncStorage doesn't say true
            finalPinned = false;
            if (__DEV__) {
              console.log(`📌 [Pin] Conversation ${convId}: Using server=false`);
            }
          } else {
            if (__DEV__) {
              console.log(`📌 [Pin] Conversation ${convId}: Default=false (no source)`);
            }
          }
          
          return {
            ...serverConv,
            pinned: finalPinned,
            is_pinned: finalPinned,
          };
        });
        
        return mergedData;
      } catch (error) {
        console.error('❌ ChatListScreen - Error fetching conversations:', error);
        throw error;
      }
    },
    staleTime: 60 * 1000, // 1 phút - socket sẽ update real-time nên không cần refetch liên tục
    gcTime: 10 * 60 * 1000, // 10 phút cache
    refetchInterval: false, // No polling - use socket for real-time updates
    refetchOnWindowFocus: false, // Don't refetch on focus
  });

  // Auto-update time display every minute (like Facebook)
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeRefreshKey(prev => prev + 1);
    }, 60000); // Update every 60 seconds (1 minute)

    return () => clearInterval(interval);
  }, []);

  // Fetch following list to show online friends in stories
  const { data: followingListData, refetch: refetchFollowing } = useQuery({
    queryKey: ['following'],
    queryFn: async () => {
      try {
        const res = await friendsAPI.getFollowing();
        const data = Array.isArray(res.data) ? res.data : (res.data?.data || []);
        // Ensure we always return an array
        return Array.isArray(data) ? data : [];
      } catch (error) {
        console.error('Error fetching following list:', error);
        return [];
      }
    },
    staleTime: 2 * 60 * 1000, // 2 phút - following list không thay đổi thường xuyên
    gcTime: 10 * 60 * 1000, // 10 phút cache
    refetchInterval: false, // No polling - use socket for real-time updates
  });

  // Ensure followingList is always an array
  const followingList = Array.isArray(followingListData) ? followingListData : [];

  // Fetch latest system notification to show in inbox (always show latest one)
  const { data: systemNotificationData } = useQuery({
    queryKey: ['systemNotifications', 'latest'],
    queryFn: async () => {
      if (!isMountedRef.current) return null;
      try {
        const response = await notificationsAPI.getSystemNotifications('', 1, 1);
        const notifications = response.data?.notifications || [];
        // Get the latest notification (first one)
        return notifications.length > 0 ? notifications[0] : null;
      } catch (error) {
        console.error('Error fetching system notifications:', error);
        return null;
      }
    },
    refetchInterval: false, // No polling - use socket for real-time updates
    refetchOnMount: true, // Always refetch on mount for fresh data
    // Query will automatically stop when component unmounts
  });

  // Track online status for following users (updated via socket)
  const [onlineStatusMap, setOnlineStatusMap] = useState<Record<string, boolean>>({});
  
  // State for mute all notifications
  const [isMutedAll, setIsMutedAll] = useState<boolean>(false);
  
  // State for new message modal
  const [showNewMessageModal, setShowNewMessageModal] = useState<boolean>(false);
  const [modalSearchQuery, setModalSearchQuery] = useState<string>('');
  
  // State for create group modal
  const [showCreateGroupModal, setShowCreateGroupModal] = useState<boolean>(false);
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [groupSearchQuery, setGroupSearchQuery] = useState<string>('');
  const [isAdvancedEncryption, setIsAdvancedEncryption] = useState<boolean>(false);
  const [showSetGroupNameModal, setShowSetGroupNameModal] = useState<boolean>(false);
  const [groupName, setGroupName] = useState<string>('');
  
  // Mutation for creating group conversation
  const createGroupConversationMutation = useMutation({
    mutationFn: ({ name, participantIds }: { name: string; participantIds: string[] }) =>
      chatAPI.createGroupConversation(name, participantIds),
    onSuccess: async (response: any) => {
      const data = response.data || response;
      const conversationId = data?.conversationId || data?.groupId;
      
      if (!conversationId) {
        Toast.show({
          type: 'error',
          text1: 'Không thể tạo nhóm chat',
          text2: 'Vui lòng thử lại sau',
        });
        return;
      }
      
      // Get the group name from response or state
      const finalGroupName = data?.groupName || groupName.trim() || `Nhóm ${selectedMembers.length + 1} người`;
      
      console.log('✅ Group created successfully:', {
        conversationId,
        groupName: finalGroupName,
        members: data?.members || selectedMembers.length + 1,
      });
      
      // Close modals and reset state
      setShowCreateGroupModal(false);
      setShowSetGroupNameModal(false);
      setSelectedMembers([]);
      setGroupSearchQuery('');
      setIsAdvancedEncryption(false);
      setGroupName('');
      
      // Refetch conversations to get updated list
      await refetch();
      
      // Small delay to ensure navigation happens after state reset
      setTimeout(() => {
        // Navigate to ChatDetail with group name
        navigation.navigate('ChatDetail', {
          conversationId: String(conversationId),
          userName: finalGroupName,
        });
      }, 200);
    },
    onError: (error: any) => {
      console.error('Create group error:', error);
      Toast.show({
        type: 'error',
        text1: error?.response?.data?.message || 'Không thể tạo nhóm chat',
      });
    },
  });

  // Mutation for creating conversation (used by both stories and new message modal)
  const createConversationMutation = useMutation({
    mutationFn: (userId: string) => chatAPI.createConversation(userId),
    onSuccess: (response: any, userId) => {
      const conversationId = response.data?.conversationId || response.conversationId;
      if (!conversationId) {
        Toast.show({
          type: 'error',
          text1: 'Không thể tạo cuộc trò chuyện',
        });
        return;
      }
      
      // Find user info from following list
      const userInfo = (Array.isArray(followingList) ? followingList : []).find((item: any) => {
        const itemUserId = item.following_id || item.id || item.user_id;
        return String(itemUserId) === userId;
      });
      const userName = userInfo?.full_name || userInfo?.username || 'Người dùng';
      const userAvatarUrl = userInfo?.avatar_url;
      const isOnlineStatus = onlineStatusMap[userId] !== undefined 
        ? onlineStatusMap[userId] 
        : (userInfo?.status === 'online');
      
      // Navigate to ChatDetail
      navigation.navigate('ChatDetail', {
        conversationId: String(conversationId),
        userName: userName,
        userAvatarUrl: userAvatarUrl,
        otherUserId: userId,
        isOnline: isOnlineStatus,
      });
    },
    onError: (error: any) => {
      Toast.show({
        type: 'error',
        text1: error?.response?.data?.message || 'Không thể tạo cuộc trò chuyện',
      });
    },
  });

  // Handler for notifications icon
  const handleNotificationsPress = () => {
    navigation.dispatch(
      CommonActions.navigate({
        name: 'Party', // NotificationsScreen is in Party tab
      })
    );
  };

  // Handler for new message icon (edit)
  const handleNewMessagePress = () => {
    setModalSearchQuery(''); // Reset search when opening modal
    setShowNewMessageModal(true);
  };

  // Handler for mute all icon
  const handleMuteAllPress = async () => {
    const newMuteState = !isMutedAll;
    try {
      await AsyncStorage.setItem('muteAllNotifications', JSON.stringify(newMuteState));
      setIsMutedAll(newMuteState);
      Toast.show({
        type: 'success',
        text1: newMuteState ? 'Đã tắt thông báo' : 'Đã bật thông báo',
      });
    } catch (error) {
      console.error('Error saving mute state:', error);
      Toast.show({
        type: 'error',
        text1: 'Không thể cập nhật cài đặt',
      });
    }
  };

  // Load mute all state from AsyncStorage
  useEffect(() => {
    const loadMuteState = async () => {
      try {
        const stored = await AsyncStorage.getItem('muteAllNotifications');
        if (stored !== null) {
          setIsMutedAll(JSON.parse(stored));
        }
      } catch (error) {
        console.error('Error loading mute state:', error);
      }
    };
    loadMuteState();
  }, []);

  // Load pinned conversations from AsyncStorage on mount
  const loadPinnedConversations = useCallback(async () => {
    try {
      const stored = await AsyncStorage.getItem('pinnedConversations');
      return stored ? JSON.parse(stored) : {};
    } catch (error) {
      console.error('Error loading pinned conversations:', error);
      return {};
    }
  }, []);

  // Save pinned conversations to AsyncStorage
  const savePinnedConversations = useCallback(async (pinnedMap: Record<string, boolean>) => {
    try {
      await AsyncStorage.setItem('pinnedConversations', JSON.stringify(pinnedMap));
    } catch (error) {
      console.error('Error saving pinned conversations:', error);
    }
  }, []);

  // Sync pinned state from AsyncStorage to cache after conversations update
  // This ensures pinned state persists even after automatic refetch
  // Use ref to track last synced conversation IDs to avoid infinite loop
  const lastSyncedConversationIdsRef = useRef<string>('');
  
  useEffect(() => {
    let isMounted = true;
    let timeoutId: NodeJS.Timeout;
    
    const syncPinnedState = async () => {
      if (conversations.length === 0) return;
      
      // Create a stable key from conversation IDs to detect actual changes
      const conversationIds = conversations
        .map((conv: any) => String(conv.id || conv.conversation_id))
        .sort()
        .join(',');
      
      // Skip if we've already synced for these exact conversations
      if (lastSyncedConversationIdsRef.current === conversationIds) {
        return;
      }
      
      try {
        const pinnedMap = await loadPinnedConversations();
        const hasPinnedConversations = Object.keys(pinnedMap).some(k => pinnedMap[k] === true);
        
        if (!hasPinnedConversations) {
          lastSyncedConversationIdsRef.current = conversationIds;
          return;
        }
        
        // Check if any conversation needs pinned state update
        const needsUpdate = conversations.some((conv: any) => {
          const convId = String(conv.id || conv.conversation_id);
          const shouldBePinned = pinnedMap[convId] === true;
          const isCurrentlyPinned = conv.pinned || conv.is_pinned || false;
          return shouldBePinned !== isCurrentlyPinned;
        });
        
        if (needsUpdate && isMounted) {
          console.log('📌 [Pin] Syncing pinned state from AsyncStorage to cache');
          queryClient.setQueryData(['conversations'], (oldData: any[]) => {
            if (!oldData) return oldData;
            return oldData.map((conv: any) => {
              const convId = String(conv.id || conv.conversation_id);
              const shouldBePinned = pinnedMap[convId] === true;
              
              if (shouldBePinned && (!conv.pinned && !conv.is_pinned)) {
                // Update to pinned
                console.log(`📌 [Pin] Restoring pinned state for conversation ${convId}`);
                return { ...conv, pinned: true, is_pinned: true };
              } else if (!shouldBePinned && (conv.pinned || conv.is_pinned)) {
                // Only update to unpinned if AsyncStorage explicitly says false
                // Don't update if AsyncStorage doesn't have the key (preserve current state)
                if (pinnedMap[convId] === false) {
                  return { ...conv, pinned: false, is_pinned: false };
                }
              }
              return conv;
            });
          });
        }
        
        // Mark as synced for these conversations
        lastSyncedConversationIdsRef.current = conversationIds;
      } catch (error) {
        console.error('Error syncing pinned state:', error);
        // Mark as synced even on error to avoid retry loop
        lastSyncedConversationIdsRef.current = conversationIds;
      }
    };
    
    // Debounce to avoid too many updates
    timeoutId = setTimeout(() => {
      syncPinnedState();
    }, 100);
    
    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
    };
  }, [conversations.length, loadPinnedConversations, queryClient]); // Use conversations.length to avoid infinite loop

  // Initialize online status map from following list and conversations
  // Use useMemo to compute status map and only update when actually changed
  const computedStatusMap = useMemo(() => {
    const statusMap: Record<string, boolean> = {};
    
    // Initialize from following list (API returns status)
    (Array.isArray(followingList) ? followingList : []).forEach((friend: any) => {
      const userId = friend.following_id || friend.id || friend.user_id;
      const userIdString = userId?.toString();
      if (userIdString && friend.status === 'online') {
        statusMap[userIdString] = true;
      }
    });
    
    // Also check conversations for status
    conversations.forEach((conv: any) => {
      const otherUserId = conv?.other_user_id || conv?.otherUserId;
      const userIdString = otherUserId?.toString();
      if (userIdString && conv.status === 'online') {
        statusMap[userIdString] = true;
      }
    });
    
    return statusMap;
  }, [followingList, conversations]);

  // Only update state when computed map actually changes
  useEffect(() => {
    setOnlineStatusMap((prev) => {
      // Check if there are any actual changes
      const hasChanges = Object.keys(computedStatusMap).some(
        key => prev[key] !== computedStatusMap[key]
      ) || Object.keys(prev).some(
        key => computedStatusMap[key] === undefined && prev[key] !== undefined
      );
      
      // Only update if there are actual changes to avoid infinite loop
      if (!hasChanges) {
        return prev;
      }
      
      // Merge with existing map, but prioritize new data
      return { ...prev, ...computedStatusMap };
    });
  }, [computedStatusMap]);

  // Filter online friends from following list
  const onlineFriends = useMemo(() => {
    return (Array.isArray(followingList) ? followingList : []).filter((friend: any) => {
      const userId = friend.following_id || friend.id || friend.user_id;
      const userIdString = userId?.toString();
      
      // Priority 1: Check real-time status from socket updates
      if (userIdString && onlineStatusMap[userIdString] !== undefined) {
        return onlineStatusMap[userIdString];
      }
      
      // Priority 2: Check status from following list (API returns status)
      if (friend.status === 'online') {
        return true;
      }
      
      // Priority 3: Check if user is online in conversations (fallback)
      const conversation = conversations.find((conv: any) => {
        const otherUserId = conv.other_user_id || conv.otherUserId;
        return String(otherUserId) === String(userId);
      });
      return conversation?.status === 'online';
    });
  }, [followingList, conversations, onlineStatusMap]);
  
  // Debug logging
  useEffect(() => {
    console.log('📱 ChatListScreen - Current conversations:', conversations);
    console.log('📱 ChatListScreen - Is loading:', isLoading);
    console.log('📱 ChatListScreen - Error:', error);
  }, [conversations, isLoading, error]);

  // Refetch conversations when screen comes into focus (e.g., returning from ChatDetailScreen)
  useFocusEffect(
    React.useCallback(() => {
      // Refetch conversations when screen is focused to get latest unread counts
      if (isMountedRef.current) {
        refetch();
      }
    }, [refetch])
  );

  // Listen for real-time updates from socket
  useEffect(() => {
    if (!socket || !currentUserId) return;

    // Handle user status changes
    const handleUserStatusChanged = (data: any) => {
      console.log('🔄 ChatListScreen - User status changed:', data);
      
      // Update online status map immediately for real-time update
      if (data.userId && data.status !== undefined) {
        const userIdString = String(data.userId);
        const isOnline = data.status === 'online';
        
        // Update online status map for stories section
        setOnlineStatusMap((prev) => ({
          ...prev,
          [userIdString]: isOnline,
        }));
        
        // Update conversations cache immediately for real-time status update
        queryClient.setQueryData(['conversations'], (oldData: any[]) => {
          if (!oldData) return oldData;
          
          const updated = oldData.map((conv: any) => {
            const otherUserId = conv?.other_user_id || conv?.otherUserId;
            if (String(otherUserId) === String(data.userId)) {
              // When user goes offline, update last_seen immediately
              // When user goes online, keep existing last_seen (don't overwrite)
              const updatedLastSeen = (data.status === 'offline' && data.lastSeen) 
                ? data.lastSeen 
                : (data.lastSeen || conv.last_seen || conv.lastSeen);
              
              return {
                ...conv,
                status: data.status,
                last_seen: updatedLastSeen,
                lastSeen: updatedLastSeen,
              };
            }
            return conv;
          });
          
          console.log('🔄 Updated conversation status in real-time');
          return updated;
        });
      }
      
      // Also refetch to ensure consistency
      refetch();
    };

    // Handle receiveMessage - tin nhắn mới từ người khác (có senderId)
    const handleReceiveMessage = (data: any) => {
      console.log('📬 ChatListScreen - Received message:', data);
      
      if (!data.senderId || !data.message) return;
      
      // Lưu lại để kết hợp với conversationUpdated
      lastReceivedMessage.current = {
        senderId: data.senderId,
        message: data.message,
        timestamp: data.timestamp || new Date(),
      };
      
      // Tìm conversation chứa sender này và cập nhật ngay lập tức
      queryClient.setQueryData(['conversations'], (oldData: any[]) => {
        if (!oldData) return oldData;
        
        const updated = oldData.map((conv: any) => {
          const otherUserId = conv?.other_user_id || conv?.otherUserId;
          // Nếu conversation với người gửi tin nhắn
          if (String(otherUserId) === String(data.senderId)) {
            const isFromOther = String(data.senderId) !== String(currentUserId);
            const currentUnread = conv?.unread_count || conv?.unreadCount || 0;
            
            return {
              ...conv,
              last_message: data.message,
              last_message_time: data.timestamp || new Date().toISOString(),
              last_message_sender_id: data.senderId, // Cập nhật sender ID để hiển thị "Bạn: " đúng
              last_message_type: data.messageType || data.message_type, // Cập nhật message type để hiển thị sticker đúng
              updated_at: data.timestamp || new Date().toISOString(),
              // Tăng unread_count ngay lập tức nếu tin nhắn từ người khác
              unread_count: isFromOther ? currentUnread + 1 : currentUnread,
              unreadCount: isFromOther ? currentUnread + 1 : currentUnread,
            };
          }
          return conv;
        });
        
        // Sort: Pinned conversations first, then by time (most recent first)
        updated.sort((a: any, b: any) => {
          const aPinned = a.pinned || a.is_pinned || false;
          const bPinned = b.pinned || b.is_pinned || false;
          
          // If one is pinned and the other is not, pinned comes first
          if (aPinned && !bPinned) return -1;
          if (!aPinned && bPinned) return 1;
          
          // If both are pinned or both are not pinned, sort by time
          const timeA = new Date(a.updated_at || a.last_message_time || 0).getTime();
          const timeB = new Date(b.updated_at || b.last_message_time || 0).getTime();
          return timeB - timeA; // Most recent first
        });
        
        console.log('📬 Updated conversation list immediately from receiveMessage');
        return updated;
      });
    };

    // Handle conversation updates (new messages) - có conversationId
    const handleConversationUpdated = (data: any) => {
      console.log('📬 ChatListScreen - Conversation updated:', data);
      
      // Optimistic update: Update local state immediately for instant UI update
      if (data.conversationId && data.lastMessage) {
        // Update React Query cache immediately (optimistic update)
        queryClient.setQueryData(['conversations'], (oldData: any[]) => {
          if (!oldData) return oldData;
          
          // Kiểm tra xem có receiveMessage trước đó không để tăng unread_count
          const receivedMsg = lastReceivedMessage.current;
          const shouldIncrementUnread = receivedMsg && 
            String(receivedMsg.senderId) !== String(currentUserId);
          
          // Find and update the conversation
          const updated = oldData.map((conv: any) => {
            const convId = conv?.id || conv?.conversation_id;
            if (String(convId) === String(data.conversationId)) {
              const currentUnread = conv?.unread_count || conv?.unreadCount || 0;
              
              // Cập nhật last message và timestamp ngay lập tức
              const updatedConv = {
                ...conv,
                last_message: data.lastMessage,
                last_message_time: data.timestamp || new Date().toISOString(),
                last_message_sender_id: data.senderId || receivedMsg?.senderId || conv?.last_message_sender_id, // Cập nhật sender ID để hiển thị "Bạn: " đúng
                last_message_type: data.messageType || data.message_type || conv?.last_message_type, // Cập nhật message type để hiển thị sticker đúng
                updated_at: data.timestamp || new Date().toISOString(),
              };
              
              // Tăng unread_count nếu có receiveMessage từ người khác
              if (shouldIncrementUnread) {
                updatedConv.unread_count = currentUnread + 1;
                updatedConv.unreadCount = currentUnread + 1;
                // Xóa cache sau khi dùng
                lastReceivedMessage.current = null;
              }
              
              return updatedConv;
            }
            return conv;
          });
          
          // Sort: Pinned conversations first, then by time (most recent first)
          updated.sort((a: any, b: any) => {
            const aPinned = a.pinned || a.is_pinned || false;
            const bPinned = b.pinned || b.is_pinned || false;
            
            // If one is pinned and the other is not, pinned comes first
            if (aPinned && !bPinned) return -1;
            if (!aPinned && bPinned) return 1;
            
            // If both are pinned or both are not pinned, sort by time
            const timeA = new Date(a.updated_at || a.last_message_time || 0).getTime();
            const timeB = new Date(b.updated_at || b.last_message_time || 0).getTime();
            return timeB - timeA; // Most recent first
          });
          
      console.log('📬 Optimistically updated conversation list');
      return updated;
    });
  }
  
  // Also refetch to get latest data (unread count, status, etc.)
  // This runs in background and will update if server data differs
  setTimeout(() => {
    refetch();
  }, 300);
};

// Handle typing indicators
const handleUserTyping = (data: any) => {
  console.log('⌨️ ChatListScreen - User typing event received:', data);
  console.log('⌨️ Current userId:', currentUserId);
  
  if (!data.conversationId || !data.userId) {
    console.warn('⌨️ Missing conversationId or userId in typing event');
    return;
  }
  
  // Only show typing if it's from the other user (not current user)
  if (String(data.userId) === String(currentUserId)) {
    console.log('⌨️ Ignoring typing from current user');
    return;
  }
  
  const convId = String(data.conversationId);
  console.log('⌨️ Setting typing to true for conversation:', convId);
  setTypingMap((prev) => ({
    ...prev,
    [convId]: true,
  }));
  
  // Auto-clear typing after 5 seconds if no stopTyping event
  setTimeout(() => {
    setTypingMap((prev) => {
      if (prev[convId]) {
        console.log('⌨️ Auto-clearing typing for conversation:', convId);
        return { ...prev, [convId]: false };
      }
      return prev;
    });
  }, 5000);
};

const handleUserStoppedTyping = (data: any) => {
  console.log('⌨️ ChatListScreen - User stopped typing event received:', data);
  
  if (!data.conversationId) {
    console.warn('⌨️ Missing conversationId in stopTyping event');
    return;
  }
  
  const convId = String(data.conversationId);
  console.log('⌨️ Setting typing to false for conversation:', convId);
  setTypingMap((prev) => ({
    ...prev,
    [convId]: false,
  }));
};

socket.on('userStatusChanged', handleUserStatusChanged);
socket.on('receiveMessage', handleReceiveMessage);
socket.on('conversationUpdated', handleConversationUpdated);
socket.on('userTyping', handleUserTyping);
socket.on('userStoppedTyping', handleUserStoppedTyping);

    return () => {
      socket.off('userStatusChanged', handleUserStatusChanged);
      socket.off('receiveMessage', handleReceiveMessage);
      socket.off('conversationUpdated', handleConversationUpdated);
      socket.off('userTyping', handleUserTyping);
      socket.off('userStoppedTyping', handleUserStoppedTyping);
    };
  }, [socket, refetch, queryClient, currentUserId]);

  // Calculate unread count
  const unreadCount = useMemo(() => {
    return conversations.reduce((total: number, conv: any) => {
      return total + (conv.unread_count || conv.unreadCount || 0);
    }, 0);
  }, [conversations]);

  // Format time for message preview (like Facebook: "13:24" for today, "Th 4" for this week, "DD/MM" for older)
  // timeRefreshKey forces recalculation every minute to update time display (like Facebook)
  const formatMessageTime = useMemo(() => {
    return (dateString: string | null | undefined): string => {
      if (!dateString) return '';
      
      try {
        const date = new Date(dateString);
        
        // Validate date
        if (isNaN(date.getTime())) {
          return '';
        }
        
        // Hiển thị giống Facebook Messenger
        // Nếu trong cùng ngày hôm nay: hiển thị giờ:phút (13:24)
        // Nếu trong tuần này: hiển thị thứ trong tuần (Th 2, Th 3, Th 4, Th 5, Th 6, Th 7, CN)
        // Nếu quá 1 tuần: hiển thị ngày/tháng (DD/MM)
        
        // Lấy thời gian thực từ điện thoại (theo timezone của điện thoại)
        const now = new Date();
        
        // So sánh ngày theo timezone local của điện thoại
        // Lấy ngày hiện tại (bỏ giờ, phút, giây) để so sánh
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
        const messageDateStart = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0);
        
        // Tính số ngày chênh lệch (chính xác hơn)
        const diffInDays = Math.floor((todayStart.getTime() - messageDateStart.getTime()) / (1000 * 60 * 60 * 24));
        
        if (diffInDays === 0) {
          // Hôm nay: hiển thị giờ:phút (13:24) - lấy từ thời gian thực trên điện thoại
          const hours = date.getHours().toString().padStart(2, '0');
          const minutes = date.getMinutes().toString().padStart(2, '0');
          return `${hours}:${minutes}`;
        } else if (diffInDays > 0 && diffInDays < 7) {
          // Trong tuần này: hiển thị thứ trong tuần (Th 2, Th 3, Th 4, Th 5, Th 6, Th 7, CN)
          const daysOfWeek = ['CN', 'Th 2', 'Th 3', 'Th 4', 'Th 5', 'Th 6', 'Th 7'];
          return daysOfWeek[date.getDay()];
        } else {
          // Quá 1 tuần: hiển thị ngày/tháng (DD/MM)
          const day = date.getDate().toString().padStart(2, '0');
          const month = (date.getMonth() + 1).toString().padStart(2, '0');
          return `${day}/${month}`;
        }
      } catch (error) {
        console.error('Error formatting message time:', error);
        return '';
      }
    };
  }, [timeRefreshKey]); // Recalculate when timeRefreshKey changes (every minute)

  // Filter following list for modal by search query
  const filteredFollowingList = useMemo(() => {
    if (!Array.isArray(followingList)) {
      console.log('📋 filteredFollowingList: followingList is not an array', followingList);
      return [];
    }
    if (followingList.length === 0) {
      console.log('📋 filteredFollowingList: followingList is empty');
      return [];
    }
    try {
      const filtered = followingList.filter((item: any) => {
        // Skip current user
        const userId = item.following_id || item.id || item.user_id;
        if (userId && String(userId) === String(currentUserId)) {
          return false;
        }
        
        // If no search query, return all (except current user)
        if (!modalSearchQuery.trim()) {
          return true;
        }
        
        // Filter by search query
        const name = item.full_name || item.username || '';
        const username = item.username || '';
        const department = item.department || '';
        const searchLower = modalSearchQuery.toLowerCase();
        return (
          name.toLowerCase().includes(searchLower) ||
          username.toLowerCase().includes(searchLower) ||
          department.toLowerCase().includes(searchLower)
        );
      });
      console.log('📋 filteredFollowingList:', {
        total: followingList.length,
        filtered: filtered.length,
        currentUserId,
        modalSearchQuery,
        sampleItem: followingList[0]
      });
      return filtered;
    } catch (error) {
      console.error('Error filtering following list:', error);
      return [];
    }
  }, [followingList, modalSearchQuery, currentUserId]);

  // Filter conversations based on search and active tab
  const filteredConversations = useMemo(() => {
    // Chỉ hiển thị conversations có tin nhắn (có last_message hoặc lastMessage)
    let filtered = conversations.filter((conv: any) => {
      // Luôn hiển thị system notifications
      if (conv.is_system_notification) {
        return true;
      }
      
      // Chỉ hiển thị conversations có tin nhắn thực sự
      const hasLastMessage = !!(conv.last_message || conv.lastMessage);
      const hasMessageContent = hasLastMessage && (
        (conv.last_message?.content && conv.last_message.content.trim() !== '') ||
        (conv.lastMessage?.content && conv.lastMessage.content.trim() !== '') ||
        (typeof conv.last_message === 'string' && conv.last_message.trim() !== '') ||
        (typeof conv.lastMessage === 'string' && conv.lastMessage.trim() !== '')
      );
      
      return hasMessageContent;
    });

    // Filter by search term
    if (searchQuery.trim()) {
      filtered = filtered.filter((conv: any) => {
        const name = conv.full_name || conv.username || conv.name || '';
        const message = conv.last_message || conv.lastMessage || '';
        return (
          name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          message.toLowerCase().includes(searchQuery.toLowerCase())
        );
      });
    }

    // Filter by active tab
    if (activeTab === 'groups') {
      filtered = filtered.filter((conv: any) => conv.type === 'group' || conv.conversation_type === 'group');
    } else if (activeTab === 'unread') {
      filtered = filtered.filter((conv: any) => (conv.unread_count || conv.unreadCount || 0) > 0);
    } else if (activeTab === 'muted') {
      filtered = filtered.filter((conv: any) => conv.is_muted === true || conv.isMuted === true);
    }

    // Remove duplicates based on ID to prevent key conflicts
    const seen = new Set();
    filtered = filtered.filter((conv: any) => {
      const id = conv?.id || conv?.conversation_id;
      if (id && seen.has(id)) {
        return false; // Skip duplicate
      }
      if (id) {
        seen.add(id);
      }
      return true;
    });

    // Add system notification to the list (always show latest one, not just unread)
    // Always show in "Tất cả" (inbox) tab, but skip if dismissed
    if (systemNotificationData && !searchQuery.trim() && activeTab === 'inbox') {
      // Check if this notification has been dismissed
      if (!dismissedSystemNotifications.has(systemNotificationData.id)) {
        const systemNotificationItem = {
          id: `system_notification_${systemNotificationData.id}`,
          conversation_id: `system_notification_${systemNotificationData.id}`,
          full_name: 'Thông báo hệ thống',
          username: 'system',
          avatar_url: null,
          last_message: {
            content: systemNotificationData.description,
            created_at: systemNotificationData.created_at
          },
          last_message_time: systemNotificationData.created_at,
          updated_at: systemNotificationData.created_at,
          unread_count: systemNotificationData.is_read ? 0 : 1,
          type: 'system',
          is_system_notification: true,
          system_notification_id: systemNotificationData.id,
          pinned: false, // Can be pinned like normal conversations
          is_pinned: false,
        };
        filtered.push(systemNotificationItem);
      }
    }

    // Sort: Pinned conversations first, then by time (most recent first)
    // This ensures new messages push system notifications down
    filtered.sort((a: any, b: any) => {
      const aPinned = a.pinned || a.is_pinned || false;
      const bPinned = b.pinned || b.is_pinned || false;
      
      // If one is pinned and the other is not, pinned comes first
      if (aPinned && !bPinned) return -1;
      if (!aPinned && bPinned) return 1;
      
      // If both are pinned or both are not pinned, sort by time
      const timeA = new Date(a.updated_at || a.last_message_time || 0).getTime();
      const timeB = new Date(b.updated_at || b.last_message_time || 0).getTime();
      return timeB - timeA; // Most recent first
    });

    return filtered;
  }, [conversations, searchQuery, activeTab, systemNotificationData, dismissedSystemNotifications]);

  const handleConversationPress = (conversation: any) => {
    // Ensure we have a valid conversationId before navigating
    const conversationId = conversation?.id || conversation?.conversation_id;
    const isGroupChat = conversation?.type === 'group' || conversation?.conversation_type === 'group';
    
    // For group chats, use group name; for private chats, use user name
    const userName = isGroupChat 
      ? (conversation?.name || conversation?.full_name || 'Nhóm chat')
      : (conversation?.full_name || conversation?.username || 'Người dùng');
    
    const userAvatarUrl = conversation?.avatar_url;
    const otherUserId = conversation?.other_user_id; // Needed for socket emit (only for private chats)
    const isOnline = conversation?.status === 'online';
    const lastSeen = conversation?.last_seen || conversation?.lastSeen; // For "Hoạt động X trước"
    
    if (!conversationId) {
      console.error('❌ ChatListScreen - Cannot navigate: missing conversationId', conversation);
      return;
    }
    
    navigation.navigate('ChatDetail', {
      conversationId: String(conversationId),
      userName: userName,
      userAvatarUrl: userAvatarUrl,
      otherUserId: otherUserId ? String(otherUserId) : undefined,
      isOnline: isOnline,
      lastSeen: lastSeen,
      lastMessageTime: conversation?.last_message_time || conversation?.lastMessageTime || conversation?.updated_at,
      type: conversation?.type || conversation?.conversation_type, // Pass conversation type for group chat detection
    });
  };

  // Handler for mute action
  const handleMute = async (conversationId: string) => {
    const actionKey = `mute-${conversationId}`;
    
    // Prevent duplicate calls
    if (actionLoading[actionKey]) {
      return;
    }
    
    try {
      setActionLoading(prev => ({ ...prev, [actionKey]: true }));
      
      // Optimistic update: Update is_muted immediately
      queryClient.setQueryData(['conversations'], (oldData: any[]) => {
        if (!oldData) return oldData;
        return oldData.map((conv: any) => 
          String(conv.id) === String(conversationId)
            ? { ...conv, is_muted: true, isMuted: true }
            : conv
        );
      });
      
      // Close swipeable if open
      if (swipeableRefs.current[conversationId]) {
        swipeableRefs.current[conversationId].close();
      }
      
      await chatAPI.muteConversation(conversationId, true);
      
      // Invalidate and refetch to ensure sync
      await queryClient.invalidateQueries({ queryKey: ['conversations'] });
      await refetch();
    } catch (error) {
      console.error('Error muting conversation:', error);
      
      // Rollback on error
      await refetch();
      
      showAlert(
        'Lỗi',
        'Không thể tắt tiếng cuộc trò chuyện',
        undefined,
        'OK',
        'error'
      );
    } finally {
      setActionLoading(prev => {
        const newState = { ...prev };
        delete newState[actionKey];
        return newState;
      });
    }
  };

  // Handler for delete action
  const handleDelete = async (conversationId: string) => {
    const actionKey = `delete-${conversationId}`;
    
    // Prevent duplicate calls
    if (actionLoading[actionKey]) {
      return;
    }
    
    try {
      setActionLoading(prev => ({ ...prev, [actionKey]: true }));
      
      // Optimistic update: Remove conversation from list immediately
      queryClient.setQueryData(['conversations'], (oldData: any[]) => {
        if (!oldData) return oldData;
        return oldData.filter((conv: any) => String(conv.id) !== String(conversationId));
      });
      
      // Close swipeable if open
      if (swipeableRefs.current[conversationId]) {
        swipeableRefs.current[conversationId].close();
      }
      
      // Call API to hide conversation (soft delete - only for this user)
      await chatAPI.deleteConversation(conversationId);
      
      // Invalidate and refetch to ensure sync with server
      await queryClient.invalidateQueries({ queryKey: ['conversations'] });
      await refetch();
    } catch (error) {
      console.error('Error deleting conversation:', error);
      
      // Rollback on error - restore conversation in list
      await refetch();
      
      showAlert(
        'Lỗi',
        'Không thể xóa cuộc trò chuyện',
        undefined,
        'OK',
        'error'
      );
    } finally {
      setActionLoading(prev => {
        const newState = { ...prev };
        delete newState[actionKey];
        return newState;
      });
    }
  };

  // Handler for unread action
  const handleUnread = async (conversationId: string) => {
    const actionKey = `unread-${conversationId}`;
    
    // Prevent duplicate calls
    if (actionLoading[actionKey]) {
      return;
    }
    
    try {
      setActionLoading(prev => ({ ...prev, [actionKey]: true }));
      
      // Optimistic update: Update unread_count immediately
      queryClient.setQueryData(['conversations'], (oldData: any[]) => {
        if (!oldData) return oldData;
        return oldData.map((conv: any) => 
          String(conv.id) === String(conversationId)
            ? { ...conv, unread_count: (conv.unread_count || 0) + 1, unreadCount: (conv.unreadCount || 0) + 1 }
            : conv
        );
      });
      
      // Close swipeable if open
      if (swipeableRefs.current[conversationId]) {
        swipeableRefs.current[conversationId].close();
      }
      
      await chatAPI.markAsUnread(conversationId);
      
      // Invalidate and refetch to ensure sync
      await queryClient.invalidateQueries({ queryKey: ['conversations'] });
      await refetch();
    } catch (error) {
      console.error('Error marking as unread:', error);
      
      // Rollback on error
      await refetch();
      
      showAlert(
        'Lỗi',
        'Không thể đánh dấu chưa đọc',
        undefined,
        'OK',
        'error'
      );
    } finally {
      setActionLoading(prev => {
        const newState = { ...prev };
        delete newState[actionKey];
        return newState;
      });
    }
  };

  // Handler for pin action
  const handlePin = async (conversationId: string) => {
    const actionKey = `pin-${conversationId}`;
    
    // Prevent duplicate calls
    if (actionLoading[actionKey]) {
      return;
    }
    
    // Get current pinned state before try block so it's available in catch
    const conversation = conversations.find((c: any) => 
      (c.id || c.conversation_id) === conversationId
    );
    const isPinned = conversation?.pinned || conversation?.is_pinned || false;
    const newPinnedState = !isPinned;
    
    try {
      setActionLoading(prev => ({ ...prev, [actionKey]: true }));
      
      // Optimistic update: Update pinned state immediately (set both pinned and is_pinned)
      queryClient.setQueryData(['conversations'], (oldData: any[]) => {
        if (!oldData) return oldData;
        const updated = oldData.map((conv: any) => 
          String(conv.id) === String(conversationId)
            ? { ...conv, pinned: newPinnedState, is_pinned: newPinnedState }
            : conv
        );
        console.log(`📌 [Pin] Optimistic update: conversation ${conversationId} -> ${newPinnedState ? 'PINNED' : 'UNPINNED'}`);
        return updated;
      });
      
      // Save to AsyncStorage for persistence IMMEDIATELY
      const pinnedMap = await loadPinnedConversations();
      pinnedMap[conversationId] = newPinnedState;
      await savePinnedConversations(pinnedMap);
      console.log(`📌 [Pin] Saved to AsyncStorage: conversation ${conversationId} -> ${newPinnedState ? 'PINNED' : 'UNPINNED'}`);
      
      // Close swipeable if open
      if (swipeableRefs.current[conversationId]) {
        swipeableRefs.current[conversationId].close();
      }
      
      const response = await chatAPI.pinConversation(conversationId, newPinnedState);
      
      // If API returns updated conversation, use it; otherwise keep optimistic update
      if (response?.data) {
        queryClient.setQueryData(['conversations'], (oldData: any[]) => {
          if (!oldData) return oldData;
          return oldData.map((conv: any) => 
            String(conv.id) === String(conversationId)
              ? { 
                  ...conv, 
                  pinned: response.data.pinned !== undefined ? response.data.pinned : newPinnedState,
                  is_pinned: response.data.is_pinned !== undefined ? response.data.is_pinned : newPinnedState,
                }
              : conv
          );
        });
      } else {
        // Ensure optimistic update is preserved
        queryClient.setQueryData(['conversations'], (oldData: any[]) => {
          if (!oldData) return oldData;
          return oldData.map((conv: any) => 
            String(conv.id) === String(conversationId)
              ? { ...conv, pinned: newPinnedState, is_pinned: newPinnedState }
              : conv
          );
        });
      }
      
      // AsyncStorage already saved above (line 1076-1079), no need to save again
      
      // Force update cache one more time to ensure pinned state is set
      queryClient.setQueryData(['conversations'], (oldData: any[]) => {
        if (!oldData) return oldData;
        return oldData.map((conv: any) => 
          String(conv.id) === String(conversationId)
            ? { ...conv, pinned: newPinnedState, is_pinned: newPinnedState }
            : conv
        );
      });
      
      // Don't refetch immediately to preserve UI state
      // Only invalidate to mark as stale, will refetch on next focus or interval
      // But don't refetch right away to avoid overwriting optimistic update
      queryClient.invalidateQueries({ queryKey: ['conversations'], refetchType: 'none' });
    } catch (error) {
      console.error('Error pinning conversation:', error);
      
      // Rollback optimistic update
      queryClient.setQueryData(['conversations'], (oldData: any[]) => {
        if (!oldData) return oldData;
        return oldData.map((conv: any) => 
          String(conv.id) === String(conversationId)
            ? { ...conv, pinned: isPinned, is_pinned: isPinned }
            : conv
        );
      });
      
      // Rollback AsyncStorage
      const pinnedMap = await loadPinnedConversations();
      pinnedMap[conversationId] = isPinned;
      await savePinnedConversations(pinnedMap);
      
      // Refetch to get correct state from server
      await refetch();
      
      showAlert(
        'Lỗi',
        'Không thể ghim cuộc trò chuyện',
        undefined,
        'OK',
        'error'
      );
    } finally {
      setActionLoading(prev => {
        const newState = { ...prev };
        delete newState[actionKey];
        return newState;
      });
    }
  };

  // Handler để đóng swipeable trước đó khi mở item mới
  const handleSwipeableWillOpen = (conversationId: string) => {
    // Đóng swipeable đang mở (nếu có)
    if (currentOpenSwipeable.current && currentOpenSwipeable.current !== conversationId) {
      const previousRef = swipeableRefs.current[currentOpenSwipeable.current];
      if (previousRef) {
        previousRef.close();
      }
    }
    // Lưu conversationId đang mở
    currentOpenSwipeable.current = conversationId;
  };

  // Handler để reset khi swipeable đóng
  const handleSwipeableClose = (conversationId: string) => {
    if (currentOpenSwipeable.current === conversationId) {
      currentOpenSwipeable.current = null;
    }
  };

  // Đóng tất cả swipeable khi scroll
  const handleScrollBeginDrag = () => {
    if (currentOpenSwipeable.current) {
      const ref = swipeableRefs.current[currentOpenSwipeable.current];
      if (ref) {
        ref.close();
      }
      currentOpenSwipeable.current = null;
    }
  };

  // Handler để navigate đến NewsFeed với hiệu ứng chuyển app và splash screen
  const handleNavigateToNewsFeed = () => {
    // Bước 1: Fade out màn hình hiện tại
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 150,
      useNativeDriver: true,
    }).start(() => {
      // Bước 2: Hiển thị splash screen (giống Messenger)
      setShowSplashScreen(true);
      splashOpacity.setValue(0);
      
      Animated.timing(splashOpacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start(() => {
        // Preload dữ liệu cho NewsFeed trong thời gian splash screen
        Promise.all([
          // Prefetch posts (all tab)
          queryClient.prefetchQuery({
            queryKey: ['posts', 'all'],
            queryFn: async () => {
              const res = await newsfeedAPI.getPosts(1, 'all');
              return Array.isArray(res.data) ? res.data : (res.data?.posts || []);
            },
          }),
          // Prefetch following list
          queryClient.prefetchQuery({
            queryKey: ['following'],
            queryFn: async () => {
              const res = await friendsAPI.getFollowing();
              return Array.isArray(res.data) ? res.data : (res.data?.data || []);
            },
          }),
        ]).catch((error) => {
          console.log('Preload data error (non-critical):', error);
        });
        
        // Bước 3: Giữ splash screen trong 1.2 giây (giống Messenger)
        setTimeout(() => {
          // Bước 4: Fade out splash screen và navigate
          Animated.timing(splashOpacity, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true,
          }).start(() => {
            setShowSplashScreen(false);
            
            // Navigate đến NewsFeed tab
            InteractionManager.runAfterInteractions(() => {
              const parentNavigation = navigation.getParent();
              if (parentNavigation) {
                parentNavigation.navigate('NewsFeed' as never);
              } else {
                // Fallback: dùng CommonActions
                navigation.dispatch(
                  CommonActions.navigate({
                    name: 'NewsFeed',
                  })
                );
              }
            });
            
            // Reset animation
            setTimeout(() => {
              fadeAnim.setValue(1);
            }, 100);
          });
        }, 1200); // Giữ splash screen 1.2 giây
      });
    });
  };

  // Ẩn bottom navigation khi ở ChatListScreen
  useEffect(() => {
    setIsVisible(false);
    return () => {
      // Hiện lại khi rời khỏi màn hình
      setIsVisible(true);
    };
  }, [setIsVisible]);

  // Handler để navigate đến Profile tab
  const handleProfilePress = () => {
    const parentNavigation = navigation.getParent();
    if (parentNavigation) {
      parentNavigation.navigate('Profile' as never);
    } else {
      // Fallback: dùng CommonActions
      navigation.dispatch(
        CommonActions.navigate({
          name: 'Profile',
        })
      );
    }
  };

  const renderHeader = () => (
    <View style={[styles.headerContainer, { backgroundColor: colors.background }]}>
      <View style={styles.headerTitleRow}>
        <View style={styles.headerTitleContainer}>
          {/* User Avatar with Online Indicator - Bên trái chữ "Tin nhắn" */}
          <TouchableOpacity
            onPress={handleProfilePress}
            activeOpacity={0.7}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <View style={styles.headerAvatarWrapper}>
              {user?.avatar_url ? (
                <Image 
                  source={{ uri: getAvatarURL(user.avatar_url) }} 
                  style={styles.headerAvatar} 
                />
              ) : (
                <View style={[
                  styles.headerAvatar, 
                  { 
                    backgroundColor: colors.primary || '#0084ff', 
                    alignItems: 'center', 
                    justifyContent: 'center' 
                  }
                ]}>
                  <Text style={{ 
                    color: '#FFFFFF', 
                    fontSize: 20, 
                    fontWeight: '600' 
                  }}>
                    {getInitials(user?.full_name || user?.username || 'U')}
                  </Text>
                </View>
              )}
              {/* Online Indicator - Ẩn khi activity status tắt */}
              {activityStatusEnabled && (
                <View style={[
                  styles.headerOnlineIndicator,
                  { borderColor: colors.background || '#FFFFFF' }
                ]} />
              )}
            </View>
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Tin nhắn</Text>
        </View>
        <View style={styles.headerIcons}>
          {/* New Message Icon - Chat bubble with plus in center (exact match to image) */}
          <TouchableOpacity
            onPress={handleNewMessagePress}
            style={styles.headerIconButton}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            activeOpacity={0.7}
          >
            <View style={styles.chatBubbleIconContainer}>
              {/* Chat bubble with tail - outline để dấu cộng hiển thị rõ */}
              <MaterialCommunityIcons 
                name="message-outline" 
                size={26} 
                color={colors.text}
                style={styles.chatBubbleIcon}
              />
              {/* Plus sign centered inside bubble */}
              <View style={[
                styles.chatBubblePlusCenter,
                { zIndex: 10 }
              ]}>
                <MaterialCommunityIcons 
                  name="plus" 
                  size={18} 
                  color={colors.text}
                  style={{ fontWeight: 'bold' }}
                />
              </View>
            </View>
          </TouchableOpacity>
          {/* Logo Icon - Navigate to NewsFeed (cuối cùng bên phải) */}
          <TouchableOpacity
            onPress={handleNavigateToNewsFeed}
            style={styles.headerIconButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Image
              source={require('../../../assets/Zyea.png')}
              style={{ width: 32, height: 32, borderRadius: 6 }}
              resizeMode="contain"
            />
          </TouchableOpacity>
        </View>
      </View>
      
      {/* Search bar */}
      <View style={styles.searchContainer}>
        <Searchbar
          placeholder="Tìm kiếm"
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={[
            styles.searchbar,
            { backgroundColor: isDarkMode ? '#2a2a2b' : '#f0f0f0' }
          ]}
          inputStyle={[styles.searchInput, { color: colors.text }]}
          iconColor={colors.textSecondary}
          placeholderTextColor={colors.textSecondary}
          elevation={0}
          mode="bar"
        />
      </View>
      
      {/* Filter tabs - Scrollable */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipsRow}
        style={styles.chipsScrollView}
      >
        {/* Filter Icon Button */}
        <TouchableOpacity
          style={[
            styles.filterIconButton,
            { backgroundColor: isDarkMode ? '#2a2a2b' : '#e5e5e5' }
          ]}
          onPress={() => {
            setShowFilterModal(true);
          }}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons 
            name="sort" 
            size={20} 
            color={colors.text || (isDarkMode ? '#ffffff' : '#000000')}
          />
        </TouchableOpacity>
        <Chip
          selected={activeTab === 'inbox'}
          onPress={() => setActiveTab('inbox')}
          style={[
            styles.chip,
            activeTab === 'inbox' && { backgroundColor: isDarkMode ? '#ffffff' : '#e0e0e0' }
          ]}
          textStyle={{
            color: activeTab === 'inbox' ? (isDarkMode ? '#000000' : colors.text) : colors.textSecondary,
            fontWeight: activeTab === 'inbox' ? '600' : '400',
          }}
        >
          Tất cả
        </Chip>
        <Chip
          selected={activeTab === 'groups'}
          onPress={() => setActiveTab('groups')}
          style={[
            styles.chip,
            activeTab === 'groups' && { backgroundColor: isDarkMode ? '#ffffff' : '#e0e0e0' }
          ]}
          textStyle={{
            color: activeTab === 'groups' ? (isDarkMode ? '#000000' : colors.text) : colors.textSecondary,
            fontWeight: activeTab === 'groups' ? '600' : '400',
          }}
        >
          Nhóm
        </Chip>
        <Chip
          selected={activeTab === 'unread'}
          onPress={() => setActiveTab('unread')}
          style={[
            styles.chip,
            activeTab === 'unread' && { backgroundColor: isDarkMode ? '#ffffff' : '#e0e0e0' }
          ]}
          textStyle={{
            color: activeTab === 'unread' ? (isDarkMode ? '#000000' : colors.text) : colors.textSecondary,
            fontWeight: activeTab === 'unread' ? '600' : '400',
          }}
        >
          Chưa đọc
        </Chip>
        <Chip
          selected={activeTab === 'muted'}
          onPress={() => setActiveTab('muted')}
          style={[
            styles.chip,
            activeTab === 'muted' && { backgroundColor: isDarkMode ? '#ffffff' : '#e0e0e0' }
          ]}
          textStyle={{
            color: activeTab === 'muted' ? (isDarkMode ? '#000000' : colors.text) : colors.textSecondary,
            fontWeight: activeTab === 'muted' ? '600' : '400',
          }}
        >
          Tắt thông báo
        </Chip>
      </ScrollView>
    </View>
  );

  const renderStories = () => (
    <View style={[styles.storiesContainer, { backgroundColor: colors.background }]}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.storiesContent}
      >
        {/* Create Story Item */}
        <View style={styles.storyItem}>
          <TouchableOpacity
            style={styles.storyItemTouchable}
            onPress={() => {
              // TODO: Navigate to create story screen
              console.log('Create story');
            }}
            activeOpacity={0.7}
          >
            <View style={[
              styles.storyAvatarContainer,
              {
                borderColor: colors.border || '#E0E0E0',
                backgroundColor: colors.background || '#000000',
              }
            ]}>
              {user?.avatar_url ? (
                <Image
                  source={{ uri: getAvatarURL(user.avatar_url) }}
                  style={styles.storyAvatar}
                />
              ) : (
                <View style={[styles.storyAvatar, { backgroundColor: colors.primary || '#0084ff' }]}>
                  <Text style={styles.storyAvatarText}>
                    {getInitials(user?.full_name || user?.username || 'U')}
                  </Text>
                </View>
              )}
              {/* Plus icon button for sharing thoughts */}
              <TouchableOpacity
                style={[
                  styles.shareThoughtsButton,
                  {
                    backgroundColor: '#FFFFFF',
                    borderColor: colors.background || '#000000',
                  }
                ]}
                onPress={() => {
                  // Navigate to SelfDestructPost (write note) screen similar to ProfileScreen
                  (navigation as any).navigate('Profile', { screen: 'SelfDestructPost' });
                }}
                activeOpacity={0.7}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <MaterialCommunityIcons name="plus" size={16} color="#000000" />
              </TouchableOpacity>
            </View>
            <Text style={[styles.storyName, { color: colors.text }]} numberOfLines={1}>
              Tạo tin
            </Text>
          </TouchableOpacity>
        </View>

        {/* Online Friends Stories */}
        {onlineFriends.map((friend: any) => {
          const userId = friend.following_id || friend.id || friend.user_id;
          const userIdString = userId?.toString();
          const userName = friend.full_name || friend.username || 'Người dùng';
          const userAvatar = friend.avatar_url;
          // Check online status from onlineStatusMap or friend status
          const isOnline = userIdString 
            ? (onlineStatusMap[userIdString] !== undefined 
                ? onlineStatusMap[userIdString] 
                : friend.status === 'online')
            : false;
          
          // Kiểm tra xem có phải bot không
          const userNameLower = userName.toLowerCase();
          const isBot = userNameLower.includes('chat') 
            || userNameLower.includes('bot')
            || userNameLower.includes('hệ thống')
            || userNameLower.includes('system')
            || userNameLower.includes('zyea+');

          return (
            <TouchableOpacity
              key={userId}
              style={styles.storyItem}
              onPress={() => {
                if (userIdString) {
                  // Create conversation and navigate to chat
                  createConversationMutation.mutate(userIdString);
                }
              }}
              disabled={createConversationMutation.isPending}
              activeOpacity={0.7}
            >
              <View style={[
                styles.storyAvatarContainer,
                {
                  borderColor: (isOnline && !isBot) ? '#10b981' : (colors.border || '#E0E0E0'),
                  backgroundColor: colors.background || '#000000',
                }
              ]}>
                {userAvatar ? (
                  <Image
                    source={{ uri: getAvatarURL(userAvatar) }}
                    style={styles.storyAvatar}
                  />
                ) : (
                  <View style={[styles.storyAvatar, { backgroundColor: colors.primary || '#0084ff' }]}>
                    <Text style={styles.storyAvatarText}>
                      {getInitials(userName)}
                    </Text>
                  </View>
                )}
                {/* Only show green dot when online (like Facebook), hide when offline, bot, or activity status disabled */}
                {isOnline && !isBot && activityStatusEnabled && (
                  <View style={[
                    styles.onlineIndicator,
                    { borderColor: colors.background || '#000000' }
                  ]} />
                )}
              </View>
              <Text style={[styles.storyName, { color: colors.text }]} numberOfLines={1}>
                {userName}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );

  const renderEmptyState = () => {
    if (isLoading) {
      return (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary || '#0084ff'} />
          <Text variant="bodyLarge" style={{ color: colors.textSecondary, marginTop: 12 }}>
            Đang tải...
          </Text>
        </View>
      );
    }
    
    // Hiển thị empty state khi không có conversations (không phải do filter)
    // Kiểm tra cả conversations và filteredConversations để đảm bảo hiển thị đúng
    const hasNoConversations = !conversations || conversations.length === 0;
    const hasNoFilteredResults = !filteredConversations || filteredConversations.length === 0;
    
    if (hasNoConversations || (hasNoFilteredResults && !searchQuery.trim())) {
      return (
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
        </View>
      );
    }
    
    // Nếu có conversations nhưng filter không tìm thấy
    if (hasNoFilteredResults && searchQuery.trim()) {
      return (
        <View style={styles.center}>
          <Text variant="bodyLarge" style={{ color: colors.textSecondary }}>
            Không tìm thấy kết quả
          </Text>
        </View>
      );
    }
    
    return null;
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <Animated.View 
        style={[
          styles.container, 
          { 
            backgroundColor: colors.background,
            opacity: fadeAnim,
          }
        ]}
      >
        {renderHeader()}
        {conversations.length > 0 && renderStories()}
        <FlatList
          data={filteredConversations}
          keyExtractor={(item, index) => {
            // Always include index FIRST to ensure absolute uniqueness
            // This prevents duplicate key errors even if IDs are duplicated
            const id = item?.id || item?.conversation_id;
            if (id) {
              return `conv-${index}-${String(id)}`;
            }
            // Fallback: use index with user identifier
            const userIdentifier = item?.username || item?.full_name || 'unknown';
            return `conv-${index}-${String(userIdentifier).substring(0, 10)}`;
          }}
          // Performance optimizations - tối ưu để giảm delay và tăng smooth scrolling
          removeClippedSubviews={Platform.OS === 'android'}
          initialNumToRender={10}
          maxToRenderPerBatch={8}
          windowSize={5}
          updateCellsBatchingPeriod={100}
          maintainVisibleContentPosition={null}
          legacyImplementation={false}
          renderItem={({ item }) => {
            const conversationId = item.id || item.conversation_id;
            
            // Handle system notification item - treat it like a normal conversation
            if (item.is_system_notification) {
              return (
                <SwipeableConversationItem
                  conversation={{
                    id: conversationId,
                    username: 'system',
                    full_name: 'Thông báo hệ thống',
                    avatar_url: null, // Will use default system icon
                    last_message: item.last_message || item.lastMessage,
                    last_message_time: item.last_message_time || item.lastMessageTime || item.updated_at,
                    last_message_sender_id: null,
                    other_user_id: null,
                    last_seen: null,
                    lastSeen: null,
                    unread_count: item.unread_count || item.unreadCount || 0,
                    status: 'offline' as const,
                    pinned: item.pinned || item.is_pinned || false,
                    is_pinned: item.pinned || item.is_pinned || false,
                    is_muted: false,
                    type: 'system',
                    participants_count: 0,
                    is_system_notification: true,
                  }}
                  currentUserId={currentUserId}
                  isTyping={false}
                  onPress={() => {
                    // Navigate to SystemNotifications in Profile stack
                    try {
                      const parent = (navigation as any).getParent();
                      if (parent && isMountedRef.current) {
                        parent.navigate('Profile', {
                          screen: 'SystemNotifications'
                        });
                      }
                    } catch (error) {
                      console.error('Error navigating to SystemNotifications:', error);
                    }
                  }}
                  onMute={handleMute}
                  onDelete={async () => {
                    // Handle delete system notification (dismiss and hide)
                    if (!isMountedRef.current) return;
                    
                    if (item.system_notification_id) {
                      const notificationId = item.system_notification_id;
                      
                      // Mark as read
                      try {
                        await notificationsAPI.markSystemNotificationAsRead(notificationId.toString());
                      } catch (error) {
                        console.error('Error marking notification as read:', error);
                      }
                      
                      // Check mounted before state update
                      if (!isMountedRef.current) return;
                      
                      // Add to dismissed set
                      const newDismissed = new Set(dismissedSystemNotifications);
                      newDismissed.add(notificationId);
                      setDismissedSystemNotifications(newDismissed);
                      
                      // Save to AsyncStorage
                      try {
                        await AsyncStorage.setItem(
                          'dismissedSystemNotifications',
                          JSON.stringify(Array.from(newDismissed))
                        );
                      } catch (error) {
                        console.error('Error saving dismissed notifications:', error);
                      }
                      
                      // Invalidate queries to refresh list (only if mounted)
                      if (isMountedRef.current) {
                        queryClient.invalidateQueries({ queryKey: ['systemNotifications'] });
                      }
                    }
                  }}
                  onUnread={handleUnread}
                  onPin={handlePin}
                  formatMessageTime={formatMessageTime}
                  formatRecentTime={formatRecentTime}
                  onSwipeableWillOpen={() => handleSwipeableWillOpen(String(conversationId))}
                  onSwipeableClose={() => handleSwipeableClose(String(conversationId))}
                  ref={(ref) => {
                    if (ref) {
                      swipeableRefs.current[String(conversationId)] = ref;
                    } else {
                      delete swipeableRefs.current[String(conversationId)];
                    }
                  }}
                />
              );
            }
            const otherUserId = item?.other_user_id || item?.otherUserId;
            const userIdString = otherUserId?.toString();
            
            // Get real-time online status from onlineStatusMap, fallback to item.status
            // Support all status types: 'online', 'offline', 'recently_active', 'away'
            let onlineStatus = item.status || 'offline';
            if (userIdString && onlineStatusMap[userIdString] !== undefined) {
              onlineStatus = onlineStatusMap[userIdString] ? 'online' : 'offline';
            }
            
            // Determine if this is a group chat
            const isGroupChat = item.type === 'group' || item.conversation_type === 'group';
            
            // For group chats, use group name; for private chats, use user name
            const displayName = isGroupChat 
              ? (item.name || item.full_name || 'Nhóm chat')
              : (item.full_name || item.username || 'Người dùng');
            
            return (
              <SwipeableConversationItem
                conversation={{
                  id: conversationId,
                  username: item.username || '',
                  full_name: displayName,
                  avatar_url: item.avatar_url,
                  last_message: item.last_message || item.lastMessage,
                  last_message_time: item.last_message_time || item.lastMessageTime || item.updated_at,
                  last_message_sender_id: item.last_message_sender_id || item.lastMessageSenderId, // ID of sender of last message
                  other_user_id: otherUserId, // ID of the other user in conversation
                  last_seen: item.last_seen || item.lastSeen, // For "Hoạt động X trước" when offline
                  lastSeen: item.last_seen || item.lastSeen, // Alias for consistency
                  unread_count: item.unread_count || item.unreadCount || 0,
                  status: onlineStatus as 'online' | 'offline' | 'recently_active' | 'away',
                  pinned: item.pinned || item.is_pinned || false,
                  is_pinned: item.pinned || item.is_pinned || false, // Support both formats
                  is_muted: item.is_muted || item.isMuted,
                  type: item.type || item.conversation_type, // Add type for group chat identification
                  participants_count: item.participants_count || item.participantsCount, // Number of participants for group chat
                }}
                currentUserId={currentUserId}
                isTyping={typingMap[conversationId] || false}
                onPress={() => {
                  // Đóng swipeable nếu đang mở trước khi navigate
                  if (currentOpenSwipeable.current) {
                    const ref = swipeableRefs.current[currentOpenSwipeable.current];
                    if (ref) {
                      ref.close();
                    }
                    currentOpenSwipeable.current = null;
                  }
                  handleConversationPress(item);
                }}
                onMute={handleMute}
                onDelete={handleDelete}
                onUnread={handleUnread}
                onPin={handlePin}
                formatMessageTime={formatMessageTime}
                formatRecentTime={formatRecentTime}
                onSwipeableWillOpen={() => handleSwipeableWillOpen(String(conversationId))}
                onSwipeableClose={() => handleSwipeableClose(String(conversationId))}
                ref={(ref) => {
                  if (ref) {
                    swipeableRefs.current[String(conversationId)] = ref;
                  } else {
                    delete swipeableRefs.current[String(conversationId)];
                  }
                }}
              />
            );
          }}
            style={[
              styles.list, 
              { 
                backgroundColor: colors.background,
                flex: 1,
              }
            ]}
            onScrollBeginDrag={handleScrollBeginDrag}
            scrollEventThrottle={16}
            refreshControl={
              <RefreshControl
                refreshing={Boolean(isLoading)}
                onRefresh={refetch}
                tintColor={colors.textSecondary}
              />
            }
            contentContainerStyle={
              filteredConversations.length === 0 
                ? [styles.listContent, styles.emptyContent] 
                : styles.listContent
            }
            ListEmptyComponent={renderEmptyState}
          />
      </Animated.View>
      
      {/* Overlay hiệu ứng chuyển app (giống Facebook Messenger -> Facebook) */}
      {isNavigating && (
        <Animated.View
          style={[
            styles.transitionOverlay,
            {
              opacity: overlayOpacity,
              backgroundColor: isDarkMode ? '#000000' : '#ffffff',
            }
          ]}
          pointerEvents="none"
        >
          <ActivityIndicator 
            size="large" 
            color={isDarkMode ? '#ffffff' : '#0084ff'} 
          />
        </Animated.View>
      )}
      
      <AlertComponent />

      {/* New Message Modal - Select Recipient */}
      <Modal
        visible={showNewMessageModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => {
          setShowNewMessageModal(false);
          setModalSearchQuery('');
        }}
      >
        <View 
          style={[styles.modalOverlay, { backgroundColor: 'rgba(0, 0, 0, 0.5)' }]}
          pointerEvents="box-none"
        >
          <View
            style={StyleSheet.absoluteFill}
            pointerEvents="auto"
          >
            <TouchableOpacity
              style={StyleSheet.absoluteFill}
              activeOpacity={1}
              onPress={() => {
                setShowNewMessageModal(false);
                setModalSearchQuery('');
              }}
            />
          </View>
          <View
            style={[
              styles.modalContainer,
              { backgroundColor: colors.background }
            ]}
            pointerEvents="box-none"
          >
            <View
              style={{ flex: 1 }}
              onStartShouldSetResponder={() => true}
            >
            {/* Grab Handle */}
            <View style={styles.modalGrabHandleContainer}>
              <View style={[styles.modalGrabHandle, { backgroundColor: colors.textSecondary }]} />
            </View>
            
            {/* Header */}
            <View style={[
              styles.modalHeader,
              { borderBottomColor: colors.border || (isDarkMode ? '#2a2a2b' : '#E0E0E0') }
            ]}>
              <TouchableOpacity
                onPress={() => {
                  setShowNewMessageModal(false);
                  setModalSearchQuery('');
                }}
                style={styles.modalCloseButton}
              >
                <MaterialCommunityIcons
                  name="close"
                  size={24}
                  color={colors.text}
                />
              </TouchableOpacity>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                Tin nhắn mới
              </Text>
              <View style={{ width: 24 }} />
            </View>
            
            {/* Search bar */}
            <View style={styles.modalSearchContainer}>
              <Searchbar
                placeholder="Tìm kiếm"
                onChangeText={setModalSearchQuery}
                value={modalSearchQuery}
                style={[
                  styles.modalSearchbar,
                  { backgroundColor: isDarkMode ? '#2a2a2b' : '#f0f0f0' }
                ]}
                inputStyle={[styles.modalSearchInput, { color: colors.text }]}
                iconColor={colors.textSecondary}
                placeholderTextColor={colors.textSecondary}
                elevation={0}
                mode="bar"
              />
            </View>

            {/* Filter following list by search query */}
            <View style={{ flex: 1 }}>
            <FlatList
              data={filteredFollowingList || []}
              style={{ flex: 1, minHeight: 200 }}
              contentContainerStyle={{ 
                paddingBottom: 20,
                flexGrow: 1 
              }}
              showsVerticalScrollIndicator={true}
              ListHeaderComponent={
                <>
                  {/* Create Group Option */}
                  <TouchableOpacity
                    style={[
                      styles.modalCreateGroupOption,
                      { borderBottomColor: colors.border || '#E0E0E0' }
                    ]}
                    onPress={() => {
                      setShowNewMessageModal(false);
                      setModalSearchQuery('');
                      setShowCreateGroupModal(true);
                      setSelectedMembers([]);
                      setGroupSearchQuery('');
                    }}
                    activeOpacity={0.7}
                  >
                    <View style={styles.modalCreateGroupIcon}>
                      <MaterialCommunityIcons
                        name="account-group"
                        size={24}
                        color={colors.text}
                      />
                    </View>
                    <Text style={[styles.modalCreateGroupText, { color: colors.text }]}>
                      Tạo nhóm Chat
                    </Text>
                  </TouchableOpacity>

                  {/* Suggestions Header */}
                  {(filteredFollowingList || []).length > 0 && (
                    <View style={styles.modalSectionHeader}>
                      <Text style={[styles.modalSectionTitle, { color: colors.textSecondary }]}>
                        Gợi ý
                      </Text>
                    </View>
                  )}
                </>
              }
              keyExtractor={(item, index) => {
                const userId = item.following_id || item.id || item.user_id;
                return `new-msg-${index}-${userId || 'unknown'}`;
              }}
              renderItem={({ item }) => {
                const userId = item.following_id || item.id || item.user_id;
                const userIdString = userId?.toString();
                const userName = item.full_name || item.username || 'Người dùng';
                const userUsername = item.username || '';
                const userDepartment = item.department || '';
                const userAvatar = item.avatar_url;
                
                // Format user details: username | department
                const userDetails = [];
                if (userUsername) {
                  userDetails.push(userUsername);
                }
                if (userDepartment) {
                  userDetails.push(userDepartment);
                }
                const detailsText = userDetails.join(' | ');
                
                return (
                  <TouchableOpacity
                    style={[
                      styles.modalUserItem,
                      { borderBottomColor: colors.border || '#E0E0E0' }
                    ]}
                    onPress={() => {
                      if (userIdString) {
                        setShowNewMessageModal(false);
                        setModalSearchQuery('');
                        createConversationMutation.mutate(userIdString);
                      }
                    }}
                    disabled={createConversationMutation.isPending}
                    activeOpacity={0.7}
                  >
                    <View style={styles.modalUserAvatar}>
                      {userAvatar ? (
                        <Avatar.Image
                          size={50}
                          source={{ uri: getAvatarURL(userAvatar) }}
                        />
                      ) : (
                        <Avatar.Text
                          size={50}
                          label={getInitials(userName)}
                          style={{ backgroundColor: colors.primary || '#0084ff' }}
                        />
                      )}
                    </View>
                    <View style={styles.modalUserInfo}>
                      <Text style={[styles.modalUserName, { color: colors.text }]}>
                        {userName}
                      </Text>
                      {detailsText ? (
                        <Text style={[styles.modalUserDetails, { color: colors.textSecondary }]}>
                          {detailsText}
                        </Text>
                      ) : null}
                    </View>
                  </TouchableOpacity>
                );
              }}
              ListEmptyComponent={
                <View style={styles.modalEmptyContainer}>
                  <Text style={[styles.modalEmptyText, { color: colors.textSecondary }]}>
                    {modalSearchQuery.trim() 
                      ? 'Không tìm thấy kết quả' 
                      : (followingList.length === 0 
                          ? 'Đang tải danh sách bạn bè...' 
                          : 'Chưa có bạn bè nào')}
                  </Text>
                  {followingList.length === 0 && (
                    <ActivityIndicator 
                      size="small" 
                      color={colors.textSecondary} 
                      style={{ marginTop: 12 }}
                    />
                  )}
                </View>
              }
            />
            </View>
            </View>
          </View>
        </View>
      </Modal>

      {/* Create Group Modal */}
      <Modal
        visible={showCreateGroupModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => {
          setShowCreateGroupModal(false);
          setSelectedMembers([]);
          setGroupSearchQuery('');
          setIsAdvancedEncryption(false);
        }}
        statusBarTranslucent={true}
      >
        <View 
          style={[styles.modalOverlay, { backgroundColor: 'rgba(0, 0, 0, 0.5)' }]}
          pointerEvents="box-none"
        >
          <View
            style={StyleSheet.absoluteFill}
            pointerEvents="auto"
          >
            <TouchableOpacity
              style={StyleSheet.absoluteFill}
              activeOpacity={1}
              onPress={() => {
                setShowCreateGroupModal(false);
                setSelectedMembers([]);
                setGroupSearchQuery('');
                setIsAdvancedEncryption(false);
              }}
            />
          </View>
          <View
            style={[
              styles.modalContainer,
              { backgroundColor: colors.background }
            ]}
            pointerEvents="box-none"
          >
            <View
              style={{ flex: 1 }}
              onStartShouldSetResponder={() => true}
            >
              {/* Grab Handle */}
              <View style={styles.modalGrabHandleContainer}>
                <View style={[styles.modalGrabHandle, { backgroundColor: colors.textSecondary }]} />
              </View>
              
              {/* Header */}
              <View style={[
                styles.modalHeader,
                { borderBottomColor: colors.border || (isDarkMode ? '#2a2a2b' : '#E0E0E0') }
              ]}>
                <TouchableOpacity
                  onPress={() => {
                    setShowCreateGroupModal(false);
                    setSelectedMembers([]);
                    setGroupSearchQuery('');
                    setIsAdvancedEncryption(false);
                  }}
                  style={styles.modalCloseButton}
                >
                  <MaterialCommunityIcons
                    name="close"
                    size={24}
                    color={colors.text}
                  />
                </TouchableOpacity>
                <View style={{ flex: 1, alignItems: 'center' }}>
                  <Text style={[styles.modalTitle, { color: colors.text }]}>
                    Tạo nhóm Chat
                  </Text>
                  <Text style={[
                    styles.createGroupSubtitle, 
                    { 
                      color: colors.textSecondary,
                      fontSize: 12,
                      marginTop: 4
                    }
                  ]}>
                    Nhóm mã hoá nâng cao: {isAdvancedEncryption ? 'Bật' : 'Tắt'}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => setIsAdvancedEncryption(!isAdvancedEncryption)}
                  style={[
                    styles.createGroupToggleButton,
                    {
                      backgroundColor: isAdvancedEncryption 
                        ? (colors.primary || '#0084ff')
                        : (isDarkMode ? '#2a2a2b' : '#E0E0E0'),
                      borderRadius: 20,
                      paddingHorizontal: 10,
                      paddingVertical: 8,
                      minWidth: 44,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }
                  ]}
                >
                  <MaterialCommunityIcons
                    name={isAdvancedEncryption ? "lock" : "lock-open"}
                    size={20}
                    color={isAdvancedEncryption ? '#FFFFFF' : colors.textSecondary}
                  />
                </TouchableOpacity>
              </View>

              {/* Search bar */}
              <View style={styles.modalSearchContainer}>
                <Searchbar
                  placeholder="Tìm kiếm"
                  onChangeText={setGroupSearchQuery}
                  value={groupSearchQuery}
                  style={[
                    styles.modalSearchbar,
                    { 
                      backgroundColor: isDarkMode ? '#2a2a2b' : '#f5f5f5',
                      borderRadius: 10
                    }
                  ]}
                  inputStyle={[styles.modalSearchInput, { color: colors.text }]}
                  iconColor={colors.textSecondary}
                  placeholderTextColor={colors.textSecondary}
                  elevation={0}
                  mode="bar"
                />
              </View>

              {/* Members List */}
              <View style={{ flex: 1 }}>
                <FlatList
                  data={(Array.isArray(followingList) ? followingList : []).filter((item: any) => {
                    const userId = item.following_id || item.id || item.user_id;
                    if (String(userId) === String(currentUserId)) {
                      return false;
                    }
                    if (groupSearchQuery.trim()) {
                      const name = item.full_name || item.username || '';
                      const username = item.username || '';
                      const department = item.department || '';
                      const searchLower = groupSearchQuery.toLowerCase();
                      return (
                        name.toLowerCase().includes(searchLower) ||
                        username.toLowerCase().includes(searchLower) ||
                        department.toLowerCase().includes(searchLower)
                      );
                    }
                    return true;
                  })}
                  style={{ flex: 1, backgroundColor: colors.background }}
                  contentContainerStyle={{ 
                    paddingBottom: 20,
                    flexGrow: 1 
                  }}
                  showsVerticalScrollIndicator={true}
                  keyExtractor={(item, index) => {
                    const userId = item.following_id || item.id || item.user_id;
                    return `group-member-${index}-${userId || 'unknown'}`;
                  }}
                  renderItem={({ item }) => {
                    const userId = item.following_id || item.id || item.user_id;
                    const userIdString = String(userId);
                    const userName = item.full_name || item.username || 'Người dùng';
                    const userUsername = item.username || '';
                    const userDepartment = item.department || '';
                    const userAvatar = item.avatar_url;
                    const isSelected = selectedMembers.includes(userIdString);
                    
                    // Format user details: username | department
                    const userDetails = [];
                    if (userUsername) {
                      userDetails.push(userUsername);
                    }
                    if (userDepartment) {
                      userDetails.push(userDepartment);
                    }
                    const detailsText = userDetails.join(' | ');
                    
                    return (
                      <TouchableOpacity
                        style={[
                          styles.createGroupMemberItem,
                          { 
                            borderBottomColor: colors.border || (isDarkMode ? '#2a2a2b' : '#E0E0E0'),
                            backgroundColor: colors.background
                          }
                        ]}
                        onPress={() => {
                          if (isSelected) {
                            setSelectedMembers(prev => prev.filter(id => id !== userIdString));
                          } else {
                            setSelectedMembers(prev => [...prev, userIdString]);
                          }
                        }}
                        activeOpacity={0.7}
                      >
                        <View style={styles.createGroupMemberAvatar}>
                          {userAvatar ? (
                            <Avatar.Image
                              size={50}
                              source={{ uri: getAvatarURL(userAvatar) }}
                            />
                          ) : (
                            <Avatar.Text
                              size={50}
                              label={getInitials(userName)}
                              style={{ backgroundColor: colors.primary || '#0084ff' }}
                            />
                          )}
                        </View>
                        <View style={styles.createGroupMemberInfo}>
                          <Text style={[
                            styles.createGroupMemberName, 
                            { 
                              color: colors.text,
                              fontWeight: '600'
                            }
                          ]}>
                            {userName}
                          </Text>
                          {detailsText ? (
                            <Text style={[
                              styles.createGroupMemberDetails, 
                              { 
                                color: colors.textSecondary,
                                marginTop: 2
                              }
                            ]}>
                              {detailsText}
                            </Text>
                          ) : null}
                        </View>
                        <View style={[
                          styles.createGroupCheckbox,
                          {
                            backgroundColor: isSelected 
                              ? (colors.primary || '#0084ff')
                              : 'transparent',
                            borderColor: isSelected 
                              ? (colors.primary || '#0084ff')
                              : (isDarkMode ? '#666666' : '#999999'),
                            borderWidth: isSelected ? 0 : 2,
                          }
                        ]}>
                          {isSelected && (
                            <MaterialCommunityIcons
                              name="check"
                              size={20}
                              color="#FFFFFF"
                            />
                          )}
                        </View>
                      </TouchableOpacity>
                    );
                  }}
                  ListEmptyComponent={
                    <View style={styles.modalEmptyContainer}>
                      <Text style={[styles.modalEmptyText, { color: colors.textSecondary }]}>
                        {groupSearchQuery.trim() ? 'Không tìm thấy kết quả' : 'Chưa có bạn bè nào'}
                      </Text>
                    </View>
                  }
                />
              </View>

              {/* Continue Button */}
              <View style={[
                styles.createGroupFooter,
                { 
                  borderTopColor: colors.border || (isDarkMode ? '#2a2a2b' : '#E0E0E0'),
                  backgroundColor: colors.background
                }
              ]}>
                <TouchableOpacity
                  style={[
                    styles.createGroupContinueButton,
                    {
                      backgroundColor: selectedMembers.length >= 2 
                        ? (isDarkMode ? '#2a2a2b' : '#2a2a2b')
                        : (isDarkMode ? '#1a1a1b' : '#D0D0D0'),
                    }
                  ]}
                  onPress={() => {
                    // Validation: Must select at least 2 members (total 3 including creator)
                    if (selectedMembers.length < 2) {
                      Toast.show({
                        type: 'error',
                        text1: 'Vui lòng chọn ít nhất 2 thành viên',
                        text2: 'Nhóm chat phải có ít nhất 3 thành viên (bao gồm bạn)',
                      });
                      return;
                    }
                    
                    // Close create group modal and open set group name modal
                    setShowCreateGroupModal(false);
                    // Small delay to ensure smooth transition
                    setTimeout(() => {
                      setShowSetGroupNameModal(true);
                    }, 100);
                  }}
                  disabled={selectedMembers.length < 2 || createGroupConversationMutation.isPending}
                  activeOpacity={0.8}
                >
                  <Text style={[
                    styles.createGroupContinueButtonText,
                    { 
                      color: selectedMembers.length >= 2 
                        ? '#FFFFFF' 
                        : colors.textSecondary,
                      fontWeight: '600'
                    }
                  ]}>
                    {createGroupConversationMutation.isPending ? 'Đang tạo...' : 'Tiếp tục'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>

      {/* Set Group Name Modal */}
      <Modal
        visible={showSetGroupNameModal}
        animationType="slide"
        transparent={false}
        statusBarTranslucent={false}
        onRequestClose={() => {
          setShowSetGroupNameModal(false);
          setGroupName('');
          // Return to create group modal after a small delay
          setTimeout(() => {
            setShowCreateGroupModal(true);
          }, 100);
        }}
      >
        <SafeAreaView 
          style={[styles.createGroupContainer, { backgroundColor: colors.background }]} 
          edges={['top', 'bottom']}
        >
          {/* Header */}
          <View style={[
            styles.createGroupHeader,
            { 
              borderBottomColor: colors.border || (isDarkMode ? '#2a2a2b' : '#E0E0E0'),
              backgroundColor: colors.background,
            }
          ]}>
            <TouchableOpacity
              onPress={() => {
                setShowSetGroupNameModal(false);
                setGroupName('');
                // Return to create group modal after a small delay
                setTimeout(() => {
                  setShowCreateGroupModal(true);
                }, 100);
              }}
              style={styles.createGroupBackButton}
            >
              <MaterialCommunityIcons
                name="arrow-left"
                size={24}
                color={colors.text}
              />
            </TouchableOpacity>
            <View style={styles.createGroupHeaderCenter}>
              <Text style={[
                styles.createGroupTitle, 
                { 
                  color: colors.text,
                  fontWeight: '700'
                }
              ]}>
                Đặt tên nhóm
              </Text>
              <Text style={[
                styles.createGroupSubtitle, 
                { 
                  color: colors.textSecondary,
                  fontSize: 12
                }
              ]}>
                {selectedMembers.length} thành viên
              </Text>
            </View>
            <View style={{ width: 44 }} />
          </View>

          {/* Group Name Input */}
          <View style={[
            styles.setGroupNameContainer,
            { backgroundColor: colors.background }
          ]}>
            <Text style={[
              styles.setGroupNameLabel,
              { color: colors.text }
            ]}>
              Tên nhóm
            </Text>
            <TextInput
              style={[
                styles.setGroupNameInput,
                {
                  backgroundColor: isDarkMode ? '#2a2a2b' : '#f5f5f5',
                  color: colors.text,
                  borderColor: colors.border || (isDarkMode ? '#2a2a2b' : '#E0E0E0'),
                }
              ]}
              placeholder="Nhập tên nhóm"
              placeholderTextColor={colors.textSecondary}
              value={groupName}
              onChangeText={setGroupName}
              maxLength={50}
              autoFocus
            />
            <Text style={[
              styles.setGroupNameHint,
              { color: colors.textSecondary }
            ]}>
              {groupName.length}/50
            </Text>
          </View>

          {/* Selected Members List */}
          <View style={[
            styles.selectedMembersPreviewContainer,
            { 
              backgroundColor: colors.background,
              borderTopColor: colors.border || (isDarkMode ? '#2a2a2b' : '#E0E0E0'),
              borderBottomColor: colors.border || (isDarkMode ? '#2a2a2b' : '#E0E0E0'),
            }
          ]}>
            <Text style={[
              styles.selectedMembersPreviewTitle,
              { color: colors.text }
            ]}>
              Thành viên đã chọn ({selectedMembers.length})
            </Text>
            {selectedMembers.length > 0 ? (
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                style={styles.selectedMembersPreviewList}
                contentContainerStyle={{ paddingRight: 16 }}
              >
                {(Array.isArray(followingList) ? followingList : [])
                  .filter((item: any) => {
                    const userId = item.following_id || item.id || item.user_id;
                    return selectedMembers.includes(String(userId));
                  })
                  .map((item: any) => {
                    const userId = item.following_id || item.id || item.user_id;
                    const userName = item.full_name || item.username || 'Người dùng';
                    const userAvatar = item.avatar_url;
                    return (
                      <View key={userId} style={styles.selectedMemberPreview}>
                        {userAvatar ? (
                          <Avatar.Image
                            size={50}
                            source={{ uri: getAvatarURL(userAvatar) }}
                          />
                        ) : (
                          <Avatar.Text
                            size={50}
                            label={getInitials(userName)}
                            style={{ backgroundColor: colors.primary || '#0084ff' }}
                          />
                        )}
                        <Text 
                          style={[
                            styles.selectedMemberPreviewName,
                            { color: colors.text }
                          ]}
                          numberOfLines={1}
                        >
                          {userName}
                        </Text>
                      </View>
                    );
                  })}
              </ScrollView>
            ) : (
              <View style={styles.emptySelectedMembersContainer}>
                <Text style={[styles.emptySelectedMembersText, { color: colors.textSecondary }]}>
                  Chưa chọn thành viên nào
                </Text>
              </View>
            )}
          </View>

          {/* Create Button */}
          <View style={[
            styles.createGroupFooter,
            { 
              borderTopColor: colors.border || (isDarkMode ? '#2a2a2b' : '#E0E0E0'),
              backgroundColor: colors.background
            }
          ]}>
            <TouchableOpacity
              style={[
                styles.createGroupContinueButton,
                {
                  backgroundColor: groupName.trim().length > 0
                    ? (isDarkMode ? '#2a2a2b' : '#2a2a2b')
                    : (isDarkMode ? '#1a1a1b' : '#D0D0D0'),
                }
              ]}
              onPress={() => {
                // Validation: Group name is required
                if (groupName.trim().length === 0) {
                  Toast.show({
                    type: 'error',
                    text1: 'Vui lòng nhập tên nhóm',
                    text2: 'Tên nhóm là bắt buộc để tạo nhóm chat',
                  });
                  return;
                }

                // Validation: Must have at least 2 selected members (total 3 including creator)
                if (selectedMembers.length < 2) {
                  Toast.show({
                    type: 'error',
                    text1: 'Vui lòng chọn ít nhất 2 thành viên',
                    text2: 'Nhóm chat phải có ít nhất 3 thành viên (bao gồm bạn)',
                  });
                  return;
                }

                // Create group
                createGroupConversationMutation.mutate({
                  name: groupName.trim(),
                  participantIds: selectedMembers,
                });
              }}
              disabled={groupName.trim().length === 0 || selectedMembers.length < 2 || createGroupConversationMutation.isPending}
              activeOpacity={0.8}
            >
              <Text style={[
                styles.createGroupContinueButtonText,
                { 
                  color: groupName.trim().length > 0 
                    ? '#FFFFFF' 
                    : colors.textSecondary,
                  fontWeight: '600'
                }
              ]}>
                {createGroupConversationMutation.isPending ? 'Đang tạo...' : 'Tạo nhóm'}
              </Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>

      {/* Filter Modal - Bottom Sheet */}
      <Modal
        visible={showFilterModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowFilterModal(false)}
        statusBarTranslucent={true}
      >
        <View 
          style={[styles.modalOverlay, { backgroundColor: 'rgba(0, 0, 0, 0.5)' }]}
          pointerEvents="box-none"
        >
          <View
            style={StyleSheet.absoluteFill}
            pointerEvents="auto"
          >
            <TouchableOpacity
              style={StyleSheet.absoluteFill}
              activeOpacity={1}
              onPress={() => setShowFilterModal(false)}
            />
          </View>
          <View
            pointerEvents="box-none"
            style={{ flex: 0 }}
          >
            <SafeAreaView
              edges={['bottom']}
              style={[
                styles.filterModalContainer,
                {
                  backgroundColor: colors.background,
                  borderTopLeftRadius: 20,
                  borderTopRightRadius: 20,
                }
              ]}
            >
            {/* Handle */}
            <View style={[styles.modalHandle, { backgroundColor: isDarkMode ? '#3a3a3b' : '#d0d0d0' }]} />
            
            {/* Header */}
            <View style={[styles.filterModalHeader, { borderBottomColor: colors.border || (isDarkMode ? '#2a2a2b' : '#E0E0E0') }]}>
              <TouchableOpacity
                onPress={() => setShowFilterModal(false)}
                style={styles.filterModalCloseButton}
              >
                <Text style={[styles.filterModalCloseText, { color: colors.text }]}>Đóng</Text>
              </TouchableOpacity>
              <Text style={[styles.filterModalTitle, { color: colors.text }]}>Thư mục tin nhắn</Text>
              <TouchableOpacity
                style={styles.filterModalSettingsButton}
                onPress={() => {
                  // TODO: Handle settings
                  console.log('Settings clicked');
                }}
              >
                <MaterialCommunityIcons name="cog" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            {/* Options */}
            <View style={styles.filterModalOptions}>
              <TouchableOpacity
                style={[
                  styles.filterModalOption,
                  {
                    backgroundColor: activeTab === 'inbox' 
                      ? (isDarkMode ? '#2a2a2b' : '#f0f0f0')
                      : 'transparent'
                  }
                ]}
                onPress={() => {
                  setActiveTab('inbox');
                  setShowFilterModal(false);
                }}
              >
                <Text style={[
                  styles.filterModalOptionText,
                  {
                    color: activeTab === 'inbox' ? colors.text : colors.textSecondary,
                    fontWeight: activeTab === 'inbox' ? '600' : '400',
                  }
                ]}>
                  Tất cả
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.filterModalOption,
                  {
                    backgroundColor: activeTab === 'unread' 
                      ? (isDarkMode ? '#2a2a2b' : '#f0f0f0')
                      : 'transparent'
                  }
                ]}
                onPress={() => {
                  setActiveTab('unread');
                  setShowFilterModal(false);
                }}
              >
                <Text style={[
                  styles.filterModalOptionText,
                  {
                    color: activeTab === 'unread' ? colors.text : colors.textSecondary,
                    fontWeight: activeTab === 'unread' ? '600' : '400',
                  }
                ]}>
                  Chưa đọc
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.filterModalOption,
                  {
                    backgroundColor: activeTab === 'muted' 
                      ? (isDarkMode ? '#2a2a2b' : '#f0f0f0')
                      : 'transparent'
                  }
                ]}
                onPress={() => {
                  setActiveTab('muted');
                  setShowFilterModal(false);
                }}
              >
                <Text style={[
                  styles.filterModalOptionText,
                  {
                    color: activeTab === 'muted' ? colors.text : colors.textSecondary,
                    fontWeight: activeTab === 'muted' ? '600' : '400',
                  }
                ]}>
                  Tắt thông báo
                </Text>
              </TouchableOpacity>
            </View>
          </SafeAreaView>
          </View>
        </View>
      </Modal>

      {/* Splash Screen Modal - Hiển thị khi navigate đến NewsFeed */}
      {showSplashScreen && (
        <Modal
          visible={showSplashScreen}
          transparent={true}
          animationType="none"
          statusBarTranslucent={true}
        >
          <Animated.View
            style={{
              flex: 1,
              opacity: splashOpacity,
            }}
          >
            <SplashScreen />
          </Animated.View>
        </Modal>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  list: {
    flex: 1,
  },
  headerContainer: {
    backgroundColor: 'transparent',
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
    paddingHorizontal: spacing.base,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.base + 2,
  },
  headerTitle: {
    fontSize: typography.fontSize.xxxl,
    fontWeight: typography.fontWeight.bold,
  },
  headerAvatarWrapper: {
    position: 'relative',
  },
  headerAvatar: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.full / 2,
    backgroundColor: '#0084ff',
  },
  headerOnlineIndicator: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 15,
    height: 15,
    borderRadius: borderRadius.full / 2 - 0.5,
    backgroundColor: '#10b981',
    borderWidth: 2,
  },
  headerIcons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerIconButton: {
    marginLeft: spacing.md,
    padding: spacing.xs,
  },
  headerIconButtonCircle: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.full / 2,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 0,
  },
  chatBubbleIconContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    width: 26,
    height: 26,
  },
  chatBubbleIcon: {
    opacity: 1,
  },
  chatBubblePlusCenter: {
    position: 'absolute',
    top: 2,
    left: 0,
    right: 0,
    bottom: 4,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  searchContainer: {
    paddingHorizontal: spacing.sm,
    paddingTop: 0,
    paddingBottom: spacing.xs,
  },
  searchbar: {
    borderRadius: borderRadius.base + 2,
    elevation: 0,
    height: 50,
    paddingVertical: 0,
  },
  searchInput: {
    fontSize: typography.fontSize.base,
    lineHeight: typography.fontSize.base * typography.lineHeight.normal,
    paddingVertical: 0,
    marginVertical: 0,
    minHeight: 18,
  },
  chipsScrollView: {
    maxHeight: 50,
  },
  chipsRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.sm,
    paddingBottom: spacing.xs,
    gap: spacing.sm,
    alignItems: 'center',
  },
  filterIconButton: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.full / 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.xs,
  },
  chip: {
    backgroundColor: 'transparent',
  },
  listContent: {
    paddingBottom: 0,
  },
  emptyContent: {
    flexGrow: 1,
    justifyContent: 'center',
    minHeight: 400,
  },
  rowContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 14,
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
  statusIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    // borderColor and backgroundColor will be set dynamically based on status in render
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
  rowTimestamp: {
    fontSize: 13,
    fontWeight: '400',
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
    backgroundColor: '#10b981', // Green background like image
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    minWidth: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    // borderColor will be set dynamically
  },
  timeBadgeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '600',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingVertical: 60,
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
  storiesContainer: {
    paddingTop: 0,
    paddingBottom: 8,
    paddingLeft: 16,
    marginTop: -4,
  },
  storiesContent: {
    paddingRight: 16,
    gap: 12,
  },
  storyItem: {
    alignItems: 'center',
    width: 64,
    position: 'relative',
  },
  storyItemTouchable: {
    alignItems: 'center',
    width: 64,
  },
  storyAvatarContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2,
    marginBottom: 6,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  shareThoughtsButton: {
    position: 'absolute',
    top: '50%',
    right: -12,
    marginTop: -12,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 10,
    zIndex: 100,
  },
  storyAvatar: {
    width: 58,
    height: 58,
    borderRadius: 29,
  },
  storyAvatarText: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '600',
  },
  createStoryBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 5,
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#10b981',
    borderWidth: 2,
  },
  storyName: {
    fontSize: 12,
    fontWeight: '400',
    textAlign: 'center',
    maxWidth: 64,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
    height: '90%',
    paddingBottom: 0,
    width: '100%',
  },
  modalGrabHandleContainer: {
    paddingTop: 12,
    paddingBottom: 8,
    alignItems: 'center',
  },
  modalGrabHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    opacity: 0.3,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    flex: 1,
    textAlign: 'center',
  },
  modalSearchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  modalSearchbar: {
    borderRadius: 10,
    elevation: 0,
    height: 50,
    paddingVertical: 0,
  },
  modalSearchInput: {
    fontSize: 14,
    lineHeight: 18,
    paddingVertical: 0,
    marginVertical: 0,
    minHeight: 18,
  },
  modalCreateGroupOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  modalCreateGroupIcon: {
    marginRight: 12,
  },
  modalCreateGroupText: {
    fontSize: 16,
    fontWeight: '500',
  },
  modalSectionHeader: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  modalSectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  modalCloseButton: {
    padding: 4,
  },
  modalUserItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  modalUserAvatar: {
    marginRight: 12,
    position: 'relative',
  },
  modalOnlineIndicator: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#10b981',
    borderWidth: 2,
  },
  modalUserInfo: {
    flex: 1,
  },
  modalUserName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  modalUserStatus: {
    fontSize: 13,
  },
  modalUserDetails: {
    fontSize: 13,
    marginTop: 2,
  },
  modalCreateButton: {
    padding: 4,
    minWidth: 50,
    alignItems: 'flex-end',
  },
  modalCreateButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  modalGroupNameContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  modalGroupNameLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  modalGroupNameInput: {
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  modalGroupNameTextInput: {
    fontSize: 16,
    minHeight: 40,
  },
  modalSelectedMembersContainer: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  modalSelectedMember: {
    marginRight: 12,
    position: 'relative',
  },
  modalRemoveMemberButton: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
  },
  modalEmptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  modalEmptyText: {
    fontSize: 16,
  },
  transitionOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
  },
  // Create Group Modal styles
  createGroupContainer: {
    flex: 1,
  },
  createGroupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 0,
    paddingBottom: 14,
    borderBottomWidth: 1,
    minHeight: 56,
  },
  createGroupBackButton: {
    padding: 8,
    marginRight: 8,
    borderRadius: 20,
  },
  createGroupHeaderCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  createGroupTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  createGroupSubtitle: {
    fontSize: 12,
    fontWeight: '400',
  },
  createGroupToggleButton: {
    padding: 8,
    marginLeft: 8,
    minWidth: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  createGroupSearchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  createGroupMemberItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    minHeight: 70,
  },
  createGroupMemberAvatar: {
    marginRight: 12,
  },
  createGroupMemberInfo: {
    flex: 1,
  },
  createGroupMemberName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  createGroupMemberDetails: {
    fontSize: 13,
  },
  createGroupCheckbox: {
    width: 26,
    height: 26,
    borderRadius: 6,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  createGroupFooter: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderTopWidth: 1,
    backgroundColor: 'transparent',
  },
  createGroupContinueButton: {
    borderRadius: 10,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 50,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  createGroupContinueButtonText: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  // Set Group Name Modal styles
  setGroupNameContainer: {
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  setGroupNameLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  setGroupNameInput: {
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    minHeight: 50,
  },
  conversationItem: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e5e7eb',
  },
  conversationContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  conversationInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  conversationName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  lastMessageText: {
    fontSize: 14,
  },
  unreadBadge: {
    backgroundColor: '#ef4444',
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  unreadBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  setGroupNameHint: {
    fontSize: 12,
    marginTop: 8,
    textAlign: 'right',
  },
  selectedMembersPreviewContainer: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderBottomWidth: 1,
  },
  selectedMembersPreviewTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
  },
  selectedMembersPreviewList: {
    flexDirection: 'row',
  },
  selectedMemberPreview: {
    alignItems: 'center',
    marginRight: 16,
    width: 70,
  },
  selectedMemberPreviewName: {
    fontSize: 12,
    marginTop: 6,
    textAlign: 'center',
  },
  emptySelectedMembersContainer: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  emptySelectedMembersText: {
    fontSize: 14,
  },
  filterModalContainer: {
    paddingBottom: 8,
  },
  modalHandle: {
    width: 36,
    height: 3,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 8,
    marginBottom: 16,
  },
  filterModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  filterModalCloseButton: {
    paddingVertical: 4,
  },
  filterModalCloseText: {
    fontSize: 16,
  },
  filterModalTitle: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
  },
  filterModalSettingsButton: {
    padding: 4,
  },
  filterModalOptions: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  filterModalOption: {
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  filterModalOptionText: {
    fontSize: 16,
  },
});

export default ChatListScreen;
