import React from 'react';
import styled from 'styled-components';
import { FiMessageCircle, FiUsers } from 'react-icons/fi';
import { getAvatarURL } from '../../utils/imageUtils';

const WelcomeContainer = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  background: ${props => props.$isDark ? '#1a1a1a' : '#f5f5f5'};
  overflow-y: auto;
  padding: 2rem;
`;

const WelcomeBanner = styled.div`
  display: flex;
  align-items: center;
  gap: 1.5rem;
  margin-bottom: 3rem;
  padding: 1.5rem;
  background: ${props => props.$isDark ? '#2a2a2a' : '#ffffff'};
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
`;

const BannerImage = styled.div`
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: ${props => props.$color || '#0068ff'};
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  color: white;
  font-size: 1.5rem;
  flex-shrink: 0;
  overflow: hidden;
  
  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;

const BannerText = styled.div`
  flex: 1;
`;

const WelcomeTitle = styled.h1`
  margin: 0 0 0.5rem 0;
  font-size: 1.5rem;
  font-weight: 700;
  color: ${props => props.$isDark ? '#fff' : '#111'};
`;

const UserName = styled.h2`
  margin: 0 0 0.5rem 0;
  font-size: 2rem;
  font-weight: 700;
  color: ${props => props.$isDark ? '#fff' : '#111'};
`;

const WelcomeSlogan = styled.p`
  margin: 0;
  font-size: 1rem;
  color: ${props => props.$isDark ? '#aaa' : '#666'};
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const CardsContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1.5rem;
  max-width: 900px;
  margin: 0 auto;
  width: 100%;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const Card = styled.div`
  background: ${props => props.$isDark ? '#2a2a2a' : '#ffffff'};
  border-radius: 12px;
  padding: 2rem;
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
  display: flex;
  flex-direction: column;
  transition: transform 0.2s ease, box-shadow 0.2s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
  }
`;

const CardIcon = styled.div`
  width: 80px;
  height: 80px;
  border-radius: 12px;
  background: ${props => props.$isDark ? '#333' : '#f5f5f5'};
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 1.5rem;
  color: ${props => props.$isDark ? '#888' : '#999'};
  
  svg {
    width: 40px;
    height: 40px;
  }
`;

const CardTitle = styled.h3`
  margin: 0 0 0.75rem 0;
  font-size: 1.25rem;
  font-weight: 700;
  color: ${props => props.$isDark ? '#fff' : '#111'};
`;

const CardDescription = styled.p`
  margin: 0 0 1.5rem 0;
  font-size: 14px;
  color: ${props => props.$isDark ? '#aaa' : '#666'};
  line-height: 1.6;
  flex: 1;
`;

const AvatarsRow = styled.div`
  display: flex;
  gap: 0.5rem;
  margin-top: auto;
`;

const AvatarCircle = styled.div`
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: ${props => props.$color || '#0068ff'};
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  color: white;
  font-size: 12px;
  flex-shrink: 0;
  overflow: hidden;
  
  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;

const CreateButton = styled.button`
  width: 100%;
  padding: 0.75rem 1.5rem;
  background: #0068ff;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  margin-top: auto;

  &:hover {
    background: #0056cc;
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0, 104, 255, 0.3);
  }

  &:active {
    transform: translateY(0);
  }
`;

const WelcomeScreen = ({ user, isDarkMode, onNewChat, onCreateGroup }) => {
  const getAvatarColor = (name) => {
    const colors = ['#0068ff', '#e74c3c', '#2ecc71', '#f39c12', '#9b59b6', '#1abc9c'];
    const index = name?.charCodeAt(0) % colors.length || 0;
    return colors[index];
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  // Sample avatars for the first card
  const sampleAvatars = ['A', '👤', '🐕', '🔴', '🏞️', '💬'].slice(0, 6);

  return (
    <WelcomeContainer $isDark={isDarkMode}>
      <WelcomeBanner $isDark={isDarkMode}>
        <BannerImage $color={getAvatarColor(user?.full_name || user?.username)}>
          {user?.avatar_url ? (
            <img src={getAvatarURL(user.avatar_url)} alt={user.full_name} />
          ) : (
            getInitials(user?.full_name || user?.username || 'U')
          )}
        </BannerImage>
        <BannerText>
          <WelcomeTitle $isDark={isDarkMode}>Chào mừng !</WelcomeTitle>
          <UserName $isDark={isDarkMode}>
            {user?.full_name || user?.fullName || user?.username || 'Người dùng'}
          </UserName>
          <WelcomeSlogan $isDark={isDarkMode}>
            Zyea+, cùng tạo nhịp thành công 🤓 💼 🚀 🤗
          </WelcomeSlogan>
        </BannerText>
      </WelcomeBanner>

      <CardsContainer>
        <Card $isDark={isDarkMode}>
          <CardIcon $isDark={isDarkMode}>
            <FiMessageCircle />
          </CardIcon>
          <CardTitle $isDark={isDarkMode}>Trò chuyện dễ dàng</CardTitle>
          <CardDescription $isDark={isDarkMode}>
            Tìm kiếm và bắt đầu trò chuyện ngay cùng đồng nghiệp
          </CardDescription>
          <AvatarsRow>
            {sampleAvatars.map((avatar, index) => (
              <AvatarCircle 
                key={index} 
                $color={getAvatarColor(avatar)}
                style={{ fontSize: avatar.length > 1 ? '16px' : '12px' }}
              >
                {avatar}
              </AvatarCircle>
            ))}
          </AvatarsRow>
        </Card>

        <Card $isDark={isDarkMode}>
          <CardIcon $isDark={isDarkMode}>
            <FiUsers />
          </CardIcon>
          <CardTitle $isDark={isDarkMode}>Làm việc nhóm hiệu quả</CardTitle>
          <CardDescription $isDark={isDarkMode}>
            Bắt đầu cuộc trò chuyện với nhiều thành viên bằng cách tạo nhóm
          </CardDescription>
          <CreateButton onClick={onCreateGroup || onNewChat}>
            Tạo ngay
          </CreateButton>
        </Card>
      </CardsContainer>
    </WelcomeContainer>
  );
};

export default WelcomeScreen;

