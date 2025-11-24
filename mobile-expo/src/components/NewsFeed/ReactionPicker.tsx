import React, { useEffect, useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, Modal, TouchableWithoutFeedback, Dimensions, Animated, Platform } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Constants from 'expo-constants';

interface ReactionPickerProps {
  visible: boolean;
  onSelect: (reactionType: string) => void;
  onClose: () => void;
  position: { x: number; y: number };
}

const reactions = [
  { type: 'like', icon: 'thumb-up', color: '#1877F2', label: 'Like' },
  { type: 'love', icon: 'heart', color: '#F62D5A', label: 'Love' },
  { type: 'care', icon: 'emoticon-kiss', color: '#FFD700', label: 'Care' },
  { type: 'haha', icon: 'emoticon-lol', color: '#FFD700', label: 'Haha' },
  { type: 'wow', icon: 'emoticon-excited', color: '#FFD700', label: 'Wow' },
  { type: 'sad', icon: 'emoticon-sad', color: '#FFD700', label: 'Sad' },
  { type: 'angry', icon: 'emoticon-angry', color: '#E74C3C', label: 'Angry' },
];

// Check if running in Expo Go
const isExpoGo = Constants.executionEnvironment === 'storeClient';

const ReactionPicker: React.FC<ReactionPickerProps> = ({ visible, onSelect, onClose, position }) => {
  const screenWidth = Dimensions.get('window').width;
  const pickerWidth = 340;
  const pickerHeight = 56;
  
  // Tính toán vị trí
  let left = position.x - pickerWidth / 2;
  const margin = 12;
  if (left < margin) {
    left = margin;
  } else if (left + pickerWidth > screenWidth - margin) {
    left = screenWidth - pickerWidth - margin;
  }

  const top = position.y - pickerHeight - 20;

  // Animated values - sử dụng Animated API của React Native cho Expo Go
  const [containerOpacity] = useState(new Animated.Value(0));
  const [containerScale] = useState(new Animated.Value(0.7));
  const [iconScales] = useState(reactions.map(() => new Animated.Value(0)));
  const [iconTranslateYs] = useState(reactions.map(() => new Animated.Value(40)));
  const [selectedIndex, setSelectedIndex] = useState(-1);

  // Animation khi hiển thị
  useEffect(() => {
    if (visible) {
      // Container animation
      Animated.parallel([
        Animated.timing(containerOpacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.spring(containerScale, {
          toValue: 1,
          damping: 15,
          stiffness: 200,
          useNativeDriver: true,
        }),
      ]).start();

      // Icons animation với stagger effect
      iconScales.forEach((scale, index) => {
        Animated.sequence([
          Animated.delay(index * 25),
          Animated.spring(scale, {
            toValue: 1.3,
            damping: 7,
            stiffness: 400,
            useNativeDriver: true,
          }),
          Animated.spring(scale, {
            toValue: 1,
            damping: 12,
            stiffness: 300,
            useNativeDriver: true,
          }),
        ]).start();
      });

      iconTranslateYs.forEach((translateY, index) => {
        Animated.sequence([
          Animated.delay(index * 25),
          Animated.spring(translateY, {
            toValue: 0,
            damping: 15,
            stiffness: 300,
            useNativeDriver: true,
          }),
        ]).start();
      });
    } else {
      // Reset animations
      Animated.parallel([
        Animated.timing(containerOpacity, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(containerScale, {
          toValue: 0.8,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();

      iconScales.forEach((scale) => {
        Animated.timing(scale, {
          toValue: 0,
          duration: 100,
          useNativeDriver: true,
        }).start();
      });

      iconTranslateYs.forEach((translateY) => {
        Animated.timing(translateY, {
          toValue: 30,
          duration: 100,
          useNativeDriver: true,
        }).start();
      });
      
      setSelectedIndex(-1);
    }
  }, [visible]);

  const handleReactionPress = (reactionType: string, index: number) => {
    setSelectedIndex(index);
    // Delay để thấy animation scale up
    setTimeout(() => {
      onSelect(reactionType);
      onClose();
    }, 150);
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.modalOverlay}>
          <Animated.View
            style={[
              styles.reactionContainer,
              {
                left,
                top,
                opacity: containerOpacity,
                transform: [{ scale: containerScale }],
              },
            ]}
          >
            {reactions.map((reaction, index) => {
              const iconScale = iconScales[index];
              const iconTranslateY = iconTranslateYs[index];
              const isSelected = selectedIndex === index;
              
              return (
                <TouchableOpacity
                  key={reaction.type}
                  style={styles.reactionItem}
                  onPress={() => handleReactionPress(reaction.type, index)}
                  activeOpacity={0.7}
                >
                  <Animated.View
                    style={{
                      transform: [
                        { scale: isSelected ? 1.4 : iconScale },
                        { translateY: iconTranslateY },
                      ],
                    }}
                  >
                    <MaterialCommunityIcons
                      name={reaction.icon as any}
                      size={44}
                      color={reaction.color}
                    />
                  </Animated.View>
                </TouchableOpacity>
              );
            })}
          </Animated.View>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  reactionContainer: {
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    borderRadius: 28,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    elevation: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  reactionItem: {
    marginHorizontal: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default ReactionPicker;
