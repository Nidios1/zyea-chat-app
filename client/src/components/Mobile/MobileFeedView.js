import React, { useState, useEffect, useCallback, useRef } from 'react';
import styled from 'styled-components';
import { 
  FiSearch, 
  FiImage, 
  FiThumbsUp, 
  FiHeart, 
  FiMessageCircle, 
  FiShare2,
  FiMoreHorizontal,
  FiHome,
  FiUsers,
  FiBell,
  FiMenu,
  FiCamera,
  FiPaperclip,
  FiSmile,
  FiX,
  FiSend,
  FiArrowLeft
} from 'react-icons/fi';
import { newsfeedAPI } from '../../utils/api';
import { getAvatarURL, getUploadedImageURL } from '../../utils/imageUtils';
import { getInitials } from '../../utils/nameUtils';
import PullToRefresh from './PullToRefresh';
import MobilePostCreatorModal from './MobilePostCreatorModal';
import { useElementScrollDirection } from '../../hooks/useScrollDirection';

// Container
const Container = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: var(--bg-primary);
  overflow: hidden;
  z-index: 1000;

  @media (max-width: 768px) {
    height: calc(var(--vh, 1vh) * 100);
  }
`;

// App Header - FPT Place logo + search + profile
const AppHeader = styled.div`
  background: var(--bg-primary);
  padding: 10px 12px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid var(--border-color);
`;

const LogoSection = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const LogoImage = styled.img`
  width: 32px;
  height: 32px;
  border-radius: 7px;
  object-fit: cover;
`;

const LogoText = styled.div`
  font-size: 15px;
  font-weight: 700;
  color: var(--text-primary);
`;

const RightIcons = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const HeaderIcon = styled.div`
  font-size: 20px;
  color: var(--text-secondary);
  cursor: pointer;
  
  &:active {
    opacity: 0.7;
  }
`;

// Post Creator Section
const PostCreatorSection = styled.div`
  background: var(--bg-primary);
  padding: 10px 12px;
  border-bottom: 1px solid var(--border-color);
`;

const PostCreatorContent = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
`;

const CreatorAvatar = styled.div`
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: ${props => props.color || 'linear-gradient(135deg, #0068ff 0%, #00a651 100%)'};
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 600;
  overflow: hidden;
  flex-shrink: 0;
`;

const PostInputWrapper = styled.div`
  flex: 1;
  display: flex;
  align-items: center;
  background: var(--bg-tertiary);
  border-radius: 20px;
  padding: 7px 14px;
  gap: 6px;
`;

const PostInput = styled.input`
  flex: 1;
  border: none;
  background: none;
  font-size: 13px;
  color: var(--text-primary);
  outline: none;
  cursor: pointer;
  
  &::placeholder {
    color: var(--text-tertiary);
  }
`;

const ImageIconWrapper = styled.div`
  font-size: 18px;
  color: #0084ff;
  cursor: pointer;
  
  &:active {
    opacity: 0.7;
  }
`;

// Filter Section
const FilterSection = styled.div`
  background: var(--bg-primary);
  padding: 10px 12px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid var(--border-color);
`;

const FilterLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const FilterTitle = styled.div`
  font-size: 15px;
  font-weight: 700;
  color: var(--text-primary);
`;

const FilterText = styled.div`
  font-size: 13px;
  color: var(--text-secondary);
`;

const FilterIcon = styled.div`
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-secondary);
  cursor: pointer;
  
  &:active {
    opacity: 0.7;
  }
`;

// Content Area
const ContentArea = styled.div`
  flex: 1;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  padding-bottom: calc(80px + env(safe-area-inset-bottom, 0));
  background: var(--bg-primary);
  display: flex;
  flex-direction: column;
  
  /* Hide scrollbar on mobile for cleaner look */
  &::-webkit-scrollbar {
    width: 0;
    background: transparent;
  }
`;

// Post Card
const PostCard = styled.div`
  background: var(--bg-primary);
  margin-bottom: 8px;
  padding: 12px;
`;

const PostHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
`;

const PostAuthor = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const AuthorAvatar = styled.div`
  width: 38px;
  height: 38px;
  border-radius: 4px;
  background: linear-gradient(135deg, #0084ff 0%, #0068ff 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 600;
  font-size: 14px;
  overflow: hidden;
`;

const AuthorInfo = styled.div`
  flex: 1;
`;

const AuthorName = styled.div`
  font-size: 14px;
  font-weight: 700;
  color: var(--text-primary);
  line-height: 1.2;
`;

const PostMeta = styled.div`
  font-size: 12px;
  color: var(--text-secondary);
  line-height: 1.2;
`;

const PostMoreButton = styled.div`
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-secondary);
  cursor: pointer;
  
  &:active {
    opacity: 0.7;
  }
`;

const PostContent = styled.div`
  margin-bottom: 10px;
`;

const PostTitle = styled.div`
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 6px;
  display: flex;
  align-items: center;
  gap: 4px;
`;

const HeartIcon = styled.span`
  font-size: 14px;
`;

const PostText = styled.div`
  font-size: 13px;
  color: var(--text-primary);
  line-height: 1.5;
  margin-bottom: 6px;
`;

const PostSeeMore = styled.span`
  color: var(--primary-color);
  cursor: pointer;
  font-size: 13px;
  font-weight: 500;
`;

const PostImages = styled.div`
  display: flex;
  gap: 6px;
  margin-bottom: 10px;
`;

const PostImage = styled.img`
  width: 100%;
  height: auto;
  border-radius: 8px;
  object-fit: cover;
`;

const PostReactions = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 0;
  border-top: 1px solid var(--border-color);
  margin-top: 8px;
`;

const ReactionsLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
`;

const ReactionIcons = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 16px;
`;

const ReactionCount = styled.span`
  font-size: 12px;
  color: var(--text-secondary);
`;

const ViewsCount = styled.div`
  font-size: 12px;
  color: var(--text-secondary);
`;

const PostActions = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-around;
  padding: 6px 0;
  border-top: 1px solid var(--border-color);
  margin-top: 6px;
`;

const ActionButton = styled.div`
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: 6px;
  color: ${props => props.liked ? 'var(--primary-color)' : 'var(--text-secondary)'};
  font-size: 13px;
  cursor: pointer;
  border-radius: 4px;
  transition: all 0.3s ease;
  position: relative;
  
  &:active {
    background: var(--bg-tertiary);
    transform: scale(0.95);
  }
  
  &.liked-animation {
    animation: likedPop 0.5s ease;
  }
  
  @keyframes likedPop {
    0% {
      transform: scale(1);
    }
    50% {
      transform: scale(1.2);
    }
    100% {
      transform: scale(1);
    }
  }
`;

const FloatingHeart = styled.div`
  position: absolute;
  font-size: 24px;
  pointer-events: none;
  animation: floatUp 1s ease-out forwards;
  
  @keyframes floatUp {
    0% {
      opacity: 1;
      transform: translateY(0) scale(1);
    }
    100% {
      opacity: 0;
      transform: translateY(-60px) scale(1.5);
    }
  }
`;

const ReactionBar = styled.div`
  position: absolute;
  bottom: calc(100% + 10px);
  left: 50%;
  transform: translateX(-20%);
  background: rgba(0, 0, 0, 0.9);
  backdrop-filter: blur(10px);
  border-radius: 20px;
  padding: 5px 3px;
  display: flex;
  gap: 3px;
  align-items: center;
  animation: slideUp 0.3s ease-out;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4);
  white-space: nowrap;
  z-index: 100;
  
  @media (max-width: 375px) {
    gap: 2px;
    padding: 4px 2px;
    border-radius: 18px;
  }
  
  @keyframes slideUp {
    0% {
      opacity: 0;
      transform: translateX(-20%) translateY(8px) scale(0.95);
    }
    100% {
      opacity: 1;
      transform: translateX(-20%) translateY(0) scale(1);
    }
  }
`;

const ReactionEmoji = styled.div`
  font-size: 26px;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.15s ease;
  border-radius: 50%;
  
  @media (max-width: 375px) {
    font-size: 24px;
    width: 32px;
    height: 32px;
  }
  
  &:active {
    transform: scale(1.4);
    background: rgba(255, 255, 255, 0.15);
  }
`;

// Comment View Styles (Full Screen)
const CommentView = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: var(--bg-primary);
  z-index: 2000;
  display: flex;
  flex-direction: column;
  animation: slideInRight 0.3s ease;
  
  @keyframes slideInRight {
    from {
      transform: translateX(100%);
    }
    to {
      transform: translateX(0);
    }
  }
`;

const CommentViewHeader = styled.div`
  padding: 12px 16px;
  display: flex;
  align-items: center;
  gap: 12px;
  border-bottom: 1px solid var(--border-color);
  background: var(--bg-primary);
`;

const CommentViewBackButton = styled.div`
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-primary);
  cursor: pointer;
  border-radius: 50%;
  
  &:active {
    background: var(--bg-tertiary);
  }
`;

const CommentViewTitle = styled.div`
  flex: 1;
  font-size: 16px;
  font-weight: 700;
  color: var(--text-primary);
`;

const CommentViewMoreButton = styled.div`
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-secondary);
  cursor: pointer;
  border-radius: 50%;
  
  &:active {
    background: var(--bg-tertiary);
  }
`;

const CommentViewPostSection = styled.div`
  padding: 12px 16px;
  background: var(--bg-primary);
  border-bottom: 1px solid var(--border-color);
`;

const PostPreviewHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
`;

const PostPreviewAuthor = styled.div`
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
`;

const PostPreviewMeta = styled.div`
  font-size: 12px;
  color: var(--text-secondary);
`;

const PostPreviewContent = styled.div`
  font-size: 14px;
  color: var(--text-primary);
  line-height: 1.5;
  margin-bottom: 8px;
`;

const PostPreviewImage = styled.img`
  width: 100%;
  height: auto;
  border-radius: 8px;
  margin-top: 8px;
  object-fit: contain;
`;

const CommentListContainer = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 10px;
  padding-bottom: 20px;
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const CommentItem = styled.div`
  display: flex;
  gap: 8px;
`;

const CommentAvatar = styled.div`
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: ${props => props.color || 'linear-gradient(135deg, #0068ff 0%, #00a651 100%)'};
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 600;
  font-size: 12px;
  overflow: hidden;
  flex-shrink: 0;
`;

const CommentContent = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

const CommentAuthor = styled.div`
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary);
`;

const CommentText = styled.div`
  font-size: 13px;
  color: var(--text-primary);
  line-height: 1.4;
`;

const CommentTime = styled.div`
  font-size: 11px;
  color: var(--text-secondary);
  margin-top: 1px;
`;

const CommentInputContainer = styled.div`
  padding: 10px 12px;
  padding-bottom: calc(80px + env(safe-area-inset-bottom, 0));
  border-top: 1px solid var(--border-color);
  background: var(--bg-primary);
`;

const CommentInputWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  background: var(--bg-tertiary);
  border-radius: 20px;
  padding: 6px 10px;
`;

const CommentInputField = styled.input`
  flex: 1;
  border: none;
  background: none;
  font-size: 13px;
  color: var(--text-primary);
  outline: none;
  
  &::placeholder {
    color: var(--text-tertiary);
  }
`;

const CommentInputIcon = styled.div`
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-secondary);
  cursor: pointer;
  flex-shrink: 0;
  
  &:active {
    opacity: 0.7;
  }
`;

const CommentSendButton = styled.div`
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  background: var(--primary-color);
  border-radius: 50%;
  cursor: pointer;
  flex-shrink: 0;
  
  &:active {
    opacity: 0.8;
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const MobileFeedView = ({ currentUser, onScrollDirectionChange }) => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showPostModal, setShowPostModal] = useState(false);
  const [likedPosts, setLikedPosts] = useState(new Set());
  const [floatingHearts, setFloatingHearts] = useState([]);
  const [showReactionBar, setShowReactionBar] = useState(null); // Track which post is showing reaction bar
  const [longPressTimer, setLongPressTimer] = useState(null);
  
  // Comment Modal States
  const [showCommentModal, setShowCommentModal] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState('');
  const [isCommenting, setIsCommenting] = useState(false);
  
  // Scroll detection
  const contentAreaRef = useRef(null);
  const { isScrollingDown } = useElementScrollDirection(contentAreaRef, 20);

  useEffect(() => {
    loadPosts();
  }, []);
  
  // Notify parent about scroll direction changes
  useEffect(() => {
    if (onScrollDirectionChange) {
      onScrollDirectionChange(isScrollingDown);
    }
  }, [isScrollingDown, onScrollDirectionChange]);

  const loadPosts = async () => {
    try {
      setLoading(true);
      const response = await newsfeedAPI.getPosts();
      
      // Get unique posts by id
      const uniquePostsMap = new Map();
      const postsData = response.data || [];
      
      // Transform posts to nest user data correctly
      postsData.forEach(post => {
        if (!uniquePostsMap.has(post.id)) {
          // Transform comments to nest user data
          const transformedComments = (post.comments || []).map(comment => ({
            ...comment,
            user: {
              id: comment.user_id,
              username: comment.username,
              full_name: comment.full_name,
              avatar_url: comment.avatar_url
            }
          }));
          
          const transformedPost = {
            ...post,
            user: {
              id: post.user_id,
              username: post.username,
              full_name: post.full_name,
              avatar_url: post.avatar_url,
              status: post.status
            },
            comments: transformedComments
          };
          
          uniquePostsMap.set(post.id, transformedPost);
        }
      });
      
      const transformedPosts = Array.from(uniquePostsMap.values());
      console.log('Loaded posts:', transformedPosts.length, transformedPosts);
      setPosts(transformedPosts);
    } catch (error) {
      console.error('Error loading posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadPosts();
    setRefreshing(false);
  };

  const handlePostCreated = () => {
    // Reload posts after creating
    loadPosts();
    setShowPostModal(false);
  };

  const handleOpenPostModal = () => {
    setShowPostModal(true);
  };

  const handleLike = (postId) => {
    // Toggle liked state
    const isLiked = likedPosts.has(postId);
    setLikedPosts(prev => {
      const newSet = new Set(prev);
      if (isLiked) {
        newSet.delete(postId);
      } else {
        newSet.add(postId);
      }
      return newSet;
    });

    // Add floating heart animation
    if (!isLiked) {
      const heartId = Date.now();
      setFloatingHearts(prev => [...prev, { id: heartId, postId }]);
      
      // Remove heart after animation
      setTimeout(() => {
        setFloatingHearts(prev => prev.filter(heart => heart.id !== heartId));
      }, 1000);
    }

    // Update post likes count
    setPosts(prev => prev.map(post => 
      post.id === postId 
        ? { ...post, likes_count: isLiked ? post.likes_count - 1 : post.likes_count + 1, isLiked: !isLiked }
        : post
    ));
  };

  const handlePostInputClick = () => {
    setShowPostModal(true);
  };

  const handleLongPressStart = (postId) => {
    const timer = setTimeout(() => {
      setShowReactionBar(postId);
    }, 300); // Show after 300ms
    setLongPressTimer(timer);
  };

  const handleLongPressEnd = () => {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }
  };

  const handleReactionSelect = (postId, reaction) => {
    // Close reaction bar
    setShowReactionBar(null);
    
    // Handle the reaction
    const isLiked = likedPosts.has(postId);
    setLikedPosts(prev => {
      const newSet = new Set(prev);
      if (!isLiked) {
        newSet.add(postId);
      }
      return newSet;
    });

    // Update post
    setPosts(prev => prev.map(post => 
      post.id === postId 
        ? { ...post, likes_count: isLiked ? post.likes_count : post.likes_count + 1, isLiked: true }
        : post
    ));
  };

  const handleQuickLike = (postId) => {
    // Clear timer if exists
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }
    
    // Only like if not showing reaction bar
    if (showReactionBar !== postId) {
      handleLike(postId);
    }
  };

  // Comment Modal Handlers
  const openCommentModal = async (post) => {
    setSelectedPost(post);
    setShowCommentModal(true);
    setCommentText('');
    
    // Load comments
    try {
      const response = await newsfeedAPI.getPostComments(post.id);
      setComments(response.data || []);
    } catch (error) {
      console.error('Error loading comments:', error);
      setComments([]);
    }
  };

  const closeCommentModal = () => {
    setShowCommentModal(false);
    setSelectedPost(null);
    setComments([]);
    setCommentText('');
  };

  const handleSendComment = async () => {
    if (!commentText.trim() || !selectedPost || isCommenting) return;
    
    setIsCommenting(true);
    try {
      const response = await newsfeedAPI.commentPost(selectedPost.id, commentText);
      
      // API returns comment with user info directly
      const newComment = response.data;
      
      setComments(prev => [...prev, newComment]);
      setCommentText('');
      
      // Update post comment count
      setPosts(prev => prev.map(post => 
        post.id === selectedPost.id 
          ? { ...post, comments_count: (post.comments_count || 0) + 1 }
          : post
      ));
    } catch (error) {
      console.error('Error sending comment:', error);
    } finally {
      setIsCommenting(false);
    }
  };

  const getAvatarColor = (name) => {
    const colors = [
      'linear-gradient(135deg, #0068ff 0%, #00a651 100%)',
      'linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%)',
      'linear-gradient(135deg, #4834d4 0%, #686de0 100%)',
      'linear-gradient(135deg, #00d2d3 0%, #54a0ff 100%)',
    ];
    const index = name ? name.charCodeAt(0) % colors.length : 0;
    return colors[index];
  };

  const formatTime = (date) => {
    if (!date) return '';
    const now = new Date();
    const postDate = new Date(date);
    const diffInMs = now - postDate;
    const diffInSeconds = Math.floor(diffInMs / 1000);
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    const diffInHours = Math.floor(diffInMinutes / 60);
    const diffInDays = Math.floor(diffInHours / 24);
    
    if (diffInSeconds < 60) return 'Vừa xong';
    if (diffInMinutes < 60) return `${diffInMinutes} phút trước`;
    if (diffInHours < 24) return `${diffInHours} giờ trước`;
    if (diffInDays < 7) return `${diffInDays} ngày trước`;
    
    // More than 1 week, show date
    return postDate.toLocaleDateString('vi-VN', { 
      day: 'numeric', 
      month: 'short' 
    });
  };

  return (
    <Container>
      {/* App Header */}
      <AppHeader>
        <LogoSection>
          <LogoImage src="/Zyea.jpg" alt="Zyea+ Logo" />
          <LogoText>Zyea+</LogoText>
        </LogoSection>
        <RightIcons>
          <HeaderIcon onClick={() => console.log('Search')}>
            <FiSearch />
          </HeaderIcon>
        </RightIcons>
      </AppHeader>

      {/* Post Creator */}
      <PostCreatorSection>
        <PostCreatorContent>
          <CreatorAvatar color={getAvatarColor(currentUser?.full_name)}>
            {currentUser?.avatar_url ? (
              <img src={getAvatarURL(currentUser.avatar_url)} alt={currentUser.full_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              getInitials(currentUser?.full_name || 'User')
            )}
          </CreatorAvatar>
          <PostInputWrapper>
            <PostInput 
              placeholder="Tạo bài viết..." 
              readOnly 
              onClick={handleOpenPostModal}
            />
          </PostInputWrapper>
          <ImageIconWrapper>
            <FiImage />
          </ImageIconWrapper>
        </PostCreatorContent>
      </PostCreatorSection>

      {/* Pull to Refresh */}
      <PullToRefresh onRefresh={handleRefresh}>
        {/* Filter Section */}
        <FilterSection>
          <FilterLeft>
            <FilterTitle>Bảng Feed</FilterTitle>
            <FilterText>Phù hợp nhất</FilterText>
          </FilterLeft>
          <FilterIcon>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
              <path d="M3 5a1 1 0 0 1 1-1h12a1 1 0 1 1 0 2H4a1 1 0 0 1-1-1zM3 10a1 1 0 0 1 1-1h12a1 1 0 1 1 0 2H4a1 1 0 0 1-1-1zM4 14a1 1 0 1 0 0 2h12a1 1 0 1 0 0-2H4z" />
            </svg>
          </FilterIcon>
        </FilterSection>

        {/* Content */}
        <ContentArea ref={contentAreaRef}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>Đang tải...</div>
          ) : posts.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
              <div style={{ color: 'var(--text-primary)' }}>Chưa có bài viết nào</div>
              <div style={{ fontSize: '14px', marginTop: '8px', color: 'var(--text-secondary)' }}>Hãy đăng bài đầu tiên!</div>
            </div>
          ) : (
            posts.map((post) => (
              <PostCard key={post.id}>
                <PostHeader>
                  <PostAuthor>
                    <AuthorAvatar color={getAvatarColor(post.user?.full_name)}>
                      {post.user?.avatar_url ? (
                        <img src={getAvatarURL(post.user.avatar_url)} alt={post.user.full_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        'FN'
                      )}
                    </AuthorAvatar>
                    <AuthorInfo>
                      <AuthorName>{post.user?.full_name || 'Người dùng'}</AuthorName>
                      <PostMeta>{formatTime(post.created_at)}</PostMeta>
                    </AuthorInfo>
                  </PostAuthor>
                  <PostMoreButton>
                    <FiMoreHorizontal />
                  </PostMoreButton>
                </PostHeader>

                <PostContent>
                  {post.title && (
                    <PostTitle>
                      {post.title}
                      <HeartIcon>💚</HeartIcon>
                      <HeartIcon style={{ color: '#ff69b4' }}>💚</HeartIcon>
                    </PostTitle>
                  )}
                  {post.content && (
                    <PostText>
                      {post.content.substring(0, 100)}
                      {post.content.length > 100 && (
                        <>
                          ... <PostSeeMore>Xem thêm</PostSeeMore>
                        </>
                      )}
                    </PostText>
                  )}
                </PostContent>

                {post.image_url && (
                  <PostImages>
                    <PostImage src={getUploadedImageURL(post.image_url)} alt="Post" />
                  </PostImages>
                )}

                <PostReactions>
                  <ReactionsLeft>
                    <ReactionIcons>
                      {likedPosts.has(post.id) ? (
                        <>
                          <FiThumbsUp style={{ color: 'var(--primary-color)' }} />
                          <HeartIcon style={{ color: '#ff4454' }}>💚</HeartIcon>
                        </>
                      ) : (
                        <>
                          <FiThumbsUp style={{ color: 'var(--primary-color)' }} />
                          <HeartIcon style={{ color: '#ff4454' }}>💚</HeartIcon>
                          <span style={{ fontSize: '14px' }}>😠</span>
                        </>
                      )}
                    </ReactionIcons>
                    <ReactionCount>{post.likes_count || 0}</ReactionCount>
                  </ReactionsLeft>
                  <ViewsCount>258 người đã xem</ViewsCount>
                </PostReactions>

                <PostActions>
                  <ActionButton 
                    liked={likedPosts.has(post.id)}
                    onTouchStart={() => handleLongPressStart(post.id)}
                    onTouchEnd={handleLongPressEnd}
                    onMouseDown={() => handleLongPressStart(post.id)}
                    onMouseUp={handleLongPressEnd}
                    onMouseLeave={handleLongPressEnd}
                    onClick={() => handleQuickLike(post.id)}
                  >
                    {likedPosts.has(post.id) ? (
                      <FiHeart size={16} fill="var(--primary-color)" />
                    ) : (
                      <FiThumbsUp size={16} />
                    )}
                    Thích
                    {showReactionBar === post.id && (
                      <ReactionBar>
                        <ReactionEmoji onClick={() => handleReactionSelect(post.id, 'like')}>
                          👍
                        </ReactionEmoji>
                        <ReactionEmoji onClick={() => handleReactionSelect(post.id, 'heart')}>
                          ❤️
                        </ReactionEmoji>
                        <ReactionEmoji onClick={() => handleReactionSelect(post.id, 'laugh')}>
                          😂
                        </ReactionEmoji>
                        <ReactionEmoji onClick={() => handleReactionSelect(post.id, 'sad')}>
                          😢
                        </ReactionEmoji>
                        <ReactionEmoji onClick={() => handleReactionSelect(post.id, 'angry')}>
                          😠
                        </ReactionEmoji>
                        <ReactionEmoji onClick={() => handleReactionSelect(post.id, 'surprised')}>
                          😮
                        </ReactionEmoji>
                        <ReactionEmoji onClick={() => handleReactionSelect(post.id, 'shocked')}>
                          😱
                        </ReactionEmoji>
                      </ReactionBar>
                    )}
                    {floatingHearts
                      .filter(heart => heart.postId === post.id)
                      .map(heart => (
                        <FloatingHeart key={heart.id}>
                          💚
                        </FloatingHeart>
                      ))
                    }
                  </ActionButton>
                  <ActionButton onClick={() => openCommentModal(post)}>
                    <FiMessageCircle size={16} />
                    Bình luận
                  </ActionButton>
                  <ActionButton>
                    <FiShare2 size={16} />
                    Chia sẻ
                  </ActionButton>
                </PostActions>
              </PostCard>
            ))
          )}
        </ContentArea>
      </PullToRefresh>

      {/* Post Creator Modal */}
      <MobilePostCreatorModal
        isOpen={showPostModal}
        onClose={() => setShowPostModal(false)}
        currentUser={currentUser}
        onPostCreated={handlePostCreated}
      />

      {/* Comment View (Full Screen) */}
      {showCommentModal && selectedPost && (
        <CommentView>
          <CommentViewHeader>
            <CommentViewBackButton onClick={closeCommentModal}>
              <FiArrowLeft size={20} />
            </CommentViewBackButton>
            <CommentViewTitle>Bình luận</CommentViewTitle>
            <CommentViewMoreButton>
              <FiMoreHorizontal size={20} />
            </CommentViewMoreButton>
          </CommentViewHeader>

          {/* Post Preview */}
          <CommentViewPostSection>
            <PostPreviewHeader>
              <PostPreviewAuthor>{selectedPost.user?.full_name || 'Người dùng'}</PostPreviewAuthor>
              <PostPreviewMeta>{formatTime(selectedPost.created_at)}</PostPreviewMeta>
            </PostPreviewHeader>
            
            {selectedPost.title && (
              <PostPreviewContent style={{ fontWeight: 600, marginBottom: '6px' }}>
                {selectedPost.title}
              </PostPreviewContent>
            )}
            
            {selectedPost.content && (
              <PostPreviewContent>
                {selectedPost.content.length > 100 
                  ? selectedPost.content.substring(0, 100) + '...'
                  : selectedPost.content
                }
              </PostPreviewContent>
            )}
            
            {selectedPost.image_url && (
              <PostPreviewImage 
                src={getUploadedImageURL(selectedPost.image_url)} 
                alt="Post" 
              />
            )}
          </CommentViewPostSection>

          {/* Comments List */}
          <CommentListContainer>
            {comments.length > 0 ? (
              comments.map((comment, index) => (
                <CommentItem key={index}>
                  <CommentAvatar color={getAvatarColor(comment.full_name)}>
                    {comment.avatar_url ? (
                      <img 
                        src={getAvatarURL(comment.avatar_url)} 
                        alt={comment.full_name} 
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                      />
                    ) : (
                      getInitials(comment.full_name || 'User')
                    )}
                  </CommentAvatar>
                  <CommentContent>
                    <CommentAuthor>
                      {comment.full_name || comment.username || 'Người dùng'}
                    </CommentAuthor>
                    <CommentText>{comment.content}</CommentText>
                    <CommentTime>{formatTime(comment.created_at)}</CommentTime>
                  </CommentContent>
                </CommentItem>
              ))
            ) : (
              <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
                Chưa có bình luận nào
              </div>
            )}
          </CommentListContainer>

          {/* Input Box */}
          <CommentInputContainer>
            <CommentInputWrapper>
              <CommentInputIcon onClick={() => console.log('Camera')}>
                <FiCamera size={18} />
              </CommentInputIcon>
              <CommentInputField
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Viết bình luận..."
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendComment();
                  }
                }}
              />
              <CommentInputIcon onClick={() => console.log('GIF')} style={{ fontSize: '16px', fontWeight: 'bold' }}>
                GIF
              </CommentInputIcon>
              {commentText.trim() && (
                <CommentSendButton 
                  onClick={handleSendComment}
                  disabled={isCommenting}
                >
                  <FiSend size={14} />
                </CommentSendButton>
              )}
            </CommentInputWrapper>
          </CommentInputContainer>
        </CommentView>
      )}
    </Container>
  );
};

export default MobileFeedView;

