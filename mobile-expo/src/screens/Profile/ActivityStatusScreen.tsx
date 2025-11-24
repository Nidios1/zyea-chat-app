import React, { useState, useRef } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Switch,
  Modal,
  Animated,
  PanResponder,
  Dimensions,
} from 'react-native';
import { Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { ProfileStackParamList } from '../../navigation/types';
import { useTheme } from '../../contexts/ThemeContext';
import { PWATheme } from '../../config/PWATheme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { usersAPI } from '../../utils/api';

type ActivityStatusScreenNavigationProp = StackNavigationProp<ProfileStackParamList, 'ActivityStatus'>;

const ActivityStatusScreen = () => {
  const navigation = useNavigation<ActivityStatusScreenNavigationProp>();
  const { colors, isDarkMode } = useTheme();
  const insets = useSafeAreaInsets();
  const [isEnabled, setIsEnabled] = useState(true);
  const [showTimeModal, setShowTimeModal] = useState(false);
  const [disabledUntil, setDisabledUntil] = useState<Date | null>(null);
  const panY = useRef(new Animated.Value(0)).current;
  const modalOpacity = useRef(new Animated.Value(1)).current;
  const { height: SCREEN_HEIGHT } = Dimensions.get('window');
  const isClosingModal = useRef(false);
  const previousEnabledState = useRef(true); // Lưu trạng thái trước khi mở modal

  React.useEffect(() => {
    const loadActivityStatus = async () => {
      try {
        // Load từ server trước (ưu tiên)
        try {
          const profileResponse = await usersAPI.getProfile();
          const serverValue = profileResponse.data?.activity_status_enabled;
          // Xử lý cả trường hợp false (0, false, 'false')
          if (serverValue !== undefined && serverValue !== null) {
            // Chuyển đổi sang boolean: true nếu là true/1, false nếu là false/0
            const isServerEnabled = serverValue === true || serverValue === 1 || serverValue === 'true';
            await AsyncStorage.setItem('activityStatusEnabled', String(isServerEnabled));
            setIsEnabled(isServerEnabled);
            console.log('✅ Loaded activity status from server:', isServerEnabled);
          } else {
            // Nếu server không có giá trị, load từ local storage
            const saved = await AsyncStorage.getItem('activityStatusEnabled');
            const isCurrentlyEnabled = saved === 'true';
            setIsEnabled(isCurrentlyEnabled);
            console.log('⚠️ Server value is null/undefined, using local storage:', isCurrentlyEnabled);
          }
        } catch (apiError) {
          console.log('Could not load from server, using local storage:', apiError);
          // Fallback to local storage if server fails
          const saved = await AsyncStorage.getItem('activityStatusEnabled');
          const isCurrentlyEnabled = saved === 'true';
          setIsEnabled(isCurrentlyEnabled);
          console.log('⚠️ Using local storage due to API error:', isCurrentlyEnabled);
        }
        
        // Load thời gian bật lại từ local storage
        const disabledUntilStr = await AsyncStorage.getItem('activityStatusDisabledUntil');
        if (disabledUntilStr) {
          const date = new Date(disabledUntilStr);
          const now = new Date();
          
          // So sánh thời gian (chỉ so sánh ngày, không so sánh giờ phút giây)
          // Lấy ngày hiện tại (bỏ qua giờ phút giây)
          const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          // Lấy ngày bật lại (bỏ qua giờ phút giây)
          const disabledDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
          
          // Kiểm tra nếu đã hết thời gian tắt (đã qua ngày bật lại)
          if (disabledDate <= today) {
            // Tự động bật lại nếu đã hết thời gian
            await AsyncStorage.setItem('activityStatusEnabled', 'true');
            await AsyncStorage.removeItem('activityStatusDisabledUntil');
            setIsEnabled(true);
            setDisabledUntil(null);
            // Sync với server
            try {
              await usersAPI.updateProfile({ activity_status_enabled: true });
            } catch (error) {
              console.error('Error syncing to server:', error);
            }
          } else {
            // Chưa hết thời gian, hiển thị thông tin
            setDisabledUntil(date);
          }
        }
      } catch (error) {
        console.error('Error loading activity status:', error);
      }
    };
    loadActivityStatus();
  }, []);

  const handleToggle = async (value: boolean) => {
    if (value) {
      // Bật lại - lưu ngay
      try {
        // Sync với server trước
        try {
          await usersAPI.updateProfile({ activity_status_enabled: true });
          console.log('✅ Synced activity status to server: true');
        } catch (error) {
          console.error('❌ Error syncing to server:', error);
          // Vẫn tiếp tục lưu local nếu server fail
        }
        // Lưu local sau khi sync server thành công (hoặc nếu server fail)
        await AsyncStorage.setItem('activityStatusEnabled', 'true');
        await AsyncStorage.removeItem('activityStatusDisabledUntil');
        setIsEnabled(true);
        setDisabledUntil(null);
        previousEnabledState.current = true;
        console.log('✅ Activity status enabled locally');
      } catch (error) {
        console.error('❌ Error saving activity status:', error);
        // Revert state nếu lưu thất bại
        setIsEnabled(false);
      }
    } else {
      // Tắt - lưu trạng thái trước đó và hiển thị modal chọn thời gian
      previousEnabledState.current = isEnabled;
      // Tạm thời set isEnabled = false để Switch hiển thị đúng
      // Nhưng sẽ quay lại nếu đóng modal mà không chọn
      setIsEnabled(false);
      setShowTimeModal(true);
    }
  };

  const handleCloseModal = () => {
    if (isClosingModal.current || !showTimeModal) return;
    
    isClosingModal.current = true;
    // Animation mượt hơn với cả opacity và translateY
    Animated.parallel([
      Animated.timing(panY, {
        toValue: SCREEN_HEIGHT,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(modalOpacity, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setShowTimeModal(false);
      panY.setValue(0);
      modalOpacity.setValue(1);
      isClosingModal.current = false;
      // Khi đóng modal mà không chọn thời gian, quay lại trạng thái toggle ban đầu
      setIsEnabled(previousEnabledState.current);
    });
  };

  const handleSelectTime = async (days: number | null) => {
    try {
      // Sync với server trước
      try {
        await usersAPI.updateProfile({ activity_status_enabled: false });
        console.log('✅ Synced activity status to server: false');
      } catch (error) {
        console.error('❌ Error syncing to server:', error);
        // Vẫn tiếp tục lưu local nếu server fail
      }
      
      // Lưu local sau khi sync server thành công (hoặc nếu server fail)
      await AsyncStorage.setItem('activityStatusEnabled', 'false');
      setIsEnabled(false);
      
      if (days !== null) {
        // Lưu thời gian tắt - tính từ thời điểm hiện tại
        const now = new Date();
        const newDisabledUntil = new Date(now);
        
        // Tính toán chính xác theo số ngày/tháng
        if (days === 30) {
          // 1 tháng - thêm 1 tháng
          newDisabledUntil.setMonth(newDisabledUntil.getMonth() + 1);
        } else if (days === 90) {
          // 3 tháng - thêm 3 tháng
          newDisabledUntil.setMonth(newDisabledUntil.getMonth() + 3);
        } else if (days === 180) {
          // 6 tháng - thêm 6 tháng
          newDisabledUntil.setMonth(newDisabledUntil.getMonth() + 6);
        } else {
          // Các trường hợp khác (1 ngày, 7 ngày) - thêm số ngày
          newDisabledUntil.setDate(newDisabledUntil.getDate() + days);
        }
        
        // Đặt thời gian về cuối ngày (23:59:59) để đảm bảo tính cả ngày đó
        newDisabledUntil.setHours(23, 59, 59, 999);
        
        await AsyncStorage.setItem('activityStatusDisabledUntil', newDisabledUntil.toISOString());
        setDisabledUntil(newDisabledUntil);
        console.log('✅ Activity status disabled until:', newDisabledUntil.toISOString());
      } else {
        // Cho đến khi bật lại - không có thời gian kết thúc
        await AsyncStorage.removeItem('activityStatusDisabledUntil');
        setDisabledUntil(null);
        console.log('✅ Activity status disabled until manually enabled');
      }
      
      console.log('✅ Activity status disabled locally');
      
      // Đóng modal với animation mượt
      Animated.parallel([
        Animated.timing(panY, {
          toValue: SCREEN_HEIGHT,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(modalOpacity, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setShowTimeModal(false);
        panY.setValue(0);
        modalOpacity.setValue(1);
      });
    } catch (error) {
      console.error('Error saving activity status:', error);
    }
  };

  // Format ngày tháng năm theo định dạng DD/MM/YYYY
  const formatDate = (date: Date): string => {
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  // PanResponder cho gesture gạt xuống
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => showTimeModal && !isClosingModal.current,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        // Chỉ bắt gesture khi gạt xuống
        if (!showTimeModal || isClosingModal.current) return false;
        return gestureState.dy > 5;
      },
      onPanResponderGrant: () => {
        if (isClosingModal.current) return;
        // Lưu giá trị hiện tại vào offset
        panY.setOffset((panY as any)._value || 0);
        panY.setValue(0);
      },
      onPanResponderMove: (_, gestureState) => {
        if (isClosingModal.current) return;
        // Chỉ cho phép gạt xuống (giá trị dương)
        if (gestureState.dy > 0) {
          panY.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (isClosingModal.current) return;
        
        panY.flattenOffset();
        const threshold = 100; // Ngưỡng để đóng modal (100px)
        const velocity = gestureState.vy || 0; // Vận tốc vuốt
        
        // Đóng modal nếu gạt xuống đủ xa hoặc có vận tốc đủ lớn
        if (gestureState.dy > threshold || (gestureState.dy > 50 && velocity > 0.5)) {
          // Gạt xuống đủ xa, đóng modal với animation mượt
          isClosingModal.current = true;
          Animated.parallel([
            Animated.timing(panY, {
              toValue: SCREEN_HEIGHT,
              duration: 250,
              useNativeDriver: true,
            }),
            Animated.timing(modalOpacity, {
              toValue: 0,
              duration: 250,
              useNativeDriver: true,
            }),
          ]).start(() => {
            setShowTimeModal(false);
            panY.setValue(0);
            modalOpacity.setValue(1);
            isClosingModal.current = false;
            setIsEnabled(previousEnabledState.current);
          });
        } else {
          // Gạt chưa đủ xa, quay lại vị trí ban đầu
          Animated.parallel([
            Animated.spring(panY, {
              toValue: 0,
              useNativeDriver: true,
              tension: 65,
              friction: 11,
            }),
            Animated.timing(modalOpacity, {
              toValue: 1,
              duration: 200,
              useNativeDriver: true,
            }),
          ]).start();
        }
      },
      onPanResponderTerminate: () => {
        if (isClosingModal.current) return;
        
        panY.flattenOffset();
        Animated.spring(panY, {
          toValue: 0,
          useNativeDriver: true,
          tension: 65,
          friction: 11,
        }).start();
      },
    })
  ).current;

  // Reset animation khi modal mở/đóng
  React.useEffect(() => {
    if (showTimeModal) {
      // Reset khi modal mở
      panY.setValue(0);
      modalOpacity.setValue(1);
      isClosingModal.current = false;
      // Stop tất cả animation đang chạy
      panY.stopAnimation();
      modalOpacity.stopAnimation();
    } else {
      // Reset khi modal đóng
      panY.setValue(0);
      modalOpacity.setValue(1);
      isClosingModal.current = false;
      panY.stopAnimation();
      modalOpacity.stopAnimation();
    }
  }, [showTimeModal]);

  const dynamicStyles = createStyles(colors);

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
          Trạng thái hoạt động
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
        <View style={[dynamicStyles.section, { backgroundColor: colors.surface }]}>
          <View style={dynamicStyles.toggleRow}>
            <View style={dynamicStyles.toggleLeft}>
              <Text style={[dynamicStyles.toggleLabel, { color: colors.text }]}>
                Hiển thị khi bạn hoạt động
              </Text>
              {!isEnabled && disabledUntil && (
                <Text style={[dynamicStyles.toggleDateInfo, { color: colors.textSecondary }]}>
                  Bật lại sau {formatDate(disabledUntil)}
                </Text>
              )}
              <Text style={[dynamicStyles.toggleDescription, { color: colors.textSecondary }]}>
                {isEnabled 
                  ? 'Bạn và đồng nghiệp có thể nhìn thấy trạng thái hoạt động của nhau. Tắt tính năng này để ẩn trạng thái hoạt động của bạn'
                  : 'Bạn không thể nhìn thấy trạng thái hoạt động của đồng nghiệp. Bật tính năng này để xem trạng thái hoạt động của mọi người và chia sẻ trạng thái của bạn'
                }
              </Text>
            </View>
            <Switch
              value={isEnabled}
              onValueChange={handleToggle}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={isEnabled ? '#fff' : colors.textSecondary}
              ios_backgroundColor={colors.border}
            />
          </View>
        </View>

        <View style={[dynamicStyles.section, { backgroundColor: colors.surface }]}>
          <Text style={[dynamicStyles.sectionTitle, { color: colors.text }]}>
            Thông tin
          </Text>
          <Text style={[dynamicStyles.sectionDescription, { color: colors.textSecondary }]}>
            Khi bật, bạn bè của bạn sẽ thấy khi bạn đang hoạt động trên ứng dụng. Bạn có thể tắt tính năng này bất cứ lúc nào.
          </Text>
        </View>
      </ScrollView>

      {/* Time Selection Modal */}
      <Modal
        visible={showTimeModal}
        transparent={true}
        animationType="slide"
        onRequestClose={handleCloseModal}
      >
        <TouchableOpacity
          style={dynamicStyles.modalOverlay}
          activeOpacity={1}
          onPress={handleCloseModal}
        >
          <Animated.View
            style={[
              dynamicStyles.modalContainer,
              {
                backgroundColor: colors.surface,
                paddingBottom: Math.max(insets.bottom, 20),
                transform: [{ translateY: panY }],
                opacity: modalOpacity,
              }
            ]}
            {...panResponder.panHandlers}
          >
            {/* Drag Indicator */}
            <View style={dynamicStyles.dragIndicatorContainer}>
              <View style={[dynamicStyles.dragIndicator, { backgroundColor: colors.textSecondary }]} />
            </View>
            
            <View style={dynamicStyles.modalHeader}>
              <Text style={[dynamicStyles.modalTitle, { color: colors.text }]}>
                Tắt trong khoảng thời gian
              </Text>
              <TouchableOpacity
                onPress={handleCloseModal}
                style={dynamicStyles.modalCloseButton}
              >
                <MaterialCommunityIcons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <View style={dynamicStyles.modalContent}>
              <TouchableOpacity
                style={[
                  dynamicStyles.modalOption,
                  { borderBottomWidth: 1, borderBottomColor: colors.border }
                ]}
                onPress={() => handleSelectTime(1)}
              >
                <Text style={[dynamicStyles.modalOptionText, { color: colors.text }]}>
                  1 ngày
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  dynamicStyles.modalOption,
                  { borderBottomWidth: 1, borderBottomColor: colors.border }
                ]}
                onPress={() => handleSelectTime(7)}
              >
                <Text style={[dynamicStyles.modalOptionText, { color: colors.text }]}>
                  7 ngày
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  dynamicStyles.modalOption,
                  { borderBottomWidth: 1, borderBottomColor: colors.border }
                ]}
                onPress={() => handleSelectTime(30)}
              >
                <Text style={[dynamicStyles.modalOptionText, { color: colors.text }]}>
                  1 tháng
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  dynamicStyles.modalOption,
                  { borderBottomWidth: 1, borderBottomColor: colors.border }
                ]}
                onPress={() => handleSelectTime(90)}
              >
                <Text style={[dynamicStyles.modalOptionText, { color: colors.text }]}>
                  3 tháng
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  dynamicStyles.modalOption,
                  { borderBottomWidth: 1, borderBottomColor: colors.border }
                ]}
                onPress={() => handleSelectTime(180)}
              >
                <Text style={[dynamicStyles.modalOptionText, { color: colors.text }]}>
                  6 tháng
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  dynamicStyles.modalOption,
                  { borderBottomWidth: 1, borderBottomColor: colors.border }
                ]}
                onPress={() => handleSelectTime(null)}
              >
                <Text style={[dynamicStyles.modalOptionText, { color: colors.text }]}>
                  Cho đến khi bật lại
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={dynamicStyles.modalOption}
                onPress={() => {
                  // TODO: Implement custom time picker
                  setShowTimeModal(false);
                }}
              >
                <Text style={[dynamicStyles.modalOptionText, { color: colors.text }]}>
                  Tuỳ chỉnh
                </Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </TouchableOpacity>
      </Modal>
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
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 15,
    lineHeight: 22,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  toggleLeft: {
    flex: 1,
    marginRight: 16,
  },
  toggleLabel: {
    fontSize: 16,
    fontWeight: '400',
    marginBottom: 4,
  },
  toggleDateInfo: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 4,
    fontStyle: 'italic',
  },
  toggleDescription: {
    fontSize: 13,
    lineHeight: 18,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  dragIndicatorContainer: {
    alignItems: 'center',
    paddingTop: 12,
    paddingBottom: 8,
  },
  dragIndicator: {
    width: 40,
    height: 4,
    borderRadius: 2,
    opacity: 0.3,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
  },
  modalCloseButton: {
    padding: 8,
    position: 'absolute',
    right: 8,
  },
  modalContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  modalOption: {
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  modalOptionText: {
    fontSize: 16,
    fontWeight: '400',
  },
});

export default ActivityStatusScreen;

