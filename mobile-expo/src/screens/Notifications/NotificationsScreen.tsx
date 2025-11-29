import React, { useMemo, useState, useRef, useCallback } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  Image,
} from 'react-native';
import { Text, FAB, IconButton } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { notificationsAPI } from '../../utils/api';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme as useAppTheme } from '../../contexts/ThemeContext';
import { getAvatarURL, getImageURL } from '../../utils/imageUtils';
import { useNavigation, useFocusEffect } from '@react-navigation/native';

// Helper function để lấy icon và màu cho reaction
const getReactionIcon = (reactionType: string | null | undefined) => {
  const type = reactionType || 'like';
  const reactionMap: { [key: string]: { icon: string; color: string } } = {
    like: { icon: 'thumb-up', color: '#1877F2' },
    love: { icon: 'heart', color: '#F62D5A' },
    care: { icon: 'emoticon-kiss', color: '#FFD700' },
    haha: { icon: 'emoticon-lol', color: '#FFD700' },
    wow: { icon: 'emoticon-excited', color: '#FFD700' },
    sad: { icon: 'emoticon-sad', color: '#FFD700' },
    angry: { icon: 'emoticon-angry', color: '#E74C3C' },
  };
  return reactionMap[type] || { icon: 'thumb-up', color: '#1877F2' };
};

// Helper function để format thời gian
const formatTimeAgo = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (diffInSeconds < 60) return 'Vừa xong';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} phút`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} giờ`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} ngày`;
  return date.toLocaleDateString('vi-VN');
};

const NotificationsScreen = () => {
  const { colors, isDarkMode } = useAppTheme();
  const navigation = useNavigation();
  const queryClient = useQueryClient();
  const styles = useMemo(() => createStyles(colors, isDarkMode), [colors, isDarkMode]);
  
  // Tab state: 'all' | 'mentions'
  const [activeTab, setActiveTab] = useState<'all' | 'mentions'>('all');
  const [isScrolledDown, setIsScrolledDown] = useState(false);
  const [hasNew, setHasNew] = useState(false);
  const scrollViewRef = useRef<FlatList>(null);

  const {
    data: notifications = [],
    isLoading,
    refetch,
    error,
  } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      try {
        const response = await notificationsAPI.getNotifications();
        console.log('📬 [Notifications] API Response:', {
          hasData: !!response.data,
          dataType: typeof response.data,
          isArray: Array.isArray(response.data),
          length: response.data?.length || 0,
          fullResponse: response,
        });
        
        // Xử lý nhiều format response có thể có
        let notificationsData = [];
        if (Array.isArray(response.data)) {
          notificationsData = response.data;
        } else if (Array.isArray(response)) {
          notificationsData = response;
        } else if (response?.data && Array.isArray(response.data)) {
          notificationsData = response.data;
        } else {
          console.warn('📬 [Notifications] Unexpected response format:', response);
          notificationsData = [];
        }
        
        console.log('📬 [Notifications] Processed notifications:', notificationsData.length);
        if (notificationsData.length > 0) {
          console.log('📬 [Notifications] First notification:', notificationsData[0]);
        }
        
        return notificationsData;
      } catch (err) {
        console.error('❌ [Notifications] Error fetching notifications:', err);
        throw err;
      }
    },
    staleTime: 60 * 1000, // 1 phút - socket sẽ update real-time nên không cần refetch liên tục
    gcTime: 10 * 60 * 1000, // 10 phút cache
    refetchInterval: false, // No polling - use socket for real-time updates
    refetchOnWindowFocus: false, // Don't refetch on focus (reduces unnecessary requests)
  });

  // Mutation để mark notification as read
  const markAsReadMutation = useMutation({
    mutationFn: (notificationId: string | number) => 
      notificationsAPI.markAsRead(notificationId),
    onSuccess: () => {
      // Invalidate queries để cập nhật UI
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications', 'unread-count'] });
      checkUnread();
    },
  });

  // Log notifications khi data thay đổi
  React.useEffect(() => {
    console.log('📬 [Notifications] Data changed:', {
      isArray: Array.isArray(notifications),
      length: notifications?.length || 0,
      isLoading,
      error: error?.message,
    });
    
    if (notifications && Array.isArray(notifications) && notifications.length > 0) {
      console.log('📬 [Notifications] Current notifications count:', notifications.length);
      notifications.forEach((notif: any, index: number) => {
        console.log(`📬 [Notifications] ${index + 1}. ID: ${notif.id}, Type: ${notif.type}, From: ${notif.full_name || notif.username}, Message: ${notif.message}, Read: ${notif.read}`);
      });
    } else {
      console.log('📬 [Notifications] No notifications found or not an array');
      if (notifications && !Array.isArray(notifications)) {
        console.warn('📬 [Notifications] Data is not an array:', typeof notifications, notifications);
      }
    }
  }, [notifications, isLoading, error]);

  // Check unread notifications khi focus (giống social-app-main)
  const checkUnread = useCallback(async () => {
    try {
      const response = await notificationsAPI.getUnreadCount();
      const unreadCount = response.data?.count || 0;
      setHasNew(unreadCount > 0);
      return unreadCount;
    } catch (error) {
      console.error('Error checking unread:', error);
      return 0;
    }
  }, []);

  // Invalidate notifications khi vào màn hình để cập nhật ngay lập tức
  useFocusEffect(
    React.useCallback(() => {
      console.log('📬 [Notifications] Screen focused - invalidating queries');
      queryClient.invalidateQueries({ queryKey: ['notifications', 'unread-count'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      checkUnread();
    }, [queryClient, checkUnread])
  );

  // Filter notifications based on active tab
  const filteredNotifications = useMemo(() => {
    if (activeTab === 'all') {
      return notifications;
    } else {
      // Filter mentions (comments, replies, etc.)
      return notifications.filter((notif: any) => 
        notif.type === 'comment' || notif.type === 'mention'
      );
    }
  }, [notifications, activeTab]);

  // Handle scroll to detect if scrolled down
  const handleScroll = useCallback((event: any) => {
    const offsetY = event.nativeEvent.contentOffset.y;
    setIsScrolledDown(offsetY > 200);
  }, []);

  // Handle load latest (scroll to top and refresh)
  const handleLoadLatest = useCallback(() => {
    scrollViewRef.current?.scrollToOffset({ offset: 0, animated: true });
    refetch();
    checkUnread();
  }, [refetch, checkUnread]);

  const renderNotification = ({ item }: { item: any }) => {
    if (!item || !item.id) {
      console.warn('📬 [Notifications] Invalid notification item:', item);
      return null;
    }
    
    const isRead = item.read === true || item.read === 1;
    const reactionInfo = item.type === 'like' && item.reaction_type 
      ? getReactionIcon(item.reaction_type)
      : null;

    // Xác định icon và text dựa trên type
    let notificationIcon = null;
    let notificationText = item.message || '';
    
    if (item.type === 'like' && reactionInfo) {
      notificationIcon = (
        <View style={[styles.reactionIconContainer, { backgroundColor: reactionInfo.color + '20' }]}>
          <MaterialCommunityIcons 
            name={reactionInfo.icon as any} 
            size={20} 
            color={reactionInfo.color} 
          />
        </View>
      );
    } else if (item.type === 'comment') {
      notificationIcon = (
        <View style={[styles.iconContainer, { backgroundColor: colors.primary + '20' }]}>
          <MaterialCommunityIcons name="comment-outline" size={20} color={colors.primary} />
        </View>
      );
    } else if (item.type === 'share') {
      notificationIcon = (
        <View style={[styles.iconContainer, { backgroundColor: colors.primary + '20' }]}>
          <MaterialCommunityIcons name="share-outline" size={20} color={colors.primary} />
        </View>
      );
    } else if (item.type === 'friend_request') {
      notificationIcon = (
        <View style={[styles.iconContainer, { backgroundColor: colors.primary + '20' }]}>
          <MaterialCommunityIcons name="account-plus-outline" size={20} color={colors.primary} />
        </View>
      );
    } else if (item.type === 'friend_accepted') {
      notificationIcon = (
        <View style={[styles.iconContainer, { backgroundColor: colors.primary + '20' }]}>
          <MaterialCommunityIcons name="account-check-outline" size={20} color={colors.primary} />
        </View>
      );
    } else if (item.type === 'follow') {
      notificationIcon = (
        <View style={[styles.iconContainer, { backgroundColor: colors.primary + '20' }]}>
          <MaterialCommunityIcons name="account-plus-outline" size={20} color={colors.primary} />
        </View>
      );
    }

    return (
      <TouchableOpacity
        style={[
          styles.notificationItem, 
          !isRead && styles.unreadNotification,
          !isRead && { paddingLeft: 13 } // Điều chỉnh padding khi có border left
        ]}
        activeOpacity={0.7}
        onPress={() => {
          // Mark as read nếu chưa đọc
          if (!isRead && item.id) {
            markAsReadMutation.mutate(item.id);
          }

          // Navigate to post or profile based on type
          if (item.type === 'like' || item.type === 'comment' || item.type === 'share') {
            // Navigate to post comments screen
            if (item.post_id) {
              try {
                // Navigate đến NewsFeed tab, sau đó đến Comments screen trong FeedStack
                const rootNavigation = navigation.getParent()?.getParent()?.getParent();
                if (rootNavigation) {
                  rootNavigation.navigate('NewsFeed', {
                    screen: 'Comments',
                    params: { postId: item.post_id },
                  });
                } else {
                  // Fallback: navigate trực tiếp đến Comments
                  (navigation as any).navigate('Comments', { postId: item.post_id });
                }
              } catch (navError) {
                console.error('❌ [Notifications] Navigation error:', navError);
                // Fallback: navigate trực tiếp
                (navigation as any).navigate('Comments', { postId: item.post_id });
              }
            }
          } else if (item.type === 'friend_request' || item.type === 'friend_accepted' || item.type === 'follow') {
            // Navigate to profile
            if (item.from_user_id) {
              try {
                const rootNavigation = navigation.getParent()?.getParent()?.getParent();
                if (rootNavigation) {
                  rootNavigation.navigate('NewsFeed', {
                    screen: 'OtherUserProfile',
                    params: { userId: item.from_user_id },
                  });
                } else {
                  (navigation as any).navigate('OtherUserProfile', { userId: item.from_user_id });
                }
              } catch (navError) {
                console.error('❌ [Notifications] Navigation error:', navError);
                (navigation as any).navigate('OtherUserProfile', { userId: item.from_user_id });
              }
            }
          }
        }}
      >
        <View style={styles.notificationContent}>
          {/* Avatar */}
          <Image
            source={{ uri: getAvatarURL(item.avatar_url) }}
            style={styles.avatar}
          />
          
          {/* Reaction/Icon */}
          {notificationIcon && (
            <View style={styles.reactionWrapper}>
              {notificationIcon}
            </View>
          )}
        </View>

        <View style={styles.notificationTextContainer}>
          <Text style={styles.notificationText} numberOfLines={2}>
            <Text style={styles.userName}>{item.full_name || item.username || 'Người dùng'}</Text>
            {' '}
            {notificationText}
          </Text>
          <Text style={styles.notificationTime}>
            {formatTimeAgo(item.created_at)}
          </Text>
        </View>

        {/* Post thumbnail nếu có */}
        {(() => {
          let imageUrl = null;
          if (item.post_image_url) {
            try {
              // Thử parse JSON nếu là array
              const parsed = JSON.parse(item.post_image_url);
              if (Array.isArray(parsed) && parsed.length > 0) {
                // Lấy ảnh đầu tiên
                imageUrl = parsed[0];
              } else if (typeof parsed === 'string') {
                imageUrl = parsed;
              } else {
                imageUrl = item.post_image_url;
              }
            } catch (e) {
              // Nếu không phải JSON, dùng trực tiếp
              imageUrl = item.post_image_url;
            }
            
            // Convert path thành full URL nếu cần
            if (imageUrl) {
              imageUrl = getImageURL(imageUrl);
            }
          }
          
          return imageUrl ? (
            <Image
              source={{ uri: imageUrl }}
              style={styles.postThumbnail}
              resizeMode="cover"
            />
          ) : null;
        })()}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header với Settings button (giống social-app-main) */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text variant="headlineSmall" style={styles.title}>
            Thông báo
          </Text>
        </View>
        <View style={styles.headerRight}>
          <IconButton
            icon="cog-outline"
            size={24}
            iconColor={colors.text}
            onPress={() => {
              try {
                const rootNavigation = navigation.getParent()?.getParent()?.getParent();
                if (rootNavigation) {
                  rootNavigation.navigate('NewsFeed', {
                    screen: 'SystemNotifications',
                  });
                } else {
                  (navigation as any).navigate('SystemNotifications');
                }
              } catch (error) {
                console.error('Navigation error:', error);
              }
            }}
            accessibilityLabel="Cài đặt thông báo"
          />
        </View>
      </View>

      {/* Tab Bar (giống social-app-main) */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={styles.tab}
          onPress={() => setActiveTab('all')}
          activeOpacity={0.7}
        >
          <Text style={[
            styles.tabText, 
            activeTab === 'all' && styles.activeTabText
          ]}>
            Tất cả
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.tab}
          onPress={() => setActiveTab('mentions')}
          activeOpacity={0.7}
        >
          <Text style={[
            styles.tabText, 
            activeTab === 'mentions' && styles.activeTabText
          ]}>
            Đề cập
          </Text>
        </TouchableOpacity>
      </View>

      <FlatList
        ref={scrollViewRef}
        data={Array.isArray(filteredNotifications) ? filteredNotifications : []}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        keyExtractor={(item, index) => {
          if (item && item.id) {
            return item.id.toString();
          }
          console.warn('📬 [Notifications] Item without id at index:', index, item);
          return `notification-${index}-${Date.now()}`;
        }}
        renderItem={renderNotification}
        ListHeaderComponent={null} // Không hiển thị header count (giống social-app-main)
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons 
              name="bell-outline" 
              size={64} 
              color={colors.textSecondary} 
              style={styles.emptyIcon}
            />
            <Text style={styles.emptyText}>
              {error ? 'Lỗi khi tải thông báo' : 'Chưa có thông báo nào'}
            </Text>
            {error && (
              <Text style={[styles.emptyText, { fontSize: 12, marginTop: 8 }]}>
                {error.message || 'Vui lòng thử lại'}
              </Text>
            )}
          </View>
        }
        refreshControl={
          <RefreshControl 
            refreshing={isLoading} 
            onRefresh={refetch}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
        contentContainerStyle={styles.listContent}
      />

      {/* Load Latest Button (giống social-app-main - nút tròn nhỏ với icon arrow) */}
      {(isScrolledDown || hasNew) && (
        <TouchableOpacity
          style={[
            styles.loadLatestButton,
            hasNew && styles.loadLatestButtonWithIndicator,
            { backgroundColor: hasNew ? (colors.primary + '20' || 'rgba(24, 119, 242, 0.1)') : colors.surface }
          ]}
          onPress={handleLoadLatest}
          activeOpacity={0.7}
          accessibilityLabel={hasNew ? 'Tải thông báo mới' : 'Lên đầu trang'}
        >
          <MaterialCommunityIcons 
            name="arrow-up" 
            size={20} 
            color={hasNew ? (colors.primary || '#1877F2') : colors.textSecondary} 
          />
        </TouchableOpacity>
      )}

      {/* FAB để compose post (giống social-app-main) */}
      <FAB
        icon="pencil"
        style={styles.fab}
        onPress={() => {
          try {
            const rootNavigation = navigation.getParent()?.getParent()?.getParent();
            if (rootNavigation) {
              rootNavigation.navigate('NewsFeed', {
                screen: 'CreatePost',
              });
            } else {
              (navigation as any).navigate('CreatePost');
            }
          } catch (error) {
            console.error('Navigation error:', error);
          }
        }}
        color="#FFFFFF"
        accessibilityLabel="Tạo bài viết mới"
      />
    </SafeAreaView>
  );
};

const createStyles = (colors: any, isDarkMode: boolean) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background || (isDarkMode ? '#18191A' : '#F0F2F5'),
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border || (isDarkMode ? '#3A3B3C' : '#E4E6EB'),
    backgroundColor: colors.surface || (isDarkMode ? '#242526' : '#FFFFFF'),
    minHeight: 56, // Giống social-app-main header height
  },
  headerContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerRight: {
    width: 48,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  title: {
    fontWeight: '700',
    fontSize: 20, // Giống social-app-main (headlineSmall)
    color: colors.text || (isDarkMode ? '#E4E6EB' : '#050505'),
    textAlign: 'center',
  },
  listContent: {
    padding: 0, // Không có padding (giống social-app-main - padding trong item)
  },
  notificationItem: {
    flexDirection: 'row',
    padding: 16, // Giống social-app-main (padding lớn hơn)
    backgroundColor: colors.surface || (isDarkMode ? '#242526' : '#FFFFFF'),
    borderBottomWidth: StyleSheet.hairlineWidth, // Giống social-app-main (có border bottom)
    borderBottomColor: colors.border || (isDarkMode ? '#3A3B3C' : '#E4E6EB'),
    alignItems: 'center',
  },
  unreadNotification: {
    backgroundColor: isDarkMode ? '#2C2D2E' : '#E7F3FF', // Giống social-app-main unreadNotifBg
    borderLeftWidth: 3, // Giống social-app-main (có border left để highlight)
    borderLeftColor: colors.primary || '#1877F2',
  },
  notificationContent: {
    position: 'relative',
    marginRight: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.border,
  },
  reactionWrapper: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.surface || (isDarkMode ? '#242526' : '#FFFFFF'),
  },
  reactionIconContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationTextContainer: {
    flex: 1,
    marginRight: 8,
  },
  notificationText: {
    fontSize: 15,
    color: colors.text || (isDarkMode ? '#E4E6EB' : '#050505'),
    lineHeight: 20,
    marginBottom: 4,
  },
  userName: {
    fontWeight: '600',
    color: colors.text || (isDarkMode ? '#E4E6EB' : '#050505'),
  },
  notificationTime: {
    fontSize: 13,
    color: colors.textSecondary || (isDarkMode ? '#B0B3B8' : '#65676B'),
  },
  postThumbnail: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: colors.border,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    minHeight: 400,
  },
  emptyIcon: {
    marginBottom: 16,
    opacity: 0.5,
  },
  emptyText: {
    fontSize: 16,
    color: colors.textSecondary || (isDarkMode ? '#B0B3B8' : '#65676B'),
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: colors.surface || (isDarkMode ? '#242526' : '#FFFFFF'),
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border || (isDarkMode ? '#3A3B3C' : '#E4E6EB'),
    paddingHorizontal: 6, // Giống social-app-main CONTENT_PADDING
  },
  tab: {
    flex: 1,
    paddingTop: 10, // Giống social-app-main
    paddingHorizontal: 10, // Giống social-app-main ITEM_PADDING
    justifyContent: 'center',
    alignItems: 'center',
  },
  activeTab: {
    // Border được xử lý trong itemInner
  },
  tabText: {
    fontSize: 16, // Giống social-app-main (text_md)
    lineHeight: 20, // Giống social-app-main
    textAlign: 'center',
    fontWeight: '500',
    color: colors.textSecondary || (isDarkMode ? '#B0B3B8' : '#65676B'),
    paddingBottom: 10, // Giống social-app-main (trong itemInner)
    borderBottomWidth: 3, // Giống social-app-main
    borderBottomColor: 'transparent',
  },
  activeTabText: {
    color: colors.text || (isDarkMode ? '#E4E6EB' : '#050505'), // Giống social-app-main
    fontWeight: '600', // Giống social-app-main (font_semi_bold)
    borderBottomColor: colors.primary || '#1877F2', // Giống social-app-main
  },
  loadLatestButton: {
    position: 'absolute',
    left: 18,
    bottom: 80,
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border || (isDarkMode ? '#3A3B3C' : '#E4E6EB'),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  loadLatestButtonWithIndicator: {
    // Background color đã được set inline
  },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    backgroundColor: colors.primary || '#1877F2',
  },
});

export default NotificationsScreen;

