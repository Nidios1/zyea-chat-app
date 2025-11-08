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
  Party: undefined;
  Chat: undefined;
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
  OtherUserProfile: { userId: string };
};

export type ProfileStackParamList = {
  Profile: undefined;
  EditProfile: undefined;
  Settings: undefined;
  InterfaceSettings: undefined;
  FontSizeSettings: undefined;
  PersonalProfile: { userId: string };
  ProfileInformation: { userId?: string } | undefined;
  Feedback: undefined;
  Help: undefined;
  StatusFeed: undefined;
  ActivityStatus: undefined;
  ResourceManagement: undefined;
  DeviceManagement: undefined;
  Security: undefined;
  AppInfo: undefined;
};

export type FriendsStackParamList = {
  FriendsList: undefined;
  AddFriend: undefined;
  FriendRequests: undefined;
};

export type SettingsStackParamList = {
  Settings: undefined;
};

