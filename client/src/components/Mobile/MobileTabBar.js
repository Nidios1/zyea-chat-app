import React from 'react';
import styled from 'styled-components';

const TabBar = styled.div`
  display: flex;
  background: var(--bg-primary, white);
  border-bottom: 1px solid var(--border-color, #e1e5e9);
  padding: 8px 12px 12px 12px;
  gap: 4px;
  overflow-x: auto;
  position: sticky;
  top: calc(56px + env(safe-area-inset-top, 0px));
  z-index: 99;
  flex-shrink: 0;
  
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

const MobileTabBar = ({ activeTab, onTabChange, unreadCount }) => {
  const tabs = [
    { id: 'all', label: 'Tất cả' },
    { id: 'groups', label: 'Nhóm' },
    { id: 'personal', label: 'Cá nhân' },
    { id: 'unread', label: 'Chưa đọc', badge: unreadCount }
  ];

  return (
    <TabBar>
      {tabs.map(tab => (
        <Tab 
          key={tab.id}
          active={activeTab === tab.id} 
          onClick={() => onTabChange(tab.id)}
        >
          {tab.label}
          {tab.badge > 0 && (
            <TabBadge active={activeTab === tab.id}>
              {tab.badge}
            </TabBadge>
          )}
        </Tab>
      ))}
    </TabBar>
  );
};

export default MobileTabBar;

