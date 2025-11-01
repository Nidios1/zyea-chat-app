import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  RefreshControl,
  Image,
} from 'react-native';
import { Text, Appbar, Searchbar, useTheme as usePaperTheme, Chip } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../contexts/ThemeContext';
import { TouchableOpacity } from 'react-native-gesture-handler';
import { getAvatarURL } from '../../utils/imageUtils';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { chatAPI } from '../../utils/api';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { ChatStackParamList } from '../../navigation/types';
import { MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import useSocket from '../../hooks/useSocket';

type ChatListNavigationProp = StackNavigationProp<ChatStackParamList>;

const ChatListScreen = () => {
  const { isDarkMode, colors } = useTheme();
  const paperTheme = usePaperTheme();
  const navigation = useNavigation<ChatListNavigationProp>();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'inbox' | 'requests'>('inbox');
  const { socket } = useSocket();
  const queryClient = useQueryClient();

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
        return response.data || [];
      } catch (error) {
        console.error('❌ ChatListScreen - Error fetching conversations:', error);
        throw error;
      }
    },
  });
  
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
      refetch();
    }, [refetch])
  );

  // Listen for real-time updates from socket
  useEffect(() => {
    if (!socket) return;

    // Handle user status changes
    const handleUserStatusChanged = (data: any) => {
      console.log('🔄 ChatListScreen - User status changed:', data);
      // Refetch to get updated status
      refetch();
    };

    // Handle conversation updates (new messages)
    const handleConversationUpdated = (data: any) => {
      console.log('📬 ChatListScreen - Conversation updated:', data);
      
      // Optimistic update: Update local state immediately for instant UI update
      if (data.conversationId && data.lastMessage) {
        // Update React Query cache immediately (optimistic update)
        queryClient.setQueryData(['conversations'], (oldData: any[]) => {
          if (!oldData) return oldData;
          
          // Find and update the conversation
          const updated = oldData.map((conv: any) => {
            const convId = conv?.id || conv?.conversation_id;
            if (String(convId) === String(data.conversationId)) {
              // If message is from someone else (not current user viewing this conversation), increment unread_count
              // Note: We can't easily determine sender here, so we'll let refetch handle unread_count update
              // But we can update the last message and timestamp immediately
              return {
                ...conv,
                last_message: data.lastMessage,
                last_message_time: data.timestamp || new Date().toISOString(),
                updated_at: data.timestamp || new Date().toISOString(),
                // Keep existing unread_count, refetch will update it accurately
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
          
          console.log('📬 Optimistically updated conversation list');
          return updated;
        });
      }
      
      // Also refetch to get latest data (unread count, status, etc.)
      // This runs in background and will update if server data differs
      setTimeout(() => {
        refetch();
      }, 500);
    };

    socket.on('userStatusChanged', handleUserStatusChanged);
    socket.on('conversationUpdated', handleConversationUpdated);

    return () => {
      socket.off('userStatusChanged', handleUserStatusChanged);
      socket.off('conversationUpdated', handleConversationUpdated);
    };
  }, [socket, refetch, queryClient]);

  // Calculate unread count
  const unreadCount = useMemo(() => {
    return conversations.reduce((total, conv: any) => {
      return total + (conv.unread_count || conv.unreadCount || 0);
    }, 0);
  }, [conversations]);

  // Format time for message preview (e.g., "20 giờ", "Th 5")
  const formatMessageTime = (dateString: string | null | undefined): string => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHour = Math.floor(diffMs / (1000 * 60 * 60));
    
    if (diffMinutes < 1) {
      return 'vừa xong';
    } else if (diffMinutes < 60) {
      return `${diffMinutes} phút`;
    } else if (diffHour < 24) {
      return `${diffHour} giờ`;
    } else {
      const diffDay = Math.floor(diffHour / 24);
      if (diffDay < 7) {
        // Show day of week like "Th 5" (Thứ 5)
        const days = ['CN', 'Th 2', 'Th 3', 'Th 4', 'Th 5', 'Th 6', 'Th 7'];
        return days[date.getDay()];
      } else {
        return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
      }
    }
  };

  // Format time for badge on avatar (recent messages)
  const formatRecentTime = (dateString: string | null | undefined): string | null => {
    if (!dateString) return null;
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    
    // Only show badge for messages within last 60 minutes
    if (diffMinutes < 60 && diffMinutes >= 0) {
      return `${diffMinutes} phút`;
    }
    return null;
  };

  // Filter conversations based on search and active tab
  const filteredConversations = useMemo(() => {
    let filtered = conversations;

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

    // Filter by active tab (simple mock)
    if (activeTab === 'requests') {
      filtered = filtered.filter((conv: any) => conv.is_request === true);
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

    return filtered;
  }, [conversations, searchQuery, activeTab]);

  const handleConversationPress = (conversation: any) => {
    // Ensure we have a valid conversationId before navigating
    const conversationId = conversation?.id || conversation?.conversation_id;
    const userName = conversation?.full_name || conversation?.username || 'Người dùng';
    const userAvatarUrl = conversation?.avatar_url;
    const otherUserId = conversation?.other_user_id; // Needed for socket emit
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
    });
  };

  const renderHeader = () => (
    <View style={[styles.headerContainer, { backgroundColor: colors.background }]}>
      <View style={styles.headerTitleRow}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Tin nhắn</Text>
        <View style={styles.headerIcons}>
          <TouchableOpacity
            onPress={() => {}}
            style={styles.headerIconButton}
          >
            <MaterialCommunityIcons 
              name="volume-variant-off" 
              size={24} 
              color={colors.text} 
            />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => {}}
            style={styles.headerIconButton}
          >
            <Feather 
              name="edit-2" 
              size={22} 
              color={colors.text} 
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
          inputStyle={{ color: colors.text }}
          iconColor={colors.textSecondary}
          placeholderTextColor={colors.textSecondary}
          elevation={0}
        />
      </View>
      
      {/* Filter tabs */}
      <View style={styles.chipsRow}>
        <Chip
          selected={activeTab === 'inbox'}
          onPress={() => setActiveTab('inbox')}
          style={[
            styles.chip,
            activeTab === 'inbox' && { backgroundColor: isDarkMode ? '#3a3a3b' : '#e0e0e0' }
          ]}
          textStyle={{
            color: activeTab === 'inbox' ? colors.text : colors.textSecondary,
            fontWeight: activeTab === 'inbox' ? '600' : '400',
          }}
        >
          Hộp thư
        </Chip>
        <Chip
          selected={activeTab === 'requests'}
          onPress={() => setActiveTab('requests')}
          style={[
            styles.chip,
            activeTab === 'requests' && { backgroundColor: isDarkMode ? '#3a3a3b' : '#e0e0e0' }
          ]}
          textStyle={{
            color: activeTab === 'requests' ? colors.text : colors.textSecondary,
            fontWeight: activeTab === 'requests' ? '600' : '400',
          }}
        >
          Tin nhắn đang chờ
        </Chip>
      </View>
    </View>
  );

  const renderEmptyState = () => {
    if (isLoading) {
      return (
        <View style={styles.center}>
          <Text variant="bodyLarge" style={{ color: colors.textSecondary }}>
            Đang tải...
          </Text>
        </View>
      );
    }
    if (filteredConversations.length === 0) {
      return (
        <View style={styles.center}>
          <Text variant="bodyLarge" style={{ color: colors.textSecondary }}>
            Chưa có cuộc trò chuyện
          </Text>
        </View>
      );
    }
    return null;
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {renderHeader()}
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
          renderItem={({ item }) => {
            const unreadCount = item.unread_count || item.unreadCount || 0;
            const hasUnread = unreadCount > 0;
            
            return (
              <TouchableOpacity 
                style={[
                  styles.rowContainer,
                  hasUnread && {
                    // Facebook-style unread background: lighter/more saturated
                    backgroundColor: isDarkMode ? '#1e1e1f' : '#f0f2f5',
                  }
                ]}
                onPress={() => handleConversationPress(item)}
                activeOpacity={0.7}
              >
                <View style={styles.rowAvatarWrapper}>
                  {item.avatar_url ? (
                    <Image source={{ uri: getAvatarURL(item.avatar_url) }} style={styles.rowAvatar} />
                  ) : (
                    <View style={[styles.rowAvatar, { backgroundColor: isDarkMode ? '#2b2b2c' : '#d0d0d0', alignItems: 'center', justifyContent: 'center' }]}>
                      <Text style={{ color: isDarkMode ? '#fff' : '#333', fontSize: 20, fontWeight: '600' }}>
                        {(item.full_name || item.username || 'U').substring(0,1).toUpperCase()}
                      </Text>
                    </View>
                  )}
                  
                  {/* Status indicator and time badge logic (like Facebook) */}
                  {(() => {
                    const recentTime = formatRecentTime(item.last_message_time);
                    const status = item.status || 'offline';
                    
                    // If user is online → show green dot, HIDE time badge (like Facebook)
                    if (status === 'online') {
                      return (
                        <View style={[
                          styles.statusIndicator,
                          { 
                            backgroundColor: '#10b981', // Green for online
                            borderColor: isDarkMode ? colors.background : '#ffffff'
                          }
                        ]} />
                      );
                    }
                    
                    // If user is NOT online but has recent message (< 60 phút)
                    // → show time badge, HIDE status indicator (like Facebook)
                    if (recentTime) {
                      return (
                        <View style={[
                          styles.timeBadgeOnAvatar,
                          { borderColor: isDarkMode ? '#000000' : '#ffffff' }
                        ]}>
                          <Text style={styles.timeBadgeText}>{recentTime}</Text>
                        </View>
                      );
                    }
                    
                    // If no recent time badge and not online, show other status indicators
                    if (status === 'recently_active') {
                      return (
                        <View style={[
                          styles.statusIndicator,
                          { 
                            backgroundColor: '#f59e0b', // Orange for recently active
                            borderColor: isDarkMode ? colors.background : '#ffffff'
                          }
                        ]} />
                      );
                    } else if (status === 'away') {
                      return (
                        <View style={[
                          styles.statusIndicator,
                          { 
                            backgroundColor: '#ef4444', // Red for away
                            borderColor: isDarkMode ? colors.background : '#ffffff'
                          }
                        ]} />
                      );
                    }
                    
                    // Offline and no recent message → no indicator (like Facebook)
                    return null;
                  })()}
                </View>
                <View style={styles.rowContent}>
                  <View style={styles.rowLine1}>
                    <Text 
                      numberOfLines={1} 
                      style={[
                        styles.rowName, 
                        { 
                          color: colors.text,
                          fontWeight: hasUnread ? '700' : '600', // Bolder for unread
                        }
                      ]}
                    >
                      {item.full_name || item.username || 'Người dùng'}
                    </Text>
                    {/* Timestamp on the right */}
                    <Text style={[styles.rowTimestamp, { color: colors.textSecondary }]}>
                      {formatMessageTime(item.last_message_time)}
                    </Text>
                  </View>
                  <View style={styles.rowLine2}>
                    <Text 
                      numberOfLines={1} 
                      style={[
                        styles.rowSubtitle, 
                        { 
                          color: hasUnread 
                            ? (isDarkMode ? '#ffffff' : '#050505') // Darker text for unread
                            : colors.textSecondary,
                          fontWeight: hasUnread ? '500' : '400', // Slightly bolder for unread
                        }
                      ]}
                    >
                      {item.last_message || 'Chưa có tin nhắn'}
                    </Text>
                    {/* Unread badge */}
                    {hasUnread && (
                      <View style={[
                        styles.unreadBadge,
                        { backgroundColor: '#ff4444' } // Red badge for unread (like notifications)
                      ]}>
                        <Text style={styles.unreadBadgeText}>
                          {unreadCount > 99 ? '99+' : unreadCount}
                        </Text>
                      </View>
                    )}
                  </View>
                  {/* Separator line - starts after avatar, ends before right edge */}
                  <View 
                    style={[
                      styles.separatorLine,
                      { backgroundColor: isDarkMode ? '#2a2b2c' : '#e5e5e5' }
                    ]} 
                  />
                </View>
              </TouchableOpacity>
            );
          }}
            style={[styles.list, { backgroundColor: colors.background }]}
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
      </View>
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
    paddingTop: 8,
    paddingBottom: 8,
    paddingHorizontal: 16,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
  },
  headerIcons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerIconButton: {
    marginLeft: 12,
    padding: 4,
  },
  searchContainer: {
    paddingHorizontal: 8,
    paddingBottom: 8,
  },
  searchbar: {
    borderRadius: 20,
    elevation: 0,
  },
  chipsRow: {
    flexDirection: 'row',
    paddingHorizontal: 8,
    paddingBottom: 8,
    gap: 8,
  },
  chip: {
    backgroundColor: 'transparent',
  },
  listContent: {
    paddingBottom: 0,
  },
  emptyContent: {
    flexGrow: 1,
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
});

export default ChatListScreen;
