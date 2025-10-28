import React, { useState, useEffect, useContext, useMemo, useCallback } from 'react';
import styled from 'styled-components';
import { FiArrowLeft, FiSearch, FiCamera, FiEdit2, FiMoreHorizontal, FiImage, FiClock, FiBriefcase, FiMail, FiRadio, FiGitBranch } from 'react-icons/fi';
import AuthContext from '../../contexts/AuthContext';
import { getInitials } from '../../utils/nameUtils';
import { getAvatarURL } from '../../utils/imageUtils';
import { newsfeedAPI } from '../../utils/api';
import { getApiBaseUrl } from '../../utils/platformConfig';
import CreatePostPage from './CreatePostPage';

const PageContainer = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: var(--bg-primary, white);
  display: flex;
  flex-direction: column;
  z-index: 2000;
`;

const ScrollContent = styled.div`
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding-top: 40px;
  -webkit-overflow-scrolling: touch;
  will-change: scroll-position;
  contain: layout style paint;
`;

const Header = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  background: var(--bg-primary, white);
  padding: 8px 12px;
  display: flex;
  align-items: center;
  gap: 12px;
  box-shadow: 0 1px 3px var(--shadow-color, rgba(0, 0, 0, 0.1));
  z-index: 100;
  height: 40px;
`;

const HeaderRight = styled.div`
  margin-left: auto;
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
  
  &:active {
    opacity: 0.7;
  }
`;

const HeaderTitle = styled.div`
  font-weight: 600;
  font-size: 14px;
  color: var(--text-primary, #333);
  margin-left: 12px;
`;

const BannerContainer = styled.div`
  position: relative;
  width: 100%;
  height: 180px;
  overflow: hidden;
  background: linear-gradient(to right, #B3E5FC 0%, #81C784 100%);
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
`;

const DefaultLogo = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  color: white;
  font-weight: 600;
  text-shadow: 0 2px 6px rgba(0, 0, 0, 0.25);
`;

const LogoText = styled.div`
  font-size: 32px;
  font-weight: 800;
  letter-spacing: 2px;
`;

const DecorativeElements = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const DecorativeDot = styled.div`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.9);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
`;

const DecorativeLine = styled.div`
  width: 40px;
  height: 3px;
  background: rgba(255, 255, 255, 0.8);
  border-radius: 2px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.15);
`;

const LogoElement = styled.div`
  position: relative;
  width: 50px;
  height: 50px;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  gap: 4px;
`;

const LogoBar = styled.div`
  background: rgba(255, 255, 255, 0.9);
  border-radius: 3px;
  width: 14px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
`;

const CameraButtonOverlay = styled.label`
  position: absolute;
  bottom: 12px;
  right: 12px;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 50%;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: var(--text-primary, #333);
  box-shadow: 0 2px 8px var(--shadow-color, rgba(0, 0, 0, 0.15));
  
  input {
    display: none;
  }
  
  &:active {
    opacity: 0.7;
    transform: scale(0.95);
  }
`;

const ProfileSection = styled.div`
  position: relative;
  padding: 50px 0 16px 0;
  background: var(--bg-primary, white);
  margin-bottom: 8px;
  border-radius: 0;
`;

const AvatarContainer = styled.div`
  position: absolute;
  width: 120px;
  height: 120px;
  top: -60px;
  left: 16px;
  z-index: 10;
  display: flex;
  transform: translateZ(0);
  
  @media (max-width: 480px) {
    width: 100px;
    height: 100px;
    top: -50px;
    left: 12px;
  }
`;

const Avatar = styled.div`
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background: ${props => props.gradient || 'linear-gradient(135deg, #FF9800 0%, #FF5722 100%)'};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 40px;
  font-weight: bold;
  color: white;
  border: 4px solid var(--bg-primary, white);
  overflow: hidden;
  box-shadow: 0 2px 8px var(--shadow-color, rgba(0, 0, 0, 0.15));
  
  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;

const AvatarCameraButton = styled.label`
  position: absolute;
  bottom: 0;
  right: 0;
  background: #FF9800;
  border-radius: 50%;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: white;
  border: 3px solid var(--bg-primary, white);
  box-shadow: 0 2px 6px var(--shadow-color, rgba(0, 0, 0, 0.15));
  
  input {
    display: none;
  }
  
  &:active {
    opacity: 0.8;
    transform: scale(0.95);
  }
`;

const UserName = styled.div`
  text-align: left;
  font-size: 22px;
  font-weight: 700;
  color: var(--text-primary, #1a1a1a);
  margin: 16px 0 16px 16px;
  
  @media (max-width: 480px) {
    font-size: 20px;
    margin: 14px 0 14px 12px;
  }
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 8px;
  margin: 0 16px 16px 16px;
  width: calc(100% - 32px);
  
  @media (max-width: 480px) {
    margin: 0 12px 12px 12px;
    width: calc(100% - 24px);
    gap: 6px;
  }
`;

const EditButton = styled.button`
  flex: 1;
  background: #FF9800;
  color: white;
  border: none;
  border-radius: 8px;
  padding: 12px;
  font-weight: 600;
  font-size: 15px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  cursor: pointer;
  transition: all 0.2s;
  
  &:active {
    opacity: 0.85;
    transform: scale(0.98);
  }
`;

const MoreButton = styled.button`
  background: var(--bg-secondary, #e0e0e0);
  color: var(--text-primary, #333);
  border: none;
  border-radius: 50%;
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  
  &:active {
    opacity: 0.7;
  }
`;

const InfoSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 0 16px;
`;

const InfoItem = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  color: var(--text-secondary, #666);
  font-size: 14px;
`;

const InfoIcon = styled.div`
  width: 32px;
  height: 32px;
  background: var(--bg-secondary, #f5f5f5);
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-secondary, #666);
`;

const PostInputSection = styled.div`
  background: var(--bg-primary, white);
  margin: 0 0 8px 0;
  padding: 16px;
  border-bottom: 1px solid var(--border-color, #f0f0f0);
  display: flex;
  flex-direction: column;
`;

const PostInput = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  background: var(--bg-secondary, #f5f5f5);
  border-radius: 24px;
  padding: 10px 16px;
  margin-bottom: 12px;
  cursor: pointer;
  
  &:active {
    background: var(--bg-tertiary, #e8e8e8);
  }
`;

const PostInputText = styled.div`
  color: var(--text-tertiary, #999);
  font-size: 15px;
`;

const MediaButton = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  background: white;
  border: 1.5px solid #4CAF50;
  color: #4CAF50;
  border-radius: 8px;
  padding: 10px 16px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  width: 100%;
  justify-content: center;
  transition: all 0.2s;
  
  &:active {
    background: #f0f8f4;
    opacity: 0.9;
  }
`;

const EndOfPosts = styled.div`
  text-align: center;
  padding: 40px 20px;
  color: var(--text-tertiary, #999);
`;

const EndOfPostsTitle = styled.div`
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 8px;
  color: var(--text-secondary, #666);
`;

const EndOfPostsMessage = styled.div`
  font-size: 14px;
  margin-bottom: 20px;
  color: var(--text-tertiary, #999);
`;

const BackToTopButton = styled.button`
  background: #FF9800;
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

const LoadingState = styled.div`
  text-align: center;
  padding: 40px;
  color: var(--text-tertiary, #999);
`;

const BottomSheetOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 3000;
  display: flex;
  align-items: flex-end;
  animation: fadeIn 0.2s ease-out;
  
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
`;

const DragHandle = styled.div`
  width: 40px;
  height: 4px;
  background: var(--bg-secondary, #e0e0e0);
  border-radius: 2px;
  margin: 8px auto 16px;
`;

const BottomSheet = styled.div`
  background: var(--bg-primary, white);
  border-radius: 20px 20px 0 0;
  padding: 0 20px 20px;
  width: 100%;
  max-height: 300px;
  animation: slideUp 0.3s ease-out;
  
  @keyframes slideUp {
    from { transform: translateY(100%); }
    to { transform: translateY(0); }
  }
`;

const BottomSheetOption = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  cursor: pointer;
  border-radius: 10px;
  transition: background 0.2s;
  
  &:hover {
    background: var(--bg-secondary, #f5f5f5);
  }
  
  &:active {
    background: var(--bg-tertiary, #e8e8e8);
  }
`;

const ProfileIconSVG = styled.svg`
  width: 32px;
  height: 32px;
`;

const GalleryIconSVG = styled.svg`
  width: 32px;
  height: 32px;
`;

const OptionText = styled.div`
  font-size: 15px;
  font-weight: 500;
  color: var(--text-primary, #333);
`;

const ImageViewer = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: #000;
  z-index: 20000;
  display: flex;
  flex-direction: column;
  animation: fadeIn 0.3s ease-out;
`;

const ImageViewerTopBar = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 60px;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 16px;
  z-index: 10;
`;

const ViewerCloseButton = styled.button`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: transparent;
  border: none;
  color: white;
  font-size: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  
  &:active {
    background: rgba(255, 255, 255, 0.1);
  }
`;

const ViewerCounter = styled.div`
  color: white;
  font-size: 15px;
  font-weight: 500;
`;

const ViewerActions = styled.div`
  display: flex;
  gap: 16px;
`;

const ActionIcon = styled.button`
  background: transparent;
  border: none;
  color: white;
  cursor: pointer;
  padding: 8px;
  
  &:active {
    opacity: 0.7;
  }
`;

const ImageViewerContent = styled.div`
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  padding: 60px 0 120px;
  box-sizing: border-box;
`;

const ViewerImageWrapper = styled.div`
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  max-width: 100vw;
`;

const ViewerImage = styled.img`
  width: 100%;
  max-width: 100vw;
  max-height: calc(100vh - 180px);
  object-fit: contain;
`;

const ImageViewerBottomBar = styled.div`
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: rgba(0, 0, 0, 0.7);
  padding: 16px;
  z-index: 10;
`;

const ViewerPostInfo = styled.div`
  color: white;
  margin-bottom: 12px;
`;

const ViewerPostName = styled.div`
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 4px;
`;

const ViewerPostDate = styled.div`
  font-size: 13px;
  color: rgba(255, 255, 255, 0.7);
`;

const ViewerActionButtons = styled.div`
  display: flex;
  gap: 8px;
`;

const ActionButton = styled.button`
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 10px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  color: white;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  
  &:active {
    background: rgba(255, 255, 255, 0.1);
  }
`;

const NotificationModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
  animation: fadeIn 0.2s ease;
  
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
`;

const NotificationModal = styled.div`
  background: var(--bg-primary, white);
  border-radius: 14px;
  width: 300px;
  max-width: 90%;
  box-shadow: 0 8px 32px var(--shadow-color, rgba(0, 0, 0, 0.15));
  animation: slideUp 0.25s ease;
  
  @keyframes slideUp {
    from {
      transform: scale(0.9);
      opacity: 0;
    }
    to {
      transform: scale(1);
      opacity: 1;
    }
  }
`;

const NotificationContent = styled.div`
  padding: 20px;
`;

const NotificationText = styled.div`
  font-size: 15px;
  color: var(--text-primary, #333);
  line-height: 1.4;
  text-align: center;
`;

const NotificationButton = styled.button`
  margin-top: 16px;
  width: 100%;
  padding: 12px;
  background: var(--primary-color, #1877f2);
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  
  &:active {
    opacity: 0.9;
  }
`;

const MediaModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: var(--bg-primary, white);
  z-index: 10001;
  display: flex;
  flex-direction: column;
`;

const MediaHeader = styled.div`
  height: 56px;
  display: flex;
  align-items: center;
  padding: 0 16px;
  border-bottom: 1px solid var(--border-color, #e5e5e5);
`;

const MediaBackButton = styled.button`
  background: none;
  border: none;
  padding: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  color: var(--text-primary, #333);
`;

const MediaTitle = styled.div`
  flex: 1;
  text-align: center;
  font-weight: 600;
  font-size: 18px;
  color: var(--text-primary, #333);
`;

const MediaTabsContainer = styled.div`
  display: flex;
  padding: 8px 16px;
  gap: 8px;
  border-bottom: 1px solid var(--border-color, #e5e5e5);
`;

const MediaTab = styled.div`
  flex: 1;
  padding: 10px;
  text-align: center;
  border-radius: 8px;
  font-size: 15px;
  font-weight: 500;
  cursor: pointer;
  background: ${props => props.active ? '#FF9800' : 'var(--bg-secondary, #f0f0f0)'};
  color: ${props => props.active ? 'white' : 'var(--text-secondary, #666)'};
  
  &:active {
    opacity: 0.7;
  }
`;

const MediaContent = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 16px;
`;

const MediaGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
`;

const MediaItem = styled.div`
  aspect-ratio: 1;
  background: var(--bg-secondary, #f0f0f0);
  border: 1px solid var(--border-color, #e0e0e0);
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
  position: relative;
  
  img, video {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;

const AddMediaItem = styled.label`
  aspect-ratio: 1;
  background: var(--bg-tertiary, #f9f9f9);
  border: 1px dashed var(--border-color, #d0d0d0);
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  position: relative;
  color: var(--text-secondary, #666);
  
  &:active {
    background: var(--bg-secondary, #f0f0f0);
  }
  
  input {
    display: none;
  }
`;

const AddIcon = styled.div`
  font-size: 32px;
  color: #FF9800;
  margin-bottom: 4px;
  font-weight: 300;
`;

const AddText = styled.div`
  font-size: 12px;
  color: var(--text-secondary, #666);
`;

const MobileProfileInformation = ({ user: userProp, onBack, onShowEdit }) => {
  const authContext = useContext(AuthContext);
  const user = authContext?.user || userProp;
  
  // Load initial avatar and cover from localStorage immediately to prevent flash
  const getInitialAvatarUrl = () => {
    const API_BASE_URL = getApiBaseUrl();
    const baseUrl = API_BASE_URL.replace('/api', '');
    
    if (user?.avatar_url) {
      // If already full URL, return as-is
      if (user.avatar_url.startsWith('http')) return user.avatar_url;
      // If relative, construct full URL
      return `${baseUrl}${user.avatar_url}`;
    }
    try {
      const savedUser = localStorage.getItem('user');
      if (savedUser) {
        const parsed = JSON.parse(savedUser);
        const url = parsed.avatar_url || '';
        if (url.startsWith('http')) return url;
        return url ? `${baseUrl}${url}` : '';
      }
    } catch (e) {}
    return '';
  };

  const getInitialCoverUrl = () => {
    const API_BASE_URL = getApiBaseUrl();
    const baseUrl = API_BASE_URL.replace('/api', '');
    
    if (user?.cover_url) {
      // If already full URL, return as-is
      if (user.cover_url.startsWith('http')) return user.cover_url;
      // If relative, construct full URL
      return `${baseUrl}${user.cover_url}`;
    }
    try {
      const savedUser = localStorage.getItem('user');
      if (savedUser) {
        const parsed = JSON.parse(savedUser);
        const url = parsed.cover_url || '';
        if (url.startsWith('http')) return url;
        return url ? `${baseUrl}${url}` : '';
      }
    } catch (e) {}
    return '';
  };
  
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [avatarUrl, setAvatarUrl] = useState(getInitialAvatarUrl());
  const [coverUrl, setCoverUrl] = useState(getInitialCoverUrl());
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [showImageViewer, setShowImageViewer] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [notification, setNotification] = useState(null);
  const [showMediaModal, setShowMediaModal] = useState(false);
  const [activeMediaTab, setActiveMediaTab] = useState('photo');
  const [mediaFiles, setMediaFiles] = useState([]);
  const [viewingMedia, setViewingMedia] = useState(null);
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);
  const [showCreatePost, setShowCreatePost] = useState(false);

  // Sync with AuthContext user changes (only if different from current)
  useEffect(() => {
    const API_BASE_URL = getApiBaseUrl();
    const baseUrl = API_BASE_URL.replace('/api', '');
    
    if (authContext?.user?.cover_url) {
      let authContextCoverUrl = authContext.user.cover_url;
      
      // Convert relative URL to full URL if needed
      if (!authContextCoverUrl.startsWith('http')) {
        authContextCoverUrl = `${baseUrl}${authContextCoverUrl}`;
      }
      
      const authContextCoverBase = authContextCoverUrl.split('?')[0];
      const currentCoverBase = coverUrl.split('?')[0];
      
      if (authContextCoverBase !== currentCoverBase) {
        const cacheBuster = `?t=${Date.now()}`;
        const newCoverUrl = authContextCoverUrl.includes('?') 
          ? authContextCoverUrl 
          : authContextCoverUrl + cacheBuster;
        
        setCoverUrl(newCoverUrl);
      }
    }
    
    if (authContext?.user?.avatar_url) {
      let authContextAvatarUrl = authContext.user.avatar_url;
      
      // Convert relative URL to full URL if needed
      if (!authContextAvatarUrl.startsWith('http')) {
        authContextAvatarUrl = `${baseUrl}${authContextAvatarUrl}`;
      }
      
      const authContextAvatarBase = authContextAvatarUrl.split('?')[0];
      const currentAvatarBase = avatarUrl.split('?')[0];
      
      if (authContextAvatarBase !== currentAvatarBase) {
        const cacheBuster = `?t=${Date.now()}`;
        const newAvatarUrl = authContextAvatarUrl.includes('?') 
          ? authContextAvatarUrl 
          : authContextAvatarUrl + cacheBuster;
        
        setAvatarUrl(newAvatarUrl);
      }
    }
  }, [authContext?.user?.cover_url, authContext?.user?.avatar_url, coverUrl, avatarUrl]);

  // Helper function to show notification
  const showNotification = (message) => {
    setNotification(message);
    setTimeout(() => {
      setNotification(null);
    }, 3000);
  };

  // Load user data with cache busting when URLs change
  useEffect(() => {
    const loadUserData = () => {
      const API_BASE_URL = getApiBaseUrl();
      const baseUrl = API_BASE_URL.replace('/api', '');
      
      if (user?.avatar_url) {
        let avatarUrlToUse = user.avatar_url;
        
        // Convert relative URL to full URL if needed
        if (!avatarUrlToUse.startsWith('http')) {
          avatarUrlToUse = `${baseUrl}${avatarUrlToUse}`;
        }
        
        // Add cache buster only if avatarUrl is empty or different
        if (!avatarUrl || avatarUrl.split('?')[0] !== avatarUrlToUse.split('?')[0]) {
          const cacheBuster = `?t=${Date.now()}`;
          const newAvatarUrl = avatarUrlToUse.includes('?') 
            ? avatarUrlToUse 
            : avatarUrlToUse + cacheBuster;
          setAvatarUrl(newAvatarUrl);
        }
      }
      
      if (user?.cover_url) {
        let coverUrlToUse = user.cover_url;
        
        // Convert relative URL to full URL if needed
        if (!coverUrlToUse.startsWith('http')) {
          coverUrlToUse = `${baseUrl}${coverUrlToUse}`;
        }
        
        // Add cache buster only if coverUrl is empty or different
        if (!coverUrl || coverUrl.split('?')[0] !== coverUrlToUse.split('?')[0]) {
          const cacheBuster = `?t=${Date.now()}`;
          const newCoverUrl = coverUrlToUse.includes('?') 
            ? coverUrlToUse 
            : coverUrlToUse + cacheBuster;
          setCoverUrl(newCoverUrl);
        }
      }
    };
    
    loadUserData();
  }, [user?.avatar_url, user?.cover_url]);

  // Handle cover photo upload
  const handleCoverUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showNotification('Vui lòng chọn file ảnh!');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showNotification('Kích thước ảnh không được vượt quá 5MB!');
      return;
    }

    try {
      setIsUploadingCover(true);

      const formData = new FormData();
      formData.append('cover', file);

      const API_BASE_URL = getApiBaseUrl();
      const uploadUrl = `${API_BASE_URL}/profile/cover`;

      const response = await fetch(uploadUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Upload failed:', errorText);
        
        let errorMessage = 'Không thể tải lên ảnh bìa. ';
        if (response.status === 401) {
          errorMessage += 'Vui lòng đăng nhập lại.';
        } else if (response.status === 404) {
          errorMessage += 'Endpoint không tìm thấy.';
        } else if (response.status === 500) {
          errorMessage += 'Lỗi server. Vui lòng thử lại sau.';
        } else {
          errorMessage += `Lỗi ${response.status}`;
        }
        
        throw new Error(errorMessage);
      }

      const data = await response.json();
      
      if (data.cover_url) {
        let fullCoverUrl;
        
        if (data.cover_url.startsWith('http')) {
          fullCoverUrl = data.cover_url;
        } else {
          const baseUrl = API_BASE_URL.replace('/api', '');
          fullCoverUrl = `${baseUrl}${data.cover_url}`;
        }
        
        const cacheBuster = `?t=${Date.now()}`;
        const urlWithCache = fullCoverUrl + cacheBuster;
        
        // IMPORTANT: Set cover URL with cache buster for display
        setCoverUrl(urlWithCache);
        
        // Store ONLY the relative path (not full URL) for persistence
        // This matches what the database stores
        const relativePath = data.cover_url.startsWith('http') 
          ? data.cover_url.replace(/^https?:\/\/[^/]+/, '')
          : data.cover_url;
        
        // Update localStorage FIRST for persistence
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          try {
            const userObj = JSON.parse(storedUser);
            userObj.cover_url = relativePath; // Store relative path
            localStorage.setItem('user', JSON.stringify(userObj));
          } catch (e) {
            console.error('Error updating localStorage:', e);
          }
        }
        
        // Update AuthContext if available
        if (authContext && authContext.user) {
          const updatedUser = {
            ...authContext.user,
            cover_url: relativePath // Store relative path
          };
          
          // Update AuthContext
          if (authContext.login) {
            const token = localStorage.getItem('token');
            authContext.login(updatedUser, token);
          }
        }
        
        // Also update local user object reference if available
        if (user) {
          user.cover_url = relativePath;
        }
        
        // Show success notification
        showNotification('Cập nhật ảnh bìa thành công!');
      }
    } catch (error) {
      console.error('Error uploading cover photo:', error);
      showNotification('Không thể tải lên ảnh bìa. Vui lòng thử lại.');
    } finally {
      setIsUploadingCover(false);
      // Reset input
      event.target.value = '';
    }
  };

  // Handle avatar click
  const handleAvatarClick = () => {
    setShowAvatarModal(true);
  };

  // Handle view avatar
  const handleViewAvatar = () => {
    setShowAvatarModal(false);
    setShowImageViewer(true);
  };

  // Handle choose avatar
  const handleChooseAvatar = () => {
    setShowAvatarModal(false);
    // Trigger file input
    document.getElementById('avatar-upload-input')?.click();
  };

  // Handle avatar upload
  const handleAvatarUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showNotification('Vui lòng chọn file ảnh!');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showNotification('Kích thước ảnh không được vượt quá 5MB!');
      return;
    }

    try {
      setIsUploadingAvatar(true);
      
      const formData = new FormData();
      formData.append('avatar', file);

      const API_BASE_URL = getApiBaseUrl();
      const uploadUrl = `${API_BASE_URL}/profile/avatar`;
      
      const response = await fetch(uploadUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const data = await response.json();
      
      if (data.avatar_url) {
        let fullAvatarUrl;
        if (data.avatar_url.startsWith('http')) {
          fullAvatarUrl = data.avatar_url;
        } else {
          const baseUrl = API_BASE_URL.replace('/api', '');
          fullAvatarUrl = `${baseUrl}${data.avatar_url}`;
        }
        
        const cacheBuster = `?t=${Date.now()}`;
        setAvatarUrl(fullAvatarUrl + cacheBuster);
        
        if (user) {
          user.avatar_url = fullAvatarUrl + cacheBuster;
        }
        
        // Show success notification
        showNotification('Cập nhật ảnh đại diện thành công!');
      }
    } catch (error) {
      console.error('Error uploading avatar:', error);
      showNotification('Không thể tải lên ảnh đại diện. Vui lòng thử lại.');
    } finally {
      setIsUploadingAvatar(false);
      event.target.value = '';
    }
  };

  // Load posts
  useEffect(() => {
    loadPosts();
  }, []);

  const loadPosts = async () => {
    try {
      setLoading(true);
      const response = await newsfeedAPI.getPosts();
      const allPosts = Array.isArray(response) ? response : response.posts || response.data || [];
      
      // Transform posts to nest user data correctly
      const transformedPosts = allPosts.map(post => {
        // Transform comments to nest user data
        const transformedComments = (post.comments || []).map(comment => ({
          ...comment,
          user: {
            id: comment.user_id,
            username: comment.username,
            full_name: comment.full_name,
            avatar_url: comment.avatar_url
          }
        }));
        
        return {
          ...post,
          user: {
            id: post.user_id,
            username: post.username,
            full_name: post.full_name,
            avatar_url: post.avatar_url,
            status: post.status
          },
          comments: transformedComments
        };
      });
      
      // Filter posts for current user or all posts
      const userPosts = transformedPosts.filter(post => post.user_id === user?.id || post.authorId === user?.id);
      setPosts(userPosts);
    } catch (error) {
      console.error('Error loading posts:', error);
    } finally {
      setLoading(false);
    }
  };

  // Load media files from posts
  useEffect(() => {
    if (showMediaModal) {
      const media = [];
      
      // Add avatar
      if (avatarUrl) {
        media.push({
          type: 'photo',
          url: avatarUrl,
          id: 'avatar'
        });
      }
      
      // Add cover photo
      if (coverUrl) {
        media.push({
          type: 'photo',
          url: coverUrl,
          id: 'cover'
        });
      }
      
      // Add media from posts
      posts.forEach(post => {
        if (post.image_url) {
          media.push({
            type: 'photo',
            url: post.image_url,
            id: post.id || Date.now()
          });
        }
        if (post.video_url) {
          media.push({
            type: 'video',
            url: post.video_url,
            id: post.id || Date.now()
          });
        }
      });
      
      console.log('📸 Media files loaded:', media.length, media);
      setMediaFiles(media);
    }
  }, [showMediaModal, posts, avatarUrl, coverUrl]);

  // Handle media tab click
  const handleMediaTabClick = (tab) => {
    setActiveMediaTab(tab);
  };

  // Handle media file click
  const handleMediaClick = (media) => {
    const currentTabMedia = activeMediaTab === 'photo' 
      ? mediaFiles.filter(m => m.type === 'photo')
      : mediaFiles.filter(m => m.type === 'video');
    
    const index = currentTabMedia.findIndex(m => m.id === media.id);
    setCurrentMediaIndex(index);
    setShowMediaModal(false); // Close media modal first
    setTimeout(() => {
      setViewingMedia(media); // Then open viewer
    }, 300);
  };

  // Handle swipe gesture
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);

  const handleTouchStart = (e) => {
    setTouchEnd(null);
    setTouchStart(e.touches[0].clientX);
  };

  const handleTouchMove = (e) => {
    setTouchEnd(e.touches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe) {
      // Swipe left - go to next image
      goToNextMedia();
    } else if (isRightSwipe) {
      // Swipe right - go to previous image
      goToPreviousMedia();
    }
    
    setTouchStart(null);
    setTouchEnd(null);
  };

  const getFilteredMedia = () => {
    return viewingMedia?.type === 'photo'
      ? mediaFiles.filter(m => m.type === 'photo')
      : mediaFiles.filter(m => m.type === 'video');
  };

  const goToNextMedia = () => {
    const filtered = getFilteredMedia();
    if (filtered.length > 0) {
      const nextIndex = (currentMediaIndex + 1) % filtered.length;
      setCurrentMediaIndex(nextIndex);
      setViewingMedia(filtered[nextIndex]);
    }
  };

  const goToPreviousMedia = () => {
    const filtered = getFilteredMedia();
    if (filtered.length > 0) {
      const nextIndex = currentMediaIndex === 0 ? filtered.length - 1 : currentMediaIndex - 1;
      setCurrentMediaIndex(nextIndex);
      setViewingMedia(filtered[nextIndex]);
    }
  };

  const getAvatarColor = (name) => {
    if (!name) return 'linear-gradient(135deg, #FF9800 0%, #FF5722 100%)';
    const colors = [
      'linear-gradient(135deg, #FF9800 0%, #FF5722 100%)',
      'linear-gradient(135deg, #2196F3 0%, #1976D2 100%)',
      'linear-gradient(135deg, #4CAF50 0%, #2E7D32 100%)',
      'linear-gradient(135deg, #9C27B0 0%, #7B1FA2 100%)',
      'linear-gradient(135deg, #E91E63 0%, #C2185B 100%)',
    ];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  };

  const formatTime = () => {
    const now = new Date();
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const isMorning = hours < 12;
    const period = isMorning ? 'sáng' : now.getHours() < 18 ? 'chiều' : 'tối';
    return `${hours}:${minutes} ${period} Giờ địa phương`;
  };

  const formatDate = () => {
    const now = new Date();
    return now.toLocaleDateString('vi-VN', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric' 
    });
  };

  return (
    <PageContainer>
      <Header>
        <HeaderButton onClick={onBack}>
          <FiArrowLeft size={20} />
        </HeaderButton>
        <HeaderTitle>{user?.full_name || user?.fullName || 'Hồ sơ'}</HeaderTitle>
        <HeaderRight>
          <HeaderButton>
            <FiSearch size={20} />
          </HeaderButton>
        </HeaderRight>
      </Header>

      <ScrollContent>
        <BannerContainer>
        <BannerImage 
          background={coverUrl ? `url(${coverUrl})` : ''} 
          style={{
            backgroundImage: coverUrl ? `url(${coverUrl})` : 'none',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat'
          }}
        >
          {!coverUrl && (
            <DefaultLogo>
              <LogoText>Zyea+</LogoText>
              <DecorativeElements>
                <DecorativeDot />
                <DecorativeLine />
                <DecorativeDot />
              </DecorativeElements>
            </DefaultLogo>
          )}
        </BannerImage>
        <CameraButtonOverlay htmlFor="cover-upload" title={isUploadingCover ? 'Đang tải lên...' : 'Thay đổi ảnh bìa'}>
          <input 
            type="file" 
            id="cover-upload" 
            accept="image/*" 
            onChange={handleCoverUpload}
            disabled={isUploadingCover}
          />
          <FiCamera size={18} />
        </CameraButtonOverlay>
      </BannerContainer>

      <ProfileSection>
        <AvatarContainer onClick={handleAvatarClick} style={{ cursor: 'pointer' }}>
          <Avatar gradient={getAvatarColor(user?.full_name || user?.fullName)}>
            {avatarUrl ? (
              <img src={getAvatarURL(avatarUrl)} alt={user?.full_name || 'Avatar'} />
            ) : (
              getInitials(user?.full_name || user?.fullName)
            )}
          </Avatar>
          <AvatarCameraButton 
            htmlFor="avatar-upload-input" 
            title="Thay đổi ảnh đại diện"
            onClick={(e) => e.stopPropagation()}
          >
            <input type="file" id="avatar-upload-input" accept="image/*" onChange={handleAvatarUpload} />
            <FiCamera size={14} />
          </AvatarCameraButton>
        </AvatarContainer>

        <UserName>{user?.full_name || user?.fullName || 'Người dùng'}</UserName>

        <ActionButtons>
          <EditButton onClick={onShowEdit}>
            <FiEdit2 size={16} />
            Chỉnh sửa thông tin
          </EditButton>
          <MoreButton>
            <FiMoreHorizontal size={20} />
          </MoreButton>
        </ActionButtons>

        <InfoSection>
          <InfoItem onClick={() => setShowMediaModal(true)} style={{ cursor: 'pointer' }}>
            <InfoIcon>
              <FiImage size={16} />
            </InfoIcon>
            <span>File phương tiện</span>
          </InfoItem>
          
          <InfoItem>
            <InfoIcon>
              <FiClock size={16} />
            </InfoIcon>
            <span>{formatTime()}</span>
          </InfoItem>
          
          {user?.department && (
            <InfoItem>
              <InfoIcon>
                <FiBriefcase size={16} />
              </InfoIcon>
              <span>{user.department}</span>
            </InfoItem>
          )}
          
          {user?.email && (
            <InfoItem>
              <InfoIcon>
                <FiMail size={16} />
              </InfoIcon>
              <span>{user.email}</span>
            </InfoItem>
          )}
          
          <InfoItem>
            <InfoIcon>
              <FiRadio size={16} />
            </InfoIcon>
            <span>Có {user?.followers?.length || 0} người theo dõi</span>
          </InfoItem>
          
          <InfoItem>
            <InfoIcon>
              <FiGitBranch size={16} />
            </InfoIcon>
            <span>Sơ đồ tổ chức</span>
          </InfoItem>
        </InfoSection>
      </ProfileSection>

      <PostInputSection>
        <PostInput onClick={() => setShowCreatePost(true)}>
          <Avatar 
            gradient={getAvatarColor(user?.full_name || user?.fullName)}
            style={{ width: '36px', height: '36px', fontSize: '14px', border: 'none' }}
          >
            {avatarUrl ? (
              <img src={getAvatarURL(avatarUrl)} alt="Avatar" />
            ) : (
              getInitials(user?.full_name || user?.fullName)
            )}
          </Avatar>
          <PostInputText>Bạn đang nghĩ gì?</PostInputText>
        </PostInput>
        <MediaButton onClick={() => setShowCreatePost(true)}>
          <FiImage size={16} />
          Hình ảnh / Video
        </MediaButton>
      </PostInputSection>

      {loading ? (
        <LoadingState>Đang tải...</LoadingState>
      ) : posts.length === 0 ? (
        <EndOfPosts>
          <EndOfPostsTitle>Đã xem hết các bài viết</EndOfPostsTitle>
          <EndOfPostsMessage>
            Bạn đã xem hết các bài viết hiện có. Tải lại trang để khám phá thêm!
          </EndOfPostsMessage>
          <BackToTopButton onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            Quay lại đầu trang
          </BackToTopButton>
        </EndOfPosts>
      ) : (
        posts.map((post, index) => (
          <div key={post.id || index} style={{ padding: '8px', background: 'var(--bg-primary, white)', marginBottom: '8px' }}>
            {/* Post content would go here */}
            <div style={{ padding: '16px' }}>
              <div style={{ marginBottom: '8px', color: 'var(--text-primary, #333)' }}>
                {post.content || 'Bài viết'}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-tertiary, #999)' }}>
                {post.created_at ? new Date(post.created_at).toLocaleString('vi-VN') : ''}
              </div>
            </div>
          </div>
        ))
      )}

      {posts.length > 0 && (
        <EndOfPosts>
          <EndOfPostsTitle>Đã xem hết các bài viết</EndOfPostsTitle>
          <EndOfPostsMessage>
            Bạn đã xem hết các bài viết hiện có. Tải lại trang để khám phá thêm!
          </EndOfPostsMessage>
          <BackToTopButton onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            Quay lại đầu trang
          </BackToTopButton>
        </EndOfPosts>
      )}
      </ScrollContent>

      {/* Avatar Modal Bottom Sheet */}
      {showAvatarModal && (
        <BottomSheetOverlay onClick={() => setShowAvatarModal(false)}>
          <BottomSheet onClick={(e) => e.stopPropagation()}>
            <DragHandle />
            <BottomSheetOption onClick={handleViewAvatar}>
              <ProfileIconSVG viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="8" r="4"></circle>
                <path d="M12 12v8"></path>
                <path d="M8 22h8"></path>
              </ProfileIconSVG>
              <OptionText>Xem ảnh đại diện</OptionText>
            </BottomSheetOption>
            <BottomSheetOption onClick={handleChooseAvatar}>
              <GalleryIconSVG viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                <circle cx="8.5" cy="8.5" r="1.5"></circle>
                <path d="M21 15l-5-5L5 21"></path>
              </GalleryIconSVG>
              <OptionText>Chọn ảnh đại diện</OptionText>
            </BottomSheetOption>
          </BottomSheet>
        </BottomSheetOverlay>
      )}

      {/* Image Viewer */}
      {showImageViewer && avatarUrl && (
        <ImageViewer>
          <ImageViewerTopBar>
            <ViewerCloseButton onClick={() => setShowImageViewer(false)}>
              ✕
            </ViewerCloseButton>
            <ViewerCounter>1/1</ViewerCounter>
            <ViewerActions>
              <ActionIcon>
                <FiImage size={20} />
              </ActionIcon>
            </ViewerActions>
          </ImageViewerTopBar>

          <ImageViewerContent>
            <ViewerImageWrapper>
              <ViewerImage 
                src={getAvatarURL(avatarUrl)} 
                alt="Avatar"
              />
            </ViewerImageWrapper>
          </ImageViewerContent>

          <ImageViewerBottomBar>
            <ViewerPostInfo>
              <ViewerPostName>{user?.full_name || user?.fullName || 'Người dùng'}</ViewerPostName>
              <ViewerPostDate>
                {new Date().toLocaleDateString('vi-VN', { 
                  day: 'numeric', 
                  month: 'long', 
                  year: 'numeric' 
                })}
              </ViewerPostDate>
            </ViewerPostInfo>
            <ViewerActionButtons>
              <ActionButton>
                ❤️ Yêu thích
              </ActionButton>
              <ActionButton>
                💬 Bình luận
              </ActionButton>
              <ActionButton>
                📤 Chia sẻ
              </ActionButton>
            </ViewerActionButtons>
          </ImageViewerBottomBar>
        </ImageViewer>
      )}

      {/* Media Viewer */}
      {viewingMedia && (() => {
        const filteredMedia = viewingMedia?.type === 'photo'
          ? mediaFiles.filter(m => m.type === 'photo')
          : mediaFiles.filter(m => m.type === 'video');
        const totalCount = filteredMedia.length;
        const currentPosition = currentMediaIndex + 1;
        
        return (
          <ImageViewer
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            <ImageViewerTopBar>
              <ViewerCloseButton onClick={() => setViewingMedia(null)}>
                ✕
              </ViewerCloseButton>
              <ViewerCounter>{totalCount > 0 ? `${currentPosition}/${totalCount}` : '1/1'}</ViewerCounter>
              <ViewerActions>
                <ActionIcon>
                  <FiImage size={20} />
                </ActionIcon>
              </ViewerActions>
            </ImageViewerTopBar>

            <ImageViewerContent>
              <ViewerImageWrapper>
                {viewingMedia.type === 'photo' ? (
                  <ViewerImage 
                    src={getAvatarURL(viewingMedia.url)} 
                    alt="Media"
                    style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                  />
                ) : (
                  <video 
                    src={viewingMedia.url} 
                    controls
                    style={{ width: '100%', height: '100%' }}
                  />
                )}
              </ViewerImageWrapper>
            </ImageViewerContent>

            <ImageViewerBottomBar>
              <ViewerPostInfo>
                <ViewerPostName>{user?.full_name || user?.fullName || 'Người dùng'}</ViewerPostName>
                <ViewerPostDate>
                  {new Date().toLocaleDateString('vi-VN', { 
                    day: 'numeric', 
                    month: 'long', 
                    year: 'numeric' 
                  })}
                </ViewerPostDate>
              </ViewerPostInfo>
              <ViewerActionButtons>
                <ActionButton>
                  ❤️ Yêu thích
                </ActionButton>
                <ActionButton>
                  💬 Bình luận
                </ActionButton>
                <ActionButton>
                  📤 Chia sẻ
                </ActionButton>
              </ViewerActionButtons>
            </ImageViewerBottomBar>
          </ImageViewer>
        );
      })()}

      {/* Notification Modal */}
      {notification && (
        <NotificationModalOverlay onClick={() => setNotification(null)}>
          <NotificationModal onClick={(e) => e.stopPropagation()}>
            <NotificationContent>
              <NotificationText>{notification}</NotificationText>
              <NotificationButton onClick={() => setNotification(null)}>
                Đóng
              </NotificationButton>
            </NotificationContent>
          </NotificationModal>
        </NotificationModalOverlay>
      )}

      {/* Media Modal */}
      {showMediaModal && (
        <MediaModalOverlay>
          <MediaHeader>
            <MediaBackButton onClick={() => setShowMediaModal(false)}>
              <FiArrowLeft size={24} />
            </MediaBackButton>
            <MediaTitle>File phương tiện</MediaTitle>
            <div style={{ width: 40 }}></div>
          </MediaHeader>

          <MediaTabsContainer>
            <MediaTab 
              active={activeMediaTab === 'photo'} 
              onClick={() => handleMediaTabClick('photo')}
            >
              Photo
            </MediaTab>
            <MediaTab 
              active={activeMediaTab === 'video'} 
              onClick={() => handleMediaTabClick('video')}
            >
              Video
            </MediaTab>
            <MediaTab 
              active={activeMediaTab === 'album'} 
              onClick={() => handleMediaTabClick('album')}
            >
              Album
            </MediaTab>
          </MediaTabsContainer>

          <MediaContent>
            <MediaGrid>
              {activeMediaTab === 'photo' && (
                <>
                  <AddMediaItem>
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={(e) => {
                        // Handle add photo
                        console.log('Add photo', e.target.files);
                      }} 
                    />
                    <AddIcon>+</AddIcon>
                    <AddText>Thêm ảnh</AddText>
                  </AddMediaItem>
                  
                  {mediaFiles
                    .filter(media => media.type === 'photo')
                    .map((media, index) => {
                      console.log('Rendering photo:', media);
                      return (
                        <MediaItem key={media.id || index} onClick={() => handleMediaClick(media)}>
                          <img src={getAvatarURL(media.url)} alt={`Photo ${index + 1}`} />
                        </MediaItem>
                      );
                    })}
                </>
              )}

              {activeMediaTab === 'video' && (
                <>
                  <AddMediaItem>
                    <input 
                      type="file" 
                      accept="video/*" 
                      onChange={(e) => {
                        // Handle add video
                        console.log('Add video', e.target.files);
                      }} 
                    />
                    <AddIcon>+</AddIcon>
                    <AddText>Thêm video</AddText>
                  </AddMediaItem>
                  
                  {mediaFiles
                    .filter(media => media.type === 'video')
                    .map((media, index) => {
                      console.log('Rendering video:', media);
                      return (
                        <MediaItem key={media.id || index} onClick={() => handleMediaClick(media)}>
                          <video src={media.url} />
                        </MediaItem>
                      );
                    })}
                </>
              )}

              {activeMediaTab === 'album' && (
                <div style={{ gridColumn: 'span 3', textAlign: 'center', padding: '40px 0', color: 'var(--text-tertiary, #999)' }}>
                  Tính năng Album sẽ sớm có mặt
                </div>
              )}
            </MediaGrid>
          </MediaContent>
        </MediaModalOverlay>
      )}

      {/* Create Post Page */}
      {showCreatePost && (
        <CreatePostPage
          user={user}
          onBack={() => setShowCreatePost(false)}
          onPostCreated={() => {
            loadPosts();
            setShowCreatePost(false);
          }}
        />
      )}
    </PageContainer>
  );
};

export default MobileProfileInformation;

