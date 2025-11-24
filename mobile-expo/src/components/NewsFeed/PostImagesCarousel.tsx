import React, { useMemo, useRef, useState, useEffect } from 'react';
import { View, FlatList, TouchableOpacity, Dimensions, StyleSheet, ViewToken, ActivityIndicator, InteractionManager } from 'react-native';
import Animated from 'react-native-reanimated';
import { Image } from 'expo-image';
import { Text } from 'react-native-paper';
import {
	type AnimatedRef,
	measure,
	type MeasuredDimensions,
	runOnJS,
	runOnUI,
	useAnimatedRef,
} from 'react-native-reanimated';
import { getImageURL } from '../../utils/imageUtils';
import { useTheme as useAppTheme } from '../../contexts/ThemeContext';
import { getImageMetadata, calculateDisplayDimensions, MediaMetadata, CalculatedDimensions } from '../../utils/mediaUtils';
import { AutoSizedImage } from './AutoSizedImage';
import { useLightboxControls } from '../../contexts/LightboxContext';
import { type ImageSource } from '../../contexts/LightboxContext';

interface PostImagesCarouselProps {
	images: string[];
	altTexts?: string[]; // Alt text for each image (like social-app-main)
	onPressImage?: (index: number) => void;
}

const PostImagesCarousel: React.FC<PostImagesCarouselProps> = ({ images, altTexts, onPressImage }) => {
	const { colors } = useAppTheme();
	const { openLightbox } = useLightboxControls();
	// Cache screen width to avoid re-calculating on every render (fixes jitter)
	const screenWidth = useMemo(() => Dimensions.get('window').width, []);
	const itemWidth = screenWidth;

	const [activeIndex, setActiveIndex] = useState(0);
	const [imageMetadata, setImageMetadata] = useState<Map<string, MediaMetadata>>(new Map());
	const [imageDimensions, setImageDimensions] = useState<Map<string, CalculatedDimensions>>(new Map());
	const [loadingMetadata, setLoadingMetadata] = useState(false); // Bắt đầu với false để hiển thị ngay
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

	// Memoize data để tránh vòng lặp vô hạn - so sánh nội dung thay vì reference
	const imagesKey = useMemo(() => JSON.stringify(images), [images]);
	const data = useMemo(() => (images || []).filter(Boolean), [imagesKey]);
	
	if (data.length === 0) return null;

	// Track previous images để tránh load lại metadata không cần thiết
	const prevImagesKeyRef = useRef<string>('');

	// Load metadata cho tất cả ảnh - tối ưu để tránh giật
	useEffect(() => {
		// Chỉ load metadata nếu images thực sự thay đổi
		if (prevImagesKeyRef.current === imagesKey) {
			return;
		}
		prevImagesKeyRef.current = imagesKey;

		// Nếu chỉ có 1 ảnh, AutoSizedImage tự xử lý metadata và dimensions
		// Chỉ cần load metadata để truyền vào AutoSizedImage
		if (data.length === 1) {
			setLoadingMetadata(false);
			// Load metadata cho single image để truyền vào AutoSizedImage
			getImageMetadata(data[0])
				.then((metadata) => {
					if (metadata) {
						setImageMetadata((prev) => {
							const newMap = new Map(prev);
							newMap.set(data[0], metadata);
							return newMap;
						});
					}
				})
				.catch((error) => {
					console.warn('Error loading metadata:', error);
				});
			return;
		}

		// Nhiều ảnh: cần tính dimensions cho carousel
		// Set fallback dimensions ngay lập tức để hiển thị ảnh không bị delay
		const fallbackDimensionsMap = new Map<string, CalculatedDimensions>();
		data.forEach((imageUrl) => {
			const fallback = calculateDisplayDimensions(null, screenWidth);
			fallbackDimensionsMap.set(imageUrl, fallback);
		});
		setImageDimensions(fallbackDimensionsMap);
		setLoadingMetadata(false);

		// Load metadata cho tất cả ảnh song song
		const metadataPromises = data.map((imageUrl) => 
			getImageMetadata(imageUrl)
				.then((metadata) => {
					if (metadata) {
						setImageMetadata((prev) => {
							const newMap = new Map(prev);
							newMap.set(imageUrl, metadata);
							return newMap;
						});

						// Cập nhật dimensions cho carousel (nhiều ảnh)
						const dimensions = calculateDisplayDimensions(metadata, screenWidth);
						setImageDimensions((prev) => {
							const newMap = new Map(prev);
							newMap.set(imageUrl, dimensions);
							return newMap;
						});
					}
					return metadata;
				})
				.catch((error) => {
					console.warn('Error loading metadata:', error);
					return null;
				})
		);

		Promise.all(metadataPromises).then(() => {
			setLoadingMetadata(false);
		});
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [imagesKey, screenWidth]);

	// Single image: sử dụng AutoSizedImage với logic constrain aspect ratio giống social-app-main
	if (data.length === 1) {
		const imageUrl = data[0];
		const metadata = imageMetadata.get(imageUrl);
		const aspectRatio = metadata?.aspectRatio;

		// Debug: Log dimensions để kiểm tra
		if (metadata && __DEV__) {
			console.log('📐 Single image dimensions:', {
				url: imageUrl.substring(0, 50),
				originalAspectRatio: metadata.aspectRatio,
			});
		}

		// Prefetch images khi onPressIn (giống social-app-main)
		const handlePressIn = () => {
			InteractionManager.runAfterInteractions(() => {
				Image.prefetch(
					data.map(img => getImageURL(img)),
					'memory',
				);
			});
		};

		// Open lightbox với measure thumbnail position (giống social-app-main)
		const _openLightbox = (
			thumbRect: MeasuredDimensions | null,
			fetchedDims: { width: number; height: number } | null,
		) => {
			const items: ImageSource[] = data.map((img, i) => ({
				uri: getImageURL(img),
				thumbUri: getImageURL(img),
				alt: altTexts && altTexts[i] ? altTexts[i] : undefined, // Like social-app-main: alt: img.alt
				dimensions: metadata ? { width: metadata.width, height: metadata.height } : null,
				thumbRect: thumbRect,
				thumbDimensions: fetchedDims,
			}));

			openLightbox({
				images: items,
				index: 0,
			});

			// Callback cũ để backward compatible
			onPressImage?.(0);
		};

		const handlePress = (
			containerRef: AnimatedRef<any>,
			fetchedDims: { width: number; height: number } | null,
		) => {
			runOnUI(() => {
				'worklet';
				const rect = measure(containerRef);
				runOnJS(_openLightbox)(rect, fetchedDims);
			})();
		};

		return (
			<AutoSizedImage
				imageUrl={imageUrl}
				aspectRatio={aspectRatio}
				crop="constrained"
				onPress={handlePress}
				onPressIn={handlePressIn}
				metadata={metadata}
			/>
		);
	}

	// Prefetch images khi onPressIn (giống social-app-main)
	const handlePressInMultiple = () => {
		InteractionManager.runAfterInteractions(() => {
			Image.prefetch(
				data.map(img => getImageURL(img)),
				'memory',
			);
		});
	};

	// Helper để mở lightbox cho multiple images
	const openLightboxForMultiple = (
		index: number,
		thumbRects: (MeasuredDimensions | null)[],
		fetchedDims: ({ width: number; height: number } | null)[],
	) => {
		const items: ImageSource[] = data.map((img, i) => {
			const metadata = imageMetadata.get(img);
			return {
				uri: getImageURL(img),
				thumbUri: getImageURL(img),
				alt: altTexts && altTexts[i] ? altTexts[i] : undefined, // Like social-app-main: alt: img.alt
				dimensions: metadata ? { width: metadata.width, height: metadata.height } : null,
				thumbRect: thumbRects[i] ?? null,
				thumbDimensions: fetchedDims[i] ?? null,
			};
		});

		openLightbox({
			images: items,
			index,
		});

		// Callback cũ để backward compatible
		onPressImage?.(index);
	};

	// Two images: side-by-side với aspect square (giống social-app-main)
	if (data.length === 2) {
		const imageGap = 4; // gap_xs
		const imageWidth = (itemWidth - imageGap) / 2;
		const imageHeight = imageWidth; // Square aspect ratio
		const containerRef0 = useAnimatedRef();
		const containerRef1 = useAnimatedRef();
		const containerRefs = [containerRef0, containerRef1];
		const thumbDimsRef = useRef<({ width: number; height: number } | null)[]>([]);

		const handlePress = (index: number) => {
			runOnUI(() => {
				'worklet';
				const rects: (MeasuredDimensions | null)[] = [];
				for (const r of containerRefs) {
					rects.push(measure(r));
				}
				runOnJS(openLightboxForMultiple)(index, rects, thumbDimsRef.current);
			})();
		};

		return (
			<View style={[styles.twoImagesContainer, { gap: imageGap }]}>
				<TouchableOpacity 
					activeOpacity={0.9} 
					onPress={() => handlePress(0)}
					onPressIn={handlePressInMultiple}
					style={[styles.twoImageItem, { flex: 1, aspectRatio: 1, borderTopRightRadius: 0, borderBottomRightRadius: 0 }]}
				>
					<Animated.View ref={containerRef0} style={StyleSheet.absoluteFill} collapsable={false}>
						<Image 
							source={{ uri: getImageURL(data[0]) }} 
							style={[styles.twoImage, { width: imageWidth, height: imageHeight }]} 
							contentFit="cover"
							transition={200}
							placeholder={{ blurhash: 'LGF5]+Yk^6#M@-5c,1J5@[or[Q6.' }}
							placeholderContentFit="cover"
							onLoad={(e) => {
								thumbDimsRef.current[0] = {
									width: e.source.width,
									height: e.source.height,
								};
							}}
						/>
					</Animated.View>
				</TouchableOpacity>
				<TouchableOpacity 
					activeOpacity={0.9} 
					onPress={() => handlePress(1)}
					onPressIn={handlePressInMultiple}
					style={[styles.twoImageItem, { flex: 1, aspectRatio: 1, borderTopLeftRadius: 0, borderBottomLeftRadius: 0 }]}
				>
					<Animated.View ref={containerRef1} style={StyleSheet.absoluteFill} collapsable={false}>
						<Image 
							source={{ uri: getImageURL(data[1]) }} 
							style={[styles.twoImage, { width: imageWidth, height: imageHeight }]} 
							contentFit="cover"
							transition={200}
							placeholder={{ blurhash: 'LGF5]+Yk^6#M@-5c,1J5@[or[Q6.' }}
							placeholderContentFit="cover"
							onLoad={(e) => {
								thumbDimsRef.current[1] = {
									width: e.source.width,
									height: e.source.height,
								};
							}}
						/>
					</Animated.View>
				</TouchableOpacity>
			</View>
		);
	}

	// Three images: social-app-main style - 1 square trái + 2 stacked phải
	if (data.length === 3) {
		const imageGap = 4; // gap_xs
		const leftWidth = (itemWidth - imageGap) / 2;
		const rightWidth = leftWidth;
		const leftHeight = leftWidth; // Square
		const rightItemHeight = (leftHeight - imageGap) / 2; // 2 ảnh stacked

		return (
			<View style={[styles.threeImagesContainer, { flexDirection: 'row', gap: imageGap }]}>
				{/* Left: 1 square image */}
				<TouchableOpacity 
					activeOpacity={0.9} 
					onPress={() => onPressImage?.(0)}
					onPressIn={handlePressInMultiple}
					style={[styles.threeImageItem, { 
						flex: 1, 
						aspectRatio: 1,
						borderTopRightRadius: 0,
						borderBottomRightRadius: 0,
					}]}
				>
					<Image 
						source={{ uri: getImageURL(data[0]) }} 
						style={styles.threeImage} 
						contentFit="cover"
						transition={200}
						placeholder={{ blurhash: 'LGF5]+Yk^6#M@-5c,1J5@[or[Q6.' }}
						placeholderContentFit="cover"
					/>
				</TouchableOpacity>
				
				{/* Right: 2 stacked images */}
				<View style={{ flex: 1, gap: imageGap }}>
					<TouchableOpacity 
						activeOpacity={0.9} 
						onPress={() => onPressImage?.(1)}
						onPressIn={handlePressInMultiple}
						style={[styles.threeImageItem, { 
							flex: 1,
							borderTopLeftRadius: 0,
							borderBottomLeftRadius: 0,
							borderBottomRightRadius: 0,
						}]}
					>
						<Image 
							source={{ uri: getImageURL(data[1]) }} 
							style={styles.threeImage} 
							contentFit="cover"
							transition={200}
							placeholder={{ blurhash: 'LGF5]+Yk^6#M@-5c,1J5@[or[Q6.' }}
							placeholderContentFit="cover"
						/>
					</TouchableOpacity>
					<TouchableOpacity 
						activeOpacity={0.9} 
						onPress={() => onPressImage?.(2)}
						onPressIn={handlePressInMultiple}
						style={[styles.threeImageItem, { 
							flex: 1,
							borderTopLeftRadius: 0,
							borderBottomLeftRadius: 0,
							borderTopRightRadius: 0,
						}]}
					>
						<Image 
							source={{ uri: getImageURL(data[2]) }} 
							style={styles.threeImage} 
							contentFit="cover"
							transition={200}
							placeholder={{ blurhash: 'LGF5]+Yk^6#M@-5c,1J5@[or[Q6.' }}
							placeholderContentFit="cover"
						/>
					</TouchableOpacity>
				</View>
			</View>
		);
	}

	// Four images: 2x2 grid với aspect ratio 1.5 (giống social-app-main)
	if (data.length === 4) {
		const imageGap = 4;
		const imageWidth = (itemWidth - imageGap) / 2;
		const imageHeight = imageWidth / 1.5; // aspectRatio: 1.5

		return (
			<View style={styles.fourImagesContainer}>
				<View style={[styles.fourImagesRow, { gap: imageGap, marginBottom: imageGap }]}>
					<TouchableOpacity 
						activeOpacity={0.9} 
						onPress={() => onPressImage?.(0)}
						onPressIn={handlePressInMultiple}
						style={[styles.fourImageItem, { width: imageWidth, height: imageHeight, borderBottomLeftRadius: 0, borderTopRightRadius: 0, borderBottomRightRadius: 0 }]}
					>
						{/* Hiển thị ảnh ngay với placeholder, không chờ metadata */}
						<Image 
							source={{ uri: getImageURL(data[0]) }} 
							style={[styles.fourImage, { width: imageWidth, height: imageHeight }]} 
							contentFit="cover"
							transition={200}
							placeholder={{ blurhash: 'LGF5]+Yk^6#M@-5c,1J5@[or[Q6.' }}
							placeholderContentFit="cover"
							cachePolicy="memory-disk"
						/>
					</TouchableOpacity>
					<TouchableOpacity 
						activeOpacity={0.9} 
						onPress={() => onPressImage?.(1)}
						onPressIn={handlePressInMultiple}
						style={[styles.fourImageItem, { width: imageWidth, height: imageHeight, borderTopLeftRadius: 0, borderBottomLeftRadius: 0, borderBottomRightRadius: 0 }]}
					>
						<Image 
							source={{ uri: getImageURL(data[1]) }} 
							style={[styles.fourImage, { width: imageWidth, height: imageHeight }]} 
							contentFit="cover"
							transition={200}
							placeholder={{ blurhash: 'LGF5]+Yk^6#M@-5c,1J5@[or[Q6.' }}
							placeholderContentFit="cover"
							cachePolicy="memory-disk"
						/>
					</TouchableOpacity>
				</View>
				<View style={[styles.fourImagesRow, { gap: imageGap }]}>
					<TouchableOpacity 
						activeOpacity={0.9} 
						onPress={() => onPressImage?.(2)}
						onPressIn={handlePressInMultiple}
						style={[styles.fourImageItem, { width: imageWidth, height: imageHeight, borderTopLeftRadius: 0, borderTopRightRadius: 0, borderBottomRightRadius: 0 }]}
					>
						<Image 
							source={{ uri: getImageURL(data[2]) }} 
							style={[styles.fourImage, { width: imageWidth, height: imageHeight }]} 
							contentFit="cover"
							transition={200}
							placeholder={{ blurhash: 'LGF5]+Yk^6#M@-5c,1J5@[or[Q6.' }}
							placeholderContentFit="cover"
							cachePolicy="memory-disk"
						/>
					</TouchableOpacity>
					<TouchableOpacity 
						activeOpacity={0.9} 
						onPress={() => onPressImage?.(3)}
						onPressIn={handlePressInMultiple}
						style={[styles.fourImageItem, { width: imageWidth, height: imageHeight, borderTopLeftRadius: 0, borderBottomLeftRadius: 0, borderTopRightRadius: 0 }]}
					>
						<Image 
							source={{ uri: getImageURL(data[3]) }} 
							style={[styles.fourImage, { width: imageWidth, height: imageHeight }]} 
							contentFit="cover"
							transition={200}
							placeholder={{ blurhash: 'LGF5]+Yk^6#M@-5c,1J5@[or[Q6.' }}
							placeholderContentFit="cover"
							cachePolicy="memory-disk"
						/>
					</TouchableOpacity>
				</View>
			</View>
		);
	}

	// Five or more images: Show first 4 in grid + overlay "+X more" (giống social-app-main)
	if (data.length >= 5) {
		const imageGap = 4;
		const imageWidth = (itemWidth - imageGap) / 2;
		const imageHeight = imageWidth / 1.5;
		const remainingCount = data.length - 4;

		return (
			<View style={styles.fourImagesContainer}>
				<View style={[styles.fourImagesRow, { gap: imageGap, marginBottom: imageGap }]}>
					<TouchableOpacity 
						activeOpacity={0.9} 
						onPress={() => onPressImage?.(0)}
						style={[styles.fourImageItem, { width: imageWidth, height: imageHeight, borderBottomLeftRadius: 0, borderTopRightRadius: 0, borderBottomRightRadius: 0 }]}
					>
						{/* Hiển thị ảnh ngay với placeholder, không chờ metadata */}
						<Image 
							source={{ uri: getImageURL(data[0]) }} 
							style={[styles.fourImage, { width: imageWidth, height: imageHeight }]} 
							contentFit="cover"
							transition={200}
							placeholder={{ blurhash: 'LGF5]+Yk^6#M@-5c,1J5@[or[Q6.' }}
							placeholderContentFit="cover"
							cachePolicy="memory-disk"
						/>
					</TouchableOpacity>
					<TouchableOpacity 
						activeOpacity={0.9} 
						onPress={() => onPressImage?.(1)}
						style={[styles.fourImageItem, { width: imageWidth, height: imageHeight, borderTopLeftRadius: 0, borderBottomLeftRadius: 0, borderBottomRightRadius: 0 }]}
					>
						<Image 
							source={{ uri: getImageURL(data[1]) }} 
							style={[styles.fourImage, { width: imageWidth, height: imageHeight }]} 
							contentFit="cover"
							transition={200}
							placeholder={{ blurhash: 'LGF5]+Yk^6#M@-5c,1J5@[or[Q6.' }}
							placeholderContentFit="cover"
							cachePolicy="memory-disk"
						/>
					</TouchableOpacity>
				</View>
				<View style={[styles.fourImagesRow, { gap: imageGap }]}>
					<TouchableOpacity 
						activeOpacity={0.9} 
						onPress={() => onPressImage?.(2)}
						style={[styles.fourImageItem, { width: imageWidth, height: imageHeight, borderTopLeftRadius: 0, borderTopRightRadius: 0, borderBottomRightRadius: 0 }]}
					>
						<Image 
							source={{ uri: getImageURL(data[2]) }} 
							style={[styles.fourImage, { width: imageWidth, height: imageHeight }]} 
							contentFit="cover"
							transition={200}
							placeholder={{ blurhash: 'LGF5]+Yk^6#M@-5c,1J5@[or[Q6.' }}
							placeholderContentFit="cover"
							cachePolicy="memory-disk"
						/>
					</TouchableOpacity>
					<TouchableOpacity 
						activeOpacity={0.9} 
						onPress={() => onPressImage?.(3)}
						style={[styles.fourImageItem, { width: imageWidth, height: imageHeight, borderTopLeftRadius: 0, borderBottomLeftRadius: 0, borderTopRightRadius: 0, position: 'relative' }]}
					>
						<Image 
							source={{ uri: getImageURL(data[3]) }} 
							style={[styles.fourImage, { width: imageWidth, height: imageHeight }]} 
							contentFit="cover"
							transition={200}
							placeholder={{ blurhash: 'LGF5]+Yk^6#M@-5c,1J5@[or[Q6.' }}
							placeholderContentFit="cover"
							cachePolicy="memory-disk"
						/>
						{remainingCount > 0 && (
							<View style={styles.moreImagesOverlay}>
								<Text style={styles.moreImagesText}>+{remainingCount}</Text>
							</View>
						)}
					</TouchableOpacity>
				</View>
			</View>
		);
	}

	// Fallback: carousel cho các trường hợp khác
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
					// Luôn có dimensions (fallback hoặc từ metadata) - hiển thị ngay
					const dimensions = imageDimensions.get(item) || calculateDisplayDimensions(null, itemWidth);
					const itemHeight = dimensions.height;

					return (
						<TouchableOpacity 
							activeOpacity={0.9} 
							onPress={() => onPressImage?.(index)}
							onPressIn={handlePressInMultiple}
							style={[styles.carouselItemContainer, { width: itemWidth, height: itemHeight }]}
						>
							{/* Hiển thị ảnh ngay với placeholder, không chờ metadata */}
							<Image 
								source={{ uri: getImageURL(item) }} 
								style={[styles.carouselImage, { width: itemWidth, height: itemHeight }]} 
								contentFit="cover"
								transition={200}
								placeholder={{ blurhash: 'LGF5]+Yk^6#M@-5c,1J5@[or[Q6.' }}
								placeholderContentFit="cover"
								cachePolicy="memory-disk" // Tối ưu caching
							/>
						</TouchableOpacity>
					);
				}}
				onViewableItemsChanged={onViewableItemsChanged}
				viewabilityConfig={viewabilityConfig}
				removeClippedSubviews={false}
				getItemLayout={(_, index) => {
					const item = data[index];
					const dimensions = imageDimensions.get(item) || calculateDisplayDimensions(null, itemWidth);
					return {
						length: itemWidth,
						offset: itemWidth * index,
						index,
					};
				}}
			/>

			{/* Index Indicator - Top Right */}
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
		alignItems: 'center', // Căn giữa container giống Facebook
	},
	twoImagesContainer: {
		flexDirection: 'row',
		width: '100%',
		alignItems: 'stretch', // Stretch để ảnh đều nhau
		justifyContent: 'flex-start', // Bắt đầu từ bên trái giống Facebook
	},
	twoImageItem: {
		overflow: 'hidden',
		borderRadius: 12,
	},
	twoImage: {
		width: '100%',
		height: '100%',
	},
	threeImagesContainer: {
		width: '100%',
		alignItems: 'center', // Căn giữa ảnh
	},
	threeImagesTopRow: {
		flexDirection: 'row',
		width: '100%',
		alignItems: 'center',
		justifyContent: 'center',
	},
	threeImageItem: {
		overflow: 'hidden',
		borderRadius: 12,
	},
	threeImageBottom: {
		overflow: 'hidden',
		borderRadius: 12,
		width: '100%',
	},
	threeImage: {
		width: '100%',
		height: '100%',
	},
	fourImagesContainer: {
		width: '100%',
		alignItems: 'center', // Căn giữa ảnh
	},
	fourImagesRow: {
		flexDirection: 'row',
		width: '100%',
		alignItems: 'center', // Căn giữa ảnh
		justifyContent: 'center', // Căn giữa ảnh
	},
	fourImageItem: {
		overflow: 'hidden',
		borderRadius: 12,
	},
	fourImage: {
		width: '100%',
		height: '100%',
	},
	moreImagesOverlay: {
		position: 'absolute',
		top: 0,
		left: 0,
		right: 0,
		bottom: 0,
		backgroundColor: 'rgba(0, 0, 0, 0.5)',
		justifyContent: 'center',
		alignItems: 'center',
		borderRadius: 12,
	},
	moreImagesText: {
		color: '#FFFFFF',
		fontSize: 24,
		fontWeight: '700',
		letterSpacing: 0.5,
	},
	flatList: {
		width: '100%',
	},
	flatListContent: {
		paddingHorizontal: 0,
	},
	carouselItemContainer: {
		overflow: 'hidden',
	},
	carouselImage: {
		width: '100%',
		height: '100%',
	},
	loadingContainer: {
		justifyContent: 'center',
		alignItems: 'center',
		backgroundColor: colors.border || '#1a1a1a',
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
