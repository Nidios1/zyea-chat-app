import React, { useState, useEffect, useRef } from 'react';
import styled, { keyframes } from 'styled-components';
import { FiSearch, FiX, FiUsers } from 'react-icons/fi';
import { chatAPI } from '../../utils/api';
import { getInitials } from '../../utils/nameUtils';
import { getAvatarURL, getUploadedImageURL } from '../../utils/imageUtils';

// Animations
const fadeIn = keyframes`
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
`;

const slideUp = keyframes`
  from {
    transform: translateY(100%);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
`;

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, ${props => props.$closing ? 0 : 0.5});
  backdrop-filter: blur(${props => props.$closing ? '0px' : '8px'});
  -webkit-backdrop-filter: blur(${props => props.$closing ? '0px' : '8px'});
  display: flex;
  justify-content: center;
  align-items: flex-end;
  z-index: 9999;
  animation: ${fadeIn} 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

  @media (min-width: 769px) {
    align-items: center;
  }
`;

const ModalContainer = styled.div`
  background: white;
  width: 100%;
  max-width: 100%;
  border-radius: 20px 20px 0 0;
  max-height: 85vh;
  display: flex;
  flex-direction: column;
  position: relative;
  transform: translateY(${props => props.$dragOffset}px);
  transition: ${props => props.$isDragging ? 'none' : 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)'};
  animation: ${slideUp} 0.35s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 -4px 24px rgba(0, 0, 0, 0.15);
  
  /* Safe area for iOS */
  padding-bottom: env(safe-area-inset-bottom);

  @media (min-width: 769px) {
    border-radius: 16px;
    max-height: 680px;
    max-width: 480px;
    box-shadow: 0 12px 48px rgba(0, 0, 0, 0.2);
  }
`;

const DragHandle = styled.div`
  width: 100%;
  padding: 12px 0 8px;
  display: flex;
  justify-content: center;
  cursor: grab;
  touch-action: none;
  
  &:active {
    cursor: grabbing;
  }

  @media (min-width: 769px) {
    display: none;
  }
`;

const HandleBar = styled.div`
  width: 40px;
  height: 4px;
  background: #d1d5db;
  border-radius: 2px;
  transition: all 0.2s ease;

  ${DragHandle}:active & {
    width: 60px;
    background: #9ca3af;
  }
`;

const Header = styled.div`
  padding: 8px 16px 16px;
  border-bottom: 1px solid #e5e7eb;
  display: flex;
  align-items: center;
  justify-content: space-between;
  position: sticky;
  top: 0;
  background: white;
  z-index: 10;
  border-radius: 20px 20px 0 0;

  @media (min-width: 769px) {
    border-radius: 16px 16px 0 0;
    padding: 12px 16px 16px;
  }
`;

const Title = styled.h2`
  font-size: 18px;
  font-weight: 700;
  color: #1f2937;
  margin: 0;
  flex: 1;
  text-align: center;
  letter-spacing: -0.3px;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  padding: 8px;
  cursor: pointer;
  color: #6b7280;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  -webkit-tap-highlight-color: transparent;

  &:hover {
    background: #f3f4f6;
    color: #374151;
  }

  &:active {
    background: #e5e7eb;
    transform: scale(0.95);
  }
`;

const SearchContainer = styled.div`
  padding: 0 16px 12px;
  background: white;
  border-bottom: 1px solid #e5e7eb;
  position: sticky;
  top: 58px;
  z-index: 9;

  @media (min-width: 769px) {
    top: 62px;
  }
`;

const SearchBox = styled.div`
  display: flex;
  align-items: center;
  background: #f3f4f6;
  border-radius: 12px;
  padding: 10px 14px;
  gap: 10px;
  transition: all 0.2s ease;

  &:focus-within {
    background: #e5e7eb;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }
`;

const SearchIcon = styled.div`
  color: #9ca3af;
  display: flex;
  align-items: center;
  transition: color 0.2s ease;

  ${SearchBox}:focus-within & {
    color: #6b7280;
  }
`;

const SearchInput = styled.input`
  flex: 1;
  background: none;
  border: none;
  outline: none;
  font-size: 15px;
  color: #1f2937;
  font-weight: 400;

  &::placeholder {
    color: #9ca3af;
  }
`;

const Content = styled.div`
  flex: 1;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  overscroll-behavior: contain;
  
  &::-webkit-scrollbar {
    width: 0;
    display: none;
  }
  
  /* Smooth scrolling */
  scroll-behavior: smooth;
`;

const CreateGroupOption = styled.div`
  padding: 14px 16px;
  display: flex;
  align-items: center;
  gap: 14px;
  cursor: pointer;
  transition: all 0.15s ease;
  border-bottom: 1px solid #e5e7eb;
  -webkit-tap-highlight-color: transparent;
  user-select: none;

  &:active {
    background: #f3f4f6;
    transform: scale(0.98);
  }

  @media (hover: hover) {
    &:hover {
      background: #f9fafb;
    }
  }
`;

const GroupIcon = styled.div`
  width: 52px;
  height: 52px;
  border-radius: 50%;
  background: linear-gradient(135deg, #0084ff 0%, #0099ff 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  flex-shrink: 0;
  box-shadow: 0 2px 8px rgba(0, 132, 255, 0.25);
  transition: transform 0.2s ease;

  ${CreateGroupOption}:active & {
    transform: scale(0.95);
  }
`;

const GroupText = styled.div`
  flex: 1;
`;

const GroupTitle = styled.div`
  font-size: 16px;
  font-weight: 600;
  color: #1f2937;
  letter-spacing: -0.2px;
`;

const Section = styled.div`
  padding: 8px 0 0;
`;

const SectionTitle = styled.div`
  padding: 16px 16px 8px;
  font-size: 13px;
  font-weight: 700;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const FriendItem = styled.div`
  padding: 12px 16px;
  display: flex;
  align-items: center;
  gap: 14px;
  cursor: pointer;
  transition: all 0.15s ease;
  -webkit-tap-highlight-color: transparent;
  user-select: none;
  position: relative;

  &::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 82px;
    right: 16px;
    height: 1px;
    background: #f3f4f6;
  }

  &:last-child::after {
    display: none;
  }

  &:active {
    background: #f3f4f6;
    transform: scale(0.98);
  }

  @media (hover: hover) {
    &:hover {
      background: #f9fafb;
    }
  }
`;

const Avatar = styled.div`
  width: 52px;
  height: 52px;
  border-radius: 50%;
  background: ${props => props.color || '#0084ff'};
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 600;
  font-size: 20px;
  flex-shrink: 0;
  position: relative;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
`;

const OnlineIndicator = styled.div`
  position: absolute;
  bottom: 0;
  right: 0;
  width: 14px;
  height: 14px;
  background: #10b981;
  border: 3px solid white;
  border-radius: 50%;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
`;

const FriendInfo = styled.div`
  flex: 1;
  min-width: 0;
`;

const FriendName = styled.div`
  font-size: 16px;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 3px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  letter-spacing: -0.2px;
`;

const FriendDetails = styled.div`
  font-size: 14px;
  color: #6b7280;
  display: flex;
  align-items: center;
  gap: 6px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const EmptyState = styled.div`
  padding: 80px 24px;
  text-align: center;
  color: #6b7280;
`;

const EmptyIcon = styled.div`
  font-size: 64px;
  margin-bottom: 20px;
  opacity: 0.6;
  filter: grayscale(0.3);
`;

const EmptyText = styled.div`
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 8px;
  color: #374151;
  letter-spacing: -0.3px;
`;

const EmptySubtext = styled.div`
  font-size: 14px;
  color: #9ca3af;
  line-height: 1.5;
`;

const LoadingSpinner = styled.div`
  width: 24px;
  height: 24px;
  border: 3px solid #e5e7eb;
  border-top-color: #0084ff;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin: 0 auto 16px;

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
`;

const NewMessageModal = ({ onClose, onSelectUser, onCreateGroup }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [friends, setFriends] = useState([]);
  const [filteredFriends, setFilteredFriends] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);
  const [startY, setStartY] = useState(0);
  const [closing, setClosing] = useState(false);
  const modalRef = useRef(null);

  useEffect(() => {
    loadFriends();
    // Prevent body scroll when modal is open
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredFriends(friends);
    } else {
      const filtered = friends.filter(friend => {
        const name = friend.full_name || friend.username || '';
        const username = friend.username || '';
        return name.toLowerCase().includes(searchTerm.toLowerCase()) ||
               username.toLowerCase().includes(searchTerm.toLowerCase());
      });
      setFilteredFriends(filtered);
    }
  }, [searchTerm, friends]);

  const loadFriends = async () => {
    try {
      setLoading(true);
      const response = await chatAPI.getFriends();
      console.log('Friends response:', response);
      
      if (response && Array.isArray(response)) {
        setFriends(response);
        setFilteredFriends(response);
      } else if (response && response.data && Array.isArray(response.data)) {
        setFriends(response.data);
        setFilteredFriends(response.data);
      } else {
        setFriends([]);
        setFilteredFriends([]);
      }
    } catch (error) {
      console.error('Error loading friends:', error);
      setFriends([]);
      setFilteredFriends([]);
    } finally {
      setLoading(false);
    }
  };

  const getAvatarColor = (name) => {
    const colors = [
      '#0084ff', '#00a651', '#ff6b6b', '#4ecdc4', 
      '#45b7d1', '#96ceb4', '#feca57', '#ff9ff3',
      '#54a0ff', '#5f27cd', '#00d2d3', '#ff9f43',
      '#ee5a6f', '#c44569', '#f8b500', '#6a89cc'
    ];
    
    if (!name) return colors[0];
    
    const hash = name.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);
    
    return colors[Math.abs(hash) % colors.length];
  };

  const handleClose = () => {
    setClosing(true);
    setTimeout(() => {
      onClose();
    }, 200);
  };

  const handleSelectFriend = (friend) => {
    if (onSelectUser) {
      onSelectUser(friend);
    }
    handleClose();
  };

  const handleCreateGroup = () => {
    if (onCreateGroup) {
      onCreateGroup();
    }
    handleClose();
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  // Swipe down to dismiss handlers
  const handleDragStart = (e) => {
    const clientY = e.type === 'touchstart' ? e.touches[0].clientY : e.clientY;
    setIsDragging(true);
    setStartY(clientY);
  };

  const handleDragMove = (e) => {
    if (!isDragging) return;
    
    const clientY = e.type === 'touchmove' ? e.touches[0].clientY : e.clientY;
    const deltaY = clientY - startY;
    
    // Only allow dragging down
    if (deltaY > 0) {
      setDragOffset(deltaY);
    }
  };

  const handleDragEnd = () => {
    if (!isDragging) return;
    
    setIsDragging(false);
    
    // If dragged more than 100px, close the modal
    if (dragOffset > 100) {
      handleClose();
    } else {
      setDragOffset(0);
    }
  };

  return (
    <ModalOverlay onClick={handleOverlayClick} $closing={closing}>
      <ModalContainer 
        ref={modalRef}
        onClick={(e) => e.stopPropagation()}
        $dragOffset={dragOffset}
        $isDragging={isDragging}
      >
        <DragHandle
          onMouseDown={handleDragStart}
          onMouseMove={handleDragMove}
          onMouseUp={handleDragEnd}
          onMouseLeave={handleDragEnd}
          onTouchStart={handleDragStart}
          onTouchMove={handleDragMove}
          onTouchEnd={handleDragEnd}
        >
          <HandleBar />
        </DragHandle>

        <Header>
          <CloseButton onClick={handleClose}>
            <FiX size={24} />
          </CloseButton>
          <Title>Tin nhắn mới</Title>
          <div style={{ width: 40 }}></div>
        </Header>

        <SearchContainer>
          <SearchBox>
            <SearchIcon>
              <FiSearch size={18} />
            </SearchIcon>
            <SearchInput
              type="text"
              placeholder="Tìm kiếm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              autoFocus
            />
          </SearchBox>
        </SearchContainer>

        <Content>
          <CreateGroupOption onClick={handleCreateGroup}>
            <GroupIcon>
              <FiUsers size={24} />
            </GroupIcon>
            <GroupText>
              <GroupTitle>Tạo nhóm Chat</GroupTitle>
            </GroupText>
          </CreateGroupOption>

          <Section>
            <SectionTitle>Gợi ý</SectionTitle>
            
            {loading ? (
              <EmptyState>
                <LoadingSpinner />
                <EmptyText>Đang tải danh sách bạn bè...</EmptyText>
              </EmptyState>
            ) : filteredFriends.length > 0 ? (
              filteredFriends.map((friend) => (
                <FriendItem 
                  key={friend.id || friend.user_id} 
                  onClick={() => handleSelectFriend(friend)}
                >
                  <Avatar color={getAvatarColor(friend.full_name || friend.username)}>
                    {friend.avatar_url ? (
                      <img src={getAvatarURL(friend.avatar_url)} alt={friend.full_name} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                    ) : (
                      getInitials(friend.full_name || friend.username)
                    )}
                    {friend.status === 'online' && <OnlineIndicator />}
                  </Avatar>
                  <FriendInfo>
                    <FriendName>{friend.full_name || friend.username || 'Unknown'}</FriendName>
                    <FriendDetails>
                      {friend.username && <span>@{friend.username}</span>}
                      {friend.location && <span>• {friend.location}</span>}
                    </FriendDetails>
                  </FriendInfo>
                </FriendItem>
              ))
            ) : (
              <EmptyState>
                <EmptyIcon>👥</EmptyIcon>
                <EmptyText>
                  {searchTerm ? 'Không tìm thấy kết quả' : 'Chưa có bạn bè'}
                </EmptyText>
                <EmptySubtext>
                  {searchTerm ? 'Thử tìm kiếm với từ khóa khác' : 'Hãy kết bạn để bắt đầu trò chuyện'}
                </EmptySubtext>
              </EmptyState>
            )}
          </Section>
        </Content>
      </ModalContainer>
    </ModalOverlay>
  );
};

export default NewMessageModal;
