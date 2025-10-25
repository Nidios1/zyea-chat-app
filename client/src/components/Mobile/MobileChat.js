import React, { useState, useEffect, useContext } from 'react';
import styled from 'styled-components';
import AuthContext from '../../contexts/AuthContext';
import MobileSidebar from './MobileSidebar';
import useSocket from '../../hooks/useSocket';
import { chatAPI } from '../../utils/api';

const MobileContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100vh;
  height: 100dvh;
  width: 100vw;
  background: var(--bg-primary, white);
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  overflow: hidden;
  margin: 0;
  padding: 0;

  @media (min-width: 769px) {
    display: none;
  }
`;

const MobileChat = () => {
  const { user, logout } = useContext(AuthContext);
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const socket = useSocket();

  // Load conversations
  useEffect(() => {
    const loadConversations = async () => {
      try {
        setLoading(true);
        const data = await chatAPI.getConversations();
        if (data && Array.isArray(data)) {
          setConversations(data);
        }
      } catch (error) {
        console.error('Error loading conversations:', error);
      } finally {
        setLoading(false);
      }
    };

    loadConversations();
  }, []);

  // Listen for new messages via socket
  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (message) => {
      console.log('New message received:', message);
      
      // Update conversations
      setConversations(prev => {
        const updated = prev.map(conv => {
          if (conv.id === message.conversation_id) {
            return {
              ...conv,
              last_message: message.content,
              lastMessage: message.content,
              updated_at: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              unread_count: selectedConversation?.id === message.conversation_id 
                ? conv.unread_count || 0
                : (conv.unread_count || 0) + 1,
              unreadCount: selectedConversation?.id === message.conversation_id
                ? conv.unreadCount || 0
                : (conv.unreadCount || 0) + 1
            };
          }
          return conv;
        });
        
        // Sort by updated_at
        return updated.sort((a, b) => {
          const dateA = new Date(a.updated_at || a.updatedAt || 0);
          const dateB = new Date(b.updated_at || b.updatedAt || 0);
          return dateB - dateA;
        });
      });
    };

    socket.on('new_message', handleNewMessage);

    return () => {
      socket.off('new_message', handleNewMessage);
    };
  }, [socket, selectedConversation]);

  const handleConversationSelect = (conversation) => {
    setSelectedConversation(conversation);
    
    // Mark as read when opening conversation
    if (conversation && conversation.id) {
      setConversations(prev => prev.map(conv => {
        if (conv.id === conversation.id) {
          return {
            ...conv,
            unread_count: 0,
            unreadCount: 0
          };
        }
        return conv;
      }));
    }
  };

  const handleLogout = () => {
    if (socket) {
      socket.disconnect();
    }
    logout();
  };

  const handleNicknameUpdate = async (conversationId, newNickname) => {
    try {
      // Reload conversations to get updated nickname
      const data = await chatAPI.getConversations();
      if (data && Array.isArray(data)) {
        setConversations(data);
      }
    } catch (error) {
      console.error('Error reloading conversations:', error);
    }
  };

  if (loading) {
    return (
      <MobileContainer>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          height: '100%',
          fontSize: '16px',
          color: '#666'
        }}>
          Đang tải...
        </div>
      </MobileContainer>
    );
  }

  return (
    <MobileContainer>
      <MobileSidebar
        conversations={conversations}
        selectedConversation={selectedConversation}
        onConversationSelect={handleConversationSelect}
        onNewChat={() => {
          // Handle new chat
          console.log('New chat');
        }}
        onAddFriend={() => {
          // Handle add friend
          console.log('Add friend');
        }}
        onShowFriends={() => {
          // Handle show friends
          console.log('Show friends');
        }}
        onShowProfile={() => {
          // Handle show profile
          console.log('Show profile');
        }}
        onShowNotificationCenter={() => {
          // Handle show notification center
          console.log('Show notification center');
        }}
        onShowUserSearch={() => {
          // Handle show user search
          console.log('Show user search');
        }}
        onShowFriendsList={() => {
          // Handle show friends list
          console.log('Show friends list');
        }}
        onLogout={handleLogout}
        user={user}
        socket={socket}
        onNicknameUpdate={handleNicknameUpdate}
      />
    </MobileContainer>
  );
};

export default MobileChat;

