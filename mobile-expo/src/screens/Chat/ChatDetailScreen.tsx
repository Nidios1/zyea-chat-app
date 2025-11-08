import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  ActivityIndicator,
  Alert,
  Modal,
  Image,
  Dimensions,
} from 'react-native';
import { Text, Appbar, IconButton, Avatar } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useHeaderHeight } from '@react-navigation/elements';
import { StackNavigationProp } from '@react-navigation/stack';
import { ChatStackParamList } from '../../navigation/types';
import MessageBubble from '../../components/Chat/MessageBubble';
import TypingIndicator from '../../components/Chat/TypingIndicator';
import ReplyBar from '../../components/Chat/ReplyBar';
import MessageContextMenu from '../../components/Chat/MessageContextMenu';
import DeleteMessageDialog from '../../components/Chat/DeleteMessageDialog';
import UserProfileModal from '../../components/Chat/UserProfileModal';
// Clipboard is optional - use React Native Clipboard if expo-clipboard not available
import { Clipboard } from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import { useAuth } from '../../contexts/AuthContext';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { chatAPI, uploadAPI } from '../../utils/api';
import useSocket from '../../hooks/useSocket';
import { formatDate, isDifferentDay, getTimeAgo, isRecentActivity } from '../../utils/dateUtils';
import { getAvatarURL } from '../../utils/imageUtils';
import { useTheme } from '../../contexts/ThemeContext';
import { launchImageLibrary, launchCamera } from '../../utils/imagePicker';

type ChatDetailNavigationProp = StackNavigationProp<ChatStackParamList>;

const ChatDetailScreen = () => {
  const { isDarkMode, colors } = useTheme();
  const route = useRoute();
  const navigation = useNavigation<ChatDetailNavigationProp>();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const routeParams = route.params as any;
  const conversationId = routeParams?.conversationId ? String(routeParams.conversationId) : null;
  const userName = routeParams?.userName || 'Người dùng';
  const userAvatarUrl = routeParams?.userAvatarUrl;
  const otherUserId = routeParams?.otherUserId; // Need this for socket emit
  const subTitle = routeParams?.subTitle;
  const isOnlineParam = routeParams?.isOnline;
  const [isOnline, setIsOnline] = useState<boolean>(Boolean(isOnlineParam ?? true));
  const lastSeen = routeParams?.lastSeen || routeParams?.last_seen; // For "Hoạt động X trước"
  
  // State to track last seen for real-time updates
  const [userLastSeen, setUserLastSeen] = useState<string | null | undefined>(lastSeen);
  
  const insets = useSafeAreaInsets();
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const [inputBarHeight, setInputBarHeight] = useState<number>(56);
  const headerHeight = useHeaderHeight();
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [emojiPanelHeight, setEmojiPanelHeight] = useState<number>(260);
  const [activeEmojiTab, setActiveEmojiTab] = useState<'sticker' | 'emoji' | 'gif'>('emoji');
  const [activeEmojiCategory, setActiveEmojiCategory] = useState<string>('Smileys');
  
  const [inputText, setInputText] = useState('');
  const [messages, setMessages] = useState<any[]>([]);
  const [typingUsers, setTypingUsers] = useState<any[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [replyToMessage, setReplyToMessage] = useState<any | null>(null);
  const [contextMenuVisible, setContextMenuVisible] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<any | null>(null);
  const [menuPosition, setMenuPosition] = useState<{ x: number; y: number } | undefined>(undefined);
  const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);
  const [editingMessage, setEditingMessage] = useState<any | null>(null);
  const [showUserProfileModal, setShowUserProfileModal] = useState(false);
  const [selectedUserForProfile, setSelectedUserForProfile] = useState<any | null>(null);
  const [showMediaPicker, setShowMediaPicker] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState<{ uri: string; type: 'image' | 'video' } | null>(null);
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const inputRef = useRef<TextInput>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const hasInitializedRef = useRef<boolean>(false); // Track if we've initialized messages
  const videoRef = useRef<Video>(null);
  
  // Threads-like video duration limit: 5 minutes (300 seconds)
  const MAX_VIDEO_DURATION = 300; // 5 minutes in seconds
  
  const { socket } = useSocket();

  const { 
    data: conversationMessages = [], 
    isLoading: isLoadingMessages, 
    isError: isMessagesError,
    error: messagesError,
    refetch: refetchMessages,
    isRefetching: isRefetchingMessages
  } = useQuery({
    queryKey: ['messages', conversationId],
    queryFn: async () => {
      if (!conversationId) {
        throw new Error('Missing conversationId');
      }
      try {
        const response = await chatAPI.getMessages(conversationId);
        
        // Axios automatically throws error for status >= 400, so if we get here, response is successful
        // Server returns messages array directly (already reversed: oldest to newest)
        const messages = response.data || [];
        
        // Mark all messages as read when entering conversation
        try {
          await chatAPI.markAllAsRead(conversationId);
          
          // Update conversations cache immediately to set unread_count = 0
          queryClient.setQueryData(['conversations'], (oldData: any[]) => {
            if (!oldData) return oldData;
            
            // Update the conversation with unread_count = 0
            const updated = oldData.map((conv: any) => {
              const convId = conv?.id || conv?.conversation_id;
              if (String(convId) === String(conversationId)) {
                return {
                  ...conv,
                  unread_count: 0,
                  unreadCount: 0,
                };
              }
              return conv;
            });
            
            return updated;
          });
          
          // Emit socket event to notify other users
          if (socket?.connected) {
            socket.emit('markMessagesAsRead', {
              conversationId: conversationId,
              messageIds: [], // Empty array means all messages
              userId: user?.id
            });
          }
        } catch (error) {
          // Don't throw - marking as read is not critical
        }
        
        return messages;
      } catch (error: any) {
        // Log detailed error information
        const status = error?.response?.status;
        const errorMessage = error?.response?.data?.message || error?.message || 'Unknown error';
        
        // Create a more user-friendly error message
        let userFriendlyMessage = errorMessage;
        if (status === 500) {
          userFriendlyMessage = 'Lỗi máy chủ. Vui lòng thử lại sau.';
        } else if (status === 404) {
          userFriendlyMessage = 'Không tìm thấy cuộc trò chuyện.';
        } else if (status === 401) {
          userFriendlyMessage = 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.';
        } else if (status === 403) {
          userFriendlyMessage = 'Bạn không có quyền truy cập cuộc trò chuyện này.';
        } else if (status >= 400 && status < 500) {
          userFriendlyMessage = `Lỗi yêu cầu (${status}). Vui lòng thử lại.`;
        } else if (status >= 500) {
          userFriendlyMessage = 'Lỗi máy chủ. Vui lòng thử lại sau.';
        }
        
        // Create enhanced error object with user-friendly message
        const enhancedError = new Error(userFriendlyMessage);
        (enhancedError as any).status = status;
        (enhancedError as any).originalError = error;
        
        // Re-throw enhanced error to let React Query handle retry logic
        throw enhancedError;
      }
    },
    enabled: !!conversationId, // Only fetch if conversationId exists
    staleTime: 30000, // Consider data fresh for 30 seconds (prevent unnecessary refetch)
    cacheTime: 5 * 60 * 1000, // Keep in cache for 5 minutes (preserve messages when navigating back)
    retry: (failureCount, error: any) => {
      // Retry logic: retry up to 3 times for 5xx errors, but not for 4xx errors
      // Check both enhanced error status and original error response status
      const status = error?.status || error?.response?.status || error?.originalError?.response?.status;
      
      if (status >= 400 && status < 500) {
        // Don't retry client errors (4xx) - these are usually permanent errors
        return false;
      }
      
      // Retry server errors (5xx) and network errors (no status) up to 3 times
      if (failureCount < 3) {
        return true;
      }
      
      return false;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff: 1s, 2s, 4s
  });

  useEffect(() => {
    // Don't reset messages while loading - preserve current state
    // This prevents flashing empty state when navigating back and forth
    if (isLoadingMessages) {
      return;
    }
    
    // Server returns messages from oldest to newest (already reversed)
    // FlatList is inverted, so we need newest first
    // So we reverse the array to put newest at the top
    if (Array.isArray(conversationMessages) && conversationMessages.length > 0) {
      // Reverse to get newest first for inverted FlatList
      const reversedMessages = [...conversationMessages].reverse();
      
      // Smart merge: Keep optimistic updates but replace with server data when available
      setMessages((prevMessages) => {
        // If this is initial load (prevMessages is empty or only has temp messages)
        const hasOnlyTempMessages = prevMessages.length > 0 && prevMessages.every(m => {
          const id = m?.id;
          return id && String(id).startsWith('temp-');
        });
        
        // Initial load: set messages from server
        if (prevMessages.length === 0 || hasOnlyTempMessages) {
          hasInitializedRef.current = true;
          // Map server fields to client format
          return reversedMessages.map(msg => {
            // Chỉnh sửa edited: true khi edited = 1 (từ CASE WHEN SQL) hoặc edited_at có giá trị
            // edited field từ server là 0 hoặc 1 (từ CASE WHEN m.edited_at IS NOT NULL)
            const isEdited = msg.edited === 1 || 
                           (msg.edited_at !== null && 
                            msg.edited_at !== undefined && 
                            String(msg.edited_at).trim() !== '');
            
            return {
              ...msg,
              edited: Boolean(isEdited),  // Đảm bảo là boolean
              reactions: msg.reactions ? (typeof msg.reactions === 'string' ? JSON.parse(msg.reactions) : msg.reactions) : [],
              // Ensure message_type is set (server returns message_type field)
              message_type: msg.message_type || msg.type || 'text',
              // Ensure file_url is preserved (server returns file_url for media)
              file_url: msg.file_url || null,
            };
          });
        }
        
        // If we have existing real messages, merge carefully
        // Keep temp messages that don't exist in server data yet
        const serverMessageIds = new Set(reversedMessages.map(m => String(m.id || '')));
        const tempMessages = prevMessages.filter(m => {
          const id = m?.id;
          return id && String(id).startsWith('temp-');
        });
        const realMessagesFromPrev = prevMessages.filter(m => {
          const id = m?.id;
          return !id || !String(id).startsWith('temp-');
        });
        
        // Check if server has newer messages than what we have
        const hasNewMessages = reversedMessages.length > realMessagesFromPrev.length;
        
        if (hasNewMessages) {
          // Server has new messages, use server data but keep recent temp messages
          // that might not be in server yet (race condition)
          const recentTempMessages = tempMessages.filter(temp => {
            // Keep temp messages from last 5 seconds (increased from 2s for better reliability)
            const tempTime = new Date(temp.created_at).getTime();
            const now = Date.now();
            return (now - tempTime) < 5000;
          });
          
          // Merge: server messages + recent temp messages
          // Map server fields to client format for all server messages
          const mappedServerMessages = reversedMessages.map(msg => {
            // Chỉnh sửa edited: true khi edited = 1 (từ CASE WHEN SQL) hoặc edited_at có giá trị
            const isEdited = msg.edited === 1 || 
                           (msg.edited_at !== null && 
                            msg.edited_at !== undefined && 
                            String(msg.edited_at).trim() !== '');
            
            return {
              ...msg,
              edited: Boolean(isEdited),  // Đảm bảo là boolean
              reactions: msg.reactions ? (typeof msg.reactions === 'string' ? JSON.parse(msg.reactions) : msg.reactions) : [],
              // Ensure message_type is set (server returns message_type field)
              message_type: msg.message_type || msg.type || 'text',
              // Ensure file_url is preserved (server returns file_url for media)
              file_url: msg.file_url || null,
            };
          });
          
          const merged = [...mappedServerMessages];
          recentTempMessages.forEach(temp => {
            // Only add if not already in server data (by content)
            const exists = merged.some(m => 
              m.content === temp.content && 
              m.sender_id === temp.sender_id &&
              Math.abs(new Date(m.created_at).getTime() - new Date(temp.created_at).getTime()) < 5000
            );
            if (!exists) {
              merged.unshift(temp);
            }
          });
          return merged;
        }
        
        // No new messages from server, keep current state
        return prevMessages;
      });
    } else if (Array.isArray(conversationMessages) && conversationMessages.length === 0) {
      // Empty array from server
      setMessages((prevMessages) => {
        // If we haven't initialized yet (first mount), wait for data
        if (!hasInitializedRef.current && isLoadingMessages === false) {
          // Only reset if this is truly an empty conversation (after loading finished)
          hasInitializedRef.current = true;
          return [];
        }
        
        // If we already initialized and have messages, preserve them
        // This prevents clearing messages when navigating back and refetch returns empty (cache issue)
        if (hasInitializedRef.current && prevMessages.length > 0) {
          return prevMessages;
        }
        
        // First time, no messages
        if (prevMessages.length === 0 && !hasInitializedRef.current) {
          hasInitializedRef.current = true;
          return [];
        }
        
        return prevMessages;
      });
    }
  }, [conversationMessages, isLoadingMessages]);
  
  // Reset initialization flag when conversationId changes (navigate to different conversation)
  useEffect(() => {
    hasInitializedRef.current = false;
  }, [conversationId]);
  // No dynamic padding change to avoid jumping; keep state but not used for layout shifts
  useEffect(() => {
    const showSub = Keyboard.addListener('keyboardDidShow', () => setIsKeyboardVisible(true));
    const hideSub = Keyboard.addListener('keyboardDidHide', () => setIsKeyboardVisible(false));
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);


  // Emit viewing conversation when entering and setup socket listeners
  useEffect(() => {
    if (!socket || !conversationId || !user?.id) return;

    // Notify that user is viewing this conversation
    socket.emit('viewingConversation', {
      conversationId: conversationId,
      userId: user.id
    });

    // Cleanup when leaving conversation
    return () => {
      if (socket && conversationId && user?.id) {
        socket.emit('leftConversation', {
          conversationId: conversationId,
          userId: user.id
        });
        
        // Stop typing when leaving
        if (isTyping) {
          setIsTyping(false);
          socket.emit('stopTyping', {
            conversationId: conversationId,
            userId: user.id,
            username: user.username,
            fullName: user.full_name || user.username,
          });
        }
      }
    };
  }, [socket, conversationId, user?.id]);

  // Listen for new messages via socket and refetch when receiving
  useEffect(() => {
    if (!socket || !conversationId) return;

    const handleNewMessage = (socketMessage: any) => {
      // Socket can emit in different formats - handle both
      // Format 1: From server socket handler { senderId, message, timestamp }
      // Format 2: Full message object from API { id, content, sender_id, conversation_id, ... }
      
      let message: any = null;
      
      if (socketMessage.id && socketMessage.conversation_id) {
        // Full message object format
        message = socketMessage;
      } else if (socketMessage.senderId && socketMessage.message) {
        // Socket handler format - basic format from server
        // Create message object from basic format
        
        // If this is our own message, remove temp message and refetch to get full data
        if (String(socketMessage.senderId) === String(user?.id)) {
          setTimeout(() => {
            refetchMessages();
          }, 500);
          return;
        }
        
        // For messages from other users, create message object
        // Lấy thông tin avatar và name từ route params hoặc từ message cũ
        setMessages((prev) => {
          // Tìm message cũ của cùng sender để lấy avatar và name
          const previousMessageFromSender = prev.find(m => 
            m.sender_id === String(socketMessage.senderId) && 
            (m.avatar_url || m.full_name)
          );
          
          // Tạo message object với đầy đủ thông tin
          const messageObj = {
            id: `socket-${Date.now()}`,
            content: socketMessage.message,
            sender_id: String(socketMessage.senderId),
            conversation_id: conversationId,
            created_at: socketMessage.timestamp || new Date().toISOString(),
            type: 'text',
            status: 'read' as 'sent' | 'delivered' | 'read',
            // Lấy avatar và name từ route params trước, nếu không có thì lấy từ message cũ
            avatar_url: userAvatarUrl || previousMessageFromSender?.avatar_url || null,
            full_name: userName || previousMessageFromSender?.full_name || null,
            username: previousMessageFromSender?.username || null,
          };
          
          // Remove temp messages with same content
          const filtered = prev.filter(m => {
            const id = m?.id;
            if (!id || !String(id).startsWith('temp-')) return true;
            // Remove temp messages with same content
            if (m.content === messageObj.content && m.sender_id === messageObj.sender_id) {
              return false;
            }
            return true;
          });
          
          // Check if already exists
          const exists = filtered.some(m => 
            m.content === messageObj.content && 
            m.sender_id === messageObj.sender_id &&
            m.created_at && messageObj.created_at &&
            Math.abs(new Date(m.created_at).getTime() - new Date(messageObj.created_at).getTime()) < 5000
          );
          
          if (exists) return filtered;
          
          return [messageObj, ...filtered];
        });
        
        // Refetch after a delay to get full message data with correct avatar, name, etc. từ server
        setTimeout(() => {
          refetchMessages();
        }, 1000);
        return;
      }
      
      if (message) {
        const msgConversationId = String(message?.conversation_id || message?.conversationId || '');
        const currentConversationId = String(conversationId);
        
        if (msgConversationId === currentConversationId || message.senderId === String(user?.id)) {
          setMessages((prev) => {
            // Check if message already exists to avoid duplicates
            const exists = prev.some(m => m.id === message.id);
            if (exists) {
              return prev;
            }
            
            // Remove temporary messages with same content (from optimistic update)
            const filtered = prev.filter(m => {
              // Keep non-temp messages
              const id = m?.id;
              if (!id || !String(id).startsWith('temp-')) return true;
              // Remove temp messages with same content (our optimistic update)
              if (m.content === message.content && m.sender_id === message.sender_id) {
                return false;
              }
              return true;
            });
            
            // Đảm bảo message có đầy đủ thông tin avatar và name
            // Nếu không có, lấy từ route params hoặc từ message cũ của cùng sender
            const isOwnMessage = message.sender_id === user?.id;
            let messageAvatar = message.avatar_url;
            let messageFullName = message.full_name;
            let messageUsername = message.username;
            
            if (!isOwnMessage) {
              // Nếu là tin nhắn từ người khác và thiếu thông tin
              if (!messageAvatar || !messageFullName) {
                // Lấy từ route params trước
                if (userAvatarUrl && !messageAvatar) {
                  messageAvatar = userAvatarUrl;
                }
                if (userName && !messageFullName) {
                  messageFullName = userName;
                }
                
                // Nếu vẫn chưa có, tìm từ message cũ của cùng sender
                if (!messageAvatar || !messageFullName) {
                  const previousMessageFromSender = filtered.find(m => 
                    m.sender_id === message.sender_id && m.avatar_url
                  );
                  if (previousMessageFromSender) {
                    if (!messageAvatar) messageAvatar = previousMessageFromSender.avatar_url;
                    if (!messageFullName) messageFullName = previousMessageFromSender.full_name;
                    if (!messageUsername) messageUsername = previousMessageFromSender.username;
                  }
                }
              }
            }
            
            // Add new message at the beginning (for inverted FlatList)
            // Ensure message has status field and avatar/name info
            const messageWithStatus = {
              ...message,
              avatar_url: messageAvatar || message.avatar_url || null,
              full_name: messageFullName || message.full_name || null,
              username: messageUsername || message.username || null,
              status: (message.status || (message.sender_id === user?.id ? 'delivered' : 'read')) as 'sent' | 'delivered' | 'read'
            };
            return [messageWithStatus, ...filtered];
          });
        }
      }
    };

    // Listen for typing indicators
    const handleUserTyping = (data: any) => {
      if (data.conversationId === conversationId && data.userId !== user?.id) {
        setTypingUsers((prev) => {
          // Check if user already in list
          const exists = prev.some(u => u.userId === data.userId);
          if (exists) return prev;
          return [...prev, {
            userId: data.userId,
            username: data.username,
            full_name: data.fullName
          }];
        });
      }
    };

    const handleUserStoppedTyping = (data: any) => {
      if (data.conversationId === conversationId && data.userId !== user?.id) {
        setTypingUsers((prev) => prev.filter(u => u.userId !== data.userId));
      }
    };

    // Listen for message read status updates
    const handleMessageRead = (data: any) => {
      if (data.conversationId === conversationId) {
        setMessages((prev) => prev.map(msg => {
          if (data.messageIds && data.messageIds.includes(String(msg.id))) {
            return { ...msg, status: 'read' as const };
          }
          // If messageIds is empty, mark all messages from current user as read
          if (Array.isArray(data.messageIds) && data.messageIds.length === 0 && msg.sender_id === user?.id) {
            return { ...msg, status: 'read' as const };
          }
          return msg;
        }));
      }
    };

    const handleMessageDelivered = (data: any) => {
      if (data.conversationId === conversationId) {
        setMessages((prev) => prev.map(msg => {
          if (data.messageId && String(msg.id) === String(data.messageId)) {
            return { ...msg, status: 'delivered' as const };
          }
          return msg;
        }));
      }
    };

    // Listen for user viewing conversation (for read receipts)
    const handleUserViewingConversation = (data: any) => {
      if (data.conversationId === conversationId && data.userId === otherUserId) {
        // Mark all our messages as read when other user is viewing
        setMessages((prev) => prev.map(msg => {
          if (msg.sender_id === user?.id) {
            return { ...msg, status: 'read' as const };
          }
          return msg;
        }));
      }
    };

    // Listen for user status changes (online/offline/last_seen updates)
    const handleUserStatusChanged = (data: any) => {
      if (String(data.userId) === String(otherUserId)) {
        // Update online status
        if (data.status !== undefined) {
          const newIsOnline = data.status === 'online';
          setIsOnline(newIsOnline);
        }
        // Update last_seen when status changes (e.g., going offline)
        if (data.lastSeen) {
          // Convert to ISO string if it's a Date object
          const lastSeenValue = data.lastSeen instanceof Date 
            ? data.lastSeen.toISOString() 
            : data.lastSeen;
          setUserLastSeen(lastSeenValue);
        }
      }
    };

    // Handle message edited from real-time
    const handleMessageEdited = (data: { messageId: string; content: string; conversationId: string }) => {
      if (data.conversationId === conversationId) {
        setMessages((prev) => prev.map(msg => 
          msg.id === data.messageId 
            ? { ...msg, content: data.content, edited: true }
            : msg
        ));
      }
    };

    // Handle message deleted from real-time
    const handleMessageDeleted = (data: { messageId: string; conversationId: string }) => {
      if (data.conversationId === conversationId) {
        setMessages((prev) => prev.filter(msg => msg.id !== data.messageId));
      }
    };

    // Handle reaction updates from real-time
    const handleReactionUpdate = (data: { messageId: string; reactions: string[]; conversationId: string; userId?: string }) => {
      if (data.conversationId === conversationId) {
        // Update message reactions from socket (from other users or server sync)
        setMessages((prev) => prev.map(msg => {
          if (String(msg.id) === String(data.messageId)) {
            // Only update if reactions are different (avoid unnecessary re-renders)
            const currentReactions = msg.reactions 
              ? (typeof msg.reactions === 'string' ? JSON.parse(msg.reactions) : msg.reactions)
              : [];
            const newReactions = data.reactions || [];
            
            // Compare reactions arrays (deep comparison)
            const currentReactionsStr = JSON.stringify([...currentReactions].sort());
            const newReactionsStr = JSON.stringify([...newReactions].sort());
            const isSame = currentReactionsStr === newReactionsStr;
            
            if (!isSame) {
              // Create new object with new reactions array and timestamp to force re-render
              return { 
                ...msg, 
                reactions: [...newReactions], // New array reference
                _updated: Date.now() // Force re-render
              };
            }
          }
          return msg;
        }));
      }
    };

    socket.on('receiveMessage', handleNewMessage);
    socket.on('userTyping', handleUserTyping);
    socket.on('userStoppedTyping', handleUserStoppedTyping);
    socket.on('messageRead', handleMessageRead);
    socket.on('messageDelivered', handleMessageDelivered);
    socket.on('userViewingConversation', handleUserViewingConversation);
    socket.on('userStatusChanged', handleUserStatusChanged);
    socket.on('messageEdited', handleMessageEdited);
    socket.on('messageDeleted', handleMessageDeleted);
    socket.on('reactionUpdate', handleReactionUpdate);

    return () => {
      socket.off('receiveMessage', handleNewMessage);
      socket.off('userTyping', handleUserTyping);
      socket.off('userStoppedTyping', handleUserStoppedTyping);
      socket.off('messageRead', handleMessageRead);
      socket.off('messageDelivered', handleMessageDelivered);
      socket.off('userViewingConversation', handleUserViewingConversation);
      socket.off('userStatusChanged', handleUserStatusChanged);
      socket.off('messageEdited', handleMessageEdited);
      socket.off('messageDeleted', handleMessageDeleted);
      socket.off('reactionUpdate', handleReactionUpdate);
    };
  }, [socket, conversationId, refetchMessages, user?.id, otherUserId, queryClient]);

  const handleReply = (message: any) => {
    // Set the message to reply to
    setReplyToMessage(message);
    // Focus input after a short delay
    setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
  };

  const handleCancelReply = () => {
    setReplyToMessage(null);
    // Also cancel edit if editing
    if (editingMessage) {
      setEditingMessage(null);
      setInputText('');
    }
  };

  const handleLongPress = (message: any, position: { x: number; y: number }) => {
    setSelectedMessage(message);
    setMenuPosition(position);
    setContextMenuVisible(true);
  };

  const handleCloseContextMenu = () => {
    setContextMenuVisible(false);
    setSelectedMessage(null);
    setMenuPosition(undefined);
  };

  const handleCopy = async () => {
    if (selectedMessage?.content) {
      Clipboard.setString(selectedMessage.content);
      // You can show a toast here
    }
  };

  const handleForward = () => {
    // TODO: Implement forward functionality
  };

  const handlePin = () => {
    // TODO: Implement pin functionality
  };

  const handleSave = () => {
    // TODO: Implement save message functionality
  };

  const handleCreateTask = () => {
    // TODO: Implement create task functionality
  };

  const handleSelect = () => {
    // TODO: Implement select message functionality
  };

  const handleReaction = async (emoji: string) => {
    if (!selectedMessage || !conversationId) return;
    
    // Get current reactions
    const currentReactions = selectedMessage.reactions 
      ? (typeof selectedMessage.reactions === 'string' 
          ? JSON.parse(selectedMessage.reactions) 
          : selectedMessage.reactions)
      : [];
    
    // Toggle reaction
    const newReactions = [...currentReactions];
    const existingIndex = newReactions.indexOf(emoji);
    
    if (existingIndex > -1) {
      // Remove reaction if already exists
      newReactions.splice(existingIndex, 1);
    } else {
      // Add reaction
      newReactions.push(emoji);
    }
    
    // Optimistic update: Update local state immediately for instant UI update
    // Create new object to ensure React detects the change
    const previousReactions = [...currentReactions];
    const messageId = selectedMessage.id;
    
    setMessages((prev) => {
      const updated = prev.map(msg => {
        if (String(msg.id) === String(messageId)) {
          // Create completely new object to ensure React re-renders
          return { 
            ...msg, 
            reactions: [...newReactions], // New array reference
            // Force update by adding a timestamp to ensure re-render
            _updated: Date.now()
          };
        }
        return msg;
      });
      return updated;
    });
    
    // Also update selectedMessage immediately for context menu
    setSelectedMessage((prev) => {
      if (prev && String(prev.id) === String(messageId)) {
        return {
          ...prev,
          reactions: [...newReactions],
        };
      }
      return prev;
    });
    
    // Close context menu immediately after update
    setContextMenuVisible(false);
    
    // Emit via socket immediately to sync with other user (real-time update)
    if (socket?.connected) {
      socket.emit('reactionUpdate', {
        messageId: messageId,
        reactions: newReactions,
        conversationId: conversationId,
        userId: user?.id
      });
    }
    
    // Save to server (update database)
    try {
      await chatAPI.updateReactions(messageId, newReactions);
    } catch (error) {
      console.error('❌ Error saving reaction to server:', error);
      
      // Rollback optimistic update on error
      setMessages((prev) => prev.map(msg => {
        if (String(msg.id) === String(messageId)) {
          return { 
            ...msg, 
            reactions: [...previousReactions],
            _updated: Date.now()
          };
        }
        return msg;
      }));
      
      // Rollback selectedMessage
      setSelectedMessage((prev) => {
        if (prev && String(prev.id) === String(messageId)) {
          return {
            ...prev,
            reactions: [...previousReactions],
          };
        }
        return prev;
      });
      
      // Emit rollback via socket
      if (socket?.connected) {
        socket.emit('reactionUpdate', {
          messageId: messageId,
          reactions: previousReactions,
          conversationId: conversationId,
          userId: user?.id
        });
      }
    }
  };

  const handleEdit = () => {
    if (!selectedMessage) return;
    setEditingMessage(selectedMessage);
    setInputText(selectedMessage.content);
    // Focus input
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const handleDeleteRequest = () => {
    setDeleteDialogVisible(true);
  };

  const handleDeleteForMe = async () => {
    if (!selectedMessage || !conversationId) return;
    
    try {
      await chatAPI.deleteMessage(selectedMessage.id, false);
      
      // Remove from local state
      setMessages((prev) => prev.filter(msg => msg.id !== selectedMessage.id));
      
      // Emit via socket
      if (socket?.connected) {
        socket.emit('messageDeleted', {
          messageId: selectedMessage.id,
          conversationId: conversationId,
          deleteForEveryone: false,
        });
      }
      
      setSelectedMessage(null);
    } catch (error) {
      console.error('Error deleting message:', error);
    }
  };

  const handleDeleteForEveryone = async () => {
    if (!selectedMessage || !conversationId) return;
    
    try {
      await chatAPI.deleteMessage(selectedMessage.id, true);
      
      // Remove from local state
      setMessages((prev) => prev.filter(msg => msg.id !== selectedMessage.id));
      
      // Emit via socket
      if (socket?.connected) {
        socket.emit('messageDeleted', {
          messageId: selectedMessage.id,
          conversationId: conversationId,
          deleteForEveryone: true,
        });
      }
      
      setSelectedMessage(null);
    } catch (error) {
      console.error('Error deleting message for everyone:', error);
    }
  };

  // Handle media picker
  const handleOpenMediaPicker = () => {
    setShowMediaPicker(true);
  };

  const handleCloseMediaPicker = () => {
    setShowMediaPicker(false);
  };

  const handlePickImage = async () => {
    handleCloseMediaPicker();
    
    Alert.alert(
      'Chọn ảnh',
      'Bạn muốn chụp ảnh mới hay chọn từ thư viện?',
      [
        {
          text: 'Hủy',
          style: 'cancel',
        },
        {
          text: 'Camera',
          onPress: async () => {
            try {
              const response = await launchCamera({
                mediaType: 'photo',
                quality: 0.8,
              });
              
              if (response.assets && response.assets[0]) {
                setSelectedMedia({
                  uri: response.assets[0].uri,
                  type: 'image',
                });
              }
            } catch (error: any) {
              Alert.alert('Lỗi', 'Không thể mở camera. Vui lòng thử lại.');
            }
          },
        },
        {
          text: 'Thư viện',
          onPress: async () => {
            try {
              const response = await launchImageLibrary({
                mediaType: 'photo',
                quality: 0.8,
                selectionLimit: 1,
              });
              
              if (response.assets && response.assets[0]) {
                setSelectedMedia({
                  uri: response.assets[0].uri,
                  type: 'image',
                });
              }
            } catch (error: any) {
              Alert.alert('Lỗi', 'Không thể mở thư viện ảnh. Vui lòng thử lại.');
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

  const handlePickVideo = async () => {
    handleCloseMediaPicker();
    
    Alert.alert(
      'Chọn video',
      'Bạn muốn quay video mới hay chọn từ thư viện?',
      [
        {
          text: 'Hủy',
          style: 'cancel',
        },
        {
          text: 'Camera',
          onPress: async () => {
            try {
              const response = await launchCamera({
                mediaType: 'video',
                quality: 0.8,
              });
              
              if (response.assets && response.assets[0]) {
                const videoUri = response.assets[0].uri;
                if (videoUri) {
                  setSelectedMedia({
                    uri: videoUri,
                    type: 'video',
                  });
                }
              }
            } catch (error: any) {
              Alert.alert('Lỗi', 'Không thể mở camera. Vui lòng thử lại.');
            }
          },
        },
        {
          text: 'Thư viện',
          onPress: async () => {
            try {
              const response = await launchImageLibrary({
                mediaType: 'video',
                quality: 0.8,
                selectionLimit: 1,
              });
              
              if (response.assets && response.assets[0]) {
                const videoUri = response.assets[0].uri;
                if (videoUri) {
                  setSelectedMedia({
                    uri: videoUri,
                    type: 'video',
                  });
                }
              }
            } catch (error: any) {
              Alert.alert('Lỗi', 'Không thể mở thư viện video. Vui lòng thử lại.');
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

  // Check video duration when video is selected
  const handleVideoLoad = async () => {
    if (videoRef.current && selectedMedia?.type === 'video') {
      try {
        const status = await videoRef.current.getStatusAsync();
        if (status.isLoaded && status.durationMillis) {
          const durationSeconds = status.durationMillis / 1000;
          
          if (durationSeconds > MAX_VIDEO_DURATION) {
            Alert.alert(
              'Video quá dài',
              `Video không được vượt quá ${MAX_VIDEO_DURATION / 60} phút (${MAX_VIDEO_DURATION} giây). Video của bạn dài ${Math.round(durationSeconds)} giây.`
            );
            setSelectedMedia(null);
            return;
          }
        }
      } catch (error) {
        // Ignore errors - video might not be loaded yet
      }
    }
  };

  const handleRemoveMedia = () => {
    setSelectedMedia(null);
  };

  const handleSend = async () => {
    // Allow sending even if inputText is empty if there's media
    if (!inputText?.trim() && !selectedMedia) {
      return;
    }

    // Handle edit message (editing doesn't support media)
    if (editingMessage) {
      try {
        const response = await chatAPI.updateMessage(editingMessage.id, inputText.trim());
        const updatedMessage = response.data?.data || response.data;
        
        // Update local state with server response data
        // Khi chỉnh sửa message thành công, luôn set edited = true
        // Server đã set edited_at = CURRENT_TIMESTAMP, nên message đã được chỉnh sửa
        setMessages((prev) => prev.map(msg => 
          msg.id === editingMessage.id 
            ? { 
                ...msg, 
                content: inputText.trim(), 
                edited: true  // Luôn true vì đã chỉnh sửa thành công
              } 
            : msg
        ));
        
        // Emit via socket - use messageEdited event name to match server
        if (socket?.connected) {
          socket.emit('messageEdited', {
            messageId: editingMessage.id,
            content: inputText.trim(),
            conversationId: conversationId,
          });
        }
        
        // Clear edit state
        setEditingMessage(null);
        setInputText('');
        setReplyToMessage(null);
        return;
      } catch (error) {
        console.error('Error updating message:', error);
        return;
      }
    }
    
    if (!conversationId) {
      console.error('❌ ChatDetailScreen - Cannot send message: missing conversationId');
      return;
    }

    if (!user?.id) {
      console.error('❌ ChatDetailScreen - Cannot send message: missing user ID', { user });
      return;
    }

    let messageContent = inputText.trim() || '';
    let mediaUrl: string | undefined = undefined;
    let messageType: 'text' | 'image' | 'video' = 'text';
    const currentMedia = selectedMedia; // Store reference before upload

    // Upload media if selected
    if (currentMedia) {
      setUploadingMedia(true);
      try {
        if (currentMedia.type === 'image') {
          // Upload image
          const formData = new FormData();
          const imageType = currentMedia.uri.includes('.jpg') || currentMedia.uri.includes('.jpeg') 
            ? 'image/jpeg' 
            : currentMedia.uri.includes('.png')
            ? 'image/png'
            : 'image/jpeg';
          const imageName = currentMedia.uri.split('/').pop() || 'image.jpg';
          
          formData.append('image', {
            uri: currentMedia.uri,
            type: imageType,
            name: imageName,
          } as any);

          const uploadRes = await uploadAPI.uploadImage(formData);
          // Server returns imageUrl for /upload/image endpoint
          // Format: { success: true, imageUrl: "/uploads/image-xxx.jpg" }
          const imageUrl = uploadRes?.data?.imageUrl || uploadRes?.data?.url;
          if (imageUrl) {
            // Server returns path like "/uploads/image-xxx.jpg"
            // This will be stored in file_url field in database
            mediaUrl = imageUrl;
            messageType = 'image';
            console.log('✅ Image uploaded successfully:', {
              imageUrl,
              mediaUrl,
              response: uploadRes?.data,
            });
          } else {
            console.error('❌ Upload image response:', uploadRes?.data);
            throw new Error('Không nhận được URL ảnh từ server');
          }
        } else if (currentMedia.type === 'video') {
          // Upload video
          const formData = new FormData();
          const videoType = currentMedia.uri.includes('.mp4') ? 'video/mp4' : 'video/quicktime';
          const videoName = currentMedia.uri.split('/').pop() || 'video.mp4';
          
          formData.append('video', {
            uri: currentMedia.uri,
            type: videoType,
            name: videoName,
          } as any);

          const uploadRes = await uploadAPI.uploadVideo(formData);
          // Server returns url for /upload/video endpoint
          // Format: { success: true, url: "uploads/videos/video-xxx.mp4" }
          const videoUrl = uploadRes?.data?.url || uploadRes?.data?.videoUrl;
          if (videoUrl) {
            // Server returns path like "uploads/videos/video-xxx.mp4" (no leading slash)
            // Ensure it starts with / for consistency
            mediaUrl = videoUrl.startsWith('/') ? videoUrl : '/' + videoUrl;
            messageType = 'video';
            console.log('✅ Video uploaded successfully:', {
              videoUrl,
              mediaUrl,
              response: uploadRes?.data,
            });
          } else {
            console.error('❌ Upload video response:', uploadRes?.data);
            throw new Error('Không nhận được URL video từ server');
          }
        }
      } catch (uploadError: any) {
        setUploadingMedia(false);
        console.error('Upload media error:', {
          message: uploadError?.message,
          response: uploadError?.response?.data,
          status: uploadError?.response?.status,
        });
        const errorMessage = uploadError?.response?.data?.message 
          || uploadError?.message 
          || 'Không thể tải media lên. Vui lòng thử lại.';
        Alert.alert('Lỗi tải media', errorMessage);
        return;
      } finally {
        setUploadingMedia(false);
      }
    }

    // Format message with reply if replying
    if (replyToMessage) {
      const originalMessage = replyToMessage.content || '';
      messageContent = messageContent 
        ? `Re: ${originalMessage}\n\n${messageContent}`
        : `Re: ${originalMessage}`;
    }

    // Optimistically add message to UI with user info
    const tempMessageId = `temp-${Date.now()}`;
    // Use file_url for media (server uses file_url field)
    const optimisticMessage = {
      id: tempMessageId,
      content: messageContent || (currentMedia ? (currentMedia.type === 'image' ? '📷 Ảnh' : '🎥 Video') : ''),
      sender_id: user.id,
      conversation_id: String(conversationId),
      created_at: new Date().toISOString(),
      type: messageType,
      message_type: messageType, // Also set message_type for compatibility
      status: 'sent' as const,
      avatar_url: user.avatar_url || null,
      full_name: user.full_name || user.username || '',
      username: user.username || '',
      // Server uses file_url field, so set it here
      ...(mediaUrl && { 
        file_url: mediaUrl,
        // Also set image_url/video_url for compatibility with MessageBubble
        image_url: currentMedia?.type === 'image' ? mediaUrl : undefined, 
        video_url: currentMedia?.type === 'video' ? mediaUrl : undefined,
      }),
    };
    
    // Add optimistic message immediately
    setMessages((prev) => [optimisticMessage, ...prev]);
    setInputText('');
    setSelectedMedia(null); // Clear selected media after sending
    setReplyToMessage(null); // Clear reply after sending
    setShowEmojiPicker(false);
      
      // Stop typing when sending message
      if (isTyping && socket?.connected && conversationId) {
        setIsTyping(false);
        socket.emit('stopTyping', {
          conversationId: String(conversationId),
          userId: user?.id,
          username: user?.username,
          fullName: user?.full_name || user?.username,
        });
      }
      
      // Clear typing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = null;
      }

    try {
      // ALWAYS send via API first to save to database (like PWA client)
      const apiResponse = await chatAPI.sendMessage(
        String(conversationId), 
        messageContent || (currentMedia ? (currentMedia.type === 'image' ? '📷 Ảnh' : '🎥 Video') : ''), 
        messageType,
        mediaUrl
      );

      // Server returns messageId, but we need to refetch to get full message with file_url
      // Update optimistic message status and ensure file_url is set
      setMessages((prev) => prev.map(msg => {
        const id = msg?.id;
        if (id && String(id) === tempMessageId) {
          return { 
            ...msg, 
            status: 'delivered' as const,
            // Ensure file_url is set (it should already be set, but double-check)
            file_url: mediaUrl || msg.file_url,
            message_type: messageType, // Ensure message_type is set
          };
        }
        return msg;
      }));
      
      // Refetch messages after a short delay to get the real message from server
      // This ensures we have the correct message with file_url from database
      setTimeout(() => {
        refetchMessages().catch((err) => {
          console.error('❌ Error refetching messages after send:', err);
        });
      }, 500);

      // Then emit via socket for real-time delivery (if socket connected)
      // This matches PWA client behavior
      if (socket?.connected && otherUserId) {
        socket.emit('sendMessage', {
          receiverId: String(otherUserId),
          message: messageContent,
          senderId: String(user.id),
          conversationId: String(conversationId)
        });
      } else {
        // If socket not available, refetch after a delay to get the real message
        setTimeout(() => {
          refetchMessages().catch((err) => {
            console.error('❌ Error refetching messages:', err);
          });
        }, 1000);
      }

      // NOTE: We DON'T refetch immediately like before
      // The optimistic message will be replaced when:
      // 1. Socket listener receives the message (for other user)
      // 2. Or when we receive our own message via socket/refetch
      // Status will update to 'read' when other user views the conversation (via socket listener)
      
    } catch (error: any) {
      // Remove optimistic message on error
      setMessages((prev) => {
        const filtered = prev.filter(m => {
          const id = m?.id;
          return !id || String(id) !== tempMessageId;
        });
        return filtered;
      });
      
      // Restore input text
      setInputText(messageContent);
      
      // Show error to user (you can use toast/alert here)
      // Alert.alert('Lỗi', 'Không thể gửi tin nhắn. Vui lòng thử lại.');
    }
  };

  const toggleEmojiPicker = () => {
    if (showEmojiPicker) {
      setShowEmojiPicker(false);
      // reopen keyboard
      setTimeout(() => inputRef.current?.focus(), 0);
    } else {
      setShowEmojiPicker(true);
      Keyboard.dismiss();
    }
  };

  const addEmoji = (emoji: string) => {
    setInputText((prev) => prev + emoji);
  };

  // Basic emoji data grouped by categories (expandable)
  const EMOJI_CATEGORIES: { key: string; label: string; emojis: string[] }[] = [
    { key: 'Smileys', label: '🙂', emojis: ['😀','😁','😂','🤣','😊','😍','😘','😜','😎','😢','😭','😡','🤔','🤗','🤩','😴','😇','🤤','😱','🤯','🙄','😏','😌','🥰','🤪','🥳'] },
    { key: 'Gestures', label: '👍', emojis: ['👍','👎','👌','✌️','🤞','🤟','🤘','👏','🙌','🙏','👋','🤙','💪','👐','✋','👉','👈','👆','👇'] },
    { key: 'Animals', label: '🐶', emojis: ['🐶','🐱','🐭','🐹','🐰','🦊','🐻','🐼','🐨','🐯','🦁','🐮','🐷','🐸','🐵','🐔','🐧','🐦','🐤'] },
    { key: 'Food', label: '🍔', emojis: ['🍏','🍎','🍌','🍉','🍓','🍒','🍍','🥭','🍑','🍅','🥕','🍆','🌽','🥔','🍞','🧀','🍗','🍣','🍕'] },
    { key: 'Activities', label: '⚽', emojis: ['⚽','🏀','🏈','⚾','🎾','🏐','🏉','🎱','🏓','🏸','🥊','🥋','🎮','🎲','🎯','🎤','🎧','🎵','🎷'] },
    { key: 'Travel', label: '🚗', emojis: ['🚗','🚕','🚌','🚎','🏎️','🚓','🚑','🚒','🚲','🛴','🛵','🏍️','✈️','🛩️','🚀','🚢','⛵','🚁'] },
    { key: 'Objects', label: '💡', emojis: ['💡','📱','💻','⌚','🖥️','🖨️','📷','🎥','🔦','📺','📚','🖊️','📝','📎','🔒','🔑','🛠️','⚙️'] },
    { key: 'Symbols', label: '❤️', emojis: ['❤️','🧡','💛','💚','💙','💜','🖤','🤍','🤎','💔','❣️','💕','💞','💓','💗','💖','💘','💝'] },
  ];
  const currentCategory = EMOJI_CATEGORIES.find(c => c.key === activeEmojiCategory) || EMOJI_CATEGORIES[0];

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      // Use header height to ensure proper lift above keyboard
      keyboardVerticalOffset={headerHeight}
    >
      <Appbar.Header style={{ backgroundColor: colors.background, elevation: 0 }}>
        <Appbar.BackAction color={colors.text} onPress={() => navigation.goBack()} />
        <View style={styles.headerInfoContainer}>
          <View style={styles.avatarWrapper}>
            {userAvatarUrl ? (
              <Avatar.Image
                size={36}
                source={{ uri: getAvatarURL(userAvatarUrl) }}
                style={{ backgroundColor: colors.primary }}
              />
            ) : (
              <Avatar.Text
                size={36}
                label={(userName || 'U').substring(0, 1).toUpperCase()}
                style={{ backgroundColor: colors.primary }}
              />
            )}
            {/* Only show green dot when online (like Facebook), hide when offline */}
            {isOnline && (
              <View style={[
                styles.statusDot, 
                { 
                  backgroundColor: '#10b981',
                  borderColor: colors.background 
                }
              ]} />
            )}
          </View>
          <TouchableOpacity 
            style={{ marginLeft: 10, flex: 1 }}
            onPress={() => {
              setSelectedUserForProfile({
                userId: otherUserId,
                userName: userName,
                userAvatar: userAvatarUrl,
                isOwnProfile: otherUserId === user?.id,
              });
              setShowUserProfileModal(true);
            }}
            activeOpacity={0.7}
          >
            <Text numberOfLines={1} style={[styles.headerName, { color: colors.text }]}>
              {userName || 'Chat'}
            </Text>
            {/* Show status like Facebook: "Đang hoạt động" when online, "Hoạt động X trước" when offline but recent */}
            {isOnline ? (
              <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
                Đang hoạt động
              </Text>
            ) : userLastSeen && isRecentActivity(userLastSeen) ? (
              <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
                Hoạt động {getTimeAgo(userLastSeen)}
              </Text>
            ) : null}
          </TouchableOpacity>
        </View>
        <IconButton 
          icon="phone" 
          iconColor={socket?.connected ? colors.text : colors.textSecondary} 
          disabled={!socket?.connected}
          onPress={async () => {
            if (!conversationId || !otherUserId) {
              return;
            }

            // Check socket connection before navigating
            if (!socket) {
              Alert.alert(
                'Không thể kết nối',
                'Socket chưa được khởi tạo. Vui lòng đợi một chút và thử lại.',
                [{ text: 'OK' }]
              );
              return;
            }

            if (!socket.connected) {
              Alert.alert(
                'Không thể kết nối',
                'Đang kết nối với server...\n\nVui lòng:\n1. Kiểm tra kết nối mạng\n2. Đợi một chút và thử lại\n3. Đảm bảo server đang chạy',
                [
                  { text: 'Thử lại', onPress: () => {
                    // Force socket reconnect
                    if (socket && !socket.connected) {
                      socket.connect();
                    }
                    // Try again after a delay
                    setTimeout(() => {
                      if (socket?.connected) {
                        navigation.navigate('VideoCall', {
                          conversationId: String(conversationId),
                          userName: userName || 'Người dùng',
                          otherUserId: String(otherUserId),
                          isVideo: false,
                          userAvatarUrl: userAvatarUrl,
                        });
                      }
                    }, 2000);
                  }},
                  { text: 'Hủy', style: 'cancel' }
                ]
              );
              return;
            }

            navigation.navigate('VideoCall', {
              conversationId: String(conversationId),
              userName: userName || 'Người dùng',
              otherUserId: String(otherUserId),
              isVideo: false,
              userAvatarUrl: userAvatarUrl,
            });
          }} 
        />
        <IconButton 
          icon="video" 
          iconColor={socket?.connected ? colors.text : colors.textSecondary} 
          disabled={!socket?.connected}
          onPress={async () => {
            if (!conversationId || !otherUserId) {
              return;
            }

            // Check socket connection before navigating
            if (!socket) {
              Alert.alert(
                'Không thể kết nối',
                'Socket chưa được khởi tạo. Vui lòng đợi một chút và thử lại.',
                [{ text: 'OK' }]
              );
              return;
            }

            if (!socket.connected) {
              Alert.alert(
                'Không thể kết nối',
                'Đang kết nối với server...\n\nVui lòng:\n1. Kiểm tra kết nối mạng\n2. Đợi một chút và thử lại\n3. Đảm bảo server đang chạy',
                [
                  { text: 'Thử lại', onPress: () => {
                    // Force socket reconnect
                    if (socket && !socket.connected) {
                      socket.connect();
                    }
                    // Try again after a delay
                    setTimeout(() => {
                      if (socket?.connected) {
                        navigation.navigate('VideoCall', {
                          conversationId: String(conversationId),
                          userName: userName || 'Người dùng',
                          otherUserId: String(otherUserId),
                          isVideo: true,
                          userAvatarUrl: userAvatarUrl,
                        });
                      }
                    }, 2000);
                  }},
                  { text: 'Hủy', style: 'cancel' }
                ]
              );
              return;
            }

            navigation.navigate('VideoCall', {
              conversationId: String(conversationId),
              userName: userName || 'Người dùng',
              otherUserId: String(otherUserId),
              isVideo: true,
              userAvatarUrl: userAvatarUrl,
            });
          }} 
        />
      </Appbar.Header>

      {/* Reply Bar - shown below header when replying */}
      {replyToMessage && (
        <ReplyBar replyMessage={replyToMessage} onCancel={handleCancelReply} />
      )}
      {editingMessage && !replyToMessage && (
        <View style={[
          styles.editIndicator,
          {
            backgroundColor: colors.surface,
            borderTopColor: colors.border,
          },
        ]}>
          <MaterialCommunityIcons name="pencil" size={20} color={colors.textSecondary} style={styles.editIcon} />
          <View style={styles.editContent}>
            <Text style={[styles.editingText, { color: colors.textSecondary }]}>Đang chỉnh sửa</Text>
            <Text style={[styles.editMessageContent, { color: colors.text }]} numberOfLines={1}>
              {editingMessage.content}
            </Text>
          </View>
          <TouchableOpacity onPress={handleCancelReply} style={styles.editCloseButton}>
            <MaterialCommunityIcons name="close-circle" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>
      )}

      {!conversationId ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 }}>
          <Text variant="bodyMedium" style={{ color: colors.textSecondary }}>
            Không tìm thấy cuộc trò chuyện
          </Text>
        </View>
      ) : (
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item, index) => {
          // Include _updated timestamp in key to force re-render when reactions change
          const baseKey = item?.id ? String(item.id) : `msg-${index}`;
          const updateKey = item?._updated ? `-${item._updated}` : '';
          return `${baseKey}${updateKey}`;
        }}
        extraData={messages} // Force re-render when messages array changes
        removeClippedSubviews={false}
        maxToRenderPerBatch={10}
        updateCellsBatchingPeriod={50}
        initialNumToRender={15}
        windowSize={10}
        renderItem={({ item, index }) => {
          // Since FlatList is inverted, messages are displayed from bottom to top
          // Messages array is: [newest, ..., oldest] (for inverted FlatList)
          // Index 0 = newest message (at bottom visually)
          // Index length-1 = oldest message (at top visually)
          
          // For date separator: we compare with the PREVIOUS message (which comes AFTER in array due to inversion)
          // Previous message in array = next message visually (below)
          // Next message in array = previous message visually (above)
          
          const nextMessageInArray = index > 0 ? messages[index - 1] : null; // Message below (newer)
          const prevMessageInArray = index < messages.length - 1 ? messages[index + 1] : null; // Message above (older)
          
          // Show avatar if it's the first message in a group (previous message has different sender)
          const showAvatar = !prevMessageInArray || prevMessageInArray.sender_id !== item.sender_id;
          
          // Show time if:
          // 1. It's the last message in the group (next message has different sender)
          // 2. Time difference is more than 2 minutes
          const showTime = !nextMessageInArray || 
            nextMessageInArray.sender_id !== item.sender_id ||
            (nextMessageInArray.created_at && item.created_at && 
             new Date(nextMessageInArray.created_at).getTime() - new Date(item.created_at).getTime() > 2 * 60 * 1000);
          
          // Show date separator if this is the first message or different day from previous message
          // Previous message in array = message above (older), so we compare with that
          const showDateSeparator = !prevMessageInArray || 
            isDifferentDay(prevMessageInArray.created_at, item.created_at);

          return (
            <React.Fragment key={item.id}>
              {showDateSeparator && (
                <View style={styles.dateSeparator}>
                  <View style={[styles.dateSeparatorLine, { backgroundColor: colors.border }]} />
                  <View style={[
                    styles.dateSeparatorTextContainer,
                    { 
                      backgroundColor: isDarkMode ? colors.surface : colors.background,
                      borderColor: colors.border 
                    }
                  ]}>
                    <Text style={[styles.dateSeparatorText, { color: colors.textSecondary }]}>
                      {formatDate(item.created_at)}
                    </Text>
                  </View>
                  <View style={[styles.dateSeparatorLine, { backgroundColor: colors.border }]} />
                </View>
              )}
              <MessageBubble
                message={item}
                currentUserId={user?.id || ''}
                currentUserAvatar={user?.avatar_url}
                currentUserName={user?.full_name || user?.username}
                showAvatar={showAvatar}
                showTime={showTime}
                onReply={handleReply}
                onLongPress={handleLongPress}
              />
            </React.Fragment>
          );
        }}
        inverted={true as boolean}
        style={[styles.messages, { backgroundColor: colors.background }]}
        contentContainerStyle={[
          styles.messagesContent,
          // Keep a stable bottom space equal to input bar height to avoid layout jump
          { paddingBottom: inputBarHeight + (showEmojiPicker ? emojiPanelHeight : 0) },
        ]}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
        // Prevent iOS from adding automatic keyboard insets that can cause a visible scroll/jump
        automaticallyAdjustKeyboardInsets={false}
        // Optimize for smooth gestures
        scrollEventThrottle={16}
        nestedScrollEnabled={true}
        ListFooterComponent={
          typingUsers.length > 0 ? (
            <TypingIndicator typingUsers={typingUsers} userName={userName} />
          ) : null
        }
        ListEmptyComponent={
          isLoadingMessages || isRefetchingMessages ? (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 }}>
              <ActivityIndicator size="large" color={colors.primary || '#0084ff'} />
              <Text variant="bodyMedium" style={{ color: colors.textSecondary, marginTop: 16 }}>
                Đang tải tin nhắn...
              </Text>
            </View>
          ) : isMessagesError ? (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 }}>
              <MaterialCommunityIcons 
                name="alert-circle-outline" 
                size={48} 
                color={colors.error || '#e74c3c'} 
              />
              <Text variant="bodyLarge" style={{ color: colors.error || '#e74c3c', marginTop: 16, textAlign: 'center', fontWeight: '600' }}>
                Không thể tải tin nhắn
              </Text>
              <Text variant="bodyMedium" style={{ color: colors.textSecondary, marginTop: 8, textAlign: 'center' }}>
                {messagesError instanceof Error 
                  ? messagesError.message 
                  : 'Đã xảy ra lỗi khi tải tin nhắn. Vui lòng thử lại.'}
              </Text>
              <TouchableOpacity
                onPress={() => refetchMessages()}
                style={{
                  marginTop: 24,
                  paddingHorizontal: 24,
                  paddingVertical: 12,
                  backgroundColor: colors.primary || '#0084ff',
                  borderRadius: 8,
                }}
                activeOpacity={0.7}
              >
                <Text style={{ color: '#FFFFFF', fontWeight: '600' }}>
                  Thử lại
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 }}>
              <Text variant="bodyMedium" style={{ color: colors.textSecondary }}>
                Chưa có tin nhắn nào
              </Text>
            </View>
          )
        }
      />
      )}

      <View
        style={[
          styles.inputContainer,
          {
            backgroundColor: 'transparent',
            borderTopWidth: 0,
            paddingBottom: Math.max(insets.bottom, 6),
          },
        ]}
        onLayout={(e) => {
          const h = e.nativeEvent.layout.height;
          if (h && Math.abs(h - inputBarHeight) > 1) setInputBarHeight(h);
        }}
      >
        {/* Media Preview - Facebook style: compact thumbnail */}
        {selectedMedia && (
          <View style={[styles.mediaPreviewContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.mediaPreviewThumbnail}>
              {selectedMedia.type === 'image' ? (
                <Image
                  source={{ uri: selectedMedia.uri }}
                  style={styles.mediaPreviewThumbnailImage}
                  resizeMode="cover"
                />
              ) : (
                <View style={styles.mediaPreviewThumbnailVideo}>
                  <Video
                    ref={videoRef}
                    source={{ uri: selectedMedia.uri }}
                    style={styles.mediaPreviewThumbnailVideoPlayer}
                    resizeMode={ResizeMode.COVER}
                    shouldPlay={false}
                    useNativeControls={false}
                    onLoad={handleVideoLoad}
                  />
                  <View style={styles.mediaPreviewVideoOverlay}>
                    <MaterialCommunityIcons name="play-circle" size={24} color="#FFFFFF" />
                  </View>
                  <View style={styles.mediaPreviewVideoLabel}>
                    <MaterialCommunityIcons name="video" size={10} color="#FFFFFF" />
                    <Text style={styles.mediaPreviewVideoLabelText}>Video</Text>
                  </View>
                </View>
              )}
              {uploadingMedia && (
                <View style={styles.mediaPreviewUploadingOverlay}>
                  <ActivityIndicator size="small" color="#FFFFFF" />
                </View>
              )}
            </View>
            <View style={styles.mediaPreviewInfo}>
              <Text style={[styles.mediaPreviewInfoText, { color: colors.text }]} numberOfLines={1}>
                {selectedMedia.type === 'image' ? 'Ảnh' : 'Video'}
              </Text>
              {uploadingMedia && (
                <Text style={[styles.mediaPreviewInfoSubtext, { color: colors.textSecondary }]} numberOfLines={1}>
                  Đang tải lên...
                </Text>
              )}
            </View>
            <TouchableOpacity
              style={[styles.mediaPreviewCloseBtn, { borderColor: colors.border }]}
              onPress={handleRemoveMedia}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons name="close" size={16} color={colors.text} />
            </TouchableOpacity>
          </View>
        )}

        {/* Input bar row */}
        <View style={styles.inputBarRow}>
          {/* Left plus icon with circular bg */}
          <View style={[
            styles.circleBtn, 
            { backgroundColor: isDarkMode ? '#2a2a2b' : '#e0e0e0' }
          ]}> 
            <IconButton 
              icon="plus" 
              iconColor={colors.textSecondary} 
              size={22} 
              onPress={handleOpenMediaPicker} 
            />
          </View>
          {/* Input wrapper with emoji toggle inside */}
          <View style={[
            styles.inputWrapper,
            { backgroundColor: isDarkMode ? '#2a2a2b' : '#f0f0f0' }
          ]}>
          <TextInput
            ref={inputRef}
            style={[styles.input, { color: colors.text }]}
            value={inputText}
            onChangeText={(text) => {
              setInputText(text);
              
              // Handle typing indicator
              if (!isTyping && text.length > 0 && socket?.connected && conversationId) {
                setIsTyping(true);
                socket.emit('typing', {
                  conversationId: String(conversationId),
                  userId: user?.id,
                  username: user?.username,
                  fullName: user?.full_name || user?.username,
                  isTyping: true,
                });
              }
              
              // Clear existing timeout
              if (typingTimeoutRef.current) {
                clearTimeout(typingTimeoutRef.current);
              }
              
              // Set timeout to stop typing after 2 seconds of inactivity
              typingTimeoutRef.current = setTimeout(() => {
                if (isTyping && socket?.connected && conversationId) {
                  setIsTyping(false);
                  socket.emit('stopTyping', {
                    conversationId: String(conversationId),
                    userId: user?.id,
                    username: user?.username,
                    fullName: user?.full_name || user?.username,
                  });
                }
              }, 2000);
            }}
            onSubmitEditing={() => {
              // Send message when pressing Enter/Return (only if no line break)
              if (inputText.trim() && !inputText.includes('\n')) {
                handleSend();
              }
            }}
            blurOnSubmit={false}
            returnKeyType="send"
            placeholder={editingMessage ? "Chỉnh sửa tin nhắn..." : "Tin nhắn"}
            placeholderTextColor={colors.textSecondary}
            multiline
            maxLength={1000}
            onFocus={() => setShowEmojiPicker(false)}
            textAlignVertical="center"
          />
          <TouchableOpacity onPress={toggleEmojiPicker} style={styles.inlineIconBtn}>
            <IconButton
              icon={showEmojiPicker ? 'keyboard-outline' : 'emoticon-outline'}
              iconColor={colors.textSecondary}
              size={22}
              onPress={toggleEmojiPicker}
            />
          </TouchableOpacity>
        </View>
        {/* Right: mic when empty, send when has text or media */}
        {Boolean(inputText.trim() || selectedMedia) ? (
          <TouchableOpacity
            style={[styles.circleBtn, { backgroundColor: colors.primary }]}
            onPress={() => {
              handleSend();
            }}
            activeOpacity={0.7}
          >
            <IconButton 
              icon={editingMessage ? "check" : "send"} 
              iconColor="#ffffff" 
              size={22} 
              onPress={(e) => {
                e?.stopPropagation?.();
                handleSend();
              }} 
            />
          </TouchableOpacity>
        ) : (
          <View style={[
            styles.circleBtn, 
            { backgroundColor: isDarkMode ? '#2a2a2b' : '#e0e0e0' }
          ]}> 
            <IconButton 
              icon="microphone" 
              iconColor={colors.textSecondary} 
              size={22} 
              onPress={() => {
                // TODO: Implement voice message recording
              }} 
            />
          </View>
        )}
        </View>
      </View>

      {/* Simple Emoji panel */}
      {showEmojiPicker && (
        <View
          style={[
            styles.emojiPanel,
            {
              backgroundColor: colors.surface,
              borderTopColor: colors.border,
            }
          ]}
          onLayout={(e) => setEmojiPanelHeight(Math.round(e.nativeEvent.layout.height))}
        >
          {/* Tabs: Sticker | Emoji | GIFs */}
          <View style={[styles.emojiTabs, { borderBottomColor: colors.border }]}>
            {[
              { key: 'sticker', label: 'Sticker' },
              { key: 'emoji', label: 'Emoji' },
              { key: 'gif', label: 'GIFs' },
            ].map((t: any) => (
              <TouchableOpacity 
                key={t.key} 
                onPress={() => setActiveEmojiTab(t.key)} 
                style={[
                  styles.emojiTab,
                  { backgroundColor: isDarkMode ? '#2a2a2b' : '#e0e0e0' },
                  activeEmojiTab === t.key && { 
                    backgroundColor: isDarkMode ? '#3a3a3b' : '#d0d0d0' 
                  }
                ]}
              >
                <Text style={[
                  styles.emojiTabText,
                  { color: colors.textSecondary },
                  activeEmojiTab === t.key && {
                    color: colors.text,
                    fontWeight: '600',
                  }
                ]}>
                  {t.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {activeEmojiTab === 'emoji' && (
            <>
              <View style={styles.emojiCategoryRow}>
                {EMOJI_CATEGORIES.map((c) => (
                  <TouchableOpacity 
                    key={c.key} 
                    onPress={() => setActiveEmojiCategory(c.key)} 
                    style={[
                      styles.emojiCategoryBtn,
                      { backgroundColor: isDarkMode ? '#2a2a2b' : '#e0e0e0' },
                      activeEmojiCategory === c.key && { 
                        backgroundColor: isDarkMode ? '#3a3a3b' : '#d0d0d0' 
                      }
                    ]}
                  >
                    <Text style={[
                      styles.emojiCategoryText,
                      { color: colors.textSecondary },
                      activeEmojiCategory === c.key && {
                        color: colors.text,
                        fontWeight: '600',
                      }
                    ]}>
                      {c.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              <View style={styles.emojiGrid}>
                {currentCategory.emojis.map((e) => (
                  <TouchableOpacity key={e} onPress={() => addEmoji(e)} style={styles.emojiItem}>
                    <Text style={{ fontSize: 28 }}>{e}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </>
          )}

          {activeEmojiTab === 'sticker' && (
            <View style={styles.centeredPanel}>
              <Text variant="bodyMedium" style={{ color: colors.textSecondary }}>
                Sticker: đang cập nhật
              </Text>
            </View>
          )}
          {activeEmojiTab === 'gif' && (
            <View style={styles.centeredPanel}>
              <Text variant="bodyMedium" style={{ color: colors.textSecondary }}>
                GIFs: đang cập nhật
              </Text>
            </View>
          )}
        </View>
      )}

      {/* Context Menu */}
        <MessageContextMenu
        visible={contextMenuVisible}
        message={selectedMessage}
        position={menuPosition}
        isOwn={selectedMessage?.sender_id === user?.id}
        onClose={handleCloseContextMenu}
        onReply={() => {
          if (selectedMessage) {
            handleReply(selectedMessage);
          }
        }}
        onForward={handleForward}
        onCopy={handleCopy}
        onPin={handlePin}
        onSave={handleSave}
        onCreateTask={handleCreateTask}
        onSelect={handleSelect}
        onReaction={handleReaction}
        onEdit={handleEdit}
        onDeleteRequest={handleDeleteRequest}
      />

      {/* Delete Message Dialog */}
      <DeleteMessageDialog
        visible={deleteDialogVisible}
        onClose={() => setDeleteDialogVisible(false)}
        onDeleteForMe={handleDeleteForMe}
        onDeleteForEveryone={handleDeleteForEveryone}
      />

      {/* User Profile Modal */}
      <UserProfileModal
        visible={showUserProfileModal}
        onClose={() => {
          setShowUserProfileModal(false);
          setSelectedUserForProfile(null);
        }}
        userId={selectedUserForProfile?.userId}
        userName={selectedUserForProfile?.userName}
        userAvatar={selectedUserForProfile?.userAvatar}
        isOwnProfile={selectedUserForProfile?.isOwnProfile}
      />

      {/* Media Picker Modal */}
      <Modal
        visible={showMediaPicker}
        transparent={true}
        animationType="slide"
        onRequestClose={handleCloseMediaPicker}
        statusBarTranslucent={true}
      >
        <Pressable
          style={[styles.modalOverlay, { backgroundColor: 'rgba(0, 0, 0, 0.5)' }]}
          onPress={handleCloseMediaPicker}
        >
          <Pressable 
            style={[styles.mediaPickerContainer, { backgroundColor: colors.surface }]}
            onPress={() => {}}
          >
            <View style={[styles.mediaPickerHandle, { backgroundColor: colors.border }]} />
            <View style={styles.mediaPickerContent}>
              <TouchableOpacity
                style={[styles.mediaPickerOption, { borderBottomColor: colors.border }]}
                onPress={handlePickImage}
                activeOpacity={0.7}
              >
                <MaterialCommunityIcons name="image-outline" size={24} color={colors.text} />
                <Text style={[styles.mediaPickerOptionText, { color: colors.text }]}>
                  Chọn ảnh
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.mediaPickerOption}
                onPress={handlePickVideo}
                activeOpacity={0.7}
              >
                <MaterialCommunityIcons name="video-outline" size={24} color={colors.text} />
                <Text style={[styles.mediaPickerOptionText, { color: colors.text }]}>
                  Chọn video
                </Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

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
    paddingVertical: 8,
  },
  dateSeparator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 16,
    paddingHorizontal: 16,
  },
  dateSeparatorLine: {
    flex: 1,
    height: 1,
  },
  dateSeparatorTextContainer: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  dateSeparatorText: {
    fontSize: 13,
    fontWeight: '500',
  },
  editIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderTopWidth: 1,
    gap: 12,
  },
  editIcon: {
    marginRight: 4,
  },
  editContent: {
    flex: 1,
    minWidth: 0,
  },
  editingText: {
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 2,
  },
  editMessageContent: {
    fontSize: 13,
  },
  editCloseButton: {
    padding: 4,
  },
  inputContainer: {
    flexDirection: 'column',
    paddingHorizontal: 8,
    paddingVertical: 8,
    borderTopWidth: 1,
    gap: 8,
  },
  inputBarRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
  },
  input: {
    flex: 1,
    minHeight: 46,
    maxHeight: 120,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
  },
  inputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 46,
    maxHeight: 120,
    paddingLeft: 12,
    borderRadius: 22,
    marginHorizontal: 8,
  },
  inlineIconBtn: {
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emojiPanel: {
    minHeight: 260,
    borderTopWidth: 1,
  },
  emojiTabs: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  emojiTab: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
  },
  emojiTabText: {
    fontSize: 13,
  },
  emojiCategoryRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 8,
    paddingTop: 8,
  },
  emojiCategoryBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    marginRight: 8,
    marginBottom: 8,
  },
  emojiCategoryText: {
    fontSize: 12,
  },
  emojiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  emojiItem: {
    width: '12.5%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
  },
  centeredPanel: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
  },
  emojiRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 8,
    paddingVertical: 6,
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
  headerInfoContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerName: {
    fontSize: 16,
    fontWeight: '600',
    maxWidth: 200,
  },
  headerSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  avatarWrapper: {
    position: 'relative',
  },
  statusDot: {
    position: 'absolute',
    right: -1,
    bottom: -1,
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 2,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  mediaPickerContainer: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 8,
    paddingBottom: 32,
    maxHeight: 300,
  },
  mediaPickerHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  mediaPickerContent: {
    paddingHorizontal: 16,
  },
  mediaPickerOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 12,
  },
  mediaPickerOptionText: {
    fontSize: 16,
    fontWeight: '500',
  },
  // Facebook-style compact media preview
  mediaPreviewContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 12,
    marginBottom: 8,
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    gap: 10,
    maxWidth: '100%',
  },
  mediaPreviewThumbnail: {
    width: 50,
    height: 50,
    borderRadius: 6,
    overflow: 'hidden',
    backgroundColor: '#000',
    position: 'relative',
    flexShrink: 0,
  },
  mediaPreviewThumbnailImage: {
    width: '100%',
    height: '100%',
  },
  mediaPreviewThumbnailVideo: {
    width: '100%',
    height: '100%',
    position: 'relative',
  },
  mediaPreviewThumbnailVideoPlayer: {
    width: '100%',
    height: '100%',
  },
  mediaPreviewVideoOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  mediaPreviewVideoLabel: {
    position: 'absolute',
    bottom: 2,
    left: 2,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 3,
    gap: 3,
  },
  mediaPreviewVideoLabelText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '600',
  },
  mediaPreviewInfo: {
    flex: 1,
    minWidth: 0,
    justifyContent: 'center',
    gap: 2,
  },
  mediaPreviewInfoText: {
    fontSize: 14,
    fontWeight: '500',
  },
  mediaPreviewInfoSubtext: {
    fontSize: 12,
  },
  mediaPreviewCloseBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    flexShrink: 0,
    backgroundColor: 'transparent',
  },
  mediaPreviewUploadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default ChatDetailScreen;
