import React from 'react';
import { View, StyleSheet, Platform, Image, TouchableOpacity, Text } from 'react-native';
import Animated, { useSharedValue } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';

interface HomeHeaderLayoutProps {
  children?: React.ReactNode;
  tabBar?: React.ReactNode; // TabBar component to render below header
  onMenuPress?: () => void;
  onLogoPress?: () => void;
  onAddPress?: () => void;
  onSearchPress?: () => void;
  onMessengerPress?: () => void;
  unreadCount?: number;
  headerHeight?: Animated.SharedValue<number>;
  onHeaderHeightChange?: (height: number) => void;
}

export function HomeHeaderLayout({
  children,
  tabBar,
  onMenuPress,
  onLogoPress,
  onAddPress,
  onSearchPress,
  onMessengerPress,
  unreadCount = 0,
  headerHeight,
  onHeaderHeightChange,
}: HomeHeaderLayoutProps) {
  const { colors, isDarkMode } = useTheme();
  const insets = useSafeAreaInsets();

  const styles = createStyles(colors, isDarkMode, insets);

  return (
    <Animated.View
      style={[
        styles.container,
        {
          paddingTop: Math.max(insets.top - 4, 0), // Giảm 4px để đẩy header lên cao hơn
        },
      ]}
      onLayout={(e) => {
        const height = e.nativeEvent.layout.height;
        if (headerHeight) {
          headerHeight.value = height;
        }
        if (onHeaderHeightChange) {
          onHeaderHeightChange(height);
        }
      }}
    >
      <View style={styles.headerOuter}>
        {/* Left Slot - Menu Button */}
        <View style={styles.slot}>
          <TouchableOpacity
            style={styles.slotButton}
            onPress={onMenuPress}
            activeOpacity={0.7}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <MaterialCommunityIcons name="menu" size={28} color={colors.text} />
          </TouchableOpacity>
        </View>

        {/* Center - Logo */}
        <View style={styles.centerSlot}>
          <TouchableOpacity
            style={styles.logoButton}
            onPress={onLogoPress}
            activeOpacity={0.7}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Image
              source={require('../../../assets/Zyea.png')}
              style={styles.logoImage}
            />
          </TouchableOpacity>
        </View>

        {/* Right Slot - Add, Search and Messenger */}
        <View style={styles.rightSlotContainer}>
          <View style={styles.rightButtons}>
            {onAddPress && (
              <TouchableOpacity
                style={styles.addButton}
                onPress={onAddPress}
                activeOpacity={0.7}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <MaterialCommunityIcons name="plus-circle" size={28} color={colors.primary || '#1877F2'} />
              </TouchableOpacity>
            )}
            {onSearchPress && (
              <TouchableOpacity
                style={styles.slotButton}
                onPress={() => {
                  // Đảm bảo callback được gọi ngay lập tức
                  if (onSearchPress) {
                    onSearchPress();
                  }
                }}
                activeOpacity={0.6}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                delayPressIn={0}
              >
                <MaterialCommunityIcons name="magnify" size={26} color={colors.text} />
              </TouchableOpacity>
            )}
            {onMessengerPress && (
              <TouchableOpacity
                style={styles.slotButton}
                onPress={onMessengerPress}
                activeOpacity={0.7}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <View style={styles.messageIconContainer}>
                  <MaterialCommunityIcons name="facebook-messenger" size={26} color={colors.text} />
                  {unreadCount > 0 && (
                    <View style={styles.messageBadge}>
                      <View style={styles.messageBadgeInner}>
                        <Text style={styles.messageBadgeText}>
                          {unreadCount > 99 ? '99+' : unreadCount.toString()}
                        </Text>
                      </View>
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
      {/* TabBar below header - giống social-app-main */}
      {tabBar}
      {children}
    </Animated.View>
  );
}

const createStyles = (
  colors: any,
  isDarkMode: boolean,
  insets: { top: number; bottom: number; left: number; right: number }
) =>
  StyleSheet.create({
    container: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      zIndex: 1000,
      elevation: Platform.OS === 'android' ? 4 : 0,
      backgroundColor: isDarkMode ? colors.background || '#000000' : colors.surface || '#FFFFFF',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
    },
    headerOuter: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 12,
      paddingTop: Platform.OS === 'ios' ? 8 : 10,
      paddingBottom: Platform.OS === 'ios' ? 8 : 12,
      minHeight: Platform.OS === 'ios' ? 44 : 56,
    },
    slot: {
      width: 34,
      height: 34,
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 10,
    },
    slotButton: {
      width: 34,
      height: 34,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 17,
    },
    centerSlot: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1,
      pointerEvents: 'box-none',
      minHeight: 34,
    },
    logoButton: {
      alignItems: 'center',
      justifyContent: 'center',
    },
    logoImage: {
      width: 30,
      height: 30,
      borderRadius: 8,
    },
    rightSlotContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'flex-end',
    },
    rightButtons: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8, // Khoảng cách giữa các icon
    },
    addButton: {
      width: 34,
      height: 34,
      alignItems: 'center',
      justifyContent: 'center',
    },
    messageIconContainer: {
      position: 'relative',
      alignItems: 'center',
      justifyContent: 'center',
    },
    messageBadge: {
      position: 'absolute',
      top: -6,
      right: -6,
      backgroundColor: 'transparent',
    },
    messageBadgeInner: {
      minWidth: 18,
      height: 18,
      borderRadius: 9,
      backgroundColor: '#FF3B30',
      borderWidth: 2,
      borderColor: isDarkMode ? colors.background || '#000000' : colors.surface || '#FFFFFF',
      paddingHorizontal: 4,
      alignItems: 'center',
      justifyContent: 'center',
    },
    messageBadgeText: {
      color: '#FFFFFF',
      fontSize: 10,
      fontWeight: '700',
      lineHeight: 12,
    },
  });

