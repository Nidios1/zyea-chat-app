import React, { useState, useLayoutEffect } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
} from 'react-native';
import { Text, Appbar, useTheme, TextInput, Avatar, IconButton } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigation } from '@react-navigation/native';
import { newsfeedAPI } from '../../utils/api';
import CommentItem from '../../components/NewsFeed/CommentItem';
import Toast from 'react-native-toast-message';
import { getInitials } from '../../utils/nameUtils';
import { getAvatarURL, getImageURL } from '../../utils/imageUtils';
import { FacebookImageLayout } from '../../components/NewsFeed/FacebookImageLayout';
import { getImageMetadata, MediaMetadata } from '../../utils/mediaUtils';
import { useLightboxControls } from '../../contexts/LightboxContext';
import { type ImageSource } from '../../contexts/LightboxContext';
import { Lightbox } from '../../components/Common/Lightbox';
import { useAuth } from '../../contexts/AuthContext';

interface CommentsScreenProps {
  route: {
    params: {
      postId: string | number;
      postTitle?: string;
    };
  };
}

// Format time ago helper
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

const CommentsScreen: React.FC<CommentsScreenProps> = ({ route }) => {
  const { postId, postTitle } = route.params;
  const theme = useTheme();
  const navigation = useNavigation();
  const { user } = useAuth();
  const [commentText, setCommentText] = useState('');
  const queryClient = useQueryClient();
  const { openLightbox } = useLightboxControls();
  const [imageMetadata, setImageMetadata] = useState<Map<string, MediaMetadata>>(new Map());
  const [isLiked, setIsLiked] = useState(false);

  // Fetch bài viết gốc
  const { data: post, isLoading: isLoadingPost } = useQuery({
    queryKey: ['post', postId],
    queryFn: () => newsfeedAPI.getPost(String(postId)).then((res) => res.data),
  });

  // Track like state
  React.useEffect(() => {
    if (post) {
      setIsLiked(post.isLiked || false);
    }
  }, [post]);

  // Like/Unlike mutation
  const likeMutation = useMutation({
    mutationFn: () => {
      if (isLiked) {
        return newsfeedAPI.unlikePost(String(postId));
      } else {
        return newsfeedAPI.likePost(String(postId));
      }
    },
    onSuccess: () => {
      setIsLiked(!isLiked);
      queryClient.invalidateQueries({ queryKey: ['post', postId] });
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    },
  });

  const { data: comments = [], isLoading: isLoadingComments } = useQuery({
    queryKey: ['postComments', postId],
    queryFn: () => newsfeedAPI.getPostComments(String(postId)).then((res) => {
      const rawComments = res.data || [];
      // Transform API response to match expected structure with author object
      return rawComments.map((comment: any) => ({
        ...comment,
        author: {
          id: comment.user_id || comment.author?.id,
          username: comment.username || comment.author?.username,
          full_name: comment.full_name || comment.author?.full_name,
          avatar_url: comment.avatar_url || comment.author?.avatar_url,
        },
      }));
    }),
  });

  // Get post images
  const postImages = React.useMemo(() => {
    if (!post) return [];
    const images = post.images && Array.isArray(post.images) 
      ? post.images 
      : post.image_url 
        ? [post.image_url] 
        : [];
    return images.filter((img: string) => img && img.trim());
  }, [post]);

  // Preload image metadata
  useLayoutEffect(() => {
    if (postImages.length === 0) return;

    const metadataPromises = postImages.map((imageUrl: string) =>
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
  }, [post?.id, JSON.stringify(postImages)]);

  // Handle image press - open lightbox
  const handleImagePress = (index: number) => {
    if (postImages.length === 0) return;

    const items: ImageSource[] = postImages.map((img: string, i: number) => {
      const metadata = imageMetadata.get(img);
      return {
        uri: getImageURL(img),
        thumbUri: getImageURL(img),
        alt: undefined,
        dimensions: metadata ? { width: metadata.width, height: metadata.height } : null,
        thumbRect: null,
        thumbDimensions: null,
      };
    });

    openLightbox({
      images: items,
      index,
    });
  };

  const commentMutation = useMutation({
    mutationFn: (content: string) => newsfeedAPI.commentPost(String(postId), content),
    onSuccess: () => {
      Toast.show({ type: 'success', text1: 'Đã bình luận' });
      setCommentText('');
      queryClient.invalidateQueries({ queryKey: ['postComments', postId] });
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    },
    onError: (error: any) => {
      Toast.show({
        type: 'error',
        text1: 'Lỗi',
        text2: error?.response?.data?.message || 'Không thể gửi bình luận',
      });
    },
  });

  const handleComment = () => {
    if (!commentText.trim()) return;
    commentMutation.mutate(commentText);
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <Appbar.Header>
        <Appbar.BackAction onPress={() => navigation.goBack()} />
        <Appbar.Content
          title="Thread"
          subtitle={post?.views_count ? `${post.views_count} lượt xem` : undefined}
        />
        <Appbar.Action icon="dots-vertical" onPress={() => {}} />
      </Appbar.Header>

      {(isLoadingPost || isLoadingComments) ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      ) : (
        <FlatList
          data={comments}
          keyExtractor={(item, index) => item.id?.toString() || `comment-${index}`}
          renderItem={({ item }) => <CommentItem comment={item} />}
          contentContainerStyle={styles.listContent}
          ListHeaderComponent={
            post ? (
              <View style={[styles.postContainer, { borderBottomColor: theme.colors.border }]} collapsable={false}>
                {/* Post Header */}
                <View style={styles.postHeader} collapsable={false}>
                  {post.author?.avatar_url ? (
                    <Avatar.Image
                      size={42}
                      source={{ uri: getAvatarURL(post.author.avatar_url) }}
                    />
                  ) : (
                    <Avatar.Text
                      size={42}
                      label={getInitials(post.author?.full_name || post.author?.username || 'U')}
                    />
                  )}
                  <View style={styles.postAuthorInfo}>
                    <Text style={[styles.postAuthorName, { color: theme.colors.onBackground }]}>
                      {post.author?.full_name || post.author?.username || 'Người dùng'}
                    </Text>
                    <Text style={[styles.postTime, { color: theme.colors.onSurfaceVariant }]}>
                      {formatTimeAgo(new Date(post.created_at))}
                    </Text>
                  </View>
                </View>

                {/* Post Content */}
                {post.content && String(post.content).trim() && (
                  <View style={styles.postContentWrapper} collapsable={false}>
                    <Text style={[styles.postContent, { color: theme.colors.onBackground }]}>
                      {String(post.content)}
                    </Text>
                  </View>
                )}

                {/* Post Images */}
                {postImages && postImages.length > 0 && (
                  <View style={styles.postImagesContainer} collapsable={false}>
                    <FacebookImageLayout
                      images={postImages}
                      onPressImage={handleImagePress}
                      imageMetadata={imageMetadata}
                    />
                  </View>
                )}

                {/* Post Actions - Threads style */}
                <View 
                  style={[styles.postActions, { borderTopColor: theme.colors.border, borderBottomColor: theme.colors.border }]}
                  collapsable={false}>
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => likeMutation.mutate()}
                    activeOpacity={0.7}>
                    <MaterialCommunityIcons
                      name={isLiked ? 'heart' : 'heart-outline'}
                      size={20}
                      color={isLiked ? '#e74c3c' : theme.colors.onSurfaceVariant}
                    />
                    {post?.likes_count > 0 && (
                      <Text style={[styles.actionText, { color: theme.colors.onSurfaceVariant }]}>
                        {post.likes_count}
                      </Text>
                    )}
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.actionButton}
                    activeOpacity={0.7}>
                    <MaterialCommunityIcons
                      name="comment-outline"
                      size={20}
                      color={theme.colors.onSurfaceVariant}
                    />
                    {comments.length > 0 && (
                      <Text style={[styles.actionText, { color: theme.colors.onSurfaceVariant }]}>
                        {comments.length}
                      </Text>
                    )}
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.actionButton}
                    activeOpacity={0.7}>
                    <MaterialCommunityIcons
                      name="repeat"
                      size={20}
                      color={theme.colors.onSurfaceVariant}
                    />
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.actionButton}
                    activeOpacity={0.7}>
                    <MaterialCommunityIcons
                      name="send-outline"
                      size={20}
                      color={theme.colors.onSurfaceVariant}
                    />
                  </TouchableOpacity>

                  <View style={styles.actionSpacer} />

                  <TouchableOpacity
                    style={styles.viewActivityButton}
                    activeOpacity={0.7}>
                    <Text style={[styles.viewActivityText, { color: theme.colors.onSurfaceVariant }]}>
                      Xem hoạt động &gt;
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : null
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={[styles.emptyText, { color: theme.colors.onSurfaceVariant }]}>
                Chưa có bình luận nào
              </Text>
              <Text style={[styles.emptySubtext, { color: theme.colors.onSurfaceVariant }]}>
                Hãy là người đầu tiên bình luận!
              </Text>
            </View>
          }
        />
      )}

      {/* Input Field - Threads style với avatar và icons */}
      <View style={[styles.commentInputContainer, { borderTopColor: theme.colors.border, backgroundColor: theme.colors.surface }]}>
        {user?.avatar_url ? (
          <Avatar.Image
            size={32}
            source={{ uri: getAvatarURL(user.avatar_url) }}
            style={styles.inputAvatar}
          />
        ) : (
          <Avatar.Text
            size={32}
            label={getInitials(user?.full_name || user?.username || 'U')}
            style={styles.inputAvatar}
          />
        )}
        <View style={[styles.inputWrapper, { backgroundColor: theme.colors.surfaceVariant }]}>
          <TextInput
            placeholder={`Trả lời ${post?.author?.full_name || post?.author?.username || ''}...`}
            value={commentText}
            onChangeText={setCommentText}
            multiline
            style={[styles.commentInput, { color: theme.colors.onSurface }]}
            mode="flat"
            disabled={commentMutation.isPending}
            underlineColorAndroid="transparent"
            activeUnderlineColor="transparent"
          />
          <View style={styles.inputIcons}>
            <TouchableOpacity style={styles.inputIcon}>
              <MaterialCommunityIcons
                name="image-outline"
                size={22}
                color={theme.colors.onSurfaceVariant}
              />
            </TouchableOpacity>
            <TouchableOpacity style={styles.inputIcon}>
              <MaterialCommunityIcons
                name="gif"
                size={22}
                color={theme.colors.onSurfaceVariant}
              />
            </TouchableOpacity>
          </View>
        </View>
        {commentText.trim().length > 0 && (
          <TouchableOpacity
            style={styles.sendButton}
            onPress={handleComment}
            disabled={commentMutation.isPending}
            activeOpacity={0.7}>
            <MaterialCommunityIcons
              name="send"
              size={22}
              color={commentMutation.isPending ? theme.colors.onSurfaceVariant : theme.colors.primary}
            />
          </TouchableOpacity>
        )}
      </View>

      {/* Lightbox for image viewing */}
      <Lightbox />
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: 0, // Không có padding - padding trong từng item (giống social-app-main)
  },
  emptyContainer: {
    padding: 32,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
  },
  commentInputContainer: {
    flexDirection: 'row',
    padding: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    gap: 8,
  },
  inputAvatar: {
    marginRight: 4,
  },
  inputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    minHeight: 40,
    maxHeight: 100,
  },
  commentInput: {
    flex: 1,
    fontSize: 15,
    padding: 0,
    margin: 0,
  },
  inputIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginLeft: 8,
  },
  inputIcon: {
    padding: 4,
  },
  sendButton: {
    padding: 8,
  },
  postActions: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    marginTop: 12,
    marginBottom: 0,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '600',
  },
  actionSpacer: {
    flex: 1,
  },
  viewActivityButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  viewActivityText: {
    fontSize: 14,
    fontWeight: '600',
  },
  postContainer: {
    paddingTop: 16,
    paddingRight: 16,
    paddingBottom: 16,
    paddingLeft: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    backgroundColor: 'transparent',
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  postAuthorInfo: {
    marginLeft: 12,
    flex: 1,
  },
  postAuthorName: {
    fontSize: 15,
    fontWeight: '600',
    lineHeight: 20,
  },
  postTime: {
    fontSize: 13,
    marginTop: 2,
  },
  postContentWrapper: {
    marginBottom: 12,
    marginTop: 4,
    minHeight: 20, // Đảm bảo có không gian
  },
  postContent: {
    fontSize: 15,
    lineHeight: 22,
    flexShrink: 1,
  },
  postImagesContainer: {
    marginTop: 12,
    marginBottom: 12,
    minHeight: 50, // Đảm bảo có không gian cho ảnh
  },
});

export default CommentsScreen;

