import React from 'react';
import styled from 'styled-components';
import { FiSearch } from 'react-icons/fi';
import { BsQrCodeScan, BsPencilSquare } from 'react-icons/bs';

const TopBar = styled.div`
  background: var(--header-bg, #0084ff);
  padding: 8px 12px;
  padding-top: calc(env(safe-area-inset-top, 0px) + 8px);
  display: flex;
  align-items: center;
  justify-content: space-between;
  color: white;
  position: sticky;
  top: 0;
  z-index: 100;
  flex-shrink: 0;
`;

const SearchSection = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 20px;
  padding: 8px 12px;
  min-height: 40px;
  max-width: calc(100% - 120px);
`;

const SearchInput = styled.input`
  flex: 1;
  background: none;
  border: none;
  padding: 0;
  color: white;
  font-size: 15px;
  outline: none;
  -webkit-appearance: none;

  &::placeholder {
    color: rgba(255, 255, 255, 0.7);
  }
`;

const SearchIcon = styled.div`
  color: rgba(255, 255, 255, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  font-size: 18px;
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 8px;
  margin-left: 8px;
  flex-shrink: 0;
  align-items: center;
`;

const ActionButton = styled.button`
  background: none;
  border: none;
  padding: 8px;
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: background 0.2s ease;
  min-width: 44px;
  min-height: 44px;
  -webkit-tap-highlight-color: transparent;
  flex-shrink: 0;

  &:active {
    background: rgba(255, 255, 255, 0.2);
    opacity: 0.7;
    transform: scale(0.95);
  }
`;

const MobileTopBar = ({ searchTerm, onSearchChange, onNewMessage, onQRScan }) => {
  return (
    <TopBar>
      <SearchSection>
        <SearchIcon>
          <FiSearch size={18} />
        </SearchIcon>
        <SearchInput
          type="text"
          placeholder="Tìm kiếm cuộc trò chuyện..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </SearchSection>
      <ActionButtons>
        <ActionButton onClick={onNewMessage} title="Tạo cuộc trò chuyện mới">
          <BsPencilSquare size={20} />
        </ActionButton>
        <ActionButton onClick={onQRScan} title="Quét QR đăng nhập PC">
          <BsQrCodeScan size={20} />
        </ActionButton>
      </ActionButtons>
    </TopBar>
  );
};

export default MobileTopBar;

