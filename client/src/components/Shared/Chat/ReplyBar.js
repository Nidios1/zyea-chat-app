import React from 'react';
import styled from 'styled-components';
import { FiX, FiCornerDownLeft } from 'react-icons/fi';

const ReplyBarContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  background: var(--bg-secondary, #f0f2f5);
  border-bottom: 1px solid var(--border-color, #e4e6ea);
  font-size: 14px;
`;

const ReplyIcon = styled.div`
  display: flex;
  align-items: center;
  color: var(--text-secondary, #65676b);
  flex-shrink: 0;
`;

const ReplyContent = styled.div`
  flex: 1;
  min-width: 0;
`;

const ReplyTitle = styled.div`
  color: var(--text-secondary, #65676b);
  font-size: 13px;
  font-weight: 500;
  margin-bottom: 2px;
`;

const ReplyMessage = styled.div`
  color: var(--text-secondary, #666);
  font-size: 13px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  color: var(--text-secondary, #65676b);
  cursor: pointer;
  padding: 4px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s ease;
  flex-shrink: 0;
  
  &:hover {
    background: var(--bg-tertiary, #e4e6ea);
  }
  
  &:active {
    background: var(--bg-tertiary, #d1d3d6);
    opacity: 0.8;
  }
`;

const ReplyBar = ({ replyMessage, onCancel }) => {
  if (!replyMessage) return null;

  return (
    <ReplyBarContainer>
      <ReplyIcon>
        <FiCornerDownLeft size={20} />
      </ReplyIcon>
      <ReplyContent>
        <ReplyTitle>Đang trả lời {replyMessage.full_name || replyMessage.username}</ReplyTitle>
        <ReplyMessage>{replyMessage.content}</ReplyMessage>
      </ReplyContent>
      <CloseButton onClick={onCancel} title="Hủy">
        <FiX size={18} />
      </CloseButton>
    </ReplyBarContainer>
  );
};

export default ReplyBar;

