import React from 'react';
import { useNavigation, CommonActions } from '@react-navigation/native';
import { HomeHeaderLayout } from './HomeHeaderLayout';
import { useAuth } from '../../contexts/AuthContext';

interface HomeHeaderProps {
  onMenuPress?: () => void;
  onLogoPress?: () => void;
  onSearchPress?: () => void;
  unreadCount?: number;
  headerHeight?: any; // Animated.SharedValue<number>
  onHeaderHeightChange?: (height: number) => void;
  tabBar?: React.ReactNode; // TabBar component to render below header
}

export function HomeHeader({
  onMenuPress,
  onLogoPress,
  onSearchPress,
  unreadCount = 0,
  headerHeight,
  onHeaderHeightChange,
  tabBar,
}: HomeHeaderProps) {
  const navigation = useNavigation();
  const { user } = useAuth();

  const handleMenuPress = React.useCallback(() => {
    if (onMenuPress) {
      onMenuPress();
    }
  }, [onMenuPress]);

  const handleLogoPress = React.useCallback(() => {
    // Scroll to top or refresh feed
    if (onLogoPress) {
      onLogoPress();
    }
  }, [onLogoPress]);

  const handleSearchPress = React.useCallback(() => {
    // Chỉ gọi callback nếu có, không navigate vì không có Search screen
    if (onSearchPress) {
      onSearchPress();
    }
    // Không có fallback navigation vì Search screen chưa được tạo
  }, [onSearchPress]);

  const handleMessengerPress = React.useCallback(() => {
    try {
      // Navigate to Chat tab (ChatList is the initial screen in ChatStack)
      navigation.dispatch(
        CommonActions.navigate({
          name: 'Chat',
        } as never)
      );
    } catch (error) {
      console.error('Navigation error:', error);
      // Fallback: try direct navigation
      try {
        (navigation as any).navigate('Chat');
      } catch (fallbackError) {
        console.error('Fallback navigation error:', fallbackError);
      }
    }
  }, [navigation]);

  return (
    <HomeHeaderLayout
      onMenuPress={handleMenuPress}
      onLogoPress={handleLogoPress}
      onAddPress={undefined}
      onSearchPress={handleSearchPress}
      onMessengerPress={handleMessengerPress}
      unreadCount={unreadCount}
      headerHeight={headerHeight}
      onHeaderHeightChange={onHeaderHeightChange}
      tabBar={tabBar}
    />
  );
}

