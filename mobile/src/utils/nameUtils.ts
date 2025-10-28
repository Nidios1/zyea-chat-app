export const getInitials = (name?: string): string => {
  if (!name) return 'U';

  const parts = name.trim().split(' ');
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }

  return name.substring(0, 2).toUpperCase();
};

export const formatDisplayName = (fullName?: string, username?: string): string => {
  return fullName || username || 'User';
};

export const shortenName = (name: string, maxLength: number = 20): string => {
  if (name.length <= maxLength) {
    return name;
  }
  return name.substring(0, maxLength - 3) + '...';
};

