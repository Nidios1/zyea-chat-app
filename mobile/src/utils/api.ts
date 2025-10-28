// Add missing API endpoints

import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { API_BASE_URL } from '../config/constants';
import { getStoredToken } from './auth';

const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
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
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Handle logout
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  login: (username: string, password: string) =>
    apiClient.post('/auth/login', { username, password }),

  register: (data: any) => apiClient.post('/auth/register', data),

  forgotPassword: (email: string) =>
    apiClient.post('/auth/forgot-password', { email }),

  verifyToken: () => apiClient.get('/users/profile'),
};

export const usersAPI = {
  getProfile: (userId?: string) =>
    apiClient.get(userId ? `/users/${userId}` : '/users/profile'),

  updateProfile: (data: any) =>
    apiClient.put('/users/profile', data),

  searchUsers: (query: string) =>
    apiClient.get(`/users/search?q=${encodeURIComponent(query)}`),
};

export const chatAPI = {
  getConversations: () => apiClient.get('/chat/conversations'),

  getMessages: (conversationId: string, page = 1) =>
    apiClient.get(`/chat/messages/${conversationId}?page=${page}`),

  sendMessage: (conversationId: string, content: string, type = 'text', mediaUrl?: string) =>
    apiClient.post('/chat/messages', {
      conversation_id: conversationId,
      content,
      type: type,
      media_url: mediaUrl,
    }),

  createConversation: (userId: string) =>
    apiClient.post('/chat/conversations', { user_id: userId }),

  markAsRead: (messageId: string) =>
    apiClient.put(`/chat/messages/${messageId}/read`),
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
};

export const newsfeedAPI = {
  getPosts: (page = 1) =>
    apiClient.get(`/newsfeed/posts?page=${page}`),

  getPost: (postId: string) =>
    apiClient.get(`/newsfeed/posts/${postId}`),

  createPost: (content: string, images?: string[]) =>
    apiClient.post('/newsfeed/posts', { content, images }),

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
};

export default apiClient;
