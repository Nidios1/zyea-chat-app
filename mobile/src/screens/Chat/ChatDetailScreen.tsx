import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Text, Appbar, IconButton, useTheme } from 'react-native-paper';
import { useRoute, useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { ChatStackParamList } from '../../navigation/types';
import MessageBubble from '../../components/Chat/MessageBubble';
import { useAuth } from '../../contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { chatAPI } from '../../utils/api';
import useSocket from '../../hooks/useSocket';

type ChatDetailNavigationProp = StackNavigationProp<ChatStackParamList>;

const ChatDetailScreen = () => {
  const theme = useTheme();
  const route = useRoute();
  const navigation = useNavigation<ChatDetailNavigationProp>();
  const { user } = useAuth();
  const { conversationId } = route.params as any;
  
  const [inputText, setInputText] = useState('');
  const [messages, setMessages] = useState<any[]>([]);
  const flatListRef = useRef<FlatList>(null);
  
  const { socket } = useSocket();

  const { data: conversationMessages = [] } = useQuery({
    queryKey: ['messages', conversationId],
    queryFn: () => chatAPI.getMessages(conversationId).then((res) => res.data),
  });

  useEffect(() => {
    setMessages(conversationMessages);
  }, [conversationMessages]);

  // Listen for new messages via socket
  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (message: any) => {
      if (message.conversation_id === conversationId) {
        setMessages((prev) => [message, ...prev]);
      }
    };

    socket.on('receiveMessage', handleNewMessage);

    return () => {
      socket.off('receiveMessage', handleNewMessage);
    };
  }, [socket, conversationId]);

  const handleSend = async () => {
    if (!inputText.trim()) return;

    try {
      // Send via socket
      socket?.emit('sendMessage', {
        conversation_id: conversationId,
        content: inputText,
      });

      setInputText('');
    } catch (error) {
      console.error('Send message error:', error);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <Appbar.Header>
        <Appbar.BackAction onPress={() => navigation.goBack()} />
        <Appbar.Content title={route.params?.userName || 'Chat'} />
        <IconButton icon="phone" onPress={() => {}} />
        <IconButton icon="video" onPress={() => {}} />
      </Appbar.Header>

      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => (
          <MessageBubble
            message={item}
            currentUserId={user?.id || ''}
            isLastMessage={index === messages.length - 1}
          />
        )}
        inverted
        style={styles.messages}
        contentContainerStyle={styles.messagesContent}
      />

      <View style={styles.inputContainer}>
        <IconButton icon="image" onPress={() => {}} />
        <TextInput
          style={styles.input}
          value={inputText}
          onChangeText={setInputText}
          placeholder="Nhập tin nhắn..."
          multiline
          maxLength={1000}
        />
        <TouchableOpacity
          style={[
            styles.sendButton,
            { backgroundColor: inputText.trim() ? '#0068ff' : '#ccc' },
          ]}
          onPress={handleSend}
          disabled={!inputText.trim()}
        >
          <Text style={styles.sendButtonText}>Gửi</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  messages: {
    flex: 1,
  },
  messagesContent: {
    paddingVertical: 16,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 8,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 100,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    marginHorizontal: 8,
  },
  sendButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  sendButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});

export default ChatDetailScreen;
