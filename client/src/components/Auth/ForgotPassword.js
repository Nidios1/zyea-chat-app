import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import styled from 'styled-components';
import { toast } from 'react-toastify';
import { FiMail, FiArrowLeft } from 'react-icons/fi';
import api from '../../utils/api';

const Container = styled.div`
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 1rem;

  @media (max-width: 768px) {
    padding: 0.5rem;
  }
`;

const FormContainer = styled.div`
  background: white;
  padding: 2.5rem;
  border-radius: 20px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
  width: 100%;
  max-width: 400px;
  position: relative;

  @media (max-width: 768px) {
    padding: 2rem;
    border-radius: 16px;
  }

  @media (max-width: 480px) {
    padding: 1.5rem;
    border-radius: 12px;
  }
`;

const BackButton = styled(Link)`
  position: absolute;
  top: 1rem;
  left: 1rem;
  color: #666;
  font-size: 1.2rem;
  text-decoration: none;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: color 0.2s ease;

  &:hover {
    color: #667eea;
  }
`;

const Logo = styled.div`
  text-align: center;
  margin-bottom: 2rem;

  .logo-icon {
    width: 60px;
    height: 60px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border-radius: 13px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 2rem;
    font-weight: bold;
    color: white;
    margin: 0 auto 1rem;
    box-shadow: 0 8px 20px rgba(102, 126, 234, 0.3);
  }

  h1 {
    color: #333;
    font-size: 2rem;
    font-weight: 700;
    margin: 0 0 0.5rem 0;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  p {
    color: #666;
    font-size: 0.9rem;
    margin: 0;
  }
`;

const Title = styled.h2`
  text-align: center;
  color: #333;
  font-size: 1.5rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
`;

const Subtitle = styled.p`
  text-align: center;
  color: #666;
  font-size: 0.9rem;
  margin-bottom: 2rem;
  line-height: 1.5;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`;

const InputGroup = styled.div`
  position: relative;
`;

const Input = styled.input`
  width: 100%;
  padding: 1rem 1rem 1rem 3rem;
  border: 2px solid #e1e5e9;
  border-radius: 12px;
  font-size: 1rem;
  transition: all 0.3s ease;
  background: #f8f9fa;

  &:focus {
    outline: none;
    border-color: #667eea;
    background: white;
    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
  }

  &::placeholder {
    color: #999;
  }
`;

const InputIcon = styled.div`
  position: absolute;
  left: 1rem;
  top: 50%;
  transform: translateY(-50%);
  color: #999;
  font-size: 1.2rem;
`;

const Button = styled.button`
  width: 100%;
  padding: 1rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;

  &:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(102, 126, 234, 0.3);
  }

  &:active:not(:disabled) {
    transform: translateY(0);
  }

  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
    transform: none;
  }

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
    transition: left 0.5s;
  }

  &:hover:not(:disabled)::before {
    left: 100%;
  }
`;

const LinkText = styled.p`
  text-align: center;
  margin-top: 1rem;
  color: #666;
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

const SuccessMessage = styled.div`
  background: #d4edda;
  border: 1px solid #c3e6cb;
  color: #155724;
  padding: 1rem;
  border-radius: 8px;
  margin-bottom: 1rem;
  text-align: center;
  font-size: 0.9rem;
`;

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  useEffect(() => {
    document.title = 'Zyea+ - Quên mật khẩu';
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await api.post('/auth/forgot-password', { email });
      setEmailSent(true);
      toast.success('Email khôi phục mật khẩu đã được gửi!');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Không thể gửi email khôi phục');
    } finally {
      setLoading(false);
    }
  };

  if (emailSent) {
    return (
      <Container>
        <FormContainer>
          <BackButton to="/login">
            <FiArrowLeft />
            Quay lại
          </BackButton>
          
          <Logo>
            <div className="logo-icon"><img src={`${process.env.PUBLIC_URL || ''}/Zyea.jpg?v=2`} alt="Zyea+" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 'inherit' }} /></div>
            <h1>Zyea+</h1>
            <p>Kết nối mọi người</p>
          </Logo>

          <SuccessMessage>
            <strong>Email đã được gửi!</strong><br />
            Vui lòng kiểm tra hộp thư của bạn và làm theo hướng dẫn để đặt lại mật khẩu.
          </SuccessMessage>

          <LinkText>
            Không nhận được email? <a href="#" onClick={(e) => { e.preventDefault(); setEmailSent(false); }}>Gửi lại</a>
          </LinkText>
        </FormContainer>
      </Container>
    );
  }

  return (
    <Container>
      <FormContainer>
        <BackButton to="/login">
          <FiArrowLeft />
          Quay lại
        </BackButton>
        
        <Logo>
          <div className="logo-icon"><img src={`${process.env.PUBLIC_URL || ''}/Zyea.jpg?v=2`} alt="Zyea+" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 'inherit' }} /></div>
          <h1>Zyea+</h1>
          <p>Kết nối mọi người</p>
        </Logo>

        <Title>Quên mật khẩu?</Title>
        <Subtitle>
          Nhập email của bạn và chúng tôi sẽ gửi cho bạn liên kết để đặt lại mật khẩu.
        </Subtitle>
        
        <Form onSubmit={handleSubmit}>
          <InputGroup>
            <InputIcon>
              <FiMail />
            </InputIcon>
            <Input
              type="email"
              placeholder="Nhập email của bạn"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </InputGroup>
          
          <Button type="submit" disabled={loading}>
            {loading ? 'Đang gửi...' : 'Gửi email khôi phục'}
          </Button>
        </Form>
        
        <LinkText>
          Nhớ mật khẩu? <Link to="/login">Đăng nhập</Link>
        </LinkText>
      </FormContainer>
    </Container>
  );
};

export default ForgotPassword;
