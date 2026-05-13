import React, { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  Alert, ActivityIndicator, RefreshControl, Modal, TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import {
  getSubscriptions, createSubscription,
  paySubscription, skipSubscription, deleteSubscription,
} from '../services/index';
import { getAccounts } from '../services/index';
import { COLORS, SPACING, RADIUS } from '../constants/theme';

const CATEGORIES = ['Müzik', 'Video', 'Oyun', 'Bulut', 'Yazılım', 'Spor', 'Haber', 'Diğer'];

function daysUntil(dateStr) {
   const today = new Date();
   today.setHours(0, 0, 0, 0);
   const target = new Date(dateStr);
   target.setHours(0, 0, 0, 0);
   return Math.round((target - today) / (1000 * 60 * 60 * 24));
}

export default function SubscriptionsScreen() {
   const { user } = useAuth();
   const [subs, setSubs]         = useState([]);
   const [accounts, setAccounts] = useState([]);
   const [loading, setLoading]   = useState(true);
   const [refreshing, setRefreshing] = useState(false);

   // Yeni abonelik modal
   const [showAddModal, setShowAddModal] = useState(false);
   const [form, setForm] = useState({
      name: '', category: '', fee: '', paymentDay: '',
   });

   // Ödeme modal
   const [showPayModal, setShowPayModal]   = useState(false);
   const [payTarget, setPayTarget]         = useState(null);
   const [selectedAccountId, setSelectedAccountId] = useState('');

   async function load(silent = false) {
      if (!silent) setLoading(true);
      try {
         const [s, a] = await Promise.all([
         getSubscriptions(user.userId),
         getAccounts(user.userId),
         ]);
         setSubs(s || []);
         setAccounts(a || []);
      } catch (e) { Alert.alert('Hata', 'Veriler yüklenemedi'); }
      finally { setLoading(false); setRefreshing(false); }
   }

   useFocusEffect(useCallback(() => { load(); }, []));

   // ─── Özet hesapla ───
   const monthlyTotal = subs.reduce((sum, s) => sum + s.monthlyFee, 0);
   const upcomingCount = subs.filter(s => {
      const d = daysUntil(s.nextPaymentDate);
      return d >= 0 && d <= 7;
   }).length;

   // ─── Yeni abonelik kaydet ───
   async function handleAddSave() {
      if (!form.name.trim() || !form.fee || !form.category || !form.paymentDay) {
         Alert.alert('Hata', 'Tüm alanlar zorunlu'); return;
      }
      const day = parseInt(form.paymentDay);
      if (isNaN(day) || day < 1 || day > 31) {
         Alert.alert('Hata', 'Ödeme günü 1-31 arasında olmalı'); return;
      }
      try {
         await createSubscription({
         userId:               user.userId,
         subscriptionName:     form.name.trim(),
         subscriptionCategory: form.category,
         monthlyFee:           parseFloat(form.fee),
         paymentDay:           day,
         });
         setShowAddModal(false);
         setForm({ name: '', category: '', fee: '', paymentDay: '' });
         load(true);
      } catch (e) { Alert.alert('Hata', 'Abonelik eklenemedi'); }
   }

   // ─── Öde ───
   function openPay(sub) {
      setPayTarget(sub);
      setSelectedAccountId(accounts[0]?.accountId?.toString() || '');
      setShowPayModal(true);
   }

   async function handlePay() {
      if (!selectedAccountId) { Alert.alert('Hata', 'Hesap seçin'); return; }
      try {
         await paySubscription(payTarget.subscriptionId, {
         accountId: parseInt(selectedAccountId),
         note: `${payTarget.subscriptionName} aylık ödeme`,
         });
         setShowPayModal(false);
         load(true);
      } catch (e) { Alert.alert('Hata', 'Ödeme yapılamadı'); }
   }

   // ─── Atla ───
   function handleSkip(sub) {
      Alert.alert(
         'Ödemeyi Atla',
         `"${sub.subscriptionName}" ödemesi bir sonraki aya ertelensin mi?`,
         [
         { text: 'İptal', style: 'cancel' },
         { text: 'Atla', onPress: async () => {
            try { await skipSubscription(sub.subscriptionId); load(true); }
            catch (e) { Alert.alert('Hata', 'İşlem başarısız'); }
         }},
         ]
      );
   }

   // ─── Sil ───
   function handleDelete(sub) {
      Alert.alert(
         'Aboneliği Sil',
         `"${sub.subscriptionName}" silinsin mi?`,
         [
         { text: 'İptal', style: 'cancel' },
         { text: 'Sil', style: 'destructive', onPress: async () => {
            try { await deleteSubscription(sub.subscriptionId); load(true); }
            catch (e) { Alert.alert('Hata', 'Silinemedi'); }
         }},
         ]
      );
   }

   if (loading) return (
      <View style={s.center}><ActivityIndicator size="large" color={COLORS.primary} /></View>
   );

   return (
      <View style={s.root}>

         {/* Başlık */}
         <View style={s.topBar}>
         <Text style={s.topTitle}>Abonelikler</Text>
         <TouchableOpacity style={s.addBtn} onPress={() => setShowAddModal(true)}>
            <Ionicons name="add" size={18} color="#fff" />
            <Text style={s.addBtnTxt}>Yeni</Text>
         </TouchableOpacity>
         </View>

         <ScrollView
         contentContainerStyle={{ padding: SPACING.md }}
         refreshControl={
            <RefreshControl refreshing={refreshing}
               onRefresh={() => { setRefreshing(true); load(true); }} />
         }>

         {/* Özet kartları */}
         <View style={s.summaryRow}>
            <View style={[s.summaryCard, { flex: 1.2 }]}>
               <Ionicons name="card-outline" size={20} color={COLORS.primary} />
               <Text style={s.summaryVal}>
               {monthlyTotal.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
               </Text>
               <Text style={s.summaryLbl}>Aylık Toplam</Text>
            </View>
            <View style={s.summaryCard}>
               <Ionicons name="albums-outline" size={20} color={COLORS.primary} />
               <Text style={s.summaryVal}>{subs.length}</Text>
               <Text style={s.summaryLbl}>Aktif</Text>
            </View>
            <View style={[s.summaryCard, { backgroundColor: upcomingCount > 0 ? '#FFF7ED' : COLORS.white }]}>
               <Ionicons name="alarm-outline" size={20} color={upcomingCount > 0 ? '#F97316' : COLORS.primary} />
               <Text style={[s.summaryVal, { color: upcomingCount > 0 ? '#F97316' : COLORS.textPrimary }]}>
               {upcomingCount}
               </Text>
               <Text style={s.summaryLbl}>Bu Hafta</Text>
            </View>
         </View>

         {/* Abonelik kartları */}
         {subs.length === 0 ? (
            <View style={s.emptyBox}>
               <Ionicons name="albums-outline" size={48} color={COLORS.textMuted} />
               <Text style={s.emptyTxt}>Henüz abonelik yok</Text>
               <Text style={s.emptySubTxt}>Yeni butonuyla abonelik ekleyebilirsin</Text>
            </View>
         ) : (
            subs
               .slice()
               .sort((a, b) => daysUntil(a.nextPaymentDate) - daysUntil(b.nextPaymentDate))
               .map(sub => {
               const days = daysUntil(sub.nextPaymentDate);
               const isUrgent = days >= 0 && days <= 3;
               const isUpcoming = days > 3 && days <= 7;
               const isOverdue = days < 0;

               let badgeColor = COLORS.textMuted;
               let badgeBg = COLORS.inputBg;
               let badgeText = `${days} gün sonra`;
               if (isOverdue)  { badgeColor = '#EF4444'; badgeBg = '#FEE2E2'; badgeText = 'Gecikmiş'; }
               if (isUrgent)   { badgeColor = '#EF4444'; badgeBg = '#FEE2E2'; badgeText = days === 0 ? 'Bugün!' : `${days} gün`; }
               if (isUpcoming) { badgeColor = '#F97316'; badgeBg = '#FFF7ED'; badgeText = `${days} gün`; }

               return (
                  <View key={sub.subscriptionId}
                     style={[s.subCard, (isUrgent || isOverdue) && s.subCardUrgent]}>
                     <View style={s.subCardTop}>
                     <View style={s.subIcon}>
                        <Ionicons name="repeat-outline" size={18} color={COLORS.primary} />
                     </View>
                     <View style={s.subMid}>
                        <Text style={s.subName}>{sub.subscriptionName}</Text>
                        <Text style={s.subCat}>{sub.subscriptionCategory}</Text>
                     </View>
                     <View style={s.subRight}>
                        <Text style={s.subFee}>
                           {parseFloat(sub.monthlyFee).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                        </Text>
                        <Text style={s.subFeeLabel}>/ay</Text>
                     </View>
                     </View>

                     <View style={s.subCardBottom}>
                     <View style={[s.badge, { backgroundColor: badgeBg }]}>
                        <Ionicons name="calendar-outline" size={12} color={badgeColor} />
                        <Text style={[s.badgeTxt, { color: badgeColor }]}>{badgeText}</Text>
                     </View>
                     <View style={s.actionRow}>
                        <TouchableOpacity style={s.skipBtn} onPress={() => handleSkip(sub)}>
                           <Text style={s.skipTxt}>Atla</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={s.payBtn} onPress={() => openPay(sub)}>
                           <Text style={s.payTxt}>Öde</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={s.deleteBtn} onPress={() => handleDelete(sub)}>
                           <Ionicons name="trash-outline" size={15} color="#EF4444" />
                        </TouchableOpacity>
                     </View>
                     </View>
                  </View>
               );
               })
         )}
         </ScrollView>

         {/* YENİ ABONELİK MODAL */}
         <Modal visible={showAddModal} transparent animationType="slide"
         onRequestClose={() => setShowAddModal(false)}>
         <View style={s.overlay}>
            <View style={s.modalCard}>
               <Text style={s.modalTitle}>Yeni Abonelik</Text>

               <TextInput style={s.minput} placeholder="Abonelik adı (örn. Spotify)"
               value={form.name} onChangeText={v => setForm(f => ({ ...f, name: v }))}
               placeholderTextColor={COLORS.textMuted} />
               <TextInput style={s.minput} placeholder="Aylık tutar (₺)"
               value={form.fee} onChangeText={v => setForm(f => ({ ...f, fee: v }))}
               keyboardType="numeric" placeholderTextColor={COLORS.textMuted} />
               <TextInput style={s.minput} placeholder="Ödeme günü (1-31)"
               value={form.paymentDay} onChangeText={v => setForm(f => ({ ...f, paymentDay: v }))}
               keyboardType="numeric" placeholderTextColor={COLORS.textMuted} />

               <Text style={s.chipLabel}>Kategori</Text>
               <ScrollView horizontal showsHorizontalScrollIndicator={false}
               style={{ marginBottom: SPACING.md }}>
               {CATEGORIES.map(c => (
                  <TouchableOpacity key={c}
                     style={[s.chip, form.category === c && s.chipActive, { marginRight: 6 }]}
                     onPress={() => setForm(f => ({ ...f, category: c }))}>
                     <Text style={[s.chipTxt, form.category === c && s.chipTxtActive]}>{c}</Text>
                  </TouchableOpacity>
               ))}
               </ScrollView>

               <View style={s.modalBtns}>
               <TouchableOpacity style={s.modalCancel} onPress={() => setShowAddModal(false)}>
                  <Text style={s.modalCancelTxt}>İptal</Text>
               </TouchableOpacity>
               <TouchableOpacity style={s.modalSave} onPress={handleAddSave}>
                  <Text style={s.modalSaveTxt}>Ekle</Text>
               </TouchableOpacity>
               </View>
            </View>
         </View>
         </Modal>

         {/* ÖDEME MODAL */}
         <Modal visible={showPayModal} transparent animationType="slide"
         onRequestClose={() => setShowPayModal(false)}>
         <View style={s.overlay}>
            <View style={s.modalCard}>
               <Text style={s.modalTitle}>Ödeme Yap</Text>
               {payTarget && (
               <View style={s.payInfo}>
                  <Text style={s.payInfoName}>{payTarget.subscriptionName}</Text>
                  <Text style={s.payInfoFee}>
                     {parseFloat(payTarget.monthlyFee).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                  </Text>
               </View>
               )}
               <Text style={s.chipLabel}>Hesap Seç</Text>
               <ScrollView horizontal showsHorizontalScrollIndicator={false}
               style={{ marginBottom: SPACING.md }}>
               {accounts.map(a => (
                  <TouchableOpacity key={a.accountId}
                     style={[s.chip, selectedAccountId === a.accountId.toString() && s.chipActive, { marginRight: 6 }]}
                     onPress={() => setSelectedAccountId(a.accountId.toString())}>
                     <Text style={[s.chipTxt, selectedAccountId === a.accountId.toString() && s.chipTxtActive]}>
                     {a.accountName}
                     </Text>
                  </TouchableOpacity>
               ))}
               </ScrollView>
               <View style={s.modalBtns}>
               <TouchableOpacity style={s.modalCancel} onPress={() => setShowPayModal(false)}>
                  <Text style={s.modalCancelTxt}>İptal</Text>
               </TouchableOpacity>
               <TouchableOpacity style={s.modalSave} onPress={handlePay}>
                  <Text style={s.modalSaveTxt}>Öde</Text>
               </TouchableOpacity>
               </View>
            </View>
         </View>
         </Modal>

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
   addBtn:   { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.primary,
               borderRadius: RADIUS.round, paddingHorizontal: 12, paddingVertical: 6, gap: 4 },
   addBtnTxt: { color: '#fff', fontSize: 13, fontWeight: '600' },

   summaryRow:  { flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.md },
   summaryCard: { flex: 1, backgroundColor: COLORS.white, borderRadius: RADIUS.md,
                  padding: SPACING.sm, alignItems: 'center', gap: 4,
                  shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, elevation: 1 },
   summaryVal: { fontSize: 15, fontWeight: 'bold', color: COLORS.textPrimary },
   summaryLbl: { fontSize: 10, color: COLORS.textMuted },

   subCard: { backgroundColor: COLORS.white, borderRadius: RADIUS.md, marginBottom: SPACING.sm,
               padding: SPACING.md, borderLeftWidth: 3, borderLeftColor: 'transparent',
               shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, elevation: 1 },
   subCardUrgent: { borderLeftColor: '#EF4444' },
   subCardTop:    { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
   subIcon: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#EEF2FF',
               justifyContent: 'center', alignItems: 'center', marginRight: 10 },
   subMid:  { flex: 1 },
   subName: { fontSize: 15, fontWeight: '600', color: COLORS.textPrimary },
   subCat:  { fontSize: 12, color: COLORS.textMuted },
   subRight: { alignItems: 'flex-end' },
   subFee:   { fontSize: 16, fontWeight: 'bold', color: COLORS.textPrimary },
   subFeeLabel: { fontSize: 10, color: COLORS.textMuted },

   subCardBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
   badge:     { flexDirection: 'row', alignItems: 'center', gap: 4,
                  paddingHorizontal: 8, paddingVertical: 4, borderRadius: RADIUS.round },
   badgeTxt:  { fontSize: 11, fontWeight: '600' },
   actionRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
   skipBtn:   { paddingHorizontal: 12, paddingVertical: 6, borderRadius: RADIUS.md,
                  backgroundColor: COLORS.inputBg, borderWidth: 1, borderColor: COLORS.border },
   skipTxt:   { fontSize: 12, color: COLORS.textSecondary, fontWeight: '600' },
   payBtn:    { paddingHorizontal: 12, paddingVertical: 6, borderRadius: RADIUS.md,
                  backgroundColor: COLORS.primary },
   payTxt:    { fontSize: 12, color: '#fff', fontWeight: '600' },
   deleteBtn: { padding: 6 },

   emptyBox:    { alignItems: 'center', paddingVertical: 64, gap: SPACING.sm },
   emptyTxt:    { fontSize: 15, fontWeight: '600', color: COLORS.textMuted },
   emptySubTxt: { fontSize: 13, color: COLORS.textMuted, textAlign: 'center' },

   overlay:   { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
   modalCard: { backgroundColor: COLORS.white, borderTopLeftRadius: RADIUS.xl,
                  borderTopRightRadius: RADIUS.xl, padding: SPACING.lg, paddingBottom: 40 },
   modalTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.textPrimary, marginBottom: SPACING.md },
   minput:     { backgroundColor: COLORS.inputBg, borderRadius: RADIUS.md,
                  paddingHorizontal: SPACING.md, paddingVertical: 13,
                  fontSize: 15, color: COLORS.textPrimary, marginBottom: SPACING.sm },
   chipLabel:  { fontSize: 13, color: COLORS.textSecondary, marginBottom: 6 },
   chip:          { paddingHorizontal: 12, paddingVertical: 6, borderRadius: RADIUS.round,
                     backgroundColor: COLORS.inputBg, borderWidth: 1, borderColor: COLORS.border },
   chipActive:    { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
   chipTxt:       { fontSize: 12, color: COLORS.textSecondary },
   chipTxtActive: { color: '#fff', fontWeight: '600' },
   modalBtns:      { flexDirection: 'row', gap: SPACING.sm, marginTop: SPACING.sm },
   modalCancel:    { flex: 1, paddingVertical: 13, borderRadius: RADIUS.md, borderWidth: 1,
                     borderColor: COLORS.border, alignItems: 'center' },
   modalCancelTxt: { color: COLORS.textSecondary, fontWeight: '600' },
   modalSave:      { flex: 1, paddingVertical: 13, borderRadius: RADIUS.md,
                     backgroundColor: COLORS.primary, alignItems: 'center' },
   modalSaveTxt:   { color: '#fff', fontWeight: '600' },

   payInfo:     { backgroundColor: COLORS.inputBg, borderRadius: RADIUS.md,
                  padding: SPACING.md, alignItems: 'center', marginBottom: SPACING.md },
   payInfoName: { fontSize: 16, fontWeight: '600', color: COLORS.textPrimary },
   payInfoFee:  { fontSize: 22, fontWeight: 'bold', color: COLORS.primary, marginTop: 4 },
});
