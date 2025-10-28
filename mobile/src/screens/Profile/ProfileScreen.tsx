import React from 'react';
import { View, StyleSheet, ScrollView, Image } from 'react-native';
import { Text, Card, Button, Divider, useTheme } from 'react-native-paper';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { ProfileStackParamList } from '../../navigation/types';
import { getAvatarURL } from '../../utils/imageUtils';
import { getInitials } from '../../utils/nameUtils';

type ProfileScreenNavigationProp = StackNavigationProp<ProfileStackParamList>;

const ProfileScreen = () => {
  const theme = useTheme();
  const { user, logout } = useAuth();
  const navigation = useNavigation<ProfileScreenNavigationProp>();

  const handleEditProfile = () => {
    navigation.navigate('EditProfile');
  };

  const handleSettings = () => {
    navigation.navigate('Settings');
  };

  const handleLogout = async () => {
    await logout();
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Card style={styles.profileCard}>
        <View style={styles.avatarSection}>
          {user?.avatar_url ? (
            <Image
              source={{ uri: getAvatarURL(user.avatar_url) }}
              style={styles.avatar}
            />
          ) : (
            <View style={[styles.avatarPlaceholder, { backgroundColor: theme.colors.primary }]}>
              <Text style={styles.avatarText}>
                {getInitials(user?.full_name || user?.username)}
              </Text>
            </View>
          )}
          <Text style={[styles.name, { color: theme.colors.onBackground }]}>
            {user?.full_name || user?.username || 'User'}
          </Text>
          {user?.email && (
            <Text style={[styles.email, { color: theme.colors.onSurfaceVariant }]}>
              {user.email}
            </Text>
          )}
        </View>
      </Card>

      <Card style={styles.menuCard}>
        <Button
          mode="text"
          icon="account-edit"
          onPress={handleEditProfile}
          contentStyle={styles.menuItem}
        >
          Chỉnh sửa hồ sơ
        </Button>
        
        <Divider />
        
        <Button
          mode="text"
          icon="account-multiple"
          onPress={() => {}}
          contentStyle={styles.menuItem}
        >
          Bạn bè
        </Button>
        
        <Divider />
        
        <Button
          mode="text"
          icon="cog"
          onPress={handleSettings}
          contentStyle={styles.menuItem}
        >
          Cài đặt
        </Button>
        
        <Divider />
        
        <Button
          mode="text"
          icon="help-circle"
          onPress={() => {}}
          contentStyle={styles.menuItem}
        >
          Trợ giúp
        </Button>
        
        <Divider />
        
        <Button
          mode="text"
          icon="logout"
          onPress={handleLogout}
          contentStyle={[styles.menuItem, styles.logoutButton]}
          textColor={theme.colors.error}
        >
          Đăng xuất
        </Button>
      </Card>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  profileCard: {
    margin: 16,
    padding: 20,
  },
  avatarSection: {
    alignItems: 'center',
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 16,
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#fff',
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  email: {
    fontSize: 14,
  },
  menuCard: {
    margin: 16,
  },
  menuItem: {
    justifyContent: 'flex-start',
  },
  logoutButton: {
    marginTop: 8,
  },
});

export default ProfileScreen;
