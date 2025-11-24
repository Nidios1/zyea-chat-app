import React, { useRef, useEffect, useMemo } from 'react';
import { View, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { Text, IconButton } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';

interface NotificationCardProps {
  item: {
    id: number;
    title: string;
    description: string;
    category: string;
    created_at: string;
    is_read: boolean;
  };
  index: number;
  isExpanded: boolean;
  onPress: () => void;
  onExpand: () => void;
  // Optional: Custom date formatter, nếu không có sẽ dùng default
  formatNotificationDate?: (dateString: string) => string;
}

/**
 * NotificationCard Component
 * 
 * Displays a system notification card with:
 * - Category icon and label
 * - Title and description
 * - Expandable description
 * - Date formatting
 * - Unread indicator
 * - Animation on mount
 * 
 * @param item - Notification data object
 * @param index - Index in the list (for staggered animation)
 * @param isExpanded - Whether description is expanded
 * @param onPress - Callback when card is pressed
 * @param onExpand - Callback when "Xem thêm" is pressed
 * @param formatNotificationDate - Function to format notification date
 */
const NotificationCard = React.memo<NotificationCardProps>(({ 
  item, 
  index, 
  isExpanded, 
  onPress, 
  onExpand,
  formatNotificationDate
}) => {
  const { colors, isDarkMode } = useTheme();
  
  // Default date formatter - component tự quản lý
  const defaultFormatDate = React.useCallback((dateString: string): string => {
    const date = new Date(dateString);
    const day = date.getDate();
    const month = date.getMonth() + 1;
    return `${day} tháng ${month}`;
  }, []);
  
  // Use custom formatter if provided, otherwise use default
  const formatDate = formatNotificationDate || defaultFormatDate;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  const isMountedCardRef = useRef(true);
  const animationRef = useRef<Animated.CompositeAnimation | null>(null);
  
  // Memoize styles to avoid recalculation on every render
  const styles = useMemo(() => createStyles(colors, isDarkMode), [colors, isDarkMode]);
  
  useEffect(() => {
    isMountedCardRef.current = true;
    const anim = Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        delay: index * 50,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        delay: index * 50,
        useNativeDriver: true,
      }),
    ]);
    animationRef.current = anim;
    anim.start();
    
    return () => {
      isMountedCardRef.current = false;
      if (animationRef.current) {
        try {
          animationRef.current.stop();
        } catch (e) {
          // Ignore errors khi stop animation
        }
        animationRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index]);
  
  return (
    <Animated.View
      style={{
        opacity: fadeAnim,
        transform: [{ scale: scaleAnim }],
      }}
    >
      <TouchableOpacity
        style={[
          styles.notificationCard,
          { 
            backgroundColor: colors.surface,
            borderColor: colors.border || (isDarkMode ? '#3a3a3a' : '#e5e7eb'),
            shadowColor: isDarkMode ? '#000000' : '#000000',
            shadowOpacity: isDarkMode ? 0.3 : 0.05,
          },
          !item.is_read && styles.unreadCard,
        ]}
        onPress={onPress}
        activeOpacity={0.7}
      >
        <View style={styles.cardHeader}>
          <View style={styles.categoryContainer}>
            <View style={[styles.categoryIconContainer, { 
              backgroundColor: isDarkMode 
                ? (colors.primary ? colors.primary + '40' : 'rgba(59, 130, 246, 0.4)')
                : (colors.primary || '#3b82f6')
            }]}>
              <MaterialCommunityIcons
                name="arrow-up-circle"
                size={18}
                color={isDarkMode ? colors.primary || '#3b82f6' : '#FFFFFF'}
              />
            </View>
            <Text style={[styles.categoryText, { color: colors.primary || '#3b82f6' }]}>
              {item.category}
            </Text>
          </View>
          <IconButton
            icon="dots-vertical"
            size={20}
            onPress={() => {}}
            style={styles.menuButton}
            iconColor={colors.textSecondary}
          />
        </View>

        <Text style={[styles.notificationTitle, { color: colors.text }]}>
          {item.title}
        </Text>
        
        <Text
          style={[styles.notificationDescription, { color: colors.textSecondary }]}
          numberOfLines={isExpanded ? undefined : 3}
        >
          {item.description}
        </Text>

        <View style={styles.cardFooter}>
          <TouchableOpacity onPress={onExpand}>
            <Text style={[styles.seeMoreText, { color: colors.primary || '#3b82f6' }]}>
              Xem thêm
            </Text>
          </TouchableOpacity>
          <Text style={[styles.notificationDate, { color: colors.textSecondary }]}>
            {formatDate(item.created_at)}
          </Text>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
});

NotificationCard.displayName = 'NotificationCard';

const createStyles = (colors: any, isDarkMode: boolean) => StyleSheet.create({
  notificationCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  unreadCard: {
    // Styles applied dynamically
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  categoryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryIconContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  categoryText: {
    fontSize: 13,
    fontWeight: '500',
  },
  menuButton: {
    margin: 0,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 10,
    marginTop: 4,
  },
  notificationDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
    paddingTop: 8,
  },
  seeMoreText: {
    fontSize: 14,
    fontWeight: '500',
  },
  notificationDate: {
    fontSize: 13,
    fontWeight: '400',
  },
});

export default NotificationCard;

