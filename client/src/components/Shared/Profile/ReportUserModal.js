import React, { useState } from 'react';
import styled from 'styled-components';
import { FiX, FiFlag, FiAlertCircle, FiUser, FiShield, FiAlertTriangle } from 'react-icons/fi';
import { toast } from 'react-toastify';
import { useTheme } from '../../../contexts/ThemeContext';
import { feedbackAPI } from '../../../utils/api';

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  padding: 1rem;
`;

const ModalContainer = styled.div`
  background: ${props => props.isDarkMode ? '#2a2a2b' : '#ffffff'};
  border-radius: 16px;
  width: 100%;
  max-width: 500px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
  border: ${props => props.isDarkMode ? '1px solid #3a3a3b' : 'none'};
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid ${props => props.isDarkMode ? '#3a3a3b' : '#e1e5e9'};
`;

const Title = styled.h3`
  font-size: 1.25rem;
  font-weight: 600;
  color: ${props => props.isDarkMode ? '#ffffff' : '#1e293b'};
  margin: 0;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  color: ${props => props.isDarkMode ? '#b0b0b0' : '#64748b'};
  font-size: 1.5rem;
  cursor: pointer;
  padding: 0.25rem;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: color 0.2s;

  &:hover {
    color: ${props => props.isDarkMode ? '#ffffff' : '#1e293b'};
  }
`;

const Content = styled.div`
  padding: 1.5rem;
  overflow-y: auto;
  flex: 1;
`;

const Subtitle = styled.p`
  font-size: 0.875rem;
  color: ${props => props.isDarkMode ? '#b0b0b0' : '#64748b'};
  margin: 0 0 1.5rem 0;
`;

const Label = styled.label`
  display: block;
  font-size: 0.875rem;
  font-weight: 500;
  color: ${props => props.isDarkMode ? '#ffffff' : '#1e293b'};
  margin-bottom: 0.75rem;
`;

const ReasonsContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-bottom: 1.5rem;
`;

const ReasonButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem;
  border-radius: 8px;
  border: 1px solid ${props => props.selected 
    ? (props.isDarkMode ? '#0084ff' : '#3b82f6')
    : (props.isDarkMode ? '#3a3a3b' : '#e1e5e9')};
  background: ${props => props.selected
    ? (props.isDarkMode ? 'rgba(0, 132, 255, 0.1)' : 'rgba(59, 130, 246, 0.1)')
    : (props.isDarkMode ? '#1a1a1a' : '#ffffff')};
  color: ${props => props.selected
    ? (props.isDarkMode ? '#0084ff' : '#3b82f6')
    : (props.isDarkMode ? '#ffffff' : '#1e293b')};
  cursor: pointer;
  font-size: 0.875rem;
  font-weight: ${props => props.selected ? '600' : '400'};
  transition: all 0.2s;
  text-align: left;

  &:hover {
    border-color: ${props => props.isDarkMode ? '#0084ff' : '#3b82f6'};
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const ReasonIcon = styled.span`
  font-size: 1.25rem;
  display: flex;
  align-items: center;
`;

const ReasonText = styled.span`
  flex: 1;
`;

const CheckIcon = styled.span`
  font-size: 1.25rem;
  color: ${props => props.isDarkMode ? '#0084ff' : '#3b82f6'};
`;

const TextArea = styled.textarea`
  width: 100%;
  padding: 0.75rem;
  border: 1px solid ${props => props.isDarkMode ? '#3a3a3b' : '#e1e5e9'};
  border-radius: 8px;
  font-size: 0.875rem;
  background-color: ${props => props.isDarkMode ? '#1a1a1a' : '#ffffff'};
  color: ${props => props.isDarkMode ? '#ffffff' : '#1e293b'};
  min-height: 100px;
  resize: vertical;
  font-family: inherit;

  &::placeholder {
    color: ${props => props.isDarkMode ? '#808080' : '#94a3b8'};
  }

  &:focus {
    outline: none;
    border-color: ${props => props.isDarkMode ? '#0084ff' : '#3b82f6'};
  }
`;

const Actions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  padding: 1.25rem 1.5rem;
  border-top: 1px solid ${props => props.isDarkMode ? '#3a3a3b' : '#e1e5e9'};
`;

const CancelButton = styled.button`
  padding: 0.625rem 1.25rem;
  background-color: ${props => props.isDarkMode ? '#3a3a3b' : '#f1f5f9'};
  color: ${props => props.isDarkMode ? '#ffffff' : '#1e293b'};
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.875rem;
  font-weight: 500;
  transition: all 0.2s;

  &:hover {
    opacity: 0.9;
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const SubmitButton = styled.button`
  padding: 0.625rem 1.25rem;
  background-color: ${props => props.isDarkMode ? '#0084ff' : '#3b82f6'};
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.875rem;
  font-weight: 500;
  transition: all 0.2s;

  &:hover {
    opacity: 0.9;
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const REPORT_REASONS = [
  { id: 'spam', label: 'Spam hoặc lừa đảo', icon: FiAlertCircle },
  { id: 'harassment', label: 'Quấy rối hoặc bắt nạt', icon: FiUser },
  { id: 'inappropriate', label: 'Nội dung không phù hợp', icon: FiFlag },
  { id: 'fake', label: 'Tài khoản giả mạo', icon: FiAlertTriangle },
  { id: 'violence', label: 'Bạo lực hoặc đe dọa', icon: FiShield },
  { id: 'other', label: 'Lý do khác', icon: FiFlag },
];

const ReportUserModal = ({ isOpen, onClose, reportedUserId, reportedUserName }) => {
  const { isDarkMode } = useTheme();
  const [selectedReason, setSelectedReason] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!selectedReason) {
      toast.error('Vui lòng chọn lý do báo cáo');
      return;
    }

    if (selectedReason === 'other' && !description.trim()) {
      toast.error('Vui lòng mô tả lý do báo cáo');
      return;
    }

    setIsSubmitting(true);
    try {
      const reasonText = REPORT_REASONS.find(r => r.id === selectedReason)?.label || selectedReason;
      const content = selectedReason === 'other'
        ? `Báo cáo tài khoản: ${reasonText}\n\nMô tả: ${description.trim()}`
        : `Báo cáo tài khoản: ${reasonText}${description.trim() ? '\n\nMô tả thêm: ' + description.trim() : ''}`;

      await feedbackAPI.submitFeedback(
        content,
        'report',
        null,
        reportedUserId
      );

      toast.success('Cảm ơn bạn đã báo cáo. Chúng tôi sẽ xem xét và xử lý.');
      
      // Reset form
      setSelectedReason('');
      setDescription('');
      onClose();
    } catch (error) {
      console.error('Error reporting user:', error);
      toast.error(error?.response?.data?.message || 'Không thể gửi báo cáo. Vui lòng thử lại sau.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setSelectedReason('');
      setDescription('');
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <ModalOverlay onClick={handleClose}>
      <ModalContainer isDarkMode={isDarkMode} onClick={(e) => e.stopPropagation()}>
        <Header>
          <Title>Báo cáo tài khoản</Title>
          <CloseButton onClick={handleClose} disabled={isSubmitting} isDarkMode={isDarkMode}>
            <FiX />
          </CloseButton>
        </Header>

        <Content>
          {reportedUserName && (
            <Subtitle isDarkMode={isDarkMode}>
              Bạn đang báo cáo: {reportedUserName}
            </Subtitle>
          )}

          <Label isDarkMode={isDarkMode}>Vui lòng chọn lý do báo cáo:</Label>
          <ReasonsContainer>
            {REPORT_REASONS.map((reason) => {
              const IconComponent = reason.icon;
              return (
                <ReasonButton
                  key={reason.id}
                  selected={selectedReason === reason.id}
                  isDarkMode={isDarkMode}
                  onClick={() => setSelectedReason(reason.id)}
                  disabled={isSubmitting}
                >
                  <ReasonIcon>
                    <IconComponent />
                  </ReasonIcon>
                  <ReasonText>{reason.label}</ReasonText>
                  {selectedReason === reason.id && (
                    <CheckIcon isDarkMode={isDarkMode}>✓</CheckIcon>
                  )}
                </ReasonButton>
              );
            })}
          </ReasonsContainer>

          <Label isDarkMode={isDarkMode}>Mô tả thêm (tùy chọn):</Label>
          <TextArea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Cung cấp thêm thông tin về vấn đề này..."
            isDarkMode={isDarkMode}
            disabled={isSubmitting}
          />
        </Content>

        <Actions>
          <CancelButton onClick={handleClose} disabled={isSubmitting} isDarkMode={isDarkMode}>
            Hủy
          </CancelButton>
          <SubmitButton
            onClick={handleSubmit}
            disabled={isSubmitting || !selectedReason}
            isDarkMode={isDarkMode}
          >
            {isSubmitting ? 'Đang gửi...' : 'Gửi báo cáo'}
          </SubmitButton>
        </Actions>
      </ModalContainer>
    </ModalOverlay>
  );
};

export default ReportUserModal;

