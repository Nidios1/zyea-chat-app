import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import { FiSend, FiImage, FiSmile, FiPhone, FiVideo, FiArrowLeft, FiMic, FiPlus, FiMoreVertical } from 'react-icons/fi';
import MessageList from '../Shared/Chat/MessageList';
import TypingIndicator from '../Shared/Chat/TypingIndicator';
import ImageUpload from '../Shared/Chat/ImageUpload';
import EmojiPicker, { EmojiToggleButton } from '../Shared/Chat/EmojiPicker';
import ChatOptionsMenu from '../Shared/Chat/ChatOptionsMenu';
import MobileUserProfile from './MobileUserProfile';
import VideoCall from '../Shared/Chat/VideoCall';
import PermissionRequest from '../Shared/Chat/PermissionRequest';
import ReplyBar from '../Shared/Chat/ReplyBar';
import EditBar from '../Shared/Chat/EditBar';
import { chatAPI } from '../../utils/api';
import { getInitials } from '../../utils/nameUtils';
import { getAvatarURL } from '../../utils/imageUtils';
import useKeyboard from '../../hooks/useKeyboard';

// 📱 MOBILE-ONLY STYLES - No media queries needed!

const MobileChatContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100vh;
  height: 100dvh; /* Dynamic viewport - excludes keyboard */
  background: var(--bg-primary, #000000);
  overflow: hidden;
  position: relative;
  width: 100%;
`;

const MobileHeader = styled.div`
  background: var(--bg-primary, white);
  padding: 0.75rem;
  padding-top: calc(0.75rem + env(safe-area-inset-top, 0px));
  display: flex;
  align-items: center;
  gap: 0.75rem;
  border-bottom: 1px solid var(--border-color, #e1e5e9);
  flex-shrink: 0;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
`;

const BackButton = styled.button`
  background: none;
  border: none;
  padding: 0.5rem;
  color: var(--text-primary, #333);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: background 0.2s ease;
  min-width: 44px;
  min-height: 44px;
  -webkit-tap-highlight-color: transparent;

  &:active {
    background: var(--bg-secondary, #f0f0f0);
    transform: scale(0.95);
  }
`;

const UserInfo = styled.div`
  flex: 1;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  min-width: 0;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;

  &:active {
    opacity: 0.7;
  }
`;

const Avatar = styled.div`
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: ${props => props.color || '#0084ff'};
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 600;
  font-size: 18px;
  flex-shrink: 0;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
  position: relative;
`;

const OnlineIndicator = styled.div`
  position: absolute;
  bottom: 0;
  right: 0;
  width: 12px;
  height: 12px;
  background: #10b981;
  border: 2px solid white;
  border-radius: 50%;
`;

const UserDetails = styled.div`
  flex: 1;
  min-width: 0;
`;

const UserName = styled.div`
  font-weight: 600;
  font-size: 16px;
  color: var(--text-primary, #333);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const UserStatus = styled.div`
  font-size: 13px;
  color: var(--text-secondary, #666);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const HeaderActions = styled.div`
  display: flex;
  gap: 0.5rem;
  flex-shrink: 0;
`;

const ActionButton = styled.button`
  background: none;
  border: none;
  padding: 0.5rem;
  color: var(--primary-color, #0084ff);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: all 0.2s ease;
  min-width: 44px;
  min-height: 44px;
  -webkit-tap-highlight-color: transparent;

  &:active {
    background: var(--bg-secondary, #f0f0f0);
    transform: scale(0.95);
  }
`;

const MessagesContainer = styled.div`
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 0.75rem;
  background: var(--bg-secondary, #f0f2f5);
  position: relative;
  scroll-behavior: smooth;
  display: flex;
  flex-direction: column;
  -webkit-overflow-scrolling: touch;
  overscroll-behavior: contain;
  /* CRITICAL: padding-bottom để tin nhắn không bị che bởi input + keyboard */
  padding-bottom: calc(85px + ${props => props.keyboardHeight || 0}px + env(safe-area-inset-bottom, 0px));
  /* Smooth transition khi keyboard xuất hiện */
  transition: padding-bottom 0.3s cubic-bezier(0.4, 0, 0.2, 1);

  &::-webkit-scrollbar {
    display: none;
  }
`;

const TypingWrapper = styled.div`
  position: sticky;
  bottom: 0;
  background: var(--bg-secondary, #f0f2f5);
  padding: 0.5rem 0;
  margin-top: auto;
  z-index: 10;
`;

const MessageInputContainer = styled.div`
  /* CRITICAL: Fixed ở dưới cùng - Đẩy lên khi keyboard xuất hiện */
  position: fixed;
  bottom: ${props => props.keyboardHeight || 0}px;  /* CRITICAL: Adjust for keyboard */
  left: 0;
  right: 0;
  z-index: 1001;
  padding: 0.5rem 0.75rem;
  padding-bottom: calc(0.5rem + env(safe-area-inset-bottom, 0px));
  background: var(--bg-primary, white);
  border-top: 1px solid var(--border-color, #e1e5e9);
  box-shadow: 0 -2px 8px rgba(0, 0, 0, 0.1);
  /* Hardware acceleration - mượt hơn */
  transform: translateZ(0);
  -webkit-transform: translateZ(0);
  will-change: transform;
  /* Smooth transition khi keyboard xuất hiện/ẩn */
  transition: bottom 0.3s cubic-bezier(0.4, 0, 0.2, 1);
`;

const InputForm = styled.form`
  display: flex;
  gap: 0.5rem;
  align-items: flex-end;
`;

const InputActionButton = styled.button`
  background: none;
  border: none;
  padding: 0.5rem;
  color: var(--text-secondary, #666);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: all 0.2s ease;
  flex-shrink: 0;
  -webkit-tap-highlight-color: transparent;

  &:active {
    background: var(--bg-secondary, #f0f0f0);
    transform: scale(0.95);
  }
`;

const MessageInput = styled.textarea`
  flex: 1;
  padding: 0.75rem 1rem;
  border: none;
  border-radius: 20px;
  resize: none;
  font-family: inherit;
  font-size: 15px; /* 15px+ prevents iOS zoom */
  outline: none;
  background: var(--bg-secondary, #f5f5f5);
  color: var(--text-primary, #000);
  max-height: 120px;
  line-height: 1.4;
  -webkit-appearance: none;
  
  &::placeholder {
    color: var(--text-tertiary, #999);
  }
  
  &:focus {
    background: var(--bg-tertiary, #ebebeb);
  }
`;

const SendButton = styled.button`
  background: ${props => props.disabled ? 'var(--bg-secondary, #ddd)' : 'var(--primary-color, #0084ff)'};
  border: none;
  padding: 0.75rem;
  color: white;
  cursor: ${props => props.disabled ? 'not-allowed' : 'pointer'};
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  flex-shrink: 0;
  width: 44px;
  height: 44px;
  -webkit-tap-highlight-color: transparent;

  &:active:not(:disabled) {
    background: var(--primary-color-dark, #0066cc);
    transform: scale(0.95);
  }
`;

const VoiceButton = styled(InputActionButton)`
  color: var(--primary-color, #0084ff);
  width: 44px;
  height: 44px;
`;

const LoadingContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  font-size: 14px;
  color: var(--text-secondary, #666);
`;


const MobileChatArea = ({
  conversation,
  currentUser,
  socket,
  onMessageSent,
  onSidebarReload,
  isMobile = true,
  onBackToSidebar,
  currentView
}) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(null);
  const [showImageUpload, setShowImageUpload] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showOptionsMenu, setShowOptionsMenu] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [otherUserTyping, setOtherUserTyping] = useState(false);
  const [otherUserViewing, setOtherUserViewing] = useState(false);
  const [conversationSettings, setConversationSettings] = useState({});
  const [showVideoCall, setShowVideoCall] = useState(false);
  const [isVideoCall, setIsVideoCall] = useState(true);
  const [isIncomingCall, setIsIncomingCall] = useState(false);
  const [showPermissionRequest, setShowPermissionRequest] = useState(false);
  const [replyToMessage, setReplyToMessage] = useState(null);
  const [editingMessage, setEditingMessage] = useState(null);
  
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const viewingTimeoutRef = useRef(null);
  const isUserScrollingRef = useRef(false);
  const scrollTimeoutRef = useRef(null);
  
  // 🎹 CRITICAL: Hook để detect keyboard và adjust input position
  const { isKeyboardVisible, keyboardHeight } = useKeyboard();

  // Debug: Log when component receives conversation prop
  useEffect(() => {
    console.log('📱 MobileChatArea - Component mounted/render with conversation:', conversation);
    console.log('📱 MobileChatArea - currentUser:', currentUser);
    console.log('📱 MobileChatArea - socket:', socket ? 'connected' : 'not connected');
  }, []);

  // Check if user is near bottom (within 100px)
  const isNearBottom = () => {
    const container = messagesContainerRef.current;
    if (!container) return true;
    
    const threshold = 100;
    const position = container.scrollTop + container.clientHeight;
    const height = container.scrollHeight;
    
    return height - position < threshold;
  };

  // Scroll to bottom - Optimized for smooth mobile performance
  const scrollToBottom = (force = false) => {
    const container = messagesContainerRef.current;
    if (!container) return;
    
    // Cancel any pending scroll
    if (scrollTimeoutRef.current) {
      cancelAnimationFrame(scrollTimeoutRef.current);
    }
    
    // Use requestAnimationFrame for smooth, one-time scroll
    scrollTimeoutRef.current = requestAnimationFrame(() => {
      container.scrollTop = container.scrollHeight;
      isUserScrollingRef.current = false;
    });
  };

  // Load messages when conversation changes
  useEffect(() => {
    console.log('📱 MobileChatArea - useEffect triggered with conversation:', conversation);
    console.log('📱 MobileChatArea - conversation?.id:', conversation?.id);
    
    if (conversation && conversation.id) {
      console.log('📱 MobileChatArea - Calling fetchMessages and loadConversationSettings');
      fetchMessages();
      loadConversationSettings();
    } else {
      console.log('📱 MobileChatArea - No conversation or no conversation.id, skipping fetch');
    }
    
    // Cleanup scroll animation on unmount
    return () => {
      if (scrollTimeoutRef.current) {
        cancelAnimationFrame(scrollTimeoutRef.current);
      }
    };
  }, [conversation?.id]);

  // Auto scroll to bottom when messages change
  useEffect(() => {
    if (messages.length > 0) {
      // Single scroll with delay for images to load
      const timer = setTimeout(() => scrollToBottom(true), 100);
      return () => clearTimeout(timer);
    }
  }, [messages.length]);

  // Handle user scroll - detect if user is viewing old messages
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      // Clear previous timeout
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }

      // Check if user scrolled up
      const isAtBottom = isNearBottom();
      isUserScrollingRef.current = !isAtBottom;

      // Reset after 1 second of no scrolling
      scrollTimeoutRef.current = setTimeout(() => {
        if (isAtBottom) {
          isUserScrollingRef.current = false;
        }
      }, 1000);
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    
    return () => {
      container.removeEventListener('scroll', handleScroll);
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []);

  // Socket listeners
  useEffect(() => {
    if (!socket || !conversation) return;

    // Notify that user is viewing this conversation
    socket.emit('viewingConversation', {
      conversationId: conversation.id,
      userId: currentUser.id
    });

    // Listen for new messages
    socket.on('receiveMessage', (data) => {
      if (conversation && conversation.other_user_id === data.senderId) {
        const newMsg = {
          id: Date.now(),
          content: data.message,
          sender_id: data.senderId,
          created_at: data.timestamp,
          username: conversation.username,
          full_name: conversation.full_name,
          avatar_url: conversation.avatar_url,
          status: 'read',
          reactions: data.reactions || [] // Add reactions field
        };
        
        setMessages(prev => [...prev, newMsg]);
        // Auto scroll to new incoming message
        setTimeout(() => scrollToBottom(true), 50);
      }
    });

    // Listen for typing indicators
    socket.on('userTyping', (data) => {
      if (data.conversationId === conversation.id && data.userId !== currentUser.id) {
        setOtherUserTyping(true);
      }
    });

    socket.on('userStoppedTyping', (data) => {
      if (data.conversationId === conversation.id && data.userId !== currentUser.id) {
        setOtherUserTyping(false);
      }
    });

    socket.on('reactionUpdate', (data) => {
      if (conversation && data.conversationId === conversation.id) {
        console.log('Reaction updated:', data);
        setMessages(prev => prev.map(msg => {
          if (msg.id === data.messageId) {
            // Ensure reactions is always an array for proper parsing
            let reactions = data.reactions;
            if (typeof reactions === 'string') {
              try {
                reactions = JSON.parse(reactions);
              } catch (e) {
                reactions = [];
              }
            }
            return { ...msg, reactions };
          }
          return msg;
        }));
      }
    });

    // Listen for message edited
    socket.on('messageEdited', (data) => {
      if (conversation && data.conversationId === conversation.id) {
        console.log('Message edited by other user:', data);
        setMessages(prev => prev.map(msg => {
          if (msg.id === data.messageId) {
            return { ...msg, content: data.content };
          }
          return msg;
        }));
      }
    });

    // Listen for message deleted
    socket.on('messageDeleted', (data) => {
      if (conversation && data.conversationId === conversation.id) {
        console.log('Message deleted by other user:', data);
        setMessages(prev => prev.filter(msg => msg.id !== data.messageId));
      }
    });

    return () => {
      socket.off('receiveMessage');
      socket.off('userTyping');
      socket.off('userStoppedTyping');
      socket.off('reactionUpdate');
      socket.off('messageEdited');
      socket.off('messageDeleted');
      
      // Stop typing when leaving
      if (isTyping) {
        socket.emit('stopTyping', {
          conversationId: conversation.id,
          userId: currentUser.id
        });
      }
    };
  }, [conversation, socket, currentUser.id]);

  const fetchMessages = async () => {
    if (!conversation || !conversation.id) {
      console.log('📱 MobileChatArea - No conversation provided');
      setMessages([]);
      setLoading(false);
      return;
    }
    
    console.log('📱 MobileChatArea - Fetching messages for conversation:', conversation.id);
    console.log('📱 MobileChatArea - Current user:', currentUser?.id);
    
    try {
      setLoading(true);
      const data = await chatAPI.getMessages(conversation.id);
      console.log('📱 MobileChatArea - API Response:', data);
      console.log('📱 MobileChatArea - Number of messages:', data?.length || 0);
      console.log('📱 MobileChatArea - Messages detail:', JSON.stringify(data, null, 2));
      
      // Parse reactions from database
      const parseReactions = (reactions) => {
        if (!reactions) return [];
        if (typeof reactions === 'string') {
          try {
            return JSON.parse(reactions);
          } catch (e) {
            return [];
          }
        }
        return reactions;
      };
      
      // Process and parse reactions
      const processedMessages = (data || []).map(msg => ({
        ...msg,
        reactions: parseReactions(msg.reactions)
      }));
      
      console.log('📱 MobileChatArea - Processed messages count:', processedMessages.length);
      setMessages(processedMessages);
      
      // Mark as read
      await markAllMessagesAsRead();
    } catch (error) {
      console.error('❌ Error fetching messages:', error);
      console.error('❌ Error details:', error.response?.data || error.message);
      setMessages([]);
    } finally {
      setLoading(false);
      // Single scroll after loading
      setTimeout(() => scrollToBottom(true), 150);
    }
  };

  const markAllMessagesAsRead = async () => {
    if (!conversation) return;
    
    try {
      await chatAPI.markAllAsRead(conversation.id);
      if (socket) {
        socket.emit('markMessagesAsRead', {
          conversationId: conversation.id,
          userId: currentUser.id
        });
      }
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  };

  const loadConversationSettings = async () => {
    if (!conversation) return;
    
    try {
      const settings = await chatAPI.getConversationSettings(conversation.id);
      setConversationSettings(settings || {});
    } catch (error) {
      console.error('Error loading conversation settings:', error);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !conversation) return;

    const messageText = newMessage.trim();
    setNewMessage('');

    // Stop typing
    if (isTyping) {
      setIsTyping(false);
      if (socket) {
        socket.emit('stopTyping', {
          conversationId: conversation.id,
          userId: currentUser.id
        });
      }
    }

    // Handle edit message
    if (editingMessage) {
      try {
        console.log('=== EDITING MESSAGE ===');
        console.log('Full message object:', editingMessage);
        console.log('Message ID:', editingMessage.id);
        console.log('Message content:', messageText);
        console.log('Current user ID:', currentUser.id);
        
        if (!editingMessage.id) {
          alert('Không tìm thấy ID tin nhắn. Vui lòng refresh trang.');
          return;
        }
        
        // Update message on server
        const result = await chatAPI.updateMessage(editingMessage.id, messageText);
        console.log('Server response:', result);
        
        // Update message in local state
        setMessages(prev => prev.map(msg => 
          msg.id === editingMessage.id 
            ? { ...msg, content: messageText } 
            : msg
        ));
        
        // Emit socket event to notify other user
        if (socket) {
          socket.emit('messageEdited', {
            messageId: editingMessage.id,
            content: messageText,
            conversationId: conversation.id
          });
          console.log('Emitted messageEdited event');
        }
        
        // Clear editing state
        setEditingMessage(null);
        setNewMessage('');
        
        console.log('Message edited successfully');
      } catch (error) {
        console.error('=== ERROR EDITING MESSAGE ===');
        console.error('Error:', error);
        console.error('Error response:', error.response);
        console.error('Error data:', error.response?.data);
        console.error('Message ID:', editingMessage.id);
        console.error('Message content:', messageText);
        
        // Don't show error alert for 404 - message might not be saved yet
        // Just log and clear editing state
        if (error.response?.status === 404) {
          console.log('Message not found in database (likely not saved yet)');
          setEditingMessage(null);
          setNewMessage('');
        } else {
          const errorMessage = error.response?.data?.message || error.message || 'Unknown error';
          alert('Không thể chỉnh sửa tin nhắn: ' + errorMessage);
        }
      }
      return;
    }

    try {
      // Prepare message with reply info if replying
      const messageToSend = replyToMessage 
        ? `Re: ${replyToMessage.content}\n\n${messageText}` 
        : messageText;

      console.log('📤 Sending message:', {
        conversationId: conversation.id,
        message: messageToSend,
        currentUser: currentUser.id
      });

      const response = await chatAPI.sendMessage(conversation.id, messageToSend, 'text');
      console.log('📤 Send message response:', response);
      
      const realMessageId = response.messageId || Date.now();

      if (socket) {
        socket.emit('sendMessage', {
          receiverId: conversation.other_user_id || conversation.participant_id,
          message: messageToSend,
          senderId: currentUser.id,
          conversationId: conversation.id,
          replyTo: replyToMessage ? replyToMessage.id : null
        });
      }

      const newMsg = {
        id: realMessageId, // Use real ID from server
        content: messageToSend,
        sender_id: currentUser.id,
        created_at: new Date().toISOString(),
        username: currentUser.username,
        full_name: currentUser.fullName,
        avatar_url: currentUser.avatar_url,
        status: 'sent',
        reply_to: replyToMessage ? replyToMessage.id : null
      };

      setMessages(prev => [...prev, newMsg]);
      
      // Clear reply after sending
      setReplyToMessage(null);
      
      // Instant scroll to your own message
      scrollToBottom(true);

      if (onMessageSent) {
        onMessageSent(newMsg);
      }
    } catch (error) {
      console.error('❌ Error sending message:', error);
      console.error('❌ Error details:', error.response?.data || error.message);
      console.error('❌ Error stack:', error.stack);
      alert('Không thể gửi tin nhắn: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleTyping = (e) => {
    setNewMessage(e.target.value);

    // Auto-resize textarea
    e.target.style.height = 'auto';
    e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';

    // Typing indicator
    if (!isTyping && e.target.value.length > 0) {
      setIsTyping(true);
      if (socket) {
        socket.emit('typing', {
          conversationId: conversation.id,
          userId: currentUser.id,
          username: currentUser.username,
          fullName: currentUser.fullName
        });
      }
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      if (socket) {
        socket.emit('stopTyping', {
          conversationId: conversation.id,
          userId: currentUser.id
        });
      }
    }, 3000);
  };

  const handleReply = (message) => {
    // Set the message to reply to
    setReplyToMessage(message);
    // Scroll to input and focus
    setTimeout(() => {
      const input = document.querySelector('textarea');
      if (input) {
        input.focus();
      }
    }, 100);
  };

  const handleCancelReply = () => {
    setReplyToMessage(null);
  };

  const handleEdit = (message) => {
    console.log('=== HANDLE EDIT ===');
    console.log('Message object:', message);
    console.log('Message ID:', message.id);
    console.log('Message ID type:', typeof message.id);
    console.log('Message ID number:', Number(message.id));
    
    // Set the message to edit
    setEditingMessage(message);
    // Pre-fill input with message content
    setNewMessage(message.content);
    // Clear any reply
    setReplyToMessage(null);
    // Scroll to input and focus
    setTimeout(() => {
      const input = document.querySelector('textarea');
      if (input) {
        input.focus();
      }
    }, 100);
  };

  const handleCancelEdit = () => {
    setEditingMessage(null);
    setNewMessage('');
  };

  const handleDelete = async (message) => {
    if (!window.confirm('Bạn có chắc muốn xóa tin nhắn này?')) {
      return;
    }

    try {
      console.log('Deleting message:', message.id);
      
      // Delete message on server
      await chatAPI.deleteMessage(message.id);
      
      // Remove from local state
      setMessages(prev => prev.filter(msg => msg.id !== message.id));
      
      // Emit socket event to notify other user
      if (socket) {
        socket.emit('messageDeleted', {
          messageId: message.id,
          conversationId: conversation.id
        });
        console.log('Emitted messageDeleted event');
      }
      
      console.log('Message deleted successfully');
    } catch (error) {
      console.error('Error deleting message:', error);
      alert('Không thể xóa tin nhắn: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleForward = (message) => {
    // TODO: Implement forward to another conversation
    console.log('Forward message:', message);
    alert('Tính năng chuyển tiếp sẽ được thêm sau');
  };

  const handleReaction = async (messageId, reaction) => {
    try {
      // Find the message and update its reactions
      const message = messages.find(m => m.id === messageId);
      if (!message) return;
      
      const currentReactions = message.reactions ? (typeof message.reactions === 'string' ? JSON.parse(message.reactions) : message.reactions) : [];
      const newReactions = [...currentReactions];
      const existingIndex = newReactions.indexOf(reaction);
      
      if (existingIndex > -1) {
        newReactions.splice(existingIndex, 1);
      } else {
        newReactions.push(reaction);
      }
      
      // Update local state
      setMessages(prev => prev.map(msg => 
        msg.id === messageId ? { ...msg, reactions: newReactions } : msg
      ));
      
      // Save to database
      await chatAPI.updateReactions(messageId, newReactions);
      
      // Emit via socket
      if (socket && conversation) {
        socket.emit('reactionUpdate', {
          messageId,
          reactions: newReactions,
          conversationId: conversation.id,
          userId: currentUser.id
        });
      }
    } catch (error) {
      console.error('Error updating reaction:', error);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e);
    }
  };

  const handleEmojiSelect = (emoji) => {
    setNewMessage(prev => prev + emoji);
    setShowEmojiPicker(false);
  };

  const handleImageSelect = (file) => {
    setSelectedImage(file);
    setShowImageUpload(true);
  };

  const getAvatarColor = (name) => {
    if (!name) return '#0084ff';
    const colors = ['#0084ff', '#00a651', '#ff6b6b', '#4ecdc4', '#45b7d1'];
    const hash = name.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);
    return colors[Math.abs(hash) % colors.length];
  };

  const displayName = conversationSettings.nickname || 
                      conversation?.full_name || 
                      conversation?.participant_name || 
                      conversation?.name || 
                      conversation?.username || 
                      'Unknown';

  const isOnline = conversation?.participant_status === 'online' || 
                   conversation?.status === 'online';

  if (loading) {
    return (
      <MobileChatContainer>
        <LoadingContainer>Đang tải tin nhắn...</LoadingContainer>
      </MobileChatContainer>
    );
  }

  return (
    <MobileChatContainer>
      <MobileHeader>
        <BackButton onClick={onBackToSidebar} title="Quay lại">
          <FiArrowLeft size={22} />
        </BackButton>

        <UserInfo onClick={() => setShowProfile(true)}>
          <Avatar color={getAvatarColor(displayName)}>
            {conversation?.avatar_url ? (
              <img 
                src={getAvatarURL(conversation.avatar_url)} 
                alt={displayName}
                style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }}
              />
            ) : (
              getInitials(displayName)
            )}
            {isOnline && <OnlineIndicator />}
          </Avatar>
          
          <UserDetails>
            <UserName>{displayName}</UserName>
            <UserStatus>
              {otherUserViewing ? 'Đang xem' : 
               otherUserTyping ? 'Đang nhập...' : 
               isOnline ? 'Đang hoạt động' : 'Ngoại tuyến'}
            </UserStatus>
          </UserDetails>
        </UserInfo>

        <HeaderActions>
          <ActionButton onClick={() => {
            setIsVideoCall(false);
            setShowPermissionRequest(true);
          }} title="Gọi thoại">
            <FiPhone size={20} />
          </ActionButton>
          
          <ActionButton onClick={() => {
            setIsVideoCall(true);
            setShowPermissionRequest(true);
          }} title="Gọi video">
            <FiVideo size={20} />
          </ActionButton>
          
          <ActionButton onClick={() => setShowOptionsMenu(true)} title="Tùy chọn">
            <FiMoreVertical size={20} />
          </ActionButton>
        </HeaderActions>
      </MobileHeader>

      <MessagesContainer ref={messagesContainerRef} keyboardHeight={keyboardHeight}>
        {(() => {
          console.log('📱 Rendering MessagesContainer - messages count:', messages.length);
          console.log('📱 Loading state:', loading);
          
          if (loading) {
            return (
              <LoadingContainer>Đang tải tin nhắn...</LoadingContainer>
            );
          }
          
          if (messages.length === 0) {
            return (
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                height: '100%',
                color: '#999',
                fontSize: '14px'
              }}>
                Chưa có tin nhắn
              </div>
            );
          }
          
          return (
            <>
              <MessageList 
                messages={messages}
                currentUserId={currentUser.id || currentUser.user_id}
                onReply={handleReply}
                onForward={handleForward}
                onReaction={handleReaction}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
              <div ref={messagesEndRef} />
            </>
          );
        })()}
        {otherUserTyping && conversation && (
          <TypingWrapper>
            <TypingIndicator 
              typingUsers={[{
                full_name: conversation.full_name || conversation.participant_name || conversation.name || 'Người dùng',
                username: conversation.username || ''
              }]}
              conversationSettings={conversationSettings || {}}
            />
          </TypingWrapper>
        )}
      </MessagesContainer>

      <MessageInputContainer keyboardHeight={keyboardHeight}>
        {replyToMessage && (
          <ReplyBar
            replyMessage={replyToMessage}
            onCancel={handleCancelReply}
          />
        )}
        
        {editingMessage && (
          <EditBar
            editingMessage={editingMessage}
            onCancel={handleCancelEdit}
          />
        )}
        
        <InputForm onSubmit={handleSendMessage}>
          <InputActionButton
            onClick={() => {
              const input = document.createElement('input');
              input.type = 'file';
              input.accept = 'image/*';
              input.onchange = (e) => {
                if (e.target.files[0]) {
                  handleImageSelect(e.target.files[0]);
                }
              };
              input.click();
            }}
            title="Đính kèm"
          >
            <FiPlus size={20} />
          </InputActionButton>
          
          <MessageInput
            value={newMessage}
            onChange={handleTyping}
            onKeyPress={handleKeyPress}
            onFocus={(e) => {
              // Scroll messages to bottom khi keyboard xuất hiện
              setTimeout(() => {
                const container = document.querySelector('[class*="MessagesContainer"]');
                if (container) {
                  container.scrollTop = container.scrollHeight;
                }
              }, 100);
            }}
            placeholder="Tin nhắn"
            rows={1}
          />
          
          <InputActionButton
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            title="Emoji"
          >
            <FiSmile size={20} />
          </InputActionButton>
          
          {newMessage.trim() ? (
            <SendButton 
              type="submit" 
              disabled={!newMessage.trim()}
              title="Gửi tin nhắn"
            >
              <FiSend size={18} />
            </SendButton>
          ) : (
            <VoiceButton
              onClick={() => {
                console.log('Voice message recording');
              }}
              title="Ghi âm"
            >
              <FiMic size={20} />
            </VoiceButton>
          )}
        </InputForm>
        
        {showEmojiPicker && (
          <EmojiPicker
            onEmojiSelect={handleEmojiSelect}
            isOpen={showEmojiPicker}
            onClose={() => setShowEmojiPicker(false)}
          />
        )}
      </MessageInputContainer>

      <ChatOptionsMenu
        isOpen={showOptionsMenu}
        onClose={() => setShowOptionsMenu(false)}
        conversation={conversation}
        currentUser={currentUser}
        onSettingsUpdate={loadConversationSettings}
        onShowProfile={() => setShowProfile(true)}
        onMessagesDeleted={() => {
          // Clear all messages after deletion
          setMessages([]);
          console.log('Messages cleared after deletion');
        }}
      />

      {showProfile && conversation && (
        <MobileUserProfile
          user={{
            id: conversation.other_user_id || conversation.participant_id || conversation.id,
            username: conversation.username || conversation.participant_username,
            full_name: conversation.full_name || conversation.participant_name || conversation.name,
            avatar_url: conversation.avatar_url || conversation.participant_avatar,
            bio: conversation.bio,
            status: conversation.status || conversation.participant_status
          }}
          currentUserId={currentUser?.id || currentUser?.user_id}
          onClose={() => setShowProfile(false)}
          onStartChat={(user) => {
            setShowProfile(false);
            // Already in chat, no need to do anything
          }}
        />
      )}

      {showPermissionRequest && (
        <PermissionRequest
          isVideoCall={isVideoCall}
          conversationName={displayName}
          onAllow={() => {
            setShowPermissionRequest(false);
            setShowVideoCall(true);
          }}
          onDeny={() => {
            setShowPermissionRequest(false);
          }}
        />
      )}

      {showVideoCall && (
        <VideoCall
          conversation={conversation}
          isVideoCall={isVideoCall}
          isIncoming={isIncomingCall}
          socket={socket}
          onClose={() => setShowVideoCall(false)}
          onAccept={() => {
            console.log('Call accepted');
            setIsIncomingCall(false);
          }}
          onReject={() => {
            console.log('Call rejected');
            setShowVideoCall(false);
          }}
        />
      )}

      {showImageUpload && selectedImage && (
        <ImageUpload
          image={selectedImage}
          onClose={() => {
            setShowImageUpload(false);
            setSelectedImage(null);
          }}
          onSend={async (caption) => {
            // Handle image send
            console.log('Send image with caption:', caption);
            setShowImageUpload(false);
            setSelectedImage(null);
          }}
        />
      )}
    </MobileChatContainer>
  );
};

export default MobileChatArea;

