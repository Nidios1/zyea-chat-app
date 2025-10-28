import { useCallback } from 'react';

/**
 * Native UI Components Hook (Web version)
 * Simple dialog implementations using browser APIs
 */
export const useNativeUI = () => {
  
  // Show action sheet
  const showActionSheet = useCallback(async (options) => {
    const buttonsText = options.buttons
      .map((btn, idx) => `${idx + 1}. ${btn.text}`)
      .join('\n');
    
    const message = options.message 
      ? `${options.message}\n\n${buttonsText}`
      : buttonsText;

    const choice = window.prompt(
      `${options.title || 'Chọn hành động'}\n\n${message}\n\nNhập số (1-${options.buttons.length}):`
    );

    const index = parseInt(choice) - 1;
    if (index >= 0 && index < options.buttons.length) {
      const selectedButton = options.buttons[index];
      if (selectedButton.handler) {
        selectedButton.handler();
      }
      return { index };
    }
    return { index: -1 };
  }, []);

  // Show alert dialog
  const showAlert = useCallback(async (options) => {
    window.alert(options.message);
    if (options.handler) {
      options.handler();
    }
  }, []);

  // Show confirm dialog
  const showConfirm = useCallback(async (options) => {
    const result = window.confirm(options.message);
    if (result && options.onConfirm) {
      options.onConfirm();
    } else if (!result && options.onCancel) {
      options.onCancel();
    }
    return result;
  }, []);

  // Show prompt dialog
  const showPrompt = useCallback(async (options) => {
    const result = window.prompt(options.message, options.defaultValue || '');
    if (result !== null && options.onConfirm) {
      options.onConfirm(result);
    } else if (result === null && options.onCancel) {
      options.onCancel();
    }
    return result;
  }, []);

  // Haptic feedback (no-op on web)
  const haptic = {
    light: async () => {},
    medium: async () => {},
    heavy: async () => {},
    success: async () => {},
    warning: async () => {},
    error: async () => {}
  };

  return {
    showActionSheet,
    showAlert,
    showConfirm,
    showPrompt,
    haptic
  };
};

export default useNativeUI;
