import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Modal,
  Dimensions,
  Image,
  TouchableOpacity,
  StatusBar,
  FlatList,
  NativeScrollEvent,
  NativeSyntheticEvent,
  ViewToken,
  Text,
  Animated,
  PanResponder,
  LayoutAnimation,
  Platform,
  ScrollView,
  PixelRatio,
} from 'react-native';
import AnimatedReanimated, {
  type SharedValue,
  useSharedValue,
  useAnimatedStyle,
  useAnimatedReaction,
  withSpring,
  interpolate,
  runOnJS,
  type AnimatedRef,
  useAnimatedRef,
  measure,
  withClampedSpring,
} from 'react-native-reanimated';
import { SafeAreaView, useSafeAreaFrame, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as MediaLibrary from 'expo-media-library';
import * as Sharing from 'expo-sharing';
import { useTheme } from '../../contexts/ThemeContext';
import { PWATheme } from '../../config/PWATheme';
import { getImageURL, getAvatarURL } from '../../utils/imageUtils';
import { getInitials } from '../../utils/nameUtils';
import { Avatar } from 'react-native-paper';
import ExpandableText from './ExpandableText';
import { type ImageSource } from '../../contexts/LightboxContext';
import Toast from 'react-native-toast-message';
import {
  downloadImage,
  createImagePath,
  moveToPermanentPath,
  safeDeleteAsync,
} from '../../utils/imageDownloadUtils';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface FullScreenImageViewerProps {
  visible: boolean;
  images: string[] | ImageSource[];
  initialIndex?: number;
  onClose: () => void;
  // For animation from thumbnail
  imageSources?: ImageSource[];
  postData?: {
    id?: string;
    likes?: number;
    comments?: number;
    isLiked?: boolean;
    onLike?: () => void;
    onComment?: () => void;
    onRepost?: () => void;
    onShare?: () => void;
    // Thông tin bài viết
    authorName?: string;
    authorAvatar?: string;
    authorId?: string | number;
    content?: string;
    postTime?: string;
    privacy?: 'public' | 'friends' | 'private';
    isAuthorOnline?: boolean;
  };
}

const PIXEL_RATIO = PixelRatio.get();

// Helper function to check if we can animate from thumbnail
function canAnimate(imageSources?: ImageSource[]): boolean {
  if (!imageSources || imageSources.length === 0) return false;
  return imageSources.every(
    (img) => img.thumbRect && (img.dimensions || img.thumbDimensions),
  );
}

// Component for animated image item
interface AnimatedImageItemProps {
  item: string | ImageSource;
  index: number;
  isActive: boolean;
  imageSource?: ImageSource;
  isAnimated: boolean;
  openProgress: SharedValue<number>;
  safeFrame: { width: number; height: number; x: number; y: number };
  safeInsets: { top: number; bottom: number; left: number; right: number };
  onPress: () => void;
  imageStyle: any;
  getImageUri: (item: string | ImageSource) => string;
}

const AnimatedImageItem: React.FC<AnimatedImageItemProps> = ({
  item,
  isActive,
  imageSource,
  isAnimated,
  openProgress,
  safeFrame,
  safeInsets,
  onPress,
  imageStyle,
  getImageUri,
}) => {
  const thumbRect = imageSource?.thumbRect;
  const imageDims = imageSource?.dimensions || imageSource?.thumbDimensions;
  const imageAspect = imageDims ? imageDims.width / imageDims.height : undefined;

  const animatedImageStyle = useAnimatedStyle(() => {
    if (!isAnimated || !isActive || !thumbRect || !imageAspect) {
      return {
        transform: [{ scale: 1 }, { translateX: 0 }, { translateY: 0 }],
      };
    }

    const safeArea = {
      width: safeFrame.width - safeInsets.left - safeInsets.right,
      height: safeFrame.height - safeInsets.top - safeInsets.bottom,
      x: safeFrame.x + safeInsets.left,
      y: safeFrame.y + safeInsets.top,
    };

    const progress = openProgress.value;
    if (progress < 1) {
      const transform = interpolateTransform(
        progress,
        thumbRect,
        safeArea,
        imageAspect,
      );
      return {
        transform: [
          { scale: transform.scale },
          { translateX: transform.translateX },
          { translateY: transform.translateY },
        ],
      };
    }
    return {
      transform: [{ scale: 1 }, { translateX: 0 }, { translateY: 0 }],
    };
  }, [isAnimated, isActive, thumbRect, imageAspect, openProgress, safeFrame, safeInsets]);

  return (
    <TouchableOpacity
      activeOpacity={1}
      onPress={onPress}
      style={imageStyle.imageContainer}
    >
      {isAnimated && isActive && thumbRect ? (
        <AnimatedReanimated.View style={[imageStyle.image, animatedImageStyle]}>
          <Image
            source={{ uri: getImageUri(item) }}
            style={StyleSheet.absoluteFill}
            resizeMode="contain"
          />
        </AnimatedReanimated.View>
      ) : (
        <Image
          source={{ uri: getImageUri(item) }}
          style={imageStyle.image}
          resizeMode="contain"
        />
      )}
    </TouchableOpacity>
  );
};

// Interpolate transform from thumbnail to fullscreen (simplified version)
function interpolateTransform(
  progress: number,
  thumbnailDims: {
    pageX: number;
    width: number;
    pageY: number;
    height: number;
  },
  safeArea: { width: number; height: number; x: number; y: number },
  imageAspect: number,
): {
  scale: number;
  translateX: number;
  translateY: number;
} {
  'worklet';
  const thumbAspect = thumbnailDims.width / thumbnailDims.height;
  let uncroppedInitialWidth: number;
  let uncroppedInitialHeight: number;
  if (imageAspect > thumbAspect) {
    uncroppedInitialWidth = thumbnailDims.height * imageAspect;
    uncroppedInitialHeight = thumbnailDims.height;
  } else {
    uncroppedInitialWidth = thumbnailDims.width;
    uncroppedInitialHeight = thumbnailDims.width / imageAspect;
  }
  const safeAreaAspect = safeArea.width / safeArea.height;
  let finalWidth: number;
  let finalHeight: number;
  if (safeAreaAspect > imageAspect) {
    finalWidth = safeArea.height * imageAspect;
    finalHeight = safeArea.height;
  } else {
    finalWidth = safeArea.width;
    finalHeight = safeArea.width / imageAspect;
  }
  const initialScale = Math.min(
    uncroppedInitialWidth / finalWidth,
    uncroppedInitialHeight / finalHeight,
  );
  const screenCenterX = safeArea.width / 2;
  const screenCenterY = safeArea.height / 2;
  const thumbnailSafeAreaX = thumbnailDims.pageX - safeArea.x;
  const thumbnailSafeAreaY = thumbnailDims.pageY - safeArea.y;
  const thumbnailCenterX = thumbnailSafeAreaX + thumbnailDims.width / 2;
  const thumbnailCenterY = thumbnailSafeAreaY + thumbnailDims.height / 2;
  const initialTranslateX = thumbnailCenterX - screenCenterX;
  const initialTranslateY = thumbnailCenterY - screenCenterY;
  const scale = interpolate(progress, [0, 1], [initialScale, 1]);
  const translateX = Math.round(
    (interpolate(progress, [0, 1], [initialTranslateX, 0]) * PIXEL_RATIO) /
      PIXEL_RATIO,
  );
  const translateY = Math.round(
    (interpolate(progress, [0, 1], [initialTranslateY, 0]) * PIXEL_RATIO) /
      PIXEL_RATIO,
  );
  return { scale, translateX, translateY };
}

const FullScreenImageViewer: React.FC<FullScreenImageViewerProps> = ({
  visible,
  images,
  initialIndex = 0,
  onClose,
  postData,
  imageSources,
}) => {
  const { colors, isDarkMode } = useTheme();
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [showControls, setShowControls] = useState(true);
  const [isAltExpanded, setAltExpanded] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const safeAreaRef = useAnimatedRef<View>();
  
  // Animation from thumbnail
  const openProgress = useSharedValue(0);
  const isAnimated = canAnimate(imageSources);
  
  // Drag to dismiss animations
  const panY = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(1)).current;
  const scale = useRef(new Animated.Value(1)).current;
  
  // Track if user is dragging vertically
  const isDragging = useRef(false);
  const dragStartY = useRef(0);
  
  const safeFrame = useSafeAreaFrame();
  const safeInsets = useSafeAreaInsets();

  // Animate openProgress when visible changes
  useEffect(() => {
    if (visible && isAnimated) {
      // Animate from 0 to 1 with spring
      openProgress.value = withClampedSpring(1, {
        mass: Platform.OS === 'ios' ? 1.25 : 0.75,
        damping: 300,
        stiffness: 800,
        overshootClamping: true,
        restDisplacementThreshold: 0.01,
      });
    } else if (!visible && isAnimated) {
      // Animate from 1 to 0
      openProgress.value = withClampedSpring(0, {
        mass: Platform.OS === 'ios' ? 1.25 : 0.75,
        damping: 300,
        stiffness: 800,
        overshootClamping: true,
        restDisplacementThreshold: 0.01,
      });
    } else {
      // No animation, set directly
      openProgress.value = visible ? 1 : 0;
    }
  }, [visible, isAnimated, openProgress]);

  useEffect(() => {
    if (visible) {
      setCurrentIndex(initialIndex);
      setShowControls(true);
      
      // Scroll to initial index
      if (flatListRef.current && images.length > 0) {
        setTimeout(() => {
          try {
            flatListRef.current?.scrollToIndex({
              index: Math.min(initialIndex, images.length - 1),
              animated: false,
            });
          } catch (error) {
            // Fallback to scrollToOffset if scrollToIndex fails
            flatListRef.current?.scrollToOffset({
              offset: SCREEN_WIDTH * Math.min(initialIndex, images.length - 1),
              animated: false,
            });
          }
        }, 100);
      }
      
      // Auto-hide controls after 3 seconds
      const timer = setTimeout(() => {
        setShowControls(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [visible, initialIndex, images.length]);

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const slideSize = SCREEN_WIDTH;
    const index = Math.round(event.nativeEvent.contentOffset.x / slideSize);
    const validIndex = Math.max(0, Math.min(index, images.length - 1));
    if (validIndex !== currentIndex && validIndex >= 0 && validIndex < images.length) {
      setCurrentIndex(validIndex);
      setShowControls(true);
      // Auto-hide again after scroll
      setTimeout(() => {
        setShowControls(false);
      }, 3000);
    }
  };

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length > 0 && viewableItems[0].index !== null) {
        const index = viewableItems[0].index;
        if (index >= 0 && index < images.length && index !== currentIndex) {
          setCurrentIndex(index);
        }
      }
    }
  ).current;

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 50,
  }).current;

  // Pan responder for drag to dismiss
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: (evt, gestureState) => {
        // Only respond to vertical gestures (swipe down) when at top
        const isVertical = Math.abs(gestureState.dy) > Math.abs(gestureState.dx);
        return isVertical && gestureState.dy > 0;
      },
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        // Check if user is dragging down more than horizontal
        const isVerticalDrag = Math.abs(gestureState.dy) > Math.abs(gestureState.dx) * 1.5;
        return isVerticalDrag && gestureState.dy > 10;
      },
      onPanResponderGrant: (evt) => {
        // User started dragging
        isDragging.current = true;
        dragStartY.current = evt.nativeEvent.pageY;
        panY.setOffset(panY._value);
        panY.setValue(0);
      },
      onPanResponderMove: (evt, gestureState) => {
        // Only allow downward drag
        if (gestureState.dy > 0) {
          panY.setValue(gestureState.dy);
          
          // Calculate opacity and scale based on drag distance
          const dragProgress = Math.min(gestureState.dy / SCREEN_HEIGHT, 1);
          opacity.setValue(1 - dragProgress * 0.5);
          scale.setValue(1 - dragProgress * 0.1);
        }
      },
      onPanResponderRelease: (evt, gestureState) => {
        isDragging.current = false;
        panY.flattenOffset();
        
        // If dragged down more than 100px or 20% of screen, close the modal
        const shouldClose = gestureState.dy > 100 || gestureState.dy > SCREEN_HEIGHT * 0.2;
        
        if (shouldClose) {
          // Animate out and close
          Animated.parallel([
            Animated.timing(panY, {
              toValue: SCREEN_HEIGHT,
              duration: 200,
              useNativeDriver: true,
            }),
            Animated.timing(opacity, {
              toValue: 0,
              duration: 200,
              useNativeDriver: true,
            }),
            Animated.timing(scale, {
              toValue: 0.9,
              duration: 200,
              useNativeDriver: true,
            }),
          ]).start(() => {
            // Reset values
            panY.setValue(0);
            opacity.setValue(1);
            scale.setValue(1);
            onClose();
          });
        } else {
          // Snap back to original position
          Animated.parallel([
            Animated.spring(panY, {
              toValue: 0,
              useNativeDriver: true,
              tension: 65,
              friction: 11,
            }),
            Animated.spring(opacity, {
              toValue: 1,
              useNativeDriver: true,
              tension: 65,
              friction: 11,
            }),
            Animated.spring(scale, {
              toValue: 1,
              useNativeDriver: true,
              tension: 65,
              friction: 11,
            }),
          ]).start();
        }
      },
    })
  ).current;

  const handleImagePress = (evt: any) => {
    // Don't toggle controls if user just finished dragging
    if (isDragging.current) {
      setTimeout(() => {
        isDragging.current = false;
      }, 100);
      return;
    }
    
    setShowControls(!showControls);
    if (!showControls) {
      // Auto-hide after 3 seconds
      setTimeout(() => {
        setShowControls(false);
      }, 3000);
    }
  };

  const handleClose = () => {
    // Animate out before closing
    Animated.parallel([
      Animated.timing(panY, {
        toValue: SCREEN_HEIGHT,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      panY.setValue(0);
      opacity.setValue(1);
      scale.setValue(1);
      setShowControls(true);
      setAltExpanded(false);
      onClose();
    });
  };

  // Helper to get image URI
  const getImageUri = (item: string | ImageSource): string => {
    if (typeof item === 'string') {
      return getImageURL(item);
    }
    return getImageURL(item.uri);
  };

  // Save image to media library (giống social-app-main - download image trước)
  const handleSaveImage = async () => {
    let tempImagePath: string | null = null;
    try {
      const currentImageUri = getImageUri(images[currentIndex]);
      
      // Request permissions
      const { status, canAskAgain } = await MediaLibrary.requestPermissionsAsync();
      
      if (status !== 'granted') {
        if (canAskAgain) {
          // Request again once
          const askAgain = await MediaLibrary.requestPermissionsAsync();
          if (askAgain.status !== 'granted') {
            Toast.show({
              type: 'error',
              text1: 'Không thể lưu ảnh',
              text2: 'Vui lòng cấp quyền truy cập thư viện ảnh trong cài đặt',
            });
            return;
          }
        } else {
          Toast.show({
            type: 'error',
            text1: 'Không thể lưu ảnh',
            text2: 'Quyền truy cập thư viện ảnh đã bị từ chối. Vui lòng bật trong cài đặt',
          });
          return;
        }
      }

      // Download image to local file first (giống social-app-main)
      // This ensures remote images can be saved properly
      try {
        tempImagePath = createImagePath('jpg');
        const downloadedPath = await downloadImage(currentImageUri, tempImagePath, 15000);
        const permanentPath = await moveToPermanentPath(downloadedPath, '.jpg');
        tempImagePath = permanentPath;

        // Save the downloaded image
        await MediaLibrary.createAssetAsync(permanentPath);
        
        Toast.show({
          type: 'success',
          text1: 'Đã lưu ảnh',
          text2: 'Ảnh đã được lưu vào thư viện',
        });
      } catch (saveError: any) {
        console.log('Failed to save image:', saveError);
        Toast.show({
          type: 'error',
          text1: 'Không thể lưu ảnh',
          text2: saveError?.message || 'Vui lòng thử lại',
        });
      }
    } catch (error: any) {
      console.error('Error saving image:', error);
      Toast.show({
        type: 'error',
        text1: 'Lỗi',
        text2: error?.message || 'Không thể lưu ảnh',
      });
    } finally {
      // Clean up temporary file
      if (tempImagePath) {
        await safeDeleteAsync(tempImagePath);
      }
    }
  };

  // Share image (giống social-app-main - download image trước khi share)
  const handleShareImage = async () => {
    let tempImagePath: string | null = null;
    try {
      const currentImageUri = getImageUri(images[currentIndex]);
      
      // Check if sharing is available
      if (!(await Sharing.isAvailableAsync())) {
        Toast.show({
          type: 'error',
          text1: 'Không thể chia sẻ',
          text2: 'Tính năng chia sẻ không khả dụng trên thiết bị này',
        });
        return;
      }

      // Download image to local file first (giống social-app-main)
      // This ensures we can share the actual image file, not just the URL
      try {
        tempImagePath = createImagePath('jpg');
        const downloadedPath = await downloadImage(currentImageUri, tempImagePath, 15000);
        const permanentPath = await moveToPermanentPath(downloadedPath, '.jpg');
        tempImagePath = permanentPath;

        // Share the downloaded image file
        await Sharing.shareAsync(permanentPath, {
          mimeType: 'image/jpeg',
          UTI: 'image/jpeg',
        });

        Toast.show({
          type: 'success',
          text1: 'Đã chia sẻ',
        });
      } catch (shareError: any) {
        console.error('Error sharing image:', shareError);
        // Only show error if it's not a user cancellation
        if (shareError?.message && !shareError.message.includes('cancelled') && !shareError.message.includes('canceled')) {
          Toast.show({
            type: 'error',
            text1: 'Không thể chia sẻ',
            text2: shareError?.message || 'Vui lòng thử lại',
          });
        }
      }
    } catch (error: any) {
      console.error('Error sharing image:', error);
      Toast.show({
        type: 'error',
        text1: 'Lỗi',
        text2: error?.message || 'Không thể chia sẻ ảnh',
      });
    } finally {
      // Clean up temporary file after a delay (to allow sharing to complete)
      if (tempImagePath) {
        setTimeout(async () => {
          await safeDeleteAsync(tempImagePath!);
        }, 5000); // Wait 5 seconds before cleanup
      }
    }
  };

  const toggleAltExpanded = () => {
    LayoutAnimation.configureNext({
      duration: 450,
      update: {
        type: 'spring',
        springDamping: 1,
      },
    });
    setAltExpanded(!isAltExpanded);
  };
  
  // Reset animations when modal opens
  useEffect(() => {
    if (visible) {
      panY.setValue(0);
      opacity.setValue(1);
      scale.setValue(1);
      isDragging.current = false;
    }
  }, [visible, panY, opacity, scale]);

  const dynamicStyles = createStyles(colors, isDarkMode, showControls);

  if (!visible || images.length === 0) {
    return null;
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
      statusBarTranslucent
    >
      <StatusBar barStyle="light" hidden={false} />
      <Animated.View
        style={[
          dynamicStyles.container,
          {
            opacity: opacity,
            transform: [
              { translateY: panY },
              { scale: scale },
            ],
          },
        ]}
        {...panResponder.panHandlers}
      >
        {/* Image Carousel */}
        <AnimatedReanimated.View ref={safeAreaRef} style={StyleSheet.absoluteFill} collapsable={false}>
        <FlatList
          ref={flatListRef}
          data={images}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item, index) => `image-${index}`}
          scrollEnabled={true}
          renderItem={({ item, index }) => {
            const imageSource = imageSources?.[index];
            const isActive = index === currentIndex;

            return (
              <AnimatedImageItem
                item={item}
                index={index}
                isActive={isActive}
                imageSource={imageSource}
                isAnimated={isAnimated}
                openProgress={openProgress}
                safeFrame={safeFrame}
                safeInsets={safeInsets}
                onPress={handleImagePress}
                imageStyle={dynamicStyles}
                getImageUri={getImageUri}
              />
            );
          }}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={viewabilityConfig}
          getItemLayout={(_, index) => ({
            length: SCREEN_WIDTH,
            offset: SCREEN_WIDTH * index,
            index,
          })}
          initialScrollIndex={Math.min(initialIndex, images.length - 1)}
          onScrollToIndexFailed={(info) => {
            // Fallback: scroll to offset if scrollToIndex fails
            const wait = new Promise(resolve => setTimeout(resolve, 500));
            wait.then(() => {
              flatListRef.current?.scrollToOffset({
                offset: info.averageItemLength * info.index,
                animated: false,
              });
            });
          }}
        />
        </AnimatedReanimated.View>

        {/* Top Bar - Simple header like social-app-main */}
        <Animated.View
          style={[
            dynamicStyles.topBar,
            {
              opacity: showControls ? 1 : 0,
            },
          ]}
        >
          <SafeAreaView edges={['top']} style={dynamicStyles.topBarContent}>
            <TouchableOpacity
              style={dynamicStyles.topBarButton}
              onPress={handleClose}
              activeOpacity={0.7}
              hitSlop={{ top: 16, bottom: 16, left: 16, right: 16 }}
            >
              <MaterialCommunityIcons name="close" size={22} color="#FFFFFF" />
            </TouchableOpacity>
          </SafeAreaView>
        </Animated.View>
        
        {/* Image Counter (if multiple images) */}
        {images.length > 1 && showControls && (
          <View style={dynamicStyles.counterContainer}>
            <View style={dynamicStyles.counter}>
              <MaterialCommunityIcons name="layers" size={16} color="#FFFFFF" />
              <Text style={dynamicStyles.counterText}>
                {currentIndex + 1}/{images.length}
              </Text>
            </View>
          </View>
        )}

        {/* Bottom Bar - Footer with alt text (like social-app-main) */}
        <Animated.View
          style={[
            dynamicStyles.bottomBar,
            {
              opacity: showControls ? 1 : 0,
            },
          ]}
        >
          <ScrollView
            style={dynamicStyles.footerScrollView}
            scrollEnabled={isAltExpanded}
            contentContainerStyle={dynamicStyles.footerContent}
          >
            <SafeAreaView edges={['bottom']}>
              {/* Alt text from image (like social-app-main) */}
              {imageSources && imageSources[currentIndex]?.alt && (
                <View
                  style={dynamicStyles.footerText}
                  accessibilityRole="button"
                >
                  <Text
                    style={dynamicStyles.footerTextContent}
                    numberOfLines={isAltExpanded ? undefined : 3}
                    selectable
                    onPress={toggleAltExpanded}
                  >
                    {imageSources[currentIndex].alt}
                  </Text>
                </View>
              )}
            </SafeAreaView>
          </ScrollView>
        </Animated.View>
        
        {/* Save and Share buttons - Always visible */}
        <View style={dynamicStyles.footerBtnsAlways}>
          <SafeAreaView edges={['bottom']}>
            <View style={dynamicStyles.footerBtns}>
              <TouchableOpacity
                style={dynamicStyles.footerBtn}
                onPress={handleSaveImage}
                activeOpacity={0.7}
              >
                <MaterialCommunityIcons
                  name="download"
                  size={18}
                  color="#FFFFFF"
                />
                <Text style={dynamicStyles.footerBtnText}>Lưu</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={dynamicStyles.footerBtn}
                onPress={handleShareImage}
                activeOpacity={0.7}
              >
                <MaterialCommunityIcons
                  name="share-outline"
                  size={18}
                  color="#FFFFFF"
                />
                <Text style={dynamicStyles.footerBtnText}>Chia sẻ</Text>
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </View>
      </Animated.View>
    </Modal>
  );
};

const createStyles = (
  colors: typeof PWATheme.light,
  _isDarkMode: boolean,
  _showControls: boolean
) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#000000', // Nền đen hoàn toàn để ảnh nổi bật
    },
    animatedContainer: {
      flex: 1,
    },
    imageContainer: {
      width: SCREEN_WIDTH,
      height: SCREEN_HEIGHT,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: '#000000', // Nền đen cho container
    },
    image: {
      width: SCREEN_WIDTH,
      height: SCREEN_HEIGHT,
      // Không set maxWidth/maxHeight để ảnh hiển thị đầy đủ
    },
    topBar: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      zIndex: 10,
      pointerEvents: 'box-none',
    },
    topBarContent: {
      alignItems: 'flex-end',
      paddingRight: 10,
      paddingTop: 10,
    },
    topBarButton: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: 'rgba(0, 0, 0, 0.47)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    counterContainer: {
      position: 'absolute',
      top: 60,
      left: 0,
      right: 0,
      alignItems: 'center',
      zIndex: 9,
    },
    counter: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: 'rgba(0, 0, 0, 0.7)', // Tăng độ mờ để text rõ hơn
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 16,
      gap: 6,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    counterText: {
      color: '#FFFFFF',
      fontSize: 14,
      fontWeight: '600',
      marginLeft: 4,
    },
    bottomBar: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      zIndex: 10,
      pointerEvents: 'box-none',
    },
    footerScrollView: {
      backgroundColor: 'rgba(0, 0, 0, 0.85)',
      flex: 1,
      position: 'absolute',
      bottom: 0,
      width: '100%',
      maxHeight: '100%',
    },
    footerContent: {
      paddingVertical: 12,
      paddingHorizontal: 24,
    },
    footerText: {
      paddingBottom: Platform.OS === 'ios' ? 20 : 16,
    },
    footerTextContent: {
      color: 'rgba(255, 255, 255, 0.9)',
      fontSize: 15,
      lineHeight: 22,
    },
    footerBtns: {
      flexDirection: 'row',
      justifyContent: 'center',
      gap: 8,
    },
    footerBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      backgroundColor: 'transparent',
      borderColor: '#FFFFFF',
      borderWidth: 1,
      borderRadius: 8,
      paddingHorizontal: 16,
      paddingVertical: 10,
      minWidth: 90,
    },
    footerBtnText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: '600',
    },
    footerBtnsAlways: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      zIndex: 11,
      pointerEvents: 'box-none',
      backgroundColor: 'rgba(0, 0, 0, 0.85)',
      paddingTop: 12,
      paddingBottom: 12,
      paddingHorizontal: 24,
    },
  });

export default FullScreenImageViewer;

