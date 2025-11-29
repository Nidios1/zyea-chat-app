import React, { useMemo } from 'react';
import { View, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { Image } from 'expo-image';
import { Text } from 'react-native-paper';
import { getImageURL } from '../../utils/imageUtils';
import { useTheme } from '../../contexts/ThemeContext';
import { type MediaMetadata } from '../../utils/mediaUtils';

interface FacebookImageLayoutProps {
  images: string[];
  altTexts?: string[];
  onPressImage?: (index: number) => void;
  imageMetadata?: Map<string, MediaMetadata>;
}

/**
 * FacebookImageLayout - Layout ảnh giống Facebook
 * 
 * Layout rules:
 * - 1 ảnh: Full width với aspect ratio tự động (constrained)
 * - 2 ảnh: Chia đôi, mỗi ảnh gần square
 * - 3 ảnh: 1 ảnh lớn trái, 2 ảnh nhỏ phải xếp dọc
 * - 4 ảnh: Grid 2x2
 * - 5+ ảnh: Grid 2x2 với overlay "+N" trên ảnh cuối
 */
export function FacebookImageLayout({
  images,
  altTexts,
  onPressImage,
  imageMetadata = new Map(),
}: FacebookImageLayoutProps) {
  const { colors } = useTheme();
  const screenWidth = Dimensions.get('window').width;
  const horizontalPadding = 16; // Padding giống Facebook
  const containerWidth = screenWidth - horizontalPadding * 2;
  const gap = 2; // Gap nhỏ giữa các ảnh giống Facebook

  const safeImages = useMemo(() => images.filter(Boolean), [images]);
  const count = safeImages.length;

  if (count === 0) return null;

  const styles = useMemo(() => createStyles(colors, gap), [colors, gap]);

  // 1 ảnh: Full width với aspect ratio tự động
  if (count === 1) {
    const metadata = imageMetadata.get(safeImages[0]);
    const aspectRatio = metadata?.aspectRatio || 1;
    // Constrain aspect ratio: tối thiểu 0.5 (1:2), tối đa 2 (2:1)
    const constrainedAspect = Math.max(0.5, Math.min(aspectRatio, 2));
    const height = containerWidth / constrainedAspect;

    return (
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={() => onPressImage?.(0)}
        style={[styles.singleImageContainer, { width: containerWidth, height }]}>
        <Image
          source={{ uri: getImageURL(safeImages[0]) }}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
          transition={200}
          placeholder={{ blurhash: 'LGF5]+Yk^6#M@-5c,1J5@[or[Q6.' }}
          placeholderContentFit="cover"
          cachePolicy="memory-disk"
        />
      </TouchableOpacity>
    );
  }

  // 2 ảnh: Chia đôi, mỗi ảnh gần square
  if (count === 2) {
    const itemWidth = (containerWidth - gap) / 2;
    const itemHeight = itemWidth; // Square

    return (
      <View style={styles.twoImagesContainer}>
        {[0, 1].map((i) => (
          <TouchableOpacity
            key={i}
            activeOpacity={0.9}
            onPress={() => onPressImage?.(i)}
            style={[
              styles.imageItem,
              {
                width: itemWidth,
                height: itemHeight,
                marginRight: i === 0 ? gap : 0,
              },
            ]}>
            <Image
              source={{ uri: getImageURL(safeImages[i]) }}
              style={StyleSheet.absoluteFill}
              contentFit="cover"
              transition={200}
              placeholder={{ blurhash: 'LGF5]+Yk^6#M@-5c,1J5@[or[Q6.' }}
              placeholderContentFit="cover"
              cachePolicy="memory-disk"
            />
          </TouchableOpacity>
        ))}
      </View>
    );
  }

  // 3 ảnh: 1 ảnh lớn trái, 2 ảnh nhỏ phải xếp dọc
  if (count === 3) {
    const leftWidth = (containerWidth - gap) * 0.6;
    const rightWidth = containerWidth - gap - leftWidth;
    const leftHeight = leftWidth; // Square
    const rightItemHeight = (leftHeight - gap) / 2;

    return (
      <View style={styles.threeImagesContainer}>
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() => onPressImage?.(0)}
          style={[
            styles.imageItem,
            {
              width: leftWidth,
              height: leftHeight,
              marginRight: gap,
            },
          ]}>
          <Image
            source={{ uri: getImageURL(safeImages[0]) }}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
            transition={200}
            placeholder={{ blurhash: 'LGF5]+Yk^6#M@-5c,1J5@[or[Q6.' }}
            placeholderContentFit="cover"
            cachePolicy="memory-disk"
          />
        </TouchableOpacity>
        <View style={{ width: rightWidth }}>
          {[1, 2].map((i) => (
            <TouchableOpacity
              key={i}
              activeOpacity={0.9}
              onPress={() => onPressImage?.(i)}
              style={[
                styles.imageItem,
                {
                  width: rightWidth,
                  height: rightItemHeight,
                  marginBottom: i === 1 ? gap : 0,
                },
              ]}>
              <Image
                source={{ uri: getImageURL(safeImages[i]) }}
                style={StyleSheet.absoluteFill}
                contentFit="cover"
                transition={200}
                placeholder={{ blurhash: 'LGF5]+Yk^6#M@-5c,1J5@[or[Q6.' }}
                placeholderContentFit="cover"
                cachePolicy="memory-disk"
              />
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  }

  // 4 ảnh: Grid 2x2
  if (count === 4) {
    const itemWidth = (containerWidth - gap) / 2;
    const itemHeight = itemWidth; // Square

    return (
      <View style={styles.fourImagesContainer}>
        <View style={[styles.row, { marginBottom: gap }]}>
          {[0, 1].map((i) => (
            <TouchableOpacity
              key={i}
              activeOpacity={0.9}
              onPress={() => onPressImage?.(i)}
              style={[
                styles.imageItem,
                {
                  width: itemWidth,
                  height: itemHeight,
                  marginRight: i === 0 ? gap : 0,
                },
              ]}>
              <Image
                source={{ uri: getImageURL(safeImages[i]) }}
                style={StyleSheet.absoluteFill}
                contentFit="cover"
                transition={200}
                placeholder={{ blurhash: 'LGF5]+Yk^6#M@-5c,1J5@[or[Q6.' }}
                placeholderContentFit="cover"
                cachePolicy="memory-disk"
              />
            </TouchableOpacity>
          ))}
        </View>
        <View style={styles.row}>
          {[2, 3].map((i) => (
            <TouchableOpacity
              key={i}
              activeOpacity={0.9}
              onPress={() => onPressImage?.(i)}
              style={[
                styles.imageItem,
                {
                  width: itemWidth,
                  height: itemHeight,
                  marginRight: i === 2 ? gap : 0,
                },
              ]}>
              <Image
                source={{ uri: getImageURL(safeImages[i]) }}
                style={StyleSheet.absoluteFill}
                contentFit="cover"
                transition={200}
                placeholder={{ blurhash: 'LGF5]+Yk^6#M@-5c,1J5@[or[Q6.' }}
                placeholderContentFit="cover"
                cachePolicy="memory-disk"
              />
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  }

  // 5+ ảnh: Grid 2x2 với overlay "+N" trên ảnh cuối
  const itemWidth = (containerWidth - gap) / 2;
  const itemHeight = itemWidth; // Square
  const visibleImages = safeImages.slice(0, 4);
  const remainingCount = count - 4;

  return (
    <View style={styles.fourImagesContainer}>
      <View style={[styles.row, { marginBottom: gap }]}>
        {[0, 1].map((i) => (
          <TouchableOpacity
            key={i}
            activeOpacity={0.9}
            onPress={() => onPressImage?.(i)}
            style={[
              styles.imageItem,
              {
                width: itemWidth,
                height: itemHeight,
                marginRight: i === 0 ? gap : 0,
              },
            ]}>
            <Image
              source={{ uri: getImageURL(visibleImages[i]) }}
              style={StyleSheet.absoluteFill}
              contentFit="cover"
              transition={200}
              placeholder={{ blurhash: 'LGF5]+Yk^6#M@-5c,1J5@[or[Q6.' }}
              placeholderContentFit="cover"
              cachePolicy="memory-disk"
            />
          </TouchableOpacity>
        ))}
      </View>
      <View style={styles.row}>
        {[2, 3].map((i) => (
          <TouchableOpacity
            key={i}
            activeOpacity={0.9}
            onPress={() => onPressImage?.(i)}
            style={[
              styles.imageItem,
              {
                width: itemWidth,
                height: itemHeight,
                marginRight: i === 2 ? gap : 0,
              },
            ]}>
            <Image
              source={{ uri: getImageURL(visibleImages[i]) }}
              style={StyleSheet.absoluteFill}
              contentFit="cover"
              transition={200}
              placeholder={{ blurhash: 'LGF5]+Yk^6#M@-5c,1J5@[or[Q6.' }}
              placeholderContentFit="cover"
              cachePolicy="memory-disk"
            />
            {i === 3 && remainingCount > 0 && (
              <View style={styles.overlay}>
                <Text style={styles.overlayText}>+{remainingCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const createStyles = (colors: any, gap: number) =>
  StyleSheet.create({
    singleImageContainer: {
      borderRadius: 8,
      overflow: 'hidden',
      backgroundColor: colors.surface || '#f0f0f0',
    },
    twoImagesContainer: {
      flexDirection: 'row',
      width: '100%',
    },
    threeImagesContainer: {
      flexDirection: 'row',
      width: '100%',
    },
    fourImagesContainer: {
      width: '100%',
    },
    row: {
      flexDirection: 'row',
      width: '100%',
    },
    imageItem: {
      borderRadius: 8,
      overflow: 'hidden',
      backgroundColor: colors.surface || '#f0f0f0',
    },
    overlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
      borderRadius: 8,
    },
    overlayText: {
      color: '#FFFFFF',
      fontSize: 24,
      fontWeight: '700',
      letterSpacing: 0.5,
    },
  });

