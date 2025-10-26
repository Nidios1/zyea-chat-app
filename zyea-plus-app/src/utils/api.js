import axios from 'axios';
import { getToken } from './auth';
import { getApiBaseUrl } from './platformConfig';

// Get API URL based on platform (PWA vs Native) and environment
const API_BASE_URL = getApiBaseUrl();

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 seconds timeout
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = getToken();
    console.log('🔑 API Request:', config.method?.toUpperCase(), config.url);
    console.log('🔑 Token exists:', !!token);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    console.error('❌ API Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => {
    console.log('✅ API Response:', response.status, response.config.url);
    return response;
  },
  (error) => {
    console.error('❌ API Response Error:', error.response?.status, error.config?.url, error.message);
    if (error.response?.data) {
      console.error('Error details:', error.response.data);
    }
    if (error.response?.status === 401) {
      console.log('🔒 Unauthorized, removing token but not redirecting');
      localStorage.removeItem('token');
      // Don't redirect automatically - let the app handle it
      // window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Chat API functions
export const chatAPI = {
  // Get conversations
  getConversations: async () => {
    const response = await api.get('/chat/conversations');
    return response.data;
  },
  
  // Create or get conversation
  createConversation: async (userId) => {
    const response = await api.post('/chat/conversations', { userId });
    return response.data;
  },
  
  // Get messages
  getMessages: async (conversationId, page = 1, limit = 50) => {
    const response = await api.get(`/chat/conversations/${conversationId}/messages?page=${page}&limit=${limit}`);
    return response.data;
  },
  
  // Send message
  sendMessage: async (conversationId, content, messageType = 'text', fileUrl = null) => {
    const response = await api.post(`/chat/conversations/${conversationId}/messages`, {
      content,
      messageType,
      fileUrl
    });
    return response.data;
  },
  
  // Mark messages as read
  markMessagesAsRead: async (conversationId, messageIds) => {
    const response = await api.post(`/chat/conversations/${conversationId}/messages/read`, { messageIds });
    return response.data;
  },
  
  // Mark all messages in conversation as read
  markAllAsRead: async (conversationId) => {
    const response = await api.post(`/chat/conversations/${conversationId}/read-all`);
    return response.data;
  },
  
  // Update typing status
  updateTypingStatus: async (conversationId, isTyping) => {
    const response = await api.post(`/chat/conversations/${conversationId}/typing`, { isTyping });
    return response.data;
  },
  
  // Get typing status
  getTypingStatus: async (conversationId) => {
    const response = await api.get(`/chat/conversations/${conversationId}/typing`);
    return response.data;
  },

  // Pin conversation
  pinConversation: async (conversationId, pinned) => {
    const response = await api.post(`/chat/conversations/${conversationId}/pin`, { pinned });
    return response.data;
  },

  // Hide conversation
  hideConversation: async (conversationId, hidden) => {
    const response = await api.post(`/chat/conversations/${conversationId}/hide`, { hidden });
    return response.data;
  },

  // Update nickname
  updateNickname: async (conversationId, nickname) => {
    const response = await api.post(`/chat/conversations/${conversationId}/nickname`, { nickname });
    return response.data;
  },

  // Mark as close friend
  markAsCloseFriend: async (conversationId, isCloseFriend) => {
    const response = await api.post(`/chat/conversations/${conversationId}/close-friend`, { isCloseFriend });
    return response.data;
  },

  // Get conversation settings
  getConversationSettings: async (conversationId) => {
    const response = await api.get(`/chat/conversations/${conversationId}/settings`);
    return response.data;
  },

  // Delete conversation history
  deleteConversationHistory: async (conversationId) => {
    const response = await api.delete(`/chat/conversations/${conversationId}/messages`);
    return response.data;
  },
    
  // Delete entire conversation
  deleteConversation: async (conversationId) => {
    const response = await api.delete(`/chat/conversations/${conversationId}`);
    return response.data;
  },
    
  // Mark conversation as unread
  markAsUnread: async (conversationId) => {
    const response = await api.put(`/chat/conversations/${conversationId}/unread`, { unread: true });
    return response.data;
  }
};

export const profileAPI = {
  getProfile: () => api.get('/profile'),
  updateProfile: (profileData) => api.put('/profile', profileData),
  updateStatus: (status) => api.put('/profile/status', { status }),
  changePassword: (currentPassword, newPassword) =>
    api.put('/profile/password', { currentPassword, newPassword })
};

export const newsfeedAPI = {
  getPosts: () => api.get('/newsfeed/posts'),
  createPost: (postData) => {
    const formData = new FormData();
    formData.append('content', postData.content || '');
    formData.append('type', postData.type || 'text');
    formData.append('privacy', postData.privacy || 'public');
    if (postData.image) {
      formData.append('image', postData.image);
    }
    return api.post('/newsfeed/posts', formData, {
      headers: { 
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
  },
  likePost: (postId, data = {}) => api.post(`/newsfeed/posts/${postId}/like`, data),
  commentPost: (postId, content) => api.post(`/newsfeed/posts/${postId}/comment`, { content }),
  sharePost: (postId) => api.post(`/newsfeed/posts/${postId}/share`),
  deletePost: (postId) => api.delete(`/newsfeed/posts/${postId}`),
  getPostComments: (postId, page = 1, limit = 10) => 
    api.get(`/newsfeed/posts/${postId}/comments?page=${page}&limit=${limit}`)
};

export const friendsAPI = {
  getFriends: () => api.get('/friends'),
  getPendingRequests: () => api.get('/friends/pending'),
  sendFriendRequest: (friendId) => api.post('/friends/request', { friendId }),
  acceptFriendRequest: (friendId) => api.post('/friends/accept', { friendId }),
  rejectFriendRequest: (friendId) => api.post('/friends/reject', { friendId }),
  unfriend: (friendId) => api.delete(`/friends/${friendId}`),
  searchUsers: (query) => api.get(`/friends/users/search?q=${encodeURIComponent(query)}`),
  checkFriendshipStatus: (userId) => api.get(`/friends/check-status/${userId}`),
  follow: (followingId) => api.post('/friends/follow', { followingId }),
  unfollow: (followingId) => api.delete(`/friends/follow/${followingId}`),
  getFollowers: () => api.get('/friends/followers'),
  getFollowing: () => api.get('/friends/following'),
  block: (blockedUserId) => api.post('/friends/block', { blockedUserId }),
  unblock: (blockedUserId) => api.delete(`/friends/block/${blockedUserId}`),
  getMutualFriends: (userId) => api.get(`/friends/mutual/${userId}`)
};

export const notificationAPI = {
  getNotifications: (type = 'all') => api.get(`/notifications?type=${type}`),
  getRecentNotifications: () => api.get('/notifications/recent'),
  markAsRead: (notificationId) => api.post(`/notifications/${notificationId}/read`),
  markAllAsRead: () => api.post('/notifications/read-all'),
  acceptFriendRequest: (notificationId, fromUserId) => 
    api.post(`/notifications/${notificationId}/accept-friend-request`, { fromUserId }),
  rejectFriendRequest: (notificationId) => 
    api.post(`/notifications/${notificationId}/reject-friend-request`),
  getUnreadCount: () => api.get('/notifications/unread-count')
};

export default api;
