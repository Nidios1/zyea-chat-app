import React, { useState, useEffect, useCallback } from 'react';
import styled from 'styled-components';
import { 
  FiImage, 
  FiSmile, 
  FiMoreHorizontal, 
  FiHeart, 
  FiMessageCircle, 
  FiShare2, 
  FiThumbsUp,
  FiSearch,
  FiEdit3,
  FiBell,
  FiCamera,
  FiVideo,
  FiFolder,
  FiClock,
  FiPlus,
  FiUsers,
  FiGrid,
  FiHome,
  FiUser
} from 'react-icons/fi';
import PostCreator from './PostCreator';
import Post from './Post';
import PostCreatorModal from './PostCreatorModal';
import PullToRefresh from '../Common/PullToRefresh';
import { newsfeedAPI } from '../../utils/api';
import { getInitials } from '../../utils/nameUtils';
import { getAvatarURL, getUploadedImageURL } from '../../utils/imageUtils';

const NewsFeedContainer = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: var(--bg-secondary, #f8f9fa);
  z-index: 1000;

  @media (max-width: 768px) {
    background: var(--bg-secondary, #f8f9fa);
    /* Add padding for bottom nav instead of reducing bottom */
    padding-bottom: calc(60px + env(safe-area-inset-bottom));
  }
`;

const TopBar = styled.div`
  background: var(--header-bg, #0084ff);
  padding: 8px 12px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  color: white;
  
  /* Safe area for iPhone notch/Dynamic Island */
  @media (max-width: 768px) {
    padding-top: calc(8px + env(safe-area-inset-top));
  }
`;

const SearchSection = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 20px;
  padding: 6px 12px;
`;

const SearchIcon = styled.div`
  font-size: 18px;
  display: flex;
  align-items: center;
  color: rgba(255, 255, 255, 0.9);
`;

const SearchText = styled.span`
  font-size: 14px;
  font-weight: 400;
  color: white;
`;

const HeaderActions = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  margin-left: 12px;
`;

const HeaderButton = styled.button`
  background: none;
  border: none;
  color: white;
  font-size: 20px;
  cursor: pointer;
  padding: 6px;
  border-radius: 50%;
  transition: background 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;

  &:active {
    background: rgba(255, 255, 255, 0.2);
    opacity: 0.7;
  }
`;

const TabBar = styled.div`
  background: var(--bg-primary, white);
  display: flex;
  border-bottom: 1px solid var(--border-color, #e1e5e9);
`;

const Tab = styled.button`
  flex: 1;
  padding: 1rem;
  background: none;
  border: none;
  font-size: 1rem;
  font-weight: 600;
  color: ${props => props.active ? 'var(--text-primary, #333)' : 'var(--text-secondary, #666)'};
  border-bottom: ${props => props.active ? '2px solid var(--text-primary, #333)' : '2px solid transparent'};
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: var(--bg-secondary, #f5f5f5);
  }

  &:active {
    opacity: 0.7;
  }
`;

const Header = styled.div`
  background: var(--bg-primary, white);
  padding: 1rem 2rem;
  border-bottom: 1px solid var(--border-color, #e1e5e9);
  position: sticky;
  top: 0;
  z-index: 10;
  box-shadow: 0 2px 4px var(--shadow-color, rgba(0, 0, 0, 0.1));
  display: flex;
  align-items: center;
  justify-content: space-between;

  @media (max-width: 768px) {
    padding: 0.75rem 1rem;
  }

  @media (max-width: 480px) {
    padding: 0.5rem 0.75rem;
  }
`;

const LeftSection = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
`;

const BackButton = styled.button`
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: var(--text-secondary, #666);
  padding: 0.5rem;
  border-radius: 50%;
  transition: all 0.2s ease;
  
  &:hover {
    background: var(--bg-secondary, #f0f0f0);
    color: var(--text-primary, #333);
  }

  &:active {
    opacity: 0.7;
  }
`;

const HeaderTitle = styled.h1`
  margin: 0;
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--text-primary, #333);
`;

const RightSection = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;


const Content = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 0;
  height: 100%;
  -webkit-overflow-scrolling: touch;
  scroll-behavior: smooth;
  will-change: scroll-position;
  transform: translateZ(0);
  backface-visibility: hidden;
  perspective: 1000px;

  @media (max-width: 768px) {
    padding: 0;
    height: calc(100vh - 60px);
    /* Hardware acceleration for mobile */
    -webkit-transform: translate3d(0, 0, 0);
    transform: translate3d(0, 0, 0);
  }
`;

const PostCreatorSection = styled.div`
  background: var(--bg-primary, white);
  padding: 1rem;
  margin-bottom: 0.5rem;
  border-bottom: 1px solid var(--border-color, #e1e5e9);
`;

const PostCreatorHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1rem;
`;

const UserAvatar = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: var(--primary-color, #0084ff);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 600;
  font-size: 16px;
`;

const PostInput = styled.input`
  flex: 1;
  padding: 0.75rem 1rem;
  border: 1px solid var(--border-color, #e1e5e9);
  border-radius: 20px;
  background: var(--bg-secondary, #f8f9fa);
  font-size: 14px;
  outline: none;
  cursor: pointer;
  color: var(--text-primary, #000);

  &::placeholder {
    color: var(--text-secondary, #666);
  }

  &:focus {
    border-color: var(--primary-color, #0084ff);
    background: var(--bg-primary, white);
  }
`;

const PostActions = styled.div`
  display: flex;
  gap: 1rem;
  margin-top: 0.75rem;
`;

const PostActionButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border: 1px solid var(--border-color, #e1e5e9);
  border-radius: 20px;
  background: var(--bg-primary, white);
  color: var(--text-secondary, #666);
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: var(--bg-secondary, #f8f9fa);
    border-color: var(--primary-color, #0084ff);
    color: var(--primary-color, #0084ff);
  }

  &:active {
    opacity: 0.7;
  }
`;

const MomentsSection = styled.div`
  background: var(--bg-primary, white);
  padding: 1rem;
  margin-bottom: 0.5rem;
  border-bottom: 1px solid var(--border-color, #e1e5e9);
`;

const MomentsTitle = styled.h3`
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary, #333);
  margin-bottom: 0.75rem;
`;

const MomentsList = styled.div`
  display: flex;
  gap: 0.75rem;
  overflow-x: auto;
  padding-bottom: 0.5rem;

  &::-webkit-scrollbar {
    display: none;
  }
`;

const MomentCard = styled.div`
  min-width: 80px;
  height: 100px;
  border-radius: 12px;
  background: ${props => props.background || 'linear-gradient(135deg, #0084ff 0%, #00a651 100%)'};
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  position: relative;
  overflow: hidden;

  &:first-child {
    background: linear-gradient(135deg, #0084ff 0%, #00a651 100%);
  }
`;

const MomentAvatar = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 0.25rem;
  border: 2px solid white;
`;

const MomentName = styled.span`
  font-size: 11px;
  text-align: center;
  line-height: 1.2;
`;

const PromotionalBanner = styled.div`
  background: linear-gradient(135deg, #e3f2fd 0%, #f3e5f5 100%);
  margin: 0.5rem 1rem;
  padding: 1.5rem;
  border-radius: 12px;
  position: relative;
  overflow: hidden;
`;

const BannerContent = styled.div`
  position: relative;
  z-index: 2;
`;

const BannerTitle = styled.h3`
  font-size: 18px;
  font-weight: 700;
  color: #333;
  margin-bottom: 0.5rem;
`;

const BannerSubtitle = styled.p`
  font-size: 14px;
  color: #666;
  margin-bottom: 1rem;
`;

const BannerButton = styled.button`
  background: #0084ff;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: #0066cc;
    transform: translateY(-1px);
  }
`;

const BannerDecorations = styled.div`
  position: absolute;
  top: 0;
  right: 0;
  width: 100px;
  height: 100px;
  opacity: 0.3;
  z-index: 1;
`;

const BottomNavigation = styled.div`
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: var(--bg-primary, white);
  border-top: 1px solid var(--border-color, #e1e5e9);
  display: flex;
  z-index: 1001;
  padding: 0.5rem 0;
  box-shadow: 0 -2px 8px var(--shadow-color, rgba(0, 0, 0, 0.1));

  @media (min-width: 769px) {
    display: none;
  }
`;

const BottomNavItem = styled.button`
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
  background: none;
  border: none;
  padding: 0.5rem;
  cursor: pointer;
  color: ${props => props.active ? 'var(--primary-color, #0084ff)' : 'var(--text-secondary, #666)'};
  transition: color 0.2s ease;
  position: relative;

  &:hover {
    color: var(--primary-color, #0084ff);
  }

  &:active {
    opacity: 0.7;
  }
`;

const BottomNavIcon = styled.div`
  font-size: 1.2rem;
  position: relative;
`;

const BottomNavLabel = styled.span`
  font-size: 0.75rem;
  font-weight: 500;
`;

const NotificationBadge = styled.div`
  position: absolute;
  top: -2px;
  right: -2px;
  background: #ff4444;
  color: white;
  border-radius: 50%;
  width: 16px;
  height: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.6rem;
  font-weight: 600;
`;

const PostsContainer = styled.div`
  display: flex;
  flex-direction: column;
  min-height: 100%;
  padding-bottom: 1rem;
  /* Optimize for smooth scrolling */
  contain: layout style paint;
  will-change: transform;
`;

const LoadingSpinner = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 2rem;
  color: var(--text-secondary, #666);
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 3rem 1rem;
  color: var(--text-secondary, #666);
  
  h3 {
    margin: 0 0 0.5rem 0;
    font-size: 1.2rem;
    font-weight: 600;
    color: var(--text-primary, #333);
  }
  
  p {
    margin: 0;
    font-size: 0.9rem;
    color: var(--text-secondary, #666);
  }
`;


const NewsFeed = ({ currentUser, onBack, onGoToMessages, onNavigateToContacts, onNavigateToExplore, onNavigateToProfile, showBottomNav = true }) => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('newsfeed');
  const [activeBottomNav, setActiveBottomNav] = useState('newsfeed');
  const [showPostModal, setShowPostModal] = useState(false);

  useEffect(() => {
    loadPosts();
  }, []);

  const loadPosts = async () => {
    try {
      setLoading(true);
      const response = await newsfeedAPI.getPosts();
      console.log('Posts data:', response.data);
      setPosts(response.data);
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

  const handleCreatePost = async (postData) => {
    try {
      console.log('Creating post with data:', postData);
      const response = await newsfeedAPI.createPost(postData);
      console.log('Post created successfully:', response.data);
      setPosts(prev => [response.data, ...prev]);
    } catch (error) {
      console.error('Error creating post:', error);
      console.error('Error response:', error.response?.data);
      alert('Có lỗi xảy ra khi đăng bài: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleLikePost = useCallback(async (postId, reactionType = 'like') => {
    try {
      await newsfeedAPI.likePost(postId, { reactionType });
      setPosts(prev => prev.map(post => 
        post.id === postId 
          ? { 
              ...post, 
              isLiked: !post.isLiked,
              likes_count: post.isLiked ? post.likes_count - 1 : post.likes_count + 1,
              reactionType: reactionType
            }
          : post
      ));
    } catch (error) {
      console.error('Error liking post:', error);
    }
  }, []);

  const handleCommentPost = useCallback(async (postId, comment) => {
    try {
      await newsfeedAPI.commentPost(postId, comment);
      // Reload posts to get updated comments
      await loadPosts();
    } catch (error) {
      console.error('Error commenting on post:', error);
    }
  }, []);

  const handleSharePost = useCallback(async (postId) => {
    try {
      await newsfeedAPI.sharePost(postId);
      alert('Đã chia sẻ bài viết');
    } catch (error) {
      console.error('Error sharing post:', error);
    }
  }, []);

  const handleDeletePost = useCallback(async (postId) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa bài viết này?')) {
      try {
        await newsfeedAPI.deletePost(postId);
        setPosts(prev => prev.filter(post => post.id !== postId));
      } catch (error) {
        console.error('Error deleting post:', error);
        alert('Có lỗi xảy ra khi xóa bài viết');
      }
    }
  }, []);

  const handleGoToMessages = () => {
    if (onGoToMessages) {
      onGoToMessages();
    }
  };

  const handleBottomNavClick = (tab) => {
    setActiveBottomNav(tab);
    switch(tab) {
      case 'messages':
        if (onGoToMessages) {
          onGoToMessages();
        }
        break;
      case 'contacts':
        if (onNavigateToContacts) {
          onNavigateToContacts();
        } else {
          console.log('Navigate to contacts - no handler provided');
        }
        break;
      case 'explore':
        if (onNavigateToExplore) {
          onNavigateToExplore();
        } else {
          console.log('Navigate to explore - no handler provided');
        }
        break;
      case 'newsfeed':
        // Already on newsfeed, just update state
        break;
      case 'profile':
        if (onNavigateToProfile) {
          onNavigateToProfile();
        } else {
          console.log('Navigate to profile - no handler provided');
        }
        break;
      default:
        break;
    }
  };

  const handlePostInputClick = () => {
    setShowPostModal(true);
  };

  const handlePostCreated = (postData) => {
    console.log('Post created:', postData);
    // Reload posts after creating new post
    loadPosts();
    setShowPostModal(false);
  };

  if (loading) {
    return (
      <NewsFeedContainer>
        <Header>
          <HeaderTitle>Bảng tin</HeaderTitle>
        </Header>
        <LoadingSpinner>Đang tải...</LoadingSpinner>
      </NewsFeedContainer>
    );
  }

  return (
    <NewsFeedContainer className="newsfeed-container">
      {/* Top Bar */}
      <TopBar>
        <SearchSection>
          <SearchIcon>
            <FiSearch />
          </SearchIcon>
          <SearchText>Tìm kiếm</SearchText>
        </SearchSection>
        <HeaderActions>
          <HeaderButton>
            <FiEdit3 />
          </HeaderButton>
          <HeaderButton>
            <FiBell />
          </HeaderButton>
        </HeaderActions>
      </TopBar>

      {/* Tab Bar */}
      <TabBar>
        <Tab active={activeTab === 'newsfeed'} onClick={() => setActiveTab('newsfeed')}>
          Nhật Ký
        </Tab>
        <Tab active={activeTab === 'video'} onClick={() => setActiveTab('video')}>
          Zyea+ Video
        </Tab>
      </TabBar>
      
      <PullToRefresh onRefresh={handleRefresh}>
        <Content className="newsfeed-content">
          {/* Post Creator Section */}
          <PostCreatorSection>
          <PostCreatorHeader>
            <UserAvatar>
              {currentUser?.avatar_url ? (
                <img src={getAvatarURL(currentUser.avatar_url)} alt={currentUser.full_name} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
              ) : (
                getInitials(currentUser?.fullName || currentUser?.full_name)
              )}
            </UserAvatar>
            <PostInput 
              placeholder="Hôm nay bạn thế nào?" 
              onClick={handlePostInputClick}
              readOnly
            />
          </PostCreatorHeader>
          <PostActions>
            <PostActionButton>
              <FiCamera style={{ color: '#4CAF50' }} />
              Ảnh
            </PostActionButton>
            <PostActionButton>
              <FiVideo style={{ color: '#E91E63' }} />
              Video
            </PostActionButton>
            <PostActionButton>
              <FiFolder style={{ color: '#2196F3' }} />
              Album
            </PostActionButton>
            <PostActionButton>
              <FiClock style={{ color: '#FF9800' }} />
              Kỷ niệm
            </PostActionButton>
          </PostActions>
        </PostCreatorSection>

        {/* Moments Section */}
        <MomentsSection>
          <MomentsTitle>Khoảnh khắc</MomentsTitle>
          <MomentsList>
            <MomentCard>
              <MomentAvatar>
                <FiPlus />
              </MomentAvatar>
              <MomentName>Tạo mới</MomentName>
            </MomentCard>
            <MomentCard background="linear-gradient(135deg, #667eea 0%, #764ba2 100%)">
              <MomentAvatar>T</MomentAvatar>
              <MomentName>Thị Thuý</MomentName>
            </MomentCard>
            <MomentCard background="linear-gradient(135deg, #f093fb 0%, #f5576c 100%)">
              <MomentAvatar>N</MomentAvatar>
              <MomentName>Nguyễn Na...</MomentName>
            </MomentCard>
            <MomentCard background="linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)">
              <MomentAvatar>Q</MomentAvatar>
              <MomentName>Quyên Mit</MomentName>
            </MomentCard>
          </MomentsList>
        </MomentsSection>

        {/* Promotional Banner */}
        <PromotionalBanner>
          <BannerContent>
            <BannerTitle>Gửi thiệp chúc 20/10</BannerTitle>
            <BannerSubtitle>Cảm ơn người phụ nữ tuyệt vời</BannerSubtitle>
            <BannerButton>Tạo thiệp cùng Zyea+</BannerButton>
          </BannerContent>
          <BannerDecorations>
            {/* Decorative elements */}
          </BannerDecorations>
        </PromotionalBanner>

        {/* Posts */}
        <PostsContainer>
          {posts.length === 0 ? (
            <EmptyState>
              <h3>Chưa có bài viết nào</h3>
              <p>Hãy đăng bài đầu tiên của bạn!</p>
            </EmptyState>
          ) : (
            posts.map(post => (
              <Post
                key={post.id}
                post={post}
                currentUser={currentUser}
                onLike={handleLikePost}
                onComment={handleCommentPost}
                onShare={handleSharePost}
                onDelete={handleDeletePost}
              />
            ))
          )}
        </PostsContainer>
        </Content>
      </PullToRefresh>

      {/* Bottom Navigation - Only show if showBottomNav is true */}
      {showBottomNav && (
        <BottomNavigation>
          <BottomNavItem 
            active={activeBottomNav === 'messages'} 
            onClick={() => handleBottomNavClick('messages')}
          >
            <BottomNavIcon>
              <FiMessageCircle />
              <NotificationBadge>0</NotificationBadge>
            </BottomNavIcon>
            <BottomNavLabel>Tin nhắn</BottomNavLabel>
          </BottomNavItem>

          <BottomNavItem 
            active={activeBottomNav === 'contacts'} 
            onClick={() => handleBottomNavClick('contacts')}
          >
            <BottomNavIcon>
              <FiUsers />
            </BottomNavIcon>
            <BottomNavLabel>Danh bạ</BottomNavLabel>
          </BottomNavItem>

          <BottomNavItem 
            active={activeBottomNav === 'explore'} 
            onClick={() => handleBottomNavClick('explore')}
          >
            <BottomNavIcon>
              <FiGrid />
              <NotificationBadge>1</NotificationBadge>
            </BottomNavIcon>
            <BottomNavLabel>Khám phá</BottomNavLabel>
          </BottomNavItem>

          <BottomNavItem 
            active={activeBottomNav === 'newsfeed'}
            onClick={() => handleBottomNavClick('newsfeed')}
          >
            <BottomNavIcon>
              <FiHome />
            </BottomNavIcon>
            <BottomNavLabel>Tường nhà</BottomNavLabel>
          </BottomNavItem>

          <BottomNavItem 
            active={activeBottomNav === 'profile'} 
            onClick={() => handleBottomNavClick('profile')}
          >
            <BottomNavIcon>
              <FiUser />
            </BottomNavIcon>
            <BottomNavLabel>Cá nhân</BottomNavLabel>
          </BottomNavItem>
        </BottomNavigation>
      )}

      {/* Post Creator Modal */}
      <PostCreatorModal
        isOpen={showPostModal}
        onClose={() => setShowPostModal(false)}
        currentUser={currentUser}
        onPostCreated={handlePostCreated}
      />
    </NewsFeedContainer>
  );
};

export default NewsFeed;
