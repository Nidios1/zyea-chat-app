import React from 'react';
import styled from 'styled-components';
import { FiMessageCircle, FiUsers, FiGrid, FiUser } from 'react-icons/fi';

const BottomNav = styled.div`
  background: var(--bg-primary, white);
  display: flex;
  flex-direction: column;
  box-shadow: 0 -2px 8px var(--shadow-color, rgba(0, 0, 0, 0.08));
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 1000;
  padding-bottom: max(env(safe-area-inset-bottom, 0), 8px);
  min-height: 60px;
  pointer-events: auto;
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
  color: ${props => props.active ? 'var(--primary-color, #0084ff)' : 'var(--text-secondary, #666)'};
  position: relative;
  min-height: var(--touch-min, 44px);
  gap: clamp(2px, 0.5vw, 4px);
  -webkit-tap-highlight-color: transparent;
  user-select: none;

  &:hover {
    color: var(--primary-color, #0084ff);
  }

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

const MobileBottomNav = ({ currentView, onViewChange, unreadCount }) => {
  const navItems = [
    { id: 'messages', label: 'Tin nhắn', icon: FiMessageCircle, badge: unreadCount > 0 ? unreadCount : null },
    { id: 'contacts', label: 'Danh bạ', icon: FiUsers },
    { id: 'discover', label: 'Khám phá', icon: FiGrid },
    { id: 'profile', label: 'Cá nhân', icon: FiUser }
  ];

  return (
    <BottomNav>
      <NavItemsContainer>
        {navItems.map((item) => (
          <NavItem 
            key={item.id} 
            active={item.id === currentView}
            onClick={() => onViewChange(item.id)}
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
      </NavItemsContainer>
    </BottomNav>
  );
};

export default MobileBottomNav;

