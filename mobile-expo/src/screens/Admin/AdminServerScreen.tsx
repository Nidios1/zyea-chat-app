import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Text, Card, Button, List, Divider } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme as useAppTheme } from '../../contexts/ThemeContext';
import { adminAPI } from '../../utils/api';
import { spacing, typography, borderRadius } from '../../config/designTokens';
import { Platform } from 'react-native';
import * as Device from 'expo-device';

const AdminServerScreen = () => {
  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();
  const [refreshing, setRefreshing] = useState(false);

  const { data: stats, isLoading, refetch } = useQuery({
    queryKey: ['admin', 'stats'],
    queryFn: async () => {
      const res = await adminAPI.getStats();
      return res.data;
    },
    staleTime: 30 * 1000,
  });

  const { data: activity } = useQuery({
    queryKey: ['admin', 'activity'],
    queryFn: async () => {
      const res = await adminAPI.getActivity(20);
      return res.data;
    },
    staleTime: 60 * 1000,
  });

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refetch()]);
    setRefreshing(false);
  };

  const InfoRow = ({ label, value }: { label: string; value: string | number }) => (
    <View style={styles.infoRow}>
      <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>
        {label}
      </Text>
      <Text style={[styles.infoValue, { color: colors.text }]}>
        {value}
      </Text>
    </View>
  );

  if (isLoading && !stats) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
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
        {/* Server Info */}
        <Card style={[styles.card, { backgroundColor: colors.surface }]}>
          <Card.Content>
            <Text style={[styles.cardTitle, { color: colors.text }]}>
              Thông tin Server
            </Text>
            <InfoRow label="Platform" value={Platform.OS} />
            <InfoRow label="Device Model" value={Device.modelName || 'Unknown'} />
            <InfoRow label="OS Version" value={Platform.Version.toString()} />
            <Divider style={styles.divider} />
            <InfoRow label="Tổng người dùng" value={stats?.totalUsers || 0} />
            <InfoRow label="Tổng bài viết" value={stats?.totalPosts || 0} />
            <InfoRow label="Tổng tin nhắn" value={stats?.totalMessages || 0} />
            <InfoRow label="Tổng cuộc trò chuyện" value={stats?.totalConversations || 0} />
          </Card.Content>
        </Card>

        {/* Recent Activity */}
        {activity && (
          <Card style={[styles.card, { backgroundColor: colors.surface }]}>
            <Card.Content>
              <Text style={[styles.cardTitle, { color: colors.text }]}>
                Hoạt động gần đây
              </Text>
              {activity.recentUsers && activity.recentUsers.length > 0 && (
                <View style={styles.activitySection}>
                  <Text style={[styles.sectionTitle, { color: colors.text }]}>
                    Người dùng mới
                  </Text>
                  {activity.recentUsers.slice(0, 5).map((user: any) => (
                    <View key={user.id} style={styles.activityItem}>
                      <MaterialCommunityIcons 
                        name="account" 
                        size={16} 
                        color={colors.textSecondary} 
                      />
                      <Text style={[styles.activityText, { color: colors.text }]}>
                        {user.full_name || user.username} - {new Date(user.created_at).toLocaleDateString()}
                      </Text>
                    </View>
                  ))}
                </View>
              )}
            </Card.Content>
          </Card>
        )}

        {/* Actions */}
        <Card style={[styles.card, { backgroundColor: colors.surface }]}>
          <Card.Content>
            <Text style={[styles.cardTitle, { color: colors.text }]}>
              Thao tác
            </Text>
            <Button
              mode="outlined"
              onPress={() => {
                Alert.alert('Thông báo', 'Chức năng này sẽ được triển khai sau');
              }}
              style={styles.actionButton}
            >
              Xem Logs
            </Button>
            <Button
              mode="outlined"
              onPress={() => {
                Alert.alert('Thông báo', 'Chức năng này sẽ được triển khai sau');
              }}
              style={styles.actionButton}
            >
              Backup Database
            </Button>
          </Card.Content>
        </Card>
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
  },
  card: {
    margin: spacing.base,
    marginTop: spacing.base,
  },
  cardTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    marginBottom: spacing.md,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.xs,
  },
  infoLabel: {
    fontSize: typography.fontSize.base,
  },
  infoValue: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
  },
  divider: {
    marginVertical: spacing.sm,
  },
  activitySection: {
    marginTop: spacing.sm,
  },
  sectionTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    marginBottom: spacing.sm,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xs,
  },
  activityText: {
    fontSize: typography.fontSize.sm,
    flex: 1,
  },
  actionButton: {
    marginBottom: spacing.sm,
  },
});

export default AdminServerScreen;

