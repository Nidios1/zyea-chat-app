import React, { useState, memo } from 'react';
import styled from 'styled-components';
import { 
  FiMoreHorizontal, 
  FiHeart, 
  FiMessageCircle, 
  FiShare2, 
  FiThumbsUp,
  FiTrash2,
  FiEdit3
} from 'react-icons/fi';
import ReactionBar from './ReactionBar';
import { getInitials } from '../../utils/nameUtils';
import { getAvatarURL, getUploadedImageURL } from '../../utils/imageUtils';

const PostContainer = styled.div`
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  border: 1px solid #e1e5e9;
  position: relative;
  width: 100%;
  margin-bottom: 1rem;
  /* Performance optimizations */
  contain: layout style paint;
  will-change: auto;
  transform: translateZ(0);
  backface-visibility: hidden;
`;

const PostHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.75rem;
`;

const UserInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
`;

const UserAvatar = styled.div`
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: ${props => props.color || 'linear-gradient(135deg, #0068ff 0%, #00a651 100%)'};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.4rem;
  color: white;
  font-weight: 600;
  border: 2px solid white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
`;

const UserDetails = styled.div`
  flex: 1;
`;

const UserName = styled.div`
  font-weight: 600;
  color: #333;
  font-size: 1rem;
  margin-bottom: 0.1rem;
`;

const PostTime = styled.div`
  font-size: 0.85rem;
  color: #666;
`;

const PostActions = styled.div`
  position: relative;
`;

const MoreButton = styled.button`
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: none;
  background: #f5f5f5;
  color: #666;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  
  &:hover {
    background: #e0e0e0;
  }
`;

const DropdownMenu = styled.div`
  position: absolute;
  top: 100%;
  right: 0;
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  border: 1px solid #e1e5e9;
  z-index: 10;
  min-width: 120px;
  overflow: hidden;
`;

const DropdownItem = styled.button`
  width: 100%;
  padding: 0.75rem 1rem;
  border: none;
  background: white;
  color: #333;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.85rem;
  transition: all 0.2s ease;
  
  &:hover {
    background: #f5f5f5;
  }
  
  &.danger {
    color: #e74c3c;
    
    &:hover {
      background: #ffeaea;
    }
  }
`;

const PostContent = styled.div`
  margin-bottom: 1rem;
  line-height: 1.6;
  font-size: 1rem;
  color: #333;
  white-space: pre-wrap;
  word-wrap: break-word;
`;

const PostImage = styled.img`
  width: 100%;
  max-height: 500px;
  object-fit: cover;
  border-radius: 12px;
  margin-bottom: 1rem;
  cursor: pointer;
  
  &:hover {
    opacity: 0.95;
  }
`;

const PostStats = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.5rem 0;
  border-bottom: 1px solid #f0f0f0;
  margin-bottom: 0.5rem;
`;

const LikesCount = styled.div`
  font-size: 0.8rem;
  color: #666;
  display: flex;
  align-items: center;
  gap: 0.25rem;
`;

const CommentsCount = styled.div`
  font-size: 0.8rem;
  color: #666;
`;

const PostInteractions = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const InteractionButton = styled.button`
  flex: 1;
  padding: 0.75rem;
  border: none;
  background: transparent;
  color: #666;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  border-radius: 8px;
  font-size: 0.9rem;
  font-weight: 500;
  transition: all 0.2s ease;
  position: relative;
  
  &:hover {
    background: #f5f5f5;
    transform: scale(1.05);
  }
  
  &.liked {
    color: #e74c3c;
  }
  
  &.like-button {
    &:hover {
      background: rgba(231, 76, 60, 0.1);
      color: #e74c3c;
    }
    
    /* Mobile touch optimization */
    @media (max-width: 768px) {
      touch-action: manipulation;
      -webkit-tap-highlight-color: transparent;
      
      &:active {
        background: rgba(231, 76, 60, 0.2);
        transform: scale(0.95);
      }
    }
  }
`;

const CommentSection = styled.div`
  margin-top: 0.75rem;
  padding-top: 0.75rem;
  border-top: 1px solid #f0f0f0;
`;

const CommentInput = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const CommentAvatar = styled.div`
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: ${props => props.color || 'linear-gradient(135deg, #0068ff 0%, #00a651 100%)'};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.9rem;
  color: white;
  font-weight: 600;
  flex-shrink: 0;
`;

const CommentInputField = styled.input`
  flex: 1;
  padding: 0.75rem 1rem;
  border: 1px solid #ddd;
  border-radius: 25px;
  font-size: 0.9rem;
  outline: none;
  transition: all 0.2s ease;
  
  &:focus {
    border-color: #0068ff;
  }
  
  &::placeholder {
    color: #999;
  }
`;

const CommentButton = styled.button`
  padding: 0.75rem 1.25rem;
  background: #0068ff;
  color: white;
  border: none;
  border-radius: 25px;
  font-size: 0.85rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background: #0056cc;
  }
  
  &:disabled {
    background: #ccc;
    cursor: not-allowed;
  }
`;

const CommentsList = styled.div`
  margin-top: 0.75rem;
  max-height: 200px;
  overflow-y: auto;
`;

const Comment = styled.div`
  display: flex;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
`;

const CommentContent = styled.div`
  background: #f5f5f5;
  padding: 0.5rem 0.75rem;
  border-radius: 12px;
  flex: 1;
`;

const CommentAuthor = styled.div`
  font-weight: 600;
  font-size: 0.85rem;
  color: #333;
  margin-bottom: 0.1rem;
`;

const CommentText = styled.div`
  font-size: 0.85rem;
  color: #333;
  line-height: 1.4;
`;

const Post = ({ post, currentUser, onLike, onComment, onShare, onDelete }) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [isCommenting, setIsCommenting] = useState(false);
  const [showReactionBar, setShowReactionBar] = useState(false);
  const [currentReaction, setCurrentReaction] = useState(null);

  const getAvatarColor = (name) => {
    if (!name) return 'linear-gradient(135deg, #0068ff 0%, #00a651 100%)';
    
    const colors = [
      'linear-gradient(135deg, #0068ff 0%, #00a651 100%)',
      'linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%)',
      'linear-gradient(135deg, #4834d4 0%, #686de0 100%)',
      'linear-gradient(135deg, #00d2d3 0%, #54a0ff 100%)',
      'linear-gradient(135deg, #ff9ff3 0%, #f368e0 100%)',
      'linear-gradient(135deg, #feca57 0%, #ff9ff3 100%)',
      'linear-gradient(135deg, #48dbfb 0%, #0abde3 100%)',
      'linear-gradient(135deg, #ff6348 0%, #ff4757 100%)',
      'linear-gradient(135deg, #5f27cd 0%, #341f97 100%)',
      'linear-gradient(135deg, #00d2d3 0%, #01a3a4 100%)'
    ];
    
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  };

  const formatTime = (timestamp) => {
    const now = new Date();
    const postTime = new Date(timestamp);
    const diffInMinutes = Math.floor((now - postTime) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Vừa xong';
    if (diffInMinutes < 60) return `${diffInMinutes} phút trước`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours} giờ trước`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays} ngày trước`;
    
    return postTime.toLocaleDateString('vi-VN');
  };

  const handleLike = () => {
    onLike(post.id);
  };

  const handleComment = async () => {
    if (!commentText.trim()) return;
    
    setIsCommenting(true);
    try {
      await onComment(post.id, commentText.trim());
      setCommentText('');
    } catch (error) {
      console.error('Error commenting:', error);
    } finally {
      setIsCommenting(false);
    }
  };

  const handleShare = () => {
    onShare(post.id);
  };

  const handleDelete = () => {
    onDelete(post.id);
    setShowDropdown(false);
  };

  const handleReaction = (reaction) => {
    setCurrentReaction(reaction);
    setShowReactionBar(false);
    // Call onLike with reaction type
    onLike(post.id, reaction.type);
  };

  const handleReactionBarEnter = () => {
    setShowReactionBar(true);
  };

  const handleReactionBarLeave = () => {
    setShowReactionBar(false);
  };

  const handleReactionBarTouch = (e) => {
    e.preventDefault();
    setShowReactionBar(true);
    // Auto-hide after 3 seconds on mobile
    setTimeout(() => {
      setShowReactionBar(false);
    }, 3000);
  };

  const isOwner = post.user_id === currentUser?.id;

  return (
    <PostContainer>
      <PostHeader>
        <UserInfo>
          <UserAvatar color={getAvatarColor(post.user?.full_name)}>
            {post.user?.avatar_url ? (
              <img src={getAvatarURL(post.user.avatar_url)} alt={post.user.full_name} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
            ) : (
              getInitials(post.user?.full_name)
            )}
          </UserAvatar>
          <UserDetails>
            <UserName>{post.user?.full_name || post.user?.username || 'Người dùng'}</UserName>
            <PostTime>{formatTime(post.created_at)}</PostTime>
          </UserDetails>
        </UserInfo>
        
        <PostActions>
          <MoreButton onClick={() => setShowDropdown(!showDropdown)}>
            <FiMoreHorizontal size={16} />
          </MoreButton>
          
          {showDropdown && (
            <DropdownMenu>
              {isOwner && (
                <DropdownItem onClick={handleDelete} className="danger">
                  <FiTrash2 size={14} />
                  Xóa bài viết
                </DropdownItem>
              )}
            </DropdownMenu>
          )}
        </PostActions>
      </PostHeader>

      {post.content && (
        <PostContent>{post.content}</PostContent>
      )}

      {post.image_url && (
        <PostImage 
          src={getUploadedImageURL(post.image_url)} 
          alt="Post image"
          onClick={() => window.open(post.image_url, '_blank')}
        />
      )}

      <PostStats>
        <LikesCount>
          {post.likes_count > 0 && (
            <>
              <FiThumbsUp size={12} />
              {post.likes_count}
            </>
          )}
        </LikesCount>
        <CommentsCount>
          {post.comments_count > 0 && `${post.comments_count} bình luận`}
        </CommentsCount>
      </PostStats>

      <PostInteractions>
        <InteractionButton 
          onClick={handleLike}
          className={`like-button ${post.isLiked ? 'liked' : ''}`}
          onMouseEnter={handleReactionBarEnter}
          onMouseLeave={handleReactionBarLeave}
          onTouchStart={handleReactionBarTouch}
        >
          <FiHeart size={16} fill={post.isLiked ? 'currentColor' : 'none'} />
          Thích
          <ReactionBar
            onReaction={handleReaction}
            currentReaction={currentReaction}
            isVisible={showReactionBar}
            onMouseEnter={handleReactionBarEnter}
            onMouseLeave={handleReactionBarLeave}
          />
        </InteractionButton>
        
        <InteractionButton onClick={() => setShowComments(!showComments)}>
          <FiMessageCircle size={16} />
          Bình luận
        </InteractionButton>
        
        <InteractionButton onClick={handleShare}>
          <FiShare2 size={16} />
          Chia sẻ
        </InteractionButton>
      </PostInteractions>

      {showComments && (
        <CommentSection>
          <CommentInput>
            <CommentAvatar color={getAvatarColor(currentUser?.full_name)}>
              {currentUser?.avatar_url ? (
                <img src={getAvatarURL(currentUser.avatar_url)} alt={currentUser.full_name} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
              ) : (
                getInitials(currentUser?.full_name)
              )}
            </CommentAvatar>
            <CommentInputField
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Viết bình luận..."
              onKeyPress={(e) => e.key === 'Enter' && handleComment()}
            />
            <CommentButton 
              onClick={handleComment}
              disabled={!commentText.trim() || isCommenting}
            >
              {isCommenting ? 'Đang gửi...' : 'Gửi'}
            </CommentButton>
          </CommentInput>

          {post.comments && post.comments.length > 0 && (
            <CommentsList>
              {post.comments.map((comment, index) => (
                <Comment key={index}>
                  <CommentAvatar color={getAvatarColor(comment.user?.full_name)}>
                    {comment.user?.avatar_url ? (
                      <img src={getAvatarURL(comment.user.avatar_url)} alt={comment.user.full_name} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                    ) : (
                      getInitials(comment.user?.full_name)
                    )}
                  </CommentAvatar>
                  <CommentContent>
                    <CommentAuthor>{comment.user?.full_name || comment.user?.username || 'Người dùng'}</CommentAuthor>
                    <CommentText>{comment.content}</CommentText>
                  </CommentContent>
                </Comment>
              ))}
            </CommentsList>
          )}
        </CommentSection>
      )}
    </PostContainer>
  );
};

export default memo(Post);
