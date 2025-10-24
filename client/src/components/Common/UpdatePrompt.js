import React, { useState } from 'react';
import styled from 'styled-components';
import { FiDownload, FiX } from 'react-icons/fi';

const Overlay = styled.div`
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
  padding: 20px;
  backdrop-filter: blur(4px);
`;

const Modal = styled.div`
  background: white;
  border-radius: 16px;
  padding: 0;
  max-width: 340px;
  width: 100%;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  overflow: hidden;
  animation: slideUp 0.3s ease-out;
  
  @keyframes slideUp {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
`;

const IconContainer = styled.div`
  display: flex;
  justify-content: center;
  padding: 30px 20px 20px;
  
  svg {
    width: 120px;
    height: 120px;
    color: #FF9500;
    animation: bounce 1s ease-in-out infinite;
  }
  
  @keyframes bounce {
    0%, 100% {
      transform: translateY(0);
    }
    50% {
      transform: translateY(-10px);
    }
  }
`;

const Content = styled.div`
  padding: 0 24px 24px;
  text-align: center;
`;

const Title = styled.h2`
  font-size: 18px;
  font-weight: 600;
  color: #1C1C1E;
  margin: 0 0 12px 0;
`;

const Message = styled.p`
  font-size: 14px;
  color: #8E8E93;
  line-height: 1.5;
  margin: 0 0 8px 0;
`;

const Version = styled.div`
  font-size: 13px;
  color: #007AFF;
  margin-bottom: 20px;
  font-weight: 500;
`;

const ChangeLog = styled.div`
  background: #F2F2F7;
  border-radius: 8px;
  padding: 12px;
  margin-bottom: 20px;
  text-align: left;
  font-size: 13px;
  color: #3C3C43;
  line-height: 1.6;
  max-height: 120px;
  overflow-y: auto;
`;

const ButtonContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const UpdateButton = styled.button`
  background: linear-gradient(135deg, #FF9500 0%, #FF6B00 100%);
  color: white;
  border: none;
  border-radius: 12px;
  padding: 14px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 4px 12px rgba(255, 149, 0, 0.3);
  
  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 6px 16px rgba(255, 149, 0, 0.4);
  }
  
  &:active {
    transform: translateY(0);
  }
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const SkipButton = styled.button`
  background: transparent;
  color: #8E8E93;
  border: none;
  padding: 12px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    color: #3C3C43;
  }
  
  ${props => props.disabled && `
    display: none;
  `}
`;

const ProgressBar = styled.div`
  width: 100%;
  height: 4px;
  background: #F2F2F7;
  border-radius: 2px;
  overflow: hidden;
  margin-bottom: 12px;
`;

const Progress = styled.div`
  height: 100%;
  background: linear-gradient(90deg, #FF9500 0%, #FF6B00 100%);
  transition: width 0.3s ease;
  width: ${props => props.percent}%;
`;

const UpdatePrompt = ({ 
  updateInfo, 
  onUpdate, 
  onSkip, 
  isDownloading, 
  downloadProgress 
}) => {
  if (!updateInfo) return null;

  const { version, currentVersion, changeLog, mandatory } = updateInfo;

  return (
    <Overlay>
      <Modal>
        <IconContainer>
          <FiDownload />
        </IconContainer>
        
        <Content>
          <Title>Ứng dụng đã có phiên bản mới!</Title>
          <Message>
            Bạn vui lòng cập nhật ứng dụng này để nhận những tính năng
            mới nhất. Nếu không cập nhật, bạn có thể không sử dụng
            được phiên bản hiện tại trên điện thoại!
          </Message>
          
          <Version>
            Phiên bản mới: v{version} (hiện tại: v{currentVersion})
          </Version>
          
          {changeLog && (
            <ChangeLog>
              <strong>Có gì mới:</strong><br />
              {changeLog}
            </ChangeLog>
          )}
          
          {isDownloading && (
            <>
              <ProgressBar>
                <Progress percent={downloadProgress} />
              </ProgressBar>
              <Message>Đang tải xuống... {downloadProgress}%</Message>
            </>
          )}
          
          <ButtonContainer>
            <UpdateButton 
              onClick={onUpdate}
              disabled={isDownloading}
            >
              {isDownloading ? 'Đang tải...' : 'Cập nhật'}
            </UpdateButton>
            
            {!mandatory && (
              <SkipButton onClick={onSkip} disabled={isDownloading}>
                Bỏ qua
              </SkipButton>
            )}
          </ButtonContainer>
        </Content>
      </Modal>
    </Overlay>
  );
};

export default UpdatePrompt;

