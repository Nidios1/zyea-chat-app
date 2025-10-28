import React from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import { FiChevronLeft } from 'react-icons/fi';
import { useTheme } from '../../contexts/ThemeContext';

const Container = styled.div`
  height: 100vh;
  height: 100dvh;
  background: ${props => props.$isDark ? '#2d2d2d' : '#fff'};
  width: 100%;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  padding-top: env(safe-area-inset-top);
  padding-bottom: env(safe-area-inset-bottom);
  overflow: hidden;
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px;
  border-bottom: 1px solid ${props => props.$isDark ? '#444' : '#e6e6e6'};
  background: ${props => props.$isDark ? '#2d2d2d' : '#fff'};
  flex-shrink: 0;
`;

const BackBtn = styled.button`
  border: none;
  background: transparent;
  padding: 6px;
  display: flex;
  align-items: center;
  color: ${props => props.$isDark ? '#fff' : '#2b2b2b'};
`;

const Title = styled.div`
  font-size: 18px;
  font-weight: 600;
  color: ${props => props.$isDark ? '#fff' : '#2b2b2b'};
`;

const Content = styled.div`
  padding: 20px 16px 40px;
  line-height: 1.6;
  color: ${props => props.$isDark ? '#e4e6eb' : '#1c1e21'};
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  flex: 1 1 auto;
  min-height: 0;
  height: 100%;
`;

const Section = styled.div`
  margin-bottom: 24px;
`;

const SectionTitle = styled.h2`
  font-size: 20px;
  font-weight: 600;
  margin-bottom: 12px;
  color: ${props => props.$isDark ? '#fff' : '#1c1e21'};
`;

const SectionContent = styled.p`
  font-size: 14px;
  margin-bottom: 12px;
  color: ${props => props.$isDark ? '#b0b3b8' : '#65676b'};
`;

const List = styled.ul`
  padding-left: 20px;
  margin-bottom: 12px;
`;

const ListItem = styled.li`
  font-size: 14px;
  margin-bottom: 8px;
  color: ${props => props.$isDark ? '#b0b3b8' : '#65676b'};
`;

const MobileSocialTerms = () => {
  const navigate = useNavigate();
  const { isDarkMode } = useTheme();

  return (
    <Container $isDark={isDarkMode}>
      <Header $isDark={isDarkMode}>
        <BackBtn onClick={() => navigate(-1)} $isDark={isDarkMode}>
          <FiChevronLeft size={24} />
        </BackBtn>
        <Title $isDark={isDarkMode}>Điều khoản Mạng xã hội</Title>
      </Header>

      <Content $isDark={isDarkMode}>
        <Section>
          <SectionTitle $isDark={isDarkMode}>1. Khái niệm</SectionTitle>
          <SectionContent $isDark={isDarkMode}>
            Zyea+ là một nền tảng mạng xã hội cho phép người dùng kết nối, chia sẻ và tương tác 
            với bạn bè, gia đình và cộng đồng. Điều khoản mạng xã hội này quy định cách sử dụng 
            các tính năng cộng đồng của chúng tôi.
          </SectionContent>
        </Section>

        <Section>
          <SectionTitle $isDark={isDarkMode}>2. Hồ sơ công khai</SectionTitle>
          <SectionContent $isDark={isDarkMode}>
            Thông tin công khai trong hồ sơ của bạn có thể bao gồm:
          </SectionContent>
          <List>
            <ListItem $isDark={isDarkMode}>Tên, ảnh đại diện và ảnh bìa</ListItem>
            <ListItem $isDark={isDarkMode}>Trạng thái hoạt động</ListItem>
            <ListItem $isDark={isDarkMode}>Bài viết trên News Feed với quyền riêng tư công khai</ListItem>
            <ListItem $isDark={isDarkMode}>Danh sách bạn bè (nếu cho phép công khai)</ListItem>
          </List>
        </Section>

        <Section>
          <SectionTitle $isDark={isDarkMode}>3. Quyền riêng tư và kiểm soát nội dung</SectionTitle>
          <SectionContent $isDark={isDarkMode}>
            Bạn có quyền:
          </SectionContent>
          <List>
            <ListItem $isDark={isDarkMode}>Điều chỉnh cài đặt quyền riêng tư cho từng bài viết</ListItem>
            <ListItem $isDark={isDarkMode}>Chặn hoặc bỏ theo dõi người dùng khác</ListItem>
            <ListItem $isDark={isDarkMode}>Xóa hoặc chỉnh sửa nội dung bạn đã chia sẻ</ListItem>
            <ListItem $isDark={isDarkMode}>Báo cáo nội dung xấu hoặc người dùng vi phạm</ListItem>
          </List>
        </Section>

        <Section>
          <SectionTitle $isDark={isDarkMode}>4. News Feed và Algorithm</SectionTitle>
          <SectionContent $isDark={isDarkMode}>
            News Feed của bạn được tùy chỉnh dựa trên:
          </SectionContent>
          <List>
            <ListItem $isDark={isDarkMode}>Mối quan hệ với người đăng</ListItem>
            <ListItem $isDark={isDarkMode}>Mức độ tương tác (like, comment, share)</ListItem>
            <ListItem $isDark={isDarkMode}>Thời gian đăng bài</ListItem>
            <ListItem $isDark={isDarkMode}>Loại nội dung (ảnh, video, text)</ListItem>
          </List>
        </Section>

        <Section>
          <SectionTitle $isDark={isDarkMode}>5. Tương tác và Engagement</SectionTitle>
          <SectionContent $isDark={isDarkMode}>
            Người dùng có thể:
          </SectionContent>
          <List>
            <ListItem $isDark={isDarkMode}>Thích (like) bài viết, bình luận</ListItem>
            <ListItem $isDark={isDarkMode}>Bình luận trên bài viết của bạn bè</ListItem>
            <ListItem $isDark={isDarkMode}>Chia sẻ (share) nội dung lên News Feed</ListItem>
            <ListItem $isDark={isDarkMode}>React với emoji (love, haha, wow, sad, angry)</ListItem>
          </List>
        </Section>

        <Section>
          <SectionTitle $isDark={isDarkMode}>6. Nội dung được khuyến khích</SectionTitle>
          <SectionContent $isDark={isDarkMode}>
            Chúng tôi khuyến khích chia sẻ:
          </SectionContent>
          <List>
            <ListItem $isDark={isDarkMode}>Khoảnh khắc cá nhân tích cực</ListItem>
            <ListItem $isDark={isDarkMode}>Thông tin hữu ích và giáo dục</ListItem>
            <ListItem $isDark={isDarkMode}>Sáng tạo nội dung gốc</ListItem>
            <ListItem $isDark={isDarkMode}>Tôn trọng và hỗ trợ cộng đồng</ListItem>
          </List>
        </Section>

        <Section>
          <SectionTitle $isDark={isDarkMode}>7. Nội dung bị cấm</SectionTitle>
          <SectionContent $isDark={isDarkMode}>
            Nghiêm cấm đăng tải:
          </SectionContent>
          <List>
            <ListItem $isDark={isDarkMode}>Nội dung kỳ thị, phân biệt đối xử</ListItem>
            <ListItem $isDark={isDarkMode}>Thông tin sai sự thật gây hại</ListItem>
            <ListItem $isDark={isDarkMode}>Spam, tin nhắn tự động</ListItem>
            <ListItem $isDark={isDarkMode}>Quấy rối hoặc bắt nạt người khác</ListItem>
            <ListItem $isDark={isDarkMode}>Chia sẻ thông tin cá nhân người khác không được phép</ListItem>
          </List>
        </Section>

        <Section>
          <SectionTitle $isDark={isDarkMode}>8. Quyền kiểm duyệt nội dung</SectionTitle>
          <SectionContent $isDark={isDarkMode}>
            Zyea+ có quyền kiểm duyệt và xử lý:
          </SectionContent>
          <List>
            <ListItem $isDark={isDarkMode}>Xóa nội dung vi phạm chính sách</ListItem>
            <ListItem $isDark={isDarkMode}>Cảnh báo hoặc tạm khóa tài khoản</ListItem>
            <ListItem $isDark={isDarkMode}>Chặn IP trong trường hợp nghiêm trọng</ListItem>
          </List>
        </Section>

        <Section>
          <SectionTitle $isDark={isDarkMode}>9. Bảo vệ trẻ em</SectionTitle>
          <SectionContent $isDark={isDarkMode}>
            Chúng tôi nghiêm cấm mọi hình thức lạm dụng trẻ em. Nội dung liên quan đến 
            trẻ em sẽ được kiểm duyệt chặt chẽ và báo cáo ngay cho cơ quan chức năng nếu cần.
          </SectionContent>
        </Section>

        <Section>
          <SectionTitle $isDark={isDarkMode}>10. Spam và lừa đảo</SectionTitle>
          <SectionContent $isDark={isDarkMode}>
            Không được sử dụng dịch vụ để:
          </SectionContent>
          <List>
            <ListItem $isDark={isDarkMode}>Gửi tin nhắn spam hoặc quảng cáo không được phép</ListItem>
            <ListItem $isDark={isDarkMode}>Lừa đảo hoặc đánh cắp thông tin</ListItem>
            <ListItem $isDark={isDarkMode}>Tạo tài khoản giả mạo</ListItem>
            <ListItem $isDark={isDarkMode}>Phát tán virus hoặc malware</ListItem>
          </List>
        </Section>

        <Section>
          <SectionTitle $isDark={isDarkMode}>11. Báo cáo nội dung</SectionTitle>
          <SectionContent $isDark={isDarkMode}>
            Nếu bạn phát hiện nội dung vi phạm, vui lòng báo cáo. Chúng tôi sẽ xem xét và 
            xử lý trong vòng 24 giờ.
          </SectionContent>
        </Section>

        <Section>
          <SectionTitle $isDark={isDarkMode}>12. Cập nhật chính sách</SectionTitle>
          <SectionContent $isDark={isDarkMode}>
            Chúng tôi sẽ thông báo trước về mọi thay đổi chính sách. Việc tiếp tục sử dụng 
            dịch vụ sau thay đổi được coi là chấp nhận điều khoản mới.
          </SectionContent>
        </Section>

        <Section>
          <SectionTitle $isDark={isDarkMode}>13. Liên hệ</SectionTitle>
          <SectionContent $isDark={isDarkMode}>
            Mọi thắc mắc về điều khoản mạng xã hội, vui lòng liên hệ: 
            support@zyea.me hoặc report@zyea.me (cho báo cáo vi phạm)
          </SectionContent>
        </Section>
      </Content>
    </Container>
  );
};

export default MobileSocialTerms;

