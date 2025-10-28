import React from 'react';
import styled from 'styled-components';
import { FiEdit3, FiX } from 'react-icons/fi';

const EditContainer = styled.div`
  display: flex;
  align-items: center;
  background: white;
  padding: 10px 12px;
  border-top: 1px solid #f0f0f0;
  gap: 12px;

  @media (max-width: 768px) {
    padding: 12px;
  }
`;

const EditIcon = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: #0068ff;
  color: white;
  flex-shrink: 0;
`;

const EditContent = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const EditLabel = styled.div`
  font-size: 13px;
  font-weight: 600;
  color: #333;
`;

const EditText = styled.div`
  font-size: 14px;
  color: #666;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 100%;

  @media (max-width: 768px) {
    font-size: 13px;
  }
`;

const CancelButton = styled.button`
  background: none;
  border: none;
  color: #999;
  cursor: pointer;
  padding: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: background 0.2s ease;

  &:hover {
    background: #f0f0f0;
  }

  &:active {
    background: #e0e0e0;
  }

  @media (max-width: 768px) {
    padding: 10px;
  }
`;

const EditBar = ({ editingMessage, onCancel }) => {
  if (!editingMessage) return null;

  return (
    <EditContainer>
      <EditIcon>
        <FiEdit3 size={14} />
      </EditIcon>
      
      <EditContent>
        <EditLabel>Chỉnh sửa tin nhắn</EditLabel>
        <EditText>{editingMessage.content}</EditText>
      </EditContent>
      
      <CancelButton onClick={onCancel}>
        <FiX size={18} />
      </CancelButton>
    </EditContainer>
  );
};

export default EditBar;

