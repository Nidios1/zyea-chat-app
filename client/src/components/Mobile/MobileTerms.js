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

const MobileTerms = () => {
  const navigate = useNavigate();
  const { isDarkMode } = useTheme();

  return (
    <Container $isDark={isDarkMode}>
      <Header $isDark={isDarkMode}>
        <BackBtn onClick={() => navigate(-1)} $isDark={isDarkMode}>
          <FiChevronLeft size={24} />
        </BackBtn>
        <Title $isDark={isDarkMode}>Điều khoản sử dụng</Title>
      </Header>

      <Content $isDark={isDarkMode}>
        <Section>
          <SectionTitle $isDark={isDarkMode}>1. Chấp nhận điều khoản</SectionTitle>
          <SectionContent $isDark={isDarkMode}>
            Bằng việc sử dụng Zyea+, bạn đồng ý tuân thủ và chịu ràng buộc bởi các điều khoản sử dụng này. 
            Nếu bạn không đồng ý với bất kỳ phần nào của điều khoản, vui lòng không sử dụng dịch vụ.
          </SectionContent>
        </Section>

        <Section>
          <SectionTitle $isDark={isDarkMode}>2. Định nghĩa dịch vụ</SectionTitle>
          <SectionContent $isDark={isDarkMode}>
            Zyea+ là một nền tảng mạng xã hội và ứng dụng nhắn tin cho phép người dùng:
          </SectionContent>
          <List>
            <ListItem $isDark={isDarkMode}>Gửi và nhận tin nhắn văn bản</ListItem>
            <ListItem $isDark={isDarkMode}>Thực hiện cuộc gọi video và audio</ListItem>
            <ListItem $isDark={isDarkMode}>Chia sẻ hình ảnh và tệp tin</ListItem>
            <ListItem $isDark={isDarkMode}>Tương tác với bạn bè qua News Feed</ListItem>
          </List>
        </Section>

        <Section>
          <SectionTitle $isDark={isDarkMode}>3. Tài khoản người dùng</SectionTitle>
          <SectionContent $isDark={isDarkMode}>
            Để sử dụng dịch vụ, bạn cần:
          </SectionContent>
          <List>
            <ListItem $isDark={isDarkMode}>Cung cấp thông tin đăng ký chính xác và đầy đủ</ListItem>
            <ListItem $isDark={isDarkMode}>Bảo mật tài khoản và mật khẩu của bạn</ListItem>
            <ListItem $isDark={isDarkMode}>Thông báo ngay cho chúng tôi nếu phát hiện bất kỳ hoạt động đáng ngờ nào</ListItem>
          </List>
        </Section>

        <Section>
          <SectionTitle $isDark={isDarkMode}>4. Quy định về nội dung</SectionTitle>
          <SectionContent $isDark={isDarkMode}>
            Bạn không được phép đăng, chia sẻ hoặc tải lên bất kỳ nội dung nào:
          </SectionContent>
          <List>
            <ListItem $isDark={isDarkMode}>Vi phạm pháp luật hoặc xâm phạm quyền của người khác</ListItem>
            <ListItem $isDark={isDarkMode}>Có tính chất bạo lực, khiêu dâm, kỳ thị</ListItem>
            <ListItem $isDark={isDarkMode}>Chứa thông tin sai lệch hoặc lừa đảo</ListItem>
            <ListItem $isDark={isDarkMode}>Xâm phạm bản quyền hoặc tài sản trí tuệ</ListItem>
          </List>
        </Section>

        <Section>
          <SectionTitle $isDark={isDarkMode}>5. Quyền và trách nhiệm</SectionTitle>
          <SectionContent $isDark={isDarkMode}>
            Zyea+ có quyền:
          </SectionContent>
          <List>
            <ListItem $isDark={isDarkMode}>Xóa hoặc chặn nội dung vi phạm</ListItem>
            <ListItem $isDark={isDarkMode}>Tạm dừng hoặc chấm dứt tài khoản vi phạm</ListItem>
            <ListItem $isDark={isDarkMode}>Thay đổi điều khoản với thông báo trước</ListItem>
          </List>
        </Section>

        <Section>
          <SectionTitle $isDark={isDarkMode}>6. Bảo mật dữ liệu</SectionTitle>
          <SectionContent $isDark={isDarkMode}>
            Chúng tôi cam kết bảo vệ thông tin cá nhân của bạn theo Chính sách Bảo mật. 
            Dữ liệu của bạn được mã hóa và bảo mật nghiêm ngặt.
          </SectionContent>
        </Section>

        <Section>
          <SectionTitle $isDark={isDarkMode}>7. Sở hữu trí tuệ</SectionTitle>
          <SectionContent $isDark={isDarkMode}>
            Tất cả nội dung trên Zyea+, bao gồm logo, hình ảnh, văn bản đều thuộc quyền sở hữu của Zyea+ 
            hoặc đối tác được cấp phép.
          </SectionContent>
        </Section>

        <Section>
          <SectionTitle $isDark={isDarkMode}>8. Giới hạn trách nhiệm</SectionTitle>
          <SectionContent $isDark={isDarkMode}>
            Zyea+ không chịu trách nhiệm đối với bất kỳ thiệt hại trực tiếp hoặc gián tiếp nào 
            phát sinh từ việc sử dụng dịch vụ.
          </SectionContent>
        </Section>

        <Section>
          <SectionTitle $isDark={isDarkMode}>9. Thay đổi điều khoản</SectionTitle>
          <SectionContent $isDark={isDarkMode}>
            Chúng tôi có thể cập nhật điều khoản này theo thời gian. Thay đổi sẽ có hiệu lực 
            sau khi được thông báo. Việc bạn tiếp tục sử dụng dịch vụ sau khi có thay đổi 
            được coi là chấp nhận điều khoản mới.
          </SectionContent>
        </Section>

        <Section>
          <SectionTitle $isDark={isDarkMode}>10. Liên hệ</SectionTitle>
          <SectionContent $isDark={isDarkMode}>
            Nếu bạn có bất kỳ câu hỏi nào về điều khoản này, vui lòng liên hệ với chúng tôi 
            qua email: support@zyea.me
          </SectionContent>
        </Section>
      </Content>
    </Container>
  );
};

export default MobileTerms;

