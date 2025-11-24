import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Platform,
  Dimensions,
  ActivityIndicator,
  TextInput,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { launchImageLibrary, launchCamera } from '../../utils/imagePicker';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useAlert } from '../../hooks/useAlert';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme as useAppTheme } from '../../contexts/ThemeContext';
import { PWATheme } from '../../config/PWATheme';
import { useTabBar } from '../../contexts/TabBarContext';
import * as MediaLibrary from 'expo-media-library';

const screenWidth = Dimensions.get('window').width;
const numColumns = 3;
const imageSize = (screenWidth - 24) / numColumns; // 12 padding mỗi bên

interface MediaAsset {
  id: string;
  uri: string;
  type: 'photo' | 'video';
  duration?: number;
}

const CreateStoryScreen = () => {
  const navigation = useNavigation();
  const { user } = useAuth();
  const { colors, isDarkMode } = useAppTheme();
  const { showAlert, AlertComponent } = useAlert();
  const { setIsVisible } = useTabBar();
  
  const [selectedMedia, setSelectedMedia] = useState<MediaAsset[]>([]);
  const [galleryAssets, setGalleryAssets] = useState<MediaAsset[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedAlbum, setSelectedAlbum] = useState<string>('Thư viện ảnh');
  const [multiSelectMode, setMultiSelectMode] = useState(false);
  const [contentType, setContentType] = useState<'text' | 'music' | 'boomerang' | 'more'>('text');

  // Ẩn bottom tab bar khi vào màn hình CreateStory
  useFocusEffect(
    React.useCallback(() => {
      setIsVisible(false);
      return () => {
        setIsVisible(true);
      };
    }, [setIsVisible])
  );

  // Request permissions và load gallery
  useEffect(() => {
    loadGallery();
  }, []);

  const loadGallery = async () => {
    try {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        showAlert('Thông báo', 'Cần cấp quyền truy cập thư viện ảnh');
        return;
      }

      setLoading(true);
      const assets = await MediaLibrary.getAssetsAsync({
        mediaType: [MediaLibrary.MediaType.photo, MediaLibrary.MediaType.video],
        sortBy: MediaLibrary.SortBy.creationTime,
        first: 100,
      });

      // Lấy localUri cho mỗi asset để tránh lỗi ph:// URL
      const mediaAssetsPromises = assets.assets.map(async (asset) => {
        try {
          const assetInfo = await MediaLibrary.getAssetInfoAsync(asset, {
            shouldDownloadFromNetwork: false,
          });
          return {
            id: asset.id,
            uri: assetInfo.localUri || assetInfo.uri || asset.uri,
            type: asset.mediaType === MediaLibrary.MediaType.video ? 'video' : 'photo',
            duration: asset.duration,
          };
        } catch (err) {
          // Fallback nếu không lấy được localUri
          return {
            id: asset.id,
            uri: asset.uri,
            type: asset.mediaType === MediaLibrary.MediaType.video ? 'video' : 'photo',
            duration: asset.duration,
          };
        }
      });

      const mediaAssets = await Promise.all(mediaAssetsPromises);
      setGalleryAssets(mediaAssets);
    } catch (error) {
      console.error('Error loading gallery:', error);
      showAlert('Lỗi', 'Không thể tải thư viện ảnh');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectMedia = (asset: MediaAsset) => {
    if (multiSelectMode) {
      const isSelected = selectedMedia.some((m) => m.id === asset.id);
      if (isSelected) {
        setSelectedMedia(selectedMedia.filter((m) => m.id !== asset.id));
      } else {
        setSelectedMedia([...selectedMedia, asset]);
      }
    } else {
      // Single select - navigate to story editor
      handleCreateStory([asset]);
    }
  };

  const handleCreateStory = async (media: MediaAsset[]) => {
    if (media.length === 0) {
      showAlert('Thông báo', 'Vui lòng chọn ít nhất một ảnh hoặc video');
      return;
    }

    // TODO: Navigate to story editor screen với media đã chọn
    console.log('Create story with media:', media);
    // Tạm thời quay lại
    navigation.goBack();
  };

  const handleTakePhoto = async () => {
    try {
      const response = await launchCamera({
        mediaType: 'photo',
        quality: 0.8,
      });
      if (response.assets && response.assets.length > 0) {
        const asset: MediaAsset = {
          id: Date.now().toString(),
          uri: response.assets[0].uri!,
          type: 'photo',
        };
        handleCreateStory([asset]);
      }
    } catch (error) {
      console.log('Error taking photo:', error);
    }
  };

  const handlePickFromLibrary = async () => {
    try {
      const response = await launchImageLibrary({
        mediaType: 'mixed',
        quality: 0.8,
        selectionLimit: multiSelectMode ? 10 : 1,
      });
      if (response.assets) {
        const media: MediaAsset[] = response.assets.map((asset) => ({
          id: asset.uri || Date.now().toString(),
          uri: asset.uri!,
          type: asset.type === 'video' ? 'video' : 'photo',
        }));
        if (multiSelectMode) {
          setSelectedMedia([...selectedMedia, ...media]);
        } else {
          handleCreateStory(media);
        }
      }
    } catch (error) {
      console.log('Error picking from library:', error);
    }
  };

  const renderMediaItem = ({ item }: { item: MediaAsset }) => {
    const isSelected = selectedMedia.some((m) => m.id === item.id);
    
    return (
      <TouchableOpacity
        style={styles.mediaItem}
        onPress={() => handleSelectMedia(item)}
        activeOpacity={0.8}
      >
        <Image
          source={{ uri: item.uri }}
          style={styles.mediaThumbnail}
          resizeMode="cover"
        />
        {item.type === 'video' && (
          <View style={styles.videoIndicator}>
            <MaterialCommunityIcons name="play" size={16} color="#FFFFFF" />
            <Text style={styles.videoDuration}>
              {item.duration ? `${Math.floor(item.duration)}s` : ''}
            </Text>
          </View>
        )}
        {multiSelectMode && (
          <View style={[
            styles.selectIndicator,
            { backgroundColor: isSelected ? colors.primary || '#1877F2' : 'rgba(0,0,0,0.3)' }
          ]}>
            {isSelected && (
              <MaterialCommunityIcons name="check" size={20} color="#FFFFFF" />
            )}
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const styles = createStyles(colors, isDarkMode);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => navigation.goBack()}
        >
          <MaterialCommunityIcons name="close" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Tạo tin</Text>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={handleTakePhoto}
        >
          <MaterialCommunityIcons name="camera" size={24} color={colors.primary || '#1877F2'} />
        </TouchableOpacity>
      </View>

      {/* Content Type Selection */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={[styles.contentTypeBar, { backgroundColor: colors.surface }]}
        contentContainerStyle={styles.contentTypeContent}
      >
        <TouchableOpacity
          style={[
            styles.contentTypeButton,
            contentType === 'text' && { backgroundColor: colors.primary || '#1877F2' }
          ]}
          onPress={() => setContentType('text')}
        >
          <Text style={[
            styles.contentTypeText,
            { color: contentType === 'text' ? '#FFFFFF' : colors.text }
          ]}>
            Aa Văn bản
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.contentTypeButton,
            contentType === 'music' && { backgroundColor: colors.primary || '#1877F2' }
          ]}
          onPress={() => setContentType('music')}
        >
          <Text style={[
            styles.contentTypeText,
            { color: contentType === 'music' ? '#FFFFFF' : colors.text }
          ]}>
            ♫ Nhạc
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.contentTypeButton,
            contentType === 'boomerang' && { backgroundColor: colors.primary || '#1877F2' }
          ]}
          onPress={() => setContentType('boomerang')}
        >
          <Text style={[
            styles.contentTypeText,
            { color: contentType === 'boomerang' ? '#FFFFFF' : colors.text }
          ]}>
            ∞ Boomerang
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.contentTypeButton,
            contentType === 'more' && { backgroundColor: colors.primary || '#1877F2' }
          ]}
          onPress={() => setContentType('more')}
        >
          <Text style={[
            styles.contentTypeText,
            { color: contentType === 'more' ? '#FFFFFF' : colors.text }
          ]}>
            Mãi
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Gallery Navigation */}
      <View style={[styles.galleryNav, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <TouchableOpacity
          style={styles.albumButton}
          onPress={() => {
            // TODO: Show album picker
            showAlert('Thông báo', 'Tính năng chọn album sẽ được thêm sau');
          }}
        >
          <Text style={[styles.albumText, { color: colors.text }]}>
            {selectedAlbum} ⌄
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.navButton}
          onPress={() => {
            // TODO: Show search
            showAlert('Thông báo', 'Tính năng tìm kiếm sẽ được thêm sau');
          }}
        >
          <MaterialCommunityIcons name="magnify" size={24} color={colors.text} />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.navButton}
          onPress={() => setMultiSelectMode(!multiSelectMode)}
        >
          <MaterialCommunityIcons
            name={multiSelectMode ? 'check-circle' : 'checkbox-multiple-blank-outline'}
            size={24}
            color={multiSelectMode ? colors.primary || '#1877F2' : colors.text}
          />
        </TouchableOpacity>
      </View>

      {/* Media Grid */}
      <View style={{ flex: 1 }}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary || '#1877F2'} />
          </View>
        ) : (
          <FlatList
            data={galleryAssets}
            renderItem={renderMediaItem}
            keyExtractor={(item) => item.id}
            numColumns={numColumns}
            contentContainerStyle={styles.gridContainer}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                  Không có ảnh hoặc video
                </Text>
                <TouchableOpacity
                  style={[styles.pickButton, { backgroundColor: colors.primary || '#1877F2' }]}
                  onPress={handlePickFromLibrary}
                >
                  <Text style={styles.pickButtonText}>Chọn từ thư viện</Text>
                </TouchableOpacity>
              </View>
            }
          />
        )}
      </View>

      {/* Bottom Action Bar */}
      {multiSelectMode && selectedMedia.length > 0 && (
        <View style={[styles.bottomBar, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
          <Text style={[styles.selectedCount, { color: colors.text }]}>
            Đã chọn: {selectedMedia.length}
          </Text>
          <TouchableOpacity
            style={[styles.createButton, { backgroundColor: colors.primary || '#1877F2' }]}
            onPress={() => handleCreateStory(selectedMedia)}
          >
            <Text style={styles.createButtonText}>Tạo tin</Text>
          </TouchableOpacity>
        </View>
      )}

      <AlertComponent />
    </SafeAreaView>
  );
};

const createStyles = (colors: typeof PWATheme.light, isDarkMode: boolean) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    height: 48,
  },
  headerButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
    position: 'absolute',
    left: 0,
    right: 0,
  },
  contentTypeBar: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    height: 44,
  },
  contentTypeContent: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 6,
    height: 44,
    alignItems: 'center',
  },
  contentTypeButton: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 18,
    backgroundColor: colors.border || '#E4E6EB',
    marginRight: 6,
    height: 32,
    justifyContent: 'center',
    flexShrink: 0,
  },
  contentTypeText: {
    fontSize: 13,
    fontWeight: '500',
  },
  galleryNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderBottomWidth: 0,
    height: 40,
  },
  albumButton: {
    flex: 1,
    paddingRight: 8,
  },
  albumText: {
    fontSize: 14,
    fontWeight: '500',
  },
  navButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 4,
  },
  gridContainer: {
    padding: 4,
    paddingTop: 0,
  },
  mediaItem: {
    width: imageSize - 4,
    height: imageSize - 4,
    margin: 2,
    borderRadius: 4,
    overflow: 'hidden',
    position: 'relative',
  },
  mediaThumbnail: {
    width: '100%',
    height: '100%',
  },
  videoIndicator: {
    position: 'absolute',
    bottom: 4,
    left: 4,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    gap: 4,
  },
  videoDuration: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '500',
  },
  selectIndicator: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    marginBottom: 20,
  },
  pickButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  pickButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    minHeight: 50,
  },
  selectedCount: {
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
  createButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    minWidth: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  createButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
});

export default CreateStoryScreen;

