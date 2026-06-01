import React, { useState, useCallback } from 'react';
import {
   View, Text, ScrollView, StyleSheet, TouchableOpacity,
   Alert, ActivityIndicator, RefreshControl, Modal, TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import {
   getGoals, createGoal, deleteGoal, contributeToGoal,
   getAccounts,
} from '../services/index';
import { COLORS, SPACING, RADIUS } from '../constants/theme';

const GOAL_TYPES = ['Birikim', 'Tatil', 'Araç', 'Konut', 'Eğitim', 'Emeklilik', 'Diğer'];

function daysLeft(dateStr) {
   const today = new Date();
   today.setHours(0, 0, 0, 0);
   const target = new Date(dateStr);
   target.setHours(0, 0, 0, 0);
   return Math.round((target - today) / (1000 * 60 * 60 * 24));
}

export default function GoalsScreen() {
   const { user } = useAuth();
   const [goals, setGoals]       = useState([]);
   const [accounts, setAccounts] = useState([]);
   const [loading, setLoading]   = useState(true);
   const [refreshing, setRefreshing] = useState(false);

   const [showAddModal, setShowAddModal] = useState(false);
   const [form, setForm] = useState({
      goalType: '', goalName: '', targetAmount: '',
      startDate: new Date().toISOString().slice(0, 10),
      endDate: '',
   });

   const [showContribModal, setShowContribModal] = useState(false);
   const [contribTarget, setContribTarget]       = useState(null);
   const [contribForm, setContribForm] = useState({ amount: '', accountId: '', note: '' });

   async function load(silent = false) {
      if (!silent) setLoading(true);
      try {
         const [g, a] = await Promise.all([
         getGoals(user.userId),
         getAccounts(user.userId),
         ]);
         setGoals(g || []);
         setAccounts(a || []);
      } catch (e) {
         const msg = e?.message?.includes('timeout')
            ? 'Sunucuya ulaşılamadı. İnternet bağlantınızı kontrol edin.'
            : 'Veriler yüklenemedi. Lütfen tekrar deneyin.';
         Alert.alert('Bağlantı Hatası', msg);
      }
      finally { setLoading(false); setRefreshing(false); }
   }

   useFocusEffect(useCallback(() => { load(); }, []));

   async function handleAddSave() {
      if (!form.goalName.trim() || !form.targetAmount || !form.goalType || !form.endDate) {
         Alert.alert('Hata', 'Tüm alanlar zorunlu'); return;
      }
      try {
         await createGoal({
         userId:       user.userId,
         goalType:     form.goalType,
         goalName:     form.goalName.trim(),
         targetAmount: parseFloat(form.targetAmount),
         startDate:    new Date(form.startDate).toISOString(),
         endDate:      new Date(form.endDate).toISOString(),
         });
         setShowAddModal(false);
         setForm({ goalType: '', goalName: '', targetAmount: '', startDate: new Date().toISOString().slice(0, 10), endDate: '' });
         load(true);
      } catch (e) { Alert.alert('Hata', 'Hedef eklenemedi'); }
   }

   function openContrib(goal) {
      setContribTarget(goal);
      setContribForm({ amount: '', accountId: accounts[0]?.accountId?.toString() || '', note: '' });
      setShowContribModal(true);
   }

   async function handleContrib() {
      if (!contribForm.amount || !contribForm.accountId) {
         Alert.alert('Hata', 'Tutar ve hesap seçimi zorunlu'); return;
      }
      const amount = parseFloat(contribForm.amount);
      if (isNaN(amount) || amount <= 0) { Alert.alert('Hata', 'Geçerli bir tutar girin'); return; }
      try {
         await contributeToGoal(contribTarget.goalId, {
         accountId: parseInt(contribForm.accountId),
         amount,
         note: contribForm.note,
         });
         setShowContribModal(false);
         load(true);
      } catch (e) {
         Alert.alert('Hata', e?.response?.data || 'Katkı eklenemedi');
      }
   }

   function handleDelete(goal) {
      Alert.alert('Hedefi Sil', `"${goal.goalName}" silinsin mi?`, [
         { text: 'İptal', style: 'cancel' },
         { text: 'Sil', style: 'destructive', onPress: async () => {
         try { await deleteGoal(goal.goalId); load(true); }
         catch (e) { Alert.alert('Hata', 'Silinemedi'); }
         }},
      ]);
   }

   if (loading) return (
      <View style={s.center}><ActivityIndicator size="large" color={COLORS.primary} /></View>
   );

   const totalTarget  = goals.reduce((sum, g) => sum + g.targetAmount, 0);
   const totalCurrent = goals.reduce((sum, g) => sum + g.currentAmount, 0);
   const completed    = goals.filter(g => g.currentAmount >= g.targetAmount).length;

   return (
      <View style={s.root}>
         <View style={s.topBar}>
         <Text style={s.topTitle}>Hedefler</Text>
         <TouchableOpacity style={s.addBtn} onPress={() => setShowAddModal(true)}>
            <Ionicons name="add" size={18} color="#fff" />
            <Text style={s.addBtnTxt}>Yeni</Text>
         </TouchableOpacity>
         </View>

         <ScrollView contentContainerStyle={{ padding: SPACING.md }}
         refreshControl={<RefreshControl refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); load(true); }} />}>

         <View style={s.summaryRow}>
            <View style={s.summaryCard}>
               <Ionicons name="trophy-outline" size={20} color={COLORS.primary} />
               <Text style={s.summaryVal}>{goals.length}</Text>
               <Text style={s.summaryLbl}>Toplam</Text>
            </View>
            <View style={s.summaryCard}>
               <Ionicons name="checkmark-circle-outline" size={20} color={COLORS.income} />
               <Text style={[s.summaryVal, { color: COLORS.income }]}>{completed}</Text>
               <Text style={s.summaryLbl}>Tamamlanan</Text>
            </View>
            <View style={[s.summaryCard, { flex: 1.4 }]}>
               <Ionicons name="wallet-outline" size={20} color={COLORS.primary} />
               <Text style={s.summaryVal}>
               {totalCurrent.toLocaleString('tr-TR', { minimumFractionDigits: 0 })} ₺
               </Text>
               <Text style={s.summaryLbl}>
               {'/ ' + totalTarget.toLocaleString('tr-TR', { minimumFractionDigits: 0 }) + ' ₺'}
               </Text>
            </View>
         </View>

         {goals.length === 0 ? (
            <View style={s.emptyBox}>
               <Ionicons name="trophy-outline" size={48} color={COLORS.textMuted} />
               <Text style={s.emptyTxt}>Henüz hedef yok</Text>
               <Text style={s.emptySubTxt}>Yeni butonuyla finansal hedef ekleyebilirsin</Text>
            </View>
         ) : (
            goals.map(goal => {
               const target    = parseFloat(goal.targetAmount);
               const current   = parseFloat(goal.currentAmount);
               const pct       = target > 0 ? Math.min((current / target) * 100, 100) : 0;
               const remaining = Math.max(target - current, 0);
               const days      = daysLeft(goal.endDate);
               const isCompleted = current >= target;
               const barColor  = isCompleted ? COLORS.income
               : pct >= 75 ? '#10B981'
               : pct >= 40 ? COLORS.primary
               : '#F59E0B';

               return (
               <TouchableOpacity key={goal.goalId} style={s.goalCard}
                  onPress={() => openContrib(goal)}
                  onLongPress={() => handleDelete(goal)}>
                  <View style={s.goalTop}>
                     <View style={s.goalIconWrap}>
                     <Ionicons name="trophy" size={18} color={COLORS.primary} />
                     </View>
                     <View style={s.goalMid}>
                     <Text style={s.goalName}>{goal.goalName}</Text>
                     <Text style={s.goalType}>{goal.goalType}</Text>
                     </View>
                     {isCompleted ? (
                     <View style={s.completedBadge}>
                        <Ionicons name="checkmark-circle" size={16} color={COLORS.income} />
                        <Text style={s.completedTxt}>Tamamlandı</Text>
                     </View>
                     ) : (
                     <Text style={s.goalPct}>{pct.toFixed(0)}%</Text>
                     )}
                  </View>
                  <View style={s.barBg}>
                     <View style={[s.barFill, { width: `${pct}%`, backgroundColor: barColor }]} />
                  </View>
                  <View style={s.goalBottom}>
                     <Text style={s.goalAmounts}>
                     {current.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                     {' / '}
                     {target.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                     </Text>
                     <Text style={[s.goalDays, days <= 7 && !isCompleted && { color: COLORS.expense }]}>
                     {isCompleted ? '🎉 Hedefe ulaşıldı' : days > 0 ? `${days} gün kaldı` : 'Süre doldu'}
                     </Text>
                  </View>
                  {!isCompleted && (
                     <Text style={s.remainingTxt}>
                     {'Kalan: ' + remaining.toLocaleString('tr-TR', { minimumFractionDigits: 2 }) + ' ₺'}
                     </Text>
                  )}
                  <Text style={s.hintTxt}>Katkı eklemek için dokun · Silmek için basılı tut</Text>
               </TouchableOpacity>
               );
            })
         )}
         </ScrollView>

         {/* YENİ HEDEF MODAL */}
         <Modal visible={showAddModal} transparent animationType="slide"
         onRequestClose={() => setShowAddModal(false)}>
         <View style={s.overlay}>
            <View style={s.modalCard}>
               <Text style={s.modalTitle}>Yeni Hedef</Text>
               <ScrollView showsVerticalScrollIndicator={false}>
               <TextInput style={s.minput} placeholder="Hedef adı (örn. Araba Birikimleri)"
                  value={form.goalName} onChangeText={v => setForm(f => ({ ...f, goalName: v }))}
                  placeholderTextColor={COLORS.textMuted} />
               <TextInput style={s.minput} placeholder="Hedef tutarı (₺)"
                  value={form.targetAmount} onChangeText={v => setForm(f => ({ ...f, targetAmount: v }))}
                  keyboardType="numeric" placeholderTextColor={COLORS.textMuted} />
               <TextInput style={s.minput} placeholder="Başlangıç tarihi (YYYY-MM-DD)"
                  value={form.startDate} onChangeText={v => setForm(f => ({ ...f, startDate: v }))}
                  placeholderTextColor={COLORS.textMuted} />
               <TextInput style={s.minput} placeholder="Bitiş tarihi (YYYY-MM-DD)"
                  value={form.endDate} onChangeText={v => setForm(f => ({ ...f, endDate: v }))}
                  placeholderTextColor={COLORS.textMuted} />
               <Text style={s.chipLabel}>Tür</Text>
               <ScrollView horizontal showsHorizontalScrollIndicator={false}
                  style={{ marginBottom: SPACING.md }}>
                  {GOAL_TYPES.map(t => (
                     <TouchableOpacity key={t}
                     style={[s.chip, form.goalType === t && s.chipActive, { marginRight: 6 }]}
                     onPress={() => setForm(f => ({ ...f, goalType: t }))}>
                     <Text style={[s.chipTxt, form.goalType === t && s.chipTxtActive]}>{t}</Text>
                     </TouchableOpacity>
                  ))}
               </ScrollView>
               <View style={s.modalBtns}>
                  <TouchableOpacity style={s.modalCancel} onPress={() => setShowAddModal(false)}>
                     <Text style={s.modalCancelTxt}>İptal</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={s.modalSave} onPress={handleAddSave}>
                     <Text style={s.modalSaveTxt}>Oluştur</Text>
                  </TouchableOpacity>
               </View>
               </ScrollView>
            </View>
         </View>
         </Modal>

         {/* KATKI EKLE MODAL */}
         <Modal visible={showContribModal} transparent animationType="slide"
         onRequestClose={() => setShowContribModal(false)}>
         <View style={s.overlay}>
            <View style={s.modalCard}>
               <Text style={s.modalTitle}>Katkı Ekle</Text>
               {contribTarget && (
               <View style={s.contribInfo}>
                  <Text style={s.contribGoalName}>{contribTarget.goalName}</Text>
                  <View style={s.contribProgress}>
                     <Text style={s.contribProgressTxt}>
                     {parseFloat(contribTarget.currentAmount).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                     {' / '}
                     {parseFloat(contribTarget.targetAmount).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                     </Text>
                     <Text style={s.contribPct}>
                     {contribTarget.targetAmount > 0
                        ? ((contribTarget.currentAmount / contribTarget.targetAmount) * 100).toFixed(0)
                        : 0}%
                     </Text>
                  </View>
               </View>
               )}
               <TextInput style={s.minput} placeholder="Katkı tutarı (₺)"
               value={contribForm.amount} onChangeText={v => setContribForm(f => ({ ...f, amount: v }))}
               keyboardType="numeric" placeholderTextColor={COLORS.textMuted} />
               <TextInput style={s.minput} placeholder="Not (opsiyonel)"
               value={contribForm.note} onChangeText={v => setContribForm(f => ({ ...f, note: v }))}
               placeholderTextColor={COLORS.textMuted} />
               <Text style={s.chipLabel}>Hesap Seç</Text>
               <ScrollView horizontal showsHorizontalScrollIndicator={false}
               style={{ marginBottom: SPACING.md }}>
               {accounts.map(a => (
                  <TouchableOpacity key={a.accountId}
                     style={[s.chip,
                     contribForm.accountId === a.accountId.toString() && s.chipActive,
                     { marginRight: 6 }]}
                     onPress={() => setContribForm(f => ({ ...f, accountId: a.accountId.toString() }))}>
                     <Text style={[s.chipTxt,
                     contribForm.accountId === a.accountId.toString() && s.chipTxtActive]}>
                     {a.accountName}
                     </Text>
                  </TouchableOpacity>
               ))}
               </ScrollView>
               <View style={s.modalBtns}>
               <TouchableOpacity style={s.modalCancel} onPress={() => setShowContribModal(false)}>
                  <Text style={s.modalCancelTxt}>İptal</Text>
               </TouchableOpacity>
               <TouchableOpacity style={s.modalSave} onPress={handleContrib}>
                  <Text style={s.modalSaveTxt}>Ekle</Text>
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
  summaryVal: { fontSize: 14, fontWeight: 'bold', color: COLORS.textPrimary },
  summaryLbl: { fontSize: 10, color: COLORS.textMuted, textAlign: 'center' },
  goalCard: { backgroundColor: COLORS.white, borderRadius: RADIUS.md, marginBottom: SPACING.sm,
              padding: SPACING.md,
              shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, elevation: 1 },
  goalTop:      { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  goalIconWrap: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#EEF2FF',
                  justifyContent: 'center', alignItems: 'center', marginRight: 10 },
  goalMid:  { flex: 1 },
  goalName: { fontSize: 15, fontWeight: '600', color: COLORS.textPrimary },
  goalType: { fontSize: 12, color: COLORS.textMuted },
  goalPct:  { fontSize: 16, fontWeight: 'bold', color: COLORS.primary },
  completedBadge: { flexDirection: 'row', alignItems: 'center', gap: 4,
                    backgroundColor: '#D1FAE5', borderRadius: RADIUS.round,
                    paddingHorizontal: 8, paddingVertical: 4 },
  completedTxt: { fontSize: 11, color: COLORS.income, fontWeight: '600' },
  barBg:   { height: 10, backgroundColor: COLORS.border, borderRadius: 5, marginBottom: 8 },
  barFill: { height: 10, borderRadius: 5 },
  goalBottom:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  goalAmounts:  { fontSize: 12, color: COLORS.textSecondary },
  goalDays:     { fontSize: 12, color: COLORS.textMuted, fontWeight: '500' },
  remainingTxt: { fontSize: 11, color: COLORS.textMuted, marginTop: 4 },
  hintTxt:      { fontSize: 10, color: COLORS.textMuted, marginTop: 6 },
  emptyBox:    { alignItems: 'center', paddingVertical: 64, gap: SPACING.sm },
  emptyTxt:    { fontSize: 15, fontWeight: '600', color: COLORS.textMuted },
  emptySubTxt: { fontSize: 13, color: COLORS.textMuted, textAlign: 'center' },
  overlay:   { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalCard: { backgroundColor: COLORS.white, borderTopLeftRadius: RADIUS.xl,
               borderTopRightRadius: RADIUS.xl, padding: SPACING.lg, paddingBottom: 40, maxHeight: '85%' },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.textPrimary, marginBottom: SPACING.md },
  contribInfo:        { backgroundColor: COLORS.inputBg, borderRadius: RADIUS.md,
                        padding: SPACING.md, marginBottom: SPACING.md },
  contribGoalName:    { fontSize: 15, fontWeight: '600', color: COLORS.textPrimary, marginBottom: 6 },
  contribProgress:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  contribProgressTxt: { fontSize: 13, color: COLORS.textSecondary },
  contribPct:         { fontSize: 15, fontWeight: 'bold', color: COLORS.primary },
  minput:     { backgroundColor: COLORS.inputBg, borderRadius: RADIUS.md,
                paddingHorizontal: SPACING.md, paddingVertical: 13,
                fontSize: 15, color: COLORS.textPrimary, marginBottom: SPACING.sm },
  chipLabel:     { fontSize: 13, color: COLORS.textSecondary, marginBottom: 6 },
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
});
