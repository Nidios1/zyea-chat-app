import React, { useMemo } from 'react';
import { View, Image, TouchableOpacity, Dimensions, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import { getImageURL } from '../../utils/imageUtils';
import { useTheme as useAppTheme } from '../../contexts/ThemeContext';

interface PostImagesGridProps {
	images: string[];
	onPressImage?: (index: number) => void;
	gap?: number;
	maxRows?: number; // only affects 5+ overlay behavior
}

const PostImagesGrid: React.FC<PostImagesGridProps> = ({ images, onPressImage, gap = 8, maxRows = 2 }) => {
	const { colors } = useAppTheme();
	const screenWidth = Dimensions.get('window').width;
	const horizontalPadding = 24; // matches PostsListScreen container padding
	const containerWidth = screenWidth - horizontalPadding;

	const styles = useMemo(() => createStyles(gap, colors), [gap, colors]);

	if (!images || images.length === 0) return null;

	const safeImages = images.filter(Boolean);
	const count = safeImages.length;

	const renderOne = () => (
		<TouchableOpacity activeOpacity={0.9} onPress={() => onPressImage?.(0)}>
			<View style={[styles.item, { width: containerWidth, height: Math.min(Math.max(containerWidth * 0.75, 200), 600) }] }>
				<Image source={{ uri: getImageURL(safeImages[0]) }} style={styles.image} resizeMode="cover" />
			</View>
		</TouchableOpacity>
	);

	const renderTwo = () => {
		const itemWidth = (containerWidth - gap) / 2;
		const itemHeight = Math.min(Math.max(itemWidth * 1.1, 180), 500);
		return (
			<View style={styles.row}>
				{[0,1].map((i) => (
					<TouchableOpacity key={i} activeOpacity={0.9} onPress={() => onPressImage?.(i)}>
						<View style={[styles.item, { width: itemWidth, height: itemHeight }] }>
							<Image source={{ uri: getImageURL(safeImages[i]) }} style={styles.image} resizeMode="cover" />
						</View>
					</TouchableOpacity>
				))}
			</View>
		);
	};

	const renderThree = () => {
		// Layout: large left, two stacked right
		const leftWidth = Math.floor((containerWidth - gap) * 0.6);
		const rightWidth = containerWidth - gap - leftWidth;
		const height = Math.min(Math.max(containerWidth * 0.6, 220), 560);
		const rightHeight = (height - gap) / 2;
		return (
			<View style={styles.row}>
				<TouchableOpacity activeOpacity={0.9} onPress={() => onPressImage?.(0)}>
					<View style={[styles.item, { width: leftWidth, height }] }>
						<Image source={{ uri: getImageURL(safeImages[0]) }} style={styles.image} resizeMode="cover" />
					</View>
				</TouchableOpacity>
				<View style={{ width: rightWidth }}>
					{[1,2].map((i) => (
						<TouchableOpacity key={i} activeOpacity={0.9} onPress={() => onPressImage?.(i)}>
							<View style={[styles.item, { width: rightWidth, height: rightHeight, marginTop: i === 1 ? 0 : gap }] }>
								<Image source={{ uri: getImageURL(safeImages[i]) }} style={styles.image} resizeMode="cover" />
							</View>
						</TouchableOpacity>
					))}
				</View>
			</View>
		);
	};

	const renderFour = () => {
		const itemWidth = (containerWidth - gap) / 2;
		const itemHeight = Math.min(Math.max(itemWidth, 160), 340);
		return (
			<View>
				<View style={styles.row}>
					{[0,1].map((i) => (
						<TouchableOpacity key={i} activeOpacity={0.9} onPress={() => onPressImage?.(i)}>
							<View style={[styles.item, { width: itemWidth, height: itemHeight }] }>
								<Image source={{ uri: getImageURL(safeImages[i]) }} style={styles.image} resizeMode="cover" />
							</View>
						</TouchableOpacity>
					))}
				</View>
				<View style={[styles.row, { marginTop: gap }]}>
					{[2,3].map((i) => (
						<TouchableOpacity key={i} activeOpacity={0.9} onPress={() => onPressImage?.(i)}>
							<View style={[styles.item, { width: itemWidth, height: itemHeight }] }>
								<Image source={{ uri: getImageURL(safeImages[i]) }} style={styles.image} resizeMode="cover" />
							</View>
						</TouchableOpacity>
					))}
				</View>
			</View>
		);
	};

	const renderFivePlus = () => {
		// Show 2x2 grid, last item has +N overlay
		const itemWidth = (containerWidth - gap) / 2;
		const itemHeight = Math.min(Math.max(itemWidth, 160), 340);
		const visible = safeImages.slice(0, 4);
		const remaining = count - 4;
		return (
			<View>
				<View style={styles.row}>
					{[0,1].map((i) => (
						<TouchableOpacity key={i} activeOpacity={0.9} onPress={() => onPressImage?.(i)}>
							<View style={[styles.item, { width: itemWidth, height: itemHeight }] }>
								<Image source={{ uri: getImageURL(visible[i]) }} style={styles.image} resizeMode="cover" />
							</View>
						</TouchableOpacity>
					))}
				</View>
				<View style={[styles.row, { marginTop: gap }]}>
					{[2,3].map((i, idx) => {
						const isLast = idx === 1;
						return (
							<TouchableOpacity key={i} activeOpacity={0.9} onPress={() => onPressImage?.(i)}>
								<View style={[styles.item, { width: itemWidth, height: itemHeight }] }>
									<Image source={{ uri: getImageURL(visible[i]) }} style={styles.image} resizeMode="cover" />
									{isLast && remaining > 0 && (
										<View style={[styles.overlay, { backgroundColor: 'rgba(0,0,0,0.45)' }] }>
											<Text style={[styles.overlayText, { color: '#fff' }]}>+{remaining}</Text>
										</View>
									)}
								</View>
							</TouchableOpacity>
						);
					})}
				</View>
			</View>
		);
	};

	if (count === 1) return renderOne();
	if (count === 2) return renderTwo();
	if (count === 3) return renderThree();
	if (count === 4) return renderFour();
	return renderFivePlus();
};

const createStyles = (gap: number, colors: any) => StyleSheet.create({
	row: {
		flexDirection: 'row',
		justifyContent: 'space-between',
	},
	item: {
		borderRadius: 8,
		overflow: 'hidden',
		backgroundColor: '#f0f0f0',
	},
	image: {
		width: '100%',
		height: '100%',
	},
	overlay: {
		...StyleSheet.absoluteFillObject,
		alignItems: 'center',
		justifyContent: 'center',
	},
	overlayText: {
		fontSize: 28,
		fontWeight: '700',
	},
});

export default PostImagesGrid;
