import React, { useState, useRef, useEffect } from 'react';
import styled from 'styled-components';
import { FiCheck, FiCheckCircle, FiArrowLeft } from 'react-icons/fi';
import { getInitials } from '../../../utils/nameUtils';
import { getAvatarURL, getUploadedImageURL } from '../../../utils/imageUtils';
import MessageContextMenu from './MessageContextMenu';

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
  transition: opacity 0.2s ease;
  user-select: ${props => !props.isOwn ? 'none' : 'text'};

  ${props => props.isOwn && `
    border-bottom-right-radius: 4px;
  `}

  ${props => !props.isOwn && `
    border-bottom-left-radius: 4px;
  `}

  ${props => props.isPress && !props.isOwn && `
    opacity: 0.7;
    background: var(--bg-secondary, #f0f0f0);
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

const ReactionsBar = styled.div`
  display: flex;
  gap: 4px;
  padding: 4px 8px;
  background: white;
  border-radius: 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  margin-bottom: 4px;
  align-self: ${props => props.isOwn ? 'flex-end' : 'flex-start'};
  max-width: 100%;
  flex-wrap: wrap;
`;

const ReactionItem = styled.span`
  font-size: 16px;
  cursor: pointer;
  transition: transform 0.15s ease;
  
  &:active {
    transform: scale(1.3);
  }
`;

// Reply preview styled components
const ReplyPreviewContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
`;

const ReplyPreviewContent = styled.div`
  display: flex;
  flex-direction: column;
  padding: 0.5rem 0.7rem;
  background: ${props => props.isOwn 
    ? 'rgba(255, 255, 255, 0.25)' 
    : 'rgba(0, 0, 0, 0.05)'};
  border-left: 3px solid ${props => props.isOwn 
    ? 'rgba(255, 255, 255, 0.7)' 
    : 'rgba(0, 104, 255, 0.7)'};
  border-radius: 8px 0 0 8px;
  max-width: 100%;
`;

const ReplySender = styled.div`
  font-size: 0.85rem;
  font-weight: 600;
  color: ${props => props.isOwn ? 'rgba(255, 255, 255, 0.95)' : '#333'};
  margin-bottom: 0.2rem;
`;

const ReplyText = styled.div`
  font-size: 0.8rem;
  color: ${props => props.isOwn ? 'rgba(255, 255, 255, 0.8)' : '#666'};
  line-height: 1.3;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
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

// Parse reactions from database (could be string or array)
const parseReactions = (reactions) => {
  if (!reactions) return [];
  if (typeof reactions === 'string') {
    try {
      return JSON.parse(reactions);
    } catch (e) {
      return [];
    }
  }
  return reactions;
};

const Message = ({ message, isOwn, showAvatar, showTime, onReply, onForward, onReaction, allMessages, onEdit, onDelete }) => {
  const senderName = message.full_name || message.username || 'Unknown';
  const avatarColor = getAvatarColor(senderName);
  const [showContextMenu, setShowContextMenu] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });
  const [isPress, setIsPress] = useState(false);
  const longPressTimer = useRef(null);
  const bubbleRef = useRef(null);
  const [localReactions, setLocalReactions] = useState(parseReactions(message.reactions));
  const swipeStartRef = useRef(null);
  const longPressPositionRef = useRef({ x: 0, y: 0 });

  // Parse reply content - "Re: {original message}\n\n{new message}"
  const parseReply = (content) => {
    const replyMatch = content.match(/^Re:\s*(.+?)\n\n(.+)$/s);
    if (replyMatch) {
      const [, originalMessage, newMessage] = replyMatch;
      
      // Find the original message in conversation
      let replyInfo = { name: 'Unknown', text: originalMessage };
      
      if (allMessages) {
        // Try to find matching message (simple search)
        const found = allMessages.find(m => m.content === originalMessage || originalMessage.includes(m.content));
        if (found) {
          replyInfo.name = found.full_name || found.username || 'Unknown';
          replyInfo.text = found.content;
        }
      }
      
      return {
        isReply: true,
        replyInfo,
        newContent: newMessage
      };
    }
    return { isReply: false, content };
  };

  const parsedReply = parseReply(message.content);

  // Sync localReactions when message.reactions changes from parent
  useEffect(() => {
    const parsed = parseReactions(message.reactions);
    setLocalReactions(parsed);
  }, [message.reactions]);

  // Swipe to reply detection (only for received messages)
  useEffect(() => {
    if (isOwn) return; // Only for messages from other users

    const handleTouchStart = (e) => {
      const touch = e.touches[0];
      swipeStartRef.current = { x: touch.clientX, y: touch.clientY, time: Date.now() };
    };

    const handleTouchMove = (e) => {
      if (!swipeStartRef.current) return;
      
      const touch = e.touches[0];
      const deltaX = touch.clientX - swipeStartRef.current.x;
      
      // Update visual feedback during swipe
      if (deltaX < -30) {
        e.target.style.transform = `translateX(${Math.max(deltaX, -60)}px)`;
      }
    };

    const handleTouchEnd = (e) => {
      if (!swipeStartRef.current) return;
      
      const touch = e.changedTouches[0];
      const deltaX = touch.clientX - swipeStartRef.current.x;
      const deltaY = Math.abs(touch.clientY - swipeStartRef.current.y);
      const deltaTime = Date.now() - swipeStartRef.current.time;
      
      // Reset transform
      if (e.target.style) {
        e.target.style.transform = '';
      }
      
      // Check if it's a left swipe (from right to left)
      // More lenient: any horizontal swipe left triggers reply
      if (deltaX < -40) {
        // Trigger reply
        if (onReply) {
          onReply(message);
          // Vibrate on mobile if supported
          if ('vibrate' in navigator) {
            navigator.vibrate(30);
          }
        }
      }
      
      swipeStartRef.current = null;
    };

    const bubble = bubbleRef.current;
    if (bubble) {
      bubble.addEventListener('touchstart', handleTouchStart, { passive: true });
      bubble.addEventListener('touchmove', handleTouchMove, { passive: true });
      bubble.addEventListener('touchend', handleTouchEnd, { passive: true });

      return () => {
        bubble.removeEventListener('touchstart', handleTouchStart);
        bubble.removeEventListener('touchmove', handleTouchMove);
        bubble.removeEventListener('touchend', handleTouchEnd);
      };
    }
  }, [isOwn, onReply, message]);

  // Long press detection (for both own and received messages)
  useEffect(() => {
    const handleStart = (e) => {
      // Get position immediately
      let clientX = 0;
      let clientY = 0;
      
      if (e.type === 'touchstart' || e.touches) {
        const touch = e.touches && e.touches.length > 0 ? e.touches[0] : e.changedTouches[0];
        clientX = touch.clientX;
        clientY = touch.clientY;
      } else {
        clientX = e.clientX || 0;
        clientY = e.clientY || 0;
      }
      
      // Save position for later use
      longPressPositionRef.current = { x: clientX, y: clientY };
      
      setIsPress(true);
      clearTimeout(longPressTimer.current);
      longPressTimer.current = setTimeout(() => {
        handleLongPress(e);
      }, 500); // 500ms for long press
    };

    const handleEnd = () => {
      clearTimeout(longPressTimer.current);
      setIsPress(false);
    };

    const handleMove = (e) => {
      clearTimeout(longPressTimer.current);
      
      // Cancel long press if user is swiping (only for received messages)
      if (!isOwn && swipeStartRef.current && e.touches) {
        const touch = e.touches[0];
        if (touch) {
          const deltaX = Math.abs(touch.clientX - swipeStartRef.current.x);
          const deltaY = Math.abs(touch.clientY - swipeStartRef.current.y);
          
          // If horizontal movement is significant, cancel long press (user is swiping)
          if (deltaX > 30 && deltaX > deltaY) {
            setIsPress(false);
          }
        }
      }
    };

    const handleContextMenu = (e) => {
      e.preventDefault();
      e.stopPropagation();
    };

    const bubble = bubbleRef.current;
    if (bubble) {
      // Mouse events for desktop
      bubble.addEventListener('mousedown', handleStart);
      bubble.addEventListener('mouseup', handleEnd);
      bubble.addEventListener('mouseleave', handleEnd);
      bubble.addEventListener('mousemove', handleMove);
      bubble.addEventListener('contextmenu', handleContextMenu);

      // Touch events for mobile
      bubble.addEventListener('touchstart', handleStart, { passive: false });
      bubble.addEventListener('touchend', handleEnd, { passive: false });
      bubble.addEventListener('touchmove', handleMove, { passive: false });

      return () => {
        bubble.removeEventListener('mousedown', handleStart);
        bubble.removeEventListener('mouseup', handleEnd);
        bubble.removeEventListener('mouseleave', handleEnd);
        bubble.removeEventListener('mousemove', handleMove);
        bubble.removeEventListener('contextmenu', handleContextMenu);
        bubble.removeEventListener('touchstart', handleStart);
        bubble.removeEventListener('touchend', handleEnd);
        bubble.removeEventListener('touchmove', handleMove);
        clearTimeout(longPressTimer.current);
      };
    }
  }, [isOwn]);

  const handleLongPress = (e) => {
    if (e.preventDefault) {
      e.preventDefault();
    }
    if (e.stopPropagation) {
      e.stopPropagation();
    }
    
    // Use the saved position from handleStart
    const position = longPressPositionRef.current;
    
    setMenuPosition({ x: position.x, y: position.y });
    setShowContextMenu(true);
    
    // Vibrate on mobile if supported
    if ('vibrate' in navigator) {
      navigator.vibrate(50);
    }
  };

  const handleCloseMenu = () => {
    setShowContextMenu(false);
  };

  const handleReply = () => {
    handleCloseMenu();
    if (onReply) {
      onReply(message);
    }
  };

  const handleForward = () => {
    handleCloseMenu();
    if (onForward) {
      onForward(message);
    }
  };

  const handleCopy = () => {
    handleCloseMenu();
    navigator.clipboard.writeText(message.content);
  };

  const handlePin = () => {
    handleCloseMenu();
    // TODO: Implement pin functionality
    console.log('Pin message:', message.id);
  };

  const handleSave = () => {
    handleCloseMenu();
    // TODO: Implement save functionality
    console.log('Save message:', message.id);
  };

  const handleEdit = () => {
    handleCloseMenu();
    if (onEdit) {
      onEdit(message);
    }
  };

  const handleDelete = () => {
    handleCloseMenu();
    if (onDelete) {
      onDelete(message);
    }
  };

  const handleReactionClick = (reaction) => {
    handleCloseMenu();
    
    // Toggle reaction
    const newReactions = [...localReactions];
    const existingIndex = newReactions.indexOf(reaction);
    
    if (existingIndex > -1) {
      // Remove reaction
      newReactions.splice(existingIndex, 1);
    } else {
      // Add reaction
      newReactions.push(reaction);
    }
    
    setLocalReactions(newReactions);
    
    // Call parent callback
    if (onReaction) {
      onReaction(message.id, reaction);
    }
  };

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (showContextMenu && e.target.closest('.context-menu-overlay') === null) {
        handleCloseMenu();
      }
    };
    
    if (showContextMenu) {
      document.addEventListener('click', handleClickOutside);
      return () => {
        document.removeEventListener('click', handleClickOutside);
      };
    }
  }, [showContextMenu]);

  return (
    <>
    <MessageContainer 
      isOwn={isOwn} 
      showTime={showTime}
    >
      <Avatar 
        color={avatarColor} 
        showAvatar={showAvatar}
      >
        {message.avatar_url ? (
          <img 
            src={getAvatarURL(message.avatar_url)} 
            alt={senderName} 
            style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }}
            onError={(e) => {
              // Hide image on error to show initials instead
              e.target.style.display = 'none';
            }}
          />
        ) : (
          getInitials(senderName)
        )}
      </Avatar>
      
      <MessageContent isOwn={isOwn}>
        {localReactions.length > 0 && (
          <ReactionsBar isOwn={isOwn}>
            {localReactions.map((reaction, index) => (
              <ReactionItem key={index}>{reaction}</ReactionItem>
            ))}
          </ReactionsBar>
        )}
        
        <MessageBubble 
          ref={bubbleRef}
          isOwn={isOwn} 
          isImage={message.message_type === 'image'}
          isPress={isPress}
          style={{ cursor: isOwn ? 'default' : 'context-menu' }}
        >
          {parsedReply.isReply && !parsedReply.newContent.includes('image') && (
            <ReplyPreviewContainer>
              <ReplyPreviewContent isOwn={isOwn}>
                <ReplySender isOwn={isOwn}>{parsedReply.replyInfo.name}</ReplySender>
                <ReplyText isOwn={isOwn}>{parsedReply.replyInfo.text}</ReplyText>
              </ReplyPreviewContent>
            </ReplyPreviewContainer>
          )}
          
          {message.message_type === 'image' ? (
            <MessageImage 
              src={getUploadedImageURL(message.content)} 
              alt="Message image"
              onClick={() => window.open(getUploadedImageURL(message.content), '_blank')}
            />
          ) : parsedReply.isReply ? (
            <span>{parsedReply.newContent}</span>
          ) : (
            <span>{message.content || ''}</span>
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

    <MessageContextMenu
      isVisible={showContextMenu}
      position={menuPosition}
      message={message}
      onClose={handleCloseMenu}
      onReply={handleReply}
      onForward={handleForward}
      onCopy={handleCopy}
      onPin={handlePin}
      onSave={handleSave}
      onReaction={handleReactionClick}
      onEdit={handleEdit}
      onDelete={handleDelete}
      isOwn={isOwn}
    />
    </>
  );
};

export default Message;
