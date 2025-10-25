import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { 
  FiArrowLeft,
  FiMessageCircle, 
  FiPhone, 
  FiUserPlus,
  FiChevronRight,
  FiUserCheck,
  FiCheck,
  FiUserMinus,
  FiMoreHorizontal
} from 'react-icons/fi';
import { friendsAPI } from '../../utils/api';
import { getInitials } from '../../utils/nameUtils';
import { getAvatarURL } from '../../utils/imageUtils';

const PageContainer = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 9999;
  background: var(--bg-primary, white);
  display: flex;
  flex-direction: column;
  animation: slideInFromRight 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
  transition: background-color 0.3s ease;

  @keyframes slideInFromRight {
    from { 
      transform: translateX(100%);
      opacity: 0.8;
    }
    to { 
      transform: translateX(0);
      opacity: 1;
    }
  }

  /* Tablet and larger */
  @media (min-width: 769px) {
    max-width: clamp(380px, 40vw, 480px);
    right: auto;
    box-shadow: -4px 0 20px var(--shadow-color, rgba(0, 0, 0, 0.1));
  }

  /* Small mobile devices */
  @media (max-width: 360px) {
    font-size: 14px;
  }
`;

const TopBar = styled.div`
  background: transparent;
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  padding: clamp(12px, 3vw, 16px);
  padding-top: calc(var(--safe-area-inset-top, env(safe-area-inset-top, 0px)) + clamp(12px, 3vw, 16px));
  display: flex;
  align-items: center;
  justify-content: space-between;
  z-index: 10;
  gap: clamp(8px, 2vw, 12px);

  @media (max-width: 360px) {
    padding: 10px;
    padding-top: calc(var(--safe-area-inset-top, env(safe-area-inset-top, 0px)) + 10px);
  }
`;

const TopBarButton = styled.button`
  background: rgba(0, 0, 0, 0.3);
  border: none;
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: clamp(8px, 2vw, 10px);
  border-radius: 50%;
  transition: all 0.2s ease;
  min-width: clamp(40px, 10vw, 48px);
  min-height: clamp(40px, 10vw, 48px);
  -webkit-tap-highlight-color: transparent;
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);

  /* Dark theme adjustments */
  :root[data-theme="dark"] & {
    background: rgba(255, 255, 255, 0.15);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  }

  svg {
    width: clamp(20px, 5vw, 24px);
    height: clamp(20px, 5vw, 24px);
  }

  &:active {
    background: rgba(0, 0, 0, 0.5);
    transform: scale(0.95);

    :root[data-theme="dark"] & {
      background: rgba(255, 255, 255, 0.25);
    }
  }

  @media (max-width: 360px) {
    min-width: 36px;
    min-height: 36px;
    padding: 6px;
  }
`;

const Header = styled.div`
  position: relative;
  background: var(--primary-gradient, linear-gradient(135deg, #0084ff 0%, #00a651 100%));
  padding: clamp(16px, 4vw, 20px);
  padding-top: calc(var(--safe-area-inset-top, env(safe-area-inset-top, 0px)) + clamp(60px, 15vw, 70px));
  padding-bottom: clamp(50px, 12.5vw, 60px);
  text-align: center;
  color: white;
  flex-shrink: 0;
  transition: background 0.3s ease;

  @media (max-width: 360px) {
    padding: 12px;
    padding-top: calc(var(--safe-area-inset-top, env(safe-area-inset-top, 0px)) + 56px);
    padding-bottom: 45px;
  }
`;

const ProfileInfo = styled.div`
  position: relative;
  background: var(--bg-primary, white);
  margin: 0 clamp(8px, 2vw, 12px);
  margin-top: clamp(-48px, -12vw, -52px);
  padding: clamp(56px, 14vw, 66px) clamp(16px, 4vw, 20px) clamp(16px, 4vw, 20px);
  border-radius: clamp(12px, 3vw, 16px);
  box-shadow: 0 1px 3px var(--shadow-color, rgba(0, 0, 0, 0.1));
  text-align: center;
  transition: background-color 0.3s ease, box-shadow 0.3s ease;

  @media (max-width: 360px) {
    margin: 0 8px;
    margin-top: -42px;
    padding: 48px 12px 12px;
    border-radius: 10px;
  }
`;

const AvatarContainer = styled.div`
  position: absolute;
  top: clamp(-43px, -10.75vw, -50px);
  left: 50%;
  transform: translateX(-50%);
  z-index: 10;

  @media (max-width: 360px) {
    top: -38px;
  }
`;

const Avatar = styled.div`
  width: clamp(90px, 22.5vw, 110px);
  height: clamp(90px, 22.5vw, 110px);
  border-radius: 50%;
  background: ${props => props.color || '#0084ff'};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: clamp(2rem, 5vw, 2.5rem);
  color: white;
  font-weight: 700;
  border: 4px solid white;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  overflow: hidden;
  transition: transform 0.2s ease;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  @media (max-width: 360px) {
    width: 80px;
    height: 80px;
    font-size: 1.75rem;
    border-width: 3px;
  }
`;

const UserName = styled.h2`
  margin: 0 0 clamp(6px, 1.5vw, 8px) 0;
  font-size: clamp(1.15rem, 5vw, 1.4rem);
  font-weight: 700;
  word-break: break-word;
  color: var(--text-primary, #000);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: clamp(6px, 1.5vw, 8px);
  transition: color 0.3s ease;

  @media (max-width: 360px) {
    font-size: 1.05rem;
    margin-bottom: 4px;
  }
`;

const VerifiedBadge = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: clamp(18px, 4.5vw, 22px);
  height: clamp(18px, 4.5vw, 22px);
  background: #0084ff;
  border-radius: 50%;
  color: white;
  font-size: clamp(10px, 2.5vw, 12px);
  flex-shrink: 0;

  @media (max-width: 360px) {
    width: 16px;
    height: 16px;
    font-size: 9px;
  }
`;

const UserDescription = styled.p`
  margin: 0;
  font-size: clamp(0.8rem, 3.5vw, 0.9rem);
  color: var(--text-secondary, #666);
  font-weight: 400;
  word-break: break-word;
  line-height: 1.4;
  transition: color 0.3s ease;

  @media (max-width: 360px) {
    font-size: 0.75rem;
  }
`;

const ActionButtonsRow = styled.div`
  display: flex;
  gap: clamp(8px, 2vw, 12px);
  padding-top: clamp(16px, 4vw, 20px);
  margin-top: clamp(16px, 4vw, 20px);
  border-top: 1px solid var(--border-color, #e8e8e8);
  justify-content: space-evenly;
  transition: border-color 0.3s ease;

  @media (max-width: 360px) {
    padding-top: 14px;
    margin-top: 14px;
    gap: 6px;
  }
`;

const ActionButton = styled.button`
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: clamp(8px, 2vw, 10px);
  padding: clamp(12px, 3vw, 16px) clamp(8px, 2vw, 12px);
  background: transparent;
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;
  color: var(--text-primary, #333);
  -webkit-tap-highlight-color: transparent;
  min-width: 0;

  &:active {
    transform: scale(0.95);
    opacity: 0.7;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    
    &:active {
      transform: none;
    }
  }

  @media (max-width: 360px) {
    padding: 10px 6px;
    gap: 6px;
  }
`;

const ActionIconWrapper = styled.div`
  width: clamp(44px, 11vw, 52px);
  height: clamp(44px, 11vw, 52px);
  border-radius: 50%;
  background: #e7f3ff;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #0084ff;
  font-size: clamp(20px, 5vw, 24px);
  transition: all 0.2s ease;
  flex-shrink: 0;

  :root[data-theme="dark"] & {
    background: rgba(0, 132, 255, 0.15);
    color: #4da3ff;
  }

  svg {
    width: clamp(20px, 5vw, 24px);
    height: clamp(20px, 5vw, 24px);
  }

  @media (max-width: 360px) {
    width: 40px;
    height: 40px;
    font-size: 18px;
  }
`;

const ActionLabel = styled.span`
  font-size: clamp(0.75rem, 3vw, 0.85rem);
  font-weight: 500;
  color: var(--text-primary, #333);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
  transition: color 0.3s ease;
  text-align: center;

  @media (max-width: 360px) {
    font-size: 0.7rem;
  }
`;

const Content = styled.div`
  flex: 1;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  background: #f0f2f5;
  overscroll-behavior: contain;
  transition: background-color 0.3s ease;
  padding-top: 0;
  padding-bottom: calc(var(--safe-area-inset-bottom, env(safe-area-inset-bottom, 0px)) + clamp(16px, 4vw, 20px));

  :root[data-theme="dark"] & {
    background: #1a1a1c;
  }

  &::-webkit-scrollbar {
    width: 4px;
  }

  &::-webkit-scrollbar-track {
    background: transparent;
  }

  &::-webkit-scrollbar-thumb {
    background: var(--text-tertiary, #c1c1c1);
    border-radius: 2px;
  }

  @media (max-width: 360px) {
    padding-bottom: calc(var(--safe-area-inset-bottom, env(safe-area-inset-bottom, 0px)) + 12px);
  }
`;

const Section = styled.div`
  padding: clamp(14px, 3.5vw, 18px);
  background: var(--bg-primary, white);
  margin: clamp(8px, 2vw, 12px) clamp(8px, 2vw, 12px);
  border-radius: clamp(12px, 3vw, 16px);
  box-shadow: 0 1px 3px var(--shadow-color, rgba(0, 0, 0, 0.1));
  transition: background-color 0.3s ease, box-shadow 0.3s ease;

  @media (max-width: 360px) {
    padding: 12px;
    margin: 6px 8px;
    border-radius: 10px;
  }
`;

const HighlightSection = styled(Section)`
  background: ${props => props.highlight ? '#fffbf0' : 'var(--bg-primary, white)'};
  
  :root[data-theme="dark"] & {
    background: ${props => props.highlight ? 'rgba(255, 193, 7, 0.1)' : 'var(--bg-primary, #1c1c1e)'};
  }
`;

const SectionHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: clamp(10px, 2.5vw, 12px);

  @media (max-width: 360px) {
    margin-bottom: 8px;
  }
`;

const SectionTitle = styled.h3`
  margin: 0;
  font-size: clamp(0.85rem, 3.5vw, 0.95rem);
  font-weight: 600;
  color: var(--text-primary, #333);
  transition: color 0.3s ease;

  @media (max-width: 360px) {
    font-size: 0.8rem;
  }
`;

const SeeMoreButton = styled.button`
  background: none;
  border: none;
  color: var(--primary-color, #0084ff);
  font-size: clamp(0.7rem, 2.75vw, 0.8rem);
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  -webkit-tap-highlight-color: transparent;
  transition: color 0.3s ease, opacity 0.2s ease;

  svg {
    width: clamp(12px, 3vw, 14px);
    height: clamp(12px, 3vw, 14px);
  }

  &:active {
    opacity: 0.7;
  }

  @media (max-width: 360px) {
    font-size: 0.65rem;
    padding: 3px 6px;
  }
`;

const PhotoGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: clamp(4px, 1vw, 6px);

  @media (max-width: 360px) {
    gap: 3px;
  }
`;

const PhotoItem = styled.div`
  aspect-ratio: 1;
  background: var(--bg-tertiary, #e0e0e0);
  border-radius: clamp(6px, 1.5vw, 8px);
  overflow: hidden;
  cursor: pointer;
  transition: all 0.2s ease;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 0.2s ease;
  }

  &:active {
    transform: scale(0.95);

    img {
      transform: scale(1.05);
    }
  }
`;

const FriendSuggestionsList = styled.div`
  display: flex;
  gap: clamp(10px, 2.5vw, 12px);
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  overscroll-behavior-x: contain;
  scroll-snap-type: x proximity;
  padding-bottom: clamp(8px, 2vw, 10px);

  &::-webkit-scrollbar {
    display: none;
  }

  @media (max-width: 360px) {
    gap: 8px;
    padding-bottom: 6px;
  }
`;

const FriendSuggestionCard = styled.div`
  flex-shrink: 0;
  width: clamp(110px, 28vw, 130px);
  background: var(--bg-primary, white);
  border: 1px solid var(--border-color, #e0e0e0);
  border-radius: clamp(10px, 2.5vw, 12px);
  padding: clamp(10px, 2.5vw, 12px);
  text-align: center;
  cursor: pointer;
  transition: all 0.2s ease;
  scroll-snap-align: start;

  &:active {
    transform: scale(0.97);
    background: var(--bg-secondary, #f8f9fa);
  }

  @media (max-width: 360px) {
    width: 100px;
    padding: 8px;
  }
`;

const FriendAvatar = styled.div`
  width: clamp(56px, 14vw, 66px);
  height: clamp(56px, 14vw, 66px);
  border-radius: 50%;
  background: ${props => props.color || '#0084ff'};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: clamp(1.15rem, 3.75vw, 1.35rem);
  color: white;
  font-weight: 600;
  margin: 0 auto clamp(8px, 2vw, 10px);
  overflow: hidden;
  border: 2px solid var(--bg-primary, white);
  box-shadow: 0 2px 8px var(--shadow-color, rgba(0, 0, 0, 0.1));

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  @media (max-width: 360px) {
    width: 50px;
    height: 50px;
    font-size: 1rem;
    margin-bottom: 6px;
    border-width: 1.5px;
  }
`;

const FriendName = styled.div`
  font-size: clamp(0.7rem, 2.75vw, 0.8rem);
  font-weight: 600;
  color: var(--text-primary, #333);
  margin-bottom: clamp(6px, 1.5vw, 8px);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  transition: color 0.3s ease;

  @media (max-width: 360px) {
    font-size: 0.65rem;
    margin-bottom: 5px;
  }
`;

const AddFriendButton = styled.button`
  width: 100%;
  padding: clamp(6px, 1.5vw, 8px);
  background: #e3f2fd;
  color: var(--primary-color, #0084ff);
  border: none;
  border-radius: clamp(5px, 1.25vw, 6px);
  font-size: clamp(0.65rem, 2.25vw, 0.7rem);
  font-weight: 600;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  transition: all 0.2s ease;

  &:active {
    background: #bbdefb;
    transform: scale(0.98);
  }

  @media (max-width: 360px) {
    font-size: 0.6rem;
    padding: 5px;
  }
`;

const EmptyState = styled.div`
  text-align: center;
  padding: clamp(20px, 5vw, 30px);
  color: var(--text-tertiary, #999);
  font-size: clamp(0.75rem, 3.25vw, 0.85rem);
  transition: color 0.3s ease;

  @media (max-width: 360px) {
    padding: 16px;
    font-size: 0.7rem;
  }
`;

const MobileUserProfile = ({ user, onClose, onStartChat, currentUserId }) => {
  const [friendshipStatus, setFriendshipStatus] = useState('none');
  const [isFollowing, setIsFollowing] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [mutualFriends, setMutualFriends] = useState([]);

  // Generate avatar color based on name
  const getAvatarColor = (name) => {
    if (!name) return '#0084ff';
    const colors = [
      '#0084ff', '#ff6b6b', '#4834d4', '#00d2d3',
      '#ff9ff3', '#feca57', '#48dbfb', '#ff6348',
      '#5f27cd', '#00d2d3'
    ];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  };

  useEffect(() => {
    if (user?.id && currentUserId && user.id !== currentUserId) {
      checkFriendshipStatus();
      fetchMutualFriends();
    }
  }, [user?.id, currentUserId]);

  const checkFriendshipStatus = async () => {
    try {
      const response = await friendsAPI.checkFriendshipStatus(user.id);
      setFriendshipStatus(response.data.friendship_status);
      setIsFollowing(response.data.isFollowing);
    } catch (error) {
      console.error('Error checking friendship status:', error);
      setFriendshipStatus('none');
      setIsFollowing(false);
    }
  };

  const fetchMutualFriends = async () => {
    try {
      const response = await friendsAPI.getMutualFriends(user.id);
      if (response.data && Array.isArray(response.data)) {
        setMutualFriends(response.data.slice(0, 5)); // Limit to 5 suggestions
      }
    } catch (error) {
      console.error('Error fetching mutual friends:', error);
      setMutualFriends([]);
    }
  };

  const handleSendFriendRequest = async () => {
    if (actionLoading) return;
    setActionLoading(true);
    try {
      const friendId = typeof user.id === 'string' ? parseInt(user.id) : user.id;
      await friendsAPI.sendFriendRequest(friendId);
      await checkFriendshipStatus();
    } catch (error) {
      console.error('Error sending friend request:', error);
      alert('Lỗi khi gửi yêu cầu kết bạn');
    } finally {
      setActionLoading(false);
    }
  };

  const handleAcceptFriendRequest = async () => {
    if (actionLoading) return;
    setActionLoading(true);
    try {
      const friendId = typeof user.id === 'string' ? parseInt(user.id) : user.id;
      await friendsAPI.acceptFriendRequest(friendId);
      await checkFriendshipStatus();
    } catch (error) {
      console.error('Error accepting friend request:', error);
      alert('Lỗi khi chấp nhận yêu cầu');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectFriendRequest = async () => {
    if (actionLoading) return;
    setActionLoading(true);
    try {
      const friendId = typeof user.id === 'string' ? parseInt(user.id) : user.id;
      await friendsAPI.rejectFriendRequest(friendId);
      await checkFriendshipStatus();
    } catch (error) {
      console.error('Error rejecting friend request:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleUnfriend = async () => {
    if (actionLoading) return;
    if (!window.confirm(`Bạn có chắc muốn hủy kết bạn với ${user.full_name || user.username}?`)) {
      return;
    }
    setActionLoading(true);
    try {
      const friendId = typeof user.id === 'string' ? parseInt(user.id) : user.id;
      await friendsAPI.unfriend(friendId);
      await checkFriendshipStatus();
    } catch (error) {
      console.error('Error unfriending:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleFollow = async () => {
    if (actionLoading) return;
    setActionLoading(true);
    try {
      const followingId = typeof user.id === 'string' ? parseInt(user.id) : user.id;
      await friendsAPI.follow(followingId);
      setIsFollowing(true);
    } catch (error) {
      console.error('Error following user:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleUnfollow = async () => {
    if (actionLoading) return;
    setActionLoading(true);
    try {
      const followingId = typeof user.id === 'string' ? parseInt(user.id) : user.id;
      await friendsAPI.unfollow(followingId);
      setIsFollowing(false);
    } catch (error) {
      console.error('Error unfollowing user:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleStartChat = () => {
    if (onStartChat) {
      onStartChat(user);
    }
    onClose();
  };

  const handlePhoneCall = () => {
    alert(`Tính năng gọi điện sẽ được phát triển trong tương lai`);
  };

  if (!user) return null;

  const userName = user.full_name || user.fullName || user.username || 'Người dùng';
  const userDescription = user.bio || 'Bạn chưa có mối quan hệ với người này';

  return (
    <PageContainer>
      <Header>
        <TopBar>
          <TopBarButton onClick={onClose}>
            <FiArrowLeft size={24} />
          </TopBarButton>
          <TopBarButton onClick={() => console.log('Show more options')}>
            <FiMoreHorizontal size={24} />
          </TopBarButton>
        </TopBar>
      </Header>

      <ProfileInfo>
        <AvatarContainer>
          <Avatar color={getAvatarColor(userName)}>
            {user.avatar_url ? (
              <img src={getAvatarURL(user.avatar_url)} alt={userName} />
            ) : (
              getInitials(userName)
            )}
          </Avatar>
        </AvatarContainer>
        
        <UserName>
          {userName}
          <VerifiedBadge>✓</VerifiedBadge>
        </UserName>
        <UserDescription>{userDescription}</UserDescription>

        <ActionButtonsRow>
          {/* Friends - Show 3 buttons */}
          {friendshipStatus === 'friend' && (
            <>
              <ActionButton onClick={handleStartChat}>
                <ActionIconWrapper>
                  <FiMessageCircle />
                </ActionIconWrapper>
                <ActionLabel>Nhắn tin</ActionLabel>
              </ActionButton>
              
              <ActionButton onClick={handlePhoneCall}>
                <ActionIconWrapper>
                  <FiPhone />
                </ActionIconWrapper>
                <ActionLabel>Gọi điện</ActionLabel>
              </ActionButton>
              
              <ActionButton onClick={handleUnfriend} disabled={actionLoading}>
                <ActionIconWrapper>
                  <FiUserCheck />
                </ActionIconWrapper>
                <ActionLabel>Bạn bè</ActionLabel>
              </ActionButton>
            </>
          )}

          {/* Not Friends - Show 3 buttons */}
          {friendshipStatus === 'none' && (
            <>
              <ActionButton onClick={handleStartChat}>
                <ActionIconWrapper>
                  <FiMessageCircle />
                </ActionIconWrapper>
                <ActionLabel>Nhắn tin</ActionLabel>
              </ActionButton>
              
              <ActionButton onClick={handlePhoneCall}>
                <ActionIconWrapper>
                  <FiPhone />
                </ActionIconWrapper>
                <ActionLabel>Gọi điện</ActionLabel>
              </ActionButton>
              
              <ActionButton 
                onClick={handleSendFriendRequest}
                disabled={actionLoading}
              >
                <ActionIconWrapper>
                  <FiUserPlus />
                </ActionIconWrapper>
                <ActionLabel>
                  {actionLoading ? 'Đang gửi...' : 'Kết bạn'}
                </ActionLabel>
              </ActionButton>
            </>
          )}

          {/* Pending Sent - Show 3 buttons */}
          {friendshipStatus === 'pending_sent' && (
            <>
              <ActionButton onClick={handleStartChat}>
                <ActionIconWrapper>
                  <FiMessageCircle />
                </ActionIconWrapper>
                <ActionLabel>Nhắn tin</ActionLabel>
              </ActionButton>
              
              <ActionButton onClick={handlePhoneCall}>
                <ActionIconWrapper>
                  <FiPhone />
                </ActionIconWrapper>
                <ActionLabel>Gọi điện</ActionLabel>
              </ActionButton>
              
              <ActionButton disabled>
                <ActionIconWrapper>
                  <FiCheck />
                </ActionIconWrapper>
                <ActionLabel>Đã gửi lời mời</ActionLabel>
              </ActionButton>
            </>
          )}

          {/* Pending Received - Show 3 buttons */}
          {friendshipStatus === 'pending_received' && (
            <>
              <ActionButton onClick={handleStartChat}>
                <ActionIconWrapper>
                  <FiMessageCircle />
                </ActionIconWrapper>
                <ActionLabel>Nhắn tin</ActionLabel>
              </ActionButton>
              
              <ActionButton 
                onClick={handleAcceptFriendRequest}
                disabled={actionLoading}
              >
                <ActionIconWrapper>
                  <FiCheck />
                </ActionIconWrapper>
                <ActionLabel>
                  {actionLoading ? 'Đang xử lý...' : 'Chấp nhận'}
                </ActionLabel>
              </ActionButton>
              
              <ActionButton 
                onClick={handleRejectFriendRequest}
                disabled={actionLoading}
              >
                <ActionIconWrapper>
                  <FiUserMinus />
                </ActionIconWrapper>
                <ActionLabel>Từ chối</ActionLabel>
              </ActionButton>
            </>
          )}
        </ActionButtonsRow>
      </ProfileInfo>

        <Content>
          {/* Photo Section */}
          <Section>
            <SectionHeader>
              <SectionTitle>Trang trí ảnh đại diện</SectionTitle>
              <SeeMoreButton>
                Xem thêm
                <FiChevronRight size={14} />
              </SeeMoreButton>
            </SectionHeader>
            {user.photos && user.photos.length > 0 ? (
              <PhotoGrid>
                {user.photos.slice(0, 6).map((photo, index) => (
                  <PhotoItem key={index}>
                    <img src={photo} alt={`Photo ${index + 1}`} />
                  </PhotoItem>
                ))}
              </PhotoGrid>
            ) : (
              <EmptyState>Chưa có ảnh nào</EmptyState>
            )}
          </Section>

          {/* Mutual Friends / Friend Suggestions */}
          <HighlightSection highlight>
            <SectionHeader>
              <SectionTitle>🤝 Kết bạn mẫu, làm quen nhau</SectionTitle>
              <SeeMoreButton>
                Xem thêm
                <FiChevronRight size={14} />
              </SeeMoreButton>
            </SectionHeader>
            {mutualFriends.length > 0 ? (
              <FriendSuggestionsList>
                {mutualFriends.map((friend) => (
                  <FriendSuggestionCard key={friend.id}>
                    <FriendAvatar color={getAvatarColor(friend.full_name || friend.username)}>
                      {friend.avatar_url ? (
                        <img src={getAvatarURL(friend.avatar_url)} alt={friend.full_name} />
                      ) : (
                        getInitials(friend.full_name || friend.username)
                      )}
                    </FriendAvatar>
                    <FriendName>{friend.full_name || friend.username}</FriendName>
                    <AddFriendButton onClick={() => console.log('Add friend:', friend.id)}>
                      Kết bạn
                    </AddFriendButton>
                  </FriendSuggestionCard>
                ))}
              </FriendSuggestionsList>
            ) : (
              <EmptyState>Không có gợi ý bạn bè</EmptyState>
            )}
          </HighlightSection>
        </Content>
    </PageContainer>
  );
};

export default MobileUserProfile;

