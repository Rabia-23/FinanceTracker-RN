import React from 'react';
import { View, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

import { useAuth } from '../context/AuthContext';
import { COLORS } from '../constants/theme';
import AuthScreen        from '../screens/AuthScreen';
import HomeScreen        from '../screens/HomeScreen';
import TransactionsScreen from '../screens/TransactionsScreen';

const Stack = createNativeStackNavigator();
const Tab   = createBottomTabNavigator();

const TABS = [
  { name: 'Home', 
   label: 'Ana Sayfa', 
   icon: ['home','home-outline'], 
   component: HomeScreen },

  { name: 'Transactions', 
   label: 'İşlemler', 
   icon: ['swap-horizontal','swap-horizontal-outline'], 
   component: TransactionsScreen },
];

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => {
        const tab = TABS.find(t => t.name === route.name);
        return {
          headerShown: false,
          tabBarActiveTintColor:   COLORS.primary,
          tabBarInactiveTintColor: COLORS.textMuted,
          tabBarStyle: { backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: COLORS.border, paddingBottom: 6, paddingTop: 6, height: 62 },
          tabBarLabelStyle: { fontSize: 11, fontWeight: '500' },
          tabBarIcon: ({ focused, color, size }) => {
            const [a, i] = tab?.icon || ['ellipse','ellipse-outline'];
            return <Ionicons name={focused ? a : i} size={size} color={color} />;
          },
        };
      }}
    >
      {TABS.map(t => <Tab.Screen key={t.name} name={t.name} component={t.component} options={{ tabBarLabel: t.label }} />)}
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  const { isLoggedIn, loading } = useAuth();
  if (loading) return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background }}>
      <ActivityIndicator size="large" color={COLORS.primary} />
    </View>
  );
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {isLoggedIn
          ? <Stack.Screen name="Main" component={MainTabs} />
          : <Stack.Screen name="Auth"  component={AuthScreen} />
        }
      </Stack.Navigator>
    </NavigationContainer>
  );
}
