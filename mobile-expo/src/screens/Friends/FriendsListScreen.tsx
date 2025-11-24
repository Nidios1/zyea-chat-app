import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, Image } from 'react-native';
import { Text, Searchbar, useTheme, Appbar } from 'react-native-paper';
import { Card, Button } from '../../components/UI';
import { useQuery } from '@tanstack/react-query';
import { friendsAPI } from '../../utils/api';
import { getInitials } from '../../utils/nameUtils';
import { getAvatarURL } from '../../utils/imageUtils';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { spacing, typography, borderRadius } from '../../config/designTokens';

const FriendsListScreen = () => {
  const theme = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [activityStatusEnabled, setActivityStatusEnabled] = useState(true);

  // Load activity status setting
  useEffect(() => {
    const loadActivityStatus = async () => {
      try {
        const saved = await AsyncStorage.getItem('activityStatusEnabled');
        if (saved !== null) {
          setActivityStatusEnabled(saved === 'true');
        }
      } catch (error) {
        console.error('Error loading activity status:', error);
      }
    };
    loadActivityStatus();
    
    // Listen for changes
    const interval = setInterval(loadActivityStatus, 1000);
    return () => clearInterval(interval);
  }, []);

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
    <Card style={styles.friendCard} padding={spacing.base}>
      <View style={styles.friendContent}>
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
          {activityStatusEnabled && (
            <Text style={[styles.friendStatus, { color: item.status === 'online' ? '#4caf50' : '#999' }]}>
              {item.status === 'online' ? 'Đang hoạt động' : 'Offline'}
            </Text>
          )}
        </View>

        <Button
          title="Nhắn tin"
          onPress={() => {/* Navigate to chat */}}
          variant="ghost"
          size="small"
        />
      </View>
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
    margin: spacing.sm,
  },
  friendCard: {
    marginHorizontal: spacing.base,
    marginVertical: spacing.xs,
    // Card padding is now handled by Card component prop
  },
  friendContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: borderRadius.full / 2,
    marginRight: spacing.md,
  },
  avatarPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: borderRadius.full / 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  avatarText: {
    color: '#fff',
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
  },
  friendInfo: {
    flex: 1,
  },
  friendName: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.medium,
    marginBottom: spacing.xs,
  },
  friendStatus: {
    fontSize: typography.fontSize.sm + 1,
  },
});

export default FriendsListScreen;

