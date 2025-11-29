// Add missing API endpoints

import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { API_BASE_URL } from '../config/constants';
import { getStoredToken } from './auth';

// Helper function to detect FormData safely
const isFormData = (data: any): boolean => {
  if (!data || typeof data !== 'object') {
    return false;
  }
  
  // Check if it's FormData by checking for common FormData methods/properties
  // This works better in React Native than instanceof
  return (
    (typeof FormData !== 'undefined' && data instanceof FormData) ||
    (data.constructor && data.constructor.name === 'FormData') ||
    (typeof data.append === 'function' && typeof data.getAll === 'function')
  );
};

const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000, // 10 seconds - tăng timeout để tránh timeout quá nhanh trên mạng chậm
  // Don't set default Content-Type here - set it conditionally in interceptor
  // Enable HTTP keep-alive for better connection reuse
  httpAgent: undefined, // Let axios use default agent
  httpsAgent: undefined,
  // Optimize for faster connections
  maxRedirects: 2, // Reduced redirects for faster failure
  validateStatus: (status) => status < 500, // Don't throw on 4xx errors, only 5xx
  // Enable request/response compression if supported
  decompress: true,
  // Max content length (50MB)
  maxContentLength: 50 * 1024 * 1024,
  maxBodyLength: 50 * 1024 * 1024,
  // Optimize for instant response
  adapter: undefined, // Use default adapter (fastest)
  // Tối ưu: Thêm headers để tăng tốc độ
  headers: {
    'Accept': 'application/json',
    'Accept-Encoding': 'gzip, deflate, br',
  },
});

apiClient.interceptors.request.use(
  async (config) => {
    // Fix for Expo Go: Create a new config object to avoid "property is not configurable" errors
    // This is the safest approach for Expo Go compatibility
    
    try {
      // Get auth token
      const token = await getStoredToken();
      
      // Create a completely new headers object (plain object, not Headers instance)
      const headers: Record<string, string> = {};
      
      // Safely copy existing headers if they exist
      if (config.headers) {
        const existingHeaders = config.headers as any;
        if (existingHeaders && typeof existingHeaders === 'object') {
          // Check if it's a Headers instance (has get method)
          if (typeof existingHeaders.get === 'function') {
            // It's a Headers instance, use get method
            try {
              const keys = Array.from(existingHeaders.keys?.() || []);
              for (const key of keys) {
                const value = existingHeaders.get(key);
                if (value !== undefined && value !== null) {
                  headers[key] = String(value);
                }
              }
            } catch (e) {
              // If iterating fails, try to get common headers
              try {
                const commonHeaders = ['Content-Type', 'Accept', 'User-Agent'];
                for (const key of commonHeaders) {
                  const value = existingHeaders.get?.(key);
                  if (value) headers[key] = String(value);
                }
              } catch (e2) {
                // Ignore
              }
            }
          } else {
            // It's a plain object, copy safely
            const keys = Object.keys(existingHeaders);
            for (const key of keys) {
              try {
                const value = existingHeaders[key];
                if (value !== undefined && value !== null) {
                  headers[key] = String(value);
                }
              } catch (e) {
                // Skip non-configurable properties
                continue;
              }
            }
          }
        }
      }
      
      // Add auth token if available
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }
      
      // For FormData (React Native), don't set Content-Type - let axios set it automatically
      // For other requests, set Content-Type to application/json
      if (!isFormData(config.data)) {
        // Only set Content-Type if it's not already set
        if (!headers['Content-Type'] && !headers['content-type']) {
          headers['Content-Type'] = 'application/json';
        }
      }
      // For FormData, don't set Content-Type - axios will handle it automatically with boundary
      
      // Create a new config object with the new headers (this is the key fix for Expo Go)
      return {
        ...config,
        headers,
      };
      
    } catch (error) {
      // If header modification fails completely, return original config
      // At least try to add auth token if possible
      try {
        const token = await getStoredToken();
        if (token) {
          // Create new config with just the auth header added
          return {
            ...config,
            headers: {
              ...(config.headers as any || {}),
              Authorization: `Bearer ${token}`,
            },
          };
        }
      } catch (e) {
        // If all else fails, return original config
        console.warn('Failed to set headers in request interceptor:', e);
      }
      
      return config;
    }
  },
  (error) => {
    return Promise.reject(error);
  }
);

apiClient.interceptors.response.use(
  (response) => {
    // Log response for debugging active-sessions endpoint
    if (response.config?.url?.includes('active-sessions')) {
      console.log('🌐 API Response for active-sessions:', {
        status: response.status,
        dataType: typeof response.data,
        isArray: Array.isArray(response.data),
        data: response.data
      });
    }
    return response;
  },
  async (error) => {
    // Log error for debugging active-sessions endpoint
    if (error.config?.url?.includes('active-sessions')) {
      console.error('🌐 API Error for active-sessions:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        dataType: typeof error.response?.data,
        data: error.response?.data,
        message: error.message
      });
    }
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

  // QR Login endpoints
  qrLoginInit: (qrToken: string) =>
    apiClient.post('/auth/qr-login-init', { qrToken }),

  qrLoginConfirm: (qrToken: string, userId: string) =>
    apiClient.post('/auth/qr-login-confirm', { qrToken, userId }),

  qrLoginStatus: (qrToken: string) =>
    apiClient.post('/auth/qr-login-status', { qrToken }),

  // Get active sessions/devices
  getActiveSessions: () => {
    console.log('🌐 API Call: GET /auth/active-sessions');
    return apiClient.get('/auth/active-sessions');
  },

  // Logout from a specific session
  logoutSession: (sessionId: string) =>
    apiClient.post('/auth/logout-session', { sessionId }),

  // Logout from all other sessions
  logoutAllOtherSessions: () =>
    apiClient.post('/auth/logout-all-other-sessions'),
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

  createGroupConversation: (name: string, participantIds: string[]) =>
    apiClient.post('/chat/conversations/group', { name, participantIds }),

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

  // Mark conversation as unread
  markAsUnread: (conversationId: string) =>
    apiClient.put(`/chat/conversations/${conversationId}/unread`, { unread: true }),

  // Pin/unpin conversation
  pinConversation: (conversationId: string, pinned: boolean) =>
    apiClient.post(`/chat/conversations/${conversationId}/pin`, { pinned }),

  // Delete conversation (soft delete - hide for user)
  deleteConversation: (conversationId: string) =>
    apiClient.delete(`/chat/conversations/${conversationId}`),

  // Mute conversation notifications
  muteConversation: (conversationId: string, muted: boolean) =>
    apiClient.post(`/chat/conversations/${conversationId}/mute`, { muted }),

  // Get participants of a conversation
  getParticipants: (conversationId: string) =>
    apiClient.get(`/chat/conversations/${conversationId}/participants`),

  // Add participants to a group conversation
  addParticipants: (conversationId: string, participantIds: string[]) =>
    apiClient.post(`/chat/conversations/${conversationId}/participants`, { participantIds }),
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

  checkFriendshipStatus: (userId: string) =>
    apiClient.get(`/friends/check-status/${userId}`),
};

export const notificationsAPI = {
  // System notifications
  getSystemNotifications: (category = '', page = 1, limit = 50) => {
    const params = new URLSearchParams();
    if (category) params.append('category', category);
    params.append('page', page.toString());
    params.append('limit', limit.toString());
    return apiClient.get(`/notifications/system?${params.toString()}`);
  },
  
  getSystemNotificationsUnreadCount: () =>
    apiClient.get('/notifications/system/unread-count'),
  
  markSystemNotificationAsRead: (notificationId: string) =>
    apiClient.post(`/notifications/system/${notificationId}/read`),
  
  markAllSystemNotificationsAsRead: () =>
    apiClient.post('/notifications/system/read-all'),
  
  // Regular notifications
  getNotifications: () => apiClient.get('/notifications'),

  markAsRead: (notificationId: string | number) =>
    apiClient.post(`/notifications/${notificationId}/read`),

  getUnreadCount: () => apiClient.get('/notifications/unread-count'),

  markAsRead: (notificationId: string | number) =>
    apiClient.post(`/notifications/${notificationId}/read`),

  markAllAsRead: () => apiClient.put('/notifications/read-all'),
};

export const newsfeedAPI = {
  getPosts: (page = 1, type?: 'all' | 'following' | 'video') => {
    // Always use 'all' as default to show all posts from everyone
    // Note: 'video' type is handled client-side by filtering posts with video
    const typeParam = type === 'video' ? 'all' : (type || 'all');
    // Build URL manually to ensure compatibility with React Native
    const url = `/newsfeed/posts?page=${page}&type=${encodeURIComponent(typeParam)}`;
    return apiClient.get(url);
  },

  getPost: (postId: string) =>
    apiClient.get(`/newsfeed/posts/${postId}`),

  createPost: (
    content: string, 
    images?: string[], 
    videoUrl?: string,
    threadgateSettings?: { replyType: 'everybody' | 'nobody' | 'followers' | 'following' | 'mention'; allowQuote: boolean }
  ) =>
    apiClient.post('/newsfeed/posts', { 
      content, 
      images, 
      videoUrl,
      threadgateSettings: threadgateSettings ? {
        replyType: threadgateSettings.replyType,
        allowQuote: threadgateSettings.allowQuote,
      } : undefined,
    }),

  likePost: (postId: string, reactionType?: string) =>
    apiClient.post(`/newsfeed/posts/${postId}/like`, { reactionType: reactionType || 'like' }),

  unlikePost: (postId: string) =>
    apiClient.delete(`/newsfeed/posts/${postId}/like`),

  trackPostView: (postId: string) =>
    apiClient.post(`/newsfeed/posts/${postId}/view`),

  commentPost: (postId: string, content: string) =>
    apiClient.post(`/newsfeed/posts/${postId}/comment`, { content }),

  getPostComments: (postId: string, page: number = 1, limit: number = 50) => {
    const params = new URLSearchParams();
    params.append('page', page.toString());
    params.append('limit', limit.toString());
    return apiClient.get(`/newsfeed/posts/${postId}/comments?${params.toString()}`);
  },

  deletePost: (postId: string) =>
    apiClient.delete(`/newsfeed/posts/${postId}`),
};

export const stickerAPI = {
  getStickerPacks: () => apiClient.get('/app/sticker-packs'),
  
  // Admin: Add sticker to pack
  addSticker: async (packId: string, formData: FormData) => {
    // Use fetch API for better Expo Go compatibility with FormData
    try {
      const token = await getStoredToken();
      const baseURL = API_BASE_URL;
      const url = `${baseURL}/app/sticker-packs/${packId}/stickers`;
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          // Don't set Content-Type - let browser/RN set it with boundary
        },
        body: formData,
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw {
          response: {
            status: response.status,
            data: errorData,
          },
          message: errorData.message || `Upload failed with status ${response.status}`,
        };
      }
      
      const data = await response.json();
      return { data, status: response.status };
    } catch (error: any) {
      if (error.response) {
        throw error;
      }
      throw {
        response: {
          status: 500,
          data: { message: error.message || 'Upload failed' },
        },
        message: error.message || 'Upload failed',
      };
    }
  },
  
  // Admin: Create new sticker pack
  createStickerPack: (name: string, description?: string) =>
    apiClient.post('/app/sticker-packs', { name, description }),
  
  // Admin: Delete sticker from pack
  deleteSticker: (packId: string, stickerIndex: number) =>
    apiClient.delete(`/app/sticker-packs/${packId}/stickers/${stickerIndex}`),
  
  // Admin: Delete sticker pack
  deleteStickerPack: (packId: string) =>
    apiClient.delete(`/app/sticker-packs/${packId}`),
};

export const uploadAPI = {
  uploadImage: async (formData: FormData) => {
    // Use fetch API for better Expo Go compatibility
    // Expo Go has limitations with axios FormData uploads
    try {
      const token = await getStoredToken();
      const baseURL = API_BASE_URL;
      const url = `${baseURL}/upload/image`;
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          // Don't set Content-Type - let browser/RN set it with boundary
        },
        body: formData,
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw {
          response: {
            status: response.status,
            data: errorData,
          },
          message: errorData.message || `Upload failed with status ${response.status}`,
        };
      }
      
      const data = await response.json();
      return { data, status: response.status };
    } catch (error: any) {
      // If it's already formatted, throw as is
      if (error.response) {
        throw error;
      }
      // Otherwise wrap it
      throw {
        response: {
          status: 500,
          data: { message: error.message || 'Upload failed' },
        },
        message: error.message || 'Upload failed',
      };
    }
  },

  uploadAvatar: (formData: FormData) => {
    // Don't manually set Content-Type - let axios set it automatically with boundary
    return apiClient.post('/upload/avatar', formData, {
      transformRequest: (data) => {
        return data;
      },
    });
  },

  uploadPostImage: (formData: FormData) => {
    // Don't manually set Content-Type - let axios set it automatically with boundary
    return apiClient.post('/upload/post', formData, {
      transformRequest: (data) => {
        return data;
      },
    });
  },

  uploadVideo: async (formData: FormData) => {
    // Use fetch API for better Expo Go compatibility
    // Expo Go has limitations with axios FormData uploads
    try {
      const token = await getStoredToken();
      const baseURL = API_BASE_URL;
      const url = `${baseURL}/upload/video`;
      
      // Create AbortController for timeout (2 minutes)
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 120000);
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          // Don't set Content-Type - let browser/RN set it with boundary
        },
        body: formData,
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw {
          response: {
            status: response.status,
            data: errorData,
          },
          message: errorData.message || `Upload failed with status ${response.status}`,
        };
      }
      
      const data = await response.json();
      return { data, status: response.status };
    } catch (error: any) {
      // If it's already formatted, throw as is
      if (error.response) {
        throw error;
      }
      // Handle abort (timeout)
      if (error.name === 'AbortError') {
        throw {
          response: {
            status: 408,
            data: { message: 'Upload timeout' },
          },
          message: 'Upload timeout - file may be too large',
        };
      }
      // Otherwise wrap it
      throw {
        response: {
          status: 500,
          data: { message: error.message || 'Upload failed' },
        },
        message: error.message || 'Upload failed',
      };
    }
  },
};

export const feedbackAPI = {
  submitFeedback: (content: string, type?: 'feedback' | 'report' | 'bug', mediaUrl?: string | null, reportedUserId?: string | number | null) =>
    apiClient.post('/feedback', { content, type: type || 'feedback', mediaUrl, reported_user_id: reportedUserId || null }),
};

// ==================== VERIFICATION API ====================
export const verificationAPI = {
  submitRequest: (data: {
    full_name: string;
    category?: 'individual' | 'organization' | 'brand' | 'public_figure' | 'other';
    reason: string;
    email: string;
    id_card_image?: string | null;
  }) => apiClient.post('/verification/request', data),
  getStatus: () => apiClient.get('/verification/status'),
  getUserVerification: (userId: string | number) => apiClient.get(`/verification/user/${userId}`),
};

export const adminAPI = {
  // Dashboard Stats
  getStats: () => apiClient.get('/admin/stats'),

  // User Management
  getUsers: (page = 1, limit = 20, search = '', role = '', status = '') => {
    const params = new URLSearchParams();
    params.append('page', page.toString());
    params.append('limit', limit.toString());
    if (search) params.append('search', search);
    if (role) params.append('role', role);
    if (status) params.append('status', status);
    return apiClient.get(`/admin/users?${params.toString()}`);
  },

  getUser: (userId: string | number) => apiClient.get(`/admin/users/${userId}`),

  updateUser: (userId: string | number, data: {
    full_name?: string;
    email?: string;
    phone?: string;
    role?: 'user' | 'admin';
    status?: string;
  }) => apiClient.put(`/admin/users/${userId}`, data),

  deleteUser: (userId: string | number) => apiClient.delete(`/admin/users/${userId}`),

  resetUserPassword: (userId: string | number, newPassword: string) =>
    apiClient.post(`/admin/users/${userId}/reset-password`, { newPassword }),

  // Post Management
  getPosts: (page = 1, limit = 20, search = '', userId = '') => {
    const params = new URLSearchParams();
    params.append('page', page.toString());
    params.append('limit', limit.toString());
    if (search) params.append('search', search);
    if (userId) params.append('userId', userId);
    return apiClient.get(`/admin/posts?${params.toString()}`);
  },

  deletePost: (postId: string | number) => apiClient.delete(`/admin/posts/${postId}`),

  // Activity
  getActivity: (limit = 50) => apiClient.get(`/admin/activity?limit=${limit}`),

  // Feedback Management
  getFeedbacks: (page = 1, limit = 20, status = '', type = '') => {
    const params = new URLSearchParams();
    params.append('page', page.toString());
    params.append('limit', limit.toString());
    if (status) params.append('status', status);
    if (type) params.append('type', type);
    return apiClient.get(`/admin/feedbacks?${params.toString()}`);
  },

  getFeedback: (feedbackId: string | number) => apiClient.get(`/admin/feedbacks/${feedbackId}`),

  updateFeedback: (feedbackId: string | number, data: {
    status?: 'pending' | 'reviewed' | 'resolved' | 'rejected';
    admin_response?: string;
  }) => apiClient.put(`/admin/feedbacks/${feedbackId}`, data),

  deleteFeedback: (feedbackId: string | number) => apiClient.delete(`/admin/feedbacks/${feedbackId}`),
  getVerifications: (page = 1, limit = 20, status = '') => {
    const params = new URLSearchParams();
    params.append('page', page.toString());
    params.append('limit', limit.toString());
    if (status) params.append('status', status);
    return apiClient.get(`/admin/verifications?${params.toString()}`);
  },
  getVerification: (verificationId: string | number) => apiClient.get(`/admin/verifications/${verificationId}`),
  approveVerification: (verificationId: string | number, verified_by?: string) =>
    apiClient.put(`/admin/verifications/${verificationId}/approve`, { verified_by }),
  rejectVerification: (verificationId: string | number, admin_response?: string) =>
    apiClient.put(`/admin/verifications/${verificationId}/reject`, { admin_response }),

  // Send message to user from admin
  sendMessageToUser: (userId: string | number, content: string, message_type = 'text') =>
    apiClient.post(`/admin/users/${userId}/send-message`, { content, message_type }),

  // Send message to all users from admin
  sendMessageToAllUsers: (content: string, message_type = 'text', exclude_user_ids: number[] = []) =>
    apiClient.post('/admin/users/send-message-all', { content, message_type, exclude_user_ids }),

  // Sticker Packs Management
  getStickerPacks: () => apiClient.get('/admin/sticker-packs'),

  getStickerPack: (packId: string | number) => apiClient.get(`/admin/sticker-packs/${packId}`),

  createStickerPack: (data: {
    name: string;
    title: string;
    description?: string;
    icon_url?: string;
    sort_order?: number;
  }) => apiClient.post('/admin/sticker-packs', data),

  updateStickerPack: (packId: string | number, data: {
    name?: string;
    title?: string;
    description?: string;
    icon_url?: string;
    is_active?: boolean;
    sort_order?: number;
  }) => apiClient.put(`/admin/sticker-packs/${packId}`, data),

  deleteStickerPack: (packId: string | number) => apiClient.delete(`/admin/sticker-packs/${packId}`),

  // Stickers Management
  addSticker: (packId: string | number, data: {
    image_url: string;
    file_format?: string;
    file_size?: number;
    width?: number;
    height?: number;
    is_animated?: boolean;
    sort_order?: number;
  }) => apiClient.post(`/admin/sticker-packs/${packId}/stickers`, data),

  updateSticker: (stickerId: string | number, data: {
    image_url?: string;
    file_format?: string;
    file_size?: number;
    width?: number;
    height?: number;
    is_animated?: boolean;
    sort_order?: number;
  }) => apiClient.put(`/admin/stickers/${stickerId}`, data),

  deleteSticker: (stickerId: string | number) => apiClient.delete(`/admin/stickers/${stickerId}`),

  reorderStickers: (packId: string | number, stickerOrders: Array<{ id: number; sort_order: number }>) =>
    apiClient.put(`/admin/sticker-packs/${packId}/stickers/reorder`, { stickerOrders }),

  // System Notifications
  getSystemNotifications: (page = 1, limit = 20, category = '') => {
    const params = new URLSearchParams();
    params.append('page', page.toString());
    params.append('limit', limit.toString());
    if (category) params.append('category', category);
    return apiClient.get(`/admin/system-notifications?${params.toString()}`);
  },

  createSystemNotification: (data: {
    category?: string;
    title: string;
    description: string;
    target_audience?: 'all' | 'specific';
    target_user_ids?: number[];
  }) => apiClient.post('/admin/system-notifications', data),

  deleteSystemNotification: (notificationId: string | number) =>
    apiClient.delete(`/admin/system-notifications/${notificationId}`),
};

export { apiClient };
export default apiClient;
