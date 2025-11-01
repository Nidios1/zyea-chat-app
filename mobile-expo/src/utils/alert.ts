import { AlertDialogProps } from '../components/Common/AlertDialog';

// Global alert manager
let alertRef: {
  show: (props: Omit<AlertDialogProps, 'visible'>) => void;
} | null = null;

export const setAlertRef = (ref: typeof alertRef) => {
  alertRef = ref;
};

export const showAlert = (title: string, message: string, onConfirm?: () => void, confirmText?: string) => {
  if (alertRef) {
    alertRef.show({ title, message, onConfirm, confirmText });
  }
};

// Convenience functions
export const showError = (message: string, title: string = 'Lỗi', onConfirm?: () => void) => {
  showAlert(title, message, onConfirm);
};

export const showSuccess = (message: string, title: string = 'Thành công', onConfirm?: () => void) => {
  showAlert(title, message, onConfirm);
};

export const showWarning = (message: string, title: string = 'Cảnh báo', onConfirm?: () => void) => {
  showAlert(title, message, onConfirm);
};

