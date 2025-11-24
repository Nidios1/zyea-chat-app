import React from 'react';
import { Text as RNText, TextProps as RNTextProps, StyleSheet } from 'react-native';
import { useFontSize } from '../../contexts/FontSizeContext';

interface ScaledTextProps extends RNTextProps {
  /**
   * Base font size (will be scaled based on user settings)
   * If fontSize is provided in style, it will override this
   */
  baseFontSize?: number;
}

/**
 * Text component that automatically scales font size based on user settings
 * 
 * Usage:
 * <ScaledText baseFontSize={16}>Hello World</ScaledText>
 * 
 * Or with style:
 * <ScaledText baseFontSize={16} style={{ color: 'red' }}>Hello World</ScaledText>
 */
export const ScaledText: React.FC<ScaledTextProps> = ({
  baseFontSize,
  style,
  ...props
}) => {
  const { getFontSize } = useFontSize();
  
  // If baseFontSize is provided, scale it
  // If fontSize is in style, use that instead (user override)
  const flattenedStyle = StyleSheet.flatten(style);
  const finalFontSize = flattenedStyle?.fontSize 
    ? flattenedStyle.fontSize 
    : baseFontSize 
      ? getFontSize(baseFontSize) 
      : undefined;
  
  return (
    <RNText
      {...props}
      style={[
        style,
        finalFontSize !== undefined && { fontSize: finalFontSize }
      ]}
    />
  );
};

export default ScaledText;

