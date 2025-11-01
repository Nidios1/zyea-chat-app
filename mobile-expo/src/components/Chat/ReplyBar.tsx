import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';

interface ReplyBarProps {
  replyMessage: {
    id: string;
    content: string;
    full_name?: string;
    username?: string;
  } | null;
  onCancel: () => void;
}

const ReplyBar: React.FC<ReplyBarProps> = ({ replyMessage, onCancel }) => {
  const { isDarkMode, colors } = useTheme();

  if (!replyMessage) return null;

  const senderName = replyMessage.full_name || replyMessage.username || 'Unknown';

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: isDarkMode ? '#2a2a2b' : '#f0f2f5',
          borderBottomColor: colors.border,
        },
      ]}
    >
      <View style={styles.iconContainer}>
        <MaterialCommunityIcons name="reply" size={20} color={colors.textSecondary} />
      </View>
      <View style={styles.content}>
        <Text
          style={[styles.title, { color: colors.textSecondary }]}
          numberOfLines={1}
        >
          Đang trả lời {senderName}
        </Text>
        <Text
          style={[styles.message, { color: colors.text }]}
          numberOfLines={1}
        >
          {replyMessage.content}
        </Text>
      </View>
      <TouchableOpacity
        onPress={onCancel}
        style={[styles.closeButton, { backgroundColor: isDarkMode ? '#3a3a3b' : '#e4e6ea' }]}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <MaterialCommunityIcons name="close" size={18} color={colors.textSecondary} />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    gap: 12,
  },
  iconContainer: {
    flexShrink: 0,
  },
  content: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 2,
  },
  message: {
    fontSize: 13,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
});

export default ReplyBar;

