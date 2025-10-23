import React, { useState, useRef, useEffect, useContext } from 'react';
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
import AuthContext from '../../contexts/AuthContext';
import { chatAPI } from '../../utils/api';
import { getInitials } from '../../utils/nameUtils';
import { useTheme } from '../../contexts/ThemeContext';

const PersonalProfileContainer = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: var(--bg-secondary, #f5f5f5);
  z-index: 1000;
  overflow: hidden;
`;

const Header = styled.div`
  background: transparent;
  padding: 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
`;

const HeaderProfile = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: ${props => props.isScrolled ? '0px' : '8px'};
  transition: gap 0.25s ease-out;
`;

const AvatarWrapper = styled.div`
  position: relative;
  width: ${props => props.isScrolled ? '0px' : '64px'};
  height: ${props => props.isScrolled ? '0px' : '64px'};
  opacity: ${props => props.isScrolled ? '0' : '1'};
  transition: width 0.25s ease-out, height 0.25s ease-out, opacity 0.25s ease-out;
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
`;

const HeaderUsername = styled.div`
  font-size: 13px;
  color: var(--text-secondary, #666);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 200px;
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
  background: var(--bg-secondary, #f5f5f5);
  padding: 8px 16px 80px;
  -webkit-overflow-scrolling: touch;
  will-change: scroll-position;
  transform: translateZ(0);
`;

const MenuGroup = styled.div`
  background: var(--bg-primary, white);
  border-radius: 12px;
  margin-bottom: 12px;
  overflow: hidden;
`;

const MenuItem = styled.div`
  padding: 14px 16px;
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  background: var(--bg-primary, white);
  transition: background 0.1s ease-out;
  border-bottom: ${props => props.isLast ? 'none' : '1px solid var(--border-color, #f0f0f0)'};
  -webkit-tap-highlight-color: transparent;
  
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
`;

const MenuTitle = styled.div`
  flex: 1;
  font-size: 15px;
  color: var(--text-primary, #000);
  font-weight: 400;
`;

const MenuRight = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: var(--text-tertiary, #999);
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
  transition: 0.3s;
  border-radius: 31px;

  &:before {
    position: absolute;
    content: "";
    height: 27px;
    width: 27px;
    left: 2px;
    bottom: 2px;
    background-color: white;
    transition: 0.3s;
    border-radius: 50%;
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
  
  const [activityStatus, setActivityStatus] = useState(true);
  const [isScrolled, setIsScrolled] = useState(false);
  const [showActivityStatusPage, setShowActivityStatusPage] = useState(false);
  const [showInterfaceSettings, setShowInterfaceSettings] = useState(false);
  const [showTimeOptions, setShowTimeOptions] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState('');
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const menuSectionRef = useRef(null);
  const fileInputRef = useRef(null);

  // Set initial avatar URL on mount and when user changes
  useEffect(() => {
    if (user?.avatar_url) {
      setAvatarUrl(user.avatar_url);
    } else {
      setAvatarUrl('');
    }
  }, [user?.id, user?.avatar_url]); // Run when user ID or avatar URL changes

  useEffect(() => {
    let ticking = false;
    
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          if (menuSectionRef.current) {
            const scrollTop = menuSectionRef.current.scrollTop;
            const shouldScroll = scrollTop > 30;
            
            // Only update state if it actually changed
            setIsScrolled(prevState => {
              if (prevState !== shouldScroll) {
                return shouldScroll;
              }
              return prevState;
            });
          }
          ticking = false;
        });
        ticking = true;
      }
    };

    const menuElement = menuSectionRef.current;
    if (menuElement) {
      menuElement.addEventListener('scroll', handleScroll, { passive: true });
    }

    return () => {
      if (menuElement) {
        menuElement.removeEventListener('scroll', handleScroll);
      }
    };
  }, []);

  // Notify parent when ActivityStatusPage or InterfaceSettings opens/closes
  useEffect(() => {
    if (onActivityStatusChange) {
      onActivityStatusChange(showActivityStatusPage || showTimeOptions || showInterfaceSettings);
    }
  }, [showActivityStatusPage, showTimeOptions, showInterfaceSettings, onActivityStatusChange]);

  const handleAvatarChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    console.log('📸 Avatar upload started:', {
      name: file.name,
      size: file.size,
      type: file.type
    });

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

      // Get API base URL - detect environment
      let API_BASE_URL;
      
      // Check if running in Capacitor/mobile app
      const isCapacitor = window.location.protocol === 'capacitor:' || 
                          window.location.protocol === 'ionic:' ||
                          window.location.protocol === 'file:';
      
      if (isCapacitor) {
        // Mobile app - use environment variable or default
        API_BASE_URL = process.env.REACT_APP_API_URL || 'http://192.168.0.103:5000/api';
        console.log('📱 Capacitor detected, using API:', API_BASE_URL);
      } else if (window.location.hostname === 'localhost' || window.location.hostname.includes('192.168')) {
        // Development on browser
        API_BASE_URL = `${window.location.protocol}//${window.location.hostname}:5000/api`;
        console.log('💻 Development mode, using API:', API_BASE_URL);
      } else {
        // Production
        API_BASE_URL = `${window.location.origin}/api`;
        console.log('🌐 Production mode, using API:', API_BASE_URL);
      }

      const uploadUrl = `${API_BASE_URL}/profile/avatar`;
      console.log('📤 Uploading to:', uploadUrl);
      console.log('📍 Current location:', {
        protocol: window.location.protocol,
        hostname: window.location.hostname,
        origin: window.location.origin
      });

      const response = await fetch(uploadUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });

      console.log('📥 Response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Upload failed:', errorText);
        console.error('❌ Failed URL:', uploadUrl);
        throw new Error(`Upload failed: ${response.status}\nURL: ${uploadUrl}\n${errorText}`);
      }

      const data = await response.json();
      console.log('✅ Upload success:', data);
      
      if (data.avatar_url) {
        // Construct full URL for avatar
        const fullAvatarUrl = data.avatar_url.startsWith('http') 
          ? data.avatar_url 
          : `${window.location.protocol}//${window.location.hostname}:5000${data.avatar_url}`;
        
        setAvatarUrl(fullAvatarUrl);
        
        // Update user object in AuthContext if available
        if (authContext && authContext.user) {
          // Create updated user object
          const updatedUser = {
            ...authContext.user,
            avatar_url: fullAvatarUrl
          };
          
          // Update by calling login again with updated user data
          if (authContext.login) {
            const token = localStorage.getItem('token');
            authContext.login(updatedUser, token);
          }
        }
        
        alert('Cập nhật ảnh đại diện thành công!');
      }
    } catch (error) {
      console.error('❌ Error uploading avatar:', error);
      alert(`Có lỗi xảy ra khi tải ảnh lên: ${error.message}\nVui lòng thử lại!`);
    } finally {
      setIsUploadingAvatar(false);
      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleActivityStatusToggle = (checked) => {
    if (!checked) {
      // Khi tắt, hiển thị bottom sheet với các tùy chọn thời gian
      setShowTimeOptions(true);
    } else {
      // Khi bật, trực tiếp bật lại
      setActivityStatus(true);
    }
  };

  const handleTimeOptionSelect = (option) => {
    console.log(`Tắt trạng thái hoạt động trong: ${option}`);
    setActivityStatus(false);
    setShowTimeOptions(false);
    // TODO: Implement logic to schedule turning back on after selected time
  };

  const handleMenuClick = (menuId) => {
    switch (menuId) {
      case 'profile-info':
        console.log('Hồ sơ thông tin clicked');
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
  };

  const menuGroups = [
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
  ];

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
                  <img src={avatarUrl} alt={user?.full_name || 'Profile'} />
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
                {user?.full_name || user?.fullName || user?.username || 'Người dùng'}
              </HeaderName>
              <HeaderUsername>
                @{user?.username || 'FEC'}
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
            Zyea v1.0.14 © 2025 Zyea+ Corporation
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
    </>
  );
};

export default PersonalProfilePage;
