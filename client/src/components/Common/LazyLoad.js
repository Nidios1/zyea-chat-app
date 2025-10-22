import React, { Suspense, lazy } from 'react';

// Lazy load components for better performance
export const LazyChat = lazy(() => import('../Chat/Chat'));
export const LazyNewsFeed = lazy(() => import('../NewsFeed/NewsFeed'));
export const LazyFriends = lazy(() => import('../Friends/Friends'));
export const LazyProfile = lazy(() => import('../Profile/ProfilePage'));

// Loading component
const LoadingSpinner = () => (
  <div style={{
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '200px',
    fontSize: '16px',
    color: '#666'
  }}>
    <div style={{
      width: '40px',
      height: '40px',
      border: '4px solid #f3f3f3',
      borderTop: '4px solid #0084ff',
      borderRadius: '50%',
      animation: 'spin 1s linear infinite'
    }} />
    <style>{`
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    `}</style>
  </div>
);

// Higher-order component for lazy loading
export const withLazyLoad = (Component) => {
  return (props) => (
    <Suspense fallback={<LoadingSpinner />}>
      <Component {...props} />
    </Suspense>
  );
};

// Lazy load wrapper
export const LazyWrapper = ({ children, fallback = <LoadingSpinner /> }) => (
  <Suspense fallback={fallback}>
    {children}
  </Suspense>
);
