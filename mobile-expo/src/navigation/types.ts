export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
};

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
  Terms: undefined;
  SocialTerms: undefined;
};

export type MainTabParamList = {
  NewsFeed: undefined;
  Video: undefined;
  Chat: undefined;
  Notifications: undefined;
  Profile: undefined;
};

export type ChatStackParamList = {
  ChatList: undefined;
  ChatDetail: { conversationId: string; userName: string; subTitle?: string };
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
  InterfaceSettings: undefined;
  PersonalProfile: { userId: string };
  ProfileInformation: { userId?: string } | undefined;
};

export type FriendsStackParamList = {
  FriendsList: undefined;
  AddFriend: undefined;
  FriendRequests: undefined;
};

export type SettingsStackParamList = {
  Settings: undefined;
};

