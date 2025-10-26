import React, { useState, useEffect, useRef } from 'react';
import styled, { keyframes } from 'styled-components';

// Animations đơn giản
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
  min-height: 100vh;
`;

const PullIndicator = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: ${props => Math.min(props.pullDistance, 60)}px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-primary, #ffffff);
  transform: translateY(-${props => Math.min(props.pullDistance, 60)}px);
  transition: ${props => props.isPulling ? 'none' : 'transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)'};
  z-index: 1000;
  box-shadow: ${props => props.pullDistance > 5 
    ? '0 2px 4px var(--shadow-color, rgba(0, 0, 0, 0.08))' 
    : 'none'
  };
  border-bottom: 1px solid var(--border-color, #e4e6eb);
`;

const LoaderWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  animation: ${scaleIn} 0.3s ease-out;
`;

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

const RefreshText = styled.div`
  font-size: 14px;
  color: var(--text-secondary, #65676b);
  font-weight: 500;
  opacity: ${props => Math.min(props.pullProgress * 1.2, 1)};
  transition: opacity 0.2s ease;
  animation: ${fadeIn} 0.3s ease-out;
`;

const ContentWrapper = styled.div`
  transform: translateY(${props => Math.min(props.pullDistance, 60)}px);
  transition: ${props => props.isPulling ? 'none' : 'transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)'};
`;

const PullToRefresh = ({ onRefresh, children, threshold = 60, disabled = false }) => {
  const [isPulling, setIsPulling] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [startY, setStartY] = useState(0);
  
  const containerRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || disabled) return;

    const handleTouchStart = (e) => {
      if (window.scrollY === 0) {
        setStartY(e.touches[0].clientY);
      }
    };

    const handleTouchMove = (e) => {
      if (isRefreshing || startY === 0) return;

      const currentTouchY = e.touches[0].clientY;
      const deltaY = currentTouchY - startY;
      
      if (window.scrollY === 0 && deltaY > 0) {
        const resistance = 0.4;
        const distance = Math.min(deltaY * resistance, 80);
        
        setPullDistance(distance);
        setIsPulling(true);
        
        if (distance > 10) {
          e.preventDefault();
        }
      }
    };

    const handleTouchEnd = async () => {
      if (isRefreshing || !isPulling) return;

      if (pullDistance >= threshold) {
        setIsRefreshing(true);
        setPullDistance(60);
        
        try {
          console.log('🔄 Refreshing...');
          await Promise.resolve(onRefresh());
          console.log('✅ Done');
        } catch (error) {
          console.error('❌ Error:', error);
        } finally {
          setTimeout(() => {
            setIsRefreshing(false);
            setPullDistance(0);
            setIsPulling(false);
          }, 500);
        }
      } else {
        setPullDistance(0);
        setIsPulling(false);
      }
      
      setStartY(0);
    };

    container.addEventListener('touchstart', handleTouchStart, { passive: true });
    container.addEventListener('touchmove', handleTouchMove, { passive: false });
    container.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isPulling, pullDistance, startY, isRefreshing, onRefresh, threshold, disabled]);

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
        pullDistance={pullDistance}
        isPulling={isPulling}
      >
        {children}
      </ContentWrapper>
    </PullToRefreshContainer>
  );
};

export default PullToRefresh;
