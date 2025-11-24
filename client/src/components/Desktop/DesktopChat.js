import React, { useState, useEffect, useContext } from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import { FiLogOut, FiSearch, FiPlus, FiMoreVertical, FiSun, FiMoon, FiSettings } from 'react-icons/fi';
import AuthContext from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import Sidebar from './DesktopSidebar';
import DesktopChatArea from './DesktopChatArea';
import WelcomeScreen from './WelcomeScreen';
import UserSearch from '../Shared/Chat/UserSearch';
import FriendsList from '../Shared/Chat/FriendsList';
import ProfilePage from '../Shared/Profile/ProfilePage';
import PersonalProfilePage from '../Shared/Profile/PersonalProfilePage';
import NewsFeed from '../Shared/NewsFeed/NewsFeed';
import Friends from '../Shared/Friends/Friends';
import NotificationBell from '../Shared/Notifications/NotificationBell';
import NotificationCenter from '../Shared/Notifications/NotificationCenter';
import MobileSidebar from '../Mobile/MobileSidebar';
import useSocket from '../../hooks/useSocket';
import { chatAPI } from '../../utils/api';
import { getInitials } from '../../utils/nameUtils';
import { getAvatarURL, getUploadedImageURL } from '../../utils/imageUtils';

const Container = styled.div`
  display: flex;
  height: 100vh;
  height: 100dvh;
  width: 100vw;
  background: ${props => props.$isDark ? '#1a1a1a' : '#f5f5f5'};
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  overflow: hidden;
  margin: 0;
  padding: 0;

  @media (max-width: 768px) {
    flex-direction: column;
  }
`;

const Header = styled.div`
  background: #0068ff;
  color: white;
  padding: 0 1rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1000;
  height: 60px;
  box-shadow: 0 2px 8px rgba(0, 104, 255, 0.3);

  @media (max-width: 768px) {
    /* Add safe area for notch/status bar */
    padding: env(safe-area-inset-top) 0.5rem 0 0.5rem;
    height: calc(56px + env(safe-area-inset-top));
  }
`;

const Logo = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  
  .logo-icon {
    width: 32px;
    height: 32px;
    background: white;
    border-radius: 7px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: bold;
    color: #0068ff;
    font-size: 18px;
  }
  
  .logo-text {
    font-size: 1.5rem;
    margin: 0;
    font-weight: 700;
    color: white;
  }
`;

const UserInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  min-width: 0;
  flex: 1;
  justify-content: flex-end;

  @media (max-width: 768px) {
    gap: 0.5rem;
  }

  @media (max-width: 480px) {
    gap: 0.25rem;
  }
`;

const UserProfile = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.25rem 0.5rem;
  border-radius: 20px;
  transition: all 0.2s ease;
  max-width: 200px;
  min-width: 0;
  
  &:hover {
    background: rgba(255, 255, 255, 0.1);
  }

  @media (max-width: 768px) {
    gap: 0.375rem;
    padding: 0.2rem 0.4rem;
    max-width: 150px;
  }

  @media (max-width: 480px) {
    gap: 0.25rem;
    padding: 0.15rem 0.3rem;
    max-width: 120px;
  }
`;

const Avatar = styled.div`
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: #00a651;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 1rem;
  color: white;
  border: 2px solid white;
  transition: all 0.2s ease;
  flex-shrink: 0;

  &:hover {
    transform: scale(1.05);
  }

  @media (max-width: 768px) {
    width: 32px;
    height: 32px;
    font-size: 0.9rem;
  }

  @media (max-width: 480px) {
    width: 28px;
    height: 28px;
    font-size: 0.8rem;
  }
`;

const UserName = styled.span`
  font-weight: 500;
  font-size: 0.9rem;
  color: white;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 120px;

  @media (max-width: 768px) {
    max-width: 80px;
    font-size: 0.8rem;
  }

  @media (max-width: 480px) {
    max-width: 60px;
    font-size: 0.75rem;
  }
`;

const ThemeToggleButton = styled.button`
  background: none;
  border: none;
  color: white;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 50%;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  flex-shrink: 0;

  &:hover {
    background: rgba(255, 255, 255, 0.1);
  }

  @media (max-width: 768px) {
    width: 32px;
    height: 32px;
    padding: 0.4rem;
  }

  @media (max-width: 480px) {
    width: 28px;
    height: 28px;
    padding: 0.3rem;
  }
`;

const AdminButton = styled.button`
  background: none;
  border: none;
  color: white;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 50%;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  flex-shrink: 0;

  &:hover {
    background: rgba(255, 255, 255, 0.1);
  }

  @media (max-width: 768px) {
    width: 32px;
    height: 32px;
    padding: 0.4rem;
  }

  @media (max-width: 480px) {
    width: 28px;
    height: 28px;
    padding: 0.3rem;
  }
`;

const LogoutButton = styled.button`
  background: none;
  border: none;
  color: white;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 50%;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  flex-shrink: 0;

  &:hover {
    background: rgba(255, 255, 255, 0.1);
  }

  @media (max-width: 768px) {
    width: 32px;
    height: 32px;
    padding: 0.4rem;
  }

  @media (max-width: 480px) {
    width: 28px;
    height: 28px;
    padding: 0.3rem;
  }
`;

const MobileMenuButton = styled.button`
  background: none;
  border: none;
  color: white;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 50%;
  transition: all 0.2s ease;
  display: none;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  flex-shrink: 0;

  &:hover {
    background: rgba(255, 255, 255, 0.1);
  }

  @media (max-width: 768px) {
    display: flex;
    width: 32px;
    height: 32px;
    padding: 0.4rem;
  }

  @media (max-width: 480px) {
    width: 28px;
    height: 28px;
    padding: 0.3rem;
  }
`;

const MainContent = styled.div`
  display: flex;
  height: 100vh;
  width: 100%;
  position: relative;
  z-index: 1;

  @media (max-width: 768px) {
    height: calc(100vh - env(safe-area-inset-top) - env(safe-area-inset-bottom));
    flex-direction: column;
  }
`;

const Chat = () => {
  const { user, logout } = useContext(AuthContext);
  const { isDarkMode, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [showUserSearch, setShowUserSearch] = useState(false);
  const [conversations, setConversations] = useState([]);
  const [showAddFriend, setShowAddFriend] = useState(false);
  const [showFriendsList, setShowFriendsList] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showNewsFeed, setShowNewsFeed] = useState(false);
  const [showFriends, setShowFriends] = useState(false);
  const [showNotificationCenter, setShowNotificationCenter] = useState(false);
  const [sidebarReloadKey, setSidebarReloadKey] = useState(0);
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);
  
  // Detect mobile NGAY từ đầu để tránh flash PC UI
  const [isMobile, setIsMobile] = useState(() => {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || 
           window.innerWidth <= 768;
  });
  
  const socket = useSocket();

  useEffect(() => {
    console.log('Chat component mounted, fetching conversations...');
    fetchConversations();
    
    // Detect mobile screen size changes (resize only)
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    window.addEventListener('resize', checkMobile);
    
    // Force update user status when component mounts
    if (user && socket) {
      console.log('Force updating user status on mount');
      socket.emit('join', user.id);
    }
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // On mobile, show sidebar instead of auto-selecting conversation
  // This allows users to see the conversation list and choose manually

  // Periodic status refresh to ensure accuracy
  useEffect(() => {
    const statusRefreshInterval = setInterval(() => {
      if (socket && user) {
        console.log('Periodic status refresh');
        fetchConversations();
      }
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(statusRefreshInterval);
  }, [socket, user]);

  useEffect(() => {
    if (socket && user) {
      console.log('Setting up socket listeners for user:', user.id);
      // Join user to their personal room
      socket.emit('join', user.id);
      
      // Listen for session revoked event (when logged out from another device)
      socket.on('session-revoked', (data) => {
        console.log('🔒 Session revoked via socket:', data);
        
        // Check if this is our session being revoked
        const currentToken = localStorage.getItem('token') || sessionStorage.getItem('token');
        if (!currentToken) return; // No token, nothing to check
        
        let shouldLogout = false;
        
        if (data.reason === 'logged_out') {
          // Specific session logout - check if it's our session
          shouldLogout = data.sessionId === currentToken;
        } else if (data.reason === 'logged_out_all_other') {
          // Logout all other - only logout if our token is in the revoked list
          shouldLogout = data.revokedSessions && data.revokedSessions.includes(currentToken);
        }
        
        if (shouldLogout) {
          console.log('🔒 Our session was revoked, logging out...');
          // Trigger logout immediately
          window.dispatchEvent(new CustomEvent('session-revoked', {
            detail: { reason: data.reason || 'socket_revoked' }
          }));
        }
      });
      
      // Force refresh conversations to get latest status
      setTimeout(() => {
        fetchConversations();
      }, 1000);

      // Listen for new messages
      socket.on('receiveMessage', (data) => {
        console.log('Received new message:', data);
        
        // Safety check for data and required properties
        if (!data || !data.senderId) {
          console.error('Invalid receiveMessage data:', data);
          return;
        }
        
        // Update conversations list with new message
        setConversations(prev => {
          const updated = prev.map(conv => {
            if (conv.other_user_id === data.senderId) {
              console.log('Updating conversation:', conv.id, 'with new message');
              return {
                ...conv,
                last_message: data.message || '',
                last_message_time: data.timestamp || new Date().toISOString(),
                updated_at: data.timestamp || new Date().toISOString()
              };
            }
            return conv;
          });
          
          // If conversation doesn't exist, we might need to fetch it
          const existingConv = updated.find(conv => conv.other_user_id === data.senderId);
          if (!existingConv) {
            console.log('Conversation not found, fetching conversations...');
            fetchConversations();
            return prev; // Return previous state while fetching
          }
          
          // Sort by updated_at to show most recent first
          return updated.sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));
        });
      });

      // Listen for conversation updates (when user sends a message)
      socket.on('conversationUpdated', (data) => {
        console.log('Conversation updated event received:', data);
        
        // Safety check for data and required properties
        if (!data || !data.conversationId) {
          console.error('Invalid conversationUpdated data:', data);
          return;
        }
        
        // Update conversations list with new message
        setConversations(prev => {
          const updated = prev.map(conv => {
            if (conv.id === data.conversationId) {
              console.log('Updating conversation:', conv.id, 'with new message:', data.lastMessage);
              return {
                ...conv,
                last_message: data.lastMessage || '',
                last_message_time: data.timestamp || new Date().toISOString(),
                updated_at: data.timestamp || new Date().toISOString()
              };
            }
            return conv;
          });
          
          // Sort by updated_at to show most recent first
          return updated.sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));
        });
      });

      // Listen for user status changes
      socket.on('userStatusChanged', (data) => {
        console.log('User status changed:', data);
        
        // Safety check for data and required properties
        if (!data || !data.userId) {
          console.error('Invalid userStatusChanged data:', data);
          return;
        }
        
        // Update conversations list with new status
        setConversations(prev => {
          const updated = prev.map(conv => {
            if (conv.other_user_id === data.userId) {
              console.log('Updating user status:', data.userId, 'to', data.status);
              return {
                ...conv,
                status: data.status || 'offline',
                last_seen: data.lastSeen || new Date().toISOString()
              };
            }
            return conv;
          });
          
          return updated;
        });
      });

      // Listen for current user's own status changes
      socket.on('myStatusChanged', (data) => {
        console.log('My status changed:', data);
        // This can be used to update UI if needed
      });

      return () => {
        socket.off('receiveMessage');
        socket.off('conversationUpdated');
        socket.off('userStatusChanged');
        socket.off('session-revoked');
      };
    }
  }, [socket, user]);

  const fetchConversations = async () => {
    try {
      console.log('🔄 Fetching conversations...');
      const data = await chatAPI.getConversations();
      console.log('✅ Fetched conversations:', data);
      if (data && Array.isArray(data)) {
        setConversations(data);
      } else {
        console.warn('⚠️ Invalid conversations data:', data);
        setConversations([]);
      }
    } catch (error) {
      console.error('❌ Error fetching conversations:', error);
      setConversations([]);
    }
  };

  const handleLogout = () => {
    logout();
  };

  const handleNewChat = () => {
    setShowUserSearch(true);
    setShowAddFriend(false);
  };

  const handleAddFriend = () => {
    setShowAddFriend(true);
    setShowUserSearch(false);
    setShowFriendsList(false);
  };

  const handleShowFriends = () => {
    setShowFriendsList(true);
    setShowUserSearch(false);
    setShowAddFriend(false);
  };

  const handleSidebarReload = () => {
    setSidebarReloadKey(prev => prev + 1);
  };

  const handleNicknameUpdate = (conversationId, newNickname) => {
    console.log('handleNicknameUpdate called:', conversationId, newNickname);
    // Update conversations array to refresh timestamp
    setConversations(prev => {
      console.log('Updating conversations array');
      return prev.map(conv => {
        if (conv && conv.id === conversationId) {
          console.log('Found conversation to update:', conv);
          return {
            ...conv,
            updated_at: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };
        }
        return conv;
      });
    });
  };

  const handleUserSelect = async (selectedUser) => {
    try {
      console.log('Selected user:', selectedUser);
      console.log('Creating conversation with user ID:', selectedUser.id);
      
      const data = await chatAPI.createConversation(selectedUser.id);
      
      console.log('Conversation data:', data);
      
      // Find or create conversation
      let conversation = conversations.find(conv => 
        conv.other_user_id === selectedUser.id
      );
      
      if (!conversation) {
        conversation = {
          id: data.conversationId,
          other_user_id: selectedUser.id,
          username: selectedUser.username,
          full_name: selectedUser.full_name,
          avatar_url: selectedUser.avatar_url,
          status: selectedUser.status,
          last_message: null,
          last_message_time: null,
          updated_at: new Date().toISOString()
        };
        
        // Add to conversations list
        setConversations(prev => [conversation, ...prev]);
      }

      console.log('Selected conversation:', conversation);
      setSelectedConversation(conversation);
      setShowUserSearch(false);
      setShowAddFriend(false);
      setShowMobileSidebar(false); // Close mobile sidebar when conversation is selected
    } catch (error) {
      console.error('Error creating conversation:', error);
      alert('Có lỗi xảy ra khi tạo cuộc trò chuyện: ' + error.message);
    }
  };

  const handleConversationSelect = (conversation) => {
    setSelectedConversation(conversation);
    setShowMobileSidebar(false); // Close mobile sidebar when conversation is selected
    
    // Update user activity when selecting conversation
    if (socket && user) {
      socket.emit('userActivity', { userId: user.id });
    }
  };

  // Function to update conversation when message is sent
  const updateConversationOnMessage = (conversationId, message, timestamp) => {
    setConversations(prev => {
      const updated = prev.map(conv => {
        if (conv.id === conversationId) {
          return {
            ...conv,
            last_message: message,
            last_message_time: timestamp,
            updated_at: timestamp
          };
        }
        return conv;
      });
      
      // Sort by updated_at to show most recent first
      return updated.sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));
    });
  };

  // Use mobile sidebar as full screen app
  if (isMobile) {
    return (
      <MobileSidebar
        conversations={conversations}
        selectedConversation={selectedConversation}
        onConversationSelect={handleConversationSelect}
        onNewChat={handleNewChat}
        onAddFriend={handleAddFriend}
        onShowFriends={handleShowFriends}
        onShowNewsFeed={() => setShowNewsFeed(true)}
        onShowProfile={() => setShowProfile(true)}
        onShowNotificationCenter={() => setShowNotificationCenter(true)}
        onShowUserSearch={() => setShowUserSearch(true)}
        onShowFriendsList={() => setShowFriendsList(true)}
        onLogout={logout}
        user={user}
        socket={socket}
        onNicknameUpdate={handleNicknameUpdate}
      />
    );
  }

  return (
    <Container $isDark={isDarkMode}>
      <MainContent>
        <Sidebar
          conversations={conversations}
          selectedConversation={selectedConversation}
          onConversationSelect={handleConversationSelect}
          onNewChat={handleNewChat}
          onAddFriend={handleAddFriend}
          onShowFriends={handleShowFriends}
          socket={socket}
          reloadKey={sidebarReloadKey}
          isVisible={showMobileSidebar}
          onClose={() => setShowMobileSidebar(false)}
          user={user}
          isDarkMode={isDarkMode}
          onShowProfile={() => setShowProfile(true)}
          onLogout={handleLogout}
          onConversationDeleted={(conversationId) => {
            // Remove deleted conversation from list
            setConversations(prev => prev.filter(conv => conv.id !== conversationId));
            // Clear selection if deleted conversation was selected
            if (selectedConversation?.id === conversationId) {
              setSelectedConversation(null);
            }
          }}
        />
        
        {showUserSearch || showAddFriend ? (
          <UserSearch
            onUserSelect={handleUserSelect}
            onClose={() => {
              setShowUserSearch(false);
              setShowAddFriend(false);
            }}
          />
        ) : showFriendsList ? (
          <FriendsList
            onStartChat={handleUserSelect}
            onClose={() => setShowFriendsList(false)}
          />
        ) : selectedConversation ? (
          <DesktopChatArea 
            conversation={selectedConversation} 
            currentUser={user} 
            socket={socket}
            onMessageSent={updateConversationOnMessage}
            onSidebarReload={handleSidebarReload}
            isMobile={isMobile}
            onBackToSidebar={() => setSelectedConversation(null)}
            currentView="conversation"
          />
        ) : (
          <WelcomeScreen 
            user={user}
            isDarkMode={isDarkMode}
            onNewChat={handleNewChat}
            onCreateGroup={handleNewChat}
          />
        )}
      </MainContent>
      
      {showProfile && (
        <PersonalProfilePage
          key={`profile-${user?.id}-${user?.avatar_url || 'no-avatar'}`}
          user={user}
          onBack={() => setShowProfile(false)}
          onShowProfile={() => {
            // Keep profile open, just log for now
            console.log('View personal page clicked');
          }}
          onNavigateToTab={(tabId) => {
            setShowProfile(false);
            // Handle navigation to other tabs
            switch (tabId) {
              case 'messages':
                // Already in messages
                break;
              case 'contacts':
                handleShowFriends();
                break;
              case 'discover':
                // Handle discover
                break;
              case 'wall':
                setShowNewsFeed(true);
                break;
              case 'profile':
                // Already in profile
                break;
              default:
                break;
            }
          }}
          onLogout={handleLogout}
        />
      )}
      
      {showNewsFeed && (
        <NewsFeed
          currentUser={user}
          onBack={() => setShowNewsFeed(false)}
          onGoToMessages={() => {
            setShowNewsFeed(false);
            // Chuyển về phần chat chính
          }}
          showBottomNav={false}
        />
      )}
      
      {showFriends && (
        <Friends
          onBack={() => setShowFriends(false)}
        />
      )}
      
      {showNotificationCenter && (
        <NotificationCenter
          onBack={() => setShowNotificationCenter(false)}
        />
      )}
    </Container>
  );
};

export default Chat;
