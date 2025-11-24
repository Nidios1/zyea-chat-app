// Sticker data structure - Lấy tự động từ database
// Không cần hardcode sticker nữa, tất cả được quản lý qua admin panel

import { stickerAPI } from '../utils/api';
import { getStickerURL } from '../utils/imageUtils';

export interface StickerPack {
  id: string;
  name: string;
  title: string;
  icon_url?: string;
  sticker_count?: number;
  stickers: Sticker[];
}

export interface Sticker {
  id: string;
  url: string;
  format: 'webp' | 'png' | 'jpg' | 'jpeg' | 'gif';
  isAnimated: boolean;
}

// Helper function to get sticker by pack ID and index
export const getSticker = async (packId: string, stickerIndex: number): Promise<string | null> => {
  try {
    const response = await stickerAPI.getStickerPacks();
    const packs: StickerPack[] = response.data.packs || [];
    
    const pack = packs.find(p => p.id === packId);
    if (!pack || stickerIndex < 0 || stickerIndex >= pack.stickers.length) {
      return null;
    }
    
    const sticker = pack.stickers[stickerIndex];
    return getStickerURL(sticker.url);
  } catch (error) {
    console.error('Error getting sticker:', error);
    return null;
  }
};

// Helper function to get all stickers from a pack
export const getStickersFromPack = async (packId: string): Promise<Sticker[]> => {
  try {
    const response = await stickerAPI.getStickerPacks();
    const packs: StickerPack[] = response.data.packs || [];
    
    const pack = packs.find(p => p.id === packId);
    return pack ? pack.stickers : [];
  } catch (error) {
    console.error('Error getting stickers from pack:', error);
    return [];
  }
};

// Helper function to get all sticker packs
export const getAllStickerPacks = async (): Promise<StickerPack[]> => {
  try {
    const response = await stickerAPI.getStickerPacks();
    return response.data.packs || [];
  } catch (error) {
    console.error('Error getting sticker packs:', error);
    return [];
  }
};

// ============================================
// LƯU Ý QUAN TRỌNG:
// ============================================
// 1. HỆ THỐNG TỰ ĐỘNG:
//    - Tất cả sticker được lấy tự động từ database
//    - Không cần chỉnh sửa code khi thêm/xóa sticker
//    - Admin có thể quản lý qua web panel
//
// 2. HỖ TRỢ ĐỊNH DẠNG:
//    - .webp (static và animated)
//    - .png
//    - .jpg, .jpeg
//    - .gif (animated)
//    Expo Image tự động hỗ trợ tất cả các định dạng này!
//
// 3. TỔ CHỨC THEO NHÓM:
//    - Mỗi nhóm có ID riêng trong database
//    - Mỗi nhóm có sticker riêng, tách biệt hoàn toàn
//    - Admin có thể thêm/xóa/sửa nhóm và sticker qua web panel
//
// 4. CACHE:
//    - Dữ liệu được cache bởi React Query
//    - Tự động refresh khi cần
//    - Offline: có thể cache local nếu cần

