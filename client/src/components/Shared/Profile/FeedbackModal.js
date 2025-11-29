import React, { useState } from 'react';
import styled from 'styled-components';
import { FiX, FiPaperclip, FiSend } from 'react-icons/fi';
import { toast } from 'react-toastify';
import { getApiBaseUrl } from '../../../utils/platformConfig';
import { getToken } from '../../../utils/auth';
import { useTheme } from '../../../contexts/ThemeContext';

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
  font-size: 1.5rem;
  color: ${props => props.isDarkMode ? '#a0a0a0' : '#666'};
  cursor: pointer;
  padding: 0.25rem;
  display: flex;
  align-items: center;
  justify-content: center;
  
  &:hover {
    color: ${props => props.isDarkMode ? '#ffffff' : '#333'};
  }
`;

const Content = styled.div`
  padding: 1.5rem;
  overflow-y: auto;
  flex: 1;
`;

const Description = styled.p`
  font-size: 0.875rem;
  color: ${props => props.isDarkMode ? '#a0a0a0' : '#64748b'};
  margin: 0 0 1.5rem 0;
  line-height: 1.5;
`;

const TypeContainer = styled.div`
  display: flex;
  gap: 0.75rem;
  margin-bottom: 1.5rem;
`;

const TypeButton = styled.button`
  flex: 1;
  padding: 0.75rem 1rem;
  border-radius: 8px;
  border: 1px solid ${props => props.isActive ? (props.isDarkMode ? '#0084ff' : '#3b82f6') : (props.isDarkMode ? '#3a3a3b' : '#e5e7eb')};
  background: ${props => props.isActive ? (props.isDarkMode ? '#0084ff' : '#3b82f6') : 'transparent'};
  color: ${props => props.isActive ? '#ffffff' : (props.isDarkMode ? '#ffffff' : '#1e293b')};
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    border-color: ${props => props.isDarkMode ? '#0084ff' : '#3b82f6'};
    background: ${props => !props.isActive && (props.isDarkMode ? 'rgba(0, 132, 255, 0.1)' : 'rgba(59, 130, 246, 0.1)')};
  }
`;

const TextArea = styled.textarea`
  width: 100%;
  min-height: 150px;
  padding: 1rem;
  border-radius: 8px;
  border: 1px solid ${props => props.isDarkMode ? '#3a3a3b' : '#e5e7eb'};
  background: ${props => props.isDarkMode ? '#1a1a1a' : '#ffffff'};
  color: ${props => props.isDarkMode ? '#ffffff' : '#1e293b'};
  font-size: 0.9375rem;
  font-family: inherit;
  resize: vertical;
  margin-bottom: 0.5rem;
  
  &:focus {
    outline: none;
    border-color: ${props => props.isDarkMode ? '#0084ff' : '#3b82f6'};
  }
  
  &::placeholder {
    color: ${props => props.isDarkMode ? '#666666' : '#9ca3af'};
  }
`;

const CharCount = styled.div`
  font-size: 0.75rem;
  color: ${props => props.isDarkMode ? '#666666' : '#9ca3af'};
  text-align: right;
  margin-bottom: 1rem;
`;

const AttachButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  border-radius: 8px;
  border: 1px solid ${props => props.isDarkMode ? '#3a3a3b' : '#e5e7eb'};
  background: ${props => props.isDarkMode ? '#1a1a1a' : '#f8f9fa'};
  color: ${props => props.isDarkMode ? '#a0a0a0' : '#64748b'};
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  margin-bottom: 1rem;
  width: 100%;
  justify-content: center;
  transition: all 0.2s;
  
  &:hover {
    border-color: ${props => props.isDarkMode ? '#0084ff' : '#3b82f6'};
    background: ${props => props.isDarkMode ? 'rgba(0, 132, 255, 0.1)' : 'rgba(59, 130, 246, 0.1)'};
    color: ${props => props.isDarkMode ? '#0084ff' : '#3b82f6'};
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const MediaPreview = styled.div`
  position: relative;
  border-radius: 8px;
  overflow: hidden;
  margin-bottom: 1rem;
  border: 1px solid ${props => props.isDarkMode ? '#3a3a3b' : '#e5e7eb'};
`;

const MediaImage = styled.img`
  width: 100%;
  max-height: 200px;
  object-fit: cover;
  display: block;
`;

const RemoveMediaButton = styled.button`
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.6);
  border: none;
  color: #ffffff;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
  
  &:hover {
    background: rgba(0, 0, 0, 0.8);
  }
`;

const SubmitButton = styled.button`
  width: 100%;
  padding: 0.875rem 1.5rem;
  border-radius: 8px;
  border: none;
  background: ${props => props.isDarkMode ? '#0084ff' : '#3b82f6'};
  color: #ffffff;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  transition: all 0.2s;
  
  &:hover:not(:disabled) {
    background: ${props => props.isDarkMode ? '#0066cc' : '#2563eb'};
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const FeedbackModal = ({ isOpen, onClose }) => {
  const { isDarkMode } = useTheme();
  const [feedback, setFeedback] = useState('');
  const [feedbackType, setFeedbackType] = useState('feedback');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState(null);
  const fileInputRef = React.useRef(null);

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setSelectedMedia({
            file: file,
            url: reader.result,
            type: 'image'
          });
        };
        reader.readAsDataURL(file);
      } else {
        toast.error('Chỉ hỗ trợ file hình ảnh');
      }
    }
  };

  const handleRemoveMedia = () => {
    setSelectedMedia(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async () => {
    if (!feedback.trim()) {
      toast.error('Vui lòng nhập nội dung góp ý');
      return;
    }

    if (feedback.trim().length < 10) {
      toast.error('Nội dung góp ý phải có ít nhất 10 ký tự');
      return;
    }

    setIsSubmitting(true);
    try {
      const apiUrl = getApiBaseUrl();
      const token = getToken();

      let mediaUrl = null;

      // Upload media if selected
      if (selectedMedia && selectedMedia.file) {
        try {
          const formData = new FormData();
          formData.append('image', selectedMedia.file);

          const uploadResponse = await fetch(`${apiUrl}/upload/post-image`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`
            },
            body: formData
          });

          if (uploadResponse.ok) {
            const uploadData = await uploadResponse.json();
            mediaUrl = uploadData.url;
          }
        } catch (uploadError) {
          console.error('Error uploading media:', uploadError);
          toast.error('Không thể tải hình ảnh lên. Vui lòng thử lại.');
          setIsSubmitting(false);
          return;
        }
      }

      // Submit feedback
      const response = await fetch(`${apiUrl}/feedback`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          content: feedback.trim(),
          type: feedbackType,
          mediaUrl: mediaUrl
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Không thể gửi góp ý');
      }

      toast.success('Cảm ơn bạn đã góp ý! Chúng tôi sẽ xem xét và cải thiện ứng dụng.');
      setFeedback('');
      setSelectedMedia(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      onClose();
    } catch (error) {
      console.error('Error submitting feedback:', error);
      toast.error(error.message || 'Không thể gửi góp ý. Vui lòng thử lại sau.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <ModalOverlay onClick={onClose}>
      <ModalContainer isDarkMode={isDarkMode} onClick={(e) => e.stopPropagation()}>
        <Header isDarkMode={isDarkMode}>
          <Title isDarkMode={isDarkMode}>Góp ý & phản hồi</Title>
          <CloseButton isDarkMode={isDarkMode} onClick={onClose}>
            <FiX />
          </CloseButton>
        </Header>

        <Content>
          <Description isDarkMode={isDarkMode}>
            Chúng tôi rất mong nhận được phản hồi từ bạn! Hãy chia sẻ ý kiến, đề xuất hoặc báo cáo lỗi để chúng tôi có thể cải thiện ứng dụng tốt hơn.
          </Description>

          <TypeContainer>
            <TypeButton
              isDarkMode={isDarkMode}
              isActive={feedbackType === 'feedback'}
              onClick={() => setFeedbackType('feedback')}
            >
              Góp ý
            </TypeButton>
            <TypeButton
              isDarkMode={isDarkMode}
              isActive={feedbackType === 'report'}
              onClick={() => setFeedbackType('report')}
            >
              Báo cáo
            </TypeButton>
            <TypeButton
              isDarkMode={isDarkMode}
              isActive={feedbackType === 'bug'}
              onClick={() => setFeedbackType('bug')}
            >
              Lỗi
            </TypeButton>
          </TypeContainer>

          <TextArea
            isDarkMode={isDarkMode}
            placeholder="Nhập nội dung góp ý của bạn..."
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            maxLength={1000}
          />
          <CharCount isDarkMode={isDarkMode}>
            {feedback.length}/1000
          </CharCount>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={handleFileSelect}
          />

          <AttachButton
            isDarkMode={isDarkMode}
            onClick={() => fileInputRef.current?.click()}
            disabled={isSubmitting}
          >
            <FiPaperclip />
            Đính kèm hình ảnh
          </AttachButton>

          {selectedMedia && selectedMedia.type === 'image' && (
            <MediaPreview isDarkMode={isDarkMode}>
              <MediaImage src={selectedMedia.url} alt="Preview" />
              <RemoveMediaButton onClick={handleRemoveMedia}>
                <FiX />
              </RemoveMediaButton>
            </MediaPreview>
          )}

          <SubmitButton
            isDarkMode={isDarkMode}
            onClick={handleSubmit}
            disabled={isSubmitting || !feedback.trim()}
          >
            {isSubmitting ? (
              <>Đang gửi...</>
            ) : (
              <>
                <FiSend />
                Gửi góp ý
              </>
            )}
          </SubmitButton>
        </Content>
      </ModalContainer>
    </ModalOverlay>
  );
};

export default FeedbackModal;

