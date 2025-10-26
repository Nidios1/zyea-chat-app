/**
 * Bundle Protection Error Screen
 * Hiển thị khi phát hiện Bundle ID không hợp lệ
 */

import React from 'react';
import styled from 'styled-components';
import { FiAlertTriangle, FiLock, FiShield } from 'react-icons/fi';

const ErrorContainer = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, #1e3c72 0%, #2a5298 50%, #7e22ce 100%);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 20px;
  z-index: 999999;
  color: white;
`;

const IconContainer = styled.div`
  font-size: 80px;
  color: #ff4757;
  margin-bottom: 30px;
  animation: pulse 2s infinite;

  @keyframes pulse {
    0%, 100% {
      transform: scale(1);
      opacity: 1;
    }
    50% {
      transform: scale(1.1);
      opacity: 0.8;
    }
  }
`;

const Title = styled.h1`
  font-size: 28px;
  font-weight: bold;
  margin-bottom: 15px;
  text-align: center;
  color: #fff;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
`;

const Message = styled.p`
  font-size: 16px;
  text-align: center;
  margin-bottom: 10px;
  color: rgba(255, 255, 255, 0.9);
  max-width: 400px;
  line-height: 1.6;
`;

const ErrorCode = styled.div`
  background: rgba(0, 0, 0, 0.3);
  padding: 15px 25px;
  border-radius: 10px;
  margin-top: 30px;
  border: 2px solid rgba(255, 71, 87, 0.5);
`;

const ErrorCodeText = styled.code`
  font-family: 'Courier New', monospace;
  font-size: 14px;
  color: #ff4757;
  font-weight: bold;
`;

const SecurityBadge = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 40px;
  padding: 15px 30px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 50px;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
`;

const BadgeIcon = styled.div`
  font-size: 24px;
  color: #ffd700;
`;

const BadgeText = styled.div`
  font-size: 14px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.95);
`;

const InfoBox = styled.div`
  margin-top: 30px;
  padding: 20px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 15px;
  border-left: 4px solid #0084ff;
  max-width: 450px;
`;

const InfoTitle = styled.div`
  font-size: 14px;
  font-weight: bold;
  margin-bottom: 10px;
  color: #0084ff;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const InfoText = styled.div`
  font-size: 13px;
  color: rgba(255, 255, 255, 0.8);
  line-height: 1.5;
`;

const BundleProtectionError = () => {
  return (
    <ErrorContainer>
      <IconContainer>
        <FiAlertTriangle />
      </IconContainer>

      <Title>⚠️ Bảo Vệ Bản Quyền</Title>

      <Message>
        Ứng dụng này được bảo vệ bởi hệ thống xác thực Bundle ID.
      </Message>

      <Message style={{ fontWeight: 'bold', fontSize: '18px', color: '#ff4757' }}>
        Bundle ID không hợp lệ hoặc đã bị chỉnh sửa!
      </Message>

      <ErrorCode>
        <ErrorCodeText>ERROR: INVALID_BUNDLE_IDENTIFIER</ErrorCodeText>
      </ErrorCode>

      <SecurityBadge>
        <BadgeIcon>
          <FiShield />
        </BadgeIcon>
        <BadgeText>Protected by Zyea Security System</BadgeText>
      </SecurityBadge>

      <InfoBox>
        <InfoTitle>
          <FiLock />
          Thông tin quan trọng
        </InfoTitle>
        <InfoText>
          • Bundle ID chính thức: <strong>com.zyea.hieudev</strong>
          <br />
          • Ứng dụng này chỉ hoạt động với Bundle ID gốc
          <br />
          • Vui lòng tải ứng dụng chính thức từ nguồn tin cậy
          <br />
          • Liên hệ: support@zyea.com
        </InfoText>
      </InfoBox>

      <Message style={{ 
        marginTop: '40px', 
        fontSize: '12px', 
        color: 'rgba(255, 255, 255, 0.5)' 
      }}>
        © 2024 Zyea. All Rights Reserved.
      </Message>
    </ErrorContainer>
  );
};

export default BundleProtectionError;

