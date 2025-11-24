/**
 * Design Tokens - Centralized design system values
 * 
 * This file contains all design tokens for spacing, typography, colors, shadows, etc.
 * Use these tokens instead of hardcoded values for consistency across the app.
 */

import { Platform, StyleSheet } from 'react-native';

// ============================================
// SPACING SYSTEM
// ============================================
// Based on 4px grid system for consistency
export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
  xxxl: 40,
} as const;

// Padding presets
export const padding = {
  xs: spacing.xs,
  sm: spacing.sm,
  md: spacing.md,
  base: spacing.base,
  lg: spacing.lg,
  xl: spacing.xl,
  screen: spacing.base, // Standard screen padding
  card: spacing.base, // Standard card padding
  button: {
    horizontal: spacing.base,
    vertical: spacing.sm,
  },
} as const;

// Margin presets
export const margin = {
  xs: spacing.xs,
  sm: spacing.sm,
  md: spacing.md,
  base: spacing.base,
  lg: spacing.lg,
  xl: spacing.xl,
  section: spacing.xl, // Section spacing
  item: spacing.md, // Item spacing in lists
} as const;

// Gap presets (for flexbox gap)
export const gap = {
  xs: spacing.xs,
  sm: spacing.sm,
  md: spacing.md,
  base: spacing.base,
  lg: spacing.lg,
} as const;

// ============================================
// TYPOGRAPHY SYSTEM
// ============================================
export const typography = {
  // Font sizes
  fontSize: {
    xs: 11,
    sm: 12,
    base: 14,
    md: 16,
    lg: 18,
    xl: 20,
    xxl: 24,
    xxxl: 32,
  },
  
  // Font weights
  fontWeight: {
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
  },
  
  // Line heights (relative to font size)
  lineHeight: {
    tight: 1.2,
    normal: 1.4,
    relaxed: 1.6,
    loose: 1.8,
  },
  
  // Letter spacing
  letterSpacing: {
    tight: -0.5,
    normal: 0,
    wide: 0.5,
  },
} as const;

// Typography presets
export const textStyles = {
  // Headings
  h1: {
    fontSize: typography.fontSize.xxxl,
    fontWeight: typography.fontWeight.bold,
    lineHeight: typography.fontSize.xxxl * typography.lineHeight.tight,
    letterSpacing: typography.letterSpacing.tight,
  },
  h2: {
    fontSize: typography.fontSize.xxl,
    fontWeight: typography.fontWeight.bold,
    lineHeight: typography.fontSize.xxl * typography.lineHeight.tight,
    letterSpacing: typography.letterSpacing.tight,
  },
  h3: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.semibold,
    lineHeight: typography.fontSize.xl * typography.lineHeight.normal,
    letterSpacing: typography.letterSpacing.normal,
  },
  
  // Body text
  body: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.regular,
    lineHeight: typography.fontSize.md * typography.lineHeight.relaxed,
    letterSpacing: typography.letterSpacing.normal,
  },
  bodySmall: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.regular,
    lineHeight: typography.fontSize.base * typography.lineHeight.relaxed,
    letterSpacing: typography.letterSpacing.normal,
  },
  
  // Labels
  label: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    lineHeight: typography.fontSize.sm * typography.lineHeight.normal,
    letterSpacing: typography.letterSpacing.normal,
  },
  
  // Captions
  caption: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.regular,
    lineHeight: typography.fontSize.xs * typography.lineHeight.normal,
    letterSpacing: typography.letterSpacing.normal,
  },
} as const;

// ============================================
// BORDER RADIUS
// ============================================
export const borderRadius = {
  xs: 4,
  sm: 6,
  md: 8,
  base: 12,
  lg: 16,
  xl: 20,
  full: 9999,
  
  // Common presets
  button: 8,
  card: 12,
  input: 12,
  avatar: 9999, // Full circle
  badge: 10,
} as const;

// ============================================
// SHADOWS & ELEVATION
// ============================================
export const shadows = {
  // iOS shadows
  ios: {
    sm: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
    },
    md: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
    },
    lg: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 8,
    },
    xl: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.2,
      shadowRadius: 16,
    },
  },
  
  // Android elevation
  android: {
    sm: { elevation: 1 },
    md: { elevation: 2 },
    lg: { elevation: 4 },
    xl: { elevation: 8 },
  },
  
  // Platform-agnostic shadow helper
  getShadow: (size: 'sm' | 'md' | 'lg' | 'xl') => {
    if (Platform.OS === 'ios') {
      return shadows.ios[size];
    }
    return shadows.android[size];
  },
} as const;

// ============================================
// TOUCH TARGETS
// ============================================
// Minimum touch target size (iOS: 44x44, Android: 48x48)
export const touchTargets = {
  min: Platform.OS === 'ios' ? 44 : 48,
  sm: 36,
  md: 40,
  lg: 44,
  xl: 48,
} as const;

// ============================================
// ANIMATIONS
// ============================================
export const animations = {
  duration: {
    fast: 150,
    normal: 300,
    slow: 500,
  },
  easing: {
    easeIn: 'ease-in',
    easeOut: 'ease-out',
    easeInOut: 'ease-in-out',
  },
} as const;

// ============================================
// Z-INDEX LAYERS
// ============================================
export const zIndex = {
  base: 0,
  dropdown: 100,
  sticky: 200,
  overlay: 300,
  modal: 400,
  popover: 500,
  tooltip: 600,
} as const;

// ============================================
// OPACITY
// ============================================
export const opacity = {
  disabled: 0.5,
  hover: 0.8,
  pressed: 0.7,
  overlay: 0.5,
  overlayDark: 0.7,
} as const;

// ============================================
// BORDER WIDTHS
// ============================================
export const borderWidth = {
  none: 0,
  hairline: StyleSheet.hairlineWidth || 0.5,
  thin: 1,
  medium: 1.5,
  thick: 2,
} as const;

