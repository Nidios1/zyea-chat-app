import React from 'react';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';

interface ReactionBarProps {
  onReactionSelect: (emoji: string) => void;
  reactionCount?: number;
}

const REACTIONS = ['❤️', '😂', '😮', '😘', '😢', '😠', '👍'];

const ReactionBar: React.FC<ReactionBarProps> = ({ onReactionSelect, reactionCount }) => {
  const { isDarkMode, colors } = useTheme();

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: isDarkMode ? '#3a3a3b' : '#f0f2f5',
        },
      ]}
    >
      <View style={styles.emojiContainer}>
        {REACTIONS.map((emoji, index) => (
          <TouchableOpacity
            key={index}
            style={styles.emojiButton}
            onPress={() => onReactionSelect(emoji)}
            activeOpacity={0.6}
          >
            <Text style={styles.emoji}>{emoji}</Text>
          </TouchableOpacity>
        ))}
        {/* More button - nút "+" để mở thêm reactions */}
        <TouchableOpacity
          style={[
            styles.moreButton,
            {
              backgroundColor: isDarkMode ? '#4a4a4b' : '#e4e6ea',
            },
          ]}
          onPress={() => {
            // TODO: Implement more reactions picker
          }}
          activeOpacity={0.6}
        >
          <MaterialCommunityIcons 
            name="plus" 
            size={16} 
            color={colors.textSecondary} 
          />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    width: '100%',
  },
  emojiContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    gap: 8,
  },
  emojiButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  emoji: {
    fontSize: 24,
  },
  moreButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 4,
  },
});

export default ReactionBar;

