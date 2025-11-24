import React, { useCallback, useMemo } from 'react';
import { LayoutAnimation, TextStyle, TouchableOpacity, Platform } from 'react-native';
import { Text } from 'react-native-paper';
import { useTheme as useAppTheme } from '../../contexts/ThemeContext';

interface ShowMoreTextButtonProps {
  onPress: () => void;
  style?: TextStyle;
  isExpanded?: boolean;
}

const MAX_POST_LINES = 5; // Giảm xuống 5 dòng để dễ thấy thay đổi hơn

export function ShowMoreTextButton({ onPress: onPressProp, style, isExpanded = false }: ShowMoreTextButtonProps) {
  const { colors } = useAppTheme();

  const onPress = useCallback(() => {
    if (Platform.OS === 'android' && Platform.Version >= 16) {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    }
    onPressProp();
  }, [onPressProp]);

  const textStyle = useMemo(() => {
    return {
      fontSize: 16,
      lineHeight: 22,
      letterSpacing: -0.2,
      ...style,
    } as TextStyle;
  }, [style]);

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.6}
      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      style={{
        alignSelf: 'flex-start',
        marginTop: 8,
        marginBottom: 4,
        paddingVertical: 4,
        paddingHorizontal: 0,
      }}
    >
      <Text
        style={[
          textStyle,
          {
            color: '#1877F2', // Màu xanh sáng giống Facebook
            fontWeight: '600',
            fontSize: 15,
          },
        ]}
      >
        {isExpanded ? 'Thu gọn' : 'Xem thêm'}
      </Text>
    </TouchableOpacity>
  );
}

export { MAX_POST_LINES };

