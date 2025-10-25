import React, { useState, useRef, useEffect } from 'react';
import styled, { keyframes } from 'styled-components';

const ReactionBarContainer = styled.div`
  position: relative;
  display: inline-block;
  
  @media (max-width: 768px) {
    display: flex;
    justify-content: center;
    width: 100%;
  }
`;

const ReactionBar = styled.div`
  position: absolute;
  bottom: 100%;
  left: 50%;
  transform: translateX(-50%);
  background: white;
  border-radius: 25px;
  padding: 8px 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  border: 1px solid #e1e5e9;
  display: flex;
  align-items: center;
  gap: 8px;
  z-index: 1000;
  opacity: ${props => props.visible ? 1 : 0};
  visibility: ${props => props.visible ? 'visible' : 'hidden'};
  transition: all 0.2s ease;
  margin-bottom: 8px;
  /* Scroll indicators */
  &::-webkit-scrollbar {
    height: 4px;
  }
  
  &::-webkit-scrollbar-track {
    background: transparent;
  }
  
  &::-webkit-scrollbar-thumb {
    background: rgba(0, 0, 0, 0.2);
    border-radius: 2px;
  }
  
  /* Mobile optimizations */
  @media (max-width: 768px) {
    padding: 6px 10px;
    gap: 6px;
    border-radius: 18px;
    margin-bottom: 6px;
    /* Ensure it's above mobile navigation */
    z-index: 1001;
    /* Moderate size for mobile */
    transform: translateX(-50%) scale(0.9);
    transform-origin: center bottom;
    /* Enable horizontal scroll */
    overflow-x: auto;
    max-width: 90vw;
    -webkit-overflow-scrolling: touch;
    /* Center alignment */
    display: flex;
    justify-content: center;
    align-items: center;
  }
  
  &::after {
    content: '';
    position: absolute;
    top: 100%;
    left: 50%;
    transform: translateX(-50%);
    width: 0;
    height: 0;
    border-left: 6px solid transparent;
    border-right: 6px solid transparent;
    border-top: 6px solid white;
    
    @media (max-width: 768px) {
      border-left: 4px solid transparent;
      border-right: 4px solid transparent;
      border-top: 4px solid white;
    }
  }
`;

const ReactionItem = styled.button`
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  padding: 4px;
  border-radius: 50%;
  transition: all 0.2s ease;
  transform: scale(1);
  touch-action: manipulation;
  
  &:hover {
    transform: scale(1.3);
    background: rgba(0, 0, 0, 0.05);
  }
  
  &:active {
    transform: scale(1.1);
  }
  
  /* Mobile optimizations */
  @media (max-width: 768px) {
    font-size: 18px;
    padding: 5px;
    min-width: 32px;
    min-height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0; /* Prevent shrinking in scroll container */
    
    &:hover {
      transform: scale(1.1);
    }
    
    &:active {
      transform: scale(1.05);
    }
  }
  
  /* Touch device optimizations */
  @media (hover: none) and (pointer: coarse) {
    &:hover {
      transform: scale(1);
    }
    
    &:active {
      transform: scale(1.1);
      background: rgba(0, 0, 0, 0.1);
    }
  }
`;

const bounce = keyframes`
  0%, 20%, 50%, 80%, 100% {
    transform: translateY(0) scale(1);
  }
  40% {
    transform: translateY(-10px) scale(1.1);
  }
  60% {
    transform: translateY(-5px) scale(1.05);
  }
`;

const ReactionAnimation = styled.div`
  animation: ${bounce} 0.6s ease;
`;

const ReactionBarComponent = ({ 
  onReaction, 
  currentReaction, 
  isVisible, 
  onMouseEnter, 
  onMouseLeave 
}) => {
  const [showAnimation, setShowAnimation] = useState(false);
  const timeoutRef = useRef(null);

  const reactions = [
    { emoji: '❤️', type: 'love', label: 'Yêu thích' },
    { emoji: '😍', type: 'adore', label: 'Thích thú' },
    { emoji: '😂', type: 'laugh', label: 'Cười' },
    { emoji: '😮', type: 'wow', label: 'Wow' },
    { emoji: '😭', type: 'sad', label: 'Buồn' },
    { emoji: '😡', type: 'angry', label: 'Tức giận' }
  ];

  const handleReactionClick = (reaction) => {
    setShowAnimation(true);
    onReaction(reaction);
    
    // Reset animation after delay
    setTimeout(() => setShowAnimation(false), 600);
  };

  const handleMouseEnter = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    onMouseEnter();
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      onMouseLeave();
    }, 300); // Delay before hiding
  };

  const handleTouchStart = (e) => {
    e.preventDefault();
    onMouseEnter();
  };

  const handleTouchEnd = (e) => {
    e.preventDefault();
    // Don't hide immediately on touch end for mobile
    setTimeout(() => {
      onMouseLeave();
    }, 2000); // Increased delay for mobile
  };

  useEffect(() => {
    // Add/remove body class for mobile optimization
    if (isVisible) {
      document.body.classList.add('reaction-bar-open');
    } else {
      document.body.classList.remove('reaction-bar-open');
    }
    
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      document.body.classList.remove('reaction-bar-open');
    };
  }, [isVisible]);

  return (
    <ReactionBarContainer
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <ReactionBar 
        visible={isVisible}
        className={isVisible ? 'reaction-bar-mobile' : ''}
      >
        {reactions.map((reaction, index) => (
          <ReactionItem
            key={reaction.type}
            onClick={() => handleReactionClick(reaction)}
            title={reaction.label}
            style={{
              animationDelay: `${index * 0.1}s`,
              transform: showAnimation && currentReaction?.type === reaction.type 
                ? 'scale(1.2)' 
                : 'scale(1)'
            }}
          >
            {reaction.emoji}
          </ReactionItem>
        ))}
      </ReactionBar>
    </ReactionBarContainer>
  );
};

export default ReactionBarComponent;
