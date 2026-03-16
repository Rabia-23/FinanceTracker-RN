import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { COLORS, SPACING, RADIUS } from '../constants/theme';

export default function PlaceholderScreen() {
   const { user, logout } = useAuth();
   return (
      <View style={s.root}>
         <Text style={s.title}>Hoş geldin, {user?.username}! 🎉</Text>
         <Text style={s.sub}>Giriş başarılı.</Text>
         <Text style={s.sub}>Ana sayfa Hafta 2'de eklenecek.</Text>
         <TouchableOpacity style={s.btn} onPress={logout}>
         <Text style={s.btnTxt}>Çıkış Yap</Text>
         </TouchableOpacity>
      </View>
   );
}

const s = StyleSheet.create({
   root: { flex: 1, backgroundColor: COLORS.background, justifyContent: 'center', alignItems: 'center', padding: SPACING.lg },
   title: { fontSize: 22, fontWeight: 'bold', color: COLORS.textPrimary, marginBottom: SPACING.sm, textAlign: 'center' },
   sub:   { fontSize: 15, color: COLORS.textSecondary, textAlign: 'center', marginBottom: SPACING.sm },
   btn:   { marginTop: SPACING.lg, backgroundColor: COLORS.primary, borderRadius: RADIUS.md, paddingHorizontal: SPACING.lg, paddingVertical: 12 },
   btnTxt:{ color: '#fff', fontWeight: '600', fontSize: 15 },
});
