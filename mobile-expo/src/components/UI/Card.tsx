import React from 'react';
import { View, StyleSheet, ViewStyle, TouchableOpacity, Pressable } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { spacing, borderRadius, shadows, padding } from '../../config/designTokens';

interface CardProps {
  children: React.ReactNode;
  onPress?: () => void;
  style?: ViewStyle;
  padding?: number;
  margin?: number;
  elevation?: number;
  borderRadius?: number;
  testID?: string;
}

/**
 * Card Component - Shared UI Component
 * 
 * A reusable card component with consistent styling.
 * Supports pressable cards and custom styling.
 * 
 * @param children - Card content
 * @param onPress - Optional press handler (makes card pressable)
 * @param style - Custom container style
 * @param padding - Card padding (default: 16)
 * @param margin - Card margin (default: 0)
 * @param elevation - Shadow elevation (default: 1)
 * @param borderRadius - Border radius (default: 12)
 */
const Card = React.memo<CardProps>(({
  children,
  onPress,
  style,
  padding: paddingProp = padding.card,
  margin: marginProp = 0,
  elevation = 1,
  borderRadius: borderRadiusProp = borderRadius.card,
  testID,
}) => {
  const { colors, isDarkMode } = useTheme();
  
  const cardStyle: ViewStyle = {
    backgroundColor: colors.surface,
    borderRadius: borderRadiusProp,
    padding: paddingProp,
    margin: marginProp,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border || (isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)'),
    ...(elevation > 0 && shadows.getShadow(elevation === 1 ? 'sm' : elevation === 2 ? 'md' : 'lg')),
    elevation: elevation === 0 ? 0 : elevation,
    ...style,
  };
  
  if (onPress) {
    return (
      <TouchableOpacity
        style={cardStyle}
        onPress={onPress}
        activeOpacity={0.7}
        testID={testID}
      >
        {children}
      </TouchableOpacity>
    );
  }
  
  return (
    <View style={cardStyle} testID={testID}>
      {children}
    </View>
  );
});

Card.displayName = 'Card';

export default Card;

