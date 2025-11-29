import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { Text, Searchbar, Card, Avatar, IconButton, Menu } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTheme as useAppTheme } from '../../contexts/ThemeContext';
import { adminAPI } from '../../utils/api';
import { spacing, typography } from '../../config/designTokens';
import Toast from 'react-native-toast-message';
import { getAvatarURL, getInitials } from '../../utils/imageUtils';
import { formatTimeAgo } from '../../utils/dateUtils';

const AdminPostsScreen = () => {
  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [menuVisible, setMenuVisible] = useState<Record<string, boolean>>({});

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['admin', 'posts', page, searchQuery],
    queryFn: async () => {
      const res = await adminAPI.getPosts(page, 20, searchQuery);
      return res.data;
    },
    staleTime: 30 * 1000,
  });

  const deletePostMutation = useMutation({
    mutationFn: (postId: number) => adminAPI.deletePost(postId),
    onSuccess: () => {
      Toast.show({ type: 'success', text1: 'Đã xóa bài viết' });
      queryClient.invalidateQueries({ queryKey: ['admin', 'posts'] });
      setMenuVisible({});
    },
    onError: () => {
      Toast.show({ type: 'error', text1: 'Không thể xóa bài viết' });
    },
  });

  const toggleMenu = (postId: number) => {
    setMenuVisible(prev => ({ ...prev, [postId]: !prev[postId] }));
  };

  const renderPost = ({ item }: { item: any }) => (
    <Card style={[styles.postCard, { backgroundColor: colors.surface }]}>
      <Card.Content>
        <View style={styles.postHeader}>
          <Avatar.Text
            size={40}
            label={getInitials(item.full_name || item.username)}
            source={item.avatar_url ? { uri: getAvatarURL(item.avatar_url) } : undefined}
          />
          <View style={styles.postInfo}>
            <Text style={[styles.postAuthor, { color: colors.text }]}>
              {item.full_name || item.username}
            </Text>
            <Text style={[styles.postTime, { color: colors.textSecondary }]}>
              {formatTimeAgo(new Date(item.created_at))}
            </Text>
          </View>
          <Menu
            visible={menuVisible[item.id] || false}
            onDismiss={() => toggleMenu(item.id)}
            anchor={
              <IconButton
                icon="dots-vertical"
                onPress={() => toggleMenu(item.id)}
              />
            }
          >
            <Menu.Item
              onPress={() => {
                deletePostMutation.mutate(item.id);
                toggleMenu(item.id);
              }}
              title="Xóa bài viết"
              titleStyle={{ color: colors.error }}
            />
          </Menu>
        </View>
        {item.content && (
          <Text style={[styles.postContent, { color: colors.text }]} numberOfLines={3}>
            {item.content}
          </Text>
        )}
        <View style={styles.postStats}>
          <Text style={[styles.postStat, { color: colors.textSecondary }]}>
            👍 {item.likes_count || 0}
          </Text>
          <Text style={[styles.postStat, { color: colors.textSecondary }]}>
            💬 {item.comments_count || 0}
          </Text>
          <Text style={[styles.postStat, { color: colors.textSecondary }]}>
            🔗 {item.shares_count || 0}
          </Text>
        </View>
      </Card.Content>
    </Card>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.filters}>
        <Searchbar
          placeholder="Tìm kiếm bài viết..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchbar}
        />
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={data?.posts || []}
          renderItem={renderPost}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={{ paddingBottom: insets.bottom + spacing.lg }}
          refreshControl={
            <RefreshControl refreshing={false} onRefresh={refetch} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                Không có bài viết nào
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  filters: {
    padding: spacing.base,
  },
  searchbar: {
    marginBottom: spacing.xs,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  postCard: {
    margin: spacing.base,
    marginTop: 0,
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  postInfo: {
    flex: 1,
    marginLeft: spacing.sm,
  },
  postAuthor: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
  },
  postTime: {
    fontSize: typography.fontSize.xs,
  },
  postContent: {
    fontSize: typography.fontSize.base,
    marginBottom: spacing.sm,
  },
  postStats: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  postStat: {
    fontSize: typography.fontSize.sm,
  },
  emptyContainer: {
    padding: spacing.xl,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: typography.fontSize.base,
  },
});

export default AdminPostsScreen;

