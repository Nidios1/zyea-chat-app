import React, { useState, useRef, useEffect } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { Video, ResizeMode, AVPlaybackStatus } from 'expo-av';
import { Image } from 'expo-image';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Text } from 'react-native-paper';
import { getVideoURL, getImageURL } from '../../utils/imageUtils';

interface VideoThumbnailProps {
  videoUrl: string;
  thumbnailUrl?: string;
  style?: any;
  onThumbnailReady?: (thumbnailUri: string) => void;
}

const VideoThumbnail: React.FC<VideoThumbnailProps> = ({
  videoUrl,
  thumbnailUrl,
  style,
  onThumbnailReady,
}) => {
  const [thumbnailUri, setThumbnailUri] = useState<string | null>(thumbnailUrl || null);
  const [isLoading, setIsLoading] = useState(!thumbnailUrl);
  const videoRef = useRef<Video>(null);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    // If we already have a thumbnail, use it
    if (thumbnailUrl) {
      setThumbnailUri(thumbnailUrl);
      setIsLoading(false);
      return;
    }

    // Otherwise, try to extract from video
    if (videoUrl) {
      extractThumbnail();
    }
  }, [videoUrl, thumbnailUrl]);

  const extractThumbnail = async () => {
    try {
      setIsLoading(true);
      setHasError(false);

      // Load video and seek to first frame
      if (videoRef.current) {
        const fullVideoUrl = getVideoURL(videoUrl);
        
        // Set source and wait for video to be ready
        await videoRef.current.loadAsync(
          { uri: fullVideoUrl },
          { shouldPlay: false, positionMillis: 0 }
        );

        // Wait a bit for video to load
        await new Promise(resolve => setTimeout(resolve, 500));

        // Get status to check if video is loaded
        const status = await videoRef.current.getStatusAsync();
        
        if (status.isLoaded) {
          // Seek to 0.1 seconds to get a frame (avoid black screen at 0)
          await videoRef.current.setPositionAsync(100);
          
          // Wait for frame to be ready
          await new Promise(resolve => setTimeout(resolve, 300));

          // The video component will automatically show the frame
          // We can use the video itself as thumbnail
          setThumbnailUri(fullVideoUrl);
          setIsLoading(false);
          
          if (onThumbnailReady) {
            onThumbnailReady(fullVideoUrl);
          }
        }
      }
    } catch (error) {
      console.log('❌ [VideoThumbnail] Error extracting thumbnail:', error);
      setHasError(true);
      setIsLoading(false);
    }
  };

  // If we have a thumbnail URL, show it as image
  if (thumbnailUrl) {
    return (
      <Image
        source={{ uri: getImageURL(thumbnailUrl) }}
        style={[styles.thumbnail, style]}
        contentFit="cover"
        cachePolicy="memory-disk"
        transition={200}
        onError={() => {
          // If thumbnail fails, fallback to video
          setThumbnailUri(null);
        }}
      />
    );
  }

  // If we have video URL but no thumbnail, use video component to show first frame
  if (videoUrl) {
    return (
      <View style={[styles.container, style]}>
        <Video
          ref={videoRef}
          source={{ uri: getVideoURL(videoUrl) }}
          style={[styles.thumbnail, styles.videoThumbnail]}
          resizeMode={ResizeMode.COVER}
          shouldPlay={false}
          isMuted={true}
          isLooping={false}
          usePoster={false}
          onLoadStart={() => {
            // Seek to 0.1s immediately when video starts loading to get a frame
            setTimeout(async () => {
              try {
                if (videoRef.current) {
                  await videoRef.current.setPositionAsync(100);
                }
              } catch (error) {
                // Ignore seek errors
              }
            }, 100);
          }}
          onLoad={() => {
            setIsLoading(false);
          }}
          onError={(error) => {
            console.log('❌ [VideoThumbnail] Video load error:', error);
            setHasError(true);
            setIsLoading(false);
          }}
        />
        {isLoading && (
          <View style={styles.loadingOverlay}>
            <MaterialCommunityIcons name="video" size={24} color="rgba(255, 255, 255, 0.5)" />
          </View>
        )}
        {hasError && (
          <View style={styles.errorOverlay}>
            <MaterialCommunityIcons name="video-off" size={24} color="rgba(255, 255, 255, 0.5)" />
          </View>
        )}
      </View>
    );
  }

  // Fallback placeholder
  return (
    <View style={[styles.thumbnail, styles.placeholder, style]}>
      <MaterialCommunityIcons name="play-circle" size={48} color="rgba(255, 255, 255, 0.6)" />
      <Text style={styles.placeholderText}>Video</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  thumbnail: {
    width: '100%',
    height: '100%',
  },
  videoThumbnail: {
    backgroundColor: '#000000',
  },
  placeholder: {
    backgroundColor: '#1A1A1A',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  placeholderText: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 12,
    fontWeight: '500',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default VideoThumbnail;

