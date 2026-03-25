import React, { useState, useCallback } from 'react';
import {
   View, Text, ScrollView, StyleSheet, TouchableOpacity,
   Alert, Modal, TextInput, RefreshControl, ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { getAccounts, createAccount, deleteAccount } from '../services/index';
import { COLORS, SPACING, RADIUS } from '../constants/theme';

export default function HomeScreen() {
   const { user, logout } = useAuth();
   const [accounts, setAccounts]     = useState([]);
   const [loading, setLoading]       = useState(true);
   const [refreshing, setRefreshing] = useState(false);
   const [addAccModal, setAddAccModal] = useState(false);
   const [accName, setAccName]       = useState('');
   const [accBalance, setAccBalance] = useState('');
   const [saving, setSaving]         = useState(false);

   async function load(silent = false) {
      if (!silent) setLoading(true);
      try {
         const data = await getAccounts(user.userId);
         setAccounts(data || []);
      } catch (e) {
         Alert.alert('Hata', 'Hesaplar yüklenemedi');
      } finally {
         setLoading(false);
         setRefreshing(false);
      }
   }

   useFocusEffect(useCallback(() => { load(); }, []));

   const netWorth = accounts.reduce((sum, a) => sum + parseFloat(a.accountBalance || 0), 0);

   async function handleAddAccount() {
      if (!accName.trim() || !accBalance.trim()) { Alert.alert('Hata', 'Tüm alanları doldurun'); return; }
      setSaving(true);
      try {
         await createAccount({ userId: user.userId, accountName: accName.trim(), accountBalance: parseFloat(accBalance), currency: 'TRY' });
         setAddAccModal(false); setAccName(''); setAccBalance('');
         load(true);
      } catch (e) { Alert.alert('Hata', 'Hesap eklenemedi'); }
      finally { setSaving(false); }
   }

   async function handleDeleteAccount(id, name) {
      Alert.alert('Hesabı Sil', `"${name}" hesabını silmek istiyor musun?`, [
         { text: 'İptal', style: 'cancel' },
         { text: 'Sil', style: 'destructive', onPress: async () => {
         try { await deleteAccount(id); load(true); }
         catch (e) { Alert.alert('Hata', 'Hesap silinemedi'); }
         }}
      ]);
   }

   if (loading) return (
      <View style={s.center}>
         <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
   );

   return (
      <ScrollView style={s.root} showsVerticalScrollIndicator={false}
         refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(true); }} colors={[COLORS.primary]} />}>

         {/* Header */}
         <LinearGradient colors={[COLORS.primary, COLORS.primaryDark]} style={s.header}>
         <View style={s.headerTop}>
            <View>
               <Text style={s.greeting}>Merhaba, {user?.username} 👋</Text>
               <Text style={s.netWorthLabel}>Toplam Net Değer</Text>
               <Text style={s.netWorthValue}>
               {netWorth.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
               </Text>
            </View>
            <TouchableOpacity style={s.logoutBtn} onPress={logout}>
               <Ionicons name="log-out-outline" size={22} color="rgba(255,255,255,0.8)" />
            </TouchableOpacity>
         </View>
         </LinearGradient>

         <View style={s.body}>
         {/* Hesaplar */}
         <View style={s.section}>
            <View style={s.sectionHeader}>
               <Text style={s.sectionTitle}>Hesaplarım</Text>
               <TouchableOpacity style={s.addBtn} onPress={() => setAddAccModal(true)}>
               <Ionicons name="add" size={18} color={COLORS.white} />
               <Text style={s.addBtnTxt}>Ekle</Text>
               </TouchableOpacity>
            </View>

            {accounts.length === 0 ? (
               <View style={s.emptyBox}>
               <Ionicons name="wallet-outline" size={40} color={COLORS.textMuted} />
               <Text style={s.emptyTxt}>Henüz hesap yok. Yukarıdaki "Ekle" butonuna basın.</Text>
               </View>
            ) : (
               <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.cardScroll}>
               {accounts.map(acc => (
                  <TouchableOpacity key={acc.accountId} style={s.accCard}
                     onLongPress={() => handleDeleteAccount(acc.accountId, acc.accountName)}>
                     <View style={s.accIconWrap}>
                     <Ionicons name="card-outline" size={24} color={COLORS.primary} />
                     </View>
                     <Text style={s.accName} numberOfLines={1}>{acc.accountName}</Text>
                     <Text style={s.accBalance}>
                     {parseFloat(acc.accountBalance).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                     </Text>
                     <Text style={s.accHint}>Silmek için basılı tut</Text>
                  </TouchableOpacity>
               ))}
               </ScrollView>
            )}
         </View>

         {/* ! Hafta 3 icin bilgi notu ! */}
         <View style={s.infoBox}>
            <Ionicons name="information-circle-outline" size={18} color={COLORS.info} />
            <Text style={s.infoTxt}>
               Gelir/Gider grafikleri ve bütçe bilgileri Hafta 3'te eklenecek.
            </Text>
         </View>
         </View>

         {/* Hesap Ekle Pop-up */}
         <Modal visible={addAccModal} transparent animationType="slide" onRequestClose={() => setAddAccModal(false)}>
         <View style={s.modalOverlay}>
            <View style={s.modalCard}>
               <Text style={s.modalTitle}>Yeni Hesap Ekle</Text>
               <TextInput style={s.modalInput} placeholder="Hesap adı (örn: Akbank)" value={accName}
               onChangeText={setAccName} placeholderTextColor={COLORS.textMuted} />
               <TextInput style={s.modalInput} placeholder="Başlangıç bakiyesi" value={accBalance}
               onChangeText={setAccBalance} keyboardType="numeric" placeholderTextColor={COLORS.textMuted} />
               <View style={s.modalBtns}>
               <TouchableOpacity style={s.modalCancel} onPress={() => setAddAccModal(false)}>
                  <Text style={s.modalCancelTxt}>İptal</Text>
               </TouchableOpacity>
               <TouchableOpacity style={[s.modalSave, saving && { opacity: 0.6 }]} onPress={handleAddAccount} disabled={saving}>
                  {saving ? <ActivityIndicator color="#fff" size="small" /> : <Text style={s.modalSaveTxt}>Kaydet</Text>}
               </TouchableOpacity>
               </View>
            </View>
         </View>
         </Modal>
      </ScrollView>
   );
}

const s = StyleSheet.create({
   root:    { flex: 1, backgroundColor: COLORS.background },
   center:  { flex: 1, justifyContent: 'center', alignItems: 'center' },
   header:  { paddingTop: 60, paddingBottom: 32, paddingHorizontal: SPACING.lg },
   headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
   logoutBtn: { padding: 4, marginTop: 4 },
   greeting:  { color: 'rgba(255,255,255,0.85)', fontSize: 15, marginBottom: 8 },
   netWorthLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 13 },
   netWorthValue: { color: '#fff', fontSize: 34, fontWeight: 'bold', marginTop: 4 },
   body:    { padding: SPACING.md },
   section: { backgroundColor: COLORS.white, borderRadius: RADIUS.lg, padding: SPACING.md, marginBottom: SPACING.md,
               shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
   sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.sm },
   sectionTitle:  { fontSize: 16, fontWeight: '700', color: COLORS.textPrimary },
   addBtn:  { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.primary,
               borderRadius: RADIUS.round, paddingHorizontal: 12, paddingVertical: 6, gap: 4 },
   addBtnTxt: { color: '#fff', fontSize: 13, fontWeight: '600' },
   emptyBox:  { alignItems: 'center', paddingVertical: SPACING.lg, gap: SPACING.sm },
   emptyTxt:  { color: COLORS.textMuted, fontSize: 13, textAlign: 'center' },
   cardScroll: { marginHorizontal: -SPACING.sm },
   accCard: { backgroundColor: COLORS.background, borderRadius: RADIUS.lg, padding: SPACING.md,
               marginHorizontal: SPACING.sm, width: 160, alignItems: 'center' },
   accIconWrap: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#EEF2FF',
                  justifyContent: 'center', alignItems: 'center', marginBottom: SPACING.sm },
   accName:    { fontSize: 13, color: COLORS.textSecondary, textAlign: 'center', marginBottom: 4, fontWeight: '500' },
   accBalance: { fontSize: 16, fontWeight: 'bold', color: COLORS.textPrimary, textAlign: 'center' },
   accHint:    { fontSize: 10, color: COLORS.textMuted, marginTop: 4 },
   infoBox:    { flexDirection: 'row', alignItems: 'center', backgroundColor: '#EFF6FF', borderRadius: RADIUS.md,
                  padding: SPACING.sm, gap: SPACING.sm },
   infoTxt:    { flex: 1, fontSize: 12, color: COLORS.info },
   modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
   modalCard:    { backgroundColor: COLORS.white, borderTopLeftRadius: RADIUS.xl, borderTopRightRadius: RADIUS.xl,
                     padding: SPACING.lg, paddingBottom: 40 },
   modalTitle:   { fontSize: 18, fontWeight: 'bold', color: COLORS.textPrimary, marginBottom: SPACING.md },
   modalInput:   { backgroundColor: COLORS.inputBg, borderRadius: RADIUS.md, paddingHorizontal: SPACING.md,
                     paddingVertical: 13, fontSize: 15, color: COLORS.textPrimary, marginBottom: SPACING.sm },
   modalBtns:    { flexDirection: 'row', gap: SPACING.sm, marginTop: SPACING.sm },
   modalCancel:  { flex: 1, paddingVertical: 13, borderRadius: RADIUS.md, borderWidth: 1,
                     borderColor: COLORS.border, alignItems: 'center' },
   modalCancelTxt: { color: COLORS.textSecondary, fontWeight: '600' },
   modalSave:    { flex: 1, paddingVertical: 13, borderRadius: RADIUS.md,
                     backgroundColor: COLORS.primary, alignItems: 'center' },
   modalSaveTxt: { color: '#fff', fontWeight: '600' },
});
