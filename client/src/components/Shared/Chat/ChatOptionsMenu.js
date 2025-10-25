import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { 
  FiX, FiBookmark, FiCalendar, FiTag, FiEyeOff, FiPhone, 
  FiSettings, FiClock, FiAlertTriangle, FiUserX, 
  FiTrash2, FiUsers, FiUserPlus, FiImage, FiSearch
} from 'react-icons/fi';
import { chatAPI } from '../../../utils/api';
import { getInitials } from '../../../utils/nameUtils';
import { getAvatarURL, getUploadedImageURL } from '../../../utils/imageUtils';

const Overlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  
  @media (max-width: 768px) {
    padding: 0.5rem;
    align-items: flex-end;
  }
`;

const MenuContainer = styled.div`
  background: white;
  width: 100%;
  max-width: 400px;
  border-radius: 16px;
  max-height: 80vh;
  overflow-y: auto;
  animation: fadeIn 0.3s ease-out;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
  
  @media (max-width: 768px) {
    max-width: 100%;
    border-radius: 16px 16px 0 0;
    max-height: 90vh;
    animation: slideUp 0.3s ease-out;
  }
  
  @media (max-width: 480px) {
    border-radius: 12px 12px 0 0;
    max-height: 95vh;
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
  
  @keyframes slideUp {
    from {
      transform: translateY(100%);
    }
    to {
      transform: translateY(0);
    }
  }
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.5rem;
  border-bottom: 1px solid #e1e5e9;
  position: sticky;
  top: 0;
  background: white;
  z-index: 1;
`;

const HeaderTitle = styled.h2`
  margin: 0;
  font-size: 1.1rem;
  font-weight: 600;
  color: #333;
`;

const CloseButton = styled.button`
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: none;
  background: #f5f5f5;
  color: #666;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  
  &:hover:not(:disabled) {
    background: #e9ecef;
    color: #333;
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const ProfileSection = styled.div`
  padding: 1rem;
  text-align: center;
  border-bottom: 1px solid #e1e5e9;
`;

const ProfileAvatar = styled.div`
  width: 70px;
  height: 70px;
  border-radius: 50%;
  background: ${props => props.color || 'linear-gradient(135deg, #0068ff 0%, #00a651 100%)'};
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 0.75rem;
  font-size: 1.8rem;
  color: white;
  font-weight: bold;
  border: 3px solid white;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
`;

const ProfileName = styled.h3`
  margin: 0 0 0.25rem 0;
  font-size: 1.1rem;
  font-weight: 600;
  color: #333;
`;

const ProfileSubtext = styled.p`
  margin: 0 0 0.75rem 0;
  font-size: 0.85rem;
  color: #666;
  font-weight: 400;
`;

const QuickActions = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 0.75rem;
  margin-bottom: 0.75rem;
  
  @media (max-width: 480px) {
    gap: 0.5rem;
    margin-bottom: 0.5rem;
  }
`;

const QuickAction = styled.button`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.4rem;
  padding: 0.75rem 0.4rem;
  border: none;
  background: transparent;
  cursor: pointer;
  border-radius: 6px;
  transition: background 0.2s ease;
  
  &:hover {
    background: #f8f9fa;
  }
  
  @media (max-width: 480px) {
    padding: 0.5rem 0.25rem;
    gap: 0.3rem;
  }
`;

const QuickActionIcon = styled.div`
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: #f0f0f0;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #666;
  font-size: 1rem;
  
  @media (max-width: 480px) {
    width: 28px;
    height: 28px;
    font-size: 0.9rem;
  }
`;

const QuickActionText = styled.span`
  font-size: 0.7rem;
  color: #666;
  text-align: center;
  
  @media (max-width: 480px) {
    font-size: 0.65rem;
  }
`;

const MenuSection = styled.div`
  padding: 0.5rem 0;
`;

const MenuItem = styled.button`
  width: 100%;
  display: flex;
  align-items: center;
  padding: 0.75rem 1rem;
  border: none;
  background: transparent;
  cursor: pointer;
  transition: background 0.2s ease;
  text-align: left;
  
  &:hover {
    background: #f8f9fa;
  }
  
  @media (max-width: 480px) {
    padding: 0.6rem 0.75rem;
  }
`;

const MenuIcon = styled.div`
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 0.75rem;
  color: #666;
  font-size: 1rem;
`;

const MenuContent = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
`;

const MenuText = styled.span`
  font-size: 0.9rem;
  color: #333;
  font-weight: 500;
  
  @media (max-width: 480px) {
    font-size: 0.85rem;
  }
`;

const MenuSubtext = styled.span`
  font-size: 0.75rem;
  color: #666;
  margin-top: 0.2rem;
  
  @media (max-width: 480px) {
    font-size: 0.7rem;
  }
`;

const ToggleSwitch = styled.div`
  width: 36px;
  height: 20px;
  border-radius: 10px;
  background: ${props => props.active ? '#0068ff' : '#ddd'};
  position: relative;
  transition: background 0.2s ease;
  cursor: pointer;
  
  &::after {
    content: '';
    position: absolute;
    top: 2px;
    left: ${props => props.active ? '18px' : '2px'};
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: white;
    transition: left 0.2s ease;
  }
`;

const ArrowIcon = styled.div`
  color: #ccc;
  font-size: 1.2rem;
`;

const MediaPreview = styled.div`
  display: flex;
  gap: 0.5rem;
  margin-top: 0.5rem;
  overflow-x: auto;
  padding: 0.5rem 0;
`;

const MediaThumbnail = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 6px;
  background: #f0f0f0;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #666;
  font-size: 0.8rem;
  flex-shrink: 0;
`;

const ChatOptionsMenu = ({ isOpen, onClose, conversation, currentUser, onSettingsUpdate, onShowProfile }) => {
  const [pinned, setPinned] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [callNotifications, setCallNotifications] = useState(true);
  const [isCloseFriend, setIsCloseFriend] = useState(false);
  const [nickname, setNickname] = useState('');
  const [loading, setLoading] = useState(false);

  // Generate avatar color based on name
  const getAvatarColor = (name) => {
    if (!name) return 'linear-gradient(135deg, #0068ff 0%, #00a651 100%)';
    
    const colors = [
      'linear-gradient(135deg, #0068ff 0%, #00a651 100%)',
      'linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%)',
      'linear-gradient(135deg, #4834d4 0%, #686de0 100%)',
      'linear-gradient(135deg, #00d2d3 0%, #54a0ff 100%)',
      'linear-gradient(135deg, #ff9ff3 0%, #f368e0 100%)',
      'linear-gradient(135deg, #feca57 0%, #ff9ff3 100%)',
      'linear-gradient(135deg, #48dbfb 0%, #0abde3 100%)',
      'linear-gradient(135deg, #ff6348 0%, #ff4757 100%)',
      'linear-gradient(135deg, #5f27cd 0%, #341f97 100%)',
      'linear-gradient(135deg, #00d2d3 0%, #01a3a4 100%)'
    ];
    
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  };

  // Load conversation settings when menu opens
  useEffect(() => {
    if (isOpen && conversation) {
      loadConversationSettings();
    }
  }, [isOpen, conversation]);

  const loadConversationSettings = async () => {
    try {
      const settings = await chatAPI.getConversationSettings(conversation.id);
      setPinned(settings.pinned || false);
      setHidden(settings.hidden || false);
      setCallNotifications(settings.call_notifications || true);
      setIsCloseFriend(settings.is_close_friend || false);
      setNickname(settings.nickname || '');
    } catch (error) {
      console.error('Error loading conversation settings:', error);
    }
  };

  if (!isOpen) return null;

  const handlePinToggle = async () => {
    const newPinned = !pinned;
    setPinned(newPinned);
    try {
      await chatAPI.pinConversation(conversation.id, newPinned);
    } catch (error) {
      console.error('Error pinning conversation:', error);
      setPinned(!newPinned); // Revert on error
    }
  };

  const handleHideToggle = async () => {
    const newHidden = !hidden;
    setHidden(newHidden);
    try {
      await chatAPI.hideConversation(conversation.id, newHidden);
    } catch (error) {
      console.error('Error hiding conversation:', error);
      setHidden(!newHidden); // Revert on error
    }
  };

  const handleCallNotificationToggle = async () => {
    const newCallNotifications = !callNotifications;
    setCallNotifications(newCallNotifications);
    try {
      // This would need a separate API endpoint for call notifications
      // await chatAPI.updateCallNotifications(conversation.id, newCallNotifications);
    } catch (error) {
      console.error('Error updating call notifications:', error);
      setCallNotifications(!newCallNotifications); // Revert on error
    }
  };

  const handleSearchMessages = () => {
    // TODO: Implement search messages
    alert('Tìm kiếm tin nhắn');
  };

  const handlePersonalPage = () => {
    if (onShowProfile) {
      onShowProfile();
    }
  };

  const handleChangeBackground = () => {
    // TODO: Implement change background
    alert('Đổi hình nền');
  };

  const handleTurnOffNotifications = () => {
    // TODO: Implement turn off notifications
    alert('Tắt thông báo');
  };

  const handleChangeNickname = () => {
    const newNickname = prompt('Nhập tên gợi nhớ mới:', nickname);
    if (newNickname !== null) {
      setLoading(true);
      chatAPI.updateNickname(conversation.id, newNickname)
        .then(() => {
          setNickname(newNickname);
          alert('Đã cập nhật tên gợi nhớ');
          // Notify parent component to reload settings
          if (onSettingsUpdate) {
            onSettingsUpdate();
          }
        })
        .catch(error => {
          console.error('Error updating nickname:', error);
          alert('Có lỗi xảy ra khi cập nhật tên gợi nhớ');
        })
        .finally(() => {
          setLoading(false);
        });
    }
  };

  const handleMarkAsCloseFriend = async () => {
    const newIsCloseFriend = !isCloseFriend;
    setIsCloseFriend(newIsCloseFriend);
    try {
      await chatAPI.markAsCloseFriend(conversation.id, newIsCloseFriend);
    } catch (error) {
      console.error('Error marking as close friend:', error);
      setIsCloseFriend(!newIsCloseFriend); // Revert on error
    }
  };

  const handleSharedDiary = () => {
    // TODO: Implement shared diary
    alert('Nhật ký chung');
  };

  const handleSharedMedia = () => {
    // TODO: Implement shared media
    alert('Ảnh, file, link');
  };

  const handleCreateGroup = () => {
    // TODO: Implement create group
    alert('Tạo nhóm');
  };

  const handleAddToGroup = () => {
    // TODO: Implement add to group
    alert('Thêm vào nhóm');
  };

  const handleViewCommonGroups = () => {
    // TODO: Implement view common groups
    alert('Xem nhóm chung');
  };

  const handleDisplayOptions = () => {
    // TODO: Implement display options
    alert('Mục hiển thị');
  };

  const handleCategorizationTag = () => {
    // TODO: Implement categorization tag
    alert('Thẻ phân loại');
  };

  const handlePersonalSettings = () => {
    // TODO: Implement personal settings
    alert('Cài đặt cá nhân');
  };

  const handleSelfDeletingMessages = () => {
    // TODO: Implement self-deleting messages
    alert('Tin nhắn tự xóa');
  };

  const handleReportAbuse = () => {
    // TODO: Implement report abuse
    alert('Báo xấu');
  };

  const handleBlockManagement = () => {
    // TODO: Implement block management
    alert('Quản lý chặn');
  };

  const handleChatStorage = () => {
    // TODO: Implement chat storage
    alert('Dung lượng trò chuyện');
  };

  const handleDeleteChatHistory = () => {
    if (window.confirm('Bạn có chắc chắn muốn xóa lịch sử trò chuyện? Hành động này không thể hoàn tác.')) {
      setLoading(true);
      chatAPI.deleteConversationHistory(conversation.id)
        .then(() => {
          alert('Đã xóa lịch sử trò chuyện');
          onClose(); // Close menu after deletion
        })
        .catch(error => {
          console.error('Error deleting chat history:', error);
          alert('Có lỗi xảy ra khi xóa lịch sử trò chuyện');
        })
        .finally(() => {
          setLoading(false);
        });
    }
  };

  return (
    <Overlay onClick={onClose}>
      <MenuContainer onClick={(e) => e.stopPropagation()}>
        <Header>
          <HeaderTitle>Tùy chọn</HeaderTitle>
          <CloseButton onClick={onClose} disabled={loading}>
            <FiX size={18} />
          </CloseButton>
        </Header>

        <ProfileSection>
          <ProfileAvatar color={getAvatarColor(conversation?.full_name || conversation?.username)}>
            {conversation?.avatar_url ? (
              <img src={getAvatarURL(conversation.avatar_url)} alt={conversation.full_name} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
            ) : (
              getInitials(conversation?.full_name || conversation?.username)
            )}
          </ProfileAvatar>
          <ProfileName>
            {nickname || conversation?.full_name || conversation?.username || 'Người dùng'}
          </ProfileName>
          {nickname && (
            <ProfileSubtext>
              {conversation?.full_name || conversation?.username}
            </ProfileSubtext>
          )}
          
          <QuickActions>
            <QuickAction onClick={handleSearchMessages}>
              <QuickActionIcon>
                <FiSearch size={20} />
              </QuickActionIcon>
              <QuickActionText>Tìm tin nhắn</QuickActionText>
            </QuickAction>
            
            <QuickAction onClick={handlePersonalPage}>
              <QuickActionIcon>
                <FiUsers size={20} />
              </QuickActionIcon>
              <QuickActionText>Trang cá nhân</QuickActionText>
            </QuickAction>
            
            <QuickAction onClick={handleChangeBackground}>
              <QuickActionIcon>
                <FiImage size={20} />
              </QuickActionIcon>
              <QuickActionText>Đổi hình nền</QuickActionText>
            </QuickAction>
            
            <QuickAction onClick={handleTurnOffNotifications}>
              <QuickActionIcon>
                <FiSettings size={20} />
              </QuickActionIcon>
              <QuickActionText>Tắt thông báo</QuickActionText>
            </QuickAction>
          </QuickActions>
        </ProfileSection>

        <MenuSection>
          <MenuItem onClick={handleChangeNickname}>
            <MenuIcon>
              <FiTag size={18} />
            </MenuIcon>
            <MenuContent>
              <MenuText>Đổi tên gợi nhớ</MenuText>
              {nickname && (
                <MenuSubtext>Hiện tại: {nickname}</MenuSubtext>
              )}
            </MenuContent>
          </MenuItem>

          <MenuItem onClick={handleMarkAsCloseFriend}>
            <MenuIcon>
              <FiUsers size={18} />
            </MenuIcon>
            <MenuContent>
              <MenuText>Đánh dấu bạn thân</MenuText>
            </MenuContent>
            <ToggleSwitch active={isCloseFriend} />
          </MenuItem>

          <MenuItem onClick={handleSharedDiary}>
            <MenuIcon>
              <FiClock size={18} />
            </MenuIcon>
            <MenuContent>
              <MenuText>Nhật ký chung</MenuText>
            </MenuContent>
            <ArrowIcon>
              <FiX size={18} style={{ transform: 'rotate(45deg)' }} />
            </ArrowIcon>
          </MenuItem>

          <MenuItem onClick={handleSharedMedia}>
            <MenuIcon>
              <FiImage size={18} />
            </MenuIcon>
            <MenuContent>
              <MenuText>Ảnh, file, link</MenuText>
              <MediaPreview>
                <MediaThumbnail>📷</MediaThumbnail>
                <MediaThumbnail>📄</MediaThumbnail>
                <MediaThumbnail>🔗</MediaThumbnail>
                <MediaThumbnail>→</MediaThumbnail>
              </MediaPreview>
            </MenuContent>
            <ArrowIcon>
              <FiX size={18} style={{ transform: 'rotate(45deg)' }} />
            </ArrowIcon>
          </MenuItem>

          <MenuItem onClick={handleCreateGroup}>
            <MenuIcon>
              <FiUserPlus size={18} />
            </MenuIcon>
            <MenuContent>
              <MenuText>Tạo nhóm với {nickname || conversation?.full_name || conversation?.username}</MenuText>
            </MenuContent>
            <ArrowIcon>
              <FiX size={18} style={{ transform: 'rotate(45deg)' }} />
            </ArrowIcon>
          </MenuItem>

          <MenuItem onClick={handleAddToGroup}>
            <MenuIcon>
              <FiUserPlus size={18} />
            </MenuIcon>
            <MenuContent>
              <MenuText>Thêm {nickname || conversation?.full_name || conversation?.username} vào nhóm</MenuText>
            </MenuContent>
            <ArrowIcon>
              <FiX size={18} style={{ transform: 'rotate(45deg)' }} />
            </ArrowIcon>
          </MenuItem>

          <MenuItem onClick={handleViewCommonGroups}>
            <MenuIcon>
              <FiUsers size={18} />
            </MenuIcon>
            <MenuContent>
              <MenuText>Xem nhóm chung (1)</MenuText>
            </MenuContent>
            <ArrowIcon>
              <FiX size={18} style={{ transform: 'rotate(45deg)' }} />
            </ArrowIcon>
          </MenuItem>
        </MenuSection>

        <MenuSection>
          <MenuItem onClick={handlePinToggle}>
            <MenuIcon>
              <FiBookmark size={18} />
            </MenuIcon>
            <MenuContent>
              <MenuText>Ghim trò chuyện</MenuText>
            </MenuContent>
            <ToggleSwitch active={pinned} />
          </MenuItem>

          <MenuItem onClick={handleDisplayOptions}>
            <MenuIcon>
              <FiCalendar size={18} />
            </MenuIcon>
            <MenuContent>
              <MenuText>Mục hiển thị</MenuText>
              <MenuSubtext>Ưu tiên</MenuSubtext>
            </MenuContent>
            <ArrowIcon>
              <FiX size={18} style={{ transform: 'rotate(45deg)' }} />
            </ArrowIcon>
          </MenuItem>

          <MenuItem onClick={handleCategorizationTag}>
            <MenuIcon>
              <FiTag size={18} />
            </MenuIcon>
            <MenuContent>
              <MenuText>Thẻ phân loại</MenuText>
              <MenuSubtext>Chưa gắn thẻ</MenuSubtext>
            </MenuContent>
            <ArrowIcon>
              <FiX size={18} style={{ transform: 'rotate(45deg)' }} />
            </ArrowIcon>
          </MenuItem>

          <MenuItem onClick={handleHideToggle}>
            <MenuIcon>
              <FiEyeOff size={18} />
            </MenuIcon>
            <MenuContent>
              <MenuText>Ẩn trò chuyện</MenuText>
            </MenuContent>
            <ToggleSwitch active={hidden} />
          </MenuItem>

          <MenuItem onClick={handleCallNotificationToggle}>
            <MenuIcon>
              <FiPhone size={18} />
            </MenuIcon>
            <MenuContent>
              <MenuText>Báo cuộc gọi đến</MenuText>
            </MenuContent>
            <ToggleSwitch active={callNotifications} />
          </MenuItem>

          <MenuItem onClick={handlePersonalSettings}>
            <MenuIcon>
              <FiSettings size={18} />
            </MenuIcon>
            <MenuContent>
              <MenuText>Cài đặt cá nhân</MenuText>
            </MenuContent>
            <ArrowIcon>
              <FiX size={18} style={{ transform: 'rotate(45deg)' }} />
            </ArrowIcon>
          </MenuItem>

          <MenuItem onClick={handleSelfDeletingMessages}>
            <MenuIcon>
              <FiClock size={18} />
            </MenuIcon>
            <MenuContent>
              <MenuText>Tin nhắn tự xóa</MenuText>
              <MenuSubtext>Không tự xóa</MenuSubtext>
            </MenuContent>
            <ArrowIcon>
              <FiX size={18} style={{ transform: 'rotate(45deg)' }} />
            </ArrowIcon>
          </MenuItem>
        </MenuSection>

        <MenuSection>
          <MenuItem onClick={handleReportAbuse}>
            <MenuIcon>
              <FiAlertTriangle size={18} />
            </MenuIcon>
            <MenuContent>
              <MenuText>Báo xấu</MenuText>
            </MenuContent>
          </MenuItem>

          <MenuItem onClick={handleBlockManagement}>
            <MenuIcon>
              <FiUserX size={18} />
            </MenuIcon>
            <MenuContent>
              <MenuText>Quản lý chặn</MenuText>
            </MenuContent>
            <ArrowIcon>
              <FiX size={18} style={{ transform: 'rotate(45deg)' }} />
            </ArrowIcon>
          </MenuItem>

          <MenuItem onClick={handleChatStorage}>
            <MenuIcon>
              <FiClock size={18} />
            </MenuIcon>
            <MenuContent>
              <MenuText>Dung lượng trò chuyện</MenuText>
            </MenuContent>
          </MenuItem>

          <MenuItem onClick={handleDeleteChatHistory}>
            <MenuIcon>
              <FiTrash2 size={18} />
            </MenuIcon>
            <MenuContent>
              <MenuText>Xóa lịch sử trò chuyện</MenuText>
            </MenuContent>
          </MenuItem>
        </MenuSection>
      </MenuContainer>
    </Overlay>
  );
};

export default ChatOptionsMenu;
