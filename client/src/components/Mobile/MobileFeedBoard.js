import React, { memo } from 'react';
import MobileFeedView from './MobileFeedView';

/**
 * Mobile FeedBoard Component
 * 
 * Lightweight wrapper for MobileFeedView optimized for mobile with:
 * - Custom navigation handlers
 * - Better mobile UX matching design
 * - Easy to customize and fix
 * 
 * Props:
 * @param {Object} currentUser - Current user object
 * @param {Function} onBack - Handler for back navigation
 * @param {Function} onGoToMessages - Handler for navigating to messages
 * @param {Function} onNavigateToContacts - Handler for navigating to contacts
 * @param {Function} onNavigateToExplore - Handler for navigating to explore
 * @param {Function} onNavigateToProfile - Handler for navigating to profile
 */
const MobileFeedBoard = ({ 
  currentUser, 
  onBack, 
  onGoToMessages, 
  onNavigateToContacts, 
  onNavigateToExplore, 
  onNavigateToProfile,
  onScrollDirectionChange
}) => {
  // Simple wrapper, mobile feed view is self-contained
  return <MobileFeedView currentUser={currentUser} onScrollDirectionChange={onScrollDirectionChange} />;
};

export default memo(MobileFeedBoard);

