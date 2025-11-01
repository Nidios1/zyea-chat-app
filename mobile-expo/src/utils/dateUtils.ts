// Simple date formatting utilities
export const formatTime = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) {
    return 'vừa xong';
  } else if (diffMin < 60) {
    return `${diffMin} phút trước`;
  } else if (diffHour < 24) {
    return `${diffHour} giờ trước`;
  } else if (diffDay < 7) {
    return `${diffDay} ngày trước`;
  } else {
    // Format: DD/MM/YYYY
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  }
};

export const formatMessageTime = (dateString: string): string => {
  const date = new Date(dateString);
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
};

export const formatPostDate = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHour = Math.floor(diffMs / (1000 * 60 * 60));

  if (diffHour < 1) {
    return 'vừa xong';
  } else if (diffHour < 24) {
    return `${diffHour} giờ trước`;
  } else {
    const day = date.getDate();
    const month = date.getMonth() + 1;
    const year = date.getFullYear();
    return `${day} tháng ${month}, ${year}`;
  }
};

// Format date for message date separator (like PWA)
export const formatDate = (dateString: string): string => {
  if (!dateString) return '';
  
  try {
    const date = new Date(dateString);
    
    // Validate date
    if (isNaN(date.getTime())) {
      console.warn('Invalid date string:', dateString);
      return '';
    }
    
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const messageDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    
    if (messageDate.getTime() === today.getTime()) {
      return 'Hôm nay';
    } else if (messageDate.getTime() === yesterday.getTime()) {
      return 'Hôm qua';
    } else {
      return date.toLocaleDateString('vi-VN', { 
        day: '2-digit', 
        month: '2-digit' 
      });
    }
  } catch (error) {
    console.error('Error formatting date:', error, dateString);
    return '';
  }
};

// Check if two dates are on different days
export const isDifferentDay = (date1: string | null, date2: string | null): boolean => {
  if (!date1 || !date2) return true;
  
  try {
    const d1 = new Date(date1);
    const d2 = new Date(date2);
    
    // Validate dates
    if (isNaN(d1.getTime()) || isNaN(d2.getTime())) {
      return true;
    }
    
    return d1.getDate() !== d2.getDate() || 
           d1.getMonth() !== d2.getMonth() || 
           d1.getFullYear() !== d2.getFullYear();
  } catch (error) {
    console.error('Error comparing dates:', error, date1, date2);
    return true;
  }
};

// Get time ago string (like Facebook: "Hoạt động 40 phút trước")
export const getTimeAgo = (lastSeen: string | null | undefined): string => {
  if (!lastSeen) return '';
  
  try {
    const now = new Date();
    const lastSeenDate = new Date(lastSeen);
    
    // Validate date
    if (isNaN(lastSeenDate.getTime())) {
      return '';
    }
    
    const diffInSeconds = Math.floor((now.getTime() - lastSeenDate.getTime()) / 1000);
    
    if (diffInSeconds < 60) {
      return 'vừa xong';
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes} phút trước`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours} giờ trước`;
    } else {
      const days = Math.floor(diffInSeconds / 86400);
      if (days === 1) {
        return '1 ngày trước';
      } else if (days < 7) {
        return `${days} ngày trước`;
      } else {
        // Too old, return empty or formatted date
        return '';
      }
    }
  } catch (error) {
    console.error('Error calculating time ago:', error);
    return '';
  }
};

// Check if last_seen is recent enough to show "Hoạt động X trước" (within 24 hours)
export const isRecentActivity = (lastSeen: string | null | undefined): boolean => {
  if (!lastSeen) return false;
  
  try {
    const now = new Date();
    const lastSeenDate = new Date(lastSeen);
    
    if (isNaN(lastSeenDate.getTime())) {
      return false;
    }
    
    const diffInHours = (now.getTime() - lastSeenDate.getTime()) / (1000 * 60 * 60);
    // Show if within 24 hours (like Facebook)
    return diffInHours < 24;
  } catch (error) {
    return false;
  }
};

