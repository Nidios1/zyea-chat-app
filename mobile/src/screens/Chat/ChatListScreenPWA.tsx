import React, { useState } from 'react';
import { View, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { Text, Card, Avatar, useTheme } from 'react-native-paper';
import { useQuery } from '@tanstack/react-query';
import { chatAPI } from '../../utils/api';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { ChatStackParamList } from '../../navigation/types';
import { getInitials } from '../../utils/nameUtils';
import { getAvatarURL } from '../../utils/imageUtils';
import PWACustomHeader from '../../components/Common/PWACustomHeader';

type ChatListNavigationProp = StackNavigationProp<ChatStackParamList>;

const ChatListScreenPWA = () => {
  const theme = useTheme();
  const navigation = useNavigation<ChatListNavigationProp>();
  const [refreshing, setRefreshing] = useState(false);

  const {
    data: conversations = [],
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['conversations'],
    queryFn: () => chatAPI.getConversations().then((res) => res.data),
  });

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const handleConversationPress = (conversation: any) => {
    navigation.navigate('ChatDetail', {
      conversationId: conversation.id,
      userName: conversation.full_name || conversation.username,
    });
  };

  const renderConversation = ({ item }: { item: any }) => (
    <Card 
      style={styles.conversationCard}
      onPress={() => handleConversationPress(item)}
    >
      <Card.Content style={styles.conversationContent}>
        {item.avatar_url ? (
          <Avatar.Image
            size={56}
            source={{ uri: getAvatarURL(item.avatar_url) }}
          />
        ) : (
          <Avatar.Text
            size={56}
            label={getInitials(item.full_name || item.username)}
            style={{ backgroundColor: '#0084ff' }}
          />
        )}
        
        <View style={styles.conversationInfo}>
          <Text style={styles.conversationName}>
            {item.full_name || item.username}
          </Text>
          {item.last_message && (
            <Text style={styles.lastMessage} numberOfLines={1}>
              {item.last_message.content}
            </Text>
          )}
        </View>

        {item.unread_count > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{item.unread_count}</Text>
          </View>
        )}
      </Card.Content>
    </Card>
  );

  return (
    <View style={styles.container}>
      <PWACustomHeader title="Tin nhắn" />
      
      <FlatList
        data={conversations}
        keyExtractor={(item) => item.id}
        renderItem={renderConversation}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>Chưa có tin nhắn nào</Text>
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
  conversationCard: {
    marginHorizontal: 12,
    marginBottom: 8,
    borderRadius: 12,
    backgroundColor: '#ffffff',
  },
  conversationContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  conversationInfo: {
    flex: 1,
    marginLeft: 12,
  },
  conversationName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  lastMessage: {
    fontSize: 14,
    color: '#666',
  },
  badge: {
    backgroundColor: '#ff4444',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  badgeText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
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

export default ChatListScreenPWA;

