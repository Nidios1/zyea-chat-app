import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { PostControlButton, PostControlButtonIcon, PostControlButtonText } from './PostControlButton';
import { AnimatedLikeIcon } from './AnimatedLikeIcon';
import { CountWheel } from './CountWheel';

interface PostControlsProps {
  post: {
    id: string | number;
    isLiked?: boolean;
    likes_count?: number;
    comments_count?: number;
    reposts_count?: number;
    isReposted?: boolean;
  };
  onPressLike?: () => void;
  onPressReply?: () => void;
  onPressRepost?: () => void;
  onPressShare?: () => void;
  big?: boolean;
  style?: any;
}

export function PostControls({
  post,
  onPressLike,
  onPressReply,
  onPressRepost,
  onPressShare,
  big,
  style,
}: PostControlsProps) {
  const { colors, isDarkMode } = useTheme();
  const [hasLikeIconBeenToggled, setHasLikeIconBeenToggled] = useState(false);

  const handleLike = () => {
    setHasLikeIconBeenToggled(true);
    onPressLike?.();
  };

  const formatPostStatCount = (count: number): string => {
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M`;
    }
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`;
    }
    return count.toString();
  };

  return (
    <View
      style={[
        styles.container,
        {
          paddingTop: big ? 0 : 4, // pt_2xs when not big
          gap: 16, // gap_md
        },
        style,
      ]}>
      {/* Left side: Reply, Repost, Like */}
      <View style={[styles.leftContainer, { maxWidth: 320 }]}>
        {/* Reply Button */}
        <View
          style={[
            styles.buttonContainer,
            {
              flex: 1,
              alignItems: 'flex-start',
              marginLeft: big ? -2 : -6,
            },
          ]}>
          <PostControlButton
            testID="replyBtn"
            onPress={onPressReply}
            big={big}
            label={`Reply (${post.comments_count || 0})`}>
            <PostControlButtonIcon icon="comment-outline" />
            {typeof post.comments_count !== 'undefined' && post.comments_count > 0 && (
              <PostControlButtonText>
                {formatPostStatCount(post.comments_count)}
              </PostControlButtonText>
            )}
          </PostControlButton>
        </View>

        {/* Repost Button */}
        <View style={[styles.buttonContainer, { flex: 1, alignItems: 'flex-start' }]}>
          <PostControlButton
            testID="repostBtn"
            onPress={onPressRepost}
            active={post.isReposted}
            activeColor={colors.primary || '#1877F2'}
            big={big}
            label={`Repost (${post.reposts_count || 0})`}>
            <PostControlButtonIcon icon="repeat" />
            {typeof post.reposts_count !== 'undefined' && post.reposts_count > 0 && (
              <PostControlButtonText>
                {formatPostStatCount(post.reposts_count)}
              </PostControlButtonText>
            )}
          </PostControlButton>
        </View>

        {/* Like Button */}
        <View style={[styles.buttonContainer, { flex: 1, alignItems: 'flex-start' }]}>
          <PostControlButton
            testID="likeBtn"
            onPress={handleLike}
            big={big}
            label={`Like (${post.likes_count || 0})`}>
            <AnimatedLikeIcon
              isLiked={Boolean(post.isLiked)}
              big={big}
              hasBeenToggled={hasLikeIconBeenToggled}
            />
            <CountWheel
              likeCount={post.likes_count || 0}
              big={big}
              isLiked={Boolean(post.isLiked)}
              hasBeenToggled={hasLikeIconBeenToggled}
            />
          </PostControlButton>
        </View>

        {/* Spacer */}
        <View />
      </View>

      {/* Right side: Share, Menu */}
      <View style={[styles.rightContainer, { gap: 4 }]}>
        <PostControlButton
          testID="shareBtn"
          onPress={onPressShare}
          big={big}
          label="Share">
          <PostControlButtonIcon icon="share-outline" />
        </PostControlButton>
        <PostControlButton
          testID="menuBtn"
          big={big}
          label="More options">
          <PostControlButtonIcon icon="dots-horizontal" />
        </PostControlButton>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  leftContainer: {
    flexDirection: 'row',
    flex: 1,
  },
  rightContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  buttonContainer: {
    // Container for each button
  },
});

