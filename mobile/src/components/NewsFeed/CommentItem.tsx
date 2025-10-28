import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Avatar, useTheme } from 'react-native-paper';
import { getInitials } from '../../utils/nameUtils';
import { getAvatarURL } from '../../utils/imageUtils';

interface CommentItemProps {
  comment: {
    id: string;
    author: {
      id: string;
      username: string;
      full_name: string;
      avatar_url?: string;
    };
    content: string;
    created_at: string;
  };
}

const CommentItem: React.FC<CommentItemProps> = ({ comment }) => {
  const theme = useTheme();

  return (
    <View style={styles.container}>
      {comment.author.avatar_url ? (
        <Avatar.Image
          size={36}
          source={{ uri: getAvatarURL(comment.author.avatar_url) }}
        />
      ) : (
        <Avatar.Text
          size={36}
          label={getInitials(comment.author.full_name || comment.author.username)}
        />
      )}

      <View style={styles.content}>
        <Text style={[styles.authorName, { color: theme.colors.primary }]}>
          {comment.author.full_name || comment.author.username}
        </Text>
        <Text style={[styles.commentText, { color: theme.colors.onBackground }]}>
          {comment.content}
        </Text>
        <Text style={[styles.time, { color: theme.colors.onSurfaceVariant }]}>
          {new Date(comment.created_at).toLocaleString('vi', {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    padding: 12,
    marginBottom: 8,
  },
  content: {
    flex: 1,
    marginLeft: 12,
  },
  authorName: {
    fontWeight: '600',
    fontSize: 14,
    marginBottom: 4,
  },
  commentText: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 4,
  },
  time: {
    fontSize: 12,
  },
});

export default CommentItem;

