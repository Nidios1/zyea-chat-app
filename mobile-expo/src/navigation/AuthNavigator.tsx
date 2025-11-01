import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { AuthStackParamList } from './types';

// Import screens
import LoginScreen from '../screens/Auth/LoginScreen';
import RegisterScreen from '../screens/Auth/RegisterScreen';
import ForgotPasswordScreen from '../screens/Auth/ForgotPasswordScreen';
import TermsScreen from '../screens/Auth/TermsScreen';
import SocialTermsScreen from '../screens/Auth/SocialTermsScreen';

const Stack = createStackNavigator<AuthStackParamList>();

const AuthNavigator = () => {
  return (
    <Stack.Navigator
      initialRouteName="Login"
    >
      <Stack.Screen
        name="Login"
        component={LoginScreen}
        options={{
          headerShown: false as boolean,
        }}
      />
      <Stack.Screen
        name="Register"
        component={RegisterScreen}
        options={{
          headerShown: false as boolean,
        }}
      />
      <Stack.Screen
        name="ForgotPassword"
        component={ForgotPasswordScreen}
        options={{
          headerShown: true as boolean,
          title: 'Quên mật khẩu',
        }}
      />
      <Stack.Screen
        name="Terms"
        component={TermsScreen}
        options={{
          headerShown: false as boolean,
          title: 'Điều khoản sử dụng',
        }}
      />
      <Stack.Screen
        name="SocialTerms"
        component={SocialTermsScreen}
        options={{
          headerShown: false as boolean,
          title: 'Điều khoản Mạng xã hội',
        }}
      />
    </Stack.Navigator>
  );
};

export default AuthNavigator;

