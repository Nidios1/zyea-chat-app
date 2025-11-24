import React from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  Keyframe,
  LayoutAnimationConfig,
  useReducedMotion,
} from 'react-native-reanimated';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';

const keyframe = new Keyframe({
  0: {
    transform: [{ scale: 1 }],
  },
  10: {
    transform: [{ scale: 0.7 }],
  },
  40: {
    transform: [{ scale: 1.2 }],
  },
  100: {
    transform: [{ scale: 1 }],
  },
});

const circle1Keyframe = new Keyframe({
  0: {
    opacity: 0,
    transform: [{ scale: 0 }],
  },
  10: {
    opacity: 0.4,
  },
  40: {
    transform: [{ scale: 1.5 }],
  },
  95: {
    opacity: 0.4,
  },
  100: {
    opacity: 0,
    transform: [{ scale: 1.5 }],
  },
});

const circle2Keyframe = new Keyframe({
  0: {
    opacity: 0,
    transform: [{ scale: 0 }],
  },
  10: {
    opacity: 1,
  },
  40: {
    transform: [{ scale: 0 }],
  },
  95: {
    opacity: 1,
  },
  100: {
    opacity: 0,
    transform: [{ scale: 1.5 }],
  },
});

interface AnimatedLikeIconProps {
  isLiked: boolean;
  big?: boolean;
  hasBeenToggled: boolean;
}

export function AnimatedLikeIcon({
  isLiked,
  big,
  hasBeenToggled,
}: AnimatedLikeIconProps) {
  const { colors, isDarkMode } = useTheme();
  const size = big ? 22 : 18;
  const shouldAnimate = !useReducedMotion() && hasBeenToggled;
  const likeColor = '#ec4899'; // Giống social-app-main (màu like của Bluesky)

  return (
    <View style={styles.container}>
      <LayoutAnimationConfig skipEntering>
        {isLiked ? (
          <Animated.View
            entering={shouldAnimate ? keyframe.duration(300) : undefined}
            style={styles.iconContainer}>
            <MaterialCommunityIcons
              name="heart"
              size={size}
              color={likeColor}
            />
          </Animated.View>
        ) : (
          <MaterialCommunityIcons
            name="heart-outline"
            size={size}
            color={colors.textSecondary || (isDarkMode ? '#B0B3B8' : '#65676B')}
          />
        )}
        {isLiked && shouldAnimate ? (
          <>
            <Animated.View
              entering={circle1Keyframe.duration(300)}
              style={[
                styles.circle,
                {
                  width: size,
                  height: size,
                  borderRadius: size / 2,
                  backgroundColor: likeColor,
                },
              ]}
            />
            <Animated.View
              entering={circle2Keyframe.duration(300)}
              style={[
                styles.circle,
                {
                  width: size,
                  height: size,
                  borderRadius: size / 2,
                  backgroundColor: colors.surface || (isDarkMode ? '#242526' : '#FFFFFF'),
                },
              ]}
            />
          </>
        ) : null}
      </LayoutAnimationConfig>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  iconContainer: {
    position: 'relative',
    zIndex: 1,
  },
  circle: {
    position: 'absolute',
    top: 0,
    left: 0,
    zIndex: -1,
    pointerEvents: 'none',
  },
});

