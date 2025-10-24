import React, { useState, useEffect } from 'react';
import styled, { keyframes } from 'styled-components';
import { getCurrentVersion } from '../../utils/liveUpdate';

// Animation for loading
const fadeIn = keyframes`
  from {
    opacity: 0;
    transform: scale(0.8);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
`;

const pulse = keyframes`
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.05);
  }
  100% {
    transform: scale(1);
  }
`;

const float = keyframes`
  0%, 100% {
    transform: translateY(0px);
  }
  50% {
    transform: translateY(-10px);
  }
`;

const SplashContainer = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: linear-gradient(135deg, #0084ff 0%, #00a651 100%);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  animation: ${fadeIn} 0.5s ease-out;
`;

const LogoContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  animation: ${pulse} 2s ease-in-out infinite;
`;

const AppIcon = styled.div`
  width: 120px;
  height: 120px;
  border-radius: 26px;
  overflow: hidden;
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.3);
  background: rgba(255, 255, 255, 0.15);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 1.5rem;
  
  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  
  @media (max-width: 768px) {
    width: 100px;
    height: 100px;
    border-radius: 22px;
  }
  
  @media (max-width: 480px) {
    width: 90px;
    height: 90px;
    border-radius: 20px;
  }
`;

const Logo = styled.div`
  font-size: 3rem;
  font-weight: 700;
  color: white;
  text-align: center;
  margin-bottom: 0.5rem;
  letter-spacing: -0.5px;
  
  @media (max-width: 768px) {
    font-size: 2.5rem;
  }
  
  @media (max-width: 480px) {
    font-size: 2.2rem;
  }
`;

const Subtitle = styled.div`
  font-size: 1rem;
  color: rgba(255, 255, 255, 0.85);
  font-weight: 400;
  margin-bottom: 3rem;
  letter-spacing: 0.3px;
  
  @media (max-width: 768px) {
    font-size: 0.9rem;
    margin-bottom: 2.5rem;
  }
  
  @media (max-width: 480px) {
    font-size: 0.85rem;
    margin-bottom: 2rem;
  }
`;

const LoadingDots = styled.div`
  display: flex;
  gap: 0.5rem;
  margin-bottom: 2rem;
`;

const Dot = styled.div`
  width: 12px;
  height: 12px;
  background: white;
  border-radius: 50%;
  animation: ${float} 1.5s ease-in-out infinite;
  animation-delay: ${props => props.delay}s;
  opacity: 0.8;
`;

const NetworkPattern = styled.div`
  position: absolute;
  bottom: 2rem;
  right: 2rem;
  width: 120px;
  height: 120px;
  opacity: 0.3;
  
  &::before {
    content: '';
    position: absolute;
    width: 100%;
    height: 100%;
    background: 
      radial-gradient(circle at 20% 20%, white 2px, transparent 2px),
      radial-gradient(circle at 80% 20%, white 2px, transparent 2px),
      radial-gradient(circle at 20% 80%, white 2px, transparent 2px),
      radial-gradient(circle at 80% 80%, white 2px, transparent 2px),
      radial-gradient(circle at 50% 50%, white 2px, transparent 2px);
    background-size: 30px 30px;
    animation: ${float} 3s ease-in-out infinite;
  }
  
  &::after {
    content: '';
    position: absolute;
    width: 100%;
    height: 100%;
    background: 
      linear-gradient(45deg, transparent 48%, white 49%, white 51%, transparent 52%),
      linear-gradient(-45deg, transparent 48%, white 49%, white 51%, transparent 52%);
    background-size: 20px 20px;
    animation: ${float} 3s ease-in-out infinite reverse;
  }
  
  @media (max-width: 768px) {
    width: 80px;
    height: 80px;
    bottom: 1rem;
    right: 1rem;
  }
`;

const ProgressBar = styled.div`
  width: 200px;
  height: 4px;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 2px;
  overflow: hidden;
  margin-bottom: 1rem;
  
  @media (max-width: 768px) {
    width: 150px;
  }
`;

const ProgressFill = styled.div`
  height: 100%;
  background: white;
  border-radius: 2px;
  width: ${props => props.progress}%;
  transition: width 0.3s ease;
  box-shadow: 0 0 10px rgba(255, 255, 255, 0.5);
`;

const StatusText = styled.div`
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.8);
  text-align: center;
  
  @media (max-width: 768px) {
    font-size: 0.8rem;
  }
`;

const VersionInfo = styled.div`
  position: absolute;
  bottom: 20px;
  left: 0;
  right: 0;
  text-align: center;
  font-size: 0.7rem;
  color: rgba(255, 255, 255, 0.5);
  font-weight: 400;
  letter-spacing: 0.3px;
  
  @media (max-width: 768px) {
    font-size: 0.65rem;
    bottom: 18px;
  }
  
  @media (max-width: 480px) {
    font-size: 0.6rem;
    bottom: 15px;
  }
  
  @media (max-width: 360px) {
    font-size: 0.55rem;
    bottom: 12px;
  }
`;

const SplashScreen = ({ onComplete, isVisible = true, loadingProgress = 0 }) => {
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('Đang khởi động...');
  const [logoLoaded, setLogoLoaded] = useState(false);

  // Preload logo ngay khi component mount
  useEffect(() => {
    const img = new Image();
    img.src = '/apple-touch-icon.png';
    img.onload = () => setLogoLoaded(true);
    img.onerror = () => setLogoLoaded(true); // Vẫn hiển thị dù logo lỗi
  }, []);

  useEffect(() => {
    if (!isVisible) return;
    
    // CHỈ chạy auto-progress khi có loadingProgress (đang load data sau khi đăng nhập)
    // Khi chưa đăng nhập (loadingProgress = 0), không chạy auto-progress
    if (loadingProgress === 0) return;

    const statusMessages = [
      'Đang khởi động...',
      'Đang tải tin nhắn...',
      'Đang tải danh bạ...',
      'Đang tải tường nhà...',
      'Hoàn tất!'
    ];
    
    let currentStep = 0;
    const interval = setInterval(() => {
      currentStep++;
      const newProgress = (currentStep / 5) * 100;
      setProgress(newProgress);
      setStatus(statusMessages[currentStep - 1] || 'Hoàn tất!');

      if (currentStep >= 5) {
        clearInterval(interval);
        setTimeout(() => {
          if (onComplete) {
            onComplete();
          }
        }, 100);
      }
    }, 200); // 5 steps x 200ms = 1 giây

    return () => clearInterval(interval);
  }, [isVisible, onComplete, loadingProgress]);
  
  // Sync với loading progress từ API
  useEffect(() => {
    if (loadingProgress > 0 && loadingProgress <= 100) {
      // Cập nhật status dựa vào progress từ API
      if (loadingProgress >= 20 && loadingProgress < 40) {
        setStatus('Đang tải tin nhắn...');
      } else if (loadingProgress >= 40 && loadingProgress < 60) {
        setStatus('Đang tải danh bạ...');
      } else if (loadingProgress >= 60 && loadingProgress < 80) {
        setStatus('Đang tải tường nhà...');
      } else if (loadingProgress >= 80 && loadingProgress < 100) {
        setStatus('Đang tải thông báo...');
      } else if (loadingProgress === 100) {
        setStatus('Hoàn tất!');
      }
    }
  }, [loadingProgress]);

  if (!isVisible) return null;

  return (
    <SplashContainer>
      <LogoContainer>
        <AppIcon>
          <img 
            src="/apple-touch-icon.png" 
            alt="Zyea+" 
            style={{ 
              opacity: logoLoaded ? 1 : 0,
              transition: 'opacity 0.3s ease-in-out'
            }} 
          />
        </AppIcon>
        <Logo>Zyea+</Logo>
        <Subtitle>Kết nối mọi người</Subtitle>
        
        <LoadingDots>
          <Dot delay={0} />
          <Dot delay={0.2} />
          <Dot delay={0.4} />
        </LoadingDots>
        
        {/* Chỉ hiển thị progress và status khi đã đăng nhập (loadingProgress > 0) */}
        {loadingProgress > 0 && (
          <>
            <ProgressBar>
              <ProgressFill progress={progress} />
            </ProgressBar>
            
            <StatusText>{status}</StatusText>
          </>
        )}
      </LogoContainer>
      
      <NetworkPattern />
      
      <VersionInfo>
        Zyea+ v{getCurrentVersion()} © 2025 Zyea+ Corporation.
      </VersionInfo>
    </SplashContainer>
  );
};

export default SplashScreen;
