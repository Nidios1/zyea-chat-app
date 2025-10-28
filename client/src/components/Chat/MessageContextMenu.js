import React from 'react';
import styled from 'styled-components';
import { 
  FiCornerUpLeft, FiCornerUpRight, FiCheckSquare, 
  FiBookmark, FiCopy, FiMapPin, FiEdit3, FiTrash2
} from 'react-icons/fi';

const Overlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: transparent;
  z-index: 998;
`;

const MenuContainer = styled.div`
  position: fixed;
  background: white;
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
  z-index: 999;
  overflow: hidden;
  animation: fadeIn 0.2s ease-out;
  max-width: 90vw;

  @media (max-width: 768px) {
    max-width: 75vw;
    border-radius: 12px;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
  }

  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: scale(0.95);
    }
    to {
      opacity: 1;
      transform: scale(1);
    }
  }
`;

const MessagePreview = styled.div`
  padding: 12px 16px;
  border-bottom: 1px solid #f0f0f0;
  max-width: 280px;

  @media (max-width: 768px) {
    padding: 8px 12px;
    max-width: 100%;
  }
`;

const MessageBubble = styled.div`
  background: #e9ecef;
  padding: 10px 14px;
  border-radius: 12px;
  margin-bottom: 8px;
  word-wrap: break-word;
  display: flex;
  align-items: center;
  justify-content: space-between;

  @media (max-width: 768px) {
    padding: 8px 12px;
    margin-bottom: 6px;
    border-radius: 10px;
  }
`;

const MessageContent = styled.div`
  flex: 1;
  color: #333;
  font-size: 14px;
  line-height: 1.4;
  max-width: 180px;
  
  @media (max-width: 768px) {
    font-size: 12px;
    max-width: 140px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
`;

const MessageTime = styled.div`
  font-size: 11px;
  color: #999;
  margin-left: 8px;
  white-space: nowrap;

  @media (max-width: 768px) {
    font-size: 10px;
    margin-left: 6px;
  }
`;

const ReactionsBar = styled.div`
  display: flex;
  gap: 6px;
  padding: 6px 10px;
  background: white;
  border-radius: 20px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  
  @media (max-width: 768px) {
    gap: 3px;
    padding: 4px 6px;
    border-radius: 16px;
  }
`;

const ReactionEmoji = styled.span`
  font-size: 20px;
  cursor: pointer;
  transition: transform 0.1s ease;

  @media (max-width: 768px) {
    font-size: 16px;
  }

  &:active {
    transform: scale(1.3);
  }
`;

const MenuItems = styled.div`
  background: white;
`;

const MenuItem = styled.button`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  width: 100%;
  background: none;
  border: none;
  text-align: left;
  cursor: pointer;
  transition: background 0.15s ease;
  color: #333;
  font-size: 15px;
  font-weight: 500;

  @media (max-width: 768px) {
    padding: 12px 14px;
    gap: 12px;
    font-size: 14px;
  }

  &:hover {
    background: #f8f9fa;
  }
  
  &:active {
    background: #f0f0f0;
  }

  &:not(:last-child) {
    border-bottom: 1px solid #f0f0f0;
  }
`;

const IconContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  color: #666;
  flex-shrink: 0;
  font-size: 18px;

  @media (max-width: 768px) {
    width: 18px;
    height: 18px;
    font-size: 16px;
  }
`;

const MenuText = styled.span`
  flex: 1;
`;

const MessageContextMenu = ({ 
  isVisible, 
  position, 
  message,
  onClose,
  onReply,
  onForward,
  onCopy,
  onPin,
  onSave,
  onReaction,
  onEdit,
  onDelete,
  isOwn = false
}) => {
  if (!isVisible || !message) return null;

  const handleMenuClick = (e) => {
    e.stopPropagation();
  };

  // Calculate position to keep menu near message
  const getMenuStyle = () => {
    const isMobile = window.innerWidth <= 768;
    const menuWidth = isMobile ? 260 : 280;
    const menuHeight = isMobile ? 280 : 320;
    let left = position?.x || window.innerWidth / 2;
    let top = position?.y || 100;
    
    // Position menu right next to the message
    // Small offset to the left
    left = left - menuWidth * 0.5;
    top = top + 10; // Small offset below
    
    // Keep menu within viewport - adjust if needed
    const margin = 10;
    
    // Adjust horizontally
    if (left < margin) {
      left = margin;
    } else if (left + menuWidth > window.innerWidth - margin) {
      left = window.innerWidth - menuWidth - margin;
    }
    
    // Adjust vertically
    if (top + menuHeight > window.innerHeight - margin) {
      // Not enough space below, try above
      const topAbove = position.y - menuHeight - 10;
      if (topAbove > margin) {
        top = topAbove;
      } else {
        // Not enough space either way, position at top
        top = margin;
      }
    }
    
    return {
      top: `${top}px`,
      left: `${left}px`,
    };
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('vi-VN', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const reactions = ['❤️', '😆', '😮', '😢', '😠', '👍'];

  const handleReactionClick = (reaction) => {
    if (onReaction) {
      onReaction(reaction);
    }
  };

  return (
    <>
      <Overlay onClick={onClose} />
      <MenuContainer 
        style={getMenuStyle()}
        onClick={handleMenuClick}
      >
        <MessagePreview>
          <MessageBubble>
            <MessageContent>{message.content}</MessageContent>
            <MessageTime>{formatTime(message.created_at)}</MessageTime>
          </MessageBubble>
          
          {!isOwn && (
            <ReactionsBar>
              {reactions.map((reaction, index) => (
                <ReactionEmoji 
                  key={index}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleReactionClick(reaction);
                  }}
                >
                  {reaction}
                </ReactionEmoji>
              ))}
            </ReactionsBar>
          )}
        </MessagePreview>

        <MenuItems>
          {isOwn && (
            <>
              <MenuItem onClick={(e) => { e.stopPropagation(); onEdit(); }}>
                <IconContainer>
                  <FiEdit3 />
                </IconContainer>
                <MenuText>Chỉnh sửa</MenuText>
              </MenuItem>
              <MenuItem onClick={(e) => { e.stopPropagation(); onReply(); }}>
                <IconContainer>
                  <FiCornerUpLeft />
                </IconContainer>
                <MenuText>Phản hồi</MenuText>
              </MenuItem>
            </>
          )}
          
          {!isOwn && (
            <MenuItem onClick={(e) => { e.stopPropagation(); onReply(); }}>
              <IconContainer>
                <FiCornerUpLeft />
              </IconContainer>
              <MenuText>Phản hồi</MenuText>
            </MenuItem>
          )}
          
          <MenuItem onClick={(e) => { e.stopPropagation(); onForward(); }}>
            <IconContainer>
              <FiCornerUpRight />
            </IconContainer>
            <MenuText>Chuyển tiếp</MenuText>
          </MenuItem>
          
          <MenuItem onClick={(e) => { e.stopPropagation(); onPin(); }}>
            <IconContainer>
              <FiMapPin />
            </IconContainer>
            <MenuText>Ghim</MenuText>
          </MenuItem>
          
          {isOwn && (
            <MenuItem 
              onClick={(e) => { e.stopPropagation(); onDelete(); }}
              style={{ color: '#e74c3c' }}
            >
              <IconContainer style={{ color: '#e74c3c' }}>
                <FiTrash2 />
              </IconContainer>
              <MenuText style={{ color: '#e74c3c' }}>Xóa</MenuText>
            </MenuItem>
          )}
        </MenuItems>
      </MenuContainer>
    </>
  );
};

export default MessageContextMenu;
