import React, { useState, useCallback } from 'react';
import {
   View, Text, ScrollView, StyleSheet,
   TouchableOpacity, ActivityIndicator, RefreshControl, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { getCurrency } from '../services/index';
import { COLORS, SPACING, RADIUS } from '../constants/theme';

const CURRENCY_META = [
   { key: 'usd', flag: '🇺🇸', name: 'Amerikan Doları', symbol: '$' },
   { key: 'eur', flag: '🇪🇺', name: 'Euro',            symbol: '€' },
   { key: 'gbp', flag: '🇬🇧', name: 'İngiliz Sterlini', symbol: '£' },
   { key: 'chf', flag: '🇨🇭', name: 'İsviçre Frankı',  symbol: '₣' },
];

const GOLD_META = [
   { key: 'goldGram',    icon: '🥇', name: 'Gram Altın'   },
   { key: 'quarterGold', icon: '🪙', name: 'Çeyrek Altın' },
   { key: 'goldOunce',   icon: '⚖️', name: 'Ons Altın'    },
];

export default function CurrencyScreen() {
   const [data, setData]           = useState(null);
   const [loading, setLoading]     = useState(true);
   const [refreshing, setRefreshing] = useState(false);
   const [lastFetch, setLastFetch] = useState(null);

   async function load(silent = false) {
      if (!silent) setLoading(true);
      try {
         const res = await getCurrency();
         setData(res);
         setLastFetch(new Date());
      } catch (e) {
         // hata sessiz gecer
      } finally {
         setLoading(false);
         setRefreshing(false);
      }
   }

   useFocusEffect(useCallback(() => { load(); }, []));

   function formatRate(val) {
      if (val === null || val === undefined) return '—';
      const num = Number(val);
      if (isNaN(num)) return '—';
      return num.toLocaleString('tr-TR', {
         minimumFractionDigits: 2,
         maximumFractionDigits: 2,
      });
   }

   function formatTime(date) {
      if (!date) return '';
      return date.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
   }

   return (
      <View style={s.root}>

         {/* Başlık */}
         <View style={s.topBar}>
            <View>
               <Text style={s.topTitle}>Döviz Kurları</Text>
               {lastFetch && (
                  <Text style={s.lastUpdate}>
                  Son güncelleme: {formatTime(lastFetch)}
                  </Text>
               )}
               {data?.lastUpdate && (
                  <Text style={s.apiDate}>Veri tarihi: {data.lastUpdate}</Text>
               )}
            </View>
            <TouchableOpacity style={s.refreshBtn} onPress={() => load(true)}>
               <Ionicons name="refresh-outline" size={20} color={COLORS.primary} />
            </TouchableOpacity>
         </View>

         {loading ? (
         <View style={s.center}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={s.loadingTxt}>Kurlar yükleniyor...</Text>
         </View>
         ) : (
         <ScrollView
            contentContainerStyle={{ padding: SPACING.md }}
            refreshControl={
               <RefreshControl
               refreshing={refreshing}
               onRefresh={() => { setRefreshing(true); load(true); }}
               />
            }>

            {/* Doviz Kurlari */}
            <Text style={s.sectionTitle}>Döviz</Text>
            <View style={s.sectionCard}>
               {CURRENCY_META.map((c, i) => (
               <View key={c.key}>
                  <View style={s.row}>
                     <Text style={s.flag}>{c.flag}</Text>
                     <View style={s.rowMid}>
                     <Text style={s.code}>{c.key}</Text>
                     <Text style={s.fullName}>{c.name}</Text>
                     </View>
                     <View style={s.rowRight}>
                     <Text style={s.rate}>
                        {data ? formatRate(data[c.key]) : '—'}
                     </Text>
                     <Text style={s.tryLabel}>₺</Text>
                     </View>
                  </View>
                  {i < CURRENCY_META.length - 1 && <View style={s.divider} />}
               </View>
               ))}
            </View>

            {/* Altin Fiyatlari */}
            <Text style={s.sectionTitle}>Altın</Text>
            <View style={s.sectionCard}>
               {GOLD_META.map((g, i) => (
               <View key={g.key}>
                  <View style={s.row}>
                     <Text style={s.flag}>{g.icon}</Text>
                     <View style={s.rowMid}>
                     <Text style={s.code}>{g.name}</Text>
                     <Text style={s.fullName}>TRY bazlı</Text>
                     </View>
                     <View style={s.rowRight}>
                     <Text style={s.rate}>
                        {data ? formatRate(data[g.key]) : '—'}
                     </Text>
                     <Text style={s.tryLabel}>₺</Text>
                     </View>
                  </View>
                  {i < GOLD_META.length - 1 && <View style={s.divider} />}
               </View>
               ))}
            </View>

            {/* Bilgi notu */}
            <View style={s.infoBox}>
               <Ionicons name="information-circle-outline" size={15} color={COLORS.textMuted} />
               <Text style={s.infoTxt}>
               Kurlar exchangerate.host üzerinden anlık olarak alınmaktadır.
               Yatırım tavsiyesi değildir.
               </Text>
            </View>

         </ScrollView>
         )}
      </View>
   );
}

const s = StyleSheet.create({
   root:   { flex: 1, backgroundColor: COLORS.background },
   center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
   loadingTxt: { fontSize: 13, color: COLORS.textMuted },

   topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start',
               paddingTop: 56, paddingHorizontal: SPACING.md, paddingBottom: SPACING.sm,
               backgroundColor: COLORS.white, borderBottomWidth: 1, borderBottomColor: COLORS.border },
   topTitle:   { fontSize: 20, fontWeight: 'bold', color: COLORS.textPrimary },
   lastUpdate: { fontSize: 11, color: COLORS.textMuted, marginTop: 2 },
   apiDate:    { fontSize: 11, color: COLORS.textMuted },
   refreshBtn: { padding: 8, backgroundColor: '#EEF2FF', borderRadius: RADIUS.md, marginTop: 4 },

   sectionTitle: { fontSize: 13, fontWeight: '700', color: COLORS.textMuted,
                     textTransform: 'uppercase', letterSpacing: 0.5,
                     marginBottom: SPACING.sm, marginTop: SPACING.sm },
   sectionCard: { backgroundColor: COLORS.white, borderRadius: RADIUS.md, marginBottom: SPACING.md,
                  shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.04, elevation: 1, overflow: 'hidden' },

   row:      { flexDirection: 'row', alignItems: 'center', padding: SPACING.md },
   flag:     { fontSize: 28, marginRight: 12 },
   rowMid:   { flex: 1 },
   code:     { fontSize: 15, fontWeight: '700', color: COLORS.textPrimary },
   fullName: { fontSize: 12, color: COLORS.textMuted, marginTop: 1 },
   rowRight: { alignItems: 'flex-end', flexDirection: 'row', gap: 4, alignItems: 'baseline' },
   rate:     { fontSize: 18, fontWeight: 'bold', color: COLORS.textPrimary },
   tryLabel: { fontSize: 13, color: COLORS.textMuted, fontWeight: '600' },

   divider: { height: 1, backgroundColor: COLORS.border, marginHorizontal: SPACING.md },

   infoBox: { flexDirection: 'row', alignItems: 'flex-start', gap: 6,
               backgroundColor: COLORS.white, borderRadius: RADIUS.md,
               padding: SPACING.md, marginBottom: SPACING.lg },
   infoTxt: { flex: 1, fontSize: 11, color: COLORS.textMuted, lineHeight: 16 },
});
