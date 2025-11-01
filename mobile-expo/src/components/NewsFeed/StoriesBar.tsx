import React from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  Image,
  StyleSheet,
} from 'react-native';
import { Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme as useAppTheme } from '../../contexts/ThemeContext';
const MOCK_STORIES = [
  {
    id: 'me',
    avatar:
      'https://randomuser.me/api/portraits/men/1.jpg', // Change for your data
    fullName: 'Tin của bạn',
    isMe: true,
    hasStory: false,
  },
  {
    id: '1',
    avatar:
      'https://randomuser.me/api/portraits/women/45.jpg',
    fullName: 'Minh Anh',
    hasStory: true,
  },
  {
    id: '2',
    avatar:
      'https://randomuser.me/api/portraits/men/22.jpg',
    fullName: 'Voldem',
    hasStory: true,
    seen: true,
  },
  {
    id: '3',
    avatar:
      'https://randomuser.me/api/portraits/women/40.jpg',
    fullName: 'Lyxinh.05',
    hasStory: true,
    seen: false,
  },
  {
    id: '4',
    avatar: '',
    fullName: 'ngan794204',
    hasStory: false,
  },
];

const StoriesBar = ({ onPressStory, onAddStory }: any) => {
  const { colors } = useAppTheme();
  return (
    <View style={[styles.container, { backgroundColor: colors.surface }] }>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollView}>
        {MOCK_STORIES.map((story, idx) => (
          <View style={styles.storyWrapper} key={story.id}>
            <TouchableOpacity
              onPress={() => {
                if (story.isMe) onAddStory?.();
                else onPressStory?.(story);
              }}
              style={styles.storyTouchable}
              activeOpacity={0.85}
            >
              <View
                style={[
                  styles.avatarBorder,
                  story.isMe
                    ? { borderColor: colors.border }
                    : story.hasStory && !story.seen
                    ? styles.activeBorder
                    : { borderColor: colors.border },
                ]}
              >
                {story.avatar ? (
                  <Image
                    source={{ uri: story.avatar }}
                    style={styles.avatar}
                    resizeMode="cover"
                  />
                ) : (
                  <MaterialCommunityIcons name="account" size={36} color={colors.textSecondary} style={styles.avatar} />
                )}
                {story.isMe && (
                  <View style={[styles.plusButton, { borderColor: colors.surface }] }>
                    <MaterialCommunityIcons name="plus-circle" size={22} color="#318bfb" />
                  </View>
                )}
              </View>
              <Text numberOfLines={1} style={[styles.label, { color: colors.text }]}>
                {story.fullName}
              </Text>
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 10,
  },
  scrollView: {
    paddingHorizontal: 10,
  },
  storyWrapper: {
    alignItems: 'center',
    width: 72,
    marginRight: 10,
  },
  storyTouchable: {
    alignItems: 'center',
  },
  avatarBorder: {
    width: 60,
    height: 60,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2.5,
    marginBottom: 4,
    position: 'relative',
  },
  activeBorder: {
    borderColor: '#d6249f',
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#2a2a2a',
  },
  plusButton: {
    position: 'absolute',
    right: -6,
    bottom: -6,
    backgroundColor: '#fff',
    borderRadius: 24,
    borderWidth: 2,
  },
  label: {
    fontSize: 13,
    maxWidth: 60,
    textAlign: 'center',
  },
});

export default StoriesBar;
