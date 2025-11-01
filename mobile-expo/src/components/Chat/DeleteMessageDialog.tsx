import React from 'react';
import {
  View,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Text,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { useTheme } from '../../contexts/ThemeContext';

interface DeleteMessageDialogProps {
  visible: boolean;
  onClose: () => void;
  onDeleteForMe: () => void;
  onDeleteForEveryone: () => void;
}

const DeleteMessageDialog: React.FC<DeleteMessageDialogProps> = ({
  visible,
  onClose,
  onDeleteForMe,
  onDeleteForEveryone,
}) => {
  const { isDarkMode, colors } = useTheme();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          {/* Blur Background */}
          <BlurView
            intensity={80}
            tint={isDarkMode ? 'dark' : 'light'}
            style={StyleSheet.absoluteFill}
          />
          {/* Dark overlay */}
          <View
            style={[
              StyleSheet.absoluteFill,
              { backgroundColor: isDarkMode ? 'rgba(0, 0, 0, 0.4)' : 'rgba(0, 0, 0, 0.3)' },
            ]}
          />
          <TouchableWithoutFeedback>
            <View
              style={[
                styles.container,
                {
                  backgroundColor: isDarkMode ? '#2a2a2b' : '#ffffff',
                },
              ]}
            >
              <View style={styles.header}>
                <Text style={[styles.title, { color: colors.text }]}>Xóa tin nhắn</Text>
              </View>

              <TouchableOpacity
                style={[
                  styles.option,
                  {
                    borderBottomColor: colors.border,
                    borderBottomWidth: 1,
                  },
                ]}
                onPress={() => {
                  onDeleteForMe();
                  onClose();
                }}
                activeOpacity={0.7}
              >
                <Text style={[styles.optionText, { color: '#e74c3c' }]}>
                  Xóa cho tôi
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.option}
                onPress={() => {
                  onDeleteForEveryone();
                  onClose();
                }}
                activeOpacity={0.7}
              >
                <Text style={[styles.optionText, { color: '#e74c3c' }]}>
                  Xóa cho mọi người
                </Text>
              </TouchableOpacity>

              <View
                style={[
                  styles.separator,
                  {
                    backgroundColor: colors.border,
                    marginTop: 8,
                  },
                ]}
              />

              <TouchableOpacity
                style={styles.cancelButton}
                onPress={onClose}
                activeOpacity={0.7}
              >
                <Text style={[styles.cancelText, { color: colors.text }]}>Hủy</Text>
              </TouchableOpacity>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    width: '85%',
    maxWidth: 320,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  option: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  optionText: {
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
  },
  separator: {
    height: 1,
    marginHorizontal: 16,
  },
  cancelButton: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    alignItems: 'center',
  },
  cancelText: {
    fontSize: 16,
    fontWeight: '500',
  },
});

export default DeleteMessageDialog;

