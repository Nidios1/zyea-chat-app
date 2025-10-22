import React, { useState, useRef } from 'react';
import styled from 'styled-components';
import { FiCheck, FiCheckCircle, FiArrowLeft } from 'react-icons/fi';
import { getInitials } from '../../utils/nameUtils';

const MessageContainer = styled.div`
  display: flex;
  flex-direction: ${props => props.isOwn ? 'row-reverse' : 'row'};
  align-items: flex-end;
  gap: 0.5rem;
  margin-bottom: ${props => props.showTime ? '1rem' : '0.25rem'};
  position: relative;
`;

const Avatar = styled.div`
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: ${props => props.color || '#00a651'};
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  color: white;
  font-size: 0.9rem;
  flex-shrink: 0;
  opacity: ${props => props.showAvatar ? 1 : 0};
`;

const MessageContent = styled.div`
  display: flex;
  flex-direction: column;
  align-items: ${props => props.isOwn ? 'flex-end' : 'flex-start'};
  max-width: 70%;
`;

const MessageBubble = styled.div`
  background: ${props => props.isOwn ? 'var(--primary-color, #0068ff)' : 'var(--bg-primary, white)'};
  color: ${props => props.isOwn ? 'white' : 'var(--text-primary, #333)'};
  padding: ${props => props.isImage ? '0' : '0.75rem 1rem'};
  border-radius: 18px;
  box-shadow: 0 1px 2px var(--shadow-color, rgba(0, 0, 0, 0.1));
  word-wrap: break-word;
  position: relative;
  max-width: 300px;

  ${props => props.isOwn && `
    border-bottom-right-radius: 4px;
  `}

  ${props => !props.isOwn && `
    border-bottom-left-radius: 4px;
  `}
`;

const MessageImage = styled.img`
  width: 100%;
  max-width: 250px;
  height: auto;
  border-radius: 12px;
  cursor: pointer;
  transition: transform 0.2s ease;
  
  &:hover {
    transform: scale(1.02);
  }
`;

const MessageTime = styled.div`
  font-size: 0.7rem;
  color: var(--text-tertiary, #999);
  margin-top: 0.25rem;
  padding: 0 0.5rem;
  opacity: 0.8;
  font-weight: 400;
`;

const MessageStatus = styled.div`
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.65rem;
  color: var(--text-tertiary, #999);
  margin-top: 0.25rem;
  padding: 0 0.5rem;
  opacity: 0.8;
  
  .status-icon {
    font-size: 0.75rem;
  }
  
  .sent {
    color: var(--text-tertiary, #999);
  }
  
  .delivered {
    color: var(--text-tertiary, #999);
  }
  
  .read {
    color: var(--primary-color, #0068ff);
  }
`;



const getAvatarColor = (name) => {
  const colors = ['#00a651', '#0068ff', '#ff6b35', '#8e44ad', '#e74c3c', '#f39c12'];
  const index = name?.charCodeAt(0) % colors.length || 0;
  return colors[index];
};

const formatTime = (timestamp) => {
  const date = new Date(timestamp);
  const now = new Date();
  const diffInMinutes = (now - date) / (1000 * 60);
  
  // Nếu trong cùng ngày
  if (date.toDateString() === now.toDateString()) {
    // Nếu trong 1 phút
    if (diffInMinutes < 1) {
      return 'Vừa xong';
    }
    // Nếu trong 1 giờ
    if (diffInMinutes < 60) {
      return date.toLocaleTimeString('vi-VN', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    }
    // Nếu trong cùng ngày
    return date.toLocaleTimeString('vi-VN', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  }
  
  // Nếu hôm qua
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) {
    return 'Hôm qua ' + date.toLocaleTimeString('vi-VN', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  }
  
  // Nếu trong 7 ngày qua
  const diffInDays = Math.floor(diffInMinutes / (24 * 60));
  if (diffInDays < 7) {
    const weekdays = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
    const weekday = weekdays[date.getDay()];
    return weekday + ' ' + date.toLocaleTimeString('vi-VN', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  }
  
  // Nếu lâu hơn
  return date.toLocaleDateString('vi-VN', { 
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const renderMessageStatus = (message, isOwn) => {
  if (!isOwn) return null;
  
  const status = message.status || 'sent';
  
  switch (status) {
    case 'sent':
      return (
        <MessageStatus>
          <span className="sent">Đã gửi</span>
        </MessageStatus>
      );
    case 'delivered':
      return (
        <MessageStatus>
          <FiCheck className="status-icon delivered" />
          <span className="delivered">Đã nhận</span>
        </MessageStatus>
      );
    case 'read':
      return (
        <MessageStatus>
          <FiCheckCircle className="status-icon read" />
          <span className="read">Đã xem</span>
        </MessageStatus>
      );
    default:
      return (
        <MessageStatus>
          <span className="sent">Đã gửi</span>
        </MessageStatus>
      );
  }
};

const Message = ({ message, isOwn, showAvatar, showTime }) => {
  const senderName = message.full_name || message.username || 'Unknown';
  const avatarColor = getAvatarColor(senderName);

  return (
    <MessageContainer 
      isOwn={isOwn} 
      showTime={showTime}
    >
      <Avatar 
        color={avatarColor} 
        showAvatar={showAvatar}
      >
        {message.avatar_url ? (
          <img src={message.avatar_url} alt={senderName} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
        ) : (
          getInitials(senderName)
        )}
      </Avatar>
      
      <MessageContent isOwn={isOwn}>
        <MessageBubble isOwn={isOwn} isImage={message.message_type === 'image'}>
          {message.message_type === 'image' ? (
            <MessageImage 
              src={message.content} 
              alt="Message image"
              onClick={() => window.open(message.content, '_blank')}
            />
          ) : (
            message.content
          )}
        </MessageBubble>
        
        {showTime && (
          <MessageTime>
            {formatTime(message.created_at)}
          </MessageTime>
        )}
        
        {renderMessageStatus(message, isOwn)}
      </MessageContent>

    </MessageContainer>
  );
};

export default Message;
