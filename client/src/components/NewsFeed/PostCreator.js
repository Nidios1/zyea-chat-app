import React, { useState, useRef } from 'react';
import styled from 'styled-components';
import { FiImage, FiSmile, FiSend, FiX } from 'react-icons/fi';
import EmojiPicker from '../Chat/EmojiPicker';
import { getInitials } from '../../utils/nameUtils';

const PostCreatorContainer = styled.div`
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  border: 1px solid #e1e5e9;
  width: 100%;
`;

const UserInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1rem;
`;

const UserAvatar = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: ${props => props.color || 'linear-gradient(135deg, #0068ff 0%, #00a651 100%)'};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
  color: white;
  font-weight: 600;
  border: 2px solid white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
`;

const UserName = styled.span`
  font-weight: 600;
  color: #333;
  font-size: 0.9rem;
`;

const InputContainer = styled.div`
  position: relative;
`;

const PostInput = styled.textarea`
  width: 100%;
  min-height: 80px;
  max-height: 150px;
  padding: 1rem;
  border: 1px solid #ddd;
  border-radius: 20px;
  font-size: 1rem;
  resize: none;
  outline: none;
  transition: all 0.2s ease;
  font-family: inherit;
  
  &:focus {
    border-color: #0068ff;
    box-shadow: 0 0 0 2px rgba(0, 104, 255, 0.1);
  }
  
  &::placeholder {
    color: #999;
  }
`;

const ActionsContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 0.75rem;
`;

const MediaActions = styled.div`
  display: flex;
  gap: 0.5rem;
`;

const ActionButton = styled.button`
  width: 44px;
  height: 44px;
  border-radius: 50%;
  border: none;
  background: #f5f5f5;
  color: #666;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  font-size: 1.1rem;
  
  &:hover {
    background: #e0e0e0;
    color: #333;
  }
  
  &.active {
    background: #0068ff;
    color: white;
  }
`;

const PostButton = styled.button`
  padding: 0.75rem 1.5rem;
  background: #0068ff;
  color: white;
  border: none;
  border-radius: 25px;
  font-weight: 600;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  
  &:hover {
    background: #0056cc;
  }
  
  &:disabled {
    background: #ccc;
    cursor: not-allowed;
  }
`;

const ImagePreview = styled.div`
  position: relative;
  margin-top: 0.75rem;
`;

const PreviewImage = styled.img`
  width: 100%;
  max-height: 200px;
  object-fit: cover;
  border-radius: 8px;
`;

const RemoveImageButton = styled.button`
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.6);
  color: white;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.8rem;
  
  &:hover {
    background: rgba(0, 0, 0, 0.8);
  }
`;

const HiddenFileInput = styled.input`
  display: none;
`;

const PostCreator = ({ currentUser, onCreatePost }) => {
  const [content, setContent] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isPosting, setIsPosting] = useState(false);
  const fileInputRef = useRef(null);
  const textareaRef = useRef(null);

  const handleInputChange = (e) => {
    setContent(e.target.value);
    // Auto-resize textarea
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  };

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        alert('Kích thước ảnh không được vượt quá 5MB');
        return;
      }
      
      setSelectedImage(file);
    }
  };

  const handleRemoveImage = () => {
    setSelectedImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleEmojiSelect = (emoji) => {
    setContent(prev => prev + emoji);
    setShowEmojiPicker(false);
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!content.trim() && !selectedImage) {
      return;
    }

    setIsPosting(true);
    
    try {
      const postData = {
        content: content.trim(),
        image: selectedImage ? selectedImage : null,
        type: selectedImage ? 'image' : 'text'
      };
      
      console.log('Submitting post data:', postData);
      await onCreatePost(postData);
      
      // Reset form
      setContent('');
      setSelectedImage(null);
      setShowEmojiPicker(false);
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error('Error creating post:', error);
    } finally {
      setIsPosting(false);
    }
  };

  const getAvatarColor = (name) => {
    if (!name) return 'linear-gradient(135deg, #0068ff 0%, #00a651 100%)';
    
    const colors = [
      'linear-gradient(135deg, #0068ff 0%, #00a651 100%)',
      'linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%)',
      'linear-gradient(135deg, #4834d4 0%, #686de0 100%)',
      'linear-gradient(135deg, #00d2d3 0%, #54a0ff 100%)',
      'linear-gradient(135deg, #ff9ff3 0%, #f368e0 100%)',
      'linear-gradient(135deg, #feca57 0%, #ff9ff3 100%)',
      'linear-gradient(135deg, #48dbfb 0%, #0abde3 100%)',
      'linear-gradient(135deg, #ff6348 0%, #ff4757 100%)',
      'linear-gradient(135deg, #5f27cd 0%, #341f97 100%)',
      'linear-gradient(135deg, #00d2d3 0%, #01a3a4 100%)'
    ];
    
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  };

  return (
    <PostCreatorContainer>
      <UserInfo>
        <UserAvatar color={getAvatarColor(currentUser?.full_name)}>
          {currentUser?.avatar_url ? (
            <img src={currentUser.avatar_url} alt={currentUser.full_name} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
          ) : (
            getInitials(currentUser?.full_name)
          )}
        </UserAvatar>
        <UserName>{currentUser?.full_name || 'Bạn'}</UserName>
      </UserInfo>

      <form onSubmit={handleSubmit}>
        <InputContainer>
          <PostInput
            ref={textareaRef}
            value={content}
            onChange={handleInputChange}
            placeholder="Bạn đang nghĩ gì?"
            rows={1}
          />
        </InputContainer>

        {selectedImage && (
          <ImagePreview>
            <PreviewImage 
              src={URL.createObjectURL(selectedImage)} 
              alt="Preview" 
            />
            <RemoveImageButton onClick={handleRemoveImage}>
              <FiX size={12} />
            </RemoveImageButton>
          </ImagePreview>
        )}

        <ActionsContainer>
          <MediaActions>
            <ActionButton
              type="button"
              onClick={() => fileInputRef.current?.click()}
              title="Thêm ảnh"
            >
              <FiImage size={18} />
            </ActionButton>
            
            <ActionButton
              type="button"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className={showEmojiPicker ? 'active' : ''}
              title="Thêm emoji"
            >
              <FiSmile size={18} />
            </ActionButton>
          </MediaActions>

          <PostButton
            type="submit"
            disabled={(!content.trim() && !selectedImage) || isPosting}
          >
            {isPosting ? 'Đang đăng...' : 'Đăng'}
            <FiSend size={14} />
          </PostButton>
        </ActionsContainer>

        <HiddenFileInput
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleImageSelect}
        />
      </form>

      {showEmojiPicker && (
        <EmojiPicker
          onEmojiSelect={handleEmojiSelect}
          isOpen={showEmojiPicker}
          onClose={() => setShowEmojiPicker(false)}
        />
      )}
    </PostCreatorContainer>
  );
};

export default PostCreator;
