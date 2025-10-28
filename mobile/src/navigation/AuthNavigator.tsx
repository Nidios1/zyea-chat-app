import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { StackNavigationOptions } from '@react-navigation/stack';
import { AuthStackParamList } from './types';

// Import screens (sẽ tạo sau)
import LoginScreen from '../screens/Auth/LoginScreen';
import RegisterScreen from '../screens/Auth/RegisterScreen';
import ForgotPasswordScreen from '../screens/Auth/ForgotPasswordScreen';
import TermsScreen from '../screens/Auth/TermsScreen';

const Stack = createStackNavigator<AuthStackParamList>();

const screenOptions: StackNavigationOptions = {
  headerShown: false,
  cardStyle: { backgroundColor: '#fff' },
};

const AuthNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={screenOptions}
      initialRouteName="Login"
    >
      <Stack.Screen
        name="Login"
        component={LoginScreen}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="Register"
        component={RegisterScreen}
        options={{
          headerShown: true,
          title: 'Đăng ký',
        }}
      />
      <Stack.Screen
        name="ForgotPassword"
        component={ForgotPasswordScreen}
        options={{
          headerShown: true,
          title: 'Quên mật khẩu',
        }}
      />
      <Stack.Screen
        name="Terms"
        component={TermsScreen}
        options={{
          headerShown: true,
          title: 'Điều khoản sử dụng',
        }}
      />
    </Stack.Navigator>
  );
};

export default AuthNavigator;

