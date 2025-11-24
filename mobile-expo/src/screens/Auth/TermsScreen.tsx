import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';

const TermsScreen = () => {
  const navigation = useNavigation();
  const { isDarkMode, colors } = useTheme();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.surface }]}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} backgroundColor={colors.surface} />
      <View style={[styles.header, { backgroundColor: colors.surface }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <MaterialCommunityIcons name="chevron-left" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>Điều khoản sử dụng</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>1. Chấp nhận điều khoản</Text>
          <Text style={[styles.sectionContent, { color: colors.textSecondary }]}>
            Bằng việc sử dụng Zyea+, bạn đồng ý tuân thủ và chịu ràng buộc bởi các điều khoản sử dụng này. 
            Nếu bạn không đồng ý với bất kỳ phần nào của điều khoản, vui lòng không sử dụng dịch vụ.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>2. Định nghĩa dịch vụ</Text>
          <Text style={styles.sectionContent}>
            Zyea+ là một nền tảng mạng xã hội và ứng dụng nhắn tin cho phép người dùng:
          </Text>
          <View style={styles.list}>
            <Text style={[styles.listItem, { color: colors.textSecondary }]}>• Gửi và nhận tin nhắn văn bản</Text>
            <Text style={styles.listItem}>• Thực hiện cuộc gọi video và audio</Text>
            <Text style={styles.listItem}>• Chia sẻ hình ảnh và tệp tin</Text>
            <Text style={styles.listItem}>• Tương tác với bạn bè qua News Feed</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>3. Tài khoản người dùng</Text>
          <Text style={styles.sectionContent}>
            Để sử dụng dịch vụ, bạn cần:
          </Text>
          <View style={styles.list}>
            <Text style={styles.listItem}>• Cung cấp thông tin đăng ký chính xác và đầy đủ</Text>
            <Text style={styles.listItem}>• Bảo mật tài khoản và mật khẩu của bạn</Text>
            <Text style={styles.listItem}>• Thông báo ngay cho chúng tôi nếu phát hiện bất kỳ hoạt động đáng ngờ nào</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>4. Quy định về nội dung</Text>
          <Text style={styles.sectionContent}>
            Bạn không được phép đăng, chia sẻ hoặc tải lên bất kỳ nội dung nào:
          </Text>
          <View style={styles.list}>
            <Text style={styles.listItem}>• Vi phạm pháp luật hoặc xâm phạm quyền của người khác</Text>
            <Text style={styles.listItem}>• Có tính chất bạo lực, khiêu dâm, kỳ thị</Text>
            <Text style={styles.listItem}>• Chứa thông tin sai lệch hoặc lừa đảo</Text>
            <Text style={styles.listItem}>• Xâm phạm bản quyền hoặc tài sản trí tuệ</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>5. Quyền và trách nhiệm</Text>
          <Text style={styles.sectionContent}>
            Zyea+ có quyền:
          </Text>
          <View style={styles.list}>
            <Text style={styles.listItem}>• Xóa hoặc chặn nội dung vi phạm</Text>
            <Text style={styles.listItem}>• Tạm dừng hoặc chấm dứt tài khoản vi phạm</Text>
            <Text style={styles.listItem}>• Thay đổi điều khoản với thông báo trước</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>6. Bảo mật dữ liệu</Text>
          <Text style={styles.sectionContent}>
            Chúng tôi cam kết bảo vệ thông tin cá nhân của bạn theo Chính sách Bảo mật. 
            Dữ liệu của bạn được mã hóa và bảo mật nghiêm ngặt.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>7. Sở hữu trí tuệ</Text>
          <Text style={styles.sectionContent}>
            Tất cả nội dung trên Zyea+, bao gồm logo, hình ảnh, văn bản đều thuộc quyền sở hữu của Zyea+ 
            hoặc đối tác được cấp phép.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>8. Giới hạn trách nhiệm</Text>
          <Text style={styles.sectionContent}>
            Zyea+ không chịu trách nhiệm đối với bất kỳ thiệt hại trực tiếp hoặc gián tiếp nào 
            phát sinh từ việc sử dụng dịch vụ.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>9. Thay đổi điều khoản</Text>
          <Text style={styles.sectionContent}>
            Chúng tôi có thể cập nhật điều khoản này theo thời gian. Thay đổi sẽ có hiệu lực 
            sau khi được thông báo. Việc bạn tiếp tục sử dụng dịch vụ sau khi có thay đổi 
            được coi là chấp nhận điều khoản mới.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>10. Liên hệ</Text>
          <Text style={styles.sectionContent}>
            Nếu bạn có bất kỳ câu hỏi nào về điều khoản này, vui lòng liên hệ với chúng tôi 
            qua email: support@zyea.me
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  backButton: {
    padding: 6,
    marginRight: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 12,
  },
  sectionContent: {
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 12,
  },
  list: {
    marginLeft: 20,
    marginTop: 8,
  },
  listItem: {
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 8,
  },
});

export default TermsScreen;
