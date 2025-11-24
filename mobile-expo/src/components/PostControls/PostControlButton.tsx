import React, { createContext, useContext, useMemo } from 'react';
import { TouchableOpacity, StyleSheet, View, type Insets } from 'react-native';
import { Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';

export const DEFAULT_HITSLOP: Insets = { top: 5, bottom: 10, left: 10, right: 10 };

const PostControlContext = createContext<{
  big?: boolean;
  active?: boolean;
  color?: string;
}>({});

PostControlContext.displayName = 'PostControlContext';

interface PostControlButtonProps {
  onPress?: () => void;
  onLongPress?: () => void;
  children: React.ReactNode;
  big?: boolean;
  active?: boolean;
  activeColor?: string;
  hitSlop?: Insets;
  testID?: string;
  label?: string;
}

export function PostControlButton({
  onPress,
  onLongPress,
  children,
  big,
  active,
  activeColor,
  hitSlop = DEFAULT_HITSLOP,
  testID,
  label,
}: PostControlButtonProps) {
  const { colors, isDarkMode } = useTheme();
  const color = activeColor && active ? activeColor : colors.textSecondary || (isDarkMode ? '#B0B3B8' : '#65676B');

  const ctx = useMemo(
    () => ({
      big,
      active,
      color,
    }),
    [big, active, color],
  );

  return (
    <PostControlContext.Provider value={ctx}>
      <TouchableOpacity
        testID={testID}
        onPress={onPress}
        onLongPress={onLongPress}
        hitSlop={hitSlop}
        activeOpacity={0.7}
        style={styles.button}
        accessibilityLabel={label}
        accessibilityRole="button">
        {children}
      </TouchableOpacity>
    </PostControlContext.Provider>
  );
}

interface PostControlButtonIconProps {
  icon: string;
  size?: number;
  color?: string;
}

export function PostControlButtonIcon({
  icon,
  size,
  color,
}: PostControlButtonIconProps) {
  const { big, color: ctxColor } = useContext(PostControlContext);
  const iconSize = size || (big ? 22 : 18);
  const iconColor = color || ctxColor;

  return (
    <MaterialCommunityIcons
      name={icon as any}
      size={iconSize}
      color={iconColor}
    />
  );
}

interface PostControlButtonTextProps {
  children: React.ReactNode;
  style?: any;
}

export function PostControlButtonText({
  children,
  style,
}: PostControlButtonTextProps) {
  const { big, active, color } = useContext(PostControlContext);

  return (
    <Text
      style={[
        big ? styles.textBig : styles.textSmall,
        { color },
        active && styles.textBold,
        style,
      ]}>
      {children}
    </Text>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'transparent',
    padding: 5,
    borderRadius: 20,
  },
  textSmall: {
    fontSize: 13,
  },
  textBig: {
    fontSize: 16,
  },
  textBold: {
    fontWeight: '600',
  },
});

