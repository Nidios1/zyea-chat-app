import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';

import ChatListScreen from '../screens/Chat/ChatListScreen';
import ChatDetailScreen from '../screens/Chat/ChatDetailScreen';
import ContactsScreen from '../screens/Contacts/ContactsScreen';
import PostsListScreen from '../screens/NewsFeed/PostsListScreen';
import ProfileScreen from '../screens/Profile/ProfileScreen';
import EditProfileScreen from '../screens/Profile/EditProfileScreen';
import ProfileInformationScreen from '../screens/Profile/ProfileInformationScreen';
import FeedbackScreen from '../screens/Profile/FeedbackScreen';
import HelpScreen from '../screens/Profile/HelpScreen';
import SettingsScreen from '../screens/Settings/SettingsScreen';
import InterfaceSettingsScreen from '../screens/Settings/InterfaceSettingsScreen';
import FontSizeSettingsScreen from '../screens/Settings/FontSizeSettingsScreen';
import StatusFeedScreen from '../screens/Profile/StatusFeedScreen';
import ActivityStatusScreen from '../screens/Profile/ActivityStatusScreen';
import ResourceManagementScreen from '../screens/Profile/ResourceManagementScreen';
import DeviceManagementScreen from '../screens/Profile/DeviceManagementScreen';
import SecurityScreen from '../screens/Profile/SecurityScreen';
import AppInfoScreen from '../screens/Profile/AppInfoScreen';
import FriendsListScreen from '../screens/Friends/FriendsListScreen';
import NotificationsScreen from '../screens/Notifications/NotificationsScreen';
import CreatePostScreen from '../screens/NewsFeed/CreatePostScreen';
import VideoFeedScreen from '../screens/Video/VideoFeedScreen';
import OtherUserProfileScreen from '../screens/Profile/OtherUserProfileScreen';
import BottomTabBar from '../components/Common/BottomTabBar';
import { ChatStackParamList, MainTabParamList } from './types';

const Tab = createBottomTabNavigator<MainTabParamList>();
const ChatStack = createStackNavigator<ChatStackParamList>();
const FeedStack = createStackNavigator();
const ProfileStack = createStackNavigator();

// Chat Stack
const ChatStackNavigator = () => (
  <ChatStack.Navigator>
    <ChatStack.Screen
      name="ChatList"
      component={ChatListScreen}
      options={{ headerShown: false as boolean }}
    />
    <ChatStack.Screen
      name="ChatDetail"
      component={ChatDetailScreen}
      options={{
        headerShown: false as boolean,
      }}
    />
  </ChatStack.Navigator>
);

// NewsFeed Stack
const FeedStackNavigator = () => (
  <FeedStack.Navigator>
    <FeedStack.Screen
      name="Feed"
      component={PostsListScreen}
      options={{ headerShown: false as boolean }}
    />
    <FeedStack.Screen
      name="CreatePost"
      component={CreatePostScreen}
      options={{ headerShown: false as boolean }}
    />
    <FeedStack.Screen
      name="OtherUserProfile"
      component={OtherUserProfileScreen}
      options={{ headerShown: false as boolean }}
    />
  </FeedStack.Navigator>
);

// Profile Stack
const ProfileStackNavigator = () => (
  <ProfileStack.Navigator>
    <ProfileStack.Screen
      name="Profile"
      component={ProfileScreen}
      options={{ headerShown: false as boolean }}
    />
    <ProfileStack.Screen
      name="ProfileInformation"
      component={ProfileInformationScreen}
      options={{ title: 'Hồ sơ thông tin', headerShown: false as boolean }}
    />
    <ProfileStack.Screen
      name="EditProfile"
      component={EditProfileScreen}
      options={{ title: 'Chỉnh sửa hồ sơ' }}
    />
    <ProfileStack.Screen
      name="Settings"
      component={SettingsScreen}
      options={{ title: 'Cài đặt' }}
    />
    <ProfileStack.Screen
      name="InterfaceSettings"
      component={InterfaceSettingsScreen}
      options={{ title: 'Giao diện' }}
    />
    <ProfileStack.Screen
      name="Feedback"
      component={FeedbackScreen}
      options={{ headerShown: false as boolean }}
    />
    <ProfileStack.Screen
      name="Help"
      component={HelpScreen}
      options={{ headerShown: false as boolean }}
    />
    <ProfileStack.Screen
      name="FontSizeSettings"
      component={FontSizeSettingsScreen}
      options={{ headerShown: false as boolean }}
    />
    <ProfileStack.Screen
      name="StatusFeed"
      component={StatusFeedScreen}
      options={{ headerShown: false as boolean }}
    />
    <ProfileStack.Screen
      name="ActivityStatus"
      component={ActivityStatusScreen}
      options={{ headerShown: false as boolean }}
    />
    <ProfileStack.Screen
      name="ResourceManagement"
      component={ResourceManagementScreen}
      options={{ headerShown: false as boolean }}
    />
    <ProfileStack.Screen
      name="DeviceManagement"
      component={DeviceManagementScreen}
      options={{ headerShown: false as boolean }}
    />
    <ProfileStack.Screen
      name="Security"
      component={SecurityScreen}
      options={{ headerShown: false as boolean }}
    />
    <ProfileStack.Screen
      name="AppInfo"
      component={AppInfoScreen}
      options={{ headerShown: false as boolean }}
    />
  </ProfileStack.Navigator>
);

const MainNavigator = () => {
  return (
    <Tab.Navigator
      tabBar={(props) => <BottomTabBar {...props} />}
      screenOptions={{
        headerShown: false as boolean,
      }}
    >
      <Tab.Screen 
        name="NewsFeed" 
        component={FeedStackNavigator}
        options={{ title: 'Bảng feed' }}
      />
      <Tab.Screen 
        name="Video" 
        component={VideoFeedScreen}
        options={{ title: 'Video' }}
      />
      <Tab.Screen 
        name="Party" 
        component={NotificationsScreen}
        options={{ title: 'Party' }}
      />
      <Tab.Screen 
        name="Chat" 
        component={ChatStackNavigator}
        options={{ title: 'Tin nhắn' }}
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileStackNavigator}
        options={{ title: 'Cá nhân' }}
      />
    </Tab.Navigator>
  );
};

export default MainNavigator;
