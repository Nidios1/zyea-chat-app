import React, { useState, useRef, useEffect, useContext, useMemo, useCallback } from 'react';
import styled from 'styled-components';
import { 
  FiUser, 
  FiFileText,
  FiActivity,
  FiFilter,
  FiBookmark,
  FiMonitor,
  FiShield,
  FiDatabase,
  FiBell,
  FiSun,
  FiMoon,
  FiType,
  FiChevronLeft,
  FiChevronRight,
  FiMessageSquare,
  FiHelpCircle,
  FiLogOut,
  FiCamera,
  FiCheck
} from 'react-icons/fi';
import { BiQrScan } from 'react-icons/bi';
import AuthContext from '../../../contexts/AuthContext';
import { chatAPI } from '../../../utils/api';
import { getInitials } from '../../../utils/nameUtils';
import { useTheme } from '../../../contexts/ThemeContext';
import { getAvatarURL, getUploadedImageURL } from '../../../utils/imageUtils';
import { getApiBaseUrl } from '../../../utils/platformConfig';
import { getCurrentVersion } from '../../../utils/liveUpdate';
import MobileProfileInformation from '../../Mobile/MobileProfileInformation';

const PersonalProfileContainer = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  /* Use dynamic viewport height */
  height: calc(var(--vh, 1vh) * 100);
  min-height: 100vh;
  background: var(--bg-primary, #000000);
  z-index: 1000;
  overflow: hidden;
  
  /* REMOVED: Don't add padding here to prevent large empty space */
  /* Let child components handle bottom spacing */
`;

const Header = styled.div`
  background: transparent;
  padding: 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-shrink: 0;
  
  /* Safe area for iPhone notch/Dynamic Island */
  @media (max-width: 768px) {
    padding-top: calc(16px + env(safe-area-inset-top));
    padding-left: 12px;
    padding-right: 12px;
  }
  
  @media (max-width: 480px) {
    padding-left: 8px;
    padding-right: 8px;
    gap: 8px;
  }
`;

const HeaderProfile = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: ${props => props.isScrolled ? '0px' : '8px'};
  transition: gap 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  transform: translateZ(0);
  
  @media (max-width: 480px) {
    gap: ${props => props.isScrolled ? '0px' : '6px'};
  }
`;

const AvatarWrapper = styled.div`
  position: relative;
  width: ${props => props.isScrolled ? '0px' : '64px'};
  height: ${props => props.isScrolled ? '0px' : '64px'};
  opacity: ${props => props.isScrolled ? '0' : '1'};
  transition: width 0.25s cubic-bezier(0.4, 0, 0.2, 1), 
              height 0.25s cubic-bezier(0.4, 0, 0.2, 1), 
              opacity 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  transform: translateZ(0);
  will-change: width, height, opacity;
  backface-visibility: hidden;
  
  @media (max-width: 480px) {
    width: ${props => props.isScrolled ? '0px' : '56px'};
    height: ${props => props.isScrolled ? '0px' : '56px'};
  }
`;

const HeaderAvatar = styled.div`
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background: var(--primary-gradient, linear-gradient(135deg, #0068ff 0%, #00a651 100%));
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  color: white;
  font-size: 28px;
  overflow: hidden;
  flex-shrink: 0;
  
  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;

const CameraButton = styled.label`
  position: absolute;
  bottom: 0;
  right: 0;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: var(--primary-color, #0068ff);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  border: 2px solid var(--bg-primary, white);
  box-shadow: 0 2px 4px var(--shadow-color, rgba(0, 0, 0, 0.2));
  transition: all 0.2s ease;

  &:hover {
    background: var(--accent-color, #0056cc);
    transform: scale(1.1);
  }

  &:active {
    transform: scale(0.95);
  }

  svg {
    color: white;
    font-size: 12px;
  }
`;

const HiddenFileInput = styled.input`
  display: none;
`;

const HeaderInfo = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 0;
  text-align: center;
`;

const HeaderName = styled.div`
  font-size: 17px;
  font-weight: 600;
  color: var(--text-primary, #000);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 200px;
  
  @media (max-width: 480px) {
    font-size: 16px;
    max-width: 160px;
  }
`;

const HeaderUsername = styled.div`
  font-size: 13px;
  color: var(--text-secondary, #666);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 200px;
  
  @media (max-width: 480px) {
    font-size: 12px;
    max-width: 160px;
  }
`;

const BackButton = styled.button`
  background: none;
  border: none;
  color: var(--text-primary, #333);
  padding: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  
  &:active {
    opacity: 0.7;
  }
`;

const QRButton = styled.button`
  background: none;
  border: none;
  color: var(--text-primary, #333);
  padding: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  
  &:active {
    opacity: 0.7;
  }
`;


const MenuSection = styled.div`
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  background: var(--bg-secondary, #f5f5f5);
  padding: 8px 16px 20px;
  -webkit-overflow-scrolling: touch;
  will-change: scroll-position;
  transform: translateZ(0);
  overscroll-behavior: contain;
  contain: layout style paint;
  
  /* Add extra padding on mobile to prevent BottomNav overlap */
  @media (max-width: 768px) {
    padding-bottom: calc(68px + env(safe-area-inset-bottom, 0));
    /* 68px = BottomNav height + spacing */
    padding-left: 12px;
    padding-right: 12px;
  }
  
  @media (max-width: 480px) {
    padding-left: 8px;
    padding-right: 8px;
    padding-top: 4px;
  }
`;

const MenuGroup = styled.div`
  background: var(--bg-primary, white);
  border-radius: 12px;
  margin-bottom: 12px;
  overflow: hidden;
  
  @media (max-width: 480px) {
    border-radius: 10px;
    margin-bottom: 10px;
  }
`;

const MenuItem = styled.div`
  padding: 14px 16px;
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  background: var(--bg-primary, white);
  transition: background 0.15s ease-out;
  border-bottom: ${props => props.isLast ? 'none' : '1px solid var(--border-color, #f0f0f0)'};
  -webkit-tap-highlight-color: transparent;
  transform: translateZ(0);
  backface-visibility: hidden;
  will-change: background;
  
  @media (max-width: 480px) {
    padding: 12px 14px;
    gap: 10px;
  }
  
  &:active {
    background: var(--bg-secondary, #f8f8f8);
  }
`;

const MenuIcon = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  color: var(--text-primary, #333);
  width: 24px;
  flex-shrink: 0;
  
  @media (max-width: 480px) {
    font-size: 18px;
    width: 20px;
  }
`;

const MenuTitle = styled.div`
  flex: 1;
  font-size: 15px;
  color: var(--text-primary, #000);
  font-weight: 400;
  min-width: 0;
  
  @media (max-width: 480px) {
    font-size: 14px;
  }
`;

const MenuRight = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: var(--text-tertiary, #999);
  flex-shrink: 0;
  
  @media (max-width: 480px) {
    font-size: 12px;
    gap: 6px;
  }
`;

const StatusBadge = styled.span`
  color: var(--primary-color, #00a651);
  font-size: 13px;
  display: flex;
  align-items: center;
  gap: 4px;
  
  &::before {
    content: '';
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: var(--primary-color, #00a651);
  }
`;

const Footer = styled.div`
  background: var(--bg-secondary, #f5f5f5);
  padding: 20px 16px;
  margin-top: 12px;
  text-align: center;
  font-size: 12px;
  color: var(--text-tertiary, #999);
  line-height: 1.5;
`;

// Activity Status Page Components
const ActivityStatusPage = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: var(--bg-secondary, #f5f5f5);
  z-index: 10000;
  display: flex;
  flex-direction: column;
`;

const ActivityStatusHeader = styled.div`
  background: transparent;
  padding: 12px 16px;
  display: flex;
  align-items: center;
  gap: 16px;
  border-bottom: none;
  
  /* Safe area for iPhone notch/Dynamic Island */
  @media (max-width: 768px) {
    padding-top: calc(12px + env(safe-area-inset-top));
  }
`;

const ActivityStatusTitle = styled.div`
  flex: 1;
  font-size: 17px;
  font-weight: 600;
  color: var(--text-primary, #000);
  text-align: center;
  margin-right: 40px;
`;

const ActivityStatusContent = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 0;
`;

const ActivityStatusCard = styled.div`
  background: var(--bg-primary, white);
  margin: 16px;
  border-radius: 12px;
  padding: 16px;
`;

const ToggleRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
`;

const ToggleLabel = styled.div`
  font-size: 15px;
  color: var(--text-primary, #000);
  font-weight: 500;
`;

const ToggleSwitch = styled.label`
  position: relative;
  display: inline-block;
  width: 51px;
  height: 31px;
  flex-shrink: 0;
  cursor: pointer;
  
  @media (max-width: 480px) {
    width: 48px;
    height: 28px;
  }
`;

const ToggleInput = styled.input`
  opacity: 0;
  width: 0;
  height: 0;

  &:checked + span {
    background-color: var(--primary-color, #0068ff);
  }

  &:checked + span:before {
    transform: translateX(20px);
  }
`;

const ToggleSlider = styled.span`
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #ccc;
  transition: 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border-radius: 31px;

  &:before {
    position: absolute;
    content: "";
    height: 27px;
    width: 27px;
    left: 2px;
    bottom: 2px;
    background-color: white;
    transition: 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    border-radius: 50%;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  }
  
  @media (max-width: 480px) {
    &:before {
      height: 24px;
      width: 24px;
    }
  }
`;

const ToggleDescription = styled.div`
  margin-top: 12px;
  font-size: 13px;
  color: var(--text-secondary, #666);
  line-height: 1.5;
`;

// Bottom Sheet Components
const BottomSheetOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 10001;
  display: flex;
  align-items: flex-end;
  animation: fadeIn 0.25s ease-out;

  @keyframes fadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }
`;

const BottomSheet = styled.div`
  background: var(--bg-primary, white);
  border-radius: 16px 16px 0 0;
  width: 100%;
  max-height: 70vh;
  overflow-y: auto;
  animation: slideUp 0.3s ease-out;
  padding-bottom: env(safe-area-inset-bottom);

  @keyframes slideUp {
    from {
      transform: translateY(100%);
    }
    to {
      transform: translateY(0);
    }
  }
`;

const BottomSheetHeader = styled.div`
  padding: 16px 20px;
  border-bottom: 1px solid var(--border-color, #e8e8e8);
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary, #000);
  text-align: center;
  position: sticky;
  top: 0;
  background: var(--bg-primary, white);
  z-index: 1;
`;

const BottomSheetOption = styled.div`
  padding: 16px 20px;
  border-bottom: 1px solid var(--border-color, #f0f0f0);
  cursor: pointer;
  font-size: 15px;
  color: var(--text-primary, #000);
  background: var(--bg-primary, white);
  transition: background 0.1s ease-out;

  &:last-child {
    border-bottom: none;
  }

  &:active {
    background: var(--bg-secondary, #f8f8f8);
  }
`;

// Interface Settings Page Components
const InterfaceSettingsPage = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: var(--bg-secondary, #f5f5f5);
  z-index: 10000;
  display: flex;
  flex-direction: column;
`;

const InterfaceSettingsHeader = styled.div`
  background: transparent;
  padding: 12px 16px;
  display: flex;
  align-items: center;
  gap: 16px;
  border-bottom: none;
  
  /* Safe area for iPhone notch/Dynamic Island */
  @media (max-width: 768px) {
    padding-top: calc(12px + env(safe-area-inset-top));
  }
`;

const InterfaceSettingsTitle = styled.div`
  flex: 1;
  font-size: 17px;
  font-weight: 600;
  color: var(--text-primary, #000);
  text-align: center;
  margin-right: 40px;
`;

const InterfaceSettingsContent = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 16px;
`;

const SettingsSection = styled.div`
  margin-bottom: 20px;
`;

const SectionTitle = styled.div`
  font-size: 13px;
  color: var(--text-secondary, #666);
  margin-bottom: 12px;
  padding: 0 4px;
  font-weight: 500;
`;

const ThemeColorCard = styled.div`
  background: var(--bg-primary, white);
  border-radius: 10px;
  padding: 10px;
`;

const ThemeColorGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
  max-width: 240px;
  margin: 0 auto;
`;

const ThemeColorOption = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 5px;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  
  &:active {
    opacity: 0.8;
  }
`;

const ThemeColorBox = styled.div`
  width: 100%;
  aspect-ratio: 1;
  border-radius: 8px;
  background: var(--bg-tertiary, #2a2a2a);
  display: flex;
  align-items: flex-end;
  justify-content: center;
  padding: 5px;
  border: ${props => props.selected ? '2px solid #0068ff' : '2px solid rgba(128, 128, 128, 0.3)'};
  transition: all 0.2s ease;
  position: relative;
  box-shadow: ${props => props.selected 
    ? '0 0 0 2px rgba(0, 104, 255, 0.15)' 
    : 'none'};
`;

const ThemeColorPreview = styled.div`
  width: 100%;
  height: 12px;
  border-radius: 4px;
  background: ${props => props.gradient};
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.15);
`;

const ThemeColorLabel = styled.div`
  font-size: 10px;
  color: var(--text-secondary, #999);
  font-weight: 400;
  text-align: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  width: 100%;
`;

const ThemeModeCard = styled.div`
  background: var(--bg-primary, white);
  border-radius: 12px;
  overflow: hidden;
`;

const ThemeModeOption = styled.div`
  padding: 16px;
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  background: var(--bg-primary, white);
  border-bottom: ${props => props.isLast ? 'none' : '1px solid var(--border-color, #f0f0f0)'};
  -webkit-tap-highlight-color: transparent;
  
  &:active {
    background: var(--bg-secondary, #f8f8f8);
  }
`;

const ThemeModeIcon = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  color: var(--text-primary, #333);
  width: 24px;
`;

const ThemeModeText = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

const ThemeModeTitle = styled.div`
  font-size: 15px;
  color: var(--text-primary, #000);
  font-weight: 400;
`;

const ThemeModeDescription = styled.div`
  font-size: 13px;
  color: var(--text-secondary, #666);
`;

const ThemeModeCheck = styled.div`
  color: var(--primary-color, #0068ff);
  font-size: 20px;
  display: ${props => props.show ? 'flex' : 'none'};
  align-items: center;
  justify-content: center;
`;

const PersonalProfilePage = ({ user: userProp, onBack, onActivityStatusChange }) => {
  const authContext = useContext(AuthContext);
  const { themeMode, themeColor, setTheme, setColor } = useTheme();
  
  // Ưu tiên dùng user từ AuthContext, fallback sang prop
  const user = authContext?.user || userProp;
  
  // Load initial avatar from localStorage to prevent flash
  const getInitialAvatarUrl = () => {
    if (userProp?.avatar_url) return userProp.avatar_url;
    if (authContext?.user?.avatar_url) return authContext.user.avatar_url;
    try {
      const savedUser = localStorage.getItem('user');
      if (savedUser) {
        const parsed = JSON.parse(savedUser);
        return parsed.avatar_url || '';
      }
    } catch (e) {}
    return '';
  };
  
  const [activityStatus, setActivityStatus] = useState(true);
  const [isScrolled, setIsScrolled] = useState(false);
  const [showActivityStatusPage, setShowActivityStatusPage] = useState(false);
  const [showInterfaceSettings, setShowInterfaceSettings] = useState(false);
  const [showTimeOptions, setShowTimeOptions] = useState(false);
  const [showProfileInformation, setShowProfileInformation] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState(getInitialAvatarUrl());
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const menuSectionRef = useRef(null);
  const fileInputRef = useRef(null);
  
  // Memoize user data to prevent unnecessary re-renders
  const userData = useMemo(() => ({
    name: user?.full_name || user?.fullName || user?.username || 'Người dùng',
    username: user?.username || 'FEC',
    userId: user?.id
  }), [user?.full_name, user?.fullName, user?.username, user?.id]);
  
  // Memoize initial avatar
  const initialAvatarUrl = useMemo(() => getInitialAvatarUrl(), [user?.avatar_url]);

  // Update avatar URL when user changes
  useEffect(() => {
    if (user?.avatar_url) {
      // Add cache busting if URL doesn't already have query params
      const url = user.avatar_url;
      if (url.includes('?')) {
        setAvatarUrl(url);
      } else {
        setAvatarUrl(`${url}?t=${Date.now()}`);
      }
    } else {
      setAvatarUrl('');
    }
  }, [user?.id, user?.avatar_url]); // Run when user ID or avatar URL changes

  useEffect(() => {
    const menuElement = menuSectionRef.current;
    if (!menuElement) return;
    
    let ticking = false;
    let lastScrollTop = 0;
    
    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          if (menuSectionRef.current) {
            const scrollTop = menuSectionRef.current.scrollTop;
            const shouldScroll = scrollTop > 30;
            
            // Only update state if it actually changed and scroll direction changed significantly
            if (Math.abs(scrollTop - lastScrollTop) > 5) {
              setIsScrolled(prevState => {
                if (prevState !== shouldScroll) {
                  return shouldScroll;
                }
                return prevState;
              });
            }
            lastScrollTop = scrollTop;
          }
          ticking = false;
        });
        ticking = true;
      }
    };

    menuElement.addEventListener('scroll', handleScroll, { passive: true });
    
    return () => {
      menuElement.removeEventListener('scroll', handleScroll);
    };
  }, []);

  // Notify parent when ActivityStatusPage or InterfaceSettings opens/closes
  useEffect(() => {
    if (onActivityStatusChange) {
      onActivityStatusChange(showActivityStatusPage || showTimeOptions || showInterfaceSettings || showProfileInformation);
    }
  }, [showActivityStatusPage, showTimeOptions, showInterfaceSettings, showProfileInformation, onActivityStatusChange]);

  const handleAvatarChange = useCallback(async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Vui lòng chọn file ảnh!');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Kích thước ảnh không được vượt quá 5MB!');
      return;
    }

    try {
      setIsUploadingAvatar(true);

      const formData = new FormData();
      formData.append('avatar', file);

      // Use platformConfig to get correct API URL
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
        const errorText = await response.text();
        console.error('❌ Upload failed:', errorText);
        throw new Error(`Upload failed: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      
      if (data.avatar_url) {
        // Construct full URL for avatar with cache busting
        let fullAvatarUrl;
        
        if (data.avatar_url.startsWith('http')) {
          // Already full URL
          fullAvatarUrl = data.avatar_url;
        } else {
          // Relative URL - construct full URL
          const baseUrl = API_BASE_URL.replace('/api', ''); // Remove /api suffix
          fullAvatarUrl = `${baseUrl}${data.avatar_url}`;
        }
        
        // Add cache busting timestamp
        const cacheBuster = `?t=${Date.now()}`;
        const urlWithCache = fullAvatarUrl + cacheBuster;
        
        // Force update avatar URL - this triggers re-render
        setAvatarUrl(urlWithCache);
        
        // Update user object in AuthContext if available
        if (authContext && authContext.user) {
          const updatedUser = {
            ...authContext.user,
            avatar_url: fullAvatarUrl // Store without cache buster
          };
          
          // Update AuthContext
          if (authContext.login) {
            const token = localStorage.getItem('token');
            authContext.login(updatedUser, token);
          }
        }
        
        // Update localStorage for persistence
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          try {
            const userObj = JSON.parse(storedUser);
            userObj.avatar_url = fullAvatarUrl;
            localStorage.setItem('user', JSON.stringify(userObj));
          } catch (e) {
            console.error('Error updating localStorage:', e);
          }
        }
        
        alert('✅ Cập nhật ảnh đại diện thành công!');
      }
    } catch (error) {
      console.error('❌ Error uploading avatar:', error);
      alert(`❌ Có lỗi xảy ra khi tải ảnh lên:\n${error.message}\n\nVui lòng kiểm tra:\n- Kết nối mạng\n- Server đang chạy\n- Đã đăng nhập`);
    } finally {
      setIsUploadingAvatar(false);
      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  }, [authContext]);

  const handleActivityStatusToggle = useCallback((checked) => {
    if (!checked) {
      // Khi tắt, hiển thị bottom sheet với các tùy chọn thời gian
      setShowTimeOptions(true);
    } else {
      // Khi bật, trực tiếp bật lại
      setActivityStatus(true);
    }
  }, []);

  const handleTimeOptionSelect = useCallback((option) => {
    console.log(`Tắt trạng thái hoạt động trong: ${option}`);
    setActivityStatus(false);
    setShowTimeOptions(false);
    // TODO: Implement logic to schedule turning back on after selected time
  }, []);

  const handleMenuClick = useCallback((menuId) => {
    switch (menuId) {
      case 'profile-info':
        setShowProfileInformation(true);
        break;
      case 'status-feed':
        console.log('Dòng trạng thái clicked');
        break;
      case 'activity-status':
        setShowActivityStatusPage(true);
        console.log('Trạng thái hoạt động page opened');
        break;
      case 'message-filter':
        console.log('Bộ lọc tin nhắn clicked');
        break;
      case 'saved-messages':
        console.log('Tin nhắn lưu clicked');
        break;
      case 'device-management':
        console.log('Quản lý thiết bị clicked');
        break;
      case 'security':
        console.log('Bảo mật & An toàn clicked');
        break;
      case 'resource-management':
        console.log('Quản lý tài nguyên clicked');
        break;
      case 'notifications':
        console.log('Thông báo & âm thanh clicked');
        break;
      case 'interface':
        setShowInterfaceSettings(true);
        console.log('Giao diện page opened');
        break;
      case 'font-size':
        console.log('Kích thước chữ clicked');
        break;
      case 'feedback':
        console.log('Góp ý clicked');
        break;
      case 'help':
        console.log('Hướng dẫn sử dụng clicked');
        break;
      case 'logout':
        console.log('Đăng xuất clicked');
        if (window.confirm('Bạn có chắc chắn muốn đăng xuất?')) {
          // Handle logout logic here
          localStorage.removeItem('token');
          window.location.reload();
        }
        break;
      default:
        console.log(`Menu item ${menuId} clicked`);
    }
  }, []);

  // Memoize menu groups to prevent recreation on every render
  const menuGroups = useMemo(() => [
    {
      items: [
        {
          id: 'profile-info',
          icon: FiUser,
          title: 'Hồ sơ thông tin',
        },
      ]
    },
    {
      items: [
        {
          id: 'status-feed',
          icon: FiFileText,
          title: 'Dòng trạng thái',
        },
        {
          id: 'activity-status',
          icon: FiActivity,
          title: 'Trạng thái hoạt động',
          hasStatus: true,
        },
      ]
    },
    {
      items: [
        {
          id: 'message-filter',
          icon: FiFilter,
          title: 'Bộ lọc tin nhắn',
        },
        {
          id: 'saved-messages',
          icon: FiBookmark,
          title: 'Tin nhắn lưu',
        },
      ]
    },
    {
      items: [
        {
          id: 'device-management',
          icon: FiMonitor,
          title: 'Quản lý thiết bị',
        },
        {
          id: 'security',
          icon: FiShield,
          title: 'Bảo mật & An toàn',
        },
        {
          id: 'resource-management',
          icon: FiDatabase,
          title: 'Quản lý tài nguyên',
        },
      ]
    },
    {
      items: [
        {
          id: 'notifications',
          icon: FiBell,
          title: 'Thông báo & âm thanh',
        },
        {
          id: 'interface',
          icon: FiSun,
          title: 'Giao diện',
          getRightText: () => {
            if (themeMode === 'light') return 'Sáng';
            if (themeMode === 'dark') return 'Tối';
            return 'Hệ thống';
          },
        },
        {
          id: 'font-size',
          icon: FiType,
          title: 'Kích thước chữ',
        },
      ]
    },
    {
      items: [
        {
          id: 'feedback',
          icon: FiMessageSquare,
          title: 'Góp ý',
        },
        {
          id: 'help',
          icon: FiHelpCircle,
          title: 'Hướng dẫn sử dụng',
        },
        {
          id: 'logout',
          icon: FiLogOut,
          title: 'Đăng xuất',
        },
      ]
    },
  ], [themeMode]);

  return (
    <>
      <PersonalProfileContainer>
        <Header>
          <BackButton onClick={onBack}>
            <FiChevronLeft size={24} />
          </BackButton>
          
          <HeaderProfile isScrolled={isScrolled}>
            <AvatarWrapper isScrolled={isScrolled}>
              <HeaderAvatar>
                {avatarUrl ? (
                  <img src={getAvatarURL(avatarUrl)} alt={user?.full_name || 'Profile'} />
                ) : (
                  getInitials(user?.full_name || user?.fullName)
                )}
              </HeaderAvatar>
              <CameraButton htmlFor="avatar-upload" title={isUploadingAvatar ? 'Đang tải lên...' : 'Thay đổi ảnh đại diện'}>
                <FiCamera />
              </CameraButton>
              <HiddenFileInput
                id="avatar-upload"
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                disabled={isUploadingAvatar}
              />
            </AvatarWrapper>
            <HeaderInfo>
              <HeaderName>
                {userData.name}
              </HeaderName>
              <HeaderUsername>
                @{userData.username}
              </HeaderUsername>
            </HeaderInfo>
          </HeaderProfile>
          
          <QRButton>
            <BiQrScan size={24} />
          </QRButton>
        </Header>

        <MenuSection ref={menuSectionRef}>
          {menuGroups.map((group, groupIndex) => (
            <MenuGroup key={groupIndex}>
              {group.items.map((item, itemIndex) => (
                <MenuItem 
                  key={item.id} 
                  onClick={() => handleMenuClick(item.id)}
                  isLast={itemIndex === group.items.length - 1}
                >
                  <MenuIcon>
                    <item.icon size={20} />
                  </MenuIcon>
                  <MenuTitle>{item.title}</MenuTitle>
                  <MenuRight>
                    {item.hasStatus && activityStatus && (
                      <StatusBadge>Đang bật</StatusBadge>
                    )}
                    {(item.rightText || item.getRightText) && (
                      <span style={{ color: '#666' }}>
                        {item.getRightText ? item.getRightText() : item.rightText}
                      </span>
                    )}
                    <FiChevronRight size={18} color="#ccc" />
                  </MenuRight>
                </MenuItem>
              ))}
            </MenuGroup>
          ))}
          
          <Footer>
            ZyeaChat V{getCurrentVersion()} © 2025 Zyea+ Corporation
          </Footer>
        </MenuSection>
      </PersonalProfileContainer>

      {showActivityStatusPage && (
        <ActivityStatusPage>
          <ActivityStatusHeader>
            <BackButton onClick={() => setShowActivityStatusPage(false)}>
              <FiChevronLeft size={24} />
            </BackButton>
            <ActivityStatusTitle>Trạng thái hoạt động</ActivityStatusTitle>
          </ActivityStatusHeader>
          
          <ActivityStatusContent>
            <ActivityStatusCard>
              <ToggleRow>
                <ToggleLabel>Hiển thị khi bạn hoạt động</ToggleLabel>
                <ToggleSwitch>
                  <ToggleInput 
                    type="checkbox" 
                    checked={activityStatus}
                    onChange={(e) => handleActivityStatusToggle(e.target.checked)}
                  />
                  <ToggleSlider />
                </ToggleSwitch>
              </ToggleRow>
              <ToggleDescription>
                Bạn và bạn bè nghĩa có thể nhìn thấy trạng thái hoạt động của nhau. Tính năng này sẽ áp dụng trên tất cả thiết bị của bạn.
              </ToggleDescription>
            </ActivityStatusCard>
          </ActivityStatusContent>
        </ActivityStatusPage>
      )}

      {showTimeOptions && (
        <BottomSheetOverlay onClick={() => setShowTimeOptions(false)}>
          <BottomSheet onClick={(e) => e.stopPropagation()}>
            <BottomSheetHeader>Tắt trong khoảng thời gian</BottomSheetHeader>
            <BottomSheetOption onClick={() => handleTimeOptionSelect('1 ngày')}>
              1 ngày
            </BottomSheetOption>
            <BottomSheetOption onClick={() => handleTimeOptionSelect('7 ngày')}>
              7 ngày
            </BottomSheetOption>
            <BottomSheetOption onClick={() => handleTimeOptionSelect('1 tháng')}>
              1 tháng
            </BottomSheetOption>
            <BottomSheetOption onClick={() => handleTimeOptionSelect('3 tháng')}>
              3 tháng
            </BottomSheetOption>
            <BottomSheetOption onClick={() => handleTimeOptionSelect('6 tháng')}>
              6 tháng
            </BottomSheetOption>
            <BottomSheetOption onClick={() => handleTimeOptionSelect('Cho đến khi bật lại')}>
              Cho đến khi bật lại
            </BottomSheetOption>
            <BottomSheetOption onClick={() => handleTimeOptionSelect('Tùy chỉnh')}>
              Tùy chỉnh
            </BottomSheetOption>
          </BottomSheet>
        </BottomSheetOverlay>
      )}

      {showInterfaceSettings && (
        <InterfaceSettingsPage>
          <InterfaceSettingsHeader>
            <BackButton onClick={() => setShowInterfaceSettings(false)}>
              <FiChevronLeft size={24} />
            </BackButton>
            <InterfaceSettingsTitle>Giao diện</InterfaceSettingsTitle>
          </InterfaceSettingsHeader>
          
          <InterfaceSettingsContent>
            <SettingsSection>
              <SectionTitle>Lựa chọn theme</SectionTitle>
              <ThemeColorCard>
                <ThemeColorGrid>
                  <ThemeColorOption onClick={() => setColor('classic')}>
                    <ThemeColorBox selected={themeColor === 'classic'}>
                      <ThemeColorPreview gradient="linear-gradient(135deg, #2c3e50 0%, #34495e 100%)" />
                    </ThemeColorBox>
                    <ThemeColorLabel>Classic</ThemeColorLabel>
                  </ThemeColorOption>

                  <ThemeColorOption onClick={() => setColor('blue')}>
                    <ThemeColorBox selected={themeColor === 'blue'}>
                      <ThemeColorPreview gradient="linear-gradient(135deg, #0068ff 0%, #0047b3 100%)" />
                    </ThemeColorBox>
                    <ThemeColorLabel>Blue gems</ThemeColorLabel>
                  </ThemeColorOption>

                  <ThemeColorOption onClick={() => setColor('dreamy')}>
                    <ThemeColorBox selected={themeColor === 'dreamy'}>
                      <ThemeColorPreview gradient="linear-gradient(135deg, #667eea 0%, #764ba2 100%)" />
                    </ThemeColorBox>
                    <ThemeColorLabel>Dreamy</ThemeColorLabel>
                  </ThemeColorOption>

                  <ThemeColorOption onClick={() => setColor('natural')}>
                    <ThemeColorBox selected={themeColor === 'natural'}>
                      <ThemeColorPreview gradient="linear-gradient(135deg, #00a651 0%, #007a3d 100%)" />
                    </ThemeColorBox>
                    <ThemeColorLabel>Natural</ThemeColorLabel>
                  </ThemeColorOption>
                </ThemeColorGrid>
              </ThemeColorCard>
            </SettingsSection>

            <SettingsSection>
              <SectionTitle>Chế độ sáng</SectionTitle>
              <ThemeModeCard>
                <ThemeModeOption 
                  onClick={() => setTheme('light')}
                  isLast={false}
                >
                  <ThemeModeIcon>
                    <FiSun />
                  </ThemeModeIcon>
                  <ThemeModeText>
                    <ThemeModeTitle>Chế độ sáng</ThemeModeTitle>
                  </ThemeModeText>
                  <ThemeModeCheck show={themeMode === 'light'}>
                    <FiCheck />
                  </ThemeModeCheck>
                </ThemeModeOption>

                <ThemeModeOption 
                  onClick={() => setTheme('dark')}
                  isLast={false}
                >
                  <ThemeModeIcon>
                    <FiMoon />
                  </ThemeModeIcon>
                  <ThemeModeText>
                    <ThemeModeTitle>Chế độ tối</ThemeModeTitle>
                  </ThemeModeText>
                  <ThemeModeCheck show={themeMode === 'dark'}>
                    <FiCheck />
                  </ThemeModeCheck>
                </ThemeModeOption>

                <ThemeModeOption 
                  onClick={() => setTheme('system')}
                  isLast={true}
                >
                  <ThemeModeIcon>
                    <FiMonitor />
                  </ThemeModeIcon>
                  <ThemeModeText>
                    <ThemeModeTitle>Hệ thống</ThemeModeTitle>
                    <ThemeModeDescription>Tự động theo thiết bị</ThemeModeDescription>
                  </ThemeModeText>
                  <ThemeModeCheck show={themeMode === 'system'}>
                    <FiCheck />
                  </ThemeModeCheck>
                </ThemeModeOption>
              </ThemeModeCard>
            </SettingsSection>
          </InterfaceSettingsContent>
        </InterfaceSettingsPage>
      )}

      {showProfileInformation && (
        <MobileProfileInformation
          user={user}
          onBack={() => setShowProfileInformation(false)}
          onShowEdit={() => {
            setShowProfileInformation(false);
            // Could navigate to edit profile page here
          }}
        />
      )}
    </>
  );
};

export default PersonalProfilePage;
