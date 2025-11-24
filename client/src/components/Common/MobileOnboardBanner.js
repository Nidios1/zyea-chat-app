import React from 'react';
import styled from 'styled-components';

const BannerContainer = styled.div`
  position: fixed !important;
  top: 0 !important;
  left: 0 !important;
  right: 0 !important;
  bottom: 0 !important;
  width: 100vw !important;
  width: 100% !important;
  height: 100vh !important;
  height: 100% !important;
  background: #ffffff !important;
  z-index: 999999 !important;
  overflow-y: auto !important;
  -webkit-overflow-scrolling: touch !important;
  margin: 0 !important;
  padding: 0 !important;
  display: block !important;
  visibility: visible !important;
  opacity: 1 !important;
  
  /* Safari iOS */
  @supports (-webkit-touch-callout: none) {
    height: -webkit-fill-available !important;
    min-height: 100vh !important;
  }
`;

const Header = styled.div`
  background: #ffffff !important;
  padding: 0.75rem 1rem !important;
  display: flex !important;
  align-items: center !important;
  justify-content: space-between !important;
  border-bottom: 1px solid #e5e5e5 !important;
  position: sticky !important;
  top: 0 !important;
  z-index: 10 !important;
  width: 100% !important;
  box-sizing: border-box !important;
  visibility: visible !important;
  opacity: 1 !important;
`;

const HeaderLeft = styled.div`
  display: flex !important;
  align-items: center !important;
  gap: 0.75rem !important;
  flex: 1 !important;
  visibility: visible !important;
  opacity: 1 !important;
`;

const LogoIcon = styled.div`
  width: 40px !important;
  height: 40px !important;
  background: #0088cc !important;
  border-radius: 50% !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  flex-shrink: 0 !important;
  visibility: visible !important;
  opacity: 1 !important;

  img {
    width: 24px !important;
    height: 24px !important;
    object-fit: contain !important;
    display: block !important;
    visibility: visible !important;
    opacity: 1 !important;
  }
`;

const HeaderText = styled.div`
  display: flex !important;
  flex-direction: column !important;
  gap: 0.125rem !important;
  visibility: visible !important;
  opacity: 1 !important;
`;

const AppName = styled.div`
  font-size: 16px !important;
  font-weight: 600 !important;
  color: #000 !important;
  visibility: visible !important;
  opacity: 1 !important;
`;

const SubText = styled.div`
  font-size: 12px !important;
  color: #666 !important;
  visibility: visible !important;
  opacity: 1 !important;
`;

const OpenButton = styled.button`
  background: #0088cc !important;
  color: white !important;
  border: none !important;
  border-radius: 8px !important;
  padding: 0.5rem 1.25rem !important;
  font-size: 14px !important;
  font-weight: 600 !important;
  cursor: pointer !important;
  white-space: nowrap !important;
  transition: background 0.2s !important;
  visibility: visible !important;
  opacity: 1 !important;
  display: block !important;

  &:active {
    background: #0077bb !important;
  }
`;

const Content = styled.div`
  padding: 1.5rem 1rem 2rem !important;
  display: flex !important;
  flex-direction: column !important;
  align-items: center !important;
  gap: 1.5rem !important;
  width: 100% !important;
  box-sizing: border-box !important;
  visibility: visible !important;
  opacity: 1 !important;
`;

const Branding = styled.div`
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  gap: 0.5rem !important;
  margin-top: 0.5rem !important;
  width: 100% !important;
  visibility: visible !important;
  opacity: 1 !important;
`;

const FPTLogo = styled.div`
  font-size: 24px !important;
  font-weight: 700 !important;
  background: linear-gradient(135deg, #ff6b00 0%, #00a859 50%, #0088cc 100%) !important;
  -webkit-background-clip: text !important;
  -webkit-text-fill-color: transparent !important;
  background-clip: text !important;
  visibility: visible !important;
  opacity: 1 !important;
  display: block !important;
`;

const Copyright = styled.div`
  font-size: 12px !important;
  color: #666 !important;
  visibility: visible !important;
  opacity: 1 !important;
  display: block !important;
`;

const PhoneMockup = styled.div`
  position: relative !important;
  width: 100% !important;
  max-width: 320px !important;
  margin: 0 auto !important;
  display: flex !important;
  justify-content: center !important;
  align-items: center !important;
  visibility: visible !important;
  opacity: 1 !important;
`;

const PhoneImage = styled.img`
  width: 100% !important;
  max-width: 320px !important;
  height: auto !important;
  display: block !important;
  border-radius: 0 !important;
  object-fit: contain !important;
  visibility: visible !important;
  opacity: 1 !important;
`;

const CallToAction = styled.div`
  text-align: center !important;
  padding: 0 1rem !important;
  display: flex !important;
  flex-direction: column !important;
  gap: 1rem !important;
  width: 100% !important;
  max-width: 400px !important;
  margin: 0 auto !important;
  box-sizing: border-box !important;
  visibility: visible !important;
  opacity: 1 !important;
`;

const CTAText = styled.div`
  font-size: 18px !important;
  font-weight: 700 !important;
  color: #000 !important;
  line-height: 1.4 !important;
  visibility: visible !important;
  opacity: 1 !important;
  display: block !important;

  @media (max-width: 480px) {
    font-size: 16px !important;
  }
`;

const CTAButton = styled.button`
  background: #0088cc !important;
  color: white !important;
  border: none !important;
  border-radius: 12px !important;
  padding: 1rem 2rem !important;
  font-size: 16px !important;
  font-weight: 600 !important;
  cursor: pointer !important;
  width: 100% !important;
  transition: all 0.2s !important;
  box-shadow: 0 4px 12px rgba(0, 136, 204, 0.3) !important;
  visibility: visible !important;
  opacity: 1 !important;
  display: block !important;

  &:active {
    background: #0077bb !important;
    transform: translateY(1px) !important;
    box-shadow: 0 2px 8px rgba(0, 136, 204, 0.2) !important;
  }
`;

const MobileOnboardBanner = ({ mandatory = false }) => {
  // Kiểm tra mobile device
  const checkMobile = () => {
    const mobileUa = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const smallViewport = window.innerWidth < 768;
    return mobileUa || smallViewport;
  };

  const isMobile = checkMobile();
  
  // Nếu mandatory, luôn hiển thị
  const shouldShow = mandatory ? true : (() => {
    const shown = sessionStorage.getItem('onboardBannerShown');
    if (shown === 'true') {
      return false;
    }
    const hasReferrer = document.referrer && document.referrer !== '';
    const urlParams = new URLSearchParams(window.location.search);
    const fromLink = urlParams.get('from') === 'link' || hasReferrer;
    return fromLink || window.location.pathname === '/login' || window.location.pathname === '/m/login';
  })();

  // Nếu không phải mobile hoặc không nên hiển thị, return null
  if (!isMobile || !shouldShow) {
    return null;
  }

  const handleOpenApp = () => {
    const appScheme = 'zyea://';
    const appUrl = appScheme + 'login';
    window.location.href = appUrl;
    setTimeout(() => {
      if (!mandatory) {
        sessionStorage.setItem('onboardBannerShown', 'true');
      }
    }, 2000);
  };

  return (
    <BannerContainer data-onboard-banner="true">
      <Header>
        <HeaderLeft>
          <LogoIcon>
            <img 
              src={`${process.env.PUBLIC_URL || ''}/Zyea.jpg?v=3`} 
              alt="FPT Chat" 
            />
          </LogoIcon>
          <HeaderText>
            <AppName>FPT Chat</AppName>
            <SubText>Mở trong ứng dụng FPT Chat</SubText>
          </HeaderText>
        </HeaderLeft>
        <OpenButton onClick={handleOpenApp}>
          MỞ
        </OpenButton>
      </Header>

      <Content>
        <Branding>
          <FPTLogo>FPT</FPTLogo>
          <Copyright>© FPT Corporation</Copyright>
        </Branding>

        <PhoneMockup>
          <PhoneImage
            src="https://chat.fpt.com/images/onboard-left-banner.webp?v=0.0.1"
            alt="FPT Chat App Preview"
            onError={(e) => {
              console.error('Failed to load phone mockup image');
              e.target.style.display = 'none';
            }}
          />
        </PhoneMockup>

        <CallToAction>
          <CTAText>
            Truy cập FPT Chat bằng ứng dụng để có trải nghiệm đầy đủ
          </CTAText>
          <CTAButton onClick={handleOpenApp}>
            Mở FPT Chat
          </CTAButton>
        </CallToAction>
      </Content>
    </BannerContainer>
  );
};

export default MobileOnboardBanner;
