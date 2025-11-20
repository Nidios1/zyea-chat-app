import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  Pressable,
  Dimensions,
  NativeSyntheticEvent,
  NativeScrollEvent,
  Animated,
  ActivityIndicator,
  Modal,
  RefreshControl,
  InteractionManager,
  Platform,
  TouchableWithoutFeedback,
  ViewToken,
  LayoutAnimation,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text, Avatar, Searchbar } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { newsfeedAPI, friendsAPI, chatAPI, usersAPI } from '../../utils/api';
import { getInitials, getImageURL, getAvatarURL, getVideoURL } from '../../utils/imageUtils';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme as useAppTheme } from '../../contexts/ThemeContext';
import { PWATheme } from '../../config/PWATheme';
import { useNavigation, useFocusEffect, useRoute, CommonActions } from '@react-navigation/native';
import Toast from 'react-native-toast-message';
import { useTabBar } from '../../contexts/TabBarContext';
import PostImagesCarousel from '../../components/NewsFeed/PostImagesCarousel';
import PostVideoPlayer from '../../components/NewsFeed/PostVideoPlayer';
import ExpandableText from '../../components/Common/ExpandableText';
import FullScreenImageViewer from '../../components/Common/FullScreenImageViewer';
import { Video, ResizeMode } from 'expo-av';
import SplashScreen from '../../components/Splash/SplashScreen';
import ReactionPicker from '../../components/NewsFeed/ReactionPicker';
import StoriesSection from '../../components/NewsFeed/StoriesSection';
import { ShowMoreTextButton, MAX_POST_LINES } from '../../components/NewsFeed/ShowMoreTextButton';
import { Image as RNImage, Linking } from 'react-native';
import { parseTextWithUrls, TextPart } from '../../utils/textUtils';

// PostContent component - Social-app-main style
const PostContent = React.memo(({ 
  content, 
  styles, 
  colors,
  countLines,
  postId,
  onCollapse
}: { 
  content: string;
  styles: ReturnType<typeof createStyles>;
  colors: any;
  countLines: (text: string | undefined) => number;
  postId?: string | number;
  onCollapse?: (postId: string | number) => void;
}) => {
  // Always truncate initially if text is potentially long
  // Use heuristic: text > 100 chars OR has newlines (>= 1)
  // Threshold để detect text dài một cách chính xác hơn
  const shouldLimitInitially = React.useMemo(() => {
    if (!content || content.trim().length === 0) return false;
    // Count explicit newlines
    const newlineCount = countLines(content);
    // Text dài nếu có trên 100 ký tự hoặc có ít nhất 1 newline
    // ~20-25 chars per line on mobile, nên 100 chars ≈ 4-5 lines
    const isLongText = content.length > 100;
    // Nếu có newline, text chắc chắn dài
    return newlineCount >= 1 || isLongText;
  }, [content, countLines]);
  
  const [isExpanded, setIsExpanded] = React.useState(false);
  const [actualLineCount, setActualLineCount] = React.useState<number | null>(null);
  const [fullLineCount, setFullLineCount] = React.useState<number | null>(null);
  const [hasMeasured, setHasMeasured] = React.useState(false);
  
  // Reset when content changes
  React.useEffect(() => {
    setIsExpanded(false);
    setActualLineCount(null);
    setFullLineCount(null);
    setHasMeasured(false);
  }, [content]);
  
  // Measure actual line count when text is rendered
  const onTextLayout = React.useCallback((event: any) => {
    const { lines } = event.nativeEvent;
    if (lines && lines.length > 0) {
      const lineCount = lines.length;
      
      if (!isExpanded) {
        // When collapsed, measure truncated text
        // Chỉ đo lại nếu chưa đo hoặc đã reset
        if (!hasMeasured) {
          setActualLineCount(lineCount);
          setHasMeasured(true);
          
          // Chỉ auto-expand nếu text thực sự ngắn (không cần truncate)
          // Nếu shouldLimitInitially = false, nghĩa là text ngắn, không cần truncate
          if (!shouldLimitInitially) {
            setIsExpanded(true);
          }
        }
        // Nếu shouldLimitInitially = true, không auto-expand vì text dài
        // Chỉ hiển thị nút "Xem thêm" khi lineCount >= MAX_POST_LINES
      } else {
        // When expanded, measure full text
        setFullLineCount(lineCount);
      }
    }
  }, [isExpanded, shouldLimitInitially, hasMeasured]);
  
  const onPressToggle = React.useCallback(() => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setIsExpanded(prev => {
      const newValue = !prev;
      // Khi collapse lại, reset hasMeasured để đo lại text
      if (!newValue) {
        setHasMeasured(false);
        // Reset actualLineCount để đảm bảo nút "Xem thêm" hiển thị lại
        setActualLineCount(null);
        // Gọi callback để scroll đến post khi thu gọn
        if (postId && onCollapse) {
          // Delay một chút để đảm bảo animation hoàn tất
          setTimeout(() => {
            onCollapse(postId);
          }, 100);
        }
      }
      return newValue;
    });
  }, [postId, onCollapse]);
  
  // Always truncate initially if text is potentially long and not expanded
  const shouldLimitLines = !isExpanded && shouldLimitInitially;
  
  // Show "Xem thêm" button if we're limiting lines AND text is actually long
  // Use fullLineCount if available (from previous expansion) to know if text is long
  // Otherwise use actualLineCount or assume it's long if shouldLimitInitially
  const isTextLong = fullLineCount !== null 
    ? fullLineCount > MAX_POST_LINES 
    : (actualLineCount !== null ? actualLineCount >= MAX_POST_LINES : shouldLimitInitially);
  
  const shouldShowMore = shouldLimitLines && isTextLong;
  
  // Show "Thu gọn" button if expanded and text was actually truncated
  // Use fullLineCount if available, otherwise use actualLineCount
  const totalLineCount = isExpanded ? (fullLineCount || actualLineCount) : actualLineCount;
  const shouldShowLess = isExpanded && shouldLimitInitially && (
    totalLineCount === null || totalLineCount > MAX_POST_LINES
  );
  
  // Chỉ cho phép toggle khi text thực sự dài (có nút "Xem thêm" hoặc "Thu gọn")
  const canToggle = shouldShowMore || shouldShowLess;
  
  // Render text với links và hashtags, hỗ trợ numberOfLines
  const renderTextWithLinks = React.useCallback(() => {
    const parts = parseTextWithUrls(content);

    const handleLinkPress = async (url: string) => {
      try {
        let formattedUrl = url.trim();
        if (!formattedUrl.match(/^https?:\/\//i)) {
          formattedUrl = 'https://' + formattedUrl;
        }
        await Linking.openURL(formattedUrl);
      } catch (error) {
        // Silently handle errors
      }
    };

    // Parse hashtags và mentions
    const parseHashtagsAndMentions = (text: string): Array<{text: string, type: 'text' | 'hashtag' | 'mention', start: number, end: number}> => {
      const result: Array<{text: string, type: 'text' | 'hashtag' | 'mention', start: number, end: number}> = [];
      let lastIndex = 0;
      
      // Hashtag pattern: #word (không có khoảng trắng, có thể có dấu)
      const hashtagRegex = /#[\w\u00C0-\u1EF9]+/g;
      // Mention pattern: @username
      const mentionRegex = /@[\w\u00C0-\u1EF9]+/g;
      
      // Combine all matches
      const allMatches: Array<{match: RegExpMatchArray, type: 'hashtag' | 'mention'}> = [];
      
      let match;
      while ((match = hashtagRegex.exec(text)) !== null) {
        allMatches.push({ match, type: 'hashtag' });
      }
      while ((match = mentionRegex.exec(text)) !== null) {
        allMatches.push({ match, type: 'mention' });
      }
      
      // Sort by position
      allMatches.sort((a, b) => a.match.index! - b.match.index!);
      
      allMatches.forEach(({ match, type }) => {
        const start = match.index!;
        const end = start + match[0].length;
        
        // Add text before match
        if (start > lastIndex) {
          result.push({
            text: text.substring(lastIndex, start),
            type: 'text',
            start: lastIndex,
            end: start,
          });
        }
        
        // Add match
        result.push({
          text: match[0],
          type,
          start,
          end,
        });
        
        lastIndex = end;
      });
      
      // Add remaining text
      if (lastIndex < text.length) {
        result.push({
          text: text.substring(lastIndex),
          type: 'text',
          start: lastIndex,
          end: text.length,
        });
      }
      
      return result.length > 0 ? result : [{ text, type: 'text', start: 0, end: text.length }];
    };

    // Merge URL parts with hashtag/mention parts
    const renderRichText = () => {
      if (parts.length === 1 && parts[0].type === 'text') {
        // No URLs, but check for hashtags/mentions
        const richParts = parseHashtagsAndMentions(content);
        
        if (richParts.length === 1 && richParts[0].type === 'text') {
          // Plain text only
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
        
        // Has hashtags or mentions
        return (
          <Text
            style={[styles.postContent, { color: colors.text }]}
            numberOfLines={shouldLimitLines ? MAX_POST_LINES : undefined}
            ellipsizeMode="tail"
            onTextLayout={onTextLayout}
          >
            {richParts.map((part, index) => {
              if (part.type === 'hashtag') {
                return (
                  <Text
                    key={index}
                    style={[
                      styles.postContent,
                      {
                        color: '#1877F2', // Facebook blue
                        fontWeight: '600', // Bold like Facebook
                      }
                    ]}
                    suppressHighlighting={true}
                  >
                    {part.text}
                  </Text>
                );
              }
              if (part.type === 'mention') {
                return (
                  <Text
                    key={index}
                    style={[
                      styles.postContent,
                      {
                        color: '#1877F2', // Facebook blue
                        fontWeight: '600', // Bold like Facebook
                      }
                    ]}
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

      // Has URLs - merge with hashtags/mentions
      const mergedParts: Array<{text: string, type: 'text' | 'url' | 'hashtag' | 'mention', url?: string}> = [];
      
      parts.forEach(part => {
        if (part.type === 'url') {
          mergedParts.push(part);
        } else {
          // Parse text for hashtags/mentions
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
                  style={[
                    styles.postContent,
                    {
                      color: '#1877F2', // Facebook blue
                      fontWeight: '600', // Bold like Facebook title
                      textDecorationLine: 'none', // No underline for cleaner look
                    }
                  ]}
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
                  style={[
                    styles.postContent,
                    {
                      color: '#1877F2', // Facebook blue
                      fontWeight: '600', // Bold like Facebook
                    }
                  ]}
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
  }, [content, colors.text, shouldLimitLines, onTextLayout]);

  return (
    <View style={styles.postContentWrapper}>
      <Pressable
        onPress={canToggle ? onPressToggle : undefined}
        disabled={!canToggle}
        style={{ flex: 1 }}
        hitSlop={{ top: 5, bottom: 5, left: 0, right: 0 }} // Tăng vùng chạm
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

const createStyles = (colors: typeof PWATheme.light, isDarkMode: boolean) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: isDarkMode 
      ? (colors.background || '#000000')
      : (colors.background || '#F2F2F7'), // iOS system background color
  },
  // iOS-style minimal header with better spacing
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14, // More vertical padding for iOS
    backgroundColor: 'transparent', // Xóa nền header
    // Xóa border bottom
  },
  headerLeft: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  headerLeftWithText: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minWidth: 100,
    zIndex: 10,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '400',
  },
  logoSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    position: 'absolute',
    left: 0,
    right: 0,
    justifyContent: 'center',
    zIndex: 1,
    pointerEvents: 'box-none',
  },
  headerTitle: {
    fontSize: 18, // iOS standard large title size
    fontWeight: '700', // Bold for iOS
    textAlign: 'center',
    letterSpacing: -0.3, // Tighter spacing for iOS
  },
  logoImage: {
    width: 40,
    height: 40,
    borderRadius: 10, // Slightly more rounded for iOS
  },
  logoText: {
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    zIndex: 10,
  },
  headerIconButton: {
    width: 44, // iOS minimum touch target
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 22, // Circular for iOS
  },
  messageIconContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  messageBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#FF3B30', // iOS red
    borderRadius: 10,
    paddingHorizontal: 5,
    paddingVertical: 2,
    minWidth: 20, // Slightly larger
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.3,
        shadowRadius: 2,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  messageBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  listContent: {
    paddingTop: 0,
    paddingBottom: 20,
  },
  // Facebook style: Nội dung bắt đầu từ bên trái
  postContainer: {
    paddingTop: 12,
    paddingRight: 16,
    paddingBottom: 8,
    paddingLeft: 0, // Bắt đầu từ bên trái giống Facebook
    backgroundColor: 'transparent',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border || (isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)'),
  },
  // Layout: row with avatar left, content right (Facebook style)
  postLayout: {
    flexDirection: 'row',
    gap: 12, // Tăng gap giữa avatar và content
    paddingLeft: 16, // Padding chỉ cho layout, không cho container
    paddingRight: 0,
  },
  layoutAvi: {
    // Avatar container - không có padding
  },
  layoutContent: {
    flex: 1,
    paddingRight: 0, // Nội dung bắt đầu từ bên trái
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8, // Tăng spacing giống Facebook
  },
  authorSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  authorAvatar: {
    width: 42, // social-app-main uses 42
    height: 42,
    borderRadius: 21,
  },
  avatarContainer: {
    position: 'relative',
    width: 42,
    height: 42,
  },
  authorInfo: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: 2,
  },
  authorName: {
    fontSize: 16, // social-app-main post text size
    fontWeight: '600',
    letterSpacing: -0.2,
    lineHeight: 22,
  },
  postTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  postTime: {
    fontSize: 14, // Slightly larger for better readability
    marginLeft: 0,
    lineHeight: 20,
    fontWeight: '400',
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 12, // Adjusted for 42px avatar
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    backgroundColor: '#34C759', // iOS green
    borderColor: colors.background || colors.surface || '#FFFFFF',
  },
  privacyIcon: {
    marginLeft: 4,
  },
  postMoreButton: {
    width: 36, // iOS minimum touch target
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
    ...Platform.select({
      ios: {
        // Subtle press effect
      },
    }),
  },
  followButton: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.surface || (isDarkMode ? '#1C1C1E' : '#FFFFFF'),
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: colors.surface || (isDarkMode ? '#1C1C1E' : '#FFFFFF'),
    shadowColor: isDarkMode ? '#000' : 'rgba(0, 0, 0, 0.1)',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: isDarkMode ? 0.3 : 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  // Social-app-main style: Content in layoutContent - Facebook style
  postContentWrapper: {
    marginTop: 8, // Tăng spacing giống Facebook
    marginBottom: 4,
  },
  postContent: {
    fontSize: 16, // Facebook post text size
    lineHeight: 24, // Tăng line height cho dễ đọc hơn
    letterSpacing: -0.1, // Slightly tighter
    fontWeight: '400', // Regular weight for normal text
  },
  imagesContainer: {
    marginTop: 8, // Tăng spacing giống Facebook
    marginBottom: 4,
    borderRadius: 12, // Rounded corners for images
    overflow: 'hidden',
    width: '100%',
    backgroundColor: 'transparent', // Xóa nền để đồng bộ
    alignItems: 'center', // Căn giữa ảnh giống Facebook
  },
  videoContainer: {
    marginTop: 8, // Tăng spacing giống Facebook
    marginBottom: 4,
    width: '100%',
    overflow: 'hidden',
  },
  videoWrapper: {
    width: '100%',
    position: 'relative',
    backgroundColor: 'transparent', // Xóa nền để đồng bộ
  },
  video: {
    width: '100%',
    aspectRatio: 16 / 9,
    minHeight: 200,
    maxHeight: 600,
  },
  videoPlayButton: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  postImage: {
    borderRadius: 12,
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
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: 'transparent', // Xóa nền để đồng bộ
  },
  // Social-app-main style: Reactions count
  reactionsCountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 10,
    paddingBottom: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border || (isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)'),
  },
  reactionsCountLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  reactionsCountRight: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 'auto',
  },
  reactionIconsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: -4, // Overlap icons slightly like Facebook
  },
  reactionsCountText: {
    fontSize: 15, // iOS standard size
    fontWeight: '500', // Medium weight for better readability
    letterSpacing: -0.1,
  },
  postActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingTop: 6,
    paddingBottom: 6,
    marginTop: 0,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border || (isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)'),
  },
  // Social-app-main PostControlButton style
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8, // gap_xs
    backgroundColor: 'transparent',
    padding: 5,
    flex: 1,
    justifyContent: 'center',
  },
  actionText: {
    fontSize: 15, // iOS standard size
    fontWeight: '600',
    lineHeight: 20,
    letterSpacing: -0.1,
  },
  actionCount: {
    fontSize: 13,
    marginLeft: 0,
    lineHeight: 18,
    fontWeight: '500',
  },
  emptyContainer: {
    padding: 60,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 15,
    textAlign: 'center',
  },
  // iOS-style "Có gì mới?" section
  newPostSection: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginHorizontal: 12,
    marginTop: 8,
    marginBottom: 8,
    backgroundColor: colors.surface, // Giữ lại nền cho phần "Bạn đang nghĩ gì?"
    borderRadius: 16,
    ...Platform.select({
      ios: {
        shadowColor: isDarkMode ? '#000' : 'rgba(0, 0, 0, 0.1)',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: isDarkMode ? 0.15 : 0.06,
        shadowRadius: 4,
      },
      android: {
        elevation: 1,
      },
    }),
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border || (isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)'),
  },
  newPostContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  newPostAvatarContainer: {
    position: 'relative',
    width: 40,
    height: 40,
  },
  newPostAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  newPostTextContainer: {
    flex: 1,
    backgroundColor: isDarkMode 
      ? (colors.border || 'rgba(255, 255, 255, 0.1)')
      : (colors.border || '#F0F2F5'), // iOS system gray
    borderRadius: 22, // iOS standard rounded input
    paddingHorizontal: 16,
    paddingVertical: 10,
    minHeight: 44, // iOS minimum touch target
    justifyContent: 'center',
  },
  newPostPrompt: {
    fontSize: 16, // iOS standard body text
    letterSpacing: -0.2,
    lineHeight: 22,
  },
  newPostIconButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Menu Modal
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: isDarkMode ? 'rgba(0, 0, 0, 0.7)' : 'rgba(0, 0, 0, 0.5)',
  },
  menuContainer: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 8,
    paddingBottom: 20,
    maxHeight: 300,
  },
  menuHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  menuContent: {
    paddingHorizontal: 16,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 4,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  menuItemText: {
    fontSize: 16,
  },
  // Search Modal
  searchModalOverlay: {
    flex: 1,
    backgroundColor: isDarkMode ? 'rgba(0, 0, 0, 0.7)' : 'rgba(0, 0, 0, 0.5)',
  },
  searchModalContainer: {
    flex: 1,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 8,
  },
  searchModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  searchInputContainer: {
    flex: 1,
    marginRight: 12,
  },
  searchResultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  searchResultAvatar: {
    marginRight: 12,
  },
  searchResultInfo: {
    flex: 1,
  },
  searchResultName: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  searchResultEmail: {
    fontSize: 14,
  },
  searchResultActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginRight: 8,
  },
  searchResultButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    minWidth: 90,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  searchResultButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  searchEmptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  searchEmptyText: {
    fontSize: 16,
    marginTop: 16,
  },
  transitionOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
  },
});

const PostsListScreen = () => {
  const { user } = useAuth();
  const { colors, isDarkMode } = useAppTheme();
  const navigation = useNavigation();
  const route = useRoute();
  const { setIsVisible } = useTabBar();
  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);
  const lastRefreshParam = useRef<number | null>(null);
  const [imageAspectRatios, setImageAspectRatios] = useState<Record<string, number>>({});
  const [imageDimensions, setImageDimensions] = useState<Record<string, { width: number; height: number }>>({});
  const [activePostId, setActivePostId] = useState<string | number | null>(null);
  const [playingVideoId, setPlayingVideoId] = useState<string | null>(null);
  
  // Helper function to count lines in text (like social-app-main)
  // This counts explicit newlines (\n), not wrapped lines
  const countLines = useCallback((text: string | undefined): number => {
    if (!text) return 0;
    // Count newlines - same as social-app-main: str.match(/\n/g)?.length ?? 0
    const matches = text.match(/\n/g);
    return matches ? matches.length : 0;
  }, []);
  
  // Helper function to get image dimensions
  const getImageDimensions = useCallback((imageUrl: string): Promise<{ width: number; height: number } | null> => {
    return new Promise((resolve) => {
      if (imageDimensions[imageUrl]) {
        resolve(imageDimensions[imageUrl]);
        return;
      }
      
      RNImage.getSize(
        imageUrl,
        (width, height) => {
          const dims = { width, height };
          setImageDimensions(prev => ({ ...prev, [imageUrl]: dims }));
          resolve(dims);
        },
        (error) => {
          console.log('Failed to get image dimensions:', error);
          resolve(null);
        }
      );
    });
  }, [imageDimensions]);
  const [activeTab, setActiveTab] = useState<'all' | 'following'>('all');
  const [showMenu, setShowMenu] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showImageViewer, setShowImageViewer] = useState(false);
  const [imageViewerImages, setImageViewerImages] = useState<string[]>([]);
  const [imageViewerIndex, setImageViewerIndex] = useState(0);
  const [imageViewerPostData, setImageViewerPostData] = useState<any>(null);
  const scrollY = useRef(0);
  const lastScrollY = useRef(0);
  const headerOpacity = useRef(new Animated.Value(1)).current;
  const headerTranslateY = useRef(new Animated.Value(0)).current;
  const isHeaderVisible = useRef(true); // Track header visibility state
  const flatListRef = useRef<FlatList>(null);
  const [isChangingTab, setIsChangingTab] = useState(false); // Prevent multiple tab changes
  
  // Track visible items để tự động pause video khi scroll ra khỏi view
  const [visiblePostIds, setVisiblePostIds] = useState<Set<string>>(new Set());
  // Track các post đã được view để tránh track nhiều lần
  const viewedPostIds = useRef<Set<string>>(new Set());
  
  // Callback để track các post đang visible
  const onViewableItemsChanged = useRef(({ viewableItems }: { viewableItems: ViewToken[] }) => {
    const visibleIds = new Set<string>();
    viewableItems.forEach((item: ViewToken) => {
      if (item.item?.id) {
        visibleIds.add(String(item.item.id));
      }
    });
    setVisiblePostIds(visibleIds);
  }).current;

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 50, // Item phải visible ít nhất 50% mới được tính
    minimumViewTime: 100, // Phải visible ít nhất 100ms
  }).current;
  
  // Tự động pause video khi scroll ra khỏi view
  useEffect(() => {
    if (playingVideoId && !visiblePostIds.has(playingVideoId)) {
      // Video đang play nhưng không còn visible -> pause ngay
      setPlayingVideoId(null);
    }
  }, [visiblePostIds, playingVideoId]);

  // KHÔNG reset viewedPostIds khi posts thay đổi - mỗi user chỉ track 1 lần
  // Backend đã xử lý việc kiểm tra user đã xem chưa, nên không cần clear ở đây
  // Chỉ clear khi user logout hoặc app restart

  // Track post views khi post được hiển thị
  useEffect(() => {
    visiblePostIds.forEach((postId) => {
      // Chỉ track nếu chưa track trước đó
      if (!viewedPostIds.current.has(postId)) {
        viewedPostIds.current.add(postId);
        // Gọi API để track view
        newsfeedAPI.trackPostView(postId)
          .then((response) => {
            // Cập nhật views_count ngay lập tức từ response
            if (response?.data?.views_count !== undefined) {
              // Update optimistic trong cache
              queryClient.setQueryData(['posts', activeTab], (old: any) => {
                if (!old) return old;
                return old.map((post: any) => {
                  if (String(post.id) === String(postId) || 
                      String(post._id) === String(postId) || 
                      String(post.post_id) === String(postId)) {
                    return {
                      ...post,
                      views_count: response.data.views_count,
                    };
                  }
                  return post;
                });
              });
            }
            // Invalidate query để đảm bảo sync với server
            queryClient.invalidateQueries({ queryKey: ['posts', activeTab] });
          })
          .catch((error) => {
            // Nếu lỗi, remove khỏi viewed để có thể retry sau
            viewedPostIds.current.delete(postId);
            console.log('Failed to track post view:', error);
          });
      }
    });
  }, [visiblePostIds, activeTab, queryClient]);
  
  // Animation values cho hiệu ứng chuyển app (từ NewsFeed -> Chat)
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const [isNavigatingToChat, setIsNavigatingToChat] = useState(false);
  const [showSplashScreen, setShowSplashScreen] = useState(false);
  const splashOpacity = useRef(new Animated.Value(0)).current;
  const [showReactionPicker, setShowReactionPicker] = useState<string | null>(null);
  const [reactionPickerPosition, setReactionPickerPosition] = useState({ x: 0, y: 0 });
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const likeButtonRefs = useRef<{ [key: string]: any }>({});

  // Reset tab bar visibility when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      // Chỉ hiện bottom bar nếu không đang navigate sang Chat
      if (!isNavigatingToChat) {
        setIsVisible(true);
      }
      
      // Invalidate queries khi quay lại màn hình để đảm bảo data mới nhất
      // React Query sẽ tự động refetch nếu query đang active
      queryClient.invalidateQueries({ queryKey: ['posts', activeTab] });
      
      return () => {
        // Optional: cleanup when screen loses focus
      };
    }, [setIsVisible, isNavigatingToChat, queryClient, activeTab])
  );

  // Listen for navigation params to trigger refresh when Home tab is pressed (like Facebook)
  useEffect(() => {
    const params = route.params as any;
    if (params?.refresh && params.refresh !== lastRefreshParam.current) {
      lastRefreshParam.current = params.refresh;
      
      if (params.scrollToTop && flatListRef.current) {
        // First, scroll to a small negative offset to trigger pull-to-refresh indicator
        // Then scroll to top and show refresh
        flatListRef.current.scrollToOffset({ offset: -50, animated: false });
        
        // Immediately show refresh indicator
        setRefreshing(true);
        
        // Then scroll to top with animation
        setTimeout(() => {
          flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
          
          // Trigger the actual refresh
          setTimeout(() => {
            handleRefresh();
          }, 200);
        }, 50);
      } else {
        // If no scrollToTop, just refresh normally
        setRefreshing(true);
        setTimeout(() => {
          handleRefresh();
        }, 100);
      }
    }
  }, [route.params, handleRefresh]);

  // Fetch following list for filtering and checking follow status
  const { data: followingList = [], isLoading: isLoadingFollowing, refetch: refetchFollowing } = useQuery({
    queryKey: ['following'],
    queryFn: async () => {
      const res = await friendsAPI.getFollowing();
      // Handle both array response and object with data property
      return Array.isArray(res.data) ? res.data : (res.data?.data || []);
    },
    // Always fetch to check follow status for all posts
  });

  // Create a Set of following IDs for quick lookup
  const followingIds = new Set(
    followingList.map((f: any) => f.following_id || f.id || f.user_id)
  );

  // Fetch conversations to get unread count
  const { data: conversations = [] } = useQuery({
    queryKey: ['conversations'],
    queryFn: async () => {
      const res = await chatAPI.getConversations();
      return Array.isArray(res.data) ? res.data : (res.data?.conversations || []);
    },
    staleTime: 30000, // 30 seconds
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  // Calculate unread count from conversations
  const unreadCount = useMemo(() => {
    return conversations.reduce((total: number, conv: any) => {
      return total + (conv.unread_count || conv.unreadCount || 0);
    }, 0);
  }, [conversations]);

  // Search users query
  const { data: searchResults = [], isLoading: isSearching } = useQuery({
    queryKey: ['searchUsers', searchQuery],
    queryFn: async () => {
      if (!searchQuery.trim()) return [];
      const res = await usersAPI.searchUsers(searchQuery);
      return Array.isArray(res.data) ? res.data : (res.data?.users || res.data?.data || []);
    },
    enabled: searchQuery.trim().length > 0,
    staleTime: 30000,
  });

  const {
    data: posts = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['posts', activeTab],
    queryFn: async () => {
      // Pass type to API: 'all' for all public posts, 'following' for following posts
      const type = activeTab === 'following' ? 'following' : 'all';
      console.log('📱 Fetching posts with type:', type, 'activeTab:', activeTab);
      const res = await newsfeedAPI.getPosts(1, type);
      // Include all posts (including videos) in news feed
      const allPosts = Array.isArray(res.data) ? res.data : (res.data?.posts || []);
      console.log('📱 Received posts:', allPosts.length, 'posts');
      if (allPosts.length > 0) {
        const userIds = [...new Set(allPosts.map((p: any) => p.user_id))];
        console.log('📱 Posts from', userIds.length, 'different users:', userIds);
        console.log('📱 Current user id:', user?.id);
        // Debug: Log views count for first post
        if (allPosts[0]) {
          console.log('📱 First post views data:', {
            views_count: allPosts[0].views_count,
            view_count: allPosts[0].view_count,
            views: allPosts[0].views,
            post_views: allPosts[0].post_views,
            fullItem: Object.keys(allPosts[0])
          });
        }
      }
      
      // Return all posts (including videos) - videos will be displayed in news feed
      console.log('📱 Posts with videos:', allPosts.filter((p: any) => p.videoUrl || p.video_url || p.videos).length);
      return allPosts;
    },
    enabled: activeTab === 'all' || (activeTab === 'following' && !isLoadingFollowing),
    staleTime: 30 * 1000, // 30 seconds - data fresh (optimized for better performance)
    gcTime: 5 * 60 * 1000, // Keep in cache for 5 minutes
    refetchOnWindowFocus: false, // Don't refetch on focus
  });

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      // Invalidate cache to force fresh data
      await queryClient.invalidateQueries({ queryKey: ['posts', activeTab] });
      await queryClient.invalidateQueries({ queryKey: ['following'] });
      
      // Always refresh following list to get latest follow status
      await refetchFollowing();
      
      // Refetch posts with current activeTab
      await refetch();
      
      console.log('📱 Refresh completed for tab:', activeTab);
    } catch (error) {
      console.error('❌ Error refreshing:', error);
    } finally {
      setRefreshing(false);
    }
  }, [queryClient, activeTab, refetchFollowing, refetch]);

  // Handler để navigate đến Chat với hiệu ứng chuyển app (giống Messenger)
  const handleNavigateToChat = () => {
    // Đánh dấu đang navigate để useFocusEffect không set isVisible(true)
    setIsNavigatingToChat(true);
    // Ẩn bottom bar ngay lập tức khi bắt đầu navigate
    setIsVisible(false);
    
    // Bước 1: Fade out màn hình hiện tại
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 150,
      useNativeDriver: true,
    }).start(() => {
      // Bước 2: Hiển thị splash screen (giống Messenger)
      setShowSplashScreen(true);
      splashOpacity.setValue(0);
      
      Animated.timing(splashOpacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start(() => {
        // Preload dữ liệu cho Chat trong thời gian splash screen
        Promise.all([
          // Prefetch conversations
          queryClient.prefetchQuery({
            queryKey: ['conversations'],
            queryFn: async () => {
              const response = await chatAPI.getConversations();
              return response.data || [];
            },
          }),
          // Prefetch following list (cho stories và online status)
          queryClient.prefetchQuery({
            queryKey: ['following'],
            queryFn: async () => {
              const res = await friendsAPI.getFollowing();
              return Array.isArray(res.data) ? res.data : (res.data?.data || []);
            },
          }),
        ]).catch((error) => {
          console.log('Preload data error (non-critical):', error);
        });
        
        // Bước 3: Giữ splash screen trong 1.2 giây (giống Messenger)
        setTimeout(() => {
          // Bước 4: Fade out splash screen và navigate
          Animated.timing(splashOpacity, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true,
          }).start(() => {
            setShowSplashScreen(false);
            
            // Navigate đến Chat tab
            InteractionManager.runAfterInteractions(() => {
              const parent = navigation.getParent();
              if (parent) {
                parent.navigate('Chat' as never);
              } else {
                navigation.dispatch(
                  CommonActions.navigate({
                    name: 'Chat',
                  })
                );
              }
            });
            
            // Reset animation và flag
            setTimeout(() => {
              fadeAnim.setValue(1);
              setIsNavigatingToChat(false);
            }, 100);
          });
        }, 1200); // Giữ splash screen 1.2 giây
      });
    });
  };

  const handleFollow = async (userId: string | number) => {
    try {
      await friendsAPI.follow(userId.toString());
      // Refresh following list to update UI
      await refetchFollowing();
    } catch (error: any) {
      console.error('Error following user:', error);
      // Show error message if needed
    }
  };

  const handleUnfollow = async (userId: string | number) => {
    try {
      await friendsAPI.unfollow(userId.toString());
      // Refresh following list to update UI
      await refetchFollowing();
    } catch (error: any) {
      console.error('Error unfollowing user:', error);
      // Show error message if needed
    }
  };

  // Mutation for follow/unfollow in search results
  const followMutation = useMutation({
    mutationFn: (userId: string) => friendsAPI.follow(userId),
    onSuccess: () => {
      Toast.show({
        type: 'success',
        text1: 'Đã theo dõi',
      });
      refetchFollowing();
    },
    onError: (error: any) => {
      Toast.show({
        type: 'error',
        text1: error?.response?.data?.message || 'Không thể theo dõi',
      });
    },
  });

  // Mutation for like/unlike post
  const likePostMutation = useMutation({
    mutationFn: async ({ postId, reactionType = 'like' }: { postId: string | number; reactionType?: string }) => {
      // Server tự động toggle like/unlike dựa trên trạng thái hiện tại
      return await newsfeedAPI.likePost(postId.toString(), reactionType);
    },
    onMutate: async ({ postId, reactionType = 'like' }) => {
      // Optimistic update - cập nhật UI ngay lập tức
      await queryClient.cancelQueries({ queryKey: ['posts', activeTab] });
      
      const previousPosts = queryClient.getQueryData(['posts', activeTab]);
      
      queryClient.setQueryData(['posts', activeTab], (old: any) => {
        if (!old) return old;
        return old.map((post: any) => {
          if (post.id === postId || post._id === postId || post.post_id === postId) {
            const currentIsLiked = post.isLiked || false;
            const currentReactionType = post.reactionType || 'like';
            
            // Nếu đã like với cùng reaction type thì unlike, ngược lại thì like với reaction mới
            const willBeLiked = !currentIsLiked || currentReactionType !== reactionType;
            
            return {
              ...post,
              isLiked: willBeLiked,
              reactionType: willBeLiked ? reactionType : null,
              likes_count: willBeLiked
                ? (currentIsLiked && currentReactionType !== reactionType 
                    ? post.likes_count || 0 // Giữ nguyên nếu chỉ đổi reaction
                    : (post.likes_count || 0) + 1) // Tăng nếu chưa like
                : Math.max(0, (post.likes_count || 0) - 1), // Giảm nếu unlike
            };
          }
          return post;
        });
      });
      
      return { previousPosts };
    },
    onSuccess: (data: any, variables) => {
      // Invalidate query ngay lập tức để cập nhật reactions_breakdown và các thông tin khác từ server
      queryClient.invalidateQueries({ queryKey: ['posts', activeTab] });
      
      // Luôn invalidate notifications queries khi like thành công (bất kể liked true/false)
      // Vì khi like/unlike, có thể đã tạo hoặc xóa notification
      // Đặc biệt khi update reaction (từ like sang love), notification mới được tạo
      queryClient.invalidateQueries({ queryKey: ['notifications', 'unread-count'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      
      console.log('✅ [Like Post] Invalidated notifications queries');
    },
    onError: (error: any, variables, context) => {
      // Rollback on error
      if (context?.previousPosts) {
        queryClient.setQueryData(['posts', activeTab], context.previousPosts);
      }
      console.error('❌ Error liking post:', error);
      console.error('❌ Error details:', {
        message: error?.message,
        response: error?.response?.data,
        status: error?.response?.status,
        variables,
      });
      Toast.show({
        type: 'error',
        text1: 'Không thể thực hiện thao tác',
        text2: error?.response?.data?.message || error?.message || 'Vui lòng thử lại',
      });
    },
    onSettled: () => {
      // Đã có onSuccess để invalidate ngay lập tức
    },
  });

  const unfollowMutation = useMutation({
    mutationFn: (userId: string) => friendsAPI.unfollow(userId),
    onSuccess: () => {
      Toast.show({
        type: 'success',
        text1: 'Đã bỏ theo dõi',
      });
      refetchFollowing();
    },
    onError: (error: any) => {
      Toast.show({
        type: 'error',
        text1: error?.response?.data?.message || 'Không thể bỏ theo dõi',
      });
    },
  });

  // Handlers cho reaction picker
  const handleLongPressStart = useCallback((postId: string | number, event: any) => {
    // Lấy vị trí của nút like từ event
    if (event?.nativeEvent) {
      const { pageX, pageY } = event.nativeEvent;
      setReactionPickerPosition({ 
        x: pageX, // Vị trí X của touch
        y: pageY  // Vị trí Y của touch
      });
    }
    
    // Hiển thị reaction picker sau 300ms
    longPressTimerRef.current = setTimeout(() => {
      setShowReactionPicker(String(postId));
    }, 300);
  }, []);

  const handleLongPressEnd = useCallback(() => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  }, []);

  const handleReactionSelect = useCallback((postId: string | number, reactionType: string) => {
    setShowReactionPicker(null);
    likePostMutation.mutate({ postId, reactionType });
  }, [likePostMutation]);

  const handleQuickLike = useCallback((postId: string | number) => {
    // Nếu đã like, unlike. Nếu chưa like, like với reaction mặc định
    likePostMutation.mutate({ postId, reactionType: 'like' });
  }, [likePostMutation]);

  // Hàm format số (1K, 2.3K, etc.)
  const formatCount = useCallback((count: number) => {
    if (count < 1000) return count.toString();
    if (count < 1000000) {
      const k = (count / 1000).toFixed(1);
      return k.endsWith('.0') ? `${Math.floor(count / 1000)}K` : `${k}K`;
    }
    const m = (count / 1000000).toFixed(1);
    return m.endsWith('.0') ? `${Math.floor(count / 1000000)}M` : `${m}M`;
  }, []);

  // Hàm lấy icon và color dựa trên reaction type (Facebook-style)
  const getReactionIcon = useCallback((reactionType: string | null | undefined, isLiked: boolean) => {
    // Nếu chưa like, hiển thị icon thumb-up-outline (Facebook style)
    if (!isLiked) {
      return { icon: 'thumb-up-outline', color: colors.textSecondary };
    }
    
    // Nếu đã like nhưng không có reactionType, mặc định là 'like' (thumb-up)
    const type = reactionType || 'like';
    
    const reactionMap: { [key: string]: { icon: string; color: string } } = {
      like: { icon: 'thumb-up', color: '#1877F2' }, // Facebook blue
      love: { icon: 'heart', color: '#F62D5A' },
      care: { icon: 'emoticon-kiss', color: '#FFD700' },
      haha: { icon: 'emoticon-lol', color: '#FFD700' },
      wow: { icon: 'emoticon-excited', color: '#FFD700' },
      sad: { icon: 'emoticon-sad', color: '#FFD700' },
      angry: { icon: 'emoticon-angry', color: '#E74C3C' },
    };
    
    return reactionMap[type] || { icon: 'thumb-up', color: '#1877F2' };
  }, [colors.textSecondary]);

  // Mutation for creating conversation
  const createConversationMutation = useMutation({
    mutationFn: (userId: string) => chatAPI.createConversation(userId),
    onSuccess: (response, userId) => {
      const conversationId = response.conversationId || response.data?.conversationId;
      if (!conversationId) {
        Toast.show({
          type: 'error',
          text1: 'Không thể tạo cuộc trò chuyện',
        });
        return;
      }
      
      // Find user info from search results
      const userInfo = searchResults.find((item: any) => (item.id || item.user_id)?.toString() === userId);
      const userName = userInfo?.full_name || userInfo?.username || 'Người dùng';
      const userAvatarUrl = userInfo?.avatar_url;
      
      // Navigate to ChatDetail
      navigation.dispatch(
        CommonActions.navigate({
          name: 'Chat',
          params: {
            screen: 'ChatDetail',
            params: {
              conversationId: String(conversationId),
              userName: userName,
              userAvatarUrl: userAvatarUrl,
              otherUserId: userId,
              isOnline: false,
            },
          },
        })
      );
      
      // Close search modal
      setShowSearchModal(false);
      setSearchQuery('');
    },
    onError: (error: any) => {
      Toast.show({
        type: 'error',
        text1: error?.response?.data?.message || 'Không thể tạo cuộc trò chuyện',
      });
    },
  });

  const handleVideoPress = (postId: string, videoUrl: string) => {
    // If this video is already playing, pause it
    if (playingVideoId === postId) {
      setPlayingVideoId(null);
      return;
    }
    
    // Set the new playing video ID - PostVideoPlayer will handle playing via isPlaying prop
    setPlayingVideoId(postId);
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
    
    // Xử lý trường hợp scroll về đầu trang - luôn hiện header
    if (currentScrollY <= 50) {
      if (!isHeaderVisible.current) {
        setIsVisible(true);
        isHeaderVisible.current = true;
        // Hiện header với spring animation mượt hơn
        Animated.parallel([
          Animated.spring(headerOpacity, {
            toValue: 1,
            tension: 100,
            friction: 8,
            useNativeDriver: true,
          }),
          Animated.spring(headerTranslateY, {
            toValue: 0,
            tension: 100,
            friction: 8,
            useNativeDriver: true,
          }),
        ]).start();
      }
    } else {
      // Chỉ ẩn/hiện khi scroll đủ lớn để tránh flicker
      if (Math.abs(scrollDifference) > 5) {
        if (scrollDifference > 0 && currentScrollY > 100) {
          // Cuộn xuống - ẩn tab bar và header
          if (isHeaderVisible.current) {
            setIsVisible(false);
            isHeaderVisible.current = false;
            // Ẩn header với spring animation mượt hơn
            Animated.parallel([
              Animated.spring(headerOpacity, {
                toValue: 0,
                tension: 100,
                friction: 8,
                useNativeDriver: true,
              }),
              Animated.spring(headerTranslateY, {
                toValue: -80,
                tension: 100,
                friction: 8,
                useNativeDriver: true,
              }),
            ]).start();
          }
        } else if (scrollDifference < 0) {
          // Cuộn lên - hiện tab bar và header
          if (!isHeaderVisible.current) {
            setIsVisible(true);
            isHeaderVisible.current = true;
            // Hiện header với spring animation mượt hơn
            Animated.parallel([
              Animated.spring(headerOpacity, {
                toValue: 1,
                tension: 100,
                friction: 8,
                useNativeDriver: true,
              }),
              Animated.spring(headerTranslateY, {
                toValue: 0,
                tension: 100,
                friction: 8,
                useNativeDriver: true,
              }),
            ]).start();
          }
        }
      }
    }
    
    lastScrollY.current = currentScrollY;
    scrollY.current = currentScrollY;
  };

  const dynamicStyles = createStyles(colors, isDarkMode);

  // PostVideoPlayer tự quản lý playback dựa trên isPlaying prop
  // Không cần useEffect này nữa vì PostVideoPlayer đã xử lý

  // Callback để scroll đến post khi thu gọn
  const handlePostCollapse = useCallback((postId: string | number) => {
    if (!flatListRef.current || !posts || posts.length === 0) return;
    
    // Tìm index của post trong danh sách
    const postIndex = posts.findIndex((p: any) => 
      String(p.id || p._id || p.post_id || p.postId) === String(postId)
    );
    
    if (postIndex >= 0) {
      // Delay một chút để đảm bảo layout đã cập nhật
      setTimeout(() => {
        try {
          // Scroll đến post với offset để đảm bảo post hiển thị đầy đủ
          flatListRef.current?.scrollToIndex({
            index: postIndex,
            animated: true,
            viewPosition: 0.1, // Scroll để post ở khoảng 10% từ top
          });
        } catch (error) {
          // Fallback: scroll đến offset nếu scrollToIndex thất bại
          console.log('Scroll to index failed, using offset instead:', error);
        }
      }, 150);
    }
  }, [posts]);

  const renderPost = ({ item, index }: { item: any, index: number }) => {
    // Get author info - API returns user fields directly on post object
    const authorName = item.full_name || item.username || 'Unknown';
    const authorAvatar = item.avatar_url || '';
    const authorId = item.user_id || item.user?.id;
    const postTime = item.created_at ? formatTimeAgo(new Date(item.created_at)) : '';
    
    // Get online status - check multiple sources
    const authorIdString = authorId?.toString();
    let isAuthorOnline = false;
    if (authorIdString) {
      // Check from following list first (most reliable)
      const followingUser = followingList.find((f: any) => {
        const fId = f.following_id || f.id || f.user_id;
        return String(fId) === authorIdString;
      });
      if (followingUser?.status === 'online') {
        isAuthorOnline = true;
      } else if (item.status === 'online' || item.user?.status === 'online') {
        isAuthorOnline = true;
      }
    }
    
    // Get privacy setting - default to 'public' if not specified
    const privacy = item.privacy || item.visibility || 'public';

    // Get views count - check multiple possible field names
    const viewsCount = item.views_count || item.view_count || item.views || item.post_views || 0;

    // Check if user is following this author
    const isFollowing = authorId && followingIds.has(authorId);
    const isOwnPost = authorId === user?.id;
    const showFollowButton = !isOwnPost && !isFollowing && activeTab === 'all';
    
    // Get privacy icon based on privacy setting
    const getPrivacyIcon = () => {
      switch (privacy) {
        case 'friends':
          return 'account-multiple-outline';
        case 'private':
          return 'lock-outline';
        case 'public':
        default:
          return 'earth';
      }
    };

    // Format images - show 2 side by side if available
    // Check for image_url (single image) or images (array)
    // IMPORTANT: Exclude images if this post has a video (videos should not show images)
    const postImages = [];
    let hasVideo = false;
    
    // First, check for video - if video exists, don't show images
    // Get video URL - check for videoUrl, video_url, or videos field
    let postVideoUrl: string | undefined = undefined;
    // Check multiple possible field names for video
    if (item.videoUrl) {
      postVideoUrl = getVideoURL(item.videoUrl);
      hasVideo = !!postVideoUrl;
    } else if (item.video_url) {
      postVideoUrl = getVideoURL(item.video_url);
      hasVideo = !!postVideoUrl;
    } else if (item.videos) {
      const videos = Array.isArray(item.videos) ? item.videos : [item.videos];
      if (videos.length > 0 && videos[0]) {
        postVideoUrl = getVideoURL(videos[0]);
        hasVideo = !!postVideoUrl;
      }
    } else if (item.video) {
      postVideoUrl = getVideoURL(item.video);
      hasVideo = !!postVideoUrl;
    } else if (item.media_type === 'video' && item.media_url) {
      postVideoUrl = getVideoURL(item.media_url);
      hasVideo = !!postVideoUrl;
    }
    
    // Debug: Log video detection with more details
    if (postVideoUrl) {
      console.log('🎥 Video detected for post:', item.id, 'URL:', postVideoUrl);
      console.log('🎥 Video fields:', {
        videoUrl: item.videoUrl,
        video_url: item.video_url,
        videos: item.videos,
        video: item.video,
        media_type: item.media_type,
        media_url: item.media_url,
      });
    } else {
      // Debug: Log when video is NOT detected to help troubleshoot
      if (item.videoUrl || item.video_url || item.videos || item.video || item.media_type === 'video') {
        console.log('⚠️ Video field exists but URL is empty for post:', item.id, {
          videoUrl: item.videoUrl,
          video_url: item.video_url,
          videos: item.videos,
          video: item.video,
          media_type: item.media_type,
          media_url: item.media_url,
        });
      }
    }
    
    // Only add images if there's no video
    if (!hasVideo) {
      if (item.images && Array.isArray(item.images)) {
        postImages.push(...item.images);
      } else if (item.image_url) {
        postImages.push(item.image_url);
      }
    }
    
    // Get video thumbnail
    const videoThumbnail = item.thumbnailUrl || 
                          item.thumbnail_url ||
                          item.video_thumbnail ||
                          (item.images && Array.isArray(item.images) && item.images.length > 0 ? item.images[0] : undefined) || 
                          item.image_url || 
                          undefined;
    
    // Get video aspect ratio if available
    const videoAspectRatio = item.video_aspect_ratio || 
                            item.aspect_ratio || 
                            (item.video_width && item.video_height ? item.video_width / item.video_height : undefined) ||
                            undefined;
    
    return (
      <View style={dynamicStyles.postContainer}>
        {/* Social-app-main style: row layout with avatar left, content right */}
        <View style={dynamicStyles.postLayout}>
          <View style={dynamicStyles.layoutAvi}>
            <TouchableOpacity
              style={dynamicStyles.avatarContainer}
              onPress={() => {
                if (authorId && authorId !== user?.id) {
                  navigation.navigate('OtherUserProfile' as never, { userId: authorId.toString() } as never);
                }
              }}
              activeOpacity={0.7}
            >
              {authorAvatar ? (
                <Image
                  source={{ uri: getAvatarURL(authorAvatar) }}
                  style={dynamicStyles.authorAvatar}
                />
              ) : (
                <Avatar.Text
                  size={42}
                  label={getInitials(authorName)}
                  style={dynamicStyles.authorAvatar}
                />
              )}
              {/* Online status indicator - chấm xanh */}
              {isAuthorOnline && (
                <View style={[
                  dynamicStyles.onlineIndicator,
                  { borderColor: colors.background || colors.surface }
                ]} />
              )}
              {showFollowButton && (
                <TouchableOpacity
                  style={dynamicStyles.followButton}
                  onPress={(e) => {
                    e.stopPropagation?.();
                    if (authorId) {
                      handleFollow(authorId);
                    }
                  }}
                  activeOpacity={0.7}
                >
                  <MaterialCommunityIcons name="plus" size={10} color={isDarkMode ? '#FFFFFF' : '#000000'} />
                </TouchableOpacity>
              )}
            </TouchableOpacity>
          </View>
          <View style={dynamicStyles.layoutContent}>
            {/* Post Meta: Author name, time, privacy */}
            <View style={dynamicStyles.postHeader}>
              <TouchableOpacity
                style={dynamicStyles.authorSection}
                onPress={() => {
                  if (authorId && authorId !== user?.id) {
                    navigation.navigate('OtherUserProfile' as never, { userId: authorId.toString() } as never);
                  }
                }}
                activeOpacity={0.7}
              >
                <Text style={[dynamicStyles.authorName, { color: colors.text }]}>{authorName}</Text>
                {postTime && (
                  <View style={dynamicStyles.postTimeRow}>
                    <Text style={[dynamicStyles.postTime, { color: colors.textSecondary }]}>· {postTime}</Text>
                    <MaterialCommunityIcons
                      name={getPrivacyIcon()}
                      size={12}
                      color={colors.textSecondary}
                      style={dynamicStyles.privacyIcon}
                    />
                  </View>
                )}
              </TouchableOpacity>
              <TouchableOpacity style={dynamicStyles.postMoreButton}>
                <MaterialCommunityIcons name="dots-horizontal" size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* Post Content - Social-app-main style */}
            {item.content && <PostContent 
              content={item.content}
              styles={dynamicStyles}
              colors={colors}
              countLines={countLines}
              postId={item.id || item._id || item.post_id || item.postId}
              onCollapse={handlePostCollapse}
            />}

            {/* Post Video - Render BEFORE images */}
            {postVideoUrl ? (
              <View style={dynamicStyles.videoContainer}>
                {(() => {
                  // Debug: Log before rendering video
                  console.log('🎬 Rendering PostVideoPlayer for post:', item.id, {
                    postVideoUrl,
                    videoThumbnail,
                    videoAspectRatio,
                    postId: String(item.id || item._id || item.post_id || item.postId || 'unknown'),
                    isPlaying: playingVideoId === String(item.id || item._id || item.post_id || item.postId),
                  });
                  return (
                    <PostVideoPlayer
                      videoUrl={postVideoUrl}
                      thumbnailUrl={videoThumbnail}
                      postId={String(item.id || item._id || item.post_id || item.postId || 'unknown')}
                      isPlaying={playingVideoId === String(item.id || item._id || item.post_id || item.postId)}
                      onPress={() => {
                        const postId = String(item.id || item._id || item.post_id || item.postId);
                        if (postId && postVideoUrl) {
                          console.log('🎬 Video pressed for post:', postId);
                          handleVideoPress(postId, postVideoUrl);
                        }
                      }}
                      aspectRatio={videoAspectRatio}
                      onPlaybackStatusUpdate={(status) => {
                        if (status.isLoaded) {
                          if (status.didJustFinish) {
                            setPlayingVideoId(null);
                          } else if (!status.isLoaded && 'error' in status) {
                            const errorStatus = status as any;
                            if (errorStatus.error) {
                              console.error('Video playback error:', errorStatus.error);
                              setPlayingVideoId(null);
                            }
                          }
                        }
                      }}
                    />
                  );
                })()}
              </View>
            ) : (
              // Debug: Log when video should render but doesn't
              postVideoUrl ? console.log('⚠️ postVideoUrl exists but not rendering:', postVideoUrl) : null
            )}

            {/* Post Images */}
            {postImages.length > 0 && (
              <View style={dynamicStyles.imagesContainer}>
                <PostImagesCarousel
                  images={postImages}
                  onPressImage={(idx) => {
                    // Open full screen image viewer với đầy đủ thông tin bài viết
                    setImageViewerImages(postImages);
                    setImageViewerIndex(idx);
                    setImageViewerPostData({
                      id: item.id,
                      likes: item.likes_count || 0,
                      comments: item.comments_count || 0,
                      isLiked: item.isLiked || false,
                      // Thông tin bài viết
                      authorName: authorName,
                      authorAvatar: authorAvatar,
                      authorId: authorId,
                      content: item.content,
                      postTime: postTime,
                      privacy: privacy,
                      isAuthorOnline: isAuthorOnline,
                      onLike: () => {
                        const postId = item.id || item._id || item.post_id || item.postId;
                        if (postId) {
                          likePostMutation.mutate({ postId });
                        }
                      },
                      onComment: () => {
                        // Navigate to comments screen
                        const pid = item?.id || item?._id || item?.post_id || item?.postId || null;
                        if (pid) {
                          navigation.navigate('Comments' as never, {
                            postId: pid,
                            postData: item,
                          } as never);
                        }
                        setShowImageViewer(false);
                      },
                      onRepost: () => {
                        // Handle repost
                        console.log('Repost post:', item.id);
                      },
                      onShare: () => {
                        // Handle share
                        console.log('Share post:', item.id);
                      },
                    });
                    setShowImageViewer(true);
                  }}
                />
              </View>
            )}

            {/* Reactions Count và Views - Hiển thị trên cùng một hàng */}
            {(() => {
              const likesCount = item.likes_count || 0;
              const commentsCount = item.comments_count || 0;
              // Kiểm tra nhiều tên field có thể cho views count
              const viewsCount = item.views_count || item.view_count || item.views || item.post_views || 0;
              
              // Hiển thị nếu có ít nhất một trong: likes, comments, hoặc views
              return (likesCount > 0 || commentsCount > 0 || viewsCount > 0) ? (
                <View style={[dynamicStyles.reactionsCountContainer, { borderTopColor: colors.border }]}>
              {/* Bên trái: Icon reactions và số likes/comments */}
              <View style={dynamicStyles.reactionsCountLeft}>
                {likesCount > 0 && (
                  <TouchableOpacity 
                    style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}
                    activeOpacity={0.7}
                  >
                    <View style={dynamicStyles.reactionIconsContainer}>
                      {(() => {
                        // Lấy reactions breakdown từ API (từ tất cả người dùng)
                        const reactionsBreakdown = item.reactions_breakdown || {};
                        const reactionOrder = ['like', 'love', 'haha', 'wow', 'sad', 'angry', 'care'];
                        const displayedReactions: Array<{ type: string; icon: string; color: string; count: number }> = [];
                        
                        // Thêm tất cả các reactions có count > 0 với số lượng
                        reactionOrder.forEach((reactionType) => {
                          const count = reactionsBreakdown[reactionType] || 0;
                          if (count > 0) {
                            const reactionInfo = getReactionIcon(reactionType, true);
                            displayedReactions.push({
                              type: reactionType,
                              icon: reactionInfo.icon,
                              color: reactionInfo.color,
                              count: count,
                            });
                          }
                        });
                        
                        // Sắp xếp theo số lượng (count cao nhất trước) để hiển thị reactions phổ biến nhất
                        displayedReactions.sort((a, b) => b.count - a.count);
                        
                        // Hiển thị tất cả các reactions có count > 0 (giống Facebook) - tối đa 4 icon để không quá dài
                        return displayedReactions.slice(0, 4).map((reaction, index) => (
                          <MaterialCommunityIcons
                            key={reaction.type}
                            name={reaction.icon as any}
                            size={18}
                            color={reaction.color}
                            style={{ 
                              marginLeft: index > 0 ? -4 : 0, // Overlap icons
                              zIndex: 3 - index, // Stack order
                            }}
                          />
                        ));
                      })()}
                    </View>
                    <Text style={[dynamicStyles.reactionsCountText, { color: colors.textSecondary }]}>
                      {formatCount(likesCount)}
                    </Text>
                  </TouchableOpacity>
                )}
                {/* Hiển thị số bình luận */}
                {commentsCount > 0 && (
                  <TouchableOpacity 
                    style={{ flexDirection: 'row', alignItems: 'center', marginLeft: 16 }}
                    activeOpacity={0.7}
                    onPress={() => {
                      const pid = item?.id || item?._id || item?.post_id || item?.postId || null;
                      if (pid) {
                        navigation.navigate('Comments' as never, {
                          postId: pid,
                          postData: item,
                        } as never);
                      }
                    }}
                  >
                    <Text style={[dynamicStyles.reactionsCountText, { color: colors.textSecondary }]}>
                      {formatCount(commentsCount)} bình luận
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
              {/* Bên phải: Số người đã xem */}
              {viewsCount > 0 && (
                <TouchableOpacity 
                  style={dynamicStyles.reactionsCountRight}
                  activeOpacity={0.7}
                >
                  <Text style={[dynamicStyles.reactionsCountText, { color: colors.textSecondary }]}>
                    {formatCount(viewsCount)} người đã xem
                  </Text>
                  </TouchableOpacity>
                )}
              </View>
            ) : null;
          })()}

            {/* Post Actions */}
            <View style={[dynamicStyles.postActions, { borderTopColor: colors.border }]}>
          <Pressable
            ref={(ref) => {
              const postId = item.id || item._id || item.post_id || item.postId;
              if (ref && postId) {
                likeButtonRefs.current[String(postId)] = ref;
              }
            }}
            style={dynamicStyles.actionButton}
            onLayout={(event) => {
              // Lưu layout để có thể tính toán vị trí sau
              const postId = item.id || item._id || item.post_id || item.postId;
              if (postId) {
                const { x, y, width, height } = event.nativeEvent.layout;
                (likeButtonRefs.current[String(postId)] as any)._layout = { x, y, width, height };
              }
            }}
            onPress={() => {
              const postId = item.id || item._id || item.post_id || item.postId;
              if (postId) {
                // Nếu reaction picker đang hiện, đóng nó
                if (showReactionPicker === String(postId)) {
                  setShowReactionPicker(null);
                } else {
                  // Like/unlike nhanh
                  handleQuickLike(postId);
                }
              }
            }}
            onLongPress={(event) => {
              const postId = item.id || item._id || item.post_id || item.postId;
              if (postId) {
                // Lấy vị trí từ ref
                const ref = likeButtonRefs.current[String(postId)];
                if (ref && ref.measure) {
                  ref.measure((x: number, y: number, width: number, height: number, pageX: number, pageY: number) => {
                    setReactionPickerPosition({ 
                      x: pageX + width / 2, // Center của nút like
                      y: pageY 
                    });
                    // Hiển thị reaction picker sau khi có vị trí
                    setTimeout(() => {
                      setShowReactionPicker(String(postId));
                    }, 50);
                  });
                } else {
                  handleLongPressStart(postId, event);
                }
              }
            }}
            onPressOut={handleLongPressEnd}
            disabled={likePostMutation.isPending}
          >
            {(() => {
              const reactionInfo = getReactionIcon(item.reactionType, item.isLiked);
              const likeColor = item.isLiked ? '#1877F2' : colors.textSecondary;
              return (
                <>
                  <MaterialCommunityIcons
                    name={reactionInfo.icon as any}
                    size={18}
                    color={likeColor}
                  />
                  <Text style={[dynamicStyles.actionText, { color: likeColor }]}>
                    Thích
                  </Text>
                </>
              );
            })()}
          </Pressable>
          

          <TouchableOpacity
            style={dynamicStyles.actionButton}
            onPress={() => {
              const pid = item?.id || item?._id || item?.post_id || item?.postId || null;
              if (pid) {
                navigation.navigate('Comments' as never, {
                  postId: pid,
                  postData: item,
                } as never);
              }
            }}
          >
            <MaterialCommunityIcons name="message-outline" size={18} color={colors.textSecondary} />
            <Text style={[dynamicStyles.actionText, { color: colors.textSecondary }]}>
              Bình luận
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={dynamicStyles.actionButton}>
            <MaterialCommunityIcons name="share-outline" size={18} color={colors.textSecondary} />
            <Text style={[dynamicStyles.actionText, { color: colors.textSecondary }]}>
              Chia sẻ
            </Text>
          </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={dynamicStyles.container} edges={['top']}>
      <Animated.View
        style={[
          { flex: 1 },
          {
            opacity: fadeAnim,
          }
        ]}
      >
        {/* Threads-style Minimal Header - Ẩn/hiện khi cuộn */}
        <Animated.View 
        style={[
          dynamicStyles.headerBar,
          {
            opacity: headerOpacity,
            transform: [{ translateY: headerTranslateY }],
          },
        ]}
      >
        {activeTab === 'following' ? (
          <>
            <TouchableOpacity 
              style={dynamicStyles.headerLeftWithText}
              onPress={() => setActiveTab('all')}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons name="arrow-left" size={24} color={colors.text} />
              <Text style={[dynamicStyles.backButtonText, { color: colors.text }]}>Quay lại</Text>
            </TouchableOpacity>
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={[dynamicStyles.headerTitle, { color: colors.text }]}>Đang theo dõi</Text>
            </View>
            <View style={dynamicStyles.headerRight} />
          </>
        ) : (
          <>
            <TouchableOpacity 
              style={dynamicStyles.headerLeft}
              onPress={() => {
                setShowMenu(true);
              }}
              activeOpacity={0.7}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <MaterialCommunityIcons name="menu" size={28} color={colors.text} />
            </TouchableOpacity>
            <View style={dynamicStyles.logoSection}>
              <Image
                source={require('../../../assets/icon.png')}
                style={dynamicStyles.logoImage}
              />
            </View>
            <View style={dynamicStyles.headerRight}>
              <TouchableOpacity 
                style={dynamicStyles.headerIconButton} 
                activeOpacity={0.7}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                onPress={() => setShowSearchModal(true)}
              >
                <MaterialCommunityIcons name="magnify" size={26} color={colors.text} />
              </TouchableOpacity>
              <TouchableOpacity 
                style={dynamicStyles.headerIconButton}
                onPress={handleNavigateToChat}
                activeOpacity={0.7}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <View style={dynamicStyles.messageIconContainer}>
                  <MaterialCommunityIcons name="facebook-messenger" size={26} color={colors.text} />
                  {unreadCount > 0 && (
                    <View style={dynamicStyles.messageBadge}>
                      <Text style={dynamicStyles.messageBadgeText}>
                        {unreadCount > 99 ? '99+' : unreadCount}
                      </Text>
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            </View>
          </>
        )}
      </Animated.View>

      {/* Posts List */}
      {isLoading && !refreshing ? (
        <View style={[dynamicStyles.emptyContainer, { paddingTop: 100 }]}>
          <ActivityIndicator size="large" color={colors.primary || '#0084ff'} />
          <Text style={[dynamicStyles.emptyText, { color: colors.textSecondary, marginTop: 16 }]}>
            Đang tải bài viết...
          </Text>
        </View>
      ) : isError ? (
        <View style={[dynamicStyles.emptyContainer, { paddingTop: 100 }]}>
          <MaterialCommunityIcons name="alert-circle" size={48} color={colors.error || '#e74c3c'} />
          <Text style={[dynamicStyles.emptyText, { color: colors.error || '#e74c3c', marginTop: 16 }]}>
            Không thể tải bài viết
          </Text>
          <Text style={[dynamicStyles.emptyText, { color: colors.textSecondary, marginTop: 8, fontSize: 13 }]}>
            {error instanceof Error ? error.message : 'Đã xảy ra lỗi'}
          </Text>
          <TouchableOpacity
            onPress={() => refetch()}
            style={{
              marginTop: 16,
              paddingHorizontal: 24,
              paddingVertical: 12,
              backgroundColor: colors.primary || '#0084ff',
              borderRadius: 8,
            }}
          >
            <Text style={{ color: '#FFFFFF', fontWeight: '600' }}>Thử lại</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={posts}
          keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
          renderItem={renderPost}
          ItemSeparatorComponent={() => null}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={colors.primary || '#0084ff'}
              colors={[colors.primary || '#0084ff']}
              progressBackgroundColor={colors.surface || '#FFFFFF'}
              title={refreshing ? "Đang làm mới..." : "Kéo để làm mới"}
              titleColor={colors.textSecondary || '#666666'}
              progressViewOffset={Platform.OS === 'android' ? 20 : 0}
            />
          }
          onScroll={handleScroll}
          scrollEventThrottle={16}
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={viewabilityConfig}
          onScrollToIndexFailed={(info) => {
            // Xử lý khi scroll to index thất bại
            const wait = new Promise(resolve => setTimeout(resolve, 500));
            wait.then(() => {
              flatListRef.current?.scrollToIndex({ 
                index: info.index, 
                animated: true,
                viewPosition: 0.1 
              });
            });
          }}
          contentContainerStyle={dynamicStyles.listContent}
          ListHeaderComponent={
            activeTab === 'all' ? (
              <View>
                <TouchableOpacity
                  style={dynamicStyles.newPostSection}
                  onPress={() => navigation.navigate('CreatePost' as never)}
                  activeOpacity={0.7}
                >
                  <View style={dynamicStyles.newPostContent}>
                    <View style={dynamicStyles.newPostAvatarContainer}>
                      {user?.avatar_url ? (
                        <Image
                          source={{ uri: getAvatarURL(user.avatar_url) }}
                          style={dynamicStyles.newPostAvatar}
                        />
                      ) : (
                        <Avatar.Text
                          size={40}
                          label={getInitials(user?.full_name || user?.username || 'U')}
                          style={dynamicStyles.newPostAvatar}
                        />
                      )}
                    </View>
                    <View style={[dynamicStyles.newPostTextContainer, { backgroundColor: colors.border || '#E4E6EB' }]}>
                      <Text style={[dynamicStyles.newPostPrompt, { color: colors.textSecondary }]}>
                        Bạn đang nghĩ gì?
                      </Text>
                    </View>
                    <TouchableOpacity
                      style={dynamicStyles.newPostIconButton}
                      onPress={() => navigation.navigate('CreatePost' as never)}
                      activeOpacity={0.7}
                    >
                      <MaterialCommunityIcons 
                        name="image-multiple-outline" 
                        size={24} 
                        color={colors.primary || '#1877F2'} 
                      />
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
                <StoriesSection
                  stories={[]} // TODO: Load stories from API
                  onPressStory={(story) => {
                    // TODO: Navigate to story viewer
                    console.log('Press story:', story);
                  }}
                  onCreateStory={() => {
                    console.log('Navigating to CreateStory');
                    try {
                      navigation.navigate('CreateStory' as never);
                    } catch (error) {
                      console.error('Navigation error:', error);
                    }
                  }}
                />
              </View>
            ) : null
          }
          ListEmptyComponent={
            <View style={dynamicStyles.emptyContainer}>
              <MaterialCommunityIcons name="newspaper-variant-outline" size={48} color={colors.textSecondary} />
              <Text style={[dynamicStyles.emptyText, { color: colors.textSecondary, marginTop: 16 }]}>
                Chưa có bài viết nào
              </Text>
              <Text style={[dynamicStyles.emptyText, { color: colors.textSecondary, marginTop: 8, fontSize: 13 }]}>
                Kéo xuống để làm mới
              </Text>
            </View>
          }
        />
      )}


      {/* Menu Modal */}
      <Modal
        visible={showMenu}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowMenu(false)}
        statusBarTranslucent={true}
      >
        <Pressable
          style={dynamicStyles.modalOverlay}
          onPress={() => setShowMenu(false)}
        >
          <Pressable 
            style={[dynamicStyles.menuContainer, { backgroundColor: colors.surface }]}
            onPress={() => {}} // Prevent closing when pressing on menu content
          >
            <View style={[dynamicStyles.menuHandle, { backgroundColor: colors.border }]} />
            <View style={dynamicStyles.menuContent}>
              <TouchableOpacity
                style={[
                  dynamicStyles.menuItem,
                  activeTab === 'all' && { backgroundColor: colors.primary + '20' },
                  { borderBottomColor: colors.border },
                  isChangingTab && { opacity: 0.6 }
                ]}
                onPress={() => {
                  if (isChangingTab) return;
                  if (activeTab === 'all') {
                    setShowMenu(false);
                    return;
                  }
                  setIsChangingTab(true);
                  setActiveTab('all');
                  setShowMenu(false);
                  // Reset flag after a short delay
                  setTimeout(() => {
                    setIsChangingTab(false);
                  }, 300);
                }}
                activeOpacity={0.7}
                disabled={isChangingTab}
              >
                <Text style={[dynamicStyles.menuItemText, { 
                  color: activeTab === 'all' ? colors.primary : colors.text,
                  fontWeight: activeTab === 'all' ? '600' : '400'
                }]}>
                  Tất cả
                </Text>
                {activeTab === 'all' && (
                  <MaterialCommunityIcons name="check" size={20} color={colors.primary} />
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  dynamicStyles.menuItem,
                  activeTab === 'following' && { backgroundColor: colors.primary + '20' },
                  isChangingTab && { opacity: 0.6 }
                ]}
                onPress={() => {
                  if (isChangingTab) return;
                  if (activeTab === 'following') {
                    setShowMenu(false);
                    return;
                  }
                  setIsChangingTab(true);
                  setActiveTab('following');
                  setShowMenu(false);
                  // Reset flag after a short delay
                  setTimeout(() => {
                    setIsChangingTab(false);
                  }, 300);
                }}
                activeOpacity={0.7}
                disabled={isChangingTab}
              >
                <Text style={[dynamicStyles.menuItemText, { 
                  color: activeTab === 'following' ? colors.primary : colors.text,
                  fontWeight: activeTab === 'following' ? '600' : '400'
                }]}>
                  Đang theo dõi
                </Text>
                {activeTab === 'following' && (
                  <MaterialCommunityIcons name="check" size={20} color={colors.primary} />
                )}
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Search Modal */}
      <Modal
        visible={showSearchModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => {
          setShowSearchModal(false);
          setSearchQuery('');
        }}
      >
        <Pressable 
          style={dynamicStyles.searchModalOverlay}
          onPress={() => {
            setShowSearchModal(false);
            setSearchQuery('');
          }}
        >
          <Pressable 
            style={[
              dynamicStyles.searchModalContainer,
              { backgroundColor: colors.background }
            ]}
            onPress={(e) => e.stopPropagation()}
          >
            <SafeAreaView edges={['top']} style={{ flex: 1 }}>
              {/* Search Header */}
              <View style={[
                dynamicStyles.searchModalHeader,
                { borderBottomColor: colors.border || '#E0E0E0' }
              ]}>
                <View style={dynamicStyles.searchInputContainer}>
                  <Searchbar
                    placeholder="Tìm kiếm email hoặc tên người dùng..."
                    onChangeText={setSearchQuery}
                    value={searchQuery}
                    style={[
                      { backgroundColor: isDarkMode ? '#2a2a2b' : '#f0f0f0' },
                      { elevation: 0 }
                    ]}
                    inputStyle={{ color: colors.text }}
                    iconColor={colors.textSecondary}
                    placeholderTextColor={colors.textSecondary}
                    autoFocus={true}
                  />
                </View>
                <TouchableOpacity
                  onPress={() => {
                    setShowSearchModal(false);
                    setSearchQuery('');
                  }}
                  style={{ padding: 8 }}
                >
                  <Text style={{ color: colors.primary || '#0084ff', fontSize: 16, fontWeight: '600' }}>
                    Hủy
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Search Results */}
              {isSearching ? (
                <View style={dynamicStyles.searchEmptyContainer}>
                  <ActivityIndicator size="large" color={colors.primary || '#0084ff'} />
                  <Text style={[dynamicStyles.searchEmptyText, { color: colors.textSecondary }]}>
                    Đang tìm kiếm...
                  </Text>
                </View>
              ) : searchQuery.trim().length === 0 ? (
                <View style={dynamicStyles.searchEmptyContainer}>
                  <MaterialCommunityIcons 
                    name="magnify" 
                    size={64} 
                    color={colors.textSecondary || '#999'} 
                  />
                  <Text style={[dynamicStyles.searchEmptyText, { color: colors.textSecondary }]}>
                    Nhập email hoặc tên người dùng để tìm kiếm
                  </Text>
                </View>
              ) : searchResults.length === 0 ? (
                <View style={dynamicStyles.searchEmptyContainer}>
                  <MaterialCommunityIcons 
                    name="account-search-outline" 
                    size={64} 
                    color={colors.textSecondary || '#999'} 
                  />
                  <Text style={[dynamicStyles.searchEmptyText, { color: colors.textSecondary }]}>
                    Không tìm thấy người dùng
                  </Text>
                </View>
              ) : (
                <FlatList
                  data={searchResults}
                  keyExtractor={(item) => item.id?.toString() || item.user_id?.toString() || Math.random().toString()}
                  renderItem={({ item }) => {
                    const userId = item.id || item.user_id;
                    const userIdString = userId?.toString();
                    const userName = item.full_name || item.username || 'Người dùng';
                    const userEmail = item.email || '';
                    const userAvatar = item.avatar_url;
                    const isFollowingUser = userIdString && followingIds.has(userIdString);
                    const isCurrentUser = userIdString === user?.id?.toString();
                    
                    return (
                      <View
                        style={[
                          dynamicStyles.searchResultItem,
                          { borderBottomColor: colors.border || '#E0E0E0' }
                        ]}
                      >
                        <TouchableOpacity
                          style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}
                          onPress={() => {
                            setShowSearchModal(false);
                            setSearchQuery('');
                            // Navigate to user profile
                            navigation.navigate('OtherUserProfile' as never, { 
                              userId: userIdString 
                            } as never);
                          }}
                          activeOpacity={0.7}
                        >
                          <View style={dynamicStyles.searchResultAvatar}>
                            {userAvatar ? (
                              <Avatar.Image
                                size={50}
                                source={{ uri: getAvatarURL(userAvatar) }}
                              />
                            ) : (
                              <Avatar.Text
                                size={50}
                                label={getInitials(userName)}
                                style={{ backgroundColor: colors.primary || '#0084ff' }}
                              />
                            )}
                          </View>
                          <View style={dynamicStyles.searchResultInfo}>
                            <Text style={[
                              dynamicStyles.searchResultName,
                              { color: colors.text }
                            ]}>
                              {userName}
                            </Text>
                            {userEmail && (
                              <Text style={[
                                dynamicStyles.searchResultEmail,
                                { color: colors.textSecondary }
                              ]}>
                                {userEmail}
                              </Text>
                            )}
                            {item.username && item.username !== userName && (
                              <Text style={[
                                dynamicStyles.searchResultEmail,
                                { color: colors.textSecondary }
                              ]}>
                                @{item.username}
                              </Text>
                            )}
                          </View>
                        </TouchableOpacity>
                        
                        {/* Action Buttons */}
                        {!isCurrentUser && (
                          <View style={dynamicStyles.searchResultActions}>
                            {/* Message Button */}
                            <TouchableOpacity
                              style={[
                                dynamicStyles.searchResultButton,
                                {
                                  backgroundColor: '#0084ff',
                                  borderColor: '#0084ff',
                                  borderWidth: 0,
                                }
                              ]}
                              onPress={() => {
                                if (userIdString) {
                                  createConversationMutation.mutate(userIdString);
                                }
                              }}
                              disabled={createConversationMutation.isPending}
                              activeOpacity={0.8}
                            >
                              <Text style={[
                                dynamicStyles.searchResultButtonText,
                                { 
                                  color: '#FFFFFF'
                                }
                              ]}>
                                Nhắn tin
                              </Text>
                            </TouchableOpacity>
                            
                            {/* Follow/Unfollow Button */}
                            <TouchableOpacity
                              style={[
                                dynamicStyles.searchResultButton,
                                {
                                  backgroundColor: isFollowingUser
                                    ? (isDarkMode ? '#1a1a1a' : '#f0f0f0')
                                    : '#0084ff',
                                  borderColor: isFollowingUser
                                    ? (colors.border || (isDarkMode ? '#333333' : '#E0E0E0'))
                                    : '#0084ff',
                                  borderWidth: 1,
                                }
                              ]}
                              onPress={() => {
                                if (!userIdString) return;
                                if (isFollowingUser) {
                                  unfollowMutation.mutate(userIdString);
                                } else {
                                  followMutation.mutate(userIdString);
                                }
                              }}
                              disabled={followMutation.isPending || unfollowMutation.isPending}
                              activeOpacity={0.8}
                            >
                              <Text style={[
                                dynamicStyles.searchResultButtonText,
                                {
                                  color: isFollowingUser
                                    ? (colors.text || (isDarkMode ? '#FFFFFF' : '#333333'))
                                    : '#FFFFFF'
                                }
                              ]}>
                                {isFollowingUser ? 'Đang theo dõi' : 'Theo dõi'}
                              </Text>
                            </TouchableOpacity>
                          </View>
                        )}
                      </View>
                    );
                  }}
                  contentContainerStyle={{ paddingBottom: 20 }}
                />
              )}
            </SafeAreaView>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Full Screen Image Viewer */}
      <FullScreenImageViewer
        visible={showImageViewer}
        images={imageViewerImages}
        initialIndex={imageViewerIndex}
        onClose={() => setShowImageViewer(false)}
        postData={imageViewerPostData}
      />
      </Animated.View>
      
      {/* Splash Screen khi chuyển sang Chat (giống Messenger) */}
      {showSplashScreen && (
        <Modal
          visible={showSplashScreen}
          transparent={true}
          animationType="none"
          statusBarTranslucent={true}
        >
          <Animated.View
            style={{
              flex: 1,
              opacity: splashOpacity,
            }}
          >
            <SplashScreen />rr
          </Animated.View>
        </Modal>
      )}

      {/* Reaction Picker - Hiển thị khi long press nút like */}
      <ReactionPicker
        visible={!!showReactionPicker}
        onSelect={(reactionType) => {
          if (showReactionPicker) {
            handleReactionSelect(showReactionPicker, reactionType);
          }
        }}
        onClose={() => setShowReactionPicker(null)}
        position={reactionPickerPosition}
      />
    </SafeAreaView>
  );
};

export default PostsListScreen;
