/**
 * Get initial from a full name (first character only, like Zalo)
 * Example: "Nguyễn Văn A" => "A" (last word)
 * Example: "Administrator" => "A"
 * @param {string} name - Full name
 * @returns {string} Initial
 */
export const getInitials = (name) => {
  if (!name) return 'U';
  
  const words = name.trim().split(/\s+/).filter(word => word.length > 0);
  
  if (words.length === 0) return 'U';
  
  // For Vietnamese names (multiple words), use last word's first character
  // For single names, use first character
  const lastWord = words[words.length - 1];
  return lastWord.charAt(0).toUpperCase();
};

