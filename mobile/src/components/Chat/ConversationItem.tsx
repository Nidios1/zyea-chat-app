import React from 'react';
import { View, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { getInitials } from '../../utils/nameUtils';
import { getAvatarURL } from '../../utils/imageUtils';

interface ConversationItemProps {
  conversation: {
    id: string;
    username: string;
    full_name: string;
    avatar_url?: string;
    last_message?: string;
    last_message_time?: string;
    unread_count?: number;
    status?: 'online' | 'offline';
  };
  onPress: () => void;
}

const ConversationItem: React.FC<ConversationItemProps> = ({
  conversation,
  onPress,
}) => {
  const theme = useTheme();
  const hasUnread = (conversation.unread_count || 0) > 0;

  return (
    <TouchableOpacity
      style={[
        styles.container,
        { borderBottomColor: theme.colors.surfaceVariant },
      ]}
      onPress={onPress}
    >
      <View style={styles.avatarContainer}>
        {conversation.avatar_url ? (
          <Image
            source={{ uri: getAvatarURL(conversation.avatar_url) }}
            style={styles.avatar}
          />
        ) : (
          <View style={[styles.avatarPlaceholder, { backgroundColor: '#0068ff' }]}>
            <Text style={styles.avatarText}>
              {getInitials(conversation.full_name || conversation.username)}
            </Text>
          </View>
        )}
        {conversation.status === 'online' && (
          <View style={[styles.statusIndicator, { backgroundColor: '#4caf50' }]} />
        )}
      </View>

      <View style={styles.content}>
        <View style={styles.header}>
          <Text
            style={[styles.name, hasUnread && styles.nameUnread]}
            numberOfLines={1}
          >
            {conversation.full_name || conversation.username}
          </Text>
          {conversation.last_message_time && (
            <Text style={styles.time} numberOfLines={1}>
              {new Date(conversation.last_message_time).toLocaleTimeString('vi', {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </Text>
          )}
        </View>

        {conversation.last_message && (
          <Text
            style={[
              styles.lastMessage,
              hasUnread && styles.lastMessageUnread,
            ]}
            numberOfLines={1}
          >
            {conversation.last_message}
          </Text>
        )}

        {hasUnread && (
          <View style={[styles.badge, { backgroundColor: '#0068ff' }]}>
            <Text style={styles.badgeText}>{conversation.unread_count}</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: 1,
    backgroundColor: '#fff',
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 12,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  avatarPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  statusIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: '#fff',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  name: {
    fontSize: 16,
    fontWeight: '500',
    flex: 1,
  },
  nameUnread: {
    fontWeight: 'bold',
  },
  time: {
    fontSize: 12,
    opacity: 0.6,
    marginLeft: 8,
  },
  lastMessage: {
    fontSize: 14,
    opacity: 0.7,
  },
  lastMessageUnread: {
    fontWeight: '500',
    opacity: 1,
  },
  badge: {
    position: 'absolute',
    right: 0,
    top: 4,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    paddingHorizontal: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: 'bold',
  },
});

export default ConversationItem;

