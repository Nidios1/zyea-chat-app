import React, { useState, useEffect } from 'react';
import styled, { keyframes } from 'styled-components';
import { FiAlertTriangle, FiTrash2 } from 'react-icons/fi';

const fadeIn = keyframes`
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
`;

const slideUp = keyframes`
  from {
    transform: translateY(100%);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
`;

const Overlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
  z-index: 10000;
  display: flex;
  justify-content: center;
  align-items: center;
  animation: ${fadeIn} 0.2s ease;
  padding: 20px;

  @media (max-width: 768px) {
    align-items: flex-end;
    padding: 0;
  }
`;

const Dialog = styled.div`
  background: white;
  border-radius: 16px;
  width: 100%;
  max-width: 400px;
  padding: 24px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  animation: ${slideUp} 0.3s cubic-bezier(0.4, 0, 0.2, 1);

  @media (max-width: 768px) {
    border-radius: 20px 20px 0 0;
    max-width: 100%;
    padding: 24px 20px;
    padding-bottom: calc(24px + env(safe-area-inset-bottom));
  }
`;

const IconWrapper = styled.div`
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 20px;
  color: #dc2626;
  font-size: 28px;
`;

const Title = styled.h3`
  font-size: 18px;
  font-weight: 700;
  color: #1f2937;
  text-align: center;
  margin: 0 0 12px;
  letter-spacing: -0.3px;
`;

const Message = styled.p`
  font-size: 15px;
  color: #6b7280;
  text-align: center;
  line-height: 1.5;
  margin: 0 0 24px;
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 12px;

  @media (max-width: 768px) {
    flex-direction: column-reverse;
  }
`;

const Button = styled.button`
  flex: 1;
  padding: 12px 20px;
  border: none;
  border-radius: 10px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  -webkit-tap-highlight-color: transparent;

  &:active {
    transform: scale(0.98);
  }
`;

const CancelButton = styled(Button)`
  background: #f3f4f6;
  color: #374151;

  &:hover {
    background: #e5e7eb;
  }

  &:active {
    background: #d1d5db;
  }
`;

const ConfirmButton = styled(Button)`
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
  color: white;
  box-shadow: 0 2px 8px rgba(239, 68, 68, 0.3);

  &:hover {
    box-shadow: 0 4px 12px rgba(239, 68, 68, 0.4);
  }

  &:active {
    box-shadow: 0 2px 6px rgba(239, 68, 68, 0.3);
  }
`;

const ConfirmDialog = ({ 
  title = 'Xác nhận',
  message, 
  confirmText = 'Xác nhận',
  cancelText = 'Hủy',
  onConfirm, 
  onCancel,
  type = 'danger' // danger, warning, info
}) => {
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    
    // Prevent body scroll
    document.body.style.overflow = 'hidden';
    
    return () => {
      window.removeEventListener('resize', handleResize);
      document.body.style.overflow = '';
    };
  }, []);

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      if (onCancel) onCancel();
    }
  };

  return (
    <Overlay onClick={handleOverlayClick}>
      <Dialog onClick={(e) => e.stopPropagation()}>
        <IconWrapper>
          {type === 'danger' ? <FiTrash2 /> : <FiAlertTriangle />}
        </IconWrapper>
        <Title>{title}</Title>
        <Message>{message}</Message>
        <ButtonGroup>
          <CancelButton onClick={onCancel}>
            {cancelText}
          </CancelButton>
          <ConfirmButton onClick={onConfirm}>
            {confirmText}
          </ConfirmButton>
        </ButtonGroup>
      </Dialog>
    </Overlay>
  );
};

export default ConfirmDialog;

