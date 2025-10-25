import React from 'react';
import styled from 'styled-components';
import { FiArrowLeft, FiUsers, FiUser, FiHome } from 'react-icons/fi';

const NavigationIndicator = styled.div`
  position: fixed;
  top: 50%;
  left: 20px;
  transform: translateY(-50%);
  background: rgba(0, 0, 0, 0.8);
  color: white;
  padding: 12px 16px;
  border-radius: 25px;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 500;
  z-index: 1000;
  opacity: ${props => props.visible ? 1 : 0};
  transition: all 0.3s ease;
  backdrop-filter: blur(10px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
`;

const IconWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 50%;
`;

const SmartNavigationIndicator = ({ visible, navigationTarget }) => {
  if (!navigationTarget) return null;

  const getIcon = (action) => {
    switch (action) {
      case 'goToSidebar':
        return <FiArrowLeft size={16} />;
      case 'goToFriends':
        return <FiUsers size={16} />;
      case 'goToProfile':
        return <FiUser size={16} />;
      case 'goToNewsFeed':
        return <FiHome size={16} />;
      default:
        return <FiArrowLeft size={16} />;
    }
  };

  return (
    <NavigationIndicator visible={visible}>
      <IconWrapper>
        {getIcon(navigationTarget.action)}
      </IconWrapper>
      {navigationTarget.description}
    </NavigationIndicator>
  );
};

export default SmartNavigationIndicator;
