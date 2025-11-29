import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
  ScrollView,
  Image,
} from 'react-native';
import { Text, Searchbar, Card, Avatar, Chip, Menu, IconButton, Modal, TextInput, Button, Portal } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useTheme as useAppTheme } from '../../contexts/ThemeContext';
import { adminAPI } from '../../utils/api';
import { spacing, typography, borderRadius } from '../../config/designTokens';
import Toast from 'react-native-toast-message';
import { getAvatarURL, getInitials } from '../../utils/imageUtils';
import { formatTimeAgo } from '../../utils/dateUtils';
import { ProfileStackParamList } from '../../navigation/types';

type NavigationProp = StackNavigationProp<ProfileStackParamList>;

const AdminFeedbackScreen = () => {
  const { colors, isDarkMode } = useAppTheme();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const navigation = useNavigation<NavigationProp>();
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [page, setPage] = useState(1);
  const [menuVisible, setMenuVisible] = useState<Record<string, boolean>>({});
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [responseModalVisible, setResponseModalVisible] = useState(false);
  const [selectedFeedback, setSelectedFeedback] = useState<any>(null);
  const [adminResponse, setAdminResponse] = useState('');
  const [newStatus, setNewStatus] = useState<'pending' | 'reviewed' | 'resolved' | 'rejected'>('pending');

  const handleNavigateToProfile = (userId: string | number) => {
    if (!userId) return;
    try {
      // Navigate directly to OtherUserProfile in ProfileStack (now added to ProfileStack)
      navigation.navigate('OtherUserProfile', { userId: String(userId) });
    } catch (error) {
      console.error('Error navigating to profile:', error);
      Toast.show({
        type: 'error',
        text1: 'Không thể mở trang cá nhân',
        text2: 'Vui lòng thử lại sau',
      });
    }
  };

  const { data, isLoading, refetch, error } = useQuery({
    queryKey: ['admin', 'feedbacks', page, statusFilter, typeFilter],
    queryFn: async () => {
      try {
        const res = await adminAPI.getFeedbacks(page, 20, statusFilter, typeFilter);
        console.log('📝 Admin feedbacks response:', res.data);
        return res.data;
      } catch (err: any) {
        console.error('❌ Error fetching feedbacks:', err);
        Toast.show({
          type: 'error',
          text1: 'Lỗi tải phản hồi',
          text2: err?.response?.data?.message || 'Không thể tải danh sách phản hồi'
        });
        throw err;
      }
    },
    staleTime: 30 * 1000,
  });

  const updateFeedbackMutation = useMutation({
    mutationFn: ({ feedbackId, data }: { feedbackId: number; data: any }) =>
      adminAPI.updateFeedback(feedbackId, data),
    onSuccess: () => {
      Toast.show({ type: 'success', text1: 'Đã cập nhật phản hồi' });
      queryClient.invalidateQueries({ queryKey: ['admin', 'feedbacks'] });
      setDetailModalVisible(false);
      setResponseModalVisible(false);
      setSelectedFeedback(null);
      setMenuVisible({});
    },
    onError: (error: any) => {
      Toast.show({
        type: 'error',
        text1: error?.response?.data?.message || 'Không thể cập nhật'
      });
    },
  });

  const deleteFeedbackMutation = useMutation({
    mutationFn: (feedbackId: number) => adminAPI.deleteFeedback(feedbackId),
    onSuccess: () => {
      Toast.show({ type: 'success', text1: 'Đã xóa phản hồi' });
      queryClient.invalidateQueries({ queryKey: ['admin', 'feedbacks'] });
      setMenuVisible({});
    },
    onError: (error: any) => {
      Toast.show({
        type: 'error',
        text1: error?.response?.data?.message || 'Không thể xóa'
      });
    },
  });

  const toggleMenu = (feedbackId: number) => {
    setMenuVisible(prev => ({ ...prev, [feedbackId]: !prev[feedbackId] }));
  };

  const handleViewDetail = (feedback: any) => {
    setSelectedFeedback(feedback);
    setAdminResponse(feedback.admin_response || '');
    setNewStatus(feedback.status || 'pending');
    setDetailModalVisible(true);
    toggleMenu(feedback.id);
  };

  const handleOpenResponse = (feedback: any) => {
    setSelectedFeedback(feedback);
    setAdminResponse(feedback.admin_response || '');
    setNewStatus(feedback.status || 'pending');
    setResponseModalVisible(true);
    toggleMenu(feedback.id);
  };

  const handleSaveResponse = () => {
    if (!selectedFeedback) return;

    updateFeedbackMutation.mutate({
      feedbackId: selectedFeedback.id,
      data: {
        status: newStatus,
        admin_response: adminResponse.trim() || null
      }
    });
  };

  const handleDelete = (feedbackId: number) => {
    deleteFeedbackMutation.mutate(feedbackId);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return isDarkMode ? '#ffa500' : '#f59e0b';
      case 'reviewed':
        return isDarkMode ? '#0084ff' : '#3b82f6';
      case 'resolved':
        return isDarkMode ? '#00a651' : '#10b981';
      case 'rejected':
        return isDarkMode ? '#ff4444' : '#ef4444';
      default:
        return colors.textSecondary;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'feedback':
        return 'Góp ý';
      case 'report':
        return 'Báo cáo';
      case 'bug':
        return 'Lỗi';
      default:
        return type;
    }
  };

  const renderFeedback = ({ item }: { item: any }) => (
    <Card style={[styles.feedbackCard, { backgroundColor: colors.surface }]}>
      <Card.Content>
        <View style={styles.feedbackHeader}>
          <TouchableOpacity
            style={styles.userInfo}
            onPress={() => handleNavigateToProfile(item.user_id)}
            activeOpacity={0.7}
          >
            <Avatar.Text
              size={40}
              label={getInitials(item.full_name || item.username || 'U')}
              source={item.avatar_url ? { uri: getAvatarURL(item.avatar_url) } : undefined}
            />
            <View style={styles.userDetails}>
              <Text style={[styles.userName, { color: colors.text }]}>
                {item.full_name || item.username || 'Người dùng'}
              </Text>
              <Text style={[styles.userEmail, { color: colors.textSecondary }]}>
                {item.email || `@${item.username}`}
              </Text>
            </View>
          </TouchableOpacity>
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
              onPress={() => handleViewDetail(item)}
              title="Xem chi tiết"
              leadingIcon="eye"
            />
            <Menu.Item
              onPress={() => handleOpenResponse(item)}
              title="Phản hồi"
              leadingIcon="reply"
            />
            <Menu.Item
              onPress={() => handleDelete(item.id)}
              title="Xóa"
              titleStyle={{ color: colors.error }}
              leadingIcon="delete"
            />
          </Menu>
        </View>

        <View style={styles.feedbackMeta}>
          <Chip
            style={[styles.typeChip, { backgroundColor: colors.primary + '20' }]}
            textStyle={{ fontSize: 10, color: colors.primary }}
          >
            {getTypeLabel(item.type)}
          </Chip>
          <Chip
            style={[styles.statusChip, { backgroundColor: getStatusColor(item.status) + '30' }]}
            textStyle={{ fontSize: 10, color: getStatusColor(item.status) }}
          >
            {item.status === 'pending' ? 'Chờ xử lý' :
             item.status === 'reviewed' ? 'Đã xem' :
             item.status === 'resolved' ? 'Đã giải quyết' :
             item.status === 'rejected' ? 'Từ chối' : item.status}
          </Chip>
        </View>

        {/* Hiển thị thông tin người bị báo cáo nếu có */}
        {item.reported_user_id && (
          <TouchableOpacity
            style={[styles.reportedUserContainer, { backgroundColor: colors.error + '15', borderColor: colors.error + '40' }]}
            onPress={() => handleNavigateToProfile(item.reported_user_id)}
            activeOpacity={0.7}
          >
            <View style={styles.reportedUserHeader}>
              <MaterialCommunityIcons
                name="alert-circle"
                size={16}
                color={colors.error || '#ff4444'}
              />
              <Text style={[styles.reportedUserLabel, { color: colors.error || '#ff4444' }]}>
                Người bị báo cáo:
              </Text>
              <MaterialCommunityIcons
                name="chevron-right"
                size={16}
                color={colors.error || '#ff4444'}
                style={{ marginLeft: 'auto' }}
              />
            </View>
            <View style={styles.reportedUserInfo}>
              <Avatar.Text
                size={32}
                label={getInitials(item.reported_full_name || item.reported_username || 'U')}
                source={item.reported_avatar_url ? { uri: getAvatarURL(item.reported_avatar_url) } : undefined}
              />
              <View style={styles.reportedUserDetails}>
                <Text style={[styles.reportedUserName, { color: colors.text }]}>
                  {item.reported_full_name || item.reported_username || 'Người dùng'}
                </Text>
                <Text style={[styles.reportedUserId, { color: colors.textSecondary }]}>
                  ID: {item.reported_user_id}
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        )}

        <Text style={[styles.feedbackContent, { color: colors.text }]} numberOfLines={3}>
          {item.content}
        </Text>

        {item.media_url && (
          <Image
            source={{ uri: getAvatarURL(item.media_url) }}
            style={styles.feedbackImage}
            resizeMode="cover"
          />
        )}

        <Text style={[styles.feedbackTime, { color: colors.textSecondary }]}>
          {formatTimeAgo(new Date(item.created_at))}
        </Text>

        {item.admin_response && (
          <View style={[styles.adminResponseContainer, { backgroundColor: colors.background }]}>
            <Text style={[styles.adminResponseLabel, { color: colors.textSecondary }]}>
              Phản hồi của admin:
            </Text>
            <Text style={[styles.adminResponseText, { color: colors.text }]}>
              {item.admin_response}
            </Text>
          </View>
        )}
      </Card.Content>
    </Card>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.filters}>
        <View style={styles.filterChips}>
          <Chip
            selected={statusFilter === ''}
            onPress={() => setStatusFilter('')}
            style={styles.filterChip}
          >
            Tất cả
          </Chip>
          <Chip
            selected={statusFilter === 'pending'}
            onPress={() => setStatusFilter(statusFilter === 'pending' ? '' : 'pending')}
            style={styles.filterChip}
          >
            Chờ xử lý
          </Chip>
          <Chip
            selected={statusFilter === 'reviewed'}
            onPress={() => setStatusFilter(statusFilter === 'reviewed' ? '' : 'reviewed')}
            style={styles.filterChip}
          >
            Đã xem
          </Chip>
          <Chip
            selected={statusFilter === 'resolved'}
            onPress={() => setStatusFilter(statusFilter === 'resolved' ? '' : 'resolved')}
            style={styles.filterChip}
          >
            Đã giải quyết
          </Chip>
        </View>
        <View style={styles.filterChips}>
          <Chip
            selected={typeFilter === ''}
            onPress={() => setTypeFilter('')}
            style={styles.filterChip}
          >
            Tất cả loại
          </Chip>
          <Chip
            selected={typeFilter === 'feedback'}
            onPress={() => setTypeFilter(typeFilter === 'feedback' ? '' : 'feedback')}
            style={styles.filterChip}
          >
            Góp ý
          </Chip>
          <Chip
            selected={typeFilter === 'report'}
            onPress={() => setTypeFilter(typeFilter === 'report' ? '' : 'report')}
            style={styles.filterChip}
          >
            Báo cáo
          </Chip>
          <Chip
            selected={typeFilter === 'bug'}
            onPress={() => setTypeFilter(typeFilter === 'bug' ? '' : 'bug')}
            style={styles.filterChip}
          >
            Lỗi
          </Chip>
        </View>
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : error ? (
        <View style={styles.emptyContainer}>
          <Text style={[styles.emptyText, { color: colors.error || '#ff4444' }]}>
            Lỗi tải phản hồi: {error?.message || 'Không thể tải danh sách'}
          </Text>
          <Button
            mode="contained"
            onPress={() => refetch()}
            style={{ marginTop: spacing.md }}
          >
            Thử lại
          </Button>
        </View>
      ) : (
        <FlatList
          data={data?.feedbacks || []}
          renderItem={renderFeedback}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={{ paddingBottom: insets.bottom + spacing.lg }}
          refreshControl={
            <RefreshControl refreshing={false} onRefresh={refetch} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                Không có phản hồi nào
              </Text>
              <Text style={[styles.emptyText, { color: colors.textSecondary, fontSize: 12, marginTop: spacing.xs }]}>
                {data?.pagination?.total === 0 ? 'Chưa có phản hồi nào được gửi' : 'Thử thay đổi bộ lọc'}
              </Text>
            </View>
          }
        />
      )}

      {/* Detail Modal */}
      <Portal>
        <Modal
          visible={detailModalVisible}
          onDismiss={() => {
            setDetailModalVisible(false);
            setSelectedFeedback(null);
          }}
          contentContainerStyle={[
            styles.modalContainer,
            { backgroundColor: colors.surface }
          ]}
        >
          <ScrollView>
            {selectedFeedback && (
              <>
                <View style={styles.modalHeader}>
                  <Text style={[styles.modalTitle, { color: colors.text }]}>
                    Chi tiết phản hồi
                  </Text>
                  <IconButton
                    icon="close"
                    onPress={() => {
                      setDetailModalVisible(false);
                      setSelectedFeedback(null);
                    }}
                  />
                </View>

                <View style={styles.detailSection}>
                  <Text style={[styles.detailLabel, { color: colors.textSecondary, marginBottom: spacing.sm }]}>
                    Người gửi báo cáo:
                  </Text>
                  <TouchableOpacity
                    style={styles.userInfo}
                    onPress={() => {
                      setDetailModalVisible(false);
                      handleNavigateToProfile(selectedFeedback.user_id);
                    }}
                    activeOpacity={0.7}
                  >
                    <Avatar.Text
                      size={48}
                      label={getInitials(selectedFeedback.full_name || selectedFeedback.username || 'U')}
                      source={selectedFeedback.avatar_url ? { uri: getAvatarURL(selectedFeedback.avatar_url) } : undefined}
                    />
                    <View style={styles.userDetails}>
                      <Text style={[styles.userName, { color: colors.text }]}>
                        {selectedFeedback.full_name || selectedFeedback.username || 'Người dùng'}
                      </Text>
                      <Text style={[styles.userEmail, { color: colors.textSecondary }]}>
                        {selectedFeedback.email || `@${selectedFeedback.username}`}
                      </Text>
                      <Text style={[styles.userEmail, { color: colors.textSecondary, fontSize: typography.fontSize.xs }]}>
                        User ID: {selectedFeedback.user_id}
                      </Text>
                    </View>
                    <MaterialCommunityIcons
                      name="chevron-right"
                      size={20}
                      color={colors.textSecondary}
                    />
                  </TouchableOpacity>

                  <View style={styles.feedbackMeta}>
                    <Chip
                      style={[styles.typeChip, { backgroundColor: colors.primary + '20' }]}
                      textStyle={{ fontSize: 12, color: colors.primary }}
                    >
                      {getTypeLabel(selectedFeedback.type)}
                    </Chip>
                    <Chip
                      style={[styles.statusChip, { backgroundColor: getStatusColor(selectedFeedback.status) + '30' }]}
                      textStyle={{ fontSize: 12, color: getStatusColor(selectedFeedback.status) }}
                    >
                      {selectedFeedback.status === 'pending' ? 'Chờ xử lý' :
                       selectedFeedback.status === 'reviewed' ? 'Đã xem' :
                       selectedFeedback.status === 'resolved' ? 'Đã giải quyết' :
                       selectedFeedback.status === 'rejected' ? 'Từ chối' : selectedFeedback.status}
                    </Chip>
                  </View>

                  {/* Hiển thị thông tin người bị báo cáo nếu có */}
                  {selectedFeedback.reported_user_id && (
                    <>
                      <Text style={[styles.detailLabel, { color: colors.textSecondary, marginTop: spacing.md }]}>
                        Người bị báo cáo:
                      </Text>
                      <TouchableOpacity
                        style={[styles.reportedUserContainer, { backgroundColor: colors.error + '15', borderColor: colors.error + '40' }]}
                        onPress={() => {
                          setDetailModalVisible(false);
                          handleNavigateToProfile(selectedFeedback.reported_user_id);
                        }}
                        activeOpacity={0.7}
                      >
                        <View style={styles.reportedUserHeader}>
                          <MaterialCommunityIcons
                            name="alert-circle"
                            size={18}
                            color={colors.error || '#ff4444'}
                          />
                          <Text style={[styles.reportedUserLabel, { color: colors.error || '#ff4444', fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.bold }]}>
                            Thông tin tài khoản bị báo cáo
                          </Text>
                          <MaterialCommunityIcons
                            name="chevron-right"
                            size={18}
                            color={colors.error || '#ff4444'}
                            style={{ marginLeft: 'auto' }}
                          />
                        </View>
                        <View style={styles.reportedUserInfo}>
                          <Avatar.Text
                            size={48}
                            label={getInitials(selectedFeedback.reported_full_name || selectedFeedback.reported_username || 'U')}
                            source={selectedFeedback.reported_avatar_url ? { uri: getAvatarURL(selectedFeedback.reported_avatar_url) } : undefined}
                          />
                          <View style={styles.reportedUserDetails}>
                            <Text style={[styles.reportedUserName, { color: colors.text, fontSize: typography.fontSize.base, fontWeight: typography.fontWeight.bold }]}>
                              {selectedFeedback.reported_full_name || selectedFeedback.reported_username || 'Người dùng'}
                            </Text>
                            <Text style={[styles.reportedUserId, { color: colors.textSecondary, fontSize: typography.fontSize.sm }]}>
                              Username: @{selectedFeedback.reported_username || 'N/A'}
                            </Text>
                            <Text style={[styles.reportedUserId, { color: colors.textSecondary, fontSize: typography.fontSize.sm }]}>
                              User ID: {selectedFeedback.reported_user_id}
                            </Text>
                          </View>
                        </View>
                      </TouchableOpacity>
                    </>
                  )}

                  <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>
                    Nội dung:
                  </Text>
                  <Text style={[styles.detailContent, { color: colors.text }]}>
                    {selectedFeedback.content}
                  </Text>

                  {selectedFeedback.media_url && (
                    <>
                      <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>
                        Hình ảnh đính kèm:
                      </Text>
                      <Image
                        source={{ uri: getAvatarURL(selectedFeedback.media_url) }}
                        style={styles.detailImage}
                        resizeMode="contain"
                      />
                    </>
                  )}

                  <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>
                    Thời gian: {new Date(selectedFeedback.created_at).toLocaleString('vi-VN')}
                  </Text>

                  {selectedFeedback.admin_response && (
                    <>
                      <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>
                        Phản hồi của admin:
                      </Text>
                      <View style={[styles.adminResponseBox, { backgroundColor: colors.background }]}>
                        <Text style={[styles.adminResponseText, { color: colors.text }]}>
                          {selectedFeedback.admin_response}
                        </Text>
                      </View>
                    </>
                  )}

                  <View style={styles.modalActions}>
                    <Button
                      mode="outlined"
                      onPress={() => {
                        setDetailModalVisible(false);
                        setSelectedFeedback(null);
                      }}
                      style={styles.modalButton}
                    >
                      Đóng
                    </Button>
                    <Button
                      mode="contained"
                      onPress={() => {
                        setDetailModalVisible(false);
                        handleOpenResponse(selectedFeedback);
                      }}
                      style={styles.modalButton}
                    >
                      Phản hồi
                    </Button>
                  </View>
                </View>
              </>
            )}
          </ScrollView>
        </Modal>

        {/* Response Modal */}
        <Modal
          visible={responseModalVisible}
          onDismiss={() => {
            setResponseModalVisible(false);
            setSelectedFeedback(null);
            setAdminResponse('');
          }}
          contentContainerStyle={[
            styles.modalContainer,
            { backgroundColor: colors.surface }
          ]}
        >
          <ScrollView>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              Phản hồi cho người dùng
            </Text>
            {selectedFeedback && (
              <Text style={[styles.modalSubtitle, { color: colors.textSecondary }]}>
                Từ: {selectedFeedback.full_name || selectedFeedback.username}
              </Text>
            )}

            <View style={styles.selectContainer}>
              <Text style={[styles.label, { color: colors.text }]}>Trạng thái</Text>
              <View style={styles.statusButtons}>
                {(['pending', 'reviewed', 'resolved', 'rejected'] as const).map((status) => (
                  <TouchableOpacity
                    key={status}
                    style={[
                      styles.statusButton,
                      newStatus === status && styles.statusButtonActive,
                      { borderColor: colors.primary }
                    ]}
                    onPress={() => setNewStatus(status)}
                  >
                    <Text style={[
                      styles.statusButtonText,
                      { color: newStatus === status ? colors.primary : colors.textSecondary }
                    ]}>
                      {status === 'pending' ? 'Chờ xử lý' :
                       status === 'reviewed' ? 'Đã xem' :
                       status === 'resolved' ? 'Đã giải quyết' :
                       status === 'rejected' ? 'Từ chối' : status}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <TextInput
              label="Phản hồi cho người dùng (tùy chọn)"
              value={adminResponse}
              onChangeText={setAdminResponse}
              mode="outlined"
              multiline
              numberOfLines={6}
              style={styles.input}
              theme={{ colors: { primary: colors.primary } }}
              placeholder="Nhập phản hồi cho người dùng..."
            />

            <View style={styles.modalActions}>
              <Button
                mode="outlined"
                onPress={() => {
                  setResponseModalVisible(false);
                  setSelectedFeedback(null);
                  setAdminResponse('');
                }}
                style={styles.modalButton}
              >
                Hủy
              </Button>
              <Button
                mode="contained"
                onPress={handleSaveResponse}
                loading={updateFeedbackMutation.isPending}
                disabled={updateFeedbackMutation.isPending}
                style={styles.modalButton}
              >
                Lưu
              </Button>
            </View>
          </ScrollView>
        </Modal>
      </Portal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  filters: {
    padding: spacing.base,
    gap: spacing.sm,
  },
  filterChips: {
    flexDirection: 'row',
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
  filterChip: {
    marginRight: spacing.xs,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  feedbackCard: {
    margin: spacing.base,
    marginTop: 0,
  },
  feedbackHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    flex: 1,
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    marginBottom: spacing.xs / 2,
  },
  userEmail: {
    fontSize: typography.fontSize.sm,
  },
  feedbackMeta: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  typeChip: {
    height: 24,
  },
  statusChip: {
    height: 24,
  },
  feedbackContent: {
    fontSize: typography.fontSize.base,
    lineHeight: 20,
    marginBottom: spacing.sm,
  },
  feedbackImage: {
    width: '100%',
    height: 200,
    borderRadius: borderRadius.md,
    marginBottom: spacing.sm,
  },
  feedbackTime: {
    fontSize: typography.fontSize.xs,
    marginTop: spacing.xs,
  },
  adminResponseContainer: {
    marginTop: spacing.md,
    padding: spacing.md,
    borderRadius: borderRadius.md,
  },
  adminResponseLabel: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    marginBottom: spacing.xs,
  },
  adminResponseText: {
    fontSize: typography.fontSize.sm,
    lineHeight: 18,
  },
  reportedUserContainer: {
    marginTop: spacing.sm,
    marginBottom: spacing.md,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
  },
  reportedUserHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  reportedUserLabel: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
  },
  reportedUserInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  reportedUserDetails: {
    flex: 1,
  },
  reportedUserName: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    marginBottom: spacing.xs / 2,
  },
  reportedUserId: {
    fontSize: typography.fontSize.sm,
  },
  emptyContainer: {
    padding: spacing.xl,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: typography.fontSize.base,
  },
  modalContainer: {
    backgroundColor: 'white',
    padding: spacing.lg,
    margin: spacing.lg,
    borderRadius: borderRadius.lg,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  modalTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    flex: 1,
  },
  modalSubtitle: {
    fontSize: typography.fontSize.sm,
    marginBottom: spacing.md,
  },
  detailSection: {
    gap: spacing.md,
  },
  detailLabel: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    marginTop: spacing.sm,
  },
  detailContent: {
    fontSize: typography.fontSize.base,
    lineHeight: 22,
    marginTop: spacing.xs,
  },
  detailImage: {
    width: '100%',
    height: 300,
    borderRadius: borderRadius.md,
    marginTop: spacing.sm,
  },
  adminResponseBox: {
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginTop: spacing.xs,
  },
  selectContainer: {
    marginBottom: spacing.md,
  },
  label: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    marginBottom: spacing.sm,
  },
  statusButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  statusButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    borderWidth: 1,
  },
  statusButtonActive: {
    backgroundColor: 'rgba(0, 132, 255, 0.1)',
  },
  statusButtonText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
  },
  input: {
    marginBottom: spacing.md,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  modalButton: {
    flex: 1,
  },
});

export default AdminFeedbackScreen;

