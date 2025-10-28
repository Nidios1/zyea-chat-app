import React, { useState, useCallback } from 'react';
import { View, StyleSheet, FlatList, RefreshControl, TouchableOpacity } from 'react-native';
import { Text, Card, Avatar, Button } from 'react-native-paper';
import { useQuery } from '@tanstack/react-query';
import { newsfeedAPI } from '../../utils/api';
import { getInitials } from '../../utils/nameUtils';
import { useNavigation } from '@react-navigation/native';
import PWACustomHeader from '../../components/Common/PWACustomHeader';
import Icon from 'react-native-vector-icons/Feather';

const NewsFeedPWAScreen = () => {
  const navigation = useNavigation();
  const [refreshing, setRefreshing] = useState(false);

  const {
    data: posts = [],
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['posts'],
    queryFn: () => newsfeedAPI.getPosts().then((res) => res.data),
  });

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const handleCreatePost = () => {
    navigation.navigate('CreatePost' as never);
  };

  const renderPost = ({ item }: { item: any }) => (
    <Card style={styles.postCard}>
      <Card.Content>
        <View style={styles.postHeader}>
          <Avatar.Text
            size={40}
            label={getInitials(item.author.full_name || item.author.username)}
            style={{ backgroundColor: '#0084ff' }}
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

        <View style={styles.actions}>
          <Button
            mode="text"
            icon={item.isLiked ? 'heart' : 'heart-outline'}
            onPress={() => newsfeedAPI.likePost(item.id)}
            textColor={item.isLiked ? '#e74c3c' : '#666'}
          >
            {item.likes_count || 0}
          </Button>

          <Button
            mode="text"
            icon="message-circle-outline"
            onPress={() => {}}
            textColor="#666"
          >
            {item.comments_count || 0}
          </Button>

          <Button
            mode="text"
            icon="share-2"
            onPress={() => {}}
            textColor="#666"
          >
            Chia sẻ
          </Button>
        </View>
      </Card.Content>
    </Card>
  );

  return (
    <View style={styles.container}>
      <PWACustomHeader 
        title="NewsFeed"
        rightComponent={
          <TouchableOpacity onPress={handleCreatePost}>
            <Icon name="edit" size={22} color="#ffffff" />
          </TouchableOpacity>
        }
      />
      
      <FlatList
        data={posts}
        keyExtractor={(item) => item.id}
        renderItem={renderPost}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>Chưa có bài viết nào</Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  list: {
    paddingTop: 12,
  },
  postCard: {
    margin: 12,
    marginBottom: 8,
    borderRadius: 12,
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
    fontWeight: '600',
    color: '#333',
  },
  postTime: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  postContent: {
    fontSize: 15,
    lineHeight: 22,
    color: '#333',
    marginBottom: 12,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    paddingTop: 8,
  },
  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
  },
});

export default NewsFeedPWAScreen;

