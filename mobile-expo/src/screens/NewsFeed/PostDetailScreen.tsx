import React, { useState, useLayoutEffect } from 'react';
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, FlatList } from 'react-native';
import { Text, Card, Button, Avatar, useTheme, Appbar } from 'react-native-paper';
import { useQuery } from '@tanstack/react-query';
import { newsfeedAPI } from '../../utils/api';
import { getInitials } from '../../utils/nameUtils';
import { FacebookImageLayout } from '../../components/NewsFeed/FacebookImageLayout';
import { getImageMetadata, MediaMetadata } from '../../utils/mediaUtils';
import { useLightboxControls } from '../../contexts/LightboxContext';
import { type ImageSource } from '../../contexts/LightboxContext';
import { getImageURL } from '../../utils/imageUtils';
import Lightbox from '../../components/Common/Lightbox';
import CommentItem from '../../components/NewsFeed/CommentItem';

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
  const { openLightbox } = useLightboxControls();
  const [imageMetadata, setImageMetadata] = useState<Map<string, MediaMetadata>>(new Map());

  const { data: post } = useQuery({
    queryKey: ['post', postId],
    queryFn: () => newsfeedAPI.getPost(postId).then((res) => res.data),
  });

  const { data: comments = [] } = useQuery({
    queryKey: ['postComments', postId],
    queryFn: () => newsfeedAPI.getPostComments(postId).then((res) => res.data),
  });

  // Get post images
  const postImages = post
    ? (post.images && Array.isArray(post.images) ? post.images : post.image_url ? [post.image_url] : []).filter((img: string) => img)
    : [];

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

  if (!post) {
    return (
      <View style={styles.center}>
        <Text>Đang tải...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior="padding"
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

            {postImages.length > 0 && (
              <View style={styles.imagesContainer}>
                <FacebookImageLayout
                  images={postImages}
                  onPressImage={handleImagePress}
                  imageMetadata={imageMetadata}
                />
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
          scrollEnabled={false as boolean}
        />
      </ScrollView>

      {/* Lightbox for image viewing */}
      <Lightbox />
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
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 8,
  },
  commentsHeader: {
    padding: 16,
  },
});

export default PostDetailScreen;

