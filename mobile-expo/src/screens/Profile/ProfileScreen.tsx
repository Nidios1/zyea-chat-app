import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  SafeAreaView,
  Animated,
  Modal,
} from 'react-native';
import { Text, Avatar } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { ProfileStackParamList } from '../../navigation/types';
import { getAvatarURL } from '../../utils/imageUtils';
import { getInitials } from '../../utils/nameUtils';
import { useTheme } from '../../contexts/ThemeContext';
import { PWATheme } from '../../config/PWATheme';
import AsyncStorage from '@react-native-async-storage/async-storage';
import appJson from '../../../app.json';

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
  const { colors, themeMode, setThemeMode, isDarkMode } = useTheme();
  const insets = useSafeAreaInsets();
  const [isScrolled, setIsScrolled] = useState(false);
  const [showThemeModal, setShowThemeModal] = useState(false);
  const [activityStatusEnabled, setActivityStatusEnabled] = useState(true);
  const lastScrollY = useRef(0);
  const avatarOpacity = useRef(new Animated.Value(1)).current;
  const avatarScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const loadActivityStatus = async () => {
      try {
        const saved = await AsyncStorage.getItem('activityStatusEnabled');
        if (saved !== null) {
          setActivityStatusEnabled(saved === 'true');
        }
      } catch (error) {
        console.error('Error loading activity status:', error);
      }
    };
    loadActivityStatus();
  }, []);

  // Listen for activity status changes when returning from ActivityStatusScreen
  useFocusEffect(
    useCallback(() => {
      const loadActivityStatus = async () => {
        try {
          const saved = await AsyncStorage.getItem('activityStatusEnabled');
          if (saved !== null) {
            setActivityStatusEnabled(saved === 'true');
          }
        } catch (error) {
          console.error('Error loading activity status:', error);
        }
      };
      loadActivityStatus();
    }, [])
  );

  const handleScroll = useCallback((event: any) => {
    try {
      const offsetY = event.nativeEvent?.contentOffset?.y || 0;
      const shouldBeScrolled = offsetY > 30; // Tăng threshold để tránh toggle quá nhiều
      
      // Chỉ update nếu thay đổi đáng kể (tránh nháy)
      if (Math.abs(offsetY - lastScrollY.current) > 5) {
        if (shouldBeScrolled !== isScrolled) {
          setIsScrolled(shouldBeScrolled);
          
          // Animate avatar với smooth transition
          Animated.parallel([
            Animated.timing(avatarOpacity, {
              toValue: shouldBeScrolled ? 0 : 1,
              duration: 200,
              useNativeDriver: true,
            }),
            Animated.timing(avatarScale, {
              toValue: shouldBeScrolled ? 0 : 1,
              duration: 200,
              useNativeDriver: true,
            }),
          ]).start();
        }
        lastScrollY.current = offsetY;
      }
    } catch (error) {
      // Silently handle scroll errors
      console.warn('Scroll error:', error);
    }
  }, [isScrolled, avatarOpacity, avatarScale]);

  const handleMenuPress = (menuId: string) => {
    switch (menuId) {
      case 'profile-info':
        navigation.navigate('ProfileInformation');
        break;
      case 'status-feed':
        navigation.navigate('StatusFeed');
        break;
      case 'activity-status':
        navigation.navigate('ActivityStatus');
        break;
      case 'message-filter':
        // Navigate to message filter
        break;
      case 'saved-messages':
        // Navigate to saved messages
        break;
      case 'device-management':
        navigation.navigate('DeviceManagement');
        break;
      case 'security':
        navigation.navigate('Security');
        break;
      case 'resource-management':
        navigation.navigate('ResourceManagement');
        break;
      case 'app-info':
        navigation.navigate('AppInfo');
        break;
      case 'notifications':
        // Navigate to notifications
        break;
      case 'interface':
        // Navigate to interface settings
        break;
      case 'font-size':
        navigation.navigate('FontSizeSettings');
        break;
      case 'feedback':
        navigation.navigate('Feedback');
        break;
      case 'help':
        navigation.navigate('Help');
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
          rightText: activityStatusEnabled ? 'Bật' : 'Tắt',
          onPress: () => handleMenuPress('activity-status'),
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
          id: 'interface',
          icon: 'brightness-6',
          title: 'Giao diện',
          rightText: themeMode === 'light' ? 'Sáng' : themeMode === 'dark' ? 'Tối' : 'Hệ thống',
          onPress: () => setShowThemeModal(true),
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
          title: 'Góp ý & phản hồi',
          onPress: () => handleMenuPress('feedback'),
        },
        {
          id: 'help',
          icon: 'help-circle-outline',
          title: 'Hướng dẫn sử dụng',
          onPress: () => handleMenuPress('help'),
        },
        {
          id: 'app-info',
          icon: 'information-outline',
          title: 'Thông tin ứng dụng',
          onPress: () => handleMenuPress('app-info'),
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
          <Animated.View 
            style={[
              dynamicStyles.avatarWrapper,
              {
                opacity: avatarOpacity,
                transform: [{ scale: avatarScale }],
              }
            ]}
          >
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
              style={[
                dynamicStyles.cameraButton, 
                { 
                  backgroundColor: isDarkMode ? '#0084ff' : colors.primary,
                  borderColor: colors.surface,
                }
              ]}
              onPress={() => navigation.navigate('EditProfile')}
            >
              <MaterialCommunityIcons name="camera" size={12} color="#fff" />
            </TouchableOpacity>
          </Animated.View>
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
        contentContainerStyle={[
          dynamicStyles.menuContentContainer,
          { paddingBottom: Math.max(insets.bottom, 20) + 80 } // Bottom tab bar height + safe area
        ]}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={true}
        bounces={true}
      >
        {menuGroups.map((group, groupIndex) => (
          <View 
            key={groupIndex} 
            style={[
              dynamicStyles.menuGroup, 
              { 
                backgroundColor: colors.surface,
                borderWidth: isDarkMode ? 1 : 0,
                borderColor: isDarkMode ? colors.border : 'transparent',
              }
            ]}
          >
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
            Phiên bản {appJson.expo.version}
          </Text>
        </View>
    </ScrollView>

      {/* Theme Selection Modal */}
      <Modal
        visible={showThemeModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowThemeModal(false)}
      >
        <TouchableOpacity
          style={dynamicStyles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowThemeModal(false)}
        >
          <View
            style={[dynamicStyles.modalContainer, { backgroundColor: colors.surface, paddingBottom: Math.max(insets.bottom, 20) }]}
            onStartShouldSetResponder={() => true}
          >
            <View style={dynamicStyles.modalHeader}>
              <Text style={[dynamicStyles.modalTitle, { color: colors.text }]}>
                Chọn giao diện
              </Text>
              <TouchableOpacity
                onPress={() => setShowThemeModal(false)}
                style={dynamicStyles.modalCloseButton}
              >
                <MaterialCommunityIcons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <View style={dynamicStyles.themeOptionsContainer}>
              <TouchableOpacity
                style={[
                  dynamicStyles.themeOption,
                  themeMode === 'light' && { backgroundColor: colors.primary + '20' },
                  { borderBottomWidth: 1, borderBottomColor: colors.border },
                ]}
                onPress={() => {
                  setThemeMode('light');
                  setShowThemeModal(false);
                }}
              >
                <View style={dynamicStyles.themeOptionLeft}>
                  <View style={[dynamicStyles.themeOptionIcon, { backgroundColor: themeMode === 'light' ? colors.primary + '20' : 'transparent' }]}>
                    <MaterialCommunityIcons
                      name="white-balance-sunny"
                      size={24}
                      color={themeMode === 'light' ? colors.primary : colors.textSecondary}
                    />
                  </View>
                  <View style={dynamicStyles.themeOptionText}>
                    <Text style={[dynamicStyles.themeOptionTitle, { color: colors.text }]}>
                      Sáng
                    </Text>
                    <Text style={[dynamicStyles.themeOptionDescription, { color: colors.textSecondary }]}>
                      Luôn sử dụng chế độ sáng
                    </Text>
                  </View>
                </View>
                {themeMode === 'light' && (
                  <MaterialCommunityIcons
                    name="check-circle"
                    size={24}
                    color={colors.primary}
                  />
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  dynamicStyles.themeOption,
                  themeMode === 'dark' && { backgroundColor: colors.primary + '20' },
                  { borderBottomWidth: 1, borderBottomColor: colors.border },
                ]}
                onPress={() => {
                  setThemeMode('dark');
                  setShowThemeModal(false);
                }}
              >
                <View style={dynamicStyles.themeOptionLeft}>
                  <View style={[dynamicStyles.themeOptionIcon, { backgroundColor: themeMode === 'dark' ? colors.primary + '20' : 'transparent' }]}>
                    <MaterialCommunityIcons
                      name="weather-night"
                      size={24}
                      color={themeMode === 'dark' ? colors.primary : colors.textSecondary}
                    />
                  </View>
                  <View style={dynamicStyles.themeOptionText}>
                    <Text style={[dynamicStyles.themeOptionTitle, { color: colors.text }]}>
                      Tối
                    </Text>
                    <Text style={[dynamicStyles.themeOptionDescription, { color: colors.textSecondary }]}>
                      Luôn sử dụng chế độ tối
                    </Text>
                  </View>
                </View>
                {themeMode === 'dark' && (
                  <MaterialCommunityIcons
                    name="check-circle"
                    size={24}
                    color={colors.primary}
                  />
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  dynamicStyles.themeOption,
                  themeMode === 'system' && { backgroundColor: colors.primary + '20' },
                ]}
                onPress={() => {
                  setThemeMode('system');
                  setShowThemeModal(false);
                }}
              >
                <View style={dynamicStyles.themeOptionLeft}>
                  <View style={[dynamicStyles.themeOptionIcon, { backgroundColor: themeMode === 'system' ? colors.primary + '20' : 'transparent' }]}>
                    <MaterialCommunityIcons
                      name="cellphone"
                      size={24}
                      color={themeMode === 'system' ? colors.primary : colors.textSecondary}
                    />
                  </View>
                  <View style={dynamicStyles.themeOptionText}>
                    <Text style={[dynamicStyles.themeOptionTitle, { color: colors.text }]}>
                      Hệ thống
                    </Text>
                    <Text style={[dynamicStyles.themeOptionDescription, { color: colors.textSecondary }]}>
                      Tự động theo thiết bị
                    </Text>
                  </View>
                </View>
                {themeMode === 'system' && (
                  <MaterialCommunityIcons
                    name="check-circle"
                    size={24}
                    color={colors.primary}
                  />
                )}
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
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
  },
  menuContentContainer: {
    paddingHorizontal: 16,
    paddingTop: 8,
    flexGrow: 1, // Cho phép nội dung mở rộng khi cần
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
  },
  modalCloseButton: {
    padding: 8,
    position: 'absolute',
    right: 8,
  },
  themeOptionsContainer: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  themeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  themeOptionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  themeOptionIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  themeOptionText: {
    flex: 1,
  },
  themeOptionTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  themeOptionDescription: {
    fontSize: 13,
  },
});

export default ProfileScreen;
