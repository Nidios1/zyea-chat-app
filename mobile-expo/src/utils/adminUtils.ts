import { User } from '../contexts/AuthContext';

/**
 * Check if user is admin
 * Supports multiple admin flag formats: role === 'admin', is_admin === true, isAdmin === true
 */
export const isAdmin = (user: User | null | undefined): boolean => {
  if (!user) return false;
  
  return (
    user.role === 'admin' ||
    user.is_admin === true ||
    user.isAdmin === true
  );
};

