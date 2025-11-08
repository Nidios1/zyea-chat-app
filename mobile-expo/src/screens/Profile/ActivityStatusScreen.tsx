import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Switch,
} from 'react-native';
import { Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { ProfileStackParamList } from '../../navigation/types';
import { useTheme } from '../../contexts/ThemeContext';
import { PWATheme } from '../../config/PWATheme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';

type ActivityStatusScreenNavigationProp = StackNavigationProp<ProfileStackParamList, 'ActivityStatus'>;

const ActivityStatusScreen = () => {
  const navigation = useNavigation<ActivityStatusScreenNavigationProp>();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [isEnabled, setIsEnabled] = useState(true);

  React.useEffect(() => {
    const loadActivityStatus = async () => {
      try {
        const saved = await AsyncStorage.getItem('activityStatusEnabled');
        if (saved !== null) {
          setIsEnabled(saved === 'true');
        }
      } catch (error) {
        console.error('Error loading activity status:', error);
      }
    };
    loadActivityStatus();
  }, []);

  const handleToggle = async (value: boolean) => {
    try {
      await AsyncStorage.setItem('activityStatusEnabled', value.toString());
      setIsEnabled(value);
    } catch (error) {
      console.error('Error saving activity status:', error);
    }
  };

  const dynamicStyles = createStyles(colors);

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
          Trạng thái hoạt động
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
        <View style={[dynamicStyles.section, { backgroundColor: colors.surface }]}>
          <View style={dynamicStyles.toggleRow}>
            <View style={dynamicStyles.toggleLeft}>
              <Text style={[dynamicStyles.toggleLabel, { color: colors.text }]}>
                Hiển thị trạng thái hoạt động
              </Text>
              <Text style={[dynamicStyles.toggleDescription, { color: colors.textSecondary }]}>
                Cho phép bạn bè xem khi bạn đang hoạt động
              </Text>
            </View>
            <Switch
              value={isEnabled}
              onValueChange={handleToggle}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={isEnabled ? '#fff' : colors.textSecondary}
              ios_backgroundColor={colors.border}
            />
          </View>
        </View>

        <View style={[dynamicStyles.section, { backgroundColor: colors.surface }]}>
          <Text style={[dynamicStyles.sectionTitle, { color: colors.text }]}>
            Thông tin
          </Text>
          <Text style={[dynamicStyles.sectionDescription, { color: colors.textSecondary }]}>
            Khi bật, bạn bè của bạn sẽ thấy khi bạn đang hoạt động trên ứng dụng. Bạn có thể tắt tính năng này bất cứ lúc nào.
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
    backgroundColor: 'transparent',
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
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 15,
    lineHeight: 22,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  toggleLeft: {
    flex: 1,
    marginRight: 16,
  },
  toggleLabel: {
    fontSize: 16,
    fontWeight: '400',
    marginBottom: 4,
  },
  toggleDescription: {
    fontSize: 13,
    lineHeight: 18,
  },
});

export default ActivityStatusScreen;

