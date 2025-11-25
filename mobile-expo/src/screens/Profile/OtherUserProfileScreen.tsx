import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    View,
    StyleSheet,
    FlatList,
    Image,
    TouchableOpacity,
    ActivityIndicator,
    Animated,
    NativeSyntheticEvent,
    NativeScrollEvent,
    Alert,
} from 'react-native';
import { Text, Avatar, FAB } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp, CommonActions } from '@react-navigation/native';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';

import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { PWATheme } from '../../config/PWATheme';
import { usersAPI, friendsAPI, newsfeedAPI, chatAPI } from '../../utils/api';
import { getAvatarURL, getImageURL, getVideoURL, getInitials } from '../../utils/imageUtils';
import { formatTimeAgo } from '../../utils/dateUtils';
import { useTabBar } from '../../contexts/TabBarContext';

import ProfileHeader from '../../components/Profile/ProfileHeader';
import PostContent from '../../components/NewsFeed/PostContent';
import PostImagesCarousel from '../../components/NewsFeed/PostImagesCarousel';
import PostVideoPlayer from '../../components/NewsFeed/PostVideoPlayer';
import { PostControls } from '../../components/PostControls/PostControls';
import FullScreenImageViewer from '../../components/Common/FullScreenImageViewer';
import { spacing, typography, borderRadius } from '../../config/designTokens';

type OtherUserProfileScreenRouteProp = RouteProp<
    { OtherUserProfile: { userId: string } },
    'OtherUserProfile'
>;

const createStyles = (colors: typeof PWATheme.light, isDarkMode: boolean, insets?: { bottom: number }) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    stickyHeader: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        backgroundColor: colors.background,
        borderBottomWidth: 1,
        borderBottomColor: colors.border || (isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'),
        paddingBottom: spacing.sm,
    },
    stickyHeaderContent: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: spacing.base,
    },
    stickyMenuButton: {
        width: 40,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
    stickyHeaderCenter: {
        flex: 1,
        marginLeft: spacing.sm,
    },
    stickyName: {
        fontSize: typography.fontSize.lg,
        fontWeight: typography.fontWeight.bold,
    },
    stickyHandleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 2,
    },
    stickyHandle: {
        fontSize: typography.fontSize.sm,
    },
    stickyHeaderRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.xs,
    },
    stickyFollowButton: {
        paddingVertical: spacing.xs,
        paddingHorizontal: spacing.sm,
        borderRadius: borderRadius.md,
    },
    stickyFollowButtonText: {
        fontSize: typography.fontSize.sm,
        fontWeight: typography.fontWeight.semibold,
    },
    stickyMenuButtonSmall: {
        width: 32,
        height: 32,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: colors.border || (isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'),
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
        minHeight: 200,
    },
    emptyText: {
        fontSize: typography.fontSize.base,
    },
    postContainer: {
        paddingTop: spacing.md,
        paddingRight: spacing.base,
        paddingBottom: spacing.sm,
        paddingLeft: 0,
        borderBottomWidth: 1,
        borderBottomColor: colors.border || (isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)'),
    },
    postLayout: {
        flexDirection: 'row',
        gap: 10,
        marginTop: 1,
    },
    layoutAvi: {
        paddingLeft: 8,
        paddingRight: 10,
        position: 'relative',
        zIndex: 999,
    },
    layoutContent: {
        flex: 1,
        position: 'relative',
        zIndex: 0,
    },
    avatarContainer: {
        position: 'relative',
        width: 42,
        height: 42,
    },
    authorAvatar: {
        width: 42,
        height: 42,
        borderRadius: 21,
    },
    postMeta: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingBottom: 4,
        gap: 4,
    },
    authorSection: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        flex: 1,
    },
    authorName: {
        fontSize: typography.fontSize.md,
        fontWeight: typography.fontWeight.semibold,
        letterSpacing: typography.letterSpacing.tight,
        lineHeight: typography.fontSize.md * typography.lineHeight.relaxed,
    },
    authorHandle: {
        fontSize: 16,
        marginLeft: 4,
    },
    postTime: {
        fontSize: typography.fontSize.base,
        marginLeft: 4,
        lineHeight: typography.fontSize.base * typography.lineHeight.normal,
        fontWeight: typography.fontWeight.regular,
    },
    videoContainer: {
        marginTop: spacing.sm,
        marginBottom: spacing.xs,
    },
    imagesContainer: {
        marginTop: spacing.sm,
        marginBottom: spacing.xs,
    },
    postActions: {
        marginTop: spacing.xs,
    },
});

const OtherUserProfileScreen = () => {
    const { user: currentUser } = useAuth();
    const navigation = useNavigation();
    const route = useRoute<OtherUserProfileScreenRouteProp>();
    const { colors, isDarkMode } = useTheme();
    const { setIsVisible } = useTabBar();
    const queryClient = useQueryClient();
    const insets = useSafeAreaInsets();

    const userId = route.params?.userId;
    const [activeTab, setActiveTab] = useState<'posts' | 'replies' | 'media' | 'videos' | 'likes'>('posts');
    const [playingVideoId, setPlayingVideoId] = useState<string | null>(null);
    const [showImageViewer, setShowImageViewer] = useState(false);
    const [imageViewerImages, setImageViewerImages] = useState<string[]>([]);
    const [imageViewerIndex, setImageViewerIndex] = useState(0);
    const scrollY = useRef(new Animated.Value(0)).current;
    const flatListRef = useRef<FlatList>(null);
    const [isScrolledDown, setIsScrolledDown] = useState(false);
    const lastScrollY = useRef(0);

    const [isFollowing, setIsFollowing] = useState(false);
    const [isLoadingFollow, setIsLoadingFollow] = useState(false);

    // Hide tab bar when screen is focused
    useEffect(() => {
        setIsVisible(false);
        return () => {
            setIsVisible(true);
        };
    }, [setIsVisible]);

    // Redirect to own profile if viewing own profile
    useEffect(() => {
        if (userId && currentUser?.id?.toString() === userId.toString()) {
            navigation.goBack();
            // Optional: Navigate to MyProfile instead
            // navigation.navigate('MyProfile' as never);
        }
    }, [userId, currentUser?.id, navigation]);

    // Fetch user profile
    const {
        data: userProfile,
        isLoading: isLoadingProfile,
        refetch: refetchProfile,
    } = useQuery({
        queryKey: ['userProfile', userId],
        queryFn: async () => {
            const res = await usersAPI.getProfile(userId);
            return res.data;
        },
        enabled: !!userId,
    });

    // Fetch following list to check if following this user
    const { data: followingList = [], refetch: refetchFollowing } = useQuery({
        queryKey: ['following'],
        queryFn: async () => {
            try {
                const res = await friendsAPI.getFollowing();
                return Array.isArray(res.data) ? res.data : (res.data?.data || []);
            } catch (error) {
                return [];
            }
        },
    });

    // Fetch user stats
    const { data: userStats, refetch: refetchUserStats } = useQuery({
        queryKey: ['userStats', userId],
        queryFn: async () => {
            if (!userId) return { followersCount: 0, followingCount: 0, postsCount: 0 };
            try {
                const res = await usersAPI.getUserStats(userId);
                return {
                    followersCount: res.data?.followersCount || res.data?.followers_count || 0,
                    followingCount: res.data?.followingCount || res.data?.following_count || 0,
                    postsCount: res.data?.postsCount || res.data?.posts_count || 0,
                };
            } catch (error) {
                return {
                    followersCount: userProfile?.followers_count || 0,
                    followingCount: userProfile?.following_count || 0,
                    postsCount: 0,
                };
            }
        },
        enabled: !!userId,
    });

    // Update isFollowing state
    useEffect(() => {
        if (!userId || !followingList) {
            setIsFollowing(false);
            return;
        }
        const normalizedUserId = String(userId);
        const followingIds = followingList.map((f: any) => {
            const id = f.following_id || f.id || f.user_id;
            return id ? String(id) : null;
        }).filter(Boolean);

        setIsFollowing(followingIds.includes(normalizedUserId));
    }, [followingList, userId]);

    // Fetch user posts
    const { data: userPosts = [], isLoading: isLoadingPosts, refetch: refetchPosts } = useQuery({
        queryKey: ['userPosts', userId],
        queryFn: async () => {
            if (!userId) return [];
            try {
                // Note: Ideally we should have an API to get posts by userId directly.
                // For now, fetching all and filtering (as per MyProfileScreen logic, though inefficient for production)
                const res = await newsfeedAPI.getPosts(1, 'all');
                const allPosts = Array.isArray(res.data) ? res.data : (res.data?.posts || []);
                return allPosts.filter((post: any) => {
                    const postUserId = post.user_id || post.user?.id || post.author?.id;
                    return String(postUserId) === String(userId);
                });
            } catch (error) {
                console.error('Error fetching user posts:', error);
                return [];
            }
        },
        enabled: !!userId,
    });

    const stats = {
        posts: userStats?.postsCount || userPosts.length || 0,
        followers: userStats?.followersCount || 0,
        following: userStats?.followingCount || 0,
    };

    // Like mutation
    const likePostMutation = useMutation({
        mutationFn: async ({ postId }: { postId: string | number }) => {
            const post = userPosts.find((p: any) => (p.id || p._id || p.post_id) === postId);
            if (post?.isLiked) {
                await newsfeedAPI.unlikePost(postId.toString());
            } else {
                await newsfeedAPI.likePost(postId.toString());
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['userPosts', userId] });
        },
    });

    const handleFollow = async () => {
        if (!userId) return;

        if (isFollowing) {
            Alert.alert(
                'Hủy theo dõi',
                `Bạn có chắc chắn muốn hủy theo dõi ${userProfile?.full_name || userProfile?.username || 'người dùng này'} không?`,
                [
                    { text: 'Hủy', style: 'cancel' },
                    {
                        text: 'Hủy theo dõi',
                        style: 'destructive',
                        onPress: async () => {
                            await performUnfollow();
                        },
                    },
                ]
            );
        } else {
            await performFollow();
        }
    };

    const performFollow = async () => {
        setIsLoadingFollow(true);
        try {
            await friendsAPI.follow(userId);
            await Promise.all([
                refetchFollowing(),
                refetchProfile(),
                refetchUserStats(),
            ]);
        } catch (error: any) {
            console.error('Error following:', error);
            Alert.alert('Lỗi', error?.response?.data?.message || 'Không thể theo dõi');
        } finally {
            setIsLoadingFollow(false);
        }
    };

    const performUnfollow = async () => {
        setIsLoadingFollow(true);
        try {
            await friendsAPI.unfollow(userId);
            await Promise.all([
                refetchFollowing(),
                refetchProfile(),
                refetchUserStats(),
            ]);
        } catch (error: any) {
            console.error('Error unfollowing:', error);
            Alert.alert('Lỗi', 'Không thể hủy theo dõi');
        } finally {
            setIsLoadingFollow(false);
        }
    };

    const handleMessage = async () => {
        if (!userId || !userProfile) return;
        try {
            const response = await chatAPI.createConversation(userId);
            const conversationId = response.data?.conversationId || (response as any).conversationId;

            if (!conversationId) {
                Alert.alert('Lỗi', 'Không thể tạo cuộc trò chuyện');
                return;
            }

            navigation.dispatch(
                CommonActions.navigate({
                    name: 'Chat',
                    params: {
                        screen: 'ChatDetail',
                        params: {
                            conversationId: String(conversationId),
                            userName: userProfile.full_name || userProfile.username || 'Người dùng',
                            userAvatarUrl: userProfile.avatar_url,
                            otherUserId: userId,
                            isOnline: userProfile.status === 'online',
                        },
                    },
                })
            );
        } catch (error: any) {
            console.error('Error creating conversation:', error);
            Alert.alert('Lỗi', error?.response?.data?.message || 'Không thể tạo cuộc trò chuyện');
        }
    };

    const handleVideoPress = useCallback((postId: string, videoUrl: string) => {
        setPlayingVideoId(postId === playingVideoId ? null : postId);
    }, [playingVideoId]);

    const handleQuickLike = useCallback((postId: string | number) => {
        likePostMutation.mutate({ postId });
    }, [likePostMutation]);

    // Filter posts based on active tab
    const filteredPosts = (() => {
        if (activeTab === 'replies') {
            return userPosts.filter((post: any) => post.comments_count > 0 || post.parent_id || post.reply_to);
        }
        if (activeTab === 'media') {
            return userPosts.filter((post: any) => (post.images && post.images.length > 0) || post.image_url);
        }
        if (activeTab === 'videos') {
            return userPosts.filter((post: any) => post.video_url || post.videoUrl || post.videos?.length > 0);
        }
        // Likes tab hidden for other users usually, but if API supported it we could add it.
        // For now, 'posts' shows all.
        return userPosts;
    })();

    const dynamicStyles = createStyles(colors, isDarkMode, insets);

    // Early returns - must be before helper functions
    if (isLoadingProfile) {
        return (
            <SafeAreaView style={[dynamicStyles.container, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
                <View style={dynamicStyles.loadingContainer}>
                    <ActivityIndicator size="large" color={colors.primary} />
                </View>
            </SafeAreaView>
        );
    }

    if (!userProfile) {
        return (
            <SafeAreaView style={[dynamicStyles.container, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
                <View style={dynamicStyles.emptyContainer}>
                    <Text style={[dynamicStyles.emptyText, { color: colors.textSecondary }]}>
                        Không tìm thấy người dùng
                    </Text>
                </View>
            </SafeAreaView>
        );
    }

    // Handle scroll để hiện sticky header
    const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
        const currentScrollY = event.nativeEvent.contentOffset.y;
        const scrollDifference = currentScrollY - lastScrollY.current;

        if (Math.abs(scrollDifference) > 10) {
            if (currentScrollY > 200) {
                // Scroll xuống quá 200px - hiện sticky header
                if (!isScrolledDown) {
                    setIsScrolledDown(true);
                }
            } else {
                // Scroll lên trên 200px - ẩn sticky header
                if (isScrolledDown) {
                    setIsScrolledDown(false);
                }
            }
        }

        lastScrollY.current = currentScrollY;

        // Update animated value
        scrollY.setValue(currentScrollY);
    };

    // Sticky header opacity
    const stickyHeaderOpacity = scrollY.interpolate({
        inputRange: [150, 250],
        outputRange: [0, 1],
        extrapolate: 'clamp',
    });

    const stickyHeaderTranslateY = scrollY.interpolate({
        inputRange: [150, 250],
        outputRange: [-60, 0],
        extrapolate: 'clamp',
    });

    const renderHeader = () => (
        <ProfileHeader
            user={userProfile}
            stats={stats}
            isFollowing={isFollowing}
            isLoadingFollow={isLoadingFollow}
            onFollow={handleFollow}
            onMessage={handleMessage}
            activeTab={activeTab}
            onTabChange={setActiveTab}
        />
    );

    const renderPost = ({ item }: { item: any }) => {
        const authorName = item.full_name || item.username || 'Unknown';
        const authorAvatar = item.avatar_url || '';
        const postTime = item.created_at ? formatTimeAgo(new Date(item.created_at)) : '';

        let postVideoUrl: string | undefined = undefined;
        let hasVideo = false;
        if (item.videoUrl && item.videoUrl.trim() !== '') {
            postVideoUrl = getVideoURL(item.videoUrl);
            hasVideo = !!(postVideoUrl && postVideoUrl.trim() !== '');
        } else if (item.video_url && item.video_url.trim() !== '') {
            postVideoUrl = getVideoURL(item.video_url);
            hasVideo = !!(postVideoUrl && postVideoUrl.trim() !== '');
        }

        const postImages: string[] = [];
        if (!hasVideo) {
            if (item.images && Array.isArray(item.images)) {
                postImages.push(...item.images);
            } else if (item.image_url) {
                postImages.push(item.image_url);
            }
        }

        const videoThumbnail = item.thumbnailUrl || item.thumbnail_url || (postImages.length > 0 ? postImages[0] : undefined);
        const videoAspectRatio = item.video_aspect_ratio || (item.video_width && item.video_height ? item.video_width / item.video_height : undefined);

        return (
            <View style={[dynamicStyles.postContainer, { backgroundColor: colors.background }]}>
                <View style={dynamicStyles.postLayout}>
                    <View style={dynamicStyles.layoutAvi}>
                        <TouchableOpacity style={dynamicStyles.avatarContainer}>
                            {authorAvatar ? (
                                <Image source={{ uri: getAvatarURL(authorAvatar) }} style={dynamicStyles.authorAvatar} />
                            ) : (
                                <Avatar.Text size={42} label={getInitials(authorName)} style={dynamicStyles.authorAvatar} />
                            )}
                        </TouchableOpacity>
                    </View>
                    <View style={dynamicStyles.layoutContent}>
                        <View style={dynamicStyles.postMeta}>
                            <TouchableOpacity style={dynamicStyles.authorSection}>
                                <Text style={[dynamicStyles.authorName, { color: colors.text }]} numberOfLines={1}>{authorName}</Text>
                                <Text style={[dynamicStyles.authorHandle, { color: colors.textSecondary }]} numberOfLines={1}>{' @' + (item.username || 'user')}</Text>
                                {postTime && <Text style={[dynamicStyles.postTime, { color: colors.textSecondary }]}>· {postTime}</Text>}
                            </TouchableOpacity>
                        </View>

                        {item.content && (
                            <PostContent
                                content={item.content}
                                postId={item.id || item._id || item.post_id || item.postId}
                                onCollapse={() => { }}
                            />
                        )}

                        {postVideoUrl && postVideoUrl.trim() !== '' && (
                            <View style={dynamicStyles.videoContainer}>
                                <PostVideoPlayer
                                    videoUrl={postVideoUrl}
                                    thumbnailUrl={videoThumbnail}
                                    postId={String(item.id || item._id || item.post_id || item.postId)}
                                    isPlaying={playingVideoId === String(item.id || item._id || item.post_id || item.postId)}
                                    onPress={() => {
                                        const postId = String(item.id || item._id || item.post_id || item.postId);
                                        if (postId && postVideoUrl) handleVideoPress(postId, postVideoUrl);
                                    }}
                                    aspectRatio={videoAspectRatio}
                                />
                            </View>
                        )}

                        {postImages.length > 0 && (
                            <View style={dynamicStyles.imagesContainer}>
                                <PostImagesCarousel
                                    images={postImages}
                                    onPressImage={(idx) => {
                                        setImageViewerImages(postImages);
                                        setImageViewerIndex(idx);
                                        setShowImageViewer(true);
                                    }}
                                />
                            </View>
                        )}

                        <View style={dynamicStyles.postActions}>
                            <PostControls
                                post={{
                                    id: item.id || item._id || item.post_id || item.postId,
                                    isLiked: item.isLiked,
                                    likes_count: item.likes_count || 0,
                                    comments_count: item.comments_count || 0,
                                    reposts_count: item.reposts_count || 0,
                                    isReposted: item.isReposted,
                                }}
                                onPressLike={() => {
                                    const postId = item.id || item._id || item.post_id || item.postId;
                                    if (postId) handleQuickLike(postId);
                                }}
                                onPressReply={() => {
                                    const pid = item?.id || item?._id || item?.post_id || item?.postId || null;
                                    if (pid) {
                                        (navigation as any).navigate('NewsFeed', {
                                            screen: 'Comments',
                                            params: { postId: pid, postData: item },
                                        });
                                    }
                                }}
                                onPressRepost={() => { }}
                                onPressShare={() => { }}
                            />
                        </View>
                    </View>
                </View>
            </View>
        );
    };

    return (
        <SafeAreaView style={[dynamicStyles.container, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
            {/* Sticky Header - Hiện khi scroll xuống (giống MyProfileScreen) */}
            {isScrolledDown && (
                <Animated.View
                    style={[
                        dynamicStyles.stickyHeader,
                        {
                            opacity: stickyHeaderOpacity,
                            transform: [{ translateY: stickyHeaderTranslateY }],
                            paddingTop: insets.top + spacing.sm,
                        },
                    ]}
                >
                    <View style={dynamicStyles.stickyHeaderContent}>
                        {/* Left: Back button */}
                        <TouchableOpacity
                            style={dynamicStyles.stickyMenuButton}
                            onPress={() => navigation.goBack()}
                        >
                            <MaterialCommunityIcons name="arrow-left" size={24} color={colors.text} />
                        </TouchableOpacity>

                        {/* Center: Name and Handle */}
                        <View style={dynamicStyles.stickyHeaderCenter}>
                            <Text style={[dynamicStyles.stickyName, { color: colors.text }]}>
                                {userProfile?.full_name || userProfile?.username || 'Người dùng'}
                            </Text>
                            <View style={dynamicStyles.stickyHandleRow}>
                                <MaterialCommunityIcons
                                    name="white-balance-sunny"
                                    size={14}
                                    color={colors.textSecondary}
                                    style={{ marginRight: 4 }}
                                />
                                <Text style={[dynamicStyles.stickyHandle, { color: colors.textSecondary }]}>
                                    {userProfile?.username || ''}
                                </Text>
                            </View>
                        </View>

                        {/* Right: Action Buttons */}
                        <View style={dynamicStyles.stickyHeaderRight}>
                            <TouchableOpacity
                                style={[
                                    dynamicStyles.stickyFollowButton,
                                    { backgroundColor: isFollowing ? (colors.surface || (isDarkMode ? '#1E1E1E' : '#F5F5F5')) : (colors.primary || '#0084ff') },
                                    isFollowing && { borderWidth: 1, borderColor: colors.border }
                                ]}
                                onPress={handleFollow}
                                disabled={isLoadingFollow}
                            >
                                <Text style={[
                                    dynamicStyles.stickyFollowButtonText,
                                    { color: isFollowing ? colors.text : '#FFFFFF' }
                                ]}>
                                    {isLoadingFollow ? '...' : (isFollowing ? 'Đang theo dõi' : 'Theo dõi')}
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[dynamicStyles.stickyMenuButtonSmall, { backgroundColor: colors.surface || (isDarkMode ? '#1E1E1E' : '#F5F5F5') }]}
                                onPress={handleMessage}
                            >
                                <MaterialCommunityIcons name="message-text-outline" size={18} color={colors.text} />
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[dynamicStyles.stickyMenuButtonSmall, { backgroundColor: colors.surface || (isDarkMode ? '#1E1E1E' : '#F5F5F5') }]}
                                onPress={() => { }}
                            >
                                <MaterialCommunityIcons name="dots-horizontal" size={18} color={colors.text} />
                            </TouchableOpacity>
                        </View>
                    </View>
                </Animated.View>
            )}

            <>
                {isLoadingPosts ? (
                    <View style={dynamicStyles.loadingContainer}>
                        <ActivityIndicator size="large" color={colors.primary} />
                    </View>
                ) : filteredPosts.length === 0 ? (
                    <View style={dynamicStyles.emptyContainer}>
                        <Text style={[dynamicStyles.emptyText, { color: colors.textSecondary }]}>
                            {activeTab === 'replies' ? 'Chưa có trả lời nào' :
                                activeTab === 'media' ? 'Chưa có ảnh nào' :
                                    activeTab === 'videos' ? 'Chưa có video nào' :
                                        'Chưa có bài viết nào'}
                        </Text>
                    </View>
                ) : (
                    <FlatList
                        ref={flatListRef}
                        data={filteredPosts}
                        keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
                        renderItem={renderPost}
                        ListHeaderComponent={renderHeader}
                        contentContainerStyle={{ paddingBottom: Math.max(insets.bottom, 20) }}
                        showsVerticalScrollIndicator={false}
                        removeClippedSubviews={true}
                        maxToRenderPerBatch={10}
                        updateCellsBatchingPeriod={50}
                        windowSize={10}
                        initialNumToRender={10}
                        onScroll={(e) => {
                            handleScroll(e);
                            Animated.event(
                                [{ nativeEvent: { contentOffset: { y: scrollY } } }],
                                { useNativeDriver: false }
                            )(e);
                        }}
                        scrollEventThrottle={16}
                    />
                )}

                <FullScreenImageViewer
                    visible={showImageViewer}
                    images={imageViewerImages.map(img => getImageURL(img))}
                    initialIndex={imageViewerIndex}
                    onClose={() => setShowImageViewer(false)}
                />
            </>
        </SafeAreaView>
    );
};

export default OtherUserProfileScreen;
