import React, { memo } from 'react';
import { View, StyleSheet, Image, TouchableOpacity, Dimensions, ScrollView } from 'react-native';
import { Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { getAvatarURL, getImageURL } from '../../utils/imageUtils';
import { PWATheme } from '../../config/PWATheme';
import { spacing, typography, borderRadius } from '../../config/designTokens';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const BANNER_HEIGHT = 150;
const AVATAR_SIZE = 110; // Tăng từ 94 lên 110
const AVATAR_OFFSET = 10;
const AVATAR_TOP = 95; // Điều chỉnh để avatar vẫn chồng lên banner một nửa (150 - 55 = 95)

// Default Banner Component với gradient đẹp
const DefaultBanner = ({ colors, isDarkMode }: { colors: any; isDarkMode: boolean }) => {
  // Gradient colors - tạo gradient đẹp từ primary color
  const primaryColor = colors.primary || '#0084ff';
  
  // Helper để tạo màu với opacity
  const withOpacity = (color: string, opacity: string) => {
    // Nếu là hex color, chuyển sang rgba hoặc thêm opacity vào cuối
    if (color.startsWith('#')) {
      const hex = color.replace('#', '');
      if (hex.length === 6) {
        // Convert hex to rgba
        const r = parseInt(hex.substring(0, 2), 16);
        const g = parseInt(hex.substring(2, 4), 16);
        const b = parseInt(hex.substring(4, 6), 16);
        const opacityMap: { [key: string]: number } = {
          'FF': 1.0, 'EE': 0.93, 'DD': 0.87, 'BB': 0.73, '99': 0.6
        };
        const alpha = opacityMap[opacity] || 1.0;
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
      }
    }
    return color;
  };

  // Tạo gradient đẹp với màu primary và màu bổ sung
  // Nếu primary là blue (#0084ff), thêm purple/turquoise để tạo gradient đẹp
  const getGradientColors = () => {
    if (isDarkMode) {
      // Dark mode: gradient từ primary sang darker
      return [
        primaryColor,
        withOpacity(primaryColor, 'DD'),
        withOpacity(primaryColor, 'BB'),
        withOpacity(primaryColor, '99'),
      ];
    } else {
      // Light mode: gradient đẹp hơn với màu sáng hơn
      // Tạo gradient từ primary sang màu sáng hơn một chút
      if (primaryColor === '#0084ff' || primaryColor.includes('0084ff')) {
        // Blue gradient
        return ['#0084ff', '#0099ff', '#00aaff', '#00bbff'];
      } else {
        // Generic gradient - làm sáng màu primary
        return [
          primaryColor,
          primaryColor,
          withOpacity(primaryColor, 'EE'),
          withOpacity(primaryColor, 'DD'),
        ];
      }
    }
  };

  const gradientColors = getGradientColors();

  return (
    <LinearGradient
      colors={gradientColors}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={StyleSheet.absoluteFillObject}
    >
      {/* Decorative Pattern */}
      <View style={defaultBannerStyles.patternContainer}>
        {/* Circular decorative elements */}
        <View style={[defaultBannerStyles.circle, { top: 20, left: SCREEN_WIDTH * 0.1, width: 60, height: 60 }]} />
        <View style={[defaultBannerStyles.circle, { top: 80, right: SCREEN_WIDTH * 0.15, width: 40, height: 40 }]} />
        <View style={[defaultBannerStyles.circle, { bottom: 30, left: SCREEN_WIDTH * 0.2, width: 50, height: 50 }]} />
        
        {/* Logo/Text in center */}
        <View style={[defaultBannerStyles.logoContainer, { left: SCREEN_WIDTH / 2 - 40, top: BANNER_HEIGHT / 2 - 15 }]}>
          <Text style={defaultBannerStyles.logoText}>Zyea+</Text>
          <View style={defaultBannerStyles.decorativeLine} />
        </View>
      </View>
    </LinearGradient>
  );
};

const defaultBannerStyles = StyleSheet.create({
  patternContainer: {
    flex: 1,
    position: 'relative',
    overflow: 'hidden',
  },
  circle: {
    position: 'absolute',
    borderRadius: 999,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    opacity: 0.6,
  },
  logoContainer: {
    position: 'absolute',
    alignItems: 'center',
    width: 80,
  },
  logoText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'rgba(255, 255, 255, 0.9)',
    letterSpacing: 2,
  },
  decorativeLine: {
    width: 60,
    height: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    marginTop: 4,
    borderRadius: 1,
  },
});

interface ProfileHeaderProps {
  user: any;
  stats?: {
    followers?: number;
    following?: number;
    posts?: number;
  };
  onEditPress?: () => void;
  onSettingsPress?: () => void;
  onAvatarPress?: () => void;
  activeTab?: 'posts' | 'replies' | 'media' | 'videos' | 'likes';
  onTabChange?: (tab: 'posts' | 'replies' | 'media' | 'videos' | 'likes') => void;
  isMe?: boolean;
  onFollowPress?: () => void;
  onMessagePress?: () => void;
  isFollowing?: boolean;
  isOnline?: boolean; // Online status indicator
  isVerified?: boolean; // Verified badge
  verifiedBy?: string | null; // Who verified this account
  verifiedAt?: string | null; // When was it verified
  onVerifiedBadgePress?: () => void; // Callback when verified badge is pressed
}

export function ProfileHeader({ user, stats, onEditPress, onSettingsPress, onAvatarPress, activeTab, onTabChange, isMe: isMeProp, onFollowPress, onMessagePress, isFollowing, isOnline, isVerified, verifiedBy, verifiedAt, onVerifiedBadgePress }: ProfileHeaderProps) {
  const navigation = useNavigation();
  const { colors, isDarkMode } = useTheme();
  const { user: currentUser } = useAuth();

  // Guard check: return null nếu user không tồn tại
  if (!user) {
    return null;
  }

  const isMe = isMeProp !== undefined ? isMeProp : (currentUser?.id === user?.id);
  const hasSession = !!currentUser;
  // Trong social-app-main, Replies hiển thị khi hasSession, nhưng thực tế chỉ nên hiển thị khi xem profile của chính mình
  // Vì khi xem profile người khác, không cần xem replies của họ
  const showRepliesTab = hasSession && isMe;
  const userName = user?.full_name || user?.username || 'Người dùng';
  const userHandle = user?.username ? `@${user.username}` : '';
  const userBio = (user as any)?.bio || '';
  // Map cover_url (from server) to banner_url (client interface)
  const bannerUrl = (user as any)?.banner_url || (user as any)?.cover_url || null;

  // Format stats đơn giản như trong hình (không format K/M)
  const formatCount = (count?: number) => {
    return (count || 0).toString();
  };

  const dynamicStyles = createStyles(colors, isDarkMode);

  return (
    <View style={dynamicStyles.container}>
      {/* Banner */}
      <View style={[dynamicStyles.bannerContainer, { height: BANNER_HEIGHT }]}>
        {bannerUrl ? (
          <Image
            source={{ uri: getImageURL(bannerUrl) }}
            style={dynamicStyles.banner}
            resizeMode="cover"
          />
        ) : (
          <DefaultBanner colors={colors} isDarkMode={isDarkMode} />
        )}
      </View>

      {/* Avatar - Chồng lên banner một nửa (giống social-app-main iOS) */}
      <View style={[dynamicStyles.avatarContainer, { top: AVATAR_TOP }]}>
        <TouchableOpacity
          style={dynamicStyles.avatarBorder}
          onPress={onAvatarPress}
          activeOpacity={0.8}
        >
          {user?.avatar_url ? (
            <View style={dynamicStyles.avatarWrapper}>
              <Image
                source={{ uri: getAvatarURL(user.avatar_url) }}
                style={dynamicStyles.avatar}
                resizeMode="cover"
              />
              {/* Online status indicator - chấm xanh ở góc dưới bên phải, nằm ngoài avatar border */}
              {isOnline !== undefined && (
                <View style={[
                  dynamicStyles.onlineIndicator,
                  {
                    backgroundColor: isOnline ? '#00a651' : (colors.textSecondary || '#999999'),
                    borderColor: colors.background || (isDarkMode ? '#000000' : '#FFFFFF'),
                  }
                ]} />
              )}
            </View>
          ) : (
            <View style={[dynamicStyles.avatar, dynamicStyles.avatarPlaceholder]}>
              <MaterialCommunityIcons
                name="account"
                size={40}
                color={colors.primary || '#0084ff'}
              />
              {/* Icon camera nhỏ ở góc dưới bên phải để gợi ý có thể thêm avatar */}
              {isMe && (
                <View style={dynamicStyles.addAvatarIcon}>
                  <MaterialCommunityIcons
                    name="camera-plus"
                    size={16}
                    color={colors.background || '#FFFFFF'}
                  />
                </View>
              )}
              {/* Online status indicator cho placeholder avatar */}
              {!isMe && isOnline !== undefined && (
                <View style={[
                  dynamicStyles.onlineIndicator,
                  {
                    backgroundColor: isOnline ? '#00a651' : (colors.textSecondary || '#999999'),
                    borderColor: colors.background || (isDarkMode ? '#000000' : '#FFFFFF'),
                  }
                ]} />
              )}
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Action Buttons - Sát ảnh bìa, bên phải */}
      {isMe ? (
        <View style={dynamicStyles.actionButtonsAbsolute}>
          <TouchableOpacity
            style={[dynamicStyles.editButton, { backgroundColor: colors.surface || (isDarkMode ? '#1E1E1E' : '#F5F5F5') }]}
            onPress={onEditPress}
          >
            <Text style={[dynamicStyles.editButtonText, { color: colors.text }]}>
              Chỉnh sửa hồ sơ
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[dynamicStyles.menuButtonSmall, { backgroundColor: colors.surface || (isDarkMode ? '#1E1E1E' : '#F5F5F5') }]}
            onPress={onSettingsPress || onEditPress}
          >
            <MaterialCommunityIcons name="dots-horizontal" size={20} color={colors.text} />
          </TouchableOpacity>
        </View>
      ) : (
        <View style={dynamicStyles.actionButtonsAbsolute}>
          <TouchableOpacity
            style={[
              dynamicStyles.followButton,
              { 
                backgroundColor: isFollowing 
                  ? (colors.surface || (isDarkMode ? '#1E1E1E' : '#F5F5F5')) 
                  : '#0084ff', // Luôn dùng màu xanh cho nút "Theo dõi", không dùng colors.primary vì có thể là trắng trong dark mode
                opacity: onFollowPress ? 1 : 0.5, // Mờ nếu không có handler
              },
              isFollowing && { borderWidth: 1, borderColor: colors.border }
            ]}
            onPress={onFollowPress}
            disabled={!onFollowPress}
          >
            <Text style={[
              dynamicStyles.followButtonText,
              { color: isFollowing ? colors.text : '#FFFFFF' }
            ]}>
              {isFollowing ? 'Đang theo dõi' : 'Theo dõi'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[dynamicStyles.menuButtonSmall, { backgroundColor: colors.surface || (isDarkMode ? '#1E1E1E' : '#F5F5F5') }]}
            onPress={onMessagePress}
          >
            <MaterialCommunityIcons name="message-text-outline" size={20} color={colors.text} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[dynamicStyles.menuButtonSmall, { backgroundColor: colors.surface || (isDarkMode ? '#1E1E1E' : '#F5F5F5') }]}
            onPress={onSettingsPress}
          >
            <MaterialCommunityIcons name="dots-horizontal" size={20} color={colors.text} />
          </TouchableOpacity>
        </View>
      )}

      {/* Content Section - Giống hình ảnh */}
      <View style={dynamicStyles.content}>
        {/* Name and Handle */}
        <View style={dynamicStyles.nameHandleSection}>
          <View style={dynamicStyles.nameRow}>
            <Text style={[dynamicStyles.displayName, { color: colors.text }]}>
              {userName}
            </Text>
            {/* Verified badge */}
            {isVerified && (
              <TouchableOpacity
                onPress={onVerifiedBadgePress}
                activeOpacity={0.7}
                style={dynamicStyles.verifiedBadge}
              >
                <MaterialCommunityIcons
                  name="check-decagram"
                  size={20}
                  color={colors.primary || "#0084ff"} // Primary color for verified badge
                />
              </TouchableOpacity>
            )}
          </View>
          {userHandle && (
            <View style={dynamicStyles.handleRow}>
              <MaterialCommunityIcons
                name="white-balance-sunny"
                size={16}
                color={colors.textSecondary}
                style={{ marginRight: 4 }}
              />
              <Text style={[dynamicStyles.handle, { color: colors.textSecondary }]}>
                {userHandle}
              </Text>
            </View>
          )}
        </View>

        {/* Row 2: Metrics - Format như trong hình: "3 người theo dõi 5 đang theo dõi 7 bài đăng" */}
        {stats && (
          <View style={dynamicStyles.metrics}>
            <Text style={[dynamicStyles.metricsText, { color: colors.text }]}>
              <Text style={[dynamicStyles.metricValue, { color: colors.text }]}>
                {formatCount(stats.followers)}
              </Text>
              <Text style={[dynamicStyles.metricLabel, { color: colors.textSecondary }]}>
                {' người theo dõi '}
              </Text>
              <Text style={[dynamicStyles.metricValue, { color: colors.text }]}>
                {formatCount(stats.following)}
              </Text>
              <Text style={[dynamicStyles.metricLabel, { color: colors.textSecondary }]}>
                {' đang theo dõi '}
              </Text>
              <Text style={[dynamicStyles.metricValue, { color: colors.text }]}>
                {formatCount(stats.posts)}
              </Text>
              <Text style={[dynamicStyles.metricLabel, { color: colors.textSecondary }]}>
                {' bài đăng'}
              </Text>
            </Text>
          </View>
        )}

        {/* Bio */}
        {userBio && (
          <View style={dynamicStyles.bioSection}>
            <Text style={[dynamicStyles.bio, { color: colors.text }]}>
              {userBio}
            </Text>
          </View>
        )}

        {/* Tabs - Nằm dưới avatar và stats */}
        {onTabChange && (
          <View style={[dynamicStyles.tabBar, { backgroundColor: colors.background, marginTop: spacing.md }]}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={dynamicStyles.tabBarContent}
            >
              <TouchableOpacity
                style={[
                  dynamicStyles.tab,
                  activeTab === 'posts' && dynamicStyles.activeTab,
                  activeTab === 'posts' && { borderBottomColor: colors.primary }
                ]}
                onPress={() => onTabChange('posts')}
              >
                <Text style={[
                  dynamicStyles.tabText,
                  { color: activeTab === 'posts' ? colors.primary : colors.textSecondary }
                ]}>
                  Bài đăng
                </Text>
              </TouchableOpacity>
              {/* Replies - Chỉ hiển thị khi xem profile của chính mình (giống social-app-main logic) */}
              {showRepliesTab && (
                <TouchableOpacity
                  style={[
                    dynamicStyles.tab,
                    activeTab === 'replies' && dynamicStyles.activeTab,
                    activeTab === 'replies' && { borderBottomColor: colors.primary }
                  ]}
                  onPress={() => onTabChange('replies')}
                >
                  <Text style={[
                    dynamicStyles.tabText,
                    { color: activeTab === 'replies' ? colors.primary : colors.textSecondary }
                  ]}>
                    Trả lời
                  </Text>
                </TouchableOpacity>
              )}
              {/* Media - Luôn hiển thị (giống social-app-main: showMediaTab = !hasLabeler, nhưng trong zalo-clone không có labeler nên luôn hiển thị) */}
              <TouchableOpacity
                style={[
                  dynamicStyles.tab,
                  activeTab === 'media' && dynamicStyles.activeTab,
                  activeTab === 'media' && { borderBottomColor: colors.primary }
                ]}
                onPress={() => onTabChange('media')}
              >
                <Text style={[
                  dynamicStyles.tabText,
                  { color: activeTab === 'media' ? colors.primary : colors.textSecondary }
                ]}>
                  Phương tiện
                </Text>
              </TouchableOpacity>
              {/* Videos - Luôn hiển thị (giống social-app-main: showVideosTab = !hasLabeler, nhưng trong zalo-clone không có labeler nên luôn hiển thị) */}
              <TouchableOpacity
                style={[
                  dynamicStyles.tab,
                  activeTab === 'videos' && dynamicStyles.activeTab,
                  activeTab === 'videos' && { borderBottomColor: colors.primary }
                ]}
                onPress={() => onTabChange('videos')}
              >
                <Text style={[
                  dynamicStyles.tabText,
                  { color: activeTab === 'videos' ? colors.primary : colors.textSecondary }
                ]}>
                  Video
                </Text>
              </TouchableOpacity>
              {/* Likes - Chỉ hiển thị khi là profile của chính mình (giống social-app-main: showLikesTab = isMe) */}
              {isMe && (
                <TouchableOpacity
                  style={[
                    dynamicStyles.tab,
                    activeTab === 'likes' && dynamicStyles.activeTab,
                    activeTab === 'likes' && { borderBottomColor: colors.primary }
                  ]}
                  onPress={() => onTabChange('likes')}
                >
                  <Text style={[
                    dynamicStyles.tabText,
                    { color: activeTab === 'likes' ? colors.primary : colors.textSecondary }
                  ]}>
                    Lượt thích
                  </Text>
                </TouchableOpacity>
              )}
            </ScrollView>
          </View>
        )}
      </View>
    </View>
  );
}

const createStyles = (colors: typeof PWATheme.light, isDarkMode: boolean) => StyleSheet.create({
  container: {
    backgroundColor: colors.background,
  },
  bannerContainer: {
    width: '100%',
    height: BANNER_HEIGHT,
    position: 'relative',
    overflow: 'hidden',
  },
  banner: {
    width: '100%',
    height: '100%',
  },
  menuButton: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.base,
    zIndex: 10,
  },
  menuButtonInner: {
    width: 31,
    height: 31,
    borderRadius: 15.5,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuButtonSmall: {
    width: 36,
    height: 36,
    borderRadius: 18, // Circular button
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border || (isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'),
  },
  content: {
    paddingTop: AVATAR_SIZE / 2 - spacing.xs, // Giảm padding để đẩy nội dung lên trên, gần avatar hơn
    paddingLeft: spacing.base, // Bắt đầu từ bên trái màn hình
    paddingRight: spacing.base, // Padding phải
    paddingBottom: spacing.md,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  nameHandleSection: {
    flex: 1, // Chiếm phần còn lại
    marginRight: spacing.sm, // Khoảng cách với buttons
  },
  actionButtonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flexShrink: 0, // Không co lại
  },
  avatarContainer: {
    position: 'absolute',
    left: AVATAR_OFFSET,
    top: AVATAR_TOP, // 104px từ top của container (một nửa avatar chồng lên banner)
    zIndex: 10, // Đảm bảo avatar nằm trên banner
  },
  avatarBorder: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    borderWidth: 2,
    borderColor: colors.background || (isDarkMode ? '#000000' : '#FFFFFF'),
    padding: 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background || (isDarkMode ? '#000000' : '#FFFFFF'),
    overflow: 'visible', // Đổi thành 'visible' để online indicator không bị cắt
    position: 'relative', // Đảm bảo online indicator có thể position absolute
  },
  avatar: {
    width: AVATAR_SIZE - 8, // Trừ border (2px) và padding (2px mỗi bên = 4px)
    height: AVATAR_SIZE - 8,
    borderRadius: (AVATAR_SIZE - 8) / 2,
    backgroundColor: colors.surface || (isDarkMode ? '#1E1E1E' : '#F0F0F0'), // Thêm background để tránh nháy đen
  },
  avatarWrapper: {
    width: AVATAR_SIZE - 8,
    height: AVATAR_SIZE - 8,
    borderRadius: (AVATAR_SIZE - 8) / 2,
    overflow: 'visible', // Đổi thành 'visible' để online indicator không bị cắt
    backgroundColor: colors.surface || (isDarkMode ? '#1E1E1E' : '#F0F0F0'), // Background cho wrapper
    position: 'relative', // Đảm bảo online indicator có thể position absolute
  },
  avatarPlaceholder: {
    backgroundColor: colors.surface || (isDarkMode ? '#1E1E1E' : '#F0F0F0'),
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  addAvatarIcon: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primary || '#0084ff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.background || (isDarkMode ? '#000000' : '#FFFFFF'),
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 1, // Đặt sát avatar, chỉ cách 1px
    right: 1, // Đặt sát avatar, chỉ cách 1px
    width: 14, // Giảm kích thước xuống 14px để nhỏ gọn hơn
    height: 14,
    borderRadius: 7,
    borderWidth: 2.5,
    zIndex: 20, // Đảm bảo nằm trên avatar
  },
  actionButtonsAbsolute: {
    position: 'absolute',
    top: BANNER_HEIGHT + spacing.xs, // Sát ngay dưới banner
    right: spacing.base,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs, // Giảm gap để icon 3 chấm sát button "Chỉnh sửa hồ sơ"
    zIndex: 10,
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xs, // Giảm marginTop để đẩy lên trên
    marginBottom: spacing.sm, // Giảm marginBottom
    gap: spacing.sm,
  },
  editButton: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.base,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border || (isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'),
  },
  editButtonText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
  },
  followButton: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.base,
    borderRadius: borderRadius.lg,
  },
  followButtonText: {
    color: '#FFFFFF',
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
  },
  nameSection: {
    marginBottom: spacing.xs, // Giảm marginBottom để đẩy lên trên
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  displayName: {
    fontSize: typography.fontSize.xxl,
    fontWeight: typography.fontWeight.bold,
    lineHeight: typography.fontSize.xxl * 1.2,
  },
  handleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xs / 2,
  },
  handle: {
    fontSize: typography.fontSize.base,
  },
  metrics: {
    marginBottom: spacing.sm, // Giảm marginBottom để đẩy lên trên
  },
  metricsText: {
    fontSize: typography.fontSize.base,
    lineHeight: typography.fontSize.base * 1.4,
  },
  metricValue: {
    fontWeight: typography.fontWeight.semibold,
  },
  metricLabel: {
    fontWeight: typography.fontWeight.regular,
  },
  bioSection: {
    marginTop: spacing.xs,
  },
  bio: {
    fontSize: typography.fontSize.base,
    lineHeight: typography.fontSize.base * 1.5,
  },
  tabBar: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border || (isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'),
  },
  tabBarContent: {
    flexDirection: 'row',
  },
  tab: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.base,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
    minWidth: 80,
  },
  activeTab: {
    borderBottomWidth: 2,
  },
  tabText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
  },
});

// Memoize component để tránh re-render không cần thiết khi scroll
export default memo(ProfileHeader);

