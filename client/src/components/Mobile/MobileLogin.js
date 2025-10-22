import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { FiChevronLeft, FiEye, FiEyeOff, FiVideo, FiImage, FiUsers, FiHeart } from 'react-icons/fi';
import { BsQrCodeScan } from 'react-icons/bs';
import api from '../../utils/api';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import AuthContext from '../../contexts/AuthContext';
import { useContext } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import QRScanner from './QRScanner';

const Container = styled.div`
  display: flex;
  flex-direction: column;
  min-height: 100dvh;
  background: ${props => {
    if (props.variant === 'intro') {
      return props.$isDark 
        ? 'linear-gradient(180deg, #1a1a2e 0%, #16213e 100%)'
        : 'linear-gradient(180deg, #f7f8fa 0%, #f2f3f6 100%)';
    }
    return props.$isDark ? '#2d2d2d' : '#fff';
  }};
  width: 100%;
  box-sizing: border-box;
  padding-top: env(safe-area-inset-top);
  padding-bottom: env(safe-area-inset-bottom);
  transition: background 0.3s ease;
  
  /* Khóa scroll khi ở màn hình intro (chưa đăng nhập) */
  ${props => props.variant === 'intro' && `
    height: 100dvh;
    overflow: hidden;
    overscroll-behavior: none;
    touch-action: manipulation;
  `}
  
  @media (min-width: 769px) { max-width: 420px; margin: 0 auto; border-left: 1px solid #eee; border-right: 1px solid #eee; }
`;

const TopBar = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px;
`;

const Lang = styled.button`
  border: 1px solid ${props => props.$isDark ? '#444' : '#e6e6e6'};
  background: ${props => props.$isDark ? '#3a3a3c' : '#f8f8f8'};
  color: ${props => props.$isDark ? '#fff' : '#333'};
  border-radius: 16px;
  padding: 6px 10px;
  font-size: 12px;
`;

const Intro = styled.div`
  display: flex; flex-direction: column; align-items: center; text-align: center; padding: 24px 16px 8px; 
  color: ${props => props.$isDark ? '#fff' : '#111'};
`;

const SlideViewport = styled.div`
  width: 100%;
  overflow: hidden;
  touch-action: pan-y;
  min-height: 320px; /* ensure visible area on small phones */
  display: flex;
  align-items: center;
  justify-content: center;
`;

const SlidesRow = styled.div`
  display: flex;
  width: 100%;
`;

const AppLogo = styled.img`
  width: clamp(48px, 12vw, 64px); height: clamp(48px, 12vw, 64px); border-radius: 12px; object-fit: cover; box-shadow: 0 6px 18px rgba(0,0,0,0.2);
`;

const AppTitle = styled.div`
  margin-top: 10px; font-size: 26px; font-weight: 700; 
  color: ${props => props.$isDark ? '#fff' : '#2b2b2b'};
`;

const AppSubtitle = styled.div`
  margin-top: 4px; font-size: 14px; 
  color: ${props => props.$isDark ? '#aaa' : '#7a7a7a'};
`;

const Illustration = styled.div`
  margin: 12px 0 6px; position: relative; width: clamp(160px, 55vw, 220px); height: clamp(160px, 55vw, 220px); border-radius: 50%;
  border: 2px dashed #dfe6ef; display: flex; align-items: center; justify-content: center; margin-left: auto; margin-right: auto;
`;

const VideoIconWrap = styled.div`
  width: clamp(64px, 18vw, 80px); height: clamp(64px, 18vw, 80px); border-radius: 16px; background: #eaf3ff; color: #0a66ff; display: flex; align-items: center; justify-content: center; box-shadow: inset 0 0 0 2px #d7e6ff;
`;

const MiniAvatar = styled.div`
  position: absolute; width: clamp(32px, 10vw, 44px); height: clamp(32px, 10vw, 44px); border-radius: 50%; background: #eaf3ff; top: 18px;
  box-shadow: inset 0 0 0 2px #d7e6ff;
`;

const MiniAvatarRight = styled(MiniAvatar)`
  right: -8px;
`;

const MiniAvatarLeft = styled(MiniAvatar)`
  left: -8px;
`;

const PagerDots = styled.div`
  display: flex; gap: 6px; justify-content: center; align-items: center; margin: 10px 0 16px;
  & span { width: 6px; height: 6px; border-radius: 50%; background: #d6dbe3; }
  & span.active { background: #0a66ff; width: 8px; height: 8px; }
`;

const PrimaryButton = styled.button`
  width: calc(100% - 24px);
  margin: 8px 12px;
  background: #0a66ff;
  color: #fff;
  border: none;
  border-radius: 28px;
  padding: 14px 16px;
  font-weight: 700;
  font-size: 17px;
`;

const SecondaryButton = styled.button`
  width: calc(100% - 24px);
  margin: 8px 12px 16px;
  background: #f2f4f7;
  color: #222;
  border: 1px solid #e6e6e6;
  border-radius: 24px;
  padding: 14px 16px;
  font-weight: 600;
`;

const QRButton = styled.button`
  width: calc(100% - 24px);
  margin: 0 12px 16px;
  background: #fff;
  color: #0a66ff;
  border: 2px solid #0a66ff;
  border-radius: 24px;
  padding: 14px 16px;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-size: 16px;
`;

const FormWrap = styled.form`
  padding: 12px;
`;

const Input = styled.input`
  width: 100%;
  border: 1px solid ${props => props.$isDark ? '#444' : '#e6e6e6'};
  border-radius: 12px;
  padding: 14px 12px;
  outline: none;
  font-size: 16px;
  background: ${props => props.$isDark ? '#1a1a1a' : '#fff'};
  color: ${props => props.$isDark ? '#fff' : '#000'};

  &::placeholder {
    color: ${props => props.$isDark ? '#777' : '#999'};
  }
`;

const CheckboxRow = styled.label`
  display: flex; align-items: center; gap: 6px; 
  color: ${props => props.$isDark ? '#aaa' : '#444'}; 
  font-size: 14px; margin: 10px 0;
  input[type='checkbox'] {
    width: 14px; height: 14px; /* base size for cross-browser */
    transform: scale(0.75);
    transform-origin: left center;
    accent-color: #0a66ff;
  }
`;

const FooterNote = styled.div`
  text-align: center; 
  color: ${props => props.$isDark ? '#aaa' : '#666'}; 
  font-size: 13px; padding: 8px 0 16px;
`;

const PasswordRow = styled.div`
  position: relative;
  display: flex;
  align-items: center;
`;

const EyeBtn = styled.button`
  position: absolute; right: 10px; top: 50%; transform: translateY(-50%);
  border: none; background: transparent; color: #666;
`;

const StepHeader = styled.div`
  display: flex; align-items: center; gap: 8px; padding: 8px 12px; font-weight: 600;
  font-size: 18px;
  color: ${props => props.$isDark ? '#fff' : '#2b2b2b'};
`;

const BackBtn = styled.button`
  border: none; background: transparent; padding: 6px; display: flex; align-items: center;
`;


const MobileLogin = () => {
  const [step, setStep] = useState(1); // 1: intro, 2: email, 3: password
  const [slideIndex, setSlideIndex] = useState(0);
  const [touchStartX, setTouchStartX] = useState(null);
  const [touchDeltaX, setTouchDeltaX] = useState(0);
  const [email, setEmail] = useState('');
  const [agree1, setAgree1] = useState(false);
  const [agree2, setAgree2] = useState(false);
  const [showTermsError, setShowTermsError] = useState(false);
  const [termsTouched, setTermsTouched] = useState(false);
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showQRScanner, setShowQRScanner] = useState(false);
  const { login, user, clearUserState } = useContext(AuthContext);
  const { isDarkMode } = useTheme();
  const navigate = useNavigate();

  const slides = [
    {
      key: 'group',
      title: 'Chat nhóm tiện lợi',
      desc: 'Cùng trao đổi, giữ liên lạc với gia đình, bạn bè và đồng nghiệp mọi lúc mọi nơi',
      icon: FiUsers
    },
    {
      key: 'photo',
      title: 'Gửi ảnh nhanh chóng',
      desc: 'Chia sẻ hình ảnh chất lượng cao với bạn bè và người thân nhanh chóng và dễ dàng',
      icon: FiImage
    },
    {
      key: 'diary',
      title: 'Nhật ký bạn bè',
      desc: 'Nơi cập nhật hoạt động mới nhất của những người bạn quan tâm',
      icon: FiHeart
    },
    {
      key: 'video',
      title: 'Gọi video ổn định',
      desc: 'Trò chuyện thật đã với hình ảnh sắc nét, tiếng chất, âm chuẩn dưới mọi điều kiện mạng',
      icon: FiVideo
    }
  ];

  const handleTouchStart = (e) => {
    setTouchStartX(e.touches[0].clientX);
    setTouchDeltaX(0);
  };

  const handleTouchMove = (e) => {
    if (touchStartX === null) return;
    setTouchDeltaX(e.touches[0].clientX - touchStartX);
  };

  const handleTouchEnd = () => {
    if (touchStartX === null) return;
    const threshold = 40; // px
    if (touchDeltaX < -threshold && slideIndex < slides.length - 1) {
      setSlideIndex(slideIndex + 1);
    } else if (touchDeltaX > threshold && slideIndex > 0) {
      setSlideIndex(slideIndex - 1);
    }
    setTouchStartX(null);
    setTouchDeltaX(0);
  };

  const handleContinue = () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error('Vui lòng nhập email hợp lệ');
      return;
    }
    if (!agree1 || !agree2) {
      toast.error('Vui lòng đồng ý các điều khoản');
      setShowTermsError(true);
      setTermsTouched(true);
      return;
    }
    setShowTermsError(false);
    setTermsTouched(false);
    setStep(3);
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();
    setLoading(true);
    try {
      const res = await api.post('/auth/login', { email, password });
      login(res.data.user, res.data.token);
      
      // Đợi một chút để đảm bảo state được cập nhật
      await new Promise(resolve => setTimeout(resolve, 500));
      
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Đăng nhập thất bại');
    } finally {
      setLoading(false);
    }
  };

  const appLogo = process.env.PUBLIC_URL + '/Zyea.jpg';

  return (
    <Container variant={step === 1 ? 'intro' : 'form'} $isDark={isDarkMode}>
      {step === 1 && (
        <>
          <TopBar>
            <div />
            <Lang $isDark={isDarkMode}>Tiếng Việt</Lang>
          </TopBar>
          <Intro $isDark={isDarkMode} onTouchStart={handleTouchStart} onTouchMove={handleTouchMove} onTouchEnd={handleTouchEnd}>
            <AppLogo src={appLogo} alt="app-logo" />
            <AppTitle style={{ color: '#0a66ff', marginTop: 6 }}>Zyea+</AppTitle>
            <SlideViewport>
              <SlidesRow style={{
                transform: `translateX(calc(${(-slideIndex * 100)}% + ${touchStartX !== null ? touchDeltaX : 0}px))`,
                transition: touchStartX === null ? 'transform 250ms ease' : 'none'
              }}>
                {slides.map((s, idx) => (
                  <div key={s.key} style={{ width: '100%', flexShrink: 0 }}>
                    <Illustration>
                      <MiniAvatarLeft />
                      <MiniAvatarRight />
                      <VideoIconWrap>
                        <s.icon size={28} />
                      </VideoIconWrap>
                    </Illustration>
                    <div style={{color:'#333', fontWeight:700, fontSize:16}}>{s.title}</div>
                    <div style={{color:'#586174', fontSize:13, padding:'0 24px', marginTop:6}}>{s.desc}</div>
                  </div>
                ))}
              </SlidesRow>
            </SlideViewport>
            <PagerDots>
              {slides.map((_, i) => (
                <span key={i} className={i === slideIndex ? 'active' : ''} />
              ))}
            </PagerDots>
          </Intro>
          <PrimaryButton onClick={() => setStep(2)}>Đăng nhập</PrimaryButton>
          <SecondaryButton onClick={() => navigate('/m/register')}>Tạo tài khoản mới</SecondaryButton>
        </>
      )}

      {step === 2 && (
        <>
          <StepHeader $isDark={isDarkMode}>
            <BackBtn onClick={() => setStep(1)} aria-label="back"><FiChevronLeft size={20} /></BackBtn>
            Nhập email
          </StepHeader>
          <FormWrap onSubmit={(e) => { e.preventDefault(); handleContinue(); }}>
            <Input
              $isDark={isDarkMode}
              type="email"
              placeholder="Nhập email của bạn"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <CheckboxRow $isDark={isDarkMode}>
              <input type="checkbox" checked={agree1} onChange={(e) => { setAgree1(e.target.checked); setTermsTouched(true); }} />
              Tôi đồng ý với các điều khoản sử dụng Zyea+
            </CheckboxRow>
            <CheckboxRow $isDark={isDarkMode}>
              <input type="checkbox" checked={agree2} onChange={(e) => { setAgree2(e.target.checked); setTermsTouched(true); }} />
              Tôi đồng ý với điều khoản Mạng xã hội của Zyea+
            </CheckboxRow>
            {(showTermsError || (termsTouched && (!agree1 || !agree2))) && (
              <div style={{ color:'#e53935', fontSize:12, marginTop:2 }}>Bạn cần đồng ý đầy đủ các điều khoản để tiếp tục</div>
            )}
            <PrimaryButton type="submit" disabled={loading}>Tiếp tục</PrimaryButton>
          </FormWrap>
          <FooterNote $isDark={isDarkMode}>Bạn đã có tài khoản? <span style={{ color: '#0a66ff' }} onClick={() => setStep(3)}>Đăng nhập ngay</span></FooterNote>
          <FooterNote $isDark={isDarkMode}><span style={{ color: '#0a66ff' }} onClick={() => navigate('/m/forgot-password')}>Quên mật khẩu?</span></FooterNote>
        </>
      )}

      {step === 3 && (
        <>
          <StepHeader $isDark={isDarkMode}>
            <BackBtn onClick={() => setStep(2)} aria-label="back"><FiChevronLeft size={20} /></BackBtn>
            Nhập mật khẩu
          </StepHeader>
          <FormWrap onSubmit={handleSubmit}>
            <div style={{ color: isDarkMode ? '#aaa' : '#666', margin: '8px 4px' }}>{email || 'Email'}</div>
            <PasswordRow>
              <Input
                $isDark={isDarkMode}
                type={showPw ? 'text' : 'password'}
                placeholder="Nhập mật khẩu"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <EyeBtn type="button" onClick={() => setShowPw(v => !v)} aria-label="toggle password">
                {showPw ? <FiEyeOff /> : <FiEye />}
              </EyeBtn>
            </PasswordRow>
            <PrimaryButton type="submit" disabled={loading}>{loading ? 'Đang đăng nhập...' : 'Tiếp tục'}</PrimaryButton>
          </FormWrap>
          <FooterNote $isDark={isDarkMode}><span style={{ color: '#0a66ff' }} onClick={() => navigate('/m/forgot-password')}>Quên mật khẩu?</span></FooterNote>
        </>
      )}

      {showQRScanner && (
        <QRScanner onClose={() => setShowQRScanner(false)} />
      )}
    </Container>
  );
};

export default MobileLogin;


