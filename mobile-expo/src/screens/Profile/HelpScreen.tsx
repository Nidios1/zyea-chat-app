import React from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { ProfileStackParamList } from '../../navigation/types';
import { useTheme } from '../../contexts/ThemeContext';
import { PWATheme } from '../../config/PWATheme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type HelpScreenNavigationProp = StackNavigationProp<ProfileStackParamList, 'Help'>;

const HelpScreen = () => {
  const navigation = useNavigation<HelpScreenNavigationProp>();
  const { colors, themeMode, isDarkMode } = useTheme();
  const insets = useSafeAreaInsets();

  const dynamicStyles = createStyles(colors);

  const helpSections = [
    {
      title: 'Bắt đầu sử dụng',
      items: [
        'Đăng nhập bằng tài khoản của bạn',
        'Cập nhật thông tin cá nhân trong tab Cá nhân',
        'Tìm kiếm và kết nối với bạn bè',
      ],
    },
    {
      title: 'Đăng bài viết',
      items: [
        'Nhấn vào nút "+" ở góc dưới bên phải để tạo bài viết mới',
        'Chọn hình ảnh hoặc video từ thư viện',
        'Viết nội dung và chọn quyền riêng tư',
        'Nhấn "Đăng" để chia sẻ với mọi người',
      ],
    },
    {
      title: 'Tin nhắn',
      items: [
        'Vào tab Chat để xem danh sách cuộc trò chuyện',
        'Nhấn vào một cuộc trò chuyện để bắt đầu chat',
        'Gửi tin nhắn, hình ảnh hoặc video',
        'Xem số tin nhắn chưa đọc trên biểu tượng Chat',
      ],
    },
    {
      title: 'Video',
      items: [
        'Vào tab Video để xem các video công khai',
        'Nhấn vào video để phát',
        'Video sẽ tự động phát khi bạn vào tab Video',
        'Video sẽ tạm dừng khi bạn rời khỏi tab',
      ],
    },
    {
      title: 'Cài đặt',
      items: [
        'Vào tab Cá nhân > Cài đặt để thay đổi cài đặt',
        'Thay đổi giao diện sáng/tối trong Cài đặt > Giao diện',
        'Quản lý bảo mật và quyền riêng tư',
        'Xem và quản lý thiết bị đã đăng nhập',
      ],
    },
    {
      title: 'Góp ý & phản hồi',
      items: [
        'Vào tab Cá nhân > Góp ý & phản hồi',
        'Chọn loại góp ý: Góp ý, Báo cáo hoặc Lỗi',
        'Viết nội dung chi tiết về vấn đề của bạn',
        'Có thể đính kèm hình ảnh hoặc video (video tối đa 30 giây, 50MB)',
        'Nhấn "Gửi góp ý" để gửi',
      ],
    },
  ];

  return (
    <SafeAreaView style={[dynamicStyles.container, { backgroundColor: colors.background }]} edges={['top']}>
      {/* Header */}
      <View style={dynamicStyles.header}>
        <TouchableOpacity
          style={dynamicStyles.backButton}
          onPress={() => navigation.goBack()}
        >
          <MaterialCommunityIcons name="chevron-left" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[dynamicStyles.headerTitle, { color: colors.text }]}>
          Hướng dẫn sử dụng
        </Text>
        <View style={dynamicStyles.headerRight} />
      </View>

      <ScrollView
        style={dynamicStyles.content}
        contentContainerStyle={[
          dynamicStyles.contentContainer,
          { paddingBottom: Math.max(insets.bottom, 20) + 20 }
        ]}
        showsVerticalScrollIndicator={true}
      >
        {helpSections.map((section, sectionIndex) => (
          <View key={sectionIndex} style={[dynamicStyles.section, { backgroundColor: colors.surface }]}>
            <Text style={[dynamicStyles.sectionTitle, { color: colors.text }]}>
              {section.title}
            </Text>
            {section.items.map((item, itemIndex) => (
              <View key={itemIndex} style={dynamicStyles.itemRow}>
                <View style={[dynamicStyles.bullet, { backgroundColor: colors.primary }]} />
                <Text style={[dynamicStyles.itemText, { color: colors.textSecondary }]}>
                  {item}
                </Text>
              </View>
            ))}
          </View>
        ))}

        {/* Footer */}
        <View style={dynamicStyles.footer}>
          <Text style={[dynamicStyles.footerText, { color: colors.textSecondary }]}>
            Nếu bạn cần hỗ trợ thêm, vui lòng liên hệ qua mục Góp ý & phản hồi
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const createStyles = (colors: typeof PWATheme.light) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'transparent',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
  },
  headerRight: {
    width: 40,
  },
  content: {
    flex: 1,
    backgroundColor: colors.background,
  },
  contentContainer: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  section: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '600',
    marginBottom: 12,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  bullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 6,
    marginRight: 12,
  },
  itemText: {
    flex: 1,
    fontSize: 15,
    lineHeight: 22,
  },
  footer: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 20,
    fontStyle: 'italic',
  },
});

export default HelpScreen;

