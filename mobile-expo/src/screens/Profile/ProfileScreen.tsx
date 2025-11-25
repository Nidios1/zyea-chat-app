import React from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Image, Alert } from 'react-native';
import { Text, Avatar, Divider, useTheme } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { ProfileStackParamList } from '../../navigation/types';
import { useTheme as useAppTheme } from '../../contexts/ThemeContext';
import { getAvatarURL, getInitials } from '../../utils/imageUtils';
import { spacing, typography, borderRadius } from '../../config/designTokens';

type ProfileScreenNavigationProp = StackNavigationProp<ProfileStackParamList>;

const ProfileScreen = () => {
  const theme = useTheme();
  const { user, logout } = useAuth();
  const navigation = useNavigation<ProfileScreenNavigationProp>();
  const { colors, isDarkMode } = useAppTheme();

  const handleLogout = () => {
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
              await logout(true);
            } catch (error) {
              console.error('Logout error:', error);
              Alert.alert('Lỗi', 'Không thể đăng xuất. Vui lòng thử lại.');
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

  const handleUserCardPress = () => {
    try {
      navigation.navigate('MyProfile' as never);
    } catch (error) {
      console.error('Navigation error:', error);
    }
  };

  const handleQRScannerPress = (e: any) => {
    e.stopPropagation(); // Ngăn trigger user card press
    try {
      navigation.navigate('QRScanner');
    } catch (error) {
      console.error('Navigation error:', error);
    }
  };

  // Nhóm menu items theo sections
  const menuSections = [
    {
      id: 'management',
      items: [
        {
          id: 'activityStatus',
          icon: 'account-clock-outline',
          label: 'Trạng thái hoạt động',
          onPress: () => {
            try {
              navigation.navigate('ActivityStatus');
            } catch (error) {
              console.error('Navigation error:', error);
            }
          },
        },
        {
          id: 'deviceManagement',
          icon: 'devices',
          label: 'Quản lý thiết bị',
          onPress: () => {
            try {
              navigation.navigate('DeviceManagement');
            } catch (error) {
              console.error('Navigation error:', error);
            }
          },
        },
        {
          id: 'statusFeed',
          icon: 'newspaper-variant-outline',
          label: 'Trạng thái feed',
          onPress: () => {
            try {
              navigation.navigate('StatusFeed');
            } catch (error) {
              console.error('Navigation error:', error);
            }
          },
        },
      ],
    },
    {
      id: 'settings',
      items: [
        {
          id: 'settings',
          icon: 'cog-outline',
          label: 'Cài đặt',
          onPress: () => {
            try {
              navigation.navigate('Settings');
            } catch (error) {
              console.error('Navigation error:', error);
            }
          },
        },
        {
          id: 'interfaceSettings',
          icon: 'palette-outline',
          label: 'Giao diện',
          onPress: () => {
            try {
              navigation.navigate('InterfaceSettings');
            } catch (error) {
              console.error('Navigation error:', error);
            }
          },
        },
        {
          id: 'security',
          icon: 'shield-lock-outline',
          label: 'Bảo mật',
          onPress: () => {
            try {
              navigation.navigate('Security');
            } catch (error) {
              console.error('Navigation error:', error);
            }
          },
        },
        {
          id: 'privacy',
          icon: 'lock-outline',
          label: 'Quyền riêng tư',
          onPress: () => {
            try {
              navigation.navigate('Privacy');
            } catch (error) {
              console.error('Navigation error:', error);
            }
          },
        },
      ],
    },
    {
      id: 'support',
      items: [
        {
          id: 'help',
          icon: 'help-circle-outline',
          label: 'Trợ giúp',
          onPress: () => {
            try {
              navigation.navigate('Help');
            } catch (error) {
              console.error('Navigation error:', error);
            }
          },
        },
        {
          id: 'feedback',
          icon: 'message-text-outline',
          label: 'Phản hồi',
          onPress: () => {
            try {
              navigation.navigate('Feedback');
            } catch (error) {
              console.error('Navigation error:', error);
            }
          },
        },
        {
          id: 'appInfo',
          icon: 'information-outline',
          label: 'Thông tin ứng dụng',
          onPress: () => {
            try {
              navigation.navigate('AppInfo');
            } catch (error) {
              console.error('Navigation error:', error);
            }
          },
        },
      ],
    },
    {
      id: 'logout',
      items: [
        {
          id: 'logout',
          icon: 'logout',
          label: 'Đăng xuất',
          onPress: handleLogout,
          isDestructive: true,
        },
      ],
    },
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* User Card */}
        <TouchableOpacity
          style={[styles.userCard, { backgroundColor: colors.surface }]}
          onPress={handleUserCardPress}
          activeOpacity={0.7}
        >
          <View style={styles.userCardContent}>
            {user?.avatar_url ? (
              <Image
                source={{ uri: getAvatarURL(user.avatar_url) }}
                style={styles.avatar}
              />
            ) : (
              <Avatar.Text
                size={64}
                label={getInitials(user?.full_name || user?.username || 'U')}
                style={[styles.avatar, { backgroundColor: colors.primary || '#0084ff' }]}
              />
            )}
            <View style={styles.userInfo}>
              <Text style={[styles.userName, { color: colors.text }]} numberOfLines={1}>
                {user?.full_name || user?.username || 'Người dùng'}
              </Text>
              {user?.username && (
                <Text style={[styles.userHandle, { color: colors.textSecondary }]} numberOfLines={1}>
                  @{user.username}
                </Text>
              )}
            </View>
            <TouchableOpacity
              style={styles.qrButton}
              onPress={handleQRScannerPress}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons
                name="qrcode-scan"
                size={24}
                color={colors.text}
              />
            </TouchableOpacity>
            <MaterialCommunityIcons
              name="chevron-right"
              size={24}
              color={colors.textSecondary}
            />
          </View>
        </TouchableOpacity>

        {/* Menu Sections */}
        {menuSections.map((section, sectionIndex) => (
          <View 
            key={section.id} 
            style={[
              styles.menuContainer, 
              { 
                backgroundColor: colors.surface,
                borderColor: colors.border || (isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'),
                marginTop: sectionIndex > 0 ? spacing.md : spacing.base,
              }
            ]}
          >
            {section.items.map((item, itemIndex) => {
              const isDestructive = (item as any).isDestructive;
              const itemColor = isDestructive ? (colors.error || '#ff4444') : colors.text;
              
              return (
                <React.Fragment key={item.id}>
                  <TouchableOpacity
                    style={styles.menuItem}
                    onPress={item.onPress}
                    activeOpacity={0.7}
                  >
                    <View style={styles.menuItemLeft}>
                      <MaterialCommunityIcons
                        name={item.icon as any}
                        size={24}
                        color={itemColor}
                      />
                      <Text style={[styles.menuItemLabel, { color: itemColor }]}>
                        {item.label}
                      </Text>
                    </View>
                    {!isDestructive && (
                      <MaterialCommunityIcons
                        name="chevron-right"
                        size={20}
                        color={colors.textSecondary}
                      />
                    )}
                  </TouchableOpacity>
                  {itemIndex < section.items.length - 1 && (
                    <Divider style={[styles.divider, { backgroundColor: colors.border }]} />
                  )}
                </React.Fragment>
              );
            })}
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  userCard: {
    margin: spacing.base,
    borderRadius: borderRadius.lg,
    padding: spacing.base,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  userCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    marginRight: spacing.base,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    marginBottom: spacing.xs,
  },
  userHandle: {
    fontSize: typography.fontSize.base,
  },
  qrButton: {
    padding: spacing.xs,
    marginRight: spacing.sm,
  },
  menuContainer: {
    marginHorizontal: spacing.base,
    marginVertical: spacing.sm,
    borderRadius: borderRadius.xl, // Tăng border radius để bo góc rõ ràng hơn
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    borderWidth: 1,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.base,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  menuItemLabel: {
    fontSize: typography.fontSize.base,
    marginLeft: spacing.base,
    flex: 1,
  },
  divider: {
    marginLeft: spacing.base + 24 + spacing.base, // Icon width + margin + label margin
  },
});

export default ProfileScreen;

