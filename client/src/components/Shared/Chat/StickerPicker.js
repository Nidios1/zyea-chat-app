import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { stickerAPI } from '../../../utils/api';
import { getStickerURL } from '../../../utils/imageUtils';

const StickerPickerContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
`;

const StickerTabs = styled.div`
  display: flex;
  gap: 0.5rem;
  padding: 0.5rem;
  border-bottom: 1px solid #e1e5e9;
  background: #f8f9fa;
  overflow-x: auto;
  
  &::-webkit-scrollbar {
    height: 4px;
  }
  
  &::-webkit-scrollbar-track {
    background: transparent;
  }
  
  &::-webkit-scrollbar-thumb {
    background: #ddd;
    border-radius: 2px;
  }
`;

const StickerTab = styled.button`
  padding: 0.5rem 1rem;
  border: none;
  background: ${props => props.active ? '#0068ff' : 'transparent'};
  color: ${props => props.active ? 'white' : '#666'};
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.85rem;
  font-weight: ${props => props.active ? '600' : '400'};
  white-space: nowrap;
  transition: all 0.2s ease;
  flex-shrink: 0;
  
  &:hover {
    background: ${props => props.active ? '#0056cc' : '#e9ecef'};
  }
`;

const StickerGrid = styled.div`
  flex: 1;
  padding: 1rem;
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 0.5rem;
  overflow-y: auto;
  
  &::-webkit-scrollbar {
    width: 4px;
  }
  
  &::-webkit-scrollbar-track {
    background: transparent;
  }
  
  &::-webkit-scrollbar-thumb {
    background: #ddd;
    border-radius: 2px;
  }
`;

const StickerItem = styled.button`
  width: 100%;
  aspect-ratio: 1;
  border: none;
  background: transparent;
  cursor: pointer;
  border-radius: 8px;
  padding: 0.25rem;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  
  &:hover {
    background: #f0f0f0;
    transform: scale(1.05);
  }
  
  &:active {
    transform: scale(0.95);
  }
`;

const StickerImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: contain;
  border-radius: 4px;
`;

const LoadingContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #666;
  font-size: 0.9rem;
`;

const EmptyContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #999;
  font-size: 0.9rem;
`;

const StickerPicker = ({ onSelectSticker }) => {
  const [stickerPacks, setStickerPacks] = useState([]);
  const [selectedPackIndex, setSelectedPackIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadStickerPacks = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await stickerAPI.getStickerPacks();
        const packs = response.data.packs || [];
        
        // Filter out empty packs
        const availablePacks = packs.filter(pack => 
          pack && pack.stickers && Array.isArray(pack.stickers) && pack.stickers.length > 0
        );
        
        setStickerPacks(availablePacks);
        
        if (availablePacks.length > 0) {
          setSelectedPackIndex(0);
        }
      } catch (err) {
        console.error('Error loading sticker packs:', err);
        setError('Không thể tải sticker packs');
      } finally {
        setLoading(false);
      }
    };

    loadStickerPacks();
  }, []);

  const handleStickerSelect = (packId, stickerIndex, sticker) => {
    console.log('🎨 StickerPicker - handleStickerSelect called:', { packId, stickerIndex, sticker });
    if (onSelectSticker) {
      console.log('🎨 Calling onSelectSticker callback');
      onSelectSticker(packId, stickerIndex, sticker);
    } else {
      console.warn('⚠️ StickerPicker - onSelectSticker callback not provided');
    }
  };

  if (loading) {
    return (
      <StickerPickerContainer>
        <LoadingContainer>Đang tải sticker...</LoadingContainer>
      </StickerPickerContainer>
    );
  }

  if (error) {
    return (
      <StickerPickerContainer>
        <EmptyContainer>{error}</EmptyContainer>
      </StickerPickerContainer>
    );
  }

  if (stickerPacks.length === 0) {
    return (
      <StickerPickerContainer>
        <EmptyContainer>Chưa có sticker pack nào</EmptyContainer>
      </StickerPickerContainer>
    );
  }

  const currentPack = stickerPacks[selectedPackIndex];
  const stickers = currentPack?.stickers || [];

  return (
    <StickerPickerContainer>
      <StickerTabs>
        {stickerPacks.map((pack, index) => (
          <StickerTab
            key={pack.id}
            active={index === selectedPackIndex}
            onClick={() => setSelectedPackIndex(index)}
          >
            {pack.name || pack.title || `Pack ${index + 1}`}
          </StickerTab>
        ))}
      </StickerTabs>
      
      <StickerGrid>
        {stickers.map((sticker, index) => {
          const stickerUrl = getStickerURL(sticker.url || sticker.image_url);
          
          return (
            <StickerItem
              key={sticker.id || index}
              onClick={() => handleStickerSelect(currentPack.id, index, sticker)}
              title={`Sticker ${index + 1}`}
            >
              <StickerImage
                src={stickerUrl}
                alt={`Sticker ${index + 1}`}
                onError={(e) => {
                  console.error('Error loading sticker:', stickerUrl);
                  e.target.style.display = 'none';
                }}
              />
            </StickerItem>
          );
        })}
      </StickerGrid>
    </StickerPickerContainer>
  );
};

export default StickerPicker;

