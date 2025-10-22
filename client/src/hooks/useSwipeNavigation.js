import { useState, useCallback } from 'react';

const useSwipeNavigation = (currentView, navigationStack = []) => {
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartX, setDragStartX] = useState(0);
  const [dragStartY, setDragStartY] = useState(0);
  const [dragCurrentX, setDragCurrentX] = useState(0);

  // Định nghĩa navigation rules dựa trên current view
  const getNavigationTarget = useCallback((view) => {
    const navigationRules = {
      // Chat views
      'chat': {
        target: 'sidebar',
        action: 'goToSidebar',
        description: 'Quay lại danh sách tin nhắn'
      },
      'conversation': {
        target: 'sidebar', 
        action: 'goToSidebar',
        description: 'Quay lại danh sách tin nhắn'
      },
      
      // Profile views
      'profile': {
        target: 'sidebar',
        action: 'goToSidebar', 
        description: 'Quay lại danh sách tin nhắn'
      },
      'personal-profile': {
        target: 'sidebar',
        action: 'goToSidebar',
        description: 'Quay lại danh sách tin nhắn'
      },
      
      // Friends views
      'friends': {
        target: 'sidebar',
        action: 'goToSidebar',
        description: 'Quay lại danh sách tin nhắn'
      },
      'friends-list': {
        target: 'friends',
        action: 'goToFriends',
        description: 'Quay lại danh bạ'
      },
      
      // NewsFeed views
      'newsfeed': {
        target: 'sidebar',
        action: 'goToSidebar',
        description: 'Quay lại danh sách tin nhắn'
      },
      
      // Search views
      'user-search': {
        target: 'sidebar',
        action: 'goToSidebar',
        description: 'Quay lại danh sách tin nhắn'
      },
      
      // Notification views
      'notifications': {
        target: 'sidebar',
        action: 'goToSidebar',
        description: 'Quay lại danh sách tin nhắn'
      },
      
      // Default fallback
      'default': {
        target: 'sidebar',
        action: 'goToSidebar',
        description: 'Quay lại danh sách tin nhắn'
      }
    };

    return navigationRules[view] || navigationRules['default'];
  }, []);

  // Xử lý touch start
  const handleTouchStart = useCallback((e) => {
    const touch = e.touches[0];
    setIsDragging(true);
    setDragStartX(touch.clientX);
    setDragStartY(touch.clientY);
    setDragCurrentX(touch.clientX);
  }, []);

  // Xử lý touch move
  const handleTouchMove = useCallback((e) => {
    if (!isDragging) return;
    
    const currentX = e.touches[0].clientX;
    const currentY = e.touches[0].clientY;
    const deltaX = currentX - dragStartX;
    const deltaY = currentY - dragStartY;
    
    // Chỉ xử lý swipe ngang nếu độ lệch ngang lớn hơn độ lệch dọc
    const isHorizontalSwipe = Math.abs(deltaX) > Math.abs(deltaY);
    
    // Chỉ cho phép vuốt sang phải (positive deltaX) và là swipe ngang
    if (deltaX > 0 && isHorizontalSwipe) {
      setDragCurrentX(currentX);
      const offset = Math.min(deltaX, 100); // Giới hạn khoảng cách vuốt
      setSwipeOffset(offset);
      
      // Ngăn scroll khi swipe ngang
      if (deltaX > 10) {
        e.preventDefault();
      }
    }
  }, [isDragging, dragStartX, dragStartY]);

  // Xử lý touch end và thực hiện navigation
  const handleTouchEnd = useCallback((e, onNavigate) => {
    if (!isDragging) return;
    
    const deltaX = dragCurrentX - dragStartX;
    
    // Nếu vuốt đủ xa (threshold 50px)
    if (deltaX > 50) {
      const navigationTarget = getNavigationTarget(currentView);
      
      console.log(`Swipe navigation: ${currentView} -> ${navigationTarget.target}`);
      console.log(`Action: ${navigationTarget.action}`);
      console.log(`Description: ${navigationTarget.description}`);
      
      // Thực hiện navigation dựa trên action
      if (onNavigate && navigationTarget.action) {
        onNavigate(navigationTarget.action, navigationTarget.target);
      }
    }
    
    // Reset swipe state
    setSwipeOffset(0);
    setIsDragging(false);
    setDragStartX(0);
    setDragCurrentX(0);
  }, [isDragging, dragCurrentX, dragStartX, currentView, getNavigationTarget]);

  // Reset swipe state
  const resetSwipe = useCallback(() => {
    setSwipeOffset(0);
    setIsDragging(false);
    setDragStartX(0);
    setDragStartY(0);
    setDragCurrentX(0);
  }, []);

  return {
    swipeOffset,
    isDragging,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    resetSwipe,
    getNavigationTarget: () => getNavigationTarget(currentView)
  };
};

export default useSwipeNavigation;
