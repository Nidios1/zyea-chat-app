import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  Modal,
  ScrollView,
} from 'react-native';
import { Text, Appbar, useTheme as usePaperTheme } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationsAPI } from '../../utils/api';
import { useNavigation } from '@react-navigation/native';
import { formatDate } from '../../utils/dateUtils';
import { useTheme } from '../../contexts/ThemeContext';
import NotificationCard from '../../components/Notifications/NotificationCard';

const SystemNotificationsScreen = () => {
  const paperTheme = usePaperTheme();
  const { colors, isDarkMode } = useTheme();
  const navigation = useNavigation();
  const queryClient = useQueryClient();
  const [selectedCategory, setSelectedCategory] = useState<string>('Tất cả');
  const [expandedNotification, setExpandedNotification] = useState<number | null>(null);
  const [page, setPage] = useState(1);
  const isMountedRef = useRef(true);

  const categories = ['Tất cả', 'Cập nhật tài khoản', 'Plan of Publisher'];

  // Cleanup khi component unmount
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const {
    data: notificationsData,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['systemNotifications', selectedCategory === 'Tất cả' ? '' : selectedCategory, page],
    queryFn: async () => {
      const category = selectedCategory === 'Tất cả' ? '' : selectedCategory;
      const response = await notificationsAPI.getSystemNotifications(category, page, 50);
      return response.data || { notifications: [], pagination: { total: 0, totalPages: 0 } };
    },
  });

  const notifications = notificationsData?.notifications || [];

  const markAsReadMutation = useMutation({
    mutationFn: (notificationId: number) =>
      notificationsAPI.markSystemNotificationAsRead(notificationId.toString()),
    onSuccess: () => {
      if (isMountedRef.current) {
        queryClient.invalidateQueries({ queryKey: ['systemNotifications'] });
      }
    },
  });

  // Format date function - giữ lại để có thể customize nếu cần
  // NotificationCard component đã có default formatter, nhưng có thể override
  const formatNotificationDate = (dateString: string) => {
    const date = new Date(dateString);
    const day = date.getDate();
    const month = date.getMonth() + 1;
    return `${day} tháng ${month}`;
  };

  const handleNotificationPress = useCallback((notification: any) => {
    if (!isMountedRef.current) return;
    if (!notification.is_read) {
      markAsReadMutation.mutate(notification.id);
    }
    setExpandedNotification(notification.id);
  }, [markAsReadMutation]);


  const renderNotificationCard = useCallback(({ item, index }: { item: any; index: number }) => {
    const isExpanded = expandedNotification === item.id;
    
    return (
      <NotificationCard
        item={item}
        index={index}
        isExpanded={isExpanded}
        onPress={() => handleNotificationPress(item)}
        onExpand={() => {
          if (isMountedRef.current) {
            setExpandedNotification(item.id);
          }
        }}
        formatNotificationDate={formatNotificationDate}
      />
    );
  }, [expandedNotification, handleNotificationPress, formatNotificationDate]);

  const renderCategoryTab = (category: string) => {
    const isSelected = selectedCategory === category;
    return (
      <TouchableOpacity
        key={category}
        style={[
          styles.categoryTab,
          {
            backgroundColor: 'transparent',
          },
        ]}
        onPress={() => {
          if (isMountedRef.current) {
            setSelectedCategory(category);
            setPage(1);
          }
        }}
      >
        <Text
          style={[
            styles.categoryTabText,
            {
              color: isSelected 
                ? (colors.primary || '#1e40af')
                : colors.textSecondary,
              fontWeight: isSelected ? '600' : '500',
            },
          ]}
        >
          {category}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={[styles.headerContainer, { backgroundColor: colors.background }]}>
        <Appbar.Header 
          style={{ 
            backgroundColor: 'transparent',
            elevation: 0,
            height: 56,
            marginTop: -50,
          }}
        >
          <Appbar.BackAction 
            onPress={() => {
              if (navigation.canGoBack()) {
                navigation.goBack();
              }
            }} 
            iconColor={colors.text}
            style={{ backgroundColor: 'transparent' }}
          />
          <Appbar.Content 
            title="Thông báo hệ thống" 
            titleStyle={{ fontSize: 18, fontWeight: '600', color: colors.text }}
          />
          <Appbar.Action 
            icon="cog" 
            onPress={() => {}} 
            iconColor={colors.text}
            style={{ backgroundColor: 'transparent' }}
          />
        </Appbar.Header>
      </View>

      <View style={[styles.categoryTabsContainer, { 
        backgroundColor: colors.background,
      }]}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryTabs}
        >
          {categories.map(renderCategoryTab)}
        </ScrollView>
      </View>

      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
        renderItem={renderNotificationCard}
        // Performance optimizations
        removeClippedSubviews={true}
        maxToRenderPerBatch={10}
        updateCellsBatchingPeriod={50}
        initialNumToRender={10}
        windowSize={10}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>Chưa có thông báo nào</Text>
          </View>
        }
        refreshControl={
          <RefreshControl 
            refreshing={isLoading} 
            onRefresh={() => {
              if (isMountedRef.current) {
                refetch();
              }
            }} 
          />
        }
        contentContainerStyle={styles.listContent}
        onEndReached={() => {
          if (
            isMountedRef.current &&
            notificationsData?.pagination &&
            page < notificationsData.pagination.totalPages
          ) {
            setPage((prev) => prev + 1);
          }
        }}
        onEndReachedThreshold={0.5}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerContainer: {
    elevation: 0,
    paddingVertical: 0,
  },
  categoryTabsContainer: {
    paddingTop: 4,
  },
  categoryTabs: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexDirection: 'row',
    gap: 8,
  },
  categoryTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
  },
  categoryTabText: {
    fontSize: 14,
  },
  listContent: {
    padding: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 16,
  },
});

export default SystemNotificationsScreen;

