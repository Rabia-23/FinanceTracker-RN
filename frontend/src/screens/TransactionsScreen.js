import React, { useState, useCallback } from 'react';
import {
   View, Text, ScrollView, StyleSheet, TouchableOpacity,
   Alert, ActivityIndicator, RefreshControl, Modal, TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { useAuth } from '../context/AuthContext';
import {
   getTransactions, getAccounts,
   createTransaction, updateTransaction, deleteTransaction,
} from '../services/index';
import { COLORS, SPACING, RADIUS } from '../constants/theme';

const CATEGORIES = ['Yemek','Ulaşım','Alışveriş','Sağlık','Eğlence','Faturalar','Maaş','Diğer'];
const MONTHS = ['Oca','Şub','Mar','Nis','May','Haz','Tem','Ağu','Eyl','Eki','Kas','Ara'];
const MONTH_NAMES = ['Ocak','Şubat','Mart','Nisan','Mayıs','Haziran',
                     'Temmuz','Ağustos','Eylül','Ekim','Kasım','Aralık'];

export default function TransactionsScreen() {
   const { user } = useAuth();
   const [transactions, setTransactions] = useState([]);
   const [accounts, setAccounts]         = useState([]);
   const [loading, setLoading]           = useState(true);
   const [refreshing, setRefreshing]     = useState(false);

   // Filtreler
   const [filterType,  setFilterType]  = useState('');
   const [filterMonth, setFilterMonth] = useState('');
   const [filterCat,   setFilterCat]   = useState('');

   // Modal
   const [showModal, setShowModal] = useState(false);
   const [editItem,  setEditItem]  = useState(null);
   const [form, setForm] = useState({
      type: 'Expense', title: '', category: '', amount: '',
      accountId: '', note: '',
      date: new Date().toISOString().slice(0, 10),
      time: new Date().toTimeString().slice(0, 5),
   });

   async function load(silent = false) {
      if (!silent) setLoading(true);
      try {
         const [txs, accs] = await Promise.all([
         getTransactions(user.userId),
         getAccounts(user.userId),
         ]);
         setTransactions(txs || []);
         setAccounts(accs || []);
      } catch (e) { Alert.alert('Hata', 'Veriler yüklenemedi'); }
      finally { setLoading(false); setRefreshing(false); }
   }

   useFocusEffect(useCallback(() => { load(); }, []));

   // ─── Modal ac ───
   function openAdd() {
      setEditItem(null);
      setForm({
         type: 'Expense', title: '', category: '', amount: '',
         accountId: accounts[0]?.accountId?.toString() || '',
         note: '',
         date: new Date().toISOString().slice(0, 10),
         time: new Date().toTimeString().slice(0, 5),
      });
      setShowModal(true);
   }

   function openEdit(tx) {
      setEditItem(tx);
      setForm({
         type:      tx.transactionType,
         title:     tx.transactionTitle,
         category:  tx.transactionCategory,
         amount:    tx.transactionAmount.toString(),
         accountId: tx.accountId.toString(),
         note:      tx.transactionNote || '',
         date:      tx.transactionDate?.slice(0, 10) || new Date().toISOString().slice(0, 10),
         time:      tx.transactionTime?.slice(0, 5)  || new Date().toTimeString().slice(0, 5),
      });
      setShowModal(true);
   }

   // ─── Kaydet ───
   async function handleSave() {
      if (!form.title.trim() || !form.amount || !form.category || !form.accountId) {
         Alert.alert('Hata', 'Başlık, tutar, kategori ve hesap zorunlu'); return;
      }
      const dto = {
         userId:              user.userId,
         accountId:           parseInt(form.accountId),
         transactionType:     form.type,
         transactionTitle:    form.title.trim(),
         transactionCategory: form.category,
         transactionAmount:   parseFloat(form.amount),
         transactionNote:     form.note,
         transactionDate:     new Date(form.date).toISOString(),
         transactionTime:     form.time + ':00',
      };
      try {
         if (editItem) await updateTransaction(editItem.transactionId, dto);
         else          await createTransaction(dto);
         setShowModal(false);
         load(true);
      } catch (e) { Alert.alert('Hata', 'İşlem kaydedilemedi'); }
   }

   // ─── Sil ───
   function handleDelete(tx) {
      Alert.alert('İşlemi Sil', `"${tx.transactionTitle}" silinsin mi?`, [
         { text: 'İptal', style: 'cancel' },
         { text: 'Sil', style: 'destructive', onPress: async () => {
         try { await deleteTransaction(tx.transactionId); load(true); }
         catch (e) { Alert.alert('Hata', 'Silinemedi'); }
         }},
      ]);
   }

   // ─── CSV ───
   async function handleExportCSV() {
      try {
         // Mevcut filtreleri uygula
         let data = [...transactions];
         if (filterType)  data = data.filter(t => t.transactionType === filterType);
         if (filterCat)   data = data.filter(t => t.transactionCategory === filterCat);
         if (filterMonth) data = data.filter(t => {
         const m = new Date(t.transactionDate).getMonth();
         return MONTHS[m] === filterMonth;
         });

         if (data.length === 0) {
         Alert.alert('Uyarı', 'Dışa aktarılacak işlem bulunamadı.');
         return;
         }

         const header = 'Tarih,Başlık,Kategori,Tür,Tutar\n';
         const rows = data.map(t =>
         `${t.transactionDate?.slice(0, 10)},"${t.transactionTitle}",` +
         `${t.transactionCategory},${t.transactionType},${t.transactionAmount}`
         ).join('\n');

         const file = new File(Paths.document, 'islemler.csv');
         await file.write(header + rows);

         const isAvailable = await Sharing.isAvailableAsync();
         if (!isAvailable) {
         Alert.alert('Hata', 'Paylaşım bu cihazda desteklenmiyor.');
         return;
         }

         await Sharing.shareAsync(file.uri, {
         mimeType: 'text/csv',
         dialogTitle: 'İşlemleri Paylaş',
         UTI: 'public.comma-separated-values-text',
         });
      } catch (e) {
         console.error('CSV Hatası:', e);
         Alert.alert('Hata', 'CSV oluşturulamadı: ' + e.message);
      }
   }

   // ─── Filtreleme ───
   let filtered = [...transactions];
   if (filterType)  filtered = filtered.filter(t => t.transactionType === filterType);
   if (filterCat)   filtered = filtered.filter(t => t.transactionCategory === filterCat);
   if (filterMonth) filtered = filtered.filter(t => {
      const m = new Date(t.transactionDate).getMonth();
      return MONTHS[m] === filterMonth;
   });

   // ─── Gruplama ───
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

         {/* Baslik */}
         <View style={s.topBar}>
         <Text style={s.topTitle}>İşlemler</Text>
         <View style={s.topActions}>
            <TouchableOpacity style={s.csvBtn} onPress={handleExportCSV}>
               <Ionicons name="download-outline" size={18} color={COLORS.primary} />
            </TouchableOpacity>
            <TouchableOpacity style={s.addBtn} onPress={openAdd}>
               <Ionicons name="add" size={18} color="#fff" />
               <Text style={s.addBtnTxt}>Yeni</Text>
            </TouchableOpacity>
         </View>
         </View>

         {/* Filtreler */}
         <View style={s.filterBlock}>
         <View style={s.filterRow}>
            <Text style={s.filterLabel}>Tür</Text>
            <View style={s.chipRow}>
               {chip('Gelir', 'Income',  filterType, setFilterType)}
               {chip('Gider', 'Expense', filterType, setFilterType)}
            </View>
         </View>
         <View style={s.divider} />
         <View style={s.filterRow}>
            <Text style={s.filterLabel}>Ay</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.chipScroll}>
               {MONTHS.map(m => chip(m, m, filterMonth, setFilterMonth))}
            </ScrollView>
         </View>
         <View style={s.divider} />
         <View style={s.filterRow}>
            <Text style={s.filterLabel}>Kategori</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.chipScroll}>
               {CATEGORIES.map(c => chip(c, c, filterCat, setFilterCat))}
            </ScrollView>
         </View>
         </View>

         {/* Sonuc bari */}
         <View style={s.resultBar}>
         <Text style={s.resultTxt}>{filtered.length} işlem</Text>
         {(filterType || filterMonth || filterCat) && (
            <TouchableOpacity onPress={() => { setFilterType(''); setFilterMonth(''); setFilterCat(''); }}>
               <Text style={s.clearTxt}>Temizle</Text>
            </TouchableOpacity>
         )}
         </View>

         {/* Liste */}
         <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: SPACING.md }}
         refreshControl={<RefreshControl refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); load(true); }} />}>

         {Object.keys(groups).sort((a, b) => b.localeCompare(a)).map(date => (
            <View key={date}>
               <Text style={s.dateLabel}>
               {(() => {
                  try {
                     const d = new Date(date);
                     return `${d.getDate()} ${MONTH_NAMES[d.getMonth()]}`;
                  } catch { return date; }
               })()}
               </Text>
               {groups[date].map(t => (
               <TouchableOpacity key={t.transactionId} style={s.txCard}
                  onPress={() => openEdit(t)}
                  onLongPress={() => handleDelete(t)}>
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
               </TouchableOpacity>
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

         {/* ISLEM EKLE / DUZENLE MODAL */}
         <Modal visible={showModal} transparent animationType="slide"
         onRequestClose={() => setShowModal(false)}>
         <View style={s.overlay}>
            <View style={s.modalCard}>
               <ScrollView showsVerticalScrollIndicator={false}>
               <Text style={s.modalTitle}>{editItem ? 'İşlemi Düzenle' : 'Yeni İşlem'}</Text>

               <View style={s.typeRow}>
                  {['Income','Expense'].map(tp => (
                     <TouchableOpacity key={tp}
                     style={[s.typeBtn, form.type === tp && {
                        backgroundColor: tp === 'Income' ? COLORS.income : COLORS.expense,
                        borderColor: tp === 'Income' ? COLORS.income : COLORS.expense,
                     }]}
                     onPress={() => setForm(f => ({ ...f, type: tp }))}>
                     <Text style={[s.typeTxt, form.type === tp && { color: '#fff' }]}>
                        {tp === 'Income' ? 'Gelir' : 'Gider'}
                     </Text>
                     </TouchableOpacity>
                  ))}
               </View>

               <TextInput style={s.minput} placeholder="Başlık" value={form.title}
                  onChangeText={v => setForm(f => ({ ...f, title: v }))}
                  placeholderTextColor={COLORS.textMuted} />
               <TextInput style={s.minput} placeholder="Tutar" value={form.amount}
                  onChangeText={v => setForm(f => ({ ...f, amount: v }))}
                  keyboardType="numeric" placeholderTextColor={COLORS.textMuted} />
               <TextInput style={s.minput} placeholder="Tarih (YYYY-MM-DD)" value={form.date}
                  onChangeText={v => setForm(f => ({ ...f, date: v }))}
                  placeholderTextColor={COLORS.textMuted} />
               <TextInput style={s.minput} placeholder="Saat (HH:MM)" value={form.time}
                  onChangeText={v => setForm(f => ({ ...f, time: v }))}
                  placeholderTextColor={COLORS.textMuted} />

               <Text style={s.chipLabel}>Kategori</Text>
               <ScrollView horizontal showsHorizontalScrollIndicator={false}
                  style={{ marginBottom: SPACING.sm }}>
                  {CATEGORIES.map(c => (
                     <TouchableOpacity key={c}
                     style={[s.chip, form.category === c && s.chipActive, { marginRight: 6 }]}
                     onPress={() => setForm(f => ({ ...f, category: c }))}>
                     <Text style={[s.chipTxt, form.category === c && s.chipTxtActive]}>{c}</Text>
                     </TouchableOpacity>
                  ))}
               </ScrollView>

               <Text style={s.chipLabel}>Hesap</Text>
               <ScrollView horizontal showsHorizontalScrollIndicator={false}
                  style={{ marginBottom: SPACING.sm }}>
                  {accounts.map(a => (
                     <TouchableOpacity key={a.accountId}
                     style={[s.chip, form.accountId === a.accountId.toString() && s.chipActive, { marginRight: 6 }]}
                     onPress={() => setForm(f => ({ ...f, accountId: a.accountId.toString() }))}>
                     <Text style={[s.chipTxt, form.accountId === a.accountId.toString() && s.chipTxtActive]}>
                        {a.accountName}
                     </Text>
                     </TouchableOpacity>
                  ))}
               </ScrollView>

               <TextInput style={s.minput} placeholder="Not (opsiyonel)" value={form.note}
                  onChangeText={v => setForm(f => ({ ...f, note: v }))}
                  placeholderTextColor={COLORS.textMuted} />

               <View style={s.modalBtns}>
                  <TouchableOpacity style={s.modalCancel} onPress={() => setShowModal(false)}>
                     <Text style={s.modalCancelTxt}>İptal</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={s.modalSave} onPress={handleSave}>
                     <Text style={s.modalSaveTxt}>Kaydet</Text>
                  </TouchableOpacity>
               </View>
               </ScrollView>
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
  topTitle:   { fontSize: 20, fontWeight: 'bold', color: COLORS.textPrimary },
  topActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  csvBtn:  { padding: 8, backgroundColor: '#EEF2FF', borderRadius: RADIUS.md },
  addBtn:  { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.primary,
             borderRadius: RADIUS.round, paddingHorizontal: 12, paddingVertical: 6, gap: 4 },
  addBtnTxt: { color: '#fff', fontSize: 13, fontWeight: '600' },

  filterBlock: { backgroundColor: COLORS.white, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  filterRow:   { flexDirection: 'row', alignItems: 'center',
                 paddingVertical: 8, paddingHorizontal: SPACING.md },
  filterLabel: { fontSize: 11, fontWeight: '600', color: COLORS.textMuted, width: 56, marginRight: 6 },
  chipRow:     { flexDirection: 'row', gap: 6 },
  chipScroll:  { gap: 6, paddingRight: SPACING.md },
  divider:     { height: 1, backgroundColor: COLORS.border, marginHorizontal: SPACING.md },

  chip:          { paddingHorizontal: 10, paddingVertical: 4, borderRadius: RADIUS.round,
                   backgroundColor: COLORS.inputBg, borderWidth: 1, borderColor: COLORS.border },
  chipActive:    { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  chipTxt:       { fontSize: 11, color: COLORS.textSecondary },
  chipTxtActive: { color: '#fff', fontWeight: '600' },

  resultBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
               paddingHorizontal: SPACING.md, paddingVertical: 6,
               backgroundColor: COLORS.white, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  resultTxt: { fontSize: 11, color: COLORS.textMuted },
  clearTxt:  { fontSize: 11, color: COLORS.primary, fontWeight: '600' },

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

  overlay:    { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalCard:  { backgroundColor: COLORS.white, borderTopLeftRadius: RADIUS.xl,
                borderTopRightRadius: RADIUS.xl, padding: SPACING.lg, paddingBottom: 40, maxHeight: '90%' },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.textPrimary, marginBottom: SPACING.md },
  typeRow:    { flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.sm },
  typeBtn:    { flex: 1, paddingVertical: 10, borderRadius: RADIUS.md, alignItems: 'center',
                backgroundColor: COLORS.inputBg, borderWidth: 1, borderColor: COLORS.border },
  typeTxt:    { fontWeight: '600', color: COLORS.textSecondary },
  minput:     { backgroundColor: COLORS.inputBg, borderRadius: RADIUS.md,
                paddingHorizontal: SPACING.md, paddingVertical: 13,
                fontSize: 15, color: COLORS.textPrimary, marginBottom: SPACING.sm },
  chipLabel:  { fontSize: 13, color: COLORS.textSecondary, marginBottom: 6 },
  modalBtns:      { flexDirection: 'row', gap: SPACING.sm, marginTop: SPACING.sm },
  modalCancel:    { flex: 1, paddingVertical: 13, borderRadius: RADIUS.md, borderWidth: 1,
                    borderColor: COLORS.border, alignItems: 'center' },
  modalCancelTxt: { color: COLORS.textSecondary, fontWeight: '600' },
  modalSave:      { flex: 1, paddingVertical: 13, borderRadius: RADIUS.md,
                    backgroundColor: COLORS.primary, alignItems: 'center' },
  modalSaveTxt:   { color: '#fff', fontWeight: '600' },
});
