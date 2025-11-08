import React, { useState, useRef } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Switch,
  Text as RNText,
  PanResponder,
} from 'react-native';
import { Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { ProfileStackParamList } from '../../navigation/types';
import { useTheme } from '../../contexts/ThemeContext';
import { useFontSize } from '../../contexts/FontSizeContext';
import { PWATheme } from '../../config/PWATheme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type FontSizeSettingsScreenNavigationProp = StackNavigationProp<ProfileStackParamList, 'FontSizeSettings'>;

type FontSizeScale = 'small' | 'medium' | 'large' | 'extra-large';

const FontSizeSettingsScreen = () => {
  const navigation = useNavigation<FontSizeSettingsScreenNavigationProp>();
  const { colors, isDarkMode } = useTheme();
  const { fontSizeScale, useSystemFontSize, setFontSizeScale, setUseSystemFontSize, getFontSize } = useFontSize();
  const insets = useSafeAreaInsets();

  const [sliderValue, setSliderValue] = useState(() => {
    const scaleMap: Record<FontSizeScale, number> = {
      'small': 0,
      'medium': 1,
      'large': 2,
      'extra-large': 3,
    };
    return scaleMap[fontSizeScale];
  });
  const sliderWidth = useRef(0);
  const sliderX = useRef(0);

  const handleSliderChange = (value: number) => {
    const clampedValue = Math.max(0, Math.min(3, Math.round(value)));
    setSliderValue(clampedValue);
    const scales: FontSizeScale[] = ['small', 'medium', 'large', 'extra-large'];
    const selectedScale = scales[clampedValue];
    setFontSizeScale(selectedScale);
  };

  const handleSliderLayout = (event: any) => {
    sliderWidth.current = event.nativeEvent.layout.width;
    sliderX.current = event.nativeEvent.layout.x;
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (event) => {
        const { locationX } = event.nativeEvent;
        if (sliderWidth.current > 0) {
          const percentage = Math.max(0, Math.min(1, locationX / sliderWidth.current));
          const value = percentage * 3;
          handleSliderChange(value);
        }
      },
      onPanResponderMove: (event) => {
        const { locationX } = event.nativeEvent;
        if (sliderWidth.current > 0) {
          const percentage = Math.max(0, Math.min(1, locationX / sliderWidth.current));
          const value = percentage * 3;
          handleSliderChange(value);
        }
      },
      onPanResponderRelease: () => {},
    })
  ).current;

  const dynamicStyles = createStyles(colors);

  // Preview font sizes
  const previewBaseSize = 15;
  const previewFontSize = useSystemFontSize ? previewBaseSize : getFontSize(previewBaseSize);

  return (
    <SafeAreaView style={[dynamicStyles.container, { backgroundColor: colors.background }]} edges={['top']}>
      {/* Header */}
      <View style={dynamicStyles.header}>
        <TouchableOpacity
          style={dynamicStyles.backButton}
          onPress={() => navigation.goBack()}
        >
          <MaterialCommunityIcons name="chevron-left" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[dynamicStyles.headerTitle, { color: colors.text }]}>
          Kích thước chữ
        </Text>
        <View style={dynamicStyles.headerRight} />
      </View>

      <ScrollView
        style={dynamicStyles.content}
        contentContainerStyle={[
          dynamicStyles.contentContainer,
          { paddingBottom: Math.max(insets.bottom, 20) + 20 }
        ]}
        showsVerticalScrollIndicator={true}
      >
        {/* Chat Preview Section */}
        <View style={[dynamicStyles.section, { backgroundColor: colors.surface }]}>
          <Text style={[dynamicStyles.sectionTitle, { color: colors.text }]}>
            Cỡ chữ trong trò chuyện
          </Text>
          
          {/* Chat Preview */}
          <View style={dynamicStyles.chatPreview}>
            {/* Left bubble 1 */}
            <View style={[dynamicStyles.chatBubble, dynamicStyles.chatBubbleLeft]}>
              <RNText style={[dynamicStyles.chatText, { color: colors.text, fontSize: previewFontSize }]}>
                Xin chào
              </RNText>
              <RNText style={[dynamicStyles.chatTime, { color: colors.textSecondary }]}>
                23:33
              </RNText>
            </View>

            {/* Left bubble 2 */}
            <View style={[dynamicStyles.chatBubble, dynamicStyles.chatBubbleLeft]}>
              <RNText style={[dynamicStyles.chatText, { color: colors.text, fontSize: previewFontSize }]}>
                Bạn cần tôi hỗ trợ về vấn đề gì không?
              </RNText>
              <RNText style={[dynamicStyles.chatTime, { color: colors.textSecondary }]}>
                23:33
              </RNText>
            </View>

            {/* Right bubble */}
            <View style={[dynamicStyles.chatBubble, dynamicStyles.chatBubbleRight]}>
              <RNText style={[dynamicStyles.chatText, { color: '#fff', fontSize: previewFontSize }]}>
                Mình muốn chỉnh kích thước chữ trên thiết bị này
              </RNText>
              <View style={dynamicStyles.chatTimeRight}>
                <RNText style={[dynamicStyles.chatTime, { color: 'rgba(255, 255, 255, 0.7)' }]}>
                  23:33
                </RNText>
                <MaterialCommunityIcons name="check" size={12} color="rgba(255, 255, 255, 0.7)" />
              </View>
            </View>

            {/* Left bubble 3 */}
            <View style={[dynamicStyles.chatBubble, dynamicStyles.chatBubbleLeft]}>
              <RNText style={[dynamicStyles.chatText, { color: colors.text, fontSize: previewFontSize }]}>
                Bạn có thể thay đổi kích thước chữ bằng cách vào Cài đặt {'>'} Kích thước chữ.
              </RNText>
              <RNText style={[dynamicStyles.chatTime, { color: colors.textSecondary }]}>
                23:33
              </RNText>
            </View>
          </View>
        </View>

        {/* Font Size Controls */}
        <View style={[dynamicStyles.section, { backgroundColor: colors.surface }]}>
          {/* System Font Size Toggle */}
          <View style={dynamicStyles.toggleRow}>
            <View style={dynamicStyles.toggleLeft}>
              <Text style={[dynamicStyles.toggleLabel, { color: colors.text }]}>
                Dùng cỡ chữ hệ thống
              </Text>
            </View>
            <Switch
              value={useSystemFontSize}
              onValueChange={setUseSystemFontSize}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={useSystemFontSize ? '#fff' : colors.textSecondary}
              ios_backgroundColor={colors.border}
            />
          </View>

          {/* Font Size Slider */}
          {!useSystemFontSize && (
            <>
              <View style={dynamicStyles.sliderContainer}>
                <RNText style={[dynamicStyles.sliderLabel, { color: colors.textSecondary }]}>A</RNText>
                <View 
                  style={dynamicStyles.sliderWrapper}
                  onLayout={handleSliderLayout}
                  {...panResponder.panHandlers}
                >
                  <View style={[dynamicStyles.sliderTrack, { backgroundColor: colors.border }]}>
                    <View 
                      style={[
                        dynamicStyles.sliderTrackActive, 
                        { 
                          backgroundColor: colors.primary,
                          width: `${(sliderValue / 3) * 100}%`
                        }
                      ]} 
                    />
                    <View
                      style={[
                        dynamicStyles.sliderThumb,
                        {
                          backgroundColor: colors.primary,
                          left: `${(sliderValue / 3) * 100}%`,
                          transform: [{ translateX: -10 }]
                        }
                      ]}
                    />
                  </View>
                  <View style={dynamicStyles.sliderTouchArea}>
                    <TouchableOpacity
                      style={dynamicStyles.sliderTouchPoint}
                      onPress={() => handleSliderChange(0)}
                    />
                    <TouchableOpacity
                      style={dynamicStyles.sliderTouchPoint}
                      onPress={() => handleSliderChange(1)}
                    />
                    <TouchableOpacity
                      style={dynamicStyles.sliderTouchPoint}
                      onPress={() => handleSliderChange(2)}
                    />
                    <TouchableOpacity
                      style={dynamicStyles.sliderTouchPoint}
                      onPress={() => handleSliderChange(3)}
                    />
                  </View>
                </View>
                <RNText style={[dynamicStyles.sliderLabel, { color: colors.textSecondary, fontSize: 20 }]}>A</RNText>
              </View>
              <Text style={[dynamicStyles.sliderHint, { color: colors.textSecondary }]}>
                Kéo để thay đổi cỡ chữ
              </Text>
            </>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const createStyles = (colors: typeof PWATheme.light) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'transparent',
  },
  backButton: {
    padding: 8,
    backgroundColor: 'transparent',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
  },
  headerRight: {
    width: 40,
  },
  content: {
    flex: 1,
    backgroundColor: colors.background,
  },
  contentContainer: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  section: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '600',
    marginBottom: 16,
  },
  chatPreview: {
    gap: 12,
  },
  chatBubble: {
    maxWidth: '75%',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    marginBottom: 4,
  },
  chatBubbleLeft: {
    alignSelf: 'flex-start',
    backgroundColor: colors.backgroundSecondary || colors.border,
  },
  chatBubbleRight: {
    alignSelf: 'flex-end',
    backgroundColor: colors.primary,
  },
  chatText: {
    lineHeight: 20,
  },
  chatTime: {
    fontSize: 11,
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  chatTimeRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  toggleLeft: {
    flex: 1,
  },
  toggleLabel: {
    fontSize: 16,
    fontWeight: '400',
  },
  sliderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 8,
    gap: 12,
  },
  sliderWrapper: {
    flex: 1,
    height: 40,
    justifyContent: 'center',
    position: 'relative',
  },
  sliderTrack: {
    height: 4,
    borderRadius: 2,
    position: 'relative',
  },
  sliderTrackActive: {
    height: 4,
    borderRadius: 2,
    position: 'absolute',
    left: 0,
    top: 0,
  },
  sliderThumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
    position: 'absolute',
    top: -8,
    borderWidth: 2,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  sliderTouchArea: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sliderTouchPoint: {
    flex: 1,
    height: '100%',
  },
  sliderLabel: {
    fontSize: 16,
    fontWeight: '600',
    width: 20,
    textAlign: 'center',
  },
  sliderHint: {
    fontSize: 13,
    textAlign: 'center',
    marginTop: 8,
  },
});

export default FontSizeSettingsScreen;

