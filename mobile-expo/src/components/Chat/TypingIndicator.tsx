import React from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { Text } from 'react-native-paper';

interface TypingIndicatorProps {
  typingUsers: Array<{
    userId: string;
    username?: string;
    full_name?: string;
  }>;
  userName?: string;
}

const TypingIndicator: React.FC<TypingIndicatorProps> = ({ typingUsers, userName }) => {
  if (!typingUsers || typingUsers.length === 0) {
    return null;
  }

  const getTypingText = () => {
    if (typingUsers.length === 1) {
      const displayName = typingUsers[0].full_name || typingUsers[0].username || userName || 'Người dùng';
      return `${displayName} đang soạn tin nhắn...`;
    } else if (typingUsers.length === 2) {
      const name1 = typingUsers[0].full_name || typingUsers[0].username || 'Người dùng';
      const name2 = typingUsers[1].full_name || typingUsers[1].username || 'Người dùng';
      return `${name1} và ${name2} đang soạn tin nhắn...`;
    } else {
      return `${typingUsers.length} người đang soạn tin nhắn...`;
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.text}>{getTypingText()}</Text>
      <View style={styles.dots}>
        <Animated.View style={[styles.dot, styles.dot1]} />
        <Animated.View style={[styles.dot, styles.dot2]} />
        <Animated.View style={[styles.dot, styles.dot3]} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginBottom: 4,
  },
  text: {
    fontSize: 13,
    color: '#9a9a9a',
    fontStyle: 'italic',
  },
  dots: {
    flexDirection: 'row',
    gap: 4,
    alignItems: 'center',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#9a9a9a',
  },
  dot1: {
    opacity: 0.4,
  },
  dot2: {
    opacity: 0.6,
  },
  dot3: {
    opacity: 0.8,
  },
});

export default TypingIndicator;
