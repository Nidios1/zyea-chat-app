import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { Text, Card, Chip, useTheme } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme as useAppTheme } from '../../contexts/ThemeContext';
import { adminAPI } from '../../utils/api';
import { spacing, typography, borderRadius } from '../../config/designTokens';

const AdminDashboardScreen = () => {
  const { colors, isDarkMode } = useAppTheme();
  const paperTheme = useTheme();
  const insets = useSafeAreaInsets();
  const [refreshing, setRefreshing] = useState(false);

  const { data: stats, isLoading, refetch } = useQuery({
    queryKey: ['admin', 'stats'],
    queryFn: async () => {
      const res = await adminAPI.getStats();
      return res.data;
    },
    staleTime: 30 * 1000, // 30 giây
  });

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const StatCard = ({ 
    icon, 
    title, 
    value, 
    subtitle, 
    color 
  }: { 
    icon: string; 
    title: string; 
    value: string | number; 
    subtitle?: string;
    color?: string;
  }) => (
    <Card style={[styles.statCard, { backgroundColor: colors.surface }]}>
      <Card.Content>
        <View style={styles.statCardContent}>
          <View style={[styles.statIcon, { backgroundColor: color || colors.primary + '20' }]}>
            <MaterialCommunityIcons 
              name={icon as any} 
              size={24} 
              color={color || colors.primary} 
            />
          </View>
          <View style={styles.statText}>
            <Text style={[styles.statValue, { color: colors.text }]}>
              {typeof value === 'number' ? value.toLocaleString() : value}
            </Text>
            <Text style={[styles.statTitle, { color: colors.textSecondary }]}>
              {title}
            </Text>
            {subtitle && (
              <Text style={[styles.statSubtitle, { color: colors.textSecondary }]}>
                {subtitle}
              </Text>
            )}
          </View>
        </View>
      </Card.Content>
    </Card>
  );

  if (isLoading && !stats) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.text }]}>
            Đang tải thống kê...
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={{ paddingBottom: insets.bottom + spacing.lg }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.header}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            Quản Lý Server
          </Text>
          <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
            Tổng quan hệ thống
          </Text>
        </View>

        {/* Main Stats */}
        <View style={styles.statsGrid}>
          <StatCard
            icon="account-group"
            title="Tổng người dùng"
            value={stats?.totalUsers || 0}
            subtitle={`${stats?.activeUsers || 0} đang hoạt động`}
            color="#4CAF50"
          />
          <StatCard
            icon="post"
            title="Tổng bài viết"
            value={stats?.totalPosts || 0}
            subtitle={`${stats?.newPostsToday || 0} hôm nay`}
            color="#2196F3"
          />
          <StatCard
            icon="message-text"
            title="Tin nhắn"
            value={stats?.totalMessages || 0}
            color="#FF9800"
          />
          <StatCard
            icon="chat"
            title="Cuộc trò chuyện"
            value={stats?.totalConversations || 0}
            color="#9C27B0"
          />
        </View>

        {/* Today Stats */}
        <Card style={[styles.card, { backgroundColor: colors.surface }]}>
          <Card.Content>
            <Text style={[styles.cardTitle, { color: colors.text }]}>
              Hôm Nay
            </Text>
            <View style={styles.todayStats}>
              <View style={styles.todayStatItem}>
                <MaterialCommunityIcons 
                  name="account-plus" 
                  size={20} 
                  color={colors.primary} 
                />
                <Text style={[styles.todayStatValue, { color: colors.text }]}>
                  {stats?.newUsersToday || 0}
                </Text>
                <Text style={[styles.todayStatLabel, { color: colors.textSecondary }]}>
                  Người dùng mới
                </Text>
              </View>
              <View style={styles.todayStatItem}>
                <MaterialCommunityIcons 
                  name="post-outline" 
                  size={20} 
                  color={colors.primary} 
                />
                <Text style={[styles.todayStatValue, { color: colors.text }]}>
                  {stats?.newPostsToday || 0}
                </Text>
                <Text style={[styles.todayStatLabel, { color: colors.textSecondary }]}>
                  Bài viết mới
                </Text>
              </View>
            </View>
          </Card.Content>
        </Card>

        {/* Users by Status */}
        {stats?.usersByStatus && Object.keys(stats.usersByStatus).length > 0 && (
          <Card style={[styles.card, { backgroundColor: colors.surface }]}>
            <Card.Content>
              <Text style={[styles.cardTitle, { color: colors.text }]}>
                Người dùng theo trạng thái
              </Text>
              <View style={styles.chipsContainer}>
                {Object.entries(stats.usersByStatus).map(([status, count]: [string, any]) => (
                  <Chip
                    key={status}
                    style={styles.chip}
                    textStyle={{ color: colors.text }}
                  >
                    {status}: {count}
                  </Chip>
                ))}
              </View>
            </Card.Content>
          </Card>
        )}

        {/* Posts by Privacy */}
        {stats?.postsByPrivacy && Object.keys(stats.postsByPrivacy).length > 0 && (
          <Card style={[styles.card, { backgroundColor: colors.surface }]}>
            <Card.Content>
              <Text style={[styles.cardTitle, { color: colors.text }]}>
                Bài viết theo quyền riêng tư
              </Text>
              <View style={styles.chipsContainer}>
                {Object.entries(stats.postsByPrivacy).map(([privacy, count]: [string, any]) => (
                  <Chip
                    key={privacy}
                    style={styles.chip}
                    textStyle={{ color: colors.text }}
                  >
                    {privacy}: {count}
                  </Chip>
                ))}
              </View>
            </Card.Content>
          </Card>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.md,
  },
  loadingText: {
    fontSize: typography.fontSize.base,
  },
  header: {
    padding: spacing.base,
    paddingBottom: spacing.md,
  },
  headerTitle: {
    fontSize: typography.fontSize.xxl,
    fontWeight: typography.fontWeight.bold,
    marginBottom: spacing.xs,
  },
  headerSubtitle: {
    fontSize: typography.fontSize.base,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: spacing.base,
    gap: spacing.md,
  },
  statCard: {
    width: '47%',
    marginBottom: spacing.md,
  },
  statCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statText: {
    flex: 1,
  },
  statValue: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    marginBottom: spacing.xs / 2,
  },
  statTitle: {
    fontSize: typography.fontSize.sm,
    marginBottom: spacing.xs / 2,
  },
  statSubtitle: {
    fontSize: typography.fontSize.xs,
  },
  card: {
    margin: spacing.base,
    marginTop: 0,
  },
  cardTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    marginBottom: spacing.md,
  },
  todayStats: {
    flexDirection: 'row',
    gap: spacing.base,
  },
  todayStatItem: {
    flex: 1,
    alignItems: 'center',
    gap: spacing.xs,
  },
  todayStatValue: {
    fontSize: typography.fontSize.xxl,
    fontWeight: typography.fontWeight.bold,
  },
  todayStatLabel: {
    fontSize: typography.fontSize.sm,
    textAlign: 'center',
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  chip: {
    marginBottom: spacing.xs,
  },
});

export default AdminDashboardScreen;

