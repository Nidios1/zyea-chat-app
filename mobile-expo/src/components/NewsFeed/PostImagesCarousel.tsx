import React, { useMemo, useRef, useState } from 'react';
import { View, Image, FlatList, TouchableOpacity, Dimensions, StyleSheet, ViewToken } from 'react-native';
import { Text } from 'react-native-paper';
import { getImageURL } from '../../utils/imageUtils';
import { useTheme as useAppTheme } from '../../contexts/ThemeContext';

interface PostImagesCarouselProps {
	images: string[];
	onPressImage?: (index: number) => void;
}

const PostImagesCarousel: React.FC<PostImagesCarouselProps> = ({ images, onPressImage }) => {
	const { colors } = useAppTheme();
	const screenWidth = Dimensions.get('window').width;
	const horizontalPadding = 0; // No padding for full width images
	const itemWidth = screenWidth;
	const itemHeight = Math.min(Math.max(itemWidth * 0.9, 300), 600);

	const [activeIndex, setActiveIndex] = useState(0);
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

	const data = (images || []).filter(Boolean);
	if (data.length === 0) return null;

	// Single image: full width, no swipe
	if (data.length === 1) {
		return (
			<TouchableOpacity 
				activeOpacity={0.9} 
				onPress={() => onPressImage?.(0)}
				style={styles.singleImageContainer}
			>
				<Image 
					source={{ uri: getImageURL(data[0]) }} 
					style={[styles.singleImage, { height: itemHeight }]} 
					resizeMode="cover" 
				/>
			</TouchableOpacity>
		);
	}

	// Two images: side-by-side (Threads style)
	if (data.length === 2) {
		const imageGap = 2;
		const imageWidth = (itemWidth - imageGap) / 2;
		const imageHeight = Math.min(Math.max(itemWidth * 0.7, 250), 500);
		
		return (
			<View style={styles.twoImagesContainer}>
				<TouchableOpacity 
					activeOpacity={0.9} 
					onPress={() => onPressImage?.(0)}
					style={styles.twoImageItem}
				>
					<Image 
						source={{ uri: getImageURL(data[0]) }} 
						style={[styles.twoImage, { width: imageWidth, height: imageHeight }]} 
						resizeMode="cover" 
					/>
				</TouchableOpacity>
				<View style={{ width: imageGap }} />
				<TouchableOpacity 
					activeOpacity={0.9} 
					onPress={() => onPressImage?.(1)}
					style={styles.twoImageItem}
				>
					<Image 
						source={{ uri: getImageURL(data[1]) }} 
						style={[styles.twoImage, { width: imageWidth, height: imageHeight }]} 
						resizeMode="cover" 
					/>
				</TouchableOpacity>
			</View>
		);
	}

	// Three or more images: carousel album with swipe
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
				renderItem={({ item, index }) => (
					<TouchableOpacity 
						activeOpacity={0.9} 
						onPress={() => onPressImage?.(index)}
						style={[styles.carouselItemContainer, { width: itemWidth }]}
					>
						<Image 
							source={{ uri: getImageURL(item) }} 
							style={[styles.carouselImage, { width: itemWidth, height: itemHeight }]} 
							resizeMode="cover" 
						/>
					</TouchableOpacity>
				)}
				onViewableItemsChanged={onViewableItemsChanged}
				viewabilityConfig={viewabilityConfig}
				removeClippedSubviews={false}
				getItemLayout={(_, index) => ({
					length: itemWidth,
					offset: itemWidth * index,
					index,
				})}
			/>

			{/* Index Indicator - Top Right (Threads style - no dots) */}
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
	},
	singleImageContainer: {
		width: '100%',
		overflow: 'hidden',
	},
	singleImage: {
		width: '100%',
		borderRadius: 8,
	},
	twoImagesContainer: {
		flexDirection: 'row',
		width: '100%',
		gap: 2,
	},
	twoImageItem: {
		flex: 1,
		overflow: 'hidden',
		borderRadius: 8,
	},
	twoImage: {
		width: '100%',
		height: '100%',
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
		color: '#fff',
		fontWeight: '600',
		fontSize: 12,
		letterSpacing: 0.3,
	},
});

export default PostImagesCarousel;
