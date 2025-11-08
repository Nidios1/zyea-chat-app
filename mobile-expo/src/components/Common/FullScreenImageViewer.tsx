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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { PWATheme } from '../../config/PWATheme';
import { getImageURL } from '../../utils/imageUtils';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface FullScreenImageViewerProps {
  visible: boolean;
  images: string[];
  initialIndex?: number;
  onClose: () => void;
  postData?: {
    id?: string;
    likes?: number;
    comments?: number;
    isLiked?: boolean;
    onLike?: () => void;
    onComment?: () => void;
    onRepost?: () => void;
    onShare?: () => void;
  };
}

const FullScreenImageViewer: React.FC<FullScreenImageViewerProps> = ({
  visible,
  images,
  initialIndex = 0,
  onClose,
  postData,
}) => {
  const { colors, isDarkMode } = useTheme();
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [showControls, setShowControls] = useState(true);
  const flatListRef = useRef<FlatList>(null);
  
  // Drag to dismiss animations
  const panY = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(1)).current;
  const scale = useRef(new Animated.Value(1)).current;
  
  // Track if user is dragging vertically
  const isDragging = useRef(false);
  const dragStartY = useRef(0);

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
      onClose();
    });
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
        <FlatList
          ref={flatListRef}
          data={images}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item, index) => `image-${index}`}
          scrollEnabled={true}
          renderItem={({ item, index }) => (
            <TouchableOpacity
              activeOpacity={1}
              onPress={handleImagePress}
              style={dynamicStyles.imageContainer}
            >
              <Image
                source={{ uri: getImageURL(item) }}
                style={dynamicStyles.image}
                resizeMode="contain"
              />
            </TouchableOpacity>
          )}
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

        {/* Top Bar - Close and Menu */}
        <SafeAreaView
          edges={['top']}
          style={[
            dynamicStyles.topBar,
            { opacity: showControls ? 1 : 0 },
          ]}
        >
          <TouchableOpacity
            style={dynamicStyles.topBarButton}
            onPress={handleClose}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons name="close" size={28} color="#FFFFFF" />
          </TouchableOpacity>
          <View style={dynamicStyles.topBarSpacer} />
          <TouchableOpacity
            style={dynamicStyles.topBarButton}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons name="dots-horizontal" size={28} color="#FFFFFF" />
          </TouchableOpacity>
        </SafeAreaView>

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

        {/* Bottom Bar - Interactions (if postData provided) */}
        {postData && showControls && (
          <SafeAreaView
            edges={['bottom']}
            style={[
              dynamicStyles.bottomBar,
              { opacity: showControls ? 1 : 0 },
            ]}
          >
            <View style={dynamicStyles.bottomBarContent}>
              <TouchableOpacity
                style={dynamicStyles.bottomBarButton}
                onPress={postData.onLike}
                activeOpacity={0.7}
              >
                <MaterialCommunityIcons
                  name={postData.isLiked ? 'heart' : 'heart-outline'}
                  size={22}
                  color={postData.isLiked ? '#FF3040' : '#FFFFFF'}
                />
                {postData.likes !== undefined && postData.likes > 0 && (
                  <Text style={dynamicStyles.bottomBarText}>
                    {postData.likes}
                  </Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={dynamicStyles.bottomBarButton}
                onPress={postData.onComment}
                activeOpacity={0.7}
              >
                <MaterialCommunityIcons
                  name="message-outline"
                  size={22}
                  color="#FFFFFF"
                />
                {postData.comments !== undefined && postData.comments > 0 && (
                  <Text style={dynamicStyles.bottomBarText}>
                    {postData.comments}
                  </Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={dynamicStyles.bottomBarButton}
                onPress={postData.onRepost}
                activeOpacity={0.7}
              >
                <MaterialCommunityIcons
                  name="repeat"
                  size={22}
                  color="#FFFFFF"
                />
              </TouchableOpacity>

              <TouchableOpacity
                style={dynamicStyles.bottomBarButton}
                onPress={postData.onShare}
                activeOpacity={0.7}
              >
                <MaterialCommunityIcons
                  name="send-outline"
                  size={22}
                  color="#FFFFFF"
                />
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        )}
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
      backgroundColor: 'rgba(0, 0, 0, 0.95)',
    },
    animatedContainer: {
      flex: 1,
    },
    imageContainer: {
      width: SCREEN_WIDTH,
      height: SCREEN_HEIGHT,
      justifyContent: 'center',
      alignItems: 'center',
    },
    image: {
      width: SCREEN_WIDTH,
      height: SCREEN_HEIGHT,
    },
    topBar: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 12,
      zIndex: 10,
    },
    topBarButton: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: 'rgba(0, 0, 0, 0.3)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    topBarSpacer: {
      flex: 1,
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
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 16,
      gap: 6,
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
      paddingHorizontal: 12,
      paddingVertical: 8,
      zIndex: 10,
    },
    bottomBarContent: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-around',
      backgroundColor: 'rgba(0, 0, 0, 0.4)',
      borderRadius: 20,
      paddingVertical: 8,
      paddingHorizontal: 12,
    },
    bottomBarButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: 8,
      paddingVertical: 4,
    },
    bottomBarText: {
      color: '#FFFFFF',
      fontSize: 12,
      fontWeight: '600',
    },
  });

export default FullScreenImageViewer;

