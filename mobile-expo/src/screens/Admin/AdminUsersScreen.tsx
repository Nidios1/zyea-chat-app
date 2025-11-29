import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Text, Searchbar, Card, Avatar, Chip, Menu, IconButton, Modal, TextInput, Button, Portal } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme as useAppTheme } from '../../contexts/ThemeContext';
import { adminAPI } from '../../utils/api';
import { spacing, typography, borderRadius } from '../../config/designTokens';
import Toast from 'react-native-toast-message';
import { getAvatarURL, getInitials } from '../../utils/imageUtils';
import { formatTimeAgo } from '../../utils/dateUtils';

const AdminUsersScreen = () => {
  const { colors, isDarkMode } = useAppTheme();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [menuVisible, setMenuVisible] = useState<Record<string, boolean>>({});
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [resetPasswordModalVisible, setResetPasswordModalVisible] = useState(false);
  const [sendMessageModalVisible, setSendMessageModalVisible] = useState(false);
  const [sendMessageToAllModalVisible, setSendMessageToAllModalVisible] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [messageContent, setMessageContent] = useState('');
  const [messageToAllContent, setMessageToAllContent] = useState('');
  const [editForm, setEditForm] = useState({
    full_name: '',
    email: '',
    phone: '',
    role: 'user' as 'user' | 'admin',
    status: 'online',
  });

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['admin', 'users', page, searchQuery, roleFilter, statusFilter],
    queryFn: async () => {
      const res = await adminAPI.getUsers(page, 20, searchQuery, roleFilter, statusFilter);
      return res.data;
    },
    staleTime: 30 * 1000,
  });

  const deleteUserMutation = useMutation({
    mutationFn: (userId: number) => adminAPI.deleteUser(userId),
    onSuccess: () => {
      Toast.show({ type: 'success', text1: 'Đã xóa người dùng' });
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      setMenuVisible({});
    },
    onError: (error: any) => {
      Toast.show({ 
        type: 'error', 
        text1: error?.response?.data?.message || 'Không thể xóa người dùng' 
      });
    },
  });

  const updateUserMutation = useMutation({
    mutationFn: ({ userId, data }: { userId: number; data: any }) => 
      adminAPI.updateUser(userId, data),
    onSuccess: () => {
      Toast.show({ type: 'success', text1: 'Đã cập nhật người dùng' });
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      setMenuVisible({});
    },
    onError: (error: any) => {
      Toast.show({ 
        type: 'error', 
        text1: error?.response?.data?.message || 'Không thể cập nhật' 
      });
    },
  });

  const resetPasswordMutation = useMutation({
    mutationFn: ({ userId, newPassword }: { userId: number; newPassword: string }) =>
      adminAPI.resetUserPassword(userId, newPassword),
    onSuccess: () => {
      Toast.show({ type: 'success', text1: 'Đã đổi mật khẩu thành công' });
      setResetPasswordModalVisible(false);
      setNewPassword('');
      setConfirmPassword('');
      setSelectedUser(null);
      setMenuVisible({});
    },
    onError: (error: any) => {
      Toast.show({
        type: 'error',
        text1: error?.response?.data?.message || 'Không thể đổi mật khẩu'
      });
    },
  });

  const sendMessageMutation = useMutation({
    mutationFn: ({ userId, content }: { userId: number; content: string }) =>
      adminAPI.sendMessageToUser(userId, content, 'text'),
    onSuccess: () => {
      Toast.show({ type: 'success', text1: 'Đã gửi tin nhắn thành công' });
      setSendMessageModalVisible(false);
      setMessageContent('');
      setSelectedUser(null);
      setMenuVisible({});
    },
    onError: (error: any) => {
      Toast.show({
        type: 'error',
        text1: error?.response?.data?.message || 'Không thể gửi tin nhắn'
      });
    },
  });

  const sendMessageToAllMutation = useMutation({
    mutationFn: ({ content }: { content: string }) =>
      adminAPI.sendMessageToAllUsers(content, 'text', []),
    onSuccess: (data: any) => {
      const { successCount, errorCount, totalUsers } = data.data;
      Toast.show({ 
        type: 'success', 
        text1: `Đã gửi tin nhắn đến ${successCount}/${totalUsers} người dùng`,
        text2: errorCount > 0 ? `${errorCount} lỗi xảy ra` : undefined
      });
      setSendMessageToAllModalVisible(false);
      setMessageToAllContent('');
    },
    onError: (error: any) => {
      Toast.show({
        type: 'error',
        text1: error?.response?.data?.message || 'Không thể gửi tin nhắn đến tất cả người dùng'
      });
    },
  });

  const toggleMenu = (userId: number) => {
    setMenuVisible(prev => ({ ...prev, [userId]: !prev[userId] }));
  };

  const handleDelete = (userId: number) => {
    deleteUserMutation.mutate(userId);
  };

  const handleToggleRole = (user: any) => {
    const newRole = user.role === 'admin' ? 'user' : 'admin';
    updateUserMutation.mutate({ userId: user.id, data: { role: newRole } });
  };

  const handleEdit = (user: any) => {
    setSelectedUser(user);
    setEditForm({
      full_name: user.full_name || '',
      email: user.email || '',
      phone: user.phone || '',
      role: user.role || 'user',
      status: user.status || 'online',
    });
    setEditModalVisible(true);
    toggleMenu(user.id);
  };

  const handleSaveEdit = () => {
    if (!selectedUser) return;
    
    updateUserMutation.mutate(
      { userId: selectedUser.id, data: editForm },
      {
        onSuccess: () => {
          setEditModalVisible(false);
          setSelectedUser(null);
        },
      }
    );
  };

  const handleResetPassword = (user: any) => {
    setSelectedUser(user);
    setNewPassword('');
    setConfirmPassword('');
    setResetPasswordModalVisible(true);
    toggleMenu(user.id);
  };

  const handleSendMessage = (user: any) => {
    setSelectedUser(user);
    setMessageContent('');
    setSendMessageModalVisible(true);
    toggleMenu(user.id);
  };

  const handleSendMessageSubmit = () => {
    if (!selectedUser || !messageContent.trim()) {
      Toast.show({ type: 'error', text1: 'Vui lòng nhập nội dung tin nhắn' });
      return;
    }
    sendMessageMutation.mutate({ userId: selectedUser.id, content: messageContent.trim() });
  };

  const handleSendMessageToAllSubmit = () => {
    if (!messageToAllContent.trim()) {
      Toast.show({ type: 'error', text1: 'Vui lòng nhập nội dung tin nhắn' });
      return;
    }
    sendMessageToAllMutation.mutate({ content: messageToAllContent.trim() });
  };

  const handleSaveResetPassword = () => {
    if (!selectedUser) return;

    if (!newPassword || newPassword.length < 6) {
      Toast.show({
        type: 'error',
        text1: 'Mật khẩu phải có ít nhất 6 ký tự'
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      Toast.show({
        type: 'error',
        text1: 'Mật khẩu xác nhận không khớp'
      });
      return;
    }

    resetPasswordMutation.mutate({
      userId: selectedUser.id,
      newPassword: newPassword
    });
  };

  const renderUser = ({ item }: { item: any }) => (
    <Card style={[styles.userCard, { backgroundColor: colors.surface }]}>
      <Card.Content>
        <View style={styles.userHeader}>
          <Avatar.Text
            size={48}
            label={getInitials(item.full_name || item.username)}
            source={item.avatar_url ? { uri: getAvatarURL(item.avatar_url) } : undefined}
          />
          <View style={styles.userInfo}>
            <Text style={[styles.userName, { color: colors.text }]}>
              {item.full_name || item.username}
            </Text>
            <Text style={[styles.userEmail, { color: colors.textSecondary }]}>
              {item.email}
            </Text>
            <View style={styles.userMeta}>
              <Chip 
                style={styles.chip}
                textStyle={{ fontSize: 10 }}
              >
                {item.role || 'user'}
              </Chip>
              {item.status && (
                <Chip 
                  style={styles.chip}
                  textStyle={{ fontSize: 10 }}
                >
                  {item.status}
                </Chip>
              )}
            </View>
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
                handleEdit(item);
              }}
              title="Chỉnh sửa"
              leadingIcon="pencil"
            />
            <Menu.Item
              onPress={() => {
                handleResetPassword(item);
              }}
              title="Đổi mật khẩu"
              leadingIcon="lock-reset"
            />
            <Menu.Item
              onPress={() => {
                handleSendMessage(item);
              }}
              title="Gửi tin nhắn"
              leadingIcon="message-text"
            />
            <Menu.Item
              onPress={() => {
                handleToggleRole(item);
                toggleMenu(item.id);
              }}
              title={item.role === 'admin' ? 'Bỏ quyền admin' : 'Cấp quyền admin'}
            />
            <Menu.Item
              onPress={() => {
                handleDelete(item.id);
                toggleMenu(item.id);
              }}
              title="Xóa người dùng"
              titleStyle={{ color: colors.error }}
              leadingIcon="delete"
            />
          </Menu>
        </View>
      </Card.Content>
    </Card>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.filters}>
        <View style={styles.searchAndButtonRow}>
          <Searchbar
            placeholder="Tìm kiếm người dùng..."
            onChangeText={setSearchQuery}
            value={searchQuery}
            style={[styles.searchbar, { flex: 1 }]}
          />
          <Button
            mode="contained"
            icon="message-text"
            onPress={() => setSendMessageToAllModalVisible(true)}
            style={styles.sendToAllButton}
            compact
          >
            Gửi tất cả
          </Button>
        </View>
        <View style={styles.filterChips}>
          <Chip
            selected={roleFilter === ''}
            onPress={() => setRoleFilter('')}
            style={styles.filterChip}
          >
            Tất cả
          </Chip>
          <Chip
            selected={roleFilter === 'admin'}
            onPress={() => setRoleFilter(roleFilter === 'admin' ? '' : 'admin')}
            style={styles.filterChip}
          >
            Admin
          </Chip>
          <Chip
            selected={roleFilter === 'user'}
            onPress={() => setRoleFilter(roleFilter === 'user' ? '' : 'user')}
            style={styles.filterChip}
          >
            User
          </Chip>
        </View>
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={data?.users || []}
          renderItem={renderUser}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={{ paddingBottom: insets.bottom + spacing.lg }}
          refreshControl={
            <RefreshControl refreshing={false} onRefresh={refetch} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                Không có người dùng nào
              </Text>
            </View>
          }
        />
      )}

      {/* Edit Modal */}
      <Portal>
        <Modal
          visible={editModalVisible}
          onDismiss={() => {
            setEditModalVisible(false);
            setSelectedUser(null);
          }}
          contentContainerStyle={[
            styles.modalContainer,
            { backgroundColor: colors.surface }
          ]}
        >
          <ScrollView>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              Chỉnh sửa người dùng
            </Text>

            <TextInput
              label="Tên đầy đủ"
              value={editForm.full_name}
              onChangeText={(text) => setEditForm(prev => ({ ...prev, full_name: text }))}
              mode="outlined"
              style={styles.input}
              theme={{ colors: { primary: colors.primary } }}
            />

            <TextInput
              label="Email"
              value={editForm.email}
              onChangeText={(text) => setEditForm(prev => ({ ...prev, email: text }))}
              mode="outlined"
              keyboardType="email-address"
              autoCapitalize="none"
              style={styles.input}
              theme={{ colors: { primary: colors.primary } }}
            />

            <TextInput
              label="Số điện thoại"
              value={editForm.phone}
              onChangeText={(text) => setEditForm(prev => ({ ...prev, phone: text }))}
              mode="outlined"
              keyboardType="phone-pad"
              style={styles.input}
              theme={{ colors: { primary: colors.primary } }}
            />

            <View style={styles.selectContainer}>
              <Text style={[styles.label, { color: colors.text }]}>Role</Text>
              <View style={styles.roleButtons}>
                <TouchableOpacity
                  style={[
                    styles.roleButton,
                    editForm.role === 'user' && styles.roleButtonActive,
                    { borderColor: colors.primary }
                  ]}
                  onPress={() => setEditForm(prev => ({ ...prev, role: 'user' }))}
                >
                  <Text style={[
                    styles.roleButtonText,
                    { color: editForm.role === 'user' ? colors.primary : colors.textSecondary }
                  ]}>
                    User
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.roleButton,
                    editForm.role === 'admin' && styles.roleButtonActive,
                    { borderColor: colors.primary }
                  ]}
                  onPress={() => setEditForm(prev => ({ ...prev, role: 'admin' }))}
                >
                  <Text style={[
                    styles.roleButtonText,
                    { color: editForm.role === 'admin' ? colors.primary : colors.textSecondary }
                  ]}>
                    Admin
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.selectContainer}>
              <Text style={[styles.label, { color: colors.text }]}>Status</Text>
              <View style={styles.statusButtons}>
                {['online', 'offline', 'away', 'recently_active'].map((status) => (
                  <TouchableOpacity
                    key={status}
                    style={[
                      styles.statusButton,
                      editForm.status === status && styles.statusButtonActive,
                      { borderColor: colors.primary }
                    ]}
                    onPress={() => setEditForm(prev => ({ ...prev, status }))}
                  >
                    <Text style={[
                      styles.statusButtonText,
                      { color: editForm.status === status ? colors.primary : colors.textSecondary }
                    ]}>
                      {status === 'recently_active' ? 'Recently Active' : status.charAt(0).toUpperCase() + status.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.modalActions}>
              <Button
                mode="outlined"
                onPress={() => {
                  setEditModalVisible(false);
                  setSelectedUser(null);
                }}
                style={styles.modalButton}
              >
                Hủy
              </Button>
              <Button
                mode="contained"
                onPress={handleSaveEdit}
                loading={updateUserMutation.isPending}
                disabled={updateUserMutation.isPending}
                style={styles.modalButton}
              >
                Lưu
              </Button>
            </View>
          </ScrollView>
        </Modal>

        {/* Send Message Modal */}
        <Modal
          visible={sendMessageModalVisible}
          onDismiss={() => {
            setSendMessageModalVisible(false);
            setSelectedUser(null);
            setMessageContent('');
          }}
          contentContainerStyle={[
            styles.modalContainer,
            { backgroundColor: colors.surface }
          ]}
        >
          <ScrollView>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              Gửi tin nhắn thông báo
            </Text>
            {selectedUser && (
              <Text style={[styles.modalSubtitle, { color: colors.textSecondary }]}>
                Đến: {selectedUser.full_name || selectedUser.username}
              </Text>
            )}
            <TextInput
              label="Nội dung tin nhắn"
              value={messageContent}
              onChangeText={setMessageContent}
              mode="outlined"
              multiline
              numberOfLines={6}
              style={[styles.input, { backgroundColor: colors.background }]}
              placeholder="Nhập nội dung tin nhắn thông báo..."
              theme={{ colors: { text: colors.text, primary: colors.primary, placeholder: colors.textSecondary } }}
            />
            <View style={styles.modalActions}>
              <Button
                mode="outlined"
                onPress={() => {
                  setSendMessageModalVisible(false);
                  setSelectedUser(null);
                  setMessageContent('');
                }}
                style={styles.modalButton}
              >
                Hủy
              </Button>
              <Button
                mode="contained"
                onPress={handleSendMessageSubmit}
                loading={sendMessageMutation.isPending}
                disabled={sendMessageMutation.isPending || !messageContent.trim()}
                style={styles.modalButton}
              >
                Gửi
              </Button>
            </View>
          </ScrollView>
        </Modal>

        {/* Reset Password Modal */}
        <Modal
          visible={resetPasswordModalVisible}
          onDismiss={() => {
            setResetPasswordModalVisible(false);
            setSelectedUser(null);
            setNewPassword('');
            setConfirmPassword('');
          }}
          contentContainerStyle={[
            styles.modalContainer,
            { backgroundColor: colors.surface }
          ]}
        >
          <ScrollView>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              Đổi mật khẩu
            </Text>
            {selectedUser && (
              <Text style={[styles.modalSubtitle, { color: colors.textSecondary }]}>
                Người dùng: {selectedUser.full_name || selectedUser.username}
              </Text>
            )}

            <TextInput
              label="Mật khẩu mới"
              value={newPassword}
              onChangeText={setNewPassword}
              mode="outlined"
              secureTextEntry
              style={styles.input}
              theme={{ colors: { primary: colors.primary } }}
              placeholder="Nhập mật khẩu mới (tối thiểu 6 ký tự)"
            />

            <TextInput
              label="Xác nhận mật khẩu"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              mode="outlined"
              secureTextEntry
              style={styles.input}
              theme={{ colors: { primary: colors.primary } }}
              placeholder="Nhập lại mật khẩu mới"
            />

            <Text style={[styles.passwordHint, { color: colors.textSecondary }]}>
              Mật khẩu phải có ít nhất 6 ký tự
            </Text>

            <View style={styles.modalActions}>
              <Button
                mode="outlined"
                onPress={() => {
                  setResetPasswordModalVisible(false);
                  setSelectedUser(null);
                  setNewPassword('');
                  setConfirmPassword('');
                }}
                style={styles.modalButton}
              >
                Hủy
              </Button>
              <Button
                mode="contained"
                onPress={handleSaveResetPassword}
                loading={resetPasswordMutation.isPending}
                disabled={resetPasswordMutation.isPending}
                style={styles.modalButton}
              >
                Đổi mật khẩu
              </Button>
            </View>
          </ScrollView>
        </Modal>

        {/* Send Message To All Modal */}
        <Modal
          visible={sendMessageToAllModalVisible}
          onDismiss={() => {
            setSendMessageToAllModalVisible(false);
            setMessageToAllContent('');
          }}
          contentContainerStyle={[
            styles.modalContainer,
            { backgroundColor: colors.surface }
          ]}
        >
          <ScrollView>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              Gửi tin nhắn đến tất cả người dùng
            </Text>
            <Text style={[styles.modalSubtitle, { color: colors.textSecondary }]}>
              Tin nhắn sẽ được gửi đến tất cả người dùng đang hoạt động
            </Text>
            <TextInput
              label="Nội dung tin nhắn"
              value={messageToAllContent}
              onChangeText={setMessageToAllContent}
              mode="outlined"
              multiline
              numberOfLines={6}
              style={[styles.input, { backgroundColor: colors.background }]}
              placeholder="Nhập nội dung tin nhắn thông báo..."
              theme={{ colors: { text: colors.text, primary: colors.primary, placeholder: colors.textSecondary } }}
            />
            <View style={styles.modalActions}>
              <Button
                mode="outlined"
                onPress={() => {
                  setSendMessageToAllModalVisible(false);
                  setMessageToAllContent('');
                }}
                style={styles.modalButton}
              >
                Hủy
              </Button>
              <Button
                mode="contained"
                onPress={handleSendMessageToAllSubmit}
                loading={sendMessageToAllMutation.isPending}
                disabled={sendMessageToAllMutation.isPending || !messageToAllContent.trim()}
                style={styles.modalButton}
              >
                Gửi đến tất cả
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
  searchAndButtonRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'center',
  },
  searchbar: {
    marginBottom: spacing.xs,
  },
  sendToAllButton: {
    marginBottom: spacing.xs,
  },
  filterChips: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  filterChip: {
    marginRight: spacing.xs,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  userCard: {
    margin: spacing.base,
    marginTop: 0,
  },
  userHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    marginBottom: spacing.xs / 2,
  },
  userEmail: {
    fontSize: typography.fontSize.sm,
    marginBottom: spacing.xs,
  },
  userMeta: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  chip: {
    height: 24,
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
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    marginBottom: spacing.sm,
  },
  modalSubtitle: {
    fontSize: typography.fontSize.base,
    marginBottom: spacing.md,
  },
  input: {
    marginBottom: spacing.md,
  },
  passwordHint: {
    fontSize: typography.fontSize.sm,
    marginBottom: spacing.md,
    fontStyle: 'italic',
  },
  selectContainer: {
    marginBottom: spacing.md,
  },
  label: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    marginBottom: spacing.sm,
  },
  roleButtons: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  roleButton: {
    flex: 1,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    alignItems: 'center',
  },
  roleButtonActive: {
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
  },
  roleButtonText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
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
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
  },
  statusButtonText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
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
  modalSubtitle: {
    fontSize: typography.fontSize.sm,
    marginBottom: spacing.md,
  },
  passwordHint: {
    fontSize: typography.fontSize.xs,
    marginTop: -spacing.sm,
    marginBottom: spacing.md,
    fontStyle: 'italic',
  },
});

export default AdminUsersScreen;

