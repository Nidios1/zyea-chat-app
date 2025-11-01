import React, { useMemo, useRef, useState } from 'react';
import { View, Image, FlatList, TouchableOpacity, Dimensions, StyleSheet, ViewToken } from 'react-native';
import { Text } from 'react-native-paper';
import { getImageURL } from '../../utils/imageUtils';
import { useTheme as useAppTheme } from '../../contexts/ThemeContext';

interface PostImagesCarouselProps {
	images: string[];
	onPressImage?: (index: number) => void;
	gap?: number;
}

const PostImagesCarousel: React.FC<PostImagesCarouselProps> = ({ images, onPressImage, gap = 0 }) => {
	const { colors } = useAppTheme();
	const screenWidth = Dimensions.get('window').width;
	const horizontalPadding = 24; // matches PostsListScreen container padding
	const itemWidth = screenWidth - horizontalPadding;
	const itemHeight = Math.min(Math.max(itemWidth * 0.9, 220), 600);

	const [activeIndex, setActiveIndex] = useState(0);
	const viewabilityConfig = useRef({ viewAreaCoveragePercentThreshold: 60 }).current;
	const onViewableItemsChanged = useRef(({ viewableItems }: { viewableItems: ViewToken[] }) => {
		if (viewableItems && viewableItems.length > 0 && viewableItems[0].index != null) {
			setActiveIndex(viewableItems[0].index);
		}
	}).current;

	const styles = useMemo(() => createStyles(colors), [colors]);

	const data = (images || []).filter(Boolean);
	if (data.length === 0) return null;

	// Single image: render static, no swipe, no dots
	if (data.length === 1) {
		return (
			<TouchableOpacity activeOpacity={0.9} onPress={() => onPressImage?.(0)}>
				<View style={[styles.item, { width: itemWidth, height: itemHeight }] }>
					<Image source={{ uri: getImageURL(data[0]) }} style={styles.image} resizeMode="cover" />
				</View>
			</TouchableOpacity>
		);
	}

	return (
		<View>
			{/* TOP RIGHT INDEX INDICATOR if many images */}
			{data.length > 1 && (
				<View style={styles.indexIndicatorContainer} pointerEvents="none">
					<Text style={styles.indexIndicatorText}>{activeIndex + 1}/{data.length}</Text>
				</View>
			)}
			<FlatList
				data={data}
				horizontal
				pagingEnabled
				showsHorizontalScrollIndicator={false}
				keyExtractor={(_, idx) => String(idx)}
				style={{ width: itemWidth, height: itemHeight }}
				contentContainerStyle={{ columnGap: gap }}
				renderItem={({ item, index }) => (
					<TouchableOpacity activeOpacity={0.9} onPress={() => onPressImage?.(index)}>
						<View style={[styles.item, { width: itemWidth, height: itemHeight }] }>
							<Image source={{ uri: getImageURL(item) }} style={styles.image} resizeMode="cover" />
						</View>
					</TouchableOpacity>
				)}
				onViewableItemsChanged={onViewableItemsChanged}
				viewabilityConfig={viewabilityConfig}
			/>

			{/* Dots */}
			{data.length > 1 && (
				<View style={styles.dotsContainer}>
					{data.map((_, i) => (
						<View key={i} style={[styles.dot, i === activeIndex ? styles.dotActive : styles.dotInactive]} />
					))}
				</View>
			)}
		</View>
	);
};

const createStyles = (colors: any) => StyleSheet.create({
	item: {
		borderRadius: 8,
		overflow: 'hidden',
		backgroundColor: '#f0f0f0',
	},
	image: {
		width: '100%',
		height: '100%',
	},
  indexIndicatorContainer: {
    position: 'absolute',
    top: 12,
    right: 18,
    backgroundColor: 'rgba(40,40,40,0.63)',
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 3,
    zIndex: 2,
    minWidth: 36,
    alignItems: 'center',
  },
  indexIndicatorText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
    letterSpacing: 0.5,
  },
	dotsContainer: {
		flexDirection: 'row',
		justifyContent: 'center',
		alignItems: 'center',
		marginTop: 8,
		gap: 6,
	},
	dot: {
		width: 6,
		height: 6,
		borderRadius: 3,
	},
	dotActive: {
		backgroundColor: colors.text,
		opacity: 0.9,
	},
	dotInactive: {
		backgroundColor: colors.text,
		opacity: 0.25,
	},
});

export default PostImagesCarousel;
