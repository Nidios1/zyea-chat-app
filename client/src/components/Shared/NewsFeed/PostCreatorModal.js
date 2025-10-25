import React, { useState } from 'react';
import styled from 'styled-components';
import { toast } from 'react-toastify';
import { 
  FiX, 
  FiChevronDown, 
  FiType, 
  FiToggleRight,
  FiSend,
  FiMusic,
  FiImage,
  FiUsers,
  FiSmile,
  FiCamera,
  FiPlay,
  FiPaperclip,
  FiMapPin
} from 'react-icons/fi';
import { newsfeedAPI } from '../../../utils/api';

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: flex-end;
  z-index: 1000;
`;

const ModalContainer = styled.div`
  background: white;
  width: 100%;
  max-height: 90vh;
  border-radius: 20px 20px 0 0;
  display: flex;
  flex-direction: column;
  animation: slideUp 0.3s ease-out;

  @keyframes slideUp {
    from {
      transform: translateY(100%);
    }
    to {
      transform: translateY(0);
    }
  }
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.5rem;
  border-bottom: 1px solid #e1e5e9;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  font-size: 1.5rem;
  color: #666;
  cursor: pointer;
  padding: 0.25rem;
`;

const AudienceSection = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex: 1;
  justify-content: center;
`;

const AudienceText = styled.div`
  text-align: center;
`;

const AudienceTitle = styled.div`
  font-size: 1rem;
  font-weight: 600;
  color: #333;
  display: flex;
  align-items: center;
  gap: 0.25rem;
`;

const AudienceSubtitle = styled.div`
  font-size: 0.75rem;
  color: #666;
  margin-top: 0.125rem;
`;

const HeaderActions = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
`;

const FormatButton = styled.button`
  background: none;
  border: none;
  font-size: 1.2rem;
  color: #666;
  cursor: pointer;
  padding: 0.25rem;
`;

const ToggleContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const ToggleSwitch = styled.div`
  width: 40px;
  height: 20px;
  background: ${props => props.active ? '#0084ff' : '#ccc'};
  border-radius: 10px;
  position: relative;
  cursor: pointer;
  transition: background 0.2s ease;

  &::after {
    content: '';
    position: absolute;
    top: 2px;
    left: ${props => props.active ? '22px' : '2px'};
    width: 16px;
    height: 16px;
    background: white;
    border-radius: 50%;
    transition: left 0.2s ease;
  }
`;

const SendButton = styled.button`
  background: ${props => props.disabled ? '#ccc' : '#0084ff'};
  color: white;
  border: none;
  border-radius: 20px;
  padding: 0.5rem 1rem;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: ${props => props.disabled ? 'not-allowed' : 'pointer'};
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: background 0.2s ease;
  opacity: ${props => props.disabled ? 0.7 : 1};

  &:hover {
    background: ${props => props.disabled ? '#ccc' : '#0066cc'};
  }
`;

const Content = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 1rem 1.5rem;
`;

const PostInput = styled.textarea`
  width: 100%;
  min-height: 120px;
  border: none;
  outline: none;
  font-size: 1rem;
  line-height: 1.5;
  resize: none;
  font-family: inherit;

  &::placeholder {
    color: #999;
  }
`;

const FormattingButton = styled.button`
  background: #f5f5f5;
  border: none;
  border-radius: 50%;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  margin-top: 0.5rem;
  color: #666;
  font-size: 0.9rem;
`;

const MediaOptions = styled.div`
  display: flex;
  gap: 1rem;
  margin: 1rem 0;
`;

const MediaOption = styled.button`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 8px;
  transition: background 0.2s ease;

  &:hover {
    background: #f5f5f5;
  }
`;

const MediaIcon = styled.div`
  font-size: 1.5rem;
  color: ${props => props.color || '#666'};
`;

const MediaLabel = styled.span`
  font-size: 0.75rem;
  color: #666;
  font-weight: 500;
`;

const BottomToolbar = styled.div`
  border-top: 1px solid #e1e5e9;
  padding: 1rem 1.5rem;
`;

const ToolbarIcons = styled.div`
  display: flex;
  gap: 1.5rem;
  margin-bottom: 1rem;
`;

const ToolbarIcon = styled.button`
  background: none;
  border: none;
  font-size: 1.5rem;
  color: ${props => props.active ? '#0084ff' : '#666'};
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 8px;
  transition: all 0.2s ease;

  &:hover {
    background: #f5f5f5;
  }
`;

const PhotoGallery = styled.div`
  display: flex;
  gap: 0.75rem;
  overflow-x: auto;
  padding-bottom: 0.5rem;

  &::-webkit-scrollbar {
    display: none;
  }
`;

const PhotoItem = styled.div`
  min-width: 80px;
  height: 80px;
  border-radius: 8px;
  background: #f5f5f5;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  position: relative;
  overflow: hidden;

  &:first-child {
    background: #0084ff;
    color: white;
    flex-direction: column;
    gap: 0.25rem;
  }
`;

const PhotoImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
`;

const PhotoLabel = styled.span`
  font-size: 0.75rem;
  font-weight: 500;
  text-align: center;
`;

const PostCreatorModal = ({ isOpen, onClose, currentUser, onPostCreated }) => {
  const [postContent, setPostContent] = useState('');
  const [audience, setAudience] = useState('all');
  const [isPublic, setIsPublic] = useState(true);
  const [activeTool, setActiveTool] = useState('gallery');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!postContent.trim()) {
      toast.error('Vui lòng nhập nội dung bài viết');
      return;
    }

    setIsSubmitting(true);
    try {
      const postData = {
        content: postContent.trim(),
        type: 'text',
        privacy: isPublic ? 'public' : 'private'
      };

      console.log('Creating post:', postData);
      const response = await newsfeedAPI.createPost(postData);
      
      toast.success('Đăng bài thành công!');
      
      if (onPostCreated) {
        onPostCreated(response.data);
      }
      
      setPostContent('');
      onClose();
    } catch (error) {
      console.error('Error creating post:', error);
      toast.error(error.response?.data?.message || 'Có lỗi xảy ra khi đăng bài');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAudienceChange = () => {
    // Handle audience selection
    console.log('Change audience');
  };

  if (!isOpen) return null;

  return (
    <ModalOverlay onClick={onClose}>
      <ModalContainer onClick={(e) => e.stopPropagation()}>
        <Header>
          <CloseButton onClick={onClose}>
            <FiX />
          </CloseButton>
          
          <AudienceSection>
            <AudienceText>
              <AudienceTitle onClick={handleAudienceChange}>
                Tất cả bạn bè
                <FiChevronDown />
              </AudienceTitle>
              <AudienceSubtitle>Xem bởi bạn bè trên Zyea+</AudienceSubtitle>
            </AudienceText>
          </AudienceSection>

          <HeaderActions>
            <FormatButton>
              <FiType />
            </FormatButton>
            <ToggleContainer>
              <ToggleSwitch 
                active={isPublic} 
                onClick={() => setIsPublic(!isPublic)}
              />
            </ToggleContainer>
            <SendButton onClick={handleSubmit} disabled={isSubmitting}>
              <FiSend />
              {isSubmitting ? 'Đang đăng...' : 'Đăng'}
            </SendButton>
          </HeaderActions>
        </Header>

        <Content>
          <PostInput
            placeholder="Bạn đang nghĩ gì?"
            value={postContent}
            onChange={(e) => setPostContent(e.target.value)}
          />
          
          <FormattingButton>
            <FiType />
          </FormattingButton>

          <MediaOptions>
            <MediaOption>
              <MediaIcon color="#4CAF50">
                <FiMusic />
              </MediaIcon>
              <MediaLabel>Nhạc</MediaLabel>
            </MediaOption>
            
            <MediaOption>
              <MediaIcon color="#2196F3">
                <FiImage />
              </MediaIcon>
              <MediaLabel>Album</MediaLabel>
            </MediaOption>
            
            <MediaOption>
              <MediaIcon color="#FF9800">
                <FiUsers />
              </MediaIcon>
              <MediaLabel>Với bạn bè</MediaLabel>
            </MediaOption>
          </MediaOptions>
        </Content>

        <BottomToolbar>
          <ToolbarIcons>
            <ToolbarIcon>
              <FiSmile />
            </ToolbarIcon>
            <ToolbarIcon 
              active={activeTool === 'gallery'} 
              onClick={() => setActiveTool('gallery')}
            >
              <FiImage />
            </ToolbarIcon>
            <ToolbarIcon onClick={() => setActiveTool('video')}>
              <FiPlay />
            </ToolbarIcon>
            <ToolbarIcon>
              <FiPaperclip />
            </ToolbarIcon>
            <ToolbarIcon>
              <FiMapPin />
            </ToolbarIcon>
          </ToolbarIcons>

          <PhotoGallery>
            <PhotoItem>
              <FiCamera />
              <PhotoLabel>Chụp ảnh</PhotoLabel>
            </PhotoItem>
            
            <PhotoItem>
              <PhotoImage src="https://via.placeholder.com/80x80/4CAF50/white?text=Food" alt="Recent photo" />
            </PhotoItem>
            
            <PhotoItem>
              <PhotoImage src="https://via.placeholder.com/80x80/2196F3/white?text=Phone" alt="Recent photo" />
            </PhotoItem>
            
            <PhotoItem>
              <PhotoImage src="https://via.placeholder.com/80x80/FF9800/white?text=More" alt="Recent photo" />
            </PhotoItem>
          </PhotoGallery>
        </BottomToolbar>
      </ModalContainer>
    </ModalOverlay>
  );
};

export default PostCreatorModal;
