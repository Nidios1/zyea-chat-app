import React from 'react';
import styled from 'styled-components';

const EmojiPickerContainer = styled.div`
  position: absolute;
  bottom: 100%;
  left: 0;
  margin-bottom: 0.5rem;
  background: white;
  border-radius: 12px;
  padding: 1rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 100;
  width: 300px;
  max-height: 200px;
  overflow-y: auto;
`;

const EmojiGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(8, 1fr);
  gap: 0.5rem;
`;

const EmojiButton = styled.button`
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  padding: 0.25rem;
  border-radius: 4px;
  transition: background 0.2s ease;

  &:hover {
    background: #f5f5f5;
  }
`;

const emojis = [
  '😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣',
  '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰',
  '😘', '😗', '😙', '😚', '😋', '😛', '😝', '😜',
  '🤪', '🤨', '🧐', '🤓', '😎', '🤩', '🥳', '😏',
  '😒', '😞', '😔', '😟', '😕', '🙁', '☹️', '😣',
  '😖', '😫', '😩', '🥺', '😢', '😭', '😤', '😠',
  '😡', '🤬', '🤯', '😳', '🥵', '🥶', '😱', '😨',
  '👍', '👎', '👌', '✌️', '🤞', '🤟', '🤘', '🤙',
  '👏', '🙌', '👐', '🤲', '🙏', '✍️', '💪', '🦾',
  '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍'
];

const EmojiPicker = ({ onEmojiSelect, isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <EmojiPickerContainer onClick={(e) => e.stopPropagation()}>
      <EmojiGrid>
        {emojis.map((emoji, index) => (
          <EmojiButton
            key={index}
            type="button"
            onClick={() => onEmojiSelect(emoji)}
          >
            {emoji}
          </EmojiButton>
        ))}
      </EmojiGrid>
    </EmojiPickerContainer>
  );
};

export default EmojiPicker;

