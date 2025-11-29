import React, { useMemo, useState, useLayoutEffect } from 'react';
import { useTheme as useAppTheme } from '../../contexts/ThemeContext';
import { getImageMetadata, MediaMetadata } from '../../utils/mediaUtils';
import { FacebookImageLayout } from './FacebookImageLayout';

interface PostImagesGridProps {
	images: string[];
	onPressImage?: (index: number) => void;
	gap?: number;
	maxRows?: number; // only affects 5+ overlay behavior
}

const PostImagesGrid: React.FC<PostImagesGridProps> = ({ images, onPressImage }) => {
	const [imageMetadata, setImageMetadata] = useState<Map<string, MediaMetadata>>(new Map());

	if (!images || images.length === 0) return null;

	const safeImages = images.filter(Boolean);
	const imagesKey = JSON.stringify(safeImages);

	// Preload metadata
	useLayoutEffect(() => {
		const metadataPromises = safeImages.map((imageUrl) => 
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
				.catch(() => null)
		);

		Promise.all(metadataPromises);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [imagesKey]);

	return (
		<FacebookImageLayout
			images={safeImages}
			onPressImage={onPressImage}
			imageMetadata={imageMetadata}
		/>
	);
};

export default PostImagesGrid;
