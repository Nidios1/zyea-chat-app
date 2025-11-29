import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Dimensions,
  Modal,
  Pressable,
} from 'react-native';
import { Text } from 'react-native-paper';
import { Image } from 'expo-image';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { StickerPack, Sticker } from '../../data/stickerData';
import { stickerAPI } from '../../utils/api';
import { getStickerURL } from '../../utils/imageUtils';
import { useQuery } from '@tanstack/react-query';

interface StickerPickerProps {
  visible: boolean;
  onClose: () => void;
  onSelectSticker: (packId: string, stickerIndex: number, sticker: any) => void;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const STICKER_SIZE = 80; // Size of sticker in picker
const STICKER_DISPLAY_SIZE = 120; // Size when displayed in message

const StickerPicker: React.FC<StickerPickerProps> = ({
  visible,
  onClose,
  onSelectSticker,
}) => {
  const { isDarkMode, colors } = useTheme();
  const [selectedPackIndex, setSelectedPackIndex] = useState(0);

  // Fetch sticker packs from API
  const { data: stickerPacksData = [], isLoading, error: fetchError } = useQuery({
    queryKey: ['sticker-packs'],
    queryFn: async () => {
      try {
        console.log('🎨 StickerPicker - Fetching sticker packs...');
        const response = await stickerAPI.getStickerPacks();
        const packs = response.data.packs || [];
        console.log('🎨 StickerPicker - Received packs:', packs.length);
        if (packs.length > 0) {
          console.log('🎨 StickerPicker - First pack:', {
            id: packs[0].id,
            name: packs[0].name,
            title: packs[0].title,
            stickersCount: packs[0].stickers?.length || 0
          });
        }
        return packs;
      } catch (error) {
        console.error('🎨 StickerPicker - Error fetching packs:', error);
        throw error;
      }
    },
    staleTime: 5 * 60 * 1000, // 5 phút - sticker packs không thay đổi thường xuyên
    gcTime: 15 * 60 * 1000, // 15 phút cache
  });

  // Filter out empty packs - đảm bảo là array
  const availablePacks = Array.isArray(stickerPacksData)
    ? (stickerPacksData as StickerPack[]).filter(pack => {
        const hasStickers = pack && pack.stickers && Array.isArray(pack.stickers) && pack.stickers.length > 0;
        if (!hasStickers && pack) {
          console.warn('⚠️ StickerPicker - Pack has no stickers:', { id: pack.id, name: pack.name, stickers: pack.stickers });
        }
        return hasStickers;
      })
    : [];

  // Debug log
  React.useEffect(() => {
    if (visible) {
      console.log('🎨 StickerPicker opened');
      console.log('📦 Total packs from API:', Array.isArray(stickerPacksData) ? stickerPacksData.length : 0);
      console.log('✅ Available packs (with stickers):', availablePacks.length);
      if (fetchError) {
        console.error('❌ StickerPicker - Fetch error:', fetchError);
      }
      if (availablePacks.length > 0) {
        console.log('📋 Current pack:', availablePacks[0].id, '- Stickers:', availablePacks[0].stickers?.length || 0);
      } else if (!isLoading && Array.isArray(stickerPacksData) && stickerPacksData.length > 0) {
        console.warn('⚠️ StickerPicker - All packs are empty (no stickers)');
      } else if (!isLoading && (!stickerPacksData || stickerPacksData.length === 0)) {
        console.warn('⚠️ StickerPicker - No packs returned from API');
      }
    }
  }, [visible, availablePacks.length, stickerPacksData, isLoading, fetchError]);

  if (isLoading) {
    return (
      <Modal
        visible={visible}
        transparent={true}
        animationType="slide"
        onRequestClose={onClose}
        statusBarTranslucent={true}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={onClose}
        >
          <Pressable
            style={[
              styles.pickerContainer,
              {
                backgroundColor: isDarkMode ? '#1e1e1e' : '#ffffff',
              },
            ]}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={styles.emptyContainer}>
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                Đang tải sticker...
              </Text>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    );
  }

  if (fetchError) {
    return (
      <Modal
        visible={visible}
        transparent={true}
        animationType="slide"
        onRequestClose={onClose}
        statusBarTranslucent={true}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={onClose}
        >
          <Pressable
            style={[
              styles.pickerContainer,
              {
                backgroundColor: isDarkMode ? '#1e1e1e' : '#ffffff',
              },
            ]}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={styles.emptyContainer}>
              <Text style={[styles.emptyText, { color: colors.error || '#e74c3c' }]}>
                Lỗi tải sticker
              </Text>
              <Text style={[styles.emptyText, { color: colors.textSecondary, marginTop: 8, fontSize: 14 }]}>
                {fetchError instanceof Error ? fetchError.message : 'Không thể tải sticker packs'}
              </Text>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    );
  }

  if (availablePacks.length === 0) {
    // Chỉ log warning một lần, không spam
    if (visible && !isLoading) {
      console.warn('⚠️ No sticker packs available!', {
        totalPacks: Array.isArray(stickerPacksData) ? stickerPacksData.length : 0,
        packsData: stickerPacksData
      });
    }
    return null; // Don't show picker if no stickers available
  }

  const currentPack = availablePacks[selectedPackIndex];

  const handleStickerSelect = (stickerIndex: number) => {
    if (currentPack && currentPack.stickers && currentPack.stickers[stickerIndex]) {
      onSelectSticker(currentPack.id, stickerIndex, currentPack.stickers[stickerIndex]);
      onClose();
    }
  };

  const renderSticker = ({ item, index }: { item: Sticker; index: number }) => {
    const stickerUrl = getStickerURL(item.url);
    
    return (
      <TouchableOpacity
        style={styles.stickerItem}
        onPress={() => handleStickerSelect(index)}
        activeOpacity={0.7}
      >
        <Image
          source={{ uri: stickerUrl }}
          style={styles.stickerImage}
          contentFit="contain"
          cachePolicy="memory-disk"
        />
      </TouchableOpacity>
    );
  };

  const renderPackTab = (pack: StickerPack, index: number) => {
    const isSelected = index === selectedPackIndex;
    return (
      <TouchableOpacity
        key={pack.id}
        style={[
          styles.packTab,
          isSelected && styles.packTabSelected,
          { backgroundColor: isSelected ? (isDarkMode ? '#2a2a2b' : '#e0e0e0') : 'transparent' },
        ]}
        onPress={() => setSelectedPackIndex(index)}
        activeOpacity={0.7}
      >
        <Text
          style={[
            styles.packTabText,
            { color: isSelected ? colors.text : colors.textSecondary },
          ]}
          numberOfLines={1}
        >
          {pack.title}
        </Text>
      </TouchableOpacity>
    );
  };

  // Calculate number of columns based on screen width
  const numColumns = Math.floor((SCREEN_WIDTH - 32) / (STICKER_SIZE + 16));
  const itemWidth = (SCREEN_WIDTH - 32 - (numColumns - 1) * 16) / numColumns;

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent={true}
    >
      <Pressable
        style={styles.modalOverlay}
        onPress={onClose}
      >
        <Pressable
          style={[
            styles.pickerContainer,
            {
              backgroundColor: isDarkMode ? '#1e1e1e' : '#ffffff',
            },
          ]}
          onPress={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <Text style={[styles.headerTitle, { color: colors.text }]}>
              Chọn Sticker
            </Text>
            <TouchableOpacity
              onPress={onClose}
              style={styles.closeButton}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons
                name="close"
                size={24}
                color={colors.text}
              />
            </TouchableOpacity>
          </View>

          {/* Pack tabs - horizontal scroll */}
          {availablePacks.length > 1 && (
            <View style={[styles.packTabsContainer, { borderBottomColor: colors.border }]}>
              <FlatList
                horizontal
                data={availablePacks}
                renderItem={({ item, index }) => renderPackTab(item, index)}
                keyExtractor={(item) => item.id}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.packTabsContent}
              />
            </View>
          )}

          {/* Stickers grid */}
          {currentPack && currentPack.stickers.length > 0 ? (
            <FlatList
              data={currentPack.stickers}
              renderItem={renderSticker}
              keyExtractor={(_, index) => `sticker-${currentPack.id}-${index}`}
              numColumns={numColumns}
              contentContainerStyle={styles.stickersGrid}
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                    Không có sticker trong pack này
                  </Text>
                </View>
              }
            />
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                Không có sticker
              </Text>
            </View>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  pickerContainer: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
    minHeight: 300,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  closeButton: {
    padding: 4,
  },
  packTabsContainer: {
    borderBottomWidth: 1,
    maxHeight: 50,
  },
  packTabsContent: {
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  packTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginHorizontal: 4,
  },
  packTabSelected: {
    // Selected style handled by backgroundColor
  },
  packTabText: {
    fontSize: 14,
    fontWeight: '500',
  },
  stickersGrid: {
    padding: 16,
  },
  stickerItem: {
    width: STICKER_SIZE,
    height: STICKER_SIZE,
    margin: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stickerImage: {
    width: STICKER_SIZE,
    height: STICKER_SIZE,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
  },
});

export default StickerPicker;

