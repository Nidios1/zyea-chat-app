import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, FlatList, Image } from 'react-native';
import { Text, Card, Button, Avatar, useTheme, TextInput, Appbar } from 'react-native-paper';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { newsfeedAPI } from '../../utils/api';
import { getInitials } from '../../utils/nameUtils';
import CommentItem from '../../components/NewsFeed/CommentItem';
import Toast from 'react-native-toast-message';

interface PostDetailScreenProps {
  route: {
    params: {
      postId: string;
    };
  };
}

const PostDetailScreen: React.FC<PostDetailScreenProps> = ({ route }) => {
  const { postId } = route.params;
  const theme = useTheme();
  const [commentText, setCommentText] = useState('');
  const queryClient = useQueryClient();

  const { data: post } = useQuery({
    queryKey: ['post', postId],
    queryFn: () => newsfeedAPI.getPost(postId).then((res) => res.data),
  });

  const { data: comments = [] } = useQuery({
    queryKey: ['postComments', postId],
    queryFn: () => newsfeedAPI.getPostComments(postId).then((res) => res.data),
  });

  const commentMutation = useMutation({
    mutationFn: (content: string) => newsfeedAPI.commentPost(postId, content),
    onSuccess: () => {
      Toast.show({ type: 'success', text1: 'Đã bình luận' });
      setCommentText('');
      queryClient.invalidateQueries({ queryKey: ['postComments', postId] });
    },
  });

  const handleComment = () => {
    if (!commentText.trim()) return;
    commentMutation.mutate(commentText);
  };

  if (!post) {
    return (
      <View style={styles.center}>
        <Text>Đang tải...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <Appbar.Header>
        <Appbar.BackAction />
        <Appbar.Content title="Bài viết" />
      </Appbar.Header>

      <ScrollView style={styles.scrollView}>
        <Card style={styles.postCard}>
          <Card.Content>
            <View style={styles.postHeader}>
              <Avatar.Text
                size={40}
                label={getInitials(post.author.full_name || post.author.username)}
              />
              <View style={styles.authorInfo}>
                <Text style={styles.authorName}>
                  {post.author.full_name || post.author.username}
                </Text>
                <Text style={styles.postTime}>
                  {new Date(post.created_at).toLocaleDateString('vi')}
                </Text>
              </View>
            </View>

            {post.content && (
              <Text style={styles.postContent}>{post.content}</Text>
            )}

            {post.images && post.images.length > 0 && (
              <View style={styles.imagesContainer}>
                {post.images.map((image: string, index: number) => (
                  <Image
                    key={index}
                    source={{ uri: image }}
                    style={styles.postImage}
                    resizeMode="cover"
                  />
                ))}
              </View>
            )}

            <View style={styles.actions}>
              <Button
                mode="text"
                icon={post.isLiked ? 'heart' : 'heart-outline'}
                onPress={() => newsfeedAPI.likePost(post.id)}
                textColor={post.isLiked ? '#e74c3c' : undefined}
              >
                {post.likes_count || 0}
              </Button>

              <Button
                mode="text"
                icon="comment-outline"
              >
                {comments.length}
              </Button>
            </View>
          </Card.Content>
        </Card>

        <View style={styles.commentsHeader}>
          <Text variant="titleMedium">Bình luận ({comments.length})</Text>
        </View>

        <FlatList
          data={comments}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <CommentItem comment={item} />}
          scrollEnabled={false}
        />
      </ScrollView>

      <View style={styles.commentInputContainer}>
        <TextInput
          placeholder="Viết bình luận..."
          value={commentText}
          onChangeText={setCommentText}
          multiline
          style={styles.commentInput}
          mode="outlined"
        />
        <Button
          mode="contained"
          onPress={handleComment}
          loading={commentMutation.isLoading}
          disabled={!commentText.trim()}
        >
          Gửi
        </Button>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  postCard: {
    margin: 16,
    marginBottom: 8,
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  authorInfo: {
    marginLeft: 12,
    flex: 1,
  },
  authorName: {
    fontSize: 16,
    fontWeight: '500',
  },
  postTime: {
    fontSize: 12,
    opacity: 0.6,
    marginTop: 2,
  },
  postContent: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 12,
  },
  imagesContainer: {
    marginTop: 12,
  },
  postImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginBottom: 8,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 8,
  },
  commentsHeader: {
    padding: 16,
  },
  commentInputContainer: {
    flexDirection: 'row',
    padding: 8,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  commentInput: {
    flex: 1,
  },
});

export default PostDetailScreen;

