import React, { useState, useContext, useEffect } from 'react';
import styled from 'styled-components';
import { FiChevronLeft, FiEye, FiEyeOff, FiUsers } from 'react-icons/fi';
import api from '../../utils/api';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import AuthContext from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';

const Container = styled.div`
  min-height: 100dvh; 
  background: ${props => props.$isDark ? '#2d2d2d' : '#fff'}; 
  width: 100%;
  box-sizing: border-box;
  padding-top: env(safe-area-inset-top);
  padding-bottom: env(safe-area-inset-bottom);
  @media (min-width: 769px) { max-width: 420px; margin: 0 auto; border-left: 1px solid #eee; border-right: 1px solid #eee; }
`;

const StepHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px;
  font-weight: 600;
  font-size: 18px;
  color: ${props => props.$isDark ? '#fff' : '#2b2b2b'};
  border-bottom: 1px solid ${props => props.$isDark ? '#444' : '#e6e6e6'};
`;

const BackBtn = styled.button`
  border: none;
  background: transparent;
  padding: 6px;
  display: flex;
  align-items: center;
  color: ${props => props.$isDark ? '#fff' : '#2b2b2b'};
`;

const Form = styled.form`
  padding: 24px 16px;
`;

const Input = styled.input`
  width: 100%;
  border: 1px solid ${props => props.$isDark ? '#444' : '#e6e6e6'};
  border-radius: 12px;
  padding: 14px 12px;
  font-size: 16px;
  margin: 8px 0;
  background: ${props => props.$isDark ? '#1a1a1a' : '#fff'};
  color: ${props => props.$isDark ? '#fff' : '#000'};

  &::placeholder {
    color: ${props => props.$isDark ? '#777' : '#999'};
  }
`;

const InputGroup = styled.div`
  display: flex;
  gap: 8px;
  margin: 8px 0;
`;

const Button = styled.button`
  width: 100%;
  background: #0a66ff;
  color: #fff;
  border: none;
  border-radius: 12px;
  padding: 14px 16px;
  font-weight: 600;
  font-size: 16px;
  margin-top: 16px;
  cursor: pointer;

  &:disabled {
    background: #ccc;
    cursor: not-allowed;
  }
`;

const SecondaryButton = styled(Button)`
  background: transparent;
  border: 1px solid ${props => props.$isDark ? '#444' : '#e6e6e6'};
  color: ${props => props.$isDark ? '#fff' : '#333'};
  margin-top: 8px;
`;

const Title = styled.div`
  font-size: 24px;
  font-weight: 700;
  color: ${props => props.$isDark ? '#fff' : '#1c1e21'};
  margin-bottom: 12px;
  
  @media (max-width: 375px) {
    font-size: 22px;
  }
`;

const Description = styled.div`
  font-size: 14px;
  color: ${props => props.$isDark ? '#b0b3b8' : '#65676b'};
  margin-bottom: 24px;
  line-height: 1.5;
  padding: 0 16px;
  
  @media (max-width: 375px) {
    font-size: 13px;
    padding: 0 8px;
  }
`;

const PrimaryButton = styled.button`
  width: 100%;
  background: #0a66ff;
  color: #fff;
  border: none;
  border-radius: 12px;
  padding: 14px 16px;
  font-weight: 600;
  font-size: 16px;
  margin: 8px 0;
`;

const PasswordRow = styled.div`
  position: relative;
  display: flex;
  align-items: center;
`;

const EyeBtn = styled.button`
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  border: none;
  background: transparent;
  color: #666;
`;

const RadioGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin: 8px 0;
`;

const RadioOption = styled.label`
  display: flex;
  align-items: center;
  padding: 12px 14px;
  border: 1px solid ${props => props.$isDark ? '#444' : '#e6e6e6'};
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s;
  background: ${props => props.$isDark ? '#1a1a1a' : '#f8f9fa'};
  
  &:active {
    background: ${props => props.$isDark ? '#242526' : '#e9ecef'};
  }
  
  input[type='radio'] {
    margin-right: 10px;
    accent-color: #0a66ff;
    width: 18px;
    height: 18px;
  }
`;

const RadioLabel = styled.span`
  font-size: 15px;
  color: ${props => props.$isDark ? '#fff' : '#1c1e21'};
  flex: 1;
`;

const RadioSubtext = styled.div`
  font-size: 12px;
  color: ${props => props.$isDark ? '#b0b3b8' : '#65676b'};
  margin-top: 2px;
  line-height: 1.3;
`;

const TermsLink = styled.span`
  color: #0a66ff;
  cursor: pointer;
  
  &:active {
    opacity: 0.6;
  }
`;

const FooterNote = styled.div`
  text-align: center;
  color: ${props => props.$isDark ? '#aaa' : '#666'};
  font-size: 13px;
  padding: 8px 0;
  margin-top: 16px;
`;

const ResendLink = styled.span`
  color: #0a66ff;
  cursor: pointer;
  font-weight: 500;
  
  &:hover {
    text-decoration: underline;
  }
  
  &:active {
    opacity: 0.7;
  }
  
  &.disabled {
    color: ${props => props.$isDark ? '#555' : '#999'};
    cursor: not-allowed;
  }
`;

// iOS-style Alert Dialog
const AlertOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 99999;
  animation: fadeIn 0.2s ease;
  
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
`;

const AlertDialog = styled.div`
  background: #fff;
  border-radius: 14px;
  width: 280px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
  animation: slideUp 0.25s ease;
  
  @keyframes slideUp {
    from {
      transform: scale(0.9);
      opacity: 0;
    }
    to {
      transform: scale(1);
      opacity: 1;
    }
  }
`;

const AlertTitle = styled.div`
  font-size: 17px;
  font-weight: 600;
  text-align: center;
  padding: 22px 22px 8px;
  color: #000;
`;

const AlertMessage = styled.div`
  font-size: 14px;
  text-align: center;
  padding: 4px 22px;
  color: #6b6b6b;
  line-height: 1.4;
`;

const AlertButtonContainer = styled.div`
  border-top: 0.5px solid #c7c7cc;
  display: flex;
  flex-direction: column;
`;

const AlertButton = styled.button`
  font-size: 17px;
  font-weight: 400;
  padding: 13px;
  border: none;
  background: transparent;
  color: #007aff;
  font-weight: ${props => props.$isPrimary ? '600' : '400'};
  
  &:active {
    background: #f5f5f7;
  }
  
  &:not(:last-child) {
    border-bottom: 0.5px solid #c7c7cc;
  }
`;

const WelcomeScreen = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 32px 20px;
  min-height: 70vh;
  text-align: center;
  
  @media (max-width: 375px) {
    padding: 24px 16px;
  }
`;

const Illustration = styled.div`
  width: 100%;
  max-width: 280px;
  height: 280px;
  background: #f8f9fa;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 24px;
  position: relative;
  overflow: visible;
  
  @media (max-width: 375px) {
    max-width: 260px;
    height: 260px;
  }
`;

const PhotoFrame = styled.div`
  width: 120px;
  height: 120px;
  border-radius: 10px;
  background: linear-gradient(135deg, #ff9a9e 0%, #fecfef 50%, #fecfef 100%);
  border: 3px solid #fff;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 3;
`;

const PortraitIcon = styled.div`
  width: 90px;
  height: 90px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
`;

const HeartIcon = styled.div`
  position: absolute;
  left: 20px;
  top: 30px;
  width: 50px;
  height: 50px;
  background: #ff6b6b;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 12px rgba(255, 107, 107, 0.3);
  font-size: 28px;
  z-index: 2;
`;

const CakeIcon = styled.div`
  position: absolute;
  top: 20px;
  right: 40px;
  font-size: 36px;
  z-index: 2;
`;

const ThumbsUpIcon = styled.div`
  position: absolute;
  right: 20px;
  bottom: 30px;
  font-size: 64px;
  color: #1877f2;
  z-index: 2;
`;

const LandscapeFrame = styled.div`
  position: absolute;
  left: 20px;
  bottom: 30px;
  width: 70px;
  height: 70px;
  background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);
  border-radius: 8px;
  border: 2px solid #fff;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 40px;
  z-index: 2;
`;

const MobileRegister = () => {
  const navigate = useNavigate();
  const { login } = useContext(AuthContext);
  const { isDarkMode } = useTheme();
  
  // Form state
  const [step, setStep] = useState(1); // 1: intro, 2: name, 3: birthdate, 4: gender, 5: phone, 6: email, 7: password, 8: otp
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [gender, setGender] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [otpStep, setOtpStep] = useState(false);
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(20);
  const [registerMethod, setRegisterMethod] = useState('phone'); // 'phone' or 'email'
  const [alertData, setAlertData] = useState({ show: false, title: '', message: '', onConfirm: null });

  // Helper function to show alert
  const showAlert = (title, message, onConfirm = null) => {
    setAlertData({ show: true, title, message, onConfirm });
  };

  const closeAlert = () => {
    setAlertData({ show: false, title: '', message: '', onConfirm: null });
  };

  // Countdown effect for resend OTP
  useEffect(() => {
    if (otpStep && resendCountdown > 0) {
      const timer = setTimeout(() => {
        setResendCountdown(resendCountdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [otpStep, resendCountdown]);

  // Open terms
  const openTerms = (e, type) => {
    e.preventDefault();
    e.stopPropagation();
    const url = type === 'usage' ? '/m/terms' : '/m/social-terms';
    navigate(url);
  };

  const handleNext = async () => {
    if (step === 2) {
      if (!firstName.trim()) {
        showAlert('Vui lòng nhập họ', 'Họ không được để trống.');
        return;
      }
      if (!lastName.trim()) {
        showAlert('Vui lòng nhập tên', 'Tên không được để trống.');
        return;
      }
      if (firstName.trim().length < 2) {
        showAlert('Họ quá ngắn', 'Họ phải có ít nhất 2 ký tự.');
        return;
      }
      if (lastName.trim().length < 2) {
        showAlert('Tên quá ngắn', 'Tên phải có ít nhất 2 ký tự.');
        return;
      }
      
      // Validate real name format - only Vietnamese letters with accents and spaces
      const nameRegex = /^[a-zA-ZÀ-ỹ\s]+$/;
      
      // Check for invalid characters (numbers, special chars except spaces)
      if (!nameRegex.test(firstName)) {
        showAlert('Họ không hợp lệ', 'Họ chỉ được chứa chữ cái tiếng Việt. Vui lòng nhập tên thật.');
        return;
      }
      
      if (!nameRegex.test(lastName)) {
        showAlert('Tên không hợp lệ', 'Tên chỉ được chứa chữ cái tiếng Việt. Vui lòng nhập tên thật.');
        return;
      }
      
      const combinedName = (firstName + lastName).toLowerCase();
      
      // Check for consecutive repeated characters (aaa, kkk, hhh, etc.)
      if (/([a-z])\1{3,}/.test(combinedName)) {
        showAlert('Tên không hợp lệ', 'Vui lòng nhập họ và tên thật, không phải username.');
        return;
      }
      
      // Check if name seems too short
      if (firstName.trim().length < 3 && lastName.trim().length < 3) {
        showAlert('Tên quá ngắn', 'Vui lòng nhập đầy đủ họ và tên thật của bạn.');
        return;
      }
    }
    if (step === 3) {
      if (!birthDate) {
        showAlert('Chưa chọn ngày sinh', 'Vui lòng chọn ngày sinh của bạn.');
        return;
      }
      
      // Validate birth date - cannot be in future
      const selectedDate = new Date(birthDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (selectedDate > today) {
        showAlert('Ngày sinh không hợp lệ', 'Ngày sinh không được là ngày trong tương lai.');
        return;
      }
      
      // Check if age is reasonable (at least 13 years old)
      const age = today.getFullYear() - selectedDate.getFullYear();
      const monthDiff = today.getMonth() - selectedDate.getMonth();
      const dayDiff = today.getDate() - selectedDate.getDate();
      
      let actualAge = age;
      if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
        actualAge = age - 1;
      }
      
      if (actualAge < 13) {
        showAlert('Tuổi không đủ', 'Bạn phải ít nhất 13 tuổi để đăng ký tài khoản.');
        return;
      }
      
      if (actualAge > 120) {
        showAlert('Ngày sinh không hợp lệ', 'Vui lòng kiểm tra lại ngày sinh của bạn.');
        return;
      }
    }
    if (step === 4) {
      if (!gender) {
        showAlert('Chưa chọn giới tính', 'Vui lòng chọn giới tính của bạn.');
        return;
      }
    }
    if (step === 5) {
      // Step 5: Phone (only if registerMethod is 'phone')
      if (registerMethod === 'phone') {
        if (!phone.trim()) {
          showAlert('Chưa nhập số điện thoại', 'Vui lòng nhập số điện thoại của bạn.');
          return;
        }
        if (!phone.startsWith('+84') && !phone.startsWith('0')) {
          showAlert('Số điện thoại không hợp lệ', 'Số điện thoại phải bắt đầu bằng 0 hoặc +84.');
          return;
        }
        if (phone.replace(/\D/g, '').length < 10) {
          showAlert('Số điện thoại không hợp lệ', 'Số điện thoại phải có ít nhất 10 số. Vui lòng kiểm tra lại.');
          return;
        }
      } else {
        // Skip to email step
        setStep(6);
        return;
      }
    }
    if (step === 6) {
      // Step 6: Email (if registerMethod is 'email') or Password (if registerMethod is 'phone')
      if (registerMethod === 'email') {
        if (!email.trim()) {
          showAlert('Chưa nhập email', 'Vui lòng nhập email của bạn.');
          return;
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
          showAlert('Email không hợp lệ', 'Email không đúng định dạng. Vui lòng kiểm tra lại.');
          return;
        }
      } else {
        // Phone method - validate password and register
        if (!password.trim()) {
          showAlert('Chưa nhập mật khẩu', 'Vui lòng nhập mật khẩu của bạn.');
          return;
        }
        if (password.length < 6) {
          showAlert('Mật khẩu quá ngắn', 'Mật khẩu phải có ít nhất 6 ký tự.');
          return;
        }
        if (password.length > 50) {
          showAlert('Mật khẩu quá dài', 'Mật khẩu không được vượt quá 50 ký tự.');
          return;
        }
        if (!confirmPassword.trim()) {
          showAlert('Chưa xác nhận mật khẩu', 'Vui lòng xác nhận mật khẩu của bạn.');
          return;
        }
        if (password !== confirmPassword) {
          showAlert('Mật khẩu không khớp', 'Hai mật khẩu không giống nhau. Vui lòng nhập lại.');
          return;
        }
        // Trigger registration
        await handleRegister();
        return;
      }
    }
    if (step === 7) {
      // Step 7: Password (only if came from email step)
      if (!password.trim()) {
        showAlert('Chưa nhập mật khẩu', 'Vui lòng nhập mật khẩu của bạn.');
        return;
      }
      if (password.length < 6) {
        showAlert('Mật khẩu quá ngắn', 'Mật khẩu phải có ít nhất 6 ký tự.');
        return;
      }
      if (password.length > 50) {
        showAlert('Mật khẩu quá dài', 'Mật khẩu không được vượt quá 50 ký tự.');
        return;
      }
      if (!confirmPassword.trim()) {
        showAlert('Chưa xác nhận mật khẩu', 'Vui lòng xác nhận mật khẩu của bạn.');
        return;
      }
      if (password !== confirmPassword) {
        showAlert('Mật khẩu không khớp', 'Hai mật khẩu không giống nhau. Vui lòng nhập lại.');
        return;
      }
      // Trigger registration
      await handleRegister();
      return;
    }
    setStep(step + 1);
  };

  const handleRegister = async () => {
    setLoading(true);
    try {
      // Send verification code based on registration method
      if (registerMethod === 'email' && email) {
        await api.post('/auth/send-verification', { email });
        setResendCountdown(20);
        setOtpStep(true);
        setLoading(false);
      } else if (registerMethod === 'phone' && phone) {
        await api.post('/auth/send-verification', { phone });
        setResendCountdown(20);
        setOtpStep(true);
        setLoading(false);
      } else {
        showAlert('Thiếu thông tin', 'Vui lòng điền đầy đủ thông tin.');
        setLoading(false);
        return;
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || '';
      if (errorMessage.includes('email') || errorMessage.includes('Email')) {
        showAlert('Email đã tồn tại', 'Email này đã được sử dụng. Vui lòng dùng email khác.');
      } else if (errorMessage.includes('phone') || errorMessage.includes('số điện thoại')) {
        showAlert('Số điện thoại đã tồn tại', 'Số điện thoại này đã được sử dụng. Vui lòng dùng số khác.');
      } else if (errorMessage.includes('network') || errorMessage.includes('kết nối')) {
        showAlert('Không có kết nối', 'Không thể kết nối tới server. Vui lòng kiểm tra internet.');
      } else if (errorMessage) {
        showAlert('Đăng ký thất bại', errorMessage);
      } else {
        showAlert('Đăng ký thất bại', 'Gửi mã xác thực thất bại. Vui lòng thử lại.');
      }
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    if (!otp || otp.length !== 6) {
      showAlert('Mã xác thực không hợp lệ', 'Mã xác thực phải có đúng 6 số.');
      return;
    }
    
    setLoading(true);
    try {
      const verifyData = registerMethod === 'email' 
        ? { email, code: otp }
        : { phone, code: otp };
        
      await api.post('/auth/verify-code', verifyData);
      const res = await api.post('/auth/register', {
        fullName: `${firstName} ${lastName}`,
        email: registerMethod === 'email' ? email : '',
        phone: registerMethod === 'phone' ? phone : '',
        password,
        birthDate,
        gender
      });
      if (res.data?.token && res.data?.user) {
        login(res.data.user, res.data.token);
        // CRITICAL: Use replace instead of push to prevent back navigation to register
        navigate('/', { replace: true });
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || '';
      console.log('Registration error:', errorMessage);
      if (errorMessage.includes('code') || errorMessage.includes('mã')) {
        showAlert('Mã không đúng', 'Mã xác thực không đúng. Vui lòng nhập lại.');
      } else if (errorMessage.includes('expired') || errorMessage.includes('hết hạn')) {
        showAlert('Mã đã hết hạn', 'Mã xác thực đã hết hạn. Vui lòng gửi lại mã.');
      } else if (errorMessage.includes('email') || errorMessage.includes('Email') || errorMessage.toLowerCase().includes('already exists')) {
        showAlert('Email đã tồn tại', 'Email này đã được sử dụng. Vui lòng dùng email khác hoặc đăng nhập.');
      } else if (errorMessage.includes('phone') || errorMessage.includes('số điện thoại')) {
        showAlert('Số điện thoại đã tồn tại', 'Số điện thoại này đã được sử dụng. Vui lòng dùng số khác.');
      } else if (errorMessage) {
        showAlert('Đăng ký thất bại', errorMessage);
      } else {
        showAlert('Đăng ký thất bại', 'Xác thực thất bại. Vui lòng thử lại.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container $isDark={isDarkMode}>
      {step === 1 && (
        <>
          <StepHeader $isDark={isDarkMode}>
            <BackBtn onClick={() => navigate(-1)} $isDark={isDarkMode}>
              <FiChevronLeft size={24} />
            </BackBtn>
          </StepHeader>
          <WelcomeScreen $isDark={isDarkMode}>
            <Illustration>
              <PhotoFrame>
                <PortraitIcon>
                  <FiUsers size={50} />
                </PortraitIcon>
              </PhotoFrame>
              <HeartIcon>❤️</HeartIcon>
              <CakeIcon>🎂</CakeIcon>
              <ThumbsUpIcon>👍</ThumbsUpIcon>
              <LandscapeFrame>🌅</LandscapeFrame>
            </Illustration>
            <Title $isDark={isDarkMode}>Tham gia Zyea+</Title>
            <Description $isDark={isDarkMode}>
              Hãy tạo tài khoản để kết nối với bạn bè, người thân và cộng đồng có chung sở thích.
            </Description>
            <PrimaryButton onClick={() => setStep(2)}>Tạo tài khoản mới</PrimaryButton>
            <SecondaryButton $isDark={isDarkMode} onClick={() => navigate('/m/login')}>
              Tìm tài khoản của tôi
            </SecondaryButton>
          </WelcomeScreen>
        </>
      )}

      {step === 2 && (
        <>
          <StepHeader $isDark={isDarkMode}>
            <BackBtn onClick={() => setStep(1)} $isDark={isDarkMode}>
              <FiChevronLeft size={24} />
            </BackBtn>
            <div>Bạn tên gì?</div>
          </StepHeader>
          <Form onSubmit={(e) => { e.preventDefault(); handleNext(); }}>
            <Description $isDark={isDarkMode}>Nhập tên bạn sử dụng trong đời thực.</Description>
            <InputGroup>
              <Input
                $isDark={isDarkMode}
                placeholder="Họ"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
              />
              <Input
                $isDark={isDarkMode}
                placeholder="Tên"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
              />
            </InputGroup>
            <Button type="submit" disabled={loading}>Tiếp</Button>
            <FooterNote $isDark={isDarkMode}>
              <span onClick={() => navigate('/m/login')}>Tìm tài khoản của tôi</span>
            </FooterNote>
          </Form>
        </>
      )}

      {step === 3 && (
        <>
          <StepHeader $isDark={isDarkMode}>
            <BackBtn onClick={() => setStep(2)} $isDark={isDarkMode}>
              <FiChevronLeft size={24} />
            </BackBtn>
            <div>Ngày sinh của bạn là khi nào?</div>
          </StepHeader>
          <Form onSubmit={(e) => { e.preventDefault(); handleNext(); }}>
            <Description $isDark={isDarkMode}>
              Chọn ngày sinh của bạn. Bạn luôn có thể đặt thông tin này ở chế độ riêng tư vào lúc khác.{' '}
              <TermsLink onClick={(e) => openTerms(e, 'usage')}>Tại sao tôi cần cung cấp ngày sinh của mình?</TermsLink>
            </Description>
            <Input
              $isDark={isDarkMode}
              type="date"
              value={birthDate}
              onChange={(e) => setBirthDate(e.target.value)}
              max={new Date().toISOString().split('T')[0]}
            />
            <Button type="submit" disabled={loading}>Tiếp</Button>
            <FooterNote $isDark={isDarkMode}>
              <span onClick={() => navigate('/m/login')}>Tìm tài khoản của tôi</span>
            </FooterNote>
          </Form>
        </>
      )}

      {step === 4 && (
        <>
          <StepHeader $isDark={isDarkMode}>
            <BackBtn onClick={() => setStep(3)} $isDark={isDarkMode}>
              <FiChevronLeft size={24} />
            </BackBtn>
            <div>Giới tính của bạn là gì?</div>
          </StepHeader>
          <Form onSubmit={(e) => { e.preventDefault(); handleNext(); }}>
            <Description $isDark={isDarkMode}>
              Bạn có thể thay đổi người nhìn thấy giới tính của mình trên trang cá nhân vào lúc khác.
            </Description>
            <RadioGroup>
              <RadioOption $isDark={isDarkMode}>
                <input
                  type="radio"
                  name="gender"
                  value="female"
                  checked={gender === 'female'}
                  onChange={(e) => setGender(e.target.value)}
                />
                <RadioLabel $isDark={isDarkMode}>Nữ</RadioLabel>
              </RadioOption>
              <RadioOption $isDark={isDarkMode}>
                <input
                  type="radio"
                  name="gender"
                  value="male"
                  checked={gender === 'male'}
                  onChange={(e) => setGender(e.target.value)}
                />
                <RadioLabel $isDark={isDarkMode}>Nam</RadioLabel>
              </RadioOption>
              <RadioOption $isDark={isDarkMode}>
                <input
                  type="radio"
                  name="gender"
                  value="other"
                  checked={gender === 'other'}
                  onChange={(e) => setGender(e.target.value)}
                />
                <div style={{ flex: 1 }}>
                  <RadioLabel $isDark={isDarkMode}>Lựa chọn khác</RadioLabel>
                  <RadioSubtext $isDark={isDarkMode}>
                    Chọn Lựa chọn khác nếu bạn thuộc giới tính khác hoặc không muốn tiết lộ.
                  </RadioSubtext>
                </div>
              </RadioOption>
            </RadioGroup>
            <Button type="submit" disabled={loading}>Tiếp</Button>
            <FooterNote $isDark={isDarkMode}>
              <span onClick={() => navigate('/m/login')}>Tìm tài khoản của tôi</span>
            </FooterNote>
          </Form>
        </>
      )}

      {step === 5 && registerMethod === 'phone' && (
        <>
          <StepHeader $isDark={isDarkMode}>
            <BackBtn onClick={() => setStep(4)} $isDark={isDarkMode}>
              <FiChevronLeft size={24} />
            </BackBtn>
            <div>Số di động của bạn là gì?</div>
          </StepHeader>
          <Form onSubmit={(e) => { e.preventDefault(); handleNext(); }}>
            <Description $isDark={isDarkMode}>
              Nhập số di động có thể dùng để liên hệ với bạn. Sẽ không ai nhìn thấy thông tin này trên trang cá nhân của bạn.
            </Description>
            <Input
              $isDark={isDarkMode}
              type="tel"
              placeholder="Số di động"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
            <Description $isDark={isDarkMode} style={{ fontSize: '13px', marginTop: '4px' }}>
              Chúng tôi có thể gửi thông báo cho bạn qua WhatsApp và SMS.{' '}
              <TermsLink onClick={(e) => openTerms(e, 'usage')}>Tìm hiểu thêm</TermsLink>
            </Description>
            <Button type="submit" disabled={loading}>Tiếp</Button>
            <SecondaryButton $isDark={isDarkMode} onClick={() => {
              setRegisterMethod('email');
              setStep(6);
            }}>
              Đăng ký bằng email
            </SecondaryButton>
            <FooterNote $isDark={isDarkMode}>
              <span onClick={() => navigate('/m/login')}>Tìm tài khoản của tôi</span>
            </FooterNote>
          </Form>
        </>
      )}

      {step === 6 && registerMethod === 'email' && (
        <>
          <StepHeader $isDark={isDarkMode}>
            <BackBtn onClick={() => setStep(4)} $isDark={isDarkMode}>
              <FiChevronLeft size={24} />
            </BackBtn>
            <div>Nhập email của bạn</div>
          </StepHeader>
          <Form onSubmit={(e) => { e.preventDefault(); handleNext(); }}>
            <Description $isDark={isDarkMode}>
              Nhập email để chúng tôi có thể liên hệ với bạn và xác thực tài khoản.
            </Description>
            <Input
              $isDark={isDarkMode}
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <Button type="submit" disabled={loading}>Tiếp</Button>
            <FooterNote $isDark={isDarkMode}>
              <span onClick={() => navigate('/m/login')}>Tìm tài khoản của tôi</span>
            </FooterNote>
          </Form>
        </>
      )}

      {step === 6 && registerMethod === 'phone' && !otpStep && (
        <>
          <StepHeader $isDark={isDarkMode}>
            <BackBtn onClick={() => setStep(5)} $isDark={isDarkMode}>
              <FiChevronLeft size={24} />
            </BackBtn>
            <div>Tạo mật khẩu</div>
          </StepHeader>
          <Form onSubmit={(e) => { e.preventDefault(); handleNext(); }}>
            <Description $isDark={isDarkMode}>
              Mật khẩu phải có ít nhất 6 ký tự. Nên chọn mật khẩu khó đoán để bảo mật tài khoản của bạn.
            </Description>
        <PasswordRow>
              <Input
                $isDark={isDarkMode}
                type={showPassword ? 'text' : 'password'}
                placeholder="Mật khẩu"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <EyeBtn type="button" onClick={() => setShowPassword(!showPassword)}>
                {showPassword ? <FiEyeOff /> : <FiEye />}
          </EyeBtn>
        </PasswordRow>
        <PasswordRow>
              <Input
                $isDark={isDarkMode}
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="Nhập lại mật khẩu"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
              <EyeBtn type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
                {showConfirmPassword ? <FiEyeOff /> : <FiEye />}
          </EyeBtn>
        </PasswordRow>
            <Button type="submit" disabled={loading}>Tiếp</Button>
            <FooterNote $isDark={isDarkMode}>
              <span onClick={() => navigate('/m/login')}>Tìm tài khoản của tôi</span>
            </FooterNote>
          </Form>
        </>
      )}

      {step === 7 && !otpStep && (
        <>
          <StepHeader $isDark={isDarkMode}>
            <BackBtn onClick={() => setStep(6)} $isDark={isDarkMode}>
              <FiChevronLeft size={24} />
            </BackBtn>
            <div>Tạo mật khẩu</div>
          </StepHeader>
          <Form onSubmit={(e) => { e.preventDefault(); handleNext(); }}>
            <Description $isDark={isDarkMode}>
              Mật khẩu phải có ít nhất 6 ký tự. Nên chọn mật khẩu khó đoán để bảo mật tài khoản của bạn.
            </Description>
        <PasswordRow>
              <Input
                $isDark={isDarkMode}
                type={showPassword ? 'text' : 'password'}
                placeholder="Mật khẩu"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <EyeBtn type="button" onClick={() => setShowPassword(!showPassword)}>
                {showPassword ? <FiEyeOff /> : <FiEye />}
          </EyeBtn>
        </PasswordRow>
        <PasswordRow>
              <Input
                $isDark={isDarkMode}
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="Nhập lại mật khẩu"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
              <EyeBtn type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
                {showConfirmPassword ? <FiEyeOff /> : <FiEye />}
          </EyeBtn>
        </PasswordRow>
            <Button type="submit" disabled={loading}>Tiếp</Button>
            <FooterNote $isDark={isDarkMode}>
              <span onClick={() => navigate('/m/login')}>Tìm tài khoản của tôi</span>
            </FooterNote>
      </Form>
        </>
      )}

      {otpStep && (
        <>
          <StepHeader $isDark={isDarkMode}>
            <BackBtn onClick={() => setOtpStep(false)} $isDark={isDarkMode}>
              <FiChevronLeft size={24} />
            </BackBtn>
            <div>Xác thực mã</div>
          </StepHeader>
          <Form onSubmit={(e) => { 
            e.preventDefault(); 
            if (!otp || otp.length !== 6) {
              toast.error('Mã xác thực phải có đúng 6 số');
              return;
            }
            handleVerify(); 
          }}>
            <Description $isDark={isDarkMode}>
              Nhập mã xác thực đã gửi tới email: <b>{email}</b>
            </Description>
            <Input
              $isDark={isDarkMode}
              type="text"
              inputMode="numeric"
              placeholder="Nhập mã 6 số"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
              maxLength={6}
            />
            {otp.length > 0 && otp.length < 6 && (
              <div style={{color: '#e53935', fontSize: 12, marginTop: 4}}>
                Mã xác thực phải có đúng 6 số
              </div>
            )}
            <Button type="submit" disabled={loading || otp.length !== 6}>
              {loading ? 'Đang xác thực...' : 'Xác thực'}
            </Button>
            <FooterNote $isDark={isDarkMode}>
              <ResendLink 
                $isDark={isDarkMode}
                className={resendCountdown > 0 ? 'disabled' : ''}
                onClick={async () => {
                  if (resendCountdown > 0) return;
                  try {
                    if (registerMethod === 'email' && email) {
                      await api.post('/auth/send-verification', { email });
                    } else if (registerMethod === 'phone' && phone) {
                      await api.post('/auth/send-verification', { phone });
                    }
                    setResendCountdown(20);
                    toast.info('Đã gửi lại mã');
                  } catch (_) {}
                }}
              >
                {resendCountdown > 0 ? `Gửi lại mã (${resendCountdown}s)` : 'Gửi lại mã'}
              </ResendLink>
            </FooterNote>
            <FooterNote $isDark={isDarkMode}>
              <span onClick={() => navigate('/m/login')}>Tìm tài khoản của tôi</span>
            </FooterNote>
      </Form>
        </>
      )}

      {alertData.show && (
        <AlertOverlay onClick={closeAlert}>
          <AlertDialog onClick={(e) => e.stopPropagation()}>
            <AlertTitle>{alertData.title}</AlertTitle>
            <AlertMessage>{alertData.message}</AlertMessage>
            <AlertButtonContainer>
              <AlertButton $isPrimary onClick={() => {
                if (alertData.onConfirm) alertData.onConfirm();
                closeAlert();
              }}>
                OK
              </AlertButton>
            </AlertButtonContainer>
          </AlertDialog>
        </AlertOverlay>
      )}
    </Container>
  );
};

export default MobileRegister;
