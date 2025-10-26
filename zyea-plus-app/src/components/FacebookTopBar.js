import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { FiSearch, FiMessageCircle } from 'react-icons/fi';
import { openMessengerApp } from '../utils/appLauncher';

const TopBar = styled.div`
  background: #0084ff;
  padding: 8px 12px;
  padding-top: calc(env(safe-area-inset-top, 0px) + 8px);
  display: flex;
  align-items: center;
  justify-content: space-between;
  color: white;
  position: sticky;
  top: 0;
  z-index: 100;
  flex-shrink: 0;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
`;

const LogoSection = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const Logo = styled.div`
  font-size: 24px;
  font-weight: bold;
  color: white;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
`;

const SearchButton = styled.button`
  flex: 1;
  display: flex;
  align-items: center;
  gap: 8px;
  background: rgba(255, 255, 255, 0.2);
  border: none;
  border-radius: 20px;
  padding: 8px 12px;
  color: white;
  font-size: 15px;
  cursor: pointer;
  margin: 0 12px;
  max-width: 400px;
  -webkit-tap-highlight-color: transparent;

  &:active {
    background: rgba(255, 255, 255, 0.3);
  }
`;

const SearchIcon = styled.div`
  color: rgba(255, 255, 255, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
`;

const SearchText = styled.span`
  color: rgba(255, 255, 255, 0.9);
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 8px;
  align-items: center;
`;

const ActionButton = styled.button`
  background: rgba(255, 255, 255, 0.2);
  border: none;
  padding: 8px;
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: background 0.2s ease;
  min-width: 40px;
  min-height: 40px;
  -webkit-tap-highlight-color: transparent;
  position: relative;

  &:active {
    background: rgba(255, 255, 255, 0.3);
    opacity: 0.7;
    transform: scale(0.95);
  }
`;

const NotificationBadge = styled.div`
  position: absolute;
  top: 4px;
  right: 4px;
  background: #ff4444;
  color: white;
  font-size: 10px;
  font-weight: bold;
  padding: 2px 5px;
  border-radius: 10px;
  min-width: 18px;
  text-align: center;
  border: 2px solid #0084ff;
  line-height: 1;
`;

const FacebookTopBar = ({ unreadMessagesCount = 0, onSearchClick }) => {
  const [unreadCount, setUnreadCount] = useState(unreadMessagesCount);

  useEffect(() => {
    setUnreadCount(unreadMessagesCount);
  }, [unreadMessagesCount]);

  const handleMessengerClick = async () => {
    console.log('Opening Messenger app...');
    await openMessengerApp(unreadCount);
  };

  const handleSearchClick = () => {
    if (onSearchClick) {
      onSearchClick();
    } else {
      alert('Chức năng tìm kiếm đang được phát triển');
    }
  };

  return (
    <TopBar>
      <LogoSection>
        <Logo>facebook</Logo>
      </LogoSection>

      <SearchButton onClick={handleSearchClick}>
        <SearchIcon>
          <FiSearch />
        </SearchIcon>
        <SearchText>Tìm kiếm trên Facebook</SearchText>
      </SearchButton>

      <ActionButtons>
        <ActionButton onClick={handleMessengerClick} title="Mở Messenger">
          <FiMessageCircle size={22} />
          {unreadCount > 0 && (
            <NotificationBadge>
              {unreadCount > 99 ? '99+' : unreadCount}
            </NotificationBadge>
          )}
        </ActionButton>
      </ActionButtons>
    </TopBar>
  );
};

export default FacebookTopBar;

