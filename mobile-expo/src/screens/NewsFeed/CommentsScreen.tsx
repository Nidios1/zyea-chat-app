import React, { useState, useRef, useMemo, useEffect } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Platform,
  Keyboard,
  Pressable,
  Text as RNText,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text as PaperText, TextInput, Avatar } from 'react-native-paper';
import { TextInput as RNTextInput, Text } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigation, useRoute, RouteProp, useFocusEffect } from '@react-navigation/native';
import { newsfeedAPI } from '../../utils/api';
import { useTheme } from '../../contexts/ThemeContext';
import { PWATheme } from '../../config/PWATheme';
import { useTabBar } from '../../contexts/TabBarContext';
import { useAuth } from '../../contexts/AuthContext';
import { getInitials, getImageURL, getAvatarURL } from '../../utils/imageUtils';
import PostImagesCarousel from '../../components/NewsFeed/PostImagesCarousel';
import CommentItem from '../../components/NewsFeed/CommentItem';
import CommentComposePrompt from '../../components/NewsFeed/CommentComposePrompt';
import { parseTextWithUrls } from '../../utils/textUtils';
import { Linking } from 'react-native';
import { ShowMoreTextButton, MAX_POST_LINES } from '../../components/NewsFeed/ShowMoreTextButton';
import { LayoutAnimation } from 'react-native';

type CommentsScreenRouteParams = {
  postId: string | number;
  postData?: any;
};

// PostContent component - Giống PostsListScreen
const PostContent = React.memo(({ 
  content, 
  styles, 
  colors,
  countLines,
}: { 
  content: string;
  styles: ReturnType<typeof createStyles>;
  colors: any;
  countLines: (text: string | undefined) => number;
}) => {
  const shouldLimitInitially = React.useMemo(() => {
    if (!content || content.trim().length === 0) return false;
    const newlineCount = countLines(content);
    const isLongText = content.length > 100;
    return newlineCount >= 1 || isLongText;
  }, [content, countLines]);
  
  const [isExpanded, setIsExpanded] = React.useState(false);
  const [actualLineCount, setActualLineCount] = React.useState<number | null>(null);
  const [fullLineCount, setFullLineCount] = React.useState<number | null>(null);
  const [hasMeasured, setHasMeasured] = React.useState(false);
  
  React.useEffect(() => {
    setIsExpanded(false);
    setActualLineCount(null);
    setFullLineCount(null);
    setHasMeasured(false);
  }, [content]);
  
  const onTextLayout = React.useCallback((event: any) => {
    const { lines } = event.nativeEvent;
    if (lines && lines.length > 0) {
      const lineCount = lines.length;
      if (!isExpanded) {
        if (!hasMeasured) {
          setActualLineCount(lineCount);
          setHasMeasured(true);
          if (!shouldLimitInitially) {
            setIsExpanded(true);
          }
        }
      } else {
        setFullLineCount(lineCount);
      }
    }
  }, [isExpanded, shouldLimitInitially, hasMeasured]);
  
  const onPressToggle = React.useCallback(() => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setIsExpanded(prev => !prev);
  }, []);
  
  const shouldLimitLines = !isExpanded && shouldLimitInitially;
  const isTextLong = fullLineCount !== null 
    ? fullLineCount > MAX_POST_LINES 
    : (actualLineCount !== null ? actualLineCount >= MAX_POST_LINES : shouldLimitInitially);
  const shouldShowMore = shouldLimitLines && isTextLong;
  const shouldShowLess = isExpanded && shouldLimitInitially && (
    (isExpanded ? (fullLineCount || actualLineCount) : actualLineCount) === null || 
    (isExpanded ? (fullLineCount || actualLineCount) : actualLineCount)! > MAX_POST_LINES
  );
  const canToggle = shouldShowMore || shouldShowLess;
  
  const renderTextWithLinks = React.useCallback(() => {
    const parts = parseTextWithUrls(content);
    const handleLinkPress = async (url: string) => {
      try {
        let formattedUrl = url.trim();
        if (!formattedUrl.match(/^https?:\/\//i)) {
          formattedUrl = 'https://' + formattedUrl;
        }
        await Linking.openURL(formattedUrl);
      } catch (error) {}
    };

    const parseHashtagsAndMentions = (text: string): Array<{text: string, type: 'text' | 'hashtag' | 'mention', start: number, end: number}> => {
      const result: Array<{text: string, type: 'text' | 'hashtag' | 'mention', start: number, end: number}> = [];
      let lastIndex = 0;
      const hashtagRegex = /#[\w\u00C0-\u1EF9]+/g;
      const mentionRegex = /@[\w\u00C0-\u1EF9]+/g;
      const allMatches: Array<{match: RegExpMatchArray, type: 'hashtag' | 'mention'}> = [];
      
      let match;
      while ((match = hashtagRegex.exec(text)) !== null) {
        allMatches.push({ match, type: 'hashtag' });
      }
      while ((match = mentionRegex.exec(text)) !== null) {
        allMatches.push({ match, type: 'mention' });
      }
      allMatches.sort((a, b) => a.match.index! - b.match.index!);
      
      allMatches.forEach(({ match, type }) => {
        const start = match.index!;
        const end = start + match[0].length;
        if (start > lastIndex) {
          result.push({ text: text.substring(lastIndex, start), type: 'text', start: lastIndex, end: start });
        }
        result.push({ text: match[0], type, start, end });
        lastIndex = end;
      });
      
      if (lastIndex < text.length) {
        result.push({ text: text.substring(lastIndex), type: 'text', start: lastIndex, end: text.length });
      }
      return result.length > 0 ? result : [{ text, type: 'text', start: 0, end: text.length }];
    };

    const renderRichText = () => {
      if (parts.length === 1 && parts[0].type === 'text') {
        const richParts = parseHashtagsAndMentions(content);
        if (richParts.length === 1 && richParts[0].type === 'text') {
          return (
            <Text
              style={[styles.postContent, { color: colors.text }]}
              numberOfLines={shouldLimitLines ? MAX_POST_LINES : undefined}
              ellipsizeMode="tail"
              onTextLayout={onTextLayout}
            >
              {content}
            </Text>
          );
        }
        return (
          <Text
            style={[styles.postContent, { color: colors.text }]}
            numberOfLines={shouldLimitLines ? MAX_POST_LINES : undefined}
            ellipsizeMode="tail"
            onTextLayout={onTextLayout}
          >
            {richParts.map((part, index) => {
              if (part.type === 'hashtag' || part.type === 'mention') {
                return (
                  <Text
                    key={index}
                    style={[styles.postContent, { color: '#1877F2', fontWeight: '600' }]}
                    suppressHighlighting={true}
                  >
                    {part.text}
                  </Text>
                );
              }
              return <Text key={index}>{part.text}</Text>;
            })}
          </Text>
        );
      }

      const mergedParts: Array<{text: string, type: 'text' | 'url' | 'hashtag' | 'mention', url?: string}> = [];
      parts.forEach(part => {
        if (part.type === 'url') {
          mergedParts.push(part);
        } else {
          const richParts = parseHashtagsAndMentions(part.text);
          richParts.forEach(rp => {
            if (rp.type === 'text') {
              mergedParts.push({ text: rp.text, type: 'text' });
            } else {
              mergedParts.push({ text: rp.text, type: rp.type });
            }
          });
        }
      });

      return (
        <Text
          style={[styles.postContent, { color: colors.text }]}
          numberOfLines={shouldLimitLines ? MAX_POST_LINES : undefined}
          ellipsizeMode="tail"
          onTextLayout={onTextLayout}
        >
          {mergedParts.map((part, index) => {
            if (part.type === 'url' && part.url) {
              return (
                <Text
                  key={index}
                  style={[styles.postContent, { color: '#1877F2', fontWeight: '600', textDecorationLine: 'none' }]}
                  onPress={() => handleLinkPress(part.url!)}
                  suppressHighlighting={true}
                >
                  {part.text}
                </Text>
              );
            }
            if (part.type === 'hashtag' || part.type === 'mention') {
              return (
                <Text
                  key={index}
                  style={[styles.postContent, { color: '#1877F2', fontWeight: '600' }]}
                  suppressHighlighting={true}
                >
                  {part.text}
                </Text>
              );
            }
            return <Text key={index}>{part.text}</Text>;
          })}
        </Text>
      );
    };

    return renderRichText();
  }, [content, colors.text, shouldLimitLines, onTextLayout, styles.postContent]);

  return (
    <View style={styles.postContentWrapper}>
      <Pressable
        onPress={canToggle ? onPressToggle : undefined}
        disabled={!canToggle}
        style={{ flex: 1 }}
        hitSlop={{ top: 5, bottom: 5, left: 0, right: 0 }}
      >
        {renderTextWithLinks()}
      </Pressable>
      {shouldShowMore && (
        <View style={{ marginTop: 4 }}>
          <ShowMoreTextButton
            onPress={onPressToggle}
            style={styles.postContent}
            isExpanded={false}
          />
        </View>
      )}
      {shouldShowLess && (
        <View style={{ marginTop: 4 }}>
          <ShowMoreTextButton
            onPress={onPressToggle}
            style={styles.postContent}
            isExpanded={true}
          />
        </View>
      )}
    </View>
  );
});

PostContent.displayName = 'PostContent';

// Helper function to count lines
const countLines = (text: string | undefined): number => {
  if (!text) return 0;
  const matches = text.match(/\n/g);
  return matches ? matches.length : 0;
};

// Format time ago helper
const formatTimeAgo = (date: Date): string => {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const weeks = Math.floor(days / 7);
  const months = Math.floor(days / 30);
  const years = Math.floor(days / 365);

  if (years > 0) return `${years} năm`;
  if (months > 0) return `${months} tháng`;
  if (weeks > 0) return `${weeks} tuần`;
  if (days > 0) return `${days} ngày`;
  if (hours > 0) return `${hours} giờ`;
  if (minutes > 0) return `${minutes} phút`;
  return 'Vừa xong';
};

const createStyles = (colors: typeof PWATheme.light, isDarkMode: boolean) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  headerPostInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  headerPostAvatar: {
    marginRight: 0,
  },
  headerPostName: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  headerPostTime: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  headerRight: {
    width: 40,
    alignItems: 'flex-end',
  },
  sortDropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface,
  },
  sortText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
    marginLeft: 6,
  },
  sortIcon: {
    marginLeft: 4,
  },
  postContainer: {
    backgroundColor: colors.surface,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  postContentWrapper: {
    marginTop: 0,
    marginBottom: 4,
  },
  postContent: {
    fontSize: 16, // Giống PostsListScreen
    lineHeight: 24, // Giống PostsListScreen
    letterSpacing: -0.1,
    fontWeight: '400',
  },
  postImages: {
    width: '100%',
    marginTop: 8,
    marginBottom: 4,
  },
  commentsList: {
    flexGrow: 1,
    paddingBottom: 10,
  },
  commentItem: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  commentAvatar: {
    marginRight: 8,
  },
  commentBody: {
    flex: 1,
  },
  commentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  commentName: {
    fontWeight: '600',
    fontSize: 15,
    color: colors.text,
    marginRight: 6,
  },
  commentTime: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  commentText: {
    fontSize: 15,
    color: colors.text,
    lineHeight: 20,
    marginBottom: 4,
  },
  commentActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 4,
  },
  commentAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
  },
  commentActionText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  commentLikeCount: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
    marginLeft: 2,
  },
  repliesContainer: {
    marginLeft: 0,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: colors.surface,
    gap: 8,
    minHeight: 56,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  inputAvatar: {
    marginRight: 8,
    marginBottom: 2,
  },
  inputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
    borderRadius: 20,
    paddingLeft: 12,
    paddingRight: 4,
    paddingVertical: 8,
    minHeight: 36,
    maxHeight: 100,
    marginBottom: 2,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: colors.text,
    padding: 0,
    margin: 0,
    paddingRight: 8,
    minHeight: 20,
  },
  inputIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 0,
    paddingLeft: 4,
  },
  inputIcon: {
    padding: 6,
    marginHorizontal: 2,
  },
  sendButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginLeft: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.primary,
  },
  emptyContainer: {
    padding: 32,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  replyingToContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  replyingToText: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  replyingToName: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
  },
});

const CommentsScreen: React.FC = () => {
  const { colors, isDarkMode } = useTheme();
  const styles = useMemo(() => createStyles(colors, isDarkMode), [colors, isDarkMode]);
  const navigation = useNavigation();
  const route = useRoute<RouteProp<{ params: CommentsScreenRouteParams }, 'params'>>();
  const { postId, postData } = route.params || {};
  const { setIsVisible } = useTabBar();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  
  const [text, setText] = useState('');
  const [sortBy, setSortBy] = useState<'most_relevant' | 'newest'>('most_relevant');
  const [replyingTo, setReplyingTo] = useState<any>(null);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const queryClient = useQueryClient();
  const inputRef = useRef<RNTextInput>(null);
  const flatListRef = useRef<FlatList>(null);

  // Ẩn bottom tab bar khi vào màn hình Comments
  useFocusEffect(
    React.useCallback(() => {
      setIsVisible(false);
      return () => {
        setIsVisible(true);
      };
    }, [setIsVisible])
  );

  // Track keyboard height
  useEffect(() => {
    const showSubscription = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      (e) => {
        setKeyboardHeight(e.endCoordinates.height);
        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: true });
        }, Platform.OS === 'ios' ? 100 : 200);
      }
    );
    const hideSubscription = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => {
        setKeyboardHeight(0);
      }
    );

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  // Fetch post data if not provided
  const { data: post } = useQuery({
    enabled: Boolean(postId) && !postData,
    queryKey: ['post', postId],
    queryFn: () => newsfeedAPI.getPost(String(postId)).then((r) => r.data),
  });

  const currentPost = postData || post;

  const { data: comments = [], isLoading } = useQuery({
    enabled: Boolean(postId),
    queryKey: ['postComments', postId],
    queryFn: () => newsfeedAPI.getPostComments(String(postId)).then((r) => r.data || []),
  });

  // Sort threaded comments
  const sortedThreadedComments = useMemo(() => {
    if (!buildThreadedComments || buildThreadedComments.length === 0) return [];
    const sorted = [...buildThreadedComments];
    if (sortBy === 'newest') {
      return sorted.sort((a: any, b: any) => {
        const dateA = new Date(a.created_at || 0).getTime();
        const dateB = new Date(b.created_at || 0).getTime();
        return dateB - dateA;
      });
    }
    return sorted;
  }, [buildThreadedComments, sortBy]);

  const addComment = useMutation({
    mutationFn: (data: { content: string; parentId?: string | number }) => {
      if (data.parentId) {
        // Reply to comment
        return newsfeedAPI.commentPost(String(postId), data.content, data.parentId);
      }
      // Top-level comment
      return newsfeedAPI.commentPost(String(postId), data.content);
    },
    onSuccess: () => {
      setText('');
      setReplyingTo(null);
      queryClient.invalidateQueries({ queryKey: ['postComments', postId] });
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      
      // Invalidate notifications queries ngay lập tức để cập nhật badge và danh sách thông báo
      // Khi comment, có thể đã tạo notification mới cho post owner
      queryClient.invalidateQueries({ queryKey: ['notifications', 'unread-count'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      
      if (inputRef.current) {
        inputRef.current.blur();
      }
    },
  });

  const handleAddComment = () => {
    if (text.trim() && postId) {
      addComment.mutate({
        content: text.trim(),
        parentId: replyingTo?.id,
      });
    }
  };

  // Build threaded comments structure
  const buildThreadedComments = useMemo(() => {
    if (!comments || comments.length === 0) return [];
    
    // Create a map of comments by ID
    const commentMap = new Map();
    const rootComments: any[] = [];
    
    // First pass: create map and identify root comments
    comments.forEach((comment: any) => {
      commentMap.set(comment.id, { ...comment, replies: [] });
      if (!comment.parent_id || comment.parent_id === comment.post_id) {
        rootComments.push(commentMap.get(comment.id));
      }
    });
    
    // Second pass: build tree structure
    comments.forEach((comment: any) => {
      if (comment.parent_id && comment.parent_id !== comment.post_id) {
        const parent = commentMap.get(comment.parent_id);
        if (parent) {
          parent.replies = parent.replies || [];
          parent.replies.push(commentMap.get(comment.id));
        }
      }
    });
    
    return rootComments;
  }, [comments]);

  const renderComment = ({ item, index }: any) => {
    const hasReplies = item.replies && item.replies.length > 0;
    const isLastInThread = index === buildThreadedComments.length - 1 && !hasReplies;
    
    return (
      <View>
        <CommentItem
          comment={item}
          depth={0}
          showParentReplyLine={index > 0}
          showChildReplyLine={hasReplies}
          onReply={(comment) => {
            setReplyingTo(comment);
            inputRef.current?.focus();
          }}
          onLike={(comment) => {
            // TODO: Implement like comment
            console.log('Like comment:', comment.id);
          }}
          formatTimeAgo={formatTimeAgo}
        />
        
        {/* Render replies */}
        {hasReplies && (
          <View style={styles.repliesContainer}>
            {item.replies.map((reply: any, replyIndex: number) => (
              <CommentItem
                key={reply.id || replyIndex}
                comment={reply}
                depth={1}
                showParentReplyLine={replyIndex > 0}
                showChildReplyLine={false}
                onReply={(comment) => {
                  setReplyingTo(comment);
                  inputRef.current?.focus();
                }}
                onLike={(comment) => {
                  // TODO: Implement like comment
                  console.log('Like reply:', comment.id);
                }}
                formatTimeAgo={formatTimeAgo}
              />
            ))}
          </View>
        )}
      </View>
    );
  };

  const renderPost = () => {
    if (!currentPost) return null;

    const postImages = currentPost.images || (currentPost.image_url ? [currentPost.image_url] : []);

    return (
      <View style={styles.postContainer}>
        {currentPost.content && (
          <PostContent
            content={currentPost.content}
            styles={styles}
            colors={colors}
            countLines={countLines}
          />
        )}
        {postImages.length > 0 && (
          <View style={styles.postImages}>
            <PostImagesCarousel 
              images={postImages}
              onPressImage={(idx) => {
                // TODO: Open full screen image viewer
                console.log('Open image:', idx);
              }}
            />
          </View>
        )}
      </View>
    );
  };

  // Tính toán chiều cao input container
  const [inputBarHeight, setInputBarHeight] = useState(70);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={{ flex: 1 }}>
        {/* Header - Fixed */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <MaterialCommunityIcons name="arrow-left" size={24} color={colors.text} />
            </TouchableOpacity>
            {currentPost && (() => {
              const authorName = currentPost.full_name || currentPost.username || 'Unknown';
              const authorAvatar = currentPost.avatar_url || '';
              const postTime = currentPost.created_at ? formatTimeAgo(new Date(currentPost.created_at)) : '';
              return (
                <View style={styles.headerPostInfo}>
                  <View style={styles.headerPostAvatar}>
                    {authorAvatar ? (
                      <Avatar.Image size={36} source={{ uri: getAvatarURL(authorAvatar) }} />
                    ) : (
                      <Avatar.Text size={36} label={getInitials(authorName)} />
                    )}
                  </View>
                  <View style={{ flex: 1 }}>
                    <PaperText style={styles.headerPostName}>{authorName}</PaperText>
                    {postTime && <PaperText style={styles.headerPostTime}>{postTime}</PaperText>}
                  </View>
                </View>
              );
            })()}
          </View>
          <View style={styles.headerRight}>
            <TouchableOpacity>
              <MaterialCommunityIcons name="dots-horizontal" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Content Area với paddingBottom để tránh input che */}
        <View style={{ 
          flex: 1, 
          paddingBottom: inputBarHeight + (replyingTo ? 56 : 0) + (keyboardHeight > 0 ? keyboardHeight : Math.max(insets.bottom, 0))
        }}>
          {/* Post Content */}
          {renderPost()}

          {/* Sort Dropdown - Chỉ hiển thị khi có từ 5 bình luận trở lên */}
          {comments.length >= 5 && (
            <TouchableOpacity 
              style={styles.sortDropdown}
              onPress={() => setSortBy(sortBy === 'most_relevant' ? 'newest' : 'most_relevant')}
            >
              <PaperText style={styles.sortText}>
                {sortBy === 'most_relevant' ? 'Phù hợp nhất' : 'Mới nhất'}
              </PaperText>
              <MaterialCommunityIcons 
                name="chevron-down" 
                size={18} 
                color={colors.primary}
                style={styles.sortIcon}
              />
            </TouchableOpacity>
          )}

          {/* Comments List */}
          <FlatList
            ref={flatListRef}
            data={sortedThreadedComments}
            keyExtractor={(item: any, index) => item.id?.toString() || `comment-${index}`}
            renderItem={renderComment}
            contentContainerStyle={styles.commentsList}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="interactive"
            onContentSizeChange={() => {
              if (keyboardHeight > 0) {
                setTimeout(() => {
                  flatListRef.current?.scrollToEnd({ animated: true });
                }, Platform.OS === 'ios' ? 100 : 200);
              }
            }}
            ListEmptyComponent={
              isLoading ? (
                <View style={styles.emptyContainer}>
                  <PaperText style={styles.emptyText}>Đang tải...</PaperText>
                </View>
              ) : (
                <View style={styles.emptyContainer}>
                  <PaperText style={styles.emptyText}>Chưa có bình luận</PaperText>
                </View>
              )
            }
          />
        </View>

        {/* Replying To Indicator - Position absolute */}
        {replyingTo && (
          <View style={[
            styles.replyingToContainer,
            {
              position: 'absolute',
              left: 0,
              right: 0,
              bottom: inputBarHeight + (keyboardHeight > 0 ? keyboardHeight : Math.max(insets.bottom, 0)),
              zIndex: 5,
            }
          ]}>
            <PaperText style={styles.replyingToText}>Đang trả lời</PaperText>
            <PaperText style={styles.replyingToName}>
              {replyingTo?.author?.full_name || replyingTo?.author?.username || 'Người dùng'}
            </PaperText>
            <TouchableOpacity onPress={() => setReplyingTo(null)}>
              <MaterialCommunityIcons name="close" size={16} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
        )}

        {/* Input Field - Luôn hiển thị */}
        <View 
          style={[
            { 
              position: 'absolute',
              left: 0,
              right: 0,
              bottom: keyboardHeight > 0 ? keyboardHeight : Math.max(insets.bottom, 0),
              zIndex: 10,
            }
          ]}
          onLayout={(e) => {
            const h = e.nativeEvent.layout.height;
            if (h && Math.abs(h - inputBarHeight) > 1) setInputBarHeight(h);
          }}
        >
          <View style={styles.inputContainer}>
            {user && (
              <View style={styles.inputAvatar}>
                {user.avatar_url ? (
                  <Avatar.Image size={32} source={{ uri: getAvatarURL(user.avatar_url) }} />
                ) : (
                  <Avatar.Text size={32} label={getInitials(user.full_name || user.username || 'U')} />
                )}
              </View>
            )}
            <View style={styles.inputWrapper}>
              <TextInput
                ref={inputRef}
                mode="flat"
                placeholder={replyingTo ? `Trả lời ${replyingTo?.author?.full_name || replyingTo?.author?.username || ''}...` : 'Viết bình luận...'}
                placeholderTextColor={colors.textSecondary}
                value={text}
                onChangeText={setText}
                style={styles.input}
                multiline
                dense
                underlineColorAndroid="transparent"
                activeUnderlineColor="transparent"
              />
              {/* Icons bên phải khi chưa có text - giống Facebook */}
              {!text.trim() && (
                <View style={styles.inputIcons}>
                  <TouchableOpacity 
                    style={styles.inputIcon}
                    onPress={() => {
                      // TODO: Open emoji picker
                      console.log('Emoji picker');
                    }}
                    activeOpacity={0.7}
                  >
                    <MaterialCommunityIcons name="emoticon-outline" size={20} color={colors.textSecondary} />
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.inputIcon}
                    onPress={() => {
                      // TODO: Open GIF picker
                      console.log('GIF picker');
                    }}
                    activeOpacity={0.7}
                  >
                    <MaterialCommunityIcons name="gif" size={20} color={colors.textSecondary} />
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.inputIcon}
                    onPress={() => {
                      // TODO: Open sticker picker
                      console.log('Sticker picker');
                    }}
                    activeOpacity={0.7}
                  >
                    <MaterialCommunityIcons name="sticker-emoji" size={20} color={colors.textSecondary} />
                  </TouchableOpacity>
                </View>
              )}
            </View>
            {/* Nút Gửi khi có text */}
            {text.trim() && (
              <TouchableOpacity
                style={styles.sendButton}
                onPress={handleAddComment}
                activeOpacity={0.7}
              >
                <PaperText style={styles.sendButtonText}>Gửi</PaperText>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
};

export default CommentsScreen;
