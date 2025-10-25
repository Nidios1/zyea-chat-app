import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import MobileChatArea from './MobileChatArea';
import Friends from '../Shared/Friends/Friends';
import MobileContacts from './MobileContacts';
import PersonalProfilePage from '../Shared/Profile/PersonalProfilePage';
import NotificationCenter from '../Shared/Notifications/NotificationCenter';
import UserSearch from '../Shared/Chat/UserSearch';
import FriendsList from '../Shared/Chat/FriendsList';
import PullToRefresh from './PullToRefresh';
import QRScanner from './QRScanner';
import NewMessageModal from './NewMessageModal';
import Toast from './Toast';
import ConfirmDialog from './ConfirmDialog';
import MobileTopBar from './MobileTopBar';
import MobileTabBar from './MobileTabBar';
import MobileBottomNav from './MobileBottomNav';
import MobileConversationItem from './MobileConversationItem';
import { chatAPI } from '../../utils/api';

const MobileSidebarContainer = styled.div`
  display: none;
  flex-direction: column;
  height: 100%;
  width: 100%;
  background: var(--bg-primary, white);
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 1000;
  overflow: hidden;
  margin: 0;
  padding: 0;
  overscroll-behavior: none;
  -webkit-overflow-scrolling: touch;

  @media (max-width: 768px) {
    display: flex;
  }
`;

const Content = styled.div`
  flex: 1;
  overflow: hidden;
  background: var(--bg-primary, white);
  display: flex;
  flex-direction: column;
  position: relative;
  min-height: 0;
  
  /* DEBUG: Show the actual content area */
  /* background: rgba(255, 0, 0, 0.1) !important; */
`;

const ConversationList = styled.div`
  display: flex;
  flex-direction: column;
  position: relative;
  padding-top: 8px;
  padding-bottom: calc(68px + env(safe-area-inset-bottom, 0));
  min-height: 100%;
  box-sizing: border-box;
`;

const ViewWrapper = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: var(--bg-primary, white);
`;

const PullToRefreshWrapper = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: var(--bg-primary, white);
`;

const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  padding: 60px 20px;
  text-align: center;
  color: var(--text-secondary, #666);
`;

const EmptyIcon = styled.div`
  font-size: 48px;
  margin-bottom: 16px;
  opacity: 0.5;
`;

const EmptyText = styled.div`
  font-size: 16px;
  margin-bottom: 8px;
  font-weight: 500;
`;

const EmptySubtext = styled.div`
  font-size: 14px;
  color: #999;
  margin-bottom: 20px;
`;

const CreateButton = styled.button`
  background: #0084ff;
  color: white;
  border: none;
  border-radius: 20px;
  padding: 10px 20px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: #0066cc;
    transform: translateY(-1px);
  }

  &:active {
    transform: translateY(0);
  }
`;

const MobileSidebar = ({
  conversations = [],
  selectedConversation,
  onConversationSelect,
  onNewChat,
  onLogout,
  user,
  socket,
  onNicknameUpdate
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredConversations, setFilteredConversations] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [currentView, setCurrentView] = useState('messages');
  const [activeTab, setActiveTab] = useState('all');
  const [showFriends, setShowFriends] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showNotificationCenter, setShowNotificationCenter] = useState(false);
  const [showUserSearch, setShowUserSearch] = useState(false);
  const [showFriendsList, setShowFriendsList] = useState(false);
  const [hideBottomNav, setHideBottomNav] = useState(false);
  const [conversationSettings, setConversationSettings] = useState({});
  const [readConversations, setReadConversations] = useState(() => {
    try {
      const saved = localStorage.getItem('readConversations');
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch (error) {
      return new Set();
    }
  });
  const [localConversations, setLocalConversations] = useState(conversations);
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [showNewMessageModal, setShowNewMessageModal] = useState(false);
  const [toast, setToast] = useState(null);
  const [confirmDialog, setConfirmDialog] = useState(null);

  // Load conversations on mount
  useEffect(() => {
    const loadConversations = async () => {
      try {
        const data = await chatAPI.getConversations();
        if (data && Array.isArray(data)) {
          setLocalConversations(data);
        }
      } catch (error) {
        console.error('Error loading conversations:', error);
      }
    };

    loadConversations();
  }, []);

  // Update localConversations when conversations prop changes
  useEffect(() => {
    if (conversations && Array.isArray(conversations) && conversations.length > 0) {
      setLocalConversations(conversations);
    }
  }, [conversations]);

  // Load conversation settings
  const loadConversationSettings = async (conversationId) => {
    try {
      const settings = await chatAPI.getConversationSettings(conversationId);
      setConversationSettings(prev => ({
        ...prev,
        [conversationId]: settings
      }));
    } catch (error) {
      console.error('Error loading conversation settings:', error);
    }
  };

  // Filter conversations based on search term and active tab
  useEffect(() => {
    try {
      if (!localConversations || !Array.isArray(localConversations)) {
        setFilteredConversations([]);
        return;
      }

      let filtered = localConversations.filter(conv => {
        if (!conv) return false;
        const name = conv.full_name || conv.participant_name || conv.name || '';
        const username = conv.username || '';
        const lastMessage = conv.last_message || conv.lastMessage || '';
        const searchLower = searchTerm.toLowerCase();
        
        const matchesSearch = name.toLowerCase().includes(searchLower) || 
               username.toLowerCase().includes(searchLower) ||
               lastMessage.toLowerCase().includes(searchLower);
        
        if (!matchesSearch) return false;
        
        if (activeTab === 'all') {
          return true;
        } else if (activeTab === 'groups') {
          return conv.is_group || conv.isGroup || false;
        } else if (activeTab === 'personal') {
          return !conv.is_group && !conv.isGroup;
        } else if (activeTab === 'unread') {
          const unreadCount = conv.unread_count || conv.unreadCount || 0;
          return unreadCount > 0;
        }
        
        return true;
      });

      filtered = filtered.sort((a, b) => {
        const dateA = new Date(a.updated_at || a.updatedAt || 0);
        const dateB = new Date(b.updated_at || b.updatedAt || 0);
        return dateB - dateA;
      });

      setFilteredConversations(filtered);
    } catch (error) {
      console.error('Error filtering conversations:', error);
      setFilteredConversations([]);
    }
  }, [localConversations, searchTerm, activeTab]);

  // Load conversation settings when conversations change
  useEffect(() => {
    if (localConversations && Array.isArray(localConversations)) {
      localConversations.forEach(conv => {
        if (conv && conv.id) {
          loadConversationSettings(conv.id);
        }
      });
    }
  }, [localConversations]);

  // Calculate unread count
  useEffect(() => {
    try {
      if (!localConversations || !Array.isArray(localConversations)) {
        setUnreadCount(0);
        return;
      }

      const unread = localConversations.reduce((total, conv) => {
        if (!conv) return total;
        return total + (conv.unread_count || conv.unreadCount || 0);
      }, 0);

      setUnreadCount(unread);
    } catch (error) {
      console.error('Error calculating unread count:', error);
      setUnreadCount(0);
    }
  }, [localConversations]);

  // Save read conversations to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('readConversations', JSON.stringify([...readConversations]));
    } catch (error) {
      console.error('Error saving read conversations:', error);
    }
  }, [readConversations]);

  // Handle pull-to-refresh
  const handleRefresh = async () => {
    try {
      const data = await chatAPI.getConversations();
      
      if (data && Array.isArray(data)) {
        setLocalConversations(data);
        setReadConversations(new Set());
      }
    } catch (error) {
      console.error('Error refreshing conversations:', error);
      throw error;
    }
  };

  const handleSwipeAction = async (conversationId, action) => {
    switch (action) {
      case 'delete':
        setConfirmDialog({
          title: 'Xóa cuộc trò chuyện',
          message: 'Bạn có chắc muốn xóa cuộc trò chuyện này?',
          confirmText: 'Xóa',
          cancelText: 'Hủy',
          onConfirm: async () => {
            setConfirmDialog(null);
            
            try {
              await chatAPI.deleteConversation(conversationId);
              setLocalConversations(prev => prev.filter(conv => conv.id !== conversationId));
              setToast({
                message: 'Đã xóa cuộc trò chuyện',
                type: 'success'
              });
            } catch (error) {
              setToast({
                message: 'Không thể xóa cuộc trò chuyện. Vui lòng thử lại.',
                type: 'error'
              });
            }
          },
          onCancel: () => {
            setConfirmDialog(null);
          }
        });
        break;
        
      case 'read':
        try {
          await chatAPI.markAllAsRead(conversationId);
          setReadConversations(prev => {
            const newSet = new Set(prev);
            newSet.add(conversationId);
            return newSet;
          });
          
          setLocalConversations(prev => prev.map(conv => {
            if (conv.id === conversationId) {
              return {
                ...conv,
                unread_count: 0,
                unreadCount: 0
              };
            }
            return conv;
          }));
          
          setToast({
            message: 'Đã đánh dấu đã đọc',
            type: 'success'
          });
        } catch (error) {
          console.error('Error marking as read:', error);
        }
        break;
        
      case 'unread':
        try {
          await chatAPI.markAsUnread(conversationId);
          setReadConversations(prev => {
            const newSet = new Set(prev);
            newSet.delete(conversationId);
            return newSet;
          });
          
          setLocalConversations(prev => prev.map(conv => {
            if (conv.id === conversationId) {
              return {
                ...conv,
                unread_count: Math.max(1, (conv.unread_count || 0)),
                unreadCount: Math.max(1, (conv.unreadCount || 0)),
                updated_at: new Date().toISOString(),
                updatedAt: new Date().toISOString()
              };
            }
            return conv;
          }));
          
          setToast({
            message: 'Đã đánh dấu chưa đọc',
            type: 'info'
          });
        } catch (error) {
          console.error('Error marking as unread:', error);
        }
        break;
        
      default:
        break;
    }
  };

  const handleNavClick = (view) => {
    setCurrentView(view);
    switch (view) {
      case 'messages':
        setShowFriends(false);
        setShowProfile(false);
        setShowNotificationCenter(false);
        setShowUserSearch(false);
        setShowFriendsList(false);
        break;
      case 'contacts':
        setShowFriends(true);
        setShowProfile(false);
        setShowNotificationCenter(false);
        setShowUserSearch(false);
        setShowFriendsList(false);
        break;
      case 'profile':
        setShowProfile(true);
        setShowFriends(false);
        setShowNotificationCenter(false);
        setShowUserSearch(false);
        setShowFriendsList(false);
        break;
      default:
        break;
    }
  };

  return (
    <MobileSidebarContainer>
      {!selectedConversation && !showFriends && !showProfile && !showNotificationCenter && !showUserSearch && !showFriendsList && (
        <>
          <MobileTopBar 
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            onNewMessage={() => setShowNewMessageModal(true)}
            onQRScan={() => setShowQRScanner(true)}
          />
          
          <MobileTabBar 
            activeTab={activeTab}
            onTabChange={setActiveTab}
            unreadCount={unreadCount}
          />
        </>
      )}

      <Content>
        {showFriends ? (
          <ViewWrapper>
            <MobileContacts 
              user={user}
              socket={socket}
              onBack={() => setShowFriends(false)}
              onCall={(friend) => console.log('Calling friend:', friend)}
              onVideoCall={(friend) => console.log('Video calling friend:', friend)}
              onAddFriend={() => {
                setShowFriends(false);
                setShowUserSearch(true);
              }}
              onHideBottomNav={setHideBottomNav}
              onStartChat={async (friend) => {
                setShowFriends(false);
                
                // Try to find existing conversation with this friend
                const existingConv = localConversations.find(conv => 
                  conv.participant_id === friend.id || 
                  conv.other_user_id === friend.id ||
                  conv.userId === friend.id
                );
                
                if (existingConv) {
                  // Use existing conversation
                  onConversationSelect?.(existingConv);
                } else {
                  // Create or get conversation
                  try {
                    const response = await chatAPI.createConversation(friend.id);
                    if (response && response.conversationId) {
                      // Reload conversations to get the new/updated one
                      const updatedConversations = await chatAPI.getConversations();
                      if (updatedConversations && Array.isArray(updatedConversations)) {
                        setLocalConversations(updatedConversations);
                        // Find the conversation we just created/got
                        const newConv = updatedConversations.find(conv => 
                          conv.id === response.conversationId ||
                          conv.participant_id === friend.id || 
                          conv.other_user_id === friend.id ||
                          conv.userId === friend.id
                        );
                        if (newConv) {
                          onConversationSelect?.(newConv);
                        } else {
                          // Fallback: pass friend object
                          onConversationSelect?.(friend);
                        }
                      } else {
                        onConversationSelect?.(friend);
                      }
                    } else {
                      // Fallback: pass friend object if API doesn't return conversationId
                      onConversationSelect?.(friend);
                    }
                  } catch (error) {
                    console.error('Error creating conversation:', error);
                    // Fallback: pass friend object
                    onConversationSelect?.(friend);
                  }
                }
              }}
            />
          </ViewWrapper>
        ) : showNotificationCenter ? (
          <ViewWrapper>
            <NotificationCenter onClose={() => setShowNotificationCenter(false)} />
          </ViewWrapper>
        ) : showProfile ? (
          <ViewWrapper>
            <PersonalProfilePage
              user={user}
              onBack={() => setShowProfile(false)}
              onShowProfile={() => console.log('View personal page clicked')}
              onNavigateToTab={(tabId) => {
                setShowProfile(false);
                switch (tabId) {
                  case 'contacts':
                    setShowFriends(true);
                    break;
                  default:
                    break;
                }
              }}
              onLogout={onLogout}
              onActivityStatusChange={(isOpen) => console.log('Activity status:', isOpen)}
            />
          </ViewWrapper>
        ) : showUserSearch ? (
          <ViewWrapper>
            <UserSearch
              onUserSelect={(user) => {
                onConversationSelect?.(user);
                setShowUserSearch(false);
              }}
              onClose={() => setShowUserSearch(false)}
            />
          </ViewWrapper>
        ) : showFriendsList ? (
          <ViewWrapper>
            <FriendsList
              onStartChat={(user) => {
                onConversationSelect?.(user);
                setShowFriendsList(false);
              }}
              onClose={() => setShowFriendsList(false)}
            />
          </ViewWrapper>
        ) : selectedConversation ? (
          <MobileChatArea
            conversation={selectedConversation}
            currentUser={user}
            socket={socket}
            onMessageSent={(message) => {
              // Handle message sent
            }}
            onSidebarReload={() => {
              // Handle sidebar reload
            }}
            isMobile={true}
            onBackToSidebar={() => onConversationSelect?.(null)}
            currentView="conversation"
          />
        ) : (
          <PullToRefreshWrapper>
            <PullToRefresh 
              onRefresh={handleRefresh}
              threshold={70}
              refreshText="Kéo xuống để làm mới"
              releaseText="Thả ra để làm mới"
              refreshingText="Đang cập nhật..."
            >
              <ConversationList>
              {filteredConversations.length > 0 ? (
                filteredConversations.map((conv) => {
                  if (!conv) return null;
                  
                  const actualUnreadCount = conv.unread_count || conv.unreadCount || 0;
                  const isCurrentlySelected = selectedConversation?.id === conv.id;
                  const hasBeenRead = readConversations.has(conv.id);
                  const displayHasUnread = !isCurrentlySelected && actualUnreadCount > 0 && !hasBeenRead;
                  
                  return (
                    <MobileConversationItem
                      key={conv.id}
                      conversation={conv}
                      selected={isCurrentlySelected}
                      hasUnread={displayHasUnread}
                      onClick={() => {
                        setReadConversations(prev => new Set([...prev, conv.id]));
                        onConversationSelect?.(conv);
                      }}
                      onSwipeAction={handleSwipeAction}
                      nickname={conversationSettings[conv.id]?.nickname}
                    />
                  );
                })
              ) : (
                <EmptyState>
                  <EmptyIcon>💬</EmptyIcon>
                  <EmptyText>
                    {searchTerm ? 'Không tìm thấy cuộc trò chuyện nào' : 'Chưa có cuộc trò chuyện nào'}
                  </EmptyText>
                  <EmptySubtext>
                    {searchTerm ? 'Thử tìm kiếm với từ khóa khác' : 'Bắt đầu trò chuyện với bạn bè'}
                  </EmptySubtext>
                  <CreateButton onClick={onNewChat}>
                    Tạo cuộc trò chuyện mới
                  </CreateButton>
                </EmptyState>
              )}
            </ConversationList>
          </PullToRefresh>
          </PullToRefreshWrapper>
        )}
      </Content>

      {!selectedConversation && !showProfile && !hideBottomNav && (
        <MobileBottomNav 
          currentView={currentView}
          onViewChange={handleNavClick}
          unreadCount={unreadCount}
        />
      )}

      {showQRScanner && (
        <QRScanner onClose={() => setShowQRScanner(false)} />
      )}

      {showNewMessageModal && (
        <NewMessageModal
          onClose={() => setShowNewMessageModal(false)}
          onSelectUser={(user) => {
            if (onConversationSelect) {
              onConversationSelect(user);
            }
          }}
          onCreateGroup={() => {
            if (onNewChat) {
              onNewChat();
            }
          }}
        />
      )}

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          duration={3000}
          onClose={() => setToast(null)}
        />
      )}

      {confirmDialog && (
        <ConfirmDialog
          title={confirmDialog.title}
          message={confirmDialog.message}
          confirmText={confirmDialog.confirmText}
          cancelText={confirmDialog.cancelText}
          onConfirm={confirmDialog.onConfirm}
          onCancel={confirmDialog.onCancel}
          type="danger"
        />
      )}
    </MobileSidebarContainer>
  );
};

export default MobileSidebar;
