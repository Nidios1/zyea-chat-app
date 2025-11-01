import React from 'react';
import { Modal, View, Text, Pressable, StyleSheet } from 'react-native';
import { Button } from 'react-native-paper';

interface AlertDialogProps {
  visible: boolean;
  title: string;
  message: string;
  onConfirm?: () => void;
  confirmText?: string;
}

const AlertDialog: React.FC<AlertDialogProps> = ({
  visible,
  title,
  message,
  onConfirm,
  confirmText = 'OK',
}) => {
  const handleConfirm = () => {
    if (onConfirm) {
      onConfirm();
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleConfirm}
    >
      <Pressable style={styles.modalOverlay} onPress={handleConfirm}>
        <Pressable style={styles.alertDialog} onPress={(e) => e.stopPropagation()}>
          <Text style={styles.alertTitle}>{title}</Text>
          <Text style={styles.alertMessage}>{message}</Text>
          <View style={styles.alertButtonContainer}>
            <Button
              mode="text"
              onPress={handleConfirm}
              style={styles.alertButton}
              labelStyle={styles.alertButtonText}
            >
              {confirmText}
            </Button>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  alertDialog: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    width: 280,
    alignSelf: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 32,
    elevation: 8,
  },
  alertTitle: {
    fontSize: 17,
    fontWeight: '600',
    textAlign: 'center',
    padding: 22,
    paddingBottom: 8,
    color: '#000000',
  },
  alertMessage: {
    fontSize: 14,
    textAlign: 'center',
    padding: 4,
    paddingHorizontal: 22,
    color: '#6b6b6b',
    lineHeight: 20,
  },
  alertButtonContainer: {
    borderTopWidth: 0.5,
    borderTopColor: '#c7c7cc',
    flexDirection: 'column',
  },
  alertButton: {
    paddingVertical: 13,
  },
  alertButtonText: {
    fontSize: 17,
    color: '#007AFF',
    fontWeight: '400',
  },
});

export default AlertDialog;

