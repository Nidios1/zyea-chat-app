import React, { useState, useEffect } from 'react';
import styled, { keyframes } from 'styled-components';
import { FiStar } from 'react-icons/fi';

const fadeIn = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`;

const slideUp = keyframes`
  from { transform: translateY(100%); }
  to { transform: translateY(0); }
`;

// Main Container - Full Screen Modal
const AppStoreContainer = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: #f2f2f7;
  z-index: 10000;
  overflow-y: auto;
  overflow-x: hidden;
  animation: ${fadeIn} 0.3s ease-out;
  scroll-behavior: smooth;
  -webkit-overflow-scrolling: touch;

  /* Custom scrollbar */
  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-track {
    background: transparent;
  }

  &::-webkit-scrollbar-thumb {
    background: rgba(0, 0, 0, 0.2);
    border-radius: 3px;
  }

  &::-webkit-scrollbar-thumb:hover {
    background: rgba(0, 0, 0, 0.3);
  }
`;

// Header - Hidden to prevent user from leaving
const Header = styled.div`
  display: none;
`;

// App Header Section
const AppHeaderSection = styled.div`
  background: white;
  padding: 1.25rem;
  margin-bottom: 0.5rem;

  @media (max-width: 480px) {
    padding: 1rem;
  }

  @media (max-width: 360px) {
    padding: 0.875rem;
  }
`;

const AppHeaderTop = styled.div`
  display: flex;
  gap: 1rem;
  margin-bottom: 1.25rem;

  @media (max-width: 480px) {
    gap: 0.875rem;
    margin-bottom: 1rem;
  }

  @media (max-width: 360px) {
    gap: 0.75rem;
    margin-bottom: 0.875rem;
  }
`;

const AppIcon = styled.div`
  width: 100px;
  height: 100px;
  border-radius: 22px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  flex-shrink: 0;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  @media (max-width: 480px) {
    width: 85px;
    height: 85px;
    border-radius: 19px;
  }

  @media (max-width: 360px) {
    width: 75px;
    height: 75px;
    border-radius: 17px;
  }
`;

const AppHeaderInfo = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
`;

const AppTitle = styled.h1`
  font-size: 1.5rem;
  font-weight: 700;
  color: #000;
  margin: 0 0 0.25rem 0;
  letter-spacing: -0.5px;

  @media (max-width: 480px) {
    font-size: 1.35rem;
  }

  @media (max-width: 360px) {
    font-size: 1.25rem;
  }
`;

const AppSubtitle = styled.p`
  font-size: 0.875rem;
  color: #8e8e93;
  margin: 0 0 0.75rem 0;

  @media (max-width: 480px) {
    font-size: 0.8125rem;
  }

  @media (max-width: 360px) {
    font-size: 0.75rem;
  }
`;

const GetButton = styled.button`
  background: #007aff;
  color: white;
  border: none;
  border-radius: 20px;
  padding: 0.5rem 2rem;
  font-size: 1rem;
  font-weight: 700;
  cursor: pointer;
  align-self: flex-start;
  transition: all 0.2s;

  &:hover {
    background: #0051d5;
  }

  @media (max-width: 480px) {
    padding: 0.45rem 1.75rem;
    font-size: 0.9375rem;
    border-radius: 18px;
  }

  @media (max-width: 360px) {
    padding: 0.4rem 1.5rem;
    font-size: 0.875rem;
    border-radius: 16px;
  }
`;

// Stats Row
const StatsRow = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 0.5rem;
  padding: 1rem 0 0;
  border-top: 0.5px solid rgba(60, 60, 67, 0.18);
`;

const StatItem = styled.div`
  text-align: center;
`;

const StatValue = styled.div`
  font-size: 1.125rem;
  font-weight: 700;
  color: #8e8e93;
  margin-bottom: 0.25rem;

  @media (max-width: 480px) {
    font-size: 1rem;
  }

  @media (max-width: 360px) {
    font-size: 0.9375rem;
  }
`;

const StatLabel = styled.div`
  font-size: 0.625rem;
  color: #8e8e93;
  text-transform: uppercase;
  letter-spacing: 0.3px;
  line-height: 1.2;

  @media (max-width: 480px) {
    font-size: 0.5625rem;
  }

  @media (max-width: 360px) {
    font-size: 0.5rem;
  }
`;

const StarRating = styled.div`
  display: flex;
  justify-content: center;
  gap: 0.125rem;
  margin-bottom: 0.25rem;
`;

// Content Sections
const Section = styled.div`
  background: white;
  padding: 1.25rem;
  margin-bottom: 0.5rem;

  @media (max-width: 480px) {
    padding: 1rem;
  }

  @media (max-width: 360px) {
    padding: 0.875rem;
  }
`;

const SectionTitle = styled.h2`
  font-size: 1.25rem;
  font-weight: 700;
  color: #000;
  margin: 0 0 0.5rem 0;
  letter-spacing: -0.5px;

  @media (max-width: 480px) {
    font-size: 1.125rem;
  }

  @media (max-width: 360px) {
    font-size: 1.0625rem;
  }
`;

const VersionInfo = styled.div`
  display: flex;
  justify-content: space-between;
  font-size: 0.8125rem;
  color: #8e8e93;
  margin-bottom: 0.75rem;

  @media (max-width: 480px) {
    font-size: 0.75rem;
  }

  @media (max-width: 360px) {
    font-size: 0.6875rem;
  }
`;

const Description = styled.p`
  font-size: 0.9375rem;
  color: #000;
  line-height: 1.5;
  margin: 0;

  @media (max-width: 480px) {
    font-size: 0.875rem;
  }

  @media (max-width: 360px) {
    font-size: 0.8125rem;
  }
`;

// Preview Section
const PreviewSection = styled.div`
  background: white;
  padding: 1.25rem 0;
  margin-bottom: 0.5rem;

  @media (max-width: 480px) {
    padding: 1rem 0;
  }

  @media (max-width: 360px) {
    padding: 0.875rem 0;
  }
`;

const PreviewTitle = styled.h2`
  font-size: 1.25rem;
  font-weight: 700;
  color: #000;
  margin: 0 0 1rem 0;
  padding: 0 1.25rem;
  letter-spacing: -0.5px;

  @media (max-width: 480px) {
    font-size: 1.125rem;
    margin: 0 0 0.875rem 0;
    padding: 0 1rem;
  }

  @media (max-width: 360px) {
    font-size: 1.0625rem;
    margin: 0 0 0.75rem 0;
    padding: 0 0.875rem;
  }
`;

const PreviewImages = styled.div`
  display: flex;
  gap: 0.75rem;
  overflow-x: auto;
  padding: 0 1.25rem;
  -webkit-overflow-scrolling: touch;

  &::-webkit-scrollbar {
    display: none;
  }

  @media (max-width: 480px) {
    padding: 0 1rem;
    gap: 0.65rem;
  }

  @media (max-width: 360px) {
    padding: 0 0.875rem;
    gap: 0.6rem;
  }
`;

const PreviewImage = styled.div`
  flex: 0 0 auto;
  width: 160px;
  height: 280px;
  border-radius: 12px;
  overflow: hidden;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 600;
  font-size: 0.875rem;

  @media (max-width: 480px) {
    width: 140px;
    height: 245px;
    border-radius: 10px;
    font-size: 0.8125rem;
  }

  @media (max-width: 360px) {
    width: 130px;
    height: 228px;
    border-radius: 9px;
    font-size: 0.75rem;
  }
`;

// Info Section
const InfoRow = styled.div`
  display: flex;
  justify-content: space-between;
  padding: 0.75rem 0;
  border-bottom: 0.5px solid rgba(60, 60, 67, 0.18);

  &:last-child {
    border-bottom: none;
  }
`;

const InfoLabel = styled.div`
  font-size: 0.9375rem;
  color: #8e8e93;

  @media (max-width: 480px) {
    font-size: 0.875rem;
  }

  @media (max-width: 360px) {
    font-size: 0.8125rem;
  }
`;

const InfoValue = styled.div`
  font-size: 0.9375rem;
  color: ${props => props.link ? '#007aff' : '#000'};
  text-align: right;
  max-width: 60%;

  @media (max-width: 480px) {
    font-size: 0.875rem;
    max-width: 65%;
  }

  @media (max-width: 360px) {
    font-size: 0.8125rem;
    max-width: 70%;
  }
`;

const LinkText = styled.div`
  font-size: 0.9375rem;
  color: #007aff;
  padding: 0.75rem 0;
  border-bottom: 0.5px solid rgba(60, 60, 67, 0.18);
  display: flex;
  align-items: center;
  gap: 0.5rem;

  @media (max-width: 480px) {
    font-size: 0.875rem;
    padding: 0.65rem 0;
  }

  @media (max-width: 360px) {
    font-size: 0.8125rem;
    padding: 0.6rem 0;
  }
`;

const AppDownloadPrompt = ({ onClose }) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // Check if user is on mobile and not in PWA mode
    const mobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const isPWA = window.matchMedia('(display-mode: standalone)').matches || 
                  window.navigator.standalone === true;
    
    // Only show prompt on mobile and not in PWA mode
    if (!mobile || isPWA) {
      setIsVisible(false);
    }
  }, []);

  const handleClose = () => {
    setIsVisible(false);
    if (onClose) onClose();
  };

  const handleDownload = () => {
    const userAgent = navigator.userAgent;
    const isIOS = /iPhone|iPad|iPod/i.test(userAgent);
    
    if (isIOS) {
      alert('Để cài đặt ứng dụng:\n\n1. Nhấn nút Chia sẻ (↗) ở thanh dưới\n2. Chọn "Thêm vào Màn hình chính"\n3. Nhấn "Thêm" để hoàn tất');
    } else if (/Android/i.test(userAgent)) {
      if (window.deferredPrompt) {
        window.deferredPrompt.prompt();
        window.deferredPrompt.userChoice.then((choiceResult) => {
          if (choiceResult.outcome === 'accepted') {
            console.log('User accepted the install prompt');
            handleClose();
          }
          window.deferredPrompt = null;
        });
      } else {
        alert('Để cài đặt ứng dụng:\n\n1. Nhấn nút Menu (⋮) ở góc trên\n2. Chọn "Thêm vào màn hình chính"\n3. Nhấn "Cài đặt" để hoàn tất');
      }
    }
  };

  if (!isVisible) return null;

  return (
    <AppStoreContainer>
      {/* App Header Section */}
      <AppHeaderSection>
        <AppHeaderTop>
          <AppIcon>
            <img src="/app.jpg" alt="Zyea+" />
          </AppIcon>
          <AppHeaderInfo>
            <div>
              <AppTitle>Zyea+</AppTitle>
              <AppSubtitle>Nhanh, Ổn định, Riêng tư</AppSubtitle>
            </div>
            <GetButton onClick={handleDownload}>TẢI</GetButton>
          </AppHeaderInfo>
        </AppHeaderTop>

        {/* Stats */}
        <StatsRow>
          <StatItem>
            <StatValue>3,1</StatValue>
            <StarRating>
              <FiStar size={10} fill="#8e8e93" stroke="#8e8e93" />
              <FiStar size={10} fill="#8e8e93" stroke="#8e8e93" />
              <FiStar size={10} fill="#8e8e93" stroke="#8e8e93" />
              <FiStar size={10} stroke="#8e8e93" />
              <FiStar size={10} stroke="#8e8e93" />
            </StarRating>
            <StatLabel>142 N XẾP HẠNG</StatLabel>
          </StatItem>
          <StatItem>
            <StatValue>13+</StatValue>
            <StatLabel>ĐỘ TUỔI</StatLabel>
          </StatItem>
          <StatItem>
            <StatValue>#7</StatValue>
            <StatLabel>MẠNG XÃ HỘI</StatLabel>
          </StatItem>
          <StatItem>
            <StatValue>
              <img src="/app.jpg" alt="Zalo Groz" style={{ width: '32px', height: '32px', borderRadius: '7px' }} />
            </StatValue>
            <StatLabel>Zalo Groz</StatLabel>
          </StatItem>
        </StatsRow>
      </AppHeaderSection>

      {/* What's New */}
      <Section>
        <SectionTitle>Tính Năng Mới ›</SectionTitle>
        <VersionInfo>
          <span>Phiên bản 1.0.0</span>
          <span>2 ngày trước</span>
        </VersionInfo>
        <Description>
          Zyea+ sửa một số lỗi nhỏ và cải thiện ứng dụng để 
          mang đến trải nghiệm mượt mà hơn.
        </Description>
      </Section>

      {/* Preview */}
      <PreviewSection>
        <PreviewTitle>Xem Trước</PreviewTitle>
        <PreviewImages>
          <PreviewImage style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
            Liên lạc<br/>nhanh và ổn định
          </PreviewImage>
          <PreviewImage style={{ background: 'linear-gradient(135deg, #00c6ff 0%, #0072ff 100%)' }}>
            Giao tiếp<br/>dễ dàng
          </PreviewImage>
          <PreviewImage style={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' }}>
            Kết nối<br/>mọi lúc
          </PreviewImage>
        </PreviewImages>
      </PreviewSection>

      {/* Information */}
      <Section>
        <SectionTitle>Thông Tin</SectionTitle>
        
        <InfoRow>
          <InfoLabel>Nhà cung cấp</InfoLabel>
          <InfoValue>Zyea+ ONLINE CO.,LTD</InfoValue>
        </InfoRow>

        <InfoRow>
          <InfoLabel>Kích cỡ</InfoLabel>
          <InfoValue>221,8 MB</InfoValue>
        </InfoRow>

        <InfoRow>
          <InfoLabel>Danh mục</InfoLabel>
          <InfoValue link>Mạng Xã Hội</InfoValue>
        </InfoRow>

        <InfoRow>
          <InfoLabel>Tương thích</InfoLabel>
          <InfoValue>Trên Thiết bị này</InfoValue>
        </InfoRow>


        <InfoRow>
          <InfoLabel>Ngôn ngữ</InfoLabel>
          <InfoValue>Tiếng Việt và Tiếng Anh</InfoValue>
        </InfoRow>
        <InfoRow>
          <InfoLabel>Bản quyền</InfoLabel>
          <InfoValue>© Zyea+ Corporation</InfoValue>
        </InfoRow>

        <LinkText>
          <span>🔗</span> Chính sách quyền riêng tư
        </LinkText>

        <LinkText style={{ borderBottom: 'none' }}>
          <span>⚠️</span> Báo cáo sự cố
        </LinkText>
      </Section>

      {/* Bottom Spacer for smooth scrolling */}
      <div style={{ height: '3rem', background: '#f2f2f7' }}></div>
    </AppStoreContainer>
  );
};

export default AppDownloadPrompt;
