import { AlertDialogProps } from '../components/Common/AlertDialog';

// Global alert manager
let alertRef: {
  show: (props: Omit<AlertDialogProps, 'visible'>) => void;
} | null = null;

export const setAlertRef = (ref: typeof alertRef) => {
  alertRef = ref;
};

export const showAlert = (
  title: string, 
  message: string, 
  onConfirm?: () => void, 
  confirmText?: string,
  type?: 'error' | 'success' | 'info' | 'warning'
) => {
  if (alertRef) {
    alertRef.show({ title, message, onConfirm, confirmText, type });
  }
};

// Convenience functions
export const showError = (
  message: string, 
  title: string = 'Đăng nhập thất bại', 
  onConfirm?: () => void
) => {
  showAlert(title, message, onConfirm, 'OK', 'error');
};

export const showSuccess = (
  message: string, 
  title: string = 'Thành công', 
  onConfirm?: () => void
) => {
  showAlert(title, message, onConfirm, 'OK', 'success');
};

export const showWarning = (
  message: string, 
  title: string = 'Cảnh báo', 
  onConfirm?: () => void
) => {
  showAlert(title, message, onConfirm, 'OK', 'warning');
};

