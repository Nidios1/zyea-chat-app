import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { FiUser, FiMessageCircle, FiSearch, FiX } from 'react-icons/fi';
import api from '../../../utils/api';
import { getInitials } from '../../../utils/nameUtils';
import { getAvatarURL, getUploadedImageURL } from '../../../utils/imageUtils';

const FriendsContainer = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  background: ${props => props.theme === 'dark' 
    ? 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)' 
    : 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)'};
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: ${props => props.theme === 'dark'
      ? `
        radial-gradient(circle at 20% 80%, rgba(120, 119, 198, 0.2) 0%, transparent 50%),
        radial-gradient(circle at 80% 20%, rgba(255, 119, 198, 0.2) 0%, transparent 50%),
        radial-gradient(circle at 40% 40%, rgba(120, 219, 255, 0.2) 0%, transparent 50%)
      `
      : `
        radial-gradient(circle at 20% 80%, rgba(120, 119, 198, 0.1) 0%, transparent 50%),
        radial-gradient(circle at 80% 20%, rgba(255, 119, 198, 0.1) 0%, transparent 50%),
        radial-gradient(circle at 40% 40%, rgba(120, 219, 255, 0.1) 0%, transparent 50%)
      `};
    pointer-events: none;
  }
`;

const Header = styled.div`
  background: #00a651;
  color: white;
  padding: 1rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  position: relative;
  z-index: 10;
`;

const BackButton = styled.button`
  background: none;
  border: none;
  color: white;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 50%;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;

  &:hover {
    background: rgba(255, 255, 255, 0.1);
  }
`;

const Title = styled.h2`
  margin: 0;
  font-size: 1.2rem;
  font-weight: 600;
`;

const SearchContainer = styled.div`
  padding: 1rem;
  position: relative;
  z-index: 10;
`;

const SearchInput = styled.input`
  width: 100%;
  padding: 0.75rem 1rem 0.75rem 3rem;
  border: 1px solid #ddd;
  border-radius: 25px;
  font-size: 14px;
  outline: none;
  background: white;
  transition: all 0.2s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);

  &:focus {
    border-color: #00a651;
    box-shadow: 0 2px 12px rgba(0, 166, 81, 0.2);
  }

  &::placeholder {
    color: #999;
  }
`;

const SearchIcon = styled.div`
  position: absolute;
  left: 1.5rem;
  top: 50%;
  transform: translateY(-50%);
  color: #999;
  z-index: 1;
`;

const FriendsList = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 0 1rem 1rem;
  position: relative;
  z-index: 10;

  /* Add padding on mobile for bottom nav */
  @media (max-width: 768px) {
    padding-bottom: calc(68px + env(safe-area-inset-bottom, 0));
  }

  &::-webkit-scrollbar {
    width: 4px;
  }

  &::-webkit-scrollbar-track {
    background: transparent;
  }

  &::-webkit-scrollbar-thumb {
    background: rgba(0, 0, 0, 0.2);
    border-radius: 2px;
  }

  &::-webkit-scrollbar-thumb:hover {
    background: rgba(0, 0, 0, 0.3);
  }
`;

const FriendItem = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: white;
  border-radius: 12px;
  margin-bottom: 0.5rem;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  }
`;

const Avatar = styled.div`
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: ${props => props.color || '#00a651'};
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  color: white;
  font-size: 1.1rem;
  position: relative;
  flex-shrink: 0;
`;

const OnlineIndicator = styled.div`
  position: absolute;
  bottom: 2px;
  right: 2px;
  width: 12px;
  height: 12px;
  background: #00a651;
  border: 2px solid white;
  border-radius: 50%;
`;

const FriendInfo = styled.div`
  flex: 1;
  min-width: 0;
`;

const FriendName = styled.h3`
  margin: 0;
  font-size: 15px;
  color: #333;
  font-weight: 500;
`;

const FriendStatus = styled.p`
  margin: 0.25rem 0 0 0;
  font-size: 13px;
  color: #666;
`;

const ActionButton = styled.button`
  padding: 0.5rem 1rem;
  background: #00a651;
  color: white;
  border: none;
  border-radius: 20px;
  cursor: pointer;
  font-size: 12px;
  font-weight: 500;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 0.25rem;

  &:hover {
    background: #008f47;
  }
`;

const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 200px;
  color: #666;
  text-align: center;
  padding: 2rem;
  
  svg {
    margin-bottom: 1rem;
    opacity: 0.5;
  }
  
  p {
    margin: 0.5rem 0;
    font-size: 14px;
  }
`;

const LoadingState = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  color: #666;
`;

const FriendsListComponent = ({ onClose, onStartChat }) => {
  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDarkMode] = useState(false);

  useEffect(() => {
    fetchFriends();
  }, []);

  // Handle socket events for status changes
  useEffect(() => {
    // This will be handled by the parent component (Chat.js)
    // The parent will update friends and pass them down as props
  }, []);

  const fetchFriends = async () => {
    setLoading(true);
    try {
      const response = await api.get('/users/friends');
      setFriends(response.data);
    } catch (error) {
      console.error('Error fetching friends:', error);
      setFriends([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredFriends = Array.isArray(friends) ? friends.filter(friend =>
    friend.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    friend.username?.toLowerCase().includes(searchTerm.toLowerCase())
  ) : [];

  const getAvatarColor = (name) => {
    const colors = ['#3498db', '#e74c3c', '#2ecc71', '#f39c12', '#9b59b6', '#1abc9c'];
    const index = name?.charCodeAt(0) % colors.length || 0;
    return colors[index];
  };

  const handleStartChat = (friend) => {
    onStartChat(friend);
  };

  return (
    <FriendsContainer theme={isDarkMode ? 'dark' : 'light'}>
      <Header>
        <BackButton onClick={onClose} title="Quay lại">
          <FiX size={20} />
        </BackButton>
        <Title>Danh sách bạn bè</Title>
      </Header>

      <SearchContainer>
        <SearchIcon>
          <FiSearch size={18} />
        </SearchIcon>
        <SearchInput
          type="text"
          placeholder="Tìm kiếm bạn bè..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </SearchContainer>

      <FriendsList>
        {loading ? (
          <LoadingState>
            <p>Đang tải danh sách bạn bè...</p>
          </LoadingState>
        ) : filteredFriends.length === 0 ? (
          <EmptyState>
            <FiUser size={48} />
            <p>Chưa có bạn bè nào</p>
            <p>Hãy tìm kiếm và kết bạn với mọi người</p>
          </EmptyState>
        ) : (
          filteredFriends.map((friend) => (
            <FriendItem key={friend.id} onClick={() => handleStartChat(friend)}>
              <Avatar color={getAvatarColor(friend.full_name || friend.username)}>
                {friend.avatar_url ? (
                  <img src={getAvatarURL(friend.avatar_url)} alt={friend.full_name} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                ) : (
                  getInitials(friend.full_name || friend.username)
                )}
                {friend.status === 'online' && <OnlineIndicator />}
              </Avatar>
              <FriendInfo>
                <FriendName>
                  {friend.full_name || friend.username}
                </FriendName>
                <FriendStatus>
                  {friend.status === 'online' ? 'Đang hoạt động' : 'Không hoạt động'}
                </FriendStatus>
              </FriendInfo>
              <ActionButton onClick={(e) => {
                e.stopPropagation();
                handleStartChat(friend);
              }}>
                <FiMessageCircle size={14} />
                Nhắn tin
              </ActionButton>
            </FriendItem>
          ))
        )}
      </FriendsList>
    </FriendsContainer>
  );
};

export default FriendsListComponent;
