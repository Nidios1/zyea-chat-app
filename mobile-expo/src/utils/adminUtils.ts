import { User } from '../contexts/AuthContext';

/**
 * Check if user is admin
 * Supports multiple admin flag formats: role === 'admin', is_admin === true, isAdmin === true
 */
export const isAdmin = (user: User | null | undefined): boolean => {
  if (!user) {
    console.log('🔍 [isAdmin] No user provided');
    return false;
  }
  
  const adminCheck = (
    user.role === 'admin' ||
    user.is_admin === true ||
    user.isAdmin === true ||
    user.email === 'admin@zalo.com' || // Temporary: for testing
    user.username === 'admin' // Temporary: for testing
  );
  
  // Debug log
  if (__DEV__) {
    console.log('🔍 [isAdmin] Check:', {
      userId: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      is_admin: user.is_admin,
      isAdmin: user.isAdmin,
      result: adminCheck,
    });
  }
  
  return adminCheck;
};

