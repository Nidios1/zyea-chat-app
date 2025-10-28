import React, { useState, useRef, useContext, useCallback } from 'react';
import styled from 'styled-components';
import { FiChevronLeft, FiImage, FiUpload, FiCalendar } from 'react-icons/fi';
import AuthContext from '../../contexts/AuthContext';
import { getInitials } from '../../utils/nameUtils';
import { getAvatarURL } from '../../utils/imageUtils';
import { newsfeedAPI } from '../../utils/api';
import { getApiBaseUrl } from '../../utils/platformConfig';

const CreatePostContainer = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: var(--bg-primary, white);
  display: flex;
  flex-direction: column;
  z-index: 2000;
  
  /* Safe area for iPhone notch/Dynamic Island */
  @media (max-width: 768px) {
    padding-top: env(safe-area-inset-top);
    padding-bottom: env(safe-area-inset-bottom);
  }
`;

const Header = styled.div`
  background: var(--bg-primary, white);
  padding: 12px 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  border-bottom: 1px solid var(--border-color, #f0f0f0);
  flex-shrink: 0;
  
  @media (max-width: 480px) {
    padding: 10px 12px;
  }
`;

const HeaderLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
  min-width: 0;
`;

const BackButton = styled.button`
  background: none;
  border: none;
  padding: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-primary, #333);
  
  &:active {
    opacity: 0.7;
  }
`;

const HeaderTitle = styled.div`
  font-size: 17px;
  font-weight: 600;
  color: var(--text-primary, #000);
  
  @media (max-width: 480px) {
    font-size: 16px;
  }
`;

const PostButton = styled.button`
  background: ${props => props.disabled ? 'var(--bg-secondary, #e0e0e0)' : 'var(--primary-color, #0068ff)'};
  color: ${props => props.disabled ? 'var(--text-tertiary, #999)' : 'white'};
  border: none;
  border-radius: 8px;
  padding: 8px 20px;
  font-size: 15px;
  font-weight: 600;
  cursor: ${props => props.disabled ? 'not-allowed' : 'pointer'};
  transition: all 0.2s;
  white-space: nowrap;
  
  @media (max-width: 480px) {
    padding: 6px 16px;
    font-size: 14px;
  }
  
  &:active {
    opacity: ${props => props.disabled ? 1 : 0.8};
  }
`;

const Content = styled.div`
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 16px;
  -webkit-overflow-scrolling: touch;
  
  @media (max-width: 480px) {
    padding: 12px;
  }
`;

const UserInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
  
  @media (max-width: 480px) {
    margin-bottom: 12px;
  }
`;

const UserAvatar = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: ${props => props.gradient || 'linear-gradient(135deg, #0068ff 0%, #00a651 100%)'};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  font-weight: bold;
  color: white;
  flex-shrink: 0;
  overflow: hidden;
  
  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  
  @media (max-width: 480px) {
    width: 36px;
    height: 36px;
    font-size: 16px;
  }
`;

const UserDetails = styled.div`
  flex: 1;
  min-width: 0;
  
  @media (max-width: 480px) {
    display: flex;
    flex-direction: column;
  }
`;

const UserName = styled.div`
  font-size: 15px;
  font-weight: 600;
  color: var(--text-primary, #000);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  
  @media (max-width: 480px) {
    font-size: 14px;
  }
`;

const TimelineBadge = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: var(--bg-secondary, #f5f5f5);
  color: var(--text-secondary, #666);
  font-size: 13px;
  padding: 4px 10px;
  border-radius: 16px;
  margin-top: 4px;
  
  @media (max-width: 480px) {
    font-size: 12px;
    padding: 3px 8px;
  }
`;

const TextInput = styled.textarea`
  width: 100%;
  min-height: 150px;
  max-height: 300px;
  padding: 16px;
  border: none;
  outline: none;
  font-size: 16px;
  font-family: inherit;
  color: var(--text-primary, #000);
  background: transparent;
  resize: none;
  line-height: 1.5;
  
  @media (max-width: 480px) {
    padding: 12px;
    font-size: 15px;
    min-height: 120px;
  }
  
  &::placeholder {
    color: var(--text-tertiary, #999);
  }
`;

const FormattingButtons = styled.div`
  display: flex;
  gap: 8px;
  margin-top: 16px;
  padding: 12px;
  background: var(--bg-secondary, #f5f5f5);
  border-radius: 12px;
  
  @media (max-width: 480px) {
    gap: 6px;
    padding: 10px;
  }
`;

const FormatButton = styled.button`
  background: var(--bg-primary, white);
  border: none;
  border-radius: 8px;
  padding: 8px 12px;
  font-size: 16px;
  font-weight: bold;
  color: var(--text-primary, #000);
  cursor: pointer;
  transition: all 0.2s;
  
  @media (max-width: 480px) {
    padding: 6px 10px;
    font-size: 14px;
  }
  
  &:active {
    background: var(--bg-tertiary, #e8e8e8);
  }
`;

const AttachmentSection = styled.div`
  margin-top: 16px;
  
  @media (max-width: 480px) {
    margin-top: 12px;
  }
`;

const AttachmentGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
  
  @media (max-width: 480px) {
    gap: 6px;
  }
`;

const AttachmentButton = styled.button`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 10px;
  background: var(--bg-secondary, #f5f5f5);
  border: 1px solid ${props => props.color || 'var(--border-color, #e0e0e0)'};
  color: ${props => props.color || 'var(--text-primary, #333)'};
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 13px;
  font-weight: 600;
  min-height: 40px;
  
  span {
    flex: 1;
    min-width: 0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  
  @media (max-width: 480px) {
    padding: 6px 8px;
    font-size: 12px;
    gap: 5px;
    min-height: 36px;
  }
  
  &:active {
    opacity: 0.8;
    transform: scale(0.98);
  }
`;

const AttachmentIcon = styled.div`
  font-size: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
  
  @media (max-width: 480px) {
    font-size: 16px;
  }
`;

const HiddenFileInput = styled.input`
  display: none;
`;

const PreviewImage = styled.div`
  margin-top: 16px;
  position: relative;
  border-radius: 12px;
  overflow: hidden;
  background: var(--bg-secondary, #f5f5f5);
  
  img {
    width: 100%;
    height: auto;
    display: block;
  }
`;

const RemoveImageButton = styled.button`
  position: absolute;
  top: 8px;
  right: 8px;
  background: rgba(0, 0, 0, 0.7);
  color: white;
  border: none;
  border-radius: 50%;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 20px;
  
  &:active {
    opacity: 0.8;
  }
`;

const CreatePostPage = ({ onBack, user: userProp, onPostCreated }) => {
  const authContext = useContext(AuthContext);
  const user = authContext?.user || userProp;
  
  const [postContent, setPostContent] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef(null);
  
  const getAvatarColor = useCallback((name) => {
    if (!name) return 'linear-gradient(135deg, #0068ff 0%, #00a651 100%)';
    const colors = [
      'linear-gradient(135deg, #0068ff 0%, #00a651 100%)',
      'linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%)',
      'linear-gradient(135deg, #4834d4 0%, #686de0 100%)',
    ];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  }, []);

  const handleContentChange = (e) => {
    setPostContent(e.target.value);
  };

  const handleImageSelect = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Vui lòng chọn file ảnh!');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('Kích thước ảnh không được vượt quá 5MB!');
      return;
    }

    setSelectedImage(file);
  };

  const handleRemoveImage = () => {
    setSelectedImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async () => {
    if (!postContent.trim() && !selectedImage) {
      alert('Vui lòng nhập nội dung hoặc chọn ảnh!');
      return;
    }

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('content', postContent.trim());
      
      if (selectedImage) {
        formData.append('image', selectedImage);
      }
      
      formData.append('type', selectedImage ? 'image' : 'text');
      formData.append('privacy', 'public');

      const API_BASE_URL = getApiBaseUrl();
      const uploadUrl = `${API_BASE_URL}/newsfeed/posts`;

      const response = await fetch(uploadUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });

      if (!response.ok) {
        throw new Error('Failed to create post');
      }

      const data = await response.json();
      
      if (onPostCreated) {
        onPostCreated(data);
      }
      
      // Reset form
      setPostContent('');
      setSelectedImage(null);
      onBack();
      
      alert('✅ Đăng bài viết thành công!');
    } catch (error) {
      console.error('Error creating post:', error);
      alert('❌ Có lỗi xảy ra khi đăng bài viết');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isPostButtonDisabled = !postContent.trim() && !selectedImage || isSubmitting;

  return (
    <CreatePostContainer>
      <Header>
        <HeaderLeft>
          <BackButton onClick={onBack}>
            <FiChevronLeft size={24} />
          </BackButton>
          <HeaderTitle>Tạo bài viết</HeaderTitle>
        </HeaderLeft>
        <PostButton 
          onClick={handleSubmit}
          disabled={isPostButtonDisabled}
        >
          Đăng
        </PostButton>
      </Header>

      <Content>
        <UserInfo>
          <UserAvatar gradient={getAvatarColor(user?.full_name || user?.fullName)}>
            {user?.avatar_url ? (
              <img src={getAvatarURL(user.avatar_url)} alt={user?.full_name || 'Avatar'} />
            ) : (
              getInitials(user?.full_name || user?.fullName)
            )}
          </UserAvatar>
          <UserDetails>
            <UserName>{user?.full_name || user?.fullName || 'Người dùng'}</UserName>
            <TimelineBadge>
              <FiCalendar size={14} />
              Dòng thời gian của bạn
            </TimelineBadge>
          </UserDetails>
        </UserInfo>

        <TextInput
          placeholder="Bạn đang nghĩ gì?"
          value={postContent}
          onChange={handleContentChange}
        />

        {selectedImage && (
          <PreviewImage>
            <img src={URL.createObjectURL(selectedImage)} alt="Preview" />
            <RemoveImageButton onClick={handleRemoveImage}>
              ×
            </RemoveImageButton>
          </PreviewImage>
        )}

        <FormattingButtons>
          <FormatButton>B</FormatButton>
          <FormatButton>I</FormatButton>
          <FormatButton>H1 H2</FormatButton>
        </FormattingButtons>

        <AttachmentSection>
          <AttachmentGrid>
            <AttachmentButton 
              color="#4CAF50"
              onClick={() => fileInputRef.current?.click()}
            >
              <AttachmentIcon>🖼️</AttachmentIcon>
              <span>Hình ảnh / Video</span>
            </AttachmentButton>
            
            <AttachmentButton color="#FF9500">
              <AttachmentIcon>🎬</AttachmentIcon>
              <span>GIF</span>
            </AttachmentButton>
            
            <AttachmentButton color="#0068ff">
              <AttachmentIcon>🏷️</AttachmentIcon>
              <span>Gắn thẻ</span>
            </AttachmentButton>
            
            <AttachmentButton color="#FF9500">
              <AttachmentIcon>📎</AttachmentIcon>
              <span>File</span>
            </AttachmentButton>
          </AttachmentGrid>
        </AttachmentSection>
      </Content>

      <HiddenFileInput
        ref={fileInputRef}
        type="file"
        accept="image/*,video/*"
        onChange={handleImageSelect}
      />
    </CreatePostContainer>
  );
};

export default CreatePostPage;

