import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';

interface TypingIndicatorProps {
  userName: string;
}

const TypingIndicator: React.FC<TypingIndicatorProps> = ({ userName }) => {
  return (
    <View style={styles.container}>
      <View style={styles.indicator}>
        <View style={styles.dot} />
        <View style={[styles.dot, styles.dot2]} />
        <View style={[styles.dot, styles.dot3]} />
      </View>
      <Text style={styles.text}>{userName} is typing...</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 4,
    flexDirection: 'row',
    alignItems: 'center',
  },
  indicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#666',
    marginHorizontal: 2,
  },
  dot2: {
    animation: 'typing 1.4s infinite',
  },
  dot3: {
    animation: 'typing 1.4s infinite 0.2s',
  },
  text: {
    fontSize: 13,
    color: '#666',
    fontStyle: 'italic',
  },
});

export default TypingIndicator;

