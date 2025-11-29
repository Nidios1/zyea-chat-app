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
  ChatDetail: { conversationId: string; userName: string; subTitle?: string; otherUserId?: string; userAvatarUrl?: string; isOnline?: boolean; lastSeen?: string; lastMessageTime?: string };
  VideoCall: { conversationId: string; userName: string; otherUserId: string; isVideo: boolean; userAvatarUrl?: string; isIncoming?: boolean; offer?: any };
};

export type NewsFeedStackParamList = {
  Feed: undefined;
  PostDetail: { postId: string };
  CreatePost: undefined;
  OtherUserProfile: { userId: string };
};

export type ProfileStackParamList = {
  Profile: { userId?: string };
  EditProfile: undefined;
  Settings: undefined;
  InterfaceSettings: undefined;
  FontSizeSettings: undefined;
  PersonalProfile: { userId: string };
  Feedback: undefined;
  Help: undefined;
  StatusFeed: undefined;
  ActivityStatus: undefined;
  DeviceManagement: undefined;
  Security: undefined;
  Privacy: undefined;
  AppInfo: undefined;
  SelfDestructPost: undefined;
  QRScanner: undefined;
  AddPhone: undefined;
  VerifyPhone: { phone: string };
  SystemNotifications: undefined;
  Admin: undefined;
  OtherUserProfile: { userId: string };
};

export type FriendsStackParamList = {
  FriendsList: undefined;
  AddFriend: undefined;
  FriendRequests: undefined;
};

export type SettingsStackParamList = {
  Settings: undefined;
};

