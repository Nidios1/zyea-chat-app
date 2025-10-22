import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { FiSearch, FiPlus, FiMessageCircle, FiUser } from 'react-icons/fi';
import { chatAPI } from '../../utils/api';
import { getInitials } from '../../utils/nameUtils';

const SidebarContainer = styled.div`
  width: 300px;
  background: var(--bg-secondary, #f8f9fa);
  border-right: 1px solid var(--border-color, #e1e5e9);
  display: flex;
  flex-direction: column;

  @media (max-width: 768px) {
    width: 100%;
    height: 100%;
    position: absolute;
    top: 0;
    left: 0;
    z-index: 100;
    transform: ${props => props.isVisible ? 'translateX(0)' : 'translateX(-100%)'};
    transition: transform 0.3s ease;
  }
`;

const MobileOverlay = styled.div`
  display: none;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 99;

  @media (max-width: 768px) {
    display: ${props => props.isVisible ? 'block' : 'none'};
  }
`;

const SearchContainer = styled.div`
  padding: 1rem;
  border-bottom: 1px solid var(--border-color, #e1e5e9);
  background: var(--bg-primary, white);

  @media (max-width: 768px) {
    padding: 0.75rem;
  }
`;

const SearchInput = styled.input`
  width: 100%;
  padding: 0.75rem 1rem;
  border: 1px solid var(--border-color, #ddd);
  border-radius: 20px;
  font-size: 14px;
  outline: none;
  background: var(--bg-secondary, #f5f5f5);
  color: var(--text-primary, #000);
  transition: all 0.2s ease;

  &:focus {
    border-color: var(--primary-color, #0068ff);
    background: var(--bg-primary, white);
  }

  &::placeholder {
    color: var(--text-tertiary, #999);
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 0.5rem;
  margin-top: 0.5rem;
  flex-wrap: wrap;

  @media (max-width: 768px) {
    gap: 0.25rem;
    margin-top: 0.75rem;
  }
`;

const ButtonRow = styled.div`
  display: flex;
  gap: 0.5rem;
  width: 100%;

  @media (max-width: 768px) {
    gap: 0.25rem;
  }
`;

const NewChatButton = styled.button`
  flex: 1;
  padding: 0.75rem;
  background: var(--primary-color, #0068ff);
  color: white;
  border: none;
  border-radius: 20px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s ease;

  &:hover {
    background: var(--accent-color, #0056cc);
  }

  &:active {
    opacity: 0.8;
  }

  @media (max-width: 768px) {
    padding: 0.5rem;
    font-size: 12px;
    gap: 0.25rem;
  }
`;

const AddFriendButton = styled.button`
  flex: 1;
  padding: 0.75rem;
  background: #00a651;
  color: white;
  border: none;
  border-radius: 20px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s ease;

  &:hover {
    background: #008f47;
  }

  &:active {
    opacity: 0.8;
  }

  @media (max-width: 768px) {
    padding: 0.5rem;
    font-size: 12px;
    gap: 0.25rem;
  }
`;

const FriendsListButton = styled.button`
  flex: 1;
  padding: 0.75rem;
  background: #9b59b6;
  color: white;
  border: none;
  border-radius: 20px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s ease;

  &:hover {
    background: #8e44ad;
  }

  @media (max-width: 768px) {
    padding: 0.5rem;
    font-size: 12px;
    gap: 0.25rem;
  }
`;

const ConversationsList = styled.div`
  flex: 1;
  overflow-y: auto;
  background: var(--bg-primary, white);

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
`;

const ConversationItem = styled.div`
  padding: 1rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  transition: all 0.2s ease;
  background: ${props => props.selected ? 'var(--bg-secondary, #e3f2fd)' : 'var(--bg-primary, white)'};
  border-bottom: 1px solid var(--border-color, #f0f0f0);

  &:hover {
    background: ${props => props.selected ? 'var(--bg-secondary, #e3f2fd)' : 'var(--bg-secondary, #f5f5f5)'};
  }

  &:active {
    opacity: 0.8;
  }

  @media (max-width: 768px) {
    padding: 0.75rem;
    gap: 0.5rem;
  }
`;

const Avatar = styled.div`
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: ${props => props.color || '#00a651'};
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  color: white;
  font-size: 1.1rem;
  position: relative;
  flex-shrink: 0;

  @media (max-width: 768px) {
    width: 40px;
    height: 40px;
    font-size: 1rem;
  }
`;

const OnlineIndicator = styled.div`
  position: absolute;
  bottom: 2px;
  right: 2px;
  width: 12px;
  height: 12px;
  background: #00a651;
  border: 2px solid var(--bg-primary, white);
  border-radius: 50%;
`;

const RecentlyActiveIndicator = styled.div`
  position: absolute;
  bottom: 2px;
  right: 2px;
  width: 12px;
  height: 12px;
  background: #ffa500;
  border: 2px solid var(--bg-primary, white);
  border-radius: 50%;
`;

const AwayIndicator = styled.div`
  position: absolute;
  bottom: 2px;
  right: 2px;
  width: 12px;
  height: 12px;
  background: #ff6b6b;
  border: 2px solid var(--bg-primary, white);
  border-radius: 50%;
`;

const ConversationInfo = styled.div`
  flex: 1;
  min-width: 0;
`;

const ConversationName = styled.h3`
  margin: 0;
  font-size: 15px;
  color: var(--text-primary, #333);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-weight: 500;
`;

const LastMessage = styled.p`
  margin: 0.25rem 0 0 0;
  font-size: 13px;
  color: var(--text-secondary, #666);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 1.3;
`;

const TimeStamp = styled.span`
  font-size: 11px;
  color: #999;
  white-space: nowrap;
  margin-top: 0.25rem;
`;

const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 200px;
  color: #666;
  text-align: center;
  padding: 2rem;
  
  svg {
    margin-bottom: 1rem;
    opacity: 0.5;
  }
  
  p {
    margin: 0.5rem 0;
    font-size: 14px;
  }
`;

const Sidebar = ({ 
  conversations, 
  selectedConversation, 
  onConversationSelect, 
  onNewChat,
  onAddFriend,
  onShowFriends,
  socket,
  reloadKey,
  isVisible = true,
  onClose
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [conversationSettings, setConversationSettings] = useState({});
  
  console.log('Sidebar conversations:', conversations);
  console.log('Conversations length:', conversations?.length || 0);
  console.log('Socket connected:', socket?.connected);
  
  // Load conversation settings for all conversations
  const loadConversationSettings = async () => {
    if (!conversations || conversations.length === 0) return;
    
    const settings = {};
    for (const conversation of conversations) {
      try {
        const data = await chatAPI.getConversationSettings(conversation.id);
        settings[conversation.id] = data;
      } catch (error) {
        console.error(`Error loading settings for conversation ${conversation.id}:`, error);
      }
    }
    setConversationSettings(settings);
  };

  // Debug: Log when conversations change
  useEffect(() => {
    console.log('Sidebar: Conversations changed:', conversations);
    loadConversationSettings();
  }, [conversations]);

  // Reload settings when reloadKey changes
  useEffect(() => {
    if (reloadKey > 0) {
      loadConversationSettings();
    }
  }, [reloadKey]);

  // Handle socket events for status changes
  useEffect(() => {
    if (socket) {
      const handleUserStatusChanged = (data) => {
        console.log('Sidebar: User status changed:', data);
        // This will be handled by the parent component (Chat.js)
        // The parent will update conversations and pass them down as props
      };

      socket.on('userStatusChanged', handleUserStatusChanged);

      return () => {
        socket.off('userStatusChanged', handleUserStatusChanged);
      };
    }
  }, [socket]);

  const filteredConversations = Array.isArray(conversations) ? conversations.filter(conv => {
    if (!conv) return false;
    console.log('Filtering conversation:', conv);
    
    // If no search term, show all conversations with valid user info
    if (!searchTerm.trim()) {
      return conv.other_user_id && (conv.full_name || conv.username);
    }
    
    // Check if conversation has user info
    if (!conv.other_user_id) {
      console.log('Conversation has no other_user_id, skipping');
      return false;
    }
    
    return conv.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
           conv.username?.toLowerCase().includes(searchTerm.toLowerCase());
  }) : [];
  
  console.log('Filtered conversations:', filteredConversations);
  console.log('Filtered conversations length:', filteredConversations.length);

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) {
      return date.toLocaleTimeString('vi-VN', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    } else if (days === 1) {
      return 'Hôm qua';
    } else if (days < 7) {
      return date.toLocaleDateString('vi-VN', { weekday: 'short' });
    } else {
      return date.toLocaleDateString('vi-VN', { 
        day: '2-digit', 
        month: '2-digit' 
      });
    }
  };

  const getAvatarColor = (name) => {
    const colors = ['#3498db', '#e74c3c', '#2ecc71', '#f39c12', '#9b59b6', '#1abc9c'];
    const index = name?.charCodeAt(0) % colors.length || 0;
    return colors[index];
  };

  return (
    <>
      <MobileOverlay isVisible={isVisible} onClick={onClose} />
      <SidebarContainer isVisible={isVisible}>
      <SearchContainer>
        <SearchInput
          type="text"
          placeholder="Tìm kiếm cuộc trò chuyện..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <ButtonGroup>
          <ButtonRow>
            <NewChatButton onClick={onNewChat}>
              <FiPlus size={16} />
              Cuộc trò chuyện mới
            </NewChatButton>
            <AddFriendButton onClick={onAddFriend}>
              <FiUser size={16} />
              Tìm bạn bè
            </AddFriendButton>
          </ButtonRow>
          <ButtonRow>
            <FriendsListButton onClick={onShowFriends}>
              <FiMessageCircle size={16} />
              Danh sách bạn bè
            </FriendsListButton>
          </ButtonRow>
        </ButtonGroup>
      </SearchContainer>

      <ConversationsList>
        {!conversations || conversations.length === 0 ? (
          <EmptyState>
            <FiMessageCircle size={48} />
            <p>Chưa có cuộc trò chuyện nào</p>
            <p>Nhấn "Cuộc trò chuyện mới" để bắt đầu</p>
          </EmptyState>
        ) : (Array.isArray(conversations) ? conversations.filter(conv => conv.other_user_id) : []).length === 0 ? (
          <EmptyState>
            <FiMessageCircle size={48} />
            <p>Chưa có cuộc trò chuyện nào</p>
            <p>Nhấn "Cuộc trò chuyện mới" để bắt đầu</p>
          </EmptyState>
        ) : filteredConversations.length === 0 ? (
          <EmptyState>
            <FiMessageCircle size={48} />
            <p>Không tìm thấy cuộc trò chuyện nào</p>
            <p>Thử tìm kiếm với từ khóa khác</p>
          </EmptyState>
        ) : (
          filteredConversations.map((conversation) => {
            if (!conversation) return null;
            console.log('Rendering conversation:', conversation);
            return (
              <ConversationItem
                key={conversation.id}
                selected={selectedConversation?.id === conversation.id}
                onClick={() => {
                  console.log('Conversation clicked:', conversation);
                  onConversationSelect(conversation);
                }}
              >
                <Avatar color={getAvatarColor(conversation.full_name)}>
                  {conversation.avatar_url ? (
                    <img src={conversation.avatar_url} alt={conversation.full_name} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                  ) : (
                    getInitials(conversation.full_name)
                  )}
                  {conversation.status === 'online' && <OnlineIndicator />}
                  {conversation.status === 'recently_active' && <RecentlyActiveIndicator />}
                  {conversation.status === 'away' && <AwayIndicator />}
                </Avatar>
                <ConversationInfo>
                  <ConversationName>
                    {conversationSettings[conversation.id]?.nickname || conversation.full_name || conversation.username}
                  </ConversationName>
                  <LastMessage>
                    {conversation.last_message || 'Chưa có tin nhắn'}
                  </LastMessage>
                </ConversationInfo>
                <TimeStamp>
                  {formatTime(conversation.last_message_time)}
                </TimeStamp>
              </ConversationItem>
            );
          })
        )}
      </ConversationsList>
    </SidebarContainer>
    </>
  );
};

export default Sidebar;

