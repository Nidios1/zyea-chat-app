import React, { useEffect, useMemo, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Animated,
  Dimensions,
  Image,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTabBar } from '../../contexts/TabBarContext';
import { useTheme as useAppTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { getAvatarURL } from '../../utils/imageUtils';
import { getInitials } from '../../utils/nameUtils';
import { useQuery } from '@tanstack/react-query';
import { notificationsAPI } from '../../utils/api';

interface TabItem {
  id: string;
  label: string;
  icon: string;
  iconFilled: string; // Filled variant for active state
  badge?: number | 'dot' | null;
}

interface BottomTabBarProps {
  state: any;
  descriptors: any;
  navigation: any;
}

const ICON_WIDTH = 28; // Giống social-app-main

// Clamp function giống social-app-main
const clamp = (value: number, min: number, max: number) => {
  return Math.min(Math.max(value, min), max);
};

// Màu icon giống social-app-main - active/inactive cùng màu text, opacity khác nhau
const getIconColors = (colors: any, isActive: boolean) => {
  // Social-app-main dùng cùng màu text cho cả active và inactive
  // Active có opacity cao hơn (1.0), inactive có opacity thấp hơn (0.7)
  return colors.text || (isActive ? '#000000' : '#707070');
};

const getIconOpacity = (isActive: boolean) => {
  return isActive ? 1.0 : 0.7;
};

// Icon sizes khác nhau cho từng tab (giống social-app-main)
const getIconSize = (tabId: string) => {
  switch (tabId) {
    case 'NewsFeed': return ICON_WIDTH + 1; // 29
    case 'Video': return ICON_WIDTH + 2; // 30 (giống Search)
    case 'Party': return ICON_WIDTH; // 28
    case 'Profile': return ICON_WIDTH - 2; // 26 (avatar)
    default: return ICON_WIDTH; // 28
  }
};

const BottomTabBar = ({ state, descriptors, navigation }: BottomTabBarProps) => {
  const insets = useSafeAreaInsets();
  const { isVisible } = useTabBar();
  const { isDarkMode, colors } = useAppTheme(); // Lấy từ ThemeContext thật
  const { user } = useAuth();
  
  // Fetch unread notification count
  const { data: unreadCountData } = useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: async () => {
      try {
        const response = await notificationsAPI.getUnreadCount();
        return response.data?.count || 0;
      } catch (error) {
        console.log('Error fetching unread count:', error);
        // Fallback: fetch tất cả và đếm
        try {
          const notificationsResponse = await notificationsAPI.getNotifications();
          const notifications = notificationsResponse.data || [];
          return notifications.filter((n: any) => !n.read || n.read === 0 || n.read === false).length;
        } catch (fallbackError) {
          return 0;
        }
      }
    },
    refetchInterval: false, // No polling - use socket for real-time badge updates
    refetchOnWindowFocus: true, // Refetch khi quay lại app
    refetchOnMount: true, // Always refetch on mount for fresh data (no delay)
    enabled: !!user, // Chỉ fetch khi đã login
  });

  const unreadCount = unreadCountData || 0;

  // Helper: get focused nested route name for a tab
  const getFocusedNestedRouteName = (route: any): string | undefined => {
    const nestedState = route?.state || descriptors?.[route?.key]?.state;
    if (!nestedState) return undefined;
    const nestedRoute = nestedState.routes?.[nestedState.index];
    if (!nestedRoute) return undefined;
    // Dive deeper if there are multiple levels
    return getFocusedNestedRouteName(nestedRoute) || nestedRoute.name;
  };

  // Khai báo lại tabItems giống social-app-main (Bluesky)
  const tabItems: TabItem[] = useMemo(() => [
    { 
      id: 'NewsFeed', 
      label: '', 
      icon: 'home-outline', 
      iconFilled: 'home',
      badge: null 
    },
    { 
      id: 'Video', 
      label: '', 
      icon: 'play-circle-outline', 
      iconFilled: 'play-circle',
      badge: null 
    },
    { 
      id: 'Party', 
      label: '', 
      icon: 'bell-outline', 
      iconFilled: 'bell',
      badge: unreadCount > 0 ? unreadCount : null 
    },
    { 
      id: 'Profile', 
      label: '', 
      icon: 'account-circle-outline', 
      iconFilled: 'account-circle',
      badge: null 
    },
  ], [unreadCount]);

  // 1) Ẩn khi ở tab Video hoặc Chat (fullscreen experience)
  const currentRoute = state.routes[state.index];
  const nestedFocused = getFocusedNestedRouteName(currentRoute);
  if (currentRoute?.name === 'Video' || currentRoute?.name === 'Chat') {
    return null;
  }

  // 2) Ẩn khi ở trong ChatDetail hoặc ChatList (màn hình tin nhắn)
  if (nestedFocused === 'ChatDetail' || nestedFocused === 'ChatList') {
    return null;
  }

  // 3) Ẩn ở một số màn hình cụ thể trong Profile stack (nhưng hiển thị ở MyProfile và Profile chính)
  const hiddenProfileScreens = ['Profile', 'EditProfile', 'Settings', 'InterfaceSettings', 'FontSizeSettings', 
    'Feedback', 'Help', 'StatusFeed', 'ActivityStatus', 
    'DeviceManagement', 'Security', 'Privacy', 'AppInfo', 
    'SelfDestructPost', 'QRScanner', 'AddPhone', 'VerifyPhone', 'SystemNotifications'];
  if (currentRoute?.name === 'Profile' && hiddenProfileScreens.includes(nestedFocused || '')) {
    return null;
  }

  // 3) Ẩn/hiện dựa trên context (dùng cho NewsFeed khi cuộn)
  if (!isVisible) {
    return null;
  }
  return (
    <View pointerEvents="box-none" style={[styles.absolute]}>
      <View
        style={[
          styles.tabBarBackground,
          {
            paddingBottom: clamp(insets.bottom || 0, 15, 60), // Giống social-app-main
            backgroundColor: colors.surface || colors.background, // Sử dụng theme colors
            borderTopColor: colors.border || '#E0E0E0',
          },
        ]}
      >
        <View style={styles.tabsContainer}>
          {state.routes.map((route: any, index: number) => {
            const { options } = descriptors[route.key];
            const isFocused = state.index === index;
            const tabItem = tabItems.find(item => item.id === route.name);
            if (!tabItem) return null;
            const onPress = () => {
              // Immediately navigate without waiting for event emission
              if (!isFocused) {
                // Direct navigation for better responsiveness
                navigation.navigate(route.name);
              } else if (isFocused && route.name === 'NewsFeed') {
                // If already on NewsFeed tab, scroll to top and refresh (like Facebook)
                const feedStack = navigation.getParent();
                if (feedStack) {
                  // Navigate to Feed screen with refresh param
                  feedStack.navigate('Feed', { 
                    refresh: Date.now(),
                    scrollToTop: true 
                  });
                } else {
                  // Fallback: navigate with refresh param
                  navigation.navigate(route.name, { 
                    refresh: Date.now(),
                    scrollToTop: true 
                  });
                }
              }
              
              // Emit event after navigation for compatibility
              navigation.emit({
                type: 'tabPress',
                target: route.key,
                canPreventDefault: false,
              });
            };

            const onLongPress = () => {
              navigation.emit({
                type: 'tabLongPress',
                target: route.key,
              });
            };

            // Nếu là tab Profile, hiển thị avatar thay vì icon (giống social-app-main)
            if (tabItem.id === 'Profile') {
              return (
                <TouchableOpacity
                  key={route.key}
                  accessibilityRole="button"
                  accessibilityState={isFocused ? { selected: true } : {}}
                  accessibilityLabel={options.tabBarAccessibilityLabel}
                  testID={options.tabBarTestID}
                  onPress={onPress}
                  onLongPress={onLongPress}
                  style={styles.tabItem}
                  activeOpacity={0.7}
                >
                  <View style={styles.avatarContainer}>
                    <View style={[
                      styles.profileAvatarWrapper,
                      isFocused && styles.profileAvatarActive,
                      {
                        borderColor: isFocused 
                          ? (colors.text || '#000000') 
                          : 'transparent',
                        borderWidth: isFocused ? 1 : 0,
                      }
                    ]}>
                      {user?.avatar_url ? (
                        <Image
                          source={{ uri: getAvatarURL(user.avatar_url) }}
                          style={styles.profileAvatar}
                        />
                      ) : (
                        <View style={[
                          styles.profileAvatar,
                          styles.profileAvatarPlaceholder,
                          { 
                            backgroundColor: colors.primary || '#0084ff',
                          },
                        ]}>
                          <Text style={styles.profileAvatarText}>
                            {getInitials(user?.full_name || user?.username || 'U')}
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>
                </TouchableOpacity>
              );
            }

            return (
              <TouchableOpacity
                key={route.key}
                accessibilityRole="button"
                accessibilityState={isFocused ? { selected: true } : {}}
                accessibilityLabel={options.tabBarAccessibilityLabel}
                testID={options.tabBarTestID}
                onPress={onPress}
                onLongPress={onLongPress}
                style={styles.tabItem}
                activeOpacity={0.7}
              >
                <View style={styles.iconContainer}>
                  <MaterialCommunityIcons
                    name={(isFocused ? tabItem.iconFilled : tabItem.icon) as any}
                    size={getIconSize(tabItem.id)}
                    color={getIconColors(colors, isFocused)}
                    style={[
                      { opacity: getIconOpacity(isFocused) },
                      tabItem.id === 'Video' && styles.videoIcon, // Adjust position for Video icon
                    ]}
                  />
                  {/* Badge cho thông báo - màu đỏ */}
                  {tabItem.badge && tabItem.badge !== null && (
                    <>
                      {typeof tabItem.badge === 'number' && tabItem.badge > 0 ? (
                        <View style={[styles.badge, { backgroundColor: '#FF3B30' }]}>
                          <Text style={styles.badgeText}>
                            {tabItem.badge > 99 ? '99+' : tabItem.badge.toString()}
                          </Text>
                        </View>
                      ) : tabItem.badge === 'dot' ? (
                        <View style={[styles.dot, { backgroundColor: '#FF3B30' }]} />
                      ) : null}
                    </>
                  )}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  absolute: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 100,
  },
  tabBarBackground: {
    width: '100%',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E0E0E0',
    // Không có paddingTop ở đây - giống social-app-main (paddingTop chỉ ở tabItem)
    paddingLeft: 5,
    paddingRight: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 8,
  },
  tabsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    width: '100%',
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 13, // Giống chính xác social-app-main
    paddingBottom: 4, // Giống chính xác social-app-main
  },
  iconContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 'auto',
    marginRight: 'auto',
  },
  // Icon positioning adjustments (giống social-app-main)
  homeIcon: {},
  videoIcon: {
    top: -1, // Giống searchIcon trong social-app-main
  },
  bellIcon: {},
  avatarContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 'auto',
    marginRight: 'auto',
  },
  profileAvatarWrapper: {
    borderRadius: 100, // Full circle
    borderWidth: 1,
    borderColor: 'transparent',
    overflow: 'hidden',
  },
  profileAvatarActive: {
    borderWidth: 1,
    borderRadius: 100,
  },
  profileAvatar: {
    width: ICON_WIDTH - 2, // Giống social-app-main (28 - 2 = 26)
    height: ICON_WIDTH - 2,
    borderRadius: (ICON_WIDTH - 2) / 2,
  },
  profileAvatarPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileAvatarText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  badge: {
    position: 'absolute',
    right: -6, // Điều chỉnh để badge gần icon hơn, không bị đẩy ra ngoài quá xa
    top: -6, // Điều chỉnh để badge ở góc trên bên phải của icon
    borderRadius: 6,
    paddingHorizontal: 4,
    paddingBottom: 1,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 12, // Giống social-app-main
    fontWeight: '600', // Giống social-app-main
    fontVariant: ['tabular-nums'], // Giống social-app-main (số có chiều rộng đồng nhất)
  },
  dot: {
    position: 'absolute',
    right: -2, // Điều chỉnh để dot gần icon hơn
    top: -2, // Điều chỉnh để dot ở góc trên bên phải của icon
    width: 8,
    height: 8,
    borderRadius: 6,
    zIndex: 1,
  },
});

export default BottomTabBar;

