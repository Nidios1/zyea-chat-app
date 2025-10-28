import React, { useState } from 'react';
import { View, StyleSheet, Image } from 'react-native';
import { Text, Button } from 'react-native-paper';
import { launchImageLibrary, launchCamera } from 'react-native-image-picker';
import { uploadAPI, usersAPI } from '../../utils/api';
import Toast from 'react-native-toast-message';
import { useNavigation } from '@react-navigation/native';

const UploadAvatarScreen = () => {
  const navigation = useNavigation();
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handlePickImage = () => {
    launchImageLibrary(
      {
        mediaType: 'photo',
        quality: 0.8,
        maxWidth: 512,
        maxHeight: 512,
      },
      (response) => {
        if (response.assets?.[0]) {
          setAvatarUri(response.assets[0].uri || null);
        }
      }
    );
  };

  const handleTakePhoto = () => {
    launchCamera(
      {
        mediaType: 'photo',
        quality: 0.8,
      },
      (response) => {
        if (response.assets?.[0]) {
          setAvatarUri(response.assets[0].uri || null);
        }
      }
    );
  };

  const handleUpload = async () => {
    if (!avatarUri) {
      Toast.show({ type: 'error', text1: 'Vui lòng chọn ảnh' });
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('avatar', {
        uri: avatarUri,
        type: 'image/jpeg',
        name: 'avatar.jpg',
      } as any);

      await uploadAPI.uploadAvatar(formData);

      Toast.show({ type: 'success', text1: 'Đã cập nhật ảnh đại diện' });
      navigation.goBack();
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: error.response?.data?.message || 'Upload thất bại',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text variant="headlineSmall" style={styles.title}>
        Cập nhật ảnh đại diện
      </Text>

      {avatarUri && (
        <View style={styles.preview}>
          <Image source={{ uri: avatarUri }} style={styles.previewImage} />
        </View>
      )}

      <View style={styles.buttons}>
        <Button
          mode="outlined"
          icon="image"
          onPress={handlePickImage}
          style={styles.button}
        >
          Chọn từ thư viện
        </Button>

        <Button
          mode="outlined"
          icon="camera"
          onPress={handleTakePhoto}
          style={styles.button}
        >
          Chụp ảnh
        </Button>

        {avatarUri && (
          <Button
            mode="contained"
            onPress={handleUpload}
            loading={loading}
            style={styles.uploadButton}
          >
            Cập nhật
          </Button>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f8f9fa',
  },
  title: {
    textAlign: 'center',
    marginBottom: 24,
    color: '#333',
  },
  preview: {
    alignItems: 'center',
    marginBottom: 32,
  },
  previewImage: {
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: '#fff',
  },
  buttons: {
    gap: 12,
  },
  button: {
    marginBottom: 8,
  },
  uploadButton: {
    marginTop: 16,
    backgroundColor: '#0084ff',
  },
});

export default UploadAvatarScreen;

