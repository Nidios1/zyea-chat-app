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

const SocialTermsScreen = () => {
  const navigation = useNavigation();

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <MaterialCommunityIcons name="chevron-left" size={24} color="#2b2b2b" />
        </TouchableOpacity>
        <Text style={styles.title}>Điều khoản Mạng xã hội</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>1. Khái niệm</Text>
          <Text style={styles.sectionContent}>
            Zyea+ là một nền tảng mạng xã hội cho phép người dùng kết nối, chia sẻ và tương tác 
            với bạn bè, gia đình và cộng đồng. Điều khoản mạng xã hội này quy định cách sử dụng 
            các tính năng cộng đồng của chúng tôi.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>2. Hồ sơ công khai</Text>
          <Text style={styles.sectionContent}>
            Thông tin công khai trong hồ sơ của bạn có thể bao gồm:
          </Text>
          <View style={styles.list}>
            <Text style={styles.listItem}>• Tên, ảnh đại diện và ảnh bìa</Text>
            <Text style={styles.listItem}>• Trạng thái hoạt động</Text>
            <Text style={styles.listItem}>• Bài viết trên News Feed với quyền riêng tư công khai</Text>
            <Text style={styles.listItem}>• Danh sách bạn bè (nếu cho phép công khai)</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>3. Quyền riêng tư và kiểm soát nội dung</Text>
          <Text style={styles.sectionContent}>
            Bạn có quyền:
          </Text>
          <View style={styles.list}>
            <Text style={styles.listItem}>• Điều chỉnh cài đặt quyền riêng tư cho từng bài viết</Text>
            <Text style={styles.listItem}>• Chặn hoặc bỏ theo dõi người dùng khác</Text>
            <Text style={styles.listItem}>• Xóa hoặc chỉnh sửa nội dung bạn đã chia sẻ</Text>
            <Text style={styles.listItem}>• Báo cáo nội dung xấu hoặc người dùng vi phạm</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>4. News Feed và Algorithm</Text>
          <Text style={styles.sectionContent}>
            News Feed của bạn được tùy chỉnh dựa trên:
          </Text>
          <View style={styles.list}>
            <Text style={styles.listItem}>• Mối quan hệ với người đăng</Text>
            <Text style={styles.listItem}>• Mức độ tương tác (like, comment, share)</Text>
            <Text style={styles.listItem}>• Thời gian đăng bài</Text>
            <Text style={styles.listItem}>• Loại nội dung (ảnh, video, text)</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>5. Tương tác và Engagement</Text>
          <Text style={styles.sectionContent}>
            Người dùng có thể:
          </Text>
          <View style={styles.list}>
            <Text style={styles.listItem}>• Thích (like) bài viết, bình luận</Text>
            <Text style={styles.listItem}>• Bình luận trên bài viết của bạn bè</Text>
            <Text style={styles.listItem}>• Chia sẻ (share) nội dung lên News Feed</Text>
            <Text style={styles.listItem}>• React với emoji (love, haha, wow, sad, angry)</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>6. Nội dung được khuyến khích</Text>
          <Text style={styles.sectionContent}>
            Chúng tôi khuyến khích chia sẻ:
          </Text>
          <View style={styles.list}>
            <Text style={styles.listItem}>• Khoảnh khắc cá nhân tích cực</Text>
            <Text style={styles.listItem}>• Thông tin hữu ích và giáo dục</Text>
            <Text style={styles.listItem}>• Sáng tạo nội dung gốc</Text>
            <Text style={styles.listItem}>• Tôn trọng và hỗ trợ cộng đồng</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>7. Nội dung bị cấm</Text>
          <Text style={styles.sectionContent}>
            Nghiêm cấm đăng tải:
          </Text>
          <View style={styles.list}>
            <Text style={styles.listItem}>• Nội dung kỳ thị, phân biệt đối xử</Text>
            <Text style={styles.listItem}>• Thông tin sai sự thật gây hại</Text>
            <Text style={styles.listItem}>• Spam, tin nhắn tự động</Text>
            <Text style={styles.listItem}>• Quấy rối hoặc bắt nạt người khác</Text>
            <Text style={styles.listItem}>• Chia sẻ thông tin cá nhân người khác không được phép</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>8. Quyền kiểm duyệt nội dung</Text>
          <Text style={styles.sectionContent}>
            Zyea+ có quyền kiểm duyệt và xử lý:
          </Text>
          <View style={styles.list}>
            <Text style={styles.listItem}>• Xóa nội dung vi phạm chính sách</Text>
            <Text style={styles.listItem}>• Cảnh báo hoặc tạm khóa tài khoản</Text>
            <Text style={styles.listItem}>• Chặn IP trong trường hợp nghiêm trọng</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>9. Bảo vệ trẻ em</Text>
          <Text style={styles.sectionContent}>
            Chúng tôi nghiêm cấm mọi hình thức lạm dụng trẻ em. Nội dung liên quan đến 
            trẻ em sẽ được kiểm duyệt chặt chẽ và báo cáo ngay cho cơ quan chức năng nếu cần.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>10. Spam và lừa đảo</Text>
          <Text style={styles.sectionContent}>
            Không được sử dụng dịch vụ để:
          </Text>
          <View style={styles.list}>
            <Text style={styles.listItem}>• Gửi tin nhắn spam hoặc quảng cáo không được phép</Text>
            <Text style={styles.listItem}>• Lừa đảo hoặc đánh cắp thông tin</Text>
            <Text style={styles.listItem}>• Tạo tài khoản giả mạo</Text>
            <Text style={styles.listItem}>• Phát tán virus hoặc malware</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>11. Báo cáo nội dung</Text>
          <Text style={styles.sectionContent}>
            Nếu bạn phát hiện nội dung vi phạm, vui lòng báo cáo. Chúng tôi sẽ xem xét và 
            xử lý trong vòng 24 giờ.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>12. Cập nhật chính sách</Text>
          <Text style={styles.sectionContent}>
            Chúng tôi sẽ thông báo trước về mọi thay đổi chính sách. Việc tiếp tục sử dụng 
            dịch vụ sau thay đổi được coi là chấp nhận điều khoản mới.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>13. Liên hệ</Text>
          <Text style={styles.sectionContent}>
            Mọi thắc mắc về điều khoản mạng xã hội, vui lòng liên hệ: 
            support@zyea.me hoặc report@zyea.me (cho báo cáo vi phạm)
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
  },
  backButton: {
    padding: 6,
    marginRight: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2b2b2b',
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
    color: '#1c1e21',
  },
  sectionContent: {
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 12,
    color: '#65676b',
  },
  list: {
    marginLeft: 20,
    marginTop: 8,
  },
  listItem: {
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 8,
    color: '#65676b',
  },
});

export default SocialTermsScreen;

