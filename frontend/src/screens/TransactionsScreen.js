import React, { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  Alert, ActivityIndicator, RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { getTransactions } from '../services/index';
import { COLORS, SPACING, RADIUS } from '../constants/theme';

const CATEGORIES = ['Yemek','Ulaşım','Alışveriş','Sağlık','Eğlence','Faturalar','Maaş','Diğer'];
const MONTHS = ['Oca','Şub','Mar','Nis','May','Haz','Tem','Ağu','Eyl','Eki','Kas','Ara'];

export default function TransactionsScreen() {
   const { user } = useAuth();
   const [transactions, setTransactions] = useState([]);
   const [loading, setLoading]           = useState(true);
   const [refreshing, setRefreshing]     = useState(false);
   const [filterMonth, setFilterMonth]   = useState('');
   const [filterCat, setFilterCat]       = useState('');
   const [filterType, setFilterType]     = useState('');

   async function load(silent = false) {
      if (!silent) setLoading(true);
      try {
         const txs = await getTransactions(user.userId);
         setTransactions(txs || []);
      } catch (e) { Alert.alert('Hata', 'İşlemler yüklenemedi'); }
      finally { setLoading(false); setRefreshing(false); }
   }

   useFocusEffect(useCallback(() => { load(); }, []));

   // filtreleme
   let filtered = [...transactions];
   if (filterType)  filtered = filtered.filter(t => t.transactionType === filterType);
   if (filterCat)   filtered = filtered.filter(t => t.transactionCategory === filterCat);
   if (filterMonth) filtered = filtered.filter(t => {
      const m = new Date(t.transactionDate).getMonth();
      return MONTHS[m] === filterMonth;
   });

   // tarihe gore grupla
   const groups = {};
   filtered.forEach(t => {
      const d = t.transactionDate?.slice(0, 10) || '?';
      if (!groups[d]) groups[d] = [];
      groups[d].push(t);
   });

   const chip = (label, val, current, setter) => (
      <TouchableOpacity key={label}
         style={[s.chip, current === val && s.chipActive]}
         onPress={() => setter(current === val ? '' : val)}>
         <Text style={[s.chipTxt, current === val && s.chipTxtActive]}>{label}</Text>
      </TouchableOpacity>
   );

   if (loading) return <View style={s.center}><ActivityIndicator size="large" color={COLORS.primary} /></View>;

   return (
      <View style={s.root}>

         {/* baslik */}
         <View style={s.topBar}>
         <Text style={s.topTitle}>İşlemler</Text>
         <Text style={s.topNote}>Ekleme/düzenleme Hafta 5'te</Text>
         </View>

         {/* filtre bolumu */}
         <View style={s.filterBlock}>

         {/* alan 1 — tur */}
         <View style={s.filterRow}>
            <Text style={s.filterLabel}>Tür</Text>
            <View style={s.chipRow}>
               {chip('Gelir', 'Income',  filterType, setFilterType)}
               {chip('Gider', 'Expense', filterType, setFilterType)}
            </View>
         </View>

         <View style={s.divider} />

         {/* alan 2 — ay */}
         <View style={s.filterRow}>
            <Text style={s.filterLabel}>Ay</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}
               contentContainerStyle={s.chipScroll}>
               {MONTHS.map(m => chip(m, m, filterMonth, setFilterMonth))}
            </ScrollView>
         </View>

         <View style={s.divider} />

         {/* alan 3 — kategori */}
         <View style={s.filterRow}>
            <Text style={s.filterLabel}>Kategori</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}
               contentContainerStyle={s.chipScroll}>
               {CATEGORIES.map(c => chip(c, c, filterCat, setFilterCat))}
            </ScrollView>
         </View>

         </View>

         {/* sonuc sayisi */}
         <View style={s.resultBar}>
         <Text style={s.resultTxt}>{filtered.length} işlem</Text>
         {(filterType || filterMonth || filterCat) && (
            <TouchableOpacity onPress={() => { setFilterType(''); setFilterMonth(''); setFilterCat(''); }}>
               <Text style={s.clearTxt}>Temizle</Text>
            </TouchableOpacity>
         )}
         </View>

         {/* liste */}
         <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: SPACING.md }}
         refreshControl={<RefreshControl refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); load(true); }} />}>

         {Object.keys(groups).sort((a, b) => b.localeCompare(a)).map(date => (
            <View key={date}>
               <Text style={s.dateLabel}>
               {(() => {
                  try {
                     const d = new Date(date);
                     const monthNames = ['Ocak','Şubat','Mart','Nisan','Mayıs','Haziran',
                                       'Temmuz','Ağustos','Eylül','Ekim','Kasım','Aralık'];
                     return `${d.getDate()} ${monthNames[d.getMonth()]}`;
                  } catch { return date; }
               })()}
               </Text>
               {groups[date].map(t => (
               <View key={t.transactionId} style={s.txCard}>
                  <View style={[s.txIcon,
                     { backgroundColor: t.transactionType === 'Income' ? '#D1FAE5' : '#FEE2E2' }]}>
                     <Ionicons
                     name={t.transactionType === 'Income' ? 'arrow-up' : 'arrow-down'}
                     size={15}
                     color={t.transactionType === 'Income' ? COLORS.income : COLORS.expense}
                     />
                  </View>
                  <View style={s.txMid}>
                     <Text style={s.txTitle}>{t.transactionTitle}</Text>
                     <Text style={s.txCat}>{t.transactionCategory} · {t.transactionTime?.slice(0,5)}</Text>
                  </View>
                  <Text style={[s.txAmt,
                     { color: t.transactionType === 'Income' ? COLORS.income : COLORS.expense }]}>
                     {t.transactionType === 'Income' ? '+' : '-'}
                     {parseFloat(t.transactionAmount).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                  </Text>
               </View>
               ))}
            </View>
         ))}

         {filtered.length === 0 && (
            <View style={s.emptyBox}>
               <Ionicons name="receipt-outline" size={44} color={COLORS.textMuted} />
               <Text style={s.emptyTxt}>İşlem bulunamadı</Text>
            </View>
         )}
         </ScrollView>
      </View>
   );
}

const s = StyleSheet.create({
   root:   { flex: 1, backgroundColor: COLORS.background },
   center: { flex: 1, justifyContent: 'center', alignItems: 'center' },

   topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
               paddingTop: 56, paddingHorizontal: SPACING.md, paddingBottom: SPACING.sm,
               backgroundColor: COLORS.white, borderBottomWidth: 1, borderBottomColor: COLORS.border },
   topTitle: { fontSize: 20, fontWeight: 'bold', color: COLORS.textPrimary },
   topNote:  { fontSize: 11, color: COLORS.textMuted },

   filterBlock: { backgroundColor: COLORS.white, borderBottomWidth: 1, borderBottomColor: COLORS.border },
   filterRow:   { flexDirection: 'row', alignItems: 'center',
                  paddingVertical: 8, paddingHorizontal: SPACING.md },
   filterLabel: { fontSize: 11, fontWeight: '600', color: COLORS.textMuted,
                  width: 56, marginRight: 6 },
   chipRow:     { flexDirection: 'row', gap: 6 },
   chipScroll:  { gap: 6, paddingRight: SPACING.md },
   divider:     { height: 1, backgroundColor: COLORS.border, marginHorizontal: SPACING.md },

   chip:        { paddingHorizontal: 10, paddingVertical: 4, borderRadius: RADIUS.round,
                  backgroundColor: COLORS.inputBg, borderWidth: 1, borderColor: COLORS.border },
   chipActive:  { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
   chipTxt:     { fontSize: 11, color: COLORS.textSecondary },
   chipTxtActive: { color: '#fff', fontWeight: '600' },

   resultBar:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
                  paddingHorizontal: SPACING.md, paddingVertical: 6,
                  backgroundColor: COLORS.white, borderBottomWidth: 1, borderBottomColor: COLORS.border },
   resultTxt:  { fontSize: 11, color: COLORS.textMuted },
   clearTxt:   { fontSize: 11, color: COLORS.primary, fontWeight: '600' },

   dateLabel: { fontSize: 11, fontWeight: '600', color: COLORS.textMuted,
                  marginTop: SPACING.sm, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 },
   txCard:  { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.white,
               borderRadius: RADIUS.md, padding: SPACING.sm, marginBottom: SPACING.sm,
               shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, elevation: 1 },
   txIcon:  { width: 34, height: 34, borderRadius: 17, justifyContent: 'center',
               alignItems: 'center', marginRight: 10 },
   txMid:   { flex: 1 },
   txTitle: { fontSize: 14, fontWeight: '500', color: COLORS.textPrimary },
   txCat:   { fontSize: 12, color: COLORS.textMuted },
   txAmt:   { fontSize: 14, fontWeight: '600' },

   emptyBox: { alignItems: 'center', paddingVertical: 48, gap: SPACING.sm },
   emptyTxt: { color: COLORS.textMuted, fontSize: 14 },
});