import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { FiSearch, FiX, FiUser, FiArrowLeft } from 'react-icons/fi';
import api from '../../utils/api';
import { getInitials } from '../../utils/nameUtils';

const SearchContainer = styled.div`
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
  background: #0068ff;
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

const SearchInputContainer = styled.div`
  padding: 1rem;
  position: relative;
  z-index: 10;
`;

const SearchTypeTabs = styled.div`
  display: flex;
  margin-bottom: 1rem;
  background: white;
  border-radius: 8px;
  padding: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
`;

const SearchTypeTab = styled.button`
  flex: 1;
  padding: 0.5rem 1rem;
  border: none;
  background: ${props => props.active ? '#0068ff' : 'transparent'};
  color: ${props => props.active ? 'white' : '#666'};
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s ease;

  &:hover {
    background: ${props => props.active ? '#0056cc' : '#f5f5f5'};
  }
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
    border-color: #0068ff;
    box-shadow: 0 2px 12px rgba(0, 104, 255, 0.2);
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

const UsersList = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 0 1rem 1rem;
  position: relative;
  z-index: 10;

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

const UserItem = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: white;
  border-radius: 12px;
  margin-bottom: 0.5rem;
  transition: all 0.2s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  }
`;

const UserInfo = styled.div`
  flex: 1;
  min-width: 0;
  cursor: pointer;
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 0.5rem;
`;

const ActionButton = styled.button`
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 20px;
  cursor: pointer;
  font-size: 12px;
  font-weight: 500;
  transition: all 0.2s ease;
  white-space: nowrap;

  &.primary {
    background: #0068ff;
    color: white;
    
    &:hover {
      background: #0056cc;
    }
  }

  &.secondary {
    background: #f0f0f0;
    color: #666;
    
    &:hover {
      background: #e0e0e0;
    }
  }

  &:disabled {
    background: #f5f5f5;
    color: #ccc;
    cursor: not-allowed;
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

const UserName = styled.h3`
  margin: 0;
  font-size: 15px;
  color: #333;
  font-weight: 500;
`;

const UserStatus = styled.p`
  margin: 0.25rem 0 0 0;
  font-size: 13px;
  color: #666;
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

const UserSearch = ({ onUserSelect, onClose }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isDarkMode] = useState(false); // You can get this from ThemeContext if needed
  const [searchType, setSearchType] = useState('all'); // all, email, username
  const [friendRequests, setFriendRequests] = useState(new Set());
  const [sendingRequests, setSendingRequests] = useState(new Set());

  useEffect(() => {
    if (searchTerm.trim()) {
      searchUsers();
    } else {
      setUsers([]);
    }
  }, [searchTerm, searchType]);

  // Handle socket events for status changes
  useEffect(() => {
    // This will be handled by the parent component (Chat.js)
    // The parent will update users and pass them down as props
  }, []);

  const searchUsers = async () => {
    setLoading(true);
    try {
      let response;
      if (searchType === 'email') {
        response = await api.get(`/users/search/email?email=${encodeURIComponent(searchTerm)}`);
      } else if (searchType === 'username') {
        response = await api.get(`/users/search/username?username=${encodeURIComponent(searchTerm)}`);
      } else {
        response = await api.get(`/users/search?q=${encodeURIComponent(searchTerm)}`);
      }
      setUsers(response.data);
    } catch (error) {
      console.error('Error searching users:', error);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleUserSelect = (user) => {
    onUserSelect(user);
  };

  const handleSendFriendRequest = async (userId) => {
    setSendingRequests(prev => new Set([...prev, userId]));
    try {
      await api.post('/users/friends/request', { friendId: userId });
      setFriendRequests(prev => new Set([...prev, userId]));
      // Show success message
      alert('Đã gửi lời mời kết bạn!');
    } catch (error) {
      console.error('Error sending friend request:', error);
      if (error.response?.status === 400) {
        alert('Lời mời kết bạn đã được gửi trước đó!');
      } else {
        alert('Có lỗi xảy ra khi gửi lời mời kết bạn!');
      }
    } finally {
      setSendingRequests(prev => {
        const newSet = new Set(prev);
        newSet.delete(userId);
        return newSet;
      });
    }
  };

  const getAvatarColor = (name) => {
    const colors = ['#3498db', '#e74c3c', '#2ecc71', '#f39c12', '#9b59b6', '#1abc9c'];
    const index = name?.charCodeAt(0) % colors.length || 0;
    return colors[index];
  };

  return (
    <SearchContainer theme={isDarkMode ? 'dark' : 'light'}>
      <Header>
        <BackButton onClick={onClose} title="Quay lại">
          <FiArrowLeft size={20} />
        </BackButton>
        <Title>Tìm kiếm người dùng</Title>
      </Header>

      <SearchInputContainer>
        <SearchTypeTabs>
          <SearchTypeTab 
            active={searchType === 'all'} 
            onClick={() => setSearchType('all')}
          >
            Tất cả
          </SearchTypeTab>
          <SearchTypeTab 
            active={searchType === 'email'} 
            onClick={() => setSearchType('email')}
          >
            Email
          </SearchTypeTab>
          <SearchTypeTab 
            active={searchType === 'username'} 
            onClick={() => setSearchType('username')}
          >
            Username
          </SearchTypeTab>
        </SearchTypeTabs>
        
        <SearchIcon>
          <FiSearch size={18} />
        </SearchIcon>
        <SearchInput
          type="text"
          placeholder={
            searchType === 'email' 
              ? "Nhập email để tìm kiếm..." 
              : searchType === 'username'
              ? "Nhập username để tìm kiếm..."
              : "Nhập tên, username hoặc email để tìm kiếm..."
          }
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </SearchInputContainer>

      <UsersList>
        {loading ? (
          <LoadingState>
            <p>Đang tìm kiếm...</p>
          </LoadingState>
        ) : users.length === 0 && searchTerm ? (
          <EmptyState>
            <FiUser size={48} />
            <p>Không tìm thấy người dùng nào</p>
            <p>Thử tìm kiếm với từ khóa khác</p>
          </EmptyState>
        ) : users.length === 0 ? (
          <EmptyState>
            <FiSearch size={48} />
            <p>Nhập tên người dùng để tìm kiếm</p>
            <p>Bắt đầu cuộc trò chuyện mới</p>
          </EmptyState>
        ) : (
          users.map((user) => (
            <UserItem key={user.id}>
              <Avatar color={getAvatarColor(user.full_name || user.username)}>
                {user.avatar_url ? (
                  <img src={user.avatar_url} alt={user.full_name} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                ) : (
                  getInitials(user.full_name || user.username)
                )}
                {user.status === 'online' && <OnlineIndicator />}
              </Avatar>
              <UserInfo onClick={() => handleUserSelect(user)}>
                <UserName>
                  {user.full_name || user.username}
                </UserName>
                <UserStatus>
                  {user.status === 'online' ? 'Đang hoạt động' : 'Không hoạt động'}
                  {user.email && ` • ${user.email}`}
                </UserStatus>
              </UserInfo>
              <ActionButtons>
                <ActionButton
                  className="primary"
                  onClick={() => handleUserSelect(user)}
                >
                  Nhắn tin
                </ActionButton>
                <ActionButton
                  className="secondary"
                  onClick={() => handleSendFriendRequest(user.id)}
                  disabled={friendRequests.has(user.id) || sendingRequests.has(user.id)}
                >
                  {sendingRequests.has(user.id) 
                    ? 'Đang gửi...' 
                    : friendRequests.has(user.id) 
                    ? 'Đã gửi' 
                    : 'Kết bạn'
                  }
                </ActionButton>
              </ActionButtons>
            </UserItem>
          ))
        )}
      </UsersList>
    </SearchContainer>
  );
};

export default UserSearch;
