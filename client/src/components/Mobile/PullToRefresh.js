import React, { useState, useRef, useEffect } from 'react';
import styled, { keyframes } from 'styled-components';

// Animation đơn giản và mượt
const rotate = keyframes`
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
`;

const fadeIn = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`;

const scaleIn = keyframes`
  from { transform: scale(0.8); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
`;

const PullToRefreshContainer = styled.div`
  position: relative;
  height: 100%;
  overflow: hidden;
`;

const PullIndicator = styled.div`
  position: absolute;
  top: -60px;
  left: 0;
  right: 0;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-primary, #ffffff);
  transform: translateY(${props => Math.min(props.pullDistance, 60)}px);
  transition: ${props => props.isPulling ? 'none' : 'transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)'};
  z-index: 999;
  box-shadow: ${props => props.pullDistance > 5 
    ? '0 2px 4px var(--shadow-color, rgba(0, 0, 0, 0.08))' 
    : 'none'
  };
`;

const LoaderWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  animation: ${scaleIn} 0.3s ease-out;
`;

// Spinner giống Zalo/Facebook
const Spinner = styled.div`
  width: 24px;
  height: 24px;
  border: 2.5px solid var(--border-color, #e4e6eb);
  border-top-color: var(--primary-color, #0084ff);
  border-radius: 50%;
  animation: ${rotate} 0.8s linear infinite;
  opacity: ${props => props.isRefreshing ? 1 : Math.min(props.pullProgress * 1.5, 1)};
  transform: ${props => props.isRefreshing 
    ? 'rotate(0deg)' 
    : `rotate(${props.pullProgress * 180}deg)`
  };
  transition: ${props => props.isRefreshing ? 'none' : 'transform 0.2s ease-out'};
`;

// Text đơn giản
const RefreshText = styled.div`
  font-size: 14px;
  color: var(--text-secondary, #65676b);
  font-weight: 500;
  opacity: ${props => Math.min(props.pullProgress * 1.2, 1)};
  transition: opacity 0.2s ease;
  animation: ${fadeIn} 0.3s ease-out;
`;

const ContentWrapper = styled.div`
  height: 100%;
  transform: translateY(${props => Math.min(props.pullDistance, 60)}px);
  transition: ${props => props.isPulling ? 'none' : 'transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)'};
  overflow-y: auto;
  overflow-x: hidden;
  -webkit-overflow-scrolling: touch;
`;

const PullToRefresh = ({ 
  children, 
  onRefresh, 
  threshold = 60,
  disabled = false
}) => {
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isPulling, setIsPulling] = useState(false);
  const [startY, setStartY] = useState(0);
  const containerRef = useRef(null);
  const contentRef = useRef(null);

  useEffect(() => {
    const contentElement = contentRef.current;
    if (!contentElement) return;

    const handleTouchStart = (e) => {
      if (disabled || isRefreshing) return;
      
      const touch = e.touches[0];
      
      if (contentElement.scrollTop === 0) {
        setStartY(touch.clientY);
      }
    };

    const handleTouchMove = (e) => {
      if (disabled || isRefreshing || startY === 0) return;

      const touch = e.touches[0];
      const deltaY = touch.clientY - startY;
      
      if (contentElement.scrollTop === 0 && deltaY > 0) {
        e.preventDefault();
        setIsPulling(true);
        
        // Resistance effect như iOS
        const resistance = 0.4;
        const maxDistance = 80;
        const distance = Math.min(deltaY * resistance, maxDistance);
        
        setPullDistance(distance);
      }
    };

    const handleTouchEnd = () => {
      if (disabled || isRefreshing || !isPulling) return;

      if (pullDistance >= threshold) {
        setIsRefreshing(true);
        setPullDistance(60);
        
        if (onRefresh) {
          Promise.resolve(onRefresh())
            .then(() => {
              console.log('✅ Refresh done');
            })
            .catch((error) => {
              console.error('❌ Refresh error:', error);
            })
            .finally(() => {
              setTimeout(() => {
                setIsRefreshing(false);
                setPullDistance(0);
                setIsPulling(false);
              }, 500);
            });
        } else {
          setTimeout(() => {
            setIsRefreshing(false);
            setPullDistance(0);
            setIsPulling(false);
          }, 1000);
        }
      } else {
        setPullDistance(0);
        setIsPulling(false);
      }
      
      setStartY(0);
    };

    contentElement.addEventListener('touchstart', handleTouchStart, { passive: true });
    contentElement.addEventListener('touchmove', handleTouchMove, { passive: false });
    contentElement.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      contentElement.removeEventListener('touchstart', handleTouchStart);
      contentElement.removeEventListener('touchmove', handleTouchMove);
      contentElement.removeEventListener('touchend', handleTouchEnd);
    };
  }, [disabled, isRefreshing, isPulling, pullDistance, threshold, startY, onRefresh]);

  const pullProgress = Math.min(pullDistance / threshold, 1);

  const getText = () => {
    if (isRefreshing) return 'Đang làm mới...';
    if (pullDistance >= threshold) return 'Thả để làm mới';
    return 'Kéo để làm mới';
  };

  return (
    <PullToRefreshContainer ref={containerRef}>
      <PullIndicator 
        pullDistance={pullDistance}
        isPulling={isPulling}
      >
        {(pullDistance > 10 || isRefreshing) && (
          <LoaderWrapper>
            <Spinner 
              isRefreshing={isRefreshing} 
              pullProgress={pullProgress}
            />
            <RefreshText pullProgress={pullProgress}>
              {getText()}
            </RefreshText>
          </LoaderWrapper>
        )}
      </PullIndicator>
      
      <ContentWrapper 
        ref={contentRef}
        pullDistance={pullDistance}
        isPulling={isPulling}
        style={{ touchAction: 'pan-y' }}
      >
        {children}
      </ContentWrapper>
    </PullToRefreshContainer>
  );
};

export default PullToRefresh;
