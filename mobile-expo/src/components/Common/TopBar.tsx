import React from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface TopBarProps {
  searchTerm: string;
  onSearchChange: (text: string) => void;
  onNewMessage?: () => void;
  onQRScan?: () => void;
}

const TopBar = ({ searchTerm, onSearchChange, onNewMessage, onQRScan }: TopBarProps) => {
  const insets = useSafeAreaInsets();

  return (
    <LinearGradient
      colors={['#0084ff', '#00a651']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
      style={[styles.gradient, { paddingTop: Math.max(insets.top, 8) }]}
    >
      <View style={styles.container}>
        <View style={styles.searchSection}>
          <MaterialCommunityIcons name="magnify" size={18} color="rgba(255, 255, 255, 0.9)" />
          <TextInput
            style={styles.searchInput}
            placeholder="Tìm kiếm cuộc trò chuyện..."
            placeholderTextColor="rgba(255, 255, 255, 0.7)"
            value={searchTerm}
            onChangeText={onSearchChange}
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>
        <View style={styles.actionButtons}>
          {onNewMessage && (
            <TouchableOpacity style={styles.actionButton} onPress={onNewMessage}>
              <MaterialCommunityIcons name="pencil" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          )}
          {onQRScan && (
            <TouchableOpacity style={styles.actionButton} onPress={onQRScan}>
              <MaterialCommunityIcons name="qrcode-scan" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  gradient: {
    paddingBottom: 8,
    paddingHorizontal: 12,
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  searchSection: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    minHeight: 40,
    gap: 8,
    maxWidth: '80%',
  },
  searchInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 15,
    padding: 0,
    minHeight: 24,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  actionButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default TopBar;

