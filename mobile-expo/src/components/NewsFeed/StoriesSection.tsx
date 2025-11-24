import React from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  Image,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { Text, Avatar } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme as useAppTheme } from '../../contexts/ThemeContext';
import { getAvatarURL, getInitials } from '../../utils/imageUtils';
import { useAuth } from '../../contexts/AuthContext';

interface Story {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  storyImage?: string;
  hasUnseen?: boolean;
}

interface StoriesSectionProps {
  stories?: Story[];
  onPressStory?: (story: Story) => void;
  onCreateStory?: () => void;
}

const StoriesSection: React.FC<StoriesSectionProps> = ({
  stories = [],
  onPressStory,
  onCreateStory,
}) => {
  const { colors, isDarkMode } = useAppTheme();
  const { user } = useAuth();
  const screenWidth = Dimensions.get('window').width;
  const storyWidth = (screenWidth - 24) / 4; // 4 stories visible, với padding

  const styles = createStyles(colors, storyWidth);

  // Card đầu tiên: Tạo tin
  const renderCreateStoryCard = () => (
    <TouchableOpacity
      style={styles.storyCard}
      onPress={() => {
        console.log('Create story pressed');
        onCreateStory?.();
      }}
      activeOpacity={0.8}
    >
      <View style={styles.storyImageContainer}>
        {user?.avatar_url ? (
          <Image
            source={{ uri: getAvatarURL(user.avatar_url) }}
            style={styles.storyImage}
            resizeMode="cover"
          />
        ) : (
          <View style={[styles.storyImage, { backgroundColor: colors.primary || '#1877F2' }]}>
            <Text style={styles.storyImageText}>
              {getInitials(user?.full_name || user?.username || 'U')}
            </Text>
          </View>
        )}
        {/* Gradient overlay ở dưới */}
        <View style={styles.storyGradientOverlay} pointerEvents="none" />
        {/* Nút + ở giữa */}
        <View style={[styles.createStoryButton, { backgroundColor: colors.primary || '#1877F2' }]} pointerEvents="none">
          <MaterialCommunityIcons name="plus" size={20} color="#FFFFFF" />
        </View>
      </View>
      <Text style={[styles.storyLabel, { color: colors.text }]} numberOfLines={1}>
        Tạo tin
      </Text>
    </TouchableOpacity>
  );

  // Card story của user khác
  const renderStoryCard = (story: Story, index: number) => (
    <TouchableOpacity
      key={story.id || index}
      style={styles.storyCard}
      onPress={() => onPressStory?.(story)}
      activeOpacity={0.8}
    >
      <View style={styles.storyImageContainer}>
        {story.storyImage ? (
          <Image
            source={{ uri: story.storyImage }}
            style={styles.storyImage}
            resizeMode="cover"
          />
        ) : (
          <View style={[styles.storyImage, { backgroundColor: colors.border || '#E4E6EB' }]} />
        )}
        {/* Gradient overlay ở dưới */}
        <View style={styles.storyGradientOverlay} />
        {/* Avatar nhỏ ở trên */}
        <View style={[styles.storyAvatarContainer, { borderColor: story.hasUnseen ? '#1877F2' : colors.border || '#E0E0E0' }]}>
          {story.userAvatar ? (
            <Image
              source={{ uri: getAvatarURL(story.userAvatar) }}
              style={styles.storyAvatar}
              resizeMode="cover"
            />
          ) : (
            <View style={[styles.storyAvatar, { backgroundColor: colors.primary || '#1877F2' }]}>
              <Text style={styles.storyAvatarText}>
                {getInitials(story.userName)}
              </Text>
            </View>
          )}
        </View>
      </View>
      <Text style={[styles.storyLabel, { color: colors.text }]} numberOfLines={1}>
        {story.userName}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background || (isDarkMode ? '#1a1a1a' : '#f8f9fa') }]}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {renderCreateStoryCard()}
        {stories.map((story, index) => renderStoryCard(story, index))}
      </ScrollView>
    </View>
  );
};

const createStyles = (colors: any, storyWidth: number) => StyleSheet.create({
  container: {
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border || '#E4E6EB',
  },
  scrollContent: {
    paddingHorizontal: 12,
    gap: 8,
  },
  storyCard: {
    width: storyWidth,
    alignItems: 'center',
  },
  storyImageContainer: {
    width: storyWidth,
    height: storyWidth * 1.6, // Tỷ lệ 1:1.6 giống Facebook
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 6,
    position: 'relative',
    backgroundColor: colors.border || '#E4E6EB',
  },
  storyImage: {
    width: '100%',
    height: '100%',
  },
  storyImageText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '600',
  },
  storyGradientOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '40%',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  createStoryButton: {
    position: 'absolute',
    bottom: 8,
    left: '50%',
    marginLeft: -18,
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  storyAvatarContainer: {
    position: 'absolute',
    top: 8,
    left: 8,
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2.5,
    padding: 2,
    backgroundColor: '#FFFFFF',
  },
  storyAvatar: {
    width: '100%',
    height: '100%',
    borderRadius: 16,
  },
  storyAvatarText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 32,
  },
  storyLabel: {
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
    maxWidth: storyWidth,
  },
});

export default StoriesSection;

