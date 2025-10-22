import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { FiBell } from 'react-icons/fi';
import { notificationAPI } from '../../utils/api';
import useSocket from '../../hooks/useSocket';
import { getInitials } from '../../utils/nameUtils';

const BellContainer = styled.div`
  position: relative;
  cursor: pointer;
`;

const MobileOverlay = styled.div`
  display: none;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 999;

  @media (max-width: 768px) {
    display: ${props => props.isVisible ? 'block' : 'none'};
  }
`;

const BellButton = styled.button`
  background: none;
  border: none;
  color: ${props => props.theme === 'dark' ? '#fff' : '#333'};
  cursor: pointer;
  padding: 8px;
  border-radius: 50%;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;

  &:hover {
    background-color: ${props => props.theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'};
  }
`;

const NotificationBadge = styled.div`
  position: absolute;
  top: 2px;
  right: 2px;
  background: #ff4444;
  color: white;
  border-radius: 50%;
  width: 18px;
  height: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  font-weight: bold;
  border: 2px solid ${props => props.theme === 'dark' ? '#1a1a2e' : '#fff'};
  animation: ${props => props.hasUnread ? 'pulse 2s infinite' : 'none'};

  @keyframes pulse {
    0% {
      transform: scale(1);
    }
    50% {
      transform: scale(1.1);
    }
    100% {
      transform: scale(1);
    }
  }
`;

const Dropdown = styled.div`
  position: absolute;
  top: 100%;
  right: 0;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.15);
  min-width: 320px;
  max-width: 400px;
  max-height: 400px;
  overflow-y: auto;
  z-index: 1000;
  margin-top: 8px;
  border: 1px solid #e1e5e9;

  &::-webkit-scrollbar {
    width: 4px;
  }

  &::-webkit-scrollbar-track {
    background: transparent;
  }

  &::-webkit-scrollbar-thumb {
    background: rgba(0,0,0,0.2);
    border-radius: 2px;
  }

  @media (max-width: 768px) {
    position: fixed;
    top: 60px;
    left: 0;
    right: 0;
    bottom: 0;
    min-width: unset;
    max-width: unset;
    max-height: unset;
    height: calc(100vh - 60px);
    border-radius: 0;
    margin-top: 0;
    border: none;
    box-shadow: none;
  }

  @media (max-width: 480px) {
    top: 56px;
    height: calc(100vh - 56px);
  }
`;

const DropdownHeader = styled.div`
  padding: 16px 20px;
  border-bottom: 1px solid #f0f0f0;
  display: flex;
  align-items: center;
  justify-content: space-between;

  @media (max-width: 768px) {
    padding: 12px 16px;
    position: sticky;
    top: 0;
    background: white;
    z-index: 10;
  }

  @media (max-width: 480px) {
    padding: 10px 12px;
  }
`;

const DropdownTitle = styled.h3`
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #333;
`;

const MarkAllReadButton = styled.button`
  background: none;
  border: none;
  color: #0084ff;
  cursor: pointer;
  font-size: 12px;
  font-weight: 500;
  padding: 4px 8px;
  border-radius: 4px;
  transition: background-color 0.2s;

  &:hover {
    background-color: #f0f8ff;
  }
`;

const NotificationItem = styled.div`
  display: flex;
  align-items: flex-start;
  padding: 12px 20px;
  border-bottom: 1px solid #f0f0f0;
  cursor: pointer;
  transition: background-color 0.2s;

  &:hover {
    background-color: #f8f9fa;
  }

  &:last-child {
    border-bottom: none;
  }

  ${props => !props.read && `
    background-color: #f0f8ff;
  `}

  @media (max-width: 768px) {
    padding: 12px 16px;
  }

  @media (max-width: 480px) {
    padding: 10px 12px;
  }
`;

const NotificationAvatar = styled.div`
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: ${props => props.color || '#0084ff'};
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 14px;
  margin-right: 12px;
  flex-shrink: 0;

  @media (max-width: 480px) {
    width: 32px;
    height: 32px;
    font-size: 12px;
    margin-right: 10px;
  }
`;

const NotificationContent = styled.div`
  flex: 1;
  min-width: 0;
`;

const NotificationText = styled.p`
  margin: 0 0 4px 0;
  font-size: 13px;
  color: #333;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
`;

const NotificationTime = styled.span`
  font-size: 11px;
  color: #666;
`;

const ViewAllButton = styled.div`
  padding: 12px 20px;
  text-align: center;
  border-top: 1px solid #f0f0f0;
  cursor: pointer;
  color: #0084ff;
  font-size: 14px;
  font-weight: 500;
  transition: background-color 0.2s;

  &:hover {
    background-color: #f8f9fa;
  }

  @media (max-width: 768px) {
    padding: 12px 16px;
    position: sticky;
    bottom: 0;
    background: white;
    border-top: 2px solid #f0f0f0;
  }

  @media (max-width: 480px) {
    padding: 10px 12px;
    font-size: 13px;
  }
`;

const EmptyState = styled.div`
  padding: 20px;
  text-align: center;
  color: #666;
  font-size: 14px;
`;

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

const NotificationBell = ({ theme = 'light', onOpenNotificationCenter }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const socket = useSocket();

  useEffect(() => {
    loadRecentNotifications();
  }, []);

  // Listen for real-time notifications
  useEffect(() => {
    if (socket) {
      socket.on('notification', (notification) => {
        console.log('Received real-time notification:', notification);
        // Add new notification to the top of the list
        setNotifications(prev => [notification, ...prev]);
      });

      return () => {
        socket.off('notification');
      };
    }
  }, [socket]);

  const loadRecentNotifications = async () => {
    try {
      setLoading(true);
      const response = await notificationAPI.getRecentNotifications();
      setNotifications(response.data);
    } catch (error) {
      console.error('Error loading recent notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBellClick = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      loadRecentNotifications();
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

  const unreadCount = Array.isArray(notifications) ? notifications.filter(n => !n.read).length : 0;

  return (
    <BellContainer>
      <BellButton theme={theme} onClick={handleBellClick}>
        <FiBell size={20} />
        {unreadCount > 0 && (
          <NotificationBadge theme={theme} hasUnread={unreadCount > 0}>
            {unreadCount > 9 ? '9+' : unreadCount}
          </NotificationBadge>
        )}
      </BellButton>

      {isOpen && (
        <>
          <MobileOverlay isVisible={isOpen} onClick={() => setIsOpen(false)} />
          <Dropdown>
          <DropdownHeader>
            <DropdownTitle>Thông báo</DropdownTitle>
            {unreadCount > 0 && (
              <MarkAllReadButton onClick={handleMarkAllAsRead}>
                Đánh dấu tất cả đã đọc
              </MarkAllReadButton>
            )}
          </DropdownHeader>

          {loading ? (
            <EmptyState>Đang tải...</EmptyState>
          ) : notifications.length > 0 ? (
            <>
              {notifications.slice(0, 5).map(notification => (
                <NotificationItem
                  key={notification.id}
                  read={notification.read}
                  onClick={() => handleMarkAsRead(notification.id)}
                >
                  <NotificationAvatar color={getAvatarColor(notification.from_user?.full_name)}>
                    {notification.from_user?.avatar_url ? (
                      <img src={notification.from_user.avatar_url} alt={notification.from_user.full_name} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                    ) : (
                      getInitials(notification.from_user?.full_name)
                    )}
                  </NotificationAvatar>
                  <NotificationContent>
                    <NotificationText>
                      {notification.message}
                    </NotificationText>
                    <NotificationTime>
                      {formatTimeAgo(notification.created_at)}
                    </NotificationTime>
                  </NotificationContent>
                </NotificationItem>
              ))}
              <ViewAllButton onClick={onOpenNotificationCenter}>
                Xem tất cả thông báo
              </ViewAllButton>
            </>
          ) : (
            <EmptyState>Không có thông báo mới</EmptyState>
          )}
        </Dropdown>
        </>
      )}
    </BellContainer>
  );
};

export default NotificationBell;
