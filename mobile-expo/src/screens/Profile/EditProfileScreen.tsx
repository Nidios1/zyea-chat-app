import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, KeyboardAvoidingView } from 'react-native';
import { Text, TextInput, Button, useTheme } from 'react-native-paper';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigation } from '@react-navigation/native';
import { usersAPI, uploadAPI } from '../../utils/api';

const EditProfileScreen = () => {
  const theme = useTheme();
  const { user } = useAuth();
  const navigation = useNavigation();

  const [formData, setFormData] = useState({
    full_name: user?.full_name || '',
    email: user?.email || '',
    bio: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async () => {
    setLoading(true);
    setError('');

    try {
      await usersAPI.updateProfile(formData);
      navigation.goBack();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Cập nhật thất bại');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior="padding"
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.content}>
        <TextInput
          label="Họ và tên"
          value={formData.full_name}
          onChangeText={(text) => setFormData({ ...formData, full_name: text })}
          mode="outlined"
          style={styles.input}
        />

        <TextInput
          label="Email"
          value={formData.email}
          onChangeText={(text) => setFormData({ ...formData, email: text })}
          mode="outlined"
          keyboardType="email-address"
          style={styles.input}
        />

        <TextInput
          label="Giới thiệu"
          value={formData.bio}
          onChangeText={(text) => setFormData({ ...formData, bio: text })}
          mode="outlined"
          multiline
          numberOfLines={4}
          style={styles.input}
        />

        {error && (
          <Text style={[styles.error, { color: theme.colors.error }]}>
            {error}
          </Text>
        )}

        <Button
          mode="contained"
          onPress={handleSave}
          loading={Boolean(loading)}
          style={styles.button}
        >
          Lưu thay đổi
        </Button>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  input: {
    marginBottom: 16,
  },
  button: {
    marginTop: 8,
  },
  error: {
    textAlign: 'center',
    marginBottom: 16,
  },
});

export default EditProfileScreen;

