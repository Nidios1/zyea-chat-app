import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { 
  FiSearch, 
  FiPlus, 
  FiMessageCircle, 
  FiUser, 
  FiUsers, 
  FiGrid, 
  FiHome, 
  FiMaximize,
  FiTrash2,
  FiMail,
  FiEdit,
  FiCheckCircle
} from 'react-icons/fi';
import { BsQrCodeScan, BsPencilSquare } from 'react-icons/bs';
import ChatArea from '../Chat/ChatArea';
import NewsFeed from '../NewsFeed/NewsFeed';
import Friends from '../Friends/Friends';
import MobileContacts from './MobileContacts';
import ProfilePage from '../Profile/ProfilePage';
import PersonalProfilePage from '../Profile/PersonalProfilePage';
import NotificationCenter from '../Notifications/NotificationCenter';
import UserSearch from '../Chat/UserSearch';
import FriendsList from '../Chat/FriendsList';
import PullToRefresh from './PullToRefresh';
import QRScanner from './QRScanner';
import NewMessageModal from './NewMessageModal';
import Toast from './Toast';
import ConfirmDialog from './ConfirmDialog';
import { chatAPI } from '../../utils/api';
import { getInitials } from '../../utils/nameUtils';
const MobileSidebarContainer = styled.div`
  display: none;
  flex-direction: column;
  height: 100vh;
  background: var(--bg-primary, white);
  width: 100vw;
  position: fixed;
  top: 0;
  left: 0;
  z-index: 1000;

  @media (max-width: 768px) {
    display: flex;
  }
`;

const TopBar = styled.div`
  background: var(--header-bg, #0084ff);
  padding: 8px 12px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  color: white;
  position: sticky;
  top: 0;
  z-index: 100;
`;

const SearchSection = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 20px;
  padding: 6px 12px;
`;

const SearchInput = styled.input`
  flex: 1;
  background: none;
  border: none;
  padding: 0;
  color: white;
  font-size: 14px;
  outline: none;

  &::placeholder {
    color: rgba(255, 255, 255, 0.7);
  }
`;

const SearchIcon = styled.div`
  color: rgba(255, 255, 255, 0.9);
  display: flex;
  align-items: center;
  flex-shrink: 0;
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 12px;
  margin-left: 12px;
`;

const ActionButton = styled.button`
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

const Content = styled.div`
  flex: 1;
  overflow-y: auto;
  background: var(--bg-primary, white);
  display: flex;
  flex-direction: column;
  position: relative;
  
  &::-webkit-scrollbar {
    width: 6px;
  }
  
  &::-webkit-scrollbar-track {
    background: transparent;
  }
  
  &::-webkit-scrollbar-thumb {
    background: var(--text-tertiary, #ccc);
    border-radius: 3px;
  }
  
  &::-webkit-scrollbar-thumb:hover {
    background: var(--text-secondary, #999);
  }
`;

const ConversationList = styled.div`
  display: flex;
  flex-direction: column;
  position: relative;
`;

const SwipeContainer = styled.div`
  position: relative;
  overflow: hidden;
  background: var(--bg-primary, white);
  z-index: 2;
`;

const ConversationItem = styled.div`
  padding: 1.25rem 1rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 1rem;
  transition: background 0.15s ease;
  background: ${props => props.selected ? 'var(--bg-secondary, #e3f2fd)' : 'var(--bg-primary, white)'};
  transform: translateX(${props => props.swipeOffset || 0}px);
  position: relative;
  z-index: 10;
  border-left: 4px solid transparent;
  box-shadow: ${props => props.hasUnread ? '0 2px 4px rgba(255, 68, 68, 0.1)' : 'none'};
  -webkit-tap-highlight-color: transparent;
  user-select: none;
  outline: none;

  &:hover {
    background: ${props => props.selected ? 'var(--bg-secondary, #e3f2fd)' : 'var(--bg-secondary, #f8f9fa)'};
  }

  &:active {
    background: ${props => props.selected ? 'var(--bg-secondary, #e3f2fd)' : 'var(--bg-tertiary, #f0f0f0)'};
  }

  &::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 5.5rem;
    right: 0;
    height: 1px;
    background: var(--border-color, #f0f0f0);
  }

  &:last-child::after {
    display: none;
  }

  @media (max-width: 768px) {
    padding: 1rem 0.875rem;
    gap: 0.875rem;
    
    &::after {
      left: 5rem;
    }
  }
`;

const SwipeActions = styled.div`
  position: absolute;
  right: 0;
  top: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  z-index: 1;
  background: linear-gradient(90deg, transparent 0%, rgba(0,0,0,0.1) 100%);
`;

const SwipeActionButton = styled.button`
  width: 90px;
  height: 100%;
  border: none;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.3rem;
  color: white;
  font-size: 0.75rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  -webkit-tap-highlight-color: transparent;

  &:hover {
    opacity: 0.9;
  }

  &:active {
    transform: scale(0.95);
    opacity: 0.85;
  }

  svg {
    font-size: 1.2rem;
  }
`;

const DeleteButton = styled(SwipeActionButton)`
  background: #ff4757;
`;

const UnreadButton = styled(SwipeActionButton)`
  background: #5294ff;
`;

const ReadButton = styled(SwipeActionButton)`
  background: #10b981;
`;

const Avatar = styled.div`
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: ${props => props.color || '#0084ff'};
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 600;
  font-size: 24px;
  position: relative;
  flex-shrink: 0;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);

  @media (max-width: 768px) {
    width: 56px;
    height: 56px;
    font-size: 22px;
  }
`;

const OnlineIndicator = styled.div`
  position: absolute;
  bottom: 2px;
  right: 2px;
  width: 14px;
  height: 14px;
  background: #10b981;
  border: 3px solid white;
  border-radius: 50%;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);

  @media (max-width: 768px) {
    width: 12px;
    height: 12px;
    border: 2px solid white;
    bottom: 1px;
    right: 1px;
  }
`;

const ConversationInfo = styled.div`
  flex: 1;
  min-width: 0;
  overflow: hidden;
`;

const TimeStamp = styled.span`
  font-size: 13px;
  color: var(--text-tertiary, #999);
  white-space: nowrap;
  margin-left: 8px;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-shrink: 0;

  @media (max-width: 768px) {
    font-size: 12px;
  }
`;

const UnreadBadge = styled.div`
  background: linear-gradient(135deg, #ff4444 0%, #ff6666 100%);
  color: white;
  border-radius: 50%;
  min-width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  font-weight: 700;
  padding: 0 0.3rem;
  box-shadow: 0 2px 6px rgba(255, 68, 68, 0.35);
  border: 2px solid var(--bg-primary, white);
  flex-shrink: 0;
  animation: ${props => props.hasUnread ? 'pulse 2s infinite' : 'none'};

  @keyframes pulse {
    0% {
      transform: scale(1);
      box-shadow: 0 2px 6px rgba(255, 68, 68, 0.35);
    }
    50% {
      transform: scale(1.05);
      box-shadow: 0 4px 10px rgba(255, 68, 68, 0.5);
    }
    100% {
      transform: scale(1);
      box-shadow: 0 2px 6px rgba(255, 68, 68, 0.35);
    }
  }

  @media (max-width: 768px) {
    min-width: 22px;
    height: 22px;
    font-size: 0.7rem;
  }
`;

const ConversationName = styled.div`
  font-weight: ${props => props.hasUnread ? '700' : '600'};
  color: ${props => props.hasUnread ? 'var(--text-primary, #1a1a1a)' : 'var(--text-primary, #333)'};
  font-size: 1rem;
  margin-bottom: 0.3rem;
  text-shadow: ${props => props.hasUnread ? '0 1px 2px rgba(0,0,0,0.1)' : 'none'};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  letter-spacing: -0.2px;

  @media (max-width: 768px) {
    font-size: 0.95rem;
  }
`;

const LastMessage = styled.div`
  color: ${props => props.hasUnread ? 'var(--text-primary, #1a1a1a)' : 'var(--text-secondary, #666)'};
  font-size: 0.9rem;
  font-weight: ${props => props.hasUnread ? '600' : '400'};
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-shadow: ${props => props.hasUnread ? '0 1px 2px rgba(0,0,0,0.1)' : 'none'};

  @media (max-width: 768px) {
    font-size: 0.85rem;
  }
`;

const BottomNav = styled.div`
  background: var(--bg-primary, white);
  border-top: 1px solid var(--border-color, #e1e5e9);
  display: flex;
  padding: 8px 0;
  box-shadow: 0 -2px 8px var(--shadow-color, rgba(0, 0, 0, 0.1));
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 1000;
`;

const NavItem = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 8px 4px;
  cursor: pointer;
  transition: all 0.2s ease;
  color: ${props => props.active ? 'var(--primary-color, #0084ff)' : 'var(--text-secondary, #666)'};
  position: relative;

  &:hover {
    color: var(--primary-color, #0084ff);
  }

  &:active {
    opacity: 0.7;
  }
`;

const NavIcon = styled.div`
  position: relative;
  margin-bottom: 4px;
`;

const NavLabel = styled.span`
  font-size: 10px;
  font-weight: 500;
  text-align: center;
`;

const NotificationBadge = styled.div`
  position: absolute;
  top: -4px;
  right: -4px;
  background: #ff4444;
  color: white;
  border-radius: 10px;
  padding: 2px 6px;
  font-size: 10px;
  font-weight: 600;
  min-width: 16px;
  text-align: center;
  line-height: 1.2;
`;

const TabBar = styled.div`
  display: flex;
  background: var(--bg-primary, white);
  border-bottom: 1px solid var(--border-color, #e1e5e9);
  padding: 8px 12px;
  gap: 4px;
  overflow-x: auto;
  position: sticky;
  top: 45px;
  z-index: 99;
  
  &::-webkit-scrollbar {
    display: none;
  }
`;

const Tab = styled.button`
  background: ${props => props.active ? '#2c2c2c' : '#f0f2f5'};
  color: ${props => props.active ? 'white' : '#65676b'};
  border: none;
  border-radius: 20px;
  padding: 6px 16px;
  font-size: 13px;
  font-weight: ${props => props.active ? '600' : '500'};
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 6px;

  &:hover {
    background: ${props => props.active ? '#1a1a1a' : '#e4e6eb'};
  }

  &:active {
    transform: scale(0.95);
  }
`;

const TabBadge = styled.span`
  background: ${props => props.active ? 'rgba(255, 255, 255, 0.3)' : '#ff4444'};
  color: ${props => props.active ? 'white' : 'white'};
  border-radius: 10px;
  padding: 1px 6px;
  font-size: 11px;
  font-weight: 700;
  min-width: 18px;
  text-align: center;
`;

const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  text-align: center;
  color: #666;
  height: 200px;
`;

const EmptyIcon = styled.div`
  font-size: 48px;
  margin-bottom: 16px;
  opacity: 0.5;
`;

const EmptyText = styled.div`
  font-size: 16px;
  margin-bottom: 8px;
  font-weight: 500;
`;

const EmptySubtext = styled.div`
  font-size: 14px;
  color: #999;
  margin-bottom: 20px;
`;

const CreateButton = styled.button`
  background: #0084ff;
  color: white;
  border: none;
  border-radius: 20px;
  padding: 10px 20px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: #0066cc;
    transform: translateY(-1px);
  }

  &:active {
    transform: translateY(0);
  }
`;

const MobileSidebar = ({
  conversations = [],
  selectedConversation,
  onConversationSelect,
  onNewChat,
  onAddFriend,
  onShowFriends,
  onShowNewsFeed,
  onShowProfile,
  onShowNotificationCenter,
  onShowUserSearch,
  onShowFriendsList,
  onLogout,
  user,
  socket,
  onNicknameUpdate
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredConversations, setFilteredConversations] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [currentView, setCurrentView] = useState('messages');
  const [activeTab, setActiveTab] = useState('all'); // all, groups, personal, unread
  const [showNewsFeed, setShowNewsFeed] = useState(false);
  const [showFriends, setShowFriends] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showNotificationCenter, setShowNotificationCenter] = useState(false);
  const [showUserSearch, setShowUserSearch] = useState(false);
  const [showFriendsList, setShowFriendsList] = useState(false);
  const [conversationSettings, setConversationSettings] = useState({});
  const [longPressTimer, setLongPressTimer] = useState(null);
  const [swipeStates, setSwipeStates] = useState({});
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartX, setDragStartX] = useState(0);
  const [dragCurrentX, setDragCurrentX] = useState(0);
  const [readConversations, setReadConversations] = useState(() => {
    try {
      const saved = localStorage.getItem('readConversations');
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch (error) {
      console.error('Error loading read conversations:', error);
      return new Set();
    }
  });
  const [previousConversations, setPreviousConversations] = useState([]);
  const [localConversations, setLocalConversations] = useState(conversations);
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [showNewMessageModal, setShowNewMessageModal] = useState(false);
  const [toast, setToast] = useState(null);
  const [confirmDialog, setConfirmDialog] = useState(null);
  const [isActivityStatusPageOpen, setIsActivityStatusPageOpen] = useState(false);

  // Load conversations on mount - ONLY ONCE
  useEffect(() => {
    const loadConversations = async () => {
      try {
        console.log('🔄 Loading conversations from API...');
        const data = await chatAPI.getConversations();
        console.log('✅ Loaded conversations:', data);
        if (data && Array.isArray(data)) {
          setLocalConversations(data);
        } else {
          console.warn('⚠️ Invalid conversations data:', data);
          setLocalConversations([]);
        }
      } catch (error) {
        console.error('❌ Error loading conversations:', error);
        setLocalConversations([]);
      }
    };

    // Load immediately on mount
    loadConversations();
  }, []);

  // Update localConversations when conversations prop changes (from parent)
  useEffect(() => {
    if (conversations && Array.isArray(conversations) && conversations.length > 0) {
      console.log('📥 Updating conversations from props:', conversations.length);
      setLocalConversations(conversations);
    }
  }, [conversations]);

  // Load conversation settings
  const loadConversationSettings = async (conversationId) => {
    try {
      const settings = await chatAPI.getConversationSettings(conversationId);
      setConversationSettings(prev => ({
        ...prev,
        [conversationId]: settings
      }));
    } catch (error) {
      console.error('Error loading conversation settings:', error);
    }
  };

  // Update nickname
  const handleUpdateNickname = async (conversationId, newNickname) => {
    try {
      await chatAPI.updateNickname(conversationId, newNickname);
      
      // Update conversation settings
      setConversationSettings(prev => ({
        ...prev,
        [conversationId]: {
          ...prev[conversationId],
          nickname: newNickname
        }
      }));
      
      // Update filtered conversations directly to refresh timestamp
      setFilteredConversations(prev => {
        return prev.map(conv => {
          if (conv && conv.id === conversationId) {
            return {
              ...conv,
              updated_at: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            };
          }
          return conv;
        });
      });
      
      // Notify parent component to refresh conversations
      if (onNicknameUpdate) {
        console.log('Calling onNicknameUpdate callback:', conversationId, newNickname);
        onNicknameUpdate(conversationId, newNickname);
      } else {
        console.log('onNicknameUpdate callback not provided');
      }
    } catch (error) {
      console.error('Error updating nickname:', error);
      alert('Có lỗi xảy ra khi cập nhật tên gợi nhớ');
    }
  };

  // Handle long press for nickname
  const handleLongPressStart = (conversationId) => {
    const timer = setTimeout(() => {
      const newNickname = prompt('Nhập tên gợi nhớ mới:', conversationSettings[conversationId]?.nickname || '');
      if (newNickname !== null && newNickname !== '') {
        handleUpdateNickname(conversationId, newNickname);
      }
    }, 800); // 800ms long press
    setLongPressTimer(timer);
  };

  const handleLongPressEnd = () => {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }
  };

  // Swipe functionality
  const handleTouchStart = (e, conversationId) => {
    const touch = e.touches[0];
    setIsDragging(false); // Start as false, only set true when actually moving
    setDragStartX(touch.clientX);
    setDragCurrentX(touch.clientX);
  };

  const handleTouchMove = (e, conversationId) => {
    const currentX = e.touches[0].clientX;
    const deltaX = currentX - dragStartX;
    
    // Only consider it dragging if moved more than 10px
    if (Math.abs(deltaX) > 10) {
      setIsDragging(true);
    }
    
    // Only allow swiping left (negative deltaX)
    if (deltaX < -10) {
      e.preventDefault(); // Prevent scroll when swiping
      setDragCurrentX(currentX);
      setSwipeStates(prev => ({
        ...prev,
        [conversationId]: Math.max(deltaX, -180) // Limit swipe distance
      }));
    }
  };

  const handleTouchEnd = (e, conversationId) => {
    const deltaX = dragCurrentX - dragStartX;
    
    // If swiped more than 60px, keep it open, otherwise close
    if (deltaX < -60) {
      setSwipeStates(prev => ({
        ...prev,
        [conversationId]: -180
      }));
    } else {
      setSwipeStates(prev => ({
        ...prev,
        [conversationId]: 0
      }));
    }
    
    // Reset dragging state after a short delay to allow click to work
    setTimeout(() => {
      setIsDragging(false);
      setDragStartX(0);
      setDragCurrentX(0);
    }, 100);
  };

  const handleSwipeAction = async (conversationId, action) => {
    // Close swipe after action
    setSwipeStates(prev => ({
      ...prev,
      [conversationId]: 0
    }));
    
    // Handle different actions
    switch (action) {
      case 'delete':
        // Show custom confirmation dialog
        setConfirmDialog({
          title: 'Xóa cuộc trò chuyện',
          message: 'Bạn có chắc muốn xóa cuộc trò chuyện này?',
          confirmText: 'Xóa',
          cancelText: 'Hủy',
          onConfirm: async () => {
            setConfirmDialog(null);
            
            try {
              // Delete from API
              await chatAPI.deleteConversation(conversationId);
              
              // Remove from local state immediately
              setLocalConversations(prev => prev.filter(conv => conv.id !== conversationId));
              setFilteredConversations(prev => prev.filter(conv => conv.id !== conversationId));
              
              // Show success toast
              setToast({
                message: 'Đã xóa cuộc trò chuyện',
                type: 'success'
              });
            } catch (error) {
              console.error('Error deleting conversation:', error);
              // Show error toast
              setToast({
                message: 'Không thể xóa cuộc trò chuyện. Vui lòng thử lại.',
                type: 'error'
              });
            }
          },
          onCancel: () => {
            setConfirmDialog(null);
          }
        });
        break;
        
      case 'read':
        try {
          // Call API to mark all messages as read
          await chatAPI.markAllAsRead(conversationId);
          
          // Mark as read in local state
          setReadConversations(prev => {
            const newSet = new Set(prev);
            newSet.add(conversationId);
            return newSet;
          });
          
          // Update conversation to clear unread badge
          setLocalConversations(prev => prev.map(conv => {
            if (conv.id === conversationId) {
              return {
                ...conv,
                unread_count: 0,
                unreadCount: 0
              };
            }
            return conv;
          }));
          
          // Show success toast
          setToast({
            message: 'Đã đánh dấu đã đọc',
            type: 'success'
          });
        } catch (error) {
          console.error('Error marking as read:', error);
          // Still update UI even if API fails
          setReadConversations(prev => {
            const newSet = new Set(prev);
            newSet.add(conversationId);
            return newSet;
          });
          
          setLocalConversations(prev => prev.map(conv => {
            if (conv.id === conversationId) {
              return {
                ...conv,
                unread_count: 0,
                unreadCount: 0
              };
            }
            return conv;
          }));
          
          setToast({
            message: 'Đã đánh dấu đã đọc',
            type: 'success'
          });
        }
        break;
        
      case 'unread':
        try {
          // Call API to mark as unread
          await chatAPI.markAsUnread(conversationId);
          
          // Mark as unread in local state
          setReadConversations(prev => {
            const newSet = new Set(prev);
            newSet.delete(conversationId);
            return newSet;
          });
          
          // Update conversation to move to top and show unread badge
          setLocalConversations(prev => prev.map(conv => {
            if (conv.id === conversationId) {
              return {
                ...conv,
                unread_count: Math.max(1, (conv.unread_count || 0)),
                unreadCount: Math.max(1, (conv.unreadCount || 0)),
                updated_at: new Date().toISOString(),
                updatedAt: new Date().toISOString()
              };
            }
            return conv;
          }));
          
          // Show success toast
          setToast({
            message: 'Đã đánh dấu chưa đọc',
            type: 'info'
          });
        } catch (error) {
          console.error('Error marking as unread:', error);
          // Still update UI even if API fails
          setReadConversations(prev => {
            const newSet = new Set(prev);
            newSet.delete(conversationId);
            return newSet;
          });
          
          setLocalConversations(prev => prev.map(conv => {
            if (conv.id === conversationId) {
              return {
                ...conv,
                unread_count: Math.max(1, (conv.unread_count || 0)),
                unreadCount: Math.max(1, (conv.unreadCount || 0)),
                updated_at: new Date().toISOString(),
                updatedAt: new Date().toISOString()
              };
            }
            return conv;
          }));
          
          // Show warning toast even if API fails but UI updated
          setToast({
            message: 'Đã đánh dấu chưa đọc',
            type: 'info'
          });
        }
        break;
        
      default:
        break;
    }
  };

  // Filter conversations based on search term and active tab
  useEffect(() => {
    try {
      if (!localConversations || !Array.isArray(localConversations)) {
        setFilteredConversations([]);
        return;
      }

      let filtered = localConversations.filter(conv => {
        if (!conv) return false;
        const name = conv.full_name || conv.participant_name || conv.name || '';
        const username = conv.username || '';
        const lastMessage = conv.last_message || conv.lastMessage || '';
        const searchLower = searchTerm.toLowerCase();
        
        // Search filter
        const matchesSearch = name.toLowerCase().includes(searchLower) || 
               username.toLowerCase().includes(searchLower) ||
               lastMessage.toLowerCase().includes(searchLower);
        
        if (!matchesSearch) return false;
        
        // Tab filter
        if (activeTab === 'all') {
          return true;
        } else if (activeTab === 'groups') {
          // Filter for group conversations (you can customize this logic)
          return conv.is_group || conv.isGroup || false;
        } else if (activeTab === 'personal') {
          // Filter for personal conversations (non-group)
          return !conv.is_group && !conv.isGroup;
        } else if (activeTab === 'unread') {
          // Filter for unread conversations
          const unreadCount = conv.unread_count || conv.unreadCount || 0;
          return unreadCount > 0;
        }
        
        return true;
      });

      // Sort by updated_at to show most recent first
      filtered = filtered.sort((a, b) => {
        const dateA = new Date(a.updated_at || a.updatedAt || 0);
        const dateB = new Date(b.updated_at || b.updatedAt || 0);
        return dateB - dateA;
      });

      console.log('Filtered conversations:', filtered);
      console.log('Local conversations:', localConversations);
      setFilteredConversations(filtered);
    } catch (error) {
      console.error('Error filtering conversations:', error);
      setFilteredConversations([]);
    }
  }, [localConversations, searchTerm, activeTab]);

  // Load conversation settings when conversations change
  useEffect(() => {
    if (localConversations && Array.isArray(localConversations)) {
      localConversations.forEach(conv => {
        if (conv && conv.id) {
          loadConversationSettings(conv.id);
        }
      });
    }
  }, [localConversations]);

  // Cleanup long press timer on unmount
  useEffect(() => {
    return () => {
      if (longPressTimer) {
        clearTimeout(longPressTimer);
      }
    };
  }, [longPressTimer]);

  // Calculate unread count
  useEffect(() => {
    try {
      if (!localConversations || !Array.isArray(localConversations)) {
        setUnreadCount(0);
        return;
      }

      const unread = localConversations.reduce((total, conv) => {
        if (!conv) return total;
        return total + (conv.unread_count || conv.unreadCount || 0);
      }, 0);

      setUnreadCount(unread);
    } catch (error) {
      console.error('Error calculating unread count:', error);
      setUnreadCount(0);
    }
  }, [localConversations]);

  // Save read conversations to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem('readConversations', JSON.stringify([...readConversations]));
    } catch (error) {
      console.error('Error saving read conversations:', error);
    }
  }, [readConversations]);

  // Reset read status when conversations change (new messages received)
  useEffect(() => {
    if (localConversations && Array.isArray(localConversations)) {
      // Only reset read status if there are actually new unread messages
      const hasNewUnreadMessages = previousConversations.length > 0 && 
        conversations.some(conv => {
          const prevConv = previousConversations.find(p => p.id === conv.id);
          if (!prevConv) return false;
          const currentUnread = conv.unread_count || conv.unreadCount || 0;
          const prevUnread = prevConv.unread_count || prevConv.unreadCount || 0;
          return currentUnread > prevUnread;
        });

      if (hasNewUnreadMessages) {
        // Reset read status only for conversations with new unread messages
        setReadConversations(prev => {
          const newReadConversations = new Set(prev);
          localConversations.forEach(conv => {
            const actualUnreadCount = conv.unread_count || conv.unreadCount || 0;
            
            // If there are unread messages, remove from read status (show unread effects)
            if (actualUnreadCount > 0) {
              newReadConversations.delete(conv.id);
            }
            // If no unread messages, keep in read status (no unread effects)
            else {
              newReadConversations.add(conv.id);
            }
          });
          return newReadConversations;
        });
      }

      // Update previous conversations
      setPreviousConversations(localConversations);
    }
  }, [localConversations, previousConversations]);

  // Listen for new messages via socket or polling
  useEffect(() => {
    const checkForNewMessages = async () => {
      try {
        // Fetch latest conversations from API
        const data = await chatAPI.getConversations();
        if (data && Array.isArray(data)) {
          setLocalConversations(data);
        }
      } catch (error) {
        console.error('Error fetching conversations in polling:', error);
      }
    };

    // Check every 5 seconds for new messages
    const interval = setInterval(checkForNewMessages, 5000);
    
    return () => clearInterval(interval);
  }, []);

  // Handle pull-to-refresh - Tối ưu để refresh nhanh
  const handleRefresh = async () => {
    try {
      console.log('🔄 Refreshing conversations...');
      
      // Fetch dữ liệu mới từ server
      const data = await chatAPI.getConversations();
      
      if (data && Array.isArray(data)) {
        // Cập nhật conversations với dữ liệu THẬT từ server
        setLocalConversations(data);
        console.log('✅ Conversations refreshed:', data.length, 'conversations');
        
        // Reset read status để hiển thị badge unread mới
        setReadConversations(new Set());
      }
    } catch (error) {
      console.error('❌ Error refreshing conversations:', error);
      throw error; // Re-throw để PullToRefresh biết có lỗi
    }
  };

  // Handle when user exits conversation (selectedConversation becomes null)
  useEffect(() => {
    if (!selectedConversation) {
      // When exiting conversation, refresh the read status based on current unread counts
      // This ensures that if there are new unread messages, they will show the unread effects
      setReadConversations(prev => {
        const newReadConversations = new Set(prev);
        localConversations.forEach(conv => {
          const actualUnreadCount = conv.unread_count || conv.unreadCount || 0;
          
          // If there are unread messages, remove from read status (show unread effects)
          if (actualUnreadCount > 0) {
            newReadConversations.delete(conv.id);
          }
          // If no unread messages, keep in read status (no unread effects)
          else {
            newReadConversations.add(conv.id);
          }
        });
        return newReadConversations;
      });
    }
  }, [selectedConversation, conversations]);

  const formatTimestamp = (timestamp) => {
    try {
      if (!timestamp) return '';
      
      const date = new Date(timestamp);
      const now = new Date();
      const diff = now - date;
      
      const minutes = Math.floor(diff / 60000);
      const hours = Math.floor(diff / 3600000);
      const days = Math.floor(diff / 86400000);
      
      if (minutes < 1) return 'Vừa xong';
      if (minutes < 60) return `${minutes} phút`;
      if (hours < 24) return `${hours} giờ`;
      if (days < 7) return `${days} ngày`;
      
      return date.toLocaleDateString('vi-VN');
    } catch (error) {
      console.error('Error formatting timestamp:', error);
      return '';
    }
  };

  const getAvatarColor = (name) => {
    try {
      if (!name) return '#0084ff';
      
      const colors = [
        '#0084ff', '#00a651', '#ff6b6b', '#4ecdc4', 
        '#45b7d1', '#96ceb4', '#feca57', '#ff9ff3',
        '#54a0ff', '#5f27cd', '#00d2d3', '#ff9f43'
      ];
      
      const hash = name.split('').reduce((a, b) => {
        a = ((a << 5) - a) + b.charCodeAt(0);
        return a & a;
      }, 0);
      
      return colors[Math.abs(hash) % colors.length];
    } catch (error) {
      console.error('Error getting avatar color:', error);
      return '#0084ff';
    }
  };

  const handleNavClick = (view) => {
    setCurrentView(view);
    switch (view) {
      case 'messages':
        setShowNewsFeed(false);
        setShowFriends(false);
        setShowProfile(false);
        setShowNotificationCenter(false);
        setShowUserSearch(false);
        setShowFriendsList(false);
        break;
      case 'contacts':
        setShowFriends(true);
        setShowNewsFeed(false);
        setShowProfile(false);
        setShowNotificationCenter(false);
        setShowUserSearch(false);
        setShowFriendsList(false);
        break;
      case 'discover':
        // Handle discover
        break;
      case 'newsfeed':
        setShowNewsFeed(true);
        setShowFriends(false);
        setShowProfile(false);
        setShowNotificationCenter(false);
        setShowUserSearch(false);
        setShowFriendsList(false);
        break;
      case 'profile':
        setShowProfile(true);
        setShowNewsFeed(false);
        setShowFriends(false);
        setShowNotificationCenter(false);
        setShowUserSearch(false);
        setShowFriendsList(false);
        break;
      default:
        break;
    }
  };

  const navItems = [
    { id: 'messages', label: 'Tin nhắn', icon: FiMessageCircle, badge: unreadCount > 0 ? unreadCount : null },
    { id: 'contacts', label: 'Danh bạ', icon: FiUsers },
    { id: 'discover', label: 'Khám phá', icon: FiGrid },
    { id: 'newsfeed', label: 'Tường nhà', icon: FiHome },
    { id: 'profile', label: 'Cá nhân', icon: FiUser }
  ];

  return (
    <MobileSidebarContainer>
      {!selectedConversation && !showNewsFeed && !showFriends && !showProfile && !showNotificationCenter && !showUserSearch && !showFriendsList && (
        <>
          <TopBar>
            <SearchSection>
              <SearchIcon>
                <FiSearch size={18} />
              </SearchIcon>
              <SearchInput
                type="text"
                placeholder="Tìm kiếm cuộc trò chuyện..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </SearchSection>
            <ActionButtons>
              <ActionButton onClick={() => setShowNewMessageModal(true)} title="Tạo cuộc trò chuyện mới">
                <BsPencilSquare size={20} />
              </ActionButton>
              <ActionButton onClick={() => setShowQRScanner(true)} title="Quét QR đăng nhập PC">
                <BsQrCodeScan size={20} />
              </ActionButton>
            </ActionButtons>
          </TopBar>
          
          <TabBar>
            <Tab 
              active={activeTab === 'all'} 
              onClick={() => setActiveTab('all')}
            >
              Tất cả
            </Tab>
            <Tab 
              active={activeTab === 'groups'} 
              onClick={() => setActiveTab('groups')}
            >
              Nhóm
            </Tab>
            <Tab 
              active={activeTab === 'personal'} 
              onClick={() => setActiveTab('personal')}
            >
              Cá nhân
            </Tab>
            <Tab 
              active={activeTab === 'unread'} 
              onClick={() => setActiveTab('unread')}
            >
              Chưa đọc
              {unreadCount > 0 && (
                <TabBadge active={activeTab === 'unread'}>
                  {unreadCount}
                </TabBadge>
              )}
            </Tab>
          </TabBar>
        </>
      )}

      <Content>
        {showNewsFeed ? (
          <NewsFeed 
            currentUser={user}
            onBack={() => setShowNewsFeed(false)}
            onGoToMessages={() => {
              setShowNewsFeed(false);
              setCurrentView('messages');
            }}
            onNavigateToContacts={() => {
              setShowNewsFeed(false);
              setShowFriends(true);
            }}
            onNavigateToExplore={() => {
              // Handle explore navigation
              console.log('Navigate to explore');
            }}
            onNavigateToProfile={() => {
              setShowNewsFeed(false);
              setShowProfile(true);
            }}
            showBottomNav={false}
          />
        ) : showFriends ? (
          <MobileContacts 
            onBack={() => setShowFriends(false)}
            onCall={(friend) => {
              console.log('Calling friend:', friend);
              // Handle voice call
            }}
            onVideoCall={(friend) => {
              console.log('Video calling friend:', friend);
              // Handle video call
            }}
            onAddFriend={() => {
              setShowFriends(false);
              setShowUserSearch(true);
            }}
          />
        ) : showNotificationCenter ? (
          <NotificationCenter onClose={() => setShowNotificationCenter(false)} />
        ) : showProfile ? (
          <PersonalProfilePage
            user={user}
            onBack={() => setShowProfile(false)}
            onShowProfile={() => {
              // Keep profile open, just log for now
              console.log('View personal page clicked');
            }}
            onNavigateToTab={(tabId) => {
              setShowProfile(false);
              // Handle navigation to other tabs
              switch (tabId) {
                case 'messages':
                  // Already in messages
                  break;
                case 'contacts':
                  setShowFriends(true);
                  break;
                case 'discover':
                  // Handle discover
                  break;
                case 'wall':
                  setShowNewsFeed(true);
                  break;
                case 'profile':
                  // Already in profile
                  break;
                default:
                  break;
              }
            }}
            onLogout={onLogout}
            onActivityStatusChange={(isOpen) => setIsActivityStatusPageOpen(isOpen)}
          />
        ) : showUserSearch ? (
          <UserSearch
            onUserSelect={(user) => {
              onConversationSelect?.(user);
              setShowUserSearch(false);
            }}
            onClose={() => setShowUserSearch(false)}
          />
        ) : showFriendsList ? (
          <FriendsList
            onStartChat={(user) => {
              onConversationSelect?.(user);
              setShowFriendsList(false);
            }}
            onClose={() => setShowFriendsList(false)}
          />
        ) : selectedConversation ? (
          <ChatArea
            conversation={selectedConversation}
            currentUser={user}
            socket={socket}
            onMessageSent={(message) => {
              // Handle message sent
            }}
            onSidebarReload={() => {
              // Handle sidebar reload
            }}
            isMobile={true}
            onBackToSidebar={() => onConversationSelect?.(null)}
            currentView="conversation"
          />
        ) : (
          <PullToRefresh 
            onRefresh={handleRefresh}
            threshold={70}
            refreshText="Kéo xuống để làm mới"
            releaseText="Thả ra để làm mới"
            refreshingText="Đang cập nhật..."
          >
            <ConversationList>
              {filteredConversations.length > 0 ? (
              filteredConversations.map((conv, index) => {
                try {
                  if (!conv) return null;
                  
                  // Get actual unread count from conversation data
                  const actualUnreadCount = conv.unread_count || conv.unreadCount || 0;
                  const isCurrentlySelected = selectedConversation?.id === conv.id;
                  const hasBeenRead = readConversations.has(conv.id);
                  
                  // Show unread effects if:
                  // 1. Not currently selected AND
                  // 2. Has unread messages AND
                  // 3. Not marked as read (user has clicked on it before)
                  const displayHasUnread = !isCurrentlySelected && actualUnreadCount > 0 && !hasBeenRead;
                  
                  return (
                    <SwipeContainer key={conv.id || `conv-${index}`}>
                      <ConversationItem 
                        selected={isCurrentlySelected}
                        swipeOffset={swipeStates[conv.id] || 0}
                        hasUnread={displayHasUnread}
                        onClick={(e) => {
                          try {
                            // Don't open if was dragging (swipe gesture)
                            if (isDragging) {
                              return;
                            }
                            
                            // If already swiped open, close it instead of opening conversation
                            if (swipeStates[conv.id] && swipeStates[conv.id] !== 0) {
                              setSwipeStates(prev => ({
                                ...prev,
                                [conv.id]: 0
                              }));
                              return;
                            }
                            
                            // Mark conversation as read when clicked
                            setReadConversations(prev => new Set([...prev, conv.id]));
                            
                            // Open conversation
                            onConversationSelect?.(conv);
                          } catch (error) {
                            console.error('Error handling conversation click:', error);
                          }
                        }}
                        onTouchStart={(e) => handleTouchStart(e, conv.id)}
                        onTouchMove={(e) => handleTouchMove(e, conv.id)}
                        onTouchEnd={(e) => handleTouchEnd(e, conv.id)}
                      >
                      <Avatar color={getAvatarColor(conv.full_name || conv.participant_name || conv.name)}>
                        {conv.avatar_url ? (
                          <img src={conv.avatar_url} alt={conv.full_name} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                        ) : (
                          getInitials(conv.full_name || conv.participant_name || conv.name)
                        )}
                        {(conv.participant_status || conv.status) === 'online' && <OnlineIndicator />}
                      </Avatar>
                      <ConversationInfo>
                        <ConversationName hasUnread={displayHasUnread}>
                          {conversationSettings[conv.id]?.nickname || conv.full_name || conv.participant_name || conv.name || 'Unknown'}
                        </ConversationName>
                        <LastMessage hasUnread={displayHasUnread}>
                          {conv.last_message || conv.lastMessage || 'Chưa có tin nhắn'}
                        </LastMessage>
                      </ConversationInfo>
                      <TimeStamp>
                        {formatTimestamp(conv.updated_at || conv.updatedAt)}
                        {displayHasUnread && (
                          <UnreadBadge hasUnread={displayHasUnread}>
                            {actualUnreadCount}
                          </UnreadBadge>
                        )}
                      </TimeStamp>
                      </ConversationItem>
                      
                      <SwipeActions>
                        {actualUnreadCount > 0 ? (
                          <ReadButton onClick={(e) => {
                            e.stopPropagation();
                            handleSwipeAction(conv.id, 'read');
                          }}>
                            <FiCheckCircle />
                            Đã đọc
                          </ReadButton>
                        ) : (
                          <UnreadButton onClick={(e) => {
                            e.stopPropagation();
                            handleSwipeAction(conv.id, 'unread');
                          }}>
                            <FiMail />
                            Chưa đọc
                          </UnreadButton>
                        )}
                        <DeleteButton onClick={(e) => {
                          e.stopPropagation();
                          handleSwipeAction(conv.id, 'delete');
                        }}>
                          <FiTrash2 />
                          Xóa
                        </DeleteButton>
                      </SwipeActions>
                    </SwipeContainer>
                  );
                } catch (error) {
                  console.error('Error rendering conversation item:', error);
                  return null;
                }
              })
            ) : (
              <EmptyState>
                <EmptyIcon>💬</EmptyIcon>
                <EmptyText>
                  {searchTerm ? 'Không tìm thấy cuộc trò chuyện nào' : 'Chưa có cuộc trò chuyện nào'}
                </EmptyText>
                <EmptySubtext>
                  {searchTerm ? 'Thử tìm kiếm với từ khóa khác' : 'Bắt đầu trò chuyện với bạn bè'}
                </EmptySubtext>
                <CreateButton onClick={onNewChat}>
                  Tạo cuộc trò chuyện mới
                </CreateButton>
              </EmptyState>
            )}
            </ConversationList>
          </PullToRefresh>
        )}
      </Content>

      {!selectedConversation && !showProfile && (
        <BottomNav>
          {navItems.map((item) => (
            <NavItem 
              key={item.id} 
              active={item.id === currentView}
              onClick={() => handleNavClick(item.id)}
            >
              <NavIcon>
                <item.icon size={20} />
                {item.badge && item.badge > 0 && (
                  <NotificationBadge>{item.badge}</NotificationBadge>
                )}
              </NavIcon>
              <NavLabel>{item.label}</NavLabel>
            </NavItem>
          ))}
        </BottomNav>
      )}

      {showQRScanner && (
        <QRScanner onClose={() => setShowQRScanner(false)} />
      )}

      {showNewMessageModal && (
        <NewMessageModal
          onClose={() => setShowNewMessageModal(false)}
          onSelectUser={(user) => {
            console.log('Selected user:', user);
            // Start conversation with selected user
            if (onConversationSelect) {
              onConversationSelect(user);
            }
          }}
          onCreateGroup={() => {
            console.log('Create group clicked');
            // Handle create group
            if (onNewChat) {
              onNewChat();
            }
          }}
        />
      )}

      {/* Toast Notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          duration={3000}
          onClose={() => setToast(null)}
        />
      )}

      {/* Confirmation Dialog */}
      {confirmDialog && (
        <ConfirmDialog
          title={confirmDialog.title}
          message={confirmDialog.message}
          confirmText={confirmDialog.confirmText}
          cancelText={confirmDialog.cancelText}
          onConfirm={confirmDialog.onConfirm}
          onCancel={confirmDialog.onCancel}
          type="danger"
        />
      )}
    </MobileSidebarContainer>
  );
};

export default MobileSidebar;

