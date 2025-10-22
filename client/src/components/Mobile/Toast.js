import React, { useState, useEffect } from 'react';
import styled, { keyframes } from 'styled-components';
import { FiCheckCircle, FiAlertCircle, FiInfo, FiX } from 'react-icons/fi';

const slideIn = keyframes`
  from {
    transform: translateY(-100%) translateX(-50%);
    opacity: 0;
  }
  to {
    transform: translateY(0) translateX(-50%);
    opacity: 1;
  }
`;

const slideOut = keyframes`
  from {
    transform: translateY(0) translateX(-50%);
    opacity: 1;
  }
  to {
    transform: translateY(-100%) translateX(-50%);
    opacity: 0;
  }
`;

const ToastContainer = styled.div`
  position: fixed;
  top: ${props => props.$isMobile ? 'calc(16px + env(safe-area-inset-top))' : '24px'};
  left: 50%;
  transform: translateX(-50%);
  z-index: 10000;
  animation: ${props => props.$closing ? slideOut : slideIn} 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  max-width: 90%;
  min-width: 280px;

  @media (min-width: 769px) {
    min-width: 320px;
  }
`;

const ToastCard = styled.div`
  background: ${props => {
    switch (props.$type) {
      case 'success': return 'linear-gradient(135deg, #10b981 0%, #059669 100%)';
      case 'error': return 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)';
      case 'info': return 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)';
      default: return 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)';
    }
  }};
  color: white;
  padding: 14px 16px;
  border-radius: 12px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3), 0 4px 10px rgba(0, 0, 0, 0.2);
  display: flex;
  align-items: center;
  gap: 12px;
  backdrop-filter: blur(10px);
`;

const IconWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  font-size: 24px;
`;

const Content = styled.div`
  flex: 1;
  min-width: 0;
`;

const Message = styled.div`
  font-size: 15px;
  font-weight: 500;
  line-height: 1.4;
  word-break: break-word;
`;

const CloseButton = styled.button`
  background: rgba(255, 255, 255, 0.2);
  border: none;
  color: white;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  flex-shrink: 0;

  &:hover {
    background: rgba(255, 255, 255, 0.3);
  }

  &:active {
    transform: scale(0.9);
  }
`;

const Toast = ({ message, type = 'info', duration = 3000, onClose }) => {
  const [closing, setClosing] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      handleClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration]);

  const handleClose = () => {
    setClosing(true);
    setTimeout(() => {
      if (onClose) onClose();
    }, 300);
  };

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <FiCheckCircle />;
      case 'error':
        return <FiAlertCircle />;
      case 'info':
        return <FiInfo />;
      default:
        return <FiInfo />;
    }
  };

  return (
    <ToastContainer $closing={closing} $isMobile={isMobile}>
      <ToastCard $type={type}>
        <IconWrapper>{getIcon()}</IconWrapper>
        <Content>
          <Message>{message}</Message>
        </Content>
        <CloseButton onClick={handleClose}>
          <FiX size={16} />
        </CloseButton>
      </ToastCard>
    </ToastContainer>
  );
};

export default Toast;

