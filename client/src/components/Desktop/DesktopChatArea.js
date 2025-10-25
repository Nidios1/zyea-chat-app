import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import { FiSend, FiImage, FiSmile, FiPhone, FiVideo, FiArrowLeft, FiMic, FiPlus } from 'react-icons/fi';
import MessageList from '../Shared/Chat/MessageList';
import TypingIndicator from '../Shared/Chat/TypingIndicator';
import ImageUpload from '../Shared/Chat/ImageUpload';
import EmojiPicker, { EmojiToggleButton } from '../Shared/Chat/EmojiPicker';
import ChatOptionsMenu from '../Shared/Chat/ChatOptionsMenu';
import ProfilePage from '../Shared/Profile/ProfilePage';
import VideoCall from '../Shared/Chat/VideoCall';
import PermissionRequest from '../Shared/Chat/PermissionRequest';
import { chatAPI } from '../../utils/api';
import { getInitials } from '../../utils/nameUtils';
import { getAvatarURL } from '../../utils/imageUtils';

const ChatContainer = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  background: var(--bg-secondary, #f0f2f5);
  overflow: hidden;
  position: relative;
`;

const ChatHeader = styled.div`
  padding: 1rem;
  border-bottom: 1px solid var(--border-color, #e1e5e9);
  display: flex;
  align-items: center;
  gap: 1rem;
  background: var(--bg-primary, white);
`;

const BackButton = styled.button`
  display: none;
  background: none;
  border: none;
  color: var(--text-secondary, #666);
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 50%;
  transition: all 0.2s ease;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  flex-shrink: 0;

  &:hover {
    background: var(--bg-secondary, #f0f0f0);
    color: var(--text-primary, #333);
  }

  &:active {
    opacity: 0.7;
  }

  @media (max-width: 768px) {
    display: flex;
    width: 36px;
    height: 36px;
    padding: 0.4rem;
  }

  @media (max-width: 480px) {
    width: 32px;
    height: 32px;
    padding: 0.3rem;
  }
`;

const Avatar = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: ${props => props.color || '#00a651'};
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  color: white;
  position: relative;
  flex-shrink: 0;

  @media (max-width: 768px) {
    width: 36px;
    height: 36px;
  }
`;

const OnlineIndicator = styled.div`
  position: absolute;
  bottom: 2px;
  right: 2px;
  width: 10px;
  height: 10px;
  background: #00a651;
  border: 2px solid var(--bg-primary, white);
  border-radius: 50%;
`;

const UserInfo = styled.div`
  flex: 1;
`;

const UserName = styled.h3`
  margin: 0;
  font-size: 16px;
  color: var(--text-primary, #333);
  font-weight: 500;
  cursor: pointer;
  padding: 0.25rem 0.5rem;
  border-radius: 6px;
  transition: background 0.2s ease;
  display: inline-block;
  
  &:hover {
    background: var(--bg-secondary, #f8f9fa);
  }

  &:active {
    opacity: 0.8;
  }
`;

const UserStatus = styled.p`
  margin: 0.25rem 0 0 0;
  font-size: 13px;
  color: var(--text-secondary, #666);
`;

const CallButtons = styled.div`
  display: flex;
  gap: 0.5rem;
  align-items: center;
`;

const CallButton = styled.button`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  font-size: 18px;
  
  &.call {
    background: #00a651;
    color: white;
    
    &:hover {
      background: #008f47;
      transform: scale(1.05);
    }
  }
  
  &.video {
    background: #0068ff;
    color: white;
    
    &:hover {
      background: #0056cc;
      transform: scale(1.05);
    }
  }
  
  &:active {
    transform: scale(0.95);
  }
`;

const MessagesContainer = styled.div`
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 1rem;
  background: var(--bg-secondary, #f0f2f5);
  position: relative;
  scroll-behavior: smooth;
  display: flex;
  flex-direction: column;
  
  /* DISABLE iOS bounce/overscroll - Make app feel native */
  -webkit-overflow-scrolling: touch;
  overscroll-behavior: contain;

  &::-webkit-scrollbar {
    width: 4px;
  }

  &::-webkit-scrollbar-track {
    background: transparent;
  }

  &::-webkit-scrollbar-thumb {
    background: var(--text-tertiary, #ddd);
    border-radius: 2px;
  }

  &::-webkit-scrollbar-thumb:hover {
    background: var(--text-secondary, #ccc);
  }

  @media (max-width: 768px) {
    padding: 0.75rem;
    /* Add padding-bottom to prevent messages being hidden by fixed input */
    /* Input height (~60px) + safe area + extra space */
    padding-bottom: calc(85px + env(safe-area-inset-bottom, 0px));
  }

  @media (max-width: 480px) {
    padding: 0.5rem;
    padding-bottom: calc(80px + env(safe-area-inset-bottom, 0px));
  }
`;

const MessageInputContainer = styled.div`
  padding: 1rem;
  border-top: 1px solid var(--border-color, #e1e5e9);
  background: var(--bg-primary, white);
  position: relative;
  transition: bottom 0.3s ease;

  @media (max-width: 768px) {
    /* CRITICAL: Fixed position - KHÔNG nhảy khi keyboard xuất hiện */
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    z-index: 1001;
    padding: 0.5rem 0.75rem;
    padding-bottom: calc(0.5rem + env(safe-area-inset-bottom, 0px));
    box-shadow: 0 -2px 8px rgba(0, 0, 0, 0.1);
    /* Hardware acceleration - mượt hơn */
    transform: translateZ(0);
    -webkit-transform: translateZ(0);
    will-change: transform;
    /* iOS keyboard fix */
    -webkit-overflow-scrolling: touch;
  }

  @media (max-width: 480px) {
    position: fixed;
    bottom: 0;
    padding: 0.4rem 0.5rem;
    padding-bottom: calc(0.4rem + env(safe-area-inset-bottom, 0px));
    transform: translateZ(0);
    -webkit-transform: translateZ(0);
  }
`;

const InputForm = styled.form`
  display: flex;
  gap: 0.5rem;
  align-items: flex-end;

  @media (max-width: 768px) {
    gap: 0.375rem;
  }

  @media (max-width: 480px) {
    gap: 0.25rem;
  }
`;

const MessageInput = styled.textarea`
  flex: 1;
  padding: 0.75rem 1rem;
  border: none;
  border-radius: 20px;
  resize: none;
  font-family: inherit;
  font-size: 14px;
  outline: none;
  max-height: 100px;
  min-height: 40px;
  background: var(--bg-secondary, #f0f0f0);
  color: var(--text-primary, #000);
  transition: all 0.2s ease;
  margin: 0 0.5rem;

  &:focus {
    background: var(--bg-secondary, #f0f0f0);
  }

  &::placeholder {
    color: var(--text-tertiary, #999);
  }

  @media (max-width: 768px) {
    font-size: 16px; /* CRITICAL: Prevent zoom on iOS when focusing */
    padding: 0.75rem 1rem;
    margin: 0 0.25rem;
  }

  @media (max-width: 480px) {
    font-size: 16px; /* Prevent zoom on iOS */
    padding: 0.875rem 1rem;
    margin: 0;
  }
`;

const ActionButton = styled.button.attrs({ type: 'button' })`
  padding: 0.75rem;
  border: none;
  background: var(--bg-tertiary, #3a3a3c);
  color: white;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  width: 40px;
  height: 40px;
  flex-shrink: 0;

  &:hover {
    opacity: 0.8;
  }

  &:active {
    transform: scale(0.95);
  }
`;

const SendButton = styled.button`
  padding: 0.75rem;
  background: var(--primary-color, #8B5CF6);
  color: white;
  border: none;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  width: 40px;
  height: 40px;
  flex-shrink: 0;

  &:hover {
    background: var(--accent-color, #7C3AED);
  }

  &:active {
    transform: scale(0.95);
  }

  &:disabled {
    background: var(--bg-tertiary, #ccc);
    cursor: not-allowed;
  }
`;

const VoiceButton = styled.button.attrs({ type: 'button' })`
  padding: 0.75rem;
  background: var(--bg-tertiary, #3a3a3c);
  color: white;
  border: none;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  width: 40px;
  height: 40px;
  flex-shrink: 0;

  &:hover {
    opacity: 0.8;
  }
`;

const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: var(--text-secondary, #666);
  text-align: center;
  padding: 2rem;
  background: var(--bg-secondary, #f8f9fa);
  position: relative;
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    top: -50%;
    left: -50%;
    width: 200%;
    height: 200%;
    background: radial-gradient(circle, rgba(0, 104, 255, 0.05) 0%, transparent 70%);
    animation: float 6s ease-in-out infinite;
  }
  
  @keyframes float {
    0%, 100% { transform: translateY(0px) rotate(0deg); }
    50% { transform: translateY(-20px) rotate(180deg); }
  }
  
  h2 {
    margin: 0 0 1rem 0;
    font-size: 1.5rem;
    font-weight: 600;
    color: var(--text-primary, #333);
    background: var(--primary-gradient, linear-gradient(135deg, #0068ff, #00a651));
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    position: relative;
    z-index: 1;
  }
  
  p {
    margin: 0;
    font-size: 1rem;
    opacity: 0.8;
    line-height: 1.6;
    position: relative;
    z-index: 1;
    color: var(--text-secondary, #666);
  }

  @media (max-width: 768px) {
    padding: 1.5rem;
    
    h2 {
      font-size: 1.3rem;
      margin-bottom: 0.75rem;
    }
    
    p {
      font-size: 0.9rem;
    }
  }

  @media (max-width: 480px) {
    padding: 1rem;
    
    h2 {
      font-size: 1.2rem;
      margin-bottom: 0.5rem;
    }
    
    p {
      font-size: 0.85rem;
    }
  }
  
  /* Mobile-specific styles for interactive elements */
  @media (max-width: 768px) {
    .mobile-button {
      padding: 0.6rem 1.2rem !important;
      font-size: 0.85rem !important;
      margin-top: 1rem !important;
    }
    
    .mobile-icon {
      font-size: 3rem !important;
      margin-bottom: 0.75rem !important;
    }
  }
  
  @media (max-width: 480px) {
    .mobile-button {
      padding: 0.5rem 1rem !important;
      font-size: 0.8rem !important;
      margin-top: 0.75rem !important;
    }
    
    .mobile-icon {
      font-size: 2.5rem !important;
      margin-bottom: 0.5rem !important;
    }
  }
`;



const getAvatarColor = (name) => {
  const colors = ['#3498db', '#e74c3c', '#2ecc71', '#f39c12', '#9b59b6', '#1abc9c'];
  const index = name?.charCodeAt(0) % colors.length || 0;
  return colors[index];
};

const ChatArea = ({ conversation, currentUser, socket, onMessageSent, onSidebarReload, isMobile = false, onBackToSidebar, currentView = 'conversation' }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [otherUserViewing, setOtherUserViewing] = useState(false);
  const [typingUsers, setTypingUsers] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [showOptionsMenu, setShowOptionsMenu] = useState(false);
  const [conversationSettings, setConversationSettings] = useState(null);
  const [showProfile, setShowProfile] = useState(false);
  const [keyboardOffset, setKeyboardOffset] = useState(0);
  const [showVideoCall, setShowVideoCall] = useState(false);
  const [isVideoCall, setIsVideoCall] = useState(true);
  const [isIncomingCall, setIsIncomingCall] = useState(false);
  const [showPermissionRequest, setShowPermissionRequest] = useState(false);
  
  // Desktop - No swipe navigation needed
  const messagesEndRef = useRef(null);
  const viewingTimeoutRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // Debug useEffect
  useEffect(() => {
    console.log('ChatArea mounted with isMobile:', isMobile);
    console.log('Window width:', window.innerWidth);
  }, [isMobile]);

  // iOS Keyboard detection - ENHANCED for IPA
  useEffect(() => {
    if (!isMobile) return;

    let initialHeight = window.innerHeight;

    const handleResize = () => {
      // Method 1: visualViewport API
      if (window.visualViewport) {
        const viewportHeight = window.visualViewport.height;
        const windowHeight = window.innerHeight;
        const keyboardHeight = windowHeight - viewportHeight;
        
        if (keyboardHeight > 100) {
          setKeyboardOffset(keyboardHeight);
          return;
        }
      }
      
      // Method 2: Fallback - window resize
      const currentHeight = window.innerHeight;
      const heightDiff = initialHeight - currentHeight;
      
      if (heightDiff > 100) {
        // Keyboard is open
        setKeyboardOffset(heightDiff);
      } else {
        setKeyboardOffset(0);
      }
    };

    // Listen to multiple events for better compatibility
    window.addEventListener('resize', handleResize);
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleResize);
      window.visualViewport.addEventListener('scroll', handleResize);
    }

    return () => {
      window.removeEventListener('resize', handleResize);
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', handleResize);
        window.visualViewport.removeEventListener('scroll', handleResize);
      }
    };
  }, [isMobile]);

  // Smart navigation handler
  const handleSmartNavigation = (action, target) => {
    console.log(`Smart navigation: ${action} -> ${target}`);
    
    switch (action) {
      case 'goToSidebar':
        if (onBackToSidebar) {
          onBackToSidebar();
        }
        break;
      case 'goToFriends':
        // Navigate to friends list
        console.log('Navigate to friends');
        break;
      case 'goToProfile':
        // Navigate to profile
        console.log('Navigate to profile');
        break;
      default:
        if (onBackToSidebar) {
          onBackToSidebar();
        }
        break;
    }
  };

  // Desktop - No touch handlers needed

  // Function to get time ago string
  const getTimeAgo = (lastSeen) => {
    if (!lastSeen) return '';
    
    const now = new Date();
    const lastSeenDate = new Date(lastSeen);
    const diffInMinutes = Math.floor((now - lastSeenDate) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'vừa xong';
    if (diffInMinutes < 60) return `${diffInMinutes} phút trước`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours} giờ trước`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays} ngày trước`;
    
    return lastSeenDate.toLocaleDateString('vi-VN');
  };


  useEffect(() => {
    const handleConversationChange = async () => {
      if (conversation) {
        await fetchMessages();
        await loadConversationSettings();

        // Emit that user is viewing this conversation
        if (socket) {
          socket.emit('viewingConversation', {
            conversationId: conversation.id,
            userId: currentUser.id
          });
        }

        // Mark all messages as read immediately when entering conversation
        await markAllMessagesAsRead();
      } else {
        setMessages([]);
        setConversationSettings(null);
      }
    };

    handleConversationChange();

    // Cleanup when component unmounts or conversation changes
    return () => {
      if (socket && conversation) {
        socket.emit('leftConversation', {
          conversationId: conversation.id,
          userId: currentUser.id
        });
        
        // Stop typing when leaving conversation
        if (isTyping) {
          socket.emit('stopTyping', {
            conversationId: conversation.id,
            userId: currentUser.id,
            username: currentUser.username,
            fullName: currentUser.fullName
          });
        }
      }
      
      // Clear typing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [conversation, socket, currentUser.id]);

  useEffect(() => {
    if (socket) {
      // Listen for new messages in real-time
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
            status: 'read' // Mark as read immediately since user is viewing
          };
          
          // Update messages once with the new message and mark all received messages as read
          setMessages(prev => {
            const updatedMessages = [...prev, newMsg];
            return updatedMessages.map(msg => 
              msg.sender_id !== currentUser.id ? { ...msg, status: 'read' } : msg
            );
          });
          
          // Auto scroll to bottom when receiving new message
          setTimeout(() => {
            scrollToBottom();
          }, 100);
        }
      });

      // Listen for message delivery confirmation
      socket.on('messageDelivered', (data) => {
        setMessages(prev => prev.map(msg => 
          msg.id === data.messageId ? { ...msg, status: 'delivered' } : msg
        ));
      });

      // Listen for message read confirmation
      socket.on('messageRead', (data) => {
        setMessages(prev => prev.map(msg => 
          msg.id === data.messageId ? { ...msg, status: 'read' } : msg
        ));
      });

      // Listen for user viewing conversation (read receipts)
      socket.on('userViewingConversation', (data) => {
        if (conversation && data.userId === conversation.other_user_id && data.conversationId === conversation.id) {
          console.log('Other user is viewing this conversation');
          setOtherUserViewing(true);
          
          // Clear existing timeout
          if (viewingTimeoutRef.current) {
            clearTimeout(viewingTimeoutRef.current);
          }
          
          // Mark messages as read immediately when other user is viewing
          console.log('Marking messages as read - other user is viewing');
          
          // Update local state immediately for all sent messages
          setMessages(prev => prev.map(msg => 
            msg.sender_id === currentUser.id ? { ...msg, status: 'read' } : msg
          ));
          
          // Get all sent message IDs
          const sentMessageIds = messages
            .filter(msg => msg.sender_id === currentUser.id)
            .map(msg => msg.id);
          
          if (sentMessageIds.length > 0) {
            // Mark messages as read in database
            chatAPI.markMessagesAsRead(conversation.id, sentMessageIds)
              .then(() => {
                // Emit socket event to notify other users
                if (socket) {
                  socket.emit('markMessagesAsRead', {
                    conversationId: conversation.id,
                    messageIds: sentMessageIds,
                    userId: currentUser.id
                  });
                }
              })
              .catch(error => {
                console.error('Error marking messages as read:', error);
              });
          }
        }
      });

      // Listen for user leaving conversation
      socket.on('userLeftConversation', (data) => {
        if (conversation && data.userId === conversation.other_user_id && data.conversationId === conversation.id) {
          console.log('Other user left conversation');
          setOtherUserViewing(false);
          
          // Clear timeout if user leaves before 1 second
          if (viewingTimeoutRef.current) {
            clearTimeout(viewingTimeoutRef.current);
            viewingTimeoutRef.current = null;
          }
        }
      });

      // Listen for messages marked as read by other users
      socket.on('messagesMarkedAsRead', (data) => {
        if (conversation && data.conversationId === conversation.id) {
          console.log('Messages marked as read by other user:', data);
          
          if (data.messageIds.length === 0) {
            // All messages marked as read
            setMessages(prev => prev.map(msg => 
              msg.sender_id === currentUser.id ? { ...msg, status: 'read' } : msg
            ));
          } else {
            // Specific messages marked as read
            setMessages(prev => prev.map(msg => 
              data.messageIds.includes(msg.id) ? { ...msg, status: 'read' } : msg
            ));
          }
        }
      });

      // Listen for typing events
      socket.on('userTyping', (data) => {
        if (conversation && data.conversationId === conversation.id) {
          console.log('User typing:', data);
          setTypingUsers(prev => {
            const filtered = prev.filter(user => user.userId !== data.userId);
            if (data.isTyping) {
              return [...filtered, {
                userId: data.userId,
                username: data.username,
                full_name: data.fullName,
                isTyping: data.isTyping
              }];
            }
            return filtered;
          });
          
          // Auto scroll when someone starts typing
          setTimeout(() => {
            scrollToBottom();
          }, 100);
        }
      });

      // Listen for stop typing events
      socket.on('userStoppedTyping', (data) => {
        if (conversation && data.conversationId === conversation.id) {
          console.log('User stopped typing:', data);
          setTypingUsers(prev => prev.filter(user => user.userId !== data.userId));
        }
      });

      // Listen for user status changes
      socket.on('userStatusChanged', (data) => {
        if (conversation && data.userId === conversation.other_user_id) {
          console.log('User status changed:', data);
          // Note: conversation is a prop, so we can't update it directly here
          // The parent component (Chat.js) will handle the status update
        }
      });

      // Listen for incoming calls
      socket.on('call-offer', (data) => {
        if (conversation && data.from == conversation.user_id) {
          console.log('Incoming call from:', data.from);
          setIsVideoCall(data.isVideo);
          setIsIncomingCall(true);
          setShowVideoCall(true);
        }
      });

      return () => {
        socket.off('receiveMessage');
        socket.off('messageDelivered');
        socket.off('messageRead');
        socket.off('userViewingConversation');
        socket.off('userLeftConversation');
        socket.off('messagesMarkedAsRead');
        socket.off('userTyping');
        socket.off('userStoppedTyping');
        socket.off('userStatusChanged');
        socket.off('call-offer');
        
        // Clear timeouts on cleanup
        if (viewingTimeoutRef.current) {
          clearTimeout(viewingTimeoutRef.current);
        }
        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current);
        }
      };
    }
  }, [socket, conversation, currentUser.id]);

  useEffect(() => {
    // Scroll to bottom when messages change
    // Use requestAnimationFrame to ensure DOM is updated first
    if (messages.length > 0) {
      requestAnimationFrame(() => {
        scrollToBottom();
      });
    }
  }, [messages]);

  // Auto scroll when typing users change
  useEffect(() => {
    if (typingUsers && typingUsers.length > 0) {
      setTimeout(() => {
        scrollToBottom();
      }, 100);
    }
  }, [typingUsers]);

  // Scroll to bottom when loading finishes (messages loaded)
  useEffect(() => {
    if (!loading && conversation && messages.length > 0) {
      // Use multiple attempts to ensure scroll works on mobile
      const timeouts = [];
      
      // Attempt 1: Immediate after loading finishes
      requestAnimationFrame(() => {
        scrollToBottom(true);
      });
      
      // Attempt 2: After a short delay for DOM update
      timeouts.push(setTimeout(() => {
        scrollToBottom(true);
      }, 50));
      
      // Attempt 3: After DOM is fully rendered
      timeouts.push(setTimeout(() => {
        scrollToBottom(true);
      }, 150));
      
      // Attempt 4: Final check after animation frames
      timeouts.push(setTimeout(() => {
        scrollToBottom(true);
      }, 300));
      
      // Cleanup timeouts on unmount or when dependencies change
      return () => {
        timeouts.forEach(timeout => clearTimeout(timeout));
      };
    }
  }, [loading, conversation?.id]);

  const scrollToBottom = (instant = false) => {
    if (messagesEndRef.current) {
      try {
        // Get parent container
        const messagesContainer = messagesEndRef.current.parentElement;
        
        if (messagesContainer) {
          if (instant) {
            // For instant scroll, use scrollTop directly (more reliable on mobile)
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
          } else {
            // For smooth scroll, use scrollIntoView
            messagesEndRef.current.scrollIntoView({ 
              behavior: 'smooth',
              block: 'end',
              inline: 'nearest'
            });
          }
        }
      } catch (error) {
        console.error('Error scrolling to bottom:', error);
      }
    }
  };

  const fetchMessages = async () => {
    if (!conversation) return;

    setLoading(true);
    try {
      const data = await chatAPI.getMessages(conversation.id);
      
      // Process messages once and set them
      const processedMessages = data.map(msg => ({
        ...msg,
        status: msg.sender_id !== currentUser.id ? 'read' : msg.status
      }));
      
      setMessages(processedMessages);
      
      // Mark all messages as read in database immediately
      await markAllMessagesAsRead();
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAllMessagesAsRead = async () => {
    if (!conversation) return;
    
    try {
      const data = await chatAPI.markAllAsRead(conversation.id);
      console.log('Marked all messages as read:', data);
      
      // Emit socket event to notify other users
      if (socket && data.readCount > 0) {
        socket.emit('markMessagesAsRead', {
          conversationId: conversation.id,
          messageIds: [], // Empty array indicates all messages
          userId: currentUser.id
        });
      }
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !conversation) return;

    const messageText = newMessage.trim();
    setNewMessage('');

    // Stop typing when sending message
    if (isTyping) {
      setIsTyping(false);
      if (socket) {
        socket.emit('stopTyping', {
          conversationId: conversation.id,
          userId: currentUser.id,
          username: currentUser.username,
          fullName: currentUser.fullName
        });
      }
    }

    // Clear typing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    try {
      // Send message via API
      await chatAPI.sendMessage(conversation.id, messageText, 'text');

      // Send message via socket for real-time delivery
      if (socket) {
        socket.emit('sendMessage', {
          receiverId: conversation.other_user_id,
          message: messageText,
          senderId: currentUser.id,
          conversationId: conversation.id
        });
        console.log('Sent message via socket:', {
          receiverId: conversation.other_user_id,
          message: messageText,
          senderId: currentUser.id,
          conversationId: conversation.id
        });
      }

      // Add message to local state immediately
      const newMsg = {
        id: Date.now(), // Temporary ID
        content: messageText,
        sender_id: currentUser.id,
        created_at: new Date().toISOString(),
        username: currentUser.username,
        full_name: currentUser.fullName,
        avatar_url: currentUser.avatar_url,
        status: 'sent' // Initial status
      };

      setMessages(prev => [...prev, newMsg]);

      // Auto scroll to bottom when sending new message
      setTimeout(() => {
        scrollToBottom();
      }, 100);

      // Update sidebar immediately
      if (onMessageSent) {
        onMessageSent(conversation.id, messageText, new Date().toISOString());
      }

      // Simulate message delivery after a short delay
      setTimeout(() => {
        setMessages(prev => prev.map(msg => 
          msg.id === newMsg.id ? { ...msg, status: 'delivered' } : msg
        ));
      }, 500);

      // If other user is currently viewing, mark as read immediately
      if (otherUserViewing) {
        setMessages(prev => prev.map(msg => 
          msg.id === newMsg.id ? { ...msg, status: 'read' } : msg
        ));
      }
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const handleCall = (conversation) => {
    console.log('Calling:', conversation.full_name || conversation.username);
    setIsVideoCall(false);
    setIsIncomingCall(false);
    setShowPermissionRequest(true);
  };

  const handleVideoCall = (conversation) => {
    console.log('Video calling:', conversation.full_name || conversation.username);
    setIsVideoCall(true);
    setIsIncomingCall(false);
    setShowPermissionRequest(true);
  };

  const handlePermissionAllow = () => {
    setShowPermissionRequest(false);
    setShowVideoCall(true);
  };

  const handlePermissionDeny = () => {
    setShowPermissionRequest(false);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e);
    }
  };

  const handleTyping = (e) => {
    const value = e.target.value;
    setNewMessage(value);

    if (!isTyping && value.length > 0) {
      setIsTyping(true);
      // Emit typing status
      if (socket && conversation) {
        socket.emit('typing', {
          conversationId: conversation.id,
          userId: currentUser.id,
          isTyping: true,
          username: currentUser.username,
          fullName: currentUser.fullName
        });
      }
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set timeout to stop typing after 2 seconds of inactivity
    typingTimeoutRef.current = setTimeout(() => {
      if (isTyping) {
        setIsTyping(false);
        // Emit stop typing status
        if (socket && conversation) {
          socket.emit('stopTyping', {
            conversationId: conversation.id,
            userId: currentUser.id,
            username: currentUser.username,
            fullName: currentUser.fullName
          });
        }
      }
    }, 2000);
  };

  const handleEmojiSelect = (emoji) => {
    setNewMessage(prev => prev + emoji);
    setShowEmojiPicker(false);
  };

  const handleImageSelect = (file) => {
    setSelectedImage(file);
  };

  const handleSendImage = async (file) => {
    if (!conversation) return;

    try {
      // Create FormData for file upload
      const formData = new FormData();
      formData.append('image', file);
      formData.append('conversationId', conversation.id);

      // Upload image
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://192.168.0.102:5000/api'}/chat/upload-image`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });

      const data = await response.json();
      
      if (data.success) {
        // Send image message
        await chatAPI.sendMessage(conversation.id, data.imageUrl, 'image', data.imageUrl);

        // Send via socket for real-time delivery
        if (socket) {
          socket.emit('sendMessage', {
            receiverId: conversation.other_user_id,
            message: data.imageUrl,
            senderId: currentUser.id,
            conversationId: conversation.id,
            messageType: 'image'
          });
        }

        // Add message to local state
        const newMsg = {
          id: Date.now(),
          content: data.imageUrl,
          sender_id: currentUser.id,
          created_at: new Date().toISOString(),
          username: currentUser.username,
          full_name: currentUser.fullName,
          avatar_url: currentUser.avatar_url,
          message_type: 'image',
          status: 'sent'
        };

        setMessages(prev => [...prev, newMsg]);

        // Update sidebar
        if (onMessageSent) {
          onMessageSent(conversation.id, '[Ảnh]', new Date().toISOString());
        }

        // Mark as delivered
        setTimeout(() => {
          setMessages(prev => prev.map(msg => 
            msg.id === newMsg.id ? { ...msg, status: 'delivered' } : msg
          ));
        }, 500);

        // Mark as read if other user is viewing
        if (otherUserViewing) {
          setTimeout(() => {
            setMessages(prev => prev.map(msg => 
              msg.id === newMsg.id ? { ...msg, status: 'read' } : msg
            ));
          }, 1000);
        }

        // Clear selected image
        setSelectedImage(null);
      }
    } catch (error) {
      console.error('Error sending image:', error);
      alert('Có lỗi xảy ra khi gửi ảnh');
    }
  };

  const handleImageCancel = () => {
    setSelectedImage(null);
  };

  const loadConversationSettings = async () => {
    if (!conversation) return;
    
    try {
      const settings = await chatAPI.getConversationSettings(conversation.id);
      
      // Store settings directly for the conversation
      const settingsObj = {};
      if (settings && settings.nickname) {
        settingsObj.nickname = settings.nickname;
      }
      
      setConversationSettings(settingsObj);
      
      // Reload sidebar to update nickname display
      if (onSidebarReload) {
        onSidebarReload();
      }
    } catch (error) {
      console.error('Error loading conversation settings:', error);
    }
  };

  if (!conversation) {
    // On mobile, don't show empty state - let the parent component handle sidebar display
    if (isMobile) {
      return null;
    }
    
    return (
      <ChatContainer>
        <EmptyState>
          <div 
            className="mobile-icon"
            style={{ 
              fontSize: '4rem', 
              marginBottom: '1rem',
              background: 'linear-gradient(135deg, #0068ff, #00a651)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))',
              position: 'relative',
              zIndex: 1
            }}>
            💬
          </div>
          <h2>Chọn một cuộc trò chuyện</h2>
          <p>Bắt đầu trò chuyện với bạn bè của bạn</p>
          <div 
            className="mobile-button"
            style={{ 
              marginTop: '1.5rem',
              padding: '0.75rem 1.5rem',
              background: 'linear-gradient(135deg, #0068ff, #00a651)',
              color: 'white',
              borderRadius: '25px',
              fontSize: '0.9rem',
              fontWeight: '500',
              boxShadow: '0 4px 12px rgba(0, 104, 255, 0.3)',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              position: 'relative',
              zIndex: 1,
              border: 'none',
              outline: 'none',
              display: 'inline-block'
            }}
            onMouseEnter={(e) => {
              e.target.style.transform = 'translateY(-2px)';
              e.target.style.boxShadow = '0 6px 16px rgba(0, 104, 255, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = '0 4px 12px rgba(0, 104, 255, 0.3)';
            }}
            >
            ✨ Khám phá ngay
          </div>
        </EmptyState>
      </ChatContainer>
    );
  }

  return (
    <ChatContainer>
      <ChatHeader>
        {isMobile && (
          <BackButton onClick={onBackToSidebar}>
            <FiArrowLeft size={20} />
          </BackButton>
        )}
        <Avatar color={getAvatarColor(conversation.full_name)}>
          {conversation.avatar_url ? (
            <img src={getAvatarURL(conversation.avatar_url)} alt={conversation.full_name} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
          ) : (
            getInitials(conversation.full_name)
          )}
          {conversation.status === 'online' && <OnlineIndicator />}
        </Avatar>
        <UserInfo>
          <UserName onClick={() => setShowOptionsMenu(true)}>
            {conversationSettings?.nickname || conversation.full_name || conversation.username}
          </UserName>
          <UserStatus>
            {conversation.status === 'online' ? 'Đang hoạt động' : 
             conversation.status === 'recently_active' ? `Hoạt động ${getTimeAgo(conversation.last_seen)}` :
             conversation.status === 'away' ? `Không có mặt ${getTimeAgo(conversation.last_seen)}` : 
             conversation.last_seen ? `Ngoại tuyến ${getTimeAgo(conversation.last_seen)}` : 'Ngoại tuyến'}
          </UserStatus>
        </UserInfo>
        <CallButtons>
          <CallButton 
            className="call"
            onClick={() => handleCall(conversation)}
            title="Gọi thoại"
          >
            <FiPhone />
          </CallButton>
          <CallButton 
            className="video"
            onClick={() => handleVideoCall(conversation)}
            title="Gọi video"
          >
            <FiVideo />
          </CallButton>
        </CallButtons>
      </ChatHeader>

      <MessagesContainer>
        {loading ? (
          <div>Đang tải tin nhắn...</div>
        ) : (
          <>
            <MessageList 
              messages={messages} 
              currentUserId={currentUser.id}
            />
            <TypingIndicator 
              typingUsers={typingUsers} 
              conversationSettings={conversationSettings}
            />
            <div ref={messagesEndRef} />
          </>
        )}
      </MessagesContainer>

      <MessageInputContainer keyboardOffset={keyboardOffset}>
        {selectedImage && (
          <ImageUpload
            onImageSelect={handleImageSelect}
            onSendImage={handleSendImage}
            onCancel={handleImageCancel}
            selectedImage={selectedImage}
            showPreview={true}
          />
        )}
        
        <InputForm onSubmit={handleSendMessage}>
          <ActionButton
            onClick={() => {
              // Handle attachment/plus button click
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
          </ActionButton>
          
          <MessageInput
            value={newMessage}
            onChange={handleTyping}
            onKeyPress={handleKeyPress}
            onFocus={(e) => {
              // Mobile: Scroll container to bottom khi keyboard xuất hiện
              if (window.innerWidth <= 768) {
                const messagesContainer = document.querySelector('[class*="MessagesContainer"]');
                if (messagesContainer) {
                  setTimeout(() => {
                    messagesContainer.scrollTop = messagesContainer.scrollHeight;
                  }, 100);
                }
              }
            }}
            onBlur={() => {
              // Scroll lại khi đóng keyboard (optional)
            }}
            placeholder="Tin nhắn"
            rows={1}
          />
          
          <EmojiToggleButton
            isActive={showEmojiPicker}
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            title="Emoji"
          >
            <FiSmile size={20} />
          </EmojiToggleButton>
          
          {newMessage.trim() ? (
            <SendButton 
              type="submit" 
              disabled={!newMessage.trim() && !selectedImage}
              title="Gửi tin nhắn"
            >
              <FiSend size={20} />
            </SendButton>
          ) : (
            <VoiceButton
              onClick={() => {
                // Handle voice message recording
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
      />
      
      {showProfile && (
        <ProfilePage
          user={conversation}
          onBack={() => setShowProfile(false)}
          onLogout={() => {
            // Handle logout if needed
            console.log('Logout from profile');
          }}
          isOwnProfile={false}
        />
      )}

      {showPermissionRequest && (
        <PermissionRequest
          isVideoCall={isVideoCall}
          conversationName={conversation.full_name || conversation.username}
          onAllow={handlePermissionAllow}
          onDeny={handlePermissionDeny}
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
    </ChatContainer>
  );
};

export default ChatArea;
