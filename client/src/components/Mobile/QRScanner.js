import React, { useEffect, useRef, useState, useContext } from 'react';
import styled from 'styled-components';
import { Html5Qrcode } from 'html5-qrcode';
import { FiX, FiAlertCircle } from 'react-icons/fi';
import { toast } from 'react-toastify';
import api from '../../utils/api';
import AuthContext from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.95);
  z-index: 9999;
  display: flex;
  flex-direction: column;
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  color: #fff;
  padding-top: calc(16px + env(safe-area-inset-top));
`;

const Title = styled.h2`
  margin: 0;
  font-size: 18px;
  font-weight: 600;
`;

const CloseBtn = styled.button`
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: #fff;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
`;

const ScannerContainer = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 16px;
  position: relative;
`;

const VideoContainer = styled.div`
  width: 100%;
  max-width: 400px;
  aspect-ratio: 1;
  border-radius: 16px;
  overflow: hidden;
  position: relative;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);

  #qr-reader {
    width: 100%;
    height: 100%;
  }

  #qr-reader__dashboard_section {
    display: none !important;
  }

  video {
    object-fit: cover;
    border-radius: 16px;
  }
`;

const ScanFrame = styled.div`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 70%;
  height: 70%;
  border: 3px solid #0a66ff;
  border-radius: 16px;
  box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.5);
  pointer-events: none;

  &::before, &::after {
    content: '';
    position: absolute;
    width: 20px;
    height: 20px;
    border: 3px solid #0a66ff;
  }

  &::before {
    top: -3px;
    left: -3px;
    border-right: none;
    border-bottom: none;
  }

  &::after {
    top: -3px;
    right: -3px;
    border-left: none;
    border-bottom: none;
  }
`;

const ScanFrameBottom = styled.div`
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 20px;

  &::before, &::after {
    content: '';
    position: absolute;
    width: 20px;
    height: 20px;
    border: 3px solid #0a66ff;
    bottom: -3px;
  }

  &::before {
    left: -3px;
    border-right: none;
    border-top: none;
  }

  &::after {
    right: -3px;
    border-left: none;
    border-top: none;
  }
`;

const Instructions = styled.div`
  margin-top: 24px;
  text-align: center;
  color: #fff;
  padding: 0 16px;

  h3 {
    font-size: 16px;
    font-weight: 600;
    margin: 0 0 8px 0;
  }

  p {
    font-size: 14px;
    color: rgba(255, 255, 255, 0.7);
    margin: 0;
  }
`;

const ErrorBox = styled.div`
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: 12px;
  padding: 16px;
  margin: 16px;
  color: #ef4444;

  svg {
    flex-shrink: 0;
  }
`;

const ErrorTitle = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  font-weight: 600;
  margin-bottom: 12px;
  font-size: 16px;
`;

const ErrorMessage = styled.div`
  font-size: 14px;
  line-height: 1.6;
  color: #666;
  margin-bottom: 16px;
  white-space: pre-line;
`;

const ErrorSteps = styled.ol`
  margin: 0;
  padding-left: 20px;
  
  li {
    color: #666;
    font-size: 14px;
    line-height: 1.8;
    margin-bottom: 8px;
  }
`;

const RetryButton = styled.button`
  background: #0a66ff;
  color: #fff;
  border: none;
  border-radius: 8px;
  padding: 10px 20px;
  font-weight: 600;
  width: 100%;
  margin-top: 16px;
  cursor: pointer;
  
  &:hover {
    background: #0854cc;
  }
`;

const QRScanner = ({ onClose }) => {
  const videoRef = useRef(null);
  const scannerRef = useRef(null);
  const isScanningRef = useRef(false);
  const [error, setError] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    let scanner = null;
    let mounted = true;

    const initScanner = async () => {
      try {
        // Check if user is logged in
        if (!user) {
          setError('Bạn cần đăng nhập trước khi quét mã QR');
          return;
        }

        // Check if protocol is secure (except localhost and local IP)
        const hostname = window.location.hostname;
        const isLocalhost = hostname === 'localhost' || 
                           hostname === '127.0.0.1' ||
                           hostname === '[::1]';
        // Cho phép local IP (192.168.x.x, 10.x.x.x, 172.x.x.x) cho camera
        const isLocalIP = hostname.match(/^(192\.168\.|10\.|172\.(1[6-9]|2[0-9]|3[01])\.)/);
        const isSecure = window.location.protocol === 'https:';
        
        if (!isSecure && !isLocalhost && !isLocalIP) {
          setError(`⚠️ Camera chỉ hoạt động với HTTPS, localhost hoặc IP local.\n\nBạn đang truy cập: ${window.location.protocol}//${window.location.host}\n\nVui lòng truy cập qua IP WiFi: http://192.168.x.x:${window.location.port || '3000'}`);
          return;
        }

        // Check if getUserMedia is supported
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          setError('Trình duyệt của bạn không hỗ trợ camera API. Vui lòng cập nhật trình duyệt hoặc thử với Chrome/Safari mới nhất.');
          return;
        }

        scanner = new Html5Qrcode('qr-reader');
        scannerRef.current = scanner;

        const config = {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
          // Safari-specific improvements
          videoConstraints: {
            facingMode: 'environment',
            width: { ideal: 1280 },
            height: { ideal: 720 }
          }
        };

        // Try to start scanner with environment camera first
        try {
          await scanner.start(
            { facingMode: { exact: 'environment' } },
            config,
            onScanSuccess,
            onScanFailure
          );
        } catch (exactErr) {
          console.log('Exact environment camera not found, trying ideal...');
          // Fallback: try with ideal instead of exact
          await scanner.start(
            { facingMode: 'environment' },
            config,
            onScanSuccess,
            onScanFailure
          );
        }
        
        isScanningRef.current = true;
        console.log('✅ Scanner started successfully');
      } catch (err) {
        console.error('Scanner init error:', err);
        console.error('Error name:', err.name);
        console.error('Error message:', err.message);
        
        if (mounted) {
          if (err.message?.includes('NotAllowedError') || err.name === 'NotAllowedError') {
            setError('Vui lòng cho phép truy cập camera trong Safari:\n\n1. Nhấn "aA" bên trái thanh địa chỉ\n2. Chọn "Website Settings"\n3. Camera → chọn "Allow"\n4. Reload trang này');
          } else if (err.message?.includes('NotFoundError') || err.name === 'NotFoundError') {
            setError('Không tìm thấy camera. Nếu bạn đang dùng Safari trên iOS, hãy thử với camera sau thay vì camera trước.');
          } else if (err.message?.includes('NotReadableError') || err.name === 'NotReadableError') {
            setError('Camera đang được sử dụng bởi app khác. Vui lòng đóng các app khác (Zoom, FaceTime, etc.) và thử lại.');
          } else if (err.message?.includes('OverconstrainedError') || err.name === 'OverconstrainedError') {
            setError('Camera không hỗ trợ yêu cầu. Thử với thiết bị khác.');
          } else if (err.message?.includes('SecurityError') || err.name === 'SecurityError') {
            const hostname = window.location.hostname;
            const isLocalIP = hostname.match(/^(192\.168\.|10\.|172\.(1[6-9]|2[0-9]|3[01])\.)/);
            const suggestedUrl = isLocalIP 
              ? `http://${hostname}:${window.location.port || '3000'}`
              : `http://192.168.x.x:${window.location.port || '3000'}`;
            setError(`🔒 Lỗi bảo mật: Camera chỉ hoạt động với HTTPS, localhost hoặc IP local.\n\nĐang truy cập: ${window.location.protocol}//${window.location.host}\n\nVui lòng truy cập qua IP WiFi: ${suggestedUrl}`);
          } else {
            setError(`Không thể khởi động camera.\n\nLỗi: ${err.name || 'Unknown'}\nChi tiết: ${err.message || 'Không có thông tin'}\n\nVui lòng thử:\n1. Reload trang (swipe xuống)\n2. Đóng và mở lại Safari\n3. Khởi động lại điện thoại`);
          }
        }
      }
    };

    const onScanSuccess = async (decodedText) => {
      if (isProcessing) return;
      
      console.log('QR Code detected:', decodedText);
      
      // Check if it's a valid Zyea+ login QR
      if (!decodedText.startsWith('zyea-login-session:')) {
        toast.error('Mã QR không hợp lệ');
        return;
      }

      setIsProcessing(true);
      
      try {
        // Extract token from QR code
        const token = decodedText.replace('zyea-login-session:', '');
        
        // Send confirmation to backend
        const response = await api.post('/auth/qr-login-confirm', {
          qrToken: token,
          userId: user.id
        });

        if (response.data.success) {
          toast.success('Đăng nhập thành công trên PC!');
          
          // Stop scanner safely
          if (scannerRef.current && isScanningRef.current) {
            try {
              const state = await scannerRef.current.getState();
              if (state === 2) { // SCANNING state
                await scannerRef.current.stop();
                isScanningRef.current = false;
              }
            } catch (stopErr) {
              console.log('Scanner already stopped or error:', stopErr.message);
            }
          }
          
          setTimeout(() => {
            onClose();
          }, 1000);
        }
      } catch (err) {
        console.error('QR login error:', err);
        const errorMsg = err.response?.data?.message || 'Không thể đăng nhập. Vui lòng thử lại.';
        toast.error(errorMsg);
        setIsProcessing(false);
      }
    };

    const onScanFailure = (error) => {
      // Ignore scan failures (normal when no QR in view)
    };

    initScanner();

    return () => {
      mounted = false;
      if (scannerRef.current && isScanningRef.current) {
        isScanningRef.current = false;
        try {
          scannerRef.current.stop()
            .then(() => {
              console.log('Scanner stopped successfully');
              scannerRef.current = null;
            })
            .catch(err => {
              // Only log if it's not already stopped
              if (!err.message?.includes('not running')) {
                console.error('Error stopping scanner:', err);
              }
            });
        } catch (err) {
          console.error('Exception stopping scanner:', err);
        }
      }
    };
  }, [user, onClose]);

  const handleClose = async () => {
    if (scannerRef.current && isScanningRef.current) {
      try {
        // Check if scanner is actually running before trying to stop
        const state = await scannerRef.current.getState();
        if (state === 2) { // 2 = SCANNING state
          await scannerRef.current.stop();
          isScanningRef.current = false;
        }
      } catch (err) {
        // Ignore errors when stopping - scanner might already be stopped
        if (!err.message?.includes('not running')) {
          console.error('Error stopping scanner:', err);
        }
      } finally {
        scannerRef.current = null;
      }
    }
    onClose();
  };

  return (
    <Overlay>
      <Header>
        <Title>Quét mã QR</Title>
        <CloseBtn onClick={handleClose} aria-label="Đóng">
          <FiX size={20} />
        </CloseBtn>
      </Header>

      <ScannerContainer>
        {error ? (
          <ErrorBox>
            <ErrorTitle>
              <FiAlertCircle size={24} />
              <span>Không thể mở camera</span>
            </ErrorTitle>
            <ErrorMessage>{error}</ErrorMessage>
            
            <div style={{ fontSize: 14, fontWeight: 600, color: '#333', marginBottom: 8 }}>
              Hướng dẫn khắc phục:
            </div>
            
            <ErrorSteps>
              <li>Đóng các app khác đang sử dụng camera (Zoom, Skype, etc.)</li>
              <li>Kiểm tra cài đặt quyền camera của browser:
                <ul style={{ marginTop: 4 }}>
                  <li><strong>Chrome:</strong> Settings → Privacy → Camera</li>
                  <li><strong>Safari (iOS):</strong> Settings → Safari → Camera</li>
                  <li><strong>Android:</strong> Settings → Apps → [Browser] → Permissions</li>
                </ul>
              </li>
              <li>Reload trang và thử lại</li>
              <li>Nếu vẫn lỗi, thử với browser khác (Chrome, Firefox)</li>
            </ErrorSteps>
            
            <RetryButton onClick={() => window.location.reload()}>
              Reload và Thử Lại
            </RetryButton>
          </ErrorBox>
        ) : (
          <>
            <VideoContainer>
              <div id="qr-reader"></div>
              <ScanFrame>
                <ScanFrameBottom />
              </ScanFrame>
            </VideoContainer>

            <Instructions>
              <h3>Hướng dẫn</h3>
              <p>Di chuyển camera để căn chỉnh mã QR vào khung hình</p>
              <p style={{ marginTop: 8 }}>Mã QR sẽ được quét tự động</p>
            </Instructions>
          </>
        )}
      </ScannerContainer>

      {isProcessing && (
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          gap: 16
        }}>
          <div style={{
            width: 48,
            height: 48,
            border: '4px solid rgba(255, 255, 255, 0.1)',
            borderTopColor: '#0a66ff',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }} />
          <div style={{ color: '#fff', fontSize: 16 }}>Đang đăng nhập...</div>
        </div>
      )}

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </Overlay>
  );
};

export default QRScanner;

