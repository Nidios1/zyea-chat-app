export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
};

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
  Terms: undefined;
};

export type MainTabParamList = {
  Chat: undefined;
  Contacts: undefined;
  NewsFeed: undefined;
  Profile: undefined;
};

export type ChatStackParamList = {
  ChatList: undefined;
  ChatDetail: { conversationId: string; userName: string };
};

export type NewsFeedStackParamList = {
  Feed: undefined;
  PostDetail: { postId: string };
  CreatePost: undefined;
};

export type ProfileStackParamList = {
  Profile: undefined;
  EditProfile: undefined;
  Settings: undefined;
  PersonalProfile: { userId: string };
};

export type FriendsStackParamList = {
  FriendsList: undefined;
  AddFriend: undefined;
  FriendRequests: undefined;
};

export type SettingsStackParamList = {
  Settings: undefined;
};

