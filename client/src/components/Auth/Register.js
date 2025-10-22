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
  padding: 1rem;
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
  padding: 2rem;
  border-radius: 12px;
  box-shadow: ${props => props.$isDark 
    ? '0 8px 32px rgba(0, 0, 0, 0.5)' 
    : '0 8px 32px rgba(0, 0, 0, 0.1)'};
  width: 100%;
  max-width: 450px;
  position: relative;
  z-index: 1;
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
  gap: 1.2rem;

  @media (max-width: 768px) {
    gap: 1rem;
  }

  @media (max-width: 480px) {
    gap: 0.875rem;
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
  margin-top: 1.5rem;
  color: ${props => props.$isDark ? '#aaa' : '#666'};
  font-size: 14px;

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

const SocialLogin = styled.div`
  margin-top: 2rem;
  text-align: center;
  
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

const Register = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullName: '',
    phone: ''
  });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useContext(AuthContext);
  const { isDarkMode } = useTheme();

  useEffect(() => {
    document.title = 'Zyea+ - Đăng ký tài khoản';
  }, []);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await api.post('/auth/register', formData);
      login(response.data.user, response.data.token);
      toast.success('Đăng ký thành công!');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Đăng ký thất bại');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container $isDark={isDarkMode}>
      <FormContainer $isDark={isDarkMode}>
        <Logo $isDark={isDarkMode}>
          <div className="logo-icon"><img src={`${process.env.PUBLIC_URL || ''}/Zyea.jpg?v=2`} alt="Zyea+" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 'inherit' }} /></div>
          <h1>Zyea+</h1>
          <p>Tạo tài khoản mới</p>
        </Logo>
        
        <Form onSubmit={handleSubmit}>
          <InputGroup>
            <Input
              $isDark={isDarkMode}
              type="email"
              name="email"
              placeholder="Email"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </InputGroup>
          
          <PasswordContainer>
            <PasswordInput
              $isDark={isDarkMode}
              type={showPassword ? "text" : "password"}
              name="password"
              placeholder="Mật khẩu"
              value={formData.password}
              onChange={handleChange}
              required
            />
            <EyeIcon
              $isDark={isDarkMode}
              type="button"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <FiEyeOff /> : <FiEye />}
            </EyeIcon>
          </PasswordContainer>
          
          <InputGroup>
            <Input
              $isDark={isDarkMode}
              type="text"
              name="fullName"
              placeholder="Họ và tên"
              value={formData.fullName}
              onChange={handleChange}
              required
            />
          </InputGroup>
          
          <InputGroup>
            <Input
              $isDark={isDarkMode}
              type="tel"
              name="phone"
              placeholder="Số điện thoại (tùy chọn)"
              value={formData.phone}
              onChange={handleChange}
            />
          </InputGroup>
          
          <Button type="submit" disabled={loading}>
            {loading ? 'Đang đăng ký...' : 'Đăng ký'}
          </Button>
        </Form>
        
        <LinkText $isDark={isDarkMode}>
          Đã có tài khoản? <Link to="/login">Đăng nhập ngay</Link>
        </LinkText>
        
        <SocialLogin $isDark={isDarkMode}>
          <p>Hoặc đăng ký với</p>
          <SocialButton $isDark={isDarkMode} type="button">
            <span>📱</span>
            Google
          </SocialButton>
        </SocialLogin>
      </FormContainer>
    </Container>
  );
};

export default Register;
