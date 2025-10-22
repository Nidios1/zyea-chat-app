// Copy Protection Utilities for Mobile PWA
// Chặn copy chữ toàn diện cho mobile và desktop

export const initCopyProtection = () => {
  // Chặn context menu (right-click)
  const preventContextMenu = (e) => {
    e.preventDefault();
    e.stopPropagation();
    return false;
  };

  // Chặn text selection
  const preventSelectStart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    return false;
  };

  // Chặn drag start
  const preventDragStart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    return false;
  };

  // Chặn copy/paste/cut
  const preventCopyPaste = (e) => {
    e.preventDefault();
    e.stopPropagation();
    return false;
  };

  // Chặn keyboard shortcuts
  const preventKeyboardShortcuts = (e) => {
    // Chặn Ctrl+C, Ctrl+V, Ctrl+A, Ctrl+X, Ctrl+S
    if (e.ctrlKey && ['c', 'v', 'a', 'x', 's'].includes(e.key.toLowerCase())) {
      e.preventDefault();
      e.stopPropagation();
      return false;
    }
    
    // Chặn F12 (Developer Tools)
    if (e.key === 'F12') {
      e.preventDefault();
      e.stopPropagation();
      return false;
    }
    
    // Chặn Ctrl+Shift+I (Developer Tools)
    if (e.ctrlKey && e.shiftKey && e.key === 'I') {
      e.preventDefault();
      e.stopPropagation();
      return false;
    }
    
    // Chặn Ctrl+U (View Source)
    if (e.ctrlKey && e.key === 'u') {
      e.preventDefault();
      e.stopPropagation();
      return false;
    }
  };

  // Chặn mobile touch gestures nhưng vẫn cho phép clicks
  const preventTouchGestures = (e) => {
    // Chỉ chặn long press để select text, không chặn normal clicks
    if (e.touches && e.touches.length > 0) {
      // Chỉ chặn nếu là long press (giữ lâu)
      const touch = e.touches[0];
      const target = e.target;
      
      // Cho phép clicks trên buttons, inputs, links
      if (target.tagName === 'BUTTON' || 
          target.tagName === 'INPUT' || 
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.tagName === 'A' ||
          target.closest('button') ||
          target.closest('input') ||
          target.closest('a') ||
          target.getAttribute('role') === 'button' ||
          target.onclick) {
        return; // Không chặn
      }
      
      // Chỉ chặn long press trên text content
      setTimeout(() => {
        if (e.touches && e.touches.length > 0) {
          e.preventDefault();
          e.stopPropagation();
          return false;
        }
      }, 100); // Delay để phân biệt click và long press
    }
  };

  // Thêm tất cả event listeners
  const addEventListeners = () => {
    // Desktop events
    document.addEventListener('contextmenu', preventContextMenu, { passive: false });
    document.addEventListener('selectstart', preventSelectStart, { passive: false });
    document.addEventListener('dragstart', preventDragStart, { passive: false });
    document.addEventListener('copy', preventCopyPaste, { passive: false });
    document.addEventListener('paste', preventCopyPaste, { passive: false });
    document.addEventListener('cut', preventCopyPaste, { passive: false });
    document.addEventListener('keydown', preventKeyboardShortcuts, { passive: false });
    
    // Mobile events - chỉ chặn trên text content, không chặn buttons
    document.addEventListener('touchstart', preventTouchGestures, { passive: true });
    document.addEventListener('touchmove', preventTouchGestures, { passive: true });
    document.addEventListener('touchend', preventTouchGestures, { passive: true });
    
    // Chặn selection bằng CSS nhưng vẫn cho phép tương tác
    document.body.style.userSelect = 'none';
    document.body.style.webkitUserSelect = 'none';
    document.body.style.mozUserSelect = 'none';
    document.body.style.msUserSelect = 'none';
    document.body.style.webkitTouchCallout = 'none';
    document.body.style.webkitTapHighlightColor = 'rgba(0, 0, 0, 0.1)';
    
    // Đảm bảo interactive elements hoạt động
    const interactiveElements = document.querySelectorAll('button, input, textarea, select, a, [role="button"], [onclick]');
    interactiveElements.forEach(el => {
      el.style.pointerEvents = 'auto';
      el.style.touchAction = 'manipulation';
    });
  };

  // Xóa event listeners
  const removeEventListeners = () => {
    document.removeEventListener('contextmenu', preventContextMenu);
    document.removeEventListener('selectstart', preventSelectStart);
    document.removeEventListener('dragstart', preventDragStart);
    document.removeEventListener('copy', preventCopyPaste);
    document.removeEventListener('paste', preventCopyPaste);
    document.removeEventListener('cut', preventCopyPaste);
    document.removeEventListener('keydown', preventKeyboardShortcuts);
    document.removeEventListener('touchstart', preventTouchGestures);
    document.removeEventListener('touchmove', preventTouchGestures);
    document.removeEventListener('touchend', preventTouchGestures);
  };

  // Khởi tạo
  addEventListeners();

  // Return cleanup function
  return removeEventListeners;
};

// Chặn copy cho specific elements
export const protectElement = (element) => {
  if (!element) return;

  const preventCopy = (e) => {
    e.preventDefault();
    e.stopPropagation();
    return false;
  };

  element.addEventListener('contextmenu', preventCopy);
  element.addEventListener('selectstart', preventCopy);
  element.addEventListener('dragstart', preventCopy);
  element.addEventListener('copy', preventCopy);
  element.addEventListener('paste', preventCopy);
  element.addEventListener('cut', preventCopy);
  
  // CSS protection
  element.style.userSelect = 'none';
  element.style.webkitUserSelect = 'none';
  element.style.mozUserSelect = 'none';
  element.style.msUserSelect = 'none';
  element.style.webkitTouchCallout = 'none';
};

// Cho phép copy trong input fields
export const allowInputCopy = (element) => {
  if (!element) return;

  element.style.userSelect = 'text';
  element.style.webkitUserSelect = 'text';
  element.style.mozUserSelect = 'text';
  element.style.msUserSelect = 'text';
};

// Chặn Developer Tools
export const preventDevTools = () => {
  // Chặn F12
  document.addEventListener('keydown', (e) => {
    if (e.key === 'F12') {
      e.preventDefault();
      return false;
    }
  });

  // Chặn Ctrl+Shift+I
  document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.shiftKey && e.key === 'I') {
      e.preventDefault();
      return false;
    }
  });

  // Chặn Ctrl+U (View Source)
  document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.key === 'u') {
      e.preventDefault();
      return false;
    }
  });

  // Detect DevTools open
  let devtools = { open: false };
  const threshold = 160;
  
  setInterval(() => {
    if (window.outerHeight - window.innerHeight > threshold || 
        window.outerWidth - window.innerWidth > threshold) {
      if (!devtools.open) {
        devtools.open = true;
        console.clear();
        console.log('%cDevTools detected! Copy protection activated.', 'color: red; font-size: 20px;');
        // Có thể redirect hoặc show warning
      }
    } else {
      devtools.open = false;
    }
  }, 500);
};

export default {
  initCopyProtection,
  protectElement,
  allowInputCopy,
  preventDevTools
};
