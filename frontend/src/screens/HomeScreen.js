import React, { useState, useCallback } from 'react';
import {
   View, Text, ScrollView, StyleSheet, TouchableOpacity,
   Alert, Modal, TextInput, RefreshControl, ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { LineChart, PieChart } from 'react-native-chart-kit';
import { Dimensions } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import {
   getAccounts, getTransactions, getBudgets,
   createAccount, deleteAccount,
   createBudget, updateBudget, deleteBudget,
} from '../services/index';
import { COLORS, SPACING, RADIUS } from '../constants/theme';

const W = Dimensions.get('window').width;
const MONTHS = ['Oca','Şub','Mar','Nis','May','Haz','Tem','Ağu','Eyl','Eki','Kas','Ara'];
const PERIOD_TYPES = ['Weekly','Monthly','Yearly'];
const PERIOD_LABELS = { Weekly:'Haftalık', Monthly:'Aylık', Yearly:'Yıllık' };
const PIE_COLORS = ['#667EEA','#EF4444','#10B981','#F59E0B','#3B82F6','#8B5CF6','#EC4899','#14B8A6'];

function groupByDate(txs) {
   const groups = {};
   txs.forEach(t => {
      const d = t.transactionDate?.slice(0,10) || '?';
      if (!groups[d]) groups[d] = [];
      groups[d].push(t);
   });
   return groups;
}

function calcEndDate(start, periodType) {
   const d = new Date(start);
   if (periodType === 'Weekly')       d.setDate(d.getDate() + 7);
   else if (periodType === 'Monthly') d.setMonth(d.getMonth() + 1);
   else                               d.setFullYear(d.getFullYear() + 1);
   return d.toISOString().slice(0,10);
}

export default function HomeScreen() {
   const { user, logout } = useAuth();
   const [accounts, setAccounts]         = useState([]);
   const [transactions, setTransactions] = useState([]);
   const [budgets, setBudgets]           = useState([]);
   const [loading, setLoading]           = useState(true);
   const [refreshing, setRefreshing]     = useState(false);
   const [showPie, setShowPie]           = useState(false);

   const [addAccModal, setAddAccModal]             = useState(false);
   const [addBudgetModal, setAddBudgetModal]       = useState(false);
   const [budgetActionsModal, setBudgetActionsModal] = useState(false);
   const [budgetHistModal, setBudgetHistModal]     = useState(false);
   const [selectedBudget, setSelectedBudget]       = useState(null);
   const [isEditingBudget, setIsEditingBudget]     = useState(false);

   const [accName, setAccName]       = useState('');
   const [accBalance, setAccBalance] = useState('');
   const [saving, setSaving]         = useState(false);

   const [budgetForm, setBudgetForm] = useState({
      periodType: 'Monthly',
      startDate: new Date().toISOString().slice(0,10),
      amountLimit: '',
   });

   async function load(silent = false) {
      if (!silent) setLoading(true);
      try {
         const [accs, txs, bdgs] = await Promise.all([
         getAccounts(user.userId),
         getTransactions(user.userId),
         getBudgets(user.userId),
         ]);
         setAccounts(accs || []);
         setTransactions(txs || []);
         setBudgets(bdgs || []);
      } catch (e) {
         Alert.alert('Hata', 'Veriler yüklenemedi');
      } finally {
         setLoading(false);
         setRefreshing(false);
      }
   }

   useFocusEffect(useCallback(() => { load(); }, []));

   const netWorth = accounts.reduce((s, a) => s + parseFloat(a.accountBalance || 0), 0);

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
         }},
      ]);
   }

   async function handleAddBudget() {
      if (!budgetForm.amountLimit || !budgetForm.startDate) { Alert.alert('Hata', 'Tüm alanları doldurun'); return; }
      const endDate = calcEndDate(budgetForm.startDate, budgetForm.periodType);
      try {
         await createBudget({
         userId: user.userId,
         periodType: budgetForm.periodType,
         amountLimit: parseFloat(budgetForm.amountLimit),
         startDate: new Date(budgetForm.startDate).toISOString(),
         endDate: new Date(endDate).toISOString(),
         });
         setAddBudgetModal(false);
         setBudgetForm({ periodType:'Monthly', startDate: new Date().toISOString().slice(0,10), amountLimit:'' });
         load(true);
      } catch (e) { Alert.alert('Hata', 'Bütçe eklenemedi'); }
   }

   async function handleUpdateBudget() {
      if (!budgetForm.amountLimit) { Alert.alert('Hata', 'Limit girin'); return; }
      const endDate = calcEndDate(budgetForm.startDate, budgetForm.periodType);
      try {
         await updateBudget(selectedBudget.budgetId, {
         periodType: budgetForm.periodType,
         amountLimit: parseFloat(budgetForm.amountLimit),
         startDate: new Date(budgetForm.startDate).toISOString(),
         endDate: new Date(endDate).toISOString(),
         spentAmount: selectedBudget.spentAmount || 0,
         });
         setBudgetActionsModal(false);
         setIsEditingBudget(false);
         load(true);
      } catch (e) { Alert.alert('Hata', 'Güncellenemedi'); }
   }

   async function handleDeleteBudget() {
      Alert.alert('Bütçeyi Sil', 'Bu bütçeyi silmek istiyor musun?', [
         { text: 'İptal', style: 'cancel' },
         { text: 'Sil', style: 'destructive', onPress: async () => {
         try {
            await deleteBudget(selectedBudget.budgetId);
            setBudgetActionsModal(false);
            load(true);
         } catch (e) { Alert.alert('Hata', 'Silinemedi'); }
         }},
      ]);
   }

   function openBudgetActions(b) {
      setSelectedBudget(b);
      setIsEditingBudget(false);
      setBudgetForm({
         periodType: b.periodType,
         startDate: b.startDate?.slice(0,10) || new Date().toISOString().slice(0,10),
         amountLimit: parseFloat(b.amountLimit || 0).toFixed(0),
      });
      setBudgetActionsModal(true);
   }

   // Net worth grafik verisi (son 30 gün)
   const today = new Date();
   const totalTx = transactions.reduce((s, t) => {
      return s + (t.transactionType === 'Income' ? parseFloat(t.transactionAmount) : -parseFloat(t.transactionAmount));
   }, 0);
   const netWorthSpots = [];
   const lineLabels = [];
   for (let i = 29; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const dayEnd = new Date(d); dayEnd.setDate(dayEnd.getDate() + 1);
      let cumChange = 0;
      transactions.forEach(t => {
         try {
         const td = new Date(t.transactionDate);
         if (td < dayEnd) {
            cumChange += t.transactionType === 'Income' ? parseFloat(t.transactionAmount) : -parseFloat(t.transactionAmount);
         }
         } catch {}
      });
      netWorthSpots.push(netWorth - totalTx + cumChange);
      if (i % 7 === 0 || i === 0) lineLabels.push(`${d.getDate()} ${MONTHS[d.getMonth()]}`);
      else lineLabels.push('');
   }
   const hasLineData = netWorthSpots.some(v => v !== 0);

   // Pasta grafik: bu ay kategori bazlı giderler
   const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
   const monthEnd   = new Date(today.getFullYear(), today.getMonth() + 1, 1);
   const catTotals  = {};
   transactions.forEach(t => {
      if (t.transactionType !== 'Expense') return;
      try {
         const td = new Date(t.transactionDate);
         if (td >= monthStart && td < monthEnd) {
         const cat = t.transactionCategory || 'Diğer';
         catTotals[cat] = (catTotals[cat] || 0) + parseFloat(t.transactionAmount || 0);
         }
      } catch {}
   });
   const sortedCats  = Object.entries(catTotals).sort((a,b) => b[1]-a[1]);
   const totalExpense = sortedCats.reduce((s,[,v]) => s + v, 0);
   const pieData = sortedCats.map(([name, value], i) => ({
      name: `${name} (${totalExpense > 0 ? Math.round(value/totalExpense*100) : 0}%)`,
      population: value,
      color: PIE_COLORS[i % PIE_COLORS.length],
      legendFontColor: COLORS.textSecondary,
      legendFontSize: 10,
   }));
   const hasChartData = hasLineData || pieData.length > 0;

   const chartConfig = {
      backgroundColor: COLORS.white, backgroundGradientFrom: COLORS.white,
      backgroundGradientTo: COLORS.white,
      color: (o = 1) => `rgba(102,126,234,${o})`,
      labelColor: () => COLORS.textSecondary,
      strokeWidth: 2,
      propsForDots: { r: '0' },
   };

   const last30   = [...transactions].sort((a,b) => new Date(b.transactionDate)-new Date(a.transactionDate)).slice(0,30);
   const txGroups = groupByDate(last30);

   if (loading) return <View style={s.center}><ActivityIndicator size="large" color={COLORS.primary} /></View>;

   return (
      <ScrollView style={s.root} showsVerticalScrollIndicator={false}
         refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(true); }} />}>

         <LinearGradient colors={[COLORS.primary, COLORS.primaryDark]} style={s.header}>
         <View style={s.headerRow}>
            <View>
               <Text style={s.greeting}>Merhaba, {user?.username} 👋</Text>
               <Text style={s.netWorthLabel}>Net Değer</Text>
               <Text style={s.netWorthValue}>{netWorth.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺</Text>
            </View>
            <TouchableOpacity onPress={logout} style={s.logoutBtn}>
               <Ionicons name="log-out-outline" size={24} color="rgba(255,255,255,0.85)" />
            </TouchableOpacity>
         </View>

         </LinearGradient>

         <View style={s.body}>

         {/* HESAPLAR */}
         <View style={s.section}>
            <View style={s.sectionHeader}>
               <Text style={s.sectionTitle}>Hesaplarım</Text>
               <TouchableOpacity style={s.addBtn} onPress={() => setAddAccModal(true)}>
               <Ionicons name="add" size={18} color="#fff" />
               <Text style={s.addBtnTxt}>Ekle</Text>
               </TouchableOpacity>
            </View>
            {accounts.length === 0 ? (
               <Text style={s.empty}>Henüz hesap yok. Ekleyin!</Text>
            ) : (
               <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.cardScroll}>
               {accounts.map(acc => (
                  <TouchableOpacity key={acc.accountId} style={s.accCard}
                     onLongPress={() => handleDeleteAccount(acc.accountId, acc.accountName)}>
                     <View style={s.accIconWrap}>
                     <Ionicons name="card-outline" size={24} color={COLORS.primary} />
                     </View>
                     <Text style={s.accName}>{acc.accountName}</Text>
                     <Text style={s.accBalance}>{parseFloat(acc.accountBalance).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺</Text>
                     <Text style={s.accHint}>Silmek için basılı tut</Text>
                  </TouchableOpacity>
               ))}
               </ScrollView>
            )}
         </View>

         {/* GRAFİK */}
         {hasChartData && (
            <View style={s.section}>
               <View style={s.sectionHeader}>
               <View>
                  <Text style={s.sectionTitle}>{showPie ? 'Kategoriye Göre Harcama' : 'Net Değer Grafiği'}</Text>
                  <Text style={s.chartSub}>{showPie ? 'Bu ay · kategori dağılımı' : 'Son 30 gün'}</Text>
               </View>
               <TouchableOpacity style={s.toggleBtn} onPress={() => setShowPie(p => !p)}>
                  <Ionicons name={showPie ? 'analytics-outline' : 'pie-chart-outline'} size={20} color={COLORS.primary} />
               </TouchableOpacity>
               </View>

               {showPie ? (
               pieData.length > 0 ? (
                  <PieChart
                     data={pieData}
                     width={W - 64}
                     height={200}
                     chartConfig={chartConfig}
                     accessor="population"
                     backgroundColor="transparent"
                     paddingLeft="8"
                     style={s.chart}
                  />
               ) : (
                  <Text style={s.empty}>Bu ay henüz harcama yok</Text>
               )
               ) : (
               hasLineData ? (
                  <LineChart
                     data={{
                     labels: lineLabels,
                     datasets: [{ data: netWorthSpots, color: () => COLORS.primary, strokeWidth: 2 }],
                     }}
                     width={W - 64}
                     height={200}
                     chartConfig={{
                     ...chartConfig,
                     fillShadowGradient: COLORS.primary,
                     fillShadowGradientOpacity: 0.15,
                     }}
                     bezier={false}
                     style={s.chart}
                     withDots={false}
                     withInnerLines={true}
                     formatYLabel={v => {
                     const n = parseFloat(v);
                     return n >= 1000 ? `₺${(n/1000).toFixed(1)}K` : `₺${Math.round(n)}`;
                     }}
                  />
               ) : (
                  <Text style={s.empty}>Henüz veri yok</Text>
               )
               )}
            </View>
         )}

         {/* BÜTÇELER */}
         <View style={s.section}>
            <View style={s.sectionHeader}>
               <Text style={s.sectionTitle}>Bütçeler</Text>
               <TouchableOpacity style={s.addBtn} onPress={() => setAddBudgetModal(true)}>
               <Ionicons name="add" size={18} color="#fff" />
               <Text style={s.addBtnTxt}>Yeni</Text>
               </TouchableOpacity>
            </View>
            {budgets.length === 0 ? (
               <Text style={s.empty}>Henüz bütçe yok.</Text>
            ) : budgets.map(b => {
               const limit    = parseFloat(b.amountLimit || 0);
               const spent    = parseFloat(b.spentAmount || 0);
               const pct      = limit > 0 ? Math.min((spent/limit)*100, 100) : 0;
               const barColor = pct >= 90 ? COLORS.expense : pct >= 60 ? COLORS.warning : COLORS.income;
               const daysLeft = Math.ceil((new Date(b.endDate) - Date.now()) / (1000*3600*24));
               return (
               <TouchableOpacity key={b.budgetId} style={s.budgetCard}
                  onPress={() => { setSelectedBudget(b); setBudgetHistModal(true); }}
                  onLongPress={() => openBudgetActions(b)}>
                  <View style={s.budgetTop}>
                     <View style={s.budgetTitleRow}>
                     <Text style={s.budgetPeriod}>{PERIOD_LABELS[b.periodType] || b.periodType}</Text>
                     <View style={s.renewBadge}>
                        <Ionicons name="refresh" size={10} color={COLORS.primary} />
                        <Text style={s.renewTxt}>Otomatik</Text>
                     </View>
                     </View>
                     <Text style={s.budgetPct}>{pct.toFixed(0)}%</Text>
                  </View>
                  <View style={s.barBg}>
                     <View style={[s.barFill, { width: `${pct}%`, backgroundColor: barColor }]} />
                  </View>
                  <View style={s.budgetBottom}>
                     <Text style={s.budgetSpent}>
                     {spent.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺ / {limit.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                     </Text>
                     <Text style={[s.daysLeft, daysLeft <= 3 && { color: COLORS.expense }]}>
                     {daysLeft > 0 ? `${daysLeft} gün kaldı` : 'Yenilendi'}
                     </Text>
                  </View>
                  <Text style={s.budgetHint}>Geçmiş için dokun · Güncelle/Sil için basılı tut</Text>
               </TouchableOpacity>
               );
            })}
         </View>

         {/* SON 30 İŞLEM */}
         {last30.length > 0 && (
            <View style={s.section}>
               <Text style={s.sectionTitle}>Son İşlemler</Text>
               {Object.keys(txGroups).sort((a,b) => b.localeCompare(a)).map(date => (
               <View key={date}>
                  <Text style={s.dateLabel}>
                     {(() => { try { const d = new Date(date); return `${d.getDate()} ${MONTHS[d.getMonth()]}`; } catch { return date; } })()}
                  </Text>
                  {txGroups[date].map(t => (
                     <View key={t.transactionId} style={s.txRow}>
                     <View style={[s.txIcon, { backgroundColor: t.transactionType==='Income' ? '#D1FAE5' : '#FEE2E2' }]}>
                        <Ionicons name={t.transactionType==='Income' ? 'arrow-down' : 'arrow-up'}
                           size={16} color={t.transactionType==='Income' ? COLORS.income : COLORS.expense} />
                     </View>
                     <View style={s.txMid}>
                        <Text style={s.txTitle}>{t.transactionTitle}</Text>
                        <Text style={s.txCat}>{t.transactionCategory} · {t.transactionTime?.slice(0,5)}</Text>
                     </View>
                     <Text style={[s.txAmt, { color: t.transactionType==='Income' ? COLORS.income : COLORS.expense }]}>
                        {t.transactionType==='Income' ? '+' : '-'}{parseFloat(t.transactionAmount).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                     </Text>
                     </View>
                  ))}
               </View>
               ))}
            </View>
         )}
         </View>

         {/* HESAP EKLE MODAL */}
         <Modal visible={addAccModal} transparent animationType="slide" onRequestClose={() => setAddAccModal(false)}>
         <View style={s.overlay}>
            <View style={s.modalCard}>
               <Text style={s.modalTitle}>Yeni Hesap</Text>
               <TextInput style={s.minput} placeholder="Hesap adı" value={accName}
               onChangeText={setAccName} placeholderTextColor={COLORS.textMuted} />
               <TextInput style={s.minput} placeholder="Bakiye" value={accBalance}
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

         {/* BÜTÇE EKLE MODAL */}
         <Modal visible={addBudgetModal} transparent animationType="slide" onRequestClose={() => setAddBudgetModal(false)}>
         <View style={s.overlay}>
            <View style={s.modalCard}>
               <Text style={s.modalTitle}>Yeni Bütçe</Text>
               <Text style={s.chipLabel}>Periyot Türü</Text>
               <View style={s.typeRow}>
               {PERIOD_TYPES.map(p => (
                  <TouchableOpacity key={p}
                     style={[s.typeBtn, budgetForm.periodType===p && { backgroundColor: COLORS.primary }]}
                     onPress={() => setBudgetForm(f => ({ ...f, periodType:p }))}>
                     <Text style={[s.typeTxt, budgetForm.periodType===p && { color:'#fff' }]}>{PERIOD_LABELS[p]}</Text>
                  </TouchableOpacity>
               ))}
               </View>
               <TextInput style={s.minput} placeholder="Başlangıç tarihi (YYYY-MM-DD)" value={budgetForm.startDate}
               onChangeText={v => setBudgetForm(f => ({ ...f, startDate:v }))} placeholderTextColor={COLORS.textMuted} />
               <View style={s.endDateRow}>
               <Ionicons name="information-circle-outline" size={15} color={COLORS.textMuted} />
               <Text style={s.endDateTxt}>
                  {`Bitiş: ${(() => { try { return calcEndDate(budgetForm.startDate, budgetForm.periodType); } catch { return '—'; } })()} (Otomatik)`}
               </Text>
               </View>
               <TextInput style={s.minput} placeholder="Bütçe limiti (₺)" value={budgetForm.amountLimit}
               onChangeText={v => setBudgetForm(f => ({ ...f, amountLimit:v }))} keyboardType="numeric" placeholderTextColor={COLORS.textMuted} />
               <View style={s.modalBtns}>
               <TouchableOpacity style={s.modalCancel} onPress={() => setAddBudgetModal(false)}>
                  <Text style={s.modalCancelTxt}>İptal</Text>
               </TouchableOpacity>
               <TouchableOpacity style={s.modalSave} onPress={handleAddBudget}>
                  <Text style={s.modalSaveTxt}>Oluştur</Text>
               </TouchableOpacity>
               </View>
            </View>
         </View>
         </Modal>

         {/* BÜTÇE GÜNCELLE/SİL MODAL */}
         <Modal visible={budgetActionsModal} transparent animationType="fade"
         onRequestClose={() => { setBudgetActionsModal(false); setIsEditingBudget(false); }}>
         <TouchableOpacity style={s.overlayDismiss} activeOpacity={1}
            onPress={() => { setBudgetActionsModal(false); setIsEditingBudget(false); }}>
            <TouchableOpacity activeOpacity={1} style={s.modalCard}>
               <Text style={s.modalTitle}>Bütçe Yönetimi</Text>
               {!isEditingBudget ? (
               <>
                  {[
                     ['Periyot',   PERIOD_LABELS[selectedBudget?.periodType] || selectedBudget?.periodType],
                     ['Limit',     `${parseFloat(selectedBudget?.amountLimit||0).toLocaleString('tr-TR', { minimumFractionDigits:2 })} ₺`],
                     ['Harcanan',  `${parseFloat(selectedBudget?.spentAmount||0).toLocaleString('tr-TR', { minimumFractionDigits:2 })} ₺`],
                     ['Başlangıç', selectedBudget?.startDate?.slice(0,10)],
                     ['Bitiş',     selectedBudget?.endDate?.slice(0,10)],
                  ].map(([lbl, val]) => (
                     <View key={lbl} style={s.infoRow}>
                     <Text style={s.infoLabel}>{lbl}</Text>
                     <Text style={s.infoVal}>{val}</Text>
                     </View>
                  ))}
                  <View style={s.modalBtns}>
                     <TouchableOpacity style={s.modalCancel} onPress={() => { setBudgetActionsModal(false); setIsEditingBudget(false); }}>
                     <Text style={s.modalCancelTxt}>İptal</Text>
                     </TouchableOpacity>
                     <TouchableOpacity style={s.editBtn} onPress={() => setIsEditingBudget(true)}>
                     <Ionicons name="pencil-outline" size={16} color="#fff" />
                     <Text style={s.modalSaveTxt}> Güncelle</Text>
                     </TouchableOpacity>
                     <TouchableOpacity style={s.deleteBtn} onPress={handleDeleteBudget}>
                     <Ionicons name="trash-outline" size={16} color="#fff" />
                     <Text style={s.modalSaveTxt}> Sil</Text>
                     </TouchableOpacity>
                  </View>
               </>
               ) : (
               <>
                  <Text style={s.chipLabel}>Periyot Türü</Text>
                  <View style={s.typeRow}>
                     {PERIOD_TYPES.map(p => (
                     <TouchableOpacity key={p}
                        style={[s.typeBtn, budgetForm.periodType===p && { backgroundColor: COLORS.primary }]}
                        onPress={() => setBudgetForm(f => ({ ...f, periodType:p }))}>
                        <Text style={[s.typeTxt, budgetForm.periodType===p && { color:'#fff' }]}>{PERIOD_LABELS[p]}</Text>
                     </TouchableOpacity>
                     ))}
                  </View>
                  <TextInput style={s.minput} placeholder="Başlangıç tarihi (YYYY-MM-DD)"
                     value={budgetForm.startDate}
                     onChangeText={v => setBudgetForm(f => ({ ...f, startDate:v }))} placeholderTextColor={COLORS.textMuted} />
                  <View style={s.endDateRow}>
                     <Ionicons name="information-circle-outline" size={15} color={COLORS.textMuted} />
                     <Text style={s.endDateTxt}>
                     {`Bitiş: ${(() => { try { return calcEndDate(budgetForm.startDate, budgetForm.periodType); } catch { return '—'; } })()} (Otomatik)`}
                     </Text>
                  </View>
                  <TextInput style={s.minput} placeholder="Bütçe limiti (₺)" value={budgetForm.amountLimit}
                     onChangeText={v => setBudgetForm(f => ({ ...f, amountLimit:v }))} keyboardType="numeric" placeholderTextColor={COLORS.textMuted} />
                  <View style={s.modalBtns}>
                     <TouchableOpacity style={s.modalCancel} onPress={() => setIsEditingBudget(false)}>
                     <Text style={s.modalCancelTxt}>Geri</Text>
                     </TouchableOpacity>
                     <TouchableOpacity style={s.modalSave} onPress={handleUpdateBudget}>
                     <Text style={s.modalSaveTxt}>Kaydet</Text>
                     </TouchableOpacity>
                  </View>
               </>
               )}
            </TouchableOpacity>
         </TouchableOpacity>
         </Modal>

         {/* BÜTÇE GEÇMİŞİ MODAL */}
         <Modal visible={budgetHistModal} transparent animationType="fade"
         onRequestClose={() => setBudgetHistModal(false)}>
         <TouchableOpacity style={s.overlayDismiss} activeOpacity={1} onPress={() => setBudgetHistModal(false)}>
            <TouchableOpacity activeOpacity={1} style={s.modalCard}>
               <Text style={s.modalTitle}>Bütçe Geçmişi</Text>
               <ScrollView style={{ maxHeight: 300 }} showsVerticalScrollIndicator={false}>
               {(() => {
                  if (!selectedBudget) return null;
                  const related = transactions.filter(t => {
                     try {
                     const d = new Date(t.transactionDate);
                     return d >= new Date(selectedBudget.startDate)
                        && d <= new Date(selectedBudget.endDate)
                        && t.transactionType === 'Expense';
                     } catch { return false; }
                  });
                  if (related.length === 0) return <Text style={s.empty}>Bu dönemde harcama yok</Text>;
                  return related.map(t => (
                     <View key={t.transactionId} style={s.txRow}>
                     <View style={[s.txIcon, { backgroundColor:'#FEE2E2' }]}>
                        <Ionicons name="arrow-up" size={14} color={COLORS.expense} />
                     </View>
                     <View style={s.txMid}>
                        <Text style={s.txTitle}>{t.transactionTitle}</Text>
                        <Text style={s.txCat}>{t.transactionDate?.slice(0,10)}</Text>
                     </View>
                     <Text style={[s.txAmt, { color: COLORS.expense }]}>
                        -{parseFloat(t.transactionAmount).toLocaleString('tr-TR', { minimumFractionDigits:2 })} ₺
                     </Text>
                     </View>
                  ));
               })()}
               </ScrollView>
               <TouchableOpacity style={s.closeBtn} onPress={() => setBudgetHistModal(false)}>
               <Text style={s.closeBtnTxt}>Kapat</Text>
               </TouchableOpacity>
            </TouchableOpacity>
         </TouchableOpacity>
         </Modal>

      </ScrollView>
   );
}

const s = StyleSheet.create({
   root:    { flex: 1, backgroundColor: COLORS.background },
   center:  { flex: 1, justifyContent: 'center', alignItems: 'center' },
   header:  { paddingTop: 60, paddingBottom: 24, paddingHorizontal: SPACING.lg },
   headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: SPACING.md },
   logoutBtn:     { padding: 4, marginTop: 4 },
   greeting:      { color: 'rgba(255,255,255,0.85)', fontSize: 15, marginBottom: 8 },
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
   toggleBtn:  { padding: 8, backgroundColor: '#EEF2FF', borderRadius: RADIUS.md },
   chartSub:   { fontSize: 11, color: COLORS.textMuted },
   chart:      { borderRadius: RADIUS.md, marginTop: SPACING.sm },
   empty:   { color: COLORS.textMuted, fontSize: 13, textAlign: 'center', paddingVertical: SPACING.sm },
   cardScroll: { marginHorizontal: -SPACING.sm },
   accCard: { backgroundColor: COLORS.background, borderRadius: RADIUS.lg, padding: SPACING.md,
               marginHorizontal: SPACING.sm, width: 160, alignItems: 'center' },
   accIconWrap: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#EEF2FF',
                  justifyContent: 'center', alignItems: 'center', marginBottom: SPACING.sm },
   accName:    { fontSize: 13, color: COLORS.textSecondary, textAlign: 'center', marginBottom: 4 },
   accBalance: { fontSize: 16, fontWeight: 'bold', color: COLORS.textPrimary, textAlign: 'center' },
   accHint:    { fontSize: 10, color: COLORS.textMuted, marginTop: 4 },
   budgetCard: { backgroundColor: COLORS.background, borderRadius: RADIUS.md, padding: SPACING.sm, marginBottom: SPACING.sm },
   budgetTop:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
   budgetTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
   budgetPeriod: { fontSize: 13, fontWeight: '600', color: COLORS.textPrimary },
   renewBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#EEF2FF',
                  borderRadius: RADIUS.round, paddingHorizontal: 6, paddingVertical: 2, gap: 3 },
   renewTxt:   { fontSize: 10, color: COLORS.primary },
   budgetPct:  { fontSize: 13, fontWeight: 'bold', color: COLORS.primary },
   barBg:      { height: 8, backgroundColor: COLORS.border, borderRadius: 4, marginBottom: 6 },
   barFill:    { height: 8, borderRadius: 4 },
   budgetBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
   budgetSpent:  { fontSize: 11, color: COLORS.textSecondary },
   daysLeft:     { fontSize: 11, color: COLORS.textMuted },
   budgetHint:   { fontSize: 10, color: COLORS.textMuted, marginTop: 4 },
   dateLabel: { fontSize: 12, fontWeight: '600', color: COLORS.textMuted, marginTop: SPACING.sm, marginBottom: 4 },
   txRow:   { flexDirection: 'row', alignItems: 'center', paddingVertical: 8,
               borderBottomWidth: 1, borderBottomColor: COLORS.border },
   txIcon:  { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center', marginRight: 10 },
   txMid:   { flex: 1 },
   txTitle: { fontSize: 14, fontWeight: '500', color: COLORS.textPrimary },
   txCat:   { fontSize: 12, color: COLORS.textMuted },
   txAmt:   { fontSize: 14, fontWeight: '600' },
   overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
   overlayDismiss: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', paddingHorizontal: SPACING.md },
   modalCard:  { backgroundColor: COLORS.white, borderRadius: RADIUS.xl, padding: SPACING.lg, paddingBottom: 32 },
   modalTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.textPrimary, marginBottom: SPACING.md },
   minput: { backgroundColor: COLORS.inputBg, borderRadius: RADIUS.md, paddingHorizontal: SPACING.md,
               paddingVertical: 13, fontSize: 15, color: COLORS.textPrimary, marginBottom: SPACING.sm },
   typeRow: { flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.sm },
   typeBtn: { flex: 1, paddingVertical: 10, borderRadius: RADIUS.md, alignItems: 'center',
               backgroundColor: COLORS.inputBg, borderWidth: 1, borderColor: COLORS.border },
   typeTxt: { fontWeight: '600', color: COLORS.textSecondary, fontSize: 12 },
   chipLabel: { fontSize: 13, color: COLORS.textSecondary, marginBottom: 6 },
   chip:      { paddingHorizontal: 12, paddingVertical: 6, borderRadius: RADIUS.round,
                  backgroundColor: COLORS.inputBg, borderWidth: 1, borderColor: COLORS.border, marginRight: 6 },
   chipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
   chipTxt:    { fontSize: 12, color: COLORS.textSecondary },
   chipTxtActive: { color: '#fff', fontWeight: '600' },
   endDateRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: SPACING.sm,
                  backgroundColor: COLORS.inputBg, borderRadius: RADIUS.md, padding: SPACING.sm },
   endDateTxt: { fontSize: 13, color: COLORS.textSecondary },
   infoRow:   { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8,
                  borderBottomWidth: 1, borderBottomColor: COLORS.border },
   infoLabel: { fontSize: 14, color: COLORS.textMuted },
   infoVal:   { fontSize: 14, fontWeight: '600', color: COLORS.textPrimary },
   modalBtns:   { flexDirection: 'row', gap: SPACING.sm, marginTop: SPACING.md },
   modalCancel: { flex: 1, paddingVertical: 13, borderRadius: RADIUS.md, borderWidth: 1,
                  borderColor: COLORS.border, alignItems: 'center' },
   modalCancelTxt: { color: COLORS.textSecondary, fontWeight: '600' },
   modalSave:   { flex: 1, paddingVertical: 13, borderRadius: RADIUS.md,
                  backgroundColor: COLORS.primary, alignItems: 'center' },
   editBtn:   { flex: 1, paddingVertical: 13, borderRadius: RADIUS.md, backgroundColor: COLORS.primary,
                  alignItems: 'center', flexDirection: 'row', justifyContent: 'center' },
   deleteBtn: { flex: 1, paddingVertical: 13, borderRadius: RADIUS.md, backgroundColor: COLORS.expense,
                  alignItems: 'center', flexDirection: 'row', justifyContent: 'center' },
   modalSaveTxt: { color: '#fff', fontWeight: '600' },
   closeBtn:    { marginTop: SPACING.sm, paddingVertical: 13, borderRadius: RADIUS.md,
                  borderWidth: 1, borderColor: COLORS.primary, alignItems: 'center' },
   closeBtnTxt: { color: COLORS.primary, fontWeight: '600', fontSize: 15 },
});