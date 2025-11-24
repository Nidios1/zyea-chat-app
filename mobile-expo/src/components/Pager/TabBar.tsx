import React, { useCallback } from 'react';
import { ScrollView, StyleSheet, View, TouchableOpacity } from 'react-native';
import Animated, {
  type SharedValue,
  useAnimatedStyle,
  interpolate,
} from 'react-native-reanimated';
import { Text } from 'react-native-paper';
import { useTheme } from '../../contexts/ThemeContext';

const ITEM_PADDING = 10;
const CONTENT_PADDING = 6;

export interface TabBarProps {
  testID?: string;
  selectedPage: number;
  items: string[];
  onSelect?: (index: number) => void;
  onPressSelected?: (index: number) => void;
  dragProgress: SharedValue<number>;
  dragState: SharedValue<'idle' | 'dragging' | 'settling'>;
  transparent?: boolean;
}

export function TabBar({
  testID,
  selectedPage,
  items,
  onSelect,
  onPressSelected,
  dragProgress,
  transparent,
}: TabBarProps) {
  const { colors, isDarkMode } = useTheme();

  const indicatorStyle = useAnimatedStyle(() => {
    'worklet';
    const progress = dragProgress.value;
    const itemWidth = 100 / items.length; // Simplified: assume equal widths
    const translateX = progress * itemWidth;
    const scaleX = 1 / items.length;

    return {
      transform: [
        {
          translateX: `${translateX}%`,
        },
        {
          scaleX: scaleX,
        },
      ],
    };
  });

  const onPressItem = useCallback(
    (index: number) => {
      onSelect?.(index);
      if (index === selectedPage) {
        onPressSelected?.(index);
      }
    },
    [onSelect, selectedPage, onPressSelected],
  );

  const itemStyle = useCallback(
    (index: number) => {
      return useAnimatedStyle(() => {
        'worklet';
        const progress = dragProgress.value;
        const opacity = interpolate(
          progress,
          [index - 1, index, index + 1],
          [0.7, 1, 0.7],
          'clamp',
        );
        return { opacity };
      });
    },
    [dragProgress],
  );

  return (
    <View
      testID={testID}
      style={[
        styles.container,
        !transparent && { backgroundColor: colors.surface },
      ]}
      accessibilityRole="tablist">
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.contentContainer}>
        {items.map((item, i) => {
          const animatedStyle = itemStyle(i);
          return (
            <TouchableOpacity
              key={i}
              testID={testID ? `${testID}-selector-${i}` : undefined}
              style={styles.item}
              onPress={() => onPressItem(i)}
              activeOpacity={0.7}
              accessibilityRole="tab">
              <Animated.View style={[animatedStyle, styles.itemInner]}>
                <Text
                  style={[
                    styles.itemText,
                    {
                      color:
                        i === selectedPage
                          ? colors.text
                          : colors.textSecondary || (isDarkMode ? '#B0B3B8' : '#65676B'),
                      fontWeight: i === selectedPage ? '600' : '500',
                    },
                  ]}>
                  {item}
                </Text>
              </Animated.View>
            </TouchableOpacity>
          );
        })}
        <Animated.View
          style={[
            indicatorStyle,
            styles.indicator,
            {
              borderColor: colors.primary || '#1877F2',
            },
          ]}
        />
      </ScrollView>
      <View
        style={[
          styles.outerBottomBorder,
          { borderBottomColor: colors.border || (isDarkMode ? '#3A3B3C' : '#E4E6EB') },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
  },
  contentContainer: {
    flexGrow: 1,
    backgroundColor: 'transparent',
    paddingHorizontal: CONTENT_PADDING,
  },
  item: {
    flexGrow: 1,
    paddingTop: 10,
    paddingHorizontal: ITEM_PADDING,
    justifyContent: 'center',
  },
  itemInner: {
    alignItems: 'center',
    flexGrow: 1,
    paddingBottom: 10,
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
  },
  itemText: {
    fontSize: 16,
    lineHeight: 20,
    textAlign: 'center',
  },
  indicator: {
    position: 'absolute',
    left: 0,
    bottom: 0,
    right: 0,
    borderBottomWidth: 2,
    transformOrigin: 'left',
  },
  outerBottomBorder: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: '100%',
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
});

