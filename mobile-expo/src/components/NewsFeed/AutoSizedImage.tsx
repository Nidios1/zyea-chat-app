import React, { useRef, useMemo } from 'react';
import { View, Pressable, StyleSheet, type DimensionValue, Text } from 'react-native';
import Animated, {
  type AnimatedRef,
  useAnimatedRef,
} from 'react-native-reanimated';
import { Image } from 'expo-image';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { getImageURL } from '../../utils/imageUtils';
import { type MediaMetadata } from '../../utils/mediaUtils';
import { MediaInsetBorder } from './MediaInsetBorder';

interface ConstrainedImageProps {
  aspectRatio: number;
  fullBleed?: boolean;
  children: React.ReactNode;
  minMobileAspectRatio?: number;
}

/**
 * ConstrainedImage - Wrapper component để constrain aspect ratio của ảnh
 * Sử dụng paddingTop trick để giữ aspect ratio
 */
export function ConstrainedImage({
  aspectRatio,
  fullBleed,
  children,
  minMobileAspectRatio = 16 / 9, // 9:16 bounding box cho mobile
}: ConstrainedImageProps) {
  const { colors } = useTheme();
  
  /**
   * Computed as a % value to apply as `paddingTop`, this basically controls
   * the height of the image.
   */
  const outerAspectRatio = useMemo<DimensionValue>(() => {
    const ratio = Math.min(1 / aspectRatio, minMobileAspectRatio);
    return `${ratio * 100}%`;
  }, [aspectRatio, minMobileAspectRatio]);

  return (
    <View style={styles.constrainedContainer}>
      <View style={[styles.constrainedInner, { paddingTop: outerAspectRatio }]}>
        <View style={styles.constrainedContent}>
          <View
            style={[
              styles.imageWrapper,
              {
                backgroundColor: colors.surface || '#f0f0f0',
                aspectRatio: fullBleed ? undefined : aspectRatio,
              },
            ]}>
            {children}
          </View>
        </View>
      </View>
    </View>
  );
}

interface AutoSizedImageProps {
  imageUrl: string;
  aspectRatio?: number;
  alt?: string;
  crop?: 'none' | 'square' | 'constrained';
  hideBadge?: boolean;
  onPress?: (
    containerRef: AnimatedRef<any>,
    fetchedDims: { width: number; height: number } | null,
  ) => void;
  onLongPress?: () => void;
  onPressIn?: () => void;
  metadata?: MediaMetadata | null;
}

/**
 * AutoSizedImage - Component tự động điều chỉnh kích thước ảnh dựa trên aspect ratio
 * Logic tương tự social-app-main:
 * - Constrain aspect ratio tối thiểu là 0.5 (1:2 ratio) cho feed
 * - Hiển thị badge nếu ảnh bị crop hoặc có alt text
 */
export function AutoSizedImage({
  imageUrl,
  aspectRatio: providedAspectRatio,
  alt,
  crop = 'constrained',
  hideBadge = false,
  onPress,
  onLongPress,
  onPressIn,
  metadata,
}: AutoSizedImageProps) {
  const { colors } = useTheme();
  const containerRef = useAnimatedRef();
  const fetchedDimsRef = useRef<{ width: number; height: number } | null>(null);

  // Tính aspect ratio từ metadata hoặc provided
  let aspectRatio: number | undefined = providedAspectRatio;
  if (!aspectRatio && metadata) {
    aspectRatio = metadata.aspectRatio;
    if (Number.isNaN(aspectRatio)) {
      aspectRatio = undefined;
    }
  }

  // Tính constrained aspect ratio giống social-app-main
  let constrained: number | undefined;
  let max: number | undefined;
  let rawIsCropped: boolean | undefined;
  
  if (aspectRatio !== undefined) {
    const ratio = 1 / 2; // max of 1:2 ratio in feeds (giống social-app-main)
    constrained = Math.max(aspectRatio, ratio);
    max = Math.max(aspectRatio, 0.25); // max of 1:4 in thread
    rawIsCropped = aspectRatio < constrained;
  }

  const cropDisabled = crop === 'none';
  const isCropped = rawIsCropped && !cropDisabled;
  const isContain = aspectRatio === undefined;
  const hasAlt = !!alt;

  const handleImageLoad = (event: any) => {
    if (!isContain) {
      const source = event?.source || event?.nativeEvent?.source;
      if (source?.width && source?.height) {
        fetchedDimsRef.current = {
          width: source.width,
          height: source.height,
        };
      }
    }
  };

  const contents = (
    <Animated.View ref={containerRef} style={styles.imageContainer} collapsable={false}>
      <Image
        source={{ uri: getImageURL(imageUrl) }}
        contentFit={isContain ? 'contain' : 'cover'}
        style={styles.image}
        accessible={true}
        accessibilityIgnoresInvertColors
        accessibilityLabel={alt}
        accessibilityHint=""
        onLoad={handleImageLoad}
        transition={200}
        placeholder={{ blurhash: 'LGF5]+Yk^6#M@-5c,1J5@[or[Q6.' }}
        placeholderContentFit="cover"
        cachePolicy="memory-disk" // Tối ưu caching - cache cả memory và disk
        priority="normal" // Set priority để tối ưu loading
      />
      <MediaInsetBorder />

      {/* Badge cho cropped hoặc alt text - giống social-app-main */}
      {(hasAlt || isCropped) && !hideBadge && (
        <View
          style={[
            styles.badgeContainer,
            {
              bottom: 8,
              right: 8,
              gap: 3,
            },
          ]}>
          {isCropped && (
            <View
              style={[
                styles.badge,
                {
                  backgroundColor: colors.surface || 'rgba(0,0,0,0.6)',
                  padding: 3,
                  opacity: 0.8,
                },
              ]}>
              <MaterialCommunityIcons
                name="arrow-expand"
                size={12}
                color={colors.text || '#FFFFFF'}
              />
            </View>
          )}
          {hasAlt && (
            <View
              style={[
                styles.badge,
                styles.altBadge,
                {
                  backgroundColor: colors.surface || 'rgba(0,0,0,0.6)',
                  padding: 3,
                  opacity: 0.8,
                },
              ]}>
              <Text style={[styles.altText, { color: colors.text || '#FFFFFF' }]}>
                ALT
              </Text>
            </View>
          )}
        </View>
      )}
    </Animated.View>
  );

  if (cropDisabled) {
    return (
      <Pressable
        onPress={() => onPress?.(containerRef, fetchedDimsRef.current)}
        onLongPress={onLongPress}
        onPressIn={onPressIn}
        accessibilityLabel={alt}
        accessibilityRole="button"
        style={[
          styles.pressableContainer,
          {
            backgroundColor: colors.surface || '#f0f0f0',
            aspectRatio: max ?? 1,
          },
        ]}>
        {contents}
      </Pressable>
    );
  } else {
    return (
      <ConstrainedImage
        fullBleed={crop === 'square'}
        aspectRatio={constrained ?? 1}>
        <Pressable
          onPress={() => onPress?.(containerRef, fetchedDimsRef.current)}
          onLongPress={onLongPress}
          onPressIn={onPressIn}
          accessibilityLabel={alt}
          accessibilityRole="button"
          style={styles.pressableInner}>
          {contents}
        </Pressable>
      </ConstrainedImage>
    );
  }
}

const styles = StyleSheet.create({
  constrainedContainer: {
    width: '100%',
  },
  constrainedInner: {
    overflow: 'hidden',
  },
  constrainedContent: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
  },
  imageWrapper: {
    height: '100%',
    borderRadius: 8,
    overflow: 'hidden',
    width: '100%',
  },
  imageContainer: {
    flex: 1,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  pressableContainer: {
    width: '100%',
    borderRadius: 8,
    overflow: 'hidden',
  },
  pressableInner: {
    height: '100%',
  },
  badgeContainer: {
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'center',
  },
  badge: {
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  altBadge: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  altText: {
    fontSize: 8,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});

