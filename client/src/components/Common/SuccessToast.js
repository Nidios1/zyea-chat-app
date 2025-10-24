import React from 'react';
import styled, { keyframes } from 'styled-components';
import { FiCheckCircle } from 'react-icons/fi';

const slideIn = keyframes`
  from {
    opacity: 0;
    transform: translate(-50%, -100px);
  }
  to {
    opacity: 1;
    transform: translate(-50%, 0);
  }
`;

const pulse = keyframes`
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.1);
  }
  100% {
    transform: scale(1);
  }
`;

const ToastContainer = styled.div`
  position: fixed;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 10001;
  animation: ${slideIn} 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55);
  
  @media (max-width: 768px) {
    top: 10px;
    left: 10px;
    right: 10px;
    transform: none;
  }
`;

const Toast = styled.div`
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: white;
  padding: 16px 24px;
  border-radius: 16px;
  box-shadow: 0 10px 40px rgba(16, 185, 129, 0.4);
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 320px;
  max-width: 500px;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  
  @media (max-width: 768px) {
    min-width: auto;
    width: 100%;
    padding: 14px 18px;
    border-radius: 12px;
  }
`;

const IconWrapper = styled.div`
  width: 48px;
  height: 48px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  animation: ${pulse} 1s ease-in-out;
  
  svg {
    width: 28px;
    height: 28px;
    stroke-width: 2.5;
  }
  
  @media (max-width: 768px) {
    width: 40px;
    height: 40px;
    
    svg {
      width: 24px;
      height: 24px;
    }
  }
`;

const Content = styled.div`
  flex: 1;
`;

const Title = styled.div`
  font-size: 16px;
  font-weight: 700;
  margin-bottom: 4px;
  letter-spacing: -0.2px;
  
  @media (max-width: 768px) {
    font-size: 15px;
  }
`;

const Message = styled.div`
  font-size: 14px;
  opacity: 0.95;
  line-height: 1.4;
  
  @media (max-width: 768px) {
    font-size: 13px;
  }
`;

const SuccessToast = ({ title = "Thành công!", message, onClose }) => {
  React.useEffect(() => {
    // Auto close sau 3 giây
    const timer = setTimeout(() => {
      if (onClose) onClose();
    }, 3000);
    
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <ToastContainer>
      <Toast>
        <IconWrapper>
          <FiCheckCircle />
        </IconWrapper>
        <Content>
          <Title>{title}</Title>
          {message && <Message>{message}</Message>}
        </Content>
      </Toast>
    </ToastContainer>
  );
};

export default SuccessToast;

