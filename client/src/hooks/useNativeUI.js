import { useCallback } from 'react';
import { Capacitor } from '@capacitor/core';
import { Haptics, ImpactStyle } from '@capacitor/haptics';

/**
 * Native UI Components Hook
 * ActionSheet, Dialog, Toast with native feel
 */
export const useNativeUI = () => {
  
  // Show native action sheet
  const showActionSheet = useCallback(async (options) => {
    if (!Capacitor.isNativePlatform()) {
      // Fallback to web dialog
      return showWebActionSheet(options);
    }

    try {
      const { ActionSheet } = await import('@capacitor/action-sheet');
      
      const result = await ActionSheet.showActions({
        title: options.title,
        message: options.message,
        options: options.buttons.map(btn => ({
          title: btn.text,
          style: btn.style || 'DEFAULT' // DEFAULT, DESTRUCTIVE, CANCEL
        }))
      });

      // Haptic feedback
      await Haptics.impact({ style: ImpactStyle.Light });

      const selectedButton = options.buttons[result.index];
      if (selectedButton && selectedButton.handler) {
        selectedButton.handler();
      }

      return result;
    } catch (error) {
      console.error('ActionSheet error:', error);
      return null;
    }
  }, []);

  // Web fallback for action sheet
  const showWebActionSheet = (options) => {
    return new Promise((resolve) => {
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
        resolve({ index });
      } else {
        resolve({ index: -1 });
      }
    });
  };

  // Show native alert dialog
  const showAlert = useCallback(async (options) => {
    if (!Capacitor.isNativePlatform()) {
      // Fallback to web alert
      window.alert(options.message);
      if (options.handler) {
        options.handler();
      }
      return;
    }

    try {
      const { Dialog } = await import('@capacitor/dialog');
      
      await Dialog.alert({
        title: options.title || 'Thông báo',
        message: options.message,
        buttonTitle: options.buttonText || 'OK'
      });

      // Haptic feedback
      await Haptics.notification({ type: 'SUCCESS' });

      if (options.handler) {
        options.handler();
      }
    } catch (error) {
      console.error('Alert error:', error);
      window.alert(options.message);
    }
  }, []);

  // Show native confirm dialog
  const showConfirm = useCallback(async (options) => {
    if (!Capacitor.isNativePlatform()) {
      // Fallback to web confirm
      const result = window.confirm(options.message);
      if (result && options.onConfirm) {
        options.onConfirm();
      } else if (!result && options.onCancel) {
        options.onCancel();
      }
      return result;
    }

    try {
      const { Dialog } = await import('@capacitor/dialog');
      
      const { value } = await Dialog.confirm({
        title: options.title || 'Xác nhận',
        message: options.message,
        okButtonTitle: options.confirmText || 'OK',
        cancelButtonTitle: options.cancelText || 'Hủy'
      });

      // Haptic feedback
      if (value) {
        await Haptics.impact({ style: ImpactStyle.Medium });
      }

      if (value && options.onConfirm) {
        options.onConfirm();
      } else if (!value && options.onCancel) {
        options.onCancel();
      }

      return value;
    } catch (error) {
      console.error('Confirm error:', error);
      return window.confirm(options.message);
    }
  }, []);

  // Show native prompt dialog
  const showPrompt = useCallback(async (options) => {
    if (!Capacitor.isNativePlatform()) {
      // Fallback to web prompt
      const result = window.prompt(options.message, options.defaultValue || '');
      if (result !== null && options.onConfirm) {
        options.onConfirm(result);
      } else if (result === null && options.onCancel) {
        options.onCancel();
      }
      return result;
    }

    try {
      const { Dialog } = await import('@capacitor/dialog');
      
      const { value, cancelled } = await Dialog.prompt({
        title: options.title || 'Nhập thông tin',
        message: options.message,
        inputPlaceholder: options.placeholder || '',
        inputText: options.defaultValue || '',
        okButtonTitle: options.confirmText || 'OK',
        cancelButtonTitle: options.cancelText || 'Hủy'
      });

      if (!cancelled) {
        await Haptics.impact({ style: ImpactStyle.Light });
        if (options.onConfirm) {
          options.onConfirm(value);
        }
        return value;
      } else {
        if (options.onCancel) {
          options.onCancel();
        }
        return null;
      }
    } catch (error) {
      console.error('Prompt error:', error);
      return window.prompt(options.message, options.defaultValue || '');
    }
  }, []);

  // Haptic feedback helpers
  const haptic = {
    light: async () => {
      if (Capacitor.isNativePlatform()) {
        await Haptics.impact({ style: ImpactStyle.Light });
      }
    },
    medium: async () => {
      if (Capacitor.isNativePlatform()) {
        await Haptics.impact({ style: ImpactStyle.Medium });
      }
    },
    heavy: async () => {
      if (Capacitor.isNativePlatform()) {
        await Haptics.impact({ style: ImpactStyle.Heavy });
      }
    },
    success: async () => {
      if (Capacitor.isNativePlatform()) {
        await Haptics.notification({ type: 'SUCCESS' });
      }
    },
    warning: async () => {
      if (Capacitor.isNativePlatform()) {
        await Haptics.notification({ type: 'WARNING' });
      }
    },
    error: async () => {
      if (Capacitor.isNativePlatform()) {
        await Haptics.notification({ type: 'ERROR' });
      }
    }
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

