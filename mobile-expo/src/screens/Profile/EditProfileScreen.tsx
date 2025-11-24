import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, KeyboardAvoidingView } from 'react-native';
import { Text, TextInput, useTheme } from 'react-native-paper';
import { Button } from '../../components/UI';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigation } from '@react-navigation/native';
import { usersAPI, uploadAPI } from '../../utils/api';
import { spacing, typography } from '../../config/designTokens';

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
          title="Lưu thay đổi"
          onPress={handleSave}
          loading={Boolean(loading)}
          variant="primary"
          fullWidth
          style={styles.button}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: spacing.base,
  },
  input: {
    marginBottom: spacing.base,
  },
  button: {
    marginTop: spacing.sm,
  },
  error: {
    textAlign: 'center',
    marginBottom: spacing.base,
  },
});

export default EditProfileScreen;

