import React, { useState, useCallback } from 'react';
import AlertDialog from '../components/Common/AlertDialog';

interface AlertState {
  visible: boolean;
  title: string;
  message: string;
  onConfirm?: () => void;
  confirmText?: string;
}

export const useAlert = () => {
  const [alertState, setAlertState] = useState<AlertState>({
    visible: false,
    title: '',
    message: '',
  });

  const showAlert = useCallback((
    title: string,
    message: string,
    onConfirm?: () => void,
    confirmText: string = 'OK'
  ) => {
    setAlertState({
      visible: true,
      title,
      message,
      onConfirm,
      confirmText,
    });
  }, []);

  const hideAlert = useCallback(() => {
    setAlertState((prev) => ({
      ...prev,
      visible: false,
    }));
  }, []);

  const handleConfirm = useCallback(() => {
    if (alertState.onConfirm) {
      alertState.onConfirm();
    }
    hideAlert();
  }, [alertState.onConfirm, hideAlert]);

  const AlertComponent = () => (
    <AlertDialog
      visible={alertState.visible}
      title={alertState.title}
      message={alertState.message}
      onConfirm={handleConfirm}
      confirmText={alertState.confirmText}
    />
  );

  return {
    showAlert,
    hideAlert,
    AlertComponent,
  };
};

