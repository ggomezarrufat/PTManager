import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import LoginScreen from '../pages/auth/LoginScreen';
import RegisterScreen from '../pages/auth/RegisterScreen';
import ForgotPasswordScreen from '../pages/auth/ForgotPasswordScreen';

const Stack = createStackNavigator();

const AuthNavigator: React.FC = () => {
  return (
    <Stack.Navigator
      initialRouteName="Login"
      screenOptions={{
        headerShown: false,
        cardStyle: { backgroundColor: '#0c0c0c' }
      }}
    >
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
    </Stack.Navigator>
  );
};

export default AuthNavigator;

