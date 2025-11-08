import React from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { ProfileStackParamList } from '../../navigation/types';
import { useTheme } from '../../contexts/ThemeContext';
import { PWATheme } from '../../config/PWATheme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useUpdates } from '../../hooks/useUpdates';
import { getCurrentUpdateInfo, formatUpdateVersion } from '../../utils/updateUtils';
import { UpdateModal } from '../../components/Common/UpdateModal';
import appJson from '../../../app.json';

type AppInfoScreenNavigationProp = StackNavigationProp<ProfileStackParamList, 'AppInfo'>;

const AppInfoScreen = () => {
  const navigation = useNavigation<AppInfoScreenNavigationProp>();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const updateInfo = getCurrentUpdateInfo();
  
  const {
    checkForUpdates,
    downloadUpdate,
    isChecking,
    isDownloading,
    isUpdateAvailable,
    isUpdatePending,
    downloadProgress,
    error,
    currentVersion,
    newVersion,
    showUpdateModal,
    handleUpdate,
    handleCancel,
    handleRetry,
  } = useUpdates({
    checkOnMount: false,
    autoDownload: false,
  });

  const handleCheckUpdate = async () => {
    try {
      await checkForUpdates();
    } catch (error) {
      Alert.alert('Lỗi', 'Không thể kiểm tra cập nhật. Vui lòng thử lại sau.');
    }
  };

  const handleDownloadAndUpdate = async () => {
    try {
      await downloadUpdate();
    } catch (error) {
      Alert.alert('Lỗi', 'Không thể tải cập nhật. Vui lòng thử lại sau.');
    }
  };

  const handleUpdatePress = () => {
    handleUpdate();
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
          Thông tin ứng dụng
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
        {/* App Version Info */}
        <View style={[dynamicStyles.section, { backgroundColor: colors.surface }]}>
          <Text style={[dynamicStyles.sectionTitle, { color: colors.text }]}>
            Thông tin phiên bản
          </Text>

          <View style={dynamicStyles.infoRow}>
            <Text style={[dynamicStyles.infoLabel, { color: colors.textSecondary }]}>
              Phiên bản ứng dụng
            </Text>
            <Text style={[dynamicStyles.infoValue, { color: colors.text }]}>
              {appJson.expo.version}
            </Text>
          </View>

          {updateInfo.isEnabled && currentVersion && (
            <>
              <View style={dynamicStyles.divider} />
              <View style={dynamicStyles.infoRow}>
                <Text style={[dynamicStyles.infoLabel, { color: colors.textSecondary }]}>
                  Update ID hiện tại
                </Text>
                <Text style={[dynamicStyles.infoValue, { color: colors.text }]}>
                  {formatUpdateVersion(currentVersion)}
                </Text>
              </View>
            </>
          )}

          {updateInfo.isEnabled && newVersion && isUpdateAvailable && (
            <>
              <View style={dynamicStyles.divider} />
              <View style={dynamicStyles.infoRow}>
                <Text style={[dynamicStyles.infoLabel, { color: colors.textSecondary }]}>
                  Update ID mới
                </Text>
                <Text style={[dynamicStyles.infoValue, { color: colors.primary }]}>
                  {formatUpdateVersion(newVersion)}
                </Text>
              </View>
            </>
          )}

          {updateInfo.isEnabled && updateInfo.runtimeVersion && (
            <>
              <View style={dynamicStyles.divider} />
              <View style={dynamicStyles.infoRow}>
                <Text style={[dynamicStyles.infoLabel, { color: colors.textSecondary }]}>
                  Runtime Version
                </Text>
                <Text style={[dynamicStyles.infoValue, { color: colors.text }]}>
                  {updateInfo.runtimeVersion}
                </Text>
              </View>
            </>
          )}

          {updateInfo.isEnabled && updateInfo.channel && (
            <>
              <View style={dynamicStyles.divider} />
              <View style={dynamicStyles.infoRow}>
                <Text style={[dynamicStyles.infoLabel, { color: colors.textSecondary }]}>
                  Channel
                </Text>
                <Text style={[dynamicStyles.infoValue, { color: colors.text }]}>
                  {updateInfo.channel}
                </Text>
              </View>
            </>
          )}
        </View>

        {/* OTA Update Section */}
        {updateInfo.isEnabled ? (
          <View style={[dynamicStyles.section, { backgroundColor: colors.surface }]}>
            <Text style={[dynamicStyles.sectionTitle, { color: colors.text }]}>
              Cập nhật OTA (Live Update)
            </Text>
            <Text style={[dynamicStyles.sectionDescription, { color: colors.textSecondary }]}>
              Cập nhật ứng dụng mà không cần tải lại từ App Store/Play Store
            </Text>

            <View style={dynamicStyles.updateStatus}>
              {isUpdateAvailable ? (
                <View style={[dynamicStyles.statusBadge, { backgroundColor: colors.primary + '20' }]}>
                  <MaterialCommunityIcons name="update" size={16} color={colors.primary} />
                  <Text style={[dynamicStyles.statusText, { color: colors.primary }]}>
                    Có phiên bản mới
                  </Text>
                </View>
              ) : (
                <View style={[dynamicStyles.statusBadge, { backgroundColor: colors.textSecondary + '20' }]}>
                  <MaterialCommunityIcons name="check-circle" size={16} color={colors.textSecondary} />
                  <Text style={[dynamicStyles.statusText, { color: colors.textSecondary }]}>
                    Đã cập nhật mới nhất
                  </Text>
                </View>
              )}
            </View>

            {error && (
              <View style={[dynamicStyles.errorContainer, { backgroundColor: (colors.error || '#ff4444') + '20' }]}>
                <MaterialCommunityIcons name="alert-circle" size={16} color={colors.error || '#ff4444'} />
                <Text style={[dynamicStyles.errorText, { color: colors.error || '#ff4444' }]}>
                  {error}
                </Text>
              </View>
            )}

            {isDownloading && (
              <View style={dynamicStyles.progressContainer}>
                <ActivityIndicator size="small" color={colors.primary} />
                <Text style={[dynamicStyles.progressText, { color: colors.textSecondary }]}>
                  Đang tải cập nhật... {downloadProgress > 0 ? `${downloadProgress}%` : ''}
                </Text>
              </View>
            )}

            <View style={dynamicStyles.buttonContainer}>
              <TouchableOpacity
                style={[
                  dynamicStyles.updateButton,
                  {
                    backgroundColor: isUpdateAvailable ? colors.primary : colors.border,
                    opacity: isChecking || isDownloading ? 0.6 : 1,
                  },
                ]}
                onPress={isUpdateAvailable ? handleDownloadAndUpdate : handleCheckUpdate}
                disabled={isChecking || isDownloading}
              >
                {isChecking || isDownloading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <MaterialCommunityIcons
                    name={isUpdateAvailable ? 'download' : 'refresh'}
                    size={20}
                    color="#fff"
                  />
                )}
                <Text style={dynamicStyles.updateButtonText}>
                  {isChecking
                    ? 'Đang kiểm tra...'
                    : isDownloading
                    ? 'Đang tải...'
                    : isUpdateAvailable
                    ? 'Tải và cập nhật'
                    : 'Kiểm tra cập nhật'}
                </Text>
              </TouchableOpacity>

              {error && (
                <TouchableOpacity
                  style={[dynamicStyles.retryButton, { borderColor: colors.primary }]}
                  onPress={handleRetry}
                >
                  <Text style={[dynamicStyles.retryButtonText, { color: colors.primary }]}>
                    Thử lại
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        ) : (
          <View style={[dynamicStyles.section, { backgroundColor: colors.surface }]}>
            <Text style={[dynamicStyles.sectionTitle, { color: colors.text }]}>
              Cập nhật OTA
            </Text>
            <Text style={[dynamicStyles.sectionDescription, { color: colors.textSecondary }]}>
              OTA Updates không khả dụng trong chế độ development
            </Text>
          </View>
        )}

        {/* App Info */}
        <View style={[dynamicStyles.section, { backgroundColor: colors.surface }]}>
          <Text style={[dynamicStyles.sectionTitle, { color: colors.text }]}>
            Thông tin ứng dụng
          </Text>
          <Text style={[dynamicStyles.sectionDescription, { color: colors.textSecondary }]}>
            Ứng dụng được phát triển với React Native và Expo. Cập nhật OTA cho phép cập nhật ứng dụng mà không cần phát hành lại trên App Store/Play Store.
          </Text>
        </View>
      </ScrollView>

      {/* Update Modal */}
      <UpdateModal
        visible={showUpdateModal || isUpdatePending}
        onUpdate={handleUpdatePress}
        onCancel={handleCancel}
        onRetry={handleRetry}
        title="Có phiên bản mới"
        message="Ứng dụng sẽ được khởi động lại để áp dụng cập nhật."
        updateButtonText="Cập nhật ngay"
        isDownloading={isDownloading}
        downloadProgress={downloadProgress}
        error={error}
      />
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
    marginBottom: 12,
  },
  sectionDescription: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  infoLabel: {
    fontSize: 15,
    flex: 1,
  },
  infoValue: {
    fontSize: 15,
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 8,
  },
  updateStatus: {
    marginBottom: 16,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  statusText: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 6,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorText: {
    fontSize: 13,
    marginLeft: 6,
    flex: 1,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  progressText: {
    fontSize: 14,
    marginLeft: 8,
  },
  buttonContainer: {
    gap: 12,
  },
  updateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    gap: 8,
  },
  updateButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  retryButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  retryButtonText: {
    fontSize: 15,
    fontWeight: '500',
  },
});

export default AppInfoScreen;

