import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { 
  FiArrowLeft, 
  FiEdit3, 
  FiCamera, 
  FiUser, 
  FiPhone, 
  FiMail, 
  FiCalendar,
  FiMapPin,
  FiGlobe,
  FiSettings,
  FiLogOut,
  FiCheck,
  FiUserPlus,
  FiMessageCircle,
  FiUserMinus,
  FiUserCheck,
  FiUserX
} from 'react-icons/fi';
import { profileAPI, friendsAPI } from '../../utils/api';
import { getInitials } from '../../utils/nameUtils';
import { getAvatarURL, getUploadedImageURL } from '../../utils/imageUtils';

const ProfileContainer = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  z-index: 1000;
  overflow: hidden;
`;

const Header = styled.div`
  background: linear-gradient(180deg, rgba(0, 0, 0, 0.4) 0%, transparent 100%);
  color: white;
  padding: 1.5rem 1rem 1rem 1rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  z-index: 10;
  backdrop-filter: blur(20px);
`;

const BackButton = styled.button`
  background: rgba(255, 255, 255, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.3);
  color: white;
  cursor: pointer;
  padding: 0.75rem;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  backdrop-filter: blur(20px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);

  &:hover {
    background: rgba(255, 255, 255, 0.3);
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.25);
  }

  &:active {
    transform: translateY(0);
  }
`;

const HeaderTitle = styled.h1`
  margin: 0;
  font-size: 1.3rem;
  font-weight: 700;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  letter-spacing: -0.02em;
`;

const Content = styled.div`
  flex: 1;
  overflow-y: auto;
  background: #f5f5f5;
  margin-top: 120px;
  border-radius: 20px 20px 0 0;
  position: relative;
  z-index: 5;
  box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.1);
`;

const CoverPhoto = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 140px;
  background: linear-gradient(135deg, #0068ff 0%, #00a651 100%);
  background-image: ${props => props.coverImage ? `url(${props.coverImage})` : 'none'};
  background-size: cover;
  background-position: center;
  z-index: 1;
  
  @media (max-width: 768px) {
    height: 120px;
  }
  
  @media (max-width: 480px) {
    height: 100px;
  }
`;

const ProfileCard = styled.div`
  background: white;
  padding: 1rem;
  margin-top: 40px;
  position: relative;
  z-index: 2;
  text-align: center;
  border-radius: 20px 20px 0 0;
  
  @media (max-width: 768px) {
    padding: 0.75rem;
    margin-top: 35px;
  }
  
  @media (max-width: 480px) {
    padding: 0.5rem;
    margin-top: 30px;
  }
`;

const AvatarContainer = styled.div`
  position: relative;
  display: inline-block;
  margin-bottom: 1rem;
  margin-top: -40px;
  
  @media (max-width: 768px) {
    margin-top: -35px;
    margin-bottom: 0.75rem;
  }
  
  @media (max-width: 480px) {
    margin-top: -30px;
    margin-bottom: 0.5rem;
  }
`;

const ProfileAvatar = styled.div`
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: ${props => props.color || 'linear-gradient(135deg, #0068ff 0%, #00a651 100%)'};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2rem;
  color: white;
  font-weight: 700;
  border: 3px solid white;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  margin: 0 auto;
  position: relative;
  
  @media (max-width: 768px) {
    width: 70px;
    height: 70px;
    font-size: 1.75rem;
    border: 2px solid white;
  }
  
  @media (max-width: 480px) {
    width: 60px;
    height: 60px;
    font-size: 1.5rem;
    border: 2px solid white;
  }
`;

const EditAvatarButton = styled.button`
  position: absolute;
  bottom: 4px;
  right: 4px;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: #0068ff;
  border: 2px solid white;
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  box-shadow: 0 2px 6px rgba(0, 104, 255, 0.3);
  font-size: 0.7rem;

  &:hover {
    background: #0056cc;
    transform: scale(1.1);
  }
  
  @media (max-width: 768px) {
    width: 20px;
    height: 20px;
    font-size: 0.6rem;
  }
  
  @media (max-width: 480px) {
    width: 18px;
    height: 18px;
    font-size: 0.55rem;
  }
`;

const EditCoverButton = styled.button`
  position: absolute;
  top: 8px;
  right: 8px;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.5);
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  font-size: 0.8rem;

  &:hover {
    background: rgba(0, 0, 0, 0.5);
    transform: scale(1.1);
  }
  
  @media (max-width: 768px) {
    width: 24px;
    height: 24px;
    font-size: 0.7rem;
  }
  
  @media (max-width: 480px) {
    width: 20px;
    height: 20px;
    font-size: 0.6rem;
  }
`;

const ProfileName = styled.h2`
  margin: 0 0 0.25rem 0;
  font-size: 1.1rem;
  font-weight: 600;
  color: #333;
  
  @media (max-width: 768px) {
    font-size: 1rem;
  }
  
  @media (max-width: 480px) {
    font-size: 0.95rem;
  }
`;

const ProfileStatus = styled.div`
  margin: 0 0 1rem 0;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 0.5rem;
  
  @media (max-width: 768px) {
    margin-bottom: 0.75rem;
  }
  
  @media (max-width: 480px) {
    margin-bottom: 0.5rem;
  }
`;

const StatusBadge = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.25rem 0.75rem;
  background: #e8f5e8;
  color: #2ecc71;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 500;
`;

const StatusDot = styled.div`
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #2ecc71;
  animation: pulse 2s infinite;
  
  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }
`;

const InfoSection = styled.div`
  background: white;
  border-radius: 12px;
  padding: 1rem;
  margin-bottom: 0.75rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  border: 1px solid #f0f0f0;
  
  @media (max-width: 768px) {
    padding: 0.75rem;
    margin-bottom: 0.5rem;
  }
  
  @media (max-width: 480px) {
    padding: 0.5rem;
    margin-bottom: 0.5rem;
  }
`;

const SectionTitle = styled.h3`
  margin: 0 0 0.75rem 0;
  font-size: 0.9rem;
  font-weight: 600;
  color: #666;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  
  @media (max-width: 768px) {
    font-size: 0.85rem;
    margin-bottom: 0.5rem;
  }
  
  @media (max-width: 480px) {
    font-size: 0.8rem;
    margin-bottom: 0.5rem;
  }
`;

const InfoItem = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.5rem 0;
  border-bottom: 1px solid #f0f0f0;

  &:last-child {
    border-bottom: none;
  }
  
  @media (max-width: 768px) {
    gap: 0.5rem;
    padding: 0.4rem 0;
  }
  
  @media (max-width: 480px) {
    gap: 0.5rem;
    padding: 0.3rem 0;
  }
`;

const InfoIcon = styled.div`
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background: #f5f5f5;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #666;
  flex-shrink: 0;
  
  @media (max-width: 768px) {
    width: 28px;
    height: 28px;
  }
  
  @media (max-width: 480px) {
    width: 24px;
    height: 24px;
  }
`;

const InfoContent = styled.div`
  flex: 1;
`;

const InfoLabel = styled.div`
  font-size: 0.75rem;
  color: #999;
  margin-bottom: 0.1rem;
  font-weight: 400;
  
  @media (max-width: 768px) {
    font-size: 0.7rem;
  }
  
  @media (max-width: 480px) {
    font-size: 0.65rem;
  }
`;

const InfoValue = styled.div`
  font-size: 0.85rem;
  color: #333;
  font-weight: 500;
  line-height: 1.3;
  
  @media (max-width: 768px) {
    font-size: 0.8rem;
  }
  
  @media (max-width: 480px) {
    font-size: 0.75rem;
  }
`;

const EditButton = styled.button`
  background: #f5f5f5;
  border: 1px solid #ddd;
  color: #666;
  cursor: pointer;
  padding: 0.4rem;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  font-size: 0.7rem;

  &:hover {
    background: #0068ff;
    color: white;
    border-color: #0068ff;
  }
  
  @media (max-width: 768px) {
    padding: 0.3rem;
    font-size: 0.65rem;
  }
  
  @media (max-width: 480px) {
    padding: 0.25rem;
    font-size: 0.6rem;
  }
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 0.75rem;
  margin-top: 1.5rem;
  justify-content: center;
  flex-wrap: wrap;
  position: relative;
  
  @media (max-width: 768px) {
    gap: 0.5rem;
    margin-top: 1rem;
  }
  
  @media (max-width: 480px) {
    gap: 0.5rem;
    margin-top: 0.75rem;
    flex-direction: column;
    align-items: center;
  }
`;

const ActionButton = styled.button`
  padding: 0.75rem 1.5rem;
  border: 1px solid #ddd;
  border-radius: 25px;
  background: white;
  color: #333;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  font-weight: 600;
  font-size: 0.9rem;
  transition: all 0.2s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  min-width: 120px;

  &:hover:not(:disabled) {
    background: #f5f5f5;
    border-color: #0068ff;
    color: #0068ff;
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  &.primary {
    background: #0068ff;
    color: white;
    border-color: #0068ff;

    &:hover:not(:disabled) {
      background: #0056cc;
      border-color: #0056cc;
    }
  }

  &.success {
    background: #28a745;
    color: white;
    border-color: #28a745;

    &:hover:not(:disabled) {
      background: #218838;
      border-color: #218838;
    }
  }

  &.danger {
    background: #dc3545;
    color: white;
    border-color: #dc3545;

    &:hover:not(:disabled) {
      background: #c82333;
      border-color: #c82333;
    }
  }

  &.secondary {
    background: #6c757d;
    color: white;
    border-color: #6c757d;

    &:hover:not(:disabled) {
      background: #5a6268;
      border-color: #5a6268;
    }
  }
  
  @media (max-width: 768px) {
    padding: 0.6rem 0.75rem;
    font-size: 0.8rem;
  }
  
  @media (max-width: 480px) {
    padding: 0.5rem 0.6rem;
    font-size: 0.75rem;
  }
`;

const EditModal = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
`;

const EditModalContent = styled.div`
  background: white;
  border-radius: 16px;
  padding: 2rem;
  width: 100%;
  max-width: 400px;
  max-height: 80vh;
  overflow-y: auto;
`;

const EditModalHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1.5rem;
`;

const EditModalTitle = styled.h3`
  margin: 0;
  font-size: 1.2rem;
  font-weight: 600;
  color: #333;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  color: #666;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;

  &:hover {
    background: #f0f0f0;
  }
`;

const FormGroup = styled.div`
  margin-bottom: 1.5rem;
`;

const Label = styled.label`
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: #333;
`;

const Input = styled.input`
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 1rem;
  outline: none;
  transition: all 0.2s ease;

  &:focus {
    border-color: #0068ff;
    box-shadow: 0 0 0 3px rgba(0, 104, 255, 0.1);
  }
`;

const TextArea = styled.textarea`
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 1rem;
  outline: none;
  resize: vertical;
  min-height: 100px;
  transition: all 0.2s ease;

  &:focus {
    border-color: #0068ff;
    box-shadow: 0 0 0 3px rgba(0, 104, 255, 0.1);
  }
`;

const SaveButton = styled.button`
  width: 100%;
  padding: 0.75rem;
  background: #0068ff;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: #0056cc;
  }

  &:disabled {
    background: #ccc;
    cursor: not-allowed;
  }
`;

const FriendMenu = styled.div`
  position: absolute;
  top: 100%;
  right: 0;
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.15);
  min-width: 200px;
  z-index: 1000;
  margin-top: 8px;
  border: 1px solid #e1e5e9;
`;

const FriendMenuItem = styled.button`
  width: 100%;
  padding: 12px 16px;
  border: none;
  background: none;
  text-align: left;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  color: #333;
  font-size: 14px;
  transition: background-color 0.2s;

  &:hover {
    background-color: #f8f9fa;
  }

  &:first-child {
    border-radius: 8px 8px 0 0;
  }

  &:last-child {
    border-radius: 0 0 8px 8px;
  }

  &:only-child {
    border-radius: 8px;
  }

  &.danger {
    color: #dc3545;
  }

  &.danger:hover {
    background-color: #f8d7da;
  }
`;

const ProfilePage = ({ user, onBack, onLogout, isOwnProfile = false }) => {
  const [profile, setProfile] = useState({
    full_name: '',
    username: '',
    email: '',
    phone: '',
    bio: '',
    location: '',
    website: '',
    status: 'online',
    cover_image: '',
    avatar_url: ''
  });
  const [isEditing, setIsEditing] = useState(false);
  const [editingField, setEditingField] = useState(null);
  const [loading, setLoading] = useState(false);
  const [friendshipStatus, setFriendshipStatus] = useState('none'); // none, friend, pending_sent, pending_received
  const [isFollowing, setIsFollowing] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [showFriendMenu, setShowFriendMenu] = useState(false);

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

  useEffect(() => {
    if (user) {
      setProfile({
        full_name: user.full_name || user.fullName || '',
        username: user.username || '',
        email: user.email || '',
        phone: user.phone || '',
        bio: user.bio || '',
        location: user.location || '',
        website: user.website || '',
        status: user.status || 'online',
        cover_image: user.cover_image || '',
        avatar_url: user.avatar_url || ''
      });
    }
  }, [user]);

  // Check friendship status when viewing another user's profile
  useEffect(() => {
    if (!isOwnProfile && user?.id) {
      checkFriendshipStatus();
    }
  }, [isOwnProfile, user?.id]);

  // Close friend menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showFriendMenu && !event.target.closest('.friend-menu-container')) {
        setShowFriendMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showFriendMenu]);

  const checkFriendshipStatus = async () => {
    try {
      console.log('Checking friendship status for user:', user);
      const response = await friendsAPI.checkFriendshipStatus(user.id);
      console.log('Friendship status response:', response.data);
      setFriendshipStatus(response.data.friendship_status);
      setIsFollowing(response.data.isFollowing);
    } catch (error) {
      console.error('Error checking friendship status:', error);
      setFriendshipStatus('none');
      setIsFollowing(false);
    }
  };

  const handleSendFriendRequest = async () => {
    console.log('🔵 handleSendFriendRequest called');
    setActionLoading(true);
    try {
      console.log('Sending friend request to user:', user);
      console.log('User ID:', user.id, 'Type:', typeof user.id);
      
      if (!user.id) {
        throw new Error('User ID not found');
      }
      
      // Convert to number if it's a string
      const friendId = typeof user.id === 'string' ? parseInt(user.id) : user.id;
      console.log('Converted friendId:', friendId);
      
      console.log('Calling friendsAPI.sendFriendRequest...');
      const result = await friendsAPI.sendFriendRequest(friendId);
      console.log('Friend request result:', result);
      
      // Refresh friendship status
      console.log('Refreshing friendship status...');
      await checkFriendshipStatus();
      console.log('✅ Friend request sent successfully');
    } catch (error) {
      console.error('❌ Error sending friend request:', error);
      alert('Lỗi khi gửi yêu cầu kết bạn: ' + error.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleAcceptFriendRequest = async () => {
    setActionLoading(true);
    try {
      const friendId = typeof user.id === 'string' ? parseInt(user.id) : user.id;
      await friendsAPI.acceptFriendRequest(friendId);
      // Refresh friendship status
      await checkFriendshipStatus();
    } catch (error) {
      console.error('Error accepting friend request:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectFriendRequest = async () => {
    setActionLoading(true);
    try {
      const friendId = typeof user.id === 'string' ? parseInt(user.id) : user.id;
      await friendsAPI.rejectFriendRequest(friendId);
      // Refresh friendship status
      await checkFriendshipStatus();
    } catch (error) {
      console.error('Error rejecting friend request:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleUnfriend = async () => {
    setActionLoading(true);
    try {
      const friendId = typeof user.id === 'string' ? parseInt(user.id) : user.id;
      await friendsAPI.unfriend(friendId);
      // Refresh friendship status
      await checkFriendshipStatus();
      // Close menu
      setShowFriendMenu(false);
    } catch (error) {
      console.error('Error unfriending:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleStartChat = () => {
    // This would typically navigate to chat or open a chat window
    // For now, we'll just show an alert
    alert(`Bắt đầu cuộc trò chuyện với ${user.full_name}`);
  };

  const handleFollow = async () => {
    console.log('🟢 handleFollow called');
    setActionLoading(true);
    try {
      const followingId = typeof user.id === 'string' ? parseInt(user.id) : user.id;
      console.log('Following user ID:', followingId);
      
      console.log('Calling friendsAPI.follow...');
      const result = await friendsAPI.follow(followingId);
      console.log('Follow result:', result);
      
      setIsFollowing(true);
      console.log('✅ Followed successfully');
    } catch (error) {
      console.error('❌ Error following user:', error);
      alert('Lỗi khi theo dõi: ' + error.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleUnfollow = async () => {
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

  const handleEdit = (field) => {
    setEditingField(field);
    setIsEditing(true);
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const updateData = {};
      
      // Only include fields that are being edited
      if (editingField === 'full_name') {
        updateData.full_name = profile.full_name;
      } else if (editingField === 'email') {
        updateData.email = profile.email;
      } else if (editingField === 'phone') {
        updateData.phone = profile.phone;
      } else if (editingField === 'location') {
        updateData.location = profile.location;
      } else if (editingField === 'website') {
        updateData.website = profile.website;
      } else if (editingField === 'bio') {
        updateData.bio = profile.bio;
      }
      
      const response = await profileAPI.updateProfile(updateData);
      console.log('Profile updated:', response.data);
      alert('Đã cập nhật thông tin cá nhân');
      setIsEditing(false);
      setEditingField(null);
      
      // Update user object if needed
      if (response.data.user) {
        // You might want to update the user context here
        console.log('Updated user data:', response.data.user);
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      const errorMessage = error.response?.data?.message || 'Có lỗi xảy ra khi cập nhật thông tin';
      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditingField(null);
    // Reset profile to original values
    if (user) {
      setProfile({
        full_name: user.full_name || user.fullName || '',
        username: user.username || '',
        email: user.email || '',
        phone: user.phone || '',
        bio: user.bio || '',
        location: user.location || '',
        website: user.website || '',
        status: user.status || 'online',
        cover_image: user.cover_image || '',
        avatar_url: user.avatar_url || ''
      });
    }
  };

  const handleInputChange = (field, value) => {
    setProfile(prev => ({
      ...prev,
      [field]: value
    }));
  };

  if (!user) {
    return (
      <ProfileContainer>
        <Header>
          <BackButton onClick={onBack}>
            <FiArrowLeft size={20} />
          </BackButton>
          <HeaderTitle>Trang cá nhân</HeaderTitle>
        </Header>
        <Content>
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            <p>Không tìm thấy thông tin người dùng</p>
          </div>
        </Content>
      </ProfileContainer>
    );
  }

  return (
    <ProfileContainer>
      <CoverPhoto coverImage={profile.cover_image}>
        {isOwnProfile && (
          <EditCoverButton onClick={() => handleEdit('cover')}>
            <FiCamera size={18} />
          </EditCoverButton>
        )}
      </CoverPhoto>

      <Header>
        <BackButton onClick={onBack}>
          <FiArrowLeft size={20} />
        </BackButton>
        <HeaderTitle>Trang cá nhân</HeaderTitle>
      </Header>

      <Content>
        <ProfileCard>
          <AvatarContainer>
            <ProfileAvatar color={getAvatarColor(profile.full_name || profile.username)}>
              {profile.avatar_url ? (
                <img src={getAvatarURL(profile.avatar_url)} alt={profile.full_name} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
              ) : (
                getInitials(profile.full_name || profile.username)
              )}
            </ProfileAvatar>
            {isOwnProfile && (
              <EditAvatarButton onClick={() => handleEdit('avatar')}>
                <FiCamera size={16} />
              </EditAvatarButton>
            )}
          </AvatarContainer>
          
          <ProfileName>{profile.full_name || profile.username}</ProfileName>
          <ProfileStatus>
            <StatusBadge>
              <StatusDot />
              {profile.status === 'online' ? 'Đang hoạt động' : 'Không hoạt động'}
            </StatusBadge>
          </ProfileStatus>

          {/* Action Buttons - Moved here like Facebook */}
          {isOwnProfile ? (
            <ActionButtons>
              <ActionButton onClick={() => handleEdit('settings')}>
                <FiSettings size={18} />
                Cài đặt
              </ActionButton>
              <ActionButton onClick={onLogout} className="primary">
                <FiLogOut size={18} />
                Đăng xuất
              </ActionButton>
            </ActionButtons>
          ) : (
            <ActionButtons className="friend-menu-container">
              {/* Debug info */}
              <div style={{ fontSize: '12px', color: '#666', marginBottom: '10px' }}>
                Debug: friendshipStatus = {friendshipStatus}
              </div>
              
              {/* Friend buttons */}
              {friendshipStatus === 'none' && (
                <ActionButton 
                  onClick={() => {
                    console.log('🔵 Kết bạn button clicked!');
                    handleSendFriendRequest();
                  }} 
                  disabled={actionLoading}
                  className="primary"
                >
                  <FiUserPlus size={18} />
                  {actionLoading ? 'Đang gửi...' : 'Kết bạn'}
                </ActionButton>
              )}
              
              {friendshipStatus === 'pending_sent' && (
                <ActionButton disabled className="secondary">
                  <FiCheck size={18} />
                  Đã gửi lời mời
                </ActionButton>
              )}
              
              {friendshipStatus === 'pending_received' && (
                <>
                  <ActionButton 
                    onClick={handleAcceptFriendRequest} 
                    disabled={actionLoading}
                    className="success"
                  >
                    <FiCheck size={18} />
                    {actionLoading ? 'Đang xử lý...' : 'Chấp nhận'}
                  </ActionButton>
                  <ActionButton 
                    onClick={handleRejectFriendRequest} 
                    disabled={actionLoading}
                    className="danger"
                  >
                    <FiUserMinus size={18} />
                    {actionLoading ? 'Đang xử lý...' : 'Từ chối'}
                  </ActionButton>
                </>
              )}
              
              {friendshipStatus === 'friend' && (
                <>
                  <ActionButton 
                    onClick={handleStartChat} 
                    className="primary"
                  >
                    <FiMessageCircle size={18} />
                    Nhắn tin
                  </ActionButton>
                  <ActionButton 
                    onClick={() => setShowFriendMenu(!showFriendMenu)} 
                    className="secondary"
                  >
                    <FiUserCheck size={18} />
                    Bạn bè
                  </ActionButton>
                </>
              )}

              {/* Follow buttons - Always show if not own profile */}
              {!isFollowing ? (
                <ActionButton 
                  onClick={() => {
                    console.log('🟢 Theo dõi button clicked!');
                    handleFollow();
                  }} 
                  disabled={actionLoading}
                  className="success"
                >
                  <FiUserCheck size={18} />
                  {actionLoading ? 'Đang xử lý...' : 'Theo dõi'}
                </ActionButton>
              ) : (
                <ActionButton 
                  onClick={handleUnfollow} 
                  disabled={actionLoading}
                  className="secondary"
                >
                  <FiUserX size={18} />
                  {actionLoading ? 'Đang xử lý...' : 'Bỏ theo dõi'}
                </ActionButton>
              )}
              
              {/* Friend Menu */}
              {showFriendMenu && friendshipStatus === 'friend' && (
                <FriendMenu>
                  <FriendMenuItem 
                    onClick={handleUnfriend}
                    disabled={actionLoading}
                    className="danger"
                  >
                    <FiUserMinus size={16} />
                    {actionLoading ? 'Đang xử lý...' : 'Hủy kết bạn'}
                  </FriendMenuItem>
                </FriendMenu>
              )}
            </ActionButtons>
          )}
        </ProfileCard>

        <InfoSection>
          <SectionTitle>Thông tin cá nhân</SectionTitle>
          
          <InfoItem>
            <InfoIcon>
              <FiUser size={18} />
            </InfoIcon>
            <InfoContent>
              <InfoLabel>Họ và tên</InfoLabel>
              <InfoValue>{profile.full_name || 'Chưa cập nhật'}</InfoValue>
            </InfoContent>
            {isOwnProfile && (
              <EditButton onClick={() => handleEdit('full_name')}>
                <FiEdit3 size={16} />
              </EditButton>
            )}
          </InfoItem>

          <InfoItem>
            <InfoIcon>
              <FiUser size={18} />
            </InfoIcon>
            <InfoContent>
              <InfoLabel>Tên đăng nhập</InfoLabel>
              <InfoValue>{profile.username}</InfoValue>
            </InfoContent>
          </InfoItem>

          <InfoItem>
            <InfoIcon>
              <FiMail size={18} />
            </InfoIcon>
            <InfoContent>
              <InfoLabel>Email</InfoLabel>
              <InfoValue>{profile.email || 'Chưa cập nhật'}</InfoValue>
            </InfoContent>
            {isOwnProfile && (
              <EditButton onClick={() => handleEdit('email')}>
                <FiEdit3 size={16} />
              </EditButton>
            )}
          </InfoItem>

          <InfoItem>
            <InfoIcon>
              <FiPhone size={18} />
            </InfoIcon>
            <InfoContent>
              <InfoLabel>Số điện thoại</InfoLabel>
              <InfoValue>{profile.phone || 'Chưa cập nhật'}</InfoValue>
            </InfoContent>
            {isOwnProfile && (
              <EditButton onClick={() => handleEdit('phone')}>
                <FiEdit3 size={16} />
              </EditButton>
            )}
          </InfoItem>

          <InfoItem>
            <InfoIcon>
              <FiMapPin size={18} />
            </InfoIcon>
            <InfoContent>
              <InfoLabel>Địa chỉ</InfoLabel>
              <InfoValue>{profile.location || 'Chưa cập nhật'}</InfoValue>
            </InfoContent>
            {isOwnProfile && (
              <EditButton onClick={() => handleEdit('location')}>
                <FiEdit3 size={16} />
              </EditButton>
            )}
          </InfoItem>

          <InfoItem>
            <InfoIcon>
              <FiGlobe size={18} />
            </InfoIcon>
            <InfoContent>
              <InfoLabel>Website</InfoLabel>
              <InfoValue>{profile.website || 'Chưa cập nhật'}</InfoValue>
            </InfoContent>
            {isOwnProfile && (
              <EditButton onClick={() => handleEdit('website')}>
                <FiEdit3 size={16} />
              </EditButton>
            )}
          </InfoItem>
        </InfoSection>

        <InfoSection>
          <SectionTitle>Giới thiệu</SectionTitle>
          <InfoItem>
            <InfoContent>
              <InfoValue style={{ fontStyle: 'italic', color: '#666' }}>
                {profile.bio || 'Chưa có giới thiệu về bản thân'}
              </InfoValue>
            </InfoContent>
            {isOwnProfile && (
              <EditButton onClick={() => handleEdit('bio')}>
                <FiEdit3 size={16} />
              </EditButton>
            )}
          </InfoItem>
        </InfoSection>

      </Content>

      {isEditing && (
        <EditModal>
          <EditModalContent>
            <EditModalHeader>
              <EditModalTitle>
                {editingField === 'full_name' && 'Chỉnh sửa họ tên'}
                {editingField === 'email' && 'Chỉnh sửa email'}
                {editingField === 'phone' && 'Chỉnh sửa số điện thoại'}
                {editingField === 'location' && 'Chỉnh sửa địa chỉ'}
                {editingField === 'website' && 'Chỉnh sửa website'}
                {editingField === 'bio' && 'Chỉnh sửa giới thiệu'}
                {editingField === 'avatar' && 'Thay đổi ảnh đại diện'}
                {editingField === 'cover' && 'Thay đổi ảnh bìa'}
                {editingField === 'settings' && 'Cài đặt'}
              </EditModalTitle>
              <CloseButton onClick={handleCancel}>
                <FiArrowLeft size={18} />
              </CloseButton>
            </EditModalHeader>

            {editingField === 'bio' ? (
              <FormGroup>
                <Label>Giới thiệu về bản thân</Label>
                <TextArea
                  value={profile.bio}
                  onChange={(e) => handleInputChange('bio', e.target.value)}
                  placeholder="Viết vài dòng về bản thân..."
                />
              </FormGroup>
            ) : editingField === 'avatar' ? (
              <FormGroup>
                <Label>Thay đổi ảnh đại diện</Label>
                <div style={{ textAlign: 'center', padding: '2rem' }}>
                  <p>Chức năng thay đổi ảnh đại diện sẽ được phát triển trong tương lai</p>
                </div>
              </FormGroup>
            ) : editingField === 'cover' ? (
              <FormGroup>
                <Label>Thay đổi ảnh bìa</Label>
                <div style={{ textAlign: 'center', padding: '2rem' }}>
                  <p>Chức năng thay đổi ảnh bìa sẽ được phát triển trong tương lai</p>
                </div>
              </FormGroup>
            ) : editingField === 'settings' ? (
              <FormGroup>
                <Label>Cài đặt tài khoản</Label>
                <div style={{ textAlign: 'center', padding: '2rem' }}>
                  <p>Chức năng cài đặt sẽ được phát triển trong tương lai</p>
                </div>
              </FormGroup>
            ) : (
              <FormGroup>
                <Label>
                  {editingField === 'full_name' && 'Họ và tên'}
                  {editingField === 'email' && 'Email'}
                  {editingField === 'phone' && 'Số điện thoại'}
                  {editingField === 'location' && 'Địa chỉ'}
                  {editingField === 'website' && 'Website'}
                </Label>
                <Input
                  type={editingField === 'email' ? 'email' : editingField === 'phone' ? 'tel' : 'text'}
                  value={profile[editingField] || ''}
                  onChange={(e) => handleInputChange(editingField, e.target.value)}
                  placeholder={`Nhập ${editingField === 'full_name' ? 'họ và tên' : editingField === 'email' ? 'email' : editingField === 'phone' ? 'số điện thoại' : editingField === 'location' ? 'địa chỉ' : 'website'}...`}
                />
              </FormGroup>
            )}

            <SaveButton onClick={handleSave} disabled={loading}>
              {loading ? 'Đang lưu...' : 'Lưu thay đổi'}
            </SaveButton>
          </EditModalContent>
        </EditModal>
      )}
    </ProfileContainer>
  );
};

export default ProfilePage;
