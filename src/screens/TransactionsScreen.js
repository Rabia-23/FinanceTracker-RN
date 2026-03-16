import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/theme';

export default function TransactionsScreen() {
   return (
      <View style={s.root}>
         <Ionicons name="construct-outline" size={48} color={COLORS.textMuted} />
         <Text style={s.title}>İşlemler</Text>
         <Text style={s.sub}>Hafta 4 & Hafta 5</Text>
      </View>
   );
}
const s = StyleSheet.create({
   root: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background },
   title: { fontSize: 18, fontWeight: 'bold', color: COLORS.textPrimary, marginTop: 16 },
   sub: { fontSize: 13, color: COLORS.textMuted, marginTop: 8, textAlign: 'center', paddingHorizontal: 40 },
});
