import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Animated,
  Modal,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Text, Avatar, Searchbar } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
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
import { TextInput } from 'react-native-paper';
import { usersAPI } from '../../utils/api';
import { getStoredToken } from '../../utils/auth';
import { spacing, typography, borderRadius, borderWidth, touchTargets } from '../../config/designTokens';

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
  const { user, logout, login } = useAuth();
  const navigation = useNavigation<ProfileScreenNavigationProp>();
  const { colors, themeMode, setThemeMode, isDarkMode } = useTheme();
  const insets = useSafeAreaInsets();
  const [isScrolled, setIsScrolled] = useState(false);
  const [showThemeModal, setShowThemeModal] = useState(false);
  const [activityStatusEnabled, setActivityStatusEnabled] = useState(true);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [userNote, setUserNote] = useState('');
  const [isSavingNote, setIsSavingNote] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showVerificationBanner, setShowVerificationBanner] = useState(true);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [userStatusText, setUserStatusText] = useState('');
  const [isSavingStatus, setIsSavingStatus] = useState(false);
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

  // Load user note
  useEffect(() => {
    const loadUserNote = async () => {
      try {
        const noteKey = `user_note_${user?.id}`;
        const saved = await AsyncStorage.getItem(noteKey);
        if (saved !== null) {
          setUserNote(saved);
        }
      } catch (error) {
        console.error('Error loading user note:', error);
      }
    };
    if (user?.id) {
      loadUserNote();
    }
  }, [user?.id]);

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
      const shouldBeScrolled = offsetY > 10; // Threshold để toggle header
      
      // Chỉ update nếu thay đổi đáng kể (tránh nháy)
      if (shouldBeScrolled !== isScrolled) {
        setIsScrolled(shouldBeScrolled);
      }
      lastScrollY.current = offsetY;
    } catch (error) {
      // Silently handle scroll errors
      console.warn('Scroll error:', error);
    }
  }, [isScrolled]);

  const handleAvatarPress = () => {
    navigation.navigate('SelfDestructPost');
  };

  const handleSaveNote = async () => {
    setIsSavingNote(true);
    try {
      const noteKey = `user_note_${user?.id}`;
      await AsyncStorage.setItem(noteKey, userNote);
      Alert.alert('Thành công', 'Đã lưu ghi chú thành công!');
      setShowNoteModal(false);
    } catch (error) {
      console.error('Error saving note:', error);
      Alert.alert('Lỗi', 'Không thể lưu ghi chú. Vui lòng thử lại.');
    } finally {
      setIsSavingNote(false);
    }
  };

  const handleDeleteNote = async () => {
    Alert.alert(
      'Xóa ghi chú',
      'Bạn có chắc chắn muốn xóa ghi chú này?',
      [
        {
          text: 'Hủy',
          style: 'cancel',
        },
        {
          text: 'Xóa',
          style: 'destructive',
          onPress: async () => {
            try {
              const noteKey = `user_note_${user?.id}`;
              await AsyncStorage.removeItem(noteKey);
              setUserNote('');
              Alert.alert('Thành công', 'Đã xóa ghi chú!');
              setShowNoteModal(false);
            } catch (error) {
              console.error('Error deleting note:', error);
              Alert.alert('Lỗi', 'Không thể xóa ghi chú. Vui lòng thử lại.');
            }
          },
        },
      ]
    );
  };

  const handleOpenStatusModal = () => {
    const currentStatus = (user as any)?.bio || 'Xin chào! Tôi đang sử dụng Zyea+';
    setUserStatusText(currentStatus);
    setShowStatusModal(true);
  };

  const handleSaveStatus = async () => {
    setIsSavingStatus(true);
    try {
      await usersAPI.updateProfile({ bio: userStatusText });
      // Fetch updated profile to refresh user context
      const response = await usersAPI.getProfile();
      if (response.data && user) {
        const updatedUser = { ...user, ...response.data };
        // Get token from storage
        const token = await getStoredToken();
        if (token) {
          await login(updatedUser, token);
        }
      }
      Alert.alert('Thành công', 'Đã cập nhật trạng thái thành công!');
      setShowStatusModal(false);
    } catch (error: any) {
      console.error('Error saving status:', error);
      Alert.alert('Lỗi', error.response?.data?.message || 'Không thể cập nhật trạng thái. Vui lòng thử lại.');
    } finally {
      setIsSavingStatus(false);
    }
  };

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
      case 'privacy':
        navigation.navigate('Privacy');
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
      case 'avatar':
        navigation.navigate('ProfileInformation');
        break;
      case 'logout':
        logout();
        break;
      default:
        break;
    }
  };

  const userName = user?.full_name || user?.username || 'Người dùng';
  const userUsername = user?.username || '';
  const userStatus = (user as any)?.bio || 'Xin chào! Tôi đang sử dụng Zyea+';

  // Create menu groups with useMemo
  const menuGroups: MenuGroup[] = React.useMemo(() => [
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
          id: 'privacy',
          icon: 'lock-outline',
          title: 'Quyền riêng tư',
          onPress: () => handleMenuPress('privacy'),
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
          title: 'Trợ giúp và ý kiến đóng góp',
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
  ], [activityStatusEnabled, themeMode]);

  // Filter menu groups based on search query
  const filteredMenuGroups = React.useMemo(() => {
    if (!searchQuery.trim()) {
      return menuGroups;
    }

    const query = searchQuery.toLowerCase().trim();
    return menuGroups
      .map(group => ({
        ...group,
        items: group.items.filter(item =>
          item.title.toLowerCase().includes(query)
        )
      }))
      .filter(group => group.items.length > 0);
  }, [searchQuery, menuGroups]);

  // Check if user needs verification
  const needsVerification = !user?.email || !(user as any)?.phone;
  const verificationMessage = !user?.email 
    ? 'Xác minh bằng email' 
    : 'Thêm số điện thoại';
  const verificationDescription = !user?.email
    ? 'Dùng email để đăng nhập hoặc khôi phục tài khoản nếu cần.'
    : 'Thêm số điện thoại để bảo mật tài khoản tốt hơn.';
  const verificationAction = !user?.email ? 'Thêm email' : 'Thêm số điện thoại';

  useEffect(() => {
    const loadBannerState = async () => {
      try {
        // Chỉ ẩn banner nếu user đã có cả email và phone
        if (user?.email && (user as any)?.phone) {
          setShowVerificationBanner(false);
        } else {
          // Nếu thiếu email hoặc phone, luôn hiển thị banner
          setShowVerificationBanner(true);
          // Reset dismissed state nếu user chưa đủ thông tin
          await AsyncStorage.removeItem('verificationBannerDismissed');
        }
      } catch (error) {
        console.error('Error loading banner state:', error);
      }
    };
    loadBannerState();
  }, [user?.email, (user as any)?.phone]);

  // Reload banner state when screen is focused
  useFocusEffect(
    useCallback(() => {
      const checkBannerState = async () => {
        try {
          // Nếu thiếu email hoặc phone, luôn hiển thị banner
          if (!user?.email || !(user as any)?.phone) {
            setShowVerificationBanner(true);
          }
        } catch (error) {
          console.error('Error checking banner state:', error);
        }
      };
      checkBannerState();
    }, [user?.email, (user as any)?.phone])
  );

  const handleDismissBanner = async () => {
    try {
      // Chỉ lưu dismissed nếu user đã có cả email và phone
      if (user?.email && (user as any)?.phone) {
        await AsyncStorage.setItem('verificationBannerDismissed', 'true');
        setShowVerificationBanner(false);
      } else {
        // Nếu chưa đủ thông tin, chỉ ẩn tạm thời, sẽ hiện lại khi reload
        setShowVerificationBanner(false);
      }
    } catch (error) {
      console.error('Error dismissing banner:', error);
    }
  };

  const handleAddEmail = () => {
    if (!user?.email) {
      navigation.navigate('ProfileInformation');
    } else {
      // Navigate to AddPhone screen
      navigation.navigate('AddPhone');
    }
  };

  const dynamicStyles = createStyles(colors, isDarkMode);

  const handleUserCardPress = () => {
    navigation.navigate('MyProfile' as never);
  };

  return (
    <SafeAreaView style={dynamicStyles.container} edges={['top']}>
      {/* Title Section - Fixed Header */}
      <View style={[dynamicStyles.titleSection, { backgroundColor: colors.background }]}>
        {!isScrolled ? (
          <View style={dynamicStyles.titleSectionLeft}>
            <TouchableOpacity
              style={dynamicStyles.backButton}
              onPress={() => navigation.goBack()}
            >
              <MaterialCommunityIcons name="chevron-left" size={24} color={colors.text} />
            </TouchableOpacity>
            <Text style={[dynamicStyles.title, { color: colors.text }]}>Cài đặt</Text>
          </View>
        ) : (
          <>
            <View style={{ width: 40 }} />
            <Text style={[dynamicStyles.title, dynamicStyles.titleCentered, dynamicStyles.titleScrolled, { color: colors.text }]}>Cài đặt</Text>
            <View style={{ width: 40 }} />
          </>
        )}
      </View>

      {/* Scrollable Content */}
      <ScrollView
        style={dynamicStyles.menuSection}
        contentContainerStyle={[
          dynamicStyles.menuContentContainer,
          { paddingBottom: Math.max(insets.bottom, 20) + 20 } // Safe area + small padding
        ]}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={true}
        bounces={true}
      >
        {/* Search Bar */}
        <View style={dynamicStyles.searchContainer}>
          <Searchbar
            placeholder="Tìm kiếm"
            onChangeText={setSearchQuery}
            value={searchQuery}
            onClearIconPress={() => setSearchQuery('')}
            style={[
              dynamicStyles.searchbar,
              { backgroundColor: isDarkMode ? '#2a2a2b' : colors.surface }
            ]}
            inputStyle={[dynamicStyles.searchInput, { color: colors.text }]}
            iconColor={colors.textSecondary}
            placeholderTextColor={colors.textSecondary}
            elevation={0}
            mode="bar"
          />
        </View>

        {/* Verification Banner */}
        {needsVerification && showVerificationBanner && (
          <View style={[
            dynamicStyles.verificationBanner,
            { backgroundColor: isDarkMode ? '#2a2a2b' : colors.surface }
          ]}>
            <TouchableOpacity
              style={dynamicStyles.bannerClose}
              onPress={handleDismissBanner}
            >
              <MaterialCommunityIcons name="close" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
            <View style={dynamicStyles.bannerContent}>
              <MaterialCommunityIcons name="shield-check" size={24} color="#4CAF50" />
              <View style={dynamicStyles.bannerText}>
                <Text style={[dynamicStyles.bannerTitle, { color: colors.text }]}>
                  {verificationMessage}
                </Text>
                <Text style={[dynamicStyles.bannerDescription, { color: colors.textSecondary }]}>
                  {verificationDescription}
                </Text>
                <TouchableOpacity onPress={handleAddEmail}>
                  <Text style={[dynamicStyles.bannerLink, { color: '#4CAF50' }]}>
                    {verificationAction}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

        {/* User Info Card */}
        <View style={[
          dynamicStyles.userCard,
          { backgroundColor: isDarkMode ? '#2a2a2b' : colors.surface }
        ]}>
          <TouchableOpacity
            style={dynamicStyles.userCardContent}
            onPress={handleUserCardPress}
            activeOpacity={0.7}
          >
            <View style={dynamicStyles.userCardLeft}>
              {user?.avatar_url ? (
                <Image
                  source={{ uri: getAvatarURL(user.avatar_url) }}
                  style={dynamicStyles.userCardAvatar}
                  resizeMode="cover"
                />
              ) : (
                <View style={dynamicStyles.userCardAvatarPlaceholder}>
                  <MaterialCommunityIcons 
                    name="account" 
                    size={32} 
                    color="#FF8C42" 
                  />
                </View>
              )}
              <View style={dynamicStyles.userCardInfo}>
                <Text style={[dynamicStyles.userCardName, { color: colors.text }]} numberOfLines={1}>
                  {userName}
                </Text>
                <View style={dynamicStyles.statusBubbleContainer}>
                  <TouchableOpacity
                    style={[
                      dynamicStyles.statusBubble,
                      { 
                        backgroundColor: isDarkMode ? '#1a1a1a' : '#f0f0f0',
                        borderColor: isDarkMode ? '#333' : '#e0e0e0',
                      }
                    ]}
                    onPress={handleOpenStatusModal}
                    activeOpacity={0.7}
                  >
                    <Text style={[dynamicStyles.userCardStatus, { color: colors.textSecondary }]} numberOfLines={1}>
                      {userStatus}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
            <TouchableOpacity
              style={dynamicStyles.userCardQR}
              onPress={() => navigation.navigate('QRScanner')}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons name="qrcode-scan" size={24} color={colors.text} />
            </TouchableOpacity>
          </TouchableOpacity>

          {/* Avatar Menu Item - Inside user card */}
          <View style={dynamicStyles.userCardDivider} />
          <TouchableOpacity
            style={dynamicStyles.userCardMenuItem}
            onPress={() => handleMenuPress('avatar')}
            activeOpacity={0.7}
          >
            <View style={dynamicStyles.menuIcon}>
              <MaterialCommunityIcons
                name="face-man-profile"
                size={20}
                color={colors.text}
              />
            </View>
            <Text
              style={[
                dynamicStyles.menuTitle,
                { color: colors.text }
              ]}
            >
              Avatar
            </Text>
            <MaterialCommunityIcons
              name="chevron-right"
              size={20}
              color={colors.textSecondary}
            />
          </TouchableOpacity>
        </View>

        {/* Menu Section */}
        {filteredMenuGroups.map((group, groupIndex) => (
          <View 
            key={groupIndex} 
            style={[
              dynamicStyles.menuGroup, 
              { 
                backgroundColor: isDarkMode ? '#2a2a2b' : colors.surface,
                borderWidth: isDarkMode ? 1 : 0,
                borderColor: isDarkMode ? colors.border : 'transparent',
              }
            ]}
          >
            {group.items.map((item, itemIndex) => (
              <React.Fragment key={item.id}>
                <TouchableOpacity
                  style={dynamicStyles.menuItem}
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
                {itemIndex < group.items.length - 1 && (
                  <View style={dynamicStyles.menuDivider} />
                )}
              </React.Fragment>
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

      {/* Note Modal */}
      <Modal
        visible={showNoteModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowNoteModal(false)}
      >
        <TouchableOpacity
          style={dynamicStyles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowNoteModal(false)}
        >
          <View
            style={[dynamicStyles.noteModalContainer, { backgroundColor: colors.surface, paddingBottom: Math.max(insets.bottom, 20) }]}
            onStartShouldSetResponder={() => true}
          >
            <View style={dynamicStyles.modalHeader}>
              <Text style={[dynamicStyles.modalTitle, { color: colors.text }]}>
                Ghi chú về {userName}
              </Text>
              <TouchableOpacity
                onPress={() => setShowNoteModal(false)}
                style={dynamicStyles.modalCloseButton}
              >
                <MaterialCommunityIcons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <View style={dynamicStyles.noteContent}>
              <TextInput
                mode="outlined"
                placeholder="Thêm ghi chú về người này (chỉ bạn mới thấy)..."
                value={userNote}
                onChangeText={setUserNote}
                multiline
                numberOfLines={8}
                style={[dynamicStyles.noteInput, { backgroundColor: colors.background }]}
                contentStyle={{ color: colors.text, minHeight: 150 }}
                outlineColor={colors.border}
                activeOutlineColor={colors.primary}
                textColor={colors.text}
              />
            </View>

            <View style={dynamicStyles.noteActions}>
              {userNote.trim() && (
                <TouchableOpacity
                  style={[dynamicStyles.noteDeleteButton, { backgroundColor: colors.error + '20' }]}
                  onPress={handleDeleteNote}
                >
                  <MaterialCommunityIcons name="delete-outline" size={20} color={colors.error} />
                  <Text style={[dynamicStyles.noteDeleteText, { color: colors.error }]}>
                    Xóa ghi chú
                  </Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={[
                  dynamicStyles.noteSaveButton,
                  { backgroundColor: colors.primary },
                  isSavingNote && { opacity: 0.6 }
                ]}
                onPress={handleSaveNote}
                disabled={isSavingNote}
              >
                {isSavingNote ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <MaterialCommunityIcons name="check" size={20} color="#fff" />
                    <Text style={dynamicStyles.noteSaveText}>Lưu</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Status Modal */}
      <Modal
        visible={showStatusModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowStatusModal(false)}
      >
        <TouchableOpacity
          style={dynamicStyles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowStatusModal(false)}
        >
          <View
            style={[dynamicStyles.noteModalContainer, { backgroundColor: colors.surface, paddingBottom: Math.max(insets.bottom, 20) }]}
            onStartShouldSetResponder={() => true}
          >
            <View style={dynamicStyles.modalHeader}>
              <Text style={[dynamicStyles.modalTitle, { color: colors.text }]}>
                Chỉnh sửa trạng thái
              </Text>
              <TouchableOpacity
                onPress={() => setShowStatusModal(false)}
                style={dynamicStyles.modalCloseButton}
              >
                <MaterialCommunityIcons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <View style={dynamicStyles.noteContent}>
              <TextInput
                mode="outlined"
                placeholder="Nhập trạng thái của bạn..."
                value={userStatusText}
                onChangeText={setUserStatusText}
                multiline
                numberOfLines={4}
                style={[dynamicStyles.noteInput, { backgroundColor: colors.background }]}
                contentStyle={{ color: colors.text, minHeight: 100 }}
                outlineColor={colors.border}
                activeOutlineColor={colors.primary}
                textColor={colors.text}
                maxLength={200}
              />
            </View>

            <View style={dynamicStyles.noteActions}>
              <TouchableOpacity
                style={[
                  dynamicStyles.noteSaveButton,
                  { backgroundColor: colors.primary },
                  isSavingStatus && { opacity: 0.6 }
                ]}
                onPress={handleSaveStatus}
                disabled={isSavingStatus}
              >
                {isSavingStatus ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <MaterialCommunityIcons name="check" size={20} color="#fff" />
                    <Text style={dynamicStyles.noteSaveText}>Lưu</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
};

const createStyles = (colors: typeof PWATheme.light, isDarkMode: boolean) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  titleSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.base,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
  },
  titleSectionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  backButton: {
    padding: spacing.sm,
  },
  title: {
    fontSize: typography.fontSize.xxl,
    fontWeight: typography.fontWeight.bold,
  },
  titleCentered: {
    flex: 1,
    textAlign: 'center',
  },
  titleScrolled: {
    fontSize: typography.fontSize.lg,
  },
  searchContainer: {
    paddingHorizontal: spacing.base,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
  },
  searchbar: {
    elevation: 0,
    borderRadius: borderRadius.xl + 2,
    height: touchTargets.md + 4,
    justifyContent: 'center',
    overflow: 'hidden',
  },
  searchInput: {
    fontSize: typography.fontSize.md - 1,
    paddingVertical: 0,
    marginVertical: 0,
    textAlignVertical: 'center',
    includeFontPadding: false,
  },
  verificationBanner: {
    borderRadius: borderRadius.base,
    padding: spacing.base,
    marginBottom: spacing.md,
    marginHorizontal: spacing.base,
    position: 'relative',
  },
  bannerClose: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
    padding: spacing.xs,
    zIndex: 1,
  },
  bannerContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  bannerText: {
    flex: 1,
  },
  bannerTitle: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semibold,
    marginBottom: spacing.xs,
  },
  bannerDescription: {
    fontSize: typography.fontSize.base,
    marginBottom: spacing.sm,
    lineHeight: typography.fontSize.base * typography.lineHeight.normal,
  },
  bannerLink: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
  },
  userCard: {
    marginHorizontal: spacing.base,
    marginBottom: spacing.md,
    borderRadius: borderRadius.base,
    padding: spacing.base,
  },
  userCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  userCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  userCardAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    overflow: 'hidden',
  },
  userCardAvatarPlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FFE4CC',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  userCardInfo: {
    flex: 1,
  },
  userCardName: {
    fontSize: 17,
    fontWeight: '600',
    marginBottom: 4,
  },
  userCardStatus: {
    fontSize: 14,
  },
  statusBubbleContainer: {
    marginTop: 6,
    position: 'relative',
  },
  statusBubble: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    alignSelf: 'flex-start',
    maxWidth: '90%',
  },
  userCardQR: {
    padding: 8,
  },
  userCardDivider: {
    height: 1,
    backgroundColor: isDarkMode ? '#1f1f20' : colors.border,
    marginLeft: 16,
    marginRight: 16,
    marginTop: 8,
    marginBottom: 8,
  },
  userCardMenuItem: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  menuSection: {
    flex: 1,
    backgroundColor: colors.background,
  },
  menuContentContainer: {
    paddingHorizontal: 0,
    paddingTop: 8,
    flexGrow: 1, // Cho phép nội dung mở rộng khi cần
  },
  menuGroup: {
    borderRadius: 12,
    marginHorizontal: 16,
    marginBottom: 12,
    overflow: 'hidden',
  },
  menuItem: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: isDarkMode ? '#2a2a2b' : colors.surface,
  },
  menuDivider: {
    height: 1,
    backgroundColor: isDarkMode ? '#1f1f20' : colors.border,
    marginLeft: 52, // Icon width (24) + gap (12) + padding (16) = 52
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
    paddingVertical: 12,
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
  noteModalContainer: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  noteContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  noteInput: {
    minHeight: 150,
  },
  noteActions: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 12,
    alignItems: 'center',
  },
  noteDeleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 8,
  },
  noteDeleteText: {
    fontSize: 15,
    fontWeight: '500',
  },
  noteSaveButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  noteSaveText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
});

export default ProfileScreen;
