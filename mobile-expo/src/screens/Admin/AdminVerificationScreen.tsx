import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Image } from 'react-native';
import { Text, Card, Button, Chip, Portal, Modal, TextInput } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTheme } from '../../contexts/ThemeContext';
import { adminAPI } from '../../utils/api';
import { getImageURL } from '../../utils/imageUtils';
import { spacing, typography, borderRadius } from '../../config/designTokens';
import Toast from 'react-native-toast-message';

const CATEGORY_LABELS: Record<string, string> = {
  individual: 'Cá nhân',
  organization: 'Tổ chức',
  brand: 'Thương hiệu',
  public_figure: 'Nhân vật công chúng',
  other: 'Khác',
};

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  pending: { label: 'Chờ duyệt', color: '#FFA500' },
  approved: { label: 'Đã duyệt', color: '#00A651' },
  rejected: { label: 'Đã từ chối', color: '#FF4444' },
};

export default function AdminVerificationScreen() {
  const { colors, isDarkMode } = useTheme();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [approveModalVisible, setApproveModalVisible] = useState(false);
  const [rejectModalVisible, setRejectModalVisible] = useState(false);
  const [verifiedBy, setVerifiedBy] = useState('Zyea');
  const [rejectReason, setRejectReason] = useState('');

  const { data, isLoading, refetch, isRefetching, error } = useQuery({
    queryKey: ['adminVerifications', page, statusFilter],
    queryFn: async () => {
      try {
        const result = await adminAPI.getVerifications(page, 20, statusFilter);
        console.log('📋 Admin Verifications API Response:', {
          status: result.status,
          hasData: !!result.data,
          dataKeys: result.data ? Object.keys(result.data) : [],
          requests: result.data?.requests?.length || 0,
        });
        return result;
      } catch (err: any) {
        console.error('❌ Admin Verifications API Error:', err);
        throw err;
      }
    },
  });

  const approveMutation = useMutation({
    mutationFn: ({ id, verified_by }: { id: number; verified_by?: string }) =>
      adminAPI.approveVerification(id, verified_by),
    onSuccess: () => {
      Toast.show({ type: 'success', text1: 'Đã duyệt yêu cầu xác minh' });
      queryClient.invalidateQueries({ queryKey: ['adminVerifications'] });
      setApproveModalVisible(false);
      setDetailModalVisible(false);
      setSelectedRequest(null);
    },
    onError: (error: any) => {
      Toast.show({
        type: 'error',
        text1: 'Lỗi',
        text2: error?.response?.data?.message || 'Không thể duyệt yêu cầu',
      });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, admin_response }: { id: number; admin_response?: string }) =>
      adminAPI.rejectVerification(id, admin_response),
    onSuccess: () => {
      Toast.show({ type: 'success', text1: 'Đã từ chối yêu cầu xác minh' });
      queryClient.invalidateQueries({ queryKey: ['adminVerifications'] });
      setRejectModalVisible(false);
      setDetailModalVisible(false);
      setSelectedRequest(null);
      setRejectReason('');
    },
    onError: (error: any) => {
      Toast.show({
        type: 'error',
        text1: 'Lỗi',
        text2: error?.response?.data?.message || 'Không thể từ chối yêu cầu',
      });
    },
  });

  const handleViewDetails = (request: any) => {
    setSelectedRequest(request);
    setDetailModalVisible(true);
  };

  const handleApprove = () => {
    if (!selectedRequest) return;
    setApproveModalVisible(true);
  };

  const handleReject = () => {
    if (!selectedRequest) return;
    setRejectModalVisible(true);
  };

  const confirmApprove = () => {
    if (!selectedRequest) return;
    approveMutation.mutate({
      id: selectedRequest.id,
      verified_by: verifiedBy || 'Zyea',
    });
  };

  const confirmReject = () => {
    if (!selectedRequest) return;
    rejectMutation.mutate({
      id: selectedRequest.id,
      admin_response: rejectReason || 'Yêu cầu xác minh đã bị từ chối',
    });
  };

  const requests = data?.data?.requests || data?.data?.data?.requests || [];
  const pagination = data?.data?.pagination || data?.data?.data?.pagination || { page: 1, total: 0, totalPages: 0 };
  
  console.log('📋 Admin Verifications - Data:', {
    hasData: !!data,
    dataKeys: data ? Object.keys(data) : [],
    requestsCount: requests.length,
    pagination,
  });

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Filter Chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterContainer}
        contentContainerStyle={styles.filterContent}
      >
        <Chip
          selected={statusFilter === ''}
          onPress={() => setStatusFilter('')}
          style={[styles.chip, { backgroundColor: statusFilter === '' ? colors.primary + '20' : colors.surface }]}
          textStyle={{ color: statusFilter === '' ? colors.primary : colors.text }}
        >
          Tất cả
        </Chip>
        <Chip
          selected={statusFilter === 'pending'}
          onPress={() => setStatusFilter('pending')}
          style={[styles.chip, { backgroundColor: statusFilter === 'pending' ? colors.primary + '20' : colors.surface }]}
          textStyle={{ color: statusFilter === 'pending' ? colors.primary : colors.text }}
        >
          Chờ duyệt
        </Chip>
        <Chip
          selected={statusFilter === 'approved'}
          onPress={() => setStatusFilter('approved')}
          style={[styles.chip, { backgroundColor: statusFilter === 'approved' ? colors.primary + '20' : colors.surface }]}
          textStyle={{ color: statusFilter === 'approved' ? colors.primary : colors.text }}
        >
          Đã duyệt
        </Chip>
        <Chip
          selected={statusFilter === 'rejected'}
          onPress={() => setStatusFilter('rejected')}
          style={[styles.chip, { backgroundColor: statusFilter === 'rejected' ? colors.primary + '20' : colors.surface }]}
          textStyle={{ color: statusFilter === 'rejected' ? colors.primary : colors.text }}
        >
          Đã từ chối
        </Chip>
      </ScrollView>

      {/* Requests List */}
      <ScrollView
        style={styles.listContainer}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
      >
        {isLoading ? (
          <View style={styles.centerContainer}>
            <Text style={{ color: colors.textSecondary }}>Đang tải...</Text>
          </View>
        ) : requests.length === 0 ? (
          <View style={styles.centerContainer}>
            <MaterialCommunityIcons name="check-circle-outline" size={48} color={colors.textSecondary} />
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              Chưa có yêu cầu xác minh nào
            </Text>
          </View>
        ) : (
          requests.map((request: any) => (
            <Card
              key={request.id}
              style={[styles.card, { backgroundColor: colors.surface }]}
              onPress={() => handleViewDetails(request)}
            >
              <Card.Content>
                <View style={styles.cardHeader}>
                  <View style={styles.cardHeaderLeft}>
                    <Text style={[styles.userName, { color: colors.text }]}>
                      {request.full_name || request.username}
                    </Text>
                    <Chip
                      style={[
                        styles.statusChip,
                        { backgroundColor: STATUS_LABELS[request.status]?.color + '20' },
                      ]}
                      textStyle={{ color: STATUS_LABELS[request.status]?.color, fontSize: 11 }}
                    >
                      {STATUS_LABELS[request.status]?.label || request.status}
                    </Chip>
                  </View>
                  <MaterialCommunityIcons name="chevron-right" size={20} color={colors.textSecondary} />
                </View>
                <Text style={[styles.categoryText, { color: colors.textSecondary }]}>
                  {CATEGORY_LABELS[request.category] || request.category}
                </Text>
                <Text
                  style={[styles.reasonText, { color: colors.textSecondary }]}
                  numberOfLines={2}
                >
                  {request.reason}
                </Text>
                <Text style={[styles.dateText, { color: colors.textSecondary }]}>
                  {new Date(request.created_at).toLocaleDateString('vi-VN')}
                </Text>
              </Card.Content>
            </Card>
          ))
        )}
      </ScrollView>

      {/* Detail Modal */}
      <Portal>
        <Modal
          visible={detailModalVisible}
          onDismiss={() => {
            setDetailModalVisible(false);
            setSelectedRequest(null);
          }}
          contentContainerStyle={[styles.modalContainer, { backgroundColor: colors.surface }]}
        >
          <ScrollView>
            {selectedRequest && (
              <>
                <View style={styles.modalHeader}>
                  <Text style={[styles.modalTitle, { color: colors.text }]}>Chi tiết yêu cầu</Text>
                  <TouchableOpacity onPress={() => setDetailModalVisible(false)}>
                    <MaterialCommunityIcons name="close" size={24} color={colors.textSecondary} />
                  </TouchableOpacity>
                </View>

                <View style={styles.detailSection}>
                  <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Người dùng</Text>
                  <Text style={[styles.detailValue, { color: colors.text }]}>
                    {selectedRequest.full_name || selectedRequest.username}
                  </Text>
                </View>

                <View style={styles.detailSection}>
                  <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Loại tài khoản</Text>
                  <Text style={[styles.detailValue, { color: colors.text }]}>
                    {CATEGORY_LABELS[selectedRequest.category] || selectedRequest.category}
                  </Text>
                </View>

                <View style={styles.detailSection}>
                  <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Lý do</Text>
                  <Text style={[styles.detailValue, { color: colors.text }]}>
                    {selectedRequest.reason}
                  </Text>
                </View>

                {selectedRequest.id_card_image && (
                  <View style={styles.detailSection}>
                    <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Ảnh hộ chiếu/CCCD</Text>
                    <Image
                      source={{ uri: getImageURL(selectedRequest.id_card_image) }}
                      style={styles.idCardImage}
                      resizeMode="contain"
                    />
                  </View>
                )}

                {selectedRequest.email && (
                  <View style={styles.detailSection}>
                    <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Email</Text>
                    <Text style={[styles.detailValue, { color: colors.text }]}>
                      {selectedRequest.email}
                    </Text>
                  </View>
                )}

                <View style={styles.detailSection}>
                  <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Trạng thái</Text>
                  <Chip
                    style={[
                      styles.statusChip,
                      { backgroundColor: STATUS_LABELS[selectedRequest.status]?.color + '20' },
                    ]}
                    textStyle={{ color: STATUS_LABELS[selectedRequest.status]?.color }}
                  >
                    {STATUS_LABELS[selectedRequest.status]?.label || selectedRequest.status}
                  </Chip>
                </View>

                {selectedRequest.status === 'pending' && (
                  <View style={styles.modalActions}>
                    <Button
                      mode="outlined"
                      onPress={handleReject}
                      style={styles.actionButton}
                      textColor={colors.error}
                    >
                      Từ chối
                    </Button>
                    <Button
                      mode="contained"
                      onPress={handleApprove}
                      style={[styles.actionButton, { backgroundColor: colors.primary }]}
                    >
                      Duyệt
                    </Button>
                  </View>
                )}
              </>
            )}
          </ScrollView>
        </Modal>
      </Portal>

      {/* Approve Modal */}
      <Portal>
        <Modal
          visible={approveModalVisible}
          onDismiss={() => setApproveModalVisible(false)}
          contentContainerStyle={[styles.modalContainer, { backgroundColor: colors.surface }]}
        >
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Duyệt yêu cầu</Text>
            <TouchableOpacity onPress={() => setApproveModalVisible(false)}>
              <MaterialCommunityIcons name="close" size={24} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
          <TextInput
            label="Xác minh bởi"
            value={verifiedBy}
            onChangeText={setVerifiedBy}
            mode="outlined"
            style={styles.input}
            theme={{ colors: { text: colors.text, primary: colors.primary } }}
          />
          <View style={styles.modalActions}>
            <Button
              mode="outlined"
              onPress={() => setApproveModalVisible(false)}
              style={styles.actionButton}
            >
              Hủy
            </Button>
            <Button
              mode="contained"
              onPress={confirmApprove}
              loading={approveMutation.isPending}
              disabled={approveMutation.isPending}
              style={[styles.actionButton, { backgroundColor: colors.primary }]}
            >
              Xác nhận
            </Button>
          </View>
        </Modal>
      </Portal>

      {/* Reject Modal */}
      <Portal>
        <Modal
          visible={rejectModalVisible}
          onDismiss={() => setRejectModalVisible(false)}
          contentContainerStyle={[styles.modalContainer, { backgroundColor: colors.surface }]}
        >
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Từ chối yêu cầu</Text>
            <TouchableOpacity onPress={() => setRejectModalVisible(false)}>
              <MaterialCommunityIcons name="close" size={24} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
          <TextInput
            label="Lý do từ chối (tùy chọn)"
            value={rejectReason}
            onChangeText={setRejectReason}
            mode="outlined"
            multiline
            numberOfLines={3}
            style={styles.input}
            theme={{ colors: { text: colors.text, primary: colors.primary } }}
          />
          <View style={styles.modalActions}>
            <Button
              mode="outlined"
              onPress={() => setRejectModalVisible(false)}
              style={styles.actionButton}
            >
              Hủy
            </Button>
            <Button
              mode="contained"
              onPress={confirmReject}
              loading={rejectMutation.isPending}
              disabled={rejectMutation.isPending}
              style={[styles.actionButton, { backgroundColor: colors.error }]}
            >
              Xác nhận
            </Button>
          </View>
        </Modal>
      </Portal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  filterContainer: {
    maxHeight: 60,
    paddingVertical: spacing.sm,
  },
  filterContent: {
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
  chip: {
    marginRight: spacing.xs,
  },
  listContainer: {
    flex: 1,
    padding: spacing.md,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.xl * 2,
  },
  emptyText: {
    marginTop: spacing.md,
    fontSize: typography.fontSize.base,
  },
  card: {
    marginBottom: spacing.md,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
  },
  userName: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
  },
  statusChip: {
    height: 24,
  },
  categoryText: {
    fontSize: typography.fontSize.sm,
    marginBottom: spacing.xs,
  },
  reasonText: {
    fontSize: typography.fontSize.sm,
    marginBottom: spacing.xs,
  },
  dateText: {
    fontSize: typography.fontSize.xs,
  },
  modalContainer: {
    padding: spacing.lg,
    margin: spacing.lg,
    borderRadius: borderRadius.lg,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  modalTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
  },
  detailSection: {
    marginBottom: spacing.md,
  },
  detailLabel: {
    fontSize: typography.fontSize.sm,
    marginBottom: spacing.xs,
  },
  detailValue: {
    fontSize: typography.fontSize.base,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  actionButton: {
    flex: 1,
  },
  input: {
    marginBottom: spacing.md,
  },
  idCardImage: {
    width: '100%',
    height: 300,
    borderRadius: borderRadius.md,
    backgroundColor: '#F5F5F5',
    marginTop: spacing.xs,
  },
});

