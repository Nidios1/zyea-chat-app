import React, { useState, useContext, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import styled from 'styled-components';
import { FiEye, FiEyeOff, FiRefreshCw, FiLoader, FiAlertCircle, FiX } from 'react-icons/fi';
import AuthContext from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import api from '../../utils/api';


// ==================== Layout Components ====================
const Container = styled.div`
  display: flex;
  min-height: 100vh;
  background: #ffffff;
  justify-content: center;
  align-items: flex-start;
  padding: 2rem 2rem 2rem 2rem;

  @media (max-width: 768px) {
    padding: 1.5rem 1.5rem 1.5rem 1.5rem;
  }

  @media (max-width: 480px) {
    padding: 1rem 1rem 1rem 1rem;
  }
`;

const LoginContainer = styled.div`
  width: 100%;
  max-width: 500px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.25rem;
  margin-top: 0;

  @media (max-width: 768px) {
    max-width: 100%;
    gap: 1.125rem;
  }

  @media (max-width: 480px) {
    gap: 1rem;
  }
`;

// ==================== Header Components ====================
const LogoContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.25rem;
  margin-bottom: 0.75rem;
    width: 100%;

  @media (max-width: 768px) {
    gap: 1rem;
    margin-bottom: 0.5rem;
  }

  @media (max-width: 480px) {
    gap: 0.875rem;
    margin-bottom: 0.5rem;
  }
`;

const LogoCircle = styled.div`
  width: 120px;
  height: 120px;
  border-radius: 50%;
  background: #0088cc;
  display: flex;
  align-items: center;
  justify-content: center;
  
  img {
    width: 80px;
    height: 80px;
    border-radius: 50%;
    object-fit: cover;
  }
  
  @media (max-width: 768px) {
    width: 110px;
    height: 110px;
    
    img {
      width: 75px;
      height: 75px;
    }
  }

  @media (max-width: 480px) {
    width: 100px;
    height: 100px;
    
    img {
      width: 70px;
      height: 70px;
    }
  }
`;

const LoginTitle = styled.h1`
  font-size: 2rem;
  font-weight: 700;
  color: #000;
  margin: 0;
  line-height: 1.3;
  text-align: center;
  
  @media (max-width: 768px) {
    font-size: 1.875rem;
  }
  
  @media (max-width: 480px) {
    font-size: 1.5rem;
  }
`;

const LoginSubtitle = styled.p`
  font-size: 15px;
  color: #000;
  margin: 0;
  text-align: center;
  line-height: 1.5;
  padding: 0 1rem;
  
  @media (max-width: 768px) {
    font-size: 14.5px;
    padding: 0 0.5rem;
  }
  
  @media (max-width: 480px) {
    font-size: 13px;
    padding: 0;
  }
`;

// ==================== QR Code Components ====================
const QRContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.5rem;
  width: 100%;
`;

const QRCodeBox = styled.div`
  width: 280px;
  height: 280px;
  padding: 20px;
  border-radius: 0;
  background: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  
  @media (max-width: 768px) {
    width: 260px;
    height: 260px;
    padding: 18px;
  }
  
  @media (max-width: 480px) {
    width: 240px;
    height: 240px;
    padding: 16px;
  }
  
  @media (max-width: 360px) {
    width: 220px;
    height: 220px;
    padding: 14px;
  }
`;

const QRImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: contain;
`;

const QRLogoOverlay = styled.div`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 60px;
  height: 60px;
  background: #0088cc;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1;
  
  img {
    width: 40px;
    height: 40px;
    object-fit: cover;
    border-radius: 50%;
  }
  
  @media (max-width: 768px) {
    width: 55px;
    height: 55px;
    
    img {
      width: 37px;
      height: 37px;
    }
  }
  
  @media (max-width: 480px) {
    width: 50px;
    height: 50px;
    
    img {
      width: 34px;
      height: 34px;
    }
  }

  @media (max-width: 360px) {
    width: 45px;
    height: 45px;
    
    img {
      width: 30px;
      height: 30px;
    }
  }
`;

const QROverlay = styled.div`
  position: absolute;
  inset: 0;
  background: rgba(255,255,255,0.95);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  backdrop-filter: blur(4px);
`;

const QRRefreshButton = styled.button`
  background: #1677ff;
  color: #fff;
  border: none;
  border-radius: 6px;
  padding: 8px 16px;
  cursor: pointer;
  font-weight: 600;
  font-size: 13px;
  display: flex;
  align-items: center;
  gap: 6px;
  box-shadow: 0 2px 6px rgba(0,0,0,0.15);
  transition: all 0.2s;
  
  &:hover:not(:disabled) { 
    background: #125fd1;
    transform: translateY(-1px);
    box-shadow: 0 3px 10px rgba(0,0,0,0.2);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
  
  svg {
    width: 14px;
    height: 14px;
  }
`;

const QRLoadingOverlay = styled.div`
  position: absolute;
  inset: 0;
  background: rgba(255,255,255,0.95);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  backdrop-filter: blur(4px);
  z-index: 2;
`;

const QRLoadingSpinner = styled(FiLoader)`
  animation: spin 1s linear infinite;
  font-size: 24px;
  color: #1677ff;
  
  @keyframes spin {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }
`;

const QRErrorMessage = styled.div`
  width: 100%;
  padding: 0.75rem 1rem;
  background: #fee;
  border: 1px solid #fcc;
  border-radius: 8px;
  color: #c33;
  font-size: 14px;
  line-height: 1.5;
  margin-top: 1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;

  @media (max-width: 480px) {
    padding: 0.625rem 0.875rem;
  font-size: 13px;
    border-radius: 6px;
  }
`;

const QRInstructions = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  width: 100%;
  max-width: 400px;

  @media (max-width: 768px) {
    max-width: 100%;
    padding: 0 1rem;
  }

  @media (max-width: 480px) {
    gap: 0.625rem;
    padding: 0 0.5rem;
  }

  @media (max-width: 360px) {
    gap: 0.5rem;
    padding: 0 0.25rem;
  }
`;

const InstructionItem = styled.li`
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  color: #000;
  font-size: 15px;
  line-height: 1.5;
  
  @media (max-width: 480px) {
    font-size: 14px;
  }
`;

const InstructionNumber = styled.div`
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: #0088cc;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 13px;
  flex-shrink: 0;
  
  @media (max-width: 480px) {
    width: 22px;
    height: 22px;
    font-size: 12px;
  }
`;

// ==================== Form Components ====================
const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  width: 100%;
  max-width: 400px;

  @media (max-width: 768px) {
    max-width: 100%;
    gap: 1.125rem;
  }

  @media (max-width: 480px) {
    gap: 1rem;
    padding: 0 0.5rem;
  }

  @media (max-width: 360px) {
    padding: 0 0.25rem;
  }
`;

const InputGroup = styled.div`
  position: relative;
  width: 100%;
`;

const InputLabel = styled.label`
  position: absolute;
  left: 0.875rem;
  top: ${props => props.$isFloating ? '-0.5rem' : '0.75rem'};
  font-size: ${props => props.$isFloating ? '12px' : '15px'};
  font-weight: ${props => props.$isFloating ? '500' : '400'};
  color: ${props => props.$isFocused ? '#0088cc' : '#999'};
  background: ${props => props.$isFloating ? '#fff' : 'transparent'};
  padding: ${props => props.$isFloating ? '0 0.25rem' : '0'};
  pointer-events: none;
  transition: all 0.2s ease;
  z-index: 1;

  @media (max-width: 768px) {
    left: 0.75rem;
    top: ${props => props.$isFloating ? '-0.5rem' : '0.75rem'};
  }

  @media (max-width: 480px) {
    left: 0.875rem;
    top: ${props => props.$isFloating ? '-0.5rem' : '0.875rem'};
    font-size: ${props => props.$isFloating ? '11px' : '16px'};
  }

  @media (max-width: 360px) {
    left: 0.75rem;
    top: ${props => props.$isFloating ? '-0.5rem' : '0.75rem'};
  }
`;

const Input = styled.input`
  width: 100%;
  padding: 0.75rem 0.875rem;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 15px;
  transition: all 0.2s ease;
  background: #fff;
  color: #000;

  &:focus {
    outline: none;
    border-color: #0088cc;
  }

  &:disabled {
    background: #f5f5f5;
    cursor: not-allowed;
    opacity: 0.7;
  }

  &::placeholder {
    color: transparent;
  }

  @media (max-width: 768px) {
    font-size: 15px;
    padding: 0.75rem;
  }

  @media (max-width: 480px) {
    font-size: 16px;
    padding: 0.875rem;
    border-radius: 6px;
  }

  @media (max-width: 360px) {
    font-size: 16px;
    padding: 0.75rem;
  }
`;

const CheckboxContainer = styled.label`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  cursor: pointer;
  user-select: none;
  margin-top: 0.5rem;
`;

const Checkbox = styled.input`
  width: 18px;
  height: 18px;
  cursor: pointer;
  accent-color: #0088cc;
`;

const CheckboxLabel = styled.span`
  font-size: 15px;
  color: #000;
  
  @media (max-width: 480px) {
    font-size: 14px;
  }
`;

const PasswordContainer = styled.div`
  position: relative;
`;

const PasswordInput = styled(Input)`
  padding-right: 2.5rem;
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

  &:hover:not(:disabled) {
    color: #0068ff;
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.5;
  }
`;

const Button = styled.button`
  padding: 0.75rem 1.5rem;
  background: #0088cc;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 15px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  position: relative;

  &:hover:not(:disabled) {
    background: #0077bb;
  }

  &:disabled {
    background: #0088cc;
    opacity: 0.7;
    cursor: not-allowed;
  }

  @media (max-width: 768px) {
    padding: 0.75rem 1.25rem;
    font-size: 15px;
  }

  @media (max-width: 480px) {
    padding: 0.875rem 1rem;
    font-size: 16px;
    border-radius: 6px;
  }

  @media (max-width: 360px) {
    padding: 0.75rem 0.875rem;
    font-size: 15px;
  }
`;

const Spinner = styled(FiLoader)`
  animation: spin 1s linear infinite;
  
  @keyframes spin {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }
`;

const ErrorMessage = styled.div`
  width: 100%;
  padding: 0.875rem 1rem;
  background: #fee;
  border: 1px solid #fcc;
  border-radius: 8px;
  color: #c33;
  font-size: 14px;
  line-height: 1.5;
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  margin-bottom: 0.5rem;
  animation: slideDown 0.3s ease;

  @keyframes slideDown {
    from {
      opacity: 0;
      transform: translateY(-10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @media (max-width: 480px) {
    padding: 0.75rem;
    font-size: 13px;
    border-radius: 6px;
  }
`;

const ErrorIcon = styled(FiAlertCircle)`
  flex-shrink: 0;
  margin-top: 2px;
  font-size: 18px;

  @media (max-width: 480px) {
    font-size: 16px;
  }
`;

const ErrorContent = styled.div`
  flex: 1;
`;

const ErrorTitle = styled.div`
  font-weight: 600;
  margin-bottom: 0.25rem;
`;

const ErrorText = styled.div`
  font-weight: 400;
  opacity: 0.9;
`;

const ErrorCloseButton = styled.button`
  background: none;
  border: none;
  color: #c33;
  cursor: pointer;
  padding: 0.25rem;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: opacity 0.2s;
  font-size: 18px;

  &:hover {
    opacity: 0.7;
  }

  @media (max-width: 480px) {
    font-size: 16px;
  }
`;

const AlternativeLoginLink = styled(Link)`
  color: #0088cc;
  text-decoration: none;
  font-size: 15px;
  font-weight: 500;
  cursor: pointer;
  transition: color 0.2s;
  margin-top: 0.5rem;
  text-align: center;

  &:hover {
    color: #0066aa;
  }
  
  @media (max-width: 768px) {
    font-size: 14.5px;
  }
  
  @media (max-width: 480px) {
    font-size: 14px;
    margin-top: 0.75rem;
  }

  @media (max-width: 360px) {
    font-size: 13px;
  }
`;

const OnboardOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
  padding: 1rem;
  animation: fadeIn 0.3s ease;

  @keyframes fadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }
`;

const OnboardContent = styled.div`
  background: white;
  border-radius: 16px;
  max-width: 90%;
  max-height: 90vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
  animation: slideUp 0.3s ease;

  @keyframes slideUp {
    from {
      transform: translateY(20px);
      opacity: 0;
    }
    to {
      transform: translateY(0);
      opacity: 1;
    }
  }
  
  @media (max-width: 480px) {
    max-width: 95%;
    border-radius: 12px;
  }
`;

const OnboardImage = styled.img`
  width: 100%;
  height: auto;
  display: block;
  object-fit: contain;
`;

const OnboardActions = styled.div`
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  background: white;

  @media (max-width: 480px) {
    padding: 1rem;
    gap: 0.75rem;
  }
`;

const OnboardTitle = styled.h2`
  font-size: 20px;
  font-weight: 600;
  color: #000;
  margin: 0 0 0.5rem 0;
  text-align: center;

  @media (max-width: 480px) {
    font-size: 18px;
  }
`;

const OnboardText = styled.p`
  font-size: 15px;
  color: #666;
  margin: 0 0 1rem 0;
  text-align: center;
  line-height: 1.5;

  @media (max-width: 480px) {
    font-size: 14px;
  }
`;

const OnboardButton = styled.button`
  padding: 0.875rem 1.5rem;
  background: #0088cc;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  width: 100%;
  
  &:hover {
    background: #0077bb;
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0, 136, 204, 0.3);
  }
  
  &:active {
    transform: translateY(0);
  }

  @media (max-width: 480px) {
    padding: 0.75rem 1.25rem;
    font-size: 15px;
  }
`;

const OnboardCloseButton = styled.button`
      position: absolute;
  top: 1rem;
  right: 1rem;
  background: rgba(255, 255, 255, 0.9);
  border: none;
  border-radius: 50%;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 20px;
  color: #666;
  transition: all 0.2s;
  z-index: 1;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);

    &:hover {
    background: white;
    color: #000;
    transform: rotate(90deg);
  }

  @media (max-width: 480px) {
    width: 32px;
    height: 32px;
    font-size: 18px;
    top: 0.75rem;
    right: 0.75rem;
  }
`;

// ==================== Main Component ====================
const Login = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [keepSignedIn, setKeepSignedIn] = useState(true);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [mode, setMode] = useState('qr');
  const [isMobile, setIsMobile] = useState(false);
  const [qrToken, setQrToken] = useState('');
  const [qrExpiresAt, setQrExpiresAt] = useState(0);
  const [nowTs, setNowTs] = useState(Date.now());
  const [focusedField, setFocusedField] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);
  const [qrLoading, setQrLoading] = useState(false);
  const [qrError, setQrError] = useState(null);
  const [showOnboard, setShowOnboard] = useState(false);
  const { login } = useContext(AuthContext);
  const { isDarkMode } = useTheme();

  // Check if mobile device
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

  // Check if accessed from link and show onboard banner on mobile
  useEffect(() => {
    if (!isMobile) return;

    // Kiểm tra xem đã hiển thị onboard trong session này chưa
    const onboardShown = sessionStorage.getItem('onboardShown');
    if (onboardShown === 'true') return;

    // Kiểm tra xem có phải truy cập từ link không
    const hasReferrer = document.referrer && document.referrer !== '';
    const urlParams = new URLSearchParams(window.location.search);
    const fromLink = urlParams.get('from') === 'link' || hasReferrer;

    // Hiển thị onboard nếu:
    // 1. Có referrer (truy cập từ link)
    // 2. Có param ?from=link
    // 3. Hoặc đang ở trang login (mặc định hiển thị trên mobile)
    if (fromLink || window.location.pathname === '/login' || window.location.pathname === '/m/login') {
      setShowOnboard(true);
    }
  }, [isMobile]);

  const handleCloseOnboard = () => {
    setShowOnboard(false);
    sessionStorage.setItem('onboardShown', 'true');
  };

  const handleOpenApp = () => {
    // Thử mở app nếu có, nếu không thì đóng onboard
    const appScheme = 'zyea://'; // Thay đổi theo scheme của app
    const appUrl = appScheme + 'login';
    const fallbackUrl = window.location.href;
    
    // Thử mở app
    window.location.href = appUrl;
    
    // Nếu không mở được app sau 2 giây, đóng onboard
    setTimeout(() => {
      handleCloseOnboard();
    }, 2000);
  };

  // Update QR countdown timer
  useEffect(() => {
    if (mode !== 'qr' || isMobile) return;
    const id = setInterval(() => setNowTs(Date.now()), 1000);
    return () => clearInterval(id);
  }, [mode, isMobile]);

  // Set page title
  useEffect(() => {
    document.title = 'ZYEA Chat';
  }, []);

  // Function to detect device info
  const getDeviceInfo = () => {
    const ua = navigator.userAgent;
    let device = 'Desktop';
    let browser = 'Chrome';
    let browserVersion = 'Unknown';
    let os = 'Windows';

    // Detect OS
    if (ua.includes('Windows')) {
      os = 'Windows';
    } else if (ua.includes('Mac')) {
      os = 'macOS';
    } else if (ua.includes('Linux')) {
      os = 'Linux';
    } else if (ua.includes('Android')) {
      os = 'Android';
    } else if (ua.includes('iOS') || ua.includes('iPhone') || ua.includes('iPad')) {
      os = 'iOS';
    }

    // Detect Browser
    if (ua.includes('Chrome') && !ua.includes('Edg') && !ua.includes('OPR')) {
      browser = 'Chrome';
      const match = ua.match(/Chrome\/([\d.]+)/);
      if (match) browserVersion = match[1];
    } else if (ua.includes('Firefox')) {
      browser = 'Firefox';
      const match = ua.match(/Firefox\/([\d.]+)/);
      if (match) browserVersion = match[1];
    } else if (ua.includes('Safari') && !ua.includes('Chrome')) {
      browser = 'Safari';
      const match = ua.match(/Version\/([\d.]+)/);
      if (match) browserVersion = match[1];
    } else if (ua.includes('Edg')) {
      browser = 'Edge';
      const match = ua.match(/Edg\/([\d.]+)/);
      if (match) browserVersion = match[1];
    } else if (ua.includes('OPR')) {
      browser = 'Opera';
      const match = ua.match(/OPR\/([\d.]+)/);
      if (match) browserVersion = match[1];
    }

    // Get location from sessionStorage if available (cached from previous request)
    let location = sessionStorage.getItem('deviceLocation') || 'Unknown';

    return {
      device: device,
      deviceType: device,
      browser: browser,
      browserVersion: browserVersion,
      version: browserVersion,
      os: os,
      osName: os,
      location: location,
    };
  };

  // Fetch location from IP geolocation API (async, non-blocking)
  useEffect(() => {
    // Only fetch if not already cached
    if (!sessionStorage.getItem('deviceLocation')) {
      // Use free IP geolocation API
      fetch('https://ipapi.co/json/')
        .then(res => res.json())
        .then(data => {
          if (data.city && data.country_name) {
            const location = `${data.city}, ${data.country_name}`;
            sessionStorage.setItem('deviceLocation', location);
            // Update QR token with new location if QR is active
            if (mode === 'qr' && !isMobile && qrToken) {
              const deviceInfo = getDeviceInfo();
              deviceInfo.location = location; // Override with newly fetched location
              api.post('/auth/qr-login-init', { 
                qrToken: qrToken,
                deviceInfo: deviceInfo
              }).catch(err => console.log('Failed to update QR with location:', err));
            }
          } else if (data.country_name) {
            sessionStorage.setItem('deviceLocation', data.country_name);
            if (mode === 'qr' && !isMobile && qrToken) {
              const deviceInfo = getDeviceInfo();
              deviceInfo.location = data.country_name;
              api.post('/auth/qr-login-init', { 
                qrToken: qrToken,
                deviceInfo: deviceInfo
              }).catch(err => console.log('Failed to update QR with location:', err));
            }
          }
        })
        .catch(err => {
          console.log('Could not fetch location:', err);
          // Fallback: try another API
          fetch('https://ip-api.com/json/')
            .then(res => res.json())
            .then(data => {
              if (data.city && data.country) {
                const location = `${data.city}, ${data.country}`;
                sessionStorage.setItem('deviceLocation', location);
                if (mode === 'qr' && !isMobile && qrToken) {
                  const deviceInfo = getDeviceInfo();
                  deviceInfo.location = location;
                  api.post('/auth/qr-login-init', { 
                    qrToken: qrToken,
                    deviceInfo: deviceInfo
                  }).catch(err => console.log('Failed to update QR with location:', err));
                }
              } else if (data.country) {
                sessionStorage.setItem('deviceLocation', data.country);
                if (mode === 'qr' && !isMobile && qrToken) {
                  const deviceInfo = getDeviceInfo();
                  deviceInfo.location = data.country;
                  api.post('/auth/qr-login-init', { 
                    qrToken: qrToken,
                    deviceInfo: deviceInfo
                  }).catch(err => console.log('Failed to update QR with location:', err));
                }
              }
            })
            .catch(err2 => {
              console.log('Could not fetch location from fallback API:', err2);
            });
        });
    }
  }, [mode, isMobile, qrToken]);

  // Initialize QR token
  useEffect(() => {
    if (mode === 'qr' && !isMobile) {
      setQrError(null);
      setQrLoading(false);
      const storedToken = sessionStorage.getItem('qrToken');
      const storedExp = Number(sessionStorage.getItem('qrExpiresAt') || 0);
      const now = Date.now();
      
      if (storedToken && storedExp && now < storedExp) {
        // Token còn hợp lệ, sử dụng lại
        setQrToken(storedToken);
        setQrExpiresAt(storedExp);
        setQrLoading(false);
      } else {
        // Token hết hạn hoặc không tồn tại, tạo mới
        setQrLoading(true);
        const token = `${now}-${Math.random().toString(36).slice(2, 8)}`;
        const exp = now + 60 * 1000;
        setQrToken(token);
        setQrExpiresAt(exp);
        sessionStorage.setItem('qrToken', token);
        sessionStorage.setItem('qrExpiresAt', String(exp));
        
        // Send device info with QR init
        const deviceInfo = getDeviceInfo();
        api.post('/auth/qr-login-init', { 
          qrToken: token,
          deviceInfo: deviceInfo
        })
          .then(() => {
            setQrLoading(false);
          })
          .catch(err => {
            console.error('QR init error:', err);
            setQrLoading(false);
            const errorMsg = err.response?.data?.message || 'Không thể khởi tạo mã QR. Vui lòng thử lại.';
            setQrError(errorMsg);
            toast.error(errorMsg);
          });
      }
    } else {
      // Không ở chế độ QR hoặc là mobile, clear tất cả
      setQrToken('');
      setQrExpiresAt(0);
      setQrError(null);
      setQrLoading(false);
    }
  }, [mode, isMobile]);

  // Poll QR login status
  useEffect(() => {
    if (mode !== 'qr' || isMobile || !qrToken) return;
    
    let pollInterval;
    let mounted = true;

    const pollStatus = async () => {
      try {
        const response = await api.post('/auth/qr-login-status', { qrToken });
        if (!mounted) return;

        if (response.data.status === 'confirmed') {
          clearInterval(pollInterval);
          login(response.data.user, response.data.token);
          toast.success('Đăng nhập thành công từ điện thoại!');
          sessionStorage.removeItem('qrToken');
          sessionStorage.removeItem('qrExpiresAt');
        } else if (response.data.status === 'expired') {
          clearInterval(pollInterval);
          setQrError('Mã QR đã hết hạn. Vui lòng làm mới mã QR.');
        }
      } catch (err) {
        console.error('Poll error:', err);
        // Chỉ hiển thị lỗi nếu không phải lỗi network tạm thời
        if (err.response && err.response.status >= 500) {
          setQrError('Lỗi kết nối server. Vui lòng thử lại.');
        }
      }
    };

    pollInterval = setInterval(pollStatus, 2000);
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

  // Tự động đóng error message sau 6 giây
  useEffect(() => {
    if (errorMessage) {
      const timer = setTimeout(() => {
        setErrorMessage(null);
      }, 6000); // 6 giây

      return () => {
        clearTimeout(timer);
      };
    }
  }, [errorMessage]);

  const refreshQr = () => {
    // Clear old token để trigger cleanup của polling interval
    setQrToken('');
    setQrError(null);
    setQrLoading(true);
    
    // Tạo token mới sau một chút để đảm bảo cleanup hoàn tất
    setTimeout(() => {
    const token = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const exp = Date.now() + 60 * 1000;
    setQrToken(token);
    setQrExpiresAt(exp);
    sessionStorage.setItem('qrToken', token);
    sessionStorage.setItem('qrExpiresAt', String(exp));
    
    // Send device info with QR init
    const deviceInfo = getDeviceInfo();
    api.post('/auth/qr-login-init', { 
      qrToken: token,
      deviceInfo: deviceInfo
    })
        .then(() => {
          setQrLoading(false);
          toast.success('Đã làm mới mã QR');
        })
        .catch(err => {
          console.error('QR refresh error:', err);
          setQrLoading(false);
          const errorMsg = err.response?.data?.message || 'Không thể làm mới mã QR. Vui lòng thử lại.';
          setQrError(errorMsg);
          toast.error(errorMsg);
        });
    }, 100);
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    // Xóa thông báo lỗi khi người dùng bắt đầu nhập lại
    if (errorMessage) {
      setErrorMessage(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Xóa thông báo lỗi cũ
    setErrorMessage(null);
    
    // Validation phía client
    if (!formData.email || !formData.email.trim()) {
      const msg = { title: 'Thiếu thông tin', message: 'Vui lòng nhập email của bạn' };
      setErrorMessage(msg);
      toast.error(msg.message);
      return;
    }

    if (!formData.email.includes('@')) {
      const msg = { title: 'Email không hợp lệ', message: 'Email không hợp lệ. Vui lòng kiểm tra lại.' };
      setErrorMessage(msg);
      toast.error(msg.message);
      return;
    }

    if (!formData.password || !formData.password.trim()) {
      const msg = { title: 'Thiếu thông tin', message: 'Vui lòng nhập mật khẩu' };
      setErrorMessage(msg);
      toast.error(msg.message);
      return;
    }

    if (formData.password.length < 6) {
      const msg = { title: 'Mật khẩu không hợp lệ', message: 'Mật khẩu phải có ít nhất 6 ký tự' };
      setErrorMessage(msg);
      toast.error(msg.message);
      return;
    }

    setLoading(true);

    try {
      // Email/password login
      const response = await api.post('/auth/login', {
        email: formData.email.trim(),
        password: formData.password
      });
      login(response.data.user, response.data.token);
      toast.success('Đăng nhập thành công!');
    } catch (error) {
      console.log('Login error:', error);
      console.log('Error response:', error.response);
      
      // Kiểm tra lỗi network/server
      if (!error.response) {
        // Network error - không có response từ server
        console.log('Network error - no response');
        const errorMsg = {
          title: 'Lỗi kết nối',
          message: 'Không thể kết nối tới server. Vui lòng kiểm tra kết nối internet và thử lại.'
        };
        setErrorMessage(errorMsg);
        toast.error(errorMsg.message, {
          autoClose: 5000
        });
        setLoading(false);
        return;
      }

      const errorMessage = error.response?.data?.message || error.response?.data?.error || '';
      const errorData = error.response?.data || {};
      const statusCode = error.response?.status || 0;

      console.log('Error details:', {
        statusCode,
        errorMessage,
        errorData
      });

      // Xử lý validation errors từ server
      if (errorData.errors && Array.isArray(errorData.errors)) {
        const validationErrors = errorData.errors.map(err => err.msg || err.message).join(', ');
        console.log('Validation errors:', validationErrors);
        const errorMsg = {
          title: 'Thông tin không hợp lệ',
          message: validationErrors || 'Thông tin đăng nhập không hợp lệ'
        };
        setErrorMessage(errorMsg);
        toast.error(validationErrors || 'Thông tin đăng nhập không hợp lệ', {
          autoClose: 5000
        });
        setLoading(false);
        return;
      }

      // Phân tích và hiển thị thông báo lỗi chi tiết
      let displayMessage = '';
      let displayTitle = 'Đăng nhập thất bại';

      // Kiểm tra các loại lỗi cụ thể
      const errorMsgLower = (errorMessage || '').toLowerCase();
      
      // Xử lý status code 400 với "Invalid credentials" - đây là lỗi phổ biến nhất
      if (statusCode === 400 && (errorMsgLower.includes('invalid credentials') || errorMsgLower.includes('thông tin đăng nhập không đúng') || !errorMessage)) {
        displayTitle = 'Thông tin đăng nhập không đúng';
        displayMessage = 'Email hoặc mật khẩu không chính xác. Vui lòng kiểm tra lại email và mật khẩu của bạn.';
      } else if (errorMsgLower.includes('password') || errorMsgLower.includes('mật khẩu')) {
        displayTitle = 'Mật khẩu không đúng';
        displayMessage = 'Mật khẩu bạn nhập không đúng. Vui lòng thử lại hoặc nhấn "Quên mật khẩu" để đặt lại.';
      } else if (errorMsgLower.includes('email') || errorMsgLower.includes('user') || errorMsgLower.includes('not found') || errorMsgLower.includes('không tồn tại')) {
        displayTitle = 'Email không tồn tại';
        displayMessage = 'Email này chưa được đăng ký trong hệ thống. Vui lòng kiểm tra lại hoặc đăng ký tài khoản mới.';
      } else if (errorMsgLower.includes('blocked') || errorMsgLower.includes('khóa') || errorMsgLower.includes('banned')) {
        displayTitle = 'Tài khoản bị khóa';
        displayMessage = 'Tài khoản của bạn đã bị khóa. Vui lòng liên hệ bộ phận hỗ trợ để được giải quyết.';
      } else if (errorMsgLower.includes('suspended') || errorMsgLower.includes('tạm ngưng')) {
        displayTitle = 'Tài khoản bị tạm ngưng';
        displayMessage = 'Tài khoản của bạn đã bị tạm ngưng. Vui lòng liên hệ bộ phận hỗ trợ.';
      } else if (errorMsgLower.includes('verify') || errorMsgLower.includes('xác thực') || errorMsgLower.includes('verification')) {
        displayTitle = 'Email chưa được xác thực';
        displayMessage = 'Vui lòng xác thực email của bạn trước khi đăng nhập. Kiểm tra hộp thư để tìm email xác thực.';
      } else if (statusCode === 401 || statusCode === 403) {
        displayTitle = 'Xác thực thất bại';
        displayMessage = 'Thông tin đăng nhập không đúng hoặc bạn không có quyền truy cập. Vui lòng kiểm tra lại.';
      } else if (statusCode === 429) {
        displayTitle = 'Quá nhiều lần thử';
        displayMessage = 'Bạn đã thử đăng nhập quá nhiều lần. Vui lòng đợi vài phút rồi thử lại.';
      } else if (statusCode === 500 || statusCode >= 500) {
        displayTitle = 'Lỗi server';
        displayMessage = 'Server đang gặp sự cố. Vui lòng thử lại sau vài phút.';
      } else if (statusCode === 400) {
        // Xử lý các lỗi 400 khác
        displayTitle = 'Thông tin đăng nhập không đúng';
        displayMessage = errorMessage || 'Email hoặc mật khẩu không chính xác. Vui lòng kiểm tra lại.';
      } else if (statusCode >= 400) {
        displayTitle = 'Lỗi kết nối';
        displayMessage = errorMessage || 'Không thể kết nối tới server. Vui lòng kiểm tra kết nối internet và thử lại.';
      } else if (errorMessage) {
        displayTitle = 'Đăng nhập thất bại';
        displayMessage = errorMessage;
      } else {
        displayTitle = 'Đăng nhập thất bại';
        displayMessage = 'Đã xảy ra lỗi không xác định. Vui lòng thử lại sau.';
      }

      console.log('Display error:', { displayTitle, displayMessage });

      // Set error message để hiển thị trên form
      setErrorMessage({
        title: displayTitle,
        message: displayMessage
      });

      // Hiển thị thông báo lỗi với title và message
      const fullErrorMessage = `${displayTitle}\n${displayMessage}`;
      toast.error(fullErrorMessage, {
        autoClose: 6000,
        style: {
          fontSize: '14px',
          lineHeight: '1.6',
          whiteSpace: 'pre-line'
        }
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {showOnboard && isMobile && (
        <OnboardOverlay onClick={handleCloseOnboard}>
          <OnboardContent onClick={(e) => e.stopPropagation()}>
            <OnboardCloseButton onClick={handleCloseOnboard}>
              ×
            </OnboardCloseButton>
            <OnboardImage
              src="https://chat.fpt.com/images/onboard-left-banner.webp?v=0.0.1"
              alt="FPT Chat Onboard"
              onError={(e) => {
                // Fallback nếu hình ảnh không load được
                e.target.style.display = 'none';
              }}
            />
            <OnboardActions>
              <OnboardTitle>Truy cập FPT Chat bằng ứng dụng</OnboardTitle>
              <OnboardText>
                Truy cập FPT Chat bằng ứng dụng để có trải nghiệm đầy đủ
              </OnboardText>
              <OnboardButton onClick={handleOpenApp}>
                Mở FPT Chat
              </OnboardButton>
              <OnboardButton 
                onClick={handleCloseOnboard}
                style={{ 
                  background: 'transparent', 
                  color: '#666', 
                  border: '1px solid #ddd' 
                }}
              >
                Tiếp tục trên trình duyệt
              </OnboardButton>
            </OnboardActions>
          </OnboardContent>
        </OnboardOverlay>
      )}
      <Container>
        <LoginContainer>
          {mode === 'qr' && !isMobile ? (
            <>
              <QRContainer>
              <QRCodeBox>
                {qrLoading && (
                  <QRLoadingOverlay>
                    <QRLoadingSpinner />
                    <span style={{ fontSize: '14px', color: '#666' }}>Đang tạo mã QR...</span>
                  </QRLoadingOverlay>
                )}
                {qrToken && !qrLoading && (
                  <>
                    <QRImage
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent('zyea-login-session:' + qrToken)}`}
                      alt="QR đăng nhập"
                      width={240}
                      height={240}
                    />
                    <QRLogoOverlay>
                      <img 
                        src={`${process.env.PUBLIC_URL || ''}/Zyea.jpg?v=3`} 
                        alt="Zyea+" 
                      />
                    </QRLogoOverlay>
                  </>
                )}
                {!qrLoading && nowTs >= qrExpiresAt && qrToken && (
                    <QROverlay>
                    <QRRefreshButton onClick={refreshQr} disabled={qrLoading}>
                        <FiRefreshCw />
                        Thử lại
                      </QRRefreshButton>
                    </QROverlay>
                  )}
                </QRCodeBox>
              
              {qrError && (
                <QRErrorMessage>
                  <FiAlertCircle style={{ flexShrink: 0, fontSize: '18px' }} />
                  <span>{qrError}</span>
                </QRErrorMessage>
              )}
              
              <LoginTitle>Đăng nhập Zyea+ bằng mã QR</LoginTitle>
              
              <QRInstructions>
                <InstructionItem>
                  <InstructionNumber>1</InstructionNumber>
                  <span>Mở ứng dụng ZYEA Chat trên thiết bị di động</span>
                </InstructionItem>
                <InstructionItem>
                  <InstructionNumber>2</InstructionNumber>
                    <span>Vào mục <b>Thông tin tài khoản &gt; Quản lý thiết bị &gt; Link thiết bị mới</b></span>
                </InstructionItem>
                <InstructionItem>
                  <InstructionNumber>3</InstructionNumber>
                  <span>Hướng điện thoại vào màn hình này để xác nhận đăng nhập</span>
                </InstructionItem>
                </QRInstructions>
              </QRContainer>

            <AlternativeLoginLink to="#" onClick={(e) => { e.preventDefault(); setMode('password'); }}>
              ĐĂNG NHẬP BẰNG EMAIL
            </AlternativeLoginLink>
            </>
          ) : (
          <>
              <LogoContainer>
                <LogoCircle>
                  <img 
                    src={`${process.env.PUBLIC_URL || ''}/Zyea.jpg?v=2`} 
                    alt="Zyea+" 
                  />
                </LogoCircle>
                <LoginTitle>Zyea+</LoginTitle>
                <LoginSubtitle>
                  Vui lòng nhập email và mật khẩu của bạn.
                </LoginSubtitle>
              </LogoContainer>

            <Form onSubmit={handleSubmit}>
                {errorMessage && (
                  <ErrorMessage>
                    <ErrorIcon />
                    <ErrorContent>
                      <ErrorTitle>{errorMessage.title || 'Lỗi'}</ErrorTitle>
                      <ErrorText>{errorMessage.message || errorMessage}</ErrorText>
                    </ErrorContent>
                    <ErrorCloseButton onClick={() => setErrorMessage(null)}>
                      <FiX />
                    </ErrorCloseButton>
                  </ErrorMessage>
                )}
              <InputGroup>
                <Input
                  type="email"
                  name="email"
                  placeholder="Nhập email của bạn"
                  value={formData.email}
                  onChange={handleChange}
                    onFocus={() => setFocusedField('email')}
                    onBlur={() => setFocusedField(null)}
                    disabled={loading}
                  required
                />
                  <InputLabel 
                    $isFloating={formData.email.length > 0 || focusedField === 'email'}
                    $isFocused={focusedField === 'email'}
                  >
                    Nhập email của bạn
                  </InputLabel>
              </InputGroup>

                <InputGroup>
              <PasswordContainer>
                <PasswordInput
                  $isDark={isDarkMode}
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  placeholder="Nhập mật khẩu"
                  value={formData.password}
                  onChange={handleChange}
                      onFocus={() => setFocusedField('password')}
                      onBlur={() => setFocusedField(null)}
                      disabled={loading}
                  required
                />
                    <InputLabel 
                      $isFloating={formData.password.length > 0 || focusedField === 'password'}
                      $isFocused={focusedField === 'password'}
                    >
                      Nhập mật khẩu
                    </InputLabel>
                    <EyeIcon 
                      $isDark={isDarkMode} 
                      type="button" 
                      onClick={() => setShowPassword(!showPassword)}
                      disabled={loading}
                    >
                  {showPassword ? <FiEyeOff /> : <FiEye />}
                </EyeIcon>
              </PasswordContainer>
                </InputGroup>

                <CheckboxContainer>
                  <Checkbox
                    type="checkbox"
                    checked={keepSignedIn}
                    onChange={(e) => setKeepSignedIn(e.target.checked)}
                    disabled={loading}
                  />
                  <CheckboxLabel>Giữ tôi đăng nhập</CheckboxLabel>
                </CheckboxContainer>

                <Button type="submit" disabled={loading || !formData.email.trim() || !formData.password.trim()}>
                  {loading && <Spinner size={18} />}
                {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
              </Button>
            </Form>

              {!isMobile && (
              <AlternativeLoginLink to="#" onClick={(e) => { e.preventDefault(); setMode('qr'); }}>
                ĐĂNG NHẬP BẰNG MÃ QR
              </AlternativeLoginLink>
              )}
            </>
        )}
        </LoginContainer>
      </Container>
    </>
  );
};

export default Login;
