import React, { useState, useContext } from 'react';
import styled from 'styled-components';
import { BsQrCodeScan } from 'react-icons/bs';
import { toast } from 'react-toastify';
import AuthContext from '../../contexts/AuthContext';
import QRScanner from './QRScanner';

const Button = styled.button`
  background: ${props => props.variant === 'primary' ? '#0a66ff' : '#fff'};
  color: ${props => props.variant === 'primary' ? '#fff' : '#0a66ff'};
  border: ${props => props.variant === 'primary' ? 'none' : '2px solid #0a66ff'};
  border-radius: ${props => props.rounded ? '50%' : '8px'};
  padding: ${props => props.rounded ? '12px' : '10px 16px'};
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  cursor: pointer;
  font-weight: 600;
  font-size: 14px;
  transition: all 0.2s ease;
  box-shadow: ${props => props.variant === 'primary' ? '0 2px 8px rgba(10, 102, 255, 0.3)' : 'none'};

  &:hover {
    transform: translateY(-1px);
    box-shadow: ${props => props.variant === 'primary' ? '0 4px 12px rgba(10, 102, 255, 0.4)' : '0 2px 8px rgba(10, 102, 255, 0.2)'};
  }

  &:active {
    transform: translateY(0);
  }

  ${props => props.fullWidth && `
    width: 100%;
  `}
`;

/**
 * QR Login Button Component
 * 
 * Props:
 * - variant: 'primary' | 'secondary' (default: 'secondary')
 * - rounded: boolean (default: false) - Makes button circular
 * - showText: boolean (default: true) - Show/hide button text
 * - fullWidth: boolean (default: false) - Make button full width
 * - iconSize: number (default: 20) - Size of QR icon
 * - text: string (default: 'Quét QR đăng nhập PC')
 * 
 * Usage:
 * <QRLoginButton />
 * <QRLoginButton variant="primary" />
 * <QRLoginButton rounded iconSize={24} showText={false} />
 */
const QRLoginButton = ({ 
  variant = 'secondary',
  rounded = false,
  showText = true,
  fullWidth = false,
  iconSize = 20,
  text = 'Quét QR đăng nhập PC'
}) => {
  const [showScanner, setShowScanner] = useState(false);
  const { user } = useContext(AuthContext);

  const handleClick = () => {
    if (!user) {
      toast.warning('Vui lòng đăng nhập để sử dụng tính năng này');
      return;
    }
    setShowScanner(true);
  };

  return (
    <>
      <Button 
        onClick={handleClick}
        variant={variant}
        rounded={rounded}
        fullWidth={fullWidth}
        aria-label="Quét mã QR để đăng nhập PC"
        title={!showText ? 'Quét mã QR để đăng nhập PC' : undefined}
      >
        <BsQrCodeScan size={iconSize} />
        {showText && !rounded && <span>{text}</span>}
      </Button>

      {showScanner && (
        <QRScanner onClose={() => setShowScanner(false)} />
      )}
    </>
  );
};

export default QRLoginButton;

