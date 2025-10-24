import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { FiFingerprint, FiUser } from 'react-icons/fi';
import { motion } from 'framer-motion';
import useBiometric from '../../hooks/useBiometric';
import { fade, scaleIn } from '../../utils/nativeAnimations';

/**
 * Biometric Login Component
 * Shows biometric login option if available
 */

const Container = styled(motion.div)`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.5rem;
  padding: 2rem;
  background: white;
  border-radius: 16px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
`;

const BiometricButton = styled(motion.button)`
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: linear-gradient(135deg, #0084ff 0%, #00a651 100%);
  border: none;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 4px 16px rgba(0, 132, 255, 0.3);
  transition: all 0.3s ease;

  &:hover {
    transform: scale(1.05);
    box-shadow: 0 6px 20px rgba(0, 132, 255, 0.4);
  }

  &:active {
    transform: scale(0.95);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const Title = styled.h3`
  margin: 0;
  color: #333;
  font-size: 18px;
  font-weight: 600;
`;

const Subtitle = styled.p`
  margin: 0;
  color: #666;
  font-size: 14px;
  text-align: center;
`;

const FallbackButton = styled(motion.button)`
  background: none;
  border: 1px solid #ddd;
  color: #666;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.2s ease;

  &:hover {
    background: #f5f5f5;
    border-color: #0084ff;
    color: #0084ff;
  }
`;

const StatusMessage = styled.div`
  padding: 0.5rem 1rem;
  border-radius: 8px;
  font-size: 13px;
  background: ${props => props.error ? '#fff0f0' : '#f0f9ff'};
  color: ${props => props.error ? '#d32f2f' : '#0084ff'};
`;

const BiometricLogin = ({ 
  onSuccess, 
  onFallback,
  showFallback = true 
}) => {
  const { 
    isAvailable, 
    biometricName, 
    isChecking, 
    authenticate 
  } = useBiometric();

  const [status, setStatus] = useState('');
  const [error, setError] = useState(false);

  useEffect(() => {
    if (isAvailable) {
      setStatus(`Sẵn sàng đăng nhập bằng ${biometricName}`);
    } else {
      setStatus('Sinh trắc học không khả dụng');
    }
  }, [isAvailable, biometricName]);

  const handleBiometricLogin = async () => {
    setStatus('Đang xác thực...');
    setError(false);

    const result = await authenticate({
      reason: 'Đăng nhập vào Zyea+',
      title: 'Xác thực sinh học',
      description: 'Sử dụng sinh trắc học để đăng nhập nhanh chóng'
    });

    if (result.success) {
      setStatus('Xác thực thành công! ✓');
      setError(false);
      
      // Delay để user thấy message
      setTimeout(() => {
        if (onSuccess) {
          onSuccess();
        }
      }, 500);
    } else {
      setStatus(result.error || 'Xác thực thất bại');
      setError(true);
    }
  };

  if (!isAvailable) {
    return null; // Don't show if not available
  }

  return (
    <Container
      variants={fade}
      initial="initial"
      animate="animate"
      exit="exit"
    >
      <BiometricButton
        onClick={handleBiometricLogin}
        disabled={isChecking}
        variants={scaleIn}
        whileTap={{ scale: 0.9 }}
      >
        <FiFingerprint size={40} />
      </BiometricButton>

      <div style={{ textAlign: 'center' }}>
        <Title>Đăng nhập nhanh</Title>
        <Subtitle>Chạm để sử dụng {biometricName}</Subtitle>
      </div>

      {status && (
        <StatusMessage error={error}>
          {status}
        </StatusMessage>
      )}

      {showFallback && (
        <FallbackButton
          onClick={onFallback}
          variants={fade}
        >
          <FiUser size={16} />
          Đăng nhập bằng tài khoản
        </FallbackButton>
      )}
    </Container>
  );
};

export default BiometricLogin;

