import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, Image } from 'react-native';
import { Text, TextInput, Button, useTheme, Appbar } from 'react-native-paper';
import { launchImageLibrary } from 'react-native-image-picker';
import { newsfeedAPI, uploadAPI } from '../../utils/api';
import Toast from 'react-native-toast-message';
import { useNavigation } from '@react-navigation/native';

const CreatePostScreen = () => {
  const theme = useTheme();
  const navigation = useNavigation();
  const [content, setContent] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const handlePickImage = () => {
    launchImageLibrary(
      {
        mediaType: 'photo',
        quality: 0.8,
        selectionLimit: 5,
      },
      (response) => {
        if (response.assets) {
          const newImages = response.assets.map((asset) => asset.uri!);
          setImages([...images, ...newImages]);
        }
      }
    );
  };

  const handlePost = async () => {
    if (!content.trim() && images.length === 0) {
      Toast.show({
        type: 'error',
        text1: 'Vui lòng nhập nội dung hoặc chọn ảnh',
      });
      return;
    }

    setLoading(true);

    try {
      // Upload images first
      let uploadedImageUrls: string[] = [];

      if (images.length > 0) {
        for (const imageUri of images) {
          const formData = new FormData();
          formData.append('image', {
            uri: imageUri,
            type: 'image/jpeg',
            name: 'image.jpg',
          } as any);

          const uploadRes = await uploadAPI.uploadPostImage(formData);
          uploadedImageUrls.push(uploadRes.data.url);
        }
      }

      // Create post
      await newsfeedAPI.createPost(content, uploadedImageUrls);

      Toast.show({
        type: 'success',
        text1: 'Đã đăng bài viết',
      });

      navigation.goBack();
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: error.response?.data?.message || 'Đăng bài thất bại',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Appbar.Header>
        <Appbar.BackAction />
        <Appbar.Content title="Tạo bài viết" />
        <Button
          mode="text"
          onPress={handlePost}
          loading={loading}
          disabled={loading}
        >
          Đăng
        </Button>
      </Appbar.Header>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.content}
      >
        <ScrollView>
          <TextInput
            placeholder="Bạn đang nghĩ gì?"
            value={content}
            onChangeText={setContent}
            multiline
            numberOfLines={10}
            style={styles.input}
            mode="outlined"
          />

          {images.length > 0 && (
            <View style={styles.imagesContainer}>
              {images.map((uri, index) => (
                <Image
                  key={index}
                  source={{ uri }}
                  style={styles.image}
                  resizeMode="cover"
                />
              ))}
            </View>
          )}

          <Button
            icon="image"
            mode="outlined"
            onPress={handlePickImage}
            style={styles.button}
          >
            Thêm ảnh
          </Button>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  input: {
    margin: 16,
    minHeight: 200,
  },
  imagesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 16,
  },
  image: {
    width: 100,
    height: 100,
    borderRadius: 8,
    marginRight: 8,
    marginBottom: 8,
  },
  button: {
    margin: 16,
  },
});

export default CreatePostScreen;

