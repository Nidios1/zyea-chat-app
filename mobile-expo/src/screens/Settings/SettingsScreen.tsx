import React from 'react';
import { View, StyleSheet, ScrollView, Switch } from 'react-native';
import { Text, Card, Divider, useTheme } from 'react-native-paper';
import { useTheme as useAppTheme } from '../../contexts/ThemeContext';

const SettingsScreen = () => {
  const theme = useTheme();
  const { isDarkMode, toggleTheme } = useAppTheme();

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Card style={styles.card}>
        <Text style={[styles.sectionTitle, { color: theme.colors.onBackground }]}>
          Giao diện
        </Text>
        
        <View style={styles.settingItem}>
          <View>
            <Text style={[styles.settingLabel, { color: theme.colors.onBackground }]}>
              Chế độ tối
            </Text>
            <Text style={[styles.settingDescription, { color: theme.colors.onSurfaceVariant }]}>
              Chuyển đổi giữa chế độ sáng và tối
            </Text>
          </View>
          <Switch
            value={Boolean(isDarkMode)}
            onValueChange={toggleTheme}
          />
        </View>
        
        <Divider style={styles.divider} />
        
        <View style={styles.settingItem}>
          <View>
            <Text style={[styles.settingLabel, { color: theme.colors.onBackground }]}>
              Thông báo
            </Text>
            <Text style={[styles.settingDescription, { color: theme.colors.onSurfaceVariant }]}>
              Cho phép nhận thông báo
            </Text>
          </View>
          <Switch value={true} />
        </View>
        
        <Divider style={styles.divider} />
        
        <View style={styles.settingItem}>
          <View>
            <Text style={[styles.settingLabel, { color: theme.colors.onBackground }]}>
              Âm thanh tin nhắn
            </Text>
            <Text style={[styles.settingDescription, { color: theme.colors.onSurfaceVariant }]}>
              Phát âm thanh khi có tin nhắn mới
            </Text>
          </View>
          <Switch value={true} />
        </View>
      </Card>

      <Card style={styles.card}>
        <Text style={[styles.sectionTitle, { color: theme.colors.onBackground }]}>
          Quyền riêng tư
        </Text>
        
        <View style={styles.settingItem}>
          <View>
            <Text style={[styles.settingLabel, { color: theme.colors.onBackground }]}>
              Trạng thái hoạt động
            </Text>
            <Text style={[styles.settingDescription, { color: theme.colors.onSurfaceVariant }]}>
              Cho phép mọi người thấy bạn đang online
            </Text>
          </View>
          <Switch value={true} />
        </View>
      </Card>

      <Card style={styles.card}>
        <Text style={[styles.sectionTitle, { color: theme.colors.onBackground }]}>
          Ứng dụng
        </Text>
        
        <View style={styles.settingItem}>
          <Text style={[styles.settingLabel, { color: theme.colors.onBackground }]}>
            Phiên bản
          </Text>
          <Text style={[styles.settingValue, { color: theme.colors.onSurfaceVariant }]}>
            1.0.0
          </Text>
        </View>
      </Card>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  card: {
    margin: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '500',
  },
  settingDescription: {
    fontSize: 13,
    marginTop: 4,
  },
  settingValue: {
    fontSize: 14,
  },
  divider: {
    marginVertical: 8,
  },
});

export default SettingsScreen;

