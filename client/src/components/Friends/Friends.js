import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { friendsAPI } from '../../utils/api';
import { FiSearch, FiUserPlus, FiCheck, FiX, FiUsers, FiUserMinus, FiUser, FiHeart } from 'react-icons/fi';
import { getInitials } from '../../utils/nameUtils';
import { getAvatarURL, getUploadedImageURL } from '../../utils/imageUtils';

const FriendsContainer = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: var(--bg-secondary, #f5f5f5);
  overflow-y: auto;
  z-index: 1000;
  
  /* Add padding for mobile bottom nav */
  @media (max-width: 768px) {
    padding-bottom: calc(45px + env(safe-area-inset-bottom));
  }
`;

const Header = styled.div`
  background: var(--header-bg, #0084ff);
  color: white;
  padding: 15px 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-shadow: 0 2px 4px var(--shadow-color, rgba(0,0,0,0.1));
  
  /* Safe area for iPhone notch/Dynamic Island */
  @media (max-width: 768px) {
    padding-top: calc(15px + env(safe-area-inset-top));
  }
`;

const BackButton = styled.button`
  background: none;
  border: none;
  color: white;
  font-size: 24px;
  cursor: pointer;
  padding: 5px;
  border-radius: 50%;
  transition: background-color 0.2s;

  &:hover {
    background-color: rgba(255,255,255,0.1);
  }

  &:active {
    opacity: 0.7;
  }
`;

const HeaderIconButton = styled.button`
  background: none;
  border: none;
  color: white;
  font-size: 22px;
  cursor: pointer;
  padding: 8px;
  border-radius: 50%;
  transition: background-color 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover {
    background-color: rgba(255,255,255,0.1);
  }

  &:active {
    opacity: 0.7;
  }
`;

const HeaderTitle = styled.h2`
  margin: 0;
  font-size: 20px;
  font-weight: 600;
`;

const Content = styled.div`
  flex: 1;
  padding: 20px;
  max-width: 800px;
  margin: 0 auto;
  width: 100%;
  
  /* Extra padding for mobile to avoid bottom nav overlap */
  @media (max-width: 768px) {
    padding-bottom: 20px;
  }
`;

const SearchSection = styled.div`
  background: var(--bg-primary, white);
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 20px;
  box-shadow: 0 2px 8px var(--shadow-color, rgba(0,0,0,0.1));
`;

const SearchInput = styled.input`
  width: 100%;
  padding: 12px 16px;
  border: 2px solid var(--border-color, #e1e5e9);
  border-radius: 25px;
  font-size: 16px;
  outline: none;
  transition: border-color 0.2s;
  background: var(--bg-primary, white);
  color: var(--text-primary, #000);

  &:focus {
    border-color: var(--primary-color, #0084ff);
  }

  &::placeholder {
    color: var(--text-tertiary, #999);
  }
`;

const SearchIcon = styled(FiSearch)`
  position: absolute;
  right: 16px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--text-secondary, #666);
`;

const SearchContainer = styled.div`
  position: relative;
  display: flex;
  align-items: center;
`;

const Tabs = styled.div`
  display: flex;
  background: var(--bg-primary, white);
  border-radius: 12px;
  padding: 4px;
  margin-bottom: 20px;
  box-shadow: 0 2px 8px var(--shadow-color, rgba(0,0,0,0.1));
`;

const Tab = styled.button`
  flex: 1;
  padding: 12px 16px;
  border: none;
  background: ${props => props.active ? 'var(--primary-color, #0084ff)' : 'transparent'};
  color: ${props => props.active ? 'white' : 'var(--text-secondary, #666)'};
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;

  &:hover {
    background: ${props => props.active ? 'var(--accent-color, #0073e6)' : 'var(--bg-secondary, #f0f0f0)'};
  }

  &:active {
    opacity: 0.8;
  }
`;

const UserList = styled.div`
  background: var(--bg-primary, white);
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 8px var(--shadow-color, rgba(0,0,0,0.1));
`;

const UserItem = styled.div`
  display: flex;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid var(--border-color, #f0f0f0);
  transition: background-color 0.2s;
  background: var(--bg-primary, white);

  &:hover {
    background-color: var(--bg-secondary, #f8f9fa);
  }

  &:active {
    background-color: var(--bg-tertiary, #f0f0f0);
  }

  &:last-child {
    border-bottom: none;
  }
`;

const UserAvatar = styled.div`
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background: ${props => props.color || '#0084ff'};
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 18px;
  margin-right: 12px;
`;

const UserInfo = styled.div`
  flex: 1;
`;

const UserName = styled.h3`
  margin: 0 0 4px 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary, #333);
`;

const UserStatus = styled.p`
  margin: 0;
  font-size: 14px;
  color: var(--text-secondary, #666);
`;

const ActionButton = styled.button`
  padding: 8px 16px;
  border: none;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 6px;

  ${props => {
    switch (props.variant) {
      case 'primary':
        return `
          background: var(--primary-color, #0084ff);
          color: white;
          &:hover { background: var(--accent-color, #0073e6); }
          &:active { opacity: 0.8; }
        `;
      case 'success':
        return `
          background: #28a745;
          color: white;
          &:hover { background: #218838; }
          &:active { opacity: 0.8; }
        `;
      case 'danger':
        return `
          background: #dc3545;
          color: white;
          &:hover { background: #c82333; }
          &:active { opacity: 0.8; }
        `;
      case 'secondary':
        return `
          background: var(--bg-tertiary, #6c757d);
          color: var(--text-primary, white);
          &:hover { background: var(--border-color, #5a6268); }
          &:active { opacity: 0.8; }
        `;
      default:
        return `
          background: var(--bg-secondary, #e9ecef);
          color: var(--text-primary, #495057);
          &:hover { background: var(--bg-tertiary, #dee2e6); }
          &:active { opacity: 0.8; }
        `;
    }
  }}
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 40px 20px;
  color: var(--text-secondary, #666);

  h3 {
    margin: 0 0 8px 0;
    font-size: 18px;
    color: var(--text-primary, #333);
  }

  p {
    margin: 0;
    font-size: 14px;
    color: var(--text-secondary, #666);
  }
`;

const getAvatarColor = (name) => {
  const colors = ['#0084ff', '#28a745', '#dc3545', '#ffc107', '#17a2b8', '#6f42c1', '#e83e8c', '#fd7e14'];
  const index = name ? name.charCodeAt(0) % colors.length : 0;
  return colors[index];
};

const Friends = ({ onBack }) => {
  const [activeTab, setActiveTab] = useState('friends');
  const [searchQuery, setSearchQuery] = useState('');
  const [friends, setFriends] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [following, setFollowing] = useState([]);
  const [followers, setFollowers] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    console.log('Active tab changed to:', activeTab);
    if (activeTab === 'friends') {
      loadFriends();
    } else if (activeTab === 'pending') {
      console.log('Loading pending requests...');
      loadPendingRequests();
    } else if (activeTab === 'following') {
      loadFollowing();
    } else if (activeTab === 'followers') {
      loadFollowers();
    }
  }, [activeTab]);

  useEffect(() => {
    if (searchQuery.length >= 2) {
      searchUsers();
    } else {
      setSearchResults([]);
    }
  }, [searchQuery]);

  const loadFriends = async () => {
    try {
      setLoading(true);
      const response = await friendsAPI.getFriends();
      setFriends(response.data);
    } catch (error) {
      console.error('Error loading friends:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadPendingRequests = async () => {
    try {
      setLoading(true);
      const response = await friendsAPI.getPendingRequests();
      console.log('Pending requests response:', response.data);
      setPendingRequests(response.data);
    } catch (error) {
      console.error('Error loading pending requests:', error);
      alert('Có lỗi xảy ra khi tải lời mời kết bạn: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const loadFollowing = async () => {
    try {
      setLoading(true);
      const response = await friendsAPI.getFollowing();
      setFollowing(response.data);
    } catch (error) {
      console.error('Error loading following:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadFollowers = async () => {
    try {
      setLoading(true);
      const response = await friendsAPI.getFollowers();
      setFollowers(response.data);
    } catch (error) {
      console.error('Error loading followers:', error);
    } finally {
      setLoading(false);
    }
  };

  const searchUsers = async () => {
    try {
      const response = await friendsAPI.searchUsers(searchQuery);
      setSearchResults(response.data);
    } catch (error) {
      console.error('Error searching users:', error);
    }
  };

  const handleSendFriendRequest = async (friendId) => {
    try {
      await friendsAPI.sendFriendRequest(friendId);
      // Refresh search results
      searchUsers();
    } catch (error) {
      console.error('Error sending friend request:', error);
    }
  };

  const handleAcceptRequest = async (friendId) => {
    try {
      setLoading(true);
      await friendsAPI.acceptFriendRequest(friendId);
      alert('Đã chấp nhận lời mời kết bạn!');
      loadPendingRequests();
      loadFriends();
    } catch (error) {
      console.error('Error accepting friend request:', error);
      alert('Có lỗi xảy ra khi chấp nhận lời mời kết bạn: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const handleRejectRequest = async (friendId) => {
    try {
      setLoading(true);
      await friendsAPI.rejectFriendRequest(friendId);
      alert('Đã từ chối lời mời kết bạn!');
      loadPendingRequests();
    } catch (error) {
      console.error('Error rejecting friend request:', error);
      alert('Có lỗi xảy ra khi từ chối lời mời kết bạn: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const handleUnfriend = async (friendId) => {
    try {
      await friendsAPI.unfriend(friendId);
      loadFriends();
    } catch (error) {
      console.error('Error unfriending:', error);
    }
  };

  const handleFollow = async (userId) => {
    try {
      await friendsAPI.follow(userId);
      // Refresh current tab data
      if (activeTab === 'following') {
        loadFollowing();
      } else if (activeTab === 'followers') {
        loadFollowers();
      }
      // Also refresh search results if searching
      if (searchQuery.length >= 2) {
        searchUsers();
      }
    } catch (error) {
      console.error('Error following user:', error);
    }
  };

  const handleUnfollow = async (userId) => {
    try {
      await friendsAPI.unfollow(userId);
      // Refresh current tab data
      if (activeTab === 'following') {
        loadFollowing();
      } else if (activeTab === 'followers') {
        loadFollowers();
      }
      // Also refresh search results if searching
      if (searchQuery.length >= 2) {
        searchUsers();
      }
    } catch (error) {
      console.error('Error unfollowing user:', error);
    }
  };

  const renderUserItem = (user, showActions = true) => {
    console.log('Rendering user:', user, 'showActions:', showActions);
    return (
      <UserItem key={user.id}>
        <UserAvatar color={getAvatarColor(user.full_name)}>
          {user.avatar_url ? (
            <img src={getAvatarURL(user.avatar_url)} alt={user.full_name} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
          ) : (
            getInitials(user.full_name)
          )}
        </UserAvatar>
        <UserInfo>
          <UserName>{user.full_name || 'Người dùng'}</UserName>
          <UserStatus>
            {user.status === 'online' ? 'Đang hoạt động' : 'Không hoạt động'}
          </UserStatus>
        </UserInfo>
        {showActions && (
          <div style={{ display: 'flex', gap: '8px' }}>
            {user.friendship_status === 'none' && (
              <ActionButton
                variant="primary"
                onClick={() => handleSendFriendRequest(user.id)}
              >
                <FiUserPlus size={16} />
                Kết bạn
              </ActionButton>
            )}
            {user.friendship_status === 'request_sent' && (
              <ActionButton variant="secondary" disabled>
                Đã gửi
              </ActionButton>
            )}
            {user.friendship_status === 'request_received' && (
              <>
                <ActionButton
                  variant="success"
                  onClick={() => handleAcceptRequest(user.id)}
                >
                  <FiCheck size={16} />
                  Chấp nhận
                </ActionButton>
                <ActionButton
                  variant="danger"
                  onClick={() => handleRejectRequest(user.id)}
                >
                  <FiX size={16} />
                  Từ chối
                </ActionButton>
              </>
            )}
            {user.friendship_status === 'friend' && (
              <ActionButton
                variant="danger"
                onClick={() => handleUnfriend(user.id)}
              >
                <FiUserMinus size={16} />
                Hủy kết bạn
              </ActionButton>
            )}
            {user.friendship_status === 'none' && !user.isFollowing && (
              <ActionButton
                variant="primary"
                onClick={() => handleFollow(user.id)}
              >
                <FiHeart size={16} />
                Theo dõi
              </ActionButton>
            )}
            {user.isFollowing && (
              <ActionButton
                variant="secondary"
                onClick={() => handleUnfollow(user.id)}
              >
                <FiHeart size={16} />
                Đang theo dõi
              </ActionButton>
            )}
          </div>
        )}
      </UserItem>
    );
  };

  const handleAddFriend = () => {
    // Focus vào ô search để người dùng tìm kiếm bạn bè
    const searchInput = document.querySelector('input[type="text"]');
    if (searchInput) {
      searchInput.focus();
    }
  };

  return (
    <FriendsContainer>
      <Header>
        <BackButton onClick={onBack} title="Quay lại">
          ←
        </BackButton>
        <HeaderTitle>Bạn bè</HeaderTitle>
        <HeaderIconButton onClick={handleAddFriend} title="Kết bạn">
          <FiUserPlus size={22} />
        </HeaderIconButton>
      </Header>

      <Content>
        <SearchSection>
          <SearchContainer>
            <SearchInput
              type="text"
              placeholder="Tìm kiếm bạn bè..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <SearchIcon size={20} />
          </SearchContainer>
        </SearchSection>

        <Tabs>
          <Tab
            active={activeTab === 'friends'}
            onClick={() => setActiveTab('friends')}
          >
            <FiUsers size={18} />
            Bạn bè ({friends.length})
          </Tab>
          <Tab
            active={activeTab === 'pending'}
            onClick={() => setActiveTab('pending')}
          >
            <FiUserPlus size={18} />
            Lời mời ({pendingRequests.length})
          </Tab>
          <Tab
            active={activeTab === 'following'}
            onClick={() => setActiveTab('following')}
          >
            <FiUser size={18} />
            Đang theo dõi
          </Tab>
          <Tab
            active={activeTab === 'followers'}
            onClick={() => setActiveTab('followers')}
          >
            <FiUsers size={18} />
            Người theo dõi
          </Tab>
        </Tabs>

        <UserList>
          {loading ? (
            <EmptyState>
              <h3>Đang tải...</h3>
            </EmptyState>
          ) : searchQuery.length >= 2 ? (
            searchResults.length > 0 ? (
              searchResults.map(user => renderUserItem(user, true))
            ) : (
              <EmptyState>
                <h3>Không tìm thấy người dùng</h3>
                <p>Thử tìm kiếm với từ khóa khác</p>
              </EmptyState>
            )
          ) : activeTab === 'friends' ? (
            friends.length > 0 ? (
              friends.map(friend => renderUserItem(friend, false))
            ) : (
              <EmptyState>
                <h3>Chưa có bạn bè</h3>
                <p>Hãy tìm kiếm và kết bạn với mọi người!</p>
              </EmptyState>
            )
          ) : activeTab === 'following' ? (
            following.length > 0 ? (
              following.map(user => renderUserItem(user, true))
            ) : (
              <EmptyState>
                <h3>Chưa theo dõi ai</h3>
                <p>Hãy tìm kiếm và theo dõi những người bạn quan tâm!</p>
              </EmptyState>
            )
          ) : activeTab === 'followers' ? (
            followers.length > 0 ? (
              followers.map(user => renderUserItem(user, true))
            ) : (
              <EmptyState>
                <h3>Chưa có người theo dõi</h3>
                <p>Người theo dõi bạn sẽ hiển thị ở đây</p>
              </EmptyState>
            )
          ) : (
            pendingRequests.length > 0 ? (
              pendingRequests.map(request => {
                console.log('Rendering pending request:', request);
                return renderUserItem(request, true);
              })
            ) : (
              <EmptyState>
                <h3>Không có lời mời kết bạn</h3>
                <p>Lời mời kết bạn mới sẽ hiển thị ở đây</p>
              </EmptyState>
            )
          )}
        </UserList>
      </Content>
    </FriendsContainer>
  );
};

export default Friends;
