import React from 'react';
import { View, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { useAuth } from '../context/AuthContext';
import { COLORS } from '../constants/theme';
import AuthScreen from '../screens/AuthScreen';
import PlaceholderScreen from '../screens/PlaceholderScreen';

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
   const { isLoggedIn, loading } = useAuth();

   if (loading) {
      return (
         <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background }}>
         <ActivityIndicator size="large" color={COLORS.primary} />
         </View>
      );
   }

   return (
      <NavigationContainer>
         <Stack.Navigator screenOptions={{ headerShown: false }}>
         {isLoggedIn
            ? <Stack.Screen name="Home" component={PlaceholderScreen} />
            : <Stack.Screen name="Auth" component={AuthScreen} />
         }
         </Stack.Navigator>
      </NavigationContainer>
   );
}