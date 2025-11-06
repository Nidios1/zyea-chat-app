import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Switch, ActivityIndicator } from 'react-native';
import { Text, Card, Divider, useTheme, Button } from 'react-native-paper';
import { useTheme as useAppTheme } from '../../contexts/ThemeContext';
import { useUpdates } from '../../hooks/useUpdates';
import { getCurrentUpdateInfo, formatUpdateVersion } from '../../utils/updateUtils';
import { UpdateModal } from '../../components/Common/UpdateModal';
import appJson from '../../../app.json';

const SettingsScreen = () => {
  const theme = useTheme();
  const { isDarkMode, toggleTheme } = useAppTheme();
  const { checkForUpdates, isChecking, isUpdateAvailable, currentVersion } = useUpdates({
    checkOnMount: false, // Không tự động check trong settings
    autoDownload: false,
  });
  
  const updateInfo = getCurrentUpdateInfo();
  const [showTestModal, setShowTestModal] = useState(false);

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
            {appJson.expo.version}
          </Text>
        </View>

        <Divider style={styles.divider} />

        {/* OTA Updates Section */}
        {updateInfo.isEnabled && (
          <>
            <View style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <Text style={[styles.settingLabel, { color: theme.colors.onBackground }]}>
                  Cập nhật tự động
                </Text>
                <Text style={[styles.settingDescription, { color: theme.colors.onSurfaceVariant }]}>
                  {isUpdateAvailable ? 'Có phiên bản mới' : 'Đã cập nhật mới nhất'}
                </Text>
              </View>
            </View>

            {currentVersion && (
              <View style={styles.settingItem}>
                <Text style={[styles.settingLabel, { color: theme.colors.onBackground }]}>
                  Update ID
                </Text>
                <Text style={[styles.settingValue, { color: theme.colors.onSurfaceVariant, fontSize: 11 }]}>
                  {formatUpdateVersion(currentVersion)}
                </Text>
              </View>
            )}

            <Divider style={styles.divider} />

            <View style={styles.updateActions}>
              <Button
                mode="outlined"
                onPress={checkForUpdates}
                disabled={isChecking}
                style={styles.checkButton}
                icon={isChecking ? () => <ActivityIndicator size="small" color={theme.colors.primary} /> : undefined}
              >
                {isChecking ? 'Đang kiểm tra...' : 'Kiểm tra cập nhật'}
              </Button>
            </View>
          </>
        )}

        {!updateInfo.isEnabled && (
          <>
            <View style={styles.settingItem}>
              <Text style={[styles.settingDescription, { color: theme.colors.onSurfaceVariant }]}>
                OTA Updates không khả dụng trong chế độ development
              </Text>
            </View>
            
            <Divider style={styles.divider} />
            
            {/* Button test UpdateModal UI */}
            <View style={styles.updateActions}>
              <Button
                mode="contained"
                onPress={() => setShowTestModal(true)}
                style={styles.testButton}
                buttonColor="#FF8C00"
              >
                🧪 Test Update Modal UI
              </Button>
            </View>
          </>
        )}
      </Card>
      
      {/* Test UpdateModal */}
      <UpdateModal
        visible={showTestModal}
        onUpdate={() => setShowTestModal(false)}
        title="Ứng dụng đã có phiên bản mới"
        message="Bạn vui lòng cập nhật Ứng dụng lên phiên bản mới nhất. Nếu không cập nhật, Bạn sẽ không chạy được phiên bản hiện tại trên điện thoại"
        updateButtonText="Cập nhật"
      />
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
  settingInfo: {
    flex: 1,
  },
  updateActions: {
    marginTop: 8,
  },
  checkButton: {
    marginTop: 8,
  },
  testButton: {
    marginTop: 8,
  },
});

export default SettingsScreen;

