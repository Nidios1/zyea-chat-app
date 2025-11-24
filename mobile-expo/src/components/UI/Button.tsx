import React from 'react';
import { TouchableOpacity, StyleSheet, ActivityIndicator, ViewStyle, TextStyle } from 'react-native';
import { Text } from 'react-native-paper';
import { useTheme } from '../../contexts/ThemeContext';
import { spacing, borderRadius, shadows, touchTargets, opacity } from '../../config/designTokens';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
export type ButtonSize = 'small' | 'medium' | 'large';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  icon?: React.ReactNode;
  style?: ViewStyle;
  textStyle?: TextStyle;
  testID?: string;
}

/**
 * Button Component - Shared UI Component
 * 
 * A reusable button component with multiple variants and sizes.
 * Supports loading state, disabled state, and custom styling.
 * 
 * @param title - Button text
 * @param onPress - Press handler
 * @param variant - Button style variant (primary, secondary, outline, ghost, danger)
 * @param size - Button size (small, medium, large)
 * @param loading - Show loading indicator
 * @param disabled - Disable button
 * @param fullWidth - Make button full width
 * @param icon - Optional icon to display before text
 * @param style - Custom container style
 * @param textStyle - Custom text style
 */
const Button = React.memo<ButtonProps>(({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  loading = false,
  disabled = false,
  fullWidth = false,
  icon,
  style,
  textStyle,
  testID,
}) => {
  const { colors, isDarkMode } = useTheme();
  
  const isDisabled = disabled || loading;
  
  // Get variant styles
  const getVariantStyles = (): { backgroundColor: string; borderColor?: string; borderWidth?: number; textColor: string } => {
    switch (variant) {
      case 'primary':
        return {
          backgroundColor: colors.primary || '#1877F2',
          textColor: '#FFFFFF',
        };
      case 'secondary':
        return {
          backgroundColor: isDarkMode ? colors.surface || '#2a2a2b' : colors.border || '#E4E6EB',
          textColor: colors.text,
        };
      case 'outline':
        return {
          backgroundColor: 'transparent',
          borderColor: colors.primary || '#1877F2',
          borderWidth: 1,
          textColor: colors.primary || '#1877F2',
        };
      case 'ghost':
        return {
          backgroundColor: 'transparent',
          textColor: colors.primary || '#1877F2',
        };
      case 'danger':
        return {
          backgroundColor: colors.error || '#e74c3c',
          textColor: '#FFFFFF',
        };
      default:
        return {
          backgroundColor: colors.primary || '#1877F2',
          textColor: '#FFFFFF',
        };
    }
  };
  
  // Get size styles
  const getSizeStyles = (): { height: number; paddingHorizontal: number; fontSize: number } => {
    switch (size) {
      case 'small':
        return { 
          height: Math.max(32, touchTargets.sm), 
          paddingHorizontal: spacing.md, 
          fontSize: 13 
        };
      case 'medium':
        return { 
          height: Math.max(40, touchTargets.md), 
          paddingHorizontal: spacing.base, 
          fontSize: 15 
        };
      case 'large':
        return { 
          height: Math.max(48, touchTargets.lg), 
          paddingHorizontal: spacing.lg, 
          fontSize: 16 
        };
      default:
        return { 
          height: Math.max(40, touchTargets.md), 
          paddingHorizontal: spacing.base, 
          fontSize: 15 
        };
    }
  };
  
  const variantStyles = getVariantStyles();
  const sizeStyles = getSizeStyles();
  
  const buttonStyle: ViewStyle = {
    height: sizeStyles.height,
    paddingHorizontal: sizeStyles.paddingHorizontal,
    borderRadius: borderRadius.button,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    backgroundColor: isDisabled 
      ? (isDarkMode ? '#3a3a3b' : '#d0d0d0')
      : variantStyles.backgroundColor,
    borderColor: variantStyles.borderColor,
    borderWidth: variantStyles.borderWidth || 0,
    opacity: isDisabled ? opacity.disabled : 1,
    ...(fullWidth && { width: '100%' }),
    ...style,
  };
  
  const textColor = isDisabled 
    ? (isDarkMode ? '#666666' : '#999999')
    : variantStyles.textColor;
  
  return (
    <TouchableOpacity
      style={buttonStyle}
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.7}
      testID={testID}
    >
      {loading ? (
        <ActivityIndicator 
          size="small" 
          color={textColor} 
        />
      ) : (
        <>
          {icon && <>{icon}</>}
          <Text
            style={[
              {
                fontSize: sizeStyles.fontSize,
                fontWeight: '600',
                color: textColor,
              },
              textStyle,
            ]}
          >
            {title}
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
});

Button.displayName = 'Button';

export default Button;

