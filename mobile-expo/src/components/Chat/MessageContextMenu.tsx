import React from 'react';
import {
  View,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Text,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import ReactionBar from './ReactionBar';
import { formatMessageTime } from '../../utils/dateUtils';

interface MessageContextMenuProps {
  visible: boolean;
  message: {
    id: string;
    content: string;
    created_at: string;
    full_name?: string;
    username?: string;
    reactions?: any;
  } | null;
  position?: { x: number; y: number };
  isOwn?: boolean;
  onClose: () => void;
  onReply?: () => void;
  onForward?: () => void;
  onCopy?: () => void;
  onPin?: () => void;
  onSave?: () => void;
  onCreateTask?: () => void;
  onSelect?: () => void;
  onReaction?: (emoji: string) => void;
  onDelete?: () => void;
  onEdit?: () => void;
  onDeleteRequest?: () => void; // Trigger delete dialog instead of direct delete
}

interface MenuItemData {
  label: string;
  icon: string;
  onPress: () => void;
  danger?: boolean;
}

const MessageContextMenu: React.FC<MessageContextMenuProps> = ({
  visible,
  message,
  position,
  isOwn = false,
  onClose,
  onReply,
  onForward,
  onCopy,
  onPin,
  onSave,
  onCreateTask,
  onSelect,
  onReaction,
  onDelete,
  onEdit,
  onDeleteRequest,
}) => {
  const { isDarkMode, colors } = useTheme();

  if (!visible || !message) return null;

  // Count reactions
  const getReactionCount = () => {
    if (!message.reactions) return 0;
    if (typeof message.reactions === 'string') {
      try {
        const parsed = JSON.parse(message.reactions);
        return Array.isArray(parsed) ? parsed.length : 0;
      } catch {
        return 0;
      }
    }
    return Array.isArray(message.reactions) ? message.reactions.length : 0;
  };

  const reactionCount = getReactionCount();

  const menuItems: MenuItemData[] = [];

  if (isOwn) {
    // Menu cho tin nhắn của mình
    // Chỉnh sửa
    if (onEdit) {
      menuItems.push({
        label: 'Chỉnh sửa',
        icon: 'pencil',
        onPress: () => {
          onEdit();
          onClose();
        },
      });
    }

    // Phản hồi
    if (onReply) {
      menuItems.push({
        label: 'Phản hồi',
        icon: 'reply',
        onPress: () => {
          onReply();
          onClose();
        },
      });
    }

    // Sao chép
    if (onCopy) {
      menuItems.push({
        label: 'Sao chép',
        icon: 'content-copy',
        onPress: () => {
          onCopy();
          onClose();
        },
      });
    }

    // Separator
    menuItems.push({
      label: '',
      icon: '',
      onPress: () => {},
    });

    // Xóa - trigger dialog
    if (onDeleteRequest) {
      menuItems.push({
        label: 'Xóa',
        icon: 'delete',
        danger: true,
        onPress: () => {
          onDeleteRequest();
          onClose();
        },
      });
    }
  } else {
    // Menu cho tin nhắn của người khác
    // Phản hồi
    if (onReply) {
      menuItems.push({
        label: 'Phản hồi',
        icon: 'reply',
        onPress: () => {
          onReply();
          onClose();
        },
      });
    }

    // Sao chép
    if (onCopy) {
      menuItems.push({
        label: 'Sao chép',
        icon: 'content-copy',
        onPress: () => {
          onCopy();
          onClose();
        },
      });
    }

    // Dịch (Translate) - giống Facebook
    menuItems.push({
      label: 'Dịch',
      icon: 'translate',
      onPress: () => {
        // TODO: Implement translate functionality
        console.log('Translate message:', message.content);
        onClose();
      },
    });

    // Separator
    menuItems.push({
      label: '',
      icon: '',
      onPress: () => {},
    });

    // Khác (Other) - giống Facebook
    menuItems.push({
      label: 'Khác',
      icon: 'dots-horizontal-circle-outline',
      onPress: () => {
        // TODO: Show more options
        onClose();
      },
    });
  }

  const handleReactionSelect = (emoji: string) => {
    if (onReaction) {
      onReaction(emoji);
    }
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          {/* Blur Background - tạo hiệu ứng mờ cho nền */}
          <BlurView
            intensity={80}
            tint={isDarkMode ? 'dark' : 'light'}
            style={StyleSheet.absoluteFill}
          />
          {/* Dark overlay để tăng độ tối */}
          <View 
            style={[
              StyleSheet.absoluteFill,
              { backgroundColor: isDarkMode ? 'rgba(0, 0, 0, 0.4)' : 'rgba(0, 0, 0, 0.3)' }
            ]} 
          />
          <TouchableWithoutFeedback>
            <View style={styles.container}>
              {/* Reaction Bar - phần riêng bo tròn ở trên */}
              {!isOwn && onReaction && (
                <View
                  style={[
                    styles.reactionBarSection,
                    {
                      backgroundColor: isDarkMode ? '#3a3a3b' : '#f0f2f5',
                    },
                  ]}
                >
                  <ReactionBar
                    onReactionSelect={handleReactionSelect}
                    reactionCount={reactionCount > 0 ? reactionCount : undefined}
                  />
                </View>
              )}

              {/* Message Preview - phần riêng ở giữa */}
              <View
                style={[
                  styles.messageSection,
                  {
                    backgroundColor: isDarkMode ? '#2a2a2b' : '#ffffff',
                  },
                ]}
              >
                <View
                  style={[
                    styles.messageBubble,
                    { 
                      backgroundColor: isDarkMode ? '#3a3a3b' : '#e9ecef',
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.messageContent,
                      { color: colors.text },
                    ]}
                    numberOfLines={3}
                  >
                    {message.content}
                  </Text>
                </View>
              </View>

              {/* Menu Items - bảng riêng bo tròn ở dưới */}
              <View
                style={[
                  styles.menuItemsSection,
                  {
                    backgroundColor: isDarkMode ? '#2a2a2b' : '#ffffff',
                  },
                ]}
              >
                {menuItems.map((item, index) => {
                  // Separator item
                  if (!item.label && !item.icon) {
                    return (
                      <View
                        key={index}
                        style={[
                          styles.separator,
                          { backgroundColor: colors.border },
                        ]}
                      />
                    );
                  }

                  return (
                    <TouchableOpacity
                      key={index}
                      style={[
                        styles.menuItem,
                        index < menuItems.length - 1 &&
                          menuItems[index + 1].label !== '' && {
                            borderBottomColor: colors.border,
                            borderBottomWidth: 1,
                          },
                        item.danger && { opacity: 1 },
                      ]}
                      onPress={item.onPress}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.menuItemText,
                          { color: item.danger ? '#e74c3c' : colors.text },
                        ]}
                      >
                        {item.label}
                      </Text>
                      <MaterialCommunityIcons
                        name={item.icon as any}
                        size={20}
                        color={item.danger ? '#e74c3c' : colors.textSecondary}
                      />
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    width: '85%',
    maxWidth: 320,
    alignItems: 'center',
    gap: 8,
  },
  reactionBarSection: {
    width: '100%',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  messageSection: {
    width: '100%',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  messageBubble: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    maxWidth: '100%',
    alignSelf: 'flex-start',
  },
  menuItemsSection: {
    width: '100%',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  separator: {
    height: 1,
    marginVertical: 4,
    marginHorizontal: 16,
  },
  messageContent: {
    fontSize: 14,
    lineHeight: 20,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  menuItemText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
  },
});

export default MessageContextMenu;

