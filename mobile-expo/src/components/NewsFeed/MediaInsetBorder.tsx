import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';

/**
 * MediaInsetBorder - Applies a thin border within a bounding box
 * Used to contrast media from bg of the container
 * Logic tương tự social-app-main MediaInsetBorder
 * 
 * Tạo lại để tránh trùng lặp với social-app-main
 */
export function MediaInsetBorder({
  style,
  opaque,
  children,
}: {
  style?: any;
  opaque?: boolean;
  children?: React.ReactNode;
}) {
  const { colors, isDarkMode } = useTheme();
  const isLight = !isDarkMode;

  // Logic giống social-app-main:
  // - borderWidth: hairlineWidth cho native, 0.5 cho web high DPI
  // - borderColor: contrast_low cho light mode, contrast_high cho dark mode
  // - opacity: 0.6 nếu không opaque, 1 nếu opaque
  const borderWidth = Platform.OS === 'web' ? 0.5 : StyleSheet.hairlineWidth;
  
  return (
    <View
      style={[
        styles.border,
        {
          borderWidth,
          borderColor: opaque
            ? colors.border || (isLight ? '#E4E6EB' : '#3E4042')
            : isLight
              ? colors.border || '#E4E6EB'
              : colors.border || '#3E4042',
          opacity: opaque ? 1 : 0.6,
        },
        style,
      ]}
      pointerEvents="none">
      {children}
    </View>
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

