import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { Text, Avatar } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { ProfileStackParamList } from '../../navigation/types';
import { getAvatarURL } from '../../utils/imageUtils';
import { getInitials } from '../../utils/nameUtils';
import { useTheme } from '../../contexts/ThemeContext';
import { PWATheme } from '../../config/PWATheme';

type ProfileScreenNavigationProp = StackNavigationProp<ProfileStackParamList>;

interface MenuItem {
  id: string;
  icon: string;
  title: string;
  rightText?: string;
  onPress: () => void;
  isDanger?: boolean;
}

interface MenuGroup {
  items: MenuItem[];
}

const ProfileScreen = () => {
  const { user, logout } = useAuth();
  const navigation = useNavigation<ProfileScreenNavigationProp>();
  const { colors, themeMode } = useTheme();
  const [isScrolled, setIsScrolled] = useState(false);

  const handleMenuPress = (menuId: string) => {
    switch (menuId) {
      case 'profile-info':
        navigation.navigate('ProfileInformation');
        break;
      case 'status-feed':
        // Navigate to status feed
        break;
      case 'activity-status':
        // Navigate to activity status
        break;
      case 'message-filter':
        // Navigate to message filter
        break;
      case 'saved-messages':
        // Navigate to saved messages
        break;
      case 'device-management':
        // Navigate to device management
        break;
      case 'security':
        navigation.navigate('Settings');
        break;
      case 'resource-management':
        // Navigate to resource management
        break;
      case 'notifications':
        // Navigate to notifications
        break;
      case 'interface':
        // Navigate to interface settings
        break;
      case 'font-size':
        // Navigate to font size settings
        break;
      case 'feedback':
        // Navigate to feedback
        break;
      case 'help':
        // Navigate to help
        break;
      case 'logout':
        logout();
        break;
      default:
        break;
    }
  };

  const menuGroups: MenuGroup[] = [
    {
      items: [
        {
          id: 'profile-info',
          icon: 'account',
          title: 'Hồ sơ thông tin',
          onPress: () => handleMenuPress('profile-info'),
        },
      ],
    },
    {
      items: [
        {
          id: 'status-feed',
          icon: 'file-document-outline',
          title: 'Dòng trạng thái',
          onPress: () => handleMenuPress('status-feed'),
        },
        {
          id: 'activity-status',
          icon: 'pulse',
          title: 'Trạng thái hoạt động',
          rightText: 'Bật',
          onPress: () => handleMenuPress('activity-status'),
        },
      ],
    },
    {
      items: [
        {
          id: 'message-filter',
          icon: 'filter-outline',
          title: 'Bộ lọc tin nhắn',
          onPress: () => handleMenuPress('message-filter'),
        },
        {
          id: 'saved-messages',
          icon: 'bookmark-outline',
          title: 'Tin nhắn lưu',
          onPress: () => handleMenuPress('saved-messages'),
        },
      ],
    },
    {
      items: [
        {
          id: 'device-management',
          icon: 'monitor',
          title: 'Quản lý thiết bị',
          onPress: () => handleMenuPress('device-management'),
        },
        {
          id: 'security',
          icon: 'shield-check-outline',
          title: 'Bảo mật & An toàn',
          onPress: () => handleMenuPress('security'),
        },
        {
          id: 'resource-management',
          icon: 'database',
          title: 'Quản lý tài nguyên',
          onPress: () => handleMenuPress('resource-management'),
        },
      ],
    },
    {
      items: [
        {
          id: 'notifications',
          icon: 'bell-outline',
          title: 'Thông báo & âm thanh',
          onPress: () => handleMenuPress('notifications'),
        },
        {
          id: 'interface',
          icon: 'brightness-6',
          title: 'Giao diện',
          rightText: themeMode === 'light' ? 'Sáng' : themeMode === 'dark' ? 'Tối' : 'Hệ thống',
          onPress: () => navigation.navigate('InterfaceSettings'),
        },
        {
          id: 'font-size',
          icon: 'format-size',
          title: 'Kích thước chữ',
          onPress: () => handleMenuPress('font-size'),
        },
      ],
    },
    {
      items: [
        {
          id: 'feedback',
          icon: 'message-outline',
          title: 'Góp ý',
          onPress: () => handleMenuPress('feedback'),
        },
        {
          id: 'help',
          icon: 'help-circle-outline',
          title: 'Hướng dẫn sử dụng',
          onPress: () => handleMenuPress('help'),
        },
        {
          id: 'logout',
          icon: 'logout',
          title: 'Đăng xuất',
          onPress: () => handleMenuPress('logout'),
          isDanger: true,
        },
      ],
    },
  ];

  const userName = user?.full_name || user?.username || 'Người dùng';
  const userUsername = user?.username || '';

  const dynamicStyles = createStyles(colors);

  return (
    <SafeAreaView style={dynamicStyles.container} edges={['top']}>
      {/* Header */}
      <View style={dynamicStyles.header}>
        <TouchableOpacity
          style={dynamicStyles.backButton}
          onPress={() => navigation.goBack()}
        >
          <MaterialCommunityIcons name="chevron-left" size={24} color={colors.text} />
        </TouchableOpacity>

        <View style={dynamicStyles.headerProfile}>
          <View style={[dynamicStyles.avatarWrapper, isScrolled && dynamicStyles.avatarWrapperScrolled]}>
          {user?.avatar_url ? (
            <Image
              source={{ uri: getAvatarURL(user.avatar_url) }}
                style={dynamicStyles.headerAvatar}
            />
          ) : (
              <Avatar.Text
                size={64}
                label={getInitials(userName)}
                style={dynamicStyles.headerAvatar}
              />
            )}
            {/* Camera button for changing avatar */}
            <TouchableOpacity
              style={[dynamicStyles.cameraButton, { backgroundColor: colors.primary }]}
              onPress={() => navigation.navigate('EditProfile')}
            >
              <MaterialCommunityIcons name="camera" size={12} color="#fff" />
            </TouchableOpacity>
            </View>
          <View style={dynamicStyles.headerInfo}>
            <Text style={[dynamicStyles.headerName, { color: colors.text }]} numberOfLines={1}>
              {userName}
            </Text>
            {userUsername && (
              <Text style={[dynamicStyles.headerUsername, { color: colors.textSecondary }]} numberOfLines={1}>
                {userUsername}
            </Text>
          )}
          </View>
        </View>

        <TouchableOpacity style={dynamicStyles.qrButton}>
          <MaterialCommunityIcons name="qrcode-scan" size={24} color={colors.text} />
        </TouchableOpacity>
      </View>

      {/* Menu Section */}
      <ScrollView
        style={dynamicStyles.menuSection}
        onScroll={(event) => {
          const offsetY = event.nativeEvent.contentOffset.y;
          setIsScrolled(offsetY > 10);
        }}
        scrollEventThrottle={16}
      >
        {menuGroups.map((group, groupIndex) => (
          <View key={groupIndex} style={[dynamicStyles.menuGroup, { backgroundColor: colors.surface }]}>
            {group.items.map((item, itemIndex) => (
              <TouchableOpacity
                key={item.id}
                style={[
                  dynamicStyles.menuItem,
                  itemIndex === group.items.length - 1 && dynamicStyles.menuItemLast,
                ]}
                onPress={item.onPress}
              >
                <View style={dynamicStyles.menuIcon}>
                  <MaterialCommunityIcons
                    name={item.icon as any}
                    size={20}
                    color={item.isDanger ? colors.error : colors.text}
                  />
                </View>
                <Text
                  style={[
                    dynamicStyles.menuTitle,
                    { color: colors.text },
                    item.isDanger && dynamicStyles.menuTitleDanger,
                  ]}
                >
                  {item.title}
                </Text>
                {item.rightText && (
                  <Text style={[dynamicStyles.menuRight, { color: colors.textSecondary }]}>{item.rightText}</Text>
                )}
                {!item.rightText && (
                  <MaterialCommunityIcons
                    name="chevron-right"
                    size={20}
                    color={colors.textSecondary}
                  />
                )}
              </TouchableOpacity>
            ))}
          </View>
        ))}

        {/* Footer */}
        <View style={dynamicStyles.footer}>
          <Text style={[dynamicStyles.footerText, { color: colors.textSecondary }]}>
            Zyea+ © 2025{'\n'}
            Phiên bản 1.0.0
          </Text>
        </View>
    </ScrollView>
    </SafeAreaView>
  );
};

const createStyles = (colors: typeof PWATheme.light) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    backgroundColor: 'transparent',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  backButton: {
    padding: 8,
  },
  headerProfile: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  avatarWrapper: {
    position: 'relative',
    width: 64,
    height: 64,
    opacity: 1,
  },
  avatarWrapperScrolled: {
    width: 0,
    height: 0,
    opacity: 0,
  },
  headerAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
  },
  cameraButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.surface,
  },
  headerInfo: {
    alignItems: 'center',
  },
  headerName: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000',
    maxWidth: 200,
  },
  headerUsername: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
    maxWidth: 200,
  },
  qrButton: {
    padding: 8,
  },
  menuSection: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 20,
  },
  menuGroup: {
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
  },
  menuItem: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  menuItemLast: {
    borderBottomWidth: 0,
  },
  menuIcon: {
    width: 24,
    alignItems: 'center',
  },
  menuTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: '400',
  },
  menuTitleDanger: {
    color: colors.error,
  },
  menuRight: {
    fontSize: 14,
    marginRight: 4,
  },
  footer: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
  },
});

export default ProfileScreen;
