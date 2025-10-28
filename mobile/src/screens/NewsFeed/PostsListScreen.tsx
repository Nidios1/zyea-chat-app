import React from 'react';
import { View, StyleSheet, FlatList, Image } from 'react-native';
import { Text, Card, Button, Avatar, useTheme } from 'react-native-paper';
import { useQuery } from '@tanstack/react-query';
import { newsfeedAPI } from '../../utils/api';
import { getInitials } from '../../utils/nameUtils';
import { getAvatarURL } from '../../utils/imageUtils';

const PostsListScreen = () => {
  const theme = useTheme();

  const {
    data: posts = [],
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['posts'],
    queryFn: () => newsfeedAPI.getPosts().then((res) => res.data),
  });

  const renderPost = ({ item }: { item: any }) => (
    <Card style={styles.postCard}>
      <Card.Content>
        <View style={styles.postHeader}>
          <Avatar.Text
            size={40}
            label={getInitials(item.author.full_name || item.author.username)}
          />
          <View style={styles.authorInfo}>
            <Text style={styles.authorName}>
              {item.author.full_name || item.author.username}
            </Text>
            <Text style={styles.postTime}>
              {new Date(item.created_at).toLocaleDateString()}
            </Text>
          </View>
        </View>

        {item.content && (
          <Text style={styles.postContent}>{item.content}</Text>
        )}

        {item.images && item.images.length > 0 && (
          <View style={styles.imagesContainer}>
            {item.images.map((image: string, index: number) => (
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
            icon={item.isLiked ? 'heart' : 'heart-outline'}
            onPress={() => newsfeedAPI.likePost(item.id)}
            textColor={item.isLiked ? '#e74c3c' : undefined}
          >
            {item.likes_count || 0}
          </Button>

          <Button
            mode="text"
            icon="comment-outline"
            onPress={() => {}}
          >
            {item.comments_count || 0}
          </Button>

          <Button
            mode="text"
            icon="share-outline"
            onPress={() => {}}
          >
            Share
          </Button>
        </View>
      </Card.Content>
    </Card>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <FlatList
        data={posts}
        keyExtractor={(item) => item.id}
        renderItem={renderPost}
        refreshing={isLoading}
        onRefresh={refetch}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text>Chưa có bài viết nào</Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
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
  },
  postContent: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 12,
  },
  imagesContainer: {
    marginBottom: 12,
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
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    paddingTop: 8,
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
});

export default PostsListScreen;

