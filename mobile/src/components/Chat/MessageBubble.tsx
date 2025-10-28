import React from 'react';
import { View, StyleSheet, Image } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';

interface MessageBubbleProps {
  message: {
    id: string;
    content: string;
    sender_id: string;
    created_at: string;
    type?: string;
    media_url?: string;
  };
  currentUserId: string;
  isLastMessage?: boolean;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  currentUserId,
  isLastMessage = true,
}) => {
  const theme = useTheme();
  const isOwnMessage = message.sender_id === currentUserId;

  const formatTime = (dateString: string) => {
    return formatDistanceToNow(new Date(dateString), {
      addSuffix: true,
      locale: vi,
    });
  };

  return (
    <View
      style={[
        styles.container,
        isOwnMessage ? styles.ownContainer : styles.otherContainer,
      ]}
    >
      <View
        style={[
          styles.bubble,
          isOwnMessage ? styles.ownBubble : styles.otherBubble,
          {
            backgroundColor: isOwnMessage ? '#0068ff' : '#e8eaed',
          },
        ]}
      >
        {message.media_url && (
          <Image
            source={{ uri: message.media_url }}
            style={styles.image}
            resizeMode="cover"
          />
        )}
        
        <Text
          style={[
            styles.text,
            {
              color: isOwnMessage ? '#ffffff' : '#000000',
            },
          ]}
        >
          {message.content}
        </Text>

        {isLastMessage && (
          <Text
            style={[
              styles.time,
              {
                color: isOwnMessage ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.5)',
              },
            ]}
          >
            {formatTime(message.created_at)}
          </Text>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 4,
  },
  ownContainer: {
    alignItems: 'flex-end',
  },
  otherContainer: {
    alignItems: 'flex-start',
  },
  bubble: {
    maxWidth: '70%',
    padding: 12,
    borderRadius: 18,
  },
  ownBubble: {
    borderBottomRightRadius: 4,
  },
  otherBubble: {
    borderBottomLeftRadius: 4,
  },
  text: {
    fontSize: 15,
    lineHeight: 20,
  },
  image: {
    width: 200,
    height: 200,
    borderRadius: 8,
    marginBottom: 8,
  },
  time: {
    fontSize: 11,
    marginTop: 4,
    alignSelf: 'flex-end',
  },
});

export default MessageBubble;

