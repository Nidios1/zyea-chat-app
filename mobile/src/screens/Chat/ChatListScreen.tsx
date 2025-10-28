import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  RefreshControl,
  TextInput,
} from 'react-native';
import { Text, useTheme, Appbar, Searchbar } from 'react-native-paper';
import { useQuery } from '@tanstack/react-query';
import { chatAPI } from '../../utils/api';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { ChatStackParamList } from '../../navigation/types';
import ConversationItem from '../../components/Chat/ConversationItem';

type ChatListNavigationProp = StackNavigationProp<ChatStackParamList>;

const ChatListScreen = () => {
  const theme = useTheme();
  const navigation = useNavigation<ChatListNavigationProp>();
  const [searchQuery, setSearchQuery] = useState('');

  const {
    data: conversations = [],
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['conversations'],
    queryFn: () => chatAPI.getConversations().then((res) => res.data),
  });

  const filteredConversations = conversations.filter((conv: any) =>
    (conv.full_name || conv.username).toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleConversationPress = (conversation: any) => {
    navigation.navigate('ChatDetail', {
      conversationId: conversation.id,
      userName: conversation.full_name || conversation.username,
    });
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Appbar.Header>
        <Appbar.Content title="Tin nhắn" />
        <Appbar.Action icon="magnify" onPress={() => {}} />
      </Appbar.Header>

      <Searchbar
        placeholder="Tìm kiếm"
        onChangeText={setSearchQuery}
        value={searchQuery}
        style={styles.searchbar}
      />

      {isLoading ? (
        <View style={styles.center}>
          <Text>Đang tải...</Text>
        </View>
      ) : filteredConversations.length === 0 ? (
        <View style={styles.center}>
          <Text>Chưa có cuộc trò chuyện</Text>
        </View>
      ) : (
        <FlatList
          data={filteredConversations}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <ConversationItem
              conversation={item}
              onPress={() => handleConversationPress(item)}
            />
          )}
          refreshControl={
            <RefreshControl
              refreshing={isLoading}
              onRefresh={refetch}
            />
          }
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
});

export default ChatListScreen;
