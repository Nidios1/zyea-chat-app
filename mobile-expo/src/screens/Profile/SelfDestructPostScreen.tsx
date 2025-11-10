import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  TextInput,
  Switch,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text, Avatar } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { PWATheme } from '../../config/PWATheme';
import { getInitials, getAvatarURL } from '../../utils/imageUtils';

const SelfDestructPostScreen = () => {
  const navigation = useNavigation();
  const { user } = useAuth();
  const { colors, isDarkMode } = useTheme();
  const [content, setContent] = useState('');
  const [showInfoBox, setShowInfoBox] = useState(true);
  const [replyRestriction, setReplyRestriction] = useState(true);

  const userName = user?.full_name || user?.username || 'Người dùng';

  const dynamicStyles = createStyles(colors);

  const canPost = content.trim().length > 0;

  const handlePost = () => {
    // TODO: Implement post creation
    console.log('Posting self-destructing post:', content);
    navigation.goBack();
  };

  return (
    <SafeAreaView style={dynamicStyles.container} edges={['top']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={dynamicStyles.keyboardView}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        {/* Header */}
        <View style={[dynamicStyles.header, { backgroundColor: colors.surface }]}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={dynamicStyles.headerButton}
          >
            <Text style={[dynamicStyles.headerButtonText, { color: colors.primary }]}>
              Hủy
            </Text>
          </TouchableOpacity>
          
          <Text style={[dynamicStyles.headerTitle, { color: colors.text }]}>
            Bài viết tự hủy mới
          </Text>
          
          <TouchableOpacity
            style={dynamicStyles.headerButton}
            onPress={() => {
              // TODO: Open menu
            }}
          >
            <MaterialCommunityIcons name="dots-vertical" size={24} color={colors.text} />
          </TouchableOpacity>
        </View>

        <ScrollView
          style={dynamicStyles.scrollView}
          contentContainerStyle={dynamicStyles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* User Info and Input */}
          <View style={dynamicStyles.contentSection}>
            <View style={dynamicStyles.userSection}>
              {user?.avatar_url ? (
                <Avatar.Image
                  size={40}
                  source={{ uri: getAvatarURL(user.avatar_url) }}
                />
              ) : (
                <Avatar.Text
                  size={40}
                  label={getInitials(userName)}
                />
              )}
              <Text style={[dynamicStyles.username, { color: colors.text }]}>
                {userName}
              </Text>
            </View>

            <View style={[dynamicStyles.inputWrapper]}>
              <View style={[dynamicStyles.inputContainer, { 
                borderColor: colors.border,
                backgroundColor: colors.background,
              }]}>
                <TextInput
                  style={[dynamicStyles.input, { color: colors.text }]}
                  placeholder="Chia sẻ suy nghĩ..."
                  placeholderTextColor={colors.textSecondary}
                  value={content}
                  onChangeText={setContent}
                  multiline
                  autoFocus
                />
              </View>
            </View>
          </View>

          {/* Information Box */}
          {showInfoBox && (
            <View style={[dynamicStyles.infoBox, { backgroundColor: colors.surface }]}>
              <TouchableOpacity
                style={dynamicStyles.infoBoxClose}
                onPress={() => setShowInfoBox(false)}
              >
                <MaterialCommunityIcons name="close" size={18} color={colors.textSecondary} />
              </TouchableOpacity>
              <Text style={[dynamicStyles.infoBoxText, { color: colors.text }]}>
                Hệ thống sẽ lưu trữ bài viết tự hủy sau 24 giờ và chuyển thread trả lời vào tin nhắn. Chỉ mình bạn xem được ai đã thích và trả lời.
              </Text>
            </View>
          )}

          {/* Privacy Settings */}
          <View style={dynamicStyles.privacySection}>
            <View style={dynamicStyles.privacyRow}>
              <MaterialCommunityIcons
                name="email-outline"
                size={20}
                color={colors.text}
                style={dynamicStyles.privacyIcon}
              />
              <Text style={[dynamicStyles.privacyText, { color: colors.text }]}>
                Chỉ những người mà bạn theo dõi mới có thể trả lời, còn những người khác phải yêu cầu
              </Text>
              <Switch
                value={replyRestriction}
                onValueChange={setReplyRestriction}
                trackColor={{ 
                  false: colors.border, 
                  true: colors.primary 
                }}
                thumbColor={isDarkMode ? colors.surface : '#fff'}
                ios_backgroundColor={colors.border}
              />
            </View>
          </View>
        </ScrollView>

        {/* Bottom Bar */}
        <View style={[dynamicStyles.bottomBar, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
          <TouchableOpacity
            style={[
              dynamicStyles.postButton,
              {
                backgroundColor: canPost 
                  ? colors.primary 
                  : (isDarkMode ? colors.border : colors.border),
                opacity: canPost ? 1 : 0.6,
              },
            ]}
            onPress={handlePost}
            disabled={!canPost}
          >
            <Text
              style={[
                dynamicStyles.postButtonText,
                { 
                  color: canPost 
                    ? (isDarkMode ? '#000000' : '#ffffff')
                    : colors.textSecondary 
                },
              ]}
            >
              Đăng
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const createStyles = (colors: typeof PWATheme.light) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerButton: {
    padding: 8,
    minWidth: 50,
  },
  headerButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
  },
  contentSection: {
    marginBottom: 16,
  },
  userSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  username: {
    fontSize: 14,
    fontWeight: '500',
  },
  inputWrapper: {
    marginLeft: 52, // Align with avatar
  },
  inputContainer: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: 12,
    padding: 12,
    minHeight: 100,
  },
  input: {
    fontSize: 15,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  infoBox: {
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    position: 'relative',
  },
  infoBoxClose: {
    position: 'absolute',
    top: 8,
    right: 8,
    padding: 4,
  },
  infoBoxText: {
    fontSize: 13,
    lineHeight: 18,
    paddingRight: 24,
  },
  privacySection: {
    marginTop: 8,
  },
  privacyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  privacyIcon: {
    marginRight: 4,
  },
  privacyText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
  },
  postButton: {
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 8,
    minWidth: 80,
    alignItems: 'center',
  },
  postButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },
});

export default SelfDestructPostScreen;

