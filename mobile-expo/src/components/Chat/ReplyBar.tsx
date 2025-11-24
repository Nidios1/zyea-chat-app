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

  // Get message type to handle stickers
  const messageType = (replyMessage as any)?.message_type || (replyMessage as any)?.type;
  const isSticker = messageType === 'sticker';
  const displayContent = isSticker ? 'Sticker' : replyMessage.content;

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: isDarkMode ? '#1e1e1f' : '#f0f2f5',
          borderLeftColor: isDarkMode ? '#0084ff' : '#0084ff',
          shadowColor: '#000',
          shadowOffset: {
            width: 0,
            height: -2,
          },
          shadowOpacity: 0.1,
          shadowRadius: 4,
          elevation: 3,
        },
      ]}
    >
      <View style={styles.leftBorder} />
      <View style={styles.content}>
        <Text
          style={[styles.title, { color: isDarkMode ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.6)' }]}
          numberOfLines={1}
        >
          Trả lời {senderName}
        </Text>
        <Text
          style={[styles.message, { color: isDarkMode ? 'rgba(255,255,255,0.9)' : 'rgba(0,0,0,0.8)' }]}
          numberOfLines={1}
        >
          {displayContent}
        </Text>
      </View>
      <TouchableOpacity
        onPress={onCancel}
        style={styles.closeButton}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        activeOpacity={0.7}
      >
        <MaterialCommunityIcons name="close" size={18} color={isDarkMode ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.6)'} />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    position: 'relative',
  },
  leftBorder: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 3,
    backgroundColor: '#0084ff',
  },
  content: {
    flex: 1,
    minWidth: 0,
    marginLeft: 8,
  },
  title: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 2,
  },
  message: {
    fontSize: 13,
    fontWeight: '400',
  },
  closeButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    marginLeft: 8,
  },
});

export default ReplyBar;

