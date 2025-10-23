import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { 
  FiMessageCircle, 
  FiUsers, 
  FiGrid, 
  FiHome, 
  FiUser,
  FiSearch,
  FiSquare,
  FiPlus,
  FiFilter
} from 'react-icons/fi';
import Sidebar from '../Chat/Sidebar';
import ChatArea from '../Chat/ChatArea';

const MobileContainer = styled.div`
  display: none;
  flex-direction: column;
  height: 100vh;
  background: #f8f9fa;

  @media (max-width: 768px) {
    display: flex;
  }
`;

const TopBar = styled.div`
  background: linear-gradient(135deg, #0084ff 0%, #00a651 100%);
  padding: 12px 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  color: white;
  position: sticky;
  top: 0;
  z-index: 100;
`;

const SearchSection = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
`;

const SearchInput = styled.input`
  flex: 1;
  background: rgba(255, 255, 255, 0.2);
  border: none;
  border-radius: 20px;
  padding: 8px 16px;
  color: white;
  font-size: 14px;
  outline: none;
  
  &::placeholder {
    color: rgba(255, 255, 255, 0.7);
  }
`;

const ActionButtons = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const ActionButton = styled.button`
  background: none;
  border: none;
  color: white;
  padding: 8px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background 0.2s ease;
  
  &:hover {
    background: rgba(255, 255, 255, 0.2);
  }
`;

const TabBar = styled.div`
  background: white;
  padding: 12px 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid #e0e0e0;
`;

const Tabs = styled.div`
  display: flex;
  gap: 24px;
`;

const Tab = styled.button`
  background: none;
  border: none;
  color: ${props => props.active ? '#0084ff' : '#666'};
  font-size: 16px;
  font-weight: 500;
  padding: 8px 0;
  position: relative;
  cursor: pointer;
  
  ${props => props.active && `
    &::after {
      content: '';
      position: absolute;
      bottom: -12px;
      left: 0;
      right: 0;
      height: 2px;
      background: #0084ff;
    }
  `}
`;

const FilterButton = styled.button`
  background: none;
  border: none;
  color: #666;
  padding: 8px;
  cursor: pointer;
`;

const Content = styled.div`
  flex: 1;
  overflow-y: auto;
  background: white;

  &::-webkit-scrollbar {
    width: 4px;
  }

  &::-webkit-scrollbar-track {
    background: transparent;
  }

  &::-webkit-scrollbar-thumb {
    background: #ccc;
    border-radius: 2px;
  }

  &::-webkit-scrollbar-thumb:hover {
    background: #ccc;
  }
`;

const ConversationList = styled.div`
  padding: 0;
`;

const ConversationItem = styled.div`
  padding: 1rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  transition: all 0.2s ease;
  background: ${props => props.selected ? '#e3f2fd' : 'white'};
  border-bottom: 1px solid #f0f0f0;

  &:hover {
    background: ${props => props.selected ? '#e3f2fd' : '#f5f5f5'};
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
`;

const OnlineIndicator = styled.div`
  position: absolute;
  bottom: 2px;
  right: 2px;
  width: 12px;
  height: 12px;
  background: #00a651;
  border: 2px solid white;
  border-radius: 50%;
`;

const ConversationInfo = styled.div`
  flex: 1;
  min-width: 0;
`;

const ConversationName = styled.h3`
  margin: 0;
  font-size: 15px;
  color: #333;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-weight: 500;
`;

const LastMessage = styled.p`
  margin: 0.25rem 0 0 0;
  font-size: 13px;
  color: #666;
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

const UnreadBadge = styled.div`
  background: #ff4444;
  color: white;
  font-size: 12px;
  font-weight: bold;
  padding: 2px 6px;
  border-radius: 10px;
  min-width: 18px;
  text-align: center;
`;

const BottomNav = styled.div`
  background: white;
  /* Removed border-top for cleaner look */
  display: flex;
  flex-direction: column;
  /* Subtle shadow only */
  box-shadow: 0 -1px 3px rgba(0, 0, 0, 0.05);
  position: sticky;
  bottom: 0;
  z-index: 100;
  /* Fill completely to bottom including safe area */
  padding-bottom: env(safe-area-inset-bottom);
`;

const NavItemsContainer = styled.div`
  display: flex;
  padding: 4px 0;
`;

const NavItem = styled.button`
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  background: none;
  border: none;
  color: ${props => props.active ? '#0084ff' : '#666'};
  cursor: pointer;
  padding: 6px 4px;
  position: relative;
  transition: color 0.2s ease;
`;

const NavIcon = styled.div`
  font-size: 20px;
  position: relative;
`;

const NavLabel = styled.div`
  font-size: 12px;
  font-weight: 500;
`;

const NotificationBadge = styled.div`
  position: absolute;
  top: -4px;
  right: -4px;
  background: #ff4444;
  color: white;
  font-size: 10px;
  font-weight: bold;
  padding: 2px 4px;
  border-radius: 8px;
  min-width: 16px;
  text-align: center;
`;

const MobileLayout = ({ 
  children, 
  currentView = 'messages',
  conversations = [],
  selectedConversation,
  onConversationSelect,
  onNewChat,
  onAddFriend,
  onShowFriends,
  onShowNewsFeed,
  onShowProfile,
  user,
  socket
}) => {
  const [activeTab, setActiveTab] = useState('priority');
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredConversations, setFilteredConversations] = useState(conversations);
  const [unreadCount, setUnreadCount] = useState(0);

  const navItems = [
    { id: 'messages', icon: FiMessageCircle, label: 'Tin nhắn', badge: unreadCount },
    { id: 'contacts', icon: FiUsers, label: 'Danh bạ', badge: null },
    { id: 'discover', icon: FiGrid, label: 'Khám phá', badge: 'dot' },
    { id: 'wall', icon: FiHome, label: 'Tường nhà', badge: 'N' },
    { id: 'profile', icon: FiUser, label: 'Cá nhân', badge: null }
  ];

  // Filter conversations based on search term
  useEffect(() => {
    try {
      if (!conversations || !Array.isArray(conversations)) {
        setFilteredConversations([]);
        return;
      }
      
      if (searchTerm.trim() === '') {
        setFilteredConversations(conversations);
      } else {
        const filtered = conversations.filter(conv => {
          if (!conv) return false;
          const name = conv.participant_name || conv.name || '';
          const message = conv.last_message || conv.lastMessage || '';
          return (name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  message.toLowerCase().includes(searchTerm.toLowerCase()));
        });
        setFilteredConversations(filtered);
      }
    } catch (error) {
      console.error('Error filtering conversations:', error);
      setFilteredConversations([]);
    }
  }, [searchTerm, conversations]);

  // Calculate unread count
  useEffect(() => {
    try {
      if (!conversations || !Array.isArray(conversations)) {
        setUnreadCount(0);
        return;
      }
      const unread = conversations.reduce((total, conv) => {
        if (!conv) return total;
        return total + (conv.unread_count || conv.unreadCount || 0);
      }, 0);
      setUnreadCount(unread);
    } catch (error) {
      console.error('Error calculating unread count:', error);
      setUnreadCount(0);
    }
  }, [conversations]);

  // Format timestamp
  const formatTimestamp = (timestamp) => {
    try {
      if (!timestamp) return '';
      
      const now = new Date();
      const messageTime = new Date(timestamp);
      
      if (isNaN(messageTime.getTime())) return '';
      
      const diffInMinutes = Math.floor((now - messageTime) / (1000 * 60));
      
      if (diffInMinutes < 1) return 'Vừa xong';
      if (diffInMinutes < 60) return `${diffInMinutes} phút`;
      if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)} giờ`;
      if (diffInMinutes < 10080) return `${Math.floor(diffInMinutes / 1440)} ngày`;
      
      return messageTime.toLocaleDateString('vi-VN');
    } catch (error) {
      console.error('Error formatting timestamp:', error);
      return '';
    }
  };

  // Get avatar color
  const getAvatarColor = (name) => {
    try {
      if (!name) return '#0084ff';
      const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57', '#ff9ff3', '#54a0ff', '#5f27cd'];
      const index = name.charCodeAt(0) % colors.length;
      return colors[index];
    } catch (error) {
      console.error('Error getting avatar color:', error);
      return '#0084ff';
    }
  };

  // Handle navigation
  const handleNavClick = (navId) => {
    switch (navId) {
      case 'messages':
        // Already in messages view
        break;
      case 'contacts':
        onShowFriends?.();
        break;
      case 'discover':
        // Handle discover
        break;
      case 'wall':
        onShowNewsFeed?.();
        break;
      case 'profile':
        onShowProfile?.();
        break;
      default:
        break;
    }
  };

  return (
    <MobileContainer>
      <TopBar>
        <SearchSection>
          <FiSearch size={20} />
          <SearchInput
            placeholder="Tìm kiếm cuộc trò chuyện..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </SearchSection>
        <ActionButtons>
          <ActionButton onClick={onNewChat} title="Tạo cuộc trò chuyện mới">
            <FiSquare size={20} />
          </ActionButton>
          <ActionButton onClick={onAddFriend} title="Thêm bạn">
            <FiPlus size={20} />
          </ActionButton>
        </ActionButtons>
      </TopBar>

      <TabBar>
        <Tabs>
          <Tab 
            active={activeTab === 'priority'} 
            onClick={() => setActiveTab('priority')}
          >
            Ưu tiên
          </Tab>
          <Tab 
            active={activeTab === 'other'} 
            onClick={() => setActiveTab('other')}
          >
            Khác
          </Tab>
        </Tabs>
        <FilterButton>
          <FiFilter size={20} />
        </FilterButton>
      </TabBar>

      <Content>
        {children || (
          <div style={{ 
            display: 'flex', 
            height: '100%',
            background: 'white'
          }}>
            <Sidebar
              conversations={conversations}
              selectedConversation={selectedConversation}
              onConversationSelect={onConversationSelect}
              onNewChat={onNewChat}
              onAddFriend={onAddFriend}
              onShowFriends={onShowFriends}
              socket={socket}
              reloadKey={Date.now()}
              isVisible={true}
              onClose={() => {}}
            />
            <div style={{ 
              flex: 1, 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              color: '#666',
              fontSize: '16px'
            }}>
              Chọn một cuộc trò chuyện để bắt đầu
            </div>
          </div>
        )}
      </Content>

      <BottomNav>
        <NavItemsContainer>
          {navItems.map((item) => (
            <NavItem 
              key={item.id} 
              active={currentView === item.id}
              onClick={() => handleNavClick(item.id)}
            >
              <NavIcon>
                <item.icon size={20} />
                {item.badge && item.badge !== 'dot' && item.badge > 0 && (
                  <NotificationBadge>{item.badge}</NotificationBadge>
                )}
                {item.badge === 'dot' && (
                  <div style={{
                    position: 'absolute',
                    top: '-2px',
                    right: '-2px',
                    width: '8px',
                    height: '8px',
                    background: '#ff4444',
                    borderRadius: '50%'
                  }} />
                )}
              </NavIcon>
              <NavLabel>{item.label}</NavLabel>
            </NavItem>
          ))}
        </NavItemsContainer>
      </BottomNav>
    </MobileContainer>
  );
};

export default MobileLayout;