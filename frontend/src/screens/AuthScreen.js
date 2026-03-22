import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, KeyboardAvoidingView, Platform, Alert, ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { loginUser, registerUser } from '../services/index';
import { COLORS, SPACING, RADIUS } from '../constants/theme';

export default function AuthScreen() {
  const { login } = useAuth();
  const [tab, setTab]           = useState('login');
  const [loading, setLoading]   = useState(false);
  const [loginEmail, setLoginEmail]       = useState('');
  const [loginPass,  setLoginPass]        = useState('');
  const [showLoginPass, setShowLoginPass] = useState(false);
  const [regName,  setRegName]      = useState('');
  const [regEmail, setRegEmail]     = useState('');
  const [regPass,  setRegPass]      = useState('');
  const [showRegPass, setShowRegPass] = useState(false);

  async function handleLogin() {
    if (!loginEmail.trim() || !loginPass.trim()) { Alert.alert('Hata', 'Email ve şifre boş olamaz'); return; }
    setLoading(true);
    try {
      const data = await loginUser(loginEmail.trim(), loginPass.trim());
      if (data.token) {
        await login(data.token, { userId: data.userId, username: data.username, email: data.email });
      } else {
        Alert.alert('Hata', data.message || 'Giriş başarısız');
      }
    } catch (e) {
      Alert.alert('Giriş Hatası', e.response?.data?.message || 'Sunucuya bağlanılamadı');
    } finally { setLoading(false); }
  }

  async function handleRegister() {
    if (!regName.trim() || !regEmail.trim() || !regPass.trim()) { Alert.alert('Hata', 'Tüm alanları doldurun'); return; }
    setLoading(true);
    try {
      const data = await registerUser(regName.trim(), regEmail.trim(), regPass.trim());
      if (data.message === 'Kayıt başarılı') {
        Alert.alert('Başarılı', 'Kayıt başarılı! Giriş yapabilirsiniz.', [
          { text: 'Tamam', onPress: () => setTab('login') }
        ]);
        setRegName(''); setRegEmail(''); setRegPass('');
      } else {
        Alert.alert('Hata', data.message || 'Kayıt başarısız');
      }
    } catch (e) {
      Alert.alert('Kayıt Hatası', e.response?.data?.message || 'Sunucuya bağlanılamadı');
    } finally { setLoading(false); }
  }

  return (
    <KeyboardAvoidingView style={s.root} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <LinearGradient colors={[COLORS.primary, COLORS.primaryDark]} style={s.topBand} />
      <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">
        <View style={s.card}>
          <View style={s.logoRow}>
            <Ionicons name="wallet" size={32} color={COLORS.primary} />
            <Text style={s.appName}>Finance Tracker</Text>
          </View>
          <Text style={s.title}>Hoş Geldiniz</Text>
          <Text style={s.subtitle}>Devam etmek için giriş yapın veya kayıt olun</Text>
          <View style={s.tabRow}>
            {['login','register'].map(t => (
              <TouchableOpacity key={t} style={[s.tabBtn, tab === t && s.tabBtnActive]} onPress={() => setTab(t)}>
                <Text style={[s.tabTxt, tab === t && s.tabTxtActive]}>
                  {t === 'login' ? 'Giriş Yap' : 'Kayıt Ol'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          {tab === 'login' ? (
            <>
              <Field label="E-posta" value={loginEmail} onChange={setLoginEmail}
                placeholder="ornek@email.com" keyboard="email-address" autoCapitalize="none" />
              <Field label="Şifre" value={loginPass} onChange={setLoginPass}
                placeholder="••••••••" secure={!showLoginPass}
                right={<TouchableOpacity onPress={() => setShowLoginPass(p => !p)}>
                  <Ionicons name={showLoginPass ? 'eye-off-outline' : 'eye-outline'} size={20} color={COLORS.textSecondary} />
                </TouchableOpacity>} />
              <TouchableOpacity style={[s.btn, loading && s.btnDisabled]} onPress={handleLogin} disabled={loading}>
                {loading ? <ActivityIndicator color="#fff" /> : <Text style={s.btnTxt}>Giriş Yap</Text>}
              </TouchableOpacity>
            </>
          ) : (
            <>
              <Field label="Ad Soyad" value={regName} onChange={setRegName} placeholder="Adınız Soyadınız" />
              <Field label="E-posta" value={regEmail} onChange={setRegEmail}
                placeholder="ornek@email.com" keyboard="email-address" autoCapitalize="none" />
              <Field label="Şifre" value={regPass} onChange={setRegPass}
                placeholder="••••••••" secure={!showRegPass}
                right={<TouchableOpacity onPress={() => setShowRegPass(p => !p)}>
                  <Ionicons name={showRegPass ? 'eye-off-outline' : 'eye-outline'} size={20} color={COLORS.textSecondary} />
                </TouchableOpacity>} />
              <TouchableOpacity style={[s.btn, loading && s.btnDisabled]} onPress={handleRegister} disabled={loading}>
                {loading ? <ActivityIndicator color="#fff" /> : <Text style={s.btnTxt}>Kayıt Ol</Text>}
              </TouchableOpacity>
            </>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Field({ label, value, onChange, placeholder, secure, keyboard, autoCapitalize, right }) {
  return (
    <View style={s.fieldWrap}>
      <Text style={s.fieldLabel}>{label}</Text>
      <View style={s.inputWrap}>
        <TextInput style={[s.input, right && { paddingRight: 44 }]}
          value={value} onChangeText={onChange} placeholder={placeholder}
          placeholderTextColor={COLORS.textMuted} secureTextEntry={secure}
          keyboardType={keyboard || 'default'} autoCapitalize={autoCapitalize || 'sentences'}
          autoCorrect={false} />
        {right && <View style={s.inputRight}>{right}</View>}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  root:      { flex: 1, backgroundColor: COLORS.background },
  topBand:   { height: 6 },
  scroll:    { flexGrow: 1, justifyContent: 'center', padding: SPACING.md },
  card:      { backgroundColor: COLORS.white, borderRadius: RADIUS.xl, padding: SPACING.lg,
               shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
               shadowOpacity: 0.08, shadowRadius: 12, elevation: 4 },
  logoRow:   { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: SPACING.sm },
  appName:   { fontSize: 20, fontWeight: '700', color: COLORS.primary },
  title:     { fontSize: 24, fontWeight: 'bold', color: COLORS.textPrimary, marginBottom: 4 },
  subtitle:  { fontSize: 13, color: COLORS.textSecondary, marginBottom: SPACING.lg },
  tabRow:    { flexDirection: 'row', backgroundColor: COLORS.inputBg, borderRadius: RADIUS.md,
               padding: 4, marginBottom: SPACING.lg },
  tabBtn:    { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: RADIUS.md - 2 },
  tabBtnActive: { backgroundColor: COLORS.white, shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
  tabTxt:    { fontSize: 14, color: COLORS.textSecondary },
  tabTxtActive: { fontWeight: '600', color: COLORS.textPrimary },
  fieldWrap: { marginBottom: SPACING.md },
  fieldLabel:{ fontSize: 14, fontWeight: '500', color: COLORS.textPrimary, marginBottom: 6 },
  inputWrap: { position: 'relative' },
  input:     { backgroundColor: COLORS.inputBg, borderRadius: RADIUS.md,
               paddingHorizontal: SPACING.md, paddingVertical: 13,
               fontSize: 15, color: COLORS.textPrimary },
  inputRight:{ position: 'absolute', right: 12, top: 0, bottom: 0, justifyContent: 'center' },
  btn:       { backgroundColor: COLORS.textPrimary, borderRadius: RADIUS.md,
               paddingVertical: 14, alignItems: 'center', marginTop: SPACING.sm },
  btnDisabled: { opacity: 0.6 },
  btnTxt:    { color: '#fff', fontSize: 16, fontWeight: '600' },
});
