// Add missing API endpoints

import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { API_BASE_URL } from '../config/constants';
import { getStoredToken } from './auth';

const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 30 seconds timeout (increased from 15s for better network reliability)
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use(
  async (config) => {
    const token = await getStoredToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // For FormData (React Native), don't set Content-Type - let axios/browser set it
    if (config.data instanceof FormData) {
      // Remove Content-Type header to let the browser/axios set it with boundary
      delete config.headers['Content-Type'];
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    if (error.response?.status === 401) {
      // Handle logout if needed
    }
    
    return Promise.reject(error);
  }
);

export const authAPI = {
  login: (emailOrUsername: string, password: string) => {
    // Try email first, if contains @, otherwise username
    if (emailOrUsername.includes('@')) {
      return apiClient.post('/auth/login', { email: emailOrUsername, password });
    }
    return apiClient.post('/auth/login', { username: emailOrUsername, password });
  },

  register: (data: any) => apiClient.post('/auth/register', data),

  sendVerification: (data: { email?: string; phone?: string }) =>
    apiClient.post('/auth/send-verification', data),

  verifyCode: (data: { email?: string; phone?: string; code: string }) =>
    apiClient.post('/auth/verify-code', data),

  forgotPassword: (email: string) =>
    apiClient.post('/auth/forgot-password', { email }),

  verifyToken: () => apiClient.get('/users/profile'),
};

export const usersAPI = {
  getProfile: (userId?: string) =>
    apiClient.get(userId ? `/users/${userId}` : '/users/profile'),

  getUserStats: (userId: string) =>
    apiClient.get(`/users/${userId}/stats`),

  updateProfile: (data: any) =>
    apiClient.put('/users/profile', data),

  searchUsers: (query: string) =>
    apiClient.get(`/users/search?q=${encodeURIComponent(query)}`),
};

export const chatAPI = {
  getConversations: () => apiClient.get('/chat/conversations'),

  getMessages: (conversationId: string, page = 1, limit = 50) =>
    apiClient.get(`/chat/conversations/${conversationId}/messages?page=${page}&limit=${limit}`),

  sendMessage: (conversationId: string, content: string, type = 'text', mediaUrl?: string) =>
    apiClient.post(`/chat/conversations/${conversationId}/messages`, {
      content,
      messageType: type,
      fileUrl: mediaUrl,
    }),

  createConversation: (userId: string) =>
    apiClient.post('/chat/conversations', { userId }),

  markAsRead: (messageId: string) =>
    apiClient.put(`/chat/messages/${messageId}/read`),

  markMessagesAsRead: (conversationId: string, messageIds: string[]) =>
    apiClient.post(`/chat/conversations/${conversationId}/messages/read`, { messageIds }),

  markAllAsRead: (conversationId: string) =>
    apiClient.post(`/chat/conversations/${conversationId}/read-all`),

  updateReactions: (messageId: string, reactions: string[]) =>
    apiClient.post(`/chat/messages/${messageId}/reactions`, { reactions }),

  updateMessage: (messageId: string, content: string) =>
    apiClient.put(`/chat/messages/${messageId}`, { content }),

  deleteMessage: (messageId: string, deleteForEveryone = false) =>
    apiClient.delete(`/chat/messages/${messageId}${deleteForEveryone ? '?deleteForEveryone=true' : ''}`),
};

export const friendsAPI = {
  getFriends: () => apiClient.get('/friends'),

  getFriendRequests: () => apiClient.get('/friends/requests'),

  sendFriendRequest: (userId: string) =>
    apiClient.post('/friends/requests', { user_id: userId }),

  acceptFriendRequest: (requestId: string) =>
    apiClient.put(`/friends/requests/${requestId}/accept`),

  rejectFriendRequest: (requestId: string) =>
    apiClient.put(`/friends/requests/${requestId}/reject`),

  removeFriend: (friendId: string) =>
    apiClient.delete(`/friends/${friendId}`),

  getFollowing: () => apiClient.get('/friends/following'),

  getFollowers: () => apiClient.get('/friends/followers'),

  follow: (followingId: string) =>
    apiClient.post('/friends/follow', { followingId }),

  unfollow: (followingId: string) =>
    apiClient.delete(`/friends/follow/${followingId}`),

  block: (blockedUserId: string) =>
    apiClient.post('/friends/block', { blockedUserId }),

  unblock: (blockedUserId: string) =>
    apiClient.delete(`/friends/block/${blockedUserId}`),

  mute: (mutedUserId: string) =>
    apiClient.post('/friends/mute', { mutedUserId }),

  unmute: (mutedUserId: string) =>
    apiClient.delete(`/friends/mute/${mutedUserId}`),

  restrict: (restrictedUserId: string) =>
    apiClient.post('/friends/restrict', { restrictedUserId }),

  unrestrict: (restrictedUserId: string) =>
    apiClient.delete(`/friends/restrict/${restrictedUserId}`),

  report: (reportedUserId: string, reason?: string, description?: string) =>
    apiClient.post('/friends/report', { reportedUserId, reason, description }),
};

export const notificationsAPI = {
  getNotifications: () => apiClient.get('/notifications'),

  markAsRead: (notificationId: string) =>
    apiClient.put(`/notifications/${notificationId}/read`),

  markAllAsRead: () => apiClient.put('/notifications/read-all'),
};

export const newsfeedAPI = {
  getPosts: (page = 1, type?: 'all' | 'following') => {
    // Always use 'all' as default to show all posts from everyone
    const typeParam = type || 'all';
    // Build URL manually to ensure compatibility with React Native
    const url = `/newsfeed/posts?page=${page}&type=${encodeURIComponent(typeParam)}`;
    return apiClient.get(url);
  },

  getPost: (postId: string) =>
    apiClient.get(`/newsfeed/posts/${postId}`),

  createPost: (content: string, images?: string[], videoUrl?: string) =>
    apiClient.post('/newsfeed/posts', { content, images, videoUrl }),

  likePost: (postId: string) =>
    apiClient.post(`/newsfeed/posts/${postId}/like`),

  unlikePost: (postId: string) =>
    apiClient.delete(`/newsfeed/posts/${postId}/like`),

  commentPost: (postId: string, content: string) =>
    apiClient.post(`/newsfeed/posts/${postId}/comments`, { content }),

  getPostComments: (postId: string) =>
    apiClient.get(`/newsfeed/posts/${postId}/comments`),

  deletePost: (postId: string) =>
    apiClient.delete(`/newsfeed/posts/${postId}`),
};

export const uploadAPI = {
  uploadImage: (formData: FormData) =>
    apiClient.post('/upload/image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  uploadAvatar: (formData: FormData) =>
    apiClient.post('/upload/avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  uploadPostImage: (formData: FormData) =>
    apiClient.post('/upload/post', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  uploadVideo: (formData: FormData) => {
    // Don't set Content-Type header - let axios set it automatically with boundary
    const config: AxiosRequestConfig = {
      timeout: 120000, // 2 minutes timeout for video upload
      headers: {
        // Remove Content-Type - axios will set it automatically with boundary
      },
      transformRequest: (data) => {
        // Return FormData as-is for React Native
        return data;
      },
    };
    return apiClient.post('/upload/video', formData, config);
  },
};

export const feedbackAPI = {
  submitFeedback: (content: string, type?: 'feedback' | 'report' | 'bug', mediaUrl?: string | null) =>
    apiClient.post('/feedback', { content, type: type || 'feedback', mediaUrl }),
};

export default apiClient;
