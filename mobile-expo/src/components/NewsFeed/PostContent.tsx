import React from 'react';
import { View, Text, Pressable, LayoutAnimation, Linking, StyleSheet, TextStyle } from 'react-native';
import { ShowMoreTextButton, MAX_POST_LINES } from './ShowMoreTextButton';
import { parseTextWithUrls } from '../../utils/textUtils';
import { useTheme } from '../../contexts/ThemeContext';

interface PostContentProps {
  content: string;
  postId?: string | number;
  onCollapse?: (postId: string | number) => void;
  // Optional: Override styles nếu cần customize
  style?: TextStyle;
  textStyle?: TextStyle;
}

/**
 * PostContent Component - Social-app-main style
 * 
 * Displays post content with support for:
 * - Text truncation with "Xem thêm" / "Thu gọn" button
 * - URL parsing and clickable links
 * - Hashtag parsing (#hashtag)
 * - Mention parsing (@username)
 * - Auto-expand for short text
 * 
 * @param content - The post content text
 * @param styles - Style object containing postContentWrapper and postContent styles
 * @param colors - Color object containing text color
 * @param countLines - Function to count lines in text
 * @param postId - Optional post ID for collapse callback
 * @param onCollapse - Optional callback when text is collapsed
 */
const PostContent = React.memo<PostContentProps>(({ 
  content, 
  postId,
  onCollapse,
  style,
  textStyle
}) => {
  const { colors } = useTheme();
  
  // Helper function to count lines in text (moved from parent)
  const countLines = React.useCallback((text: string | undefined): number => {
    if (!text) return 0;
    // Count newlines - same as social-app-main: str.match(/\n/g)?.length ?? 0
    const matches = text.match(/\n/g);
    return matches ? matches.length : 0;
  }, []);
  
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
  
  // Default styles - component tự quản lý styles
  const defaultTextStyle: TextStyle = {
    fontSize: 16,
    fontWeight: '400',
    lineHeight: 22,
    letterSpacing: -0.2,
    ...textStyle,
  };
  
  const defaultWrapperStyle = {
    marginBottom: 8,
    ...style,
  };
  
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
  
  // Parse hashtags và mentions
  const parseHashtagsAndMentions = React.useCallback((text: string): Array<{text: string, type: 'text' | 'hashtag' | 'mention', start: number, end: number}> => {
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
  }, []);
  
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

    // Merge URL parts with hashtag/mention parts
    const renderRichText = () => {
      if (parts.length === 1 && parts[0].type === 'text') {
        // No URLs, but check for hashtags/mentions
        const richParts = parseHashtagsAndMentions(content);
        
        if (richParts.length === 1 && richParts[0].type === 'text') {
          // Plain text only
          return (
            <Text
              style={[defaultTextStyle, { color: colors.text }]}
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
            style={[defaultTextStyle, { color: colors.text }]}
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
                      defaultTextStyle,
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
                      defaultTextStyle,
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
          style={[defaultTextStyle, { color: colors.text }]}
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
                    defaultTextStyle,
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
                    defaultTextStyle,
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
  }, [content, colors.text, shouldLimitLines, onTextLayout, defaultTextStyle, parseHashtagsAndMentions]);

  return (
    <View style={defaultWrapperStyle}>
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
            style={defaultTextStyle}
            isExpanded={false}
          />
        </View>
      )}
      {shouldShowLess && (
        <View style={{ marginTop: 4 }}>
          <ShowMoreTextButton
            onPress={onPressToggle}
            style={defaultTextStyle}
            isExpanded={true}
          />
        </View>
      )}
    </View>
  );
});

PostContent.displayName = 'PostContent';

export default PostContent;

