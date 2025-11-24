import React, { useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Text,
  Animated,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import ReactionBar from './ReactionBar';
import { formatMessageTime } from '../../utils/dateUtils';
// Haptics is optional
let Haptics: any = null;
try {
  Haptics = require('expo-haptics');
} catch {
  // Haptics not available
}

interface MessageContextMenuProps {
  visible: boolean;
  message: {
    id: string;
    content: string;
    created_at: string;
    full_name?: string;
    username?: string;
    reactions?: any;
    message_type?: string;
    type?: string;
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
  onDeleteSticker?: () => void; // Admin: Delete sticker from pack
  isAdmin?: boolean; // Check if user is admin
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
  onDeleteSticker,
  isAdmin = false,
}) => {
  const { isDarkMode, colors } = useTheme();
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (!isMountedRef.current) return;

    if (visible) {
      // Haptic feedback khi mở menu
      if (Haptics) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
      
      // Animation khi mở - mượt mà hơn với spring animation
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          useNativeDriver: true,
          tension: 65,
          friction: 8,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 180,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // Reset animation khi đóng
      if (isMountedRef.current) {
        scaleAnim.setValue(0);
        opacityAnim.setValue(0);
      }
    }
  }, [visible]);

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
  const messageType = message?.message_type || message?.type;
  const isSticker = messageType === 'sticker';

  if (isOwn) {
    // Menu cho tin nhắn của mình - giống Telegram
    // Trả lời
    if (onReply) {
      menuItems.push({
        label: 'Trả lời',
        icon: 'reply',
        onPress: () => {
          onReply();
          onClose();
        },
      });
    }

    // Sao chép - không hiển thị cho sticker
    if (onCopy && messageType !== 'sticker') {
      menuItems.push({
        label: 'Sao chép',
        icon: 'content-copy',
        onPress: () => {
          onCopy();
          onClose();
        },
      });
    }

    // Sửa
    if (onEdit) {
      menuItems.push({
        label: 'Sửa',
        icon: 'pencil',
        onPress: () => {
          onEdit();
          onClose();
        },
      });
    }

    // Ghim
    if (onPin) {
      menuItems.push({
        label: 'Ghim',
        icon: 'pin',
        onPress: () => {
          onPin();
          onClose();
        },
      });
    }

    // Chuyển tiếp
    if (onForward) {
      menuItems.push({
        label: 'Chuyển tiếp',
        icon: 'share',
        onPress: () => {
          onForward();
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

    // Admin: Xóa sticker (chỉ hiển thị cho sticker messages và admin)
    if (isSticker && isAdmin && onDeleteSticker) {
      menuItems.push({
        label: 'Xóa sticker',
        icon: 'delete-outline',
        danger: true,
        onPress: () => {
          onDeleteSticker();
          onClose();
        },
      });
    }

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

    // Chọn
    if (onSelect) {
      menuItems.push({
        label: 'Chọn',
        icon: 'check-circle',
        onPress: () => {
          onSelect();
          onClose();
        },
      });
    }
  } else {
    // Menu cho tin nhắn của người khác - giống Telegram
    // Trả lời
    if (onReply) {
      menuItems.push({
        label: 'Trả lời',
        icon: 'reply',
        onPress: () => {
          onReply();
          onClose();
        },
      });
    }

    // Sao chép - không hiển thị cho sticker
    if (onCopy && messageType !== 'sticker') {
      menuItems.push({
        label: 'Sao chép',
        icon: 'content-copy',
        onPress: () => {
          onCopy();
          onClose();
        },
      });
    }

    // Ghim
    if (onPin) {
      menuItems.push({
        label: 'Ghim',
        icon: 'pin',
        onPress: () => {
          onPin();
          onClose();
        },
      });
    }

    // Chuyển tiếp
    if (onForward) {
      menuItems.push({
        label: 'Chuyển tiếp',
        icon: 'share',
        onPress: () => {
          onForward();
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

    // Admin: Xóa sticker (chỉ hiển thị cho sticker messages và admin)
    if (isSticker && isAdmin && onDeleteSticker) {
      menuItems.push({
        label: 'Xóa sticker',
        icon: 'delete-outline',
        danger: true,
        onPress: () => {
          onDeleteSticker();
          onClose();
        },
      });
    }

    // Xóa (chỉ cho admin hoặc owner)
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

    // Chọn
    if (onSelect) {
      menuItems.push({
        label: 'Chọn',
        icon: 'check-circle',
        onPress: () => {
          onSelect();
          onClose();
        },
      });
    }
  }

  const handleReactionSelect = (emoji: string) => {
    // Haptic feedback khi chọn reaction
    if (Haptics) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    if (onReaction) {
      onReaction(emoji);
    }
    onClose();
  };

  const handleMenuItemPress = (onPress: () => void) => {
    // Haptic feedback khi chọn menu item
    if (Haptics) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onPress();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={() => {
        if (isMountedRef.current) {
          onClose();
        }
      }}
    >
      <TouchableWithoutFeedback onPress={() => {
        if (isMountedRef.current) {
          onClose();
        }
      }}>
        <Animated.View 
          style={[
            styles.overlay,
            {
              opacity: opacityAnim,
            }
          ]}
        >
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
            <Animated.View 
              style={[
                styles.container,
                {
                  transform: [{ scale: scaleAnim }],
                }
              ]}
            >
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

              {/* Message Preview - hiển thị nội dung tin nhắn */}
              {(message.content && (message.message_type !== 'sticker' && message.type !== 'sticker')) && (
                <View
                  style={[
                    styles.messageSection,
                    {
                      backgroundColor: isDarkMode ? 'rgba(58, 58, 59, 0.95)' : 'rgba(255, 255, 255, 0.95)',
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.messageBubble,
                      { 
                        backgroundColor: isDarkMode ? 'rgba(78, 78, 79, 0.8)' : 'rgba(240, 242, 245, 0.9)',
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.messageContent,
                        { color: isDarkMode ? 'rgba(255,255,255,0.9)' : 'rgba(0,0,0,0.8)' },
                      ]}
                      numberOfLines={3}
                    >
                      {message.content}
                    </Text>
                  </View>
                </View>
              )}
              
              {/* Hiển thị "Sticker" nếu là sticker */}
              {((message.message_type === 'sticker' || message.type === 'sticker')) && (
                <View
                  style={[
                    styles.messageSection,
                    {
                      backgroundColor: isDarkMode ? 'rgba(58, 58, 59, 0.95)' : 'rgba(255, 255, 255, 0.95)',
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.messageBubble,
                      { 
                        backgroundColor: isDarkMode ? 'rgba(78, 78, 79, 0.8)' : 'rgba(240, 242, 245, 0.9)',
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.messageContent,
                        { color: isDarkMode ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.6)' },
                      ]}
                    >
                      Sticker
                    </Text>
                  </View>
                </View>
              )}

              {/* Menu Items - bảng riêng bo tròn ở dưới */}
              <View
                style={[
                  styles.menuItemsSection,
                  {
                    backgroundColor: isDarkMode ? 'rgba(58, 58, 59, 0.95)' : 'rgba(255, 255, 255, 0.95)',
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
                          { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' },
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
                            borderBottomColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
                            borderBottomWidth: 0.5,
                          },
                        item.danger && { opacity: 1 },
                      ]}
                      onPress={() => handleMenuItemPress(item.onPress)}
                      activeOpacity={0.7}
                    >
                      <MaterialCommunityIcons
                        name={item.icon as any}
                        size={22}
                        color={item.danger ? '#ff3b30' : (isDarkMode ? 'rgba(255,255,255,0.9)' : 'rgba(0,0,0,0.8)')}
                        style={styles.menuItemIcon}
                      />
                      <Text
                        style={[
                          styles.menuItemText,
                          { color: item.danger ? '#ff3b30' : (isDarkMode ? 'rgba(255,255,255,0.9)' : 'rgba(0,0,0,0.9)') },
                        ]}
                      >
                        {item.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </Animated.View>
          </TouchableWithoutFeedback>
        </Animated.View>
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
    gap: 6,
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
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
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
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  separator: {
    height: 0.5,
    marginVertical: 0,
    marginHorizontal: 0,
  },
  messageContent: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '400',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    minHeight: 48,
  },
  menuItemIcon: {
    marginRight: 12,
  },
  menuItemText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '400',
  },
});

export default MessageContextMenu;

