import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Modal, TouchableOpacity, TouchableWithoutFeedback, ScrollView } from 'react-native';
import { Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigation } from '@react-navigation/native';
import { PWATheme } from '../../config/PWATheme';
import { spacing, typography, borderRadius, borderWidth } from '../../config/designTokens';
import { ProfileStackParamList } from '../../navigation/types';
import { StackNavigationProp } from '@react-navigation/stack';
import { Alert } from 'react-native';
import { friendsAPI } from '../../utils/api';
import Toast from 'react-native-toast-message';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { isAdmin } from '../../utils/adminUtils';

type ProfileMenuNavigationProp = StackNavigationProp<ProfileStackParamList>;

interface ProfileMenuProps {
  visible: boolean;
  onClose: () => void;
  isMe?: boolean;
  profileUserId?: string;
  userName?: string;
  isBlocked?: boolean;
  isMuted?: boolean;
  isVerified?: boolean; // Whether the user is already verified
  onBlockChange?: () => void;
  onMuteChange?: () => void;
  onReport?: () => void;
  onVerificationRequest?: () => void; // Callback to open verification request modal
}

export function ProfileMenu({ 
  visible, 
  onClose, 
  isMe = false, 
  profileUserId,
  userName,
  isBlocked = false,
  isMuted = false,
  isVerified = false,
  onBlockChange,
  onMuteChange,
  onReport,
  onVerificationRequest,
}: ProfileMenuProps) {
  const { colors, isDarkMode } = useTheme();
  const { logout, user } = useAuth();
  const navigation = useNavigation<ProfileMenuNavigationProp>();
  const insets = useSafeAreaInsets();
  const [isBlocking, setIsBlocking] = useState(false);
  const [isMuting, setIsMuting] = useState(false);
  const userIsAdmin = isAdmin(user);

  // Debug: Log admin status
  useEffect(() => {
    if (isMe && user) {
      console.log('🔍 [ProfileMenu] Admin check:', {
        userId: user.id,
        username: user.username,
        role: user.role,
        is_admin: user.is_admin,
        isAdmin: user.isAdmin,
        userIsAdmin,
        userObject: user,
      });
    }
  }, [isMe, user, userIsAdmin]);

  const handleSettings = () => {
    onClose();
    navigation.navigate('Settings');
  };

  const handleInterfaceSettings = () => {
    onClose();
    navigation.navigate('InterfaceSettings');
  };

  const handleFontSizeSettings = () => {
    onClose();
    navigation.navigate('FontSizeSettings');
  };

  const handleActivityStatus = () => {
    onClose();
    navigation.navigate('ActivityStatus');
  };

  const handleSecurity = () => {
    onClose();
    navigation.navigate('Security');
  };

  const handlePrivacy = () => {
    onClose();
    navigation.navigate('Privacy');
  };

  const handleDeviceManagement = () => {
    onClose();
    navigation.navigate('DeviceManagement');
  };

  const handleAppInfo = () => {
    onClose();
    navigation.navigate('AppInfo');
  };

  const handleFeedback = () => {
    onClose();
    navigation.navigate('Feedback');
  };

  const handleAdmin = () => {
    onClose();
    navigation.navigate('Admin');
  };

  const handleLogout = () => {
    onClose();
    Alert.alert(
      'Đăng xuất',
      'Bạn có chắc chắn muốn đăng xuất?',
      [
        {
          text: 'Hủy',
          style: 'cancel',
        },
        {
          text: 'Đăng xuất',
          style: 'destructive',
          onPress: async () => {
            try {
              await logout();
            } catch (error) {
              console.error('Logout error:', error);
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

  const handleMute = async () => {
    if (!profileUserId) return;
    
    onClose();
    setIsMuting(true);
    try {
      if (isMuted) {
        await friendsAPI.unmute(profileUserId);
        Toast.show({
          type: 'success',
          text1: 'Đã bỏ tắt tiếng',
          text2: `Bạn đã bỏ tắt tiếng ${userName || 'người dùng này'}`,
        });
      } else {
        await friendsAPI.mute(profileUserId);
        Toast.show({
          type: 'success',
          text1: 'Đã tắt tiếng',
          text2: `Bạn đã tắt tiếng ${userName || 'người dùng này'}`,
        });
      }
      onMuteChange?.();
    } catch (error: any) {
      console.error('Error muting/unmuting user:', error);
      Toast.show({
        type: 'error',
        text1: 'Lỗi',
        text2: error?.response?.data?.message || 'Không thể thực hiện thao tác này',
      });
    } finally {
      setIsMuting(false);
    }
  };

  const handleBlock = () => {
    if (!profileUserId) return;
    
    onClose();
    Alert.alert(
      isBlocked ? 'Bỏ chặn tài khoản?' : 'Chặn tài khoản?',
      isBlocked
        ? `${userName || 'Tài khoản này'} sẽ có thể tương tác với bạn sau khi bỏ chặn.`
        : `Tài khoản bị chặn không thể trả lời trong bài viết của bạn, nhắc đến bạn hoặc tương tác với bạn.`,
      [
        {
          text: 'Hủy',
          style: 'cancel',
        },
        {
          text: isBlocked ? 'Bỏ chặn' : 'Chặn',
          style: isBlocked ? 'default' : 'destructive',
          onPress: async () => {
            setIsBlocking(true);
            try {
              if (isBlocked) {
                await friendsAPI.unblock(profileUserId);
                Toast.show({
                  type: 'success',
                  text1: 'Đã bỏ chặn',
                  text2: `Bạn đã bỏ chặn ${userName || 'tài khoản này'}`,
                });
              } else {
                await friendsAPI.block(profileUserId);
                Toast.show({
                  type: 'success',
                  text1: 'Đã chặn',
                  text2: `Bạn đã chặn ${userName || 'tài khoản này'}`,
                });
              }
              onBlockChange?.();
            } catch (error: any) {
              console.error('Error blocking/unblocking user:', error);
              Toast.show({
                type: 'error',
                text1: 'Lỗi',
                text2: error?.response?.data?.message || 'Không thể thực hiện thao tác này',
              });
            } finally {
              setIsBlocking(false);
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

  const handleReport = () => {
    if (!profileUserId) return;
    // Đóng ProfileMenu ngay lập tức
    onClose();
    // Sử dụng callback nếu có
    if (onReport) {
      // Đợi đủ lâu để ProfileMenu animation đóng hoàn toàn (Modal animation thường ~300ms)
      setTimeout(() => {
        onReport();
      }, 400);
    }
  };

  const menuItems = isMe
    ? [
        // === CÀI ĐẶT CHÍNH ===
        {
          icon: 'cog-outline',
          label: 'Cài đặt',
          onPress: handleSettings,
          color: colors.text,
        },
        // === TÙY CHỈNH GIAO DIỆN ===
        {
          icon: 'palette-outline',
          label: 'Giao diện',
          onPress: handleInterfaceSettings,
          color: colors.text,
        },
        {
          icon: 'format-size',
          label: 'Kích thước chữ',
          onPress: handleFontSizeSettings,
          color: colors.text,
        },
        // === BẢO MẬT & QUYỀN RIÊNG TƯ ===
        {
          icon: 'shield-lock-outline',
          label: 'Bảo mật',
          onPress: handleSecurity,
          color: colors.text,
        },
        {
          icon: 'lock-outline',
          label: 'Quyền riêng tư',
          onPress: handlePrivacy,
          color: colors.text,
        },
        // === TRẠNG THÁI & THIẾT BỊ ===
        {
          icon: 'circle-outline',
          label: 'Trạng thái hoạt động',
          onPress: handleActivityStatus,
          color: colors.text,
        },
        {
          icon: 'devices',
          label: 'Quản lý thiết bị',
          onPress: handleDeviceManagement,
          color: colors.text,
        },
        // === TÀI KHOẢN & XÁC MINH ===
        // Chỉ hiển thị nếu chưa được xác minh (chỉ cho phép xác minh 1 lần)
        ...(!isVerified ? [{
          icon: 'check-circle-outline' as const,
          label: 'Yêu cầu xác minh',
          onPress: () => {
            onClose();
            onVerificationRequest?.();
          },
          color: colors.text,
        }] : []),
        // === HỖ TRỢ & PHẢN HỒI ===
        {
          icon: 'message-text-outline',
          label: 'Góp ý & phản hồi',
          onPress: handleFeedback,
          color: colors.text,
        },
        {
          icon: 'information-outline',
          label: 'Thông tin ứng dụng',
          onPress: handleAppInfo,
          color: colors.text,
        },
        // === QUẢN TRỊ (CHỈ ADMIN) ===
        ...(userIsAdmin ? [{
          icon: 'shield-account' as const,
          label: 'Quản lý Server',
          onPress: handleAdmin,
          color: colors.primary,
        }] : []),
        // === ĐĂNG XUẤT (CUỐI CÙNG) ===
        {
          icon: 'logout',
          label: 'Đăng xuất',
          onPress: handleLogout,
          color: colors.error || '#ff4444',
        },
      ]
    : [
        {
          icon: isMuted ? 'volume-high' : 'volume-off',
          label: isMuted ? 'Bỏ tắt tiếng' : 'Tắt tiếng',
          onPress: handleMute,
          color: colors.text,
          disabled: isMuting,
        },
        {
          icon: isBlocked ? 'account-check' : 'block-helper',
          label: isBlocked ? 'Bỏ chặn' : 'Chặn',
          onPress: handleBlock,
          color: isBlocked ? colors.text : (colors.error || '#ff4444'),
          disabled: isBlocking,
        },
        {
          icon: 'flag-outline',
          label: 'Báo cáo',
          onPress: handleReport,
          color: colors.text,
        },
      ];

  const styles = createStyles(colors, isDarkMode);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View style={[styles.menuContainer, { paddingBottom: insets.bottom + spacing.base }]}>
              <ScrollView showsVerticalScrollIndicator={false}>
                {menuItems.map((item, index) => (
                  <React.Fragment key={index}>
                    <TouchableOpacity
                      style={[
                        styles.menuItem,
                        item.disabled && styles.menuItemDisabled
                      ]}
                      onPress={item.disabled ? undefined : item.onPress}
                      activeOpacity={item.disabled ? 1 : 0.7}
                      disabled={item.disabled}
                    >
                      <MaterialCommunityIcons
                        name={item.icon as any}
                        size={24}
                        color={item.disabled ? colors.textSecondary : item.color}
                      />
                      <Text style={[
                        styles.menuItemText, 
                        { 
                          color: item.disabled ? colors.textSecondary : item.color 
                        }
                      ]}>
                        {item.label}
                      </Text>
                      {item.disabled && (
                        <View style={styles.loadingIndicator}>
                          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
                            ...
                          </Text>
                        </View>
                      )}
                    </TouchableOpacity>
                    {index < menuItems.length - 1 && (
                      <View style={styles.divider} />
                    )}
                  </React.Fragment>
                ))}
              </ScrollView>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const createStyles = (colors: typeof PWATheme.light, isDarkMode: boolean) =>
  StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'flex-end',
      paddingBottom: spacing.xl,
    },
    menuContainer: {
      backgroundColor: colors.surface,
      borderTopLeftRadius: borderRadius.lg,
      borderTopRightRadius: borderRadius.lg,
      paddingTop: spacing.md,
      paddingBottom: spacing.base,
      marginHorizontal: spacing.base,
      maxHeight: '80%',
    },
    menuItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: spacing.base,
      paddingVertical: spacing.md,
      gap: spacing.md,
    },
    menuItemDisabled: {
      opacity: 0.5,
    },
    menuItemText: {
      fontSize: typography.fontSize.md,
      fontWeight: typography.fontWeight.medium,
      flex: 1,
    },
    loadingIndicator: {
      marginLeft: spacing.xs,
    },
    loadingText: {
      fontSize: typography.fontSize.sm,
    },
    divider: {
      height: borderWidth.hairline,
      backgroundColor: colors.border || (isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)'),
      marginHorizontal: spacing.base,
    },
  });

