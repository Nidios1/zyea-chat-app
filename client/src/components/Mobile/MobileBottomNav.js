import React from 'react';
import styled from 'styled-components';
import { FiMessageCircle, FiUsers, FiUser, FiBell, FiHome, FiMenu } from 'react-icons/fi';

const BottomNav = styled.div`
  background: var(--bg-primary);
  display: flex;
  flex-direction: column;
  box-shadow: 0 -2px 8px var(--shadow-color);
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 1000;
  padding-bottom: max(env(safe-area-inset-bottom, 0), 8px);
  min-height: 60px;
  pointer-events: auto;
  
  /* Smooth slide animation */
  transform: translateY(${props => props.hidden ? '100%' : '0'});
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  
  /* Optimize animation performance */
  will-change: transform;
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
`;

const NavItemsContainer = styled.div`
  display: flex;
  padding: 2px 0;
`;

const NavItem = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: clamp(6px, 1.5vw, 8px) clamp(4px, 1vw, 6px);
  cursor: pointer;
  transition: all var(--duration-fast, 150ms) var(--ease-out, ease);
  color: ${props => {
    if (props.active && props.isProfile) return 'var(--primary-color)';
    if (props.active && props.isFeedBoard) return 'var(--primary-color)';
    if (props.active) return 'var(--primary-color)';
    return 'var(--text-secondary)';
  }};
  position: relative;
  min-height: var(--touch-min, 44px);
  gap: clamp(2px, 0.5vw, 4px);
  -webkit-tap-highlight-color: transparent;
  user-select: none;

  /* Remove hover color change to match design */
  /* &:hover {
    color: var(--primary-color, #0084ff);
  } */

  &:active {
    transform: scale(0.95);
    opacity: 0.8;
  }
  
  @media (max-width: 768px) and (orientation: landscape) {
    min-height: 36px;
    padding: 4px 2px;
    gap: 1px;
  }
`;

const NavIcon = styled.div`
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: clamp(19px, 4.5vw, 22px);
  
  @media (max-width: 768px) and (orientation: landscape) {
    font-size: 18px;
  }
`;

const NavLabel = styled.span`
  font-size: clamp(10px, 2.25vw, 11px);
  font-weight: 500;
  text-align: center;
  white-space: nowrap;
  line-height: 1.2;
  
  @media (max-width: 768px) and (orientation: landscape) {
    font-size: 9px;
  }
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

const ActiveDot = styled.div`
  position: absolute;
  top: -2px;
  right: 50%;
  transform: translateX(50%);
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: ${props => props.color || '#0084ff'};
`;

const MobileBottomNav = ({ currentView, onViewChange, unreadCount, isScrollingDown }) => {
  // Hide bottom nav when on profile tab
  if (currentView === 'profile') {
    return null;
  }

  const navItems = [
    { id: 'feedboard', label: 'Bảng feed', icon: FiHome },
    { id: 'contacts', label: 'Bạn bè', icon: FiUsers },
    { id: 'messages', label: 'Tin nhắn', icon: FiMessageCircle, badge: unreadCount > 0 ? unreadCount : null },
    { id: 'notifications', label: 'Thông báo', icon: FiBell, badge: 0 },
    { id: 'profile', label: 'Cá nhân', icon: FiMenu }
  ];

  return (
    <BottomNav hidden={isScrollingDown}>
      <NavItemsContainer>
        {navItems.map((item) => (
          <NavItem 
            key={item.id} 
            active={item.id === currentView}
            isFeedBoard={item.id === 'feedboard'}
            isProfile={item.id === 'profile'}
            onClick={() => onViewChange(item.id)}
          >
            <NavIcon>
              <item.icon size={20} />
              {item.id === currentView && (
                <ActiveDot color={item.id === 'profile' ? '#00a651' : item.id === 'feedboard' ? '#ff6b35' : '#0084ff'} />
              )}
              {item.badge !== null && item.badge !== undefined && item.badge > 0 && (
                <NotificationBadge>{item.badge}</NotificationBadge>
              )}
            </NavIcon>
            <NavLabel>{item.label}</NavLabel>
          </NavItem>
        ))}
      </NavItemsContainer>
    </BottomNav>
  );
};

export default MobileBottomNav;

