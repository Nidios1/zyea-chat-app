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

type InterfaceSettingsScreenNavigationProp = StackNavigationProp<ProfileStackParamList>;

type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeModeOption {
  id: ThemeMode;
  icon: string;
  title: string;
  description: string;
}

const InterfaceSettingsScreen = () => {
  const navigation = useNavigation<InterfaceSettingsScreenNavigationProp>();
  const { colors, themeMode, setThemeMode } = useTheme();

  const themeModes: ThemeModeOption[] = [
    {
      id: 'light',
      icon: 'white-balance-sunny',
      title: 'Sáng',
      description: 'Luôn sử dụng chế độ sáng',
    },
    {
      id: 'dark',
      icon: 'weather-night',
      title: 'Tối',
      description: 'Luôn sử dụng chế độ tối',
    },
    {
      id: 'system',
      icon: 'cellphone',
      title: 'Hệ thống',
      description: 'Tự động theo thiết bị',
    },
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <MaterialCommunityIcons name="chevron-left" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>Giao diện</Text>
        <View style={styles.headerRight} />
      </View>

      {/* Content */}
      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
            Lựa chọn theme
          </Text>
          
          <View style={[styles.themeModeCard, { backgroundColor: colors.surface }]}>
            {themeModes.map((mode, index) => {
              const isSelected = themeMode === mode.id;
              const isLast = index === themeModes.length - 1;

              return (
                <TouchableOpacity
                  key={mode.id}
                  style={[
                    styles.themeModeOption,
                    !isLast && { borderBottomWidth: 1, borderBottomColor: colors.border },
                  ]}
                  onPress={() => setThemeMode(mode.id)}
                >
                  <View style={styles.themeModeLeft}>
                    <View style={[styles.themeModeIcon, { backgroundColor: isSelected ? colors.primary + '20' : 'transparent' }]}>
                      <MaterialCommunityIcons
                        name={mode.icon as any}
                        size={24}
                        color={isSelected ? colors.primary : colors.textSecondary}
                      />
                    </View>
                    <View style={styles.themeModeText}>
                      <Text style={[styles.themeModeTitle, { color: colors.text }]}>
                        {mode.title}
                      </Text>
                      <Text style={[styles.themeModeDescription, { color: colors.textSecondary }]}>
                        {mode.description}
                      </Text>
                    </View>
                  </View>
                  {isSelected && (
                    <MaterialCommunityIcons
                      name="check-circle"
                      size={24}
                      color={colors.primary}
                    />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
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
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
    backgroundColor: 'transparent',
  },
  backButton: {
    padding: 8,
    backgroundColor: 'transparent',
  },
  title: {
    fontSize: 17,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
    marginRight: 40,
  },
  headerRight: {
    width: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  themeModeCard: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  themeModeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  themeModeLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  themeModeIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  themeModeText: {
    flex: 1,
  },
  themeModeTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  themeModeDescription: {
    fontSize: 13,
  },
});

export default InterfaceSettingsScreen;

