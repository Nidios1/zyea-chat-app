import React, { useState } from 'react';
import styled from 'styled-components';
import { FiTrash2, FiMail, FiCheckCircle } from 'react-icons/fi';
import { getInitials } from '../../utils/nameUtils';
import { getAvatarURL } from '../../utils/imageUtils';

const SwipeContainer = styled.div`
  position: relative;
  overflow: hidden;
  background: var(--bg-primary, white);
  z-index: 2;
`;

const ConversationItem = styled.div`
  padding: 1.25rem 1rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 1rem;
  transition: background 0.15s ease;
  background: ${props => props.selected ? 'var(--bg-secondary, #e3f2fd)' : 'var(--bg-primary, white)'};
  transform: translateX(${props => props.swipeOffset || 0}px);
  position: relative;
  z-index: 10;
  border-left: 4px solid transparent;
  box-shadow: ${props => props.hasUnread ? '0 2px 4px rgba(255, 68, 68, 0.1)' : 'none'};
  -webkit-tap-highlight-color: transparent;
  user-select: none;
  outline: none;

  &:hover {
    background: ${props => props.selected ? 'var(--bg-secondary, #e3f2fd)' : 'var(--bg-secondary, #f8f9fa)'};
  }

  &:active {
    background: ${props => props.selected ? 'var(--bg-secondary, #e3f2fd)' : 'var(--bg-tertiary, #f0f0f0)'};
  }

  &::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 5.5rem;
    right: 0;
    height: 1px;
    background: var(--border-color, #f0f0f0);
  }

  &:last-child::after {
    display: none;
  }

  @media (max-width: 768px) {
    padding: 0.95rem 0.875rem;
    gap: 0.875rem;
    
    &::after {
      left: 4.75rem;
    }
  }

  @media (max-width: 375px) {
    padding: 0.85rem 0.75rem;
    gap: 0.75rem;
    
    &::after {
      left: 4.5rem;
    }
  }
`;

const SwipeActions = styled.div`
  position: absolute;
  right: 0;
  top: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  z-index: 1;
  background: linear-gradient(90deg, transparent 0%, rgba(0,0,0,0.1) 100%);
`;

const SwipeActionButton = styled.button`
  width: 90px;
  height: 100%;
  border: none;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.3rem;
  color: white;
  font-size: 0.75rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  -webkit-tap-highlight-color: transparent;

  &:hover {
    opacity: 0.9;
  }

  &:active {
    transform: scale(0.95);
    opacity: 0.85;
  }

  svg {
    font-size: 1.2rem;
  }
`;

const DeleteButton = styled(SwipeActionButton)`
  background: #ff4757;
`;

const UnreadButton = styled(SwipeActionButton)`
  background: #5294ff;
`;

const ReadButton = styled(SwipeActionButton)`
  background: #10b981;
`;

const Avatar = styled.div`
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: ${props => props.color || '#0084ff'};
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 600;
  font-size: 24px;
  position: relative;
  flex-shrink: 0;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);

  @media (max-width: 768px) {
    width: 54px;
    height: 54px;
    font-size: 21px;
  }

  @media (max-width: 375px) {
    width: 50px;
    height: 50px;
    font-size: 20px;
  }
`;

const OnlineIndicator = styled.div`
  position: absolute;
  bottom: 2px;
  right: 2px;
  width: 14px;
  height: 14px;
  background: #10b981;
  border: 3px solid white;
  border-radius: 50%;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);

  @media (max-width: 768px) {
    width: 12px;
    height: 12px;
    border: 2px solid white;
    bottom: 1px;
    right: 1px;
  }
`;

const ConversationInfo = styled.div`
  flex: 1;
  min-width: 0;
  max-width: calc(100% - 80px);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  justify-content: center;

  @media (max-width: 768px) {
    max-width: calc(100% - 72px);
  }

  @media (max-width: 375px) {
    max-width: calc(100% - 65px);
  }
`;

const TimeStamp = styled.span`
  font-size: 13px;
  color: var(--text-tertiary, #999);
  white-space: nowrap;
  margin-left: 8px;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-shrink: 0;

  @media (max-width: 768px) {
    font-size: 12px;
  }
`;

const UnreadBadge = styled.div`
  background: linear-gradient(135deg, #ff4444 0%, #ff6666 100%);
  color: white;
  border-radius: 50%;
  min-width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  font-weight: 700;
  padding: 0 0.3rem;
  box-shadow: 0 2px 6px rgba(255, 68, 68, 0.35);
  border: 2px solid var(--bg-primary, white);
  flex-shrink: 0;
  animation: ${props => props.hasUnread ? 'pulse 2s infinite' : 'none'};

  @keyframes pulse {
    0% {
      transform: scale(1);
      box-shadow: 0 2px 6px rgba(255, 68, 68, 0.35);
    }
    50% {
      transform: scale(1.05);
      box-shadow: 0 4px 10px rgba(255, 68, 68, 0.5);
    }
    100% {
      transform: scale(1);
      box-shadow: 0 2px 6px rgba(255, 68, 68, 0.35);
    }
  }

  @media (max-width: 768px) {
    min-width: 22px;
    height: 22px;
    font-size: 0.7rem;
  }
`;

const ConversationName = styled.div`
  font-weight: ${props => props.hasUnread ? '700' : '600'};
  color: ${props => props.hasUnread ? 'var(--text-primary, #1a1a1a)' : 'var(--text-primary, #333)'};
  font-size: 1rem;
  margin-bottom: 0.3rem;
  text-shadow: ${props => props.hasUnread ? '0 1px 2px rgba(0,0,0,0.1)' : 'none'};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  letter-spacing: -0.2px;
  max-width: 100%;

  @media (max-width: 768px) {
    font-size: 0.95rem;
  }

  @media (max-width: 375px) {
    font-size: 0.9rem;
  }
`;

const LastMessage = styled.div`
  color: ${props => props.hasUnread ? 'var(--text-primary, #1a1a1a)' : 'var(--text-secondary, #666)'};
  font-size: 0.9rem;
  font-weight: ${props => props.hasUnread ? '600' : '400'};
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-shadow: ${props => props.hasUnread ? '0 1px 2px rgba(0,0,0,0.1)' : 'none'};
  max-width: 100%;

  @media (max-width: 768px) {
    font-size: 0.85rem;
  }

  @media (max-width: 375px) {
    font-size: 0.8rem;
    -webkit-line-clamp: 1;
  }
`;

const MobileConversationItem = ({ 
  conversation, 
  selected, 
  hasUnread, 
  onClick, 
  onSwipeAction,
  nickname 
}) => {
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartX, setDragStartX] = useState(0);

  const handleTouchStart = (e) => {
    const touch = e.touches[0];
    setIsDragging(false);
    setDragStartX(touch.clientX);
  };

  const handleTouchMove = (e) => {
    const currentX = e.touches[0].clientX;
    const deltaX = currentX - dragStartX;
    
    if (Math.abs(deltaX) > 10) {
      setIsDragging(true);
    }
    
    if (deltaX < -10) {
      e.preventDefault();
      setSwipeOffset(Math.max(deltaX, -180));
    }
  };

  const handleTouchEnd = (e) => {
    const deltaX = e.touches[0]?.clientX - dragStartX || swipeOffset;
    
    if (deltaX < -60) {
      setSwipeOffset(-180);
    } else {
      setSwipeOffset(0);
    }
    
    setTimeout(() => {
      setIsDragging(false);
    }, 100);
  };

  const handleClick = () => {
    if (isDragging || swipeOffset !== 0) {
      setSwipeOffset(0);
      return;
    }
    onClick();
  };

  const formatTimestamp = (timestamp) => {
    try {
      if (!timestamp) return '';
      
      const date = new Date(timestamp);
      const now = new Date();
      const diff = now - date;
      
      const minutes = Math.floor(diff / 60000);
      const hours = Math.floor(diff / 3600000);
      const days = Math.floor(diff / 86400000);
      
      if (minutes < 1) return 'Vừa xong';
      if (minutes < 60) return `${minutes} phút`;
      if (hours < 24) return `${hours} giờ`;
      if (days < 7) return `${days} ngày`;
      
      return date.toLocaleDateString('vi-VN');
    } catch (error) {
      return '';
    }
  };

  const getAvatarColor = (name) => {
    if (!name) return '#0084ff';
    
    const colors = [
      '#0084ff', '#00a651', '#ff6b6b', '#4ecdc4', 
      '#45b7d1', '#96ceb4', '#feca57', '#ff9ff3',
      '#54a0ff', '#5f27cd', '#00d2d3', '#ff9f43'
    ];
    
    const hash = name.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);
    
    return colors[Math.abs(hash) % colors.length];
  };

  const unreadCount = conversation.unread_count || conversation.unreadCount || 0;
  const name = nickname || conversation.full_name || conversation.participant_name || conversation.name || 'Unknown';

  return (
    <SwipeContainer>
      <ConversationItem
        selected={selected}
        swipeOffset={swipeOffset}
        hasUnread={hasUnread}
        onClick={handleClick}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <Avatar color={getAvatarColor(name)}>
          {conversation.avatar_url ? (
            <img 
              src={getAvatarURL(conversation.avatar_url)} 
              alt={name} 
              style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} 
            />
          ) : (
            getInitials(name)
          )}
          {(conversation.participant_status || conversation.status) === 'online' && <OnlineIndicator />}
        </Avatar>
        <ConversationInfo>
          <ConversationName hasUnread={hasUnread}>
            {name}
          </ConversationName>
          <LastMessage hasUnread={hasUnread}>
            {conversation.last_message || conversation.lastMessage || 'Chưa có tin nhắn'}
          </LastMessage>
        </ConversationInfo>
        <TimeStamp>
          {formatTimestamp(conversation.updated_at || conversation.updatedAt)}
          {hasUnread && unreadCount > 0 && (
            <UnreadBadge hasUnread={hasUnread}>
              {unreadCount}
            </UnreadBadge>
          )}
        </TimeStamp>
      </ConversationItem>
      
      <SwipeActions>
        {unreadCount > 0 ? (
          <ReadButton onClick={(e) => {
            e.stopPropagation();
            onSwipeAction(conversation.id, 'read');
            setSwipeOffset(0);
          }}>
            <FiCheckCircle />
            Đã đọc
          </ReadButton>
        ) : (
          <UnreadButton onClick={(e) => {
            e.stopPropagation();
            onSwipeAction(conversation.id, 'unread');
            setSwipeOffset(0);
          }}>
            <FiMail />
            Chưa đọc
          </UnreadButton>
        )}
        <DeleteButton onClick={(e) => {
          e.stopPropagation();
          onSwipeAction(conversation.id, 'delete');
          setSwipeOffset(0);
        }}>
          <FiTrash2 />
          Xóa
        </DeleteButton>
      </SwipeActions>
    </SwipeContainer>
  );
};

export default MobileConversationItem;

