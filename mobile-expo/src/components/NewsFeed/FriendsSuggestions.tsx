import React from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { Text, Avatar } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { getAvatarURL } from '../../utils/imageUtils';
import { getInitials } from '../../utils/nameUtils';
import { spacing, typography, borderRadius } from '../../config/designTokens';
import { PWATheme } from '../../config/PWATheme';
import { VerifiedBadge } from '../Common/VerifiedBadge';

interface FriendSuggestion {
  id: string | number;
  full_name?: string;
  username?: string;
  avatar_url?: string;
  is_verified?: boolean;
}

interface FriendsSuggestionsProps {
  suggestions: FriendSuggestion[];
  onFollow?: (userId: string | number) => void;
  onDismiss?: (userId: string | number) => void;
  onPressUser?: (userId: string | number) => void;
}

const FriendsSuggestions: React.FC<FriendsSuggestionsProps> = ({
  suggestions,
  onFollow,
  onDismiss,
  onPressUser,
}) => {
  const { colors, isDarkMode } = useTheme();

  if (!suggestions || suggestions.length === 0) {
    return null;
  }

  const dynamicStyles = createStyles(colors, isDarkMode);

  return (
    <View style={dynamicStyles.container}>
      <View style={dynamicStyles.header}>
        <Text style={[dynamicStyles.title, { color: colors.text }]}>
          Gợi ý cho bạn
        </Text>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={dynamicStyles.scrollContent}
      >
        {suggestions.map((suggestion) => (
          <View key={suggestion.id} style={dynamicStyles.suggestionCard}>
            <TouchableOpacity
              style={dynamicStyles.dismissButton}
              onPress={() => onDismiss?.(suggestion.id)}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <MaterialCommunityIcons
                name="close"
                size={16}
                color={colors.textSecondary}
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={dynamicStyles.userInfo}
              onPress={() => onPressUser?.(suggestion.id)}
              activeOpacity={0.7}
            >
              {suggestion.avatar_url ? (
                <Image
                  source={{ uri: getAvatarURL(suggestion.avatar_url) }}
                  style={dynamicStyles.avatar}
                />
              ) : (
                <Avatar.Text
                  size={60}
                  label={getInitials(suggestion.full_name || suggestion.username || 'U')}
                  style={dynamicStyles.avatar}
                />
              )}
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                <Text
                  style={[dynamicStyles.name, { color: colors.text }]}
                  numberOfLines={1}
                >
                  {suggestion.full_name || suggestion.username || 'Người dùng'}
                </Text>
                {/* Verified badge */}
                {suggestion.is_verified && (
                  <VerifiedBadge size={14} />
                )}
              </View>
              <Text
                style={[dynamicStyles.username, { color: colors.textSecondary }]}
                numberOfLines={1}
              >
                @{suggestion.username || 'user'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                dynamicStyles.followButton, 
                { 
                  // Đảm bảo background luôn có màu rõ ràng, không phải trắng
                  backgroundColor: (colors.primary && colors.primary !== '#FFFFFF' && colors.primary !== '#ffffff' && colors.primary !== colors.background) 
                    ? colors.primary 
                    : '#0084ff', // Fallback về màu xanh nếu primary là trắng hoặc trùng với background
                }
              ]}
              onPress={() => onFollow?.(suggestion.id)}
              activeOpacity={0.8}
            >
              <Text style={[dynamicStyles.followButtonText, { color: '#FFFFFF' }]}>
                Theo dõi
              </Text>
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

const createStyles = (colors: typeof PWATheme.light, isDarkMode: boolean) =>
  StyleSheet.create({
    container: {
      backgroundColor: colors.background,
      paddingVertical: spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: colors.border || (isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)'),
    },
    header: {
      paddingHorizontal: spacing.base,
      marginBottom: spacing.sm,
    },
    title: {
      fontSize: typography.fontSize.lg,
      fontWeight: typography.fontWeight.bold,
    },
    scrollContent: {
      paddingHorizontal: spacing.base,
      gap: spacing.sm,
    },
    suggestionCard: {
      width: 140,
      backgroundColor: colors.surface || (isDarkMode ? '#1E1E1E' : '#FFFFFF'),
      borderRadius: borderRadius.lg,
      padding: spacing.sm,
      marginRight: spacing.sm,
      borderWidth: 1,
      borderColor: colors.border || (isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)'),
      position: 'relative',
    },
    dismissButton: {
      position: 'absolute',
      top: spacing.xs,
      right: spacing.xs,
      width: 24,
      height: 24,
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 10,
    },
    userInfo: {
      alignItems: 'center',
      marginTop: spacing.xs,
    },
    avatar: {
      width: 60,
      height: 60,
      borderRadius: 30,
      marginBottom: spacing.sm,
    },
    name: {
      fontSize: typography.fontSize.base,
      fontWeight: typography.fontWeight.semibold,
      textAlign: 'center',
      marginBottom: spacing.xs / 2,
    },
    username: {
      fontSize: typography.fontSize.sm,
      textAlign: 'center',
      marginBottom: spacing.sm,
    },
    followButton: {
      width: '100%',
      paddingVertical: spacing.sm,
      borderRadius: borderRadius.md,
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 36, // Đảm bảo chiều cao tối thiểu
    },
    followButtonText: {
      color: '#FFFFFF', // Luôn dùng màu trắng cho chữ, background sẽ đảm bảo tương phản
      fontSize: typography.fontSize.base,
      fontWeight: typography.fontWeight.semibold,
      textAlign: 'center',
    },
  });

export default FriendsSuggestions;

