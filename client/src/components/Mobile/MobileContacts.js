import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { friendsAPI } from '../../utils/api';
import { 
  FiPhone, 
  FiVideo, 
  FiUserPlus,
  FiGift,
  FiCheck,
  FiX,
  FiSearch,
  FiPlus
} from 'react-icons/fi';
import { BsQrCodeScan } from 'react-icons/bs';
import { getInitials } from '../../utils/nameUtils';
import { getAvatarURL, getUploadedImageURL } from '../../utils/imageUtils';

const ContactsContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: var(--bg-secondary, #f0f2f5);
  overflow: hidden;
  
  /* Add padding for mobile bottom nav */
  @media (max-width: 768px) {
    padding-bottom: calc(45px + env(safe-area-inset-bottom));
  }
`;

const Header = styled.div`
  background: var(--header-bg, #0084ff);
  padding: 8px 12px;
  display: flex;
  align-items: center;
  gap: 12px;
  
  /* Safe area for iPhone notch/Dynamic Island */
  @media (max-width: 768px) {
    padding-top: calc(8px + env(safe-area-inset-top, 0px));
    margin-top: calc(-1 * env(safe-area-inset-top, 0px));
  }
`;

const SearchContainer = styled.div`
  flex: 1;
  display: flex;
  align-items: center;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 20px;
  padding: 6px 12px;
  gap: 8px;

  input {
    flex: 1;
    border: none;
    background: none;
    outline: none;
    color: white;
    font-size: 14px;

    &::placeholder {
      color: rgba(255, 255, 255, 0.7);
    }
  }

  svg {
    color: rgba(255, 255, 255, 0.9);
    flex-shrink: 0;
  }
`;

const HeaderButton = styled.button`
  background: none;
  border: none;
  padding: 6px;
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: background 0.2s;

  &:active {
    background: rgba(255, 255, 255, 0.2);
    opacity: 0.7;
  }
`;

const Tabs = styled.div`
  display: flex;
  background: var(--bg-primary, white);
  border-bottom: 1px solid var(--border-color, #e4e6eb);
  position: sticky;
  top: 0;
  z-index: 10;
`;

const Tab = styled.button`
  flex: 1;
  padding: 12px 16px;
  border: none;
  background: none;
  color: ${props => props.active ? 'var(--primary-color, #0084ff)' : 'var(--text-secondary, #65676b)'};
  font-size: 15px;
  font-weight: 500;
  cursor: pointer;
  position: relative;
  border-bottom: 2px solid ${props => props.active ? 'var(--primary-color, #0084ff)' : 'transparent'};
  transition: all 0.2s;

  &:active {
    background: var(--bg-secondary, #f0f2f5);
    opacity: 0.7;
  }
`;

const Content = styled.div`
  flex: 1;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  background: var(--bg-secondary, #f0f2f5);
  
  /* Extra padding at bottom to avoid content being hidden */
  @media (max-width: 768px) {
    padding-bottom: 20px;
  }
`;

const Section = styled.div`
  background: var(--bg-primary, white);
  margin-bottom: 8px;
`;

const SectionHeader = styled.div`
  padding: 12px 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: ${props => props.highlight ? '#fff4e6' : 'var(--bg-primary, white)'};
  border-bottom: 1px solid var(--border-color, #e4e6eb);
`;

const SectionTitle = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 15px;
  font-weight: 500;
  color: var(--text-primary, #050505);
`;

const Badge = styled.span`
  background: #ff4444;
  color: white;
  font-size: 12px;
  font-weight: 600;
  padding: 2px 6px;
  border-radius: 10px;
  min-width: 18px;
  text-align: center;
`;

const SectionSubtitle = styled.p`
  margin: 4px 0 0 0;
  font-size: 13px;
  color: var(--text-secondary, #65676b);
`;

const Stats = styled.div`
  padding: 12px 16px;
  display: flex;
  align-items: center;
  gap: 24px;
  background: var(--bg-primary, white);
  border-bottom: 1px solid var(--border-color, #e4e6eb);
`;

const StatItem = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: var(--text-secondary, #65676b);

  strong {
    color: var(--text-primary, #050505);
    font-weight: 600;
  }
`;

const AlphabetDivider = styled.div`
  padding: 8px 16px;
  background: var(--bg-secondary, #f0f2f5);
  font-size: 14px;
  font-weight: 600;
  color: var(--primary-color, #0084ff);
  position: sticky;
  top: 0;
  z-index: 5;
`;

const ContactItem = styled.div`
  display: flex;
  align-items: center;
  padding: 12px 16px;
  background: var(--bg-primary, white);
  border-bottom: 1px solid var(--border-color, #e4e6eb);
  cursor: pointer;
  transition: background 0.2s;

  &:active {
    background: var(--bg-secondary, #f0f2f5);
  }
`;

const Avatar = styled.div`
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: ${props => props.color || '#0084ff'};
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  color: white;
  font-size: 18px;
  flex-shrink: 0;
  position: relative;
  margin-right: 12px;
`;

const OnlineIndicator = styled.div`
  position: absolute;
  bottom: 0;
  right: 0;
  width: 14px;
  height: 14px;
  background: #31a24c;
  border: 2px solid var(--bg-primary, white);
  border-radius: 50%;
`;

const ContactInfo = styled.div`
  flex: 1;
  min-width: 0;
`;

const ContactName = styled.h3`
  margin: 0;
  font-size: 16px;
  font-weight: 500;
  color: var(--text-primary, #050505);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const ContactStatus = styled.p`
  margin: 2px 0 0 0;
  font-size: 13px;
  color: var(--text-secondary, #65676b);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const ContactActions = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-left: 8px;
`;

const ActionButton = styled.button`
  background: none;
  border: none;
  padding: 8px;
  color: var(--text-secondary, #65676b);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: background 0.2s;

  &:active {
    background: var(--bg-secondary, #f0f2f5);
    opacity: 0.7;
  }
`;

const EmptyState = styled.div`
  padding: 60px 20px;
  text-align: center;
  color: var(--text-secondary, #65676b);

  h3 {
    margin: 0 0 8px 0;
    font-size: 18px;
    color: var(--text-primary, #050505);
  }

  p {
    margin: 0;
    font-size: 14px;
    color: var(--text-secondary, #65676b);
  }
`;

const getAvatarColor = (name) => {
  const colors = ['#0084ff', '#31a24c', '#f02849', '#ffc107', '#9c27b0', '#ff6b6b', '#4ecdc4', '#45b7d1'];
  const index = name ? name.charCodeAt(0) % colors.length : 0;
  return colors[index];
};

const MobileContacts = ({ onBack, onCall, onVideoCall, onAddFriend }) => {
  const [activeTab, setActiveTab] = useState('friends');
  const [searchQuery, setSearchQuery] = useState('');
  const [friends, setFriends] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [birthdays, setBirthdays] = useState([]);

  useEffect(() => {
    if (activeTab === 'friends') {
      loadFriends();
      loadPendingRequests(); // Always load pending requests to show badge
      loadBirthdays();
    } else if (activeTab === 'pending') {
      loadPendingRequests();
    }
  }, [activeTab]);

  const loadFriends = async () => {
    try {
      setLoading(true);
      const response = await friendsAPI.getFriends();
      setFriends(response.data || []);
    } catch (error) {
      console.error('Error loading friends:', error);
      setFriends([]);
    } finally {
      setLoading(false);
    }
  };

  const loadPendingRequests = async () => {
    try {
      setLoading(true);
      const response = await friendsAPI.getPendingRequests();
      setPendingRequests(response.data || []);
    } catch (error) {
      console.error('Error loading pending requests:', error);
      setPendingRequests([]);
    } finally {
      setLoading(false);
    }
  };

  const loadBirthdays = () => {
    // Mock data for birthdays - in real app, fetch from API
    const today = new Date();
    const mockBirthdays = friends.filter(friend => {
      // Check if friend has birthday today or in next 7 days
      return Math.random() > 0.9; // Mock: 10% chance
    });
    setBirthdays(mockBirthdays.slice(0, 3));
  };

  const groupFriendsByAlphabet = (friendsList) => {
    const grouped = {};
    friendsList.forEach(friend => {
      const firstLetter = (friend.full_name || 'Unknown')[0].toUpperCase();
      if (!grouped[firstLetter]) {
        grouped[firstLetter] = [];
      }
      grouped[firstLetter].push(friend);
    });
    return grouped;
  };

  const filteredFriends = searchQuery
    ? friends.filter(friend =>
        friend.full_name?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : friends;

  const groupedFriends = groupFriendsByAlphabet(filteredFriends);
  const recentlyActiveCount = Math.floor(friends.length * 0.16); // Mock: 16% recently active

  const handleCall = (friend, type) => {
    if (type === 'voice') {
      onCall?.(friend);
    } else if (type === 'video') {
      onVideoCall?.(friend);
    }
  };

  const handleAcceptRequest = async (friendId) => {
    try {
      await friendsAPI.acceptFriendRequest(friendId);
      loadPendingRequests();
      loadFriends();
    } catch (error) {
      console.error('Error accepting friend request:', error);
      alert('Có lỗi xảy ra khi chấp nhận lời mời kết bạn');
    }
  };

  const handleRejectRequest = async (friendId) => {
    try {
      await friendsAPI.rejectFriendRequest(friendId);
      loadPendingRequests();
    } catch (error) {
      console.error('Error rejecting friend request:', error);
      alert('Có lỗi xảy ra khi từ chối lời mời kết bạn');
    }
  };

  return (
    <ContactsContainer>
      <Header>
        <SearchContainer>
          <FiSearch size={18} />
          <input
            type="text"
            placeholder="Tìm kiếm"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </SearchContainer>
        <HeaderButton onClick={onAddFriend} title="Thêm bạn">
          <FiPlus size={20} />
        </HeaderButton>
        <HeaderButton title="Quét QR">
          <BsQrCodeScan size={20} />
        </HeaderButton>
      </Header>

      <Tabs>
        <Tab active={activeTab === 'friends'} onClick={() => setActiveTab('friends')}>
          Bạn bè
        </Tab>
        <Tab active={activeTab === 'groups'} onClick={() => setActiveTab('groups')}>
          Nhóm
        </Tab>
        <Tab active={activeTab === 'oa'} onClick={() => setActiveTab('oa')}>
          OA
        </Tab>
        {pendingRequests.length > 0 && (
          <Tab active={activeTab === 'pending'} onClick={() => setActiveTab('pending')}>
            Lời mời ({pendingRequests.length})
          </Tab>
        )}
      </Tabs>

      <Content>
        {activeTab === 'friends' && (
          <>
            {/* Friend Requests Section */}
            {pendingRequests.length > 0 && (
              <Section onClick={() => setActiveTab('pending')} style={{ cursor: 'pointer' }}>
                <SectionHeader>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '50%',
                      background: '#0084ff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <FiUserPlus size={18} color="white" />
                    </div>
                    <SectionTitle>
                      Lời mời kết bạn <Badge style={{ marginLeft: '4px' }}>{pendingRequests.length}</Badge>
                    </SectionTitle>
                  </div>
                </SectionHeader>
              </Section>
            )}

            {/* Birthdays Section */}
            {birthdays.length > 0 && (
              <Section>
                <SectionHeader highlight>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '50%',
                      background: '#ff6b6b',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <FiGift size={18} color="white" />
                    </div>
                    <div>
                      <SectionTitle>
                        Sinh nhật <span style={{ color: '#ff4444', fontSize: '18px', marginLeft: '4px' }}>•</span>
                      </SectionTitle>
                      <SectionSubtitle>
                        Hôm nay là sinh nhật của {birthdays[0]?.full_name || 'Như'}
                      </SectionSubtitle>
                    </div>
                  </div>
                </SectionHeader>
              </Section>
            )}

            {/* Stats Section */}
            <Stats>
              <StatItem>
                <strong>Tất cả</strong> {friends.length}
              </StatItem>
              <StatItem>
                <strong>Mới truy cập</strong> {recentlyActiveCount}
              </StatItem>
            </Stats>

            {/* Friends List */}
            <Section>
              {loading ? (
                <EmptyState>
                  <h3>Đang tải...</h3>
                </EmptyState>
              ) : filteredFriends.length === 0 ? (
                <EmptyState>
                  <h3>Không tìm thấy bạn bè</h3>
                  <p>{searchQuery ? 'Thử tìm kiếm với từ khóa khác' : 'Hãy thêm bạn bè để bắt đầu kết nối'}</p>
                </EmptyState>
              ) : (
                Object.keys(groupedFriends).sort().map(letter => (
                  <div key={letter}>
                    <AlphabetDivider>{letter}</AlphabetDivider>
                    {groupedFriends[letter].map(friend => (
                      <ContactItem key={friend.id}>
                        <Avatar color={getAvatarColor(friend.full_name)}>
                          {friend.avatar_url ? (
                            <img src={getAvatarURL(friend.avatar_url)} alt={friend.full_name} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                          ) : (
                            getInitials(friend.full_name)
                          )}
                          {friend.is_online && <OnlineIndicator />}
                        </Avatar>
                        <ContactInfo>
                          <ContactName>{friend.full_name || 'Người dùng'}</ContactName>
                          {friend.status_message && (
                            <ContactStatus>{friend.status_message}</ContactStatus>
                          )}
                        </ContactInfo>
                        <ContactActions>
                          <ActionButton
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCall(friend, 'voice');
                            }}
                            title="Gọi thoại"
                          >
                            <FiPhone size={20} />
                          </ActionButton>
                          <ActionButton
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCall(friend, 'video');
                            }}
                            title="Gọi video"
                          >
                            <FiVideo size={20} />
                          </ActionButton>
                        </ContactActions>
                      </ContactItem>
                    ))}
                  </div>
                ))
              )}
            </Section>
          </>
        )}

        {activeTab === 'pending' && (
          <Section>
            {loading ? (
              <EmptyState>
                <h3>Đang tải...</h3>
              </EmptyState>
            ) : pendingRequests.length === 0 ? (
              <EmptyState>
                <h3>Không có lời mời kết bạn</h3>
                <p>Lời mời kết bạn mới sẽ hiển thị ở đây</p>
              </EmptyState>
            ) : (
              pendingRequests.map(request => (
                <ContactItem key={request.id}>
                  <Avatar color={getAvatarColor(request.full_name)}>
                    {request.avatar_url ? (
                      <img src={getAvatarURL(request.avatar_url)} alt={request.full_name} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                    ) : (
                      getInitials(request.full_name)
                    )}
                  </Avatar>
                  <ContactInfo>
                    <ContactName>{request.full_name || 'Người dùng'}</ContactName>
                    {request.mutual_friends && (
                      <ContactStatus>{request.mutual_friends} bạn chung</ContactStatus>
                    )}
                  </ContactInfo>
                  <ContactActions>
                    <ActionButton
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAcceptRequest(request.id);
                      }}
                      title="Chấp nhận"
                      style={{ background: '#0084ff', color: 'white' }}
                    >
                      <FiCheck size={20} />
                    </ActionButton>
                    <ActionButton
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRejectRequest(request.id);
                      }}
                      title="Từ chối"
                      style={{ background: '#ff4444', color: 'white' }}
                    >
                      <FiX size={20} />
                    </ActionButton>
                  </ContactActions>
                </ContactItem>
              ))
            )}
          </Section>
        )}

        {activeTab === 'groups' && (
          <EmptyState>
            <h3>Nhóm</h3>
            <p>Danh sách nhóm của bạn sẽ hiển thị ở đây</p>
          </EmptyState>
        )}

        {activeTab === 'oa' && (
          <EmptyState>
            <h3>OA</h3>
            <p>Danh sách Official Account sẽ hiển thị ở đây</p>
          </EmptyState>
        )}
      </Content>
    </ContactsContainer>
  );
};

export default MobileContacts;

