import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import styled from 'styled-components';
import AuthContext from '../../contexts/AuthContext';
import { getApiBaseUrl } from '../../utils/platformConfig';

const LoginContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #0084ff 0%, #00a651 100%);
  padding: 20px;
`;

const LoginCard = styled.div`
  background: white;
  border-radius: 16px;
  padding: 40px;
  width: 100%;
  max-width: 400px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
`;

const Logo = styled.h1`
  font-size: 48px;
  font-weight: bold;
  color: #0084ff;
  text-align: center;
  margin-bottom: 10px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
`;

const Subtitle = styled.p`
  text-align: center;
  color: #666;
  margin-bottom: 30px;
  font-size: 14px;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 15px;
`;

const Input = styled.input`
  padding: 12px 16px;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 15px;
  outline: none;
  transition: border-color 0.2s;

  &:focus {
    border-color: #0084ff;
  }
`;

const Button = styled.button`
  padding: 14px;
  background: #0084ff;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;

  &:hover {
    background: #0066cc;
  }

  &:disabled {
    background: #ccc;
    cursor: not-allowed;
  }
`;

const ErrorMessage = styled.div`
  color: #ff4444;
  font-size: 14px;
  text-align: center;
`;

const LinkText = styled.p`
  text-align: center;
  color: #666;
  font-size: 14px;
  margin-top: 20px;

  a {
    color: #0084ff;
    text-decoration: none;
    font-weight: 600;

    &:hover {
      text-decoration: underline;
    }
  }
`;

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const apiUrl = getApiBaseUrl();
      const response = await fetch(`${apiUrl}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Đăng nhập thất bại');
      }

      login(data.user, data.token);
      navigate('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <LoginContainer>
      <LoginCard>
        <Logo>facebook</Logo>
        <Subtitle>Kết nối với bạn bè và thế giới xung quanh bạn trên Zyea+</Subtitle>

        <Form onSubmit={handleSubmit}>
          <Input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <Input
            type="password"
            placeholder="Mật khẩu"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <Button type="submit" disabled={loading}>
            {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
          </Button>
        </Form>

        {error && <ErrorMessage>{error}</ErrorMessage>}

        <LinkText>
          Chưa có tài khoản? <Link to="/register">Đăng ký ngay</Link>
        </LinkText>
      </LoginCard>
    </LoginContainer>
  );
};

export default Login;

