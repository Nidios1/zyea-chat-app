import React, { useState } from 'react';
import { View, StyleSheet, FlatList, Image } from 'react-native';
import { Text, Searchbar, useTheme, Appbar, Card, Button } from 'react-native-paper';
import { useQuery } from '@tanstack/react-query';
import { friendsAPI } from '../../utils/api';
import { getInitials } from '../../utils/nameUtils';
import { getAvatarURL } from '../../utils/imageUtils';

const FriendsListScreen = () => {
  const theme = useTheme();
  const [searchQuery, setSearchQuery] = useState('');

  const {
    data: friends = [],
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['friends'],
    queryFn: () => friendsAPI.getFriends().then((res) => res.data),
  });

  const filteredFriends = friends.filter((friend: any) =>
    (friend.full_name || friend.username).toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderFriend = ({ item }: { item: any }) => (
    <Card style={styles.friendCard}>
      <Card.Content style={styles.friendContent}>
        {item.avatar_url ? (
          <Image source={{ uri: getAvatarURL(item.avatar_url) }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatarPlaceholder, { backgroundColor: theme.colors.primary }]}>
            <Text style={styles.avatarText}>
              {getInitials(item.full_name || item.username)}
            </Text>
          </View>
        )}
        
        <View style={styles.friendInfo}>
          <Text style={styles.friendName}>
            {item.full_name || item.username}
          </Text>
          <Text style={[styles.friendStatus, { color: item.status === 'online' ? '#4caf50' : '#999' }]}>
            {item.status === 'online' ? 'Đang hoạt động' : 'Offline'}
          </Text>
        </View>

        <Button
          mode="text"
          icon="message-text"
          onPress={() => {/* Navigate to chat */}}
        >
          Nhắn tin
        </Button>
      </Card.Content>
    </Card>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Appbar.Header>
        <Appbar.Content title="Bạn bè" />
        <Appbar.Action icon="account-plus" onPress={() => {/* Add friend */}} />
      </Appbar.Header>

      <Searchbar
        placeholder="Tìm kiếm bạn bè"
        onChangeText={setSearchQuery}
        value={searchQuery}
        style={styles.searchbar}
      />

      {isLoading ? (
        <View style={styles.center}>
          <Text>Đang tải...</Text>
        </View>
      ) : filteredFriends.length === 0 ? (
        <View style={styles.center}>
          <Text>Chưa có bạn bè nào</Text>
        </View>
      ) : (
        <FlatList
          data={filteredFriends}
          keyExtractor={(item) => item.id}
          renderItem={renderFriend}
          refreshing={Boolean(isLoading)}
          onRefresh={refetch}
        />
      )}
    </View>
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
  searchbar: {
    margin: 8,
  },
  friendCard: {
    marginHorizontal: 16,
    marginVertical: 4,
  },
  friendContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
  },
  avatarPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  friendInfo: {
    flex: 1,
  },
  friendName: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  friendStatus: {
    fontSize: 13,
  },
});

export default FriendsListScreen;

