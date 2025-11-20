import React, { memo } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text, Avatar } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { PWATheme } from '../../config/PWATheme';
import { getInitials, getAvatarURL } from '../../utils/imageUtils';
import { parseTextWithUrls } from '../../utils/textUtils';
import { Linking } from 'react-native';

// Constants giống social-app-main
const LINEAR_AVI_WIDTH = 42;
const REPLY_LINE_WIDTH = 2;
const OUTER_SPACE = 16;

interface CommentItemProps {
  comment: any;
  depth?: number;
  showParentReplyLine?: boolean;
  showChildReplyLine?: boolean;
  onReply?: (comment: any) => void;
  onLike?: (comment: any) => void;
  formatTimeAgo: (date: Date) => string;
}

const CommentItem = memo(({
  comment,
  depth = 0,
  showParentReplyLine = false,
  showChildReplyLine = false,
  onReply,
  onLike,
  formatTimeAgo,
}: CommentItemProps) => {
  const { colors, isDarkMode } = useTheme();
  const styles = createStyles(colors, isDarkMode);

  const authorName = comment?.author?.full_name || comment?.author?.username || 'Người dùng';
  const authorAvatar = comment?.author?.avatar_url;
  const commentDate = comment.created_at ? new Date(comment.created_at) : new Date();
  const isLiked = comment.isLiked || false;
  const likesCount = comment.likes_count || 0;

  // Render text with links
  const renderTextWithLinks = () => {
    const content = comment?.content || '';
    const parts = parseTextWithUrls(content);

    const handleLinkPress = async (url: string) => {
      try {
        let formattedUrl = url.trim();
        if (!formattedUrl.match(/^https?:\/\//i)) {
          formattedUrl = 'https://' + formattedUrl;
        }
        await Linking.openURL(formattedUrl);
      } catch (error) {
        // Silently handle errors
      }
    };

    if (parts.length === 1 && parts[0].type === 'text') {
      return <Text style={styles.commentText}>{content}</Text>;
    }

    return (
      <Text style={styles.commentText}>
        {parts.map((part, index) => {
          if (part.type === 'url' && part.url) {
            return (
              <Text
                key={index}
                style={[styles.commentText, styles.linkText]}
                onPress={() => handleLinkPress(part.url!)}
                suppressHighlighting={true}
              >
                {part.text}
              </Text>
            );
          }
          return <Text key={index}>{part.text}</Text>;
        })}
      </Text>
    );
  };

  return (
    <View style={[
      styles.commentOuterWrapper,
      depth > 0 && { paddingLeft: OUTER_SPACE * (depth + 1) },
    ]}>
      {/* Parent Reply Line */}
      {showParentReplyLine && (
        <View style={[styles.replyLineContainer, { height: 12 }]}>
          <View style={[styles.replyLine, { width: REPLY_LINE_WIDTH }]} />
        </View>
      )}

      <View style={styles.commentContent}>
        <View style={styles.avatarContainer}>
          <TouchableOpacity activeOpacity={0.7}>
            {authorAvatar ? (
              <Avatar.Image
                size={LINEAR_AVI_WIDTH}
                source={{ uri: getAvatarURL(authorAvatar) }}
              />
            ) : (
              <Avatar.Text
                size={LINEAR_AVI_WIDTH}
                label={getInitials(authorName)}
              />
            )}
          </TouchableOpacity>

          {/* Child Reply Line */}
          {(showChildReplyLine || comment.replies?.length > 0) && (
            <View style={[styles.replyLineVertical, { width: REPLY_LINE_WIDTH }]} />
          )}
        </View>

        <View style={styles.commentBody}>
          {/* Comment Meta */}
          <View style={styles.commentHeader}>
            <Text style={styles.commentName}>{authorName}</Text>
            <Text style={styles.commentTime}>· {formatTimeAgo(commentDate)}</Text>
          </View>

          {/* Comment Text */}
          {renderTextWithLinks()}

          {/* Comment Actions */}
          <View style={styles.commentActions}>
            <TouchableOpacity
              style={styles.commentAction}
              onPress={() => onLike?.(comment)}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons
                name={isLiked ? 'thumb-up' : 'thumb-up-outline'}
                size={16}
                color={isLiked ? '#1877F2' : colors.textSecondary}
              />
              {likesCount > 0 && (
                <Text style={styles.commentActionText}>{likesCount}</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.commentAction}
              onPress={() => onReply?.(comment)}
              activeOpacity={0.7}
            >
              <Text style={styles.commentActionText}>Trả lời</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
});

CommentItem.displayName = 'CommentItem';

const createStyles = (colors: typeof PWATheme.light, isDarkMode: boolean) => StyleSheet.create({
  commentOuterWrapper: {
    paddingHorizontal: OUTER_SPACE,
    paddingVertical: OUTER_SPACE / 2,
  },
  replyLineContainer: {
    flexDirection: 'row',
    paddingLeft: LINEAR_AVI_WIDTH / 2 - REPLY_LINE_WIDTH / 2,
    marginBottom: 4,
  },
  replyLine: {
    backgroundColor: colors.border || (isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)'),
    height: '100%',
  },
  commentContent: {
    flexDirection: 'row',
    gap: 12,
  },
  avatarContainer: {
    position: 'relative',
    width: LINEAR_AVI_WIDTH,
    alignItems: 'center',
  },
  replyLineVertical: {
    position: 'absolute',
    top: LINEAR_AVI_WIDTH + 4,
    left: LINEAR_AVI_WIDTH / 2 - REPLY_LINE_WIDTH / 2,
    bottom: -OUTER_SPACE / 2,
    backgroundColor: colors.border || (isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)'),
  },
  commentBody: {
    flex: 1,
  },
  commentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap: 4,
  },
  commentName: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  commentTime: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  commentText: {
    fontSize: 15,
    color: colors.text,
    lineHeight: 20,
    marginBottom: 6,
  },
  linkText: {
    color: '#1877F2',
    fontWeight: '600',
  },
  commentActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginTop: 2,
  },
  commentAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
  },
  commentActionText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
  },
});

export default CommentItem;
