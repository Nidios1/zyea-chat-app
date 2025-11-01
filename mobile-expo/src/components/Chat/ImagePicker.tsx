import React from 'react';
import { View, StyleSheet, TouchableOpacity, Image, Alert } from 'react-native';
import { IconButton, Text } from 'react-native-paper';
import { launchCamera, launchImageLibrary } from '../../utils/imagePicker';

interface ImagePickerProps {
  onImageSelected: (imageUri: string) => void;
}

const ChatImagePicker: React.FC<ImagePickerProps> = ({ onImageSelected }) => {
  const options = {
    mediaType: 'photo' as const,
    quality: 0.8,
    maxWidth: 1024,
    maxHeight: 1024,
  };

  const handleCameraPress = () => {
    Alert.alert(
      'Chọn ảnh',
      'Bạn muốn chụp ảnh mới hay chọn từ thư viện?',
      [
        {
          text: 'Hủy',
          style: 'cancel',
        },
        {
          text: 'Camera',
          onPress: async () => {
            const response = await launchCamera(options);
            if (response.assets && response.assets[0]) {
              onImageSelected(response.assets[0].uri!);
            }
          },
        },
        {
          text: 'Thư viện',
          onPress: async () => {
            const response = await launchImageLibrary(options);
            if (response.assets && response.assets[0]) {
              onImageSelected(response.assets[0].uri!);
            }
          },
        },
      ],
      { cancelable: true as boolean }
    );
  };

  return (
    <TouchableOpacity onPress={handleCameraPress}>
      <IconButton icon="camera" size={Number(24)} />
    </TouchableOpacity>
  );
};

export default ChatImagePicker;

