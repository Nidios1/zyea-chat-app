import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import { FiSearch, FiEdit3, FiSmile, FiMessageCircle, FiBookmark, FiLayers, FiGlobe, FiSettings, FiLogOut, FiChevronRight, FiHeart, FiDownload, FiMoreVertical, FiTrash2, FiBell, FiBellOff, FiX } from 'react-icons/fi';
import { chatAPI } from '../../utils/api';
import { getInitials } from '../../utils/nameUtils';
import { getAvatarURL } from '../../utils/imageUtils';
import { useNativeFeatures } from '../../hooks/useNativeFeatures';

const SidebarContainer = styled.div`
  width: ${props => props.$width || 320}px;
  min-width: 280px;
  max-width: 600px;
  background: ${props => props.$isDark ? '#1a1a1a' : '#ffffff'};
  border-right: 1px solid ${props => props.$isDark ? '#333' : '#e1e5e9'};
  display: flex;
  height: 100%;
  overflow: hidden;
  position: relative;
  transition: ${props => props.$isResizing ? 'none' : 'width 0.1s ease-out'};

  @media (max-width: 768px) {
    width: 100%;
    position: absolute;
    top: 0;
    left: 0;
    z-index: 100;
    transform: ${props => props.$isVisible ? 'translateX(0)' : 'translateX(-100%)'};
    transition: transform 0.3s ease;
  }
`;

const NavigationBar = styled.div`
  width: 80px;
  background: ${props => props.$isDark ? '#2a2a2a' : '#f8f9fa'};
  border-right: 1px solid ${props => props.$isDark ? '#333' : '#e1e5e9'};
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 1rem 0.5rem;
  gap: 0.75rem;
  flex-shrink: 0;
  justify-content: flex-start;
  position: relative;
`;

const NavIcon = styled.button`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  background: ${props => props.$active 
    ? (props.$isDark ? '#0068ff' : '#0068ff') 
    : 'transparent'};
  color: ${props => props.$active 
    ? '#fff' 
    : (props.$isDark ? '#888' : '#666')};

  &:hover {
    background: ${props => props.$active 
      ? (props.$isDark ? '#0056cc' : '#0056cc') 
      : (props.$isDark ? '#333' : '#e5e5e5')};
  }

  svg {
    width: 20px;
    height: 20px;
  }
`;

const SidebarContent = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
`;

const UserAvatarSection = styled.div`
  padding: 1rem;
  border-bottom: 1px solid ${props => props.$isDark ? '#333' : '#e1e5e9'};
  display: flex;
  align-items: center;
  justify-content: center;
`;

const UserAvatar = styled.div`
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: ${props => props.$color || '#0068ff'};
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  color: white;
  font-size: 1.1rem;
  flex-shrink: 0;
  overflow: visible;
  position: relative;
  cursor: pointer;
  transition: transform 0.2s ease;
  
  &:hover {
    transform: scale(1.05);
  }
  
  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    border-radius: 50%;
  }
`;

const ProfileMenuOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.3);
  z-index: 1000;
  display: ${props => props.$show ? 'block' : 'none'};
`;

const ProfileMenuContainer = styled.div`
  position: absolute;
  top: 10px;
  left: 80px;
  width: 260px;
  background: ${props => props.$isDark ? '#2a2a2a' : '#ffffff'};
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
  z-index: 1001;
  overflow: hidden;
  display: ${props => props.$show ? 'block' : 'none'};
`;

const ProfileMenuHeader = styled.div`
  padding: 1rem 1.25rem;
  text-align: center;
  border-bottom: 1px solid ${props => props.$isDark ? '#444' : '#e1e5e9'};
`;

const ProfileMenuAvatar = styled.div`
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: ${props => props.$color || '#0068ff'};
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  color: white;
  font-size: 1.5rem;
  margin: 0 auto 0.75rem;
  overflow: visible;
  position: relative;
  
  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    border-radius: 50%;
  }
`;

const ProfileMenuName = styled.h3`
  margin: 0 0 0.25rem 0;
  font-size: 1rem;
  font-weight: 700;
  color: ${props => props.$isDark ? '#fff' : '#111'};
`;

const ProfileMenuInfo = styled.p`
  margin: 0;
  font-size: 0.8125rem;
  color: ${props => props.$isDark ? '#aaa' : '#666'};
`;

const ProfileMenuList = styled.div`
  padding: 0.375rem 0;
`;

const ProfileMenuItem = styled.button`
  width: 100%;
  padding: 0.75rem 1.25rem;
  display: flex;
  align-items: center;
  gap: 0.625rem;
  background: transparent;
  border: none;
  cursor: pointer;
  transition: background 0.2s ease;
  text-align: left;
  color: ${props => props.$isDark ? '#fff' : '#111'};
  
  &:hover {
    background: ${props => props.$isDark ? '#333' : '#f5f5f5'};
  }
  
  svg {
    width: 18px;
    height: 18px;
    flex-shrink: 0;
    color: ${props => props.$isDark ? '#aaa' : '#666'};
  }
`;

const MenuItemText = styled.span`
  flex: 1;
  font-size: 0.875rem;
`;

const MenuItemRight = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: ${props => props.$isDark ? '#aaa' : '#666'};
  font-size: 0.8125rem;
`;

const StatusIndicator = styled.div`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #00a651;
`;

const MenuItemArrow = styled(FiChevronRight)`
  width: 14px;
  height: 14px;
`;

const OnlineIndicator = styled.div`
  position: absolute;
  bottom: 1px;
  right: 1px;
  width: 12px;
  height: 12px;
  background: #31A24C;
  border: 2px solid ${props => props.$isDark ? '#1a1a1a' : '#fff'};
  border-radius: 50%;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.15);
  z-index: 10;
`;

const ChatsHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem;
  border-bottom: 1px solid ${props => props.$isDark ? '#333' : '#e1e5e9'};
`;

const ChatsTitle = styled.h2`
  margin: 0;
  font-size: 1.5rem;
  font-weight: 700;
  color: ${props => props.$isDark ? '#fff' : '#111'};
`;

const PencilIcon = styled.button`
  width: 32px;
  height: 32px;
  border-radius: 6px;
  border: none;
  background: transparent;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: ${props => props.$isDark ? '#888' : '#666'};
  transition: all 0.2s ease;

  &:hover {
    background: ${props => props.$isDark ? '#333' : '#f5f5f5'};
    color: ${props => props.$isDark ? '#fff' : '#000'};
  }

  svg {
    width: 18px;
    height: 18px;
  }
`;

const SearchContainer = styled.div`
  padding: 1rem;
  border-bottom: 1px solid ${props => props.$isDark ? '#333' : '#e1e5e9'};
  background: ${props => props.$isDark ? '#1a1a1a' : '#ffffff'};
`;

const SearchInputWrapper = styled.div`
  position: relative;
  display: flex;
  align-items: center;
`;

const SearchIcon = styled.div`
  position: absolute;
  left: 0.75rem;
  color: ${props => props.$isDark ? '#888' : '#999'};
  pointer-events: none;
`;

const SearchInput = styled.input`
  width: 100%;
  padding: 0.625rem 0.875rem 0.625rem 2.5rem;
  border: 1px solid ${props => props.$isDark ? '#444' : '#ddd'};
  border-radius: 8px;
  font-size: 14px;
  outline: none;
  background: ${props => props.$isDark ? '#2a2a2a' : '#f5f5f5'};
  color: ${props => props.$isDark ? '#fff' : '#000'};
  transition: all 0.2s ease;

  &:focus {
    border-color: #0068ff;
    background: ${props => props.$isDark ? '#333' : '#fff'};
  }

  &::placeholder {
    color: ${props => props.$isDark ? '#888' : '#999'};
  }
`;

const FilterButtons = styled.div`
  display: flex;
  gap: 0.5rem;
  padding: 0 1rem 1rem 1rem;
  border-bottom: 1px solid ${props => props.$isDark ? '#333' : '#e1e5e9'};
  flex-wrap: wrap;
`;

const FilterButton = styled.button`
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  background: ${props => props.$active 
    ? (props.$isDark ? '#1a1a1a' : '#000') 
    : (props.$isDark ? '#2a2a2a' : '#f5f5f5')};
  color: ${props => props.$active 
    ? '#fff' 
    : (props.$isDark ? '#aaa' : '#666')};

  &:hover {
    background: ${props => props.$active 
      ? (props.$isDark ? '#2a2a2a' : '#333') 
      : (props.$isDark ? '#333' : '#e5e5e5')};
  }
`;

const ConversationsList = styled.div`
  flex: 1;
  overflow-y: auto;
  background: ${props => props.$isDark ? '#1a1a1a' : '#ffffff'};

  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-track {
    background: transparent;
  }

  &::-webkit-scrollbar-thumb {
    background: ${props => props.$isDark ? '#444' : '#ddd'};
    border-radius: 3px;
  }

  &::-webkit-scrollbar-thumb:hover {
    background: ${props => props.$isDark ? '#555' : '#ccc'};
  }
`;

const ConversationItem = styled.div`
  padding: 0.875rem 1rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  transition: all 0.2s ease;
  background: ${props => props.$selected 
    ? (props.$isDark ? '#2a2a2a' : '#f0f0f0') 
    : 'transparent'};
  border-bottom: 1px solid ${props => props.$isDark ? '#2a2a2a' : '#f5f5f5'};
  position: relative;
  overflow: hidden;

  &:hover {
    background: ${props => props.$isDark ? '#2a2a2a' : '#f5f5f5'};
  }
`;

const SelectionIndicator = styled.div`
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 4px;
  background: #0068ff;
  opacity: ${props => props.$selected ? 1 : 0};
  transform: ${props => props.$selected ? 'scaleY(1)' : 'scaleY(0.8)'};
  transform-origin: center;
  transition: opacity 0.2s cubic-bezier(0.4, 0.0, 0.2, 1),
              transform 0.2s cubic-bezier(0.4, 0.0, 0.2, 1);
  z-index: 1;
  border-radius: 0 2px 2px 0;
`;

const Avatar = styled.div`
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: ${props => props.$color || '#0068ff'};
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  color: white;
  font-size: 1.1rem;
  position: relative;
  flex-shrink: 0;
  overflow: visible;
  
  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    border-radius: 50%;
  }
`;

const CompositeAvatarContainer = styled.div`
  width: 48px;
  height: 48px;
  border-radius: 50%;
  overflow: hidden;
  position: relative;
  flex-shrink: 0;
  display: grid;
  grid-template-columns: 1fr 1fr;
  grid-template-rows: 1fr 1fr;
  gap: 1px;
  background: ${props => props.$isDark ? '#2a2a2a' : '#e5e5e5'};
`;

const CompositeAvatarItem = styled.div`
  width: 100%;
  height: 100%;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  color: white;
  font-size: 0.6rem;
  background: ${props => props.$color || '#0068ff'};
  
  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  
  &:first-child {
    border-top-left-radius: 24px;
  }
  
  &:nth-child(2) {
    border-top-right-radius: 24px;
  }
  
  &:nth-child(3) {
    border-bottom-left-radius: 24px;
  }
  
  &:last-child {
    border-bottom-right-radius: 24px;
  }
`;

const CompositeAvatarBadge = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${props => props.$isDark ? '#2a2a2b' : '#e5e5e5'};
  color: ${props => props.$isDark ? '#fff' : '#666'};
  font-size: 0.5rem;
  font-weight: 700;
  border-bottom-right-radius: 24px;
`;

// Component for composite avatar item with error handling
const CompositeAvatarItemComponent = ({ participant, getAvatarColor, getAvatarURL, getInitials }) => {
  const [imageError, setImageError] = React.useState(false);
  const hasAvatar = participant.avatar_url && !imageError;
  
  return (
    <CompositeAvatarItem $color={getAvatarColor(participant.full_name || participant.username)}>
      {hasAvatar ? (
        <img 
          src={getAvatarURL(participant.avatar_url)} 
          alt={participant.full_name || participant.username}
          onError={() => setImageError(true)}
        />
      ) : (
        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {getInitials(participant.full_name || participant.username || 'U')}
        </div>
      )}
    </CompositeAvatarItem>
  );
};

const ConversationInfo = styled.div`
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
`;

const ConversationName = styled.h3`
  margin: 0;
  font-size: 15px;
  color: ${props => props.$isDark ? '#fff' : '#111'};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-weight: 500;
`;

const LastMessage = styled.p`
  margin: 0;
  font-size: 13px;
  color: ${props => props.$isDark ? '#aaa' : '#666'};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const TimeStamp = styled.span`
  font-size: 11px;
  color: ${props => props.$isDark ? '#888' : '#999'};
  white-space: nowrap;
  margin-left: 0.5rem;
`;

const OptionsButton = styled.button`
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: none;
  background: transparent;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: ${props => props.$isDark ? '#888' : '#666'};
  transition: all 0.2s ease;
  flex-shrink: 0;
  opacity: 0;
  margin-left: auto;

  ${ConversationItem}:hover & {
    opacity: 1;
  }

  &:hover {
    background: ${props => props.$isDark ? '#333' : '#e5e5e5'};
    color: ${props => props.$isDark ? '#fff' : '#000'};
  }

  &:active {
    transform: scale(0.95);
  }

  svg {
    width: 18px;
    height: 18px;
  }
`;

const OptionsMenu = styled.div`
  position: fixed;
  right: ${props => props.$right || 'auto'}px;
  top: ${props => props.$top || 'auto'}px;
  background: ${props => props.$isDark ? '#2a2a2a' : '#ffffff'};
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  min-width: 180px;
  z-index: 1000;
  overflow: hidden;
  border: 1px solid ${props => props.$isDark ? '#444' : '#e1e5e9'};
`;

const OptionsMenuItem = styled.button`
  width: 100%;
  padding: 0.75rem 1rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  background: transparent;
  border: none;
  cursor: pointer;
  transition: background 0.2s ease;
  text-align: left;
  color: ${props => props.$isDark ? '#fff' : '#111'};
  font-size: 14px;

  &:hover {
    background: ${props => props.$isDark ? '#333' : '#f5f5f5'};
  }

  &:active {
    opacity: 0.8;
  }

  svg {
    width: 18px;
    height: 18px;
    flex-shrink: 0;
    color: ${props => props.$isDark ? '#aaa' : '#666'};
  }

  &.danger {
    color: #e74c3c;
    
    svg {
      color: #e74c3c;
    }

    &:hover {
      background: ${props => props.$isDark ? '#3a1f1f' : '#ffe5e5'};
    }
  }
`;

const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 200px;
  color: ${props => props.$isDark ? '#888' : '#666'};
  text-align: center;
  padding: 2rem;
  
  p {
    margin: 0.5rem 0;
    font-size: 14px;
  }
`;

const VersionText = styled.div`
  position: absolute;
  bottom: 0.75rem;
  left: 0;
  right: 0;
  padding: 0.5rem;
  font-size: 11px;
  color: ${props => props.$isDark ? '#666' : '#999'};
  text-align: center;
`;

const Resizer = styled.div`
  position: absolute;
  top: 0;
  right: 0;
  width: 6px;
  height: 100%;
  cursor: col-resize;
  background: transparent;
  z-index: 10;
  transition: background 0.2s ease;

  &:hover {
    background: ${props => props.$isDark ? 'rgba(0, 104, 255, 0.3)' : 'rgba(0, 104, 255, 0.2)'};
  }

  &:active {
    background: #0068ff;
  }

  /* Visual indicator line */
  &::before {
    content: '';
    position: absolute;
    top: 0;
    right: 2px;
    width: 2px;
    height: 100%;
    background: ${props => props.$isDark ? '#333' : '#e1e5e9'};
    transition: background 0.2s ease;
  }

  &:hover::before {
    background: #0068ff;
  }

  @media (max-width: 768px) {
    display: none;
  }
`;

const Sidebar = ({ 
  conversations, 
  selectedConversation, 
  onConversationSelect, 
  onNewChat,
  onAddFriend,
  onShowFriends,
  socket,
  reloadKey,
  isVisible = true,
  onClose,
  user,
  isDarkMode,
  onShowProfile,
  onLogout,
  onConversationDeleted
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all');
  const [activeNav, setActiveNav] = useState('chats');
  const [conversationSettings, setConversationSettings] = useState({});
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    const saved = localStorage.getItem('sidebarWidth');
    const parsed = saved ? parseInt(saved, 10) : null;
    // Validate saved width is within bounds
    if (parsed && parsed >= 280 && parsed <= 600) {
      return parsed;
    }
    return 320; // Default width
  });
  const [isResizing, setIsResizing] = useState(false);
  const [openMenuId, setOpenMenuId] = useState(null);
  const [menuPosition, setMenuPosition] = useState({ top: 0, right: 0 });
  const [participantsMap, setParticipantsMap] = useState({}); // Store participants for group chats
  const profileMenuRef = useRef(null);
  const avatarRef = useRef(null);
  const sidebarRef = useRef(null);
  const resizeStartX = useRef(0);
  const resizeStartWidth = useRef(320);
  const menuRefs = useRef({});
  const { canInstall, installApp, isInstalled } = useNativeFeatures();
  
  const loadConversationSettings = async () => {
    if (!conversations || conversations.length === 0) return;
    
    const settings = {};
    for (const conversation of conversations) {
      try {
        const data = await chatAPI.getConversationSettings(conversation.id);
        settings[conversation.id] = data;
      } catch (error) {
        console.error(`Error loading settings for conversation ${conversation.id}:`, error);
      }
    }
    setConversationSettings(settings);
  };

  useEffect(() => {
    loadConversationSettings();
  }, [conversations]);

  useEffect(() => {
    if (reloadKey > 0) {
      loadConversationSettings();
    }
  }, [reloadKey]);

  // Load participants for group chats
  const loadGroupParticipants = async () => {
    if (!conversations || conversations.length === 0) return;
    
    const groupConversations = conversations.filter(conv => 
      conv.type === 'group' || conv.conversation_type === 'group'
    );
    
    if (groupConversations.length === 0) return;
    
    const participants = {};
    for (const conversation of groupConversations) {
      try {
        const res = await chatAPI.getParticipants(conversation.id);
        const data = Array.isArray(res.data) ? res.data : [];
        participants[conversation.id] = data;
      } catch (error) {
        console.error(`Error loading participants for conversation ${conversation.id}:`, error);
        participants[conversation.id] = [];
      }
    }
    setParticipantsMap(participants);
  };

  useEffect(() => {
    loadGroupParticipants();
  }, [conversations]);

  // Save sidebar width to localStorage
  useEffect(() => {
    localStorage.setItem('sidebarWidth', sidebarWidth.toString());
  }, [sidebarWidth]);

  // Handle resize
  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e) => {
      const deltaX = e.clientX - resizeStartX.current;
      const newWidth = resizeStartWidth.current + deltaX;
      
      // Constrain width between min and max
      const minWidth = 280;
      const maxWidth = 600;
      const constrainedWidth = Math.max(minWidth, Math.min(maxWidth, newWidth));
      
      setSidebarWidth(constrainedWidth);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    
    // Prevent text selection while resizing
    document.body.style.userSelect = 'none';
    document.body.style.cursor = 'col-resize';

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
    };
  }, [isResizing]);

  const handleResizeStart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!sidebarRef.current) return;
    
    resizeStartX.current = e.clientX;
    resizeStartWidth.current = sidebarWidth;
    setIsResizing(true);
  };

  // Close profile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        showProfileMenu &&
        profileMenuRef.current &&
        !profileMenuRef.current.contains(event.target) &&
        avatarRef.current &&
        !avatarRef.current.contains(event.target)
      ) {
        setShowProfileMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showProfileMenu]);

  // Close options menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (openMenuId) {
        const menuRef = menuRefs.current[openMenuId];
        if (menuRef && !menuRef.contains(event.target)) {
          setOpenMenuId(null);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [openMenuId]);

  const handleAvatarClick = () => {
    setShowProfileMenu(!showProfileMenu);
  };

  const handleDownloadApp = async () => {
    // Check if app is already installed
    if (isInstalled) {
      alert('Ứng dụng đã được cài đặt trên thiết bị của bạn!');
      return;
    }

    // Check if PWA install is available
    if (canInstall) {
      const success = await installApp();
      if (success) {
        alert('Ứng dụng đã được cài đặt thành công! Bạn có thể tìm thấy nó trong menu Start hoặc Applications.');
      }
    } else {
      // Fallback: Show instructions for manual installation
      const userAgent = navigator.userAgent.toLowerCase();
      const isIOS = /iphone|ipad|ipod/.test(userAgent);
      const isAndroid = /android/.test(userAgent);
      
      if (isIOS) {
        alert('Để cài đặt ứng dụng trên iOS:\n\n1. Nhấn nút Chia sẻ (↗) ở thanh dưới\n2. Chọn "Thêm vào Màn hình chính"\n3. Nhấn "Thêm" để hoàn tất');
      } else if (isAndroid) {
        alert('Để cài đặt ứng dụng trên Android:\n\n1. Nhấn nút Menu (⋮) ở góc trên\n2. Chọn "Thêm vào màn hình chính" hoặc "Cài đặt ứng dụng"\n3. Nhấn "Cài đặt" để hoàn tất');
      } else {
        // Desktop browsers
        alert('Để cài đặt ứng dụng:\n\n1. Nhấn vào biểu tượng cài đặt (⊕) trên thanh địa chỉ\n2. Hoặc vào Menu > Cài đặt > Cài đặt ứng dụng\n3. Nhấn "Cài đặt" để hoàn tất');
      }
    }
  };

  const handleOptionsClick = (e, conversationId) => {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    
    // Position menu to the left of the button
    const right = window.innerWidth - rect.right + 10;
    const top = rect.top + rect.height / 2;
    
    setMenuPosition({ top, right });
    setOpenMenuId(openMenuId === conversationId ? null : conversationId);
  };

  const handleDeleteConversation = async (conversationId) => {
    if (!window.confirm('Bạn có chắc muốn xóa cuộc trò chuyện này? Lịch sử tin nhắn cũng sẽ bị xóa.')) {
      return;
    }

    try {
      await chatAPI.deleteConversationHistory(conversationId);
      await chatAPI.deleteConversation(conversationId);
      
      // Clear selection if this conversation was selected
      if (onConversationSelect && selectedConversation?.id === conversationId) {
        onConversationSelect(null);
      }
      
      setOpenMenuId(null);
      
      // Notify parent component to refresh conversations list
      if (onConversationDeleted) {
        onConversationDeleted(conversationId);
      }
    } catch (error) {
      console.error('Error deleting conversation:', error);
      alert('Không thể xóa cuộc trò chuyện. Vui lòng thử lại.');
    }
  };

  const handleMuteConversation = async (conversationId, mute) => {
    try {
      // TODO: Implement mute API call
      // await chatAPI.muteConversation(conversationId, mute);
      setOpenMenuId(null);
    } catch (error) {
      console.error('Error muting conversation:', error);
      alert('Không thể thay đổi cài đặt thông báo. Vui lòng thử lại.');
    }
  };

  const handleMenuClick = (menuId) => {
    setShowProfileMenu(false);
    switch (menuId) {
      case 'status-feed':
        console.log('Dòng trạng thái clicked');
        break;
      case 'activity-status':
        console.log('Trạng thái hoạt động clicked');
        break;
      case 'saved-messages':
        console.log('Tin nhắn đã lưu clicked');
        break;
      case 'interface':
        console.log('Giao diện clicked');
        break;
      case 'language':
        console.log('Ngôn ngữ clicked');
        break;
      case 'settings':
        console.log('Cài đặt clicked');
        if (onShowProfile) onShowProfile();
        break;
      case 'download-app':
        handleDownloadApp();
        break;
      case 'logout':
        if (window.confirm('Bạn có chắc chắn muốn đăng xuất?')) {
          if (onLogout) onLogout();
        }
        break;
      default:
        break;
    }
  };

  const filteredConversations = Array.isArray(conversations) ? conversations.filter(conv => {
    if (!conv || !conv.other_user_id) return false;
    
    if (searchTerm.trim()) {
      const matchesSearch = conv.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           conv.username?.toLowerCase().includes(searchTerm.toLowerCase());
      if (!matchesSearch) return false;
    }
    
    if (filter === 'unread') {
      return true;
    } else if (filter === 'muted') {
      return true;
    }
    
    return true;
  }) : [];

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) {
      return date.toLocaleTimeString('vi-VN', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    } else if (days === 1) {
      return 'Hôm qua';
    } else if (days < 7) {
      const dayNames = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
      return dayNames[date.getDay()];
    } else {
      return date.toLocaleDateString('vi-VN', { 
        day: '2-digit', 
        month: '2-digit' 
      });
    }
  };

  const getAvatarColor = (name) => {
    const colors = ['#0068ff', '#e74c3c', '#2ecc71', '#f39c12', '#9b59b6', '#1abc9c'];
    const index = name?.charCodeAt(0) % colors.length || 0;
    return colors[index];
  };

  return (
    <>
      <ProfileMenuOverlay $show={showProfileMenu} onClick={() => setShowProfileMenu(false)} />
      <ProfileMenuContainer 
        ref={profileMenuRef}
        $show={showProfileMenu} 
        $isDark={isDarkMode}
      >
        <ProfileMenuHeader $isDark={isDarkMode}>
          <ProfileMenuAvatar $color={getAvatarColor(user?.full_name || user?.username)}>
            {user?.avatar_url ? (
              <img src={getAvatarURL(user.avatar_url)} alt={user.full_name} />
            ) : (
              getInitials(user?.full_name || user?.username || 'U')
            )}
            <OnlineIndicator $isDark={isDarkMode} />
          </ProfileMenuAvatar>
          <ProfileMenuName $isDark={isDarkMode}>
            {user?.full_name || user?.fullName || user?.username || 'Người dùng'}
          </ProfileMenuName>
          <ProfileMenuInfo $isDark={isDarkMode}>
            {user?.username || ''} {user?.department ? `| ${user.department}` : ''}
          </ProfileMenuInfo>
        </ProfileMenuHeader>
        <ProfileMenuList>
          <ProfileMenuItem $isDark={isDarkMode} onClick={() => handleMenuClick('status-feed')}>
            <FiSmile />
            <MenuItemText>Dòng trạng thái</MenuItemText>
            <MenuItemArrow />
          </ProfileMenuItem>
          <ProfileMenuItem $isDark={isDarkMode} onClick={() => handleMenuClick('activity-status')}>
            <FiMessageCircle />
            <MenuItemText>Trạng thái hoạt động</MenuItemText>
            <MenuItemRight>
              <StatusIndicator />
              <span>Đang bật</span>
            </MenuItemRight>
          </ProfileMenuItem>
          <ProfileMenuItem $isDark={isDarkMode} onClick={() => handleMenuClick('saved-messages')}>
            <FiBookmark />
            <MenuItemText>Tin nhắn đã lưu</MenuItemText>
            <MenuItemArrow />
          </ProfileMenuItem>
          <ProfileMenuItem $isDark={isDarkMode} onClick={() => handleMenuClick('interface')}>
            <FiLayers />
            <MenuItemText>Giao diện</MenuItemText>
            <MenuItemArrow />
          </ProfileMenuItem>
          <ProfileMenuItem $isDark={isDarkMode} onClick={() => handleMenuClick('language')}>
            <FiGlobe />
            <MenuItemText>Ngôn ngữ</MenuItemText>
            <MenuItemArrow />
          </ProfileMenuItem>
          <ProfileMenuItem $isDark={isDarkMode} onClick={() => handleMenuClick('settings')}>
            <FiSettings />
            <MenuItemText>Cài đặt</MenuItemText>
            <MenuItemArrow />
          </ProfileMenuItem>
          <ProfileMenuItem $isDark={isDarkMode} onClick={() => handleMenuClick('download-app')}>
            <FiDownload />
            <MenuItemText>Tải ứng dụng</MenuItemText>
            <MenuItemArrow />
          </ProfileMenuItem>
          <ProfileMenuItem $isDark={isDarkMode} onClick={() => handleMenuClick('logout')}>
            <FiLogOut />
            <MenuItemText>Đăng xuất</MenuItemText>
          </ProfileMenuItem>
        </ProfileMenuList>
      </ProfileMenuContainer>

      <SidebarContainer 
        ref={sidebarRef}
        $isDark={isDarkMode} 
        $isVisible={isVisible}
        $width={sidebarWidth}
        $isResizing={isResizing}
      >
        <Resizer 
          $isDark={isDarkMode}
          onMouseDown={handleResizeStart}
        />
        <NavigationBar $isDark={isDarkMode}>
          <UserAvatar 
            ref={avatarRef}
            $color={getAvatarColor(user?.full_name || user?.username)}
            onClick={handleAvatarClick}
          >
            {user?.avatar_url ? (
              <img src={getAvatarURL(user.avatar_url)} alt={user.full_name} />
            ) : (
              getInitials(user?.full_name || user?.username || 'U')
            )}
            <OnlineIndicator $isDark={isDarkMode} />
          </UserAvatar>
        
        <NavIcon 
          $isDark={isDarkMode}
          $active={activeNav === 'chats'}
          onClick={() => setActiveNav('chats')}
          title="Chats"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M6 7C6 5.89543 6.89543 5 8 5H16C17.1046 5 18 5.89543 18 7V13C18 14.1046 17.1046 15 16 15H11L6 19V7Z" fill={activeNav === 'chats' ? '#fff' : '#0068ff'} rx="2"/>
            <circle cx="9.5" cy="10" r="1" fill={activeNav === 'chats' ? '#0068ff' : '#fff'}/>
            <circle cx="12" cy="10" r="1" fill={activeNav === 'chats' ? '#0068ff' : '#fff'}/>
            <circle cx="14.5" cy="10" r="1" fill={activeNav === 'chats' ? '#0068ff' : '#fff'}/>
          </svg>
        </NavIcon>
        
        <NavIcon 
          $isDark={isDarkMode}
          $active={activeNav === 'tasks'}
          onClick={() => setActiveNav('tasks')}
          title="Tasks"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M7 5C6.44772 5 6 5.44772 6 6V18C6 18.5523 6.44772 19 7 19H17C17.5523 19 18 18.5523 18 18V6C18 5.44772 17.5523 5 17 5H7Z" fill="none" stroke={activeNav === 'tasks' ? '#fff' : '#000'} strokeWidth="2" rx="3"/>
            <path d="M6 4C6 3.44772 6.44772 3 7 3H11C11.5523 3 12 3.44772 12 4V5H6V4Z" fill="none" stroke={activeNav === 'tasks' ? '#fff' : '#000'} strokeWidth="1.5" rx="2"/>
            <path d="M6 8H18" stroke={activeNav === 'tasks' ? '#fff' : '#000'} strokeWidth="1.5"/>
            <path d="M9 13L11 15L15 11" stroke={activeNav === 'tasks' ? '#fff' : '#000'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </NavIcon>
        
        <NavIcon 
          $isDark={isDarkMode}
          $active={activeNav === 'projects'}
          onClick={() => setActiveNav('projects')}
          title="Projects"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <defs>
              <linearGradient id="projectGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#1abc9c" />
                <stop offset="100%" stopColor="#16a085" />
              </linearGradient>
            </defs>
            <circle cx="12" cy="6" r="5" fill={activeNav === 'projects' ? 'url(#projectGradient)' : '#1abc9c'}/>
            <path d="M8 12C8 11.4477 8.44772 11 9 11H15C15.5523 11 16 11.4477 16 12V18C16 18.5523 15.5523 19 15 19H9C8.44772 19 8 18.5523 8 18V12Z" fill={activeNav === 'projects' ? 'url(#projectGradient)' : '#16a085'}/>
            <rect x="11" y="14" width="2" height="3" rx="0.5" fill={activeNav === 'projects' ? '#0e7d6a' : '#0e7d6a'}/>
          </svg>
        </NavIcon>
        
        <VersionText $isDark={isDarkMode}>v1.2.0</VersionText>
      </NavigationBar>

      <SidebarContent>
        <ChatsHeader>
          <ChatsTitle $isDark={isDarkMode}>Chats</ChatsTitle>
          <PencilIcon $isDark={isDarkMode} onClick={onNewChat} title="Tạo cuộc trò chuyện mới">
            <FiEdit3 />
          </PencilIcon>
        </ChatsHeader>

        <SearchContainer $isDark={isDarkMode}>
          <SearchInputWrapper>
            <SearchIcon $isDark={isDarkMode}>
              <FiSearch size={16} />
            </SearchIcon>
            <SearchInput
              $isDark={isDarkMode}
              type="text"
              placeholder="Tìm kiếm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </SearchInputWrapper>
        </SearchContainer>

        <FilterButtons>
          <FilterButton 
            $isDark={isDarkMode}
            $active={filter === 'all'}
            onClick={() => setFilter('all')}
          >
            Tất cả
          </FilterButton>
          <FilterButton 
            $isDark={isDarkMode}
            $active={filter === 'unread'}
            onClick={() => setFilter('unread')}
          >
            Chưa đọc
          </FilterButton>
          <FilterButton 
            $isDark={isDarkMode}
            $active={filter === 'muted'}
            onClick={() => setFilter('muted')}
          >
            Tắt thông báo
          </FilterButton>
        </FilterButtons>

        <ConversationsList $isDark={isDarkMode}>
          {!filteredConversations || filteredConversations.length === 0 ? (
            <EmptyState $isDark={isDarkMode}>
              <p>Chưa có cuộc trò chuyện nào</p>
            </EmptyState>
          ) : (
            filteredConversations.map((conversation) => {
              if (!conversation) return null;
              return (
                <ConversationItem
                  key={conversation.id}
                  $selected={selectedConversation?.id === conversation.id}
                  $isDark={isDarkMode}
                  onClick={() => onConversationSelect(conversation)}
                >
                  <SelectionIndicator $selected={selectedConversation?.id === conversation.id} />
                  {(() => {
                    const isGroupChat = conversation.type === 'group' || conversation.conversation_type === 'group';
                    
                    if (isGroupChat) {
                      const participants = participantsMap[conversation.id] || [];
                      const currentUserId = user?.id;
                      
                      // Get top 3 participants (excluding current user)
                      const topParticipants = participants
                        .filter(p => String(p.id) !== String(currentUserId))
                        .slice(0, 3);
                      
                      const totalCount = conversation.participants_count || participants.length;
                      const displayedCount = Math.min(topParticipants.length, 3);
                      const remainingCount = Math.max(0, totalCount - displayedCount);
                      
                      const getAvatarColor = (name) => {
                        const colors = ['#0068ff', '#e74c3c', '#2ecc71', '#f39c12', '#9b59b6', '#1abc9c'];
                        const index = name?.charCodeAt(0) % colors.length || 0;
                        return colors[index];
                      };
                      
                      return (
                        <CompositeAvatarContainer $isDark={isDarkMode}>
                          {topParticipants.length > 0 ? (
                            <>
                              {topParticipants.slice(0, 2).map((participant, index) => (
                                <CompositeAvatarItemComponent
                                  key={participant.id || index}
                                  participant={participant}
                                  getAvatarColor={getAvatarColor}
                                  getAvatarURL={getAvatarURL}
                                  getInitials={getInitials}
                                />
                              ))}
                              {topParticipants.length >= 3 ? (
                                <>
                                  <CompositeAvatarItemComponent
                                    participant={topParticipants[2]}
                                    getAvatarColor={getAvatarColor}
                                    getAvatarURL={getAvatarURL}
                                    getInitials={getInitials}
                                  />
                                  {remainingCount > 0 ? (
                                    <CompositeAvatarBadge $isDark={isDarkMode}>
                                      {remainingCount > 99 ? '99+' : remainingCount}
                                    </CompositeAvatarBadge>
                                  ) : (
                                    <div style={{ width: '100%', height: '100%', background: 'transparent' }} />
                                  )}
                                </>
                              ) : remainingCount > 0 ? (
                                <CompositeAvatarBadge $isDark={isDarkMode}>
                                  {remainingCount > 99 ? '99+' : remainingCount}
                                </CompositeAvatarBadge>
                              ) : (
                                <>
                                  <div style={{ width: '100%', height: '100%', background: 'transparent' }} />
                                  <div style={{ width: '100%', height: '100%', background: 'transparent' }} />
                                </>
                              )}
                            </>
                          ) : (
                            // Placeholder when loading
                            <>
                              <CompositeAvatarItem $color="#0068ff">G</CompositeAvatarItem>
                              <CompositeAvatarItem $color="#2ecc71">C</CompositeAvatarItem>
                              <CompositeAvatarItem $color="#9b59b6">1</CompositeAvatarItem>
                              <CompositeAvatarItem $color="#f39c12">2</CompositeAvatarItem>
                            </>
                          )}
                        </CompositeAvatarContainer>
                      );
                    } else {
                      // Private chat - single avatar
                      return (
                        <Avatar $color={getAvatarColor(conversation.full_name)}>
                          {conversation.avatar_url ? (
                            <img src={getAvatarURL(conversation.avatar_url)} alt={conversation.full_name} />
                          ) : (
                            getInitials(conversation.full_name)
                          )}
                        </Avatar>
                      );
                    }
                  })()}
                  <ConversationInfo>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <ConversationName $isDark={isDarkMode}>
                        {conversationSettings[conversation.id]?.nickname || conversation.full_name || conversation.username}
                      </ConversationName>
                      <TimeStamp $isDark={isDarkMode}>
                        {formatTime(conversation.last_message_time)}
                      </TimeStamp>
                    </div>
                    <LastMessage $isDark={isDarkMode}>
                      {(() => {
                          // Check if last message is a sticker
                          if (conversation.last_message) {
                            try {
                              const parsed = JSON.parse(conversation.last_message);
                              if (parsed && (parsed.packId || parsed.packid || parsed.pack_id) && 
                                  (parsed.stickerIndex !== undefined || parsed.stickerindex !== undefined || parsed.sticker_index !== undefined)) {
                                return 'Bạn đã gửi sticker';
                              }
                            } catch (e) {
                              // Not JSON, continue
                            }
                          }
                          return conversation.last_message || 'Chưa có tin nhắn';
                        })()}
                    </LastMessage>
                  </ConversationInfo>
                  <OptionsButton
                    $isDark={isDarkMode}
                    onClick={(e) => handleOptionsClick(e, conversation.id)}
                    title="Tùy chọn"
                  >
                    <FiMoreVertical />
                  </OptionsButton>
                  {openMenuId === conversation.id && (
                    <OptionsMenu
                      ref={el => menuRefs.current[conversation.id] = el}
                      $isDark={isDarkMode}
                      $top={menuPosition.top}
                      $right={menuPosition.right}
                    >
                      <OptionsMenuItem
                        $isDark={isDarkMode}
                        onClick={() => handleMuteConversation(conversation.id, !conversation.is_muted)}
                      >
                        {conversation.is_muted ? <FiBell /> : <FiBellOff />}
                        {conversation.is_muted ? 'Bật thông báo' : 'Tắt thông báo'}
                      </OptionsMenuItem>
                      <OptionsMenuItem
                        $isDark={isDarkMode}
                        onClick={() => handleDeleteConversation(conversation.id)}
                        className="danger"
                      >
                        <FiTrash2 />
                        Xóa cuộc trò chuyện
                      </OptionsMenuItem>
                    </OptionsMenu>
                  )}
                </ConversationItem>
              );
            })
          )}
        </ConversationsList>
      </SidebarContent>
    </SidebarContainer>
    </>
  );
};

export default Sidebar;
