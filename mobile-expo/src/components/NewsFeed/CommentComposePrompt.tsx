import React from 'react';
import { View, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { Text, Avatar } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { PWATheme } from '../../config/PWATheme';
import { useAuth } from '../../contexts/AuthContext';
import { getInitials, getAvatarURL } from '../../utils/imageUtils';

interface CommentComposePromptProps {
  onPressCompose: () => void;
  placeholder?: string;
  style?: any;
}

const CommentComposePrompt: React.FC<CommentComposePromptProps> = ({
  onPressCompose,
  placeholder = 'Viết bình luận...',
  style,
}) => {
  const { colors, isDarkMode } = useTheme();
  const { user } = useAuth();
  const styles = createStyles(colors, isDarkMode);

  const userName = user?.full_name || user?.username || 'Bạn';
  const userAvatar = user?.avatar_url;

  return (
    <View style={[styles.container, style]}>
      <TouchableOpacity
        style={styles.promptButton}
        onPress={onPressCompose}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel="Viết bình luận"
      >
        {user && (
          <View style={styles.avatarContainer}>
            {userAvatar ? (
              <Avatar.Image
                size={24}
                source={{ uri: getAvatarURL(userAvatar) }}
              />
            ) : (
              <Avatar.Text
                size={24}
                label={getInitials(userName)}
              />
            )}
          </View>
        )}
        <Text style={styles.promptText}>{placeholder}</Text>
      </TouchableOpacity>
    </View>
  );
};

const createStyles = (colors: typeof PWATheme.light, isDarkMode: boolean) => StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border || (isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)'),
    backgroundColor: colors.surface,
  },
  promptButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 24,
    backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
    borderWidth: Platform.OS === 'ios' ? 0 : StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  avatarContainer: {
    marginRight: 0,
  },
  promptText: {
    flex: 1,
    fontSize: 15,
    color: colors.textSecondary,
  },
});

export default CommentComposePrompt;

