import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  Dimensions,
  NativeSyntheticEvent,
  NativeScrollEvent,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text, Avatar } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { newsfeedAPI } from '../../utils/api';
import { getInitials, getImageURL, getAvatarURL } from '../../utils/imageUtils';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme as useAppTheme } from '../../contexts/ThemeContext';
import { PWATheme } from '../../config/PWATheme';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useTabBar } from '../../contexts/TabBarContext';
import PostImagesCarousel from '../../components/NewsFeed/PostImagesCarousel';
import CommentsBottomSheet from '../../components/NewsFeed/CommentsBottomSheet';
import ExpandableText from '../../components/Common/ExpandableText';
import StoriesBar from '../../components/NewsFeed/StoriesBar';

const createStyles = (colors: typeof PWATheme.light) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  logoSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logoImage: {
    width: 32,
    height: 32,
    borderRadius: 7,
  },
  logoText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  searchIcon: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContent: {
    paddingBottom: 20,
  },
  postContainer: {
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  authorSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  authorAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  authorInfo: {
    flex: 1,
  },
  authorName: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 2,
  },
  postTime: {
    fontSize: 13,
  },
  postContent: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 12,
  },
  imagesContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  postImage: {
    borderRadius: 8,
    width: '100%',
  },
  fullWidthImage: {
    width: '100%',
    minHeight: 200,
    maxHeight: 500,
  },
  halfWidthImage: {
    flex: 1,
    minHeight: 200,
    maxHeight: 500,
  },
  imageContainer: {
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#f0f0f0',
  },
  postActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
    paddingVertical: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  actionCount: {
    fontSize: 14,
  },
  separator: {
    height: 1,
    marginTop: 8,
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
  },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 80,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  fabIcon: {
    fontSize: 28,
  },
});

const PostsListScreen = () => {
  const { user } = useAuth();
  const { colors } = useAppTheme();
  const navigation = useNavigation();
  const { setIsVisible } = useTabBar();
  const [refreshing, setRefreshing] = useState(false);
  const [imageAspectRatios, setImageAspectRatios] = useState<Record<string, number>>({});
  const [showComments, setShowComments] = useState(false);
  const [activePostId, setActivePostId] = useState<string | number | null>(null);
  const [fabVisible, setFabVisible] = useState(false);
  const scrollY = useRef(0);
  const lastScrollY = useRef(0);
  const fabOpacity = useRef(new Animated.Value(0)).current;

  // Reset tab bar visibility when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      setIsVisible(true);
      return () => {
        // Optional: cleanup when screen loses focus
      };
    }, [setIsVisible])
  );

  const {
    data: posts = [],
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['posts'],
    queryFn: () => 
      newsfeedAPI.getPosts().then((res) => {
        // Filter out posts with videos - videos should only appear in Video tab
        const allPosts = Array.isArray(res.data) ? res.data : (res.data?.posts || []);
        return allPosts.filter((post: any) => {
          // Exclude posts that have video (videoUrl, video_url, or videos field)
          return !post.videoUrl && 
                 !post.video_url && 
                 !post.videos && 
                 !(post.videos && Array.isArray(post.videos) && post.videos.length > 0);
        });
      }),
  });

  const handleRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const formatTimeAgo = (date: Date): string => {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return `${diffInSeconds} giây`;
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} phút`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} giờ`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} ngày`;
    return date.toLocaleDateString('vi-VN');
  };

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const currentScrollY = event.nativeEvent.contentOffset.y;
    const scrollDifference = currentScrollY - lastScrollY.current;
    
    // Chỉ ẩn/hiện khi scroll đủ lớn để tránh flicker
    if (Math.abs(scrollDifference) > 10) {
      if (scrollDifference > 0 && currentScrollY > 50) {
        // Cuộn xuống - ẩn tab bar và hiện FAB
        setIsVisible(false);
        if (!fabVisible) {
          setFabVisible(true);
          Animated.timing(fabOpacity, {
            toValue: 1,
            duration: 200,
            useNativeDriver: true,
          }).start();
        }
      } else if (scrollDifference < 0) {
        // Cuộn lên - hiện tab bar và ẩn FAB
        setIsVisible(true);
        if (fabVisible) {
          setFabVisible(false);
          Animated.timing(fabOpacity, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true,
          }).start();
        }
      }
    }
    
    // Xử lý trường hợp scroll về đầu trang
    if (currentScrollY <= 50 && fabVisible) {
      setFabVisible(false);
      Animated.timing(fabOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
    
    lastScrollY.current = currentScrollY;
    scrollY.current = currentScrollY;
  };

  const dynamicStyles = createStyles(colors);

  const renderPost = ({ item, index }: { item: any, index: number }) => {
    // Get author info - API returns user fields directly on post object
    const authorName = item.full_name || item.username || 'Unknown';
    const authorAvatar = item.avatar_url || '';
    const postTime = item.created_at ? formatTimeAgo(new Date(item.created_at)) : '';

    // Format images - show 2 side by side if available
    // Check for image_url (single image) or images (array)
    const postImages = [];
    if (item.images && Array.isArray(item.images)) {
      postImages.push(...item.images);
    } else if (item.image_url) {
      postImages.push(item.image_url);
    }
    
    return (
      <View style={[dynamicStyles.postContainer, { backgroundColor: colors.surface }]}>
        {/* Post Header */}
        <View style={dynamicStyles.postHeader}>
          <View style={dynamicStyles.authorSection}>
            {authorAvatar ? (
              <Image
                source={{ uri: getAvatarURL(authorAvatar) }}
                style={dynamicStyles.authorAvatar}
              />
            ) : (
              <Avatar.Text
                size={40}
                label={getInitials(authorName)}
                style={dynamicStyles.authorAvatar}
              />
            )}
            <View style={dynamicStyles.authorInfo}>
              <Text style={[dynamicStyles.authorName, { color: colors.text }]}>{authorName}</Text>
              <Text style={[dynamicStyles.postTime, { color: colors.textSecondary }]}>{postTime}</Text>
            </View>
          </View>
          <TouchableOpacity>
            <MaterialCommunityIcons name="dots-horizontal" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Post Content */}
        {item.content && (
          <ExpandableText
            text={item.content}
            numberOfLines={3}
            color={colors.text}
            backgroundColor={colors.surface}
            linkColor="#3b82f6"
            charLimitFallback={140}
          />
        )}

        {/* Post Images */}
        {postImages.length > 0 && (
          <View style={{ marginTop: 12 }}>
            <PostImagesCarousel
              images={postImages}
              onPressImage={(idx) => {
                // navigation.navigate('PostDetail' as never, { postId: item.id } as never);
              }}
            />
          </View>
        )}

        {/* Post Actions */}
        <View style={dynamicStyles.postActions}>
          <TouchableOpacity style={dynamicStyles.actionButton}>
            <MaterialCommunityIcons
              name={item.isLiked ? 'heart' : 'heart-outline'}
              size={22}
              color={item.isLiked ? '#e74c3c' : colors.textSecondary}
            />
            {(item.likes_count || 0) > 0 && (
              <Text style={[dynamicStyles.actionCount, { color: colors.textSecondary }]}>{item.likes_count || 0}</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={dynamicStyles.actionButton}
            onPress={() => {
              const pid = item?.id || item?._id || item?.post_id || item?.postId || null;
              setActivePostId(pid);
              setShowComments(true);
            }}
          >
            <MaterialCommunityIcons name="message-outline" size={22} color={colors.textSecondary} />
            {(item.comments_count || 0) > 0 && (
              <Text style={[dynamicStyles.actionCount, { color: colors.textSecondary }]}>{item.comments_count || 0}</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity style={dynamicStyles.actionButton}>
            <MaterialCommunityIcons name="repeat" size={22} color={colors.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity style={dynamicStyles.actionButton}>
            <MaterialCommunityIcons name="send-outline" size={22} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Separator */}
        <View style={[dynamicStyles.separator, { backgroundColor: colors.border }]} />
      </View>
    );
  };

  const handleShowStory = (story) => {
    // TODO: show StoryViewer here
  }
  const handleAddStory = () => {
    // TODO: open picker/upload
  }

  return (
    <SafeAreaView style={dynamicStyles.container} edges={['top']}>
      {/* Header Bar */}
      <View style={[dynamicStyles.headerBar, { borderBottomColor: colors.border }]}>
        <View style={dynamicStyles.logoSection}>
          <Image
            source={require('../../../assets/icon.png')}
            style={dynamicStyles.logoImage}
          />
          <Text style={[dynamicStyles.logoText, { color: colors.text }]}>Zyea+</Text>
        </View>
        <TouchableOpacity style={dynamicStyles.searchIcon}>
          <MaterialCommunityIcons name="magnify" size={24} color={colors.text} />
        </TouchableOpacity>
      </View>

      {/* Posts List */}
      <FlatList
        data={posts}
        keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
        renderItem={renderPost}
        refreshing={refreshing}
        onRefresh={handleRefresh}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        contentContainerStyle={dynamicStyles.listContent}
        ListHeaderComponent={
          <View>
            {/* Stories Bar (scrolls with feed) */}
            <StoriesBar onPressStory={handleShowStory} onAddStory={handleAddStory} />
          </View>
        }
        ListEmptyComponent={
          <View style={dynamicStyles.emptyContainer}>
            <Text style={[dynamicStyles.emptyText, { color: colors.textSecondary }]}>Chưa có bài viết nào</Text>
          </View>
        }
      />

      <CommentsBottomSheet
        postId={activePostId}
        visible={showComments}
        onClose={() => setShowComments(false)}
        placeholder={`Bình luận cho ${user?.username || 'bài viết'}`}
      />

      {/* Floating Action Button */}
      <Animated.View
        style={[
          dynamicStyles.fab,
          {
            backgroundColor: colors.primary || '#0084ff',
            opacity: fabOpacity,
            transform: [
              {
                scale: fabOpacity.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.8, 1],
                }),
              },
            ],
          },
        ]}
        pointerEvents={fabVisible ? 'auto' : 'none'}
      >
        <TouchableOpacity
          onPress={() => navigation.navigate('CreatePost' as never)}
          style={{
            width: '100%',
            height: '100%',
            justifyContent: 'center',
            alignItems: 'center',
          }}
          activeOpacity={0.8}
        >
          <MaterialCommunityIcons
            name="plus"
            size={28}
            color="#FFFFFF"
          />
        </TouchableOpacity>
      </Animated.View>
    </SafeAreaView>
  );
};

export default PostsListScreen;
