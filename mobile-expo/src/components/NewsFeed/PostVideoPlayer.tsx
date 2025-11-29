import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions, ActivityIndicator, Platform } from 'react-native';
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
			const defaultRatio = (1 / (16 / 9)) * 100;
			console.log('📐 ConstrainedVideo: Using default ratio:', defaultRatio);
			return defaultRatio;
		}
		
		// Calculate height/width ratio for paddingTop
		// For 16:9 video: 1 / (16/9) = 9/16 = 0.5625 = 56.25%
		// For 4:3 video: 1 / (4/3) = 3/4 = 0.75 = 75%
		const heightToWidthRatio = 1 / aspectRatio;
		
		// Constrain max height for mobile (minMobileAspectRatio is width/height, so 1/minMobileAspectRatio is height/width)
		const maxHeightRatio = minMobileAspectRatio ? (1 / minMobileAspectRatio) : (9 / 16); // Default to 16:9 max
		
		// Use the smaller ratio to constrain height
		const ratio = Platform.OS === 'ios' || Platform.OS === 'android'
			? Math.min(heightToWidthRatio, maxHeightRatio)
			: Math.min(heightToWidthRatio, 1); // 1:1 bounding box for web
		
		const percentage = ratio * 100;
		
		// Debug log
		console.log('📐 ConstrainedVideo calculation:', {
			aspectRatio,
			heightToWidthRatio,
			maxHeightRatio,
			ratio,
			percentage,
			minMobileAspectRatio,
		});
		
		// Ensure percentage is valid
		if (!isFinite(percentage) || percentage <= 0 || percentage > 100) {
			console.warn('⚠️ ConstrainedVideo: Invalid percentage, using default');
			const defaultRatio = (1 / (16 / 9)) * 100;
			return defaultRatio;
		}
		
		return percentage;
	}, [aspectRatio, minMobileAspectRatio]);

	// Debug: Log ConstrainedVideo render
	console.log('📐 ConstrainedVideo RENDERING:', {
		aspectRatio,
		outerAspectRatio,
		paddingTop: `${outerAspectRatio}%`,
	});

	return (
		<View style={[styles.constrainedContainer, { minHeight: 200 }]}>
			<View style={[styles.constrainedWrapper, { paddingTop: `${outerAspectRatio}%`, minHeight: 200 }]}>
				<View style={[styles.constrainedInner, { 
					aspectRatio: aspectRatio || 16 / 9,
					width: '100%',
					height: '100%',
				}]}>
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
	const [isMuted, setIsMuted] = useState(false); // Track mute state
	const [videoProgress, setVideoProgress] = useState({ position: 0, duration: 0 }); // Track video progress
	const [isPaused, setIsPaused] = useState(true); // Track pause state for tap-to-play

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

	// Update overlay visibility - show overlay when video is not playing (social-app-main style)
	useEffect(() => {
		// Show overlay when:
		// 1. Video is not playing
		// 2. Video is loading
		// 3. Video is paused
		// 4. Video is pending
		// 5. Video is not active
		// Hide overlay only when video is actively playing
		const shouldShowOverlay = !isPlaying || 
		                          isLoading || 
		                          status === 'paused' || 
		                          status === 'pending' ||
		                          !isActive;
		setShowOverlay(shouldShowOverlay);
	}, [isPlaying, isActive, isLoading, status, postId, thumbnailUrl]);

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
				// Fallback: Use default aspect ratio if dimensions are invalid
				if (!metadata) {
					const fallbackMetadata: MediaMetadata = {
						width: 1920,
						height: 1080,
						aspectRatio: providedAspectRatio || 16 / 9,
						type: 'video',
					};
					setMetadata(fallbackMetadata);
					const calculatedDimensions = calculateDisplayDimensions(fallbackMetadata, screenWidth);
					setDimensions(calculatedDimensions);
				}
			}
		} else {
			// Debug: Log when naturalSize is not available
			if (status.isLoaded && !status.naturalSize) {
				console.warn('⚠️ Video loaded but naturalSize not available:', {
					postId,
					statusKeys: Object.keys(status),
					hasDuration: !!status.durationMillis,
					isPlaying: status.isPlaying,
				});
				// Fallback: Use default aspect ratio when naturalSize is not available
				// This ensures video still renders even without naturalSize
				// ALWAYS set fallback metadata if not exists, even if metadata exists but is invalid
				if (!metadata || !metadata.width || !metadata.height) {
					const fallbackMetadata: MediaMetadata = {
						width: 1920,
						height: 1080,
						aspectRatio: providedAspectRatio || 16 / 9,
						type: 'video',
					};
					setMetadata(fallbackMetadata);
					const calculatedDimensions = calculateDisplayDimensions(fallbackMetadata, screenWidth);
					setDimensions(calculatedDimensions);
					console.log('📐 Using fallback metadata (no naturalSize):', fallbackMetadata);
					
					// Also update isLoading to false so video can display
					setIsLoading(false);
				}
			}
		}
	}, [screenWidth, postId, providedAspectRatio, metadata]);

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
					// Set active immediately when playing starts
					setIsActive(true);
					await currentRef.playAsync();
					setStatus('playing');
					console.log('🎬 Video playback started for post:', postId);
				} else {
					await currentRef.pauseAsync();
					setStatus('paused');
					// Only reset position if not active (user stopped playing)
					if (!isActive) {
						await currentRef.setPositionAsync(0);
					}
				}
			} catch (error) {
				console.warn('Error controlling video playback:', error);
				setStatus('paused');
				setIsActive(false);
			}
		};

		handlePlayback();
	}, [isPlaying, videoRef, isActive, postId]);

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

	// Format time helper
	const formatTime = useCallback((seconds: number): string => {
		if (!isFinite(seconds) || seconds < 0) return '0:00';
		const mins = Math.floor(seconds / 60);
		const secs = Math.floor(seconds % 60);
		return `${mins}:${secs.toString().padStart(2, '0')}`;
	}, []);

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
			hasMetadata: !!metadata,
			hasDimensions: !!dimensions,
		});
	}, [postId, videoUrl, finalVideoUrl, thumbnailUrl, isPlaying, finalAspectRatio, aspectRatio, providedAspectRatio, constrained, metadata, dimensions]);

	// Don't render if no valid video URL
	if (!finalVideoUrl) {
		console.warn('⚠️ PostVideoPlayer: Not rendering - no valid video URL');
		return null;
	}

	// Ensure aspect ratio is valid - always have a valid aspect ratio for rendering
	const safeAspectRatio = (finalAspectRatio > 0 && isFinite(finalAspectRatio)) 
		? finalAspectRatio 
		: (providedAspectRatio && providedAspectRatio > 0 && isFinite(providedAspectRatio))
		? providedAspectRatio
		: 16 / 9; // Final fallback
	
	// Ensure metadata exists - if not, use fallback
	const displayMetadata = metadata || {
		width: 1920,
		height: 1920 / safeAspectRatio,
		aspectRatio: safeAspectRatio,
		type: 'video' as const,
	};
	
	// Ensure dimensions exist
	const displayDimensions = dimensions || calculateDisplayDimensions(displayMetadata, screenWidth);
	

	// Debug: Log final rendering state
	console.log('🎬 PostVideoPlayer final render state:', {
		postId,
		finalVideoUrl: finalVideoUrl.substring(0, 50) + '...',
		safeAspectRatio,
		hasMetadata: !!metadata,
		hasDimensions: !!dimensions,
		displayMetadata,
		displayDimensions,
		showOverlay,
		isPlaying,
		isActive,
		status,
	});

	// Debug: Log before rendering
	console.log('🎬 PostVideoPlayer RENDERING:', {
		postId,
		finalVideoUrl: finalVideoUrl ? finalVideoUrl.substring(0, 60) + '...' : 'MISSING',
		safeAspectRatio,
		hasMetadata: !!metadata,
		hasDimensions: !!dimensions,
		showOverlay,
	});

	return (
		<View style={[styles.container, { backgroundColor: '#000000', minHeight: 200 }]}>
			<ConstrainedVideo
				aspectRatio={safeAspectRatio}
				minMobileAspectRatio={14 / 9} // slightly smaller max height than images
			>
				<View style={[styles.videoWrapper, { backgroundColor: '#000000', minHeight: 200 }]}>
					<Video
						ref={videoRef}
						source={{ uri: finalVideoUrl }}
						style={[styles.video, { 
							backgroundColor: '#000000', 
							width: '100%',
							height: '100%',
						}]}
						resizeMode={ResizeMode.COVER} // Use COVER to fill container, container aspect ratio matches video
						shouldPlay={isPlaying && isActive && !isPaused}
						useNativeControls={false}
						isMuted={isMuted}
						isLooping={false}
						posterSource={thumbnailUrl ? { uri: getImageURL(thumbnailUrl) } : undefined}
						usePoster={!!thumbnailUrl}
						progressUpdateIntervalMillis={100} // Update more frequently for smoother progress bar
						onLoadStart={() => {
							console.log('🎬 Video load start:', postId, finalVideoUrl.substring(0, 50));
							setIsLoading(true);
						}}
						onError={(error) => {
							console.error('❌ Video error:', error);
							setIsLoading(false);
							setStatus('paused');
						}}
						onLoad={async () => {
							const currentRef = videoRef?.current;
							if (currentRef) {
								try {
									// Don't wait too long - video should display immediately
									await new Promise(resolve => setTimeout(resolve, 100));
									const status = await currentRef.getStatusAsync();
									console.log('🎬 Video onLoad status:', {
										postId,
										isLoaded: status.isLoaded,
										hasNaturalSize: !!status.naturalSize,
										duration: status.durationMillis,
									});
									updateVideoMetadata(status);
									setIsLoading(false);
									
									// Always set position to 0 when loaded to show first frame
									try {
										await currentRef.setPositionAsync(0);
										// Force video to show first frame even when paused
										// This ensures video is visible even when not playing
										console.log('🎬 Video position set to 0 for post:', postId);
									} catch (posError) {
										console.warn('⚠️ Error setting video position:', posError);
									}
								} catch (error) {
									console.warn('Error getting video size in onLoad:', error);
									setIsLoading(false);
									// Even on error, ensure we have fallback metadata
									if (!metadata) {
										const fallbackMetadata: MediaMetadata = {
											width: 1920,
											height: 1080,
											aspectRatio: providedAspectRatio || 16 / 9,
											type: 'video',
										};
										setMetadata(fallbackMetadata);
										const calculatedDimensions = calculateDisplayDimensions(fallbackMetadata, screenWidth);
										setDimensions(calculatedDimensions);
									}
								}
							}
						}}
						onReadyForDisplay={() => {
							console.log('🎬 Video ready for display:', postId);
							const currentRef = videoRef?.current;
							if (currentRef) {
								setTimeout(async () => {
									try {
										const status = await currentRef.getStatusAsync();
										console.log('🎬 Video onReadyForDisplay status:', {
											postId,
											isLoaded: status.isLoaded,
											hasNaturalSize: !!status.naturalSize,
										});
										updateVideoMetadata(status);
										setIsLoading(false);
									} catch (error) {
										console.warn('Error getting video size in onReadyForDisplay:', error);
										setIsLoading(false);
										// Ensure fallback metadata exists
										if (!metadata) {
											const fallbackMetadata: MediaMetadata = {
												width: 1920,
												height: 1080,
												aspectRatio: providedAspectRatio || 16 / 9,
												type: 'video',
											};
											setMetadata(fallbackMetadata);
											const calculatedDimensions = calculateDisplayDimensions(fallbackMetadata, screenWidth);
											setDimensions(calculatedDimensions);
										}
									}
								}, 100);
							}
						}}
						onPlaybackStatusUpdate={(status) => {
							updateVideoMetadata(status);
							
							if (status.isLoaded) {
								// Update video progress
								setVideoProgress({
									position: status.positionMillis / 1000, // Convert to seconds
									duration: status.durationMillis ? status.durationMillis / 1000 : 0,
								});
								
								if (status.isPlaying) {
									setStatus('playing');
									setIsLoading(false);
									setIsActive(true); // Ensure active when playing
									setIsPaused(false);
									console.log('🎬 Video is playing for post:', postId);
								} else if (status.didJustFinish) {
									setStatus('paused');
									setIsActive(false);
									setIsPaused(true);
									// Reset video position when finished
									const currentRef = videoRef?.current;
									if (currentRef) {
										currentRef.setPositionAsync(0).catch((error) => {
											console.warn('⚠️ Error resetting video position:', error);
										});
									}
								} else if (status.error) {
									console.error('Video playback error:', status.error);
									setStatus('paused');
									setIsActive(false);
									setIsPaused(true);
								} else if (!status.isPlaying && status.positionMillis > 0) {
									// Video is paused but has position (user paused it)
									setStatus('paused');
									setIsPaused(true);
									// Keep isActive true so overlay doesn't show
									setIsActive(true);
								}
							}
							
							if (onPlaybackStatusUpdate) {
								onPlaybackStatusUpdate(status);
							}
						}}
					/>

					{/* Tap overlay for play/pause - only when overlay is shown */}
					{showOverlay && (
						<TouchableOpacity
							style={styles.tapOverlay}
							activeOpacity={1}
							onPress={async () => {
								const currentRef = videoRef?.current;
								if (!currentRef) {
									// If video not loaded, use onPress to navigate
									onPress();
									return;
								}
								
								try {
									const status = await currentRef.getStatusAsync();
									if (status.isLoaded) {
										if (status.isPlaying) {
											// Pause video
											await currentRef.pauseAsync();
											setIsPaused(true);
											setStatus('paused');
										} else {
											// Play video
											await currentRef.playAsync();
											setIsPaused(false);
											setStatus('playing');
											setIsActive(true);
										}
									} else {
										// Video not loaded, use onPress
										onPress();
									}
								} catch (error) {
									console.warn('Error toggling playback:', error);
									onPress();
								}
							}}
						/>
					)}

					{/* Thumbnail overlay - chỉ hiển thị khi video chưa play và có thumbnail */}
					{thumbnailUrl && showOverlay && !isPlaying && (
						<ImageBackground
							source={{ uri: getImageURL(thumbnailUrl) }}
							style={[
								styles.thumbnailOverlay,
								{
									opacity: showOverlay ? 1 : 0,
									backgroundColor: 'rgba(0, 0, 0, 0.2)', // Less opaque so video can show through
								},
							]}
							cachePolicy="memory-disk"
							pointerEvents={showOverlay ? 'auto' : 'none'}
						>
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
						</ImageBackground>
					)}

					{/* Fallback play button nếu không có thumbnail - chỉ hiển thị khi video chưa play */}
					{!thumbnailUrl && showOverlay && !isPlaying && (
						<View style={[styles.thumbnailOverlay, { backgroundColor: 'rgba(0, 0, 0, 0.3)' }]}>
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

					{/* Social-app-main style controls - only show when video is playing (not paused) */}
					{isActive && isPlaying && !showOverlay && (
						<>
							{/* Play/Pause button - bottom left */}
							<TouchableOpacity
								style={styles.controlButtonLeft}
								onPress={async () => {
									const currentRef = videoRef?.current;
									if (!currentRef) return;
									
									try {
										const status = await currentRef.getStatusAsync();
										if (status.isLoaded) {
											if (status.isPlaying) {
												await currentRef.pauseAsync();
												setIsPaused(true);
												setStatus('paused');
											} else {
												await currentRef.playAsync();
												setIsPaused(false);
												setStatus('playing');
											}
										}
									} catch (error) {
										console.warn('Error toggling playback:', error);
									}
								}}
								activeOpacity={0.7}
							>
								<View style={styles.controlButtonInner}>
									<MaterialCommunityIcons
										name="pause"
										size={13}
										color="#FFFFFF"
									/>
								</View>
							</TouchableOpacity>

							{/* Time indicator - next to play button */}
							{videoProgress.duration > 0 && (
								<View style={styles.timeIndicator} pointerEvents="none">
									<Text style={styles.timeIndicatorText}>
										{formatTime(videoProgress.duration - videoProgress.position)}
									</Text>
								</View>
							)}

							{/* Mute button - bottom right */}
							<TouchableOpacity
								style={styles.controlButtonRight}
								onPress={() => {
									setIsMuted(!isMuted);
									// Update video mute state immediately
									const currentRef = videoRef?.current;
									if (currentRef) {
										currentRef.setIsMutedAsync(!isMuted).catch((error) => {
											console.warn('⚠️ Error toggling mute:', error);
										});
									}
								}}
								activeOpacity={0.7}
							>
								<View style={styles.controlButtonInner}>
									<MaterialCommunityIcons
										name={isMuted ? 'volume-off' : 'volume-high'}
										size={13}
										color="#FFFFFF"
									/>
								</View>
							</TouchableOpacity>
						</>
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
		minHeight: 200, // Ensure minimum height
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
	tapOverlay: {
		position: 'absolute',
		top: 0,
		left: 0,
		right: 0,
		bottom: 0,
		zIndex: 5,
	},
	speakerButton: {
		position: 'absolute',
		bottom: 12,
		right: 12,
		zIndex: 10,
	},
	speakerButtonBackground: {
		width: 36,
		height: 36,
		borderRadius: 18,
		backgroundColor: 'rgba(0, 0, 0, 0.6)',
		justifyContent: 'center',
		alignItems: 'center',
		shadowColor: '#000',
		shadowOffset: {
			width: 0,
			height: 2,
		},
		shadowOpacity: 0.25,
		shadowRadius: 3.84,
		elevation: 5,
	},
	// Social-app-main style controls
	controlButtonLeft: {
		position: 'absolute',
		left: 6,
		bottom: 6,
		zIndex: 10,
	},
	controlButtonRight: {
		position: 'absolute',
		right: 6,
		bottom: 6,
		zIndex: 10,
	},
	controlButtonInner: {
		backgroundColor: 'rgba(0, 0, 0, 0.5)',
		borderRadius: 9999,
		paddingHorizontal: 4,
		paddingVertical: 4,
		minHeight: 21,
		minWidth: 21,
		justifyContent: 'center',
		alignItems: 'center',
	},
	timeIndicator: {
		position: 'absolute',
		left: 33, // Next to play button
		bottom: 6,
		backgroundColor: 'rgba(0, 0, 0, 0.5)',
		borderRadius: 6,
		paddingHorizontal: 6,
		paddingVertical: 3,
		minHeight: 21,
		justifyContent: 'center',
		zIndex: 10,
	},
	timeIndicatorText: {
		color: '#FFFFFF',
		fontSize: 12,
		fontWeight: '600',
		lineHeight: 15,
	},
});

export default PostVideoPlayer;
