import React, { useState, useCallback } from 'react';
import {
   View, Text, ScrollView, StyleSheet, TouchableOpacity,
   Alert, ActivityIndicator, RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { getHomeData, getSubscriptions, getGoals } from '../services/index';
import { COLORS, SPACING, RADIUS } from '../constants/theme';

export default function ProfileScreen() {
   const { user, logout } = useAuth();
   const [homeData,      setHomeData]      = useState(null);
   const [subsCount,     setSubsCount]     = useState(0);
   const [goalsCount,    setGoalsCount]    = useState(0);
   const [loading,       setLoading]       = useState(true);
   const [refreshing,    setRefreshing]    = useState(false);

   async function load(silent = false) {
      if (!silent) setLoading(true);
      try {
         const [hd, subs, goals] = await Promise.all([
         getHomeData(user.userId),
         getSubscriptions(user.userId),
         getGoals(user.userId),
         ]);
         setHomeData(hd);
         setSubsCount((subs || []).length);
         setGoalsCount((goals || []).length);
      } catch (e) {
         const msg = e?.message?.includes('timeout')
         ? 'Sunucuya ulaşılamadı. İnternet bağlantınızı kontrol edin.'
         : 'Veriler yüklenemedi. Lütfen tekrar deneyin.';
         Alert.alert('Bağlantı Hatası', msg);
      } finally {
         setLoading(false);
         setRefreshing(false);
      }
   }

   useFocusEffect(useCallback(() => { load(); }, []));

   function handleLogout() {
      Alert.alert(
         'Çıkış Yap',
         'Hesabınızdan çıkmak istediğinize emin misiniz?',
         [
         { text: 'İptal', style: 'cancel' },
         { text: 'Çıkış Yap', style: 'destructive', onPress: logout },
         ]
      );
   }

   // Avatar
   const initials = user?.username
      ? user.username.slice(0, 2).toUpperCase()
      : user?.email?.slice(0, 2).toUpperCase() || '??';

   if (loading) return (
      <View style={s.center}>
         <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
   );

   const netWorth   = homeData?.netWorth  ?? 0;
   const income     = homeData?.chartData?.income  ?? 0;
   const expense    = homeData?.chartData?.expense ?? 0;
   const accountCount = (homeData?.accounts ?? []).length;
   const txCount    = (homeData?.lastTransactions ?? []).length;

   return (
      <View style={s.root}>
         <ScrollView
         contentContainerStyle={{ paddingBottom: 40 }}
         refreshControl={
            <RefreshControl refreshing={refreshing}
               onRefresh={() => { setRefreshing(true); load(true); }} />
         }>

         {/* Gradient Header */}
         <View style={s.header}>
            <View style={s.avatar}>
               <Text style={s.avatarText}>{initials}</Text>
            </View>
            <Text style={s.userName}>{user?.username || 'Kullanıcı'}</Text>
            <Text style={s.userEmail}>{user?.email || ''}</Text>
         </View>

         {/* Finansal Ozet */}
         <View style={s.section}>
            <Text style={s.sectionTitle}>Finansal Özet</Text>
            <View style={s.summaryCard}>
               <View style={s.summaryRow}>
               <View style={s.summaryItem}>
                  <Text style={s.summaryLabel}>Net Değer</Text>
                  <Text style={[s.summaryValue, { color: netWorth >= 0 ? COLORS.income : COLORS.expense }]}>
                     {netWorth.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                  </Text>
               </View>
               </View>
               <View style={s.divider} />
               <View style={s.summaryRow}>
               <View style={s.summaryItem}>
                  <View style={s.summaryLabelRow}>
                     <View style={[s.dot, { backgroundColor: COLORS.income }]} />
                     <Text style={s.summaryLabel}>Toplam Gelir</Text>
                  </View>
                  <Text style={[s.summaryValue, { color: COLORS.income }]}>
                     {income.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                  </Text>
               </View>
               <View style={s.summaryItem}>
                  <View style={s.summaryLabelRow}>
                     <View style={[s.dot, { backgroundColor: COLORS.expense }]} />
                     <Text style={s.summaryLabel}>Toplam Gider</Text>
                  </View>
                  <Text style={[s.summaryValue, { color: COLORS.expense }]}>
                     {expense.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                  </Text>
               </View>
               </View>
            </View>
         </View>

         {/* İstatistik Kartlari */}
         <View style={s.section}>
            <Text style={s.sectionTitle}>İstatistikler</Text>
            <View style={s.grid}>
               <View style={[s.gridCard, { borderLeftColor: COLORS.primary }]}>
               <Ionicons name="card-outline" size={22} color={COLORS.primary} />
               <Text style={s.gridVal}>{accountCount}</Text>
               <Text style={s.gridLbl}>Hesap</Text>
               </View>
               <View style={[s.gridCard, { borderLeftColor: COLORS.income }]}>
               <Ionicons name="swap-horizontal-outline" size={22} color={COLORS.income} />
               <Text style={s.gridVal}>{txCount}+</Text>
               <Text style={s.gridLbl}>İşlem</Text>
               </View>
               <View style={[s.gridCard, { borderLeftColor: '#F59E0B' }]}>
               <Ionicons name="trophy-outline" size={22} color="#F59E0B" />
               <Text style={s.gridVal}>{goalsCount}</Text>
               <Text style={s.gridLbl}>Hedef</Text>
               </View>
               <View style={[s.gridCard, { borderLeftColor: '#8B5CF6' }]}>
               <Ionicons name="repeat-outline" size={22} color="#8B5CF6" />
               <Text style={s.gridVal}>{subsCount}</Text>
               <Text style={s.gridLbl}>Abonelik</Text>
               </View>
            </View>
         </View>

         {/* Uygulama Bilgisi */}
         <View style={s.section}>
            <Text style={s.sectionTitle}>Uygulama</Text>
            <View style={s.infoCard}>
               <View style={s.infoRow}>
               <Ionicons name="information-circle-outline" size={18} color={COLORS.textMuted} />
               <Text style={s.infoLabel}>Sürüm</Text>
               <Text style={s.infoValue}>1.0.0</Text>
               </View>
               <View style={s.infoDivider} />
               <View style={s.infoRow}>
               <Ionicons name="server-outline" size={18} color={COLORS.textMuted} />
               <Text style={s.infoLabel}>Backend</Text>
               <Text style={s.infoValue}>ASP.NET Core 8</Text>
               </View>
               <View style={s.infoDivider} />
               <View style={s.infoRow}>
               <Ionicons name="phone-portrait-outline" size={18} color={COLORS.textMuted} />
               <Text style={s.infoLabel}>Platform</Text>
               <Text style={s.infoValue}>React Native (Expo 55)</Text>
               </View>
            </View>
         </View>

         {/* Çıkış Yap */}
         <View style={s.section}>
            <TouchableOpacity style={s.logoutBtn} onPress={handleLogout}>
               <Ionicons name="log-out-outline" size={20} color="#EF4444" />
               <Text style={s.logoutTxt}>Çıkış Yap</Text>
            </TouchableOpacity>
         </View>

         </ScrollView>
      </View>
   );
}

const s = StyleSheet.create({
   root:   { flex: 1, backgroundColor: COLORS.background },
   center: { flex: 1, justifyContent: 'center', alignItems: 'center' },

   header: {
      backgroundColor: COLORS.primary,
      paddingTop: 64,
      paddingBottom: 32,
      alignItems: 'center',
      gap: 8,
   },
   avatar: {
      width: 72, height: 72, borderRadius: 36,
      backgroundColor: 'rgba(255,255,255,0.25)',
      justifyContent: 'center', alignItems: 'center',
      marginBottom: 4,
   },
   avatarText: { fontSize: 26, fontWeight: 'bold', color: '#fff' },
   userName:   { fontSize: 20, fontWeight: 'bold', color: '#fff' },
   userEmail:  { fontSize: 13, color: 'rgba(255,255,255,0.75)' },

   section:      { paddingHorizontal: SPACING.md, marginTop: SPACING.md },
   sectionTitle: { fontSize: 13, fontWeight: '700', color: COLORS.textMuted,
                     textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: SPACING.sm },

   summaryCard: { backgroundColor: COLORS.white, borderRadius: RADIUS.md,
                  padding: SPACING.md,
                  shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, elevation: 1 },
   summaryRow:  { flexDirection: 'row' },
   summaryItem: { flex: 1 },
   summaryLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
   dot:         { width: 8, height: 8, borderRadius: 4 },
   summaryLabel: { fontSize: 12, color: COLORS.textMuted },
   summaryValue: { fontSize: 17, fontWeight: 'bold', color: COLORS.textPrimary, marginTop: 2 },
   divider:     { height: 1, backgroundColor: COLORS.border, marginVertical: SPACING.sm },

   grid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm },
   gridCard: { flex: 1, minWidth: '45%', backgroundColor: COLORS.white,
               borderRadius: RADIUS.md, padding: SPACING.md,
               borderLeftWidth: 4, alignItems: 'flex-start', gap: 4,
               shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, elevation: 1 },
   gridVal: { fontSize: 22, fontWeight: 'bold', color: COLORS.textPrimary },
   gridLbl: { fontSize: 12, color: COLORS.textMuted },

   infoCard: { backgroundColor: COLORS.white, borderRadius: RADIUS.md,
               shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, elevation: 1 },
   infoRow:     { flexDirection: 'row', alignItems: 'center', padding: SPACING.md, gap: 10 },
   infoLabel:   { flex: 1, fontSize: 14, color: COLORS.textSecondary },
   infoValue:   { fontSize: 14, color: COLORS.textPrimary, fontWeight: '500' },
   infoDivider: { height: 1, backgroundColor: COLORS.border, marginHorizontal: SPACING.md },

   logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
                  gap: 8, backgroundColor: '#FEF2F2', borderRadius: RADIUS.md,
                  paddingVertical: 14, borderWidth: 1, borderColor: '#FECACA' },
   logoutTxt: { fontSize: 15, fontWeight: '600', color: '#EF4444' },
});