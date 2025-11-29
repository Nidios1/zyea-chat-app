import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';

interface VerifiedBadgeProps {
  size?: number;
  onPress?: () => void;
  style?: any;
}

/**
 * VerifiedBadge - Component hiển thị tích xanh xác minh
 * Tái sử dụng ở nhiều nơi: posts, comments, messages, etc.
 */
export const VerifiedBadge: React.FC<VerifiedBadgeProps> = ({ 
  size = 16, 
  onPress,
  style 
}) => {
  const { colors } = useTheme();
  
  const badge = (
    <View style={[styles.container, { width: size, height: size }, style]}>
      <MaterialCommunityIcons
        name="check-decagram"
        size={size}
        color={colors.primary || "#0084ff"}
      />
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
        {badge}
      </TouchableOpacity>
    );
  }

  return badge;
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 4,
  },
});

export default VerifiedBadge;

