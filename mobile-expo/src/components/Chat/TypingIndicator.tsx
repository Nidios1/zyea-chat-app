import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { Text } from 'react-native-paper';
import { useTheme } from '../../contexts/ThemeContext';

interface TypingIndicatorProps {
  typingUsers: Array<{
    userId: string;
    username?: string;
    full_name?: string;
  }>;
  userName?: string;
}

const TypingIndicator: React.FC<TypingIndicatorProps> = ({ typingUsers, userName }) => {
  const { colors, isDarkMode } = useTheme();

  if (!typingUsers || typingUsers.length === 0) {
    return null;
  }

  const getTypingText = () => {
    if (typingUsers.length === 1) {
      const displayName = typingUsers[0].full_name || typingUsers[0].username || userName || 'Người dùng';
      return `${displayName} đang soạn tin`;
    } else if (typingUsers.length === 2) {
      const name1 = typingUsers[0].full_name || typingUsers[0].username || 'Người dùng';
      const name2 = typingUsers[1].full_name || typingUsers[1].username || 'Người dùng';
      return `${name1} và ${name2} đang soạn tin`;
    } else {
      return `${typingUsers.length} người đang soạn tin`;
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: 'transparent' }]}>
      <Text style={[styles.text, { color: colors.textSecondary }]}>
        {getTypingText()}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginBottom: 4,
  },
  text: {
    fontSize: 13,
    fontStyle: 'italic',
  },
});

export default TypingIndicator;
