import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';

/**
 * MediaInsetBorder - Applies a thin border within a bounding box
 * Used to contrast media from bg of the container
 * Similar to social-app-main MediaInsetBorder
 */
export function MediaInsetBorder({
  style,
  opaque,
}: {
  style?: any;
  opaque?: boolean;
}) {
  const { colors, isDarkMode } = useTheme();
  const isLight = !isDarkMode;

  return (
    <View
      style={[
        styles.border,
        {
          borderWidth: Platform.OS === 'web' ? 0.5 : StyleSheet.hairlineWidth,
          borderColor: opaque
            ? colors.border || (isLight ? '#E4E6EB' : '#3E4042')
            : isLight
              ? colors.border || '#E4E6EB'
              : colors.border || '#3E4042',
          opacity: opaque ? 1 : 0.6,
        },
        style,
      ]}
      pointerEvents="none"
    />
  );
}

const styles = StyleSheet.create({
  border: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 8,
  },
});

