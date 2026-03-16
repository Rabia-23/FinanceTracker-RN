# Hafta 1 - İlerleme Raporu

**Tarih:** 2026-03-16
**Proje:** Kişisel Finans Takip Sistemi - React Native
**GitHub:** https://github.com/Rabia-23/FinanceApp-RN

---

## Bu Hafta Yapılanlar

- Expo projesi sıfırdan oluşturuldu (expo@55, react-native@0.83)
- Proje klasör yapısı oluşturuldu: src/screens, src/navigation, src/context, src/services, src/constants
- AuthContext (JWT + AsyncStorage) yazıldı
- apiClient (axios + JWT interceptor) yazıldı
- Tüm API endpoint sabitleri tanımlandı (api.js)
- COLORS, SPACING, RADIUS tema sabitleri tanımlandı (theme.js)
- AuthScreen tamamlandı: Giriş Yap / Kayıt Ol sekme yapısı
- Giriş formu: e-posta, şifre (göster/gizle ikonu)
- Kayıt formu: ad soyad, e-posta, şifre
- Başarılı giriş sonrası JWT token AsyncStorage'a kaydediliyor
- AppNavigator: isLoggedIn durumuna göre Auth ya da Ana Sayfa yönlendirmesi

---

## Video

> https://drive.google.com/file/d/1jF6_f3R3DOVVwwfXEkosY3orU0h0b3t7/view?usp=sharing

---

## Notlar

Backend (ASP.NET Core) port numarası değişirse src/constants/api.js dosyasındaki BASE_URL güncellenmeli.
