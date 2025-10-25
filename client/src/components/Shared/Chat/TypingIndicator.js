import React from 'react';
import styled, { keyframes } from 'styled-components';

const TypingContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.25rem 1rem 0.5rem 1rem;
  color: #666;
  font-size: 0.8rem;
  font-style: italic;
  opacity: 0.8;
  margin-bottom: 0.25rem;
`;

const TypingDots = styled.div`
  display: flex;
  gap: 0.2rem;
  align-items: center;
`;

const bounce = keyframes`
  0%, 80%, 100% {
    transform: scale(0);
    opacity: 0.5;
  }
  40% {
    transform: scale(1);
    opacity: 1;
  }
`;

const Dot = styled.div`
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background-color: #666;
  animation: ${bounce} 1.4s infinite ease-in-out;
  animation-delay: ${props => props.delay}s;
`;

const TypingIndicator = ({ typingUsers = [], conversationSettings = {} }) => {
  if (!typingUsers || !Array.isArray(typingUsers) || typingUsers.length === 0) {
    return null;
  }

  // Helper function to get display name (nickname > full_name > username)
  const getDisplayName = (user) => {
    // Check if there's a nickname in conversationSettings
    const nickname = conversationSettings?.nickname;
    return nickname || user.full_name || user.fullName || user.username || 'Người dùng';
  };

  const getTypingText = () => {
    if (typingUsers.length === 1) {
      const displayName = getDisplayName(typingUsers[0]);
      return `${displayName} đang soạn tin nhắn...`;
    } else if (typingUsers.length === 2) {
      const name1 = getDisplayName(typingUsers[0]);
      const name2 = getDisplayName(typingUsers[1]);
      return `${name1} và ${name2} đang soạn tin nhắn...`;
    } else {
      return `${typingUsers.length} người đang soạn tin nhắn...`;
    }
  };

  return (
    <TypingContainer>
      <span>{getTypingText()}</span>
      <TypingDots>
        <Dot delay={0} />
        <Dot delay={0.2} />
        <Dot delay={0.4} />
      </TypingDots>
    </TypingContainer>
  );
};

export default TypingIndicator;
