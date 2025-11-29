import React, { useMemo, useRef, useState, useLayoutEffect } from 'react';
import { View, FlatList, TouchableOpacity, Dimensions, StyleSheet, ViewToken, InteractionManager } from 'react-native';
import { Image } from 'expo-image';
import { Text } from 'react-native-paper';
import { getImageURL } from '../../utils/imageUtils';
import { useTheme as useAppTheme } from '../../contexts/ThemeContext';
import { getImageMetadata, MediaMetadata } from '../../utils/mediaUtils';
import { FacebookImageLayout } from './FacebookImageLayout';
import { useLightboxControls } from '../../contexts/LightboxContext';
import { type ImageSource } from '../../contexts/LightboxContext';

interface PostImagesCarouselProps {
	images: string[];
	altTexts?: string[];
	onPressImage?: (index: number) => void;
}

const PostImagesCarousel: React.FC<PostImagesCarouselProps> = ({ images, altTexts, onPressImage }) => {
	const { colors } = useAppTheme();
	const { openLightbox } = useLightboxControls();
	const screenWidth = useMemo(() => Dimensions.get('window').width, []);
	const itemWidth = screenWidth;

	const [activeIndex, setActiveIndex] = useState(0);
	const [imageMetadata, setImageMetadata] = useState<Map<string, MediaMetadata>>(new Map());
	const flatListRef = useRef<FlatList>(null);
	
	const onViewableItemsChanged = useRef(({ viewableItems }: { viewableItems: ViewToken[] }) => {
		if (viewableItems && viewableItems.length > 0 && viewableItems[0].index != null) {
			setActiveIndex(viewableItems[0].index);
		}
	}).current;

	const viewabilityConfig = {
		viewAreaCoveragePercentThreshold: 50
	};

	const styles = useMemo(() => createStyles(colors), [colors]);

	const imagesKey = useMemo(() => JSON.stringify(images), [images]);
	const data = useMemo(() => (images || []).filter(Boolean), [imagesKey]);
	
	if (data.length === 0) return null;

	// Track previous images để tránh load lại metadata không cần thiết
	const prevImagesKeyRef = useRef<string>('');

	// Preload metadata
	useLayoutEffect(() => {
		if (prevImagesKeyRef.current === imagesKey) {
			return;
		}
		prevImagesKeyRef.current = imagesKey;

		const metadataPromises = data.map((imageUrl) => 
			getImageMetadata(imageUrl)
				.then((metadata) => {
					if (metadata) {
						setImageMetadata((prev) => {
							const newMap = new Map(prev);
							newMap.set(imageUrl, metadata);
							return newMap;
						});
					}
					return metadata;
				})
				.catch((error) => {
					if (__DEV__) {
						console.warn('Error loading metadata:', error);
					}
					return null;
				})
		);

		Promise.all(metadataPromises);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [imagesKey]);

	// Open lightbox
	const openLightboxForImage = (index: number) => {
		const items: ImageSource[] = data.map((img, i) => {
			const metadata = imageMetadata.get(img);
			return {
				uri: getImageURL(img),
				thumbUri: getImageURL(img),
				alt: altTexts && altTexts[i] ? altTexts[i] : undefined,
				dimensions: metadata ? { width: metadata.width, height: metadata.height } : null,
				thumbRect: null,
				thumbDimensions: null,
			};
		});

		openLightbox({
			images: items,
			index,
		});

		onPressImage?.(index);
	};

	// Handle press
	const handlePress = (index: number) => {
		openLightboxForImage(index);
	};

	// Sử dụng FacebookImageLayout cho 1-5 ảnh
	if (data.length <= 5) {
		return (
			<FacebookImageLayout
				images={data}
				altTexts={altTexts}
				onPressImage={handlePress}
				imageMetadata={imageMetadata}
			/>
		);
	}

	// Carousel cho 6+ ảnh
	const handleImageLoad = (imageUrl: string) => (e: any) => {
		if (e.source?.width && e.source?.height) {
			const metadata: MediaMetadata = {
				width: e.source.width,
				height: e.source.height,
				aspectRatio: e.source.width / e.source.height,
				type: 'image',
			};
			setImageMetadata((prev) => {
				const newMap = new Map(prev);
				newMap.set(imageUrl, metadata);
				return newMap;
			});
		}
	};

	const handlePressIn = () => {
		InteractionManager.runAfterInteractions(() => {
			Image.prefetch(
				data.map(img => getImageURL(img)),
				'memory',
			);
		});
	};

	// Tính chiều cao mặc định cho carousel items
	const getItemHeight = (item: string) => {
		const metadata = imageMetadata.get(item);
		if (metadata) {
			const aspectRatio = Math.max(0.5, Math.min(metadata.aspectRatio, 2));
			return itemWidth / aspectRatio;
		}
		return itemWidth; // Square fallback
	};

	return (
		<View style={styles.carouselContainer}>
			<FlatList
				ref={flatListRef}
				data={data}
				horizontal
				pagingEnabled
				decelerationRate="fast"
				snapToInterval={itemWidth}
				snapToAlignment="start"
				showsHorizontalScrollIndicator={false}
				keyExtractor={(_, idx) => `image-${idx}`}
				style={styles.flatList}
				contentContainerStyle={styles.flatListContent}
				renderItem={({ item, index }) => {
					const itemHeight = getItemHeight(item);

					return (
						<TouchableOpacity 
							activeOpacity={0.9} 
							onPress={() => handlePress(index)}
							onPressIn={handlePressIn}
							style={[styles.carouselItemContainer, { width: itemWidth, height: itemHeight }]}
						>
							<Image 
								source={{ uri: getImageURL(item) }} 
								style={[styles.carouselImage, { width: itemWidth, height: itemHeight }]} 
								contentFit="cover"
								transition={200}
								placeholder={{ blurhash: 'LGF5]+Yk^6#M@-5c,1J5@[or[Q6.' }}
								placeholderContentFit="cover"
								cachePolicy="memory-disk"
								onLoad={handleImageLoad(item)}
							/>
						</TouchableOpacity>
					);
				}}
				onViewableItemsChanged={onViewableItemsChanged}
				viewabilityConfig={viewabilityConfig}
				removeClippedSubviews={false}
				getItemLayout={(_, index) => ({
					length: itemWidth,
					offset: itemWidth * index,
					index,
				})}
			/>

			{/* Index Indicator */}
			<View style={styles.indexIndicatorContainer} pointerEvents="none">
				<Text style={styles.indexIndicatorText}>{activeIndex + 1}/{data.length}</Text>
			</View>
		</View>
	);
};

const createStyles = (colors: any) => StyleSheet.create({
	carouselContainer: {
		position: 'relative',
		width: '100%',
		alignItems: 'center',
	},
	flatList: {
		width: '100%',
	},
	flatListContent: {
		paddingHorizontal: 0,
	},
	carouselItemContainer: {
		overflow: 'hidden',
		borderRadius: 8,
		backgroundColor: colors.surface || '#f0f0f0',
	},
	carouselImage: {
		width: '100%',
		height: '100%',
	},
	indexIndicatorContainer: {
		position: 'absolute',
		top: 12,
		right: 12,
		backgroundColor: 'rgba(0, 0, 0, 0.6)',
		borderRadius: 12,
		paddingHorizontal: 8,
		paddingVertical: 4,
		zIndex: 10,
		minWidth: 40,
		alignItems: 'center',
	},
	indexIndicatorText: {
		color: '#FFFFFF',
		fontWeight: '600',
		fontSize: 12,
		letterSpacing: 0.3,
	},
});

export default PostImagesCarousel;
