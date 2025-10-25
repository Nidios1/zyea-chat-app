import React, { useRef } from 'react';
import styled from 'styled-components';
import { FiImage, FiX, FiSend } from 'react-icons/fi';

const ImageUploadContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem;
  background: #f5f5f5;
  border-radius: 20px;
  margin-bottom: 0.5rem;
`;

const ImagePreview = styled.div`
  position: relative;
  width: 60px;
  height: 60px;
  border-radius: 8px;
  overflow: hidden;
  background: #e9ecef;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const Image = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
`;

const ImageInfo = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
`;

const ImageName = styled.span`
  font-size: 0.85rem;
  color: #333;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 150px;
`;

const ImageSize = styled.span`
  font-size: 0.75rem;
  color: #666;
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 0.5rem;
  align-items: center;
`;

const ActionButton = styled.button`
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  
  &.cancel {
    background: #ff6b6b;
    color: white;
    
    &:hover {
      background: #ff5252;
      transform: scale(1.05);
    }
  }
  
  &.send {
    background: #0068ff;
    color: white;
    
    &:hover {
      background: #0056cc;
      transform: scale(1.05);
    }
  }
  
  &:active {
    transform: scale(0.95);
  }
`;

const HiddenInput = styled.input`
  display: none;
`;

const UploadButton = styled.button`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: none;
  background: #f5f5f5;
  color: #666;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  
  &:hover {
    background: #e9ecef;
    color: #333;
  }
  
  &:active {
    transform: scale(0.95);
  }
`;

const ImageUpload = ({ onImageSelect, onSendImage, onCancel, selectedImage, showPreview = false }) => {
  const fileInputRef = useRef(null);

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      // Check file type
      if (!file.type.startsWith('image/')) {
        alert('Vui lòng chọn file ảnh');
        return;
      }
      
      // Check file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        alert('Kích thước file quá lớn. Vui lòng chọn file nhỏ hơn 10MB');
        return;
      }
      
      onImageSelect(file);
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (showPreview && selectedImage) {
    return (
      <ImageUploadContainer>
        <ImagePreview>
          <Image src={URL.createObjectURL(selectedImage)} alt="Preview" />
        </ImagePreview>
        <ImageInfo>
          <ImageName>{selectedImage.name}</ImageName>
          <ImageSize>{formatFileSize(selectedImage.size)}</ImageSize>
        </ImageInfo>
        <ActionButtons>
          <ActionButton 
            className="cancel" 
            onClick={onCancel}
            title="Hủy"
          >
            <FiX size={16} />
          </ActionButton>
          <ActionButton 
            className="send" 
            onClick={() => onSendImage(selectedImage)}
            title="Gửi ảnh"
          >
            <FiSend size={16} />
          </ActionButton>
        </ActionButtons>
      </ImageUploadContainer>
    );
  }

  return (
    <>
      <UploadButton onClick={handleUploadClick} title="Gửi ảnh">
        <FiImage size={20} />
      </UploadButton>
      <HiddenInput
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
      />
    </>
  );
};

export default ImageUpload;
