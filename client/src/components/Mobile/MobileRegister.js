import React, { useState, useContext } from 'react';
import styled from 'styled-components';
import { FiChevronLeft, FiEye, FiEyeOff } from 'react-icons/fi';
import api from '../../utils/api';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import AuthContext from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';

const Container = styled.div`
  min-height: 100dvh; 
  background: ${props => props.$isDark ? '#2d2d2d' : '#fff'}; 
  width: 100%; box-sizing: border-box;
  padding-top: env(safe-area-inset-top); padding-bottom: env(safe-area-inset-bottom);
  transition: background 0.3s ease;
  @media (min-width: 769px) { max-width: 420px; margin: 0 auto; border-left: 1px solid #eee; border-right: 1px solid #eee; }
`;

const Header = styled.div`
  display: flex; align-items: center; gap: 8px; padding: 12px; font-weight: 600;
  font-size: 18px;
  color: ${props => props.$isDark ? '#fff' : '#2b2b2b'};
`;
const BackBtn = styled.button`border:none; background:transparent; padding:6px; display:flex; align-items:center;`;
const Form = styled.form`padding:12px;`;
const Input = styled.input`
  width:100%; 
  border:1px solid ${props => props.$isDark ? '#444' : '#e6e6e6'}; 
  border-radius:12px; padding:14px 12px; font-size:16px; margin:8px 0;
  background: ${props => props.$isDark ? '#1a1a1a' : '#fff'};
  color: ${props => props.$isDark ? '#fff' : '#000'};

  &::placeholder {
    color: ${props => props.$isDark ? '#777' : '#999'};
  }
`;
const Button = styled.button`
  width:100%; background:#0a66ff; color:#fff; border:none; border-radius:28px; padding:14px 16px; font-weight:700; margin-top:8px;
`;

const PasswordRow = styled.div`
  position: relative; display: flex; align-items: center;
`;
const EyeBtn = styled.button`
  position: absolute; right: 10px; top: 50%; transform: translateY(-50%);
  border: none; background: transparent; color: #666;
`;

const CheckboxRow = styled.label`
  display:flex; align-items:center; gap:6px; 
  color: ${props => props.$isDark ? '#aaa' : '#444'}; 
  font-size:14px; margin:10px 0;
  input[type='checkbox'] { width: 12px; height: 12px; transform: scale(0.85); transform-origin:left center; accent-color: #0a66ff; }
`;

const MobileRegister = () => {
  const navigate = useNavigate();
  const { login } = useContext(AuthContext);
  const { isDarkMode } = useTheme();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [showPw2, setShowPw2] = useState(false);
  const [loading, setLoading] = useState(false);
  const [otpStep, setOtpStep] = useState(false);
  const [otp, setOtp] = useState('');
  const [agreeTos, setAgreeTos] = useState(false);
  const [agreeTouched, setAgreeTouched] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (password.length < 6) {
        toast.error('Mật khẩu tối thiểu 6 ký tự');
        setLoading(false);
        return;
      }
      if (password !== confirmPassword) {
        toast.error('Mật khẩu nhập lại không khớp');
        setLoading(false);
        return;
      }
      if (!agreeTos) {
        toast.error('Vui lòng đồng ý điều khoản');
        setAgreeTouched(true);
        setLoading(false);
        return;
      }
      // Send verification code before creating account
      await api.post('/auth/send-verification', { email });
      toast.info('Đã gửi mã xác thực tới email. Vui lòng nhập mã để tiếp tục.');
      setOtpStep(true);
      setLoading(false);
      return;
    } catch (err) {
      toast.error(err.response?.data?.message || 'Tạo tài khoản thất bại');
    } finally {
      setLoading(false);
    }
  };

  const onVerify = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/auth/verify-code', { email, code: otp });
      // After verification, create the account
      const res = await api.post('/auth/register', { fullName, email, password });
      toast.success('Tạo tài khoản thành công');
      if (res.data?.token && res.data?.user) {
        login(res.data.user, res.data.token);
        navigate('/');
      } else {
        navigate('/m/login');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Xác thực thất bại');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container $isDark={isDarkMode}>
      <Header $isDark={isDarkMode}>
        <BackBtn onClick={() => navigate(-1)}><FiChevronLeft size={20} /></BackBtn>
        Tạo tài khoản
      </Header>
      {!otpStep ? (
      <Form onSubmit={onSubmit}>
        <Input $isDark={isDarkMode} placeholder="Họ và tên" value={fullName} onChange={(e)=>setFullName(e.target.value)} />
        <Input $isDark={isDarkMode} type="email" placeholder="Email" value={email} onChange={(e)=>setEmail(e.target.value)} />
        <PasswordRow>
          <Input $isDark={isDarkMode} type={showPw ? 'text' : 'password'} placeholder="Mật khẩu" value={password} onChange={(e)=>setPassword(e.target.value)} />
          <EyeBtn type="button" onClick={()=>setShowPw(v=>!v)} aria-label="toggle password">
            {showPw ? <FiEyeOff /> : <FiEye />}
          </EyeBtn>
        </PasswordRow>
        <PasswordRow>
          <Input $isDark={isDarkMode} type={showPw2 ? 'text' : 'password'} placeholder="Nhập lại mật khẩu" value={confirmPassword} onChange={(e)=>setConfirmPassword(e.target.value)} />
          <EyeBtn type="button" onClick={()=>setShowPw2(v=>!v)} aria-label="toggle confirm password">
            {showPw2 ? <FiEyeOff /> : <FiEye />}
          </EyeBtn>
        </PasswordRow>
        <CheckboxRow $isDark={isDarkMode}>
          <input type="checkbox" checked={agreeTos} onChange={(e)=>{ setAgreeTos(e.target.checked); setAgreeTouched(true); }} />
          Tôi đồng ý với các điều khoản sử dụng Zyea+
        </CheckboxRow>
        {agreeTouched && !agreeTos && (
          <div style={{ color:'#e53935', fontSize:12, marginTop:2 }}>Bạn cần đồng ý điều khoản để tiếp tục</div>
        )}
        <Button type="submit" disabled={loading}>{loading ? 'Đang tạo...' : 'Đăng ký'}</Button>
        <div style={{textAlign:'center', marginTop:10, color: isDarkMode ? '#aaa' : '#333'}}>Đã có tài khoản? <span style={{color:'#0a66ff'}} onClick={()=>navigate('/m/login')}>Đăng nhập</span></div>
      </Form>
      ) : (
      <Form onSubmit={onVerify}>
        <div style={{margin:'8px 0', color: isDarkMode ? '#aaa' : '#333'}}>Nhập mã xác thực đã gửi tới email: <b>{email}</b></div>
        <Input $isDark={isDarkMode} inputMode="numeric" placeholder="Nhập mã 6 số" value={otp} onChange={(e)=>setOtp(e.target.value.replace(/\D/g,'').slice(0,6))} />
        <Button type="submit" disabled={loading || otp.length !== 6}>{loading ? 'Đang xác thực...' : 'Xác thực'}</Button>
        <div style={{textAlign:'center', marginTop:10}}><span style={{color:'#0a66ff'}} onClick={async ()=>{ try { await api.post('/auth/send-verification', { email }); toast.info('Đã gửi lại mã'); } catch(_){} }}>Gửi lại mã</span></div>
      </Form>
      )}
    </Container>
  );
};

export default MobileRegister;


