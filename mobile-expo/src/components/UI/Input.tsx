import React from 'react';
import { View, TextInput, StyleSheet, ViewStyle, TextStyle, Text } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';

interface InputProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  label?: string;
  error?: string;
  secureTextEntry?: boolean;
  multiline?: boolean;
  numberOfLines?: number;
  disabled?: boolean;
  style?: ViewStyle;
  inputStyle?: TextStyle;
  testID?: string;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad';
  returnKeyType?: 'done' | 'go' | 'next' | 'search' | 'send';
  onSubmitEditing?: () => void;
  onBlur?: () => void;
  onFocus?: () => void;
}

/**
 * Input Component - Shared UI Component
 * 
 * A reusable input component with consistent styling.
 * Supports labels, errors, and various input types.
 * 
 * @param value - Input value
 * @param onChangeText - Text change handler
 * @param placeholder - Placeholder text
 * @param label - Optional label above input
 * @param error - Optional error message
 * @param secureTextEntry - Password input
 * @param multiline - Multiline input
 * @param numberOfLines - Number of lines for multiline
 * @param disabled - Disable input
 * @param style - Custom container style
 * @param inputStyle - Custom input style
 */
const Input = React.memo<InputProps>(({
  value,
  onChangeText,
  placeholder,
  label,
  error,
  secureTextEntry = false,
  multiline = false,
  numberOfLines = 1,
  disabled = false,
  style,
  inputStyle,
  testID,
  autoCapitalize = 'sentences',
  keyboardType = 'default',
  returnKeyType = 'done',
  onSubmitEditing,
  onBlur,
  onFocus,
}) => {
  const { colors, isDarkMode } = useTheme();
  
  const containerStyle: ViewStyle = {
    marginBottom: 16,
    ...style,
  };
  
  const inputContainerStyle: ViewStyle = {
    backgroundColor: isDarkMode 
      ? (colors.border || 'rgba(255, 255, 255, 0.1)')
      : (colors.border || '#E4E6EB'),
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    minHeight: multiline ? numberOfLines * 24 : 44,
    borderWidth: error ? 1 : 0,
    borderColor: error ? (colors.error || '#e74c3c') : 'transparent',
    opacity: disabled ? 0.6 : 1,
  };
  
  const textInputStyle: TextStyle = {
    color: colors.text,
    fontSize: 16,
    lineHeight: 22,
    ...inputStyle,
  };
  
  return (
    <View style={containerStyle} testID={testID}>
      {label && (
        <Text
          style={{
            fontSize: 14,
            fontWeight: '500',
            color: colors.text,
            marginBottom: 8,
          }}
        >
          {label}
        </Text>
      )}
      <View style={inputContainerStyle}>
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.textSecondary || (isDarkMode ? '#666666' : '#999999')}
          secureTextEntry={secureTextEntry}
          multiline={multiline}
          numberOfLines={numberOfLines}
          editable={!disabled}
          style={textInputStyle}
          autoCapitalize={autoCapitalize}
          keyboardType={keyboardType}
          returnKeyType={returnKeyType}
          onSubmitEditing={onSubmitEditing}
          onBlur={onBlur}
          onFocus={onFocus}
        />
      </View>
      {error && (
        <Text
          style={{
            fontSize: 12,
            color: colors.error || '#e74c3c',
            marginTop: 4,
          }}
        >
          {error}
        </Text>
      )}
    </View>
  );
});

Input.displayName = 'Input';

export default Input;

