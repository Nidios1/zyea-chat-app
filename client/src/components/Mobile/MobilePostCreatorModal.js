import React, { useState, useRef } from 'react';
import styled from 'styled-components';
import { FiX, FiImage, FiCamera, FiSmile, FiSettings } from 'react-icons/fi';
import { newsfeedAPI } from '../../utils/api';

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: flex-end;
  z-index: 2000;
  animation: fadeIn 0.2s ease;

  @keyframes fadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }
`;

const ModalContainer = styled.div`
  width: 100%;
  max-height: 90vh;
  background: #1a1a1a;
  border-radius: 20px 20px 0 0;
  display: flex;
  flex-direction: column;
  animation: slideUp 0.3s ease;

  @keyframes slideUp {
    from {
      transform: translateY(100%);
    }
    to {
      transform: translateY(0);
    }
  }
`;

const ModalHeader = styled.div`
  padding: 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid #3a3a3a;
`;

const CloseButton = styled.button`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: #2a2a2a;
  border: none;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  
  &:active {
    background: #3a3a3a;
  }
`;

const HeaderTitle = styled.div`
  font-size: 18px;
  font-weight: 700;
  color: #fff;
  flex: 1;
  text-align: center;
`;

const PostButton = styled.button`
  padding: 8px 20px;
  background: #00a651;
  color: white;
  border: none;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  min-width: 60px;
  
  &:active {
    opacity: 0.8;
  }
  
  &:disabled {
    background: #3a3a3a;
    color: #999;
    cursor: not-allowed;
  }
`;

const ModalContent = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 16px;
`;

const UserInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
`;

const UserAvatar = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: linear-gradient(135deg, #0068ff 0%, #00a651 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 600;
  font-size: 16px;
  overflow: hidden;
`;

const UserName = styled.div`
  font-size: 16px;
  font-weight: 600;
  color: #fff;
`;

const TextArea = styled.textarea`
  width: 100%;
  min-height: 150px;
  background: #2a2a2a;
  border: none;
  border-radius: 12px;
  padding: 12px;
  font-size: 16px;
  color: #fff;
  outline: none;
  resize: none;
  font-family: inherit;
  
  &::placeholder {
    color: #999;
  }
`;

const ImagePreview = styled.div`
  position: relative;
  margin-top: 16px;
  border-radius: 12px;
  overflow: hidden;
`;

const PreviewImage = styled.img`
  width: 100%;
  height: auto;
  max-height: 300px;
  object-fit: contain;
  border-radius: 12px;
`;

const RemoveImageButton = styled.button`
  position: absolute;
  top: 8px;
  right: 8px;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.6);
  border: none;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  
  &:active {
    background: rgba(0, 0, 0, 0.8);
  }
`;

const ModalFooter = styled.div`
  padding: 16px;
  border-top: 1px solid #3a3a3a;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 12px;
`;

const ActionButton = styled.button`
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: #2a2a2a;
  border: none;
  color: #00a651;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 20px;
  
  &:active {
    background: #3a3a3a;
  }
`;

const HiddenFileInput = styled.input`
  display: none;
`;

const AudienceButton = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: #2a2a2a;
  border-radius: 20px;
  font-size: 14px;
  color: #999;
  cursor: pointer;
  
  &:active {
    background: #3a3a3a;
  }
`;

const MobilePostCreatorModal = ({ isOpen, onClose, currentUser, onPostCreated }) => {
  const [postContent, setPostContent] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [isPosting, setIsPosting] = useState(false);
  const [audience, setAudience] = useState('public');
  const fileInputRef = useRef(null);

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('Kích thước ảnh không được vượt quá 5MB');
        return;
      }
      
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handlePost = async () => {
    if (!postContent.trim() && !selectedImage) {
      alert('Vui lòng nhập nội dung hoặc thêm ảnh');
      return;
    }

    setIsPosting(true);
    try {
      const postData = {
        content: postContent,
        type: selectedImage ? 'image' : 'text',
        privacy: audience,
        image: selectedImage
      };

      await newsfeedAPI.createPost(postData);
      
      // Reset form
      setPostContent('');
      setSelectedImage(null);
      setImagePreview(null);
      
      onPostCreated?.();
      onClose();
    } catch (error) {
      console.error('Error creating post:', error);
      alert('Có lỗi xảy ra khi đăng bài');
    } finally {
      setIsPosting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <ModalOverlay onClick={(e) => e.target === e.currentTarget && onClose()}>
      <ModalContainer>
        <ModalHeader>
          <CloseButton onClick={onClose}>
            <FiX size={20} />
          </CloseButton>
          <HeaderTitle>Tạo bài viết</HeaderTitle>
          <PostButton 
            onClick={handlePost}
            disabled={isPosting || (!postContent.trim() && !selectedImage)}
          >
            {isPosting ? 'Đang đăng...' : 'Đăng'}
          </PostButton>
        </ModalHeader>

        <ModalContent>
          <UserInfo>
            <UserAvatar>
              {currentUser?.avatar_url ? (
                <img 
                  src={currentUser.avatar_url} 
                  alt={currentUser.full_name}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                (currentUser?.full_name || 'U').charAt(0).toUpperCase()
              )}
            </UserAvatar>
            <UserName>{currentUser?.full_name || 'Người dùng'}</UserName>
          </UserInfo>

          <TextArea
            placeholder="Bạn đang nghĩ gì?"
            value={postContent}
            onChange={(e) => setPostContent(e.target.value)}
            autoFocus
          />

          {imagePreview && (
            <ImagePreview>
              <PreviewImage src={imagePreview} alt="Preview" />
              <RemoveImageButton onClick={handleRemoveImage}>
                <FiX size={16} />
              </RemoveImageButton>
            </ImagePreview>
          )}
        </ModalContent>

        <ModalFooter>
          <ActionButtons>
            <ActionButton onClick={() => fileInputRef.current?.click()}>
              <FiImage />
            </ActionButton>
            <ActionButton onClick={() => {}}>
              <FiCamera />
            </ActionButton>
            <ActionButton onClick={() => {}}>
              <FiSmile />
            </ActionButton>
          </ActionButtons>
          
          <AudienceButton onClick={() => {}}>
            <FiSettings size={16} />
            Công khai
          </AudienceButton>
        </ModalFooter>

        <HiddenFileInput
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleImageSelect}
        />
      </ModalContainer>
    </ModalOverlay>
  );
};

export default MobilePostCreatorModal;

