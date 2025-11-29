import React from 'react';
import { View, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Text } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { getImageURL, getAvatarURL } from '../../utils/imageUtils';
import { useTheme } from '../../contexts/ThemeContext';
import VideoThumbnail from './VideoThumbnail';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = (SCREEN_WIDTH - 24) / 2; // 2 columns with 8px gap on each side + 8px between

interface VideoPostCardProps {
  post: any;
  onPress?: () => void;
}

export const VideoPostCard: React.FC<VideoPostCardProps> = ({ post, onPress }) => {
  const { colors, isDarkMode } = useTheme();
  const navigation = useNavigation();

  // Get video URL first
  const videoUrl = post.videoUrl || post.video_url || post.video;
  
  // Get video thumbnail - try multiple sources
  // Priority: thumbnailUrl > thumbnail_url > video_thumbnail > first image > image_url
  let thumbnail = post.thumbnailUrl || 
                  post.thumbnail_url || 
                  post.video_thumbnail;
  
  // If no explicit thumbnail, try to use first image from images array
  if (!thumbnail && post.images && Array.isArray(post.images) && post.images.length > 0) {
    thumbnail = post.images[0];
  }
  
  // Fallback to image_url if still no thumbnail
  if (!thumbnail && post.image_url) {
    thumbnail = post.image_url;
  }
  
  // Debug log to check what data we have
  if (__DEV__ && !thumbnail && videoUrl) {
    console.log('⚠️ [VideoPostCard] No thumbnail found for video post:', {
      postId: post.id,
      hasVideoUrl: !!videoUrl,
      hasThumbnailUrl: !!post.thumbnailUrl,
      hasThumbnail_url: !!post.thumbnail_url,
      hasVideo_thumbnail: !!post.video_thumbnail,
      hasImages: !!(post.images && post.images.length > 0),
      hasImage_url: !!post.image_url,
      imagesCount: post.images ? post.images.length : 0,
    });
  }

  // Get author info
  const authorName = post.full_name || post.username || post.user?.full_name || post.user?.username || 'Unknown';
  const authorAvatar = post.avatar_url || post.user?.avatar_url || '';
  const authorHandle = post.username || post.handle || post.user?.username || 'user';

  // Get stats
  const likes = post.likes_count || post.likes || 0;
  const comments = post.comments_count || post.comments || 0;

  const handlePress = () => {
    if (onPress) {
      onPress();
    } else {
      // Navigate to video feed or video detail
      navigation.navigate('VideoFeed' as never, {
        initialPostId: post.id,
      } as never);
    }
  };

  const formatCount = (count: number): string => {
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M`;
    } else if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`;
    }
    return count.toString();
  };

  return (
    <TouchableOpacity
      style={[styles.container, { backgroundColor: colors.surface || '#1A1F2E' }]}
      onPress={handlePress}
      activeOpacity={0.9}
    >
      {/* Video Thumbnail */}
      <View style={[styles.thumbnailContainer, { backgroundColor: '#000000' }]}>
        {videoUrl ? (
          <VideoThumbnail
            videoUrl={videoUrl}
            thumbnailUrl={thumbnail ? getImageURL(thumbnail) : undefined}
            style={styles.thumbnail}
          />
        ) : thumbnail ? (
          <Image
            source={{ uri: getImageURL(thumbnail) }}
            style={styles.thumbnail}
            contentFit="cover"
            cachePolicy="memory-disk"
            placeholderContentFit="cover"
            transition={200}
            onError={(error) => {
              console.log('❌ [VideoPostCard] Failed to load thumbnail:', {
                postId: post.id,
                thumbnail,
                error,
              });
            }}
          />
        ) : (
          <View style={[styles.thumbnail, styles.thumbnailPlaceholder]}>
            <MaterialCommunityIcons name="play-circle" size={48} color="rgba(255, 255, 255, 0.6)" />
            <Text style={styles.placeholderText}>Video</Text>
          </View>
        )}

        {/* Play Button Overlay */}
        <View style={styles.playButtonOverlay}>
          <View style={styles.playButton}>
            <MaterialCommunityIcons name="play" size={20} color="#FFFFFF" />
          </View>
        </View>

        {/* Bottom Gradient with Stats */}
        <LinearGradient
          colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.7)']}
          style={styles.bottomGradient}
        >
          <View style={styles.statsContainer}>
            {likes > 0 && (
              <View style={styles.statItem}>
                <MaterialCommunityIcons name="heart" size={14} color="#FFFFFF" />
                <Text style={styles.statText}>{formatCount(likes)}</Text>
              </View>
            )}
            {comments > 0 && (
              <View style={styles.statItem}>
                <MaterialCommunityIcons name="comment-outline" size={14} color="#FFFFFF" />
                <Text style={styles.statText}>{formatCount(comments)}</Text>
              </View>
            )}
          </View>
        </LinearGradient>
      </View>

      {/* Text Content */}
      <View style={styles.textContainer}>
        {/* Caption - max 2 lines */}
        {post.content && (
          <Text 
            style={[styles.caption, { color: colors.text || '#FFFFFF' }]} 
            numberOfLines={2}
          >
            {post.content}
          </Text>
        )}

        {/* Author Info */}
        <View style={styles.authorRow}>
          {authorAvatar ? (
            <Image
              source={{ uri: getAvatarURL(authorAvatar) }}
              style={styles.authorAvatar}
              contentFit="cover"
            />
          ) : (
            <View style={[styles.authorAvatar, styles.authorAvatarPlaceholder]}>
              <Text style={styles.authorInitial}>
                {authorName.charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
          <Text 
            style={[styles.authorHandle, { color: colors.textSecondary || '#9CA3AF' }]} 
            numberOfLines={1}
          >
            @{authorHandle}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    width: CARD_WIDTH,
    marginBottom: 16,
    borderRadius: 12,
    overflow: 'hidden',
  },
  thumbnailContainer: {
    width: '100%',
    aspectRatio: 9 / 16, // Vertical video aspect ratio
    position: 'relative',
    borderRadius: 12,
    overflow: 'hidden',
  },
  thumbnail: {
    width: '100%',
    height: '100%',
  },
  thumbnailPlaceholder: {
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
  playButtonOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 60,
    justifyContent: 'flex-end',
    paddingBottom: 8,
    paddingHorizontal: 8,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  textContainer: {
    padding: 8,
    gap: 6,
  },
  caption: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '400',
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  authorAvatar: {
    width: 20,
    height: 20,
    borderRadius: 10,
  },
  authorAvatarPlaceholder: {
    backgroundColor: '#4A5568',
    justifyContent: 'center',
    alignItems: 'center',
  },
  authorInitial: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '600',
  },
  authorHandle: {
    fontSize: 12,
    flex: 1,
  },
});

export default VideoPostCard;

