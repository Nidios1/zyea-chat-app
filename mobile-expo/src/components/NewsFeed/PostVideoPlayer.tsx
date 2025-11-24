import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { View, TouchableOpacity, StyleSheet, Dimensions, ActivityIndicator, Platform } from 'react-native';
import { Video, ResizeMode, AVPlaybackStatus } from 'expo-av';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ImageBackground } from 'expo-image';
import { getVideoURL, getImageURL } from '../../utils/imageUtils';
import { useTheme as useAppTheme } from '../../contexts/ThemeContext';
import { getVideoMetadata, calculateDisplayDimensions, MediaMetadata, CalculatedDimensions } from '../../utils/mediaUtils';

interface PostVideoPlayerProps {
	videoUrl: string;
	thumbnailUrl?: string;
	postId: string | number;
	isPlaying: boolean;
	onPress: () => void;
	onPlaybackStatusUpdate?: (status: AVPlaybackStatus) => void;
	videoRef?: React.RefObject<Video>;
	aspectRatio?: number; // Optional aspect ratio from API
}

// ConstrainedImage component giống social-app-main
function ConstrainedVideo({
	aspectRatio,
	children,
	minMobileAspectRatio,
}: {
	aspectRatio: number;
	minMobileAspectRatio?: number;
	children: React.ReactNode;
}) {
	const screenWidth = useMemo(() => Dimensions.get('window').width, []);
	
	/**
	 * Computed as a % value to apply as `paddingTop`, this basically controls
	 * the height of the video.
	 */
	const outerAspectRatio = useMemo(() => {
		// Ensure aspectRatio is valid
		if (!aspectRatio || !isFinite(aspectRatio) || aspectRatio <= 0) {
			console.warn('⚠️ ConstrainedVideo: Invalid aspectRatio, using default 16/9');
			return (1 / (16 / 9)) * 100;
		}
		
		// Giống social-app-main: Math.min(1 / aspectRatio, minMobileAspectRatio ?? 16 / 9)
		const ratio = Platform.OS === 'ios' || Platform.OS === 'android'
			? Math.min(1 / aspectRatio, minMobileAspectRatio ?? (16 / 9)) // Fixed: should be 16/9, not 1/(16/9)
			: Math.min(1 / aspectRatio, 1); // 1:1 bounding box
		
		const percentage = ratio * 100;
		// Ensure percentage is valid
		if (!isFinite(percentage) || percentage <= 0 || percentage > 100) {
			console.warn('⚠️ ConstrainedVideo: Invalid percentage, using default');
			return (1 / (16 / 9)) * 100;
		}
		
		return percentage;
	}, [aspectRatio, minMobileAspectRatio]);

	return (
		<View style={styles.constrainedContainer}>
			<View style={[styles.constrainedWrapper, { paddingTop: `${outerAspectRatio}%` }]}>
				<View style={[styles.constrainedInner, { aspectRatio: aspectRatio || 16 / 9 }]}>
					{children}
				</View>
			</View>
		</View>
	);
}

// PlayButtonIcon component giống social-app-main
function PlayButtonIcon({ size = 32 }: { size?: number }) {
	const { colors, isDarkMode } = useAppTheme();
	// Use theme colors for better consistency
	const bg = isDarkMode 
		? (colors.surface || '#1a1a1a') 
		: (colors.border || '#f0f0f0');
	const fg = isDarkMode 
		? (colors.text || '#f0f0f0') 
		: (colors.text || '#1a1a1a');

	return (
		<>
			<View
				style={[
					styles.playButtonBackground,
					{
						backgroundColor: bg,
						shadowColor: isDarkMode ? '#000' : 'rgba(0, 0, 0, 0.3)',
						shadowRadius: 32,
						shadowOpacity: isDarkMode ? 0.6 : 0.4,
						elevation: 24,
						width: size + size / 1.5,
						height: size + size / 1.5,
						opacity: 0.7,
					},
				]}
			/>
			<MaterialCommunityIcons 
				name="play" 
				size={size} 
				color={fg} 
				style={styles.playIcon}
			/>
		</>
	);
}

const PostVideoPlayer: React.FC<PostVideoPlayerProps> = ({
	videoUrl,
	thumbnailUrl,
	postId,
	isPlaying,
	onPress,
	onPlaybackStatusUpdate,
	videoRef: externalVideoRef,
	aspectRatio: providedAspectRatio,
}) => {
	const { colors } = useAppTheme();
	// Cache screen width to avoid re-calculating on every render (fixes jitter)
	const screenWidth = useMemo(() => Dimensions.get('window').width, []);
	const internalVideoRef = useRef<Video>(null);
	const videoRef = externalVideoRef || internalVideoRef;
	
	const [metadata, setMetadata] = useState<MediaMetadata | null>(null);
	const [dimensions, setDimensions] = useState<CalculatedDimensions | null>(null);
	const [loadingMetadata, setLoadingMetadata] = useState(true);
	const [status, setStatus] = useState<'playing' | 'paused' | 'pending'>('pending');
	const [isLoading, setIsLoading] = useState(false);
	const [isActive, setIsActive] = useState(false);
	const [showOverlay, setShowOverlay] = useState(true);

	// Get final video URL - videoUrl should already be processed, but ensure it's valid
	const finalVideoUrl = useMemo(() => {
		console.log('🎬 PostVideoPlayer: Processing videoUrl for post:', postId, {
			videoUrl,
			videoUrlType: typeof videoUrl,
			videoUrlLength: videoUrl?.length,
		});
		
		if (!videoUrl) {
			console.warn('⚠️ PostVideoPlayer: videoUrl is empty for post:', postId);
			return '';
		}
		
		// Trim whitespace
		const trimmedUrl = String(videoUrl).trim();
		if (!trimmedUrl || trimmedUrl === '') {
			console.warn('⚠️ PostVideoPlayer: videoUrl is empty after trim for post:', postId);
			return '';
		}
		
		// If already a full URL, use it directly
		if (trimmedUrl.startsWith('http://') || trimmedUrl.startsWith('https://')) {
			console.log('✅ PostVideoPlayer: Using full URL directly:', trimmedUrl);
			return trimmedUrl;
		}
		
		// Otherwise, process it
		const processed = getVideoURL(trimmedUrl);
		console.log('🎬 PostVideoPlayer: Processed URL:', {
			original: trimmedUrl,
			processed,
			isValid: !!(processed && processed.trim() !== ''),
		});
		
		if (!processed || processed.trim() === '') {
			console.warn('⚠️ PostVideoPlayer: getVideoURL returned empty for:', trimmedUrl, 'post:', postId);
		}
		return processed;
	}, [videoUrl, postId]);

	// Calculate aspect ratio - ưu tiên từ API, sau đó từ metadata, cuối cùng là fallback
	let aspectRatio: number | undefined = providedAspectRatio;
	if (!aspectRatio && metadata) {
		aspectRatio = metadata.aspectRatio;
	}
	if (!aspectRatio) {
		aspectRatio = 16 / 9; // Default fallback
	}

	// Constrain aspect ratio giống social-app-main
	// max of 1:2 ratio in feeds (tức là min aspect ratio là 0.5)
	let constrained: number | undefined;
	if (aspectRatio !== undefined) {
		const minRatio = 1 / 2; // 0.5 (tỷ lệ 1:2 - video dọc nhất)
		constrained = Math.max(aspectRatio, minRatio);
	}

	// Update overlay visibility
	useEffect(() => {
		setShowOverlay(
			!isActive ||
			isLoading ||
			(status === 'paused' && !isActive) ||
			status === 'pending'
		);
	}, [isActive, isLoading, status]);

	// Reset status when not active
	useEffect(() => {
		if (!isActive && status !== 'pending') {
			setStatus('pending');
		}
	}, [isActive, status]);

	// Helper function để cập nhật metadata từ video status
	const updateVideoMetadata = useCallback((status: any) => {
		if (status.isLoaded && status.naturalSize) {
			const videoWidth = status.naturalSize.width;
			const videoHeight = status.naturalSize.height;
			
			if (videoWidth > 0 && videoHeight > 0) {
				const currentAspectRatio = videoWidth / videoHeight;
				
				// Debug: Log video dimensions
				console.log('📐 Video dimensions from naturalSize:', {
					postId,
					width: videoWidth,
					height: videoHeight,
					aspectRatio: currentAspectRatio,
					providedAspectRatio,
				});
				
				setMetadata((prevMetadata) => {
					// Chỉ update nếu aspect ratio khác đáng kể (> 1% difference)
					// hoặc chưa có metadata
					const hasMetadata = prevMetadata && Math.abs(prevMetadata.aspectRatio - currentAspectRatio) < 0.01;
					
					if (!hasMetadata) {
						const videoMetadata: MediaMetadata = {
							width: videoWidth,
							height: videoHeight,
							aspectRatio: currentAspectRatio,
							type: 'video',
						};
						
						const calculatedDimensions = calculateDisplayDimensions(videoMetadata, screenWidth);
						setDimensions(calculatedDimensions);
						
						console.log('📐 Updated video metadata:', {
							metadata: videoMetadata,
							calculatedDimensions,
						});
						
						return videoMetadata;
					}
					return prevMetadata;
				});
			} else {
				console.warn('⚠️ Invalid video dimensions:', { videoWidth, videoHeight });
			}
		} else {
			// Debug: Log when naturalSize is not available
			if (status.isLoaded && !status.naturalSize) {
				console.warn('⚠️ Video loaded but naturalSize not available:', {
					postId,
					statusKeys: Object.keys(status),
				});
			}
		}
	}, [screenWidth, postId, providedAspectRatio]);

	// Load metadata - ban đầu dùng aspect ratio từ API hoặc thumbnail
	useEffect(() => {
		const loadInitialMetadata = async () => {
			setLoadingMetadata(true);
			try {
				// Ưu tiên 1: Sử dụng aspect ratio từ API nếu có
				if (providedAspectRatio && providedAspectRatio > 0 && isFinite(providedAspectRatio)) {
					console.log('📐 Using aspect ratio from API:', providedAspectRatio);
					const apiMetadata: MediaMetadata = {
						width: 1920, // Giả định width (sẽ được update khi video load)
						height: 1920 / providedAspectRatio,
						aspectRatio: providedAspectRatio,
						type: 'video',
					};
					setMetadata(apiMetadata);
					const calculatedDimensions = calculateDisplayDimensions(apiMetadata, screenWidth);
					setDimensions(calculatedDimensions);
					setLoadingMetadata(false);
					return;
				}
				
				// Ưu tiên 2: Thử lấy từ thumbnail
				if (thumbnailUrl) {
					const videoMetadata = await getVideoMetadata(videoUrl, thumbnailUrl);
					if (videoMetadata) {
						console.log('📐 Using aspect ratio from thumbnail:', videoMetadata.aspectRatio);
						setMetadata(videoMetadata);
						const calculatedDimensions = calculateDisplayDimensions(videoMetadata, screenWidth);
						setDimensions(calculatedDimensions);
						setLoadingMetadata(false);
						return;
					}
				}
				
				// Fallback: 16:9 nếu không có gì
				console.log('📐 Using fallback aspect ratio: 16/9');
				const fallbackMetadata: MediaMetadata = {
					width: 1920,
					height: 1080,
					aspectRatio: 16 / 9,
					type: 'video',
				};
				setMetadata(fallbackMetadata);
				const fallbackDimensions = calculateDisplayDimensions(fallbackMetadata, screenWidth);
				setDimensions(fallbackDimensions);
			} catch (error) {
				console.warn('Error loading initial video metadata:', error);
				const fallbackMetadata: MediaMetadata = {
					width: 1920,
					height: 1080,
					aspectRatio: 16 / 9,
					type: 'video',
				};
				setMetadata(fallbackMetadata);
				const fallbackDimensions = calculateDisplayDimensions(fallbackMetadata, screenWidth);
				setDimensions(fallbackDimensions);
			} finally {
				setLoadingMetadata(false);
			}
		};

		loadInitialMetadata();
	}, [videoUrl, thumbnailUrl, screenWidth, providedAspectRatio]);

	// Handle video playback
	useEffect(() => {
		const handlePlayback = async () => {
			const currentRef = videoRef?.current;
			if (!currentRef) return;

			try {
				if (isPlaying) {
					setIsActive(true);
					await currentRef.playAsync();
					setStatus('playing');
				} else {
					await currentRef.pauseAsync();
					setStatus('paused');
					if (!isActive) {
						await currentRef.setPositionAsync(0);
					}
				}
			} catch (error) {
				console.warn('Error controlling video playback:', error);
			}
		};

		handlePlayback();
	}, [isPlaying, videoRef, isActive]);

	const togglePlayback = useCallback(() => {
		const currentRef = videoRef?.current;
		if (currentRef) {
			if (isPlaying) {
				currentRef.pauseAsync();
			} else {
				currentRef.playAsync();
			}
		}
	}, [videoRef, isPlaying]);

	const finalAspectRatio = constrained || aspectRatio || 16 / 9;

	// Debug: Log video rendering
	useEffect(() => {
		console.log('🎬 PostVideoPlayer rendering:', {
			postId,
			videoUrl,
			finalVideoUrl,
			thumbnailUrl,
			isPlaying,
			finalAspectRatio,
			aspectRatio,
			providedAspectRatio,
			constrained,
		});
	}, [postId, videoUrl, finalVideoUrl, thumbnailUrl, isPlaying, finalAspectRatio, aspectRatio, providedAspectRatio, constrained]);

	// Don't render if no valid video URL
	if (!finalVideoUrl) {
		console.warn('⚠️ PostVideoPlayer: Not rendering - no valid video URL');
		return null;
	}

	// Ensure aspect ratio is valid
	const safeAspectRatio = finalAspectRatio > 0 && isFinite(finalAspectRatio) ? finalAspectRatio : 16 / 9;

	return (
		<View style={styles.container}>
			<ConstrainedVideo
				aspectRatio={safeAspectRatio}
				minMobileAspectRatio={14 / 9} // slightly smaller max height than images
			>
				<View style={styles.videoWrapper}>
					<Video
						ref={videoRef}
						source={{ uri: finalVideoUrl }}
						style={styles.video}
						resizeMode={ResizeMode.COVER}
						shouldPlay={isPlaying && isActive}
						useNativeControls={false}
						isMuted={true}
						isLooping={false}
						posterSource={thumbnailUrl ? { uri: getImageURL(thumbnailUrl) } : undefined}
						onLoadStart={() => {
							setIsLoading(true);
						}}
						onLoad={async () => {
							const currentRef = videoRef?.current;
							if (currentRef) {
								try {
									await new Promise(resolve => setTimeout(resolve, 300));
									const status = await currentRef.getStatusAsync();
									updateVideoMetadata(status);
									setIsLoading(false);
									
									if (!isPlaying) {
										await currentRef.setPositionAsync(0);
									}
								} catch (error) {
									console.warn('Error getting video size in onLoad:', error);
									setIsLoading(false);
								}
							}
						}}
						onReadyForDisplay={() => {
							const currentRef = videoRef?.current;
							if (currentRef) {
								setTimeout(async () => {
									try {
										const status = await currentRef.getStatusAsync();
										updateVideoMetadata(status);
									} catch (error) {
										console.warn('Error getting video size in onReadyForDisplay:', error);
									}
								}, 200);
							}
						}}
						onPlaybackStatusUpdate={(status) => {
							updateVideoMetadata(status);
							
							if (status.isLoaded) {
								if (status.isPlaying) {
									setStatus('playing');
									setIsLoading(false);
								} else if (status.didJustFinish) {
									setStatus('paused');
									setIsActive(false);
									currentRef?.setPositionAsync(0);
								} else if (status.error) {
									console.error('Video playback error:', status.error);
									setStatus('paused');
									setIsActive(false);
								}
							}
							
							if (onPlaybackStatusUpdate) {
								onPlaybackStatusUpdate(status);
							}
						}}
					/>

					{/* Thumbnail overlay - giống social-app-main */}
					{thumbnailUrl && (
						<ImageBackground
							source={{ uri: getImageURL(thumbnailUrl) }}
							style={[
								styles.thumbnailOverlay,
								{
									display: showOverlay ? 'flex' : 'none',
									backgroundColor: 'transparent', // Important for play button to show
								},
							]}
							cachePolicy="memory-disk"
						>
							{showOverlay && (
								<TouchableOpacity
									style={styles.playButtonContainer}
									onPress={onPress}
									activeOpacity={0.8}
								>
									{isLoading ? (
										<View style={styles.loadingSpinnerContainer}>
											<ActivityIndicator size="large" color="white" />
										</View>
									) : (
										<PlayButtonIcon size={32} />
									)}
								</TouchableOpacity>
							)}
						</ImageBackground>
					)}

					{/* Fallback play button nếu không có thumbnail */}
					{!thumbnailUrl && showOverlay && (
						<View style={styles.thumbnailOverlay}>
							<TouchableOpacity
								style={styles.playButtonContainer}
								onPress={onPress}
								activeOpacity={0.8}
							>
								{isLoading ? (
									<View style={styles.loadingSpinnerContainer}>
										<ActivityIndicator size="large" color="white" />
									</View>
								) : (
									<PlayButtonIcon size={32} />
								)}
							</TouchableOpacity>
						</View>
					)}
				</View>
			</ConstrainedVideo>
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		width: '100%',
		overflow: 'hidden',
		borderRadius: 12,
		marginTop: 6,
		marginBottom: 2,
	},
	constrainedContainer: {
		width: '100%',
	},
	constrainedWrapper: {
		position: 'relative',
		overflow: 'hidden',
		width: '100%',
	},
	constrainedInner: {
		position: 'absolute',
		top: 0,
		left: 0,
		right: 0,
		bottom: 0,
		width: '100%',
		height: '100%',
		borderRadius: 12,
		overflow: 'hidden',
		backgroundColor: '#000000', // Video background should always be black
	},
	videoWrapper: {
		width: '100%',
		height: '100%',
		position: 'relative',
	},
	video: {
		width: '100%',
		height: '100%',
	},
	thumbnailOverlay: {
		position: 'absolute',
		top: 0,
		left: 0,
		right: 0,
		bottom: 0,
		width: '100%',
		height: '100%',
		justifyContent: 'center',
		alignItems: 'center',
	},
	playButtonContainer: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
		width: '100%',
		height: '100%',
	},
	playButtonBackground: {
		position: 'absolute',
		borderRadius: 9999,
		justifyContent: 'center',
		alignItems: 'center',
	},
	playIcon: {
		position: 'absolute',
	},
	loadingSpinnerContainer: {
		borderRadius: 9999,
		padding: 8,
		justifyContent: 'center',
		alignItems: 'center',
	},
});

export default PostVideoPlayer;
