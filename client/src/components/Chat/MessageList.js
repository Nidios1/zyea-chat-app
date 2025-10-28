import React from 'react';
import styled from 'styled-components';
import Message from './Message';

const DateSeparator = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 1rem 0;
  position: relative;
  
  &::before {
    content: '';
    position: absolute;
    top: 50%;
    left: 0;
    right: 0;
    height: 1px;
    background: #e1e5e9;
    z-index: 1;
  }
`;

const DateText = styled.span`
  background: #f0f2f5;
  color: #666;
  padding: 0.5rem 1rem;
  border-radius: 20px;
  font-size: 0.85rem;
  font-weight: 500;
  position: relative;
  z-index: 2;
  border: 1px solid #e1e5e9;
`;

const MessagesList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  padding: 0.5rem 0;
`;

const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #666;
  text-align: center;
  padding: 2rem;
  
  h3 {
    margin: 0 0 0.5rem 0;
    font-size: 1.2rem;
    font-weight: 500;
    color: #333;
  }
  
  p {
    margin: 0;
    font-size: 0.9rem;
    opacity: 0.8;
    line-height: 1.5;
  }
`;

// Helper function to format date
const formatDate = (dateString) => {
  const date = new Date(dateString);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const messageDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  
  if (messageDate.getTime() === today.getTime()) {
    return 'Hôm nay';
  } else if (messageDate.getTime() === yesterday.getTime()) {
    return 'Hôm qua';
  } else {
    return date.toLocaleDateString('vi-VN', { 
      day: '2-digit', 
      month: '2-digit' 
    });
  }
};

// Helper function to check if two dates are on different days
const isDifferentDay = (date1, date2) => {
  if (!date1 || !date2) return true;
  
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  
  return d1.getDate() !== d2.getDate() || 
         d1.getMonth() !== d2.getMonth() || 
         d1.getFullYear() !== d2.getFullYear();
};

const MessageList = ({ messages, currentUserId, onReply, onForward, onReaction, onEdit, onDelete }) => {
  if (messages.length === 0) {
    return (
      <EmptyState>
        <h3>Chưa có tin nhắn nào</h3>
        <p>Hãy bắt đầu cuộc trò chuyện với bạn bè của bạn!</p>
      </EmptyState>
    );
  }

  return (
    <MessagesList>
      {messages.map((message, index) => {
        const prevMessage = messages[index - 1];
        const nextMessage = messages[index + 1];
        
        // Show avatar if it's the first message or different sender
        const showAvatar = !prevMessage || prevMessage.sender_id !== message.sender_id;
        
        // Show time if:
        // 1. It's the last message in the group
        // 2. Different sender than next message
        // 3. Time difference is more than 2 minutes
        const showTime = !nextMessage || 
          nextMessage.sender_id !== message.sender_id ||
          new Date(nextMessage.created_at) - new Date(message.created_at) > 2 * 60 * 1000; // 2 minutes

        // Check if we need to show date separator
        const showDateSeparator = !prevMessage || 
          isDifferentDay(prevMessage.created_at, message.created_at);

        return (
          <React.Fragment key={message.id}>
            {showDateSeparator && (
              <DateSeparator>
                <DateText>{formatDate(message.created_at)}</DateText>
              </DateSeparator>
            )}
            <Message
              message={message}
              isOwn={message.sender_id === currentUserId}
              showAvatar={showAvatar}
              showTime={showTime}
              onReply={onReply}
              onForward={onForward}
              onReaction={onReaction}
              onEdit={onEdit}
              onDelete={onDelete}
              allMessages={messages}
            />
          </React.Fragment>
        );
      })}
    </MessagesList>

  );
};

export default MessageList;
