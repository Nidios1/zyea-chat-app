import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  Easing,
  LayoutAnimationConfig,
  useReducedMotion,
  withTiming,
} from 'react-native-reanimated';
import { Text } from 'react-native-paper';
import { useTheme } from '../../contexts/ThemeContext';

const animationConfig = {
  duration: 400,
  easing: Easing.out(Easing.cubic),
};

function EnteringUp() {
  'worklet';
  const animations = {
    opacity: withTiming(1, animationConfig),
    transform: [{ translateY: withTiming(0, animationConfig) }],
  };
  const initialValues = {
    opacity: 0,
    transform: [{ translateY: 18 }],
  };
  return {
    animations,
    initialValues,
  };
}

function EnteringDown() {
  'worklet';
  const animations = {
    opacity: withTiming(1, animationConfig),
    transform: [{ translateY: withTiming(0, animationConfig) }],
  };
  const initialValues = {
    opacity: 0,
    transform: [{ translateY: -18 }],
  };
  return {
    animations,
    initialValues,
  };
}

function ExitingUp() {
  'worklet';
  const animations = {
    opacity: withTiming(0, animationConfig),
    transform: [{ translateY: withTiming(-18, animationConfig) }],
  };
  const initialValues = {
    opacity: 1,
    transform: [{ translateY: 0 }],
  };
  return {
    animations,
    initialValues,
  };
}

function ExitingDown() {
  'worklet';
  const animations = {
    opacity: withTiming(0, animationConfig),
    transform: [{ translateY: withTiming(18, animationConfig) }],
  };
  const initialValues = {
    opacity: 1,
    transform: [{ translateY: 0 }],
  };
  return {
    animations,
    initialValues,
  };
}

function decideShouldRoll(isLiked: boolean, likeCount: number): boolean {
  return isLiked && likeCount > 0;
}

function formatPostStatCount(count: number): string {
  if (count >= 1000000) {
    return `${(count / 1000000).toFixed(1)}M`;
  }
  if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}K`;
  }
  return count.toString();
}

interface CountWheelProps {
  likeCount: number;
  big?: boolean;
  isLiked: boolean;
  hasBeenToggled: boolean;
}

export function CountWheel({
  likeCount,
  big,
  isLiked,
  hasBeenToggled,
}: CountWheelProps) {
  const { colors, isDarkMode } = useTheme();
  const shouldAnimate = !useReducedMotion() && hasBeenToggled;
  const shouldRoll = decideShouldRoll(isLiked, likeCount);

  const [key, setKey] = useState(0);
  const [prevCount, setPrevCount] = useState(likeCount);
  const prevIsLiked = useRef(isLiked);

  const formattedCount = formatPostStatCount(likeCount);
  const formattedPrevCount = formatPostStatCount(prevCount);

  useEffect(() => {
    if (isLiked === prevIsLiked.current) {
      return;
    }

    const newPrevCount = isLiked ? likeCount - 1 : likeCount + 1;
    setKey((prev) => prev + 1);
    setPrevCount(newPrevCount);
    prevIsLiked.current = isLiked;
  }, [isLiked, likeCount]);

  const enteringAnimation =
    shouldAnimate && shouldRoll
      ? isLiked
        ? EnteringUp
        : EnteringDown
      : undefined;
  const exitingAnimation =
    shouldAnimate && shouldRoll
      ? isLiked
        ? ExitingUp
        : ExitingDown
      : undefined;

  const likeColor = '#ec4899'; // Giống social-app-main (màu like của Bluesky)
  const textColor = isLiked
    ? likeColor
    : colors.textSecondary || (isDarkMode ? '#B0B3B8' : '#65676B');

  return (
    <LayoutAnimationConfig skipEntering skipExiting>
      {likeCount > 0 ? (
        <View style={styles.container}>
          <Animated.View entering={enteringAnimation} key={key}>
            <Text
              style={[
                styles.text,
                big ? styles.textBig : styles.textSmall,
                { color: textColor },
                isLiked && styles.textBold,
              ]}>
              {formattedCount}
            </Text>
          </Animated.View>
          {shouldAnimate && (likeCount > 1 || !isLiked) ? (
            <Animated.View
              entering={exitingAnimation}
              key={key + 2}
              style={[styles.absolute, { width: 50, opacity: 0 }]}>
              <Text
                style={[
                  styles.text,
                  big ? styles.textBig : styles.textSmall,
                  { color: textColor },
                  isLiked && styles.textBold,
                ]}>
                {formattedPrevCount}
              </Text>
            </Animated.View>
          ) : null}
        </View>
      ) : null}
    </LayoutAnimationConfig>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
  },
  absolute: {
    position: 'absolute',
  },
  text: {
    userSelect: 'none',
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

