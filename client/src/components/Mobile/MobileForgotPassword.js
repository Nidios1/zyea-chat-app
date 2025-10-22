import React, { useState } from 'react';
import styled from 'styled-components';
import { FiChevronLeft } from 'react-icons/fi';
import api from '../../utils/api';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';

const Container = styled.div`
  min-height: 100dvh; background: #fff; width: 100%; box-sizing: border-box;
  padding-top: env(safe-area-inset-top); padding-bottom: env(safe-area-inset-bottom);
  @media (min-width: 769px) { max-width: 420px; margin: 0 auto; border-left: 1px solid #eee; border-right: 1px solid #eee; }
`;
const Header = styled.div`
  display: flex; align-items: center; gap: 8px; padding: 12px; font-weight: 600;
  font-size: 18px;
  color: #2b2b2b;
`;
const BackBtn = styled.button`border:none; background:transparent; padding:6px; display:flex; align-items:center;`;
const Form = styled.form`padding:12px;`;
const Input = styled.input`
  width:100%; border:1px solid #e6e6e6; border-radius:12px; padding:14px 12px; font-size:16px; margin:8px 0;
`;
const Button = styled.button`
  width:100%; background:#0a66ff; color:#fff; border:none; border-radius:28px; padding:14px 16px; font-weight:700; margin-top:8px;
`;

const MobileForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email });
      toast.success('Đã gửi yêu cầu đặt lại mật khẩu. Vui lòng kiểm tra email.');
      navigate('/m/login');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gửi yêu cầu thất bại');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container>
      <Header>
        <BackBtn onClick={() => navigate(-1)}><FiChevronLeft size={20} /></BackBtn>
        Quên mật khẩu
      </Header>
      <Form onSubmit={onSubmit}>
        <Input type="email" placeholder="Email" value={email} onChange={(e)=>setEmail(e.target.value)} />
        <Button type="submit" disabled={loading || !email}>{loading ? 'Đang gửi...' : 'Gửi yêu cầu'}</Button>
      </Form>
    </Container>
  );
};

export default MobileForgotPassword;


