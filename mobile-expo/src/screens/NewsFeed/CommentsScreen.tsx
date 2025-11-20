import React, { useState, useRef, useMemo, useEffect } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Platform,
  Keyboard,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text, TextInput, Avatar } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigation, useRoute, RouteProp, useFocusEffect } from '@react-navigation/native';
import { newsfeedAPI } from '../../utils/api';
import { useTheme } from '../../contexts/ThemeContext';
import { PWATheme } from '../../config/PWATheme';
import { useTabBar } from '../../contexts/TabBarContext';
import { useAuth } from '../../contexts/AuthContext';
import { getInitials, getImageURL, getAvatarURL } from '../../utils/imageUtils';
import ExpandableText from '../../components/Common/ExpandableText';
import PostImagesCarousel from '../../components/NewsFeed/PostImagesCarousel';

type CommentsScreenRouteParams = {
  postId: string | number;
  postData?: any;
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
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  headerPostTime: {
    fontSize: 14,
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
    fontSize: 15,
    fontWeight: '600',
    color: colors.primary,
    marginLeft: 6,
  },
  sortIcon: {
    marginLeft: 4,
  },
  postContainer: {
    backgroundColor: colors.surface,
    paddingTop: 12,
    paddingBottom: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border || (isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)'),
  },
  postContent: {
    fontSize: 16,
    color: colors.text,
    lineHeight: 22,
    paddingHorizontal: 16,
    paddingTop: 0,
    paddingBottom: 0,
  },
  postImages: {
    width: '100%',
    marginTop: 8,
    marginBottom: 4,
  },
  commentsList: {
    flexGrow: 1,
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
    fontSize: 16,
    color: colors.text,
    marginRight: 6,
  },
  commentTime: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  commentText: {
    fontSize: 16,
    color: colors.text,
    lineHeight: 22,
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
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  commentLikeCount: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
    marginLeft: 2,
  },
  replyContainer: {
    marginLeft: 46,
    marginTop: 8,
    paddingLeft: 12,
    borderLeftWidth: 2,
    borderLeftColor: colors.border,
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
    paddingRight: 8,
    paddingVertical: 8,
    minHeight: 36,
    maxHeight: 100,
    marginBottom: 2,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: colors.text,
    padding: 0,
    margin: 0,
    paddingRight: 4,
  },
  inputIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  inputIcon: {
    padding: 6,
  },
  sendButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginLeft: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
  },
  emptyContainer: {
    padding: 32,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
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
    fontSize: 14,
    color: colors.textSecondary,
  },
  replyingToName: {
    fontSize: 14,
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
  const inputRef = useRef<any>(null);
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

  // Sort comments
  const sortedComments = useMemo(() => {
    if (!comments || comments.length === 0) return [];
    const sorted = [...comments];
    if (sortBy === 'newest') {
      return sorted.sort((a: any, b: any) => {
        const dateA = new Date(a.created_at || 0).getTime();
        const dateB = new Date(b.created_at || 0).getTime();
        return dateB - dateA;
      });
    }
    return sorted;
  }, [comments, sortBy]);

  const addComment = useMutation({
    mutationFn: (content: string) => newsfeedAPI.commentPost(String(postId), content),
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
      addComment.mutate(text.trim());
    }
  };

  const renderComment = ({ item }: any) => {
    const commentDate = item.created_at ? new Date(item.created_at) : new Date();
    const authorName = item?.author?.full_name || item?.author?.username || 'Người dùng';
    const authorAvatar = item?.author?.avatar_url;

    return (
      <View style={styles.commentItem}>
        <View style={styles.commentAvatar}>
          {authorAvatar ? (
            <Avatar.Image size={36} source={{ uri: getAvatarURL(authorAvatar) }} />
          ) : (
            <Avatar.Text size={36} label={getInitials(authorName)} />
          )}
        </View>
        <View style={styles.commentBody}>
          <View style={styles.commentHeader}>
            <Text style={styles.commentName}>{authorName}</Text>
            <Text style={styles.commentTime}>{formatTimeAgo(commentDate)}</Text>
          </View>
          <Text style={styles.commentText}>{item?.content || ''}</Text>
          <View style={styles.commentActions}>
            <TouchableOpacity 
              style={styles.commentAction}
              onPress={() => {
                console.log('Like comment:', item.id);
              }}
            >
              <MaterialCommunityIcons 
                name={item?.isLiked ? 'thumb-up' : 'thumb-up-outline'} 
                size={16} 
                color={item?.isLiked ? '#1877F2' : colors.textSecondary} 
              />
              {(item?.likes_count || 0) > 0 && (
                <Text style={styles.commentLikeCount}>{item.likes_count}</Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.commentAction}
              onPress={() => {
                setReplyingTo(item);
                inputRef.current?.focus();
              }}
            >
              <Text style={styles.commentActionText}>Trả lời</Text>
            </TouchableOpacity>
          </View>
          {/* Replies */}
          {item.replies && item.replies.length > 0 && (
            <View style={styles.replyContainer}>
              {item.replies.map((reply: any, idx: number) => {
                const replyDate = reply.created_at ? new Date(reply.created_at) : new Date();
                const replyAuthorName = reply?.author?.full_name || reply?.author?.username || 'Người dùng';
                const replyAuthorAvatar = reply?.author?.avatar_url;
                return (
                  <View key={reply.id || idx} style={styles.commentItem}>
                    <View style={styles.commentAvatar}>
                      {replyAuthorAvatar ? (
                        <Avatar.Image size={32} source={{ uri: getAvatarURL(replyAuthorAvatar) }} />
                      ) : (
                        <Avatar.Text size={32} label={getInitials(replyAuthorName)} />
                      )}
                    </View>
                    <View style={styles.commentBody}>
                      <View style={styles.commentHeader}>
                        <Text style={styles.commentName}>{replyAuthorName}</Text>
                        <Text style={styles.commentTime}>{formatTimeAgo(replyDate)}</Text>
                      </View>
                      <Text style={styles.commentText}>{reply?.content || ''}</Text>
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </View>
      </View>
    );
  };

  const renderPost = () => {
    if (!currentPost) return null;

    const postImages = currentPost.images || (currentPost.image_url ? [currentPost.image_url] : []);

    return (
      <View style={styles.postContainer}>
        {currentPost.content && (
          <View style={{ paddingHorizontal: 16 }}>
            <ExpandableText
              text={currentPost.content}
              numberOfLines={3}
              color={colors.text}
              backgroundColor={colors.surface}
              linkColor={colors.primary}
              charLimitFallback={200}
              gradient={false}
            />
          </View>
        )}
        {postImages.length > 0 && (
          <View style={styles.postImages}>
            <PostImagesCarousel images={postImages} />
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
                    <Text style={styles.headerPostName}>{authorName}</Text>
                    {postTime && <Text style={styles.headerPostTime}>{postTime}</Text>}
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

        {/* Content Area - Không cần paddingBottom vì FlatList đã có */}
        <View style={{ flex: 1 }}>
          {/* Post Content */}
          {renderPost()}

          {/* Sort Dropdown - Chỉ hiển thị khi có từ 5 bình luận trở lên */}
          {comments.length >= 5 && (
            <TouchableOpacity 
              style={styles.sortDropdown}
              onPress={() => setSortBy(sortBy === 'most_relevant' ? 'newest' : 'most_relevant')}
            >
              <Text style={styles.sortText}>
                {sortBy === 'most_relevant' ? 'Phù hợp nhất' : 'Mới nhất'}
              </Text>
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
            data={sortedComments}
            keyExtractor={(item: any, index) => item.id?.toString() || `comment-${index}`}
            renderItem={renderComment}
            contentContainerStyle={[
              styles.commentsList,
              {
                paddingBottom: inputBarHeight + (replyingTo ? 56 : 0) + Math.max(insets.bottom, 20),
              }
            ]}
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
                  <Text style={styles.emptyText}>Đang tải...</Text>
                </View>
              ) : (
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyText}>Chưa có bình luận</Text>
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
            <Text style={styles.replyingToText}>Đang trả lời</Text>
            <Text style={styles.replyingToName}>
              {replyingTo?.author?.full_name || replyingTo?.author?.username || 'Người dùng'}
            </Text>
            <TouchableOpacity onPress={() => setReplyingTo(null)}>
              <MaterialCommunityIcons name="close" size={16} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
        )}

        {/* Input Field - Position absolute để luôn ở trên keyboard */}
        <View 
          style={[
            styles.inputContainer, 
            { 
              position: 'absolute',
              left: 0,
              right: 0,
              bottom: keyboardHeight > 0 ? keyboardHeight : Math.max(insets.bottom, 0),
              paddingBottom: Math.max(insets.bottom * 0.3, 0),
              zIndex: 10,
            }
          ]}
          onLayout={(e) => {
            const h = e.nativeEvent.layout.height;
            if (h && Math.abs(h - inputBarHeight) > 1) setInputBarHeight(h);
          }}
        >
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
            {!text.trim() && (
              <View style={styles.inputIcons}>
                <TouchableOpacity style={styles.inputIcon}>
                  <MaterialCommunityIcons name="camera-outline" size={20} color={colors.textSecondary} />
                </TouchableOpacity>
                <TouchableOpacity style={styles.inputIcon}>
                  <MaterialCommunityIcons name="file-image-outline" size={20} color={colors.textSecondary} />
                </TouchableOpacity>
                <TouchableOpacity style={styles.inputIcon}>
                  <MaterialCommunityIcons name="emoticon-outline" size={20} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>
            )}
          </View>
          {text.trim() && (
            <TouchableOpacity
              style={styles.sendButton}
              onPress={handleAddComment}
              activeOpacity={0.7}
            >
              <Text style={styles.sendButtonText}>Nhập</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
};

export default CommentsScreen;
