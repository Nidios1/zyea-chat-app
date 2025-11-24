/**
 * Utility functions for text processing
 */

export interface TextPart {
  text: string;
  type: 'text' | 'url';
  url?: string;
}

/**
 * Parse text and extract URLs
 * Returns an array of text parts (text or url)
 */
export const parseTextWithUrls = (text: string): TextPart[] => {
  if (!text) return [];

  // URL regex pattern - matches http, https, www, and common domains
  // This pattern matches:
  // - http:// or https:// URLs (with optional path, query, fragment)
  // - www. URLs
  // - URLs without protocol (like example.com, example.com/path)
  // - TLD phải có ít nhất 2 ký tự và không phải là chữ cái đơn giản (tránh match "FPT.Digimeet")
  // - Chỉ match domain thực sự, không match các từ có dấu chấm trong tên
  const urlRegex = /(https?:\/\/[^\s<>"']+|www\.[a-zA-Z0-9][a-zA-Z0-9-]*[a-zA-Z0-9]*\.[a-zA-Z]{2,}(:\d+)?(\/[^\s<>"']*)?|[a-zA-Z0-9][a-zA-Z0-9-]*[a-zA-Z0-9]*\.[a-zA-Z]{2,}(:\d+)?(\/[^\s<>"']*)?)/gi;

  const parts: TextPart[] = [];
  let lastIndex = 0;
  let match;

  while ((match = urlRegex.exec(text)) !== null) {
    // Add text before URL
    if (match.index > lastIndex) {
      parts.push({
        text: text.substring(lastIndex, match.index),
        type: 'text',
      });
    }

    // Add URL
    let matchedUrl = match[0];
    
    // Remove trailing punctuation that's not part of URL (.,!?;:)
    // But keep punctuation that's part of URL (like /path?query=value)
    const trailingPunctuation = /[.,!?;:]+$/;
    const urlWithoutPunctuation = matchedUrl.replace(trailingPunctuation, '');
    
    // Validation: Kiểm tra xem có phải là URL thực sự không
    // Tránh match các từ có dấu chấm như "FPT.Digimeet", "A.B", etc.
    const isValidUrl = (url: string): boolean => {
      // Nếu có protocol (http://, https://) hoặc www., chắc chắn là URL
      if (url.match(/^(https?:\/\/|www\.)/i)) {
        return true;
      }
      
      // Nếu không có protocol, kiểm tra TLD
      // TLD phải có ít nhất 2 ký tự và không phải là chữ cái đơn giản
      // Ví dụ: .com, .net, .org, .vn là hợp lệ
      // Nhưng "FPT.Digimeet" không hợp lệ vì "Digimeet" không phải TLD
      const domainMatch = url.match(/^([a-zA-Z0-9][a-zA-Z0-9-]*[a-zA-Z0-9]*)\.([a-zA-Z]{2,})/);
      if (domainMatch) {
        const tld = domainMatch[2].toLowerCase();
        // Danh sách TLD phổ biến (có thể mở rộng)
        const commonTlds = ['com', 'net', 'org', 'edu', 'gov', 'mil', 'int', 'co', 'io', 'ai', 'vn', 'uk', 'de', 'fr', 'jp', 'cn', 'au', 'ca', 'br', 'in', 'ru', 'kr', 'es', 'it', 'nl', 'se', 'no', 'dk', 'fi', 'pl', 'cz', 'gr', 'tr', 'mx', 'ar', 'za', 'nz', 'sg', 'my', 'th', 'ph', 'id', 'tw', 'hk', 'mo'];
        
        // Nếu TLD có 2-3 ký tự và là TLD phổ biến, hoặc có 4+ ký tự (như .info, .travel)
        if (tld.length >= 2 && (commonTlds.includes(tld) || tld.length >= 4)) {
          return true;
        }
      }
      
      return false;
    };
    
    // Chỉ thêm vào nếu là URL hợp lệ
    if (!isValidUrl(urlWithoutPunctuation)) {
      // Nếu không phải URL, thêm vào như text bình thường
      lastIndex = match.index + matchedUrl.length;
      continue;
    }
    
    // Add protocol if missing
    let fullUrl = urlWithoutPunctuation;
    if (!fullUrl.match(/^https?:\/\//i)) {
      fullUrl = 'https://' + fullUrl;
    }

    parts.push({
      text: urlWithoutPunctuation, // Display URL without trailing punctuation
      type: 'url',
      url: fullUrl, // Full URL with protocol for opening
    });
    
    // If we removed trailing punctuation, we need to account for it
    // The trailing punctuation will be included in the next text part
    const removedPunctuation = matchedUrl.substring(urlWithoutPunctuation.length);
    if (removedPunctuation) {
      // Update lastIndex to account for removed punctuation
      // The punctuation will be part of the remaining text
      lastIndex = match.index + urlWithoutPunctuation.length;
    } else {
      lastIndex = urlRegex.lastIndex;
    }
  }

  // Add remaining text
  if (lastIndex < text.length) {
    parts.push({
      text: text.substring(lastIndex),
      type: 'text',
    });
  }

  // If no URLs found, return single text part
  if (parts.length === 0) {
    parts.push({
      text: text,
      type: 'text',
    });
  }

  return parts;
};

