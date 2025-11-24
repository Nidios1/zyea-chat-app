import React from 'react';
import { Text, StyleSheet, Linking } from 'react-native';
import { parseTextWithUrls, TextPart } from '../../utils/textUtils';

interface TextWithLinksProps {
  text: string;
  textStyle?: any;
  linkStyle?: any;
  onLinkPress?: (url: string) => void;
}

/**
 * Component to render text with clickable links (like Telegram)
 * Automatically detects URLs and makes them clickable
 */
const TextWithLinks: React.FC<TextWithLinksProps> = ({
  text,
  textStyle,
  linkStyle,
  onLinkPress,
}) => {
  const parts = parseTextWithUrls(text);

  const handleLinkPress = async (url: string) => {
    if (onLinkPress) {
      onLinkPress(url);
      return;
    }

    // Default behavior: open URL in browser
    try {
      // Ensure URL is properly formatted
      let formattedUrl = url.trim();
      
      // If URL doesn't have protocol, add https://
      if (!formattedUrl.match(/^https?:\/\//i)) {
        formattedUrl = 'https://' + formattedUrl;
      }
      
      // Try to open URL directly
      // Note: canOpenURL might return false even for valid URLs on some platforms
      // So we'll try to open directly and catch errors silently
      try {
        await Linking.openURL(formattedUrl);
      } catch (openError: any) {
        // Silently fail - don't show error popup to user
        // Some URLs might not be openable on certain platforms
        // This is expected behavior and shouldn't crash the app
      }
    } catch (error: any) {
      // Silently handle all errors - don't show console errors for URL opening
      // This prevents error popups when URLs can't be opened
      // URL opening failures are not critical errors
    }
  };

  if (parts.length === 1 && parts[0].type === 'text') {
    // No URLs found, render as plain text
    return <Text style={textStyle}>{text}</Text>;
  }

  // Render text with links
  // In React Native, Text components can be nested and Text with onPress is clickable
  return (
    <Text style={textStyle}>
      {parts.map((part: TextPart, index: number) => {
        if (part.type === 'url' && part.url) {
          return (
            <Text
              key={index}
              style={[styles.link, linkStyle]}
              onPress={() => handleLinkPress(part.url!)}
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

const styles = StyleSheet.create({
  link: {
    color: '#0084ff', // Telegram-like blue color
    textDecorationLine: 'underline',
  },
});

export default TextWithLinks;

