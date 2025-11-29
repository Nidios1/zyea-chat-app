import React, { useEffect } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  Modal,
  Animated,
  Dimensions,
  ScrollView,
  Pressable,
  Platform,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Avatar } from 'react-native-paper';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useQuery } from '@tanstack/react-query';
import { friendsAPI } from '../../utils/api';
import { getAvatarURL, getInitials } from '../../utils/imageUtils';
import { useNavigation } from '@react-navigation/native';

interface SidebarDrawerProps {
  visible: boolean;
  onClose: () => void;
}

const DRAWER_WIDTH = Dimensions.get('window').width * 0.75; // 75% of screen width

interface MenuItem {
  id: string;
  label: string;
  icon: string;
  onPress: () => void;
}

const SidebarDrawer: React.FC<SidebarDrawerProps> = ({ visible, onClose }) => {
  const { user } = useAuth();
  const { colors, isDarkMode } = useTheme();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const slideAnim = React.useRef(new Animated.Value(-DRAWER_WIDTH)).current;
  const overlayOpacity = React.useRef(new Animated.Value(0)).current;

  // Fetch followers and following counts
  const { data: followersData } = useQuery({
    queryKey: ['followers'],
    queryFn: () => friendsAPI.getFollowers(),
    enabled: visible && !!user,
  });

  const { data: followingData } = useQuery({
    queryKey: ['following'],
    queryFn: () => friendsAPI.getFollowing(),
    enabled: visible && !!user,
  });

  const followersCount = followersData?.data?.length || 0;
  const followingCount = followingData?.data?.length || 0;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(overlayOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: -DRAWER_WIDTH,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(overlayOpacity, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  const handleClose = () => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: -DRAWER_WIDTH,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(overlayOpacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onClose();
    });
  };

  const menuItems: MenuItem[] = [
    {
      id: 'explore',
      label: 'Khám phá',
      icon: 'magnify',
      onPress: () => {
        handleClose();
        // Navigate to explore/search
      },
    },
    {
      id: 'home',
      label: 'Trang chủ',
      icon: 'home',
      onPress: () => {
        handleClose();
        navigation.navigate('Home' as never);
      },
    },
    {
      id: 'chat',
      label: 'Chat',
      icon: 'message-outline',
      onPress: () => {
        handleClose();
        navigation.navigate('Chat' as never);
      },
    },
    {
      id: 'notifications',
      label: 'Thông báo',
      icon: 'bell-outline',
      onPress: () => {
        handleClose();
        // Navigate to notifications
      },
    },
    {
      id: 'newsfeed',
      label: 'Bảng tin',
      icon: 'pound',
      onPress: () => {
        handleClose();
        navigation.navigate('Home' as never);
      },
    },
    {
      id: 'lists',
      label: 'Danh sách',
      icon: 'format-list-bulleted',
      onPress: () => {
        handleClose();
        // Navigate to lists
      },
    },
    {
      id: 'saved',
      label: 'Saved',
      icon: 'bookmark-outline',
      onPress: () => {
        handleClose();
        // Navigate to saved posts
      },
    },
    {
      id: 'profile',
      label: 'Hồ sơ',
      icon: 'account-circle-outline',
      onPress: () => {
        handleClose();
        if (user) {
          // Navigate to Profile tab
          navigation.navigate('Profile' as never, { screen: 'Profile', params: { userId: user.id } } as never);
        }
      },
    },
    {
      id: 'settings',
      label: 'Cài đặt',
      icon: 'cog-outline',
      onPress: () => {
        handleClose();
        // Navigate to Settings in Profile stack
        navigation.navigate('Profile' as never, { screen: 'Settings' } as never);
      },
    },
  ];

  const styles = createStyles(colors, isDarkMode, insets);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={handleClose}
      statusBarTranslucent
    >
      <View style={styles.container}>
        {/* Overlay */}
        <Pressable style={styles.overlay} onPress={handleClose}>
          <Animated.View
            style={[
              styles.overlayAnimated,
              {
                opacity: overlayOpacity,
              },
            ]}
          />
        </Pressable>

        {/* Drawer */}
        <Animated.View
          style={[
            styles.drawer,
            {
              transform: [{ translateX: slideAnim }],
            },
          ]}
        >
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Profile Section */}
            <View style={styles.profileSection}>
              <View style={styles.profileInfo}>
                {user?.avatar_url ? (
                  <Avatar.Image
                    size={80}
                    source={{ uri: getAvatarURL(user.avatar_url) }}
                    style={styles.avatar}
                  />
                ) : (
                  <Avatar.Text
                    size={80}
                    label={getInitials(user?.full_name || user?.username || 'U')}
                    style={styles.avatar}
                  />
                )}

                <Text style={styles.profileName}>
                  {user?.full_name || user?.username || 'User'}
                </Text>
                <Text style={styles.profileUsername}>
                  @{user?.username || 'username'}
                </Text>

                <View style={styles.statsContainer}>
                  <View style={styles.statItem}>
                    <Text style={styles.statNumber}>{followersCount}</Text>
                    <Text style={styles.statLabel}>người theo dõi</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text style={styles.statNumber}>{followingCount}</Text>
                    <Text style={styles.statLabel}>đang theo dõi</Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Menu Items */}
            <View style={styles.menuSection}>
              {menuItems.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={styles.menuItem}
                  onPress={item.onPress}
                  activeOpacity={0.7}
                >
                  <MaterialCommunityIcons
                    name={item.icon as any}
                    size={24}
                    color={colors.text}
                    style={styles.menuIcon}
                  />
                  <Text style={styles.menuItemText}>{item.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Legal Links */}
            <View style={styles.legalSection}>
              <TouchableOpacity
                style={styles.legalLink}
                onPress={() => {
                  handleClose();
                  // Navigate to terms - can be added later
                }}
              >
                <Text style={styles.legalLinkText}>Điều khoản dịch vụ</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.legalLink}
                onPress={() => {
                  handleClose();
                  navigation.navigate('Profile' as never, { screen: 'Privacy' } as never);
                }}
              >
                <Text style={styles.legalLinkText}>Chính sách bảo mật</Text>
              </TouchableOpacity>
            </View>

            {/* Bottom Buttons */}
            <View style={styles.bottomSection}>
              <TouchableOpacity
                style={styles.bottomButton}
                onPress={() => {
                  handleClose();
                  navigation.navigate('Profile' as never, { screen: 'Feedback' } as never);
                }}
                activeOpacity={0.7}
              >
                <MaterialCommunityIcons
                  name="message-outline"
                  size={20}
                  color={colors.text}
                  style={styles.bottomButtonIcon}
                />
                <Text style={styles.bottomButtonText}>Phản hồi</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.bottomButton}
                onPress={() => {
                  handleClose();
                  navigation.navigate('Profile' as never, { screen: 'Help' } as never);
                }}
                activeOpacity={0.7}
              >
                <Text style={styles.bottomButtonText}>Giúp đỡ</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
};

const createStyles = (
  colors: any,
  isDarkMode: boolean,
  insets: { top: number; bottom: number; left: number; right: number }
) =>
  StyleSheet.create({
    container: {
      flex: 1,
    },
    overlay: {
      ...StyleSheet.absoluteFillObject,
    },
    overlayAnimated: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    drawer: {
      position: 'absolute',
      left: 0,
      top: 0,
      bottom: 0,
      width: DRAWER_WIDTH,
      backgroundColor: isDarkMode 
        ? colors.surface || '#2a2a2b' // Dark mode: surface color
        : colors.surface || '#ffffff', // Light mode: white surface
    },
    scrollView: {
      flex: 1,
    },
    scrollContent: {
      paddingBottom: 20,
    },
    profileSection: {
      paddingTop: insets.top + 20,
      paddingHorizontal: 20,
      paddingBottom: 20,
    },
    profileInfo: {
      alignItems: 'center',
    },
    avatar: {
      marginBottom: 12,
      backgroundColor: colors.primary || '#1877F2',
    },
    profileName: {
      fontSize: 20,
      fontWeight: '700',
      color: colors.text,
      marginBottom: 4,
    },
    profileUsername: {
      fontSize: 14,
      color: colors.textSecondary,
      marginBottom: 16,
    },
    statsContainer: {
      flexDirection: 'row',
      gap: 16,
    },
    statItem: {
      alignItems: 'center',
    },
    statNumber: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.text,
    },
    statLabel: {
      fontSize: 12,
      color: colors.textSecondary,
      marginTop: 2,
    },
    menuSection: {
      paddingHorizontal: 12,
      marginTop: 8,
    },
    menuItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 14,
      paddingHorizontal: 16,
      borderRadius: 8,
    },
    menuIcon: {
      marginRight: 16,
    },
    menuItemText: {
      fontSize: 16,
      color: colors.text,
    },
    legalSection: {
      paddingHorizontal: 20,
      paddingTop: 20,
      paddingBottom: 12,
    },
    legalLink: {
      paddingVertical: 8,
    },
    legalLinkText: {
      fontSize: 14,
      color: colors.primary,
    },
    bottomSection: {
      flexDirection: 'row',
      paddingHorizontal: 20,
      paddingTop: 12,
      gap: 12,
    },
    bottomButton: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: 'transparent',
    },
    bottomButtonIcon: {
      marginRight: 8,
    },
    bottomButtonText: {
      fontSize: 14,
      color: colors.text,
    },
  });

export default SidebarDrawer;

