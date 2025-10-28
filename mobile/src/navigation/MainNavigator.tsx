import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import Icon from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../contexts/ThemeContext';

import ChatListScreen from '../screens/Chat/ChatListScreen';
import ChatDetailScreen from '../screens/Chat/ChatDetailScreen';
import ContactsScreen from '../screens/Contacts/ContactsScreen';
import PostsListScreen from '../screens/NewsFeed/PostsListScreen';
import ProfileScreen from '../screens/Profile/ProfileScreen';
import EditProfileScreen from '../screens/Profile/EditProfileScreen';
import SettingsScreen from '../screens/Settings/SettingsScreen';
import FriendsListScreen from '../screens/Friends/FriendsListScreen';

const Tab = createBottomTabNavigator();
const ChatStack = createStackNavigator();
const FeedStack = createStackNavigator();
const ProfileStack = createStackNavigator();

// Chat Stack
const ChatStackNavigator = () => (
  <ChatStack.Navigator>
    <ChatStack.Screen
      name="ChatList"
      component={ChatListScreen}
      options={{ headerShown: false }}
    />
    <ChatStack.Screen
      name="ChatDetail"
      component={ChatDetailScreen}
      options={({ route }) => ({
        title: route.params?.userName || 'Chat',
        headerBackTitle: '',
      })}
    />
  </ChatStack.Navigator>
);

// NewsFeed Stack
const FeedStackNavigator = () => (
  <FeedStack.Navigator>
    <FeedStack.Screen
      name="Feed"
      component={PostsListScreen}
      options={{ headerShown: false }}
    />
  </FeedStack.Navigator>
);

// Profile Stack
const ProfileStackNavigator = () => (
  <ProfileStack.Navigator>
    <ProfileStack.Screen
      name="Profile"
      component={ProfileScreen}
      options={{ headerShown: false }}
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
  </ProfileStack.Navigator>
);

const MainNavigator = () => {
  const { isDarkMode } = useTheme();
  const theme = isDarkMode ? '#1a1a1a' : '#fff';
  const iconColor = isDarkMode ? '#0068ff' : '#0068ff';

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: string = '';

          if (route.name === 'Chat') {
            iconName = focused ? 'chatbubbles' : 'chatbubbles-outline';
          } else if (route.name === 'Contacts') {
            iconName = focused ? 'people' : 'people-outline';
          } else if (route.name === 'NewsFeed') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          }

          return <Icon name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: iconColor,
        tabBarInactiveTintColor: '#888',
        tabBarStyle: {
          backgroundColor: theme,
          borderTopColor: isDarkMode ? '#2d2d2d' : '#e0e0e0',
        },
        headerShown: false,
      })}
    >
      <Tab.Screen name="Chat" component={ChatStackNavigator} />
      <Tab.Screen name="Contacts" component={FriendsListScreen} />
      <Tab.Screen name="NewsFeed" component={FeedStackNavigator} />
      <Tab.Screen name="Profile" component={ProfileStackNavigator} />
    </Tab.Navigator>
  );
};

export default MainNavigator;

