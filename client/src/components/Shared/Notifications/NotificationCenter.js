import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useTheme } from '../../../contexts/ThemeContext';
import { 
  FiBell, 
  FiX, 
  FiUserPlus, 
  FiHeart, 
  FiMessageCircle, 
  FiThumbsUp, 
  FiUser,
  FiSettings,
  FiCheck,
  FiMoreHorizontal
} from 'react-icons/fi';
import { notificationAPI } from '../../../utils/api';
import useSocket from '../../../hooks/useSocket';

const NotificationContainer = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: var(--bg-primary);
  z-index: 1000;
  display: flex;
  flex-direction: column;
  
  /* Add padding for mobile bottom nav */
  @media (max-width: 768px) {
    padding-bottom: calc(45px + env(safe-area-inset-bottom));
  }
`;

const Header = styled.div`
  background: var(--primary-color, #0084ff);
  color: white;
  padding: 8px 12px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  
  /* Safe area for iPhone notch/Dynamic Island */
  @media (max-width: 768px) {
    padding-top: calc(8px + env(safe-area-inset-top));
  }
`;

const BackButton = styled.button`
  background: none;
  border: none;
  color: white;
  font-size: 24px;
  cursor: pointer;
  padding: 5px;
  border-radius: 50%;
  transition: background-color 0.2s;

  &:hover {
    background-color: rgba(255,255,255,0.1);
  }
`;

const HeaderTitle = styled.h2`
  margin: 0;
  font-size: 20px;
  font-weight: 600;
`;

const SettingsButton = styled.button`
  background: none;
  border: none;
  color: white;
  cursor: pointer;
  padding: 8px;
  border-radius: 50%;
  transition: background-color 0.2s;

  &:hover {
    background-color: rgba(255,255,255,0.1);
  }
`;

const Content = styled.div`
  flex: 1;
  padding: 20px;
  max-width: 800px;
  margin: 0 auto;
  width: 100%;
  overflow-y: auto;

  @media (max-width: 768px) {
    padding: 16px;
    padding-bottom: calc(68px + env(safe-area-inset-bottom, 0));
    max-width: 100%;
  }

  @media (max-width: 480px) {
    padding: 12px;
    padding-bottom: calc(68px + env(safe-area-inset-bottom, 0));
  }
`;

const Tabs = styled.div`
  display: flex;
  background: var(--bg-primary);
  border-radius: 12px;
  padding: 4px;
  margin-bottom: 20px;
  box-shadow: 0 2px 8px var(--shadow-color);

  @media (max-width: 768px) {
    margin-bottom: 16px;
  }

  @media (max-width: 480px) {
    margin-bottom: 12px;
    border-radius: 8px;
  }
`;

const Tab = styled.button`
  flex: 1;
  padding: 12px 16px;
  border: none;
  background: ${props => props.active ? 'var(--primary-color, #0084ff)' : 'transparent'};
  color: ${props => {
    if (props.active) return 'white';
    return 'var(--text-secondary)';
  }};
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;

  &:hover {
    background: ${props => {
      if (props.active) return 'var(--primary-color, #0084ff)';
      return 'var(--bg-secondary)';
    }};
  }

  @media (max-width: 768px) {
    padding: 10px 12px;
    font-size: 14px;
    gap: 6px;
  }

  @media (max-width: 480px) {
    padding: 8px 10px;
    font-size: 13px;
    gap: 4px;
  }
`;

const NotificationList = styled.div`
  background: var(--bg-primary);
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 8px var(--shadow-color);

  @media (max-width: 480px) {
    border-radius: 8px;
  }
`;

const NotificationItem = styled.div`
  display: flex;
  align-items: flex-start;
  padding: 16px 20px;
  border-bottom: 1px solid var(--border-color);
  transition: background-color 0.2s;
  position: relative;

  &:hover {
    background-color: var(--bg-secondary);
  }

  &:last-child {
    border-bottom: none;
  }

  ${props => !props.read && `
    background-color: var(--bg-secondary);
    border-left: 4px solid var(--primary-color, #0084ff);
  `}

  @media (max-width: 768px) {
    padding: 12px 16px;
  }

  @media (max-width: 480px) {
    padding: 10px 12px;
  }
`;

const NotificationAvatar = styled.div`
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: ${props => props.color || '#0084ff'};
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 18px;
  margin-right: 12px;
  flex-shrink: 0;

  @media (max-width: 768px) {
    width: 40px;
    height: 40px;
    font-size: 16px;
    margin-right: 10px;
  }

  @media (max-width: 480px) {
    width: 36px;
    height: 36px;
    font-size: 14px;
    margin-right: 8px;
  }
`;

const NotificationContent = styled.div`
  flex: 1;
  min-width: 0;
`;

const NotificationText = styled.p`
  margin: 0 0 4px 0;
  font-size: 14px;
  color: var(--text-primary);
  line-height: 1.4;
`;

const NotificationTime = styled.span`
  font-size: 12px;
  color: var(--text-secondary);
`;

const NotificationActions = styled.div`
  display: flex;
  gap: 8px;
  margin-top: 8px;
`;

const ActionButton = styled.button`
  padding: 6px 12px;
  border: none;
  border-radius: 16px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 4px;

  ${props => {
    switch (props.variant) {
      case 'primary':
        return `
          background: var(--primary-color, #0084ff);
          color: white;
          &:hover { opacity: 0.9; }
        `;
      case 'success':
        return `
          background: #28a745;
          color: white;
          &:hover { opacity: 0.9; }
        `;
      case 'secondary':
        return `
          background: var(--bg-tertiary);
          color: var(--text-primary);
          &:hover { background: var(--bg-tertiary); }
        `;
      default:
        return `
          background: var(--bg-tertiary);
          color: var(--text-primary);
          &:hover { background: var(--bg-secondary); }
        `;
    }
  }}
`;

const MoreButton = styled.button`
  background: none;
  border: none;
  color: var(--text-secondary);
  cursor: pointer;
  padding: 4px;
  border-radius: 50%;
  transition: background-color 0.2s;

  &:hover {
    background-color: var(--bg-secondary);
  }
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 40px 20px;
  color: var(--text-secondary);

  h3 {
    margin: 0 0 8px 0;
    font-size: 18px;
    color: var(--text-primary);
  }

  p {
    margin: 0;
    font-size: 14px;
  }
`;

const LoadingState = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  color: var(--text-secondary);
`;

const getNotificationIcon = (type) => {
  switch (type) {
    case 'friend_request':
      return <FiUserPlus size={20} />;
    case 'friend_accepted':
      return <FiUser size={20} />;
    case 'follow':
      return <FiHeart size={20} />;
    case 'like':
      return <FiThumbsUp size={20} />;
    case 'comment':
      return <FiMessageCircle size={20} />;
    default:
      return <FiBell size={20} />;
  }
};

const getAvatarColor = (name) => {
  const colors = ['#0084ff', '#28a745', '#dc3545', '#ffc107', '#17a2b8', '#6f42c1', '#e83e8c', '#fd7e14'];
  const index = name ? name.charCodeAt(0) % colors.length : 0;
  return colors[index];
};

const formatTimeAgo = (timestamp) => {
  const now = new Date();
  const time = new Date(timestamp);
  const diffInSeconds = Math.floor((now - time) / 1000);

  if (diffInSeconds < 60) {
    return 'Vừa xong';
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes} phút trước`;
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours} giờ trước`;
  } else {
    const days = Math.floor(diffInSeconds / 86400);
    return `${days} ngày trước`;
  }
};

const NotificationCenter = ({ onBack }) => {
  const { isDarkMode } = useTheme();
  const [activeTab, setActiveTab] = useState('all');
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const socket = useSocket();

  useEffect(() => {
    loadNotifications();
  }, [activeTab]);

  // Listen for real-time notifications
  useEffect(() => {
    if (socket) {
      socket.on('notification', (notification) => {
        console.log('Received real-time notification in center:', notification);
        // Add new notification to the top of the list
        setNotifications(prev => [notification, ...prev]);
      });

      return () => {
        socket.off('notification');
      };
    }
  }, [socket]);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const response = await notificationAPI.getNotifications(activeTab);
      setNotifications(response.data);
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (notificationId) => {
    try {
      await notificationAPI.markAsRead(notificationId);
      setNotifications(prev => 
        prev.map(notif => 
          notif.id === notificationId 
            ? { ...notif, read: true }
            : notif
        )
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationAPI.markAllAsRead();
      setNotifications(prev => 
        prev.map(notif => ({ ...notif, read: true }))
      );
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const handleAcceptFriendRequest = async (notificationId, fromUserId) => {
    try {
      await notificationAPI.acceptFriendRequest(notificationId, fromUserId);
      alert('Đã chấp nhận lời mời kết bạn!');
      setNotifications(prev => 
        prev.filter(notif => notif.id !== notificationId)
      );
    } catch (error) {
      console.error('Error accepting friend request:', error);
      alert('Có lỗi xảy ra khi chấp nhận lời mời kết bạn: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleRejectFriendRequest = async (notificationId) => {
    try {
      await notificationAPI.rejectFriendRequest(notificationId);
      alert('Đã từ chối lời mời kết bạn!');
      setNotifications(prev => 
        prev.filter(notif => notif.id !== notificationId)
      );
    } catch (error) {
      console.error('Error rejecting friend request:', error);
      alert('Có lỗi xảy ra khi từ chối lời mời kết bạn: ' + (error.response?.data?.message || error.message));
    }
  };

  const renderNotificationItem = (notification) => (
    <NotificationItem key={notification.id} read={notification.read}>
      <NotificationAvatar color={getAvatarColor(notification.from_user?.full_name)}>
        {getNotificationIcon(notification.type)}
      </NotificationAvatar>
      <NotificationContent>
        <NotificationText>
          {notification.message}
        </NotificationText>
        <NotificationTime>
          {formatTimeAgo(notification.created_at)}
        </NotificationTime>
        
        {notification.type === 'friend_request' && !notification.read && (
          <NotificationActions>
            <ActionButton
              variant="primary"
              onClick={() => handleAcceptFriendRequest(notification.id, notification.from_user_id)}
            >
              <FiCheck size={14} />
              Chấp nhận
            </ActionButton>
            <ActionButton
              variant="secondary"
              onClick={() => handleRejectFriendRequest(notification.id)}
            >
              <FiX size={14} />
              Từ chối
            </ActionButton>
          </NotificationActions>
        )}
      </NotificationContent>
      
      {!notification.read && (
        <MoreButton onClick={() => handleMarkAsRead(notification.id)}>
          <FiMoreHorizontal size={16} />
        </MoreButton>
      )}
    </NotificationItem>
  );

  const unreadCount = Array.isArray(notifications) ? notifications.filter(n => !n.read).length : 0;

  return (
    <NotificationContainer>
      <Header>
        <BackButton onClick={onBack} title="Quay lại">
          ←
        </BackButton>
        <HeaderTitle>
          Thông báo {unreadCount > 0 && `(${unreadCount})`}
        </HeaderTitle>
        <SettingsButton onClick={handleMarkAllAsRead} title="Đánh dấu tất cả đã đọc">
          <FiSettings size={20} />
        </SettingsButton>
      </Header>

      <Content>
        <Tabs>
          <Tab
            active={activeTab === 'all'}
            onClick={() => setActiveTab('all')}
          >
            <FiBell size={18} />
            Tất cả
          </Tab>
          <Tab
            active={activeTab === 'friend_requests'}
            onClick={() => setActiveTab('friend_requests')}
          >
            <FiUserPlus size={18} />
            Lời mời kết bạn
          </Tab>
          <Tab
            active={activeTab === 'follows'}
            onClick={() => setActiveTab('follows')}
          >
            <FiHeart size={18} />
            Theo dõi
          </Tab>
          <Tab
            active={activeTab === 'interactions'}
            onClick={() => setActiveTab('interactions')}
          >
            <FiThumbsUp size={18} />
            Tương tác
          </Tab>
        </Tabs>

        <NotificationList>
          {loading ? (
            <LoadingState>
              <p>Đang tải thông báo...</p>
            </LoadingState>
          ) : notifications.length > 0 ? (
            notifications.map(renderNotificationItem)
          ) : (
            <EmptyState>
              <h3>Không có thông báo</h3>
              <p>Thông báo mới sẽ hiển thị ở đây</p>
            </EmptyState>
          )}
        </NotificationList>
      </Content>
    </NotificationContainer>
  );
};

export default NotificationCenter;