import React, {useCallback, useEffect, useImperativeHandle, useRef, useState} from 'react';
import {View, FlatList, ActivityIndicator, StyleSheet} from 'react-native';
import {useInfiniteQuery} from '@tanstack/react-query';
import {Text} from 'react-native-paper';
import {newsfeedAPI} from '../../../utils/api';
import {useTheme} from '../../../contexts/ThemeContext';
import {PWATheme} from '../../../config/PWATheme';
import {spacing, typography} from '../../../config/designTokens';
import PostContent from '../../../components/NewsFeed/PostContent';
import PostImagesCarousel from '../../../components/NewsFeed/PostImagesCarousel';
import PostVideoPlayer from '../../../components/NewsFeed/PostVideoPlayer';
import {PostControls} from '../../../components/PostControls/PostControls';
import {formatTimeAgo} from '../../../utils/dateUtils';
import {getAvatarURL, getImageURL, getVideoURL} from '../../../utils/imageUtils';
import {Avatar} from 'react-native-paper';

export interface SectionRef {
  scrollToTop: () => void;
}

interface ProfileFeedSectionProps {
  ref?: React.Ref<SectionRef>;
  userId: string;
  feedType: 'posts' | 'replies' | 'media' | 'videos' | 'likes';
  headerHeight: number;
  isFocused: boolean;
  scrollElRef: React.MutableRefObject<any>;
}

export const ProfileFeedSection = React.forwardRef<SectionRef, ProfileFeedSectionProps>(
  ({userId, feedType, headerHeight, isFocused, scrollElRef}, ref) => {
    // ALL hooks MUST be called before any early return (Rules of Hooks)
    const {colors, isDarkMode} = useTheme();
    const listRef = useRef<FlatList>(null);
    const [hasNew, setHasNew] = useState(false);

    // NOW we can check props and return early if needed
    if (!userId) {
      return null;
    }

    if (!feedType || !headerHeight || headerHeight < 0) {
      return null;
    }

    // Fetch posts based on feed type
    const {data: posts, isLoading, isFetchingNextPage, fetchNextPage, hasNextPage} = useInfiniteQuery({
      queryKey: ['profileFeed', userId, feedType],
      queryFn: async ({pageParam = 1}) => {
        try {
          const res = await newsfeedAPI.getPosts(pageParam, 'all');
          const allPosts = Array.isArray(res.data) ? res.data : res.data?.posts || [];

          // Filter posts based on feed type
          let filteredPosts = allPosts;
          if (feedType === 'posts') {
            filteredPosts = allPosts.filter((post: any) => {
              const postUserId = post.user_id || post.user?.id || post.author?.id;
              return String(postUserId) === String(userId);
            });
          } else if (feedType === 'replies') {
            filteredPosts = allPosts.filter((post: any) => {
              const postUserId = post.user_id || post.user?.id || post.author?.id;
              return String(postUserId) === String(userId) && (post.comments_count > 0 || post.parent_id || post.reply_to);
            });
          } else if (feedType === 'media') {
            filteredPosts = allPosts.filter((post: any) => {
              const postUserId = post.user_id || post.user?.id || post.author?.id;
              return String(postUserId) === String(userId) && ((post.images && post.images.length > 0) || post.image_url) && !post.video_url;
            });
          } else if (feedType === 'videos') {
            filteredPosts = allPosts.filter((post: any) => {
              const postUserId = post.user_id || post.user?.id || post.author?.id;
              return String(postUserId) === String(userId) && (post.video_url || post.videoUrl || post.videos?.length > 0);
            });
          } else if (feedType === 'likes') {
            filteredPosts = allPosts.filter((post: any) => post.isLiked === true);
          }

          return {
            posts: filteredPosts,
            nextPage: filteredPosts.length > 0 ? pageParam + 1 : null,
          };
        } catch (error) {
          console.error('ProfileFeedSection: Error fetching profile feed:', error);
          return {posts: [], nextPage: null};
        }
      },
      enabled: isFocused && !!userId && !!feedType,
      initialPageParam: 1,
      getNextPageParam: (lastPage) => {
        if (!lastPage) return null;
        return lastPage.nextPage || null;
      },
      retry: 1,
      retryDelay: 1000,
      staleTime: 30000,
    });

    const allPosts = React.useMemo(() => {
      try {
        if (!posts || !posts.pages) return [];
        return (posts.pages || []).flatMap((page: any) => {
          if (!page || !page.posts) return [];
          return Array.isArray(page.posts) ? page.posts : [];
        });
      } catch (error) {
        console.error('ProfileFeedSection: Error processing posts:', error);
        return [];
      }
    }, [posts]);

    const onScrollToTop = useCallback(() => {
      listRef.current?.scrollToOffset({
        animated: true,
        offset: -headerHeight,
      });
      setHasNew(false);
    }, [headerHeight]);

    useImperativeHandle(ref, () => ({
      scrollToTop: onScrollToTop,
    }));

    // Update scrollElRef when list is ready
    useEffect(() => {
      try {
        if (listRef.current && scrollElRef) {
          scrollElRef.current = listRef.current;
        }
      } catch (error) {
        console.error('ProfileFeedSection: Error updating scrollElRef:', error);
      }
    }, [scrollElRef]);

    // Don't render content if not focused
    if (!isFocused) {
      return <View style={{flex: 1, backgroundColor: 'transparent'}} />;
    }

    if (isLoading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      );
    }

    const safePosts = Array.isArray(allPosts) ? allPosts : [];

    const renderEmpty = () => {
      const messages = {
        posts: 'Chưa có bài viết nào',
        replies: 'Chưa có trả lời nào',
        media: 'Chưa có ảnh nào',
        videos: 'Chưa có video nào',
        likes: 'Chưa có lượt thích nào',
      };
      return (
        <View style={styles.emptyContainer}>
          <Text style={[styles.emptyText, {color: colors.textSecondary}]}>
            {messages[feedType]}
          </Text>
        </View>
      );
    };

    const renderItem = ({item}: {item: any}) => {
      if (!item) {
        return null;
      }

      try {
        return (
          <View style={styles.postContainer}>
            {/* Post Header */}
            <View style={styles.postHeader}>
              <Avatar.Image
                size={40}
                source={{uri: getAvatarURL(item.user?.avatar_url || item.avatar_url || '')}}
                style={styles.avatar}
              />
              <View style={styles.postHeaderInfo}>
                <Text style={[styles.postAuthor, {color: colors.text}]}>
                  {item.user?.full_name || item.user?.username || 'Người dùng'}
                </Text>
                <Text style={[styles.postTime, {color: colors.textSecondary}]}>
                  {formatTimeAgo(item.created_at || item.createdAt || new Date().toISOString())}
                </Text>
              </View>
            </View>

            {/* Post Content */}
            {item.content || item.text ? (
              <PostContent content={String(item.content || item.text || '')} />
            ) : null}

            {/* Post Images */}
            {item.images && Array.isArray(item.images) && item.images.length > 0 && (
              <PostImagesCarousel images={item.images} />
            )}

            {/* Post Video */}
            {item.video_url && (
              <PostVideoPlayer
                videoUrl={getVideoURL(item.video_url)}
                thumbnailUrl={item.thumbnail_url ? getImageURL(item.thumbnail_url) : undefined}
                postId={item.id}
                isPlaying={false}
                onPress={() => {}}
              />
            )}

            {/* Post Controls */}
            {item && item.id ? (
              <PostControls
                post={item}
                onPressReply={() => {}}
                onPressShare={() => {}}
              />
            ) : null}
          </View>
        );
      } catch (error) {
        console.error('ProfileFeedSection: Error rendering item:', error, item);
        return null;
      }
    };

    const handleLoadMore = () => {
      if (hasNextPage && !isFetchingNextPage) {
        fetchNextPage();
      }
    };

    return (
      <View style={styles.container}>
        <FlatList
          ref={listRef}
          data={safePosts}
          renderItem={renderItem}
          keyExtractor={(item, index) => item?.id?.toString() || index.toString()}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          ListEmptyComponent={renderEmpty}
          contentContainerStyle={{paddingTop: headerHeight}}
          ListFooterComponent={
            isFetchingNextPage ? (
              <View style={styles.footerLoader}>
                <ActivityIndicator size="small" color={colors.primary} />
              </View>
            ) : null
          }
        />
      </View>
    );
  },
);

ProfileFeedSection.displayName = 'ProfileFeedSection';

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: spacing.xxl,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: spacing.xxl,
  },
  emptyText: {
    fontSize: typography.fontSize.base,
  },
  footerLoader: {
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  postContainer: {
    paddingTop: spacing.md,
    paddingRight: spacing.base,
    paddingBottom: spacing.sm,
    paddingLeft: spacing.base,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e0e0e0',
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  avatar: {
    marginRight: spacing.sm,
  },
  postHeaderInfo: {
    flex: 1,
  },
  postAuthor: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semibold,
  },
  postTime: {
    fontSize: typography.fontSize.sm,
    marginTop: 2,
  },
});
