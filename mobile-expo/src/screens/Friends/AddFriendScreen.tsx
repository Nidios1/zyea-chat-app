import React, { useState } from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import { Text, Searchbar, useTheme, Appbar, Card, Button, Avatar } from 'react-native-paper';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { usersAPI, friendsAPI } from '../../utils/api';
import Toast from 'react-native-toast-message';
import { getInitials } from '../../utils/nameUtils';
import { getAvatarURL } from '../../utils/imageUtils';

const AddFriendScreen = () => {
  const theme = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const queryClient = useQueryClient();

  const { data: searchResults = [], isLoading } = useQuery({
    queryKey: ['searchUsers', searchQuery],
    queryFn: () => usersAPI.searchUsers(searchQuery).then((res) => res.data),
    enabled: Boolean(searchQuery.length > 0),
  });

  const sendRequestMutation = useMutation({
    mutationFn: (userId: string) => friendsAPI.sendFriendRequest(userId),
    onSuccess: () => {
      Toast.show({
        type: 'success',
        text1: 'Đã gửi lời mời kết bạn',
      });
      queryClient.invalidateQueries({ queryKey: ['friends'] });
    },
    onError: () => {
      Toast.show({
        type: 'error',
        text1: 'Gửi lời mời thất bại',
      });
    },
  });

  const handleSendRequest = (userId: string) => {
    sendRequestMutation.mutate(userId);
  };

  const renderUser = ({ item }: { item: any }) => (
    <Card style={styles.userCard}>
      <Card.Content style={styles.userContent}>
        {item.avatar_url ? (
          <Avatar.Image
            size={50}
            source={{ uri: getAvatarURL(item.avatar_url) }}
          />
        ) : (
          <Avatar.Text
            size={50}
            label={getInitials(item.full_name || item.username)}
          />
        )}

        <View style={styles.userInfo}>
          <Text style={styles.userName}>
            {item.full_name || item.username}
          </Text>
          {item.email && (
            <Text style={styles.userEmail}>{item.email}</Text>
          )}
        </View>

        <Button
          mode="contained"
          onPress={() => handleSendRequest(item.id)}
          loading={Boolean(sendRequestMutation.isLoading)}
        >
          Kết bạn
        </Button>
      </Card.Content>
    </Card>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Appbar.Header>
        <Appbar.BackAction />
        <Appbar.Content title="Thêm bạn" />
      </Appbar.Header>

      <Searchbar
        placeholder="Tìm kiếm bạn bè..."
        onChangeText={setSearchQuery}
        value={searchQuery}
        style={styles.searchbar}
      />

      {isLoading ? (
        <View style={styles.center}>
          <Text>Đang tìm kiếm...</Text>
        </View>
      ) : searchResults.length === 0 && searchQuery ? (
        <View style={styles.center}>
          <Text>Không tìm thấy người dùng</Text>
        </View>
      ) : !searchQuery ? (
        <View style={styles.center}>
          <Text>Nhập tên để tìm kiếm bạn bè</Text>
        </View>
      ) : (
        <FlatList
          data={searchResults}
          keyExtractor={(item) => item.id}
          renderItem={renderUser}
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
  userCard: {
    margin: 8,
    marginHorizontal: 16,
  },
  userContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userInfo: {
    flex: 1,
    marginLeft: 12,
  },
  userName: {
    fontSize: 16,
    fontWeight: '500',
  },
  userEmail: {
    fontSize: 13,
    opacity: 0.6,
    marginTop: 2,
  },
});

export default AddFriendScreen;

