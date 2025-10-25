import React, { useState } from 'react';
import styled from 'styled-components';
import { FiVideo, FiMic, FiAlertCircle, FiCheck, FiX } from 'react-icons/fi';

const Overlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
  animation: fadeIn 0.3s ease;

  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
`;

const Modal = styled.div`
  background: white;
  border-radius: 20px;
  padding: 40px;
  max-width: 500px;
  width: 90%;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  animation: slideUp 0.3s ease;

  @keyframes slideUp {
    from {
      transform: translateY(30px);
      opacity: 0;
    }
    to {
      transform: translateY(0);
      opacity: 1;
    }
  }

  @media (max-width: 768px) {
    padding: 30px 20px;
    max-width: 350px;
  }
`;

const IconContainer = styled.div`
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 24px;
  position: relative;
  
  &::before {
    content: '';
    position: absolute;
    width: 100%;
    height: 100%;
    border-radius: 50%;
    background: inherit;
    animation: pulse 2s ease-in-out infinite;
  }

  @keyframes pulse {
    0%, 100% {
      transform: scale(1);
      opacity: 0.3;
    }
    50% {
      transform: scale(1.2);
      opacity: 0;
    }
  }

  svg {
    position: relative;
    z-index: 1;
  }
`;

const Title = styled.h2`
  font-size: 24px;
  font-weight: 600;
  color: #1a1a1a;
  text-align: center;
  margin: 0 0 12px 0;

  @media (max-width: 768px) {
    font-size: 20px;
  }
`;

const Description = styled.p`
  font-size: 15px;
  color: #666;
  text-align: center;
  line-height: 1.6;
  margin: 0 0 30px 0;

  @media (max-width: 768px) {
    font-size: 14px;
  }
`;

const PermissionList = styled.div`
  background: #f8f9fa;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 24px;
`;

const PermissionItem = styled.div`
  display: flex;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid #e9ecef;

  &:last-child {
    border-bottom: none;
  }
`;

const PermissionIcon = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: ${props => props.granted ? '#28a745' : '#6c757d'};
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 16px;
  transition: all 0.3s ease;

  svg {
    color: white;
  }
`;

const PermissionInfo = styled.div`
  flex: 1;
`;

const PermissionName = styled.div`
  font-size: 15px;
  font-weight: 600;
  color: #1a1a1a;
  margin-bottom: 4px;
`;

const PermissionDesc = styled.div`
  font-size: 13px;
  color: #666;
`;

const PermissionStatus = styled.div`
  font-size: 12px;
  font-weight: 600;
  color: ${props => props.granted ? '#28a745' : '#dc3545'};
  text-transform: uppercase;
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 12px;
  margin-top: 24px;

  @media (max-width: 768px) {
    flex-direction: column;
  }
`;

const Button = styled.button`
  flex: 1;
  padding: 14px 24px;
  border-radius: 12px;
  font-size: 15px;
  font-weight: 600;
  border: none;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;

  &:active {
    transform: scale(0.98);
  }

  @media (max-width: 768px) {
    padding: 12px 20px;
  }
`;

const PrimaryButton = styled(Button)`
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);

  &:hover {
    box-shadow: 0 6px 16px rgba(102, 126, 234, 0.5);
    transform: translateY(-2px);
  }

  &:disabled {
    background: #ccc;
    cursor: not-allowed;
    box-shadow: none;
    transform: none;
  }
`;

const SecondaryButton = styled(Button)`
  background: #f1f3f5;
  color: #495057;

  &:hover {
    background: #e9ecef;
  }
`;

const ErrorMessage = styled.div`
  background: #fff3cd;
  border: 1px solid #ffc107;
  border-radius: 8px;
  padding: 12px 16px;
  margin-bottom: 20px;
  display: flex;
  align-items: flex-start;
  gap: 12px;

  svg {
    color: #856404;
    flex-shrink: 0;
    margin-top: 2px;
  }
`;

const ErrorText = styled.div`
  font-size: 13px;
  color: #856404;
  line-height: 1.5;
`;

const HelpText = styled.div`
  text-align: center;
  font-size: 12px;
  color: #999;
  margin-top: 16px;
  
  a {
    color: #667eea;
    text-decoration: none;
    
    &:hover {
      text-decoration: underline;
    }
  }
`;

const PermissionRequest = ({ 
  isVideoCall = true,
  onAllow,
  onDeny,
  conversationName = "người dùng"
}) => {
  const [permissions, setPermissions] = useState({
    camera: { granted: false, checked: false },
    microphone: { granted: false, checked: false }
  });
  const [error, setError] = useState(null);
  const [checking, setChecking] = useState(false);

  const checkPermissions = async () => {
    setChecking(true);
    setError(null);

    try {
      // Request permissions
      const constraints = {
        video: isVideoCall ? { width: 1280, height: 720 } : false,
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);

      // Update permissions state
      const videoTracks = stream.getVideoTracks();
      const audioTracks = stream.getAudioTracks();

      setPermissions({
        camera: { 
          granted: isVideoCall && videoTracks.length > 0, 
          checked: true 
        },
        microphone: { 
          granted: audioTracks.length > 0, 
          checked: true 
        }
      });

      // Stop tracks immediately
      stream.getTracks().forEach(track => track.stop());

      // Call success callback
      if (onAllow) {
        setTimeout(() => {
          onAllow();
        }, 500);
      }

    } catch (error) {
      console.error('Permission error:', error);
      
      let errorMessage = 'Không thể truy cập camera/microphone. ';
      
      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        errorMessage += 'Bạn đã từ chối quyền truy cập. Vui lòng click vào icon 🔒 hoặc 🎥 trên thanh địa chỉ và cho phép truy cập.';
      } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
        errorMessage += 'Không tìm thấy camera/microphone. Vui lòng kiểm tra thiết bị đã kết nối đúng chưa.';
      } else if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
        errorMessage += 'Thiết bị đang được sử dụng bởi ứng dụng khác. Vui lòng đóng các ứng dụng khác (Zoom, Teams, Skype...) và thử lại.';
      } else {
        errorMessage += error.message;
      }
      
      setError(errorMessage);
      setPermissions({
        camera: { granted: false, checked: true },
        microphone: { granted: false, checked: true }
      });
    } finally {
      setChecking(false);
    }
  };

  const handleAllow = async () => {
    await checkPermissions();
  };

  const handleDeny = () => {
    if (onDeny) {
      onDeny();
    }
  };

  return (
    <Overlay>
      <Modal>
        <IconContainer>
          {isVideoCall ? (
            <FiVideo size={36} color="white" />
          ) : (
            <FiMic size={36} color="white" />
          )}
        </IconContainer>

        <Title>
          {isVideoCall ? 'Cho phép truy cập Camera & Microphone' : 'Cho phép truy cập Microphone'}
        </Title>

        <Description>
          Zyea+ cần quyền truy cập để bắt đầu cuộc {isVideoCall ? 'gọi video' : 'gọi thoại'} với <strong>{conversationName}</strong>
        </Description>

        {error && (
          <ErrorMessage>
            <FiAlertCircle size={20} />
            <ErrorText>{error}</ErrorText>
          </ErrorMessage>
        )}

        <PermissionList>
          {isVideoCall && (
            <PermissionItem>
              <PermissionIcon granted={permissions.camera.granted}>
                {permissions.camera.granted ? (
                  <FiCheck size={20} />
                ) : (
                  <FiVideo size={20} />
                )}
              </PermissionIcon>
              <PermissionInfo>
                <PermissionName>Camera</PermissionName>
                <PermissionDesc>Để người khác nhìn thấy bạn</PermissionDesc>
              </PermissionInfo>
              {permissions.camera.checked && (
                <PermissionStatus granted={permissions.camera.granted}>
                  {permissions.camera.granted ? '✓ Cho phép' : '✗ Từ chối'}
                </PermissionStatus>
              )}
            </PermissionItem>
          )}

          <PermissionItem>
            <PermissionIcon granted={permissions.microphone.granted}>
              {permissions.microphone.granted ? (
                <FiCheck size={20} />
              ) : (
                <FiMic size={20} />
              )}
            </PermissionIcon>
            <PermissionInfo>
              <PermissionName>Microphone</PermissionName>
              <PermissionDesc>Để người khác nghe thấy bạn</PermissionDesc>
            </PermissionInfo>
            {permissions.microphone.checked && (
              <PermissionStatus granted={permissions.microphone.granted}>
                {permissions.microphone.granted ? '✓ Cho phép' : '✗ Từ chối'}
              </PermissionStatus>
            )}
          </PermissionItem>
        </PermissionList>

        <ButtonGroup>
          <SecondaryButton onClick={handleDeny}>
            <FiX size={18} />
            Hủy
          </SecondaryButton>
          <PrimaryButton onClick={handleAllow} disabled={checking}>
            {checking ? (
              'Đang kiểm tra...'
            ) : (
              <>
                <FiCheck size={18} />
                Cho phép
              </>
            )}
          </PrimaryButton>
        </ButtonGroup>

        <HelpText>
          Quyền này có thể được thay đổi bất cứ lúc nào trong cài đặt trình duyệt.
          <br />
          <a href="/help/permissions" target="_blank">Tìm hiểu thêm</a>
        </HelpText>
      </Modal>
    </Overlay>
  );
};

export default PermissionRequest;

