import React, { useState, useContext, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import styled from 'styled-components';
import { FiEye, FiEyeOff } from 'react-icons/fi';
import AuthContext from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import api from '../../utils/api';

const Container = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: ${props => props.$isDark 
    ? 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)' 
    : 'linear-gradient(135deg, #0068ff 0%, #00a651 100%)'};
  position: relative;
  overflow: hidden;
  padding: 0.5rem;
  transition: background 0.3s ease;

  @media (max-width: 768px) {
    padding: 0.5rem;
    align-items: center;
    padding-top: 0.5rem;
    padding-bottom: 0.5rem;
    min-height: 100vh;
  }

  @media (max-width: 480px) {
    padding: 0.25rem;
    padding-top: 0.25rem;
    padding-bottom: 0.25rem;
  }
`;

const FormContainer = styled.div`
  background: ${props => props.$isDark ? '#2d2d2d' : 'white'};
  padding: 1.5rem;
  border-radius: 12px;
  box-shadow: ${props => props.$isDark 
    ? '0 8px 32px rgba(0, 0, 0, 0.5)' 
    : '0 8px 32px rgba(0, 0, 0, 0.1)'};
  width: min(90vw, 560px);
  position: relative;
  z-index: 1;
  max-height: calc(100vh - 1rem);
  overflow: hidden;
  transition: all 0.3s ease;

  @media (max-width: 768px) {
    padding: 1.25rem;
    max-width: 100%;
    margin: 0 auto;
    width: calc(100% - 1rem);
    margin-bottom: 0;
  }

  @media (max-width: 480px) {
    padding: 1rem;
    border-radius: 8px;
    width: calc(100% - 0.5rem);
    margin-bottom: 0;
  }

  @media (max-width: 360px) {
    padding: 0.875rem;
    width: calc(100% - 0.25rem);
    margin-bottom: 0;
  }
`;

const HeaderRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.75rem;
`;

const MenuButton = styled.button`
  position: absolute;
  top: 12px;
  right: 12px;
  width: 36px;
  height: 36px;
  border-radius: 8px;
  border: 1px solid ${props => props.$isDark ? '#444' : '#e6e6e6'};
  background: ${props => props.$isDark ? '#3a3a3c' : '#fff'};
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: ${props => props.$isDark ? '#fff' : '#333'};
  transition: all 0.2s ease;

  &:hover { background: ${props => props.$isDark ? '#4a4a4c' : '#f6f7f9'}; }
`;

const Dropdown = styled.div`
  position: absolute;
  top: 52px;
  right: 12px;
  background: ${props => props.$isDark ? '#3a3a3c' : '#fff'};
  border: 1px solid ${props => props.$isDark ? '#444' : '#e6e6e6'};
  box-shadow: 0 8px 24px rgba(0,0,0,0.3);
  border-radius: 10px;
  overflow: hidden;
  min-width: 220px;
  z-index: 10;
`;

const DropdownItem = styled.button`
  width: 100%;
  padding: 10px 14px;
  background: ${props => props.$isDark ? '#3a3a3c' : '#fff'};
  border: none;
  text-align: left;
  cursor: pointer;
  color: ${props => props.$isDark ? '#fff' : '#111'};
  font-size: 14px;

  &:hover { background: ${props => props.$isDark ? '#4a4a4c' : '#f6f7f9'}; }
`;

const QRContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding-top: 4px;
`;

const QRTitle = styled.h3`
  margin: 0;
  color: ${props => props.$isDark ? '#fff' : '#111'};
  font-size: 18px;
`;

const QRCodeBox = styled.div`
  width: clamp(160px, 38vmin, 280px);
  height: clamp(160px, 38vmin, 280px);
  padding: clamp(6px, 1.5vmin, 12px);
  border-radius: 16px;
  border: 1px solid ${props => props.$isDark ? '#444' : '#e6e6e6'};
  background: ${props => props.$isDark ? '#1a1a1a' : '#fff'};
  display: flex;
  align-items: center;
  justify-content: center;
`;

const QRNote = styled.p`
  margin: 0;
  color: ${props => props.$isDark ? '#aaa' : '#888'};
  font-size: 14px;
  text-align: center;
`;

const QROverlay = styled.div`
  position: absolute;
  inset: 0;
  background: rgba(255,255,255,0.9);
  border-radius: 14px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
`;

const QRExpiredText = styled.div`
  color: #666;
  font-weight: 600;
`;

const QRRefreshButton = styled.button`
  background: #1677ff;
  color: #fff;
  border: none;
  border-radius: 8px;
  padding: 8px 14px;
  cursor: pointer;
  font-weight: 600;
  box-shadow: 0 2px 6px rgba(0,0,0,0.1);
  &:hover { background: #125fd1; }
`;

const Logo = styled.div`
  text-align: center;
  margin-bottom: 1.5rem;

  @media (max-width: 768px) {
    margin-bottom: 1.25rem;
  }

  @media (max-width: 480px) {
    margin-bottom: 1rem;
  }
  
  .logo-icon {
    width: 60px;
    height: 60px;
    background: #0068ff;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: bold;
    color: white;
    font-size: 24px;
    margin: 0 auto 1rem auto;
  }
  
  h1 {
    color: ${props => props.$isDark ? '#fff' : '#333'};
    font-size: 2rem;
    font-weight: 700;
    margin: 0;
  }
  
  p {
    color: ${props => props.$isDark ? '#aaa' : '#666'};
    margin: 0.5rem 0 0 0;
    font-size: 1rem;
  }
`;

const Title = styled.h1`
  text-align: center;
  margin-bottom: 2rem;
  color: #333;
  font-size: 2rem;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;

  @media (max-width: 768px) {
    gap: 1.25rem;
  }

  @media (max-width: 480px) {
    gap: 1rem;
  }
`;

const InputGroup = styled.div`
  position: relative;
`;

const Input = styled.input`
  width: 100%;
  padding: 0.75rem 1rem;
  border: 1px solid ${props => props.$isDark ? '#444' : '#ddd'};
  border-radius: 8px;
  font-size: 16px;
  transition: all 0.2s ease;
  background: ${props => props.$isDark ? '#1a1a1a' : '#f5f5f5'};
  color: ${props => props.$isDark ? '#fff' : '#000'};

  &:focus {
    outline: none;
    border-color: #0068ff;
    background: ${props => props.$isDark ? '#2a2a2a' : 'white'};
  }

  &::placeholder {
    color: ${props => props.$isDark ? '#777' : '#999'};
  }

  @media (max-width: 480px) {
    font-size: 16px; /* Prevent zoom on iOS */
    padding: 0.875rem 1rem;
  }
`;

const PasswordContainer = styled.div`
  position: relative;
`;

const PasswordInput = styled.input`
  width: 100%;
  padding: 0.75rem 3rem 0.75rem 1rem;
  border: 1px solid ${props => props.$isDark ? '#444' : '#ddd'};
  border-radius: 8px;
  font-size: 16px;
  transition: all 0.2s ease;
  background: ${props => props.$isDark ? '#1a1a1a' : '#f5f5f5'};
  color: ${props => props.$isDark ? '#fff' : '#000'};

  &:focus {
    outline: none;
    border-color: #0068ff;
    background: ${props => props.$isDark ? '#2a2a2a' : 'white'};
  }

  &::placeholder {
    color: ${props => props.$isDark ? '#777' : '#999'};
  }

  @media (max-width: 480px) {
    font-size: 16px; /* Prevent zoom on iOS */
    padding: 0.875rem 3rem 0.875rem 1rem;
  }
`;

const EyeIcon = styled.button`
  position: absolute;
  right: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  cursor: pointer;
  color: ${props => props.$isDark ? '#aaa' : '#666'};
  font-size: 1.2rem;
  padding: 0.25rem;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: color 0.2s ease;

  &:hover {
    color: #0068ff;
  }
`;

const Button = styled.button`
  padding: 0.75rem 2rem;
  background: #0068ff;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: #0056cc;
  }

  &:disabled {
    background: #ccc;
    cursor: not-allowed;
  }
`;

const LinkText = styled.p`
  text-align: center;
  margin-top: 1rem;
  color: ${props => props.$isDark ? '#aaa' : '#666'};
  font-size: 14px;

  @media (max-width: 768px) {
    margin-top: 0.75rem;
  }

  @media (max-width: 480px) {
    margin-top: 0.5rem;
  }

  a {
    color: #667eea;
    text-decoration: none;
    font-weight: 600;
    position: relative;

    &::after {
      content: '';
      position: absolute;
      width: 0;
      height: 2px;
      bottom: -2px;
      left: 50%;
      background: #667eea;
      transition: all 0.3s ease;
    }

    &:hover {
      &::after {
        width: 100%;
        left: 0;
      }
    }
  }
`;

const ForgotPasswordLink = styled(Link)`
  color: #0068ff;
  text-decoration: none;
  font-weight: 500;
  font-size: 0.9rem;
  transition: color 0.2s ease;
  text-align: right;
  margin-bottom: 1rem;
  display: block;
  width: 100%;

  &:hover {
    color: #0052cc;
  }
`;

const SocialLogin = styled.div`
  margin-top: 1.5rem;
  text-align: center;

  @media (max-width: 768px) {
    margin-top: 1.25rem;
  }

  @media (max-width: 480px) {
    margin-top: 1rem;
  }
  
  p {
    color: ${props => props.$isDark ? '#888' : '#999'};
    font-size: 14px;
    margin-bottom: 1rem;
  }
`;

const SocialButton = styled.button`
  width: 100%;
  padding: 0.8rem;
  border: 2px solid ${props => props.$isDark ? '#444' : '#e1e5e9'};
  border-radius: 12px;
  background: ${props => props.$isDark ? '#1a1a1a' : 'white'};
  color: ${props => props.$isDark ? '#aaa' : '#666'};
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;

  &:hover {
    border-color: #667eea;
    color: #667eea;
    transform: translateY(-1px);
  }
`;

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [mode, setMode] = useState('qr'); // 'qr' | 'password'
  const [menuOpen, setMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [qrToken, setQrToken] = useState('');
  const [qrExpiresAt, setQrExpiresAt] = useState(0);
  const [nowTs, setNowTs] = useState(Date.now());
  const { login } = useContext(AuthContext);
  const { isDarkMode } = useTheme();

  // Default to password on small screens, QR on desktop
  useEffect(() => {
    const checkIsMobile = () => {
      const mobileUa = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      const smallViewport = window.innerWidth < 768;
      const m = mobileUa || smallViewport;
      setIsMobile(m);
      if (m) setMode('password');
    };
    checkIsMobile();
    window.addEventListener('resize', checkIsMobile);
    return () => window.removeEventListener('resize', checkIsMobile);
  }, []);

  // Tick every second for QR countdown
  useEffect(() => {
    if (mode !== 'qr' || isMobile) return;
    const id = setInterval(() => setNowTs(Date.now()), 1000);
    return () => clearInterval(id);
  }, [mode, isMobile]);

  // Page title
  useEffect(() => {
    document.title = 'Zyea+ - Đăng nhập tài khoản';
  }, []);

  // Initialize QR token when entering QR mode
  useEffect(() => {
    if (mode === 'qr' && !isMobile) {
      // Reuse existing token within its lifetime to avoid changing on reload
      const storedToken = sessionStorage.getItem('qrToken');
      const storedExp = Number(sessionStorage.getItem('qrExpiresAt') || 0);
      const now = Date.now();
      if (storedToken && storedExp && now < storedExp) {
        setQrToken(storedToken);
        setQrExpiresAt(storedExp);
      } else {
        const token = `${now}-${Math.random().toString(36).slice(2, 8)}`;
        const exp = now + 60 * 1000; // 60s expiry
        setQrToken(token);
        setQrExpiresAt(exp);
        sessionStorage.setItem('qrToken', token);
        sessionStorage.setItem('qrExpiresAt', String(exp));
        
        // Initialize QR session on backend
        api.post('/auth/qr-login-init', { qrToken: token })
          .catch(err => console.error('QR init error:', err));
      }
    }
  }, [mode, isMobile]);

  // Poll QR status when in QR mode
  useEffect(() => {
    if (mode !== 'qr' || isMobile || !qrToken) return;
    
    let pollInterval;
    let mounted = true;

    const pollStatus = async () => {
      try {
        const response = await api.post('/auth/qr-login-status', { qrToken });
        
        if (!mounted) return;

        if (response.data.status === 'confirmed') {
          // QR was scanned successfully - auto login
          clearInterval(pollInterval);
          login(response.data.user, response.data.token);
          toast.success('Đăng nhập thành công từ điện thoại!');
          
          // Clean up session storage
          sessionStorage.removeItem('qrToken');
          sessionStorage.removeItem('qrExpiresAt');
        } else if (response.data.status === 'expired') {
          // QR expired
          clearInterval(pollInterval);
        }
      } catch (err) {
        console.error('Poll error:', err);
      }
    };

    // Start polling every 2 seconds
    pollInterval = setInterval(pollStatus, 2000);

    // Stop polling when QR expires
    const timeUntilExpiry = qrExpiresAt - Date.now();
    const expiryTimeout = setTimeout(() => {
      clearInterval(pollInterval);
    }, Math.max(timeUntilExpiry, 0));

    return () => {
      mounted = false;
      clearInterval(pollInterval);
      clearTimeout(expiryTimeout);
    };
  }, [mode, isMobile, qrToken, qrExpiresAt, login]);

  const refreshQr = () => {
    const token = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const exp = Date.now() + 60 * 1000;
    setQrToken(token);
    setQrExpiresAt(exp);
    sessionStorage.setItem('qrToken', token);
    sessionStorage.setItem('qrExpiresAt', String(exp));
    
    // Initialize new QR session on backend
    api.post('/auth/qr-login-init', { qrToken: token })
      .catch(err => console.error('QR refresh error:', err));
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    console.log('📤 Đang gửi request đăng nhập...', formData);

    try {
      const response = await api.post('/auth/login', formData);
      console.log('✅ Đăng nhập thành công!', response.data);
      login(response.data.user, response.data.token);
      toast.success('Đăng nhập thành công!');
    } catch (error) {
      console.error('❌ Lỗi đăng nhập:', error);
      console.error('❌ Response:', error.response?.data);
      console.error('❌ Status:', error.response?.status);
      
      // Hiển thị lỗi chi tiết hơn
      const errorMsg = error.response?.data?.message || error.message || 'Đăng nhập thất bại';
      toast.error(errorMsg);
      
      // Hiển thị alert để dễ debug
      alert(`Lỗi: ${errorMsg}\nEmail: ${formData.email}\nPassword length: ${formData.password?.length}`);
    } finally {
      setLoading(false);
    }
  };


  return (
    <Container $isDark={isDarkMode}>
      <FormContainer $isDark={isDarkMode}>
        {!isMobile && (
        <MenuButton $isDark={isDarkMode} aria-label="menu" onClick={() => setMenuOpen(!menuOpen)}>
          {/* simple hamburger */}
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="3" y1="6" x2="21" y2="6"></line>
            <line x1="3" y1="12" x2="21" y2="12"></line>
            <line x1="3" y1="18" x2="21" y2="18"></line>
          </svg>
        </MenuButton>
        )}
        {menuOpen && !isMobile && (
          <Dropdown $isDark={isDarkMode}>
            {mode === 'qr' ? (
              <DropdownItem $isDark={isDarkMode} onClick={() => { setMode('password'); setMenuOpen(false); }}>
                Đăng nhập với mật khẩu
              </DropdownItem>
            ) : (
              <DropdownItem $isDark={isDarkMode} onClick={() => { setMode('qr'); setMenuOpen(false); }}>
                Đăng nhập qua mã QR
              </DropdownItem>
            )}
          </Dropdown>
        )}

        <Logo $isDark={isDarkMode}>
          <div className="logo-icon"><img src={`${process.env.PUBLIC_URL || ''}/Zyea.jpg?v=2`} alt="Zyea+" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 'inherit' }} /></div>
          <h1>Zyea+</h1>
          <p>Kết nối mọi người</p>
        </Logo>

        {mode === 'qr' && !isMobile ? (
          <QRContainer>
            <QRTitle $isDark={isDarkMode}>Đăng nhập qua mã QR</QRTitle>
            <QRCodeBox $isDark={isDarkMode} style={{ position: 'relative' }}>
              {/* Placeholder QR using public API with token for cache-busting. */}
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent('zyea-login-session:' + qrToken)}`}
                alt="QR đăng nhập"
                width={220}
                height={220}
                style={{ borderRadius: 10 }}
              />
              {nowTs >= qrExpiresAt && (
                <QROverlay>
                  <QRExpiredText>Mã QR hết hạn</QRExpiredText>
                  <QRRefreshButton onClick={refreshQr}>Lấy mã mới</QRRefreshButton>
                </QROverlay>
              )}
            </QRCodeBox>
            <QRNote $isDark={isDarkMode}>Chỉ dùng để đăng nhập Zyea+ trên máy tính</QRNote>
            <LinkText $isDark={isDarkMode} style={{ marginTop: 8 }}>
              <button onClick={() => setMode('password')} style={{ background: 'none', border: 'none', color: '#0068ff', cursor: 'pointer' }}>
                Đăng nhập với mật khẩu
              </button>
            </LinkText>
          </QRContainer>
        ) : (
          <Form onSubmit={handleSubmit}>
            <InputGroup>
              <Input
                $isDark={isDarkMode}
                type="email"
                name="email"
                placeholder="Nhập email của bạn"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </InputGroup>
            <PasswordContainer>
              <PasswordInput
                $isDark={isDarkMode}
                type={showPassword ? 'text' : 'password'}
                name="password"
                placeholder="Nhập mật khẩu"
                value={formData.password}
                onChange={handleChange}
                required
              />
              <EyeIcon $isDark={isDarkMode} type="button" onClick={() => setShowPassword(!showPassword)}>
                {showPassword ? <FiEyeOff /> : <FiEye />}
              </EyeIcon>
            </PasswordContainer>
            <ForgotPasswordLink to="/forgot-password">Quên mật khẩu?</ForgotPasswordLink>
            <Button type="submit" disabled={loading}>{loading ? 'Đang đăng nhập...' : 'Đăng nhập'}</Button>
          </Form>
        )}

        {mode === 'password' && (
          <>
            <LinkText $isDark={isDarkMode}>
              Chưa có tài khoản? <Link to="/register">Đăng ký ngay</Link>
            </LinkText>
            <SocialLogin $isDark={isDarkMode}>
              <p>Hoặc đăng nhập với</p>
              <SocialButton $isDark={isDarkMode} type="button">
                <span>📱</span>
                Google
              </SocialButton>
            </SocialLogin>
          </>
        )}
      </FormContainer>
    </Container>
  );
};

export default Login;
