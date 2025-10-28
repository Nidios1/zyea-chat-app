import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { 
  FiArrowLeft,
  FiSearch,
  FiMessageCircle, 
  FiMoreHorizontal,
  FiCheck,
  FiClock,
  FiUsers,
  FiMail,
  FiBriefcase,
  FiGitBranch,
  FiRadio,
  FiImage,
  FiUserPlus,
  FiUser,
  FiUserMinus,
  FiAlertTriangle,
  FiUserX,
  FiX
} from 'react-icons/fi';
import { friendsAPI } from '../../utils/api';
import { getInitials } from '../../utils/nameUtils';
import { getAvatarURL } from '../../utils/imageUtils';
import { useTheme } from '../../contexts/ThemeContext';

const PageContainer = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: var(--bg-primary, #000000);
  display: flex;
  flex-direction: column;
  z-index: 9999;
  animation: slideInFromRight 0.3s cubic-bezier(0.4, 0, 0.2, 1);
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

  @media (min-width: 769px) {
    max-width: 450px;
    right: auto;
    box-shadow: -4px 0 20px rgba(0, 0, 0, 0.1);
  }
`;

const Header = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  background: var(--bg-primary, rgba(255, 255, 255, 0.95));
  backdrop-filter: blur(10px);
  padding: 8px 12px;
  display: flex;
  align-items: center;
  gap: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  z-index: 100;
  height: 48px;
  transition: background-color 0.3s ease;
`;

const HeaderButton = styled.button`
  background: none;
  border: none;
  padding: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: var(--text-primary, #333);
  transition: color 0.3s ease;
  
  &:active {
    opacity: 0.7;
  }

  svg {
    width: 24px;
    height: 24px;
  }
`;

const HeaderTitle = styled.div`
  flex: 1;
  font-weight: 600;
  font-size: 16px;
  color: var(--text-primary, #333);
  text-align: left;
  padding-left: 8px;
  transition: color 0.3s ease;
`;

const ScrollContent = styled.div`
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding-top: 48px;
  -webkit-overflow-scrolling: touch;
  background: var(--bg-primary, #000000);
  transition: background-color 0.3s ease;
`;

const BannerContainer = styled.div`
  position: relative;
  width: 100%;
  height: 200px;
  overflow: hidden;
  background: linear-gradient(135deg, #ff9800 0%, #4caf50 100%);
  display: flex;
  align-items: center;
  justify-content: center;
`;

const BannerImage = styled.div`
  width: 100%;
  height: 100%;
  background: ${props => props.background || 'transparent'};
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
`;

const ProfileSection = styled.div`
  position: relative;
  padding: 60px 0 16px 0;
  background: var(--bg-primary, white);
  margin-bottom: 8px;
  transition: background-color 0.3s ease;
  
  @media (max-width: 480px) {
    padding: 50px 0 14px 0;
  }
`;

const AvatarContainer = styled.div`
  position: absolute;
  width: 100px;
  height: 100px;
  top: -50px;
  left: 16px;
  z-index: 10;
  display: flex;
  
  @media (max-width: 480px) {
    width: 90px;
    height: 90px;
    top: -45px;
    left: 12px;
  }
`;

const Avatar = styled.div`
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background: ${props => props.gradient || 'linear-gradient(135deg, #ff9800 0%, #ff5722 100%)'};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 36px;
  font-weight: 600;
  color: white;
  border: 4px solid var(--bg-primary, white);
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  transition: border-color 0.3s ease;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;

const UserName = styled.div`
  text-align: left;
  font-size: 24px;
  font-weight: 700;
  color: var(--text-primary, #1a1a1a);
  margin: 0 0 16px 16px;
  transition: color 0.3s ease;

  @media (max-width: 480px) {
    font-size: 22px;
    margin: 0 0 14px 12px;
  }
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 8px;
  margin: 0 16px 16px 16px;
  
  @media (max-width: 480px) {
    margin: 0 12px 12px 12px;
    gap: 6px;
  }
`;

const FollowButton = styled.button`
  flex: 1;
  padding: 10px 20px;
  border-radius: 8px;
  border: 2px solid #ff9800;
  background: ${props => props.following ? 'transparent' : '#ff9800'};
  color: ${props => props.following ? '#ff9800' : 'white'};
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  transition: all 0.2s;

  &:active {
    transform: scale(0.98);
    opacity: 0.9;
  }

  svg {
    width: 16px;
    height: 16px;
  }
`;

const IconButton = styled.button`
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: var(--bg-secondary, #f0f2f5);
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s, background-color 0.3s ease;
  color: var(--text-primary, #1c1e21);

  &:active {
    background: var(--bg-tertiary, #e4e6eb);
    transform: scale(0.95);
  }

  svg {
    width: 22px;
    height: 22px;
  }
`;

const InfoSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 0 16px;
  background: var(--bg-primary, white);
  margin-bottom: 8px;
  transition: background-color 0.3s ease;
`;

const InfoItem = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  color: var(--text-secondary, #666);
  font-size: 14px;
  padding: 8px 0;
  cursor: ${props => props.clickable ? 'pointer' : 'default'};
  transition: background 0.2s, color 0.3s ease;
  border-radius: 8px;
  
  &:active {
    background: ${props => props.clickable ? 'var(--bg-secondary, #f5f6f8)' : 'transparent'};
  }
`;

const InfoIcon = styled.div`
  width: 32px;
  height: 32px;
  background: var(--bg-secondary, #f5f6f8);
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-secondary, #666);
  flex-shrink: 0;
  transition: background-color 0.3s ease, color 0.3s ease;
  
  svg {
    width: 16px;
    height: 16px;
  }
`;

const InfoText = styled.div`
  flex: 1;
  font-size: 14px;
  color: var(--text-secondary, #666);
  transition: color 0.3s ease;
`;

const PostInputSection = styled.div`
  background: var(--bg-primary, white);
  margin: 0 0 8px 0;
  padding: 16px;
  border-radius: 0;
  display: flex;
  flex-direction: column;
  transition: background-color 0.3s ease;
`;

const PostInput = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  background: var(--bg-secondary, #f5f6f8);
  border-radius: 24px;
  padding: 10px 16px;
  margin-bottom: 12px;
  cursor: pointer;
  transition: background 0.2s, background-color 0.3s ease;

  &:active {
    background: var(--bg-tertiary, #e8e8e8);
  }
`;

const SmallAvatar = styled.div`
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: ${props => props.gradient || 'linear-gradient(135deg, #ff9800 0%, #ff5722 100%)'};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 600;
  color: white;
  overflow: hidden;
  flex-shrink: 0;
  border: 2px solid var(--bg-primary, white);
  transition: border-color 0.3s ease;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;

const PostInputText = styled.div`
  color: var(--text-tertiary, #999);
  font-size: 15px;
  flex: 1;
  transition: color 0.3s ease;
`;

const MediaButton = styled.button`
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  background: var(--bg-primary, white);
  border: 1.5px solid #4caf50;
  color: #4caf50;
  border-radius: 8px;
  padding: 10px 16px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s, background-color 0.3s ease;

  &:active {
    background: var(--bg-secondary, #f0f8f4);
    opacity: 0.9;
  }
  
  svg {
    width: 18px;
    height: 18px;
  }
`;

const EmptyPosts = styled.div`
  text-align: center;
  padding: 40px 20px;
  background: var(--bg-primary, white);
  margin-bottom: 8px;
  color: var(--text-tertiary, #999);
  transition: background-color 0.3s ease, color 0.3s ease;
`;

const EmptyPostsTitle = styled.div`
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 8px;
  color: var(--text-secondary, #666);
  transition: color 0.3s ease;
`;

const EmptyPostsMessage = styled.div`
  font-size: 14px;
  margin-bottom: 20px;
  color: var(--text-tertiary, #999);
  transition: color 0.3s ease;
`;

const BackToTopButton = styled.button`
  background: #ff9800;
  color: white;
  border: none;
  border-radius: 8px;
  padding: 12px 24px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  
  &:active {
    opacity: 0.85;
    transform: scale(0.98);
  }
`;

const PopupOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  z-index: 10000;
  display: flex;
  align-items: center;
  justify-content: center;
  animation: fadeIn 0.2s ease-out;
  
  @media (prefers-color-scheme: dark) {
    background: rgba(0, 0, 0, 0.75);
  }
  
  @keyframes fadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }
`;

const PopupMenu = styled.div`
  background: var(--bg-primary, white);
  border-radius: 12px;
  width: 90%;
  max-width: 320px;
  overflow: hidden;
  animation: slideUp 0.2s ease-out;
  transition: background-color 0.3s ease;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  
  @keyframes slideUp {
    from {
      transform: translateY(20px);
      opacity: 0;
    }
    to {
      transform: translateY(0);
      opacity: 1;
    }
  }
`;

const PopupHeader = styled.div`
  padding: 16px;
  border-bottom: 1px solid var(--border-color, #f0f0f0);
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: var(--bg-secondary, #fafafa);
  transition: background-color 0.3s ease, border-color 0.3s ease;
`;

const PopupHeaderText = styled.div`
  font-size: 14px;
  color: var(--text-secondary, #666);
  font-weight: 500;
  transition: color 0.3s ease;
`;

const PopupCloseButton = styled.button`
  background: none;
  border: none;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: var(--text-tertiary, #999);
  transition: color 0.2s;
  
  &:active {
    color: var(--text-primary, #333);
  }
  
  svg {
    width: 20px;
    height: 20px;
  }
`;

const PopupMenuItem = styled.div`
  padding: 16px;
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: ${props => props.disabled ? 'default' : 'pointer'};
  transition: background 0.2s, background-color 0.3s ease, opacity 0.2s;
  border-bottom: 1px solid var(--border-color, #f0f0f0);
  opacity: ${props => props.disabled ? 0.6 : 1};
  
  &:last-child {
    border-bottom: none;
  }
  
  &:active {
    background: ${props => props.disabled ? 'transparent' : 'var(--bg-secondary, #f5f5f5)'};
  }
  
  ${props => props.danger && !props.disabled && `
    color: #ef4444;
    
    svg {
      color: #ef4444;
    }
  `}
`;

const PopupMenuIcon = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  
  svg {
    width: 20px;
    height: 20px;
    color: var(--text-primary, #333);
    transition: color 0.3s ease;
  }
`;

const PopupMenuText = styled.div`
  flex: 1;
  font-size: 15px;
  font-weight: 500;
  color: ${props => props.color || 'var(--text-primary, #333)'};
  transition: color 0.3s ease;
`;

const MobileUserProfile = ({ user, onClose, onStartChat, currentUserId }) => {
  const [friendshipStatus, setFriendshipStatus] = useState('none');
  const [isFollowing, setIsFollowing] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [showPopupMenu, setShowPopupMenu] = useState(false);

  const getAvatarColor = (name) => {
    if (!name) return 'linear-gradient(135deg, #ff9800 0%, #ff5722 100%)';
    const colors = [
      'linear-gradient(135deg, #ff9800 0%, #ff5722 100%)',
      'linear-gradient(135deg, #2196f3 0%, #1976d2 100%)',
      'linear-gradient(135deg, #4caf50 0%, #2e7d32 100%)',
      'linear-gradient(135deg, #9c27b0 0%, #7b1fa2 100%)',
      'linear-gradient(135deg, #e91e63 0%, #c2185b 100%)',
    ];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  };

  useEffect(() => {
    if (user?.id && currentUserId && user.id !== currentUserId) {
      checkFriendshipStatus();
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

  const handleFollowToggle = async () => {
    if (actionLoading) return;
    setActionLoading(true);
    try {
      const followingId = typeof user.id === 'string' ? parseInt(user.id) : user.id;
      if (isFollowing) {
        await friendsAPI.unfollow(followingId);
        setIsFollowing(false);
      } else {
      await friendsAPI.follow(followingId);
      setIsFollowing(true);
      }
    } catch (error) {
      console.error('Error toggling follow:', error);
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

  const handleOpenPopupMenu = () => {
    setShowPopupMenu(true);
  };

  const handleClosePopupMenu = () => {
    setShowPopupMenu(false);
  };

  const handleAddFriend = async () => {
    if (actionLoading) return;
    setActionLoading(true);
    try {
      await friendsAPI.sendFriendRequest(user.id);
      setFriendshipStatus('pending_sent');
      handleClosePopupMenu();
    } catch (error) {
      console.error('Error sending friend request:', error);
      alert('Có lỗi xảy ra khi gửi lời mời kết bạn');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUnfriend = async () => {
    const name = user.full_name || user.fullName || user.username || 'Người dùng';
    if (window.confirm(`Bạn có chắc chắn muốn hủy kết bạn với ${name}?`)) {
      if (actionLoading) return;
      setActionLoading(true);
      try {
        await friendsAPI.unfriend(user.id);
        setFriendshipStatus('none');
        alert('Đã hủy kết bạn');
        handleClosePopupMenu();
      } catch (error) {
        console.error('Error unfriending user:', error);
        alert('Có lỗi xảy ra khi hủy kết bạn');
      } finally {
        setActionLoading(false);
      }
    } else {
      handleClosePopupMenu();
    }
  };

  const handleReport = () => {
    handleClosePopupMenu();
    alert('Tính năng báo cáo đang được phát triển');
  };

  const handleBlock = async () => {
    if (window.confirm(`Bạn có chắc chắn muốn chặn người dùng này?`)) {
      if (actionLoading) return;
      setActionLoading(true);
      try {
        await friendsAPI.block(user.id);
        alert('Đã chặn người dùng');
        handleClosePopupMenu();
        onClose();
      } catch (error) {
        console.error('Error blocking user:', error);
        alert('Có lỗi xảy ra khi chặn người dùng');
      } finally {
        setActionLoading(false);
      }
    } else {
      handleClosePopupMenu();
    }
  };

  if (!user) return null;

  const userName = user.full_name || user.fullName || user.username || 'Người dùng';
  const avatarColor = getAvatarColor(userName);

  const formatTime = () => {
    const now = new Date();
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const isMorning = hours < 12;
    const period = isMorning ? 'sáng' : now.getHours() < 18 ? 'chiều' : 'tối';
    return `${hours}:${minutes} ${period} Giờ địa phương`;
  };

  return (
    <PageContainer>
      <Header>
        <HeaderButton onClick={onClose}>
          <FiArrowLeft />
        </HeaderButton>
        <HeaderTitle>{userName}</HeaderTitle>
        <HeaderButton>
          <FiSearch />
        </HeaderButton>
      </Header>

      <ScrollContent>
        <BannerContainer>
          <BannerImage 
            background={user.cover_url ? `url(${getAvatarURL(user.cover_url)})` : ''}
            style={{
              backgroundImage: user.cover_url ? `url(${getAvatarURL(user.cover_url)})` : 'none',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat'
            }}
          />
        </BannerContainer>

        <ProfileSection>
        <AvatarContainer>
            <Avatar gradient={avatarColor}>
            {user.avatar_url ? (
              <img src={getAvatarURL(user.avatar_url)} alt={userName} />
            ) : (
              getInitials(userName)
            )}
          </Avatar>
        </AvatarContainer>
        
          <UserName>{userName}</UserName>

          <ActionButtons>
            {currentUserId && user.id !== currentUserId && (
              <>
                <FollowButton 
                  following={isFollowing}
                  onClick={handleFollowToggle}
                    disabled={actionLoading}
                  >
                  <FiCheck />
                  {isFollowing ? 'Đang theo dõi' : 'Theo dõi'}
                </FollowButton>
                <IconButton onClick={handleStartChat}>
                  <FiMessageCircle />
                </IconButton>
                <IconButton onClick={handleOpenPopupMenu}>
                  <FiMoreHorizontal />
                </IconButton>
              </>
            )}
          </ActionButtons>
        </ProfileSection>

        <InfoSection>
          <InfoItem clickable>
            <InfoIcon>
              <FiImage />
            </InfoIcon>
            <InfoText>File phương tiện</InfoText>
          </InfoItem>
          
          <InfoItem>
            <InfoIcon>
              <FiClock />
            </InfoIcon>
            <InfoText>{formatTime()}</InfoText>
          </InfoItem>
          
          {user.department && (
            <InfoItem>
              <InfoIcon>
                <FiBriefcase />
              </InfoIcon>
              <InfoText>{user.department}</InfoText>
            </InfoItem>
          )}
          
          {user.email && (
            <InfoItem>
              <InfoIcon>
                <FiMail />
              </InfoIcon>
              <InfoText>{user.email}</InfoText>
            </InfoItem>
          )}
          
          <InfoItem>
            <InfoIcon>
              <FiUsers />
            </InfoIcon>
            <InfoText>Có {user.followers?.length || 0} người theo dõi</InfoText>
          </InfoItem>
          
          <InfoItem>
            <InfoIcon>
              <FiGitBranch />
            </InfoIcon>
            <InfoText>Sơ đồ tổ chức</InfoText>
          </InfoItem>
        </InfoSection>

        {currentUserId && user.id === currentUserId && (
          <PostInputSection>
            <PostInput>
              <SmallAvatar gradient={avatarColor}>
                {user.avatar_url ? (
                  <img src={getAvatarURL(user.avatar_url)} alt={userName} />
                ) : (
                  getInitials(userName)
                )}
              </SmallAvatar>
              <PostInputText>Bạn đang nghĩ gì?</PostInputText>
            </PostInput>
            <MediaButton>
              <FiImage />
              <span>Hình ảnh / Video</span>
            </MediaButton>
          </PostInputSection>
        )}

        <EmptyPosts>
          <EmptyPostsTitle>Đã xem hết các bài viết</EmptyPostsTitle>
          <EmptyPostsMessage>
            Bạn đã xem hết các bài viết hiện có. Tải lại trang để khám phá thêm!
          </EmptyPostsMessage>
          <BackToTopButton onClick={() => onClose()}>
            Quay lại
          </BackToTopButton>
        </EmptyPosts>
      </ScrollContent>

      {/* Popup Menu */}
      {showPopupMenu && currentUserId && user.id !== currentUserId && (
        <PopupOverlay onClick={handleClosePopupMenu}>
          <PopupMenu onClick={(e) => e.stopPropagation()}>
            <PopupHeader>
              <PopupHeaderText>Tùy chọn</PopupHeaderText>
              <PopupCloseButton onClick={handleClosePopupMenu}>
                <FiX />
              </PopupCloseButton>
            </PopupHeader>

            {/* Hiển thị trạng thái kết bạn */}
            {friendshipStatus === 'friend' ? (
              <PopupMenuItem onClick={handleUnfriend} disabled={actionLoading}>
                <PopupMenuIcon>
                  <FiUser />
                </PopupMenuIcon>
                <PopupMenuText>
                  {actionLoading ? 'Đang xử lý...' : 'Bạn bè'}
                </PopupMenuText>
              </PopupMenuItem>
            ) : friendshipStatus === 'none' ? (
              <PopupMenuItem onClick={handleAddFriend} disabled={actionLoading}>
                <PopupMenuIcon>
                  <FiUserPlus />
                </PopupMenuIcon>
                <PopupMenuText>{actionLoading ? 'Đang xử lý...' : 'Gửi yêu cầu kết bạn'}</PopupMenuText>
              </PopupMenuItem>
            ) : friendshipStatus === 'pending_sent' ? (
              <PopupMenuItem disabled>
                <PopupMenuIcon>
                  <FiUserPlus />
                </PopupMenuIcon>
                <PopupMenuText>Đã gửi lời mời</PopupMenuText>
              </PopupMenuItem>
            ) : null}

            <PopupMenuItem onClick={handleReport}>
              <PopupMenuIcon>
                <FiAlertTriangle />
              </PopupMenuIcon>
              <PopupMenuText>Báo cáo</PopupMenuText>
            </PopupMenuItem>

            <PopupMenuItem onClick={handleBlock} danger>
              <PopupMenuIcon>
                <FiUserX />
              </PopupMenuIcon>
              <PopupMenuText color="#ef4444">Chặn</PopupMenuText>
            </PopupMenuItem>
          </PopupMenu>
        </PopupOverlay>
      )}
    </PageContainer>
  );
};

export default MobileUserProfile;
