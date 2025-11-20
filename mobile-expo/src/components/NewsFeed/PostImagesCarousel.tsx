import React, { useMemo, useRef, useState, useEffect, useCallback } from 'react';
import { View, FlatList, TouchableOpacity, Dimensions, StyleSheet, ViewToken, ActivityIndicator } from 'react-native';
import { Image } from 'expo-image';
import { Text } from 'react-native-paper';
import { getImageURL } from '../../utils/imageUtils';
import { useTheme as useAppTheme } from '../../contexts/ThemeContext';
import { getImageMetadata, calculateDisplayDimensions, MediaMetadata, CalculatedDimensions } from '../../utils/mediaUtils';

interface PostImagesCarouselProps {
	images: string[];
	onPressImage?: (index: number) => void;
}

const PostImagesCarousel: React.FC<PostImagesCarouselProps> = ({ images, onPressImage }) => {
	const { colors } = useAppTheme();
	// Cache screen width to avoid re-calculating on every render (fixes jitter)
	const screenWidth = useMemo(() => Dimensions.get('window').width, []);
	const itemWidth = screenWidth;

	const [activeIndex, setActiveIndex] = useState(0);
	const [imageMetadata, setImageMetadata] = useState<Map<string, MediaMetadata>>(new Map());
	const [imageDimensions, setImageDimensions] = useState<Map<string, CalculatedDimensions>>(new Map());
	const [loadingMetadata, setLoadingMetadata] = useState(true);
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

		// Set fallback dimensions ngay lập tức để hiển thị ảnh không bị delay
		// Sử dụng aspect ratio 1:1 (square) làm fallback - an toàn nhất, không quá khác biệt
		const fallbackDimensionsMap = new Map<string, CalculatedDimensions>();
		data.forEach((imageUrl) => {
			// Sử dụng fallback dimensions với aspect ratio 1:1 (square)
			// Điều này đảm bảo layout không bị giật khi metadata load xong
			// Square là an toàn nhất vì không quá dài hay quá rộng
			const fallback = calculateDisplayDimensions(null, screenWidth);
			fallbackDimensionsMap.set(imageUrl, fallback);
		});
		// Set dimensions ngay lập tức để tránh layout shift
		setImageDimensions(fallbackDimensionsMap);
		// Set loadingMetadata = false ngay để hiển thị ảnh với fallback dimensions
		// Metadata sẽ được update sau khi load xong (smooth transition)
		setLoadingMetadata(false);

		// BẮT ĐẦU LOAD METADATA NGAY LẬP TỨC (không đợi)
		// Load metadata cho tất cả ảnh song song và cập nhật ngay khi có kết quả
		const totalImages = data.length;
		
		// Load tất cả metadata song song để tối ưu tốc độ
		const metadataPromises = data.map((imageUrl) => 
			getImageMetadata(imageUrl)
				.then((metadata) => {
					if (metadata) {
						// Cập nhật metadata ngay khi có (không đợi tất cả)
						setImageMetadata((prev) => {
							const newMap = new Map(prev);
							newMap.set(imageUrl, metadata);
							return newMap;
						});

						// Cập nhật dimensions ngay khi có metadata (smooth update, không giật)
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

		// Đợi tất cả metadata load xong (hoặc fail) để set loadingMetadata = false
		Promise.all(metadataPromises).then(() => {
			setLoadingMetadata(false);
		});
		
		// Nếu không có ảnh nào, set loadingMetadata = false ngay
		if (totalImages === 0) {
			setLoadingMetadata(false);
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [imagesKey, screenWidth]);

	// Single image: hiển thị với aspect ratio đúng theo kích thước thực tế của ảnh
	if (data.length === 1) {
		const imageUrl = data[0];
		const metadata = imageMetadata.get(imageUrl);
		const dimensions = imageDimensions.get(imageUrl) || calculateDisplayDimensions(null, screenWidth);

		// Handler để lấy dimensions ngay khi ảnh load (nhanh hơn Image.getSize)
		const handleImageLoad = useCallback((event: any) => {
			// expo-image onLoad trả về: event.source.width và event.source.height
			const source = event?.source || event?.nativeEvent?.source;
			const width = source?.width;
			const height = source?.height;
			
			if (width && height && width > 0 && height > 0) {
				// Chỉ cập nhật nếu chưa có metadata hoặc metadata khác
				const currentMetadata = imageMetadata.get(imageUrl);
				if (!currentMetadata || 
					Math.abs(currentMetadata.width - width) > 1 || 
					Math.abs(currentMetadata.height - height) > 1) {
					const newMetadata: MediaMetadata = {
						width,
						height,
						aspectRatio: width / height,
						type: 'image',
					};
					
					// Cập nhật metadata ngay lập tức
					setImageMetadata((prev) => {
						const newMap = new Map(prev);
						newMap.set(imageUrl, newMetadata);
						return newMap;
					});

					// Cập nhật dimensions ngay lập tức
					const newDimensions = calculateDisplayDimensions(newMetadata, screenWidth);
					setImageDimensions((prev) => {
						const newMap = new Map(prev);
						newMap.set(imageUrl, newDimensions);
						return newMap;
					});
				}
			}
		}, [imageUrl, screenWidth]);

		// Debug: Log dimensions để kiểm tra
		if (metadata && __DEV__) {
			console.log('📐 Single image dimensions:', {
				url: imageUrl.substring(0, 50),
				originalAspectRatio: metadata.aspectRatio,
				displayWidth: dimensions.width,
				displayHeight: dimensions.height,
				displayAspectRatio: dimensions.aspectRatio,
			});
		}

		return (
			<TouchableOpacity 
				activeOpacity={0.9} 
				onPress={() => onPressImage?.(0)}
				style={[styles.singleImageContainer, { 
					width: '100%', // Luôn full width
					aspectRatio: dimensions.aspectRatio, // Height tự động tính từ aspect ratio
				}]}
			>
				<Image 
					source={{ uri: getImageURL(imageUrl) }} 
					style={styles.singleImage} 
					contentFit="cover"
					transition={200}
					placeholder={{ blurhash: 'LGF5]+Yk^6#M@-5c,1J5@[or[Q6.' }}
					placeholderContentFit="cover"
					onLoad={handleImageLoad}
				/>
			</TouchableOpacity>
		);
	}

	// Two images: side-by-side với aspect square (giống social-app-main)
	if (data.length === 2) {
		const imageGap = 4; // gap_xs
		const imageWidth = (itemWidth - imageGap) / 2;
		const imageHeight = imageWidth; // Square aspect ratio

		return (
			<View style={[styles.twoImagesContainer, { gap: imageGap }]}>
				<TouchableOpacity 
					activeOpacity={0.9} 
					onPress={() => onPressImage?.(0)}
					style={[styles.twoImageItem, { flex: 1, aspectRatio: 1, borderTopRightRadius: 0, borderBottomRightRadius: 0 }]}
				>
					<Image 
						source={{ uri: getImageURL(data[0]) }} 
						style={[styles.twoImage, { width: imageWidth, height: imageHeight }]} 
						contentFit="cover"
						transition={200}
						placeholder={{ blurhash: 'LGF5]+Yk^6#M@-5c,1J5@[or[Q6.' }}
						placeholderContentFit="cover"
					/>
				</TouchableOpacity>
				<TouchableOpacity 
					activeOpacity={0.9} 
					onPress={() => onPressImage?.(1)}
					style={[styles.twoImageItem, { flex: 1, aspectRatio: 1, borderTopLeftRadius: 0, borderBottomLeftRadius: 0 }]}
				>
					<Image 
						source={{ uri: getImageURL(data[1]) }} 
						style={[styles.twoImage, { width: imageWidth, height: imageHeight }]} 
						contentFit="cover"
						transition={200}
						placeholder={{ blurhash: 'LGF5]+Yk^6#M@-5c,1J5@[or[Q6.' }}
						placeholderContentFit="cover"
					/>
				</TouchableOpacity>
			</View>
		);
	}

	// Three images: Facebook style - 2 ảnh trên (trái/phải), 1 ảnh dưới full width
	if (data.length === 3) {
		const imageGap = 4;
		const topImageWidth = (itemWidth - imageGap) / 2;
		const topImageHeight = topImageWidth; // Square aspect ratio
		const bottomImageHeight = topImageWidth * 0.75; // Slightly smaller height for bottom image

		return (
			<View style={styles.threeImagesContainer}>
				{/* Row 1: 2 ảnh trên (trái/phải) */}
				<View style={[styles.threeImagesTopRow, { gap: imageGap, marginBottom: imageGap }]}>
					<TouchableOpacity 
						activeOpacity={0.9} 
						onPress={() => onPressImage?.(0)}
						style={[styles.threeImageItem, { width: topImageWidth, height: topImageHeight, borderBottomLeftRadius: 0, borderTopRightRadius: 0, borderBottomRightRadius: 0 }]}
					>
						{loadingMetadata ? (
							<View style={[styles.loadingContainer, { width: topImageWidth, height: topImageHeight }]}>
								<ActivityIndicator size="small" color={colors.primary} />
							</View>
						) : (
							<Image 
								source={{ uri: getImageURL(data[0]) }} 
								style={[styles.threeImage, { width: topImageWidth, height: topImageHeight }]} 
								contentFit="cover"
								transition={200}
							/>
						)}
					</TouchableOpacity>
					<TouchableOpacity 
						activeOpacity={0.9} 
						onPress={() => onPressImage?.(1)}
						style={[styles.threeImageItem, { width: topImageWidth, height: topImageHeight, borderTopLeftRadius: 0, borderBottomLeftRadius: 0, borderBottomRightRadius: 0 }]}
					>
						{loadingMetadata ? (
							<View style={[styles.loadingContainer, { width: topImageWidth, height: topImageHeight }]}>
								<ActivityIndicator size="small" color={colors.primary} />
							</View>
						) : (
							<Image 
								source={{ uri: getImageURL(data[1]) }} 
								style={[styles.threeImage, { width: topImageWidth, height: topImageHeight }]} 
								contentFit="cover"
								transition={200}
							/>
						)}
					</TouchableOpacity>
				</View>
				{/* Row 2: 1 ảnh dưới full width */}
				<TouchableOpacity 
					activeOpacity={0.9} 
					onPress={() => onPressImage?.(2)}
					style={[styles.threeImageBottom, { width: itemWidth, height: bottomImageHeight, borderTopLeftRadius: 0, borderTopRightRadius: 0 }]}
				>
					{loadingMetadata ? (
						<View style={[styles.loadingContainer, { width: itemWidth, height: bottomImageHeight }]}>
							<ActivityIndicator size="small" color={colors.primary} />
						</View>
					) : (
						<Image 
							source={{ uri: getImageURL(data[2]) }} 
							style={[styles.threeImage, { width: itemWidth, height: bottomImageHeight }]} 
							contentFit="cover"
							transition={200}
						/>
					)}
				</TouchableOpacity>
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
						style={[styles.fourImageItem, { width: imageWidth, height: imageHeight, borderBottomLeftRadius: 0, borderTopRightRadius: 0, borderBottomRightRadius: 0 }]}
					>
						{loadingMetadata ? (
							<View style={[styles.loadingContainer, { width: imageWidth, height: imageHeight }]}>
								<ActivityIndicator size="small" color={colors.primary} />
							</View>
						) : (
							<Image 
								source={{ uri: getImageURL(data[0]) }} 
								style={[styles.fourImage, { width: imageWidth, height: imageHeight }]} 
								contentFit="cover"
								transition={200}
							/>
						)}
					</TouchableOpacity>
					<TouchableOpacity 
						activeOpacity={0.9} 
						onPress={() => onPressImage?.(1)}
						style={[styles.fourImageItem, { width: imageWidth, height: imageHeight, borderTopLeftRadius: 0, borderBottomLeftRadius: 0, borderBottomRightRadius: 0 }]}
					>
						{loadingMetadata ? (
							<View style={[styles.loadingContainer, { width: imageWidth, height: imageHeight }]}>
								<ActivityIndicator size="small" color={colors.primary} />
							</View>
						) : (
							<Image 
								source={{ uri: getImageURL(data[1]) }} 
								style={[styles.fourImage, { width: imageWidth, height: imageHeight }]} 
								contentFit="cover"
								transition={200}
							/>
						)}
					</TouchableOpacity>
				</View>
				<View style={[styles.fourImagesRow, { gap: imageGap }]}>
					<TouchableOpacity 
						activeOpacity={0.9} 
						onPress={() => onPressImage?.(2)}
						style={[styles.fourImageItem, { width: imageWidth, height: imageHeight, borderTopLeftRadius: 0, borderTopRightRadius: 0, borderBottomRightRadius: 0 }]}
					>
						{loadingMetadata ? (
							<View style={[styles.loadingContainer, { width: imageWidth, height: imageHeight }]}>
								<ActivityIndicator size="small" color={colors.primary} />
							</View>
						) : (
							<Image 
								source={{ uri: getImageURL(data[2]) }} 
								style={[styles.fourImage, { width: imageWidth, height: imageHeight }]} 
								contentFit="cover"
								transition={200}
							/>
						)}
					</TouchableOpacity>
					<TouchableOpacity 
						activeOpacity={0.9} 
						onPress={() => onPressImage?.(3)}
						style={[styles.fourImageItem, { width: imageWidth, height: imageHeight, borderTopLeftRadius: 0, borderBottomLeftRadius: 0, borderTopRightRadius: 0 }]}
					>
						{loadingMetadata ? (
							<View style={[styles.loadingContainer, { width: imageWidth, height: imageHeight }]}>
								<ActivityIndicator size="small" color={colors.primary} />
							</View>
						) : (
							<Image 
								source={{ uri: getImageURL(data[3]) }} 
								style={[styles.fourImage, { width: imageWidth, height: imageHeight }]} 
								contentFit="cover"
								transition={200}
							/>
						)}
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
						{loadingMetadata ? (
							<View style={[styles.loadingContainer, { width: imageWidth, height: imageHeight }]}>
								<ActivityIndicator size="small" color={colors.primary} />
							</View>
						) : (
							<Image 
								source={{ uri: getImageURL(data[0]) }} 
								style={[styles.fourImage, { width: imageWidth, height: imageHeight }]} 
								contentFit="cover"
								transition={200}
							/>
						)}
					</TouchableOpacity>
					<TouchableOpacity 
						activeOpacity={0.9} 
						onPress={() => onPressImage?.(1)}
						style={[styles.fourImageItem, { width: imageWidth, height: imageHeight, borderTopLeftRadius: 0, borderBottomLeftRadius: 0, borderBottomRightRadius: 0 }]}
					>
						{loadingMetadata ? (
							<View style={[styles.loadingContainer, { width: imageWidth, height: imageHeight }]}>
								<ActivityIndicator size="small" color={colors.primary} />
							</View>
						) : (
							<Image 
								source={{ uri: getImageURL(data[1]) }} 
								style={[styles.fourImage, { width: imageWidth, height: imageHeight }]} 
								contentFit="cover"
								transition={200}
							/>
						)}
					</TouchableOpacity>
				</View>
				<View style={[styles.fourImagesRow, { gap: imageGap }]}>
					<TouchableOpacity 
						activeOpacity={0.9} 
						onPress={() => onPressImage?.(2)}
						style={[styles.fourImageItem, { width: imageWidth, height: imageHeight, borderTopLeftRadius: 0, borderTopRightRadius: 0, borderBottomRightRadius: 0 }]}
					>
						{loadingMetadata ? (
							<View style={[styles.loadingContainer, { width: imageWidth, height: imageHeight }]}>
								<ActivityIndicator size="small" color={colors.primary} />
							</View>
						) : (
							<Image 
								source={{ uri: getImageURL(data[2]) }} 
								style={[styles.fourImage, { width: imageWidth, height: imageHeight }]} 
								contentFit="cover"
								transition={200}
							/>
						)}
					</TouchableOpacity>
					<TouchableOpacity 
						activeOpacity={0.9} 
						onPress={() => onPressImage?.(3)}
						style={[styles.fourImageItem, { width: imageWidth, height: imageHeight, borderTopLeftRadius: 0, borderBottomLeftRadius: 0, borderTopRightRadius: 0, position: 'relative' }]}
					>
						{loadingMetadata ? (
							<View style={[styles.loadingContainer, { width: imageWidth, height: imageHeight }]}>
								<ActivityIndicator size="small" color={colors.primary} />
							</View>
						) : (
							<>
								<Image 
									source={{ uri: getImageURL(data[3]) }} 
									style={[styles.fourImage, { width: imageWidth, height: imageHeight }]} 
									contentFit="cover"
									transition={200}
								/>
								{remainingCount > 0 && (
									<View style={styles.moreImagesOverlay}>
										<Text style={styles.moreImagesText}>+{remainingCount}</Text>
									</View>
								)}
							</>
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
					const dimensions = imageDimensions.get(item) || calculateDisplayDimensions(null, itemWidth);
					const itemHeight = dimensions.height;

					return (
						<TouchableOpacity 
							activeOpacity={0.9} 
							onPress={() => onPressImage?.(index)}
							style={[styles.carouselItemContainer, { width: itemWidth, height: itemHeight }]}
						>
							{loadingMetadata ? (
								<View style={[styles.loadingContainer, { width: itemWidth, height: itemHeight }]}>
									<ActivityIndicator size="large" color={colors.primary} />
								</View>
							) : (
								<Image 
									source={{ uri: getImageURL(item) }} 
									style={[styles.carouselImage, { width: itemWidth, height: itemHeight }]} 
									contentFit="cover"
									transition={200}
								/>
							)}
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
	singleImageContainer: {
		overflow: 'hidden',
		borderRadius: 12,
		alignSelf: 'center', // Căn giữa ảnh
		// Width, height và aspectRatio sẽ được set từ inline style
	},
	singleImage: {
		width: '100%',
		height: '100%',
		borderRadius: 12,
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
