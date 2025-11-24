import { useFontSize } from '../contexts/FontSizeContext';

/**
 * Hook to get scaled font size
 * Usage: const fontSize = useScaledFontSize(16);
 */
export const useScaledFontSize = (baseSize: number): number => {
  const { getFontSize } = useFontSize();
  return getFontSize(baseSize);
};

/**
 * Hook to get multiple scaled font sizes
 * Usage: const { title, body, caption } = useScaledFontSizes({ title: 20, body: 16, caption: 12 });
 */
export const useScaledFontSizes = <T extends Record<string, number>>(
  baseSizes: T
): Record<keyof T, number> => {
  const { getFontSize } = useFontSize();
  const scaled: any = {};
  
  for (const key in baseSizes) {
    scaled[key] = getFontSize(baseSizes[key]);
  }
  
  return scaled;
};

