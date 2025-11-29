import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text, Avatar, useTheme } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { getInitials } from '../../utils/nameUtils';
import { getAvatarURL } from '../../utils/imageUtils';
import { parseTextWithUrls } from '../../utils/textUtils';
import { VerifiedBadge } from '../Common/VerifiedBadge';

interface CommentItemProps {
  comment: {
    id: string;
    author: {
      id: string;
      username: string;
      full_name: string;
      avatar_url?: string;
      is_verified?: boolean;
    };
    content: string;
    created_at: string;
  };
  onPressReply?: () => void;
  onPressLike?: () => void;
}

/**
 * CommentItem - Component hiển thị bình luận
 * Layout giống social-app-main:
 * - Avatar bên trái (size 42)
 * - Content bên phải với PostMeta style (tên + handle + thời gian trên 1 dòng)
 * - RichText với link parsing
 * - PostControls style (like, reply)
 */
const CommentItem: React.FC<CommentItemProps> = ({ 
  comment,
  onPressReply,
  onPressLike,
}) => {
  const theme = useTheme();
  const { colors } = theme;

  // Format time ago
  const formatTimeAgo = (date: Date): string => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    const weeks = Math.floor(days / 7);
    const months = Math.floor(days / 30);
    const years = Math.floor(days / 365);

    if (years > 0) return `${years} năm trước`;
    if (months > 0) return `${months} tháng trước`;
    if (weeks > 0) return `${weeks} tuần trước`;
    if (days > 0) return `${days} ngày trước`;
    if (hours > 0) return `${hours} giờ trước`;
    if (minutes > 0) return `${minutes} phút trước`;
    return 'Vừa xong';
  };

  const createdAt = new Date(comment.created_at);
  const timeAgo = formatTimeAgo(createdAt);
  const displayName = comment.author.full_name || comment.author.username;
  const handle = comment.author.username ? `@${comment.author.username}` : '';

  // Parse text with URLs
  const renderTextWithLinks = () => {
    const parts = parseTextWithUrls(comment.content);
    
    return (
      <Text style={[styles.commentText, { color: colors.onBackground }]}>
        {parts.map((part, index) => {
          if (part.type === 'url' && part.url) {
            return (
              <Text
                key={index}
                style={[
                  styles.commentText,
                  {
                    color: colors.primary || '#1877F2',
                    fontWeight: '600',
                  },
                ]}
                onPress={() => {
                  // Handle link press
                  console.log('Open URL:', part.url);
                }}>
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
    <View style={[styles.container, { borderBottomColor: colors.border }]}>
      <View style={styles.layout}>
        {/* Avatar - giống social-app-main layoutAvi */}
        <View style={styles.layoutAvi}>
          {comment.author.avatar_url ? (
            <Avatar.Image
              size={42}
              source={{ uri: getAvatarURL(comment.author.avatar_url) }}
            />
          ) : (
            <Avatar.Text
              size={42}
              label={getInitials(displayName)}
            />
          )}
        </View>

        {/* Content - giống social-app-main layoutContent */}
        <View style={styles.layoutContent}>
          {/* PostMeta style - tên + handle + thời gian trên 1 dòng */}
          <View style={styles.metaContainer}>
            <View style={styles.metaRow}>
              <Text
                style={[styles.authorName, { color: colors.onBackground }]}
                numberOfLines={1}>
                {displayName}
              </Text>
              {/* Verified badge */}
              {comment.author.is_verified && (
                <VerifiedBadge size={14} />
              )}
              {handle && (
                <Text
                  style={[styles.handle, { color: colors.onSurfaceVariant }]}
                  numberOfLines={1}>
                  {' '}{handle}
                </Text>
              )}
              <Text
                style={[styles.time, { color: colors.onSurfaceVariant }]}>
                {' · '}{timeAgo}
              </Text>
            </View>
          </View>

          {/* Comment Text - RichText style */}
          <View style={styles.textContainer}>
            {renderTextWithLinks()}
          </View>

          {/* PostControls style - Like, Reply */}
          <View style={styles.controlsContainer}>
            <TouchableOpacity
              style={styles.controlButton}
              onPress={onPressLike}
              activeOpacity={0.7}>
              <MaterialCommunityIcons
                name="heart-outline"
                size={16}
                color={colors.onSurfaceVariant}
              />
              <Text style={[styles.controlText, { color: colors.onSurfaceVariant }]}>
                Thích
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.controlButton}
              onPress={onPressReply}
              activeOpacity={0.7}>
              <MaterialCommunityIcons
                name="reply-outline"
                size={16}
                color={colors.onSurfaceVariant}
              />
              <Text style={[styles.controlText, { color: colors.onSurfaceVariant }]}>
                Trả lời
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingTop: 10,
    paddingRight: 15,
    paddingBottom: 5,
    paddingLeft: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  layout: {
    flexDirection: 'row',
    gap: 10, // Giống social-app-main gap: 10
  },
  layoutAvi: {
    paddingLeft: 8, // Giống social-app-main paddingLeft: 8
  },
  layoutContent: {
    flex: 1, // Giống social-app-main flex: 1
  },
  metaContainer: {
    marginBottom: 4,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  authorName: {
    fontSize: 15, // text_md
    fontWeight: '600', // font_semi_bold
    lineHeight: 20,
  },
  handle: {
    fontSize: 15, // text_md
    lineHeight: 20,
    flexShrink: 10,
  },
  time: {
    fontSize: 15, // text_md
    lineHeight: 20,
  },
  textContainer: {
    marginTop: 2,
    marginBottom: 4,
  },
  commentText: {
    fontSize: 15, // text_md
    lineHeight: 20,
  },
  controlsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginTop: 4,
  },
  controlButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 4,
  },
  controlText: {
    fontSize: 13,
    fontWeight: '600',
  },
});

export default CommentItem;
